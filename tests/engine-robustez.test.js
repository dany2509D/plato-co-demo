import { describe, it, expect, beforeEach, vi } from 'vitest';

const fallo = vi.hoisted(() => ({ pay: false, create: false }));
vi.mock('../src/core/orders.js', async (orig) => {
  const real = await orig();
  return {
    ...real,
    payOrder: (...a) => { if (fallo.pay) throw new Error('boom'); return real.payOrder(...a); },
    createOrder: (...a) => { if (fallo.create) throw new Error('boom'); return real.createOrder(...a); },
  };
});

import { createStore } from '../src/core/store.js';
import { setAvailable } from '../src/core/menu.js';
import { createBot } from '../src/bot/engine.js';

let store, bot;
beforeEach(() => {
  fallo.pay = false;
  fallo.create = false;
  store = createStore({ read: () => null, write() {} });
  for (const p of store.get().productos) for (const s of store.get().sucursales) setAvailable(store, p.id, s.id, true);
  bot = createBot(store, { ahora: () => new Date('2026-11-11T15:00:00Z') });
});
const conv = () => store.get().conversaciones.find((c) => c.id === 'c1');

describe('robustez', () => {
  it('si payOrder lanza, mensaje cortés y handoff', () => {
    fallo.pay = true;
    bot.reply('c1', 'Quiero 1 limonada para Obarrio');
    bot.reply('c1', 'Calle 50');
    bot.reply('c1', 'tarjeta');
    let out;
    expect(() => { out = bot.reply('c1', 'sí'); }).not.toThrow();
    expect(out.map((m) => m.texto).join(' ')).toMatch(/persona/i);
    expect(conv().requiereHumano).toBe(true);
  });

  it('si createOrder lanza, mensaje cortés y handoff', () => {
    fallo.create = true;
    bot.reply('c1', 'Quiero 1 limonada para Obarrio');
    bot.reply('c1', 'Calle 50');
    bot.reply('c1', 'yappy');
    expect(() => bot.reply('c1', 'sí')).not.toThrow();
    expect(conv().requiereHumano).toBe(true);
  });

  it('un pedido sin total (seed) no rompe "¿cómo va mi pedido?"', () => {
    store.update((s) => { delete s.pedidos[0].total; delete s.pedidos[0].subtotal; delete s.pedidos[0].itbms; }); // pedido de una versión anterior
    const seed = store.get().pedidos[0];
    expect(seed.total).toBeUndefined();
    store.update((s) => { s.pedidos[0].conversacionId = 'c1'; });
    const out = bot.reply('c1', '¿Cómo va mi pedido?');
    expect(out.map((m) => m.texto).join(' ')).toContain(seed.estado);
  });
});
