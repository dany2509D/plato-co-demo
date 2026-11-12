import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '../src/core/store.js';
import { setAvailable } from '../src/core/menu.js';
import { createBot } from '../src/bot/engine.js';

// Defectos de la revisión final (I1, I2, I3, I8, I11, M1, M9).
const memStorage = () => ({ read: () => null, write() {} });
const MEDIODIA = new Date('2026-11-11T17:00:00Z'); // 12:00 en Panamá, todas abiertas
const TEMPRANO = new Date('2026-11-11T15:00:00Z'); // 10:00: Centro (11:00) y Costa (11:30) cerradas, Norte (10:00) abierta
let store, bot, ahora;
const conv = (id = 'f') => store.get().conversaciones.find((c) => c.id === id);
const say = (t, id = 'f') => bot.reply(id, t);
const txt = (msgs) => msgs.map((m) => m.texto).join('\n');
const prod = (n) => store.get().productos.find((p) => p.nombre === n);
const suc = (re) => store.get().sucursales.find((s) => re.test(s.nombre));
const nuevo = (fecha = MEDIODIA) => {
  store = createStore(memStorage());
  for (const p of store.get().productos) for (const s of store.get().sucursales) setAvailable(store, p.id, s.id, true);
  ahora = fecha;
  bot = createBot(store, { ahora: () => ahora });
};
beforeEach(() => nuevo());

describe('I1: retiro en una sucursal con nombre', () => {
  it('"para retirar en la sucursal Norte" usa Norte en el resumen y en el pedido', () => {
    const out = txt(say('Quiero una limonada para retirar en la sucursal Norte'));
    expect(out).toContain('Retira en Plato & Co. Norte');
    expect(conv().slots.sucursalId).toBe(suc(/Norte/).id);
    expect(conv().slots.tipo).toBe('retiro');
    say('Sí, confirmar');
    say('Efectivo contra entrega');
    const p = store.get().pedidos.find((x) => x.conversacionId === 'f');
    expect(p.sucursalId).toBe(suc(/Norte/).id);
    expect(p.tipo).toBe('retiro');
  });
  it('la disponibilidad se revisa en ESA sucursal', () => {
    setAvailable(store, prod('Churrasco').id, suc(/Centro/).id, true);
    setAvailable(store, prod('Churrasco').id, suc(/Norte/).id, false);
    expect(txt(say('Quiero un churrasco para retirar en Norte'))).toMatch(/Churrasco está agotado/);
    nuevo();
    setAvailable(store, prod('Churrasco').id, suc(/Centro/).id, false);
    setAvailable(store, prod('Churrasco').id, suc(/Norte/).id, true);
    const out = txt(say('Quiero un churrasco para retirar en Norte'));
    expect(out).toContain('1 x Churrasco');
    expect(out).toContain('Retira en Plato & Co. Norte');
  });
  it('"retirar en Costa del Este" es retiro en Costa, no entrega', () => {
    const out = txt(say('Quiero una limonada para retirar en Costa del Este'));
    expect(out).toContain('Retira en Plato & Co. Costa');
    expect(conv().slots.tipo).toBe('retiro');
    expect(conv().slots.sucursalId).toBe(suc(/Costa/).id);
  });
  it('en inglés: "pickup at North"', () => {
    const out = txt(say('I want a lemonade for pickup at North'));
    expect(out).toContain('Pickup at Plato & Co. Norte');
  });
  it('retiro sin nombrar sucursal sigue usando la sucursal por defecto', () => {
    const out = txt(say('Quiero una limonada para retirar'));
    expect(out).toContain('Retira en Plato & Co. Centro');
  });
  it('al elegir el retiro en un paso posterior con otra sucursal, se re-verifica', () => {
    setAvailable(store, prod('Churrasco').id, suc(/Norte/).id, false);
    say('Quiero un churrasco');
    say('sí');
    const out = txt(say('retiro en Norte'));
    expect(out).toMatch(/Churrasco está agotado/);
  });
});

describe('I2: solo un "sí" limpio confirma', () => {
  it.each(['Sí, confirmar', 'sí', 'ok', 'Dale', 'yes', 'Yes, confirm', 'confirmo', 'sí por favor'])('"%s" confirma', (t) => {
    say('Quiero una limonada para Obarrio');
    const out = txt(say(t));
    expect(out).toMatch(/pagar|pay/i);
    expect(conv().paso).toBe('pago');
  });
  it('"Sí, pero sin cebolla" aplica la corrección y vuelve a pedir confirmación', () => {
    say('Quiero una hamburguesa clásica para Obarrio');
    const out = txt(say('Sí, pero sin cebolla'));
    expect(out).toMatch(/Hamburguesa cl[aá]sica \(sin cebolla\)/);
    expect(out).toContain('¿Desea confirmar el pedido?');
    expect(conv().paso).toBe('confirmar');
    expect(conv().slots.lineas[0].modificadores).toEqual(['sin cebolla']);
  });
  it('"ok, y agrégale una limonada" suma la línea y vuelve a confirmar', () => {
    say('Quiero una hamburguesa clásica para Obarrio');
    const out = txt(say('ok, y agrégale una limonada'));
    expect(out).toContain('1 x Limonada');
    expect(out).toContain('¿Desea confirmar el pedido?');
    expect(conv().paso).toBe('confirmar');
    expect(conv().slots.lineas).toHaveLength(2);
  });
  it('en inglés: "yes, but add a coke"', () => {
    say('I want a burger for Obarrio');
    const out = txt(say('yes, but add a coke'));
    expect(out).toContain('1 x Refresco');
    expect(conv().paso).toBe('confirmar');
  });
});

