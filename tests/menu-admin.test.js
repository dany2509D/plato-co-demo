import { describe, it, expect } from 'vitest';
import { adminMenuGroups, countAgotados, categoriasDe, parsePrecio } from '../src/core/menu-admin.js';

const P = (id, nombre, categoria, d) => ({ id, nombre, categoria, precio: 5, disponiblePorSucursal: d });
const state = {
  productos: [
    P('1', 'Hamburguesa clásica', 'Hamburguesas', { s1: true, s2: false }),
    P('2', 'Hamburguesa doble', 'Hamburguesas', { s1: false, s2: true }),
    P('3', 'Limonada', 'Bebidas', { s1: true, s2: true }),
    P('4', 'Té helado', 'Bebidas', { s1: false, s2: false }),
  ],
};

describe('adminMenuGroups', () => {
  it('agrupa por categoría en orden de aparición e incluye agotados con su bandera', () => {
    const g = adminMenuGroups(state, 's1');
    expect(g.map((x) => x.categoria)).toEqual(['Hamburguesas', 'Bebidas']);
    expect(g[0].productos.map((p) => [p.id, p.agotado])).toEqual([['1', false], ['2', true]]);
  });
  it('filtra por texto sin importar tildes ni mayúsculas', () => {
    const g = adminMenuGroups(state, 's1', { texto: 'CLASICA' });
    expect(g).toHaveLength(1);
    expect(g[0].productos.map((p) => p.id)).toEqual(['1']);
  });
  it('filtra por categoría y omite grupos vacíos', () => {
    expect(adminMenuGroups(state, 's1', { categoria: 'Bebidas' }).map((x) => x.categoria)).toEqual(['Bebidas']);
    expect(adminMenuGroups(state, 's1', { texto: 'zzz' })).toEqual([]);
  });
  it('solo agotados', () => {
    const g = adminMenuGroups(state, 's1', { soloAgotados: true });
    expect(g.flatMap((x) => x.productos.map((p) => p.id))).toEqual(['2', '4']);
  });
});

describe('countAgotados / categoriasDe', () => {
  it('cuenta por sucursal', () => {
    expect(countAgotados(state, 's1')).toBe(2);
    expect(countAgotados(state, 's2')).toBe(2);
    expect(countAgotados(state, 'nope')).toBe(4);
  });
  it('lista categorías únicas', () => { expect(categoriasDe(state)).toEqual(['Hamburguesas', 'Bebidas']); });
});

describe('parsePrecio', () => {
  it('acepta números, coma decimal y redondea a centavos', () => {
    expect(parsePrecio('9.5')).toBe(9.5);
    expect(parsePrecio('9,95')).toBe(9.95);
    expect(parsePrecio(' 12 ')).toBe(12);
    expect(parsePrecio('1.006')).toBe(1.01);
  });
  it('rechaza vacío, cero, negativo y no numérico', () => {
    for (const v of ['', '0', '-3', 'abc', '1e999', '0.001', null, undefined]) expect(parsePrecio(v)).toBe(null);
  });
});
