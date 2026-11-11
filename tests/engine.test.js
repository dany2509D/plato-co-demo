import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '../src/core/store.js';
import { setAvailable } from '../src/core/menu.js';
import { priceOrder, advanceStatus } from '../src/core/orders.js';
import { createBot } from '../src/bot/engine.js';

const memStorage = () => ({ read: () => null, write() {} });
const AHORA = new Date('2026-11-11T15:00:00Z'); // miércoles 10:00 en Panamá
let store, bot;
const prod = (n) => store.get().productos.find((p) => p.nombre === n);
const conv = (id = 'c1') => store.get().conversaciones.find((c) => c.id === id);
const say = (t, id = 'c1') => bot.reply(id, t);
const txt = (msgs) => msgs.map((m) => m.texto).join('\n');
const fmt = (n) => n.toFixed(2);

beforeEach(() => {
  store = createStore(memStorage());
  for (const p of store.get().productos) for (const s of store.get().sucursales) setAvailable(store, p.id, s.id, true);
  bot = createBot(store, { ahora: () => AHORA });
});

describe('flujo del guion de 2 minutos', () => {
  const PEDIDO = 'Quiero 2 hamburguesas clásicas sin cebolla y una limonada para Obarrio';
  const lineasEsperadas = () => [
    { productoId: prod('Hamburguesa clásica').id, cantidad: 2, modificadores: ['sin cebolla'] },
    { productoId: prod('Limonada').id, cantidad: 1, modificadores: [] },
  ];

  it('confirma líneas, total con ITBMS, sucursal por zona y tiempo', () => {
    const t = txt(say(PEDIDO));
    const tot = priceOrder(store.get(), lineasEsperadas());
    expect(t).toMatch(/2 x Hamburguesa cl[aá]sica.*sin cebolla/i);
    expect(t).toMatch(/1 x Limonada/);
    expect(t).toContain(fmt(tot.total));
    expect(t).toContain(fmt(tot.itbms));
    expect(t).toMatch(/ITBMS/);
    expect(t).toContain(store.get().sucursales[0].nombre);
    expect(t).toContain(String(store.get().sucursales[0].etaBaseMin));
    expect(store.get().pedidos.some((p) => p.conversacionId === 'c1')).toBe(false);
  });

  it('"sí" pide el pago y al elegir Yappy crea el pedido idéntico a lo confirmado', () => {
    say(PEDIDO);
    const t = txt(say('sí'));
    expect(t).toMatch(/yappy/i);
    expect(t).toMatch(/tarjeta/i);
    expect(t).toMatch(/efectivo/i);
    const out = txt(say('Yappy'));
    const p = store.get().pedidos.find((x) => x.conversacionId === 'c1');
    expect(p.canal).toBe('whatsapp');
    expect(p.sucursalId).toBe(store.get().sucursales[0].id);
    expect(p.lineas).toEqual(lineasEsperadas());
    expect(p.pago.metodo).toBe('yappy');
    expect(p.pago.estado).toBe('pagado');
    expect(out).toContain(p.id);
    expect(out).toMatch(/simulad/i);
    expect(conv().paso ?? null).toBeNull();
  });

  it('sin zona ni tipo pregunta entrega/retiro y luego dirección', () => {
    say('Quiero 1 limonada');
    let t = txt(say('sí'));
    expect(t).toMatch(/entrega/i);
    expect(t).toMatch(/retiro/i);
    t = txt(say('entrega'));
    expect(t).toMatch(/direcci[oó]n/i);
    t = txt(say('Calle 50, Costa del Este'));
    expect(t).toMatch(/Costa/);
    expect(t).toMatch(/yappy/i);
    say('efectivo');
    const p = store.get().pedidos.find((x) => x.conversacionId === 'c1');
    expect(p.sucursalId).toBe(store.get().sucursales[1].id);
    expect(p.pago.estado).toBe('contra entrega');
  });

  it('retiro: no pide dirección', () => {
    say('Quiero 1 limonada');
    say('sí');
    const t = txt(say('retiro'));
    expect(t).toMatch(/yappy/i);
    say('tarjeta');
    const p = store.get().pedidos.find((x) => x.conversacionId === 'c1');
    expect(p.tipo).toBe('retiro');
  });

  it('dirección fuera de zona: explica y no crea nada', () => {
    say('Quiero 1 limonada');
    say('sí');
    say('entrega');
    const t = txt(say('Calle 1, Chiriquí'));
    expect(t).toMatch(/zona/i);
    expect(store.get().pedidos.some((p) => p.conversacionId === 'c1')).toBe(false);
  });

  it('cancelar reinicia el paso', () => {
    say(PEDIDO);
    expect(conv().paso).toBe('confirmar');
    say('cancelar');
    expect(conv().paso ?? null).toBeNull();
    expect(store.get().pedidos.some((p) => p.conversacionId === 'c1')).toBe(false);
  });

  it('guarda mensajes con marca de hora de Panamá', () => {
    say('hola');
    const ms = conv().mensajes;
    expect(ms.length).toBe(2);
    expect(ms[0].de).toBe('cliente');
    expect(ms[1].de).toBe('bot');
    expect(ms[0].hora).toBe('10:00');
  });
});

