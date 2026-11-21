import { describe, it, expect } from 'vitest';
import { layoutMesas } from '../src/core/floor.js';

const mesas = [
  { id: 'C1', capacidad: 2 }, { id: 'C2', capacidad: 2 }, { id: 'C3', capacidad: 4 },
  { id: 'C4', capacidad: 4 }, { id: 'C5', capacidad: 6 }, { id: 'C6', capacidad: 8 },
];

describe('layoutMesas', () => {
  it('devuelve una posición por mesa, en orden, con 3 columnas por defecto', () => {
    const l = layoutMesas(mesas);
    expect(l.mesas.map((m) => m.id)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6']);
    expect(new Set(l.mesas.map((m) => m.x + m.w / 2)).size).toBe(3);
    expect(new Set(l.mesas.map((m) => m.y)).size).toBe(2);
  });
  it('ninguna mesa se sale del lienzo ni se superpone', () => {
    const l = layoutMesas(mesas);
    for (const m of l.mesas) {
      expect(m.x).toBeGreaterThanOrEqual(0);
      expect(m.y).toBeGreaterThanOrEqual(0);
      expect(m.x + m.w).toBeLessThanOrEqual(l.ancho);
      expect(m.y + m.h).toBeLessThanOrEqual(l.alto);
    }
    for (let i = 0; i < l.mesas.length; i++) for (let j = i + 1; j < l.mesas.length; j++) {
      const a = l.mesas[i], b = l.mesas[j];
      const separadas = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
      expect(separadas).toBe(true);
    }
  });
  it('mesas más grandes son más anchas y las de 2 son redondas', () => {
    const l = layoutMesas(mesas);
    const por = Object.fromEntries(l.mesas.map((m) => [m.id, m]));
    expect(por.C6.w).toBeGreaterThan(por.C1.w);
    expect(por.C1.forma).toBe('redonda');
    expect(por.C5.forma).toBe('rectangular');
  });
  it('lista vacía o nula no rompe', () => {
    expect(layoutMesas([]).mesas).toEqual([]);
    expect(layoutMesas(null).mesas).toEqual([]);
  });
  it('respeta el número de columnas', () => {
    const l = layoutMesas(mesas, { columnas: 2 });
    expect(new Set(l.mesas.map((m) => m.x + m.w / 2)).size).toBe(2);
    expect(new Set(l.mesas.map((m) => m.y)).size).toBe(3);
  });
});
