/**
 * Iconos SVG · Plato & Co. (rediseño 2). Sustituyen a todos los emoji.
 *
 *   icono(nombre, { tam = 20, etiqueta })        → <svg> 24×24, trazo 1.5, currentColor.
 *       Sin `etiqueta` es decorativo (aria-hidden): el texto visible al lado da el significado.
 *       Con `etiqueta` lleva role="img" y aria-label.
 *   circuloIcono(nombre, { tam = 20, etiqueta, tono = 'claro' | 'oscuro' })
 *       → icono dentro de un anillo de 40 px (estilo Tiger): borde 1 px, oro sobre fondo oscuro, --c-rule sobre claro.
 *   ICONOS            → lista de nombres disponibles (para la guía #/estilo y pruebas).
 *
 * Nombre desconocido → un círculo discreto (nunca lanza).
 */
import { esc } from './dom.js';
import '../styles/icons.css';

// Trazos (cada valor es el interior del <svg>). `fill` marca los rellenos explícitos.
const T = {
  pedido: '<path d="M7 3h10v18l-2.5-1.6L12 21l-2.5-1.6L7 21V3z"/><path d="M9.5 8h5M9.5 11.5h5M9.5 15h3"/>',
  cocina: '<path d="M3 13h13v1a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-1z"/><path d="M16 14h5"/><path d="M9 4c-1.2 1.4-1.2 2.6 0 4"/><path d="M12.5 5c-1 1.1-1 2.1 0 3.2"/>',
  listo: '<path d="M4 17h16"/><path d="M6 17a6 6 0 0 1 12 0"/><path d="M12 9V7M10 7h4M3 20h18"/>',
  'en-camino': '<circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6M17 17l-2-7h-3M6 15l2-5h4"/>',
  entregado: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M9 15l2 2 4-4"/>',
  retiro: '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  reserva: '<path d="M4 6h16v14H4z"/><path d="M4 10h16M8 3v4M16 3v4M8 14h3"/>',
  persona: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  chat: '<path d="M4 20l1.4-4.2A8 8 0 1 1 8.2 18.7L4 20z"/><path d="M9 10.5h6M9 13.5h4"/>',
  web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  alerta: '<path d="M12 4l9 16H3L12 4z"/><path d="M12 10v4M12 17.5v.01"/>',
  movil: '<path d="M8 3h8v18H8z"/><path d="M11 18h2"/>',
  panel: '<path d="M3 5h18v11H3z"/><path d="M8 20h8M12 16v4"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  cerrar: '<path d="M6 6l12 12M18 6L6 18"/>',
  flecha: '<path d="M4 12h16M14 6l6 6-6 6"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  bolsa: '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  lupa: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  estrella: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8L12 3.5z" fill="currentColor"/>',
  whatsapp: '<path d="M4 20l1.3-3.9A8.5 8.5 0 1 1 8 19.1L4 20z"/><path d="M9.2 8.6c-.2 2.9 3.1 6.4 6.2 6.3l.9-1.5-1.9-1-.9.8c-1-.4-2-1.4-2.5-2.4l.8-.9-1-1.9-1.6.6z"/>',
  pausa: '<path d="M9 6v12M15 6v12"/>',
  play: '<path d="M8 5.5v13l11-6.5z"/>',
  pin: '<path d="M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  picante: '<path d="M6 8c0-2 2-3 4-2 4 1 9 5 9 11-4 0-9-1-11-5-1-1.5-2-2.5-2-4z"/><path d="M10 6c0-1.2.6-2 1.6-2.5"/>',
};
T.bolsa = T.retiro;

export const ICONOS = Object.keys(T);

const FALLBACK = '<circle cx="12" cy="12" r="3"/>';

export function icono(nombre, { tam = 20, etiqueta } = {}) {
  const cuerpo = Object.hasOwn(T, nombre) ? T[nombre] : FALLBACK;
  const t = Number.isFinite(+tam) && +tam > 0 ? +tam : 20;
  const a11y = etiqueta ? `role="img" aria-label="${esc(etiqueta)}"` : 'aria-hidden="true" focusable="false"';
  return `<svg class="ico" viewBox="0 0 24 24" width="${t}" height="${t}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${cuerpo}</svg>`;
}

export function circuloIcono(nombre, { tam = 20, etiqueta, tono = 'claro' } = {}) {
  const t = tono === 'oscuro' ? 'oscuro' : 'claro';
  return `<span class="ico-aro ico-aro--${t}">${icono(nombre, { tam, etiqueta })}</span>`;
}
