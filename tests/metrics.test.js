import { describe, it, expect } from 'vitest';
import { buildSeed } from '../src/data/seed.js';
import { priceOrder } from '../src/core/orders.js';
import { metrics, compareBranches, barWidths, dailySummary, bestPerMetric } from '../src/core/metrics.js';

const state = () => buildSeed(new Date('2026-11-11T18:00:00Z'));
const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

describe('metrics', () => {
  it("'todas' suma 50 pedidos entre canales", () => {
    const m = metrics(state(), 'todas');
    expect(m.pedidosPorCanal.web + m.pedidosPorCanal.whatsapp).toBe(50);
  });
  it('por sucursal suma los pedidos de esa sucursal', () => {
    const s = state();
    for (const suc of s.sucursales) {
      const n = s.pedidos.filter((p) => p.sucursalId === suc.id).length;
      const m = metrics(s, suc.id);
      expect(m.pedidosPorCanal.web + m.pedidosPorCanal.whatsapp).toBe(n);
    }
  });
  it('ticket promedio = suma de priceOrder / pedidos (2 decimales)', () => {
    const s = state();
    const suma = s.pedidos.reduce((a, p) => a + priceOrder(s, p.lineas).total, 0);
    expect(metrics(s, 'todas').ticketPromedio).toBe(r2(suma / s.pedidos.length));
  });
  it('usa el total guardado del pedido (p.total) y cae a priceOrder si falta', () => {
    const s = state();
    s.pedidos.forEach((p) => { p.total = 10; });
    expect(metrics(s, 'todas').ticketPromedio).toBe(10);
    delete s.pedidos[0].total;
    const esperado = r2((priceOrder(s, s.pedidos[0].lineas).total + 49 * 10) / 50);
    expect(metrics(s, 'todas').ticketPromedio).toBe(esperado);
  });
  it('editar un precio NO cambia el ticket promedio de pedidos existentes (I9)', () => {
    const s = state();
    const antes = metrics(s, 'todas').ticketPromedio;
    for (const p of s.productos) p.precio = r2(p.precio * 3);
    expect(metrics(s, 'todas').ticketPromedio).toBe(antes);
  });
  it('sin pedidos devuelve ceros sin NaN', () => {
    const s = state(); s.pedidos = [];
    const m = metrics(s, 'todas');
    expect(m).toEqual({ pedidosPorCanal: { web: 0, whatsapp: 0 }, ticketPromedio: 0, tiempoPrepMin: 0, topPlatos: [] });
    expect(metrics(s, 'suc-1').ticketPromedio).toBe(0);
  });
  it('topPlatos ordenado desc y con máximo 5', () => {
    const t = metrics(state(), 'todas').topPlatos;
    expect(t.length).toBeGreaterThan(0);
    expect(t.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < t.length; i++) expect(t[i - 1].unidades).toBeGreaterThanOrEqual(t[i].unidades);
    expect(t[0]).toEqual({ nombre: expect.any(String), unidades: expect.any(Number) });
  });
  it('tiempo de preparación: promedio redondeado, ignora null', () => {
    const s = state();
    const base = s.pedidos[0];
    const mk = (min) => ({ ...base, sucursalId: 'suc-1', historial: [{ estado: 'Recibido', en: '2026-11-11T10:00:00Z' }, { estado: 'Listo', en: new Date(Date.parse('2026-11-11T10:00:00Z') + min * 60000).toISOString() }] });
    const sinListo = { ...base, sucursalId: 'suc-1', historial: [{ estado: 'Recibido', en: '2026-11-11T10:00:00Z' }] };
    s.pedidos = [mk(10), mk(15), sinListo];
    expect(metrics(s, 'suc-1').tiempoPrepMin).toBe(13); // 12.5 -> 13
    s.pedidos = [sinListo];
    expect(metrics(s, 'suc-1').tiempoPrepMin).toBe(0);
  });
});

describe('compareBranches', () => {
  it('devuelve 3 sucursales cuyos pedidos suman el total', () => {
    const c = compareBranches(state());
    expect(c).toHaveLength(3);
    const suma = c.reduce((a, x) => a + x.pedidosPorCanal.web + x.pedidosPorCanal.whatsapp, 0);
    expect(suma).toBe(50);
    expect(c.map((x) => x.sucursalId)).toEqual(['suc-1', 'suc-2', 'suc-3']);
  });
});

describe('helpers', () => {
  it('barWidths escala al máximo y no divide por cero', () => {
    expect(barWidths([4, 2, 1], 100)).toEqual([100, 50, 25]);
    expect(barWidths([0, 0], 100)).toEqual([0, 0]);
    expect(barWidths([], 100)).toEqual([]);
  });
  it('bestPerMetric marca la mejor sucursal (menor tiempo de prep, mayor el resto)', () => {
    const c = [
      { sucursalId: 'a', pedidosPorCanal: { web: 5, whatsapp: 5 }, ticketPromedio: 10, tiempoPrepMin: 12 },
      { sucursalId: 'b', pedidosPorCanal: { web: 3, whatsapp: 3 }, ticketPromedio: 20, tiempoPrepMin: 8 },
    ];
    expect(bestPerMetric(c)).toEqual({ pedidos: 'a', ticketPromedio: 'b', tiempoPrepMin: 'b' });
  });
  it('bestPerMetric ignora tiempo 0 (sin datos)', () => {
    const c = [
      { sucursalId: 'a', pedidosPorCanal: { web: 1, whatsapp: 0 }, ticketPromedio: 1, tiempoPrepMin: 0 },
      { sucursalId: 'b', pedidosPorCanal: { web: 1, whatsapp: 0 }, ticketPromedio: 1, tiempoPrepMin: 9 },
    ];
    expect(bestPerMetric(c).tiempoPrepMin).toBe('b');
  });
  it('dailySummary: texto en español con US$ y una sección por sucursal', () => {
    const s = state();
    const t = dailySummary(s, new Date('2026-11-11T18:00:00Z'));
    expect(t.para).toMatch(/@.*\.example$/);
    expect(t.asunto).toMatch(/Plato & Co\./);
    for (const suc of s.sucursales) expect(t.cuerpo).toContain(suc.nombre);
    expect(t.cuerpo).toMatch(/US\$ \d+\.\d{2}/);
    expect(t.cuerpo).toMatch(/usted/i);
  });
  it('dailySummary sin pedidos no falla', () => {
    const s = state(); s.pedidos = [];
    expect(dailySummary(s, new Date()).cuerpo).toMatch(/sin pedidos/i);
  });
});
