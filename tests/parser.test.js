import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '../src/core/store.js';
import { setAvailable } from '../src/core/menu.js';
import { detectLang, parseOrder } from '../src/bot/parser.js';

const memStorage = () => ({ read: () => null, write() {} });
let store;
let suc;
beforeEach(() => {
  store = createStore(memStorage());
  suc = store.get().sucursales[0].id;
  // deja todo disponible en la sucursal de prueba (el seed agota algunos)
  for (const p of store.get().productos) setAvailable(store, p.id, suc, true);
});
const id = (nombre) => store.get().productos.find((p) => p.nombre === nombre).id;
const parse = (t) => parseOrder(t, store.get(), suc);

describe('detectLang', () => {
  it('distingue español e inglés', () => {
    expect(detectLang('2 hamburguesas clásicas sin cebolla y una limonada')).toBe('es');
    expect(detectLang('two classic burgers and a lemonade')).toBe('en');
    expect(detectLang('quiero una pasta por favor')).toBe('es');
    expect(detectLang('I would like a burger please')).toBe('en');
  });
});

describe('parseOrder', () => {
  const esperado = [
    { productoId: 'HC', cantidad: 2, modificadores: ['sin cebolla'] },
    { productoId: 'LI', cantidad: 1, modificadores: [] },
  ];
  const resolver = () => esperado.map((l) => ({ ...l, productoId: id(l.productoId === 'HC' ? 'Hamburguesa clásica' : 'Limonada') }));

  it('español: cantidad en dígitos, sin X, separador y', () => {
    const r = parse('2 hamburguesas clásicas sin cebolla y una limonada');
    expect(r.lineas).toEqual(resolver());
    expect(r.agotados).toEqual([]);
    expect(r.desconocidos).toEqual([]);
  });

  it('inglés produce las mismas líneas', () => {
    expect(parse('two classic burgers and a lemonade').lineas).toEqual(
      [{ productoId: id('Hamburguesa clásica'), cantidad: 2, modificadores: [] }, { productoId: id('Limonada'), cantidad: 1, modificadores: [] }],
    );
    expect(parse('2 classic burgers without onion and a lemonade').lineas).toEqual(resolver());
  });

  it('mayúsculas y tildes no importan', () => {
    expect(parse('2 HAMBURGUESAS CLASICAS SIN CEBOLLA Y UNA LIMONADA').lineas).toEqual(resolver());
    expect(parse('2 hamburguesas clasicas sin CEBOLLA, una Limonada').lineas).toEqual(resolver());
  });

  it('producto agotado va a agotados y no a lineas', () => {
    setAvailable(store, id('Limonada'), suc, false);
    const r = parse('2 hamburguesas clásicas sin cebolla y una limonada');
    expect(r.agotados).toEqual([id('Limonada')]);
    expect(r.lineas.map((l) => l.productoId)).toEqual([id('Hamburguesa clásica')]);
  });

  it('el agotado se evalúa por sucursal', () => {
    const otra = store.get().sucursales[1].id;
    setAvailable(store, id('Limonada'), suc, false);
    expect(parseOrder('una limonada', store.get(), otra).lineas).toHaveLength(1);
  });

  it('cantidades fuera de 1..20 no crean línea y van a desconocidos', () => {
    for (const t of ['0 hamburguesas', '9999 hamburguesas', '-3 hamburguesas', '21 hamburguesas', 'cero hamburguesas']) {
      const r = parse(t);
      expect(r.lineas, t).toEqual([]);
      expect(r.desconocidos, t).toHaveLength(1);
    }
    expect(parse('20 hamburguesas').lineas[0].cantidad).toBe(20);
    expect(parse('1 hamburguesa').lineas[0].cantidad).toBe(1);
  });

  it('texto sin productos -> lineas vacío', () => {
    expect(parse('hola, buenas tardes').lineas).toEqual([]);
    expect(parse('').lineas).toEqual([]);
    expect(parse('quiero una pizza').lineas).toEqual([]);
    expect(parse('quiero una pizza').desconocidos).toHaveLength(1);
  });

  it('palabras cortas no dan falsos positivos por subcadena', () => {
    const r = parse('te');
    // "te" solo debe coincidir con Té helado, nunca con "hamburguesa"
    expect(r.lineas.map((l) => l.productoId)).toEqual([id('Té helado')]);
    expect(parse('xyz').lineas).toEqual([]);
    expect(parse('de').lineas).toEqual([]);
  });

  it('cantidades en palabras (es y en)', () => {
    expect(parse('tres limonadas').lineas[0].cantidad).toBe(3);
    expect(parse('diez refrescos').lineas[0].cantidad).toBe(10);
    expect(parse('five lemonades').lineas[0].cantidad).toBe(5);
    expect(parse('un cheesecake').lineas[0].cantidad).toBe(1);
  });

  it('plural y singular dan lo mismo', () => {
    expect(parse('1 hamburguesa clásica').lineas).toEqual(parse('1 hamburguesas clasicas').lineas);
    expect(parse('2 burgers').lineas[0].productoId).toBe(parse('2 burger').lineas[0].productoId);
  });

  it('palabra desconocida entre ítems no rompe el resto', () => {
    const r = parse('2 hamburguesas clásicas, blablabla, una limonada');
    expect(r.lineas.map((l) => l.productoId)).toEqual([id('Hamburguesa clásica'), id('Limonada')]);
    expect(r.desconocidos).toEqual(['blablabla']);
  });

  it('"sin" solo aplica a su propio ítem', () => {
    const r = parse('una hamburguesa clásica sin cebolla y una hamburguesa doble');
    expect(r.lineas[0].modificadores).toEqual(['sin cebolla']);
    expect(r.lineas[1].modificadores).toEqual([]);
    const r2 = parse('una hamburguesa clásica sin cebolla y tomate');
    expect(r2.lineas).toHaveLength(1);
    expect(r2.lineas[0].modificadores).toEqual(['sin cebolla', 'sin tomate']);
  });

  it('término de la carne usa el modificador real del producto', () => {
    const r = parse('una hamburguesa clásica término medio');
    expect(r.lineas[0].modificadores).toEqual(['término medio']);
    expect(parse('un churrasco tres cuartos').lineas[0].modificadores).toEqual(['término tres cuartos']);
    expect(parse('un churrasco bien cocido').lineas[0].modificadores).toEqual(['término bien cocido']);
    expect(parse('one churrasco well done').lineas[0].modificadores).toEqual(['término bien cocido']);
    expect(parse('a classic burger medium').lineas[0].modificadores).toEqual(['término medio']);
  });

  it('término en producto que no lo ofrece se descarta', () => {
    expect(parse('una limonada término medio').lineas[0].modificadores).toEqual([]);
  });

  it('agrandar / large / grande', () => {
    expect(parse('una limonada grande').lineas[0].modificadores).toEqual(['agrandar']);
    expect(parse('a large lemonade').lineas[0].modificadores).toEqual(['agrandar']);
    expect(parse('una limonada para agrandar').lineas[0].modificadores).toEqual(['agrandar']);
    expect(parse('un cheesecake grande').lineas[0].modificadores).toEqual([]);
  });

  it('separadores: coma, +, and, y', () => {
    const r = parse('una limonada + dos refrescos, un cheesecake and 1 café americano y tres papas fritas');
    expect(r.lineas.map((l) => [l.productoId, l.cantidad])).toEqual([
      [id('Limonada'), 1], [id('Refresco'), 2], [id('Cheesecake'), 1], [id('Café americano'), 1], [id('Papas fritas'), 3],
    ]);
  });

  it('nombre de producto con "y" no se parte', () => {
    const r = parse('un bowl de pollo y arroz y una limonada');
    expect(r.lineas.map((l) => l.productoId)).toEqual([id('Bowl de pollo y arroz'), id('Limonada')]);
  });

  it('menciones duplicadas del mismo producto se fusionan; con otros mods quedan aparte', () => {
    const r = parse('una limonada y dos limonadas');
    expect(r.lineas).toEqual([{ productoId: id('Limonada'), cantidad: 3, modificadores: [] }]);
    const r2 = parse('una limonada y una limonada sin hielo');
    expect(r2.lineas).toHaveLength(2);
    expect(r2.lineas[1].modificadores).toEqual(['sin hielo']);
  });

  it('pedido con relleno de cortesía', () => {
    const r = parse('Hola, quiero 2 hamburguesas clásicas por favor');
    expect(r.lineas).toEqual([{ productoId: id('Hamburguesa clásica'), cantidad: 2, modificadores: [] }]);
    expect(parse('I would like a lemonade please').lineas).toEqual([{ productoId: id('Limonada'), cantidad: 1, modificadores: [] }]);
  });

  it('no inventa productos: "hamburguesa" no se cuela con "té"', () => {
    const r = parse('quiero un té helado');
    expect(r.lineas.map((l) => l.productoId)).toEqual([id('Té helado')]);
  });

  describe('ronda de arreglos 1', () => {
    const hc = () => id('Hamburguesa clásica');
    it('frase de la demo con destino: ambas líneas, nada en desconocidos', () => {
      const r = parse('Quiero 2 hamburguesas clásicas sin cebolla y una limonada para Obarrio');
      expect(r.lineas).toEqual([
        { productoId: hc(), cantidad: 2, modificadores: ['sin cebolla'] },
        { productoId: id('Limonada'), cantidad: 1, modificadores: [] },
      ]);
      expect(r.desconocidos).toEqual([]);
    });
    it('destino o cola de relleno no se traga el ítem', () => {
      expect(parse('una limonada para Obarrio').lineas.map((l) => l.productoId)).toEqual([id('Limonada')]);
      const r = parse('2 hamburguesas clásicas y 3 papas fritas para llevar');
      expect(r.lineas.map((l) => [l.productoId, l.cantidad])).toEqual([[hc(), 2], [id('Papas fritas'), 3]]);
      expect(r.desconocidos).toEqual([]);
      expect(parse('una limonada por favor para Obarrio').lineas).toHaveLength(1);
      expect(parse('dos hamburguesas clásicas y una limonada para Obarrio').lineas).toHaveLength(2);
      expect(parse('a lemonade to Obarrio').lineas).toHaveLength(1);
      expect(parse('por favor para Obarrio').desconocidos).toEqual([]);
    });
    it('verbos de cortesía y palabras iniciales desconocidas', () => {
      for (const t of ['me regala 2 hamburguesas clásicas y una limonada', 'me colabora con 2 hamburguesas y una limonada',
        "I'd like 2 burgers and a lemonade", 'can I get 2 burgers and a lemonade', 'could I have 2 burgers and a lemonade']) {
        const r = parse(t);
        expect(r.lineas.map((l) => [l.productoId, l.cantidad]), t).toEqual([[r.lineas[0]?.productoId, 2], [id('Limonada'), 1]]);
        expect(r.desconocidos, t).toEqual([]);
      }
      expect(parse('mi estimado amigo 2 limonadas').lineas[0].cantidad).toBe(2);
      expect(parse('blablabla').lineas).toEqual([]);
    });
    it('varios "sin" en el mismo ítem', () => {
      for (const t of ['una hamburguesa clásica sin cebolla y sin tomate', 'una hamburguesa clásica sin cebolla, sin tomate']) {
        const r = parse(t);
        expect(r.lineas).toEqual([{ productoId: hc(), cantidad: 1, modificadores: ['sin cebolla', 'sin tomate'] }]);
        expect(r.desconocidos, t).toEqual([]);
      }
    });
    it('"sin" colgante y "y" mezclado con inglés', () => {
      expect(parse('una hamburguesa clásica sin').lineas).toEqual([{ productoId: hc(), cantidad: 1, modificadores: [] }]);
      const r = parse('two burgers y una limonada');
      expect(r.lineas.map((l) => l.cantidad)).toEqual([2, 1]);
      expect(r.desconocidos).toEqual([]);
    });
  });
});
