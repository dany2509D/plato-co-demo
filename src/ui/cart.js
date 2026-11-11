import { priceOrder } from '../core/orders.js';

const MAX_LINEA = 20; // createOrder rechaza cantidades > 20

const clave = (l) => `${l.productoId}|${[...l.modificadores].sort().join('+')}`;
const clamp = (n) => Math.max(1, Math.min(MAX_LINEA, Math.floor(Number(n)) || 1));

// El carrito vive en state.ui.carrito (persiste con el store). Siempre se cambia con store.update.
export function createCart(store) {
  const lista = () => store.get().ui.carrito;
  return {
    items: () => lista().map((l) => ({ ...l, modificadores: [...l.modificadores] })),
    count: () => lista().reduce((n, l) => n + l.cantidad, 0),
    add(productoId, modificadores = [], cantidad = 1) {
      const nueva = { productoId, modificadores: [...modificadores], cantidad: clamp(cantidad) };
      store.update((s) => {
        const ex = s.ui.carrito.find((l) => clave(l) === clave(nueva));
        if (ex) ex.cantidad = clamp(ex.cantidad + nueva.cantidad);
        else s.ui.carrito.push(nueva);
      });
    },
    setQty(i, cantidad) {
      if (!lista()[i]) return;
      if (cantidad < 1) return this.remove(i);
      store.update((s) => { s.ui.carrito[i].cantidad = clamp(cantidad); });
    },
    remove(i) {
      if (!lista()[i]) return;
      store.update((s) => { s.ui.carrito.splice(i, 1); });
    },
    // Cambia un producto agotado por una alternativa (sin sus modificadores, que pueden no aplicar).
    replaceProduct(viejoId, nuevoId) {
      store.update((s) => {
        const cant = s.ui.carrito.filter((l) => l.productoId === viejoId).reduce((n, l) => n + l.cantidad, 0);
        s.ui.carrito = s.ui.carrito.filter((l) => l.productoId !== viejoId);
        if (!cant) return;
        const ex = s.ui.carrito.find((l) => l.productoId === nuevoId && l.modificadores.length === 0);
        if (ex) ex.cantidad = clamp(ex.cantidad + cant);
        else s.ui.carrito.push({ productoId: nuevoId, modificadores: [], cantidad: clamp(cant) });
      });
    },
    removeProduct(productoId) {
      store.update((s) => { s.ui.carrito = s.ui.carrito.filter((l) => l.productoId !== productoId); });
    },
    clear() { store.update((s) => { s.ui.carrito = []; }); },
    totals: () => priceOrder(store.get(), lista()),
  };
}
