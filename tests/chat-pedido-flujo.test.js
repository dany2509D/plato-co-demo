import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '../src/core/store.js';
import { setAvailable } from '../src/core/menu.js';
import { advanceStatus, etiquetaPago, registrarComprobanteYappy, confirmarPagoYappy } from '../src/core/orders.js';
import { construirFeed } from '../src/core/live-feed.js';
import { createBot } from '../src/bot/engine.js';

// Auditoría comercial: dirección completa, orden del chat (dirección → pago → resumen → confirmar),
// Yappy con comprobante (esperando → recibido → confirmado) y factura simulada por el chat.
const PEDIDO = 'Quiero 2 hamburguesas clásicas sin cebolla y una limonada para Obarrio';
const DIR_Y_PAGO = 'Calle 50, edificio Global Bank piso 3. Pago con Yappy';
const AHORA = new Date('2026-11-11T17:00:00Z'); // mediodía en Panamá: sucursales abiertas

let store, bot, tareas;
const conv = () => store.get().conversaciones.find((c) => c.id === 'c-web');
const say = (t) => bot.reply('c-web', t);
const txt = (msgs) => msgs.map((m) => m.texto).join('\n');
const pedido = () => store.get().pedidos.find((p) => p.conversacionId === 'c-web');
const verificar = () => { const ts = tareas.splice(0); for (const f of ts) f(); };

beforeEach(() => {
  store = createStore({ read: () => null, write() {} });
  for (const p of store.get().productos) for (const s of store.get().sucursales) setAvailable(store, p.id, s.id, true);
  tareas = [];
  bot = createBot(store, { ahora: () => AHORA, programar: (fn) => tareas.push(fn) });
});

describe('1. la dirección de entrega no se pierde', () => {
  it('el guion de la auditoría guarda la dirección completa que escribió el cliente', () => {
    say(PEDIDO);
    say('sí'); // el «sí» temprano no se toma como dirección ni confirma nada
    say(DIR_Y_PAGO);
    say('sí');
    const p = pedido();
    expect(p.direccion).toBe('Calle 50, edificio Global Bank piso 3, Obarrio');
    expect(p.direccion).not.toMatch(/yappy|pago/i);
    expect(p.pago.metodo).toBe('yappy');
  });

  it('dirección y forma de pago en el mismo mensaje: se anotan las dos', () => {
    say(PEDIDO);
    const out = txt(say(DIR_Y_PAGO));
    expect(out).toContain('Entrega en: Calle 50, edificio Global Bank piso 3, Obarrio.');
    expect(out).toContain('Pago: Yappy (simulado).');
    expect(conv().paso).toBe('confirmar');
  });

  it.each([
    ['Calle 50, edificio Global Bank piso 3 y pago con tarjeta', 'Calle 50, edificio Global Bank piso 3, Obarrio', 'tarjeta'],
    ['Torre Delta, apto 12B, efectivo', 'Torre Delta, apto 12B, Obarrio', 'efectivo'],
    ['Calle 53 Este, PH Ocean, Marbella; pago con Yappy', 'Calle 53 Este, PH Ocean, Marbella', 'yappy'],
  ])('«%s»', (texto, dir, metodo) => {
    say(PEDIDO);
    say(texto);
    expect(conv().slots.direccion).toBe(dir);
    expect(conv().slots.metodo).toBe(metodo);
  });

  it('solo el nombre de la zona no basta: pide la dirección exacta', () => {
    say('Quiero una limonada');
    say('Entrega a domicilio');
    expect(txt(say('Obarrio'))).toMatch(/dirección exacta en Obarrio/);
    expect(conv().paso).toBe('direccion');
  });

  it('la cocina recibe la dirección completa', () => {
    say(PEDIDO);
    say('Calle 50, edificio Global Bank piso 3');
    say('Efectivo contra entrega');
    say('sí');
    expect(pedido().direccion).toBe('Calle 50, edificio Global Bank piso 3, Obarrio');
  });
});

