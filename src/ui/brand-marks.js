/**
 * Identidad visual · Plato & Co. (bloque V). «Mesa de barrio con ganas.»
 * Todas las marcas salen de `src/config/brand.js` (nombre, iniciales, lema, colores, sucursales): cambie ese
 * archivo y el logotipo, el sello, los sellos de sucursal, el patrón y el favicon cambian solos.
 * Guía y tabla de dónde va cada marca: docs/brand/identidad-visual.md. Estilos: src/styles/marca.css.
 *
 * API (todas devuelven strings listos para innerHTML; cualquier texto interpolado va escapado):
 *   logo({ variante, color, tam, titulo, decorativo, clase })
 *       variante 'horizontal' | 'apilado' | 'monograma' | 'palabra' | 'simbolo'       (por defecto 'horizontal')
 *       color    'marca' (sobre claro) | 'marca-oscuro' (sobre carbón/foto) | 'tinta' | 'crema' | 'oro' | 'tomate'
 *                | 'actual' (currentColor). Las de una tinta usan SOLO ese color (sirven sobre fotos y bandas).
 *       tam      alto en px (el ancho sale de la proporción). Sin tam: SVG fluido (dimensione con CSS).
 *   sello({ texto, color: 'tinta'|'oro'|'crema'|'actual', fondo, tam, modo: 'contorno'|'texto', titulo, decorativo })
 *       Sello redondo «Hecho al momento». fondo:true lo pone sobre un disco (papel o carbón) para usarlo sobre fotos.
 *   selloSucursal(n, { color, fondo, tam, modo, decorativo })  n = 1, 2, 3… (orden de brand.sucursales). Fuera de rango → ''.
 *   ampersand({ color, estilo: 'relleno'|'contorno', tam, decorativo = true })  el «&» de firma (marca de agua, recortes)
 *   patron({ tono: 'claro'|'oscuro' }) → 'url("data:image/svg+xml,…")' (< 3 KB) · patronSvg({ tono }) → SVG
 *   ticketBorde({ forma: 'dientes'|'ondas'|'perforado', lado: 'arriba'|'abajo', color }) → tira SVG (100 % de ancho)
 *   ticketMascara({ forma, lado }) → url() para mask-image · barras(texto, { alto, color }) → código de barras decorativo
 *   favicon(16|32) → SVG ajustado al píxel · paleta() → colores resueltos · aDataUri(svg)
 *   textoContorno(texto, { x, base, cap, color }) → { svg, ancho } (rótulos en Anton contorneado: og-image, láminas)
 *   nombreCorto(sucursal) · instalarMarca(doc) (fija --marca-patron-* en :root; se llama sola al importar)
 *   AJUSTES { ampEscala, ampAlto, espacio } · FUENTE_SELLO (pila de fuentes del modo texto)
 *
 * «Contorneado»: el texto del logotipo, del monograma, de los sellos y del & se dibuja con los contornos de Anton
 * (src/assets/brand/glifos-anton.js, OFL), así funciona dentro de <img>, data-URI y PNG sin cargar la fuente.
 * Solo sello({ modo: 'texto' }) usa <textPath> (texto real, seleccionable) con una pila de fuentes de respaldo.
 */
import { brand } from '../config/brand.js';
import { GLIFOS, KERN, CAP } from '../assets/brand/glifos-anton.js';
import { plato, coloresPlato, circulo, sectorAnular, transformar, aDataUri, num, medidasPlato } from '../assets/brand/geometria.js';
import { esc } from './dom.js';
import '../styles/marca.css';

export { aDataUri };
export const VARIANTES = ['horizontal', 'apilado', 'monograma', 'palabra', 'simbolo'];
export const COLORES_LOGO = ['marca', 'marca-oscuro', 'tinta', 'crema', 'oro', 'tomate', 'actual'];
export const FUENTE_SELLO = "Anton, Impact, 'Haettenschweiler', 'Arial Narrow Bold', 'Arial Narrow', sans-serif";

/** Paleta resuelta desde brand.colores (con alias antiguos como respaldo). */
export function paleta() {
  const c = brand.colores || {};
  return {
    tinta: c.tinta, crema: c.crema, papel: c.papel ?? c.crema, carbon: c.carbon ?? c.tinta,
    tomate: c.tomate ?? c.terracota, oro: c.oro ?? c.amarillo,
  };
}

