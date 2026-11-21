// Ilustraciones SVG planas (no hay fotos). Tonos tomados de tokens.css (+ sombras/luces derivadas).
// La categoría fija la escena y el fondo; el nombre elige la variante (doble, penne, churrasco…);
// el id del producto fija, de forma determinista, el motivo del fondo, el giro y las migas.
const C = {
  gold: '#efc547', goldD: '#d9a52a', goldL: '#f6d677', ember: '#8e1f16', emberD: '#731811', toast: '#c46f24',
  char: '#281006', card: '#402011', brown: '#5a2c15', canvas: '#ece2d0', paper: '#f6f0e4', linen: '#e0d3bb',
  rule: '#c9bba2', herb: '#7c8b34', herbD: '#5c6826', herbL: '#a3b04a', tomato: '#c8402a', coral: '#d9775f',
};

function hash(s) {
  let h = 2166136261;
  for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rnd(seed) { // mulberry32
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const norm = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const f1 = (n) => Math.round(n * 10) / 10;

// Primitivas
const c = (x, y, r, f, o = '') => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="${f}"${o}/>`;
const e = (x, y, rx, ry, f, o = '') => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${rx}" ry="${ry}" fill="${f}"${o}/>`;
const p = (d, f, o = '') => `<path d="${d}" fill="${f}"${o}/>`;
const s = (d, col, w, o = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${o}/>`;
const rr = (x, y, w, h, r, f, o = '') => `<rect x="${f1(x)}" y="${f1(y)}" width="${w}" height="${h}" rx="${r}" fill="${f}"${o}/>`;
const rot = (a, x, y) => ` transform="rotate(${f1(a)} ${f1(x)} ${f1(y)})"`;
const g = (inner, t) => `<g transform="${t}">${inner}</g>`;
const op = (o) => ` opacity="${o}"`;
const veces = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join('');

// Piezas compartidas
const sombra = (x, y, rx, ry) => e(x, y, rx, ry, C.char, op(0.28));
const plato = (x, y, rx, ry, rim = C.paper, fondo = C.canvas) => sombra(x, y + 10, rx, ry) + e(x, y, rx, ry, rim) + e(x, y + 3, rx * 0.74, ry * 0.7, fondo);
const vapor = (x, y, col = C.paper) => veces(3, (i) => s(`M${x + i * 22} ${y - (i % 2) * 8} q-9 -12 0 -24 t0 -24`, col, 5, op(0.7)));
const rama = (x, y, a, col = C.herb) => g(s('M0 0 L50 0', col, 3) + veces(4, (i) => e(10 + i * 11, i % 2 ? 6 : -6, 9, 4, col, rot(i % 2 ? 32 : -32, 10 + i * 11, i % 2 ? 6 : -6))), `translate(${x} ${y}) rotate(${a})`);
const limon = (x, y, r, a) => g(p(`M${-r} 0 A${r} ${r} 0 0 0 ${r} 0Z`, C.paper) + p(`M${-r + 4} 0 A${r - 4} ${r - 4} 0 0 0 ${r - 4} 0Z`, C.gold) + s(`M0 2 L${-r * 0.55} ${r * 0.6} M0 2 L0 ${r - 6} M0 2 L${r * 0.55} ${r * 0.6}`, C.goldL, 2.5), `translate(${x} ${y}) rotate(${a})`);
const rueda = (x, y, r, a = C.gold, b = C.goldL) => c(x, y, r, C.paper) + c(x, y, r - 4, a) + veces(6, (i) => p(`M${x} ${y} L${f1(x + Math.cos(i * 1.047) * (r - 7))} ${f1(y + Math.sin(i * 1.047) * (r - 7))} L${f1(x + Math.cos(i * 1.047 + 0.8) * (r - 7))} ${f1(y + Math.sin(i * 1.047 + 0.8) * (r - 7))}Z`, b));
const semillas = (R, n, x0, x1, y0, y1, col = C.paper) => veces(n, () => { const x = x0 + R() * (x1 - x0); const y = y0 + R() * (y1 - y0); return e(x, y, 5.5, 2.8, col, rot(R() * 70 - 35, x, y)); });
const pepinillo = (x, y, r) => c(x, y, r, C.herbD) + c(x, y, r - 4, C.herbL) + veces(5, (i) => c(x + Math.cos(i * 1.26) * r * 0.45, y + Math.sin(i * 1.26) * r * 0.45, 1.8, C.herbD));
const tomate = (x, y, r) => c(x, y, r, C.tomato) + c(x, y, r - 5, '#e0603f') + veces(4, (i) => e(x + Math.cos(i * 1.57 + 0.6) * r * 0.42, y + Math.sin(i * 1.57 + 0.6) * r * 0.42, 3.4, 2, C.goldL));

// Fondo: un motivo por producto (halo, rayos, anillos o mesa)
function fondo(bg, alt, v) {
  const k = v % 4;
  const cx = 140 + (v >>> 3) % 50;
  const cy = 100 + (v >>> 6) % 40;
  let m;
  if (k === 0) m = c(cx, cy, 120, alt);
  else if (k === 1) m = p(veces(12, (i) => { const a = i * 0.5236; const b = a + 0.22; return `M${cx} ${cy}L${f1(cx + Math.cos(a) * 340)} ${f1(cy + Math.sin(a) * 340)}L${f1(cx + Math.cos(b) * 340)} ${f1(cy + Math.sin(b) * 340)}Z`; }), alt);
  else if (k === 2) m = veces(3, (i) => `<circle cx="${cx}" cy="${cy}" r="${60 + i * 44}" fill="none" stroke="${alt}" stroke-width="14"/>`);
  else m = rr(0, 168 + (v >>> 4) % 20, 320, 80, 0, alt);
  return rr(0, 0, 320, 240, 0, bg) + m;
}

// ---------- Hamburguesas ----------
function hamburguesa(n, R) {
  const doble = n.includes('doble'); const pollo = n.includes('pollo'); const veg = n.includes('veget');
  let y = 206; let o = sombra(160, y + 2, 118, 14);
  o += p(`M70 ${y - 28} H250 Q252 ${y} 160 ${y} Q68 ${y} 70 ${y - 28}Z`, C.goldD); y -= 26;
  const carne = () => {
    if (pollo) o += rr(56, y - 28, 208, 30, 15, C.toast) + veces(10, (i) => c(66 + i * 21, y - 26, 7, C.toast)) + veces(8, () => c(70 + R() * 180, y - 18 + R() * 12, 2.2, C.goldD));
    else o += rr(58, y - 28, 204, 30, 15, veg ? C.herbD : C.card) + veces(7, (i) => e(78 + i * 27, y - 13 + (i % 2) * 5, 7, 2.6, veg ? C.herbL : C.char, op(0.75)));
    y -= 26;
  };
  const queso = () => {
    const b = y - 2;
    o += p(`M58 ${b} H262 L254 ${b + 10} L242 ${b + 4} L234 ${b + 20} L222 ${b + 5} L198 ${b + 8} L190 ${b + 26} L178 ${b + 6} L146 ${b + 8} L136 ${b + 20} L126 ${b + 5} L102 ${b + 10} L92 ${b + 22} L82 ${b + 6} L64 ${b + 9}Z`, C.goldL);
    y -= 6;
  };
  carne(); queso();
  if (doble) { carne(); queso(); }
  if (n.includes('tocino')) { o += s(`M48 ${y - 2} q15 -12 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0`, C.tomato, 10) + s(`M50 ${y - 3} q15 -12 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t28 0`, C.goldL, 2.5); y -= 7; }
  o += e(112, y - 3, 48, 9, C.tomato) + e(210, y - 4, 48, 9, C.tomato); y -= 7;
  o += p(`M50 ${y + 6} ${veces(11, () => 'q10.5 -17 21 0')} L268 ${y + 8} L50 ${y + 8}Z`, C.herb); y -= 6;
  if (n.includes('picante')) o += veces(4, (i) => c(92 + i * 46, y + 1, 9, C.herbL) + c(92 + i * 46, y + 1, 4, C.goldL));
  const t = y - 82;
  o += p(`M60 ${y + 2} Q58 ${t} 160 ${t} Q262 ${t} 260 ${y + 2}Z`, C.gold);
  o += p(`M160 ${t} Q262 ${t} 260 ${y + 2} L236 ${y + 2} Q240 ${t + 18} 160 ${t}Z`, C.goldD, op(0.85));
  o += e(116, t + 28, 26, 9, C.goldL, rot(-18, 116, t + 28));
  o += semillas(R, 9, 92, 222, t + 16, y - 26);
  return doble ? g(o, 'translate(160 208) scale(.9) translate(-160 -208)') : o;
}

// ---------- Pastas ----------
function pasta(n, R) {
  let o = plato(160, 142, 136, 72);
  if (n.includes('lasana')) {
    const capas = [C.goldL, C.ember, C.goldL, C.ember, C.goldL];
    o += p('M96 168 L118 96 L230 104 L224 176Z', C.toast, op(0.35));
    o += veces(5, (i) => p(`M100 ${170 - i * 14} L224 ${176 - i * 14} L224 ${164 - i * 14} L100 ${158 - i * 14}Z`, capas[i]));
    o += p('M100 102 L224 108 L210 92 L120 86Z', C.gold) + veces(6, () => c(124 + R() * 86, 92 + R() * 12, 3.5, C.toast));
    return o + rama(150, 84, -18) + vapor(132, 70);
  }
  if (n.includes('penne')) {
    o += e(160, 142, 92, 46, C.herb, op(0.55));
    o += veces(16, (i) => { const a = i * 2.4; const r = 14 + (i % 4) * 16; const x = 160 + Math.cos(a) * r * 1.6; const y = 140 + Math.sin(a) * r * 0.62; return g(rr(-16, -7, 32, 14, 3, C.goldL) + s('M-10 -3 L10 -3 M-10 3 L10 3', C.goldD, 2), `translate(${f1(x)} ${f1(y)}) rotate(${f1(R() * 180)})`); });
    return o + veces(7, () => c(110 + R() * 100, 120 + R() * 40, 5, C.herbD)) + veces(5, () => e(110 + R() * 100, 120 + R() * 40, 4, 2.5, C.paper)) + vapor(134, 98);
  }
  if (n.includes('macarron')) {
    o += e(160, 144, 94, 46, C.gold);
    o += veces(18, (i) => { const a = i * 2.4; const r = 10 + (i % 5) * 15; const x = 160 + Math.cos(a) * r * 1.6; const y = 142 + Math.sin(a) * r * 0.6; return s('M-11 0 A11 11 0 0 1 11 0', C.goldL, 9, ` transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(R() * 360)})"`); });
    return o + veces(14, () => c(100 + R() * 120, 116 + R() * 52, 2.4, C.toast)) + vapor(134, 98);
  }
  const fetu = n.includes('fettuccine');
  const w = fetu ? 12 : 7;
  o += veces(6, (i) => `<ellipse cx="160" cy="${140 - i * 3}" rx="${96 - i * 15}" ry="${44 - i * 7}" fill="none" stroke="${i % 2 ? C.goldD : C.goldL}" stroke-width="${w}" stroke-dasharray="${90 + i * 14} ${10 + i * 3}" stroke-linecap="round"${rot(R() * 60, 160, 140 - i * 3)}/>`);
  if (fetu) {
    o += p('M124 122 q14 -22 40 -14 q30 -8 36 14 q-6 18 -40 16 q-30 2 -36 -16Z', C.paper);
    o += veces(10, () => c(120 + R() * 84, 110 + R() * 30, 1.8, C.char)) + veces(6, () => c(118 + R() * 88, 108 + R() * 34, 3, C.herb));
  } else {
    o += p('M124 124 q8 -26 38 -18 q30 -10 38 14 q-2 22 -38 20 q-36 4 -38 -16Z', C.ember);
    o += veces(3, (i) => c(140 + i * 20, 118 + (i % 2) * 8, 9, C.brown) + c(137 + i * 20, 115 + (i % 2) * 8, 3, C.toast));
    o += veces(6, () => rr(118 + R() * 80, 106 + R() * 30, 6, 3, 1, C.paper));
  }
  o += e(176, 100, 14, 7, C.herb, rot(-30, 176, 100)) + e(190, 106, 12, 6, C.herbD, rot(20, 190, 106));
  o += g(rr(-5, -120, 10, 104, 5, C.card) + rr(-14, -24, 28, 14, 4, C.card) + veces(4, (i) => rr(-14 + i * 8, -10, 4, 40, 2, C.card)), 'translate(232 160) rotate(28)');
  return o + vapor(126, 82);
}

