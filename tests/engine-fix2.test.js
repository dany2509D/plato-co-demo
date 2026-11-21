import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '../src/core/store.js';
import { setAvailable, setPrice } from '../src/core/menu.js';
import { parsePrecio, mensajePrecio, PRECIO_MAX } from '../src/core/menu-admin.js';
import { createBot } from '../src/bot/engine.js';
import { TEXTS } from '../src/bot/texts.js';

// Segunda ronda de la revisión: inglés, ocasión de la reserva, estado sin pedido, pedido repetido, dirección, precios.
const memStorage = () => ({ read: () => null, write() {} });
const MEDIODIA = new Date('2026-11-11T17:00:00Z');
let store, bot;
const conv = (id = 'g') => store.get().conversaciones.find((c) => c.id === id);
const say = (t, id = 'g') => bot.reply(id, t);
const txt = (msgs) => msgs.map((m) => m.texto).join('\n');
const NO_RESERVA = /Reserva confirmada|Booking confirmed/;
const nuevo = () => {
  store = createStore(memStorage());
  for (const p of store.get().productos) for (const s of store.get().sucursales) setAvailable(store, p.id, s.id, true);
  bot = createBot(store, { ahora: () => MEDIODIA });
};
beforeEach(nuevo);

describe('IMPORTANT 1: los ejemplos que sugiere el bot funcionan', () => {
  it('"Does the classic burger contain gluten?" responde por la Hamburguesa clásica', () => {
    const out = txt(say('Does the classic burger contain gluten?'));
    expect(out).toMatch(/Hamburguesa cl[aá]sica contains gluten/);
    expect(out).not.toMatch(/Which dish/);
  });
  it.each([
    ['Does the double burger contain dairy?', /Hamburguesa doble contains dairy/],
    ['Does the chicken burger contain gluten?', /Hamburguesa de pollo contains gluten/],
    ['Does the veggie burger contain soy?', /Hamburguesa vegetariana contains soy/],
    ['Does the vegetarian burger contain gluten?', /Hamburguesa vegetariana contains gluten/],
    ['Does the bacon burger contain gluten?', /cannot confirm/], // datos no declarados: honesto, pero sin preguntar «cuál»
    ['Does the spicy burger contain gluten?', /cannot confirm/],
    ['Does the caesar salad contain dairy?', /Ensalada César contains dairy/],
    ['Does the strawberry shake contain dairy?', /Batido de fresa contains dairy/],
  ])('"%s"', (q, re) => {
    expect(txt(say(q))).toMatch(re);
  });
  it('"Allergens" en inglés y su ejemplo llegan a una respuesta', () => {
    expect(txt(say('Allergens'))).toMatch(/Which dish would you like/);
    expect(txt(say('Does the classic burger contain gluten?'))).toMatch(/contains gluten/);
  });
  it.each([['es'], ['en']])('cada ejemplo escrito en los textos (%s) funciona de verdad, sin "¿cuál?" ni pasar a una persona', (lang) => {
    const claves = ['pedirQue', 'pedirAlergeno', 'aclarar', 'pedidoVacio'];
    const ejemplos = [];
    for (const k of claves) {
      for (const mm of String(TEXTS[lang][k]).matchAll(/«([^»]+)»|"([^"]+)"/g)) ejemplos.push(mm[1] ?? mm[2]);
    }
    expect(ejemplos.length).toBeGreaterThanOrEqual(5);
    for (const ej of ejemplos) {
      nuevo();
      const out = txt(say(ej));
      expect(out, ej).not.toMatch(/Which dish do you mean|¿De cuál plato|No pude identificar|I could not identify|No logré entender|I could not understand/);
      expect(conv().requiereHumano, ej).toBe(false);
    }
  });
  it('el ejemplo de «¿De cuál plato?» también funciona', () => {
    const out = txt(say('¿El helado tiene lácteos?'));
    const ej = /«([^»]+)»/.exec(out)[1];
    nuevo();
    const r = txt(say(ej));
    expect(r).not.toMatch(/¿De cuál plato/);
    expect(r).toMatch(/Según los datos|No puedo confirmar/);
  });
});

