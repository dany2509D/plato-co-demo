import { normalize } from '../core/text.js';
import { isAvailable } from '../core/menu.js';
import { assignBranch } from '../core/orders.js';
import { createReservation } from '../core/reservations.js';
import { horaPanama } from './datetime.js';
import { t } from './texts.js';

// Modo "IA real" (opcional). El navegador nunca habla con Anthropic: llama a /api/chat,
// que guarda la clave en el servidor. La IA NUNCA escribe en los datos: solo PROPONE acciones
// y aquí se aplican únicamente las de la lista permitida, validando cada payload.
//
// Propuestas: proponer_pedido / proponer_reserva no crean nada. Dejan una propuesta pendiente en
// conversacion.propuesta ({type, payload}) que la persona debe confirmar en el chat:
//  - pedido: además deja al guion en el paso 'confirmar' (slots listos), de modo que el "sí" lo
//    procesa el motor del guion (tipo, dirección, pago y creación del pedido, como siempre).
//  - reserva: replyWithFallback detecta "sí"/"no" con una propuesta pendiente y crea/descarta.

export const ALLOWED_ACTIONS = ['proponer_pedido', 'proponer_reserva', 'pasar_a_persona'];
const MAX_PERSONAS = 8;
const MAX_HISTORIAL = 12;

const SI = /^(si|yes|yeah|yep|ok|okay|dale|confirmo|confirmar|confirm|claro|correcto|listo)\b/;
const NO = /^(no|nop|nope|cancelar|cancela|cancel)\b/;

const esObjeto = (x) => !!x && typeof x === 'object' && !Array.isArray(x);

// ---------- cliente ----------

