import { ESTADOS } from './estados.js';
import { isAvailable, alternativesFor } from './menu.js';
import { normalize } from './text.js';

export { ESTADOS };

const METODOS = ['yappy', 'tarjeta', 'efectivo'];
const ITBMS = 0.07;
const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
// Se trabaja en centavos enteros para evitar deriva (0.1 + 0.2).
const cents = (n) => Math.round(n * 100);

export function assignBranch(state, direccion) {
  const dir = normalize(direccion);
  if (!dir) return null;
  let mejor = null;
  for (const s of state.sucursales) {
    if (!s.zonasEntrega.some((z) => dir.includes(normalize(z)))) continue;
    if (!mejor || s.etaBaseMin < mejor.etaMin) mejor = { sucursalId: s.id, etaMin: s.etaBaseMin };
  }
  return mejor;
}

// Los modificadores del seed son textos sin precio, por lo que no suman recargo.
export function priceOrder(state, lineas) {
  let c = 0;
  for (const l of lineas) {
    const p = state.productos.find((x) => x.id === l.productoId);
    if (p) c += cents(p.precio) * l.cantidad;
  }
  const subtotal = c / 100;
  const itbms = r2(subtotal * ITBMS);
  return { subtotal: r2(subtotal), itbms, total: r2(subtotal + itbms) };
}

function siguienteId(state) {
  const max = state.pedidos.reduce((m, p) => Math.max(m, Number(/^ped-(\d+)$/.exec(p.id)?.[1] ?? 0)), 0);
  return `ped-${String(max + 1).padStart(3, '0')}`;
}

// Devuelve {ok:true, pedido} o {ok:false, razon:'vacio'|'sin_zona'|'agotado'|'invalido', detalle?}.
export function createOrder(store, draft) {
  const state = store.get();
  const lineas = Array.isArray(draft?.lineas) ? draft.lineas : [];
  if (!lineas.length) return { ok: false, razon: 'vacio' };

  for (const l of lineas) {
    if (!state.productos.some((p) => p.id === l.productoId)) {
      return { ok: false, razon: 'invalido', detalle: { productoId: l.productoId, motivo: 'producto desconocido' } };
    }
    if (!Number.isInteger(l.cantidad) || l.cantidad < 1 || l.cantidad > 20) {
      return { ok: false, razon: 'invalido', detalle: { productoId: l.productoId, motivo: 'cantidad debe ser un entero de 1 a 20' } };
    }
  }

  const tipo = draft.tipo === 'retiro' ? 'retiro' : 'entrega';
  let sucursalId = draft.sucursalId;
  let etaMin;
  if (tipo === 'entrega') {
    const zona = assignBranch(state, draft.direccion);
    if (zona) sucursalId = sucursalId ?? zona.sucursalId;
    else if (!sucursalId) return { ok: false, razon: 'sin_zona' };
  }
  if (!state.sucursales.some((s) => s.id === sucursalId)) {
    return { ok: false, razon: 'invalido', detalle: { motivo: 'sucursal desconocida' } };
  }

  if (tipo === 'entrega') etaMin = state.sucursales.find((s) => s.id === sucursalId).etaBaseMin;

  const agotados = [];
  for (const l of lineas) {
    if (isAvailable(state, l.productoId, sucursalId)) continue;
    const p = state.productos.find((x) => x.id === l.productoId);
    agotados.push({
      id: p.id, nombre: p.nombre,
      alternativas: alternativesFor(state, p.id, sucursalId).map((a) => ({ id: a.id, nombre: a.nombre })),
    });
  }
  if (agotados.length) return { ok: false, razon: 'agotado', detalle: { agotados } };

  const ahora = new Date().toISOString();
  const limpias = lineas.map((l) => ({
    productoId: l.productoId,
    modificadores: Array.isArray(l.modificadores) ? [...l.modificadores] : [],
    cantidad: l.cantidad,
  }));
  const pedido = {
    id: siguienteId(state),
    canal: draft.canal ?? 'web',
    sucursalId, lineas: limpias, tipo,
    estado: ESTADOS[0],
    historial: [{ estado: ESTADOS[0], en: ahora }],
    pago: { metodo: null, estado: 'pendiente' },
    creadoEn: ahora,
    ...priceOrder(state, limpias),
  };
  if (tipo === 'entrega') { pedido.direccion = draft.direccion; if (etaMin) pedido.etaMin = etaMin; }
  if (draft.conversacionId) pedido.conversacionId = draft.conversacionId;
  store.update((s) => { s.pedidos.unshift(pedido); });
  return { ok: true, pedido: store.get().pedidos.find((p) => p.id === pedido.id) };
}

function buscar(store, pedidoId) {
  const p = store.get().pedidos.find((x) => x.id === pedidoId);
  if (!p) throw new Error(`Pedido no encontrado: ${pedidoId}`);
  return p;
}

// Factura SIMULADA: no se envía a ningún PAC ni a la DGI.
export function issueInvoice(store, pedidoId) {
  const existente = buscar(store, pedidoId);
  if (existente.facturaId) return { id: existente.facturaId, cufe: existente.factura.cufe };
  const n = store.get().pedidos.filter((p) => p.facturaId).length + 1;
  const id = `fac-${String(n).padStart(4, '0')}`;
  const base = `${pedidoId}${Date.now().toString(16)}`.replace(/[^a-z0-9]/gi, '').toUpperCase();
  const cufe = `SIMULADO-${base}-NO-VALIDO-FISCALMENTE`;
  store.update((s) => {
    const p = s.pedidos.find((x) => x.id === pedidoId);
    p.facturaId = id;
    p.factura = { id, cufe, simulada: true, emitidaEn: new Date().toISOString() };
  });
  return { id, cufe };
}

export function advanceStatus(store, pedidoId) {
  const actual = buscar(store, pedidoId);
  const flujo = actual.tipo === 'retiro' ? ESTADOS.filter((e) => e !== 'En camino') : ESTADOS;
  const i = flujo.indexOf(actual.estado);
  if (i === -1 || i >= flujo.length - 1) return actual;
  const estado = flujo[i + 1];
  store.update((s) => {
    const p = s.pedidos.find((x) => x.id === pedidoId);
    p.estado = estado;
    p.historial.push({ estado, en: new Date().toISOString() });
  });
  if (estado === 'Entregado') issueInvoice(store, pedidoId);
  const evento = { pedidoId, estado };
  if (actual.conversacionId) evento.conversacionId = actual.conversacionId;
  store.emit('pedido:estado', evento);
  return buscar(store, pedidoId);
}

// Método inválido o pedido inexistente: lanza Error. Sin llamadas de pago reales.
export function payOrder(store, pedidoId, metodo) {
  if (!METODOS.includes(metodo)) throw new Error(`Método de pago no válido: ${metodo}`);
  buscar(store, pedidoId);
  store.update((s) => {
    const p = s.pedidos.find((x) => x.id === pedidoId);
    p.pago = { metodo, estado: metodo === 'efectivo' ? 'contra entrega' : 'pagado' };
  });
  return buscar(store, pedidoId);
}

// Minutos entre la creación y el momento en que quedó 'Listo'; null si aún no.
export function prepMinutes(pedido) {
  const ini = pedido.historial?.[0]?.en ?? pedido.creadoEn;
  const listo = pedido.historial?.find((h) => h.estado === 'Listo');
  if (!ini || !listo) return null;
  return Math.round((Date.parse(listo.en) - Date.parse(ini)) / 60000);
}
