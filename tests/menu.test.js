import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '../src/core/store.js';
import { isAvailable, setAvailable, setPrice, findProducts, alternativesFor, visibleMenu } from '../src/core/menu.js';
import { normalize } from '../src/core/text.js';

const memStorage = () => ({ read: () => null, write() {} });
let store;
beforeEach(() => { store = createStore(memStorage()); });
const sucs = () => store.get().sucursales.map((s) => s.id);
const prod = (nombre) => store.get().productos.find((p) => p.nombre === nombre);

describe('normalize', () => {
  it('quita tildes, mayúsculas y espacios extra', () => {
    expect(normalize('  Hamburguesa   CLÁSICA ')).toBe('hamburguesa clasica');
    expect(normalize('Té  helado')).toBe('te helado');
  });
});

describe('disponibilidad', () => {
  it('agotado en una sucursal se oculta ahí pero no en otra', () => {
    const [a, b] = sucs();
    const p = prod('Hamburguesa clásica');
    setAvailable(store, p.id, a, false);
    expect(isAvailable(store.get(), p.id, a)).toBe(false);
    expect(isAvailable(store.get(), p.id, b)).toBe(true);
    const nombres = (suc) => visibleMenu(store.get(), suc).flatMap((c) => c.productos.map((x) => x.id));
    expect(nombres(a)).not.toContain(p.id);
    expect(nombres(b)).toContain(p.id);
  });
  it('emite menu:cambio', () => {
    const [a] = sucs();
    const p = prod('Churrasco');
    const got = [];
    store.on('menu:cambio', (e) => got.push(e));
    setAvailable(store, p.id, a, false);
    expect(got).toEqual([{ productoId: p.id, sucursalId: a, valor: false }]);
  });
  it('producto o sucursal desconocidos no están disponibles', () => {
    expect(isAvailable(store.get(), 'nada', sucs()[0])).toBe(false);
    expect(isAvailable(store.get(), prod('Churrasco').id, 'nada')).toBe(false);
  });
  it('visibleMenu omite categorías vacías y conserva el orden', () => {
    const [a] = sucs();
    const antes = visibleMenu(store.get(), a).map((c) => c.categoria);
    for (const p of store.get().productos.filter((x) => x.categoria === 'Postres')) setAvailable(store, p.id, a, false);
    const despues = visibleMenu(store.get(), a).map((c) => c.categoria);
    expect(despues).toEqual(antes.filter((c) => c !== 'Postres'));
  });
});

describe('setPrice', () => {
  it('cambia el precio válido y rechaza inválidos', () => {
    const p = prod('Churrasco');
    const orig = p.precio;
    setPrice(store, p.id, 0);
    setPrice(store, p.id, -3);
    setPrice(store, p.id, NaN);
    setPrice(store, p.id, Infinity);
    setPrice(store, 'nada', 5);
    expect(prod('Churrasco').precio).toBe(orig);
    setPrice(store, p.id, 17.5);
    expect(prod('Churrasco').precio).toBe(17.5);
  });
});

describe('findProducts', () => {
  it('acierta sin tildes ni mayúsculas', () => {
    const r = findProducts(store.get(), 'hamburguesa clasica', sucs()[0]);
    expect(r[0].nombre).toBe('Hamburguesa clásica');
  });
  it('entiende sinónimos', () => {
    const r = findProducts(store.get(), 'burger doble', sucs()[0]);
    expect(r[0].nombre).toBe('Hamburguesa doble');
  });
  it('texto vacío o sin coincidencias devuelve []', () => {
    expect(findProducts(store.get(), '   ', sucs()[0])).toEqual([]);
    expect(findProducts(store.get(), 'zzzz', sucs()[0])).toEqual([]);
  });
  it('sigue encontrando un agotado (para que el bot pueda rechazarlo)', () => {
    const [a] = sucs();
    const p = prod('Churrasco');
    setAvailable(store, p.id, a, false);
    expect(findProducts(store.get(), 'churrasco', a).map((x) => x.id)).toContain(p.id);
  });
});

describe('alternativesFor', () => {
  it('misma categoría, disponibles, sin repetir, máx. 3', () => {
    const [a] = sucs();
    const p = prod('Hamburguesa clásica');
    const agotado = prod('Hamburguesa doble');
    setAvailable(store, agotado.id, a, false);
    const alt = alternativesFor(store.get(), p.id, a);
    expect(alt.length).toBeLessThanOrEqual(3);
    expect(alt.length).toBeGreaterThan(0);
    for (const x of alt) {
      expect(x.id).not.toBe(p.id);
      expect(x.id).not.toBe(agotado.id);
      expect(x.categoria).toBe(p.categoria);
      expect(isAvailable(store.get(), x.id, a)).toBe(true);
    }
  });
  it('producto desconocido devuelve []', () => {
    expect(alternativesFor(store.get(), 'nada', sucs()[0])).toEqual([]);
  });
});
