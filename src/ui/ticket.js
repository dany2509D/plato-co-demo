/**
 * Ticket de comanda · Plato & Co. (momentos de marca). El dispositivo de marca: un papel de cocina con
 * bordes perforados, tipografía monoespaciada para códigos, línea de rasgado y una tira tipo código de barras.
 *
 *   ticket({ titulo, codigo, lineas:[{ cantidad, nombre, detalle, precio, fotoHtml }], totales:{ subtotal, itbms, total },
 *            meta:[{ k, v }], factura:{ id, cufe }, pie, variante:'papel'|'oscuro', sello, etiquetas })  → string HTML
 *   ticketDesdePedido(state, pedido, { fotos = false, variante, etiquetas })  → string HTML (totales GUARDADOS del pedido)
 *   barrasDe(texto, n)  → [anchos]   (pura, determinista; para la tira decorativa)
 *
 * Todo texto va escapado con esc(). `fotoHtml` es el único campo que NO se escapa: debe venir de fotoProducto().
 * `precio` null/undefined → no se muestra importe en esa línea. Sin `totales` no hay bloque de totales.
 * Colores: variante 'papel' (pergamino) u 'oscuro' (carbón, para ir sobre foto). Sin sombras ni degradados.
 */
import { esc } from './dom.js';

// El ticket/factura conserva el formato fiscal «US$ 19.15» (la carta usa «$19.15»).
const money = (n) => `US$ ${Number(n).toFixed(2)}`;
import { fotoProducto } from './photo.js';
import { totalesPedido, lineasPedido, nombreCorto } from '../views/compra-util.js';
import '../styles/momentos.css';

const ETIQ = {
  cant: 'Cant.', producto: 'Producto', importe: 'Importe', subtotal: 'Subtotal', itbms: 'ITBMS (7 %)', total: 'Total',
  simulado: 'SIMULADO', factura: 'Factura', cufe: 'CUFE', sinValidez: 'Sin validez fiscal',
};

/** Anchos (1–3) de las barras de la tira, deterministas a partir del texto. */
export function barrasDe(texto, n = 34) {
  const s = String(texto ?? '') || 'plato';
  const out = [];
  let h = 2166136261;
  for (let i = 0; i < n; i++) {
    h = Math.imul(h ^ s.charCodeAt(i % s.length), 16777619) >>> 0;
    out.push(1 + (h >>> 7) % 3);
  }
  return out;
}

function tira(codigo) {
  let x = 0;
  let rects = '';
  barrasDe(codigo).forEach((w, i) => {
    if (i % 2 === 0) rects += `<rect x="${x}" y="0" width="${w}" height="24"/>`;
    x += w;
  });
  return `<svg class="tk__barras" viewBox="0 0 ${x} 24" preserveAspectRatio="none" aria-hidden="true" focusable="false" fill="currentColor">${rects}</svg>`;
}

const fila = (l) => {
  const det = l.detalle ? `<span class="tk__det">${esc(l.detalle)}</span>` : '';
  const foto = l.fotoHtml ? `<span class="tk__foto">${l.fotoHtml}</span>` : '';
  const imp = l.precio == null ? '' : esc(money(l.precio));
  return `<tr><td class="tk__cant"><span class="tk__aro" aria-hidden="true"></span>${esc(l.cantidad)}</td>
    <td class="tk__prod">${foto}<span class="tk__txt"><span class="tk__nom">${esc(l.nombre)}</span>${det}</span></td><td class="tk__imp">${imp}</td></tr>`;
};

