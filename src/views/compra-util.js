// Lógica pura del flujo de compra (menú, carrito, pago y seguimiento). Sin DOM: se prueba en Node.
import { ESTADOS } from '../core/estados.js';
import { priceOrder } from '../core/orders.js';

export const cuentaTexto = (n, uno = 'producto', varios = 'productos') => `${n} ${n === 1 ? uno : varios}`;

const cents = (n) => Math.round(Number(n) * 100);

// Totales de un pedido YA creado: siempre los guardados (un cambio de precio no re-cotiza pedidos viejos).
// Solo los pedidos antiguos sin totales guardados se cotizan con los precios actuales.
export function totalesPedido(state, pedido) {
  if (Number.isFinite(pedido?.total)) {
    const subtotal = Number.isFinite(pedido.subtotal) ? pedido.subtotal : pedido.total;
    const itbms = Number.isFinite(pedido.itbms) ? pedido.itbms : Math.round((pedido.total - subtotal) * 100) / 100;
    return { subtotal, itbms, total: pedido.total };
  }
  return priceOrder(state, pedido?.lineas ?? []);
}

// Líneas de un pedido con su producto y, si se puede afirmar, su importe.
// El importe por línea se calcula con el precio actual; si la suma ya no coincide con el subtotal guardado
// (cambió un precio desde que se pidió), no se muestra ningún importe por línea para no contradecir el total.
export function lineasPedido(state, pedido) {
  const filas = (pedido?.lineas ?? []).map((l) => {
    const producto = state.productos.find((x) => x.id === l.productoId) ?? null;
    return { ...l, modificadores: l.modificadores ?? [], producto, importe: producto ? producto.precio * l.cantidad : null };
  }).filter((f) => f.producto);
  const suma = filas.reduce((n, f) => n + cents(f.importe), 0);
  const guardado = Number.isFinite(pedido?.subtotal) ? cents(pedido.subtotal) : suma;
  const fiable = filas.length === (pedido?.lineas ?? []).length && suma === guardado;
  return filas.map((f) => ({ ...f, importe: fiable ? f.importe : null }));
}

const ICONO_ESTADO = { Recibido: 'pedido', 'En cocina': 'cocina', Listo: 'listo', 'En camino': 'en-camino', Entregado: 'entregado' };

// Pasos del seguimiento: retiro omite «En camino». Cada paso: { estado, icono, fase: 'hecho'|'actual'|'pendiente', en }.
export function pasosSeguimiento(pedido) {
  const flujo = pedido?.tipo === 'retiro' ? ESTADOS.filter((e) => e !== 'En camino') : ESTADOS;
  const idx = flujo.indexOf(pedido?.estado);
  return flujo.map((estado, i) => ({
    estado,
    icono: ICONO_ESTADO[estado] ?? 'pedido',
    fase: i < idx ? 'hecho' : i === idx ? 'actual' : 'pendiente',
    en: pedido?.historial?.find((h) => h.estado === estado)?.en ?? null,
  }));
}

// Clave de la foto de portada de una sucursal (hero/sucursal_N) según su posición en el estado.
export function claveFotoSucursal(state, sucursalId) {
  const i = (state?.sucursales ?? []).findIndex((s) => s.id === sucursalId);
  return i >= 0 && i < 3 ? `sucursal_${i + 1}` : 'sucursal_1';
}

// «Plato & Co. Centro» → «Centro».
export const nombreCorto = (s) => String(s?.nombre ?? '').replace(/^Plato & Co\.\s*/, '');
