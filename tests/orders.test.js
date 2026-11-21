import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '../src/core/store.js';
import { setAvailable } from '../src/core/menu.js';
import {
  ESTADOS, assignBranch, priceOrder, createOrder, advanceStatus, payOrder, issueInvoice, prepMinutes,
} from '../src/core/orders.js';

const memStorage = () => ({ read: () => null, write() {} });
let store;
beforeEach(() => { store = createStore(memStorage()); });
const prod = (n) => store.get().productos.find((p) => p.nombre === n);
const suc = () => store.get().sucursales[0];
const linea = (n, cantidad = 1) => ({ productoId: prod(n).id, modificadores: [], cantidad });
const draftEntrega = (lineas) => ({ canal: 'web', lineas, tipo: 'entrega', direccion: `Calle 50, ${suc().zonasEntrega[0]}` });

describe('precio', () => {
  it('2 hamburguesas + limonada incluye ITBMS 7%', () => {
    const r = priceOrder(store.get(), [linea('Hamburguesa clásica', 2), linea('Limonada')]);
    expect(r).toEqual({ subtotal: 20.65, itbms: 1.45, total: 22.1 });
  });
  it('evita deriva de coma flotante', () => {
    const s = { productos: [{ id: 'a', precio: 0.1 }, { id: 'b', precio: 0.2 }] };
    const r = priceOrder(s, [{ productoId: 'a', cantidad: 1 }, { productoId: 'b', cantidad: 1 }]);
    expect(r.subtotal).toBe(0.3);
  });
});

describe('assignBranch', () => {
  it('asigna por zona contenida en la dirección (sin tildes/mayúsculas)', () => {
    const s = store.get().sucursales[1];
    const r = assignBranch(store.get(), 'calle 5, PUNTA PACIFICA, torre 2');
    expect(r).toEqual({ sucursalId: s.id, etaMin: s.etaBaseMin });
  });
  it('sin zona -> null', () => {
    expect(assignBranch(store.get(), 'Calle Inexistente 1')).toBeNull();
  });
  it('varias coinciden -> menor etaBaseMin', () => {
    const st = store.get();
    st.sucursales[2].zonasEntrega.push('Obarrio');
    st.sucursales[2].etaBaseMin = 10;
    expect(assignBranch(st, 'Obarrio').sucursalId).toBe(st.sucursales[2].id);
  });
});

describe('createOrder', () => {
  it('crea pedido de entrega con sucursal por zona', () => {
    const r = createOrder(store, draftEntrega([linea('Limonada')]));
    expect(r.ok).toBe(true);
    expect(r.pedido.sucursalId).toBe(suc().id);
    expect(r.pedido.estado).toBe('Recibido');
    expect(r.pedido.historial).toHaveLength(1);
    expect(store.get().pedidos[0].id).toBe(r.pedido.id);
    expect(r.pedido.total).toBe(2.94);
  });
  it('vacío', () => {
    expect(createOrder(store, draftEntrega([])).razon).toBe('vacio');
  });
  it('sin_zona en entrega', () => {
    const r = createOrder(store, { canal: 'web', tipo: 'entrega', direccion: 'Marte', lineas: [linea('Limonada')] });
    expect(r).toMatchObject({ ok: false, razon: 'sin_zona' });
  });
  it('retiro usa sucursalId dado sin zona', () => {
    const r = createOrder(store, { canal: 'web', tipo: 'retiro', sucursalId: suc().id, lineas: [linea('Limonada')] });
    expect(r.ok).toBe(true);
    expect(r.pedido.sucursalId).toBe(suc().id);
  });
  it('rechaza agotado tras armar el carrito, con alternativas', () => {
    const lineas = [linea('Hamburguesa clásica')];
    setAvailable(store, prod('Hamburguesa clásica').id, suc().id, false);
    const r = createOrder(store, draftEntrega(lineas));
    expect(r.ok).toBe(false);
    expect(r.razon).toBe('agotado');
    expect(r.detalle.agotados[0].id).toBe(prod('Hamburguesa clásica').id);
    expect(r.detalle.agotados[0].alternativas.length).toBeGreaterThan(0);
  });
  it('valida cantidad y producto', () => {
    const base = { canal: 'web', tipo: 'retiro', sucursalId: suc().id };
    expect(createOrder(store, { ...base, lineas: [linea('Limonada', 0)] }).ok).toBe(false);
    expect(createOrder(store, { ...base, lineas: [linea('Limonada', 21)] }).ok).toBe(false);
    expect(createOrder(store, { ...base, lineas: [linea('Limonada', 1.5)] }).ok).toBe(false);
    expect(createOrder(store, { ...base, lineas: [{ productoId: 'nope', cantidad: 1 }] }).ok).toBe(false);
  });
});

