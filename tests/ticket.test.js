import { describe, it, expect } from 'vitest';
import { ticket, ticketDesdePedido, barrasDe } from '../src/ui/ticket.js';

const L = [{ cantidad: 2, nombre: 'Hamburguesa <img src=x onerror=alert(1)>', detalle: 'sin "cebolla" & más', precio: 17.9 }];
const T = { subtotal: 17.9, itbms: 1.25, total: 19.15 };

describe('ticket()', () => {
  it('escapa todo texto de usuario', () => {
    const h = ticket({ titulo: '<b>x</b>', codigo: 'A"B', lineas: L, totales: T, meta: [{ k: '<k>', v: '<v>' }], pie: '<i>', sello: '<s>' });
    expect(h).not.toMatch(/<img|<b>|<k>|<v>|<i>|<s>/);
    expect(h).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(h).toContain('aria-label="&lt;b&gt;x&lt;/b&gt; A&quot;B"');
  });
  it('formatea dinero como el resto de la app y usa los totales dados', () => {
    const h = ticket({ titulo: 'P', lineas: L, totales: T });
    expect(h).toContain('US$ 19.15');
    expect(h).toContain('US$ 1.25');
    expect(h).toContain('US$ 17.90');
  });
  it('accesible: grupo con etiqueta, tabla con encabezados, perforación decorativa', () => {
    const h = ticket({ titulo: 'Plato', codigo: 'PED-1', lineas: L, totales: T });
    expect(h).toContain('role="group"');
    expect(h).toContain('<th scope="col">Producto</th>');
    expect(h.match(/class="tk__borde[^"]*" aria-hidden="true"/g)).toHaveLength(2);
    expect(h).toContain('<dl class="tk__tot">');
  });
  it('variantes y sello', () => {
    expect(ticket({ titulo: 'x' })).toContain('tk--papel');
    expect(ticket({ titulo: 'x', variante: 'oscuro' })).toContain('tk--oscuro');
    expect(ticket({ titulo: 'x', variante: 'raro' })).toContain('tk--papel');
    expect(ticket({ titulo: 'x', sello: 'Hecho' })).toContain('class="tk__sello"');
    expect(ticket({ titulo: 'x' })).not.toContain('tk__sello');
  });
  it('sin precio de línea no muestra importe; sin totales no hay bloque', () => {
    const h = ticket({ titulo: 'x', lineas: [{ cantidad: 1, nombre: 'a', precio: null }] });
    expect(h).toContain('<td class="tk__imp"></td>');
    expect(h).not.toContain('tk__tot');
  });
  it('tira de barras determinista', () => {
    expect(barrasDe('PED-1')).toEqual(barrasDe('PED-1'));
    expect(barrasDe('PED-1')).not.toEqual(barrasDe('PED-2'));
    expect(barrasDe('x', 10)).toHaveLength(10);
  });
});

const state = {
  productos: [{ id: 'a', nombre: 'Arepa <x>', precio: 5, categoria: 'x' }],
  sucursales: [{ id: 's1', nombre: 'Plato & Co. Centro' }],
};
const base = { id: 'ped-9', sucursalId: 's1', tipo: 'entrega', estado: 'Recibido', creadoEn: '2026-11-11T15:00:00Z', lineas: [{ productoId: 'a', cantidad: 2, modificadores: ['sin sal'] }], pago: { metodo: 'yappy' } };

describe('ticketDesdePedido()', () => {
  it('usa los totales GUARDADOS aunque el precio actual haya cambiado', () => {
    const h = ticketDesdePedido(state, { ...base, subtotal: 8, itbms: 0.56, total: 8.56 });
    expect(h).toContain('US$ 8.56');
    expect(h).not.toContain('US$ 10.70');
  });
  it('sin totales guardados recotiza con los precios actuales', () => {
    expect(ticketDesdePedido(state, base)).toContain('US$ 10.70');
  });
  it('el bloque de factura solo aparece si existe, con marca SIMULADO', () => {
    expect(ticketDesdePedido(state, base)).not.toContain('tk__fac');
    const h = ticketDesdePedido(state, { ...base, factura: { id: 'fac-0001', cufe: 'SIMULADO-ABC-NO-VALIDO-FISCALMENTE', simulada: true } });
    expect(h).toContain('fac-0001');
    expect(h).toContain('SIMULADO-ABC');
    expect(h).toContain('class="tk__simulado">SIMULADO');
  });
  it('escapa nombres de producto y pone sello solo si fue entregado', () => {
    const h = ticketDesdePedido(state, { ...base, estado: 'Entregado' });
    expect(h).toContain('Arepa &lt;x&gt;');
    expect(h).toContain('Hecho al momento');
    expect(ticketDesdePedido(state, base)).not.toContain('tk__sello');
  });
  it('pedido nulo da cadena vacía; meta con sucursal corta y pago', () => {
    expect(ticketDesdePedido(state, null)).toBe('');
    const h = ticketDesdePedido(state, base);
    expect(h).toContain('>Centro<');
    expect(h).toContain('Yappy');
    expect(h).toContain('PED-9');
  });
});
