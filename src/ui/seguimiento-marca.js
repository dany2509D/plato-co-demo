/**
 * Seguimiento de marca · Plato & Co. — el plato que se va llenando.
 *
 *   plateProgress(estado, { retiro = false, tam = 160, animar = true, texto, etiqueta })  → string <svg>
 *   etapaDe(estado, retiro) → { i, n }   etapa 0-based y total de pasos (5; 4 si es retiro). Pura.
 *
 *   Recibido  → plato vacío (aro doble)            En cocina → aparece el vapor
 *   Listo     → vapor + comida (pan, carne, hoja)  En camino → plato cubierto con campana (bolsa en retiro) y rayas de velocidad
 *   Entregado → comida + sello «Hecho al momento» (aterriza en 600 ms)
 *
 * Uso: tamaño `tam` en px (mín. 96; se lee bien desde 120; el texto del sello solo se dibuja con tam ≥ 180).
 * Color: trazo = currentColor (tinta sobre pergamino, crema sobre carbón); acento = var(--ctx-accent) (brasa / oro).
 * Rellenos fijos de 2 tonos del sistema: oro y brasa. Plano, trazo 1.5, sin sombras ni degradados.
 * Movimiento: solo el elemento nuevo de la etapa actual entra (0,4 s) y el sello aterriza (0,6 s). Con prefers-reduced-motion
 * se ve solo el fotograma final (sin animación). `animar:false` también lo desactiva.
 * El SVG lleva role="img" y aria-label «Seguimiento: En cocina, paso 2 de 5».
 */
import { ESTADOS } from '../core/estados.js';
import { esc } from './dom.js';
import '../styles/momentos.css';

export function etapaDe(estado, retiro = false) {
  const flujo = retiro ? ESTADOS.filter((e) => e !== 'En camino') : ESTADOS;
  const i = flujo.indexOf(estado);
  return { i: i < 0 ? 0 : i, n: flujo.length, nombre: flujo[i < 0 ? 0 : i] };
}

const PLATO = '<circle cx="60" cy="76" r="38"/><circle cx="60" cy="76" r="28"/>';
const VAPOR = '<path class="pp-acc" d="M46 52c-6-7 6-11 0-20M60 48c-6-8 6-13 0-24M74 52c-6-7 6-11 0-20"/>';
const COMIDA = `<g class="pp-comida">
  <path d="M42 74a18 14 0 0 1 36 0z" fill="var(--c-gold)"/><path d="M42 80h36" stroke="var(--c-ember)" stroke-width="5"/>
  <path d="M42 85h36a0 0 0 0 1 0 0 18 8 0 0 1-36 0z" fill="var(--c-gold)"/><path d="M48 70h.01M56 66h.01M64 70h.01M72 67h.01" stroke-width="2"/></g>`;
const CAMPANA = `<g class="pp-campana"><path d="M20 76a40 40 0 0 1 80 0z" fill="var(--pp-bg, var(--c-paper))"/><path d="M60 36v-6"/><circle cx="60" cy="27" r="3.5" fill="var(--c-gold)"/><path d="M30 68a32 32 0 0 1 14-18" opacity=".5"/></g>`;
const BOLSA = `<g class="pp-campana"><path d="M34 52h52l-4 50H38z" fill="var(--pp-bg, var(--c-paper))"/><path d="M48 52v-6a12 12 0 0 1 24 0v6"/><path d="M60 66v14M53 73h14" class="pp-acc"/></g>`;
const RAYAS = '<path class="pp-acc pp-rayas" d="M4 66h14M0 80h12M6 92h14"/>';

function sello(texto) {
  const f = 'font-size="6.4" font-weight="700" letter-spacing=".2" fill="currentColor" stroke="none" font-family="DM Sans, system-ui, sans-serif" text-anchor="middle"';
  const t = texto
    ? `<text x="88" y="36.5" ${f}>HECHO</text><text x="88" y="44" ${f}>AL MOMENTO</text>`
    : '<path d="M79 39l6 6 12-13" stroke-width="3"/>';
  return `<g class="pp-sello" style="color:var(--c-ember)"><g transform="rotate(-10 88 38)"><circle cx="88" cy="38" r="22" fill="var(--pp-bg, var(--c-paper))" stroke-width="2.5"/><circle cx="88" cy="38" r="18" stroke-width="1"/>${t}</g></g>`;
}

export function plateProgress(estado, { retiro = false, tam = 160, animar = true, texto, etiqueta } = {}) {
  const { i, n, nombre } = etapaDe(estado, retiro);
  const etapa = retiro && i === 3 ? 4 : i; // en retiro «Entregado» es la etapa final del dibujo
  const t = Math.max(96, Number(tam) || 160);
  const conTexto = texto ?? t >= 180;
  let cuerpo;
  if (etapa === 3) cuerpo = `<g class="pp-g">${RAYAS}<g transform="translate(8 0)">${PLATO}${retiro ? BOLSA : CAMPANA}</g></g>`;
  else if (etapa === 4) cuerpo = `${PLATO}${COMIDA}${sello(conTexto)}`;
  else {
    cuerpo = PLATO;
    if (etapa >= 1) cuerpo += VAPOR.replace('class="pp-acc"', `class="pp-acc${etapa === 1 ? ' pp-nuevo' : ''}"`);
    if (etapa >= 2) cuerpo += COMIDA.replace('class="pp-comida"', `class="pp-comida${etapa === 2 ? ' pp-nuevo' : ''}"`);
  }
  const ar = etiqueta ?? `Seguimiento: ${nombre}, paso ${i + 1} de ${n}`;
  return `<svg class="pp${animar ? ' pp--anim' : ''}" data-etapa="${etapa}" viewBox="0 0 120 120" width="${t}" height="${t}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${esc(ar)}">${cuerpo}</svg>`;
}
