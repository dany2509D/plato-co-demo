import { normalize } from '../core/text.js';
import { findProducts, isAvailable } from '../core/menu.js';

// Parser de pedidos en texto libre (español de Panamá e inglés).
// Política de duplicados: la misma línea (mismo producto y mismos modificadores)
// mencionada dos veces se FUSIONA sumando cantidades; con distintos modificadores
// queda como línea separada.
// Un "sin X" solo afecta al ítem de su propio fragmento. El término de la carne y
// "agrandar" solo se aplican si el producto los ofrece; "sin X" se conserva siempre
// (es una nota para la cocina).

const MIN_CANT = 1;
const MAX_CANT = 20;

const NUMEROS = {
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  cero: 0, zero: 0,
};

const MARCAS_EN = new Set(['the', 'and', 'with', 'without', 'please', 'want', 'would', 'like', 'i', 'a', 'an', 'burger', 'burgers',
  'lemonade', 'fries', 'classic', 'no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'large',
  'medium', 'well', 'done', 'order', 'can', 'have', 'get', 'chicken', 'salad', 'juice', 'water']);
const MARCAS_ES = new Set(['y', 'un', 'una', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'sin',
  'quiero', 'quisiera', 'por', 'favor', 'porfa', 'hamburguesa', 'hamburguesas', 'clasica', 'clasicas', 'limonada', 'papas',
  'con', 'de', 'el', 'la', 'los', 'las', 'dame', 'ponme', 'grande', 'agrandar', 'termino', 'cocido', 'bien', 'pedido', 'hola',
  'pasta', 'ensalada']);