describe('I3: preguntas dentro de un paso', () => {
  beforeEach(() => { say('Quiero una limonada para Obarrio'); say('sí'); expect(conv().paso).toBe('pago'); });
  it('"¿A qué hora cierran?" en el pago responde horarios, repite la pregunta y no guarda dirección', () => {
    const out = txt(say('¿A qué hora cierran?'));
    expect(out).toContain('22:00');
    expect(out).toMatch(/cómo desea pagar/i);
    expect(out).not.toContain('Anotado');
    expect(conv().paso).toBe('pago');
    expect(conv().slots.direccion).toBe('Obarrio');
    expect(conv().slots.exacta).toBe(false);
  });
  it('"¿la limonada tiene lácteos?" se responde sin salir del pago', () => {
    const out = txt(say('¿la limonada tiene lácteos?'));
    expect(out).toMatch(/Limonada no lista l[aá]cteos/);
    expect(out).toMatch(/cómo desea pagar/i);
    expect(conv().paso).toBe('pago');
    expect(conv().requiereHumano).toBe(false);
  });
  it('"¿dónde están ubicados?" y "¿cómo va mi pedido?" también', () => {
    expect(txt(say('¿dónde están ubicados?'))).toContain('Calle Ficticia 123');
    expect(conv().paso).toBe('pago');
    expect(txt(say('¿cómo va mi pedido?'))).toMatch(/Aún no lo he registrado/);
    expect(conv().paso).toBe('pago');
  });
  it('"¿aceptan tarjeta?" no cobra: repite los métodos', () => {
    const out = txt(say('¿aceptan tarjeta?'));
    expect(out).toMatch(/Yappy, tarjeta o efectivo/);
    expect(store.get().pedidos.some((p) => p.conversacionId === 'f')).toBe(false);
    expect(conv().paso).toBe('pago');
  });
  it('un texto que no es pregunta sí se anota como dirección', () => {
    const out = txt(say('Casa azul frente al parque'));
    expect(out).toContain('Anotado');
    expect(conv().slots.direccion).toContain('Casa azul frente al parque');
  });
  it('pregunta desconocida en el pago: pasa a una persona y repite el paso', () => {
    const out = txt(say('¿Tienen estacionamiento para bicicletas?'));
    expect(out).toMatch(/persona del equipo/);
    expect(out).toMatch(/cómo desea pagar/i);
    expect(conv().paso).toBe('pago');
    expect(conv().slots.direccion).toBe('Obarrio');
  });
});

describe('I3: preguntas en la confirmación y eco con tildes', () => {
  it('alérgenos en la confirmación se responden y se repite la confirmación', () => {
    say('Quiero una limonada para Obarrio');
    const out = txt(say('¿la hamburguesa clásica tiene gluten?'));
    expect(out).toMatch(/Hamburguesa cl[aá]sica contiene gluten/);
    expect(out).not.toMatch(/No pude identificar/);
    expect(out).toContain('¿Desea confirmar el pedido?');
    expect(conv().paso).toBe('confirmar');
    expect(conv().slots.lineas).toHaveLength(1);
  });
  it('lo no identificado se repite con sus tildes originales', () => {
    const out = txt(say('Quiero una pizza margarita y una limonada para Obarrio'));
    expect(out).toContain('pizza margarita');
    const out2 = txt(say('agrega un sándwich de jamón'));
    expect(out2).toContain('sándwich de jamón');
    expect(out2).not.toContain('sandwich de jamon');
  });
  it('en la dirección, una pregunta no se toma como dirección', () => {
    say('Quiero una limonada');
    say('sí');
    say('Entrega a domicilio');
    expect(conv().paso).toBe('direccion');
    const out = txt(say('¿A qué hora cierran?'));
    expect(out).toContain('22:00');
    expect(out).toMatch(/dirección/);
    expect(conv().paso).toBe('direccion');
  });
});

