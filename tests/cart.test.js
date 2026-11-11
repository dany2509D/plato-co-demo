import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '../src/core/store.js';
import { createCart } from '../src/ui/cart.js';

let store, cart;
beforeEach(() => {
  store = createStore({ read: () => null, write() {} });
  cart = createCart(store);
});
const id = (n) => store.get().productos.find((p) => p.nombre === n).id;

describe('carrito', () => {
  it('agrega y vive en state.ui.carrito', () => {
    cart.add(id('Limonada'), [], 2);
    expect(store.get().ui.carrito).toEqual([{ productoId: id('Limonada'), modificadores: [], cantidad: 2 }]);
    expect(cart.count()).toBe(2);
  });
  it('une líneas iguales (mismo producto y mismos modificadores, sin importar el orden)', () => {
    cart.add(id('Hamburguesa clásica'), ['sin cebolla', 'agrandar'], 1);
    cart.add(id('Hamburguesa clásica'), ['agrandar', 'sin cebolla'], 2);
    cart.add(id('Hamburguesa clásica'), [], 1);
    expect(cart.items().map((l) => l.cantidad)).toEqual([3, 1]);
  });
  it('limita la cantidad por línea a 20', () => {
    cart.add(id('Limonada'), [], 15);
    cart.add(id('Limonada'), [], 15);
    expect(cart.items()[0].cantidad).toBe(20);
  });
  it('setQty cambia, y con 0 elimina; remove quita por índice', () => {
    cart.add(id('Limonada'), [], 1);
    cart.add(id('Refresco'), [], 1);
    cart.setQty(0, 4);
    expect(cart.items()[0].cantidad).toBe(4);
    cart.setQty(0, 0);
    expect(cart.items()).toHaveLength(1);
    cart.remove(0);
    expect(cart.items()).toEqual([]);
  });
  it('totales con priceOrder (subtotal, ITBMS 7%, total)', () => {
    cart.add(id('Hamburguesa clásica'), [], 2);
    cart.add(id('Limonada'), [], 1);
    expect(cart.totals()).toEqual({ subtotal: 20.65, itbms: 1.45, total: 22.1 });
  });
  it('replaceProduct cambia el agotado por la alternativa y suma si ya existe', () => {
    cart.add(id('Limonada'), ['sin hielo'], 2);
    cart.add(id('Refresco'), [], 1);
    cart.replaceProduct(id('Limonada'), id('Refresco'));
    expect(cart.items()).toEqual([{ productoId: id('Refresco'), modificadores: [], cantidad: 3 }]);
  });
  it('clear vacía y items() devuelve copias', () => {
    cart.add(id('Limonada'), ['agrandar'], 1);
    cart.items()[0].modificadores.push('x');
    expect(store.get().ui.carrito[0].modificadores).toEqual(['agrandar']);
    cart.clear();
    expect(cart.count()).toBe(0);
  });
});
