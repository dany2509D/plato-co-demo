import { ESTADOS } from './estados.js';

// Umbrales de color de la pantalla de cocina (minutos desde la creación).
export const UMBRAL_AMARILLO_MIN = 10;
export const UMBRAL_ROJO_MIN = 20;
export const COLUMNAS = ESTADOS.filter((e) => e !== 'Entregado');

export function elapsedMinutes(pedido, now = Date.now()) {
  return (now - Date.parse(pedido.creadoEn)) / 60000;
}

// verde < 10 min, amarillo de 10:00 a 20:00 (inclusive), rojo > 20:00.
export function urgency(min) {
  if (min > UMBRAL_ROJO_MIN) return 'rojo';
  if (min >= UMBRAL_AMARILLO_MIN) return 'amarillo';
  return 'verde';
}

// Minutos enteros (la pantalla se refresca cada 30 s): '9 min', '1 h 15 min'.
export function formatElapsed(min) {
  const m = Math.max(0, Math.floor(min));
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
}

// Pedidos de la sucursal que no están entregados, el más antiguo primero.
export function activeOrders(state, sucursalId) {
  return state.pedidos
    .filter((p) => p.sucursalId === sucursalId && p.estado !== 'Entregado')
    .sort((a, b) => Date.parse(a.creadoEn) - Date.parse(b.creadoEn));
}

export function deliveredOrders(state, sucursalId, limit = 5) {
  return state.pedidos
    .filter((p) => p.sucursalId === sucursalId && p.estado === 'Entregado')
    .sort((a, b) => Date.parse(b.creadoEn) - Date.parse(a.creadoEn))
    .slice(0, limit);
}

export function groupByEstado(pedidos) {
  const g = Object.fromEntries(COLUMNAS.map((e) => [e, []]));
  for (const p of pedidos) if (g[p.estado]) g[p.estado].push(p);
  return g;
}

// Siguiente estado según el tipo (retiro omite 'En camino'); null si no hay.
export function nextLabel(pedido) {
  const flujo = pedido.tipo === 'retiro' ? ESTADOS.filter((e) => e !== 'En camino') : ESTADOS;
  const i = flujo.indexOf(pedido.estado);
  return i === -1 || i >= flujo.length - 1 ? null : flujo[i + 1];
}