// ---------- Texto contorneado (Anton) ----------
const K = 0.1; // unidades de fuente → unidades del SVG (CAP 1760 → 176)
const CAPU = CAP * K;
// Ronda 3: LA −70 montaba el pie de la L sobre la A en tamaños grandes; AT vuelve al kerning de Anton (−26).
const KERN_MARCA = { LA: -15, TO: -45, CO: -45, PL: -10, 'P&': -40, '&C': -40 };
const tieneGlifo = (ch) => Object.prototype.hasOwnProperty.call(GLIFOS, ch);
const glifo = (ch) => {
  if (tieneGlifo(ch)) return GLIFOS[ch];
  const base = ch.normalize('NFD')[0];
  return tieneGlifo(base) ? GLIFOS[base] : null;
};
const kern = (a, b) => KERN_MARCA[a + b] ?? KERN[a + b] ?? 0;
const mayus = (t) => String(t ?? '').toLocaleUpperCase('es').replace(/\s+/g, ' ');

// Tratamiento del & dentro del logotipo y del monograma (afinado a ojo en la lámina de contacto).
//   escala: fracción de la altura de mayúsculas · alto: 'base' (apoyado en la línea base) | 'centro' (centrado óptico)
export const AJUSTES = { ampEscala: 0.8, ampAlto: 'centro', espacio: 0.5 };

/** Coloca glifos en unidades de fuente. Devuelve [{ ch, g, x, s, dy }] y el ancho total. */
function corrida(texto, { espacio = AJUSTES.espacio } = {}) {
  const chars = [...texto];
  const items = [];
  let x = 0;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const g = glifo(ch);
    if (!g) continue;
    const s = ch === '&' ? AJUSTES.ampEscala : 1;
    const dy = ch === '&' && AJUSTES.ampAlto === 'centro' ? -(1 - AJUSTES.ampEscala) * CAP * 0.5 : 0;
    items.push({ ch, g, x, s, dy });
    x += (ch === ' ' ? g[0] * espacio : g[0] * s) + kern(ch, chars[i + 1]);
  }
  return { items, ancho: x };
}

/** Path de un grupo de glifos colocado en (ox, oy) (línea base) con escala k. */
const pathGlifos = (items, ox, oy, k = K, dec = 1) =>
  items.filter((it) => it.g[1]).map((it) => transformar(it.g[1], [k * it.s, 0, 0, k * it.s, ox + k * it.x, oy + k * it.dy], dec)).join('');

// ---------- Colores por modo ----------
function tintas(color) {
  const p = paleta();
  const mono = { tinta: p.tinta, crema: p.crema, oro: p.oro, tomate: p.tomate, actual: 'currentColor' };
  if (Object.prototype.hasOwnProperty.call(mono, color)) return { uno: mono[color] };
  const pl = coloresPlato(p);
  if (color === 'marca-oscuro') return { letras: p.crema, amp: p.oro, plato: pl, punto: { borde: p.crema, cuerpo: p.carbon, sol: p.oro } };
  return { letras: p.tinta, amp: p.tomate, plato: pl, punto: { borde: p.tomate, cuerpo: p.papel, sol: p.oro } };
}

/** Punto-plato (el punto final de «CO.»): borde grueso (peso parecido al trazo de Anton) + sol. */
const PUNTO = { r: 0.2, cuerpo: 0.54, sol: 0.3, desvio: 0.13 };
function puntoPlato(cx, cy, r, t) {
  const sx = cx + r * PUNTO.desvio; const sy = cy - r * PUNTO.desvio; // sol descentrado, como en el símbolo
  if (t.uno) return `<path fill="${t.uno}" fill-rule="evenodd" d="${circulo(cx, cy, r)}${circulo(cx, cy, r * PUNTO.cuerpo)}${circulo(sx, sy, r * PUNTO.sol)}"/>`;
  const c = t.punto;
  return `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}" fill="${c.borde}"/><circle cx="${num(cx)}" cy="${num(cy)}" r="${num(r * PUNTO.cuerpo)}" fill="${c.cuerpo}"/><circle cx="${num(sx)}" cy="${num(sy)}" r="${num(r * PUNTO.sol)}" fill="${c.sol}"/>`;
}

