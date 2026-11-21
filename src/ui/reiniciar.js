import { store } from '../core/app-store.js';

// Reinicio de la demo con confirmación; lo comparten el encabezado del cliente y la barra de admin.
export function reiniciarDemo() {
  if (!window.confirm('¿Desea reiniciar la demo? Se borrarán los cambios y volverán los datos de ejemplo.')) return;
  store.reset();
  window.dispatchEvent(new HashChangeEvent('hashchange')); // vuelve a pintar la ruta actual
}