describe('agotados', () => {
  it('rechaza el plato agotado y ofrece alternativa; no crea nada', () => {
    const suc = store.get().sucursales[0].id;
    setAvailable(store, prod('Hamburguesa clásica').id, suc, false);
    const antes = store.get().pedidos.length;
    const t = txt(say('Quiero 2 hamburguesas clásicas para Obarrio'));
    expect(t).toMatch(/agotad/i);
    expect(t).toMatch(/Hamburguesa doble|Hamburguesa de pollo|Hamburguesa con tocino/);
    expect(store.get().pedidos.length).toBe(antes);
    expect(t).not.toMatch(/2 x Hamburguesa cl/);
  });

  it('si se agota entre la confirmación y la creación, createOrder lo rechaza y no se crea', () => {
    const suc = store.get().sucursales[0].id;
    say('Quiero 1 hamburguesa clásica para Obarrio');
    say('sí');
    setAvailable(store, prod('Hamburguesa clásica').id, suc, false);
    const antes = store.get().pedidos.length;
    const t = txt(say('yappy'));
    expect(t).toMatch(/agotad/i);
    expect(store.get().pedidos.length).toBe(antes);
  });

  it('al dar dirección de otra sucursal no confirma lo no disponible ahí', () => {
    const suc2 = store.get().sucursales[1].id;
    setAvailable(store, prod('Limonada').id, suc2, false);
    say('Quiero 1 limonada');
    say('sí');
    say('entrega');
    const t = txt(say('Punta Pacífica'));
    expect(t).toMatch(/agotad/i);
    expect(conv().paso).not.toBe('pago');
  });
});

describe('alérgenos', () => {
  it('con alergenosDeclarados:false no afirma que no tenga, deriva a una persona', () => {
    expect(prod('Penne al pesto').alergenosDeclarados).toBe(false);
    const t = txt(say('¿Tiene gluten la pasta Penne al pesto?'));
    expect(t).not.toMatch(/sin gluten|libre de gluten|no (contiene|tiene|lleva) gluten/i);
    expect(t).toMatch(/no puedo confirmar/i);
    expect(conv().requiereHumano).toBe(true);
  });

  it('con datos declarados responde solo desde ellos', () => {
    let t = txt(say('¿Tiene gluten la Hamburguesa clásica?'));
    expect(t).toMatch(/contiene gluten/i);
    expect(conv().requiereHumano).toBeFalsy();
    t = txt(say('¿Tiene huevo la Limonada?'));
    expect(t).toMatch(/no lista huevo/i);
  });

  it('alérgeno sin datos en la carta (maní) deriva', () => {
    const t = txt(say('¿Tiene maní el Brownie con helado?'));
    expect(t).toMatch(/no puedo confirmar/i);
    expect(conv().requiereHumano).toBe(true);
  });

  it('plato no identificado deriva en vez de adivinar', () => {
    say('¿Qué platos no tienen gluten?');
    expect(conv().requiereHumano).toBe(true);
  });
});

