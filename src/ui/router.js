const SIMPLES = ['inicio', 'menu', 'carrito', 'chat', 'estilo'];
const ADMIN = ['cocina', 'reservas', 'menu', 'indicadores'];

// decodeURIComponent lanza con porcentajes inválidos (%E0%A4%A): se devuelve el texto crudo.
function decodificar(t) {
  try { return decodeURIComponent(t); } catch { return t; }
}

export function parseRoute(hash) {
  const [camino, consulta = ''] = String(hash || '').replace(/^#\/?/, '').split('?');
  const partes = camino.split('/').filter(Boolean).map(decodificar);
  const [a, b] = partes;
  const seed = new URLSearchParams(consulta).get('s'); // seedId del enlace de pedido (?s=...)
  if (SIMPLES.includes(a) && partes.length === 1) return { name: a, params: {} };
  if (a === 'pedido' && b && partes.length === 2) return { name: 'pedido', params: seed ? { id: b, seed } : { id: b } };
  if (a === 'admin' && ADMIN.includes(b) && partes.length === 2) return { name: 'admin-' + b, params: {} };
  return { name: 'inicio', params: {} };
}

export function onRouteChange(callback) {
  const run = () => callback(parseRoute(location.hash));
  window.addEventListener('hashchange', run);
  run();
}