// ---------- Platos fuertes ----------
function fuerte(n, R) {
  let o = plato(160, 150, 138, 66);
  const parrilla = (x0, x1, y0, y1, col) => veces(4, (i) => s(`M${x0 + i * ((x1 - x0) / 4)} ${y0} L${x0 + i * ((x1 - x0) / 4) + 34} ${y1}`, col, 5, op(0.8)));
  if (n.includes('camaron')) {
    o += veces(6, (i) => { const x = 104 + (i % 3) * 52; const y = 128 + Math.floor(i / 3) * 34; return g(s('M0 0 A20 20 0 1 1 14 18', C.tomato, 14) + s('M0 0 A20 20 0 1 1 14 18', C.coral, 5) + p('M10 16 L26 26 L14 30Z', C.tomato), `translate(${x} ${y}) rotate(${f1(R() * 60 - 30)})`); });
    o += veces(6, () => e(100 + R() * 120, 120 + R() * 50, 6, 4, C.paper)) + veces(9, () => c(96 + R() * 128, 118 + R() * 56, 2.6, C.herb));
    return o + limon(236, 168, 22, -20) + vapor(130, 96);
  }
  if (n.includes('costilla')) {
    o += veces(6, (i) => rr(98 + i * 24, 104, 12, 36, 6, C.paper));
    o += rr(84, 118, 168, 58, 26, C.emberD) + veces(5, (i) => s(`M${104 + i * 28} 126 l14 40`, C.ember, 7)) + veces(8, () => c(96 + R() * 140, 126 + R() * 40, 2.4, C.goldL));
    return o + rama(70, 170, -12) + vapor(128, 92);
  }
  if (n.includes('pescado')) {
    o += p('M68 148 Q100 112 172 114 Q238 116 252 148 Q238 180 172 182 Q100 182 68 148Z', C.goldL);
    o += veces(4, (i) => s(`M${104 + i * 30} 124 q10 24 0 48`, C.goldD, 4));
    return o + limon(196, 120, 22, 200) + limon(222, 128, 18, 190) + rama(92, 176, -8) + vapor(130, 92);
  }
  if (n.includes('pollo')) {
    o += p('M82 156 Q78 116 142 112 Q214 108 232 140 Q244 174 188 184 Q108 194 82 156Z', C.toast) + parrilla(106, 210, 122, 176, C.emberD);
    return o + limon(222, 118, 22, 210) + rama(74, 186, -20) + vapor(130, 92);
  }
  const chuleta = n.includes('chuleta');
  if (chuleta) o += rr(196, 138, 74, 16, 8, C.paper) + c(268, 138, 11, C.paper) + c(268, 154, 11, C.paper);
  o += p(chuleta ? 'M80 152 Q78 112 138 110 Q198 108 210 142 Q216 180 158 186 Q86 192 80 152Z' : 'M64 150 Q68 112 130 110 Q204 102 240 124 Q266 142 246 170 Q220 190 148 186 Q70 184 64 150Z', C.emberD);
  o += s(chuleta ? 'M86 150 Q86 118 138 116' : 'M70 150 Q72 118 130 116', C.paper, 5, op(0.55)) + parrilla(chuleta ? 96 : 92, chuleta ? 190 : 230, 120, 178, C.char);
  o += veces(10, () => c(100 + R() * 120, 130 + R() * 40, 3, C.herbL));
  return o + rama(chuleta ? 220 : 196, chuleta ? 186 : 194, -14) + vapor(126, 88);
}

