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

const palabras = (s) => normalize(s).replace(/[^a-z0-9 ]/g, ' ').split(' ').filter((w) => w.length > 3).map((w) => (w.endsWith('s') ? w.slice(0, -1) : w));

// Producto mencionado en el texto: coincidencia completa del nombre; si no, un único candidato parcial.
export function findProduct(state, n) {
  const tw = new Set(palabras(n));
  let completos = [];
  const parciales = [];
  for (const p of state.productos) {
    const nw = palabras(p.nombre);
    const hits = nw.filter((w) => tw.has(w)).length;
    if (!hits) continue;
    if (hits === nw.length) completos.push({ p, len: nw.length });
    else parciales.push({ p, hits });
  }
  if (completos.length) return completos.sort((a, b) => b.len - a.len)[0].p;
  if (parciales.length) {
    const max = Math.max(...parciales.map((x) => x.hits));
    const mejores = parciales.filter((x) => x.hits === max);
    if (mejores.length === 1) return mejores[0].p;
  }
  return null;
}

export function allergenReply(T, state, n) {
  const noConfirma = { handoff: true, texto: T.alergenoNoConfirma };
  const p = findProduct(state, n);
  if (!p || p.alergenosDeclarados !== true || DESCONOCIDO.test(n)) return noConfirma;
  const pedidos = ALERGENOS.filter((a) => a.re.test(n));
  if (!pedidos.length) {
    return { handoff: false, texto: p.alergenos.length ? T.alergenoListado(p.nombre, p.alergenos.join(', ')) : T.alergenoSinListado(p.nombre) };
  }
  const texto = pedidos.map((a) => (p.alergenos.includes(a.k) ? T.alergenoCon(p.nombre, a.k) : T.alergenoNoLista(p.nombre, a.k))).join('\n');
  return { handoff: false, texto };
}
