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
};

const palabras = (t) => normalize(t).split(' ').filter(Boolean).map((w) => SINONIMOS[w] ?? w);

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

export function setPrice(store, productoId, precio) {
  if (typeof precio !== 'number' || !Number.isFinite(precio) || precio <= 0) return;
  store.update((s) => {
    const p = s.productos.find((x) => x.id === productoId);
    if (p) p.precio = precio;
  });
}

// Devuelve coincidencias aunque estén agotadas: el bot necesita encontrarlas para rechazarlas.
export function findProducts(state, texto, sucursalId) {
  const q = palabras(texto);
  if (!q.length) return [];
  const qJoin = q.join(' ');
  const res = [];
  for (const p of state.productos) {
    const nombre = normalize(p.nombre);
    const campo = `${nombre} ${normalize(p.categoria)}`;
    if (!q.every((w) => campo.includes(w))) continue;
    let score = nombre === qJoin ? 3 : nombre.includes(qJoin) ? 2 : 1;
    if (isAvailable(state, p.id, sucursalId)) score += 0.5;
    res.push({ p, score });
  }
  return res.sort((a, b) => b.score - a.score).map((r) => r.p);
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
