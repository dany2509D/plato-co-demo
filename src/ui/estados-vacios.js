/**
 * Estados vacíos de marca · Plato & Co. Una ilustración calma hecha con el anillo del plato y el vapor (SVG, trazo 1.5),
 * un título, una línea de ayuda y, si hace falta, una acción.
 *
 *   estadoVacio(tipo, { t, titulo, texto, accion, tono = 'claro', tam = 96 })  → string HTML
 *     tipo    'carrito' | 'pedidos-cocina' | 'reservas' | 'en-vivo' | 'busqueda' | 'agotados' | 'historial'
 *     t       (clave, respaldo) => texto. Claves: `vacio.<tipo>.titulo|texto|accion` (la tabla de copy puede inyectarse).
 *     titulo/texto  sobrescriben el copy. accion: { texto, href } (enlace) o { texto, dato } (botón con data-accion=dato);
 *             accion:false quita la acción por defecto. Nunca se emite un enlace sin texto ni sin href.
 *     tono    'claro' (sobre pergamino/blanco) | 'oscuro' (sobre carbón o foto).
 *   TIPOS_VACIO → lista de tipos (guía #/estilo y pruebas).
 * El bloque es contenido de la página (no anuncia nada por sí mismo); la ilustración es decorativa (aria-hidden).
 */
import { esc } from './dom.js';
import '../styles/momentos.css';

const COPY = {
  carrito: { titulo: 'Su carrito está vacío', texto: 'Elija algo de la carta y aparecerá aquí.', accion: { texto: 'Ver la carta', href: '#/menu' } },
  'pedidos-cocina': { titulo: 'Cocina al día', texto: 'No hay pedidos en esta etapa. Cuando llegue uno, aparece aquí.' },
  reservas: { titulo: 'Sin reservas por ahora', texto: 'Las reservas de este día aparecen aquí apenas se confirman.' },
  'en-vivo': { titulo: 'Esperando el primer pedido', texto: 'Lo que pase por WhatsApp se ve aquí, en tiempo real.' },
  busqueda: { titulo: 'No encontramos ese plato', texto: 'Pruebe con otra palabra o quite algún filtro.', accion: { texto: 'Limpiar búsqueda', dato: 'limpiar' } },
  agotados: { titulo: 'Todo disponible', texto: 'Ningún plato está agotado en esta sucursal.' },
  historial: { titulo: 'Aún no hay pedidos', texto: 'Su historial aparece aquí después de su primer pedido.', accion: { texto: 'Pedir ahora', href: '#/menu' } },
};
export const TIPOS_VACIO = Object.keys(COPY);

// Primitivas: plato (aro doble), vapor (tres hilos), todo en una rejilla de 96 × 96.
const plato = (cx, cy, r = 28) => `<circle cx="${cx}" cy="${cy}" r="${r}"/><circle cx="${cx}" cy="${cy}" r="${r - 8}"/>`;
const vapor = (x, y) => `<path class="ev-acc" d="M${x - 9} ${y}c-4-5 4-8 0-14M${x} ${y + 2}c-4-6 4-10 0-17M${x + 9} ${y}c-4-5 4-8 0-14"/>`;

const DIBUJO = {
  carrito: `${plato(48, 62)}${vapor(48, 24)}`,
  'pedidos-cocina': `<path d="M16 66h64M22 66a26 26 0 0 1 52 0"/><path class="ev-acc" d="M48 40v-6"/><circle cx="48" cy="31" r="3"/><path d="M12 74h72"/>`,
  reservas: `<circle cx="48" cy="48" r="20"/><circle cx="48" cy="48" r="11"/><path d="M14 36a14 14 0 0 0 0 24M82 36a14 14 0 0 1 0 24M36 14a14 14 0 0 1 24 0M36 82a14 14 0 0 0 24 0"/>`,
  'en-vivo': `<circle cx="48" cy="48" r="32"/><circle cx="48" cy="48" r="21"/><circle class="ev-acc" cx="48" cy="48" r="5"/>`,
  busqueda: `<circle cx="42" cy="42" r="26"/><circle cx="42" cy="42" r="18"/><path class="ev-acc" d="M62 62l20 20"/>`,
  agotados: `<path d="M48 18a30 30 0 1 0 28 40"/><path d="M48 30a18 18 0 1 0 17 24"/><path class="ev-acc" d="M66 22l8 8M74 22l-8 8"/>`,
  historial: `<circle cx="48" cy="48" r="32"/><circle cx="48" cy="48" r="23"/><path class="ev-acc" d="M48 33v16l10 6"/>`,
};

function ilustracion(tipo, tam) {
  const t = Number.isFinite(+tam) && +tam > 0 ? +tam : 96;
  return `<svg class="ev__ilus" viewBox="0 0 96 96" width="${t}" height="${t}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${DIBUJO[tipo]}</svg>`;
}

export function estadoVacio(tipo, { t, titulo, texto, accion, tono = 'claro', tam = 96 } = {}) {
  const k = Object.hasOwn(COPY, tipo) ? tipo : 'en-vivo';
  const base = COPY[k];
  const tr = (campo, def) => (typeof t === 'function' ? t(`vacio.${k}.${campo}`, def) ?? def : def);
  const tit = titulo ?? tr('titulo', base.titulo);
  const txt = texto ?? tr('texto', base.texto);
  const defAcc = base.accion ? { ...base.accion, texto: tr('accion', base.accion.texto) } : null;
  const acc = accion === false ? null : accion ?? defAcc;
  let accionHtml = '';
  if (acc && acc.texto) {
    accionHtml = acc.href
      ? `<a class="ev__accion" href="${esc(acc.href)}">${esc(acc.texto)} <span aria-hidden="true">→</span></a>`
      : `<button class="ev__accion" type="button" data-accion="${esc(acc.dato ?? '')}">${esc(acc.texto)}</button>`;
  }
  return `<div class="ev ev--${esc(k)} ev--${tono === 'oscuro' ? 'oscuro' : 'claro'}">${ilustracion(k, tam)}<p class="ev__t">${esc(tit)}</p><p class="ev__txt">${esc(txt)}</p>${accionHtml}</div>`;
}
