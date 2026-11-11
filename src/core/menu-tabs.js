// Lógica pura de las pestañas del menú del cliente.
export const tabSlug = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// grupos: salida de visibleMenu (solo categorías con productos disponibles, en orden del seed).
export function buildTabs(grupos, { combos = false, menuDelDia = false } = {}) {
  const tabs = grupos.map((g) => ({ id: tabSlug(g.categoria), tipo: 'categoria', nombre: g.categoria, cuenta: g.productos.length }));
  if (combos) tabs.push({ id: 'combos', tipo: 'combos', nombre: 'Combos' });
  if (menuDelDia) tabs.push({ id: 'menu-del-dia', tipo: 'menu-del-dia', nombre: 'Menú del día' });
  return tabs;
}

export function resolveActiveTab(tabs, activa) {
  if (!tabs.length) return null;
  return tabs.some((t) => t.id === activa) ? activa : tabs[0].id;
}

export function nextTabIndex(actual, total, tecla) {
  if (!total) return null;
  if (tecla === 'ArrowRight') return (actual + 1) % total;
  if (tecla === 'ArrowLeft') return (actual - 1 + total) % total;
  if (tecla === 'Home') return 0;
  if (tecla === 'End') return total - 1;
  return null;
}
