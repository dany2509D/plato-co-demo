/**
 * Geometría pura de la identidad (bloque V). Sin imports: la usan `src/config/brand.js` (logoSvg de la cabecera)
 * y `src/ui/brand-marks.js` (todas las marcas). Ángulos en grados, 0 = arriba, sentido horario.
 *
 * EL PLATO (símbolo maestro): plato de peltre visto desde arriba.
 *   borde esmaltado (tomate) · cuerpo (papel) · pozo (aro fino) · «sol» (yema/oro) descentrado arriba a la derecha
 *   con su brillo · brillo del esmalte en el borde, arriba a la izquierda.
 *   Proporciones respecto del radio R:  borde interior .84R · pozo .58R (trazo .045R) · sol .32R desplazado (+.115R, −.115R)
 */

/** Número compacto (2 decimales, sin -0). */
export const num = (n) => {
  const v = Math.round(n * 100) / 100;
  return Object.is(v, -0) ? '0' : String(v);
};

const rad = (a) => ((a - 90) * Math.PI) / 180;
const punto = (cx, cy, r, a) => [cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))];

/** Círculo como subtrayecto (para combinar con evenodd). */
export const circulo = (cx, cy, r) =>
  `M${num(cx - r)} ${num(cy)}a${num(r)} ${num(r)} 0 1 0 ${num(2 * r)} 0a${num(r)} ${num(r)} 0 1 0 ${num(-2 * r)} 0Z`;

/** Sector anular (relleno) entre a1 y a2. */
export function sectorAnular(cx, cy, R, r, a1, a2) {
  const g = (((a2 - a1) % 360) + 360) % 360;
  const l = g > 180 ? 1 : 0;
  const [x1, y1] = punto(cx, cy, R, a1); const [x2, y2] = punto(cx, cy, R, a2);
  const [x3, y3] = punto(cx, cy, r, a2); const [x4, y4] = punto(cx, cy, r, a1);
  return `M${num(x1)} ${num(y1)}A${num(R)} ${num(R)} 0 ${l} 1 ${num(x2)} ${num(y2)}L${num(x3)} ${num(y3)}A${num(r)} ${num(r)} 0 ${l} 0 ${num(x4)} ${num(y4)}Z`;
}

/** Arco abierto (para trazos). */
export function arco(cx, cy, r, a1, a2) {
  const g = (((a2 - a1) % 360) + 360) % 360;
  const [x1, y1] = punto(cx, cy, r, a1); const [x2, y2] = punto(cx, cy, r, a2);
  return `M${num(x1)} ${num(y1)}A${num(r)} ${num(r)} 0 ${g > 180 ? 1 : 0} 1 ${num(x2)} ${num(y2)}`;
}

/**
 * Medidas del plato para un radio R centrado en (cx, cy).
 * Ronda 2: el sol ya no lleva brillo (leía como ojo/lente) y es más grande y más descentrado: pisa el aro del pozo,
 * que se corta a su alrededor con un pequeño aire. Así el símbolo deja de ser concéntrico (ni diana ni cámara).
 */
export function medidasPlato(cx, cy, R) {
  const rs = R * 0.37;
  const ox = R * 0.19; const oy = -R * 0.17;
  const pozo = R * 0.58; const trazoPozo = R * 0.05; const aire = R * 0.05;
  const d = Math.hypot(ox, oy);
  // corte del aro del pozo bajo el sol: semiángulo del cruce entre el pozo y el sol (+ aire)
  const rc = rs + aire;
  const alfa = (Math.acos(Math.min(1, Math.max(-1, (pozo * pozo + d * d - rc * rc) / (2 * pozo * d)))) * 180) / Math.PI;
  const fi = (Math.atan2(ox, -oy) * 180) / Math.PI; // dirección del sol (0 = arriba, horario)
  return {
    R, ri: R * 0.84, pozo, trazoPozo, aire,
    sol: { cx: cx + ox, cy: cy + oy, r: rs },
    corte: { a1: fi + alfa, a2: fi - alfa + 360 }, // tramo visible del pozo
    brillo: { r: R * 0.92, a1: 292, a2: 326, ancho: R * 0.055 }, // brillo del esmalte (arriba a la izquierda)
  };
}

/**
 * Plato como fragmento SVG.
 *   color: { borde, cuerpo, pozo, sol, brillo }  → versión a todo color (cada pieza su color)
 *   uno: '#hex' | 'currentColor'                 → versión de una tinta (un solo path evenodd: los huecos dejan ver el fondo)
 *   conSol: false → sin yema (monograma, sello de sucursal): el pozo queda entero
 *   pintarSol: false → corta el pozo como si hubiera sol pero no lo pinta (para pintarlo aparte en otro color)
 *   conPozo: false → sin aro del pozo (tamaños diminutos)
 */
