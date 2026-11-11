import { barWidths } from '../core/metrics.js';

export const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Bloque KPI: cifra grande + etiqueta corta (+ nota opcional).
export function kpiBlock({ valor, etiqueta, nota = '' }) {
  return `<div class="kpi"><div class="kpi-valor">${esc(valor)}</div><div class="kpi-etiqueta">${esc(etiqueta)}</div>${nota ? `<div class="kpi-nota">${esc(nota)}</div>` : ''}</div>`;
}

// Barras horizontales SVG. items: [{etiqueta, valor, texto?}]. El valor se escribe junto a cada barra.
export function hBars(items, { titulo }) {
  const ancho = 100, fila = 34, alto = Math.max(1, items.length) * fila;
  const w = barWidths(items.map((i) => i.valor), ancho);
  const rows = items.map((it, i) => {
    const y = i * fila;
    return `<rect class="barra-fondo" x="0" y="${y + 20}" width="${ancho}" height="8" rx="4"/>` +
      `<rect class="barra" x="0" y="${y + 20}" width="${w[i]}" height="8" rx="4"/>` +
      `<text class="barra-etq" x="0" y="${y + 14}">${esc(it.etiqueta)}</text>` +
      `<text class="barra-val" x="${ancho}" y="${y + 14}" text-anchor="end">${esc(it.texto ?? it.valor)}</text>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="${esc(titulo)}" preserveAspectRatio="xMinYMin meet">${rows}</svg>`;
}

// Dona de dos segmentos (web / WhatsApp). Con 0 pedidos muestra un anillo vacío.
export function donut(a, b, { titulo, etiquetaA, etiquetaB }) {
  const total = a + b, r = 40, c = 2 * Math.PI * r;
  const la = total ? (a / total) * c : 0;
  return `<svg class="chart donut" viewBox="0 0 120 120" role="img" aria-label="${esc(titulo)}">` +
    `<circle class="dona-b" cx="60" cy="60" r="${r}" fill="none" stroke-width="18"/>` +
    `<circle class="dona-a" cx="60" cy="60" r="${r}" fill="none" stroke-width="18" stroke-dasharray="${la.toFixed(2)} ${(c - la).toFixed(2)}" transform="rotate(-90 60 60)"/>` +
    `<text class="dona-total" x="60" y="62" text-anchor="middle">${total}</text><text class="dona-sub" x="60" y="78" text-anchor="middle">pedidos</text>` +
    `<title>${esc(`${etiquetaA}: ${a}; ${etiquetaB}: ${b}`)}</title></svg>`;
}