describe('I8: sucursal cerrada', () => {
  beforeEach(() => nuevo(TEMPRANO));
  it('el resumen avisa que Centro está cerrada y que quedará programado, sin quitar "Lo prepara"', () => {
    const out = txt(say('Quiero una limonada para Obarrio'));
    expect(out).toContain('Lo prepara Plato & Co. Centro, tiempo estimado 30 min.');
    expect(out).toMatch(/Plato & Co\. Centro está cerrada ahora \(abre hoy a las 11:00\)/);
    expect(out).toMatch(/quedará programado/);
  });
  it('la confirmación del pedido también lo dice', () => {
    say('Quiero una limonada para Obarrio');
    say('sí');
    const out = txt(say('Yappy'));
    expect(out).toMatch(/Pedido .* registrado/);
    expect(out).toMatch(/cerrada ahora/);
    expect(out).toMatch(/quedará programado/);
  });
  it('en inglés', () => {
    const out = txt(say('I want a lemonade for Obarrio'));
    expect(out).toMatch(/Plato & Co\. Centro is closed right now \(opens today at 11:00\)/);
    expect(out).toMatch(/scheduled/);
  });
  it('sucursal abierta (Norte): sin aviso', () => {
    const out = txt(say('Quiero una limonada para retirar en Norte'));
    expect(out).not.toMatch(/cerrada/);
  });
  it('a mediodía no hay aviso', () => {
    nuevo(MEDIODIA);
    expect(txt(say('Quiero una limonada para Obarrio'))).not.toMatch(/cerrada/);
  });
  it('el texto de la demo (Total US$ 22.10 y "Lo prepara … Centro, 30 min") no cambia', () => {
    nuevo(MEDIODIA);
    const out = txt(say('Quiero 2 hamburguesas clásicas sin cebolla y una limonada para Obarrio'));
    expect(out).toContain('Total: US$ 22.10');
    expect(out).toContain('Subtotal US$ 20.65, ITBMS 7% US$ 1.45');
    expect(out).toContain('Lo prepara Plato & Co. Centro, tiempo estimado 30 min.');
    expect(out).toContain('¿Desea confirmar el pedido?');
  });
});

describe('I11: coca / coke / cola', () => {
  it.each([['agrega una coca', 1], ['add a coke', 1], ['dame 2 cocas', 2], ['quiero una cola', 1]])('"%s" -> Refresco x%i', (t, q) => {
    const out = txt(say(t));
    expect(out).toContain(`${q} x Refresco`);
    expect(conv().paso).toBe('confirmar');
  });
  it('la sugerencia "agrega una coca" funciona durante la confirmación', () => {
    say('Quiero una limonada para Obarrio');
    const out = txt(say('agrega una coca'));
    expect(out).toContain('1 x Refresco');
    expect(out).toContain('1 x Limonada');
  });
});

describe('M1: palabras que son propiedades de Object', () => {
  it.each(['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf'])('"mejor %s" y "quiero 2 %s" no revientan', (w) => {
    say('Quiero una limonada para Obarrio');
    const out = txt(say(`mejor ${w}`));
    expect(out).not.toMatch(/NaN|native code|undefined|\[object/);
    expect(conv().slots.lineas).toHaveLength(1);
    expect(conv().slots.lineas[0].cantidad).toBe(1);
    const out2 = txt(say(`quiero 2 ${w}`));
    expect(out2).not.toMatch(/NaN|native code|undefined|\[object/);
  });
});

describe('M9: ambigüedad, enteros y límite', () => {
  it('"quiero un helado" pregunta cuál, sin elegir por usted', () => {
    const out = txt(say('quiero un helado'));
    expect(out).toMatch(/Helado de vainilla/);
    expect(out).toMatch(/Brownie con helado/);
    expect(out).toMatch(/T[eé] helado/);
    expect(out).not.toMatch(/Su pedido/);
    expect(conv().paso ?? null).toBeNull();
  });
  it('"1.5 limonadas" se rechaza con un mensaje claro', () => {
    const out = txt(say('1.5 limonadas'));
    expect(out).toMatch(/enteros/);
    expect(out).not.toMatch(/Su pedido/);
  });
  it('"1,5 limonadas" igual', () => {
    expect(txt(say('1,5 limonadas'))).toMatch(/enteros/);
  });
  it('"25 limonadas" dice el límite de 1 a 20', () => {
    const out = txt(say('25 limonadas'));
    expect(out).toMatch(/1 a 20/);
    expect(out).not.toMatch(/No pude identificar/);
  });
  it('la ambigüedad también se avisa al editar el pedido', () => {
    say('Quiero una limonada para Obarrio');
    const out = txt(say('agrega un helado'));
    expect(out).toMatch(/Helado de vainilla/);
    expect(conv().slots.lineas).toHaveLength(1);
    expect(conv().paso).toBe('confirmar');
  });
  it('"no sé" en la confirmación es incertidumbre, no "No pude identificar"', () => {
    say('Quiero una limonada para Obarrio');
    for (const t of ['no sé', 'no se', 'not sure']) {
      const out = txt(say(t));
      expect(out, t).not.toMatch(/No pude identificar|I could not identify/);
      expect(out, t).toMatch(/sí|yes/i);
      expect(conv().paso).toBe('confirmar');
    }
  });
});
