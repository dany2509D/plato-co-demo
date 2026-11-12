// Referencias a pedidos que sobreviven a un reinicio de la demo: tras "Reiniciar" los ids ped-NNN se
// vuelven a usar, así que el enlace lleva además el seedId de la siembra (?s=...). Un enlace de una
// siembra anterior ya no resuelve a un pedido distinto.

export const enlacePedido = (pedido) =>
  `#/pedido/${encodeURIComponent(pedido.id)}${pedido.seedId ? `?s=${encodeURIComponent(pedido.seedId)}` : ''}`;

// seedId opcional (el que trae el enlace). Sin seedId se busca solo por id (compatibilidad).
export function pedidoPorId(state, id, seedId) {
  const p = (state?.pedidos ?? []).find((x) => x.id === id);
  if (!p) return null;
  if (seedId && p.seedId && p.seedId !== seedId) return null;
  return p;
}
