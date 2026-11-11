import { buildSeed } from '../data/seed.js';

function estadoValido(s) {
  return !!s && ['sucursales', 'productos', 'combos', 'pedidos', 'reservas', 'conversaciones'].every((k) => Array.isArray(s[k])) && !!s.ui;
}

const OFFSET_PANAMA_MS = -5 * 3600 * 1000;
const MAX_EDAD_MS = 4 * 3600 * 1000;
const diaPanama = (ms) => new Date(ms + OFFSET_PANAMA_MS).toISOString().slice(0, 10);

// Datos guardados de otro día (Panamá), sin sello de siembra, o sembrados hace más de 4 h con pedidos
// activos que ya serían absurdos ("7 h retrasado"): se descartan y se vuelve a sembrar.
export function estadoViejo(s, now = new Date()) {
  const sembrado = Date.parse(s.seedEn);
  if (typeof s.seedDia !== 'string' || !Number.isFinite(sembrado)) return true;
  if (s.seedDia !== diaPanama(now.getTime())) return true;
  if (now.getTime() - sembrado <= MAX_EDAD_MS) return false;
  return s.pedidos.some((p) => p.estado !== 'Entregado' && now.getTime() - Date.parse(p.creadoEn) > MAX_EDAD_MS);
}

export function createStore(storage) {
  const guardado = storage.read();
  let state = estadoValido(guardado) && !estadoViejo(guardado) ? guardado : buildSeed(new Date());
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
