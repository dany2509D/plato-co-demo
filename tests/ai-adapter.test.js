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

describe('applyActions: casos extra de validación', () => {
  const reserva = (extra = {}) => ({ type: 'proponer_reserva', payload: { sucursalId: suc, fecha: '2026-11-12', hora: '19:00', personas: 2, ocasion: 'ninguna', ...extra } });
  it('rechaza personas 0 y 2.5', () => {
    expect(applyActions(store, 'c1', [reserva({ personas: 0 })]).aplicadas).toEqual([]);
    expect(applyActions(store, 'c1', [reserva({ personas: 2.5 })]).aplicadas).toEqual([]);
  });
  it('rechaza sucursalId desconocida en una reserva', () => {
    expect(applyActions(store, 'c1', [reserva({ sucursalId: 'zzz' })]).aplicadas).toEqual([]);
  });
  it('rechaza fechas que no existen en el calendario y horas fuera de rango', () => {
    for (const fecha of ['2026-13-45', '2026-02-30', '12/11/2026']) expect(applyActions(store, 'c1', [reserva({ fecha })]).aplicadas).toEqual([]);
    for (const hora of ['24:00', '19:60', 'tarde']) expect(applyActions(store, 'c1', [reserva({ hora })]).aplicadas).toEqual([]);
  });
  it('normaliza "9:00" a "09:00"', () => {
    expect(applyActions(store, 'c1', [reserva({ hora: '9:00' })]).aplicadas).toEqual(['proponer_reserva']);
    expect(conv().propuesta.payload.hora).toBe('09:00');
  });
  it('rechaza modificadores que no son una lista', () => {
    const id = prod('Limonada').id;
    const p = { type: 'proponer_pedido', payload: { sucursalId: suc, lineas: [{ productoId: id, cantidad: 1, modificadores: 'sin hielo' }] } };
    expect(applyActions(store, 'c1', [p]).aplicadas).toEqual([]);
  });
  it('ignora claves __proto__ del payload', () => {
    const id = prod('Limonada').id;
    const raw = JSON.parse(`{"type":"proponer_pedido","payload":{"__proto__":{"admin":true},"sucursalId":"${suc}","lineas":[{"productoId":"${id}","cantidad":1,"__proto__":{"x":1}}]}}`);
    expect(applyActions(store, 'c1', [raw]).aplicadas).toEqual(['proponer_pedido']);
    expect(conv().propuesta.payload.admin).toBeUndefined();
    expect({}.admin).toBeUndefined();
    expect(Object.keys(conv().propuesta.payload)).not.toContain('__proto__');
  });
  it('producto agotado solo en la otra sucursal: vale en una y se descarta en la otra', () => {
    const otra = store.get().sucursales[1].id;
    const id = prod('Limonada').id;
    setAvailable(store, id, otra, false);
    const mk = (s) => ({ type: 'proponer_pedido', payload: { sucursalId: s, lineas: [{ productoId: id, cantidad: 1 }] } });
    expect(applyActions(store, 'c1', [mk(suc)]).aplicadas).toEqual(['proponer_pedido']);
    expect(applyActions(store, 'c1', [mk(otra)]).descartadas[0].motivo).toBe('producto_agotado');
  });
  it('con pedido y reserva en el mismo turno solo queda la primera propuesta', () => {
    const id = prod('Limonada').id;
    const r = applyActions(store, 'c1', [
      { type: 'proponer_pedido', payload: { sucursalId: suc, lineas: [{ productoId: id, cantidad: 1 }] } },
      reserva(),
    ]);
    expect(r.aplicadas).toEqual(['proponer_pedido']);
    expect(r.descartadas[0].motivo).toBe('propuesta_duplicada');
    expect(conv().propuesta.type).toBe('proponer_pedido');
  });
});

describe('askAI: cuerpos no JSON', () => {
  it('devuelve null si la respuesta es HTML', async () => {
    const html = async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token <'); } });
    expect(await askAI(payload(), { fetchImpl: html })).toBeNull();
  });
});