describe('reservas', () => {
  it('flujo por pasos: fecha, hora, personas, ocasión', () => {
    expect(txt(say('Quiero reservar una mesa'))).toMatch(/fecha|d[ií]a/i);
    expect(txt(say('mañana'))).toMatch(/hora/i);
    expect(txt(say('8 pm'))).toMatch(/personas/i);
    expect(txt(say('4'))).toMatch(/ocasi[oó]n/i);
    const t = txt(say('cumpleaños'));
    const r = store.get().reservas.at(-1);
    expect(r).toMatchObject({ fecha: '2026-11-12', hora: '20:00', personas: 4, ocasion: 'cumpleaños', estado: 'confirmada' });
    expect(t).toMatch(/confirmad/i);
    expect(t).toContain('20:00');
  });

  it('todo en un mensaje', () => {
    say('reserva mañana a las 8 pm para 4 personas');
    expect(conv().paso).toBe('ocasion');
    say('no');
    expect(store.get().reservas.at(-1)).toMatchObject({ fecha: '2026-11-12', hora: '20:00', personas: 4 });
  });

  it('"viernes" resuelve a la próxima fecha', () => {
    say('reserva el viernes a las 7 pm para 2');
    say('ninguna');
    expect(store.get().reservas.at(-1).fecha).toBe('2026-11-13');
  });

  it('más de 8 personas: handoff y no crea', () => {
    const n = store.get().reservas.length;
    const t = txt(say('reserva para 9'));
    expect(t).toMatch(/una persona/i);
    expect(conv().requiereHumano).toBe(true);
    expect(store.get().reservas.length).toBe(n);
  });

  it('8 personas sí se permite', () => {
    say('reserva mañana 20:00 para 8 personas');
    say('no');
    expect(store.get().reservas.at(-1).personas).toBe(8);
    expect(conv().requiereHumano).toBeFalsy();
  });

  it('ocasión evento: handoff', () => {
    const n = store.get().reservas.length;
    say('reserva mañana a las 8 pm para 4 personas para un evento');
    expect(conv().requiereHumano).toBe(true);
    expect(store.get().reservas.length).toBe(n);
  });

  it('fuera de horario indica el horario', () => {
    const t = (say('reserva mañana a las 6 am para 2 personas'), txt(say('no')));
    expect(t).toMatch(/horario/i);
    expect(t).toContain('11:00');
  });

  it('fecha pasada', () => {
    const t = (say('reserva hoy a las 9 am para 2 personas'), txt(say('no')));
    expect(t).toMatch(/ya pas/i);
  });

  it('sin mesa sugiere otra hora', () => {
    const suc = store.get().sucursales[0];
    store.update((s) => {
      for (const m of suc.mesas) s.reservas.push({ id: `x-${m.id}`, sucursalId: suc.id, fecha: '2026-11-12', hora: '20:00', personas: 2, ocasion: 'ninguna', mesaId: m.id, estado: 'confirmada' });
    });
    const t = (say('reserva mañana a las 8 pm para 2 personas'), txt(say('no')));
    expect(t).toMatch(/otra hora/i);
  });

  it('en inglés', () => {
    const t = txt(say('book a table for 2 tomorrow at 8 pm'));
    expect(t).toMatch(/occasion/i);
    say('none');
    expect(store.get().reservas.at(-1)).toMatchObject({ fecha: '2026-11-12', hora: '20:00', personas: 2 });
  });
});

describe('horario, ubicación, menú del día', () => {
  it('horario y ubicación salen de brand', () => {
    const [s1, s2] = store.get().sucursales;
    let t = txt(say('¿Cuál es el horario?'));
    expect(t).toContain(s1.horario.abre);
    expect(t).toContain(s2.horario.cierra);
    t = txt(say('¿Dónde están ubicados?'));
    expect(t).toContain(s1.direccion);
  });

  it('menú del día usa los combos del estado', () => {
    const t = txt(say('¿Cuál es el menú del día?'));
    expect(t).toContain(store.get().combos[0].nombre);
  });

  it('pregunta sin dato: lo dice y deriva', () => {
    const t = txt(say('¿Tienen estacionamiento?'));
    expect(t).toMatch(/no tengo ese dato/i);
    expect(conv().requiereHumano).toBe(true);
  });
});

