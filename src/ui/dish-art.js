// Ilustraciones inline por categoría (no hay fotos reales). El id del producto fija pequeñas variaciones de color.
const TERRA = '#B4472A';
const AMAR = '#F5B82E';
const TINTA = '#2B1810';
const CREMA = '#FFF6E5';

function hash(s) {
  let h = 2166136261;
  for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const plato = (cx = 120, cy = 100, rx = 88, ry = 40) => `
  <ellipse cx="${cx}" cy="${cy + 8}" rx="${rx}" ry="${ry}" fill="${TINTA}" opacity=".16"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" stroke="${TINTA}" stroke-width="3"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.74}" ry="${ry * 0.72}" fill="${CREMA}" stroke="#EBD6B0" stroke-width="2"/>`;

const DIBUJOS = {
  Hamburguesas(v) {
    const pan = `hsl(${32 + (v % 12)} 78% ${58 + (v % 8)}%)`;
    const carne = `hsl(${14 + (v % 8)} 45% ${24 + (v % 10)}%)`;
    const semillas = [[96, 70], [112, 62], [130, 66], [146, 74], [122, 80], [104, 84], [140, 86]]
      .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.2" fill="${CREMA}" transform="rotate(${(x * 7) % 60 - 30} ${x} ${y})"/>`).join('');
    return `
      <ellipse cx="120" cy="132" rx="84" ry="14" fill="#fff" stroke="${TINTA}" stroke-width="3"/>
      <path d="M62 112 H178 Q178 128 120 128 Q62 128 62 112Z" fill="${pan}" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
      <rect x="58" y="96" width="124" height="17" rx="8" fill="${carne}" stroke="${TINTA}" stroke-width="3"/>
      <path d="M62 96 H178 L166 108 L150 98 L134 108 L118 98 L100 108 L84 98 L72 108Z" fill="${AMAR}" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M56 92 q9 -10 18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0" fill="none" stroke="#5E8C3A" stroke-width="7" stroke-linecap="round"/>
      <path d="M62 86 Q60 40 120 38 Q180 40 178 86Z" fill="${pan}" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
      ${semillas}`;
  },
  Pastas(v) {
    const salsa = `hsl(${8 + (v % 14)} 72% 44%)`;
    const rizos = [38, 30, 22, 14].map((r, i) =>
      `<ellipse cx="120" cy="${96 - i * 3}" rx="${r * 1.6}" ry="${r * 0.62}" fill="none" stroke="${i % 2 ? '#E8A81E' : AMAR}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${70 + i * 10} 8"/>`).join('');
    return `${plato()}${rizos}
      <ellipse cx="120" cy="84" rx="24" ry="10" fill="${salsa}" stroke="${TINTA}" stroke-width="2.5"/>
      <path d="M112 78 q6 -14 16 -2 q-4 8 -16 2Z" fill="#5E8C3A" stroke="${TINTA}" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="136" cy="88" r="3.4" fill="${salsa}" stroke="${TINTA}" stroke-width="2"/>`;
  },
  'Platos fuertes'(v) {
    const carne = `hsl(${12 + (v % 10)} 52% ${32 + (v % 10)}%)`;
    return `${plato()}
      <path d="M72 96 Q70 70 104 68 Q146 66 150 94 Q150 118 108 118 Q74 118 72 96Z" fill="${carne}" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M88 80 L112 106 M104 74 L128 102 M122 72 L142 94" stroke="${TINTA}" stroke-width="3.5" stroke-linecap="round" opacity=".55"/>
      <circle cx="164" cy="92" r="9" fill="#6E9A45" stroke="${TINTA}" stroke-width="3"/>
      <circle cx="168" cy="110" r="8" fill="${AMAR}" stroke="${TINTA}" stroke-width="3"/>
      <circle cx="150" cy="116" r="7" fill="#6E9A45" stroke="${TINTA}" stroke-width="3"/>`;
  },
  'Ensaladas y bowls'(v) {
    const hojas = [[88, 80, 14], [108, 70, 16], [130, 72, 15], [152, 82, 14], [118, 86, 13], [140, 90, 11], [98, 92, 11]]
      .map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${['#6E9A45', '#8DB551', '#5E8C3A'][(i + v) % 3]}" stroke="${TINTA}" stroke-width="3"/>`).join('');
    return `
      <ellipse cx="120" cy="140" rx="62" ry="8" fill="${TINTA}" opacity=".16"/>
      ${hojas}
      <circle cx="124" cy="62" r="8" fill="${TERRA}" stroke="${TINTA}" stroke-width="3"/>
      <circle cx="96" cy="64" r="6" fill="${AMAR}" stroke="${TINTA}" stroke-width="3"/>
      <circle cx="148" cy="66" r="6" fill="${AMAR}" stroke="${TINTA}" stroke-width="3"/>
      <path d="M44 92 H196 Q192 136 120 140 Q48 136 44 92Z" fill="${TERRA}" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M66 108 H174" stroke="${CREMA}" stroke-width="4" stroke-linecap="round" opacity=".55"/>`;
  },
  Postres(v) {
    const base = `hsl(${18 + (v % 10)} 55% ${22 + (v % 12)}%)`;
    const rebanada = v % 2 === 0;
    const pieza = rebanada
      ? `<path d="M74 112 L150 78 L158 112Z" fill="#F6D9A0" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
         <path d="M74 112 L150 78 L150 92 L76 122Z" fill="${base}" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round" opacity=".92"/>
         <path d="M78 104 L150 84" stroke="${CREMA}" stroke-width="3" opacity=".7"/>`
      : `<rect x="72" y="76" width="64" height="44" rx="6" fill="${base}" stroke="${TINTA}" stroke-width="3" transform="rotate(-6 104 98)"/>
         <path d="M76 82 q14 8 26 0 t28 -2" fill="none" stroke="${CREMA}" stroke-width="4" stroke-linecap="round" opacity=".7" transform="rotate(-6 104 98)"/>`;
    return `${plato()}${pieza}
      <circle cx="152" cy="94" r="17" fill="#FFF0C9" stroke="${TINTA}" stroke-width="3"/>
      <circle cx="160" cy="80" r="6" fill="${TERRA}" stroke="${TINTA}" stroke-width="3"/>`;
  },
  Bebidas(v) {
    const liq = [`hsl(${44 + (v % 8)} 92% 58%)`, `hsl(${8 + (v % 12)} 78% 52%)`, `hsl(${28 + (v % 10)} 85% 50%)`][v % 3];
    return `
      <ellipse cx="120" cy="144" rx="48" ry="7" fill="${TINTA}" opacity=".16"/>
      <path d="M142 14 L128 70" stroke="${TERRA}" stroke-width="6" stroke-linecap="round"/>
      <path d="M86 38 H154 L146 138 Q120 146 94 138Z" fill="${liq}" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M86 38 H154 L152 54 H88Z" fill="#fff" opacity=".45"/>
      <rect x="102" y="76" width="22" height="22" rx="4" fill="#fff" opacity=".55" transform="rotate(-12 113 87)"/>
      <rect x="118" y="100" width="20" height="20" rx="4" fill="#fff" opacity=".45" transform="rotate(10 128 110)"/>
      <circle cx="154" cy="40" r="17" fill="${AMAR}" stroke="${TINTA}" stroke-width="3"/>
      <path d="M154 25 V55 M139 40 H169 M143 29 L165 51 M165 29 L143 51" stroke="${CREMA}" stroke-width="2" opacity=".85"/>`;
  },
  Entradas(v) {
    const aros = v % 2 === 0;
    const piezas = aros
      ? [[92, 90, 16], [122, 78, 17], [150, 92, 15], [112, 104, 14], [138, 108, 13]]
        .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#D9902A" stroke-width="9"/><circle cx="${x}" cy="${y}" r="${r + 4.5}" fill="none" stroke="${TINTA}" stroke-width="2.5"/>`).join('')
      : [[88, 96, 0], [112, 80, 20], [138, 86, -15], [150, 104, 35], [112, 108, -25], [128, 98, 5]]
        .map(([x, y, a]) => `<path d="M${x - 16} ${y + 12} L${x} ${y - 14} L${x + 16} ${y + 12}Z" fill="${AMAR}" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round" transform="rotate(${a} ${x} ${y})"/>`).join('');
    return `${plato()}${piezas}
      <ellipse cx="170" cy="100" rx="14" ry="7" fill="${TERRA}" stroke="${TINTA}" stroke-width="3"/>`;
  },
};

export function dishArt(producto) {
  const v = hash(producto.id);
  const hue = 18 + (v % 34);
  const dibujo = (DIBUJOS[producto.categoria] || DIBUJOS.Entradas)(v >>> 4);
  return `<svg class="dish-art" viewBox="0 0 240 160" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
    <rect width="240" height="160" fill="hsl(${hue} 90% 90%)"/>
    <circle cx="${40 + (v % 30)}" cy="${30 + (v % 20)}" r="70" fill="hsl(${hue + 8} 92% 82%)"/>
    <circle cx="${210 - (v % 25)}" cy="150" r="52" fill="hsl(${hue - 6} 85% 86%)"/>
    ${dibujo}
  </svg>`;
}
