import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from '../src/core/store.js';
import { setAvailable } from '../src/core/menu.js';
import { createBot } from '../src/bot/engine.js';
import { replyWithFallback, buildClientHints, askAI } from '../src/bot/ai-adapter.js';

const memStorage = () => ({ read: () => null, write() {} });
const AHORA = new Date('2026-11-11T15:00:00Z');
let store, bot, suc;
const conv = () => store.get().conversaciones.find((c) => c.id === 'c1');
const prod = (n) => store.get().productos.find((p) => p.nombre === n);
const mkFetch = (body) => vi.fn(async () => ({ ok: true, status: 200, json: async () => body }));

beforeEach(() => {
  store = createStore(memStorage());
  for (const p of store.get().productos) for (const s of store.get().sucursales) setAvailable(store, p.id, s.id, true);
  suc = store.get().sucursales[0].id;
  bot = createBot(store, { ahora: () => AHORA });
  store.update((s) => { s.conversaciones.push({ id: 'c1', idioma: 'es', mensajes: [], requiereHumano: false, paso: null, slots: {} }); });
});

describe('alérgenos en modo IA (I5)', () => {
  const afirma = { reply: 'Sí, ese plato es libre de gluten y apto para celíacos.', actions: [], handoff: false };
  const preguntas = [
    '¿La hamburguesa clásica tiene gluten?', 'soy celíaco, ¿qué puedo comer?', 'tengo alergia al maní',
    'does the brownie contain nuts?', '¿algo sin lactosa?', 'tienen opciones veganas aptas?', 'alérgico a los mariscos',
  ];
  for (const q of preguntas) {
    it(`no consulta al modelo: "${q}"`, async () => {
      const f = mkFetch(afirma);
      const msgs = await replyWithFallback(bot, store, 'c1', q, { iaReal: true, fetchImpl: f });
      expect(f).not.toHaveBeenCalled();
      expect(msgs[0].texto).not.toMatch(/libre de gluten|apto para celíacos/);
      expect(conv().mensajes.filter((m) => m.de === 'cliente')).toHaveLength(1);
    });
  }
  it('si el modelo afirma "libre de"/"sin gluten" en una pregunta que no era de alérgenos, se usa el guion', async () => {
    const f = mkFetch({ reply: 'Le recomiendo la ensalada, es sin gluten.', actions: [], handoff: false });
    const msgs = await replyWithFallback(bot, store, 'c1', '¿qué me recomienda?', { iaReal: true, fetchImpl: f });
    expect(f).toHaveBeenCalledTimes(1);
    expect(msgs[0].texto).not.toMatch(/sin gluten/);
    expect(conv().mensajes.filter((m) => m.de === 'cliente')).toHaveLength(1);
  });
  for (const claim of ['No contiene lácteos.', 'This is gluten free.', 'Es apto para vegetarianos y apto para todos.', 'Es libre de nueces.']) {
    it(`reemplaza la respuesta con afirmación: "${claim}"`, async () => {
      const f = mkFetch({ reply: claim, actions: [], handoff: false });
      const msgs = await replyWithFallback(bot, store, 'c1', 'buenas tardes', { iaReal: true, fetchImpl: f });
      expect(msgs[0].texto).not.toBe(claim);
    });
  }
  it('una respuesta normal del modelo sí se muestra', async () => {
    const f = mkFetch({ reply: 'Con gusto, ¿qué desea pedir?', actions: [], handoff: false });
    const msgs = await replyWithFallback(bot, store, 'c1', 'buenas tardes', { iaReal: true, fetchImpl: f });
    expect(msgs[0].texto).toBe('Con gusto, ¿qué desea pedir?');
  });
});

