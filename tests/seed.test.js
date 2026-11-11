import { describe, it, expect } from 'vitest';
import { buildSeed } from '../src/data/seed.js';
import { brand } from '../src/config/brand.js';

const AHORA = new Date('2026-11-11T15:00:00Z');
const ORDEN = ['recibido', 'preparando', 'listo', 'en_camino', 'entregado'];

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
    for (const e of [...ORDEN, 'cancelado']) expect(estados.has(e)).toBe(true);
    const ids = new Set(s.productos.map((p) => p.id));
    for (const p of s.pedidos) {
      expect(p.historial.length).toBeGreaterThan(0);
      expect(p.historial.at(-1).estado).toBe(p.estado);
      expect(p.historial[0].estado).toBe('recibido');
      const tiempos = p.historial.map((h) => Date.parse(h.en));
      expect([...tiempos].sort((a, b) => a - b)).toEqual(tiempos);
      if (p.estado !== 'cancelado') {
        const flujo = p.tipo === 'entrega' ? ORDEN : ORDEN.filter((e) => e !== 'en_camino');
        expect(p.historial.map((h) => h.estado)).toEqual(flujo.slice(0, flujo.indexOf(p.estado) + 1));
      } else {
        expect(p.historial.map((h) => h.estado)).toEqual(['recibido', 'cancelado']);
      }
      if (p.tipo === 'entrega') expect(p.direccion).toBeTruthy();
      else expect(p.direccion).toBeUndefined();
      expect(p.lineas.length).toBeGreaterThan(0);
      for (const l of p.lineas) expect(ids.has(l.productoId)).toBe(true);
      expect(Date.parse(p.creadoEn)).toBeLessThanOrEqual(AHORA.getTime());
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
