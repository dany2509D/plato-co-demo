import { barWidths } from '../core/metrics.js';

export const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Bloque KPI: cifra gigante + etiqueta corta (+ nota opcional). `texto: true` para valores que son palabras
// (p. ej. "WhatsApp"): usan una escala menor para no desbordar la columna.
export function kpiBlock({ valor, etiqueta, nota = '', texto = false }) {
  const n = Math.max(2, [...String(valor)].length);
  return `<div class="kpi${texto ? ' kpi--texto' : ''}" style="--n:${n}"><div class="kpi-valor">${esc(valor)}</div><div class="kpi-etiqueta">${esc(etiqueta)}</div>${nota ? `<div class="kpi-nota">${esc(nota)}</div>` : ''}</div>`;
}

// Barra SVG hecha a mano (pista + relleno). Escala con el ancho; el texto va en HTML, siempre >= 14 px.
function barraSvg(pct, mejor) {
  const w = Math.max(0, Math.min(100, pct));
  return `<svg class="bar-svg" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false">` +
    `<rect class="bar-pista" x="0" y="0" width="100" height="10"/>` +
    (w > 0 ? `<rect class="bar-relleno${mejor ? ' bar-mejor' : ''}" x="0" y="0" width="${w}" height="10"/>` : '') + `</svg>`;
}

// Barras horizontales. items: [{etiqueta, valor, texto?, mejor?}]. El valor se escribe junto a cada barra
// (nunca solo color: la mejor lleva "★"). El conjunto tiene alternativa de texto en aria-label.
export function hBars(items, { titulo }) {
  const w = barWidths(items.map((i) => i.valor), 100);
  const rows = items.map((it, i) => `<li class="bar-fila${it.mejor ? ' es-mejor' : ''}"><span class="bar-etq">${it.mejor ? '★ ' : ''}${esc(it.etiqueta)}</span>` +
    barraSvg(w[i], it.mejor) + `<span class="bar-val">${esc(it.texto ?? it.valor)}</span></li>`).join('');
  return `<ul class="bars" role="img" aria-label="${esc(titulo)}">${rows}</ul>`;
}

// Reparto en dos partes (web / WhatsApp) en una sola barra apilada: tinta sólida y oro con trama de borde.
export function splitBar(a, b, { titulo }) {
  const total = a + b;
  const pa = total ? (a / total) * 100 : 0;
  return `<svg class="split-svg" viewBox="0 0 100 14" preserveAspectRatio="none" role="img" aria-label="${esc(titulo)}">` +
    `<rect class="bar-pista" x="0" y="0" width="100" height="14"/>` +
    (total ? `<rect class="split-a" x="0" y="0" width="${pa.toFixed(2)}" height="14"/><rect class="split-b" x="${pa.toFixed(2)}" y="0" width="${(100 - pa).toFixed(2)}" height="14"/>` : '') +
    `</svg>`;
}
