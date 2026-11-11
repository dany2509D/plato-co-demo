import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '../src/core/store.js';
import { setAvailable } from '../src/core/menu.js';
import { createBot } from '../src/bot/engine.js';
import { askAI, applyActions, buildContext, replyWithFallback, ALLOWED_ACTIONS } from '../src/bot/ai-adapter.js';

const memStorage = () => ({ read: () => null, write() {} });
const AHORA = new Date('2026-11-11T15:00:00Z');
let store, bot, suc;
const prod = (n) => store.get().productos.find((p) => p.nombre === n);
const conv = (id = 'c1') => store.get().conversaciones.find((c) => c.id === id);
const payload = () => ({ demo: 'restaurante', sessionId: 's1', messages: [{ role: 'user', content: 'hola' }], context: {} });
const okFetch = (body, ok = true, status = 200) => async () => ({ ok, status, json: async () => body });

beforeEach(() => {
  store = createStore(memStorage());
  for (const p of store.get().productos) for (const s of store.get().sucursales) setAvailable(store, p.id, s.id, true);
  suc = store.get().sucursales[0].id;
  bot = createBot(store, { ahora: () => AHORA });
  store.update((s) => { s.conversaciones.push({ id: 'c1', idioma: 'es', mensajes: [], requiereHumano: false, paso: null, slots: {} }); });
});

describe('askAI', () => {
  it('devuelve null si fetch rechaza', async () => {
    expect(await askAI(payload(), { fetchImpl: async () => { throw new Error('red'); } })).toBeNull();
  });
  it('devuelve null si tarda más del límite', async () => {
    const lento = (_u, { signal }) => new Promise((_, rej) => signal.addEventListener('abort', () => rej(new Error('abort'))));
    expect(await askAI(payload(), { fetchImpl: lento, timeoutMs: 20 })).toBeNull();
  });
  it('devuelve null con HTTP 500', async () => {
    expect(await askAI(payload(), { fetchImpl: okFetch({ reply: 'x' }, false, 500) })).toBeNull();
  });
  it('devuelve null si el cuerpo no trae reply', async () => {
    expect(await askAI(payload(), { fetchImpl: okFetch({ actions: [] }) })).toBeNull();
    expect(await askAI(payload(), { fetchImpl: okFetch(null) })).toBeNull();
  });
  it('devuelve la respuesta válida normalizada', async () => {
    const r = await askAI(payload(), { fetchImpl: okFetch({ reply: 'Hola', actions: [{ type: 'x', payload: {} }, 5] }) });
    expect(r).toEqual({ reply: 'Hola', actions: [{ type: 'x', payload: {} }], handoff: false });
  });
});

describe('applyActions', () => {
  const pedido = (lineas, extra = {}) => ({ type: 'proponer_pedido', payload: { sucursalId: suc, lineas, ...extra } });
  it('lista de acciones permitidas', () => {
    expect(ALLOWED_ACTIONS).toEqual(['proponer_pedido', 'proponer_reserva', 'pasar_a_persona']);
  });
  it('ignora una acción desconocida', () => {
    const r = applyActions(store, 'c1', [{ type: 'borrar_todo', payload: {} }]);
    expect(r.aplicadas).toEqual([]);
    expect(r.descartadas[0].type).toBe('borrar_todo');
  });
  it('descarta proponer_pedido con producto agotado', () => {
    const p = prod('Limonada');
    setAvailable(store, p.id, suc, false);
    const r = applyActions(store, 'c1', [pedido([{ productoId: p.id, cantidad: 1 }])]);
    expect(r.aplicadas).toEqual([]);
    expect(conv().propuesta).toBeUndefined();
  });
  it('descarta producto inexistente y cantidades 0, 21 o no enteras', () => {
    const id = prod('Limonada').id;
    for (const l of [{ productoId: 'nada', cantidad: 1 }, { productoId: id, cantidad: 0 }, { productoId: id, cantidad: 21 }, { productoId: id, cantidad: 1.5 }]) {
      expect(applyActions(store, 'c1', [pedido([l])]).aplicadas).toEqual([]);
    }
    expect(applyActions(store, 'c1', [{ type: 'proponer_pedido', payload: { sucursalId: 'zzz', lineas: [{ productoId: id, cantidad: 1 }] } }]).aplicadas).toEqual([]);
  });
  it('proponer_pedido válido guarda propuesta y deja al guion en confirmar, sin crear pedido', () => {
    const antes = store.get().pedidos.length;
    const id = prod('Limonada').id;
    const r = applyActions(store, 'c1', [pedido([{ productoId: id, cantidad: 2, modificadores: ['sin hielo'] }])]);
    expect(r.aplicadas).toEqual(['proponer_pedido']);
    expect(store.get().pedidos.length).toBe(antes);
    expect(conv().propuesta.type).toBe('proponer_pedido');
    expect(conv().paso).toBe('confirmar');
    expect(conv().slots.lineas[0]).toMatchObject({ productoId: id, cantidad: 2 });
  });
  it('descarta modificador que el producto no ofrece', () => {
    const id = prod('Limonada').id;
    expect(applyActions(store, 'c1', [pedido([{ productoId: id, cantidad: 1, modificadores: ['con diamantes'] }])]).aplicadas).toEqual([]);
  });
  it('descarta proponer_reserva con 9 personas y marca handoff', () => {
    const r = applyActions(store, 'c1', [{ type: 'proponer_reserva', payload: { sucursalId: suc, fecha: '2026-11-12', hora: '19:00', personas: 9, ocasion: 'ninguna' } }]);
    expect(r.aplicadas).toEqual([]);
    expect(conv().propuesta).toBeUndefined();
    expect(conv().requiereHumano).toBe(true);
  });
  it('proponer_reserva válida guarda propuesta sin crear reserva', () => {
    const antes = store.get().reservas.length;
    const r = applyActions(store, 'c1', [{ type: 'proponer_reserva', payload: { sucursalId: suc, fecha: '2026-11-12', hora: '19:00', personas: 4, ocasion: 'cumpleaños' } }]);
    expect(r.aplicadas).toEqual(['proponer_reserva']);
    expect(store.get().reservas.length).toBe(antes);
    expect(conv().propuesta.type).toBe('proponer_reserva');
  });
  it('pasar_a_persona marca requiereHumano', () => {
    expect(applyActions(store, 'c1', [{ type: 'pasar_a_persona', payload: {} }]).aplicadas).toEqual(['pasar_a_persona']);
    expect(conv().requiereHumano).toBe(true);
  });
});

