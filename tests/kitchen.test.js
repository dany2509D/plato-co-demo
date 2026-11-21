import { describe, it, expect } from 'vitest';
import { urgency, elapsedMinutes, formatElapsed, activeOrders, deliveredOrders, groupByEstado, nextLabel, UMBRAL_AMARILLO_MIN, UMBRAL_ROJO_MIN } from '../src/core/kitchen.js';

const T0 = Date.parse('2026-11-11T12:00:00Z');
const hace = (min, seg = 0) => new Date(T0 - (min * 60 + seg) * 1000).toISOString();
const ped = (id, estado, creadoEn, extra = {}) => ({ id, sucursalId: 'suc-1', estado, tipo: 'entrega', creadoEn, ...extra });

describe('urgency', () => {
  it('usa los umbrales 10 y 20', () => {
    expect([UMBRAL_AMARILLO_MIN, UMBRAL_ROJO_MIN]).toEqual([10, 20]);
  });
  it('9:59 es verde, 10:00 amarillo, 20:00 amarillo, 20:01 rojo', () => {
    expect(urgency(9 + 59 / 60)).toBe('verde');
    expect(urgency(10)).toBe('amarillo');
    expect(urgency(20)).toBe('amarillo');
    expect(urgency(20 + 1 / 60)).toBe('rojo');
  });
  it('tiempo negativo no rompe', () => { expect(urgency(-3)).toBe('verde'); });
});

describe('elapsed', () => {
  it('calcula minutos y formatea en minutos enteros', () => {
    expect(elapsedMinutes(ped('a', 'Recibido', hace(9, 59)), T0)).toBeCloseTo(9 + 59 / 60, 5);
    expect(formatElapsed(9 + 59 / 60)).toBe('9 min');
    expect(formatElapsed(75.5)).toBe('1 h 15 min');
    expect(formatElapsed(-1)).toBe('0 min');
  });
});

describe('listas de cocina', () => {
  const state = { pedidos: [
    ped('p1', 'Recibido', hace(5)),
    ped('p2', 'Recibido', hace(15)),
    ped('p3', 'Entregado', hace(30)),
    ped('p4', 'En cocina', hace(8), { sucursalId: 'suc-2' }),
    ped('p5', 'Listo', hace(12)),
    ped('p6', 'Entregado', hace(2)),
  ] };
  it('filtra por sucursal, excluye Entregado y ordena el más antiguo primero', () => {
    expect(activeOrders(state, 'suc-1').map((p) => p.id)).toEqual(['p2', 'p5', 'p1']);
  });
  it('entregados: de la sucursal, más recientes primero y con tope', () => {
    expect(deliveredOrders(state, 'suc-1', 1).map((p) => p.id)).toEqual(['p6']);
  });
  it('agrupa por estado en orden de flujo', () => {
    const g = groupByEstado(activeOrders(state, 'suc-1'));
    expect(Object.keys(g)).toEqual(['Recibido', 'En cocina', 'Listo', 'En camino']);
    expect(g.Recibido.map((p) => p.id)).toEqual(['p2', 'p1']);
    expect(g['En cocina']).toEqual([]);
  });
});

describe('nextLabel', () => {
  it('entrega pasa por En camino', () => {
    expect(nextLabel(ped('a', 'Listo', hace(1)))).toBe('En camino');
  });
  it('retiro salta En camino', () => {
    expect(nextLabel(ped('a', 'Listo', hace(1), { tipo: 'retiro' }))).toBe('Entregado');
  });
  it('Entregado no tiene siguiente', () => {
    expect(nextLabel(ped('a', 'Entregado', hace(1)))).toBeNull();
  });
});
