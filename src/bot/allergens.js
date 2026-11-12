import { normalize } from '../core/text.js';

// Alérgenos: SOLO se responde con los datos declarados del producto.
// Si el producto no declara datos, no se identifica, o el alérgeno no está en la carta: no se confirma nada.

const ALERGENOS = [
  { k: 'gluten', re: /gluten|celiac|trigo|wheat/ },
  { k: 'lácteos', re: /lacteo|lactosa|leche|dairy|lactose|milk/ },
  { k: 'huevo', re: /huevo|egg/ },
  { k: 'soya', re: /\b(soya|soja|soy)\b/ },
  { k: 'frutos secos', re: /frutos secos|nuez|nueces|\bnuts?\b/ },
  { k: 'pescado', re: /pescado|\bfish\b/ },
  { k: 'mariscos', re: /marisco|camaron|shellfish|shrimp/ },
];
const DESCONOCIDO = /\b(mani|peanuts?|sesamo|sesame|mostaza|mustard|apio|celery|sulfitos?|lupino)\b/;
const CUE = /\b(tiene|tienen|contiene|contienen|lleva|llevan|apto|apta|libre|free|contain|contains|have|has)\b|alerg|allerg|\bsin (gluten|lactosa|lacteos|nueces|mani|soya|huevo|mariscos?)\b/;
const ALERGENO_PALABRA = /alerg|allerg|gluten|celiac|trigo|wheat|lacteo|lactosa|leche|dairy|lactose|milk|huevo|\begg|\bsoya|\bsoja|\bsoy\b|frutos secos|nuez|nueces|\bnuts?\b|pescado|\bfish\b|marisco|camaron|shellfish|shrimp|\bmani\b|peanut|sesam|mostaza|mustard|\bapio\b|celery|sulfit/;

export const ALERGENO_CUE = (n) => /alerg|allerg/.test(n) || (CUE.test(n) && ALERGENO_PALABRA.test(n));

export const palabras = (s) => normalize(s).replace(/[^a-z0-9 ]/g, ' ').split(' ').filter((w) => w.length > 3).map((w) => (w.endsWith('s') ? w.slice(0, -1) : w));

// Inglés -> palabras del menú (los nombres de los platos están en español).
// (alias derivados de los nombres reales del menú: hamburguesa clásica/doble/de pollo/vegetariana/picante/con tocino, etc.)
const TRAD_EN = [['iced tea', 'te helado'], ['classic', 'clasica'], ['double', 'doble'], ['chicken burger', 'hamburguesa de pollo'], ['grilled chicken', 'pollo a la parrilla'],
  ['veggie', 'vegetariana'], ['vegetarian', 'vegetariana'], ['spicy', 'picante'], ['bacon', 'tocino'], ['strawberry shake', 'batido de fresa'], ['milkshake', 'batido'],
  ['orange juice', 'jugo de naranja'], ['vanilla', 'vainilla'], ['apple pie', 'tarta de manzana'], ['tomato soup', 'sopa de tomate'], ['mac and cheese', 'macarrones con queso'],
  ['lasagna', 'lasana'], ['mineral water', 'agua mineral'], ['pork chop', 'chuleta de cerdo'], ['cookie', 'galleta'], ['ice cream', 'helado'], ['french fries', 'papas fritas'], ['onion rings', 'aros de cebolla'],
  ['burger', 'hamburguesa'], ['caesar', 'cesar'], ['salad', 'ensalada'], ['steak', 'churrasco'], ['shrimp', 'camarones'], ['ribs', 'costillas'],
  ['fries', 'papas'], ['lemonade', 'limonada'], ['soda', 'refresco'], ['coke', 'refresco'], ['juice', 'jugo'], ['coffee', 'cafe']];
