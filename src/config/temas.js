// ---------------------------------------------------------------------------------------------------------------
// TEMAS DE DISEÑO (botón «Diseño» del menú Demo).
//   · «plato»  → la marca original de la plantilla (Plato & Co.). No cambia nada.
//   · «coyote» → VISTA PREVIA para un prospecto (Coyote CV, restaurante de comida callejera: esquites, elotes y
//                perros). Colores tomados de su perfil público de Instagram (amarillo + fucsia) y el tipo de
//                productos que vende. Precios, direcciones, zonas y reseñas son FICTICIOS: es una maqueta para
//                la reunión, no un dato real del negocio. Las fotos son de licencia libre (docs/design/ATTRIBUTIONS.md).
// Cómo añadir otro cliente: copie el objeto `coyote`, cambie marca, colores, tokens, sucursales, menú y ejemplos.
// El tema se guarda en localStorage y se aplica al cargar la página (brand.js lee este módulo al arrancar).
// ---------------------------------------------------------------------------------------------------------------
const CLAVE = 'plato-co-demo:tema';

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// [nombre, categoria, precio, vegetariano, modificadores, alergenos, alergenosDeclarados]
const MENU_COYOTE = [
  ['Esquites clásicos', 'Esquites', 4.95, true, ['sin chile', 'sin mayonesa', 'queso extra', 'agrandar'], ['lácteos', 'huevo'], true],
  ['Esquites con pollo', 'Esquites', 6.5, false, ['sin chile', 'sin mayonesa', 'queso extra', 'agrandar'], ['lácteos', 'huevo'], true],
  ['Esquites con carne', 'Esquites', 6.95, false, ['sin chile', 'sin mayonesa', 'queso extra', 'agrandar'], ['lácteos', 'huevo'], false],
  ['Esquites con chorizo', 'Esquites', 6.95, false, ['sin chile', 'sin mayonesa', 'agrandar'], ['lácteos', 'huevo'], false],
  ['Esquites con camarón', 'Esquites', 7.95, false, ['sin chile', 'sin mayonesa', 'agrandar'], ['crustáceos', 'lácteos'], false],
  ['Esquites picositos', 'Esquites', 5.5, true, ['sin mayonesa', 'agrandar'], ['lácteos'], false],
  ['Elote clásico', 'Elotes', 3.95, true, ['sin chile', 'sin mayonesa', 'queso extra'], ['lácteos', 'huevo'], true],
  ['Elote con queso', 'Elotes', 4.25, true, ['sin chile', 'sin mayonesa'], ['lácteos', 'huevo'], true],
  ['Elote con tocino', 'Elotes', 4.95, false, ['sin chile', 'sin mayonesa'], ['lácteos', 'huevo'], false],
  ['Elote crujiente', 'Elotes', 4.5, true, ['sin chile', 'sin mayonesa'], ['lácteos', 'gluten'], false],
  ['Perro clásico', 'Perros', 3.95, false, ['sin cebolla', 'sin salsa', 'agrandar'], ['gluten'], true],
  ['Perro con queso', 'Perros', 4.75, false, ['sin cebolla', 'sin salsa', 'agrandar'], ['gluten', 'lácteos'], true],
  ['Perro con tocino', 'Perros', 5.5, false, ['sin cebolla', 'sin salsa'], ['gluten'], false],
  ['Perro con carne desmechada', 'Perros', 5.95, false, ['sin cebolla', 'sin salsa', 'agrandar'], ['gluten'], false],
  ['Perro vegetariano', 'Perros', 5.25, true, ['sin cebolla', 'sin salsa'], ['gluten', 'soya'], false],
  ['Papas con queso', 'Antojos', 4.5, true, ['sin salsa', 'agrandar'], ['lácteos'], true],
  ['Nachos Coyote', 'Antojos', 5.5, true, ['sin chile', 'agrandar'], ['lácteos'], false],
  ['Chicharrón con limón', 'Antojos', 3.5, false, ['sin chile'], [], false],
  ['Maíz tostado', 'Antojos', 2.5, true, ['sin chile'], [], true],
  ['Batido de café', 'Bebidas', 3.95, true, ['agrandar', 'sin azúcar'], ['lácteos'], true],
  ['Batido de chocolate', 'Bebidas', 3.95, true, ['agrandar', 'sin azúcar'], ['lácteos'], true],
  ['Limonada', 'Bebidas', 2.25, true, ['agrandar', 'sin hielo'], [], true],
  ['Refresco', 'Bebidas', 1.75, true, ['sin hielo'], [], true],
  ['Té helado', 'Bebidas', 2.25, true, ['agrandar', 'sin hielo'], [], true],
  ['Agua mineral', 'Bebidas', 1.5, true, [], [], true],
  ['Churros', 'Postres', 3.5, true, ['con chocolate'], ['gluten', 'huevo'], false],
  ['Helado de vainilla', 'Postres', 2.95, true, [], ['lácteos'], false],
];

