import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '../src/core/store.js';
import { setAvailable } from '../src/core/menu.js';
import { createBot } from '../src/bot/engine.js';
import { TEXTS } from '../src/bot/texts.js';
import { parseOrder } from '../src/bot/parser.js';

// Ronda 2: callejón sin salida en la dirección, botones honrados en cada paso, ocasión libre, total, «unas», «dos más».
const memStorage = () => ({ read: () => null, write() {} });
const MEDIODIA = new Date('2026-11-11T17:00:00Z');
let store, bot;
const conv = (id = 'h') => store.get().conversaciones.find((c) => c.id === id);
const say = (t, id = 'h') => bot.reply(id, t);
const txt = (msgs) => msgs.map((m) => m.texto).join('\n');
const nuevo = () => {
  store = createStore(memStorage());
  for (const p of store.get().productos) for (const s of store.get().sucursales) setAvailable(store, p.id, s.id, true);
  bot = createBot(store, { ahora: () => MEDIODIA });
};
beforeEach(nuevo);
const MAL = /No pude identificar|I could not identify|no parece una direcci|does not look like an address|No logré entender|I could not understand/;

describe('BLOQUEANTE: salida a retiro desde el paso de dirección', () => {
  const aFueraDeZona = () => {
    say('una limonada a domicilio');
    say('sí');
    expect(conv().paso).toBe('direccion');
    const out = txt(say('Av Balboa'));
    expect(out).toMatch(/fuera de nuestras zonas/);
    expect(conv().paso).toBe('direccion');
  };
  it.each(['retiro', 'retiro en sucursal', 'Retiro en sucursal', 'pickup', 'Pickup', 'recoger', 'lo recojo yo', 'quiero retirarlo en la sucursal'])('"%s" cambia a retiro y sigue al pago', (t) => {
    aFueraDeZona();
    const out = txt(say(t));
    expect(out).toMatch(/Retira en Plato & Co\.|Pickup at Plato & Co\./);
    expect(out).toMatch(/30 min/);
    expect(out).toMatch(/cómo desea pagar|How would you like to pay/i);
    expect(conv().paso).toBe('pago');
    expect(conv().slots.tipo).toBe('retiro');
  });
  it('"retirar en Norte" usa esa sucursal', () => {
    aFueraDeZona();
    const out = txt(say('retirar en Norte'));
    expect(out).toContain('Retira en Plato & Co. Norte');
    expect(out).toContain('40 min');
    expect(conv().slots.sucursalId).toBe(store.get().sucursales.find((s) => /Norte/.test(s.nombre)).id);
  });
  it('el pedido de retiro se completa', () => {
    aFueraDeZona();
    say('retiro en sucursal');
    const out = txt(say('Yappy'));
    expect(out).toMatch(/registrado/);
    const p = store.get().pedidos.find((x) => x.conversacionId === 'h');
    expect(p.tipo).toBe('retiro');
  });
  it('"Entrega a domicilio" / "Delivery" mantienen la entrega y piden otra vez la dirección', () => {
    for (const t of ['Entrega a domicilio', 'delivery']) {
      nuevo();
      aFueraDeZona();
      const out = txt(say(t));
      expect(out).toMatch(/dirección|address/i);
      expect(out).not.toMatch(MAL);
      expect(conv().paso).toBe('direccion');
    }
  });
  it('en inglés: "Pickup" desde la dirección', () => {
    say('I want a lemonade for delivery');
    say('yes');
    say('Av Balboa');
    const out = txt(say('Pickup'));
    expect(out).toMatch(/Pickup at Plato & Co\./);
    expect(out).toMatch(/30 min/);
    expect(conv().paso).toBe('pago');
  });
  it('"sí" no es un callejón: ofrece las dos opciones con botones', () => {
    aFueraDeZona();
    const m1 = say('sí');
    expect(m1.at(-1).botones).toEqual(TEXTS.es.botonesTipo);
    const m2 = say('sí');
    expect(txt(m2)).toMatch(/retiro/i);
    expect(m2.at(-1).botones).toEqual(TEXTS.es.botonesTipo);
  });
  it('tras 2 respuestas fallidas se ofrecen ambas opciones explícitamente', () => {
    say('una limonada a domicilio');
    say('sí');
    say('Av Balboa');
    const m2 = say('Av Perú');
    expect(txt(m2)).toMatch(/Prefiere retiro en sucursal o probar con otra dirección/);
    expect(m2.at(-1).botones).toEqual(TEXTS.es.botonesTipo);
  });
  it('una dirección válida después de fallos sigue funcionando', () => {
    aFueraDeZona();
    say('sí');
    expect(txt(say('Calle 50, Obarrio'))).toMatch(/pagar/);
    expect(conv().paso).toBe('pago');
  });
});