const STOP = new Set(['de', 'la', 'el', 'los', 'las', 'con', 'al', 'del', 'a', 'y', 'en']);
// Ingredientes que aparecen en varios nombres: no cuentan como "otro plato" cuando ya se identificó uno.
const INGREDIENTE = new Set(['queso', 'salsa', 'tomate', 'cebolla', 'pollo', 'arroz', 'carne', 'huevo', 'leche']);
const sing = (w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);
const tokens = (s) => normalize(s).replace(/[^a-z0-9 ]/g, ' ').split(' ').filter(Boolean).map(sing);
const traducir = (n) => TRAD_EN.reduce((t, [a, b]) => t.replace(new RegExp(String.raw`\b${a}s?\b`, 'g'), b), ` ${n} `);
const palabrasNombre = (p) => tokens(p.nombre).filter((w) => !STOP.has(w));

// Productos mencionados en el texto, sin elegir "por parecido":
//  - completo: TODAS las palabras del nombre están en el texto ("té helado" necesita «té» y «helado»);
//  - único: el texto trae una palabra (de más de 3 letras) que solo existe en un nombre ("churrasco", "cheesecake");
//  - si una palabra del texto calza con varios platos y ninguno quedó identificado por lo anterior, es ambiguo
//    ("helado": té helado, helado de vainilla, brownie con helado) y se pregunta cuál.
export function identificarProductos(state, n) {
  const tw = new Set(tokens(traducir(n)));
  const info = state.productos.map((p) => ({ p, ws: palabrasNombre(p) }));
  const frecuencia = new Map();
  for (const { ws } of info) for (const w of new Set(ws)) frecuencia.set(w, (frecuencia.get(w) ?? 0) + 1);

  let hallados = info.filter(({ ws }) => ws.length && ws.every((w) => tw.has(w)));
  // un nombre cuyas palabras están contenidas en las de otro hallado (p. ej. «helado» dentro de «brownie con helado») no cuenta
  hallados = hallados.filter((a) => !hallados.some((b) => b !== a && b.ws.length > a.ws.length && a.ws.every((w) => b.ws.includes(w))));
  for (const x of info) {
    if (hallados.includes(x)) continue;
    if (x.ws.some((w) => w.length > 3 && tw.has(w) && frecuencia.get(w) === 1)) hallados.push(x);
  }
  const usadas = new Set(hallados.flatMap((x) => x.ws));
  const ambiguos = [];
  const vistos = new Set();
  for (const w of tw) {
    if (w.length <= 3 || usadas.has(w) || (frecuencia.get(w) ?? 0) < 2) continue;
    if (hallados.length && INGREDIENTE.has(w)) continue;
    const grupo = info.filter((x) => x.ws.includes(w)).map((x) => x.p.nombre);
    const clave = grupo.join('|');
    if (!vistos.has(clave)) { vistos.add(clave); ambiguos.push(grupo); }
  }
  return { productos: hallados.map((x) => x.p), ambiguos };
}

export function allergenReply(T, state, n) {
  const et = (k) => T.etiquetas?.[k] ?? k;
  const noConfirma = { handoff: true, texto: T.alergenoNoConfirma };
  const { productos, ambiguos } = identificarProductos(state, n);
  if (DESCONOCIDO.test(n) || (!productos.length && !ambiguos.length)) return noConfirma;
  const pedidos = ALERGENOS.filter((a) => a.re.test(n));
  const partes = [];
  let handoff = false;
  for (const p of productos) {
    if (p.alergenosDeclarados !== true) {
      handoff = true;
      partes.push(productos.length === 1 && !ambiguos.length ? T.alergenoNoConfirma : T.alergenoProductoNoDeclarado(p.nombre));
    } else if (!pedidos.length) {
      partes.push(p.alergenos.length ? T.alergenoListado(p.nombre, p.alergenos.map(et).join(', ')) : T.alergenoSinListado(p.nombre));
    } else {
      partes.push(...pedidos.map((a) => (p.alergenos.includes(a.k) ? T.alergenoCon(p.nombre, et(a.k)) : T.alergenoNoLista(p.nombre, et(a.k)))));
    }
  }
  for (const g of ambiguos) partes.push(T.alergenoCual(g));
  return { handoff, texto: partes.join('\n') };
}
