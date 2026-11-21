import { normalize } from '../core/text.js';
import { usd } from '../core/metrics.js';
import { ALERGENO_CUE } from './allergens.js';
import { isAvailable } from '../core/menu.js';
import { assignBranch, priceOrder } from '../core/orders.js';
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
const MAX_CONTENIDO = 1000; // el servidor rechaza mensajes más largos: se recortan antes de enviar
const recortar = (t) => String(t ?? '').slice(0, MAX_CONTENIDO);

// Preguntas sobre alérgenos/dietas: NUNCA van al modelo; responde el guion con los datos declarados del menú.
const DIETA = /alerg|allerg|gluten|celiac|lacteo|lactosa|lactose|dairy|nuez|nueces|\bnuts?\b|peanut|\bmani\b|marisco|shellfish|sesam|\bsoya\b|\bsoy\b|huevo|\begg|vegan|\bapt[oa]s?\b|libre de|\bsin (gluten|lactosa|nueces|mani|huevo|soya)\b/;
export const esPreguntaAlergenos = (n) => ALERGENO_CUE(n) || DIETA.test(n);
// Frases con las que el modelo "garantizaría" algo sobre alérgenos o dietas.
const AFIRMA_ALERGENOS = /libres? de|\bsin (gluten|lactosa|nueces|mani|huevo|soya|lacteos)\b|(gluten|dairy|lactose|nut|allergen)[- ]?free|no contien[ea]|does(n.t| not) contain|aptos? para|aptas? para|suitable for|safe for|hipoalerg/;

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
// El servidor arma el menú, los precios y los alérgenos desde sus propios datos; del navegador solo se
// aceptan la sucursal elegida y banderas de disponibilidad por producto.

export function buildClientHints(state) {
  const sucursalId = state.sucursales.some((x) => x.id === state.ui?.sucursalCliente) ? state.ui.sucursalCliente : state.sucursales[0].id;
  const disponibilidad = {};
  for (const p of state.productos) disponibilidad[p.id] = isAvailable(state, p.id, sucursalId);
  return { sucursalId, disponibilidad };
}