describe('IMPORTANT 2: horarios en inglés', () => {
  it.each(['What time do you close?', 'what time do you open', 'when do you close', 'when do you open?', 'are you open now', 'opening hours', 'What are your hours?'])('primer mensaje: "%s"', (q) => {
    const out = txt(say(q));
    expect(out).toMatch(/Our hours/);
    expect(out).toContain('22:00');
    expect(conv().requiereHumano).toBe(false);
  });
  it('dentro de pago y confirmación se responde y se repite la pregunta pendiente', () => {
    say('I want a lemonade for Obarrio');
    say('Calle 50');
    let out = txt(say('when do you open?'));
    expect(out).toMatch(/Our hours/);
    expect(out).toMatch(/How would you like to pay/);
    expect(conv().paso).toBe('pago');
    say('card');
    out = txt(say('What time do you close?'));
    expect(out).toMatch(/Our hours/);
    expect(out).toMatch(/Do you want to confirm/);
    expect(conv().paso).toBe('confirmar');
  });
});

describe('IMPORTANT 3: estado sin pedido registrado, en pasos del pedido', () => {
  it.each(['¿cuánto demora mi pedido?', '¿cuándo llega?', 'how long will my order take', 'when will it arrive?'])('en el pago: "%s"', (q) => {
    say('Quiero una limonada para Obarrio');
    say('Calle 50');
    const out = txt(say(q));
    expect(out).toMatch(/Aún no lo he registrado|I have not placed it yet/);
    expect(out).toMatch(/30 min/);
    expect(out).toMatch(/cómo desea pagar|How would you like to pay/i);
    expect(conv().requiereHumano).toBe(false);
    expect(conv().paso).toBe('pago');
  });
  it('en la confirmación también', () => {
    say('Quiero una limonada para Obarrio');
    say('Calle 50');
    say('Yappy');
    const out = txt(say('¿cuánto demora mi pedido?'));
    expect(out).toMatch(/Aún no lo he registrado/);
    expect(out).toContain('¿Desea confirmar el pedido?');
    expect(conv().requiereHumano).toBe(false);
  });
  it('sin ningún pedido en curso: se mantiene el comportamiento anterior', () => {
    const out = txt(say('¿cómo va mi pedido?'));
    expect(out).toMatch(/No encuentro un pedido/);
    expect(conv().requiereHumano).toBe(true);
  });
});

