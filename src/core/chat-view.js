// Lógica pura del chat simulado (sin DOM): hora de Panamá, agrupación por día,
// texto seguro, mensajes nuevos y retardo de "escribiendo…".
const OFFSET_MS = -5 * 3600000; // Panamá no usa horario de verano.
const MESES = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escapeHtml = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

function panama(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime() + OFFSET_MS);
}

// '3:05 p. m.' en hora de Panamá. Cadena vacía si la fecha no es válida.
export function formatHora(iso) {
  const p = panama(iso);
  if (!p) return '';
  const h = p.getUTCHours();
  const m = String(p.getUTCMinutes()).padStart(2, '0');
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? 'a. m.' : 'p. m.'}`;
}

// 'YYYY-MM-DD' en Panamá.
export function diaPanama(iso) {
  const p = panama(iso);
  return p ? p.toISOString().slice(0, 10) : '';
}

export function etiquetaDia(dia, ahoraIso) {
  const hoy = diaPanama(ahoraIso);
  if (dia === hoy) return 'Hoy';
  const ayer = new Date(Date.parse(`${hoy}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);
  if (dia === ayer) return 'Ayer';
  const [a, m, d] = dia.split('-');
  return `${Number(d)} ${MESES[Number(m) - 1] ?? ''} ${a}`;
}

// Hora a mostrar: de `en` (ISO) y, si falta, de `hora` ('HH:mm' ya en Panamá).
export function horaMensaje(msg) {
  if (msg?.en) { const h = formatHora(msg.en); if (h) return h; }
  return msg?.hora ?? '';
}

// Agrupa por día de Panamá conservando el orden. Mensajes sin fecha van al día anterior.
export function agruparPorDia(mensajes) {
  const grupos = [];
  let ultimo = '';
  for (const msg of mensajes ?? []) {
    const dia = msg?.en ? diaPanama(msg.en) : '';
    const d = dia || ultimo;
    if (!grupos.length || grupos[grupos.length - 1].dia !== d) grupos.push({ dia: d, mensajes: [] });
    grupos[grupos.length - 1].mensajes.push(msg);
    if (d) ultimo = d;
  }
  return grupos;
}

// Texto -> segmentos {t:'texto'|'negrita', v}. Nunca interpreta HTML: el llamador usa textContent.
export function segmentos(texto) {
  const s = String(texto ?? '');
  const out = [];
  const re = /\*([^*\n]+)\*/g;
  let i = 0;
  let m;
  while ((m = re.exec(s))) {
    if (m.index > i) out.push({ t: 'texto', v: s.slice(i, m.index) });
    out.push({ t: 'negrita', v: m[1] });
    i = m.index + m[0].length;
  }
  if (i < s.length) out.push({ t: 'texto', v: s.slice(i) });
  return out;
}

// Variante en HTML ya escapado (para quien no pueda usar nodos).
export function textoSeguroHtml(texto) {
  return segmentos(texto).map((x) => (x.t === 'negrita' ? `<strong>${escapeHtml(x.v)}</strong>` : escapeHtml(x.v))).join('');
}

// Mensajes que aún no se han mostrado. Si el historial se acortó (reinicio), pide repintar todo.
export function mensajesNuevos(mostrados, mensajes) {
  const lista = mensajes ?? [];
  if (lista.length < mostrados) return { reiniciar: true, nuevos: lista };
  return { reiniciar: false, nuevos: lista.slice(mostrados) };
}

// Retardo de "escribiendo…" entre 300 y 900 ms según el largo del texto.
export function retardoEscribiendo(texto) {
  const n = String(texto ?? '').length;
  return Math.min(900, 300 + Math.round(n * 4));
}

// Un mensaje del cliente está "leído" cuando hay una respuesta del bot posterior.
export function leidos(mensajes) {
  const r = [];
  let hayBot = false;
  for (let i = (mensajes?.length ?? 0) - 1; i >= 0; i--) {
    if (mensajes[i].de === 'bot') hayBot = true;
    r[i] = mensajes[i].de === 'cliente' && hayBot;
  }
  return r;
}

export const SALUDO = {
  texto: '¡Hola! Soy el asistente de *Plato & Co.* Puedo tomar su pedido, reservar una mesa o darle horarios y ubicación.\nEnglish? Just write to me in English and I will answer.',
  botones: ['Hacer un pedido', 'Reservar mesa', 'Horarios y ubicación', 'Alérgenos', 'Pasar a una persona'],
};
