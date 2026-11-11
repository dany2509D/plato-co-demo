import { createBot } from './engine.js';

// Un único bot por store, creado al arrancar la app: así su aviso de estado de pedidos
// ('pedido:estado') está siempre registrado, sin importar la ruta ni si se abrió el chat.
// store.reset() conserva los suscriptores, por lo que no hace falta recrearlo.
const bots = new WeakMap();
export function getAppBot(store) {
  let bot = bots.get(store);
  if (!bot) { bot = createBot(store); bots.set(store, bot); }
  return bot;
}
