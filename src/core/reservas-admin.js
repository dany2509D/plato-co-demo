// Lógica pura de la vista de reservas del administrador.
const FRANJA_MIN = 90;

const aMin = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm ?? ''));
  if (!m) return null;
  const h = Number(m[1]), mi = Number(m[2]);
  return h > 23 || mi > 59 ? null : h * 60 + mi;
};

// Hora en punto (bloque de selección) a la que pertenece una hora: '13:30' -> '13:00'.
export function franjaDeHora(hora) {
  const m = aMin(hora);
  return m === null ? null : `${String(Math.floor(m / 60)).padStart(2, '0')}:00`;
}

// ¿La reserva de `hora` (dura 90 min) ocupa el bloque horario [franja, franja+60)? Igual que occupancyByHour.
export function enFranja(hora, franja) {
  const m = aMin(hora), h = aMin(franja);
  if (m === null || h === null) return false;
  return m < h + 60 && h < m + FRANJA_MIN;
}

// Reservas de una sucursal en una fecha, ordenadas por hora (copia; no muta el estado).
export function reservasDelDia(state, sucursalId, fecha) {
  return state.reservas
    .filter((r) => r.sucursalId === sucursalId && r.fecha === fecha)
    .sort((a, b) => (aMin(a.hora) ?? 0) - (aMin(b.hora) ?? 0) || String(a.id).localeCompare(String(b.id)));
}

// {mesaId: reserva | null} para la franja: solo las reservas con mesa ocupan.
export function estadoMesas(mesas, reservas, franja) {
  const out = {};
  for (const m of mesas) out[m.id] = null;
  for (const r of reservas) {
    if (r.mesaId && r.mesaId in out && out[r.mesaId] === null && enFranja(r.hora, franja)) out[r.mesaId] = r;
  }
  return out;
}

export function fechasConReservas(state, sucursalId) {
  return [...new Set(state.reservas.filter((r) => r.sucursalId === sucursalId).map((r) => r.fecha))].sort();
}

export function resumenReserva(r) {
  const sinMesa = !r.mesaId;
  const pendiente = r.estado === 'pendiente';
  return { sinMesa, pendiente, atencion: sinMesa || pendiente };
}