describe('2. orden del chat: dirección y pago primero, luego resumen completo y confirmación', () => {
  it('no pregunta «¿Desea confirmar?» hasta tener dirección y pago', () => {
    const m1 = txt(say(PEDIDO));
    expect(m1).not.toMatch(/confirmar el pedido/i);
    expect(m1).toMatch(/dirección exacta/);
    const m2 = txt(say('Calle 50, edificio Global Bank piso 3'));
    expect(m2).not.toMatch(/confirmar el pedido/i);
    expect(m2).toMatch(/cómo desea pagar/i);
    const m3 = txt(say('Yappy'));
    expect(m3).toMatch(/¿Desea confirmar el pedido\?$/);
    expect(store.get().pedidos.some((p) => p.conversacionId === 'c-web')).toBe(false);
  });

  it('el resumen final trae platos, total, dirección y pago, en ese orden y antes de la pregunta', () => {
    say(PEDIDO);
    const out = txt(say(DIR_Y_PAGO));
    const pos = ['2 x Hamburguesa clásica (sin cebolla)', '1 x Limonada', 'Total: US$ 22.10', 'Entrega en: Calle 50', 'Pago: Yappy', '¿Desea confirmar el pedido?'].map((s) => out.indexOf(s));
    expect(pos.every((x) => x >= 0)).toBe(true);
    expect([...pos].sort((a, b) => a - b)).toEqual(pos);
  });

  it('retiro: no pide dirección; pide el pago y luego confirma', () => {
    say('Quiero una limonada para retirar en Norte');
    expect(conv().paso).toBe('pago');
    const out = txt(say('Tarjeta'));
    expect(out).toContain('Retira en Plato & Co. Norte');
    expect(out).toContain('Pago: tarjeta (simulado).');
    expect(out).toMatch(/¿Desea confirmar el pedido\?$/);
  });

  it('un «sí» antes de tiempo no crea el pedido', () => {
    say(PEDIDO);
    for (const t of ['sí', 'Sí, confirmar', 'ok']) {
      expect(txt(say(t))).toMatch(/me faltan/);
      expect(pedido()).toBeUndefined();
    }
  });

  it('se puede corregir el pedido mientras pide la dirección, y cambiar el pago en el resumen', () => {
    say(PEDIDO);
    expect(txt(say('agrega una limonada'))).toMatch(/2 x Limonada[\s\S]*dirección exacta/);
    expect(conv().paso).toBe('direccion');
    say('Calle 50');
    say('Yappy');
    const out = txt(say('mejor con tarjeta'));
    expect(out).toContain('Pago: tarjeta (simulado).');
    expect(conv().paso).toBe('confirmar');
  });
});