/** Logotipo de palabra en (x0, base). Devuelve { svg, ancho, arriba, abajo } en unidades del SVG. */
function palabraGeo(nombre, t, x0 = 0, base = 0) {
  let txt = mayus(nombre).trim();
  const conPunto = txt.endsWith('.');
  if (conPunto) txt = txt.slice(0, -1);
  const { items, ancho } = corrida(txt);
  const letras = items.filter((it) => it.ch !== '&');
  const amps = items.filter((it) => it.ch === '&');
  let svg = '';
  const cLetras = t.uno ?? t.letras; const cAmp = t.uno ?? t.amp;
  if (letras.length) svg += `<path fill="${cLetras}" d="${pathGlifos(letras, x0, base)}"/>`;
  if (amps.length) svg += `<path fill="${cAmp}" d="${pathGlifos(amps, x0, base)}"/>`;
  let w = ancho * K;
  if (conPunto) {
    const r = CAPU * PUNTO.r;
    const cx = x0 + w + CAPU * 0.03 + r;
    svg += puntoPlato(cx, base - r, r, t);
    w = cx + r - x0;
  }
  return { svg, ancho: w, arriba: base - CAPU - 2, abajo: base + 2 };
}

/** Iniciales (monograma) centradas en (cx, cy) con altura de mayúscula cap. */
function inicialesGeo(cx, cy, cap, t, anchoMax) {
  const txt = mayus(brand.iniciales || brand.nombre.split(/\s+/).map((w) => w[0]).join('')).replace(/\s/g, '');
  const { items, ancho } = corrida(txt);
  let k = cap / CAP;
  if (ancho * k > anchoMax) k = anchoMax / ancho;
  const ox = cx - (ancho * k) / 2; const base = cy + (CAP * k) / 2;
  const letras = items.filter((it) => it.ch !== '&');
  const amps = items.filter((it) => it.ch === '&');
  let s = '';
  if (letras.length) s += `<path fill="${t.uno ?? t.letras}" d="${pathGlifos(letras, ox, base, k, 2)}"/>`;
  if (amps.length) s += `<path fill="${t.uno ?? t.amp}" d="${pathGlifos(amps, ox, base, k, 2)}"/>`;
  return s;
}

/**
 * Texto suelto contorneado en Anton (para piezas que se exportan como imagen: og-image, rótulos de láminas).
 * Devuelve { svg: '<path …/>', ancho } con la línea base en (x, base) y altura de mayúscula cap (unidades del SVG).
 */
export function textoContorno(texto, { x = 0, base = 0, cap = 100, color = 'currentColor', espacio = 1 } = {}) {
  const { items, ancho } = corrida(mayus(texto), { espacio });
  const k = cap / CAP;
  const c = color === 'currentColor' ? color : esc(color);
  return { svg: items.length ? `<path fill="${c}" d="${pathGlifos(items, x, base, k, 1)}"/>` : '', ancho: ancho * k };
}

// ---------- Envoltorio accesible ----------
function envolver({ vb, cuerpo, tam, titulo, decorativo, clase }) {
  const [x, y, w, h] = vb;
  const alto = Number(tam);
  const dims = Number.isFinite(alto) && alto > 0 ? ` width="${num((alto * w) / h)}" height="${num(alto)}"` : '';
  const a11y = decorativo ? ' aria-hidden="true" focusable="false"' : ` role="img" aria-label="${esc(titulo)}"`;
  const t = decorativo ? '' : `<title>${esc(titulo)}</title>`;
  const c = clase ? ` class="${esc(clase)}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${num(x)} ${num(y)} ${num(w)} ${num(h)}"${dims}${c}${a11y}>${t}${cuerpo}</svg>`;
}

const simboloSvg = (cx, cy, R, t, extra = {}) => (t.uno ? plato(cx, cy, R, { uno: t.uno, ...extra }) : plato(cx, cy, R, { color: t.plato, ...extra }));