export function detectLang(texto) {
  const ws = normalize(texto).replace(/[^a-z0-9' ]/g, ' ').split(' ').filter(Boolean);
  let en = 0;
  let es = 0;
  for (const w of ws) {
    if (MARCAS_EN.has(w)) en++;
    if (MARCAS_ES.has(w)) es++;
  }
  return en > es ? 'en' : 'es';
}

// Inglés -> palabras del menú (frases primero, luego palabras sueltas).
const FRASES_EN = [
  ['french fries', 'papas fritas'], ['iced tea', 'te helado'], ['ice cream', 'helado'],
  ['onion rings', 'aros de cebolla'], ['three quarters', 'tres cuartos'], ['well done', 'bien cocido'],
  ['extra large', 'grande'],
];
const PALABRAS_EN = {
  classic: 'clasica', double: 'doble', chicken: 'pollo', bacon: 'tocino', spicy: 'picante',
  vegetarian: 'vegetariana', veggie: 'vegetariana', lemonade: 'limonada', fries: 'papas', juice: 'jugo',
  orange: 'naranja', water: 'agua', tea: 'te', coffee: 'cafe', shake: 'batido', milkshake: 'batido',
  strawberry: 'fresa', vanilla: 'vainilla', salad: 'ensalada', caesar: 'cesar', shrimp: 'camarones',
  ribs: 'costillas', fish: 'pescado', soup: 'sopa', wings: 'alitas', cheese: 'queso', onion: 'cebolla',
  onions: 'cebolla', tomato: 'tomate', tomatoes: 'tomate', sauce: 'salsa', ice: 'hielo', no: 'sin',
  without: 'sin', large: 'grande', big: 'grande', burger: 'hamburguesa', burgers: 'hamburguesa',
  steak: 'churrasco', dessert: 'postre', pork: 'cerdo',
};
// Mismos sinónimos que usa findProducts, para validar contra palabras reales del menú.
const ALIAS = {
  burger: 'hamburguesa', hamburgesa: 'hamburguesa', pasta: 'espagueti', spaghetti: 'espagueti', spagueti: 'espagueti',
  gaseosa: 'refresco', soda: 'refresco', camaron: 'camarones', costilla: 'costillas',
};

const RELLENO = new Set(['quiero', 'quisiera', 'quisieramos', 'necesito', 'me', 'das', 'dame', 'ponme', 'pon', 'por', 'favor', 'porfa',
  'hola', 'buenas', 'buenos', 'tardes', 'noches', 'dias', 'gracias', 'orden', 'ordenes', 'porcion', 'pedido', 'tambien', 'agrega',
  'agregar', 'para', 'i', 'id', "i'd", 'want', 'would', 'like', 'please', 'can', 'could', 'have', 'get', 'give', 'a', 'an', 'the',
  'also', 'add', 'order', 'of', 'to', 'for', 'mas', 'tengo', 'hello', 'hi', 'thanks', 'quiere']);
const FUNCIONALES = new Set(['de', 'la', 'el', 'los', 'las', 'del', 'con', 'al']);
const MODS_TERMINO = [
  [/\btermino medio\b|\bmedio\b|\bmedium\b/g, 'término medio'],
  [/\btres cuartos\b/g, 'término tres cuartos'],
  [/\bbien cocid[oa]\b/g, 'término bien cocido'],
];

// Singular simple: quita una "s" final (clásicas -> clasica, papas -> papa).
const uno = (w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);

// Nombres de producto con " y " (p. ej. "Bowl de pollo y arroz") no se parten como separador.
function proteger(texto, state) {
  let t = texto;
  for (const p of state.productos) {
    const n = normalize(p.nombre);
    if (n.includes(' y ')) t = t.split(n).join(n.replace(/ y /g, ' _y_ '));
  }
  return t;
}

// Ingredientes que el menú permite quitar: singular -> forma del menú.
function ingredientesSin(state) {
  const set = new Map();
  for (const p of state.productos) {
    for (const m of p.modificadores ?? []) {
      const n = normalize(m);
      if (n.startsWith('sin ')) set.set(uno(n.slice(4)), n.slice(4));
    }
  }
  return set;
}

function traducir(t) {
  let s = ` ${t} `;
  for (const [a, b] of FRASES_EN) s = s.split(` ${a} `).join(` ${b} `);
  return s.trim().split(' ').map((w) => PALABRAS_EN[w] ?? PALABRAS_EN[uno(w)] ?? w).join(' ');
}

function parseFragmento(frag, ingred) {
  let t = traducir(frag);
  // término de la carne
  const termino = [];
  for (const [re, canon] of MODS_TERMINO) {
    if (re.test(t)) termino.push(canon);
    t = t.replace(re, ' ');
  }
  t = t.replace(/\btermino\b/g, ' ');
  const reGrande = /\b(agrandar|agrandado|agrandada|grande)\b/g;
  const agrandar = reGrande.test(t);
  t = t.replace(reGrande, ' ');

  // "sin X [ni Y]" hasta el final del fragmento
  const sin = [];
  const mSin = t.match(/\bsin\b(.*)$/);
  if (mSin) {
    t = t.slice(0, mSin.index);
    for (const parte of mSin[1].split(/\bni\b/)) {
      const ws = parte.split(' ').filter((w) => w && !RELLENO.has(w) && !FUNCIONALES.has(w));
      if (!ws.length) continue;
      const crudo = ws.join(' ');
      sin.push(`sin ${ingred.get(uno(crudo)) ?? crudo}`);
    }
  }

  // cantidad: primer número (dígitos o palabra) del fragmento
  let cantidad = null;
  const nombre = [];
  for (const w of t.split(' ').filter(Boolean)) {
    const m = /^x?(-?\d+(?:[.,]\d+)?)x?$/.exec(w);
    if (cantidad === null && (m || w in NUMEROS)) cantidad = m ? Number(m[1].replace(',', '.')) : NUMEROS[w];
    else if (!RELLENO.has(w)) nombre.push(w);
  }
  const invalida = cantidad !== null && (!Number.isInteger(cantidad) || cantidad < MIN_CANT || cantidad > MAX_CANT);
  return { nombre, cantidad: cantidad ?? 1, invalida, termino, agrandar, sin };
}

// findProducts busca por subcadena: cada palabra de la consulta debe además ser una
// palabra COMPLETA del producto (así "te" no acepta "hamburguesa") y al menos una del nombre.
function buscar(state, palabras, sucursalId) {
  const q = palabras.map(uno);
  if (!q.length) return null;
  for (const p of findProducts(state, q.join(' '), sucursalId)) {
    const nom = new Set(normalize(p.nombre).split(' ').map(uno));
    const todo = new Set([...nom, ...normalize(p.categoria).split(' ').map(uno)]);
    const en = (set, w) => set.has(w) || set.has(ALIAS[w] ?? '\0');
    if (q.every((w) => en(todo, w)) && q.some((w) => en(nom, w))) return p;
  }
  return null;
}

export function parseOrder(texto, state, sucursalId) {
  const res = { lineas: [], agotados: [], desconocidos: [] };
  const norm = normalize(texto).replace(/[!?¡¿."]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!norm) return res;
  const ingred = ingredientesSin(state);
  const fragmentos = proteger(norm, state)
    .split(/\s*[,;+]\s*|\s+(?:y|and|e)\s+/)
    .map((f) => f.replace(/_y_/g, 'y').trim())
    .filter(Boolean);

  const lineas = new Map();
  let ultima = null; // última línea creada, para "sin cebolla y tomate"
  for (const frag of fragmentos) {
    const f = parseFragmento(frag, ingred);
    const nombre = f.nombre;
    if (!nombre.some((w) => !FUNCIONALES.has(w))) {
      // solo relleno: se ignora; con cantidad o "sin" sueltos, es ruido que se reporta
      if (f.sin.length || f.cantidad !== 1 || f.invalida) res.desconocidos.push(frag);
      continue;
    }
    // continuación de "sin cebolla y tomate": solo ingredientes conocidos tras un "sin" previo
    if (ultima?.tieneSin && !f.sin.length && f.cantidad === 1 && !f.invalida
      && nombre.every((w) => ingred.has(uno(w)) || FUNCIONALES.has(w))) {
      for (const w of nombre.filter((x) => !FUNCIONALES.has(x))) {
        const m = `sin ${ingred.get(uno(w))}`;
        if (!ultima.linea.modificadores.includes(m)) ultima.linea.modificadores.push(m);
      }
      continue;
    }
    const p = buscar(state, nombre, sucursalId) ?? buscar(state, nombre.filter((w) => !FUNCIONALES.has(w)), sucursalId);
    if (!p || f.invalida) {
      res.desconocidos.push(frag);
      ultima = null;
      continue;
    }
    if (!isAvailable(state, p.id, sucursalId)) {
      if (!res.agotados.includes(p.id)) res.agotados.push(p.id);
      ultima = null;
      continue;
    }
    const soportados = p.modificadores ?? [];
    const mods = [...f.termino.slice(0, 1), ...(f.agrandar ? ['agrandar'] : [])]
      .map((m) => soportados.find((x) => normalize(x) === normalize(m)))
      .filter(Boolean);
    for (const s of f.sin) if (!mods.includes(s)) mods.push(s);
    const clave = `${p.id}|${[...mods].sort().join('|')}`;
    let linea = lineas.get(clave);
    if (linea) linea.cantidad += f.cantidad;
    else {
      linea = { productoId: p.id, cantidad: f.cantidad, modificadores: mods };
      lineas.set(clave, linea);
      res.lineas.push(linea);
    }
    ultima = { linea, tieneSin: f.sin.length > 0 };
  }
  return res;
}