describe('estado del pedido y avisos', () => {
  const crear = () => {
    say('Quiero 1 limonada para Obarrio');
    say('sí');
    say('tarjeta');
    return store.get().pedidos.find((p) => p.conversacionId === 'c1');
  };

  it('"¿cómo va mi pedido?" informa el estado actual', () => {
    const p = crear();
    expect(txt(say('¿Cómo va mi pedido?'))).toContain('Recibido');
    advanceStatus(store, p.id);
    expect(txt(say('¿Cómo va mi pedido?'))).toContain('En cocina');
  });

  it('sin pedido en la conversación deriva', () => {
    expect(txt(say('¿Cómo va mi pedido?'))).toMatch(/no encuentro/i);
  });

  it('aviso al chat y evento chat:mensaje al avanzar el estado', () => {
    const p = crear();
    const vistos = [];
    store.on('chat:mensaje', (e) => vistos.push(e));
    const n = conv().mensajes.length;
    advanceStatus(store, p.id);
    expect(conv().mensajes.length).toBe(n + 1);
    expect(conv().mensajes.at(-1).de).toBe('bot');
    expect(conv().mensajes.at(-1).texto).toContain('En cocina');
    expect(vistos).toHaveLength(1);
    expect(vistos[0].convId).toBe('c1');
    expect(vistos[0].mensaje.texto).toContain('En cocina');
  });

  it('en Entregado incluye la factura simulada con CUFE', () => {
    const p = crear();
    for (let i = 0; i < 4; i++) advanceStatus(store, p.id);
    const t = conv().mensajes.at(-1).texto;
    const f = store.get().pedidos.find((x) => x.id === p.id).factura;
    expect(t).toContain(f.id);
    expect(t).toContain(f.cufe);
    expect(t).toMatch(/simulad/i);
  });

  it('un evento para otra conversación o sin conversación no toca la nuestra', () => {
    say('hola');
    const n = conv().mensajes.length;
    store.emit('pedido:estado', { pedidoId: 'x', estado: 'Listo', conversacionId: 'otra' });
    store.emit('pedido:estado', { pedidoId: 'x', estado: 'Listo' });
    expect(conv().mensajes.length).toBe(n);
  });
});

describe('texto vacío, humano, idioma', () => {
  it.each(['', '   ', 'asdfgh'])('"%s" pide aclarar con un ejemplo y no crea nada', (t) => {
    const p = store.get().pedidos.length;
    const r = store.get().reservas.length;
    expect(txt(say(t))).toMatch(/por ejemplo/i);
    expect(store.get().pedidos.length).toBe(p);
    expect(store.get().reservas.length).toBe(r);
  });

  it('"pasar a una persona" marca requiereHumano', () => {
    const t = txt(say('quiero pasar a una persona'));
    expect(conv().requiereHumano).toBe(true);
    expect(t).toMatch(/persona/i);
  });

  it('"human" también', () => {
    const t = txt(say('human'));
    expect(conv().requiereHumano).toBe(true);
    expect(t).toMatch(/person|team/i);
  });

  it('un mensaje en inglés recibe respuesta en inglés', () => {
    const t = txt(say('I would like two classic burgers and a lemonade for Obarrio'));
    expect(t).toMatch(/total/i);
    expect(t).toMatch(/confirm/i);
    expect(t).not.toMatch(/Desea/i);
    expect(conv().idioma).toBe('en');
    expect(txt(say('yes'))).toMatch(/pay/i);
  });

  it('saludo y gracias', () => {
    expect(txt(say('hola'))).toMatch(/bienvenid/i);
    expect(txt(say('gracias'))).toMatch(/con gusto/i);
  });

  it('devuelve BotMessage con de:"bot"', () => {
    const m = say('hola');
    expect(m[0].de).toBe('bot');
    expect(typeof m[0].texto).toBe('string');
  });
});