// ---------- logo() ----------
export function logo({ variante = 'horizontal', color = 'marca', tam, titulo, decorativo = false, clase = '' } = {}) {
  const v = VARIANTES.includes(variante) ? variante : 'horizontal';
  const t = tintas(COLORES_LOGO.includes(color) ? color : 'marca');
  const nombre = brand.nombre;
  const base = { tam, titulo: titulo ?? nombre, decorativo, clase: ['marca', `marca--${v}`, clase].filter(Boolean).join(' ') };

  if (v === 'simbolo') return envolver({ ...base, vb: [0, 0, 100, 100], cuerpo: simboloSvg(50, 50, 49, t) });

  if (v === 'monograma') {
    const m = medidasPlato(50, 50, 49);
    const cuerpo = simboloSvg(50, 50, 49, t, { conSol: false, conPozo: false })
      + inicialesGeo(50, 51, 30, t.uno ? t : { letras: paleta().tinta, amp: paleta().tomate }, m.ri * 1.5);
    return envolver({ ...base, vb: [0, 0, 100, 100], cuerpo });
  }

  if (v === 'palabra') {
    const p = palabraGeo(nombre, t, 0, 0);
    return envolver({ ...base, vb: [0, p.arriba, p.ancho, p.abajo - p.arriba], cuerpo: p.svg });
  }

  if (v === 'apilado') {
    const pal = palabraGeo(nombre, t, 0, 0);
    const D = CAPU * 2.3; const gap = CAPU * 0.42;
    const baseY = D + gap + CAPU;
    const pal2 = palabraGeo(nombre, t, 0, baseY);
    const W = Math.max(pal.ancho, D);
    const dx = (W - pal.ancho) / 2;
    const cuerpo = simboloSvg(W / 2, D / 2, D / 2, t) + `<g transform="translate(${num(dx)} 0)">${pal2.svg}</g>`;
    return envolver({ ...base, vb: [0, -2, W, baseY + 4], cuerpo });
  }

  // horizontal
  const D = CAPU * 1.22; const gap = CAPU * 0.34;
  const p = palabraGeo(nombre, t, D + gap, 0);
  const cy = -CAPU / 2;
  const arriba = Math.min(cy - D / 2, p.arriba); const abajo = Math.max(cy + D / 2, p.abajo);
  return envolver({ ...base, vb: [0, arriba, D + gap + p.ancho, abajo - arriba], cuerpo: simboloSvg(D / 2, cy, D / 2, t) + p.svg });
}

// ---------- Sellos ----------
let contador = 0;
function tintasSello(color) {
  const p = paleta();
  switch (color) {
    case 'oro': return { trazo: p.oro, acento: p.crema, fondo: p.carbon };
    case 'crema': return { trazo: p.crema, acento: p.oro, fondo: p.tomate };
    case 'actual': return { trazo: 'currentColor', acento: 'currentColor', fondo: null };
    default: return { trazo: p.tinta, acento: p.tomate, fondo: p.papel };
  }
}

// Geometría del sello (caja 100×100): aro exterior, banda de texto, aro interior y centro.
// Ronda 3: sin aro interior (demasiados círculos concéntricos = diana); el borde del plato cierra la banda de texto.
const SELLO = { aroExt: 48.2, trazoExt: 1.2, rb: 35.4, cap: 10.6, aroInt: 0, trazoInt: 0.9, plato: 28.6 };

/** Repite el texto del anillo si es corto (sellos de verdad: el texto da la vuelta completa). */
function rellenarAnillo(anillo, k, C) {
  const largo = (t) => corrida(t, { espacio: 1 }).ancho * k;
  let t = anillo;
  for (let i = 0; i < 3 && largo(t) < C * 0.62 && largo(t + anillo) < C * 0.97; i++) t += anillo;
  return t;
}

/** Texto en anillo contorneado (lectura horaria, la primera frase centrada arriba). */
function anilloContorno(texto, primera, { cx = 50, cy = 50, rb, cap, color }) {
  const C = 2 * Math.PI * rb;
  let k = cap / CAP;
  const todo = rellenarAnillo(texto, k, C);
  const { items, ancho } = corrida(todo, { espacio: 1 });
  if (!items.length) return '';
  if (ancho * k > C * 0.97) k = (C * 0.97) / ancho;
  const extra = (C - ancho * k) / items.length;
  const largoPrimera = Math.min(corrida(primera, { espacio: 1 }).ancho * k + extra * [...primera].length, C);
  let pos = -largoPrimera / 2 + extra / 2;
  let d = '';
  items.forEach((it, i) => {
    const adv = ((items[i + 1]?.x ?? ancho) - it.x) * k;
    const th = ((pos + adv / 2) / C) * 2 * Math.PI;
    if (it.g[1]) {
      const cs = Math.cos(th); const sn = Math.sin(th);
      const tx = cx - (it.g[0] * k) / 2; const ty = cy - rb;
      d += transformar(it.g[1], [k * cs, k * sn, -k * sn, k * cs, cx + (tx - cx) * cs - (ty - cy) * sn, cy + (tx - cx) * sn + (ty - cy) * cs], 2);
    }
    pos += adv + extra;
  });
  return `<path fill="${color}" d="${d}"/>`;
}