// ---------- Ensaladas y bowls ----------
function bowl(n, R) {
  let o = sombra(160, 214, 126, 14) + e(160, 120, 124, 30, C.card);
  o += p('M42 122 Q52 70 104 74 Q132 46 176 60 Q228 50 252 82 Q280 92 278 122Z', C.herb);
  o += veces(9, () => { const x = 70 + R() * 180; const y = 76 + R() * 36; return e(x, y, 16, 8, R() > 0.5 ? C.herbL : C.herbD, rot(R() * 180, x, y)); });
  if (n.includes('cesar')) o += veces(7, () => { const x = 84 + R() * 150; const y = 78 + R() * 30; return rr(x, y, 14, 14, 3, C.goldD, rot(R() * 90, x, y)); }) + veces(6, () => { const x = 84 + R() * 150; const y = 76 + R() * 34; return rr(x, y, 18, 5, 2, C.paper, rot(R() * 90, x, y)); });
  else if (n.includes('pollo')) o += e(118, 92, 54, 22, C.paper) + veces(14, () => e(80 + R() * 76, 80 + R() * 24, 3, 1.4, C.rule)) + veces(4, (i) => g(rr(-20, -9, 40, 18, 6, C.toast) + s('M-10 -9 l6 18 M2 -9 l6 18', C.emberD, 2.5), `translate(${186 + (i % 2) * 34} ${80 + Math.floor(i / 2) * 22}) rotate(${-14 + i * 8})`));
  else if (n.includes('griega')) o += veces(6, () => c(80 + R() * 160, 80 + R() * 30, 8, C.char) + '') + veces(5, () => { const x = 84 + R() * 150; const y = 74 + R() * 32; return rr(x, y, 16, 16, 2, C.paper, rot(R() * 40, x, y)); }) + veces(3, () => tomate(90 + R() * 140, 84 + R() * 24, 11));
  else if (n.includes('veget')) o += veces(12, () => c(84 + R() * 150, 76 + R() * 34, 6, C.goldL)) + e(206, 86, 26, 18, C.herbL) + e(206, 86, 18, 12, C.goldL) + c(206, 86, 7, C.brown);
  else o += veces(4, () => tomate(86 + R() * 148, 80 + R() * 28, 11)) + veces(4, () => { const x = 86 + R() * 148; const y = 80 + R() * 28; return c(x, y, 10, C.herbD) + c(x, y, 7, C.herbL); }) + veces(10, () => c(86 + R() * 148, 78 + R() * 32, 3, C.gold));
  o += p('M36 120 A124 30 0 0 0 284 120 Q280 210 160 214 Q40 210 36 120Z', C.ember);
  o += s('M52 160 Q160 192 268 160', C.paper, 6, op(0.85)) + s('M40 124 A122 28 0 0 0 280 124', C.goldL, 3, op(0.7));
  return o;
}

