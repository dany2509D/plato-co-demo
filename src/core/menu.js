import { normalize } from './text.js';

// Sinónimos por palabra (ya normalizados): lo que dice el cliente -> palabra del menú.
const SINONIMOS = {
  burger: 'hamburguesa',
  hamburgesa: 'hamburguesa',
  hamburguesas: 'hamburguesa',
  pasta: 'espagueti',
  spaghetti: 'espagueti',
  spagueti: 'espagueti',
  fries: 'papas',
  gaseosa: 'refresco',
  soda: 'refresco',
  helados: 'helado',
  ensaladas: 'ensalada',
  camaron: 'camarones',
  costilla: 'costillas',
  coca: 'refresco',
  cocas: 'refresco',
  coke: 'refresco',
  cokes: 'refresco',
  cola: 'refresco',
  colas: 'refresco',
};

// Búsqueda segura en un objeto con texto del usuario: "constructor" o "__proto__" no son claves.
const propio = (obj, k) => (Object.hasOwn(obj, k) ? obj[k] : undefined);
const palabras = (t) => normalize(t).split(' ').filter(Boolean).map((w) => propio(SINONIMOS, w) ?? w);

export function isAvailable(state, productoId, sucursalId) {
  const p = state.productos.find((x) => x.id === productoId);
  return !!p && p.disponiblePorSucursal?.[sucursalId] === true;
}

export function setAvailable(store, productoId, sucursalId, valor) {
  store.update((s) => {
    const p = s.productos.find((x) => x.id === productoId);
    if (!p) return;
    p.disponiblePorSucursal[sucursalId] = !!valor;
  });
  store.emit('menu:cambio', { productoId, sucursalId, valor });
}

export const PRECIO_MAX = 999.99;

export function setPrice(store, productoId, precio) {
  if (typeof precio !== 'number' || !Number.isFinite(precio) || precio <= 0 || precio > PRECIO_MAX) return;
  store.update((s) => {
    const p = s.productos.find((x) => x.id === productoId);
    if (p) p.precio = precio;
  });
}

// Coincidencias con su clase de calce (3 nombre exacto, 2 el nombre contiene la consulta, 1 otro) y puntaje
// (la clase más 0,5 si está disponible). Incluye las agotadas: el bot necesita encontrarlas para rechazarlas.
export function findProductsScored(state, texto, sucursalId) {
  const q = palabras(texto);
  if (!q.length) return [];
  const qJoin = q.join(' ');
  const res = [];
  for (const p of state.productos) {
    const nombre = normalize(p.nombre);
    const campo = `${nombre} ${normalize(p.categoria)}`;
    if (!q.every((w) => campo.includes(w))) continue;
    const clase = nombre === qJoin ? 3 : nombre.includes(qJoin) ? 2 : 1;
    res.push({ p, clase, score: clase + (isAvailable(state, p.id, sucursalId) ? 0.5 : 0) });
  }
  return res.sort((a, b) => b.score - a.score);
}

export function findProducts(state, texto, sucursalId) {
  return findProductsScored(state, texto, sucursalId).map((r) => r.p);
}

export function alternativesFor(state, productoId, sucursalId) {
  const base = state.productos.find((x) => x.id === productoId);
  if (!base) return [];
  return state.productos
    .filter((p) => p.id !== base.id && p.categoria === base.categoria && isAvailable(state, p.id, sucursalId))
    .slice(0, 3);
}

export function visibleMenu(state, sucursalId) {
  const grupos = new Map();
  for (const p of state.productos) {
    if (!isAvailable(state, p.id, sucursalId)) continue;
    if (!grupos.has(p.categoria)) grupos.set(p.categoria, []);
    grupos.get(p.categoria).push(p);
  }
  return [...grupos].map(([categoria, productos]) => ({ categoria, productos }));
}
