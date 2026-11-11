import { normalize } from '../core/text.js';

// Fechas y horas en palabras (es/en), en hora de Panamá (UTC-5). `ahora` es un Date inyectable.
const OFFSET_MS = -5 * 3600000;
const pad = (n) => String(n).padStart(2, '0');
const DIAS = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6,
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

export function horaPanama(date) {
  return new Date(date.getTime() + OFFSET_MS).toISOString().slice(11, 16);
}

const sumarDias = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

// 'YYYY-MM-DD' o null.
export function parseFecha(texto, ahora) {
  const t = normalize(texto);
  const hoy = new Date(ahora.getTime() + OFFSET_MS).toISOString().slice(0, 10);
  const iso = /\b(\d{4}-\d{2}-\d{2})\b/.exec(t);
  if (iso) return iso[1];
  if (/\b(pasado manana|day after tomorrow)\b/.test(t)) return sumarDias(hoy, 2);
  if (/\b(manana|tomorrow)\b/.test(t) && !/\bmanana (por la )?(tarde|noche)\b/.test(t)) return sumarDias(hoy, 1);
  if (/\b(hoy|today|tonight|esta noche)\b/.test(t)) return hoy;
  const dia = Object.keys(DIAS).find((d) => new RegExp(`\\b${d}\\b`).test(t));
  if (dia) {
    const dow = new Date(`${hoy}T00:00:00Z`).getUTCDay();
    return sumarDias(hoy, (DIAS[dia] - dow + 7) % 7);
  }
  return null;
}

// 'HH:MM' o null. Con `suelto` acepta un número solo ("8") como hora.
export function parseHora(texto, { suelto = false } = {}) {
  const t = normalize(texto).replace(/\d{4}-\d{2}-\d{2}/g, ' ');
  const m = /\b(?:a las|at|@)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|h|hrs)?\b/.exec(t)
    ?? /\b(\d{1,2})(?::(\d{2}))\s*(am|pm|h|hrs)?\b/.exec(t)
    ?? /\b(\d{1,2})\s*(am|pm|h|hrs)\b/.exec(t)
    ?? /\b(\d{1,2})\s*de la (manana|tarde|noche)\b/.exec(t)
    ?? (suelto ? /\b(\d{1,2})\b/.exec(t) : null);
  if (!m) return null;
  let h = Number(m[1]);
  let min = 0;
  let suf = '';
  for (const g of m.slice(2)) {
    if (/^\d\d$/.test(g ?? '')) min = Number(g);
    else if (g) suf = g.replace(/\./g, '');
  }
  if (suf === 'pm' && h < 12) h += 12;
  else if (suf === 'am' && h === 12) h = 0;
  else if ((suf === 'tarde' || suf === 'noche') && h < 12) h += 12;
  else if (!suf && !/:/.test(m[0]) && h >= 1 && h <= 10) h += 12; // "a las 8" en un restaurante: 20:00
  if (h > 23 || min > 59) return null;
  return `${pad(h)}:${pad(min)}`;
}

// Quita del texto la expresión de hora que parseHora tomó (para no confundirla con personas).
export function sinHora(texto) {
  return normalize(texto)
    .replace(/\b(a las|at|@)\s*\d{1,2}(:\d{2})?\s*(am|pm|h|hrs)?\b/g, ' ')
    .replace(/\b\d{1,2}(:\d{2})?\s*(am|pm|a\.m\.|p\.m\.|h|hrs)\b/g, ' ')
    .replace(/\b\d{1,2}:\d{2}\b/g, ' ')
    .replace(/\d{4}-\d{2}-\d{2}/g, ' ');
}