// ---------- Postres ----------
function postre(n, R) {
  let o = plato(160, 168, 132, 54);
  if (n.includes('cheesecake') || n.includes('tarta')) {
    const tarta = n.includes('tarta');
    o += p('M84 160 L224 116 L236 150 L96 194Z', tarta ? C.goldD : C.goldL) + p('M96 194 L236 150 L236 162 L96 206Z', C.toast);
    o += p('M84 160 L224 116 L236 150 L96 194Z', tarta ? C.gold : C.paper, ' transform="translate(0 -26)"');
    o += p('M84 134 L84 160 L96 194 L96 168Z', tarta ? C.goldD : C.rule);
    if (tarta) o += veces(4, (i) => s(`M${100 + i * 32} ${148 - i * 10} l20 30`, C.toast, 5) + s(`M${96 + i * 34} ${160 - i * 10} l40 -12`, C.toast, 5)) + s('M224 90 L236 124', C.toast, 9);
    else o += p('M150 116 q12 -16 30 -10 q18 2 18 14 q-10 14 -32 10 q-18 -2 -16 -14Z', C.tomato) + c(166, 112, 5, C.coral) + c(184, 110, 4, C.coral);
    return o + rama(66, 196, -16, C.herbL);
  }
  if (n.includes('flan')) {
    o += e(160, 188, 96, 18, C.toast, op(0.9));
    o += p('M104 186 L122 116 Q160 104 198 116 L216 186 Q160 198 104 186Z', C.goldL) + e(160, 116, 38, 10, C.toast);
    o += veces(4, (i) => p(`M${130 + i * 18} 120 q4 ${18 + (i % 2) * 14} 0 ${24 + (i % 2) * 14} q-4 -6 0 -${24 + (i % 2) * 14}Z`, C.toast));
    return o + s('M120 140 Q124 170 140 182', C.paper, 5, op(0.6)) + rama(170, 106, -60, C.herbL);
  }
  if (n.includes('helado') && !n.includes('brownie')) {
    o += p('M104 150 H216 Q212 196 160 200 Q108 196 104 150Z', C.paper) + rr(144, 196, 32, 10, 4, C.paper);
    o += c(132, 140, 30, C.canvas) + c(188, 140, 30, C.canvas) + c(160, 112, 32, C.paper) + veces(10, () => c(118 + R() * 86, 104 + R() * 44, 1.8, C.brown));
    o += rr(178, 70, 16, 54, 4, C.toast, rot(24, 186, 96)) + s('M178 74 l10 46', C.goldD, 2, rot(24, 186, 96));
    return o + veces(8, () => rr(110 + R() * 100, 96 + R() * 50, 8, 3, 1.5, R() > 0.5 ? C.tomato : C.gold, rot(R() * 180, 150, 120)));
  }
  o += p('M88 128 L166 108 L226 126 L148 148Z', C.brown) + p('M88 128 L148 148 L148 196 L88 176Z', C.char) + p('M148 148 L226 126 L226 172 L148 196Z', '#3a1a0b');
  o += veces(10, () => c(100 + R() * 110, 116 + R() * 24, 2.4, C.char));
  o += c(196, 104, 32, C.paper) + p('M166 112 q6 18 14 6 q6 16 14 4 q8 14 16 2 q8 10 14 -6Z', C.paper);
  o += s('M100 130 l20 -14 l14 18 l18 -16 l14 18 l18 -14', C.gold, 4);
  return o + c(206, 74, 10, C.tomato) + s('M206 64 q4 -14 14 -18', C.herbD, 2.5);
}

