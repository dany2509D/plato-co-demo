import { createStorage } from './storage.js';
import { createStore } from './store.js';

// Instancia única de la app (las vistas importan `store` de aquí).
export const store = createStore(createStorage('plato-co-demo:v1'));