describe('resumen determinista y propuestas', () => {
  const caido = async () => { throw new Error('red'); };
  const bodyPedido = (texto) => ({ reply: texto, actions: [{ type: 'proponer_pedido', payload: { sucursalId: suc, lineas: [{ productoId: prod('Limonada').id, cantidad: 2, modificadores: ['sin hielo'] }] } }], handoff: false });
  it('el resumen del pedido sale del store y reemplaza el texto libre del modelo', async () => {
    const msgs = await replyWithFallback(bot, store, 'c1', 'dos limonadas', { iaReal: true, fetchImpl: okFetch(bodyPedido('Son $1.00 en total')) });
    const t = msgs[0].texto;
    expect(t).not.toContain('$1.00 en total');
    expect(t).toContain('2');
    expect(t).toContain('Limonada');
    expect(t).toContain('sin hielo');
    expect(t).toContain('5.50'); // 2 x 2.75
    expect(t).toContain('ITBMS');
    expect(t).toContain('¿Confirma el pedido? (sí / cancelar)');
    expect(conv().mensajes.at(-1).texto).toBe(t);
  });
  it('resumen en inglés cuando la conversación está en inglés', async () => {
    store.update((s) => { s.conversaciones[0].idioma = 'en'; });
    const msgs = await replyWithFallback(bot, store, 'c1', 'two lemonades', { iaReal: true, fetchImpl: okFetch(bodyPedido('x')) });
    expect(msgs[0].texto).toContain('Confirm the order? (yes / cancel)');
  });
  it('el resumen de la reserva indica sucursal, fecha, hora, personas y ocasión', async () => {
    const body = { reply: 'Listo, ya quedó', actions: [{ type: 'proponer_reserva', payload: { sucursalId: suc, fecha: '2026-11-12', hora: '19:00', personas: 4, ocasion: 'cumpleaños' } }], handoff: false };
    const msgs = await replyWithFallback(bot, store, 'c1', 'mesa para 4', { iaReal: true, fetchImpl: okFetch(body) });
    const t = msgs[0].texto;
    for (const x of ['2026-11-12', '19:00', '4', 'cumpleaños', store.get().sucursales[0].nombre]) expect(t).toContain(x);
    expect(t).not.toContain('ya quedó');
    expect(t).toMatch(/sí \/ cancelar/);
  });
  it('una propuesta vieja se borra en un turno que no es confirmación', async () => {
    const prop = { type: 'proponer_reserva', payload: { sucursalId: suc, fecha: '2026-11-12', hora: '19:00', personas: 2, ocasion: 'ninguna' } };
    applyActions(store, 'c1', [prop]);
    await replyWithFallback(bot, store, 'c1', 'qué horario tienen', { iaReal: true, fetchImpl: okFetch({ reply: 'Abrimos a las 11', actions: [], handoff: false }) });
    expect(conv().propuesta).toBeUndefined();
  });
  it('si algo falla tras registrar, el mensaje del usuario queda una sola vez y no queda propuesta a medias', async () => {
    const orig = store.update;
    let armado = true;
    store.update = (fn) => {
      orig(fn);
      if (armado && conv().mensajes.some((m) => m.de === 'bot')) { armado = false; throw new Error('fallo forzado'); }
    };
    const msgs = await replyWithFallback(bot, store, 'c1', 'dos limonadas', { iaReal: true, fetchImpl: okFetch(bodyPedido('hola')) });
    store.update = orig;
    expect(msgs[0].de).toBe('bot');
    expect(conv().mensajes.filter((m) => m.de === 'cliente' && m.texto === 'dos limonadas').length).toBe(1);
    expect(conv().propuesta).toBeUndefined();
    expect(conv().requiereHumano).toBe(false);
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
    expect(msgs[0].texto).toContain('Resumen de su pedido'); // el resumen determinista sustituye el texto libre
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