// ---------- Bebidas ----------
function bebida(n, R) {
  let o = sombra(160, 214, 74, 10);
  if (n.includes('cafe')) {
    o += e(160, 206, 104, 18, C.canvas) + rr(96, 98, 124, 106, 18, C.paper) + s('M220 120 q38 0 36 30 q-2 28 -36 28', C.paper, 14);
    o += e(158, 100, 60, 13, C.card) + e(150, 99, 30, 6, C.toast, op(0.85)) + rr(96, 152, 124, 12, 0, C.gold);
    return o + vapor(132, 82);
  }
  if (n.includes('agua')) {
    o += rr(124, 70, 72, 140, 18, C.paper, op(0.45)) + p('M138 34 h44 v22 q14 8 14 22 H124 q0 -14 14 -22Z', C.paper, op(0.45));
    o += rr(130, 100, 60, 104, 12, C.linen, op(0.75)) + rr(138, 22, 44, 16, 4, C.char) + rr(124, 120, 72, 44, 0, C.gold) + s('M136 136 h48 M136 148 h30', C.char, 3);
    return o + veces(6, () => c(140 + R() * 40, 176 + R() * 24, 2.4, C.paper));
  }
  const liq = n.includes('limon') ? C.goldL : n.includes('naranja') ? C.gold : n.includes('te ') || n.startsWith('te') ? C.ember : n.includes('batido') ? C.coral : C.card;
  o += p('M106 44 L214 44 L200 208 Q160 216 120 208Z', C.paper, op(0.4));
  o += p('M110 80 L210 80 L198 204 Q160 212 122 204Z', liq);
  if (n.includes('refresco')) o += veces(12, () => c(126 + R() * 66, 96 + R() * 100, 1.5 + R() * 2.5, C.paper, op(0.7)));
  else if (!n.includes('batido')) o += veces(3, (i) => rr(126 + i * 22, 92 + (i % 2) * 22, 26, 26, 5, C.paper, op(0.5) + rot(R() * 40 - 20, 139 + i * 22, 105)));
  o += s('M118 56 L128 196', C.paper, 5, op(0.65));
  o += `<path d="M196 8 L170 150" fill="none" stroke="${C.paper}" stroke-width="10" stroke-linecap="round"/><path d="M196 8 L170 150" fill="none" stroke="${C.tomato}" stroke-width="10" stroke-dasharray="10 12"/>`;
  if (n.includes('batido')) o += veces(7, (i) => c(118 + i * 14, 70 - (i % 3) * 8, 18, C.paper)) + c(160, 30, 18, C.paper) + c(162, 14, 11, C.tomato) + s('M164 4 q6 -10 16 -10', C.herbD, 2.5);
  else if (n.includes('limon') || n.includes('naranja')) o += rueda(212, 50, 26, n.includes('limon') ? C.gold : C.goldD, n.includes('limon') ? C.goldL : C.gold) + e(122, 44, 14, 6, C.herb, rot(-30, 122, 44));
  else if (liq === C.ember) o += limon(214, 52, 24, 200);
  return o;
}