describe('ronda 1: editar el pedido en la confirmación', () => {
  const PEDIDO = 'Quiero 2 hamburguesas clásicas sin cebolla y una limonada para Obarrio';
  const lineas = () => conv().slots.lineas;
  const cant = (n) => lineas().filter((l) => l.productoId === prod(n).id).reduce((a, l) => a + l.cantidad, 0);
  beforeEach(() => { say(PEDIDO); });

  it.each(['agrega una limonada', 'añade una limonada', 'y una limonada', 'add a lemonade', 'also a lemonade'])('"%s" suma a la línea existente', (t) => {
    const out = txt(say(t));
    expect(cant('Limonada')).toBe(2);
    expect(cant('Hamburguesa clásica')).toBe(2);
    expect(conv().paso).toBe('confirmar');
    expect(out).toMatch(/2 x Limonada/);
    expect(out).toMatch(/2 x Hamburguesa cl/);
    const tot = priceOrder(store.get(), lineas());
    expect(out).toContain(fmt(tot.total));
  });

  it('agrega un producto nuevo sin perder lo anterior', () => {
    say('añade 2 papas');
    expect(cant('Papas fritas')).toBe(2);
    expect(cant('Hamburguesa clásica')).toBe(2);
    expect(cant('Limonada')).toBe(1);
    say('also 2 fries');
    expect(cant('Papas fritas')).toBe(4);
  });

  it('quitar una línea', () => {
    const out = txt(say('quita la limonada'));
    expect(cant('Limonada')).toBe(0);
    expect(cant('Hamburguesa clásica')).toBe(2);
    expect(out).not.toMatch(/x Limonada/);
    say('remove the burgers');
    expect(conv().paso ?? null).toBeNull();
    expect(txt(say('hola'))).toBeTruthy();
  });

  it('"sin la limonada" quita la línea', () => {
    say('sin la limonada');
    expect(cant('Limonada')).toBe(0);
  });

  it('"mejor sin tomate" aplica el modificador a la hamburguesa', () => {
    say('mejor sin tomate');
    const h = lineas().find((l) => l.productoId === prod('Hamburguesa clásica').id);
    expect(h.modificadores).toEqual(expect.arrayContaining(['sin cebolla', 'sin tomate']));
    say('make it without onions');
    expect(conv().paso).toBe('confirmar');
  });

  it('"mejor 3" y "make it 4" cambian la cantidad de la última línea', () => {
    say('mejor 3');
    expect(cant('Limonada')).toBe(3);
    say('make it 4');
    expect(cant('Limonada')).toBe(4);
    expect(cant('Hamburguesa clásica')).toBe(2);
  });

  it('cantidad fuera de 1..20 se rechaza', () => {
    say('mejor 25');
    expect(cant('Limonada')).toBe(1);
    say('agrega 20 limonadas');
    expect(cant('Limonada')).toBe(1);
  });

  it('agregar un agotado se rechaza con alternativas y mantiene el pedido', () => {
    setAvailable(store, prod('Té helado').id, store.get().sucursales[0].id, false);
    const out = txt(say('agrega un té helado'));
    expect(out).toMatch(/agotad/i);
    expect(out).toMatch(/Limonada|Refresco/);
    expect(cant('Té helado')).toBe(0);
    expect(cant('Limonada')).toBe(1);
  });

  it('lo que no entiende da una pista útil', () => {
    const out = txt(say('mmm no sé'));
    expect(out).toMatch(/agrega una coca/i);
    expect(out).toMatch(/quita la limonada/i);
  });

  it('el pedido creado refleja la edición', () => {
    say('agrega una limonada');
    say('sí');
    say('yappy');
    const p = store.get().pedidos.find((x) => x.conversacionId === 'c1');
    expect(p.lineas.find((l) => l.productoId === prod('Limonada').id).cantidad).toBe(2);
  });
});