// Cada botón que el bot muestra debe avanzar el flujo (o responder algo sensato) en el paso que lo ofrece.
describe('cada botón de cada paso se atiende', () => {
  const FLUJOS = {
    es: {
      inicio: [], confirmar: ['Quiero una limonada'], tipo: ['Quiero una limonada', 'sí'],
      direccionFuera: ['una limonada a domicilio', 'sí', 'Av Balboa'], direccionFuera2: ['una limonada a domicilio', 'sí', 'Av Balboa', 'Av Perú'],
      pago: ['Quiero una limonada para Obarrio', 'sí'], ocasion: ['reserva para 2 mañana a las 8 pm'], menu: ['Menú del día'],
    },
    en: {
      inicio: [], confirmar: ['I want a lemonade'], tipo: ['I want a lemonade', 'yes'],
      direccionFuera: ['I want a lemonade for delivery', 'yes', 'Av Balboa'], direccionFuera2: ['I want a lemonade for delivery', 'yes', 'Av Balboa', 'Av Peru'],
      pago: ['I want a lemonade for Obarrio', 'yes'], ocasion: ['table for 2 tomorrow at 8 pm'], menu: ['Menu of the day'],
    },
  };
  for (const lang of ['es', 'en']) {
    for (const [paso, setup] of Object.entries(FLUJOS[lang])) {
      it(`${lang} / ${paso}: cada botón mostrado funciona`, () => {
        nuevo();
        let last = [];
        for (const t of setup) last = say(t);
        if (paso === 'inicio') last = say('hola');
        const botones = last.at(-1)?.botones ?? [];
        expect(botones.length, `${lang}/${paso} muestra botones`).toBeGreaterThan(0);
        const textoAntes = last.at(-1).texto;
        const pasoAntes = conv().paso;
        for (const b of botones) {
          nuevo();
          for (const t of setup) say(t);
          if (paso === 'inicio') say('hola');
          const out = say(b);
          const texto = txt(out);
          expect(texto, `${lang}/${paso}: botón «${b}»`).not.toMatch(MAL);
          expect(texto, `${lang}/${paso}: botón «${b}» no repite lo mismo`).not.toBe(textoAntes);
          if (!/Cancel|cancel|persona|person/.test(b)) {
            expect(conv().paso !== pasoAntes || texto !== textoAntes, `${lang}/${paso}: «${b}» avanza`).toBe(true);
          }
        }
      });
    }
  }
});

describe('minors: ocasión libre', () => {
  const aOcasion = () => { say('reserva para 2 mañana a las 8 pm'); expect(conv().paso).toBe('ocasion'); };
  it('tras 2 respuestas rechazadas, la tercera se acepta como ocasión', () => {
    aOcasion();
    const largo = 'esto es un texto muy largo que no es una ocasion';
    expect(txt(say(largo))).toMatch(/ocasión/);
    expect(conv().paso).toBe('ocasion');
    expect(txt(say(largo))).toMatch(/ocasión/);
    expect(conv().paso).toBe('ocasion');
    expect(txt(say(largo))).toMatch(/Reserva confirmada/);
    expect(store.get().reservas.at(-1).ocasion ?? store.get().reservas[0].ocasion).toBeTruthy();
  });
  it.each(['no gracias', 'no, gracias', 'nope', 'nothing special', 'no thanks'])('"%s" = sin ocasión', (t) => {
    aOcasion();
    expect(txt(say(t))).toMatch(/Reserva confirmada|Booking confirmed/);
    expect(store.get().reservas.some((r) => r.ocasion === 'ninguna')).toBe(true);
  });
  it('un intento rechazado no se cuenta si fue otra intención', () => {
    aOcasion();
    say('Horarios');
    say('Horarios');
    say('Horarios');
    expect(conv().paso).toBe('ocasion');
  });
});

describe('minors: total en la confirmación', () => {
  it.each(['Total?', '¿cuánto es?', 'how much is it?', '¿Cuál es el total?'])('"%s" repite el resumen y el total sin pasar a una persona', (t) => {
    say(/[a-z] it/.test(t) ? 'I want a lemonade' : 'Quiero una limonada para Obarrio');
    const out = txt(say(t));
    expect(out).toMatch(/US\$ 2\.94/);
    expect(out).toMatch(/confirmar|confirm/i);
    expect(conv().requiereHumano).toBe(false);
    expect(conv().paso).toBe('confirmar');
  });
});

