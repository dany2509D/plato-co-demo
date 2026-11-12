import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { createStore } from '../src/core/store.js';
import { buildSeed } from '../src/data/seed.js';
import { pedidoPorId, enlacePedido } from '../src/core/pedido-ref.js';

const AHORA = new Date('2026-11-11T15:00:00Z');
function stor(initial) { let v = initial; return { read: () => v, write: (o) => { v = JSON.parse(JSON.stringify(o)); } }; }
const buena = () => { const s = buildSeed(AHORA); s.ultimaActividad = AHORA.toISOString(); s.rev = 0; return JSON.parse(JSON.stringify(s)); };

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(AHORA.getTime() + 30 * 60000)); });
afterEach(() => vi.useRealTimers());

describe('validación de forma del estado guardado (M3)', () => {
  const venenos = {
    'ui sin carrito': (s) => { delete s.ui.carrito; },
    'ui es un texto': (s) => { s.ui = 'hola'; },
    'ui null': (s) => { s.ui = null; },
    'carrito no es arreglo': (s) => { s.ui.carrito = { a: 1 }; },
    'carrito con basura': (s) => { s.ui.carrito = [null, 5, { productoId: 3 }, { productoId: s.productos[0].id, cantidad: 2, modificadores: [] }]; },
    'sucursal inexistente': (s) => { s.ui.sucursalCliente = 'suc-99'; s.ui.sucursalAdmin = 42; },
    'iaReal no booleano': (s) => { s.ui.iaReal = 'sí'; },
    'productos no es arreglo': (s) => { s.productos = {}; },
    'producto sin precio': (s) => { s.productos[0].precio = 'caro'; },
    'sucursales vacías': (s) => { s.sucursales = []; },
    'pedido sin lineas': (s) => { delete s.pedidos[0].lineas; },
    'pedido con estado raro': (s) => { s.pedidos[1].estado = 'Volando'; },
    'pedidos con null': (s) => { s.pedidos.push(null, 7, 'x'); },
    'reservas texto': (s) => { s.reservas = 'x'; },
    'conversaciones sin mensajes': (s) => { s.conversaciones = [{ id: 'c1' }, 4]; },
    'cadena enorme': (s) => { s.productos[0].nombre = 'x'.repeat(5_000_000); },
  };
  for (const [nombre, daño] of Object.entries(venenos)) {
    it(`no revienta con: ${nombre}`, () => {
      const g = buena();
      daño(g);
      const st = createStore(stor(g));
      const s = st.get();
      expect(Array.isArray(s.ui.carrito)).toBe(true);
      expect(typeof s.ui.iaReal).toBe('boolean');
      expect(s.sucursales.some((x) => x.id === s.ui.sucursalCliente)).toBe(true);
      expect(s.sucursales.some((x) => x.id === s.ui.sucursalAdmin)).toBe(true);
      for (const k of ['sucursales', 'productos', 'combos', 'pedidos', 'reservas', 'conversaciones']) expect(Array.isArray(s[k])).toBe(true);
      for (const p of s.pedidos) { expect(Array.isArray(p.lineas)).toBe(true); expect(Array.isArray(p.historial)).toBe(true); }
      for (const p of s.productos) { expect(Number.isFinite(p.precio)).toBe(true); expect(p.nombre.length).toBeLessThan(10_000); }
      for (const c of s.conversaciones) expect(Array.isArray(c.mensajes)).toBe(true);
      expect(() => st.update((d) => { d.ui.carrito.push({ productoId: d.productos[0].id, modificadores: [], cantidad: 1 }); })).not.toThrow();
    });
  }
  it('repara ui sin perder el resto (no re-siembra por algo reparable)', () => {
    const g = buena();
    g.ui = { sucursalCliente: 'suc-2' };
    g.pedidos[0].id = 'ped-marca';
    const s = createStore(stor(g)).get();
    expect(s.ui).toEqual({ sucursalCliente: 'suc-2', sucursalAdmin: 'suc-1', carrito: [], iaReal: false });
    expect(s.pedidos.some((p) => p.id === 'ped-marca')).toBe(true);
  });
  it('sin contaminación del prototipo con claves __proto__/constructor', () => {
    const crudo = JSON.stringify(buena()).replace('"ui":{', '"ui":{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted2":true}},');
    const g = JSON.parse(crudo);
    expect(Object.prototype.hasOwnProperty.call(g.ui, '__proto__')).toBe(true);
    const st = createStore(stor(g));
    st.update((d) => { d.ui.iaReal = true; });
    expect({}.polluted).toBeUndefined();
    expect({}.polluted2).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(st.get().ui, '__proto__')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(st.get().ui, 'constructor')).toBe(false);
  });
  it('un estado bueno se conserva tal cual', () => {
    const g = buena();
    g.ui.carrito = [{ productoId: g.productos[0].id, modificadores: ['agrandar'], cantidad: 2 }];
    expect(createStore(stor(g)).get().ui.carrito).toEqual(g.ui.carrito);
  });
});

describe('ids de pedido únicos entre reinicios (M4)', () => {
  it('cada siembra tiene seedId distinto y marca a sus pedidos', () => {
    vi.useFakeTimers();
    vi.setSystemTime(AHORA);
    const st = createStore(stor(null));
    const id1 = st.get().seedId;
    expect(st.get().pedidos.every((p) => p.seedId === id1)).toBe(true);
    st.reset();
    expect(st.get().seedId).not.toBe(id1); // mismo instante simulado: igual debe cambiar
    expect(st.get().pedidos.every((p) => p.seedId === st.get().seedId)).toBe(true);
  });
  it('los pedidos creados después se marcan con el seedId vigente', () => {
    const st = createStore(stor(null));
    st.update((s) => { s.pedidos.unshift({ ...s.pedidos[0], id: 'ped-051', seedId: undefined }); delete s.pedidos[0].seedId; });
    expect(st.get().pedidos[0].seedId).toBe(st.get().seedId);
  });
  it('pedidoPorId con seedId de otra siembra no resuelve; sin seed sí', () => {
    const st = createStore(stor(null));
    const s = st.get();
    const viejo = enlacePedido(s.pedidos[0]);
    expect(viejo).toBe(`#/pedido/${s.pedidos[0].id}?s=${s.seedId}`);
    expect(pedidoPorId(s, s.pedidos[0].id)?.id).toBe(s.pedidos[0].id);
    expect(pedidoPorId(s, s.pedidos[0].id, s.seedId)?.id).toBe(s.pedidos[0].id);
    expect(pedidoPorId(s, s.pedidos[0].id, 'otra')).toBeNull();
    expect(pedidoPorId(s, 'nada')).toBeNull();
  });
});