export async function askAI(payload, { fetchImpl, timeoutMs = 8000, endpoint = '/api/chat' } = {}) {
  const f = fetchImpl ?? (typeof fetch === 'function' ? fetch : null);
  if (!f) return null;
  const ctrl = new AbortController();
  let timer;
  const limite = new Promise((_, rej) => { timer = setTimeout(() => { ctrl.abort(); rej(new Error('timeout')); }, timeoutMs); });
  try {
    const llamada = (async () => {
      const resp = await f(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      if (!resp || !resp.ok) return null;
      return resp.json();
    })();
    llamada.catch(() => {});
    const data = await Promise.race([llamada, limite]);
    if (!esObjeto(data) || typeof data.reply !== 'string' || !data.reply.trim()) return null;
    const actions = Array.isArray(data.actions)
      ? data.actions.filter((a) => esObjeto(a) && typeof a.type === 'string').map((a) => ({ type: a.type, payload: esObjeto(a.payload) ? a.payload : {} }))
      : [];
    return { reply: data.reply, actions, handoff: data.handoff === true };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ---------- contexto para el modelo ----------

export function buildContext(state) {
  const menu = state.productos.map((p) => ({
    id: p.id, nombre: p.nombre, categoria: p.categoria, precio: p.precio,
    vegetariano: !!p.vegetariano,
    modificadores: [...(p.modificadores ?? [])],
    alergenos: [...(p.alergenos ?? [])],
    alergenosDeclarados: p.alergenosDeclarados === true,
  }));
  const sucursales = state.sucursales.map((s) => ({
    id: s.id, nombre: s.nombre, direccion: s.direccion, horario: s.horario,
    zonas: [...(s.zonasEntrega ?? [])], etaBaseMin: s.etaBaseMin,
    mesas: (s.mesas ?? []).map((m) => ({ id: m.id, capacidad: m.capacidad })),
  }));
  const disponibilidad = {};
  for (const s of state.sucursales) disponibilidad[s.id] = state.productos.map((p) => ({ id: p.id, disponible: isAvailable(state, p.id, s.id) }));
  return { menu, sucursales, disponibilidad, impuesto: 'ITBMS 7%' };
}

// ---------- aplicar acciones ----------

const HORA = /^([01]?\d|2[0-3]):[0-5]\d$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

function validarPedido(state, p) {
  if (!esObjeto(p)) return { motivo: 'payload_invalido' };
  const suc = state.sucursales.find((s) => s.id === p.sucursalId);
  if (!suc) return { motivo: 'sucursal_invalida' };
  if (!Array.isArray(p.lineas) || !p.lineas.length || p.lineas.length > 20) return { motivo: 'lineas_invalidas' };
  const lineas = [];
  for (const l of p.lineas) {
    if (!esObjeto(l)) return { motivo: 'linea_invalida' };
    const prod = state.productos.find((x) => x.id === l.productoId);
    if (!prod) return { motivo: 'producto_inexistente' };
    if (!isAvailable(state, prod.id, suc.id)) return { motivo: 'producto_agotado' };
    if (!Number.isInteger(l.cantidad) || l.cantidad < 1 || l.cantidad > 20) return { motivo: 'cantidad_invalida' };
    const mods = l.modificadores ?? [];
    if (!Array.isArray(mods) || !mods.every((m) => typeof m === 'string' && prod.modificadores.includes(m))) return { motivo: 'modificador_invalido' };
    lineas.push({ productoId: prod.id, cantidad: l.cantidad, modificadores: [...mods] });
  }
  let tipo = p.tipo === 'entrega' || p.tipo === 'retiro' ? p.tipo : null;
  let direccion = null, eta = null;
  if (tipo === 'entrega' && typeof p.direccion === 'string' && p.direccion.trim().length <= 200) {
    const z = assignBranch(state, p.direccion);
    // Solo se acepta la dirección si cae en la zona de la sucursal; si no, el guion la vuelve a pedir.
    if (z && z.sucursalId === suc.id) { direccion = p.direccion.trim(); eta = z.etaMin; }
  }
  return { sucursalId: suc.id, lineas, tipo, direccion, eta };
}

function validarReserva(state, p) {
  if (!esObjeto(p)) return { motivo: 'payload_invalido' };
  if (!state.sucursales.some((s) => s.id === p.sucursalId)) return { motivo: 'sucursal_invalida' };
  if (typeof p.fecha !== 'string' || !FECHA.test(p.fecha)) return { motivo: 'fecha_invalida' };
  if (typeof p.hora !== 'string' || !HORA.test(p.hora)) return { motivo: 'hora_invalida' };
  if (!Number.isInteger(p.personas) || p.personas < 1) return { motivo: 'personas_invalidas' };
  if (p.personas > MAX_PERSONAS) return { motivo: 'personas_fuera_de_rango', handoff: true };
  if (typeof p.ocasion !== 'string' || !p.ocasion.trim() || p.ocasion.length > 60) return { motivo: 'ocasion_invalida' };
  if (normalize(p.ocasion) === 'evento') return { motivo: 'evento', handoff: true };
  return { sucursalId: p.sucursalId, fecha: p.fecha, hora: p.hora, personas: p.personas, ocasion: p.ocasion.trim() };
}

// Devuelve {aplicadas: string[], descartadas: {type, motivo}[]}. Todo cambio pasa por store.update.
export function applyActions(store, convId, actions) {
  const aplicadas = [], descartadas = [];
  const lista = Array.isArray(actions) ? actions : [];
  for (const a of lista) {
    const type = esObjeto(a) && typeof a.type === 'string' ? a.type : '?';
    if (!ALLOWED_ACTIONS.includes(type)) { descartadas.push({ type, motivo: 'accion_no_permitida' }); continue; }
    if (!store.get().conversaciones.some((c) => c.id === convId)) { descartadas.push({ type, motivo: 'conversacion_inexistente' }); continue; }
    const setConv = (fn) => store.update((s) => { fn(s.conversaciones.find((c) => c.id === convId)); });
    if (type === 'pasar_a_persona') {
      setConv((c) => { c.requiereHumano = true; });
      aplicadas.push(type);
      continue;
    }
    const v = type === 'proponer_pedido' ? validarPedido(store.get(), a.payload) : validarReserva(store.get(), a.payload);
    if (v.motivo) {
      if (v.handoff) setConv((c) => { c.requiereHumano = true; });
      descartadas.push({ type, motivo: v.motivo });
      continue;
    }
    if (type === 'proponer_pedido') {
      setConv((c) => {
        c.propuesta = { type, payload: JSON.parse(JSON.stringify(v)) };
        c.paso = 'confirmar'; // el "sí" lo maneja el motor del guion
        c.slots = { ...v };
      });
    } else {
      setConv((c) => { c.propuesta = { type, payload: { ...v } }; });
    }
    aplicadas.push(type);
  }
  return { aplicadas, descartadas };
}

// ---------- respuesta con respaldo ----------

const ahoraDe = (a) => (typeof a === 'function' ? a() : a instanceof Date ? a : new Date());

function registrar(store, convId, msg, ahora) {
  const d = ahoraDe(ahora);
  const guardado = { ...msg, hora: horaPanama(d), en: d.toISOString() };
  store.update((s) => { s.conversaciones.find((c) => c.id === convId)?.mensajes.push(guardado); });
  return guardado;
}

function confirmarReserva(store, convId, ahora) {
  const conv = store.get().conversaciones.find((c) => c.id === convId);
  const T = t(conv.idioma);
  const p = conv.propuesta.payload;
  store.update((s) => { delete s.conversaciones.find((c) => c.id === convId).propuesta; });
  const suc = store.get().sucursales.find((s) => s.id === p.sucursalId);
  let r;
  try { r = createReservation(store, p, { ahora: ahoraDe(ahora) }); } catch { r = { ok: false, razon: 'error' }; }
  if (r.ok) return { de: 'bot', texto: T.reservaOk(r.reserva, suc.nombre), actions: [{ type: 'reserva:creada', payload: { reservaId: r.reserva.id } }] };
  const texto = {
    sin_mesa: () => T.sinMesa(p.hora),
    fuera_de_horario: () => T.fueraHorario(suc.nombre, suc.horario),
    fecha_pasada: () => T.fechaPasada,
    handoff: () => T.handoffReserva,
  }[r.razon]?.() ?? T.error;
  if (r.razon === 'handoff' || !['sin_mesa', 'fuera_de_horario', 'fecha_pasada'].includes(r.razon)) {
    store.update((s) => { s.conversaciones.find((c) => c.id === convId).requiereHumano = true; });
  }
  return { de: 'bot', texto };
}

// Intenta la IA real si iaReal; si está apagada, falla o responde algo inválido, usa el guion.
// Registra los mensajes en la conversación igual que bot.reply. Nunca lanza.
export async function replyWithFallback(bot, store, convId, texto, { iaReal = false, fetchImpl, ahora, timeoutMs, endpoint } = {}) {
  const guion = () => bot.reply(convId, texto);
  if (!iaReal) return guion();
  try {
    const conv = store.get().conversaciones.find((c) => c.id === convId);
    // Un flujo del guion en curso (confirmar, pago, dirección...) lo sigue el guion.
    if (conv?.paso) return guion();
    const raw = typeof texto === 'string' ? texto : String(texto ?? '');
    const n = normalize(raw);
    if (conv?.propuesta?.type === 'proponer_reserva' && (SI.test(n) || NO.test(n))) {
      registrar(store, convId, { de: 'cliente', texto: raw }, ahora);
      let msg;
      if (SI.test(n)) msg = confirmarReserva(store, convId, ahora);
      else {
        store.update((s) => { delete s.conversaciones.find((c) => c.id === convId).propuesta; });
        msg = { de: 'bot', texto: t(conv.idioma).cancelado };
      }
      registrar(store, convId, msg, ahora);
      return [msg];
    }
    const historial = (conv?.mensajes ?? []).slice(-MAX_HISTORIAL)
      .map((m) => ({ role: m.de === 'cliente' ? 'user' : 'assistant', content: String(m.texto ?? '') }))
      .filter((m) => m.content);
    const res = await askAI({
      demo: 'restaurante', sessionId: convId,
      messages: [...historial, { role: 'user', content: raw }],
      context: buildContext(store.get()),
    }, { fetchImpl, timeoutMs, endpoint });
    if (!res) return guion();
    if (!conv) store.update((s) => { s.conversaciones.push({ id: convId, idioma: 'es', mensajes: [], requiereHumano: false, paso: null, slots: {} }); });
    registrar(store, convId, { de: 'cliente', texto: raw }, ahora);
    const { aplicadas } = applyActions(store, convId, res.actions);
    if (res.handoff && !aplicadas.includes('pasar_a_persona')) store.update((s) => { s.conversaciones.find((c) => c.id === convId).requiereHumano = true; });
    const msg = { de: 'bot', texto: res.reply };
    const guardado = registrar(store, convId, msg, ahora);
    return [guardado];
  } catch {
    return guion();
  }
}