/** Texto en anillo con <textPath> (texto real). La fuente puede faltar: textLength reparte el texto igual. */
function anilloTexto(texto, primera, { cx = 50, cy = 50, rb, cap, color }) {
  const id = `sello-${(++contador).toString(36)}`;
  const C = 2 * Math.PI * rb;
  const k = cap / CAP;
  const todo = rellenarAnillo(texto, k, C);
  const fs = cap / (CAP / 2048);
  const extraAprox = Math.max(0, (C - corrida(todo, { espacio: 1 }).ancho * k) / [...todo].length);
  const largoPrimera = corrida(primera, { espacio: 1 }).ancho * k + extraAprox * [...primera].length;
  const inicio = C - largoPrimera / 2;
  const vuelta = `a${num(rb)} ${num(rb)} 0 1 1 0 ${num(2 * rb)}a${num(rb)} ${num(rb)} 0 1 1 0 ${num(-2 * rb)}`;
  return `<defs><path id="${id}" d="M${num(cx)} ${num(cy - rb)}${vuelta}${vuelta}"/></defs>`
    + `<text font-family="${FUENTE_SELLO}" font-size="${num(fs)}" fill="${color}"><textPath href="#${id}" startOffset="${num(inicio)}" textLength="${num(C - 0.5)}" lengthAdjust="spacing">${esc(todo)}</textPath></text>`;
}

function construirSello({ anillo, primera, centro, color, fondo, tam, modo, titulo, decorativo, clase }) {
  const t = tintasSello(color);
  let s = '';
  if (fondo && t.fondo) s += `<circle cx="50" cy="50" r="50" fill="${t.fondo}"/>`;
  s += `<circle cx="50" cy="50" r="${SELLO.aroExt}" fill="none" stroke="${t.trazo}" stroke-width="${SELLO.trazoExt}"/>`;
  const op = { rb: SELLO.rb, cap: SELLO.cap, color: t.trazo };
  s += modo === 'texto' ? anilloTexto(anillo, primera, op) : anilloContorno(anillo, primera, op);
  if (SELLO.aroInt) s += `<circle cx="50" cy="50" r="${SELLO.aroInt}" fill="none" stroke="${t.trazo}" stroke-width="${SELLO.trazoInt}"/>`;
  s += centro(t);
  return envolver({ vb: [0, 0, 100, 100], cuerpo: s, tam, titulo, decorativo, clase });
}

const separado = (t) => `${mayus(t).trim().replace(/[\s·•.]*$/, (m) => (m.includes('.') ? '.' : ''))} · `;

export function sello({ texto, color = 'tinta', fondo = false, tam, modo = 'contorno', titulo, decorativo = false, clase = '' } = {}) {
  const etiqueta = texto ?? `${brand.lema} · ${brand.nombre}`;
  const partes = String(etiqueta).split('·').map((x) => x.trim()).filter(Boolean);
  const anillo = partes.map(separado).join('');
  return construirSello({
    anillo, primera: mayus(partes[0] ?? ''), color, fondo, tam, modo, titulo: titulo ?? etiqueta, decorativo,
    clase: ['marca', 'marca--sello', clase].filter(Boolean).join(' '),
    centro: (tt) => {
      if (tt.trazo === 'currentColor') return plato(50, 50, SELLO.plato, { uno: 'currentColor' });
      const m = medidasPlato(50, 50, SELLO.plato);
      return plato(50, 50, SELLO.plato, { uno: tt.trazo, pintarSol: false })
        + `<circle cx="${num(m.sol.cx)}" cy="${num(m.sol.cy)}" r="${num(m.sol.r)}" fill="${tt.acento}"/>`;
    },
  });
}

/** Nombre corto de una sucursal («Plato & Co. Centro» → «Centro»). */
export const nombreCorto = (s) => String(s?.nombre ?? '').replace(brand.nombre, '').trim() || String(s?.nombre ?? '');