// ---------- Entradas ----------
function entrada(n, R) {
  let o = plato(160, 170, 134, 50);
  if (n.includes('sopa')) {
    o += e(160, 122, 120, 36, C.paper) + e(160, 124, 104, 27, C.tomato) + p('M40 124 A120 36 0 0 0 280 124 Q272 196 160 200 Q48 196 40 124Z', C.paper);
    o += s('M136 124 q10 -14 26 -6 q14 10 0 18 q-14 6 -20 -4', C.paper, 5) + veces(4, () => rr(110 + R() * 90, 112 + R() * 16, 12, 12, 2, C.goldD)) + e(186, 118, 12, 5, C.herb, rot(-24, 186, 118));
    return o + rr(40, 166, 240, 4, 2, C.rule) + vapor(130, 98);
  }
  if (n.includes('aros')) {
    o += veces(4, (i) => `<ellipse cx="${154 + (i % 2) * 12}" cy="${172 - i * 22}" rx="${54 - i * 3}" ry="16" fill="none" stroke="${C.toast}" stroke-width="17"/><ellipse cx="${154 + (i % 2) * 12}" cy="${172 - i * 22}" rx="${54 - i * 3}" ry="16" fill="none" stroke="${C.gold}" stroke-width="7" stroke-dasharray="6 7"/>`);
    return o + c(244, 176, 22, C.paper) + c(244, 176, 17, C.tomato) + vapor(128, 84);
  }
  if (n.includes('papas')) {
    o += veces(9, (i) => rr(118 + i * 10, 64 + R() * 30, 12, 96, 2, i % 2 ? C.gold : C.goldL, rot(R() * 24 - 12, 124 + i * 10, 150)));
    o += p('M104 116 L216 116 L202 206 L118 206Z', C.tomato) + p('M104 116 Q130 132 160 120 Q190 132 216 116 L214 128 L106 128Z', C.ember) + c(160, 166, 18, C.paper) + c(160, 166, 10, C.gold);
    return o;
  }
  if (n.includes('nachos')) {
    o += veces(11, () => { const x = 84 + R() * 150; const y = 120 + R() * 50; return p(`M${f1(x - 22)} ${f1(y + 16)} L${f1(x)} ${f1(y - 20)} L${f1(x + 22)} ${f1(y + 16)}Z`, R() > 0.4 ? C.gold : C.goldD, rot(R() * 120 - 60, x, y)); });
    o += s('M94 140 q20 -18 40 0 t40 0 t40 0 t30 4', C.goldL, 8) + veces(5, () => { const x = 96 + R() * 128; const y = 124 + R() * 46; return c(x, y, 8, C.herb) + c(x, y, 3.5, C.goldL); });
    return o + veces(8, () => rr(96 + R() * 128, 120 + R() * 50, 7, 7, 1.5, C.tomato));
  }
  if (n.includes('bastones')) {
    o += veces(5, (i) => g(rr(-46, -10, 92, 20, 10, C.toast) + veces(6, () => c(-40 + R() * 80, -6 + R() * 12, 2, C.goldD)), `translate(${130 + (i % 3) * 22} ${140 + Math.floor(i / 2) * 18}) rotate(${-24 + i * 9})`));
    o += s('M188 118 q16 -26 40 -30', C.goldL, 7) + c(244, 172, 22, C.paper) + c(244, 172, 17, C.tomato);
    return o;
  }
  o += veces(6, (i) => { const x = 104 + (i % 3) * 46; const y = 140 + Math.floor(i / 3) * 30; return g(e(0, 0, 26, 15, C.ember) + e(-6, -5, 12, 5, C.toast, op(0.8)) + rr(18, -5, 22, 10, 5, C.paper), `translate(${x} ${y}) rotate(${f1(R() * 50 - 25)})`); });
  o += veces(3, (i) => rr(222 + i * 10, 112, 9, 70, 4, C.herbL, rot(-14, 226 + i * 10, 150))) + c(84, 108, 20, C.paper) + c(84, 108, 15, C.canvas);
  return o;
}