// [nombre, descripcion, [productos], precio]
const COMBOS_COYOTE = [
  ['Promo 2 esquites', 'Dos esquites con proteína (2 x US$ 10)', ['Esquites con pollo', 'Esquites con carne'], 10],
  ['Combo perro', 'Perro clásico, papas con queso y refresco', ['Perro clásico', 'Papas con queso', 'Refresco'], 8.95],
  ['Combo elote', 'Elote con queso, chicharrón con limón y limonada', ['Elote con queso', 'Chicharrón con limón', 'Limonada'], 8.5],
  ['Combo antojo', 'Nachos Coyote, perro con queso y té helado', ['Nachos Coyote', 'Perro con queso', 'Té helado'], 10.5],
  ['Combo dulce', 'Churros y batido de café', ['Churros', 'Batido de café'], 6.5],
  ['Combo esquite y batido', 'Esquites clásicos, elote clásico y batido de chocolate', ['Esquites clásicos', 'Elote clásico', 'Batido de chocolate'], 10.95],
];

// Logotipo cuadrado de la cabecera (viewBox 48×48, role="img" aria-label=… seguidos: contrato de cabecera.js/phone.js).
const logoCoyote = (nombre, c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" role="img" aria-label="${esc(nombre)}"><circle cx="24" cy="24" r="23.5" fill="${c.oro}"/><circle cx="24" cy="24" r="21" fill="none" stroke="${c.tomate}" stroke-width="1.5"/><text x="24" y="31.5" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="21" fill="${c.tomate}">CV</text></svg>`;

const coyote = {
  id: 'coyote',
  nombre: 'Coyote CV',
  descripcion: 'Vista previa: amarillo y fucsia, esquites, elotes y perros',
  marca: { nombre: 'Coyote CV', iniciales: 'CV', lema: 'Una vaina west', telefono: '+507 6000-0000' },
  // Mismos nombres que brand.colores (la paleta del logotipo).
  colores: { crema: '#FFF1C2', papel: '#FFF9E3', tinta: '#1B0A14', carbon: '#1B0A14', tomate: '#B00858', oro: '#FFD21F' },
  logo: logoCoyote,
  // Tokens CSS que sustituyen a los de tokens.css (todos los pares de texto verificados AA con script).
  tokens: {
    '--c-canvas': '#fff1c2', '--c-linen': '#ffe699', '--c-paper': '#fff9e3', '--c-rule': '#e6c65c',
    '--c-line-strong': '#8c6b00', '--c-ink': '#1b0a14', '--c-ink-soft': '#4a2a3c', '--c-ink-muted': '#5c3b4d',
    '--c-char': '#1b0a14', '--c-card': '#3a1230', '--c-ember': '#b00858', '--c-ember-deep': '#8f0647',
    '--c-line-dark': '#6b1647', '--c-on-dark': '#fff1c2', '--c-on-dark-muted': '#e8d8a8',
    '--c-gold': '#ffd21f', '--c-gold-hover': '#ffde57', '--c-chili': '#b00858',
    '--c-cta': '#b00858', '--c-cta-deep': '#8f0647',
  },
  sucursales: [
    {
      id: 'suc-1', nombre: 'Coyote Market Plaza', direccion: 'Market Plaza, local ficticio',
      horario: { abre: '12:00', cierra: '22:00' }, zonasEntrega: ['Villa Sol', 'Market Plaza', 'Altos del Mar'], etaBaseMin: 25,
      mesas: [{ id: 'M1', capacidad: 2 }, { id: 'M2', capacidad: 2 }, { id: 'M3', capacidad: 4 }, { id: 'M4', capacidad: 4 }, { id: 'M5', capacidad: 6 }, { id: 'M6', capacidad: 8 }],
    },
    {
      id: 'suc-2', nombre: 'Coyote Brisas Mall', direccion: 'Brisas Mall, patio de comidas ficticio',
      horario: { abre: '14:00', cierra: '22:00' }, zonasEntrega: ['Las Brisas', 'Brisas Mall', 'Residencial Alba'], etaBaseMin: 30,
      mesas: [{ id: 'B1', capacidad: 2 }, { id: 'B2', capacidad: 4 }, { id: 'B3', capacidad: 4 }, { id: 'B4', capacidad: 6 }, { id: 'B5', capacidad: 8 }],
    },
    {
      id: 'suc-3', nombre: 'Coyote Delivery', direccion: 'Cocina de entregas ficticia',
      horario: { abre: '12:00', cierra: '22:00' }, zonasEntrega: ['Barrio Norte', 'Los Pinos', 'Centro'], etaBaseMin: 35,
      mesas: [{ id: 'D1', capacidad: 2 }, { id: 'D2', capacidad: 4 }, { id: 'D3', capacidad: 6 }, { id: 'D4', capacidad: 8 }],
    },
  ],
  menu: MENU_COYOTE,
  combos: COMBOS_COYOTE,
  destacados: ['Esquites con pollo', 'Elote con queso', 'Perro con carne desmechada', 'Batido de café'],
  menuDelDia: { nombre: 'Promo del día', productos: ['Esquites con pollo', 'Perro clásico', 'Limonada'], precio: 8.95, horario: 'De lunes a domingo, de 12:00 a 15:00. Esquite, perro y bebida.', etiqueta: 'Solo almuerzo · todos los días' },
  portada: {
    eyebrow: 'Esquites · elotes · perros · batidos',
    titulo: 'Una vaina west.',
    lead: 'Antojos callejeros bien servidos: esquites con proteína, elotes y perros calientes, para llevar o a su puerta.',
    heroAlt: 'Plato de comida servido sobre una superficie oscura',
    heroFoto: 'hero',
  },
  // Plato que se agota en la presentación guiada y frases de ejemplo del bot (es / en).
  ejemplo: {
    agotado: 'Perro clásico',
    frase: '2 esquites con pollo sin chile y un elote clásico para Villa Sol',
    fraseEn: '2 esquites con pollo and a lemonade for Villa Sol',
    fraseCorta: '2 esquites con pollo y una limonada',
    alergeno: '¿Los esquites clásicos tienen lácteos?',
    alergenoEn: 'Do the esquites clásicos contain dairy?',
    direccion: 'Calle 5, Villa Sol',
    agotadoPedido: 'Quiero un perro clásico para Villa Sol',
  },
};

// Textos del bot y de las pantallas que mencionan los ejemplos de la plantilla original → los del tema.
const reemplazosCoyote = [
  ['2 hamburguesas clásicas sin cebolla y una limonada para Obarrio', coyote.ejemplo.frase],
  ['2 classic burgers without onion and a lemonade for Obarrio', coyote.ejemplo.fraseEn],
  ['2 hamburguesas clásicas y una limonada', coyote.ejemplo.fraseCorta],
  ['2 classic burgers and a lemonade', coyote.ejemplo.fraseCorta],
  ['¿La hamburguesa clásica tiene gluten?', coyote.ejemplo.alergeno],
  ['Does the classic burger contain gluten?', coyote.ejemplo.alergenoEn],
  ['Does the classic burger have gluten?', coyote.ejemplo.alergenoEn],
  ['Quiero una hamburguesa clásica para Obarrio', coyote.ejemplo.agotadoPedido],
  ['Quiero 2 hamburguesas clásicas sin cebolla y una limonada para Obarrio', 'Quiero ' + coyote.ejemplo.frase],
  ['Calle 50, Obarrio', coyote.ejemplo.direccion],
];

export const TEMAS = {
  plato: { id: 'plato', nombre: 'Plato & Co.', descripcion: 'Diseño original de la plantilla' },
  coyote: { ...coyote, reemplazos: reemplazosCoyote },
};

export function temaActivoId() {
  try {
    const id = localStorage.getItem(CLAVE);
    return id && TEMAS[id] ? id : 'plato';
  } catch { return 'plato'; }
}

export function guardarTema(id) {
  if (!TEMAS[id]) return false;
  try { localStorage.setItem(CLAVE, id); return true; } catch { return false; }
}

export const temaActivo = () => TEMAS[temaActivoId()];

/** Aplica el tema a la marca base (objeto de brand.js). El tema «plato» devuelve la base tal cual. */
export function aplicarTema(base, tema = temaActivo()) {
  if (!tema || tema.id === 'plato') return { ...base, tema: TEMAS.plato };
  const colores = { ...base.colores, ...tema.colores };
  colores.terracota = colores.tomate;
  colores.amarillo = colores.oro;
  return {
    ...base,
    ...tema.marca,
    colores,
    logoSvg: tema.logo(tema.marca.nombre, colores),
    sucursales: JSON.parse(JSON.stringify(tema.sucursales)),
    tema,
  };
}

/** Sustituye los ejemplos de la plantilla original por los del tema activo (no hace nada con «plato»). */
export function adaptarTexto(texto, tema = temaActivo()) {
  if (typeof texto !== 'string' || !tema?.reemplazos) return texto;
  let s = texto;
  for (const [de, a] of tema.reemplazos) if (s.includes(de)) s = s.split(de).join(a);
  return s;
}

/** Aplica los tokens CSS del tema (se llama al arrancar, antes de pintar). */
export function aplicarTokens(tema = temaActivo(), raiz = typeof document !== 'undefined' ? document.documentElement : null) {
  if (!raiz) return;
  for (const [k, v] of Object.entries(tema?.tokens || {})) raiz.style.setProperty(k, v);
  raiz.dataset.tema = tema?.id || 'plato';
}
