import { brand } from '../config/brand.js';
import { isAvailable, setAvailable } from './menu.js';

// Modo Presentación: datos + motor mínimo, sin DOM. El DOM vive en src/ui/presenter.js.
// El contexto del recorrido (ids del pedido, plato agotado, reserva) permite que ir y volver entre pasos
// no duplique acciones: antes de actuar se pregunta con falta(...) si la acción ya ocurrió.

export const CONV = 'c-web';
const EJ = brand.tema?.ejemplo;
export const FRASE_PEDIDO = EJ ? 'Quiero ' + EJ.frase : 'Quiero 2 hamburguesas clásicas sin cebolla y una limonada para Obarrio';
export const DIRECCION = EJ?.direccion ?? 'Calle 50, Obarrio';
export const FRASE_AGOTADO = EJ?.agotadoPedido ?? 'Quiero una hamburguesa clásica para Obarrio';
export const FRASE_RESERVA = 'Quiero reservar para 4 mañana a las 8 pm, cumpleaños';
export const MENSAJE_FINAL = 'Cero pedidos copiados a mano, en todas sus sucursales';
export const URL_DIAGNOSTICO = 'https://panacealogic.dev/cuentanos-tu-proyecto';

// auto: texto del botón "Hacer por mí" (null = el paso es solo para mirar).
export const STEPS = [
  {
    id: 'pedido', ruta: '#/chat', titulo: 'El cliente pide por WhatsApp',
    nota: 'El cliente escribe como habla. El asistente arma el pedido, pide dirección y forma de pago, muestra el resumen con el total y el cliente confirma. Con Yappy, el comprobante llega por el chat y el pago se verifica solo.',
    auto: 'Hacer el pedido por mí',
  },
  {
    id: 'envivo', ruta: '#/chat', titulo: 'El restaurante lo ve al instante',
    nota: 'Mientras el cliente chatea, el panel En vivo muestra el pedido y el aviso al equipo. Nadie lo copia a mano ni contesta mensajes uno por uno.',
    auto: null,
  },
  {
    id: 'cocina', ruta: '#/admin/cocina', titulo: 'La cocina avanza el pedido',
    nota: 'La cocina ve el pedido en su pantalla, con el pago ya confirmado, y lo mueve de etapa con un toque. Cada cambio le llega al cliente por el chat; la factura simulada sale en cuanto se confirma el pago.',
    auto: 'Avanzar el pedido por mí',
  },
  {
    id: 'agotado', ruta: '#/admin/menu', titulo: 'Un plato se agota',
    nota: 'Marcar un plato como agotado toma un toque. Si un cliente lo pide, el asistente no promete lo que no hay y le ofrece alternativas del mismo tipo.',
    auto: 'Agotar el plato por mí',
  },
  {
    id: 'reserva', ruta: '#/chat', titulo: 'Una reserva para 4',
    nota: 'La reserva se pide con una sola frase. El sistema asigna la mesa según la capacidad y la anfitriona la ve de inmediato en el plano de mesas.',
    auto: 'Reservar por mí',
  },
  {
    id: 'cierre', ruta: '#/admin/indicadores', titulo: 'Todo medido, sin papeles',
    nota: `${MENSAJE_FINAL}. Los indicadores se arman solos con cada pedido y cada reserva.`,
    auto: null,
  },
];

export function createContext() {
  return {
    orderId: null, sucursalId: null, reservaId: null, reservasBase: null,
    agotadoProductId: null, agotadoSucursalId: null, agotadoPrevio: null, agotadoPedido: false,
  };
}

export function createTour(steps = STEPS) {
  let index = 0;
  let activo = true;
  const hechos = new Set();
  const oyentes = new Set();
  const avisar = () => { for (const f of [...oyentes]) f(index); };
  const ir = (i) => {
    const n = Math.max(0, Math.min(steps.length - 1, i));
    if (!activo || n === index) return false;
    index = n;
    avisar();
    return true;
  };
  return {
    steps,
    get index() { return index; },
    get total() { return steps.length; },
    get step() { return steps[index]; },
    get esUltimo() { return index === steps.length - 1; },
    get activo() { return activo; },
    next: () => ir(index + 1),
    prev: () => ir(index - 1),
    goTo(i) { ir(i); return index; },
    hecho: (id) => hechos.has(id),
    marcar: (id) => { hechos.add(id); },
    onChange(fn) { oyentes.add(fn); return () => oyentes.delete(fn); },
    exit() {
      if (!activo) return false;
      activo = false;
      return true;
    },
  };
}

// Pedido del recorrido: el más reciente que nació en el chat. Recuerda su id y sucursal en el contexto.
export function pedidoDelTour(state, ctx) {
  const p = state.pedidos.find((x) => x.id === ctx.orderId)
    ?? state.pedidos.find((x) => x.conversacionId === CONV && x.canal === 'whatsapp');
  if (!p) { ctx.orderId = null; return null; }
  ctx.orderId = p.id;
  ctx.sucursalId = p.sucursalId;
  return p;
}

