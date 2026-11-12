import { describe, it, expect, vi } from 'vitest';
import { createStore } from '../src/core/store.js';
import { getAppBot } from '../src/bot/instance.js';
import { advanceStatus } from '../src/core/orders.js';
import { isAvailable, setAvailable } from '../src/core/menu.js';
import {
  STEPS, FRASE_PEDIDO, FRASE_AGOTADO, FRASE_RESERVA, createTour, createContext, falta,
  pedidoDelTour, elegirAgotado, restaurarAgotado, reiniciarParaTour, marcarAgotado, DIRECCION, siguienteAccionPedido,
} from '../src/core/tour.js';

const mem = () => { let v = null; return { read: () => v, write: (o) => { v = JSON.parse(JSON.stringify(o)); } }; };
function mundo() {
  const store = createStore(mem());
  const bot = getAppBot(store);
  store.update((s) => { s.conversaciones.push({ id: 'c-web', idioma: 'es', mensajes: [], requiereHumano: false, paso: null, slots: {} }); });
  return { store, bot };
}

describe('definición de pasos', () => {
  it('hay 6 pasos con título, nota breve y ruta', () => {
    expect(STEPS).toHaveLength(6);
    for (const p of STEPS) {
      expect(p.titulo.length).toBeGreaterThan(3);
      expect(p.nota.length).toBeGreaterThan(20);
      expect(p.nota.length).toBeLessThan(260);
      expect(p.ruta).toMatch(/^#\//);
    }
    expect(STEPS.at(-1).nota).toMatch(/Cero pedidos copiados a mano/);
  });
});

describe('navegación', () => {
  it('respeta los límites', () => {
    const t = createTour();
    expect(t.index).toBe(0);
    expect(t.prev()).toBe(false);
    expect(t.index).toBe(0);
    for (let i = 0; i < 5; i++) expect(t.next()).toBe(true);
    expect(t.index).toBe(5);
    expect(t.esUltimo).toBe(true);
    expect(t.next()).toBe(false);
    expect(t.index).toBe(5);
    expect(t.goTo(99)).toBe(5);
    expect(t.goTo(-3)).toBe(0);
  });
  it('avisa a los oyentes solo cuando algo cambia', () => {
    const t = createTour();
    const fn = vi.fn();
    t.onChange(fn);
    t.prev();
    t.next();
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('salir es idempotente y bloquea la navegación', () => {
    const t = createTour();
    expect(t.exit()).toBe(true);
    expect(t.exit()).toBe(false);
    expect(t.next()).toBe(false);
  });
  it('marca pasos hechos para no repetirlos', () => {
    const t = createTour();
    expect(t.hecho('pedido')).toBe(false);
    t.marcar('pedido');
    expect(t.hecho('pedido')).toBe(true);
  });
});

describe('reinicio al empezar', () => {
  it('reiniciarParaTour deja datos de ejemplo, sin pedidos del chat y limpia el contexto', () => {
    const { store, bot } = mundo();
    bot.reply('c-web', FRASE_PEDIDO);
    store.update((s) => { s.ui.sucursalAdmin = 'suc-3'; });
    const ctx = createContext();
    ctx.orderId = 'ped-999';
    reiniciarParaTour(store, ctx);
    expect(store.get().conversaciones).toHaveLength(0);
    expect(store.get().ui.sucursalAdmin).toBe('suc-1');
    expect(ctx.orderId).toBeNull();
  });
});

describe('guardas de idempotencia', () => {
  it('no vuelve a crear el pedido si ya existe', () => {
    const { store, bot } = mundo();
    const ctx = createContext();
    expect(falta('pedido', store.get(), ctx)).toBe(true);
    for (const t of [FRASE_PEDIDO, 'Sí, confirmar', 'Calle 50, Obarrio', 'Yappy']) bot.reply('c-web', t);
    const ped = pedidoDelTour(store.get(), ctx);
    expect(ped?.canal).toBe('whatsapp');
    expect(ctx.orderId).toBe(ped.id);
    expect(ped.sucursalId).toBe('suc-1');
    expect(falta('pedido', store.get(), ctx)).toBe(false);
  });
  it('avanzar solo falta mientras el pedido no esté entregado', () => {
    const { store, bot } = mundo();
    const ctx = createContext();
    for (const t of [FRASE_PEDIDO, 'Sí, confirmar', 'Calle 50, Obarrio', 'Yappy']) bot.reply('c-web', t);
    pedidoDelTour(store.get(), ctx);
    expect(falta('avanzar', store.get(), ctx)).toBe(true);
    for (let i = 0; i < 5; i++) advanceStatus(store, ctx.orderId);
    expect(store.get().pedidos.find((p) => p.id === ctx.orderId).estado).toBe('Entregado');
    expect(falta('avanzar', store.get(), ctx)).toBe(false);
    advanceStatus(store, ctx.orderId); // ir y volver no duplica ni rompe
    expect(store.get().pedidos.filter((p) => p.conversacionId === 'c-web')).toHaveLength(1);
  });
  it('sin pedido en el estado, el contexto con id viejo se considera vacío', () => {
    const { store } = mundo();
    const ctx = createContext();
    ctx.orderId = 'ped-404';
    expect(falta('pedido', store.get(), ctx)).toBe(true);
    expect(pedidoDelTour(store.get(), ctx)).toBeNull();
  });
});

describe('plato agotado', () => {
  it('elige la hamburguesa clásica disponible en la sucursal del pedido', () => {
    const { store } = mundo();
    const p = elegirAgotado(store.get(), 'suc-1');
    expect(p.nombre).toBe('Hamburguesa clásica');
  });
  it('marcar guarda el estado previo y restaurar lo devuelve; salir dos veces no rompe', () => {
    const { store } = mundo();
    const ctx = createContext();
    const p = elegirAgotado(store.get(), 'suc-1');
    expect(falta('marcarAgotado', store.get(), ctx)).toBe(true);
    marcarAgotado(store, ctx, p.id, 'suc-1');
    expect(isAvailable(store.get(), p.id, 'suc-1')).toBe(false);
    expect(falta('marcarAgotado', store.get(), ctx)).toBe(false);
    restaurarAgotado(store, ctx);
    expect(isAvailable(store.get(), p.id, 'suc-1')).toBe(true);
    expect(ctx.agotadoProductId).toBeNull();
    restaurarAgotado(store, ctx);
    expect(isAvailable(store.get(), p.id, 'suc-1')).toBe(true);
  });
  it('no vuelve a habilitar un plato que ya estaba agotado antes del tour', () => {
    const { store } = mundo();
    const ctx = createContext();
    const p = store.get().productos[0];
    setAvailable(store, p.id, 'suc-1', false);
    marcarAgotado(store, ctx, p.id, 'suc-1');
    restaurarAgotado(store, ctx);
    expect(isAvailable(store.get(), p.id, 'suc-1')).toBe(false);
  });
  it('pedir el plato agotado ofrece alternativas (flujo real del bot)', () => {
    const { store, bot } = mundo();
    const ctx = createContext();
    const p = elegirAgotado(store.get(), 'suc-1');
    marcarAgotado(store, ctx, p.id, 'suc-1');
    bot.reply('c-web', FRASE_AGOTADO);
    const ult = store.get().conversaciones[0].mensajes.filter((m) => m.de === 'bot').at(-1).texto;
    expect(ult).toMatch(/agotad/i);
    expect(ult).toMatch(/Hamburguesa doble/);
  });
});

describe('reserva', () => {
  it('falta hasta que el chat crea la reserva y luego no se repite', () => {
    const { store, bot } = mundo();
    const ctx = createContext();
    expect(falta('reserva', store.get(), ctx)).toBe(true);
    bot.reply('c-web', FRASE_RESERVA);
    expect(falta('reserva', store.get(), ctx)).toBe(false);
    expect(ctx.reservaId).toMatch(/^res-/);
    expect(store.get().reservas.find((r) => r.id === ctx.reservaId).personas).toBe(4);
  });
});

describe('guarda del paso 1 (I12): el pedido del recorrido de verdad existe', () => {
  // Misma regla que el presentador: pide la siguiente acción y la ejecuta por el chat real.
  const FRASES = { frase: FRASE_PEDIDO, cancelar: 'cancelar', confirmar: 'Sí, confirmar', direccion: DIRECCION, yappy: 'Yappy' };
  function conducir(store, bot, ctx) {
    const hechas = [];
    for (let i = 0; i < 8; i++) {
      const a = siguienteAccionPedido(store.get(), ctx);
      if (a === 'listo' || a === 'detener') { hechas.push(a); break; }
      hechas.push(a);
      bot.reply('c-web', FRASES[a]);
    }
    return hechas;
  }
  it('conversación limpia: frase, confirmar, dirección y Yappy', () => {
    const { store, bot } = mundo();
    const ctx = createContext();
    expect(conducir(store, bot, ctx)).toEqual(['frase', 'confirmar', 'yappy', 'listo']);
    expect(falta('pedido', store.get(), ctx)).toBe(false);
  });
  it('si el presentador escribió "hola" antes, igual se envía la frase del pedido', () => {
    const { store, bot } = mundo();
    const ctx = createContext();
    bot.reply('c-web', 'hola');
    const acciones = conducir(store, bot, ctx);
    expect(acciones[0]).toBe('frase');
    expect(acciones.at(-1)).toBe('listo');
    expect(falta('pedido', store.get(), ctx)).toBe(false);
    expect(pedidoDelTour(store.get(), ctx).lineas).toHaveLength(2);
  });
  it('si dejó otro pedido a medias, primero cancela y luego envía la frase', () => {
    const { store, bot } = mundo();
    const ctx = createContext();
    bot.reply('c-web', 'Quiero una limonada para Obarrio'); // queda en confirmar
    const acciones = conducir(store, bot, ctx);
    expect(acciones.slice(0, 2)).toEqual(['cancelar', 'frase']);
    expect(acciones.at(-1)).toBe('listo');
    expect(pedidoDelTour(store.get(), ctx).lineas.map((l) => l.cantidad)).toEqual([2, 1]);
  });
  it('si dejó una reserva a medias, también cancela primero', () => {
    const { store, bot } = mundo();
    const ctx = createContext();
    bot.reply('c-web', 'reserva para 2');
    expect(store.get().conversaciones[0].paso).toBeTruthy();
    const acciones = conducir(store, bot, ctx);
    expect(acciones[0]).toBe('cancelar');
    expect(falta('pedido', store.get(), ctx)).toBe(false);
  });
  it('si el flujo termina sin pedido (p. ej. todo agotado) se detiene y el paso no se da por hecho', () => {
    const { store, bot } = mundo();
    const ctx = createContext();
    for (const p of store.get().productos) for (const s of store.get().sucursales) setAvailable(store, p.id, s.id, false);
    const acciones = conducir(store, bot, ctx);
    expect(acciones.at(-1)).toBe('detener');
    expect(falta('pedido', store.get(), ctx)).toBe(true);
  });
  it('con el pedido ya hecho no hace nada (idempotente)', () => {
    const { store, bot } = mundo();
    const ctx = createContext();
    conducir(store, bot, ctx);
    expect(siguienteAccionPedido(store.get(), ctx)).toBe('listo');
  });
});
