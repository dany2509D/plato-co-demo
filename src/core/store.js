import { buildSeed } from '../data/seed.js';

function estadoValido(s) {
  return !!s && ['sucursales', 'productos', 'combos', 'pedidos', 'reservas', 'conversaciones'].every((k) => Array.isArray(s[k])) && !!s.ui;
}

export function createStore(storage) {
  const guardado = storage.read();
  let state = estadoValido(guardado) ? guardado : buildSeed(new Date());
  const suscriptores = new Set();
  const eventos = new Map();

  const notificar = () => { for (const fn of [...suscriptores]) fn(state); };

  return {
    get: () => state,
    update(fn) {
      fn(state);
      storage.write(state);
      notificar();
    },
    subscribe(fn) {
      suscriptores.add(fn);
      return () => suscriptores.delete(fn);
    },
    emit(type, payload) {
      for (const fn of [...(eventos.get(type) || [])]) fn(payload);
    },
    on(type, fn) {
      if (!eventos.has(type)) eventos.set(type, new Set());
      eventos.get(type).add(fn);
      return () => eventos.get(type).delete(fn);
    },
    reset() {
      state = buildSeed(new Date());
      storage.write(state);
      notificar();
    },
  };
}
