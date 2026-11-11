import { normalize } from './text.js';
import { isAvailable } from './menu.js';

// Productos agrupados por categoría (orden de aparición), incluyendo agotados con la bandera `agotado`.
// filtros: {texto, categoria, soloAgotados}
export function adminMenuGroups(state, sucursalId, { texto = '', categoria = '', soloAgotados = false } = {}) {
  const q = normalize(texto);
  const grupos = new Map();
  for (const p of state.productos) {
    if (categoria && p.categoria !== categoria) continue;
    if (q && !normalize(p.nombre).includes(q)) continue;
    const agotado = !isAvailable(state, p.id, sucursalId);
    if (soloAgotados && !agotado) continue;
    if (!grupos.has(p.categoria)) grupos.set(p.categoria, []);
    grupos.get(p.categoria).push({ ...p, agotado });
  }
  return [...grupos].map(([cat, productos]) => ({ categoria: cat, productos }));
}

export function countAgotados(state, sucursalId) {
  return state.productos.filter((p) => !isAvailable(state, p.id, sucursalId)).length;
}

export function categoriasDe(state) {
  return [...new Set(state.productos.map((p) => p.categoria))];
}

// Texto del campo de precio -> número en dólares con 2 decimales, o null si no es válido (> 0).
export function parsePrecio(texto) {
  if (texto === null || texto === undefined) return null;
  const t = String(texto).trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const n = Math.round(Number(t) * 100) / 100;
  return Number.isFinite(n) && n > 0 ? n : null;
}
