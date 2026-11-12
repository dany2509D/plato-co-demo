import { buildSeed } from '../data/seed.js';
import { repararEstado } from './state-shape.js';

const OFFSET_PANAMA_MS = -5 * 3600 * 1000;
const MAX_EDAD_MS = 4 * 3600 * 1000;
const diaPanama = (ms) => new Date(ms + OFFSET_PANAMA_MS).toISOString().slice(0, 10);

// Datos guardados que se descartan y se vuelven a sembrar: sin sellos válidos (seedDia, seedEn,
// ultimaActividad), o sin actividad en las últimas 4 h Y (de otro día de Panamá, o con pedidos
// activos que ya serían absurdos, "7 h retrasado"). Un estado con actividad en las últimas 4 h
// NUNCA se borra, ni siquiera al cruzar la medianoche (presentador a las 23:50, recarga a las 00:05).
export function estadoViejo(s, now = new Date()) {
  const sembrado = Date.parse(s.seedEn);
  const actividad = Date.parse(s.ultimaActividad);
  if (typeof s.seedDia !== 'string' || !Number.isFinite(sembrado) || !Number.isFinite(actividad)) return true;
  if (now.getTime() - actividad <= MAX_EDAD_MS) return false;
  if (s.seedDia !== diaPanama(now.getTime())) return true;
  return s.pedidos.some((p) => p.estado !== 'Entregado' && now.getTime() - Date.parse(p.creadoEn) > MAX_EDAD_MS);
}

// Siembra nueva; `previo` es el seedId anterior (nunca se repite, para que los ids de pedido de una
// siembra anterior no se confundan con los nuevos) y `rev` supera al de cualquier copia conocida.
function sembrar(previo, rev) {
  const now = new Date();
  const s = { ...buildSeed(now), ultimaActividad: now.toISOString(), rev };
  if (previo && s.seedId === previo) {
    s.seedId = `${previo}b`;
    for (const p of s.pedidos) p.seedId = s.seedId;
  }
  return s;
}

export function createStore(storage) {
  const guardado = repararEstado(storage.read());
  let state = guardado && !estadoViejo(guardado) ? guardado : null;
  if (!state) { state = sembrar(guardado?.seedId, (guardado?.rev ?? 0) + 1); storage.write(state); }
  const suscriptores = new Set();
  const eventos = new Map();

  const notificar = () => { for (const fn of [...suscriptores]) fn(state); };

  // Copia más reciente guardada por otra pestaña (rev mayor), ya validada; o null.
  const masNueva = () => {
    try {
      const crudo = storage.read();
      if (!crudo || !(Number(crudo.rev) > state.rev)) return null;
      return repararEstado(crudo);
    } catch { return null; }
  };

  // Otra pestaña/ventana escribió: se adopta su estado y se avisa a las vistas. No se escribe de vuelta.
  try {
    storage.subscribe?.(() => {
      const nuevo = masNueva();
      if (!nuevo || !(nuevo.rev > state.rev)) return;
      state = nuevo;
      notificar();
    });
  } catch { /* sin sincronización entre pestañas */ }

  return {
    get: () => state,
    update(fn) {
      // Cada update guarda el estado completo: antes de aplicar se toma lo último guardado si es más nuevo.
      const nuevo = masNueva();
      if (nuevo) state = nuevo;
      fn(state);
      state.rev = (Number(state.rev) || 0) + 1;
      state.ultimaActividad = new Date().toISOString();
      for (const p of state.pedidos) if (!p.seedId) p.seedId = state.seedId;
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
      const crudo = storage.read();
      state = sembrar(state.seedId, Math.max(state.rev, Number(crudo?.rev) || 0) + 1);
      storage.write(state);
      notificar();
    },
  };
}
