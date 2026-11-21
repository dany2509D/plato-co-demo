import { describe, it, expect } from 'vitest';
import { parseRoute } from '../src/ui/router.js';

describe('parseRoute: entradas malformadas (M2)', () => {
  it('porcentaje inválido no lanza: cae al texto crudo', () => {
    expect(() => parseRoute('#/pedido/%E0%A4%A')).not.toThrow();
    const r = parseRoute('#/pedido/%E0%A4%A');
    expect(r.name).toBe('pedido');
    expect(r.params.id).toBe('%E0%A4%A');
  });
  it('porcentaje inválido en otras rutas va a no-encontrado sin lanzar', () => {
    expect(parseRoute('#/%E0%A4%A').name).toBe('no-encontrado');
    expect(parseRoute('#/admin/%zz').name).toBe('no-encontrado');
  });
  it('lee ?s=<seedId> del enlace de pedido', () => {
    expect(parseRoute('#/pedido/ped-051?s=sabc')).toEqual({ name: 'pedido', params: { id: 'ped-051', seed: 'sabc' } });
    expect(parseRoute('#/pedido/ped-051').params).toEqual({ id: 'ped-051' });
    expect(parseRoute('#/pedido/ped-051?s=%E0%A4%A').params.id).toBe('ped-051');
  });
});

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
  it('vacío y «#/» siguen en inicio; lo desconocido va al 404', () => {
    expect(parseRoute('').name).toBe('inicio');
    expect(parseRoute('#/').name).toBe('inicio');
    expect(parseRoute('#/?s=x').name).toBe('inicio');
    expect(parseRoute('#/nada').name).toBe('no-encontrado');
    expect(parseRoute('#/admin/xyz').name).toBe('no-encontrado');
  });
  it('reconoce #/estilo (guía de estilo, no enlazada en la navegación)', () => {
    expect(parseRoute('#/estilo').name).toBe('estilo');
    expect(parseRoute('#/estilo/otra').name).toBe('no-encontrado');
  });
});