describe('historial y petición (I6c, I7b)', () => {
  it('cada mensaje del historial se recorta a 1000 caracteres', async () => {
    store.update((s) => { s.conversaciones[0].mensajes.push({ de: 'cliente', texto: 'a'.repeat(3000) }, { de: 'bot', texto: 'b'.repeat(2500) }); });
    const f = mkFetch({ reply: 'ok', actions: [], handoff: false });
    await replyWithFallback(bot, store, 'c1', 'hola', { iaReal: true, fetchImpl: f });
    const sent = JSON.parse(f.mock.calls[0][1].body);
    expect(sent.messages.length).toBeGreaterThan(1);
    for (const m of sent.messages) expect(m.content.length).toBeLessThanOrEqual(1000);
  });
  it('el texto actual muy largo también se recorta', async () => {
    const f = mkFetch({ reply: 'ok', actions: [], handoff: false });
    await replyWithFallback(bot, store, 'c1', 'x'.repeat(5000), { iaReal: true, fetchImpl: f });
    const sent = JSON.parse(f.mock.calls[0][1].body);
    expect(sent.messages.at(-1).content.length).toBeLessThanOrEqual(1000);
  });
  it('envía solo sucursalId y banderas de disponibilidad, no menú ni precios', async () => {
    const limonada = prod('Limonada');
    setAvailable(store, limonada.id, suc, false);
    const f = mkFetch({ reply: 'ok', actions: [], handoff: false });
    await replyWithFallback(bot, store, 'c1', 'hola', { iaReal: true, fetchImpl: f });
    const sent = JSON.parse(f.mock.calls[0][1].body);
    expect(sent.context).toBeUndefined();
    expect(sent.sucursalId).toBe(store.get().ui.sucursalCliente);
    expect(sent.disponibilidad[limonada.id]).toBe(false);
    expect(Object.values(sent.disponibilidad).every((v) => typeof v === 'boolean')).toBe(true);
    expect(JSON.stringify(sent)).not.toContain('"precio"');
  });
  it('buildClientHints usa la sucursal elegida', () => {
    store.update((s) => { s.ui.sucursalCliente = s.sucursales[1].id; });
    expect(buildClientHints(store.get()).sucursalId).toBe(store.get().sucursales[1].id);
  });
  it('askAI ya no reenvía campos arbitrarios más allá del payload recibido', async () => {
    const f = mkFetch({ reply: 'x' });
    await askAI({ a: 1 }, { fetchImpl: f });
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ a: 1 });
  });
});

describe('resumen de propuesta (M6)', () => {
  const prop = (extra = {}) => ({ reply: 'x', actions: [{ type: 'proponer_pedido', payload: { sucursalId: suc, lineas: [{ productoId: prod('Limonada').id, cantidad: 2, modificadores: [] }] } }], handoff: false, ...extra });
  it('importes con US$ y botones de respuesta rápida (es)', async () => {
    const msgs = await replyWithFallback(bot, store, 'c1', 'dos limonadas', { iaReal: true, fetchImpl: mkFetch(prop()) });
    expect(msgs[0].texto).toMatch(/Subtotal US\$ 5\.50 · ITBMS US\$ 0\.39 · Total US\$ 5\.89/);
    expect(msgs[0].texto).not.toMatch(/(^|[^S])\$\d/);
    expect(msgs[0].botones).toEqual(['Sí, confirmar', 'Cancelar']);
  });
  it('en inglés los botones están en inglés', async () => {
    store.update((s) => { s.conversaciones[0].idioma = 'en'; });
    const msgs = await replyWithFallback(bot, store, 'c1', 'two lemonades', { iaReal: true, fetchImpl: mkFetch(prop()) });
    expect(msgs[0].botones).toEqual(['Yes, confirm', 'Cancel']);
  });
  it('la reserva también ofrece botones', async () => {
    const body = { reply: 'x', actions: [{ type: 'proponer_reserva', payload: { sucursalId: suc, fecha: '2026-11-12', hora: '19:00', personas: 4, ocasion: 'cumpleaños' } }], handoff: false };
    const msgs = await replyWithFallback(bot, store, 'c1', 'mesa para 4', { iaReal: true, fetchImpl: mkFetch(body) });
    expect(msgs[0].botones).toEqual(['Sí, confirmar', 'Cancelar']);
  });
});
