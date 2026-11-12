import { normalize } from '../core/text.js';

// Helpers puros del motor del bot para decidir qué hacer con un texto dentro de un paso
// (pedido a secas, dirección, ocasión de la reserva, pedido repetido). Sin estado ni acceso al store.

const FILL_PEDIR = new Set(['quiero', 'quisiera', 'deseo', 'necesito', 'me', 'gustaria', 'hacer', 'realizar', 'tomar', 'colocar', 'un', 'una', 'mi', 'el', 'favor', 'por', 'please', 'i', 'want', "i'd", 'id', 'like', 'to', 'place', 'make', 'an', 'a', 'my', 'would', 'can', 'could', 'do', 'ahora', 'now']);
const CLAVE_PEDIR = new Set(['pedido', 'pedir', 'ordenar', 'orden', 'order']);
const FILL_ALERGENO = new Set(['quiero', 'quisiera', 'necesito', 'saber', 'ver', 'consultar', 'conocer', 'preguntar', 'los', 'las', 'el', 'la', 'de', 'sobre', 'about', 'the', 'info', 'informacion', 'por', 'favor', 'please', 'i', 'want', 'to', 'know', 'check', 'my', 'mis', 'mi', 'tengo', 'una', 'un', 'an', 'a', 'on', 'for', 'of', 'y', 'and']);
const CLAVE_ALERGENO = new Set(['alergeno', 'alergenos', 'alergia', 'alergias', 'allergen', 'allergens', 'allergy', 'allergies']);
const palabrasDe = (n) => n.replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);

// «Hacer un pedido» o «Alérgenos» a secas: piden el detalle, no son un pedido ni una consulta resuelta.
export function esPedirVacio(n) {
  const ws = palabrasDe(n);
  if (ws.length === 2 && (ws[0] === 'mi' || ws[0] === 'my')) return false; // «mi pedido» a secas es una consulta de estado
  return ws.some((w) => CLAVE_PEDIR.has(w)) && ws.every((w) => CLAVE_PEDIR.has(w) || FILL_PEDIR.has(w));
}
export function esAlergenoVacio(n) {
  const ws = palabrasDe(n);
  return ws.some((w) => CLAVE_ALERGENO.has(w)) && ws.every((w) => CLAVE_ALERGENO.has(w) || FILL_ALERGENO.has(w));
}

// ---------- dirección ----------
const CALLE = /\b(calle|avenida|ave|av|casa|edificio|apto|apartamento|torre|via|plaza|corregimiento|barrio|sector|urbanizacion|urb|residencial|ph|piso|street|st|road|building|apt|house|tower)\b/;

// ¿Parece una dirección? `fuerte`: es otra intención clara (pedido, pregunta); `debil`: horarios, ubicación, menú.
// Sí si trae números o palabras de calle, o una zona conocida; si no, hacen falta 3 palabras o más y que no sea otra intención.
export function pareceDireccion(n, zonas, { fuerte = false, debil = false } = {}) {
  if (fuerte) return false;
  if (/\d/.test(n) || CALLE.test(n) || zonas.some((z) => n.includes(normalize(z)))) return true;
  if (debil) return false;
  return n.split(' ').filter(Boolean).length >= 3;
}

// ---------- ocasión de la reserva ----------
const SIN_OCASION = /^(no|ninguna|nada|ninguno|none|nope|nop|nothing|no occasion|no special occasion|sin ocasion)\W*$/;
const OCASION_RECONOCIDA = /cumple|birthday|aniversario|anniversary|\bcita\b|\bdate\b|reunion|meeting|familia|family|negocio|business|graduacion|graduation|despedida|celebracion|celebration|boda|wedding|compromiso|engagement|\bcena\b|dinner|almuerzo|lunch|evento|event/;
const RESERVA_KW = /reserv|\bbook\b|booking|table for|mesa para|una mesa|a table|personas?|people|guests?|pax|comensales/;
export { RESERVA_KW };

export const ocasionNinguna = (n) => SIN_OCASION.test(n);
export const ocasionReconocida = (n) => OCASION_RECONOCIDA.test(n);
// Texto libre aceptable como ocasión: corto, sin pregunta ni palabras de reserva.
export const ocasionLibre = (texto, n) => n.split(' ').filter(Boolean).length <= 4 && !/[?¿]/.test(texto) && !RESERVA_KW.test(n);

// ---------- pedido repetido ----------
// Señales de que el cliente quiere SUMAR (la «y» solo cuenta al inicio: «2 hamburguesas y una limonada» no suma).
export const CUE_SUMAR = /^(y|and|tambien|also|mas|otra|otro|another)\b|\b(agrega\w*|anade\w*|anadir|suma\w*|add|another|otra|otro|mas|also|tambien|ponle)\b/;

const claveLinea = (l) => `${l.productoId}|${[...l.modificadores].sort().join('|')}`;
// ¿Todas las líneas nuevas ya están en el pedido (mismo producto y mismos modificadores)?
export function mismasLineas(nuevas, actuales) {
  const claves = new Set(actuales.map(claveLinea));
  return nuevas.length > 0 && nuevas.every((l) => claves.has(claveLinea(l)));
}