export function selloSucursal(n, { color = 'tinta', fondo = false, tam, modo = 'contorno', decorativo = false, clase = '' } = {}) {
  const i = Number(n);
  const lista = brand.sucursales || [];
  if (!Number.isInteger(i) || i < 1 || i > lista.length) return '';
  const corto = nombreCorto(lista[i - 1]);
  const nn = String(i).padStart(2, '0');
  const etiqueta = `Sucursal ${nn} · ${corto}`;
  return construirSello({
    anillo: `${separado(corto)}${separado(`Sucursal ${nn}`)}${separado(brand.nombre)}`, primera: mayus(corto),
    color, fondo, tam, modo, titulo: etiqueta, decorativo,
    clase: ['marca', 'marca--sucursal', clase].filter(Boolean).join(' '),
    centro: (tt) => {
      // el plato (borde + pozo, sin sol) y la cifra en el pozo, en el color de acento
      const R = SELLO.plato;
      const { items, ancho } = corrida(nn);
      const k = 24 / CAP;
      const ox = 50 - (ancho * k) / 2; const base = 50 + 12;
      return plato(50, 50, R, { uno: tt.trazo, conSol: false, conPozo: false })
        + `<path fill="${tt.acento}" d="${pathGlifos(items, ox, base, k, 2)}"/>`;
    },
  });
}

// ---------- & de firma ----------
export function ampersand({ color = 'oro', estilo = 'relleno', tam, decorativo = true, titulo = '&', clase = '' } = {}) {
  const g = GLIFOS['&'];
  const p = paleta();
  const col = { tinta: p.tinta, crema: p.crema, oro: p.oro, tomate: p.tomate, actual: 'currentColor' }[color] ?? p.oro;
  const [, d, x0, y0, x1, y1] = g;
  const contorno = estilo === 'contorno';
  const sw = (y1 - y0) * K * 0.012;
  const pad = contorno ? sw : 0;
  const vb = [x0 * K - pad, y0 * K - pad, (x1 - x0) * K + 2 * pad, (y1 - y0) * K + 2 * pad];
  const path = transformar(d, [K, 0, 0, K, 0, 0], 1);
  const cuerpo = contorno
    ? `<path fill="none" stroke="${col}" stroke-width="${num(sw)}" stroke-linejoin="round" d="${path}"/>`
    : `<path fill="${col}" d="${path}"/>`;
  return envolver({ vb, cuerpo, tam, titulo, decorativo, clase: ['marca', 'marca--amp', clase].filter(Boolean).join(' ') });
}

// ---------- Patrón ----------
/** Mosaico de 120×120: plato, &, tenedor, vapor y un «sol» suelto. Plano, una tinta con opacidad baja. */
export function patronSvg({ tono = 'claro' } = {}) {
  const p = paleta();
  const col = tono === 'oscuro' ? p.crema : p.tinta;
  const op = tono === 'oscuro' ? 0.07 : 0.075;
  const g = GLIFOS['&'];
  const k = 24 / CAP; const a = (-12 * Math.PI) / 180;
  const ca = Math.cos(a) * k; const sa = Math.sin(a) * k;
  const amp = transformar(g[1], [ca, sa, -sa, ca, 78, 104], 1);
  const pl = plato(30, 32, 15, { uno: col, conPozo: true }).replace(/(\d+\.\d)\d/g, '$1');
  const tenedor = 'M88 12v6M91 12v6M94 12v6M88 18q3 4 6 0M91 21v16';
  const vapor = 'M20 104c-4-4 4-7 0-11s4-7 0-11M27 106c-4-4 4-7 0-11s4-7 0-11M34 104c-4-4 4-7 0-11s4-7 0-11';
  const cuerpo = `<g opacity="${op}" fill="${col}">${pl}<path d="${amp}"/><circle cx="66" cy="62" r="3"/><circle cx="112" cy="70" r="1.6"/>`
    + `<g fill="none" stroke="${col}" stroke-width="1.8" stroke-linecap="round"><path transform="rotate(24 91 24)" d="${tenedor}"/><path d="${vapor}"/></g></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" aria-hidden="true" focusable="false">${cuerpo}</svg>`;
}
export const patron = ({ tono = 'claro' } = {}) => `url("${aDataUri(patronSvg({ tono }))}")`;

