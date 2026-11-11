import { describe, it, expect } from 'vitest';
import { parseRoute } from '../src/ui/router.js';

describe('parseRoute', () => {
  it('reconoce #/menu', () => {
    expect(parseRoute('#/menu').name).toBe('menu');
  });
  it('lee el parámetro id de pedido', () => {
    const r = parseRoute('#/pedido/P-7');
    expect(r.name).toBe('pedido');
    expect(r.params).toEqual({ id: 'P-7' });
  });
  it('mapea #/admin/cocina a admin-cocina', () => {
    expect(parseRoute('#/admin/cocina').name).toBe('admin-cocina');
  });
  it('reconoce las demás rutas válidas', () => {
    for (const n of ['inicio', 'carrito', 'chat']) expect(parseRoute('#/' + n).name).toBe(n);
    for (const s of ['reservas', 'menu', 'indicadores'])
      expect(parseRoute('#/admin/' + s).name).toBe('admin-' + s);
  });
  it('vacío o desconocido cae en inicio', () => {
    expect(parseRoute('').name).toBe('inicio');
    expect(parseRoute('#/nada').name).toBe('inicio');
    expect(parseRoute('#/admin/xyz').name).toBe('inicio');
  });
});