describe('3 y 4. Yappy con comprobante y factura simulada por el chat', () => {
  const hastaComprobante = () => { say(PEDIDO); say(DIR_Y_PAGO); return txt(say('sí')); };

  it('esperando comprobante → comprobante recibido → pago confirmado', () => {
    const out = hastaComprobante();
    expect(out).toMatch(/Esperando su comprobante de Yappy/);
    expect(out).not.toMatch(/recibido/i);
    expect(pedido().pago.estado).toBe('esperando comprobante');
    expect(conv().mensajes.at(-1).botones).toEqual(['Enviar comprobante']);

    expect(txt(say('Enviar comprobante'))).toMatch(/Comprobante recibido/);
    expect(pedido().pago.estado).toBe('comprobante recibido');
    expect(pedido().factura).toBeUndefined();

    verificar();
    expect(pedido().pago.estado).toBe('pagado');
    expect(pedido().pago.historial.map((h) => h.estado)).toEqual(['esperando comprobante', 'comprobante recibido', 'pagado']);
  });

  it('al confirmarse el pago sale la factura simulada: número, CUFE ficticio, total con ITBMS y aviso', () => {
    hastaComprobante();
    say('Enviar comprobante');
    const eventos = [];
    store.on('chat:mensaje', (e) => eventos.push(e));
    verificar();
    const t = conv().mensajes.at(-1).texto;
    const f = pedido().factura;
    expect(t).toMatch(/Pago confirmado/);
    expect(t).toContain(`N.º ${f.id}`);
    expect(t).toContain(f.cufe);
    expect(t).toMatch(/CUFE \(ficticio\)/);
    expect(t).toContain('ITBMS 7% US$ 1.45');
    expect(t).toContain('Total US$ 22.10');
    expect(t).toMatch(/SIMULADA · sin validez fiscal/);
    expect(eventos).toHaveLength(1);
  });

  it('al entregar no se repite la factura que ya salió', () => {
    hastaComprobante();
    say('Enviar comprobante');
    verificar();
    for (let i = 0; i < 4; i++) advanceStatus(store, pedido().id);
    const facturas = conv().mensajes.filter((m) => /Factura electrónica SIMULADA/.test(m.texto));
    expect(facturas).toHaveLength(1);
  });

  it('con tarjeta, la factura sale al confirmar; en efectivo, al entregar', () => {
    say(PEDIDO); say('Calle 50'); say('tarjeta');
    expect(txt(say('sí'))).toMatch(/Factura electrónica SIMULADA/);
    store = createStore({ read: () => null, write() {} });
    bot = createBot(store, { ahora: () => AHORA, programar: (fn) => tareas.push(fn) });
    say(PEDIDO); say('Calle 50'); say('efectivo');
    expect(txt(say('sí'))).not.toMatch(/Factura/);
    for (let i = 0; i < 4; i++) advanceStatus(store, pedido().id);
    expect(conv().mensajes.at(-1).texto).toMatch(/Entregado[\s\S]*Factura electrónica SIMULADA/);
  });

  it('el comprobante también llega como archivo adjunto o con «ya pagué»', () => {
    for (const t of ['Comprobante adjunto: captura.jpg', 'ya pagué', 'listo']) {
      store = createStore({ read: () => null, write() {} });
      bot = createBot(store, { ahora: () => AHORA, programar: (fn) => tareas.push(fn) });
      hastaComprobante();
      expect(txt(say(t)), t).toMatch(/Comprobante recibido/);
    }
  });

  it('mientras espera el comprobante, otra cosa no lo marca recibido y se le recuerda', () => {
    hastaComprobante();
    const out = txt(say('hola'));
    expect(out).toMatch(/espera el comprobante/);
    expect(pedido().pago.estado).toBe('esperando comprobante');
  });

  it('no se puede saltar un paso del pago', () => {
    hastaComprobante();
    confirmarPagoYappy(store, pedido().id); // sin comprobante no se confirma
    expect(pedido().pago.estado).toBe('esperando comprobante');
    registrarComprobanteYappy(store, pedido().id);
    registrarComprobanteYappy(store, pedido().id); // repetir no duplica el paso
    expect(pedido().pago.historial).toHaveLength(2);
  });

  it('el panel «En vivo» muestra cada estado del Yappy', () => {
    hastaComprobante();
    const titulos = () => construirFeed(store.get()).map((i) => i.titulo);
    expect(titulos()).toContain(`Pedido ${pedido().id}: esperando comprobante de Yappy`);
    expect(construirFeed(store.get()).find((i) => i.tipo === 'pedido').detalle).toContain('Pago: Yappy · Esperando comprobante');
    say('Enviar comprobante');
    expect(titulos()).toContain(`Pedido ${pedido().id}: comprobante de Yappy recibido`);
    verificar();
    expect(titulos()).toContain(`Pedido ${pedido().id}: pago con Yappy confirmado`);
    expect(etiquetaPago(pedido().pago)).toBe('Yappy · Pago confirmado');
  });
});
