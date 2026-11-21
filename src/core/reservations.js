import { normalize } from './text.js';

const FRANJA_MIN = 90;
const MAX_PERSONAS = 8;
const PANAMA_OFFSET_MS = -5 * 3600000; // America/Panama: UTC-5, sin horario de verano

const aMin = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm ?? ''));
  if (!m) return null;
  const h = Number(m[1]), mi = Number(m[2]);
  return h > 23 || mi > 59 ? null : h * 60 + mi;
};
const pad = (n) => String(n).padStart(2, '0');
const aHora = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

// {fecha:'YYYY-MM-DD', min} de un instante, en hora de Panamá.
function panama(date) {
  const iso = new Date(date.getTime() + PANAMA_OFFSET_MS).toISOString();
  return { fecha: iso.slice(0, 10), min: aMin(iso.slice(11, 16)) };
}

const solapan = (a, b) => a < b + FRANJA_MIN && b < a + FRANJA_MIN;

// La franja que empieza en m (90 min) toca el bloque horario [h, h+60).
const cubreHora = (h, m) => m < h + 60 && h < m + FRANJA_MIN;

// Mesas ocupadas (por reservas con mesaId) en una franja; ignora `exceptoId`.
function mesasOcupadas(state, sucursalId, fecha, min, exceptoId, choca = solapan) {
  const ids = new Set();
  for (const r of state.reservas) {
    if (!r.mesaId || r.id === exceptoId || r.sucursalId !== sucursalId || r.fecha !== fecha) continue;
    const m = aMin(r.hora);
    if (m !== null && choca(min, m)) ids.add(r.mesaId);
  }
  return ids;
}

// Mesas con capacidad suficiente y libres en la franja de 90 min, de menor a mayor capacidad.
export function availableTables(state, sucursalId, fecha, hora, personas) {
  const suc = state.sucursales.find((s) => s.id === sucursalId);
  const min = aMin(hora);
  if (!suc || min === null) return [];
  const ocupadas = mesasOcupadas(state, sucursalId, fecha, min);
  return suc.mesas
    .filter((m) => m.capacidad >= personas && !ocupadas.has(m.id))
    .sort((a, b) => a.capacidad - b.capacidad);
}

function siguienteId(state) {
  const max = state.reservas.reduce((m, r) => Math.max(m, Number(/^res-(\d+)$/.exec(r.id)?.[1] ?? 0)), 0);
  return `res-${String(max + 1).padStart(2, '0')}`;
}

// createReservation(store, {sucursalId, fecha, hora, personas, ocasion}, {ahora: Date} = {})
// `ahora` (opcional, por defecto new Date()) permite probar la regla de fecha pasada.
// Devuelve {ok:true, reserva} o {ok:false, razon:'personas_invalidas'|'handoff'|'fecha_pasada'|'fuera_de_horario'|'sin_mesa'}.
export function createReservation(store, data, { ahora = new Date() } = {}) {
  const state = store.get();
  const personas = data?.personas;
  if (!Number.isInteger(personas) || personas < 1) return { ok: false, razon: 'personas_invalidas' };
  if (personas > MAX_PERSONAS || normalize(data.ocasion) === 'evento') return { ok: false, razon: 'handoff' };

  const min = aMin(data.hora);
  if (min === null || !/^\d{4}-\d{2}-\d{2}$/.test(String(data.fecha ?? ''))) return { ok: false, razon: 'fuera_de_horario' };
  const hoy = panama(ahora);
  if (data.fecha < hoy.fecha || (data.fecha === hoy.fecha && min <= hoy.min)) return { ok: false, razon: 'fecha_pasada' };

  const suc = state.sucursales.find((s) => s.id === data.sucursalId);
  if (!suc) return { ok: false, razon: 'sin_mesa' };
  if (min < aMin(suc.horario.abre) || min + FRANJA_MIN > aMin(suc.horario.cierra)) return { ok: false, razon: 'fuera_de_horario' };

  const mesa = availableTables(state, suc.id, data.fecha, data.hora, personas)[0];
  if (!mesa) return { ok: false, razon: 'sin_mesa' };

  const reserva = {
    id: siguienteId(state),
    sucursalId: suc.id, fecha: data.fecha, hora: aHora(min), personas,
    ocasion: data.ocasion ?? 'ninguna',
    mesaId: mesa.id, estado: 'confirmada',
  };
  store.update((s) => { s.reservas.push(reserva); });
  store.emit('reserva:creada', { reservaId: reserva.id });
  return { ok: true, reserva: store.get().reservas.find((r) => r.id === reserva.id) };
}

// Devuelve {ok:true} o {ok:false, razon:'no_encontrada'|'capacidad'|'mesa_ocupada'}. Nunca lanza.
export function assignTable(store, reservaId, mesaId) {
  const state = store.get();
  const reserva = state.reservas.find((r) => r.id === reservaId);
  const suc = reserva && state.sucursales.find((s) => s.id === reserva.sucursalId);
  const mesa = suc?.mesas.find((m) => m.id === mesaId);
  if (!reserva || !mesa) return { ok: false, razon: 'no_encontrada' };
  if (mesa.capacidad < reserva.personas) return { ok: false, razon: 'capacidad' };
  const min = aMin(reserva.hora);
  if (min !== null && mesasOcupadas(state, suc.id, reserva.fecha, min, reserva.id).has(mesa.id)) {
    return { ok: false, razon: 'mesa_ocupada' };
  }
  store.update((s) => {
    const r = s.reservas.find((x) => x.id === reservaId);
    r.mesaId = mesaId;
    r.estado = 'confirmada';
  });
  return { ok: true };
}

// Mesas ocupadas por hora en punto dentro del horario (una mesa cuenta si su franja cubre esa hora).
export function occupancyByHour(state, sucursalId, fecha) {
  const suc = state.sucursales.find((s) => s.id === sucursalId);
  if (!suc) return [];
  const abre = aMin(suc.horario.abre), cierra = aMin(suc.horario.cierra);
  const out = [];
  for (let h = Math.ceil(abre / 60) * 60; h < cierra; h += 60) {
    out.push({ hora: aHora(h), mesasOcupadas: mesasOcupadas(state, sucursalId, fecha, h, null, cubreHora).size, mesasTotal: suc.mesas.length });
  }
  return out;
}
