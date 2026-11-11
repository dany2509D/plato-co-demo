import { describe, it, expect } from 'vitest';
import { buildSeed } from '../src/data/seed.js';
import { brand } from '../src/config/brand.js';

const AHORA = new Date('2026-11-11T15:00:00Z');
import { ESTADOS } from '../src/core/estados.js';

describe('buildSeed', () => {
  const s = buildSeed(AHORA);
  it('cantidades', () => {
    expect(s.productos).toHaveLength(40);
    expect(s.combos).toHaveLength(6);
    expect(s.sucursales).toHaveLength(3);
    expect(s.sucursales).toEqual(brand.sucursales);
    expect(s.pedidos).toHaveLength(50);
    expect(s.reservas).toHaveLength(15);
    expect(s.conversaciones).toEqual([]);
    expect(s.ui).toEqual({ sucursalAdmin: 'suc-1', sucursalCliente: 'suc-1', carrito: [], iaReal: false });
  });
  it('es determinista', () => {
    expect(buildSeed(new Date(AHORA))).toEqual(s);
  });
  it('menú requerido', () => {
    const n = s.productos.map((p) => p.nombre);
    expect(n).toContain('Hamburguesa clásica');
    expect(n).toContain('Limonada');
    expect(s.productos.some((p) => p.alergenosDeclarados === false)).toBe(true);
    expect(s.productos.some((p) => p.vegetariano)).toBe(true);
    const mods = s.productos.flatMap((p) => p.modificadores);
    expect(mods).toContain('sin cebolla');
    expect(mods).toContain('agrandar');
    expect(mods).toContain('término medio');
    for (const p of s.productos) {
      for (const suc of s.sucursales) expect(typeof p.disponiblePorSucursal[suc.id]).toBe('boolean');
    }
  });
  it('pedidos variados y coherentes', () => {
    expect(new Set(s.pedidos.map((p) => p.canal))).toEqual(new Set(['web', 'whatsapp']));
    expect(new Set(s.pedidos.map((p) => p.tipo))).toEqual(new Set(['entrega', 'retiro']));
    const estados = new Set(s.pedidos.map((p) => p.estado));
    for (const e of ESTADOS) expect(estados.has(e)).toBe(true);
    const ids = new Set(s.productos.map((p) => p.id));
    for (const p of s.pedidos) {
      expect(p.historial.length).toBeGreaterThan(0);
      expect(p.historial.at(-1).estado).toBe(p.estado);
      expect(p.historial[0].estado).toBe('Recibido');
      const tiempos = p.historial.map((h) => Date.parse(h.en));
      expect([...tiempos].sort((a, b) => a - b)).toEqual(tiempos);
      expect(ESTADOS).toContain(p.estado);
      const flujo = p.tipo === 'entrega' ? ESTADOS : ESTADOS.filter((e) => e !== 'En camino');
      expect(p.historial.map((h) => h.estado)).toEqual(flujo.slice(0, flujo.indexOf(p.estado) + 1));
      if (p.tipo === 'entrega') expect(p.direccion).toBeTruthy();
      else expect(p.direccion).toBeUndefined();
      expect(p.lineas.length).toBeGreaterThan(0);
      for (const l of p.lineas) expect(ids.has(l.productoId)).toBe(true);
      expect(Date.parse(p.creadoEn)).toBeLessThanOrEqual(AHORA.getTime());
    }
  });
  it('cada sucursal tiene al menos 3 pedidos activos recientes (1 a 40 min) y se reparten por colores', () => {
    const activos = s.pedidos.filter((p) => p.estado !== 'Entregado');
    const edades = activos.map((p) => (AHORA.getTime() - Date.parse(p.creadoEn)) / 60000);
    for (const e of edades) { expect(e).toBeGreaterThanOrEqual(1); expect(e).toBeLessThanOrEqual(40); }
    for (const suc of s.sucursales) expect(activos.filter((p) => p.sucursalId === suc.id).length).toBeGreaterThanOrEqual(3);
    expect(edades.filter((e) => e < 10).length).toBeGreaterThanOrEqual(6);
    expect(edades.filter((e) => e >= 10 && e <= 20).length).toBeGreaterThanOrEqual(5);
    expect(edades.filter((e) => e > 20).length).toBeGreaterThanOrEqual(4);
  });
  it('pedidos del día en Panamá aunque sea de madrugada', () => {
    const temprano = new Date('2026-11-11T06:30:00Z'); // 01:30 en Panamá
    const r = buildSeed(temprano);
    expect(r.pedidos).toHaveLength(50);
    for (const p of r.pedidos) {
      const t = Date.parse(p.creadoEn);
      expect(t).toBeLessThanOrEqual(temprano.getTime());
      expect(new Date(t - 5 * 3600000).toISOString().slice(0, 10)).toBe('2026-11-11');
      for (const h of p.historial) expect(Date.parse(h.en)).toBeLessThanOrEqual(temprano.getTime());
    }
  });
  it('reservas', () => {
    for (const r of s.reservas) {
      expect(r.sucursalId).toMatch(/^suc-/);
      expect(r.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.hora).toMatch(/^\d{2}:\d{2}$/);
    }
  });
});
