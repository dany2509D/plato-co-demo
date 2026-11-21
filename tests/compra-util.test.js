import { describe, it, expect } from 'vitest';
import { cuentaTexto, totalesPedido, lineasPedido, pasosSeguimiento, claveFotoSucursal, nombreCorto } from '../src/views/compra-util.js';

const productos = [
  { id: 'a', nombre: 'A', precio: 4.5 },
  { id: 'b', nombre: 'B', precio: 10 },
];
const state = { productos, sucursales: [{ id: 'suc-1', nombre: 'Plato & Co. Centro' }, { id: 'suc-2', nombre: 'Plato & Co. Costa' }, { id: 'suc-3', nombre: 'Plato & Co. Norte' }] };
const lineas = [{ productoId: 'a', modificadores: [], cantidad: 2 }, { productoId: 'b', modificadores: ['sin cebolla'], cantidad: 1 }];

describe('cuentaTexto', () => {
  it('singular y plural', () => {
    expect(cuentaTexto(1)).toBe('1 producto');
    expect(cuentaTexto(3)).toBe('3 productos');
    expect(cuentaTexto(6, 'plato', 'platos')).toBe('6 platos');
  });
});

describe('totalesPedido', () => {
  it('usa los totales guardados aunque el precio actual cambie', () => {
    const p = { lineas, subtotal: 19, itbms: 1.33, total: 20.33 };
    const caro = { productos: productos.map((x) => ({ ...x, precio: x.precio * 2 })) };
    expect(totalesPedido(caro, p)).toEqual({ subtotal: 19, itbms: 1.33, total: 20.33 });
  });
  it('sin totales guardados cotiza con los precios actuales', () => {
    expect(totalesPedido(state, { lineas })).toEqual({ subtotal: 19, itbms: 1.33, total: 20.33 });
  });
});

describe('lineasPedido', () => {
  it('muestra importes cuando la suma coincide con el subtotal guardado', () => {
    const f = lineasPedido(state, { lineas, subtotal: 19 });
    expect(f.map((x) => x.importe)).toEqual([9, 10]);
    expect(f[1].modificadores).toEqual(['sin cebolla']);
  });
  it('oculta los importes si un precio cambió desde el pedido', () => {
    const f = lineasPedido(state, { lineas, subtotal: 17 });
    expect(f.map((x) => x.importe)).toEqual([null, null]);
  });
  it('omite productos que ya no existen (y entonces no afirma importes)', () => {
    const f = lineasPedido(state, { lineas: [...lineas, { productoId: 'zz', cantidad: 1 }], subtotal: 19 });
    expect(f).toHaveLength(2);
    expect(f.every((x) => x.importe === null)).toBe(true);
  });
});

describe('pasosSeguimiento', () => {
  it('entrega: 5 pasos con icono y fase', () => {
    const p = { tipo: 'entrega', estado: 'Listo', historial: [{ estado: 'Recibido', en: 't0' }, { estado: 'En cocina', en: 't1' }, { estado: 'Listo', en: 't2' }] };
    const pasos = pasosSeguimiento(p);
    expect(pasos.map((x) => x.icono)).toEqual(['pedido', 'cocina', 'listo', 'en-camino', 'entregado']);
    expect(pasos.map((x) => x.fase)).toEqual(['hecho', 'hecho', 'actual', 'pendiente', 'pendiente']);
    expect(pasos[2].en).toBe('t2');
    expect(pasos[3].en).toBeNull();
  });
  it('retiro omite «En camino»', () => {
    const pasos = pasosSeguimiento({ tipo: 'retiro', estado: 'Entregado' });
    expect(pasos.map((x) => x.estado)).toEqual(['Recibido', 'En cocina', 'Listo', 'Entregado']);
    expect(pasos.at(-1).fase).toBe('actual');
  });
});

describe('claveFotoSucursal y nombreCorto', () => {
  it('mapea la sucursal a su foto por posición', () => {
    expect(claveFotoSucursal(state, 'suc-2')).toBe('sucursal_2');
    expect(claveFotoSucursal(state, 'nada')).toBe('sucursal_1');
  });
  it('quita la marca del nombre', () => {
    expect(nombreCorto({ nombre: 'Plato & Co. Norte' })).toBe('Norte');
  });
});