describe('advanceStatus', () => {
  it('entrega recorre 5 estados, emite eventos, factura al final', () => {
    const { pedido } = createOrder(store, draftEntrega([linea('Limonada')]));
    const vistos = [];
    store.on('pedido:estado', (e) => vistos.push(e.estado));
    for (let i = 0; i < 6; i++) advanceStatus(store, pedido.id);
    const p = store.get().pedidos.find((x) => x.id === pedido.id);
    expect(p.estado).toBe('Entregado');
    expect(p.historial.map((h) => h.estado)).toEqual(ESTADOS);
    expect(vistos).toEqual(ESTADOS.slice(1));
    expect(p.facturaId).toBeTruthy();
    expect(p.factura.simulada).toBe(true);
    expect(p.factura.cufe).toMatch(/SIMULADO/);
  });
  it('retiro salta En camino', () => {
    const { pedido } = createOrder(store, { canal: 'web', tipo: 'retiro', sucursalId: suc().id, lineas: [linea('Limonada')] });
    for (let i = 0; i < 6; i++) advanceStatus(store, pedido.id);
    const p = store.get().pedidos.find((x) => x.id === pedido.id);
    expect(p.historial.map((h) => h.estado)).toEqual(['Recibido', 'En cocina', 'Listo', 'Entregado']);
  });
  it('emite conversacionId si existe', () => {
    const { pedido } = createOrder(store, { ...draftEntrega([linea('Limonada')]), conversacionId: 'c1' });
    let ev;
    store.on('pedido:estado', (e) => { ev = e; });
    advanceStatus(store, pedido.id);
    expect(ev).toEqual({ pedidoId: pedido.id, estado: 'En cocina', conversacionId: 'c1' });
  });
  it('issueInvoice es idempotente', () => {
    const { pedido } = createOrder(store, draftEntrega([linea('Limonada')]));
    expect(issueInvoice(store, pedido.id)).toEqual(issueInvoice(store, pedido.id));
  });
});

describe('payOrder', () => {
  it('registra pago por método', () => {
    const { pedido } = createOrder(store, draftEntrega([linea('Limonada')]));
    expect(payOrder(store, pedido.id, 'yappy').pago).toEqual({ metodo: 'yappy', estado: 'pagado' });
    expect(payOrder(store, pedido.id, 'efectivo').pago).toEqual({ metodo: 'efectivo', estado: 'contra entrega' });
  });
  it('método inválido lanza error', () => {
    const { pedido } = createOrder(store, draftEntrega([linea('Limonada')]));
    expect(() => payOrder(store, pedido.id, 'bitcoin')).toThrow();
  });
});

describe('prepMinutes', () => {
  it('null hasta Listo, luego minutos', () => {
    const p = { historial: [{ estado: 'Recibido', en: '2026-01-01T10:00:00Z' }] };
    expect(prepMinutes(p)).toBeNull();
    p.historial.push({ estado: 'Listo', en: '2026-01-01T10:20:00Z' });
    expect(prepMinutes(p)).toBe(20);
  });
});