// Reserva del recorrido: la primera que aparece después de la línea base tomada al reiniciar.
export function reservaDelTour(state, ctx) {
  if (!ctx.reservasBase) { ctx.reservasBase = state.reservas.map((r) => r.id); return null; }
  const r = state.reservas.find((x) => x.id === ctx.reservaId)
    ?? state.reservas.find((x) => !ctx.reservasBase.includes(x.id));
  ctx.reservaId = r?.id ?? null;
  return r ?? null;
}

// Siguiente acción del paso 1 («Hacer el pedido por mí») según lo que de verdad hay en el chat:
//  'listo'    el pedido del recorrido ya existe (y, si se pagó con Yappy, ya envió el comprobante);
//  'cancelar' hay un flujo a medias que no es el del recorrido (otro pedido, una reserva, etc.): se empieza de cero;
//  'frase' | 'direccion' | 'yappy' | 'confirmar' | 'comprobante'   el siguiente mensaje o toque del guion,
//             en el orden del chat: pedido → dirección → pago → resumen y confirmación → comprobante de Yappy;
//  'detener'  el guion ya se envió y no se puede avanzar (p. ej. todo agotado): el paso NO debe darse por hecho.
export function siguienteAccionPedido(state, ctx) {
  const conv = state.conversaciones.find((c) => c.id === CONV);
  if (!falta('pedido', state, ctx)) {
    const p = pedidoDelTour(state, ctx);
    return p.pago?.estado === 'esperando comprobante' && conv?.paso === 'comprobante' ? 'comprobante' : 'listo';
  }
  const msgs = conv?.mensajes ?? [];
  let ini = 0;
  msgs.forEach((m, i) => { if (m.de === 'cliente' && /^\s*cancelar\s*$/i.test(m.texto)) ini = i + 1; });
  const tramo = msgs.slice(ini); // lo escrito después del último «cancelar»
  const paso = conv?.paso ?? null;
  if (!tramo.some((m) => m.de === 'cliente' && m.texto === FRASE_PEDIDO)) return paso ? 'cancelar' : 'frase';
  const ult = [...tramo].reverse().find((m) => m.de === 'bot');
  if (paso === 'confirmar' && ult?.botones?.includes('Sí, confirmar')) return 'confirmar';
  if (paso === 'direccion' && !tramo.some((m) => m.de === 'cliente' && m.texto === DIRECCION)) return 'direccion';
  if (paso === 'pago' && ult?.botones?.includes('Yappy')) return 'yappy';
  return 'detener';
}

// ¿Falta hacer esta acción? Es la guarda que vuelve idempotentes los pasos.
export function falta(accion, state, ctx) {
  switch (accion) {
    case 'pedido': return !pedidoDelTour(state, ctx);
    case 'avanzar': { const p = pedidoDelTour(state, ctx); return !!p && p.estado !== 'Entregado'; }
    case 'marcarAgotado': return !(ctx.agotadoProductId && !isAvailable(state, ctx.agotadoProductId, ctx.agotadoSucursalId));
    case 'pedirAgotado': return !!ctx.agotadoProductId && !ctx.agotadoPedido;
    case 'reserva': return !reservaDelTour(state, ctx);
    default: return false;
  }
}

// El plato que se agota: la hamburguesa clásica si hay; si no, el primero disponible de Hamburguesas.
export function elegirAgotado(state, sucursalId) {
  const disp = state.productos.filter((p) => isAvailable(state, p.id, sucursalId));
  return disp.find((p) => p.nombre === (EJ?.agotado ?? 'Hamburguesa clásica')) ?? disp.find((p) => p.categoria === 'Hamburguesas') ?? disp[0] ?? null;
}

// Anota qué plato se va a agotar y cómo estaba (sin tocar el menú): así se puede restaurar al salir.
export function registrarAgotado(state, ctx, productoId, sucursalId) {
  if (ctx.agotadoProductId === productoId && ctx.agotadoSucursalId === sucursalId) return;
  ctx.agotadoPrevio = isAvailable(state, productoId, sucursalId);
  ctx.agotadoProductId = productoId;
  ctx.agotadoSucursalId = sucursalId;
  ctx.agotadoPedido = false;
}

export function marcarAgotado(store, ctx, productoId, sucursalId) {
  registrarAgotado(store.get(), ctx, productoId, sucursalId);
  setAvailable(store, productoId, sucursalId, false);
}

// Devuelve el plato a como estaba antes del recorrido (no habilita lo que ya estaba agotado).
export function restaurarAgotado(store, ctx) {
  if (ctx.agotadoProductId) {
    if (ctx.agotadoPrevio) setAvailable(store, ctx.agotadoProductId, ctx.agotadoSucursalId, true);
  }
  ctx.agotadoProductId = null;
  ctx.agotadoSucursalId = null;
  ctx.agotadoPrevio = null;
  ctx.agotadoPedido = false;
}

export function reiniciarParaTour(store, ctx) {
  store.reset();
  Object.assign(ctx, createContext());
  ctx.reservasBase = store.get().reservas.map((r) => r.id);
}
