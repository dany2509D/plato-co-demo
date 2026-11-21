import { ESTADOS } from './estados.js';

// Valida y repara el estado leído de localStorage. Devuelve una COPIA saneada o null si no sirve
// (entonces el store vuelve a sembrar). Nunca lanza. Elimina claves peligrosas (__proto__, constructor,
// prototype), recorta cadenas enormes y limita profundidad y tamaño.

const MAX_CADENA = 5000;
const MAX_ITEMS = 5000;
const MAX_PROF = 12;
const PELIGROSAS = new Set(['__proto__', 'constructor', 'prototype']);

const esObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const esTxt = (x) => typeof x === 'string';
const esNum = (x) => typeof x === 'number' && Number.isFinite(x);

function limpiar(v, prof = 0) {
  if (prof > MAX_PROF) throw new Error('profundidad');
  if (typeof v === 'string') return v.length > MAX_CADENA ? v.slice(0, MAX_CADENA) : v;
  if (v === null || typeof v === 'boolean') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (Array.isArray(v)) {
    if (v.length > MAX_ITEMS) throw new Error('tamaño');
    return v.map((x) => limpiar(x, prof + 1));
  }
  if (typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v)) { if (!PELIGROSAS.has(k)) o[k] = limpiar(v[k], prof + 1); }
    return o;
  }
  return undefined;
}

const arrTxt = (a) => (Array.isArray(a) ? a.filter(esTxt) : []);

function lineaValida(l) {
  return esObj(l) && esTxt(l.productoId) && Number.isInteger(l.cantidad) && l.cantidad >= 1
    && (l.modificadores === undefined || Array.isArray(l.modificadores));
}
const arreglarLinea = (l) => ({ ...l, modificadores: arrTxt(l.modificadores) });

function sucursalOk(s) {
  return esObj(s) && esTxt(s.id) && esTxt(s.nombre) && esObj(s.horario) && esTxt(s.horario.abre) && esTxt(s.horario.cierra)
    && Array.isArray(s.mesas) && s.mesas.every((m) => esObj(m) && esTxt(m.id) && esNum(m.capacidad))
    && Array.isArray(s.zonasEntrega) && esNum(s.etaBaseMin);
}
function productoOk(p) {
  return esObj(p) && esTxt(p.id) && esTxt(p.nombre) && esTxt(p.categoria) && esNum(p.precio) && p.precio >= 0;
}
function comboOk(c) {
  return esObj(c) && esTxt(c.id) && esTxt(c.nombre) && esNum(c.precio) && Array.isArray(c.items)
    && c.items.every((i) => esObj(i) && esTxt(i.productoId) && esNum(i.cantidad));
}

export function repararEstado(crudo) {
  try {
    if (!esObj(crudo)) return null;
    const s = limpiar(crudo);
    if (!Array.isArray(s.sucursales) || !s.sucursales.length || !s.sucursales.every(sucursalOk)) return null;
    if (!Array.isArray(s.productos) || !s.productos.length || !s.productos.every(productoOk)) return null;
    if (!Array.isArray(s.combos) || !s.combos.every(comboOk)) return null;
    for (const p of s.productos) {
      p.modificadores = arrTxt(p.modificadores);
      p.alergenos = arrTxt(p.alergenos);
      if (!esObj(p.disponiblePorSucursal)) p.disponiblePorSucursal = {};
    }
    const sucIds = new Set(s.sucursales.map((x) => x.id));

    s.pedidos = (Array.isArray(s.pedidos) ? s.pedidos : []).filter((p) =>
      esObj(p) && esTxt(p.id) && sucIds.has(p.sucursalId) && ESTADOS.includes(p.estado) && esTxt(p.creadoEn)
      && Number.isFinite(Date.parse(p.creadoEn)) && Array.isArray(p.lineas) && p.lineas.length && p.lineas.every(lineaValida))
      .map((p) => ({
        ...p,
        lineas: p.lineas.map(arreglarLinea),
        historial: Array.isArray(p.historial) && p.historial.length && p.historial.every((h) => esObj(h) && esTxt(h.estado) && esTxt(h.en))
          ? p.historial : [{ estado: p.estado, en: p.creadoEn }],
        pago: esObj(p.pago) ? p.pago : { metodo: null, estado: 'pendiente' },
      }));

    s.reservas = (Array.isArray(s.reservas) ? s.reservas : []).filter((r) =>
      esObj(r) && esTxt(r.id) && esTxt(r.sucursalId) && esTxt(r.fecha) && esTxt(r.hora) && esNum(r.personas) && esTxt(r.estado));

    s.conversaciones = (Array.isArray(s.conversaciones) ? s.conversaciones : [])
      .filter((c) => esObj(c) && esTxt(c.id))
      .map((c) => ({ ...c, mensajes: Array.isArray(c.mensajes) ? c.mensajes.filter(esObj) : [] }));

    const ui = esObj(s.ui) ? s.ui : {};
    const primera = s.sucursales[0].id;
    s.ui = {
      ...ui,
      carrito: (Array.isArray(ui.carrito) ? ui.carrito : []).filter(lineaValida).map(arreglarLinea),
      sucursalCliente: sucIds.has(ui.sucursalCliente) ? ui.sucursalCliente : primera,
      sucursalAdmin: sucIds.has(ui.sucursalAdmin) ? ui.sucursalAdmin : primera,
      iaReal: ui.iaReal === true,
    };

    s.rev = Number.isInteger(s.rev) && s.rev >= 0 ? s.rev : 0;
    if (!esTxt(s.seedId) || !s.seedId) s.seedId = `s${(Date.parse(s.seedEn) || 0).toString(36)}`;
    for (const p of s.pedidos) if (!esTxt(p.seedId)) p.seedId = s.seedId;
    return s;
  } catch {
    return null;
  }
}