describe('IMPORTANT 4: ocasión y demás pasos de la reserva', () => {
  const aOcasion = () => { say('reserva para 2 mañana a las 8 pm'); expect(conv().paso).toBe('ocasion'); };
  it.each(['Hacer un pedido', 'Horarios', 'Horarios y ubicación', 'quiero una limonada', '¿tienen opciones sin gluten?', 'Alérgenos', 'Menú del día', 'Reservar mesa', '¿Dónde están ubicados?'])('"%s" no crea una reserva', (t) => {
    aOcasion();
    const antes = store.get().reservas.length;
    say(t);
    expect(store.get().reservas.length).toBe(antes);
  });
  it('"Hacer un pedido" pide el detalle del pedido y cierra la reserva a medias', () => {
    aOcasion();
    expect(txt(say('Hacer un pedido'))).toMatch(/¿Qué desea pedir\?/);
    expect(conv().paso ?? null).toBeNull();
  });
  it('"quiero una limonada" inicia el pedido', () => {
    aOcasion();
    expect(txt(say('quiero una limonada'))).toMatch(/1 x Limonada/);
    expect(conv().paso).toBe('tipo');
  });
  it('"Horarios y ubicación" responde y vuelve a preguntar la ocasión', () => {
    aOcasion();
    const out = txt(say('Horarios y ubicación'));
    expect(out).toContain('Calle Ficticia 123');
    expect(out).toMatch(/ocasión especial/);
    expect(conv().paso).toBe('ocasion');
  });
  it('una pregunta se atiende y se vuelve a preguntar la ocasión', () => {
    aOcasion();
    const out = txt(say('¿tienen opciones sin gluten?'));
    expect(out).toMatch(/ocasión especial/);
    expect(conv().paso).toBe('ocasion');
  });
  it.each([['no', 'ninguna'], ['ninguna', 'ninguna'], ['nada', 'ninguna'], ['ninguno', 'ninguna'], ['none', 'ninguna'], ['no occasion', 'ninguna'], ['Cumpleaños', 'cumpleaños'], ['aniversario', 'aniversario'], ['cita', 'cita'], ['reunión de familia', 'reunión de familia'], ['graduación', 'graduación'], ['birthday', 'cumpleaños'], ['business dinner', 'business dinner'], ['cena con mis suegros', 'cena con mis suegros']])('ocasión válida "%s"', (t, ocasion) => {
    aOcasion();
    expect(txt(say(t))).toMatch(NO_RESERVA);
    expect(store.get().reservas.at(-1)?.ocasion ?? store.get().reservas[0].ocasion).toBeDefined();
    expect(store.get().reservas.some((r) => r.ocasion === ocasion)).toBe(true);
  });
  it('texto largo sin sentido no es una ocasión: se vuelve a preguntar', () => {
    aOcasion();
    const antes = store.get().reservas.length;
    const out = txt(say('esto es un texto muy largo que no es una ocasión'));
    expect(out).toMatch(/ocasión/);
    expect(store.get().reservas.length).toBe(antes);
    expect(conv().paso).toBe('ocasion');
  });
  it('"cancelar" descarta la reserva a medias', () => {
    aOcasion();
    say('cancelar');
    expect(conv().paso ?? null).toBeNull();
  });
  it('fecha, hora y personas: el texto ajeno no se toma como respuesta', () => {
    for (const [previo, paso] of [['reservar mesa', 'fecha'], ['reserva para 2 mañana', 'hora'], ['reserva para mañana a las 8 pm', 'personas']]) {
      for (const ajeno of ['Hacer un pedido', 'quiero 2 limonadas', 'Horarios', '¿tienen estacionamiento?', 'asdf qwerty']) {
        nuevo();
        say(previo);
        expect(conv().paso, previo).toBe(paso);
        const antes = store.get().reservas.length;
        const out = txt(say(ajeno));
        expect(store.get().reservas.length, `${paso}: ${ajeno}`).toBe(antes);
        if (ajeno === 'Horarios') expect(conv().paso, `${paso}: ${ajeno}`).toBe(paso);
        if (ajeno === 'asdf qwerty') expect(conv().paso, `${paso}: ${ajeno}`).toBe(paso);
        if (ajeno === 'quiero 2 limonadas') expect(out, `${paso}`).toMatch(/2 x Limonada/);
      }
    }
  });
  it('responder bien sigue funcionando en cada paso', () => {
    say('reservar mesa');
    say('mañana');
    say('8 pm');
    say('4');
    expect(txt(say('no'))).toMatch(NO_RESERVA);
  });
});

describe('IMPORTANT 5: la misma frase repetida no duplica el pedido', () => {
  it('repetir la frase completa en la confirmación no duplica', () => {
    const frase = 'Quiero 2 hamburguesas clásicas sin cebolla y una limonada para Obarrio';
    say(frase);
    say('Calle 50');
    say('Yappy');
    const out = txt(say(frase));
    expect(out).toMatch(/Ya tengo eso en su pedido/);
    expect(out).toContain('¿Desea confirmar el pedido?');
    expect(conv().slots.lineas.map((l) => l.cantidad)).toEqual([2, 1]);
  });
  it('"I want 2 cokes" después de "add a coke" no pasa a 3', () => {
    say('I want a lemonade');
    say('add a coke');
    const out = txt(say('I want 2 cokes'));
    expect(out).toMatch(/I already have that in your order/);
    expect(conv().slots.lineas.find((l) => l.cantidad && true && l.productoId.includes('refresco')).cantidad).toBe(1);
  });
  it('con una señal de sumar sí agrega', () => {
    say('Quiero una hamburguesa clásica para Obarrio');
    say('agrega una hamburguesa clásica');
    expect(conv().slots.lineas[0].cantidad).toBe(2);
    say('y otra hamburguesa clásica');
    expect(conv().slots.lineas[0].cantidad).toBe(3);
    say('add another classic burger');
    expect(conv().slots.lineas[0].cantidad).toBe(4);
  });
  it('un producto nuevo sin cue sí se agrega', () => {
    say('Quiero una hamburguesa clásica para Obarrio');
    say('una limonada');
    expect(conv().slots.lineas).toHaveLength(2);
  });
});