describe('buildContext', () => {
  it('incluye menú con precios y alérgenos declarados, sucursales y disponibilidad', () => {
    const c = buildContext(store.get());
    const h = c.menu.find((p) => p.nombre === 'Alitas con salsa');
    expect(h).toMatchObject({ precio: 7.5, alergenosDeclarados: false });
    expect(c.menu[0]).toHaveProperty('modificadores');
    expect(c.sucursales[0]).toHaveProperty('horario');
    expect(c.sucursales[0]).toHaveProperty('zonas');
    expect(c.disponibilidad[suc].length).toBe(c.menu.length);
  });
});

describe('replyWithFallback', () => {
  const caido = async () => { throw new Error('red'); };
  it('con IA caída responde por el guion', async () => {
    const msgs = await replyWithFallback(bot, store, 'c1', 'hola', { iaReal: true, fetchImpl: caido });
    expect(msgs[0].de).toBe('bot');
    expect(msgs[0].texto.length).toBeGreaterThan(0);
  });
  it('con iaReal apagado no llama a fetch', async () => {
    let llamado = false;
    await replyWithFallback(bot, store, 'c1', 'hola', { iaReal: false, fetchImpl: async () => { llamado = true; } });
    expect(llamado).toBe(false);
  });
  it('con IA válida registra mensajes y aplica acciones', async () => {
    const id = prod('Limonada').id;
    const body = { reply: 'Le propongo una limonada.', actions: [{ type: 'proponer_pedido', payload: { sucursalId: suc, lineas: [{ productoId: id, cantidad: 1 }] } }], handoff: false };
    const msgs = await replyWithFallback(bot, store, 'c1', 'una limonada', { iaReal: true, fetchImpl: okFetch(body) });
    expect(msgs[0].texto).toBe('Le propongo una limonada.');
    expect(conv().mensajes.map((m) => m.de)).toEqual(['cliente', 'bot']);
    expect(conv().propuesta.type).toBe('proponer_pedido');
  });
  it('si hay flujo del guion en curso, el guion responde', async () => {
    const id = prod('Limonada').id;
    applyActions(store, 'c1', [{ type: 'proponer_pedido', payload: { sucursalId: suc, lineas: [{ productoId: id, cantidad: 1 }] } }]);
    let llamado = false;
    const msgs = await replyWithFallback(bot, store, 'c1', 'sí', { iaReal: true, fetchImpl: async () => { llamado = true; } });
    expect(llamado).toBe(false);
    expect(msgs[0].de).toBe('bot');
    expect(conv().paso).toBe('tipo');
  });
  it('confirmar una reserva propuesta la crea; negar la descarta', async () => {
    const prop = { type: 'proponer_reserva', payload: { sucursalId: suc, fecha: '2026-11-12', hora: '19:00', personas: 2, ocasion: 'ninguna' } };
    applyActions(store, 'c1', [prop]);
    const antes = store.get().reservas.length;
    const msgs = await replyWithFallback(bot, store, 'c1', 'sí', { iaReal: true, fetchImpl: caido, ahora: () => AHORA });
    expect(store.get().reservas.length).toBe(antes + 1);
    expect(conv().propuesta).toBeUndefined();
    expect(msgs[0].actions?.[0].type).toBe('reserva:creada');
    applyActions(store, 'c1', [prop]);
    await replyWithFallback(bot, store, 'c1', 'no', { iaReal: true, fetchImpl: caido });
    expect(conv().propuesta).toBeUndefined();
    expect(store.get().reservas.length).toBe(antes + 1);
  });
});
