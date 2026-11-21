import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '../src/core/store.js';
import { setAvailable } from '../src/core/menu.js';
import { createBot } from '../src/bot/engine.js';

// I4: el producto de una pregunta de alérgenos se identifica sin elegir por parecido; nunca se
// afirma "sin alérgeno" si el dato no está declarado (RNF-01).
const memStorage = () => ({ read: () => null, write() {} });
let store, bot;
const conv = () => store.get().conversaciones.find((c) => c.id === 'a');
const say = (t) => bot.reply('a', t);
const txt = (msgs) => msgs.map((m) => m.texto).join('\n');
beforeEach(() => {
  store = createStore(memStorage());
  for (const p of store.get().productos) for (const s of store.get().sucursales) setAvailable(store, p.id, s.id, true);
  bot = createBot(store, { ahora: () => new Date('2026-11-11T17:00:00Z') });
});

describe('I4: producto correcto', () => {
  it('"¿El helado tiene lácteos?" es ambiguo: pregunta cuál y no afirma nada', () => {
    const out = txt(say('¿El helado tiene lácteos?'));
    expect(out).toMatch(/T[eé] helado/);
    expect(out).toMatch(/Helado de vainilla/);
    expect(out).not.toMatch(/no lista/);
  });
  it('"Helado de vainilla" tiene datos NO declarados: pasa a una persona', () => {
    const out = txt(say('¿El Helado de vainilla tiene lácteos?'));
    expect(out).toMatch(/No puedo confirmar/);
    expect(conv().requiereHumano).toBe(true);
  });
  it('"¿El té helado tiene lácteos?" responde por el Té helado (declarado)', () => {
    const out = txt(say('¿El té helado tiene lácteos?'));
    expect(out).toMatch(/T[eé] helado no lista l[aá]cteos/);
  });
  it('multi-producto: churrasco y ensalada César, una respuesta por cada uno', () => {
    const out = txt(say('¿El churrasco y la ensalada César tienen gluten?'));
    expect(out).toMatch(/Churrasco no lista gluten/);
    expect(out).toMatch(/Ensalada César contiene gluten/);
    expect(conv().requiereHumano).toBe(false);
  });
  it('multi-producto con uno no declarado: responde el declarado y deriva el otro', () => {
    const out = txt(say('¿El churrasco y las costillas tienen gluten?'));
    expect(out).toMatch(/Churrasco no lista gluten/);
    expect(out).toMatch(/Costillas BBQ/);
    expect(out).not.toMatch(/Costillas BBQ no lista/);
    expect(conv().requiereHumano).toBe(true);
  });
  it('multi-producto con un nombre ambiguo: responde lo claro y pregunta lo otro', () => {
    const out = txt(say('¿El churrasco y la ensalada tienen gluten?'));
    expect(out).toMatch(/Churrasco no lista gluten/);
    expect(out).toMatch(/Ensalada César/);
    expect(out).toMatch(/Ensalada de la casa/);
    expect(out).not.toMatch(/Ensalada César contiene/);
  });
  it('palabra única de un plato lo identifica ("cheesecake", "nachos")', () => {
    expect(txt(say('¿el cheesecake tiene huevo?'))).toMatch(/Cheesecake contiene huevo/);
    expect(txt(say('¿los nachos tienen gluten?'))).toMatch(/Nachos con queso no lista gluten/);
  });
  it('"¿La hamburguesa tiene gluten?" es ambigua (hay 6 hamburguesas)', () => {
    const out = txt(say('¿La hamburguesa tiene gluten?'));
    expect(out).toMatch(/Hamburguesa cl[aá]sica/);
    expect(out).toMatch(/Hamburguesa doble/);
    expect(out).not.toMatch(/contiene gluten\./);
  });
  it('un ingrediente no ensucia una coincidencia clara', () => {
    expect(txt(say('¿La hamburguesa clásica tiene queso o lácteos?'))).toMatch(/Hamburguesa cl[aá]sica contiene l[aá]cteos/);
  });
  it('en inglés: "Does the iced tea contain dairy?"', () => {
    const out = txt(say('Does the iced tea contain dairy?'));
    expect(out).toMatch(/T[eé] helado does not list dairy/);
  });
  it('nunca dice "sin" para un plato no declarado, en ninguna formulación', () => {
    const undeclared = store.get().productos.filter((p) => p.alergenosDeclarados !== true);
    expect(undeclared.length).toBeGreaterThan(3);
    for (const p of undeclared) {
      for (const q of [`¿${p.nombre} tiene gluten?`, `Does ${p.nombre} contain dairy?`, `¿El plato ${p.nombre} es apto para celíacos?`]) {
        const out = txt(say(q));
        expect(out, q).not.toMatch(/no lista|does not list|lists no allergens|no tiene/);
      }
    }
  });
});
