import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '../src/core/store.js';
import { setAvailable } from '../src/core/menu.js';
import { createBot } from '../src/bot/engine.js';
import { SALUDO } from '../src/core/chat-view.js';
import { TEXTS } from '../src/bot/texts.js';

// Cada botón de respuesta rápida que el bot o el chat ofrecen debe producir una respuesta útil.
const memStorage = () => ({ read: () => null, write() {} });
const MEDIODIA = new Date('2026-11-11T17:00:00Z'); // miércoles 12:00 en Panamá
let store, bot;
const conv = () => store.get().conversaciones.find((c) => c.id === 'q');
const say = (t) => bot.reply('q', t);
const txt = (msgs) => msgs.map((m) => m.texto).join('\n');
const NO_UTIL = /No pude identificar|I could not identify|No logr[eé] entender|I could not understand|No encuentro un pedido|cannot find an order/;

beforeEach(() => {
  store = createStore(memStorage());
  for (const p of store.get().productos) for (const s of store.get().sucursales) setAvailable(store, p.id, s.id, true);
  bot = createBot(store, { ahora: () => MEDIODIA });
});

describe('botones del saludo del chat (chat-view)', () => {
  it('"Hacer un pedido" pide qué desea con un ejemplo, sin pasar a una persona', () => {
    const out = say('Hacer un pedido');
    expect(txt(out)).toMatch(/¿Qué desea pedir\?/);
    expect(txt(out)).toContain('2 hamburguesas clásicas sin cebolla y una limonada para Obarrio');
    expect(txt(out)).not.toMatch(NO_UTIL);
    expect(conv().requiereHumano).toBe(false);
    expect(conv().paso ?? null).toBeNull();
  });
  it('"Reservar mesa" inicia la reserva', () => {
    const out = say('Reservar mesa');
    expect(txt(out)).toMatch(/día|fecha/i);
    expect(conv().paso).toBe('fecha');
    expect(conv().requiereHumano).toBe(false);
  });
  it('"Horarios y ubicación" devuelve horarios Y direcciones', () => {
    const out = txt(say('Horarios y ubicación'));
    for (const s of store.get().sucursales) {
      expect(out).toContain(s.horario.abre);
      expect(out).toContain(s.direccion);
    }
    expect(conv().requiereHumano).toBe(false);
  });
  it('"Alérgenos" pregunta de qué plato, sin pasar a una persona', () => {
    const out = say('Alérgenos');
    expect(txt(out)).toMatch(/¿De qué plato desea saber los alérgenos\?/);
    expect(txt(out)).not.toMatch(/No puedo confirmar/);
    expect(conv().requiereHumano).toBe(false);
  });
  it('"Pasar a una persona" deriva a una persona (es lo esperado)', () => {
    say('Pasar a una persona');
    expect(conv().requiereHumano).toBe(true);
  });
  it('los botones del saludo son exactamente los probados aquí', () => {
    expect(SALUDO.botones).toEqual(['Hacer un pedido', 'Reservar mesa', 'Horarios y ubicación', 'Alérgenos', 'Pasar a una persona']);
  });
});

describe('botones del bot (texts.botonesInicio) en español e inglés', () => {
  it('"Horarios" da los horarios', () => {
    const out = txt(say('Horarios'));
    expect(out).toContain('11:00');
    expect(conv().requiereHumano).toBe(false);
  });
  it('"Menú del día" lista combos y su único botón funciona', () => {
    const out = say('Menú del día');
    expect(txt(out)).toMatch(/Combo/);
    expect(out.at(-1).botones).toEqual(['Hacer un pedido']);
    const sig = say(out.at(-1).botones[0]);
    expect(txt(sig)).toMatch(/¿Qué desea pedir\?/);
    expect(txt(sig)).not.toMatch(NO_UTIL);
    expect(conv().requiereHumano).toBe(false);
  });
  it.each(TEXTS.en.botonesInicio)('en inglés: "%s" da una respuesta útil', (label) => {
    const out = txt(say(label));
    expect(out).not.toMatch(NO_UTIL);
    expect(out.length).toBeGreaterThan(20);
    if (label === 'Place an order') expect(out).toMatch(/What would you like to order\?/);
    expect(conv().requiereHumano).toBe(false);
  });
  it.each(TEXTS.es.botonesInicio)('en español: "%s" da una respuesta útil', (label) => {
    const out = txt(say(label));
    expect(out).not.toMatch(NO_UTIL);
    expect(conv().requiereHumano).toBe(false);
  });
  it('"Quiero hacer mi pedido" es un pedido, no una consulta de estado', () => {
    const out = txt(say('Quiero hacer mi pedido'));
    expect(out).toMatch(/¿Qué desea pedir\?/);
    expect(conv().requiereHumano).toBe(false);
  });
  it.each(['pedir', 'quiero pedir', 'order', 'I want to order', 'hacer un pedido por favor'])('"%s" pide el detalle del pedido', (t) => {
    expect(txt(say(t))).toMatch(/¿Qué desea pedir\?|What would you like to order\?/);
    expect(conv().requiereHumano).toBe(false);
  });
  it('el estado de verdad sigue funcionando', () => {
    for (const t of ['¿cómo va mi pedido?', 'estado de mi pedido', 'where is my order']) {
      expect(txt(say(t))).toMatch(/No encuentro un pedido|cannot find an order/);
    }
  });
});

describe('botones de los pasos del flujo', () => {
  it('Sí/Cancelar, tipo, pago y ocasión funcionan con sus etiquetas', () => {
    say('Quiero una limonada');
    expect(txt(say('Cancelar'))).toMatch(/cancel/i);
    say('Quiero una limonada');
    expect(txt(say(TEXTS.es.si))).toContain(TEXTS.es.pedirTipo);
    expect(txt(say(TEXTS.es.botonesTipo[1]))).toMatch(/Retira en/);
    expect(txt(say(TEXTS.es.botonesPago[2]))).toMatch(/Pedido .* registrado/);
    // entrega
    say('Quiero una limonada');
    say('Sí, confirmar');
    expect(txt(say(TEXTS.es.botonesTipo[0]))).toMatch(/dirección/);
    expect(txt(say('Calle 50, Obarrio'))).toMatch(/pagar/);
    expect(txt(say('Tarjeta'))).toMatch(/Pedido .* registrado/);
    expect(txt(say('Yappy'))).not.toMatch(/Pedido .* registrado/); // ya no hay pedido en curso
  });
  it.each([['No', 'ninguna'], ['Cumpleaños', 'cumpleaños'], ['Aniversario', 'aniversario'], ['None', 'ninguna'], ['Birthday', 'cumpleaños'], ['Anniversary', 'aniversario']])('ocasión "%s" completa la reserva', (label, ocasion) => {
    say('reserva para 2 mañana a las 8 pm');
    expect(conv().paso).toBe('ocasion');
    const out = txt(say(label));
    expect(out).toMatch(/Reserva confirmada|Booking confirmed/);
    expect(store.get().reservas.at(-1).ocasion).toBe(ocasion);
  });
  it('botones en inglés del flujo', () => {
    say('I want a lemonade');
    expect(txt(say(TEXTS.en.si))).toContain(TEXTS.en.pedirTipo);
    expect(txt(say(TEXTS.en.botonesTipo[0]))).toMatch(/address/i);
    say('Calle 50, Obarrio');
    expect(txt(say(TEXTS.en.botonesPago[1]))).toMatch(/placed/);
  });
});