const CATS = {
  Hamburguesas: [C.ember, C.emberD, hamburguesa],
  Pastas: [C.gold, C.goldD, pasta],
  'Platos fuertes': [C.char, C.card, fuerte],
  'Ensaladas y bowls': [C.linen, C.rule, bowl],
  Postres: [C.card, C.brown, postre],
  Bebidas: [C.toast, '#b5621c', bebida],
  Entradas: [C.emberD, C.ember, entrada],
};

export function dishArt(producto) {
  const v = hash(producto.id);
  const [bg, alt, dibujar] = CATS[producto.categoria] || CATS.Entradas;
  const R = rnd(v);
  const giro = f1(R() * 8 - 4);
  return `<svg class="dish-art" viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${fondo(bg, alt, v)}<g transform="rotate(${giro} 160 150)">${dibujar(norm(producto.nombre), R)}</g></svg>`;
}

// Composición del héroe: hamburguesa grande sobre disco brasa, cubiertos, ingredientes flotando y sello giratorio.
export function heroArt() {
  const R = rnd(20261111);
  const tomateFlot = (x, y, r, a) => g(tomate(0, 0, r), `translate(${x} ${y}) rotate(${a})`);
  const hoja = (x, y, a) => g(p('M0 0 Q30 -40 80 -18 Q60 18 0 0Z', C.herb) + s('M4 -1 Q40 -14 74 -16', C.herbL, 3), `translate(${x} ${y}) rotate(${a})`);
  const queso = (x, y, a) => g(rr(0, 0, 64, 64, 4, C.goldL) + c(18, 22, 6, C.gold) + c(44, 40, 8, C.gold) + c(40, 14, 4, C.gold), `translate(${x} ${y}) rotate(${a})`);
  const tenedor = g(rr(-11, 0, 22, 250, 11, C.paper) + rr(-24, -70, 48, 40, 10, C.paper) + veces(4, (i) => rr(-24 + i * 13.5, -170, 8, 110, 4, C.paper)), 'translate(170 400) rotate(-32)');
  const cuchillo = g(rr(-12, 0, 24, 200, 12, C.card) + p('M-14 0 L-14 -200 Q14 -190 14 -60 L14 0Z', C.linen), 'translate(490 420) rotate(30)');
  return `<svg class="hero-art" viewBox="0 0 640 640" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
    <circle cx="340" cy="330" r="300" fill="${C.ember}"/>
    <circle cx="340" cy="330" r="324" fill="none" stroke="${C.gold}" stroke-width="3" stroke-dasharray="1 14" stroke-linecap="round"/>
    ${tenedor}${cuchillo}
    ${sombra(330, 548, 250, 40)}${e(330, 534, 250, 48, C.paper)}${e(330, 538, 188, 34, C.canvas)}
    ${g(hamburguesa('hamburguesa clasica con tocino', R), 'translate(330 536) scale(1.95) translate(-160 -206)')}
    ${vapor(282, 150, C.canvas)}
    ${tomateFlot(560, 170, 34, 20)}${hoja(510, 300, -20)}${queso(60, 330, -14)}
    ${pepinillo(560, 470, 24)}${pepinillo(90, 470, 18)}
    ${g(`<circle r="34" fill="none" stroke="${C.paper}" stroke-width="12"/>`, 'translate(470 80) scale(1 .8) rotate(10)')}
    ${semillas(R, 7, 40, 600, 40, 620)}
    ${sello('hero-sello', 'HECHO AL MOMENTO ✦ HECHO AL MOMENTO ✦', 'P&amp;C', 'translate(118 140) rotate(-14)')}
  </svg>`;
}

// Sello circular dorado con texto en arco (Anton). `id` debe ser único en la página.
function sello(id, anillo, centro, t) {
  return `<g transform="${t}"><circle r="92" fill="${C.gold}"/><circle r="76" fill="none" stroke="${C.char}" stroke-width="1.5"/>
    <path id="${id}" d="M-60 0 a60 60 0 1 1 120 0 a60 60 0 1 1 -120 0" fill="none"/>
    <text font-family="Anton, Impact, sans-serif" font-size="17" letter-spacing="2.2" fill="${C.char}"><textPath href="#${id}">${anillo}</textPath></text>
    <text y="14" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="40" fill="${C.char}">${centro}</text></g>`;
}
export const selloArt = (id, anillo, centro) => `<svg class="sello-art" viewBox="-100 -100 200 200" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${sello(id, anillo, centro, 'rotate(0)')}</svg>`;