describe('minors: unas, otra, dos más', () => {
  const parse = (t) => parseOrder(t, store.get(), store.get().sucursales[0].id);
  const prod = (n) => store.get().productos.find((p) => p.nombre === n).id;
  it.each(['unas papas fritas', 'quiero unas papas fritas', 'unos aros de cebolla'])('"%s" se entiende', (t) => {
    const r = parse(t);
    expect(r.lineas).toHaveLength(1);
    expect(r.lineas[0].cantidad).toBe(1);
    expect(r.desconocidos).toEqual([]);
  });
  it('el primer mensaje "quiero unas papas fritas" crea el pedido', () => {
    expect(txt(say('quiero unas papas fritas'))).toMatch(/1 x Papas fritas/);
    expect(conv().paso).toBe('confirmar');
  });
  it('"otra hamburguesa clásica a domicilio" parsea a una hamburguesa clásica', () => {
    const r = parse('otra hamburguesa clásica a domicilio');
    expect(r.lineas).toEqual([{ productoId: prod('Hamburguesa clásica'), cantidad: 1, modificadores: [] }]);
    expect(r.desconocidos).toEqual([]);
  });
  it('en el pedido: "otra hamburguesa clásica a domicilio" suma 1', () => {
    say('Quiero una hamburguesa clásica para Obarrio');
    say('otra hamburguesa clásica a domicilio');
    expect(conv().slots.lineas[0].cantidad).toBe(2);
  });
  it.each([['dos más', 3], ['two more', 3], ['otra', 2], ['otro más', 2], ['one more', 2], ['otra más', 2]])('"%s" suma al último producto', (t, total) => {
    say('Quiero una hamburguesa clásica para Obarrio');
    const out = txt(say(t));
    expect(out).not.toMatch(MAL);
    expect(conv().slots.lineas.at(-1).cantidad).toBe(total);
    expect(conv().slots.lineas).toHaveLength(1);
  });
  it('"dos más" suma a la ÚLTIMA línea', () => {
    say('Quiero una hamburguesa clásica y una limonada para Obarrio');
    say('dos más');
    expect(conv().slots.lineas.map((l) => l.cantidad)).toEqual([1, 3]);
  });
});

describe('(d) ejemplos de los textos, en el paso donde se muestran', () => {
  const PASOS = {
    es: [['pedirFecha', ['reservar mesa']], ['pedirHora', ['reserva para 2 mañana']], ['pedirOcasion', ['reserva para 2 mañana a las 8 pm']],
      ['pedirDireccion', ['una limonada a domicilio', 'sí']], ['fechaNo', ['reservar mesa']], ['horaNo', ['reserva para 2 mañana']]],
    en: [['pedirFecha', ['book a table']], ['pedirHora', ['table for 2 tomorrow']], ['pedirOcasion', ['table for 2 tomorrow at 8 pm']],
      ['pedirDireccion', ['I want a lemonade for delivery', 'yes']], ['fechaNo', ['book a table']], ['horaNo', ['table for 2 tomorrow']]],
  };
  for (const lang of ['es', 'en']) {
    it(`${lang}: cada ejemplo entrecomillado avanza el flujo`, () => {
      let total = 0;
      for (const [clave, setup] of PASOS[lang]) {
        const ejemplos = [];
        for (const mm of String(TEXTS[lang][clave]).matchAll(/«([^»]+)»|"([^"]+)"/g)) ejemplos.push(mm[1] ?? mm[2]);
        for (const ej of ejemplos) {
          nuevo();
          for (const t of setup) say(t);
          const antes = conv().paso;
          const out = txt(say(ej));
          expect(out, `${clave}: ${ej}`).not.toMatch(MAL);
          expect(out, `${clave}: ${ej}`).not.toMatch(/No entendí|I did not get|persona del equipo|person on the team/);
          expect(conv().requiereHumano, `${clave}: ${ej}`).toBe(false);
          expect(conv().paso !== antes || /confirmada|confirmed|pagar|pay/i.test(out), `${clave}: ${ej} avanza`).toBe(true);
          total += 1;
        }
      }
      expect(total).toBeGreaterThanOrEqual(6);
    });
  }
});