// (Heredado: ya no se envía al servidor.)

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

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const fechaReal = (f) => { if (!FECHA.test(f)) return false; const d = new Date(`${f}T00:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === f; };
// Acepta "H:mm" o "HH:mm" entre 00:00 y 23:59 y devuelve "HH:mm"; si no, null.
function horaValida(h) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(typeof h === 'string' ? h : '');
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null;
  return `${m[1].padStart(2, '0')}:${m[2]}`;
}

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
    if (!Array.isArray(mods) || !mods.every((m) => typeof m === 'string' && (prod.modificadores ?? []).includes(m))) return { motivo: 'modificador_invalido' };
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
  if (typeof p.fecha !== 'string' || !fechaReal(p.fecha)) return { motivo: 'fecha_invalida' };
  const hora = horaValida(p.hora);
  if (!hora) return { motivo: 'hora_invalida' };
  if (!Number.isInteger(p.personas) || p.personas < 1) return { motivo: 'personas_invalidas' };
  if (p.personas > MAX_PERSONAS) return { motivo: 'personas_fuera_de_rango', handoff: true };
  if (typeof p.ocasion !== 'string' || !p.ocasion.trim() || p.ocasion.length > 60) return { motivo: 'ocasion_invalida' };
  if (normalize(p.ocasion) === 'evento') return { motivo: 'evento', handoff: true };
  return { sucursalId: p.sucursalId, fecha: p.fecha, hora, personas: p.personas, ocasion: p.ocasion.trim() };
}

// Devuelve {aplicadas: string[], descartadas: {type, motivo}[]}. Todo cambio pasa por store.update.
export function applyActions(store, convId, actions) {
  const aplicadas = [], descartadas = [];
  let hayPropuesta = false; // por turno solo se conserva la PRIMERA propuesta válida (pedido o reserva)
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
    if (hayPropuesta) { descartadas.push({ type, motivo: 'propuesta_duplicada' }); continue; }
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
    hayPropuesta = true;
    aplicadas.push(type);
  }
  return { aplicadas, descartadas };
}

// ---------- resumen determinista ----------
// El texto de confirmación sale de la propuesta YA validada y del store, nunca del texto libre
// del modelo: lo que se muestra es exactamente lo que se creará.

function resumenPropuesta(state, propuesta, idioma) {
  const en = idioma === 'en';
  const p = propuesta.payload;
  const suc = state.sucursales.find((s) => s.id === p.sucursalId);
  if (propuesta.type === 'proponer_reserva') {
    return en
      ? `Reservation summary:\n- Branch: ${suc.nombre}\n- Date: ${p.fecha}\n- Time: ${p.hora}\n- People: ${p.personas}\n- Occasion: ${p.ocasion}\nConfirm the reservation? (yes / cancel)`
      : `Resumen de su reserva:\n- Sucursal: ${suc.nombre}\n- Fecha: ${p.fecha}\n- Hora: ${p.hora}\n- Personas: ${p.personas}\n- Ocasión: ${p.ocasion}\n¿Confirma la reserva? (sí / cancelar)`;
  }
  const nombre = (id) => state.productos.find((x) => x.id === id)?.nombre ?? id;
  const lineas = p.lineas.map((l) => `- ${l.cantidad} x ${nombre(l.productoId)}${l.modificadores?.length ? ` (${l.modificadores.join(', ')})` : ''}`);
  const tot = priceOrder(state, p.lineas);
  const partes = [en ? 'Order summary:' : 'Resumen de su pedido:', ...lineas,
    `Subtotal ${usd(tot.subtotal)} · ITBMS ${usd(tot.itbms)} · Total ${usd(tot.total)}`];
  const eta = p.tipo === 'entrega' && p.direccion ? (p.eta ?? suc.etaBaseMin) : null;
  partes.push(en
    ? `Branch: ${suc.nombre}${eta ? ` · estimated ${eta} min` : ''}`
    : `Sucursal: ${suc.nombre}${eta ? ` · tiempo estimado ${eta} min` : ''}`);
  partes.push(en ? 'Confirm the order? (yes / cancel)' : '¿Confirma el pedido? (sí / cancelar)');
  return partes.join('\n');
}

const botonesResumen = (idioma) => (idioma === 'en' ? ['Yes, confirm', 'Cancel'] : ['Sí, confirmar', 'Cancelar']);

// ---------- respuesta con respaldo ----------

const ahoraDe = (a) => (typeof a === 'function' ? a() : a instanceof Date ? a : new Date());

function mensaje(msg, ahora) {
  const d = ahoraDe(ahora);
  return { ...msg, hora: horaPanama(d), en: d.toISOString() };
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
// Atomicidad: se toma una foto de propuesta/paso/slots/requiereHumano/mensajes; los dos mensajes
// (cliente y bot) se escriben juntos en un solo store.update después de validar y aplicar las
// acciones; si algo lanza, se restaura la foto y el guion responde, así el mensaje del usuario
// queda registrado una sola vez y no queda ninguna propuesta a medias.
export async function replyWithFallback(bot, store, convId, texto, { iaReal = false, fetchImpl, ahora, timeoutMs, endpoint } = {}) {
  const getConv = () => store.get().conversaciones.find((c) => c.id === convId);
  // Una propuesta vieja no debe sobrevivir al fin de un flujo del guion.
  const guion = () => {
    const out = bot.reply(convId, texto);
    const c = getConv();
    if (c && c.propuesta && !c.paso) store.update((s) => { delete s.conversaciones.find((x) => x.id === convId).propuesta; });
    return out;
  };
  if (!iaReal) return guion();
  let foto = null;
  try {
    const conv = getConv();
    // Un flujo del guion en curso (confirmar, pago, dirección...) lo sigue el guion.
    if (conv?.paso) return guion();
    const raw = typeof texto === 'string' ? texto : String(texto ?? '');
    const n = normalize(raw);
    if (conv) foto = JSON.parse(JSON.stringify({ propuesta: conv.propuesta, paso: conv.paso, slots: conv.slots, requiereHumano: conv.requiereHumano, n: conv.mensajes.length }));

    if (conv?.propuesta?.type === 'proponer_reserva' && (SI.test(n) || NO.test(n))) {
      store.update((s) => { s.conversaciones.find((c) => c.id === convId).mensajes.push(mensaje({ de: 'cliente', texto: raw }, ahora)); });
      let msg;
      if (SI.test(n)) msg = confirmarReserva(store, convId, ahora);
      else {
        store.update((s) => { delete s.conversaciones.find((c) => c.id === convId).propuesta; });
        msg = { de: 'bot', texto: t(conv.idioma).cancelado };
      }
      const guardado = mensaje(msg, ahora);
      store.update((s) => { s.conversaciones.find((c) => c.id === convId).mensajes.push(guardado); });
      return [guardado];
    }

    // Alérgenos y dietas: solo con datos declarados del menú (guion), nunca con el modelo.
    if (esPreguntaAlergenos(n)) return guion();

    const historial = (conv?.mensajes ?? []).slice(-MAX_HISTORIAL)
      .map((m) => ({ role: m.de === 'cliente' ? 'user' : 'assistant', content: recortar(m.texto) }))
      .filter((m) => m.content);
    const res = await askAI({
      demo: 'restaurante', sessionId: convId,
      messages: [...historial, { role: 'user', content: recortar(raw) }],
      ...buildClientHints(store.get()),
    }, { fetchImpl, timeoutMs, endpoint });
    if (!res) return guion();
    // El modelo no puede afirmar nada sobre alérgenos por su cuenta.
    if (AFIRMA_ALERGENOS.test(normalize(res.reply))) return guion();

    if (!getConv()) store.update((s) => { s.conversaciones.push({ id: convId, idioma: 'es', mensajes: [], requiereHumano: false, paso: null, slots: {} }); });
    if (!foto) foto = { propuesta: undefined, paso: null, slots: {}, requiereHumano: false, n: 0 };
    // Turno que no es confirmación: se borra cualquier propuesta anterior.
    store.update((s) => { delete s.conversaciones.find((c) => c.id === convId).propuesta; });
    const { aplicadas } = applyActions(store, convId, res.actions);
    if (res.handoff && !aplicadas.includes('pasar_a_persona')) store.update((s) => { s.conversaciones.find((c) => c.id === convId).requiereHumano = true; });
    const actual = getConv();
    // Si hay propuesta, el resumen determinista REEMPLAZA el texto libre del modelo.
    const textoBot = actual.propuesta ? resumenPropuesta(store.get(), actual.propuesta, actual.idioma) : res.reply;
    const cliente = mensaje({ de: 'cliente', texto: raw }, ahora);
    const bota = mensaje({ de: 'bot', texto: textoBot, ...(actual.propuesta ? { botones: botonesResumen(actual.idioma) } : {}) }, ahora);
    store.update((s) => { s.conversaciones.find((c) => c.id === convId).mensajes.push(cliente, bota); });
    return [bota];
  } catch {
    try {
      if (foto) {
        store.update((s) => {
          const c = s.conversaciones.find((x) => x.id === convId);
          if (!c) return;
          if (foto.propuesta === undefined) delete c.propuesta; else c.propuesta = foto.propuesta;
          c.paso = foto.paso; c.slots = foto.slots; c.requiereHumano = foto.requiereHumano;
          c.mensajes.length = Math.min(c.mensajes.length, foto.n);
        });
      }
    } catch { /* el guion responde de todos modos */ }
    return guion();
  }
}
