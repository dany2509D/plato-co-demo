// Horarios de sucursal en hora de Panamá (UTC-5 todo el año, sin horario de verano). Lógica pura.
const OFFSET_MS = -5 * 3600 * 1000;

export function horaPanama(fecha = new Date()) {
  const d = new Date(fecha.getTime() + OFFSET_MS);
  return { dia: d.getUTCDay(), minutos: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

// 'HH:MM' -> minutos desde medianoche (null si no es válido). Acepta '24:00'.
export function aMinutos(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm ?? '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 24 || min > 59 || (h === 24 && min > 0)) return null;
  return h * 60 + min;
}

// Abierto desde `abre` (incluido) hasta `cierra` (excluido); admite horarios que cruzan la medianoche.
export function estaAbierto(horario, minutos) {
  const a = aMinutos(horario?.abre);
  const c = aMinutos(horario?.cierra);
  if (a === null || c === null || a === c) return false;
  return a < c ? minutos >= a && minutos < c : minutos >= a || minutos < c;
}

export function estadoSucursal(horario, fecha = new Date()) {
  const a = aMinutos(horario?.abre);
  const c = aMinutos(horario?.cierra);
  if (a === null || c === null) return { abierto: false, etiqueta: 'Horario no disponible', detalle: '', cierraPronto: false };
  const { minutos } = horaPanama(fecha);
  if (estaAbierto(horario, minutos)) {
    const faltan = (c - minutos + 1440) % 1440;
    return { abierto: true, etiqueta: 'Abierto ahora', detalle: `Cierra a las ${horario.cierra}`, cierraPronto: faltan <= 30 };
  }
  const hoy = minutos < a;
  return { abierto: false, etiqueta: 'Cerrado', detalle: `Abre ${hoy ? 'hoy' : 'mañana'} a las ${horario.abre}`, cierraPronto: false };
}

// Menú del día: lunes a viernes de 11:00 a 15:00.
export function menuDelDiaActivo(fecha = new Date()) {
  const { dia, minutos } = horaPanama(fecha);
  return dia >= 1 && dia <= 5 && minutos >= 11 * 60 && minutos < 15 * 60;
}

// Aviso informativo del pago cuando la sucursal elegida está cerrada ahora (no bloquea el pedido). '' si está abierta.
export function avisoSucursalCerrada(sucursal, fecha = new Date()) {
  if (!sucursal) return '';
  const st = estadoSucursal(sucursal.horario, fecha);
  if (st.abierto || st.etiqueta !== 'Cerrado') return '';
  return `${sucursal.nombre} está cerrada ahora (${st.detalle.charAt(0).toLowerCase()}${st.detalle.slice(1)}). Puede enviar su pedido igualmente: quedará programado para cuando abra.`;
}
