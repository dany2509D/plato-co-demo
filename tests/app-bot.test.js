import { describe, it, expect } from 'vitest';
import { createStore } from '../src/core/store.js';
import { advanceStatus } from '../src/core/orders.js';
import { getAppBot } from '../src/bot/instance.js';

const mem = () => ({ read: () => null, write() {} });

function pedidoPorChat(store, bot) {
  bot.reply('c-web', 'Quiero 2 hamburguesas clásicas para retiro');
  bot.reply('c-web', 'sí');
  bot.reply('c-web', 'Yappy');
  return store.get().pedidos.find((p) => p.conversacionId === 'c-web');
}

describe('bot de la app (singleton)', () => {
  it('avisa el cambio de estado sin que exista ninguna vista de chat', () => {
    const store = createStore(mem());
    const bot = getAppBot(store);
    const p = pedidoPorChat(store, bot);
    expect(p).toBeTruthy();
    const antes = store.get().conversaciones[0].mensajes.length;
    advanceStatus(store, p.id);
    const msgs = store.get().conversaciones[0].mensajes;
    expect(msgs.length).toBe(antes + 1);
    expect(msgs.at(-1).texto).toContain(p.id);
  });
  it('pedir el bot dos veces no duplica los avisos', () => {
    const store = createStore(mem());
    expect(getAppBot(store)).toBe(getAppBot(store));
    const p = pedidoPorChat(store, getAppBot(store));
    const antes = store.get().conversaciones[0].mensajes.length;
    advanceStatus(store, p.id);
    expect(store.get().conversaciones[0].mensajes.length).toBe(antes + 1);
  });
  it('sigue avisando después de store.reset (mismo listener, sin duplicar)', () => {
    const store = createStore(mem());
    getAppBot(store);
    store.reset();
    getAppBot(store);
    const p = pedidoPorChat(store, getAppBot(store));
    const antes = store.get().conversaciones[0].mensajes.length;
    advanceStatus(store, p.id);
    expect(store.get().conversaciones[0].mensajes.length).toBe(antes + 1);
  });
});
