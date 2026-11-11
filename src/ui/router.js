const SIMPLES = ['inicio', 'menu', 'carrito', 'chat', 'estilo'];
const ADMIN = ['cocina', 'reservas', 'menu', 'indicadores'];

export function parseRoute(hash) {
  const limpio = String(hash || '').replace(/^#\/?/, '').split('?')[0];
  const partes = limpio.split('/').filter(Boolean).map(decodeURIComponent);
  const [a, b] = partes;
  if (SIMPLES.includes(a) && partes.length === 1) return { name: a, params: {} };
  if (a === 'pedido' && b && partes.length === 2) return { name: 'pedido', params: { id: b } };
  if (a === 'admin' && ADMIN.includes(b) && partes.length === 2) return { name: 'admin-' + b, params: {} };
  return { name: 'inicio', params: {} };
}

export function onRouteChange(callback) {
  const run = () => callback(parseRoute(location.hash));
  window.addEventListener('hashchange', run);
  run();
}