describe('ronda 1: dirección exacta', () => {
  it('con zona pero sin calle pregunta por la dirección exacta y la guarda', () => {
    say('Quiero 1 limonada para Obarrio');
    const out = txt(say('sí'));
    expect(out).toMatch(/direcci[oó]n exacta|punto de referencia/i);
    expect(out).toMatch(/yappy/i);
    const r = txt(say('Calle 50, edificio Sol, apto 4'));
    expect(r).toMatch(/yappy/i);
    say('yappy');
    const p = store.get().pedidos.find((x) => x.conversacionId === 'c1');
    expect(p.direccion).toContain('edificio Sol');
    expect(p.direccion).toContain('Obarrio');
    expect(p.sucursalId).toBe(store.get().sucursales[0].id);
  });

  it('en el paso de pago acepta "retiro" y cambia el tipo', () => {
    say('Quiero 1 limonada para Obarrio');
    say('sí');
    say('mejor retiro');
    say('tarjeta');
    expect(store.get().pedidos.find((x) => x.conversacionId === 'c1').tipo).toBe('retiro');
  });

  it('limita el largo de la dirección guardada', () => {
    say('Quiero 1 limonada para Obarrio');
    say('sí');
    say(`Calle ${'x'.repeat(500)}`);
    say('yappy');
    expect(store.get().pedidos.find((x) => x.conversacionId === 'c1').direccion.length).toBeLessThanOrEqual(220);
  });
});

describe('ronda 1: basura con signo de pregunta e inglés', () => {
  it.each(['???', 'asdfgh?', '¿¿??'])('"%s" pide aclarar, no deriva', (x) => {
    const out = txt(say(x));
    expect(out).toMatch(/por ejemplo/i);
    expect(out).not.toMatch(/no tengo ese dato/i);
    expect(conv().requiereHumano).toBeFalsy();
  });

  it.each([
    'Hi, I want a classic hamburger',
    "I'd like a burger and a lemonade",
  ])('"%s" se entiende en inglés', (x) => {
    const out = txt(say(x));
    expect(conv().paso).toBe('confirmar');
    expect(out).toMatch(/total/i);
    expect(out).not.toMatch(/Desea|Su pedido/);
  });

  it.each(['book for 3 on 2026-11-20 at 7 pm', 'book a table for 3 tomorrow at 7 pm'])('"%s" reserva', (x) => {
    say(x);
    expect(conv().paso).toBe('ocasion');
    const out = txt(say('none'));
    expect(out).toMatch(/confirmed/i);
    expect(store.get().reservas.at(-1)).toMatchObject({ personas: 3, hora: '19:00' });
  });

  it('alérgenos en inglés usan etiquetas en inglés', () => {
    const out = txt(say('Does the Hamburguesa clásica contain dairy?'));
    expect(out).toMatch(/dairy/);
    expect(out).not.toMatch(/lácteos/);
    const out2 = txt(say('What allergens does the Cheesecake have?'));
    expect(out2).toMatch(/dairy/);
    expect(out2).not.toMatch(/lácteos|huevo/);
  });
});

describe('ronda 2: conector "y" y dirección', () => {
  it('"y una coca" no cambia el pedido en la confirmación', () => {
    say('Quiero 2 hamburguesas clásicas sin cebolla y una limonada para Obarrio');
    const antes = JSON.stringify(conv().slots.lineas);
    const out = txt(say('y una coca'));
    expect(JSON.stringify(conv().slots.lineas)).toBe(antes);
    expect(out).toMatch(/coca/i);
    expect(out).toMatch(/agrega una coca/i);
    expect(out).not.toMatch(/Bowl/);
    say('y');
    expect(JSON.stringify(conv().slots.lineas)).toBe(antes);
  });

  it('"y una coca" como primer mensaje no inicia nada', () => {
    const out = txt(say('y una coca'));
    expect(conv().paso ?? null).toBeNull();
    expect(out).not.toMatch(/Bowl/);
    expect(store.get().pedidos.some((p) => p.conversacionId === 'c1')).toBe(false);
  });

  it('"y una limonada" con un pedido existente suma solo la limonada', () => {
    say('Quiero 2 hamburguesas clásicas y una limonada para Obarrio');
    say('y una limonada');
    const ls = conv().slots.lineas;
    expect(ls.find((l) => l.productoId === prod('Limonada').id).cantidad).toBe(2);
    expect(ls).toHaveLength(2);
  });

  it('la dirección final guardada no pasa de 200 caracteres', () => {
    say('Quiero 1 limonada para Obarrio');
    say('sí');
    say(`Calle ${'x'.repeat(250)}`);
    say('yappy');
    const d = store.get().pedidos.find((p) => p.conversacionId === 'c1').direccion;
    expect(d.length).toBeLessThanOrEqual(200);
    expect(d).toContain('Obarrio');
  });
});