describe('minors', () => {
  it('(b) la dirección: el texto ajeno no se guarda', () => {
    say('Quiero una limonada para Obarrio');
    say('Calle 50');
    for (const ajeno of ['Horarios', 'quiero una pizza', '¿tienen estacionamiento?', 'asdf qwerty']) {
      const out = txt(say(ajeno));
      expect(out, ajeno).not.toContain('Anotado');
      expect(conv().slots.direccion, ajeno).toBe('Calle 50, Obarrio');
      expect(conv().paso, ajeno).toBe('pago');
    }
    expect(txt(say('Calle 60, edificio Plaza'))).toContain('Anotado');
    expect(conv().slots.direccion).toContain('Calle 60, edificio Plaza');
  });
  it('(b) acepta direcciones reales: zona sola, con número, o de 3 palabras', () => {
    say('Quiero una limonada');
    say('sí');
    say('Entrega a domicilio');
    expect(txt(say('asdf qwerty'))).toMatch(/dirección/);
    expect(conv().paso).toBe('direccion');
    // la zona sola no basta para entregar: se pide la dirección exacta
    expect(txt(say('Obarrio'))).toMatch(/dirección exacta en Obarrio/);
    expect(conv().paso).toBe('direccion');
    expect(txt(say('Calle 50'))).toMatch(/pagar/);
    expect(conv().paso).toBe('pago');
    expect(conv().slots.direccion).toBe('Calle 50, Obarrio');
  });
  it('(c) el retiro dice el tiempo estimado', () => {
    say('Quiero una limonada para retirar en la sucursal Norte');
    say('Efectivo contra entrega');
    const out = txt(say('sí'));
    expect(out).toMatch(/Tiempo estimado: 40 min/);
  });
  it('(d) "add a coke" como primer mensaje se contesta en inglés', () => {
    const out = txt(say('add a coke'));
    expect(out).toMatch(/Your order/);
    expect(conv().idioma).toBe('en');
    nuevo();
    expect(txt(say('2 burgers and fries'))).toMatch(/Delivery or pickup/);
  });
  it('(e) "sí, pero cámbialo a 3 hamburguesas" cambia la cantidad', () => {
    say('Quiero 2 hamburguesas clásicas y una limonada para Obarrio');
    say('Calle 50');
    say('Yappy');
    const out = txt(say('sí, pero cámbialo a 3 hamburguesas'));
    expect(out).toContain('3 x Hamburguesa clásica');
    expect(out).toContain('1 x Limonada');
    expect(conv().slots.lineas).toHaveLength(2);
    expect(conv().paso).toBe('confirmar');
  });
  it('(e) "make it 5 lemonades" y "mejor 4 limonadas"', () => {
    say('Quiero 2 hamburguesas clásicas y una limonada para Obarrio');
    say('mejor 4 limonadas');
    expect(conv().slots.lineas.find((l) => l.productoId.includes('limonada')).cantidad).toBe(4);
    say('make it 5 lemonades');
    expect(conv().slots.lineas.find((l) => l.productoId.includes('limonada')).cantidad).toBe(5);
    expect(conv().slots.lineas).toHaveLength(2);
  });
  it('(e) cantidad fuera de rango dice el límite', () => {
    say('Quiero 2 hamburguesas clásicas para Obarrio');
    expect(txt(say('cámbialo a 30 hamburguesas'))).toMatch(/1 a 20/);
    expect(conv().slots.lineas[0].cantidad).toBe(2);
  });
});

describe('(a) tope de precio', () => {
  it('setPrice rechaza más de 999.99', () => {
    nuevo();
    const p = store.get().productos[0];
    const antes = p.precio;
    for (const v of [1e9, 5000, 1000, 999.995, Infinity]) { setPrice(store, p.id, v); expect(store.get().productos[0].precio, String(v)).toBe(antes); }
    setPrice(store, p.id, 999.99);
    expect(store.get().productos[0].precio).toBe(999.99);
  });
  it('parsePrecio rechaza más de 999.99 con mensaje claro', () => {
    expect(PRECIO_MAX).toBe(999.99);
    for (const v of ['1e9', '5000', '1000', '999.995', '1000000000']) {
      expect(parsePrecio(v), v).toBe(null);
      expect(mensajePrecio(v), v).toMatch(/999\.99/);
    }
    expect(parsePrecio('999.99')).toBe(999.99);
    expect(mensajePrecio('9.5')).toBe('');
    expect(mensajePrecio('abc')).toMatch(/válid|numér|número/i);
    expect(mensajePrecio('0')).toMatch(/mayor que 0/);
  });
});