export function ticket({ titulo = '', codigo = '', lineas = [], totales, meta = [], factura, pie, variante = 'papel', sello, etiquetas } = {}) {
  const E = { ...ETIQ, ...(etiquetas || {}) };
  const v = variante === 'oscuro' ? 'oscuro' : 'papel';
  const rotulo = [titulo, codigo].filter(Boolean).join(' ');
  const cab = `<header class="tk__cab"><p class="tk__marca">${esc(titulo)}</p>${codigo ? `<p class="tk__cod">${esc(codigo)}</p>` : ''}</header>`;
  const metas = meta.length
    ? `<dl class="tk__meta">${meta.map((m) => `<div><dt>${esc(m.k)}</dt><dd>${esc(m.v)}</dd></div>`).join('')}</dl>`
    : '';
  const tabla = lineas.length
    ? `<table class="tk__lineas"><thead class="sr-only"><tr><th scope="col">${esc(E.cant)}</th><th scope="col">${esc(E.producto)}</th><th scope="col">${esc(E.importe)}</th></tr></thead><tbody>${lineas.map(fila).join('')}</tbody></table>`
    : '';
  const tot = totales
    ? `<dl class="tk__tot">
        ${totales.subtotal != null ? `<div><dt>${esc(E.subtotal)}</dt><dd>${esc(money(totales.subtotal))}</dd></div>` : ''}
        ${totales.itbms != null ? `<div><dt>${esc(E.itbms)}</dt><dd>${esc(money(totales.itbms))}</dd></div>` : ''}
        <div class="tk__tot-final"><dt>${esc(E.total)}</dt><dd>${esc(money(totales.total))}</dd></div></dl>`
    : '';
  const fac = factura && (factura.id || factura.cufe)
    ? `<div class="tk__fac"><p class="tk__fac-t">${esc(E.factura)} ${esc(factura.id ?? '')} <span class="tk__simulado">${esc(E.simulado)}</span></p>
        ${factura.cufe ? `<p class="tk__cufe"><span>${esc(E.cufe)}</span> ${esc(factura.cufe)}</p>` : ''}<p class="tk__fac-n">${esc(E.sinValidez)}</p></div>`
    : '';
  const rasgo = '<hr class="tk__rasgo" aria-hidden="true">';
  const bloques = [metas, tabla && rasgo + tabla, tot && rasgo + tot, fac && rasgo + fac].filter(Boolean).join('');
  const cola = `${rasgo}${tira(codigo || titulo)}${pie ? `<p class="tk__pie">${esc(pie)}</p>` : ''}`;
  return `<div class="tk tk--${v}${sello ? ' tk--sello' : ''}" role="group" aria-label="${esc(rotulo || 'Ticket')}">
    <span class="tk__borde tk__borde--sup" aria-hidden="true"></span>
    <div class="tk__cuerpo">${cab}${bloques}${cola}${sello ? `<p class="tk__sello">${esc(sello)}</p>` : ''}</div>
    <span class="tk__borde tk__borde--inf" aria-hidden="true"></span></div>`;
}

const fechaPA = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(+d) ? '' : d.toLocaleString('es-PA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Panama' });
};
const METODO = { yappy: 'Yappy', tarjeta: 'Tarjeta', efectivo: 'Efectivo' };

/** Arma el ticket de un pedido con sus totales GUARDADOS y su factura (marcada SIMULADO) si existe. */
export function ticketDesdePedido(state, pedido, { fotos = false, variante = 'papel', etiquetas } = {}) {
  if (!pedido) return '';
  const suc = state?.sucursales?.find((s) => s.id === pedido.sucursalId);
  const lineas = lineasPedido(state, pedido).map((l) => ({
    cantidad: l.cantidad, nombre: l.producto.nombre, detalle: (l.modificadores || []).join(', '), precio: l.importe,
    fotoHtml: fotos ? fotoProducto(l.producto, { variante: 'mini' }) : '',
  }));
  const meta = [
    { k: 'Fecha', v: fechaPA(pedido.creadoEn) },
    { k: 'Tipo', v: pedido.tipo === 'retiro' ? 'Retiro' : 'Entrega' },
    ...(suc ? [{ k: 'Sucursal', v: nombreCorto(suc) }] : []),
    ...(pedido.pago?.metodo ? [{ k: 'Pago', v: METODO[pedido.pago.metodo] ?? pedido.pago.metodo }] : []),
  ].filter((m) => m.v);
  return ticket({
    titulo: 'Plato & Co.', codigo: String(pedido.id).toUpperCase(), lineas, totales: totalesPedido(state, pedido), meta,
    factura: pedido.factura, variante, etiquetas, sello: pedido.estado === 'Entregado' ? 'Hecho al momento' : undefined,
  });
}