// ---------- Ticket ----------
const BORDES = {
  dientes: { w: 12, h: 7, abajo: 'M0 0H12L6 7Z', arriba: 'M0 7H12L6 0Z' },
  ondas: { w: 12, h: 6, abajo: 'M0 0H12A6 6 0 0 1 0 0Z', arriba: 'M0 6H12A6 6 0 0 0 0 6Z' },
  perforado: { w: 10, h: 5, abajo: 'M0 0H10V5H7.5A2.5 2.5 0 0 0 2.5 5H0Z', arriba: 'M0 5H10V0H7.5A2.5 2.5 0 0 1 2.5 0H0Z' },
};
const borde = (forma) => BORDES[forma] ?? BORDES.dientes;

export function ticketMascara({ forma = 'dientes', lado = 'abajo' } = {}) {
  const b = borde(forma);
  return `url("${aDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${b.w} ${b.h}" width="${b.w}" height="${b.h}"><path d="${lado === 'arriba' ? b.arriba : b.abajo}"/></svg>`)}")`;
}

export function ticketBorde({ forma = 'dientes', lado = 'abajo', color = 'currentColor', clase = '' } = {}) {
  const b = borde(forma);
  const id = `ticket-${(++contador).toString(36)}`;
  const c = color === 'currentColor' ? color : esc(color);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="${esc(['marca-ticket-borde', `marca-ticket-borde--${lado === 'arriba' ? 'arriba' : 'abajo'}`, clase].filter(Boolean).join(' '))}" width="100%" height="${b.h}" aria-hidden="true" focusable="false">`
    + `<defs><pattern id="${id}" width="${b.w}" height="${b.h}" patternUnits="userSpaceOnUse"><path fill="${c}" d="${lado === 'arriba' ? b.arriba : b.abajo}"/></pattern></defs>`
    + `<rect width="100%" height="${b.h}" fill="url(#${id})"/></svg>`;
}

/** Código de barras decorativo (no es un código real): mismo texto → mismas barras. */
export function barras(texto, { alto = 32, color = 'currentColor', clase = '' } = {}) {
  const codigos = [...String(texto ?? '')].map((ch) => ch.codePointAt(0));
  const anchos = [1, 1, 1, 1];
  for (const c of codigos) anchos.push((c % 3) + 1, ((c >> 2) % 2) + 1, ((c >> 3) % 3) + 1, ((c >> 5) % 2) + 1);
  anchos.push(1, 1, 1);
  let x = 0; let d = '';
  anchos.forEach((w, i) => { if (i % 2 === 0) d += `M${x} 0h${w}v${alto}h-${w}Z`; x += w; });
  const c = color === 'currentColor' ? color : esc(color);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x} ${alto}" width="${x * 2}" height="${alto}" preserveAspectRatio="none"${clase ? ` class="${esc(clase)}"` : ''} aria-hidden="true" focusable="false"><path fill="${c}" d="${d}"/></svg>`;
}

// ---------- Favicon ajustado al píxel ----------
// 16 px: borde 2 px + sol (sin pozo ni brillo). 32 px: borde 3 px, pozo de 1,25 px cortado bajo el sol.
export function favicon(tam = 32, { titulo } = {}) {
  const p = paleta();
  const s = Number(tam) === 16 ? 16 : 32;
  let cuerpo;
  if (s === 16) {
    cuerpo = `<circle cx="8" cy="8" r="7.75" fill="${p.tomate}"/><circle cx="8" cy="8" r="5.6" fill="${p.papel}"/><circle cx="9.35" cy="6.7" r="3.2" fill="${p.oro}"/>`;
  } else {
    const m = medidasPlato(16, 16, 15.5);
    cuerpo = `<circle cx="16" cy="16" r="15.5" fill="${p.tomate}"/><circle cx="16" cy="16" r="12.4" fill="${p.papel}"/>`
      + `<path fill="${coloresPlato(p).pozo}" d="${sectorAnular(16, 16, 9.6, 8.35, m.corte.a1 + 4, m.corte.a2 - 4)}"/>`
      + `<circle cx="${num(m.sol.cx)}" cy="${num(m.sol.cy)}" r="6" fill="${p.oro}"/>`;
  }
  return envolver({ vb: [0, 0, s, s], cuerpo, tam: s, titulo: titulo ?? brand.nombre, decorativo: false });
}

// ---------- Variables CSS en tiempo de ejecución (derivadas de brand.js) ----------
export function instalarMarca(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc?.documentElement?.style) return;
  const st = doc.documentElement.style;
  st.setProperty('--marca-patron-claro', patron({ tono: 'claro' }));
  st.setProperty('--marca-patron-oscuro', patron({ tono: 'oscuro' }));
}
instalarMarca();