export function plato(cx, cy, R, { color, uno, conSol = true, pintarSol = true, conPozo = true } = {}) {
  const m = medidasPlato(cx, cy, R);
  const ranura = sectorAnular(cx, cy, m.brillo.r + m.brillo.ancho / 2, m.brillo.r - m.brillo.ancho / 2, m.brillo.a1, m.brillo.a2);
  const pozo = conSol
    ? sectorAnular(cx, cy, m.pozo + m.trazoPozo / 2, m.pozo - m.trazoPozo / 2, m.corte.a1, m.corte.a2)
    : circulo(cx, cy, m.pozo + m.trazoPozo / 2) + circulo(cx, cy, m.pozo - m.trazoPozo / 2);
  if (uno) {
    let d = circulo(cx, cy, R) + circulo(cx, cy, m.ri) + ranura;
    if (conPozo) d += pozo;
    if (conSol && pintarSol) d += circulo(m.sol.cx, m.sol.cy, m.sol.r);
    return `<path fill="${uno}" fill-rule="evenodd" d="${d}"/>`;
  }
  const c = color;
  let s = `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(R)}" fill="${c.borde}"/>`
    + `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(m.ri)}" fill="${c.cuerpo}"/>`
    + `<path fill="${c.brillo}" d="${ranura}"/>`;
  if (conPozo) s += `<path fill="${c.pozo}" fill-rule="evenodd" d="${pozo}"/>`;
  if (conSol && pintarSol) s += `<circle cx="${num(m.sol.cx)}" cy="${num(m.sol.cy)}" r="${num(m.sol.r)}" fill="${c.sol}"/>`;
  return s;
}

/** Mezcla lineal de dos hex (t = 0 → a, 1 → b). */
export function mezcla(a, b, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const x = p(a); const y = p(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

/** Colores de pieza del plato a partir de la paleta de marca. */
export const coloresPlato = (pal) => ({
  borde: pal.tomate, cuerpo: pal.papel, pozo: mezcla(pal.papel, pal.tomate, 0.2), sol: pal.oro, brillo: mezcla(pal.tomate, pal.papel, 0.45),
});

/**
 * Aplica una matriz afín [a b c d e f] a un path absoluto (M L H V Q C Z, como los que da fontTools) y lo
 * devuelve en M/L/Q/C/Z con 2 decimales. Sirve para contornear texto sin atributos transform.
 */
export function transformar(d, [a, b, c, dd, e, f], dec = 2) {
  const k = 10 ** dec;
  const n = (v) => { const r = Math.round(v * k) / k; return Object.is(r, -0) ? '0' : String(r); };
  const P = (x, y) => `${n(a * x + c * y + e)} ${n(b * x + dd * y + f)}`;
  const tok = d.match(/[MLHVQCZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [];
  let i = 0; let cmd = ''; let x = 0; let y = 0; let out = '';
  const sig = () => parseFloat(tok[i++]);
  while (i < tok.length) {
    if (/[A-Z]/i.test(tok[i])) { cmd = tok[i++].toUpperCase(); if (cmd === 'Z') { out += 'Z'; continue; } }
    switch (cmd) {
      case 'M': x = sig(); y = sig(); out += `M${P(x, y)}`; cmd = 'L'; break;
      case 'L': x = sig(); y = sig(); out += `L${P(x, y)}`; break;
      case 'H': x = sig(); out += `L${P(x, y)}`; break;
      case 'V': y = sig(); out += `L${P(x, y)}`; break;
      case 'Q': { const x1 = sig(); const y1 = sig(); x = sig(); y = sig(); out += `Q${P(x1, y1)} ${P(x, y)}`; break; }
      case 'C': { const x1 = sig(); const y1 = sig(); const x2 = sig(); const y2 = sig(); x = sig(); y = sig(); out += `C${P(x1, y1)} ${P(x2, y2)} ${P(x, y)}`; break; }
      default: i++; // token inesperado: se ignora sin lanzar
    }
  }
  return out;
}

/** SVG → data-URI apto para CSS url("…") (solo codifica lo necesario; comillas dobles → simples). */
export function aDataUri(svg) {
  const limpio = String(svg).replace(/\s+/g, ' ').replace(/> </g, '><').replace(/"/g, "'").trim();
  return 'data:image/svg+xml,' + limpio.replace(/[\r\n%#()<>?[\\\]^`{|}]/g, encodeURIComponent);
}
