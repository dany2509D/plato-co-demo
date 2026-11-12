import { buildSeed } from '../data/seed.js';

function estadoValido(s) {
  return !!s && ['sucursales', 'productos', 'combos', 'pedidos', 'reservas', 'conversaciones'].every((k) => Array.isArray(s[k])) && !!s.ui;
}

const OFFSET_PANAMA_MS = -5 * 3600 * 1000;
const MAX_EDAD_MS = 4 * 3600 * 1000;
const diaPanama = (ms) => new Date(ms + OFFSET_PANAMA_MS).toISOString().slice(0, 10);

// Datos guardados que se descartan y se vuelven a sembrar: sin sellos válidos (seedDia, seedEn,
// ultimaActividad), de otro día de Panamá, o sin actividad hace más de 4 h con pedidos activos que
// ya serían absurdos ("7 h retrasado"). Un estado del mismo día con actividad reciente NUNCA se borra.
export function estadoViejo(s, now = new Date()) {
  const sembrado = Date.parse(s.seedEn);
  const actividad = Date.parse(s.ultimaActividad);
  if (typeof s.seedDia !== 'string' || !Number.isFinite(sembrado) || !Number.isFinite(actividad)) return true;
  if (s.seedDia !== diaPanama(now.getTime())) return true;
  if (now.getTime() - actividad <= MAX_EDAD_MS) return false;
  return s.pedidos.some((p) => p.estado !== 'Entregado' && now.getTime() - Date.parse(p.creadoEn) > MAX_EDAD_MS);
}

const sembrar = () => { const now = new Date(); return { ...buildSeed(now), ultimaActividad: now.toISOString() }; };

export function createStore(storage) {
  const guardado = storage.read();
  let state = estadoValido(guardado) && !estadoViejo(guardado) ? guardado : sembrar();
  const suscriptores = new Set();
  const eventos = new Map();

  const notificar = () => { for (const fn of [...suscriptores]) fn(state); };

  return {
    get: () => state,
    update(fn) {
      fn(state);
      state.ultimaActividad = new Date().toISOString();
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
      state = sembrar();
      storage.write(state);
      notificar();
    },
  };
}
