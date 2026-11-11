import { normalize } from '../core/text.js';
import { alternativesFor, isAvailable } from '../core/menu.js';
import { assignBranch, createOrder, payOrder, priceOrder } from '../core/orders.js';
import { createReservation } from '../core/reservations.js';
import { detectLang, parseOrder } from './parser.js';
import { horaPanama, parseFecha, parseHora, sinHora } from './datetime.js';
import { t } from './texts.js';
import { allergenReply, ALERGENO_CUE, palabras } from './allergens.js';

// Motor del bot en modo guion: una máquina de pasos por conversación.
// El paso actual (conv.paso) y los datos recogidos (conv.slots) viven en la conversación.
// No hay WhatsApp ni pagos reales: todo es simulado.

const HUMANO = /\b(pasar a una persona|hablar con (una |un )?(persona|humano|agente)|persona real|human|agent|representative|real person|speak (to|with) (a )?(person|someone))\b/;
const CANCELAR = /^(cancelar|cancela|cancelo|cancel)\b/;
const SI = /^(si|yes|yeah|yep|ok|okay|dale|confirmo|confirmar|confirm|claro|correcto|listo)\b/;
const NO = /^(no|nop|nope)(\s+(gracias|thanks|thank you))?\W*$/;
const ES = /\b(hola|gracias|quiero|buenas|buenos|reserva|reservar|horario|pedido|manana|hoy|personas|persona|ubicacion|donde|cuanto|favor|sin|para|una|un|dos|del|dia|tarjeta|efectivo|entrega|retiro|cancelar|tiene|tienen|las|los|que|cumpleanos|ninguna)\b/;
const EN = /\b(does|do|the|contain|contains|have|has|what|which|yes|yeah|hi|hello|hey|please|hours|open|where|status|reservation|book|table|tomorrow|today|cancel|human|agent|thanks|thank|people|order|delivery|pickup|card|cash|allergens?|allergy|my|menu|would|like|want|none|birthday)\b/;
const ORDEN = /\b(quiero|quisiera|me regala|me da|dame|ponme|pedir|ordenar|pedido|i want|i'd like|i would like|order|can i get)\b/;
const ESTADO = /(como va|como esta|donde (esta|va)|estado de|estatus|status|track|where is|how('?s| is)).*(pedido|orden|order)|\b(mi|my) (pedido|orden|order)\b/;
const RESERVA = /reserv|\bbook\b|booking|table for|mesa para|una mesa|a table/;
const HORARIO = /horario|hora de (atencion|apertura)|a que hora (abren|cierran|abre|cierra)|abierto|abren|cierran|\bopen\b|opening|\bhours\b|closing/;
const UBICACION = /ubicacion|ubicad|direccion de|donde (estan|queda|quedan|se encuentran)|location|address|where (are|is)/;
const MENU = /menu del dia|menu of the day|today'?s menu|combos?\b|especial(es)? del dia|daily special|\bmenu\b|\bcarta\b/;
const SALUDO = /^(hola|buenas|buenos dias|buenas tardes|buenas noches|hello|hi|hey|good (morning|afternoon|evening))\b/;
const GRACIAS = /\b(gracias|thanks|thank you)\b/;
const PREGUNTA = /^(tienen|tiene|hay|cuanto|cuantos|puedo|se puede|aceptan|do you|is there|are there|can i|how much|what|que|donde|cuando|como)\b/;
const QUITAR = /\b(quita|quitar|quitale|elimina|eliminar|saca|sacar|remove|delete|drop)\b/;
const AGREGAR = /^(y|and|tambien|also|mas)\b|\b(agrega|agregar|agregame|anade|anadir|suma|sumar|add|ponle|ponme|dame|quiero|i want|i'd like)\b/;
const CANT = /^(?:mejor|make it|cambia(?:lo)?(?: a)?|change it to|actually)\s+(\d+|[a-z]+)\s*$/;
const MOD = /^(?:mejor |make it |actually |ahora )?(?:sin|without)\s+(?:la |el |los |las |the )?(.+)$/;
const NUMS = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const EN_PROD = { burger: 'hamburguesa', burgers: 'hamburguesa', lemonade: 'limonada', fries: 'papas', juice: 'jugo', water: 'agua', salad: 'ensalada', soda: 'refresco', chicken: 'pollo', tea: 'te helado', coffee: 'cafe', shake: 'batido' };
const EN_ING = { onion: 'cebolla', onions: 'cebolla', tomato: 'tomate', tomatoes: 'tomate', sauce: 'salsa', ice: 'hielo' };
const MAX_DIR = 200;
const RETIRO = /\b(retiro|retirar|recoger|recojo|pickup|pick up|sucursal)\b/;
const ENTREGA = /\b(entrega|delivery|deliver|domicilio)\b/;
const MAX_PERSONAS = 8;

export function createBot(store, opts = {}) {
  const ahora = () => (typeof opts.ahora === 'function' ? opts.ahora() : opts.ahora instanceof Date ? opts.ahora : new Date());
  const state = () => store.get();
  const getConv = (id) => state().conversaciones.find((c) => c.id === id);
  const upd = (id, fn) => store.update((s) => { const c = s.conversaciones.find((x) => x.id === id); if (c) fn(c); });
  const m = (texto, botones, actions) => {
    const msg = { de: 'bot', texto };
    if (botones?.length) msg.botones = botones;
    if (actions?.length) msg.actions = actions;
    return msg;
  };

  function append(id, msg) {
    const d = ahora();
    const guardado = { ...msg, hora: horaPanama(d), en: d.toISOString() };
    upd(id, (c) => { c.mensajes.push(guardado); });
    return guardado;
  }
  const setStep = (id, paso, slots) => upd(id, (c) => { c.paso = paso; c.slots = slots ?? {}; });
  const reset = (id) => setStep(id, null, {});
  const handoff = (id) => upd(id, (c) => { c.requiereHumano = true; });
  const sucNombre = (sid) => state().sucursales.find((s) => s.id === sid)?.nombre ?? sid;
  const sucDefault = () => state().ui?.sucursalCliente ?? state().sucursales[0].id;
  const nombreProd = (pid) => state().productos.find((p) => p.id === pid)?.nombre ?? pid;
  const lang = (id) => t(getConv(id).idioma);

  function pickLang(texto, actual) {
    const n = normalize(texto);
    if (!n) return actual;
    if (ES.test(n)) return 'es';
    if (EN.test(n) || (n.split(" ").length >= 4 && detectLang(texto) === "en")) return "en";
    return actual;
  }

  // ---------- pedidos ----------
  function zonaDe(texto) {
    const z = assignBranch(state(), texto);
    if (!z) return null;
    const n = normalize(texto);
    const suc = state().sucursales.find((s) => s.id === z.sucursalId);
    const nombre = suc.zonasEntrega.find((zn) => n.includes(normalize(zn)));
    return { ...z, zona: nombre };
  }

  function resumen(T, sl) {
    const tot = priceOrder(state(), sl.lineas);
    const lineas = sl.lineas.map((l) => `- ${T.linea(l.cantidad, nombreProd(l.productoId), l.modificadores)}`);
    const partes = [T.resumenTitulo, ...lineas, T.totales(tot.subtotal, tot.itbms, tot.total)];
    if (sl.tipo === 'entrega' && sl.direccion) partes.push(T.sucursalEta(sucNombre(sl.sucursalId), sl.eta ?? state().sucursales.find((s) => s.id === sl.sucursalId).etaBaseMin));
    return partes.join('\n');
  }

  function textoAgotados(T, ids, sucId) {
    return ids.map((pid) => T.agotado(nombreProd(pid), alternativesFor(state(), pid, sucId).map((a) => a.nombre))).join('\n');
  }

  function iniciarPedido(id, texto) {
    const T = lang(id);
    const n = normalize(texto);
    const z = zonaDe(texto);
    const sucursalId = z?.sucursalId ?? sucDefault();
    const res = parseOrder(texto, state(), sucursalId);
    if (!res.lineas.length && !res.agotados.length) {
      reset(id);
      return [m(`${res.desconocidos.length ? `${T.noEntendidos(res.desconocidos.join(', '))}\n` : ''}${T.aclarar}`)];
    }
    const sl = {
      lineas: res.lineas, sucursalId,
      tipo: z ? 'entrega' : RETIRO.test(n) ? 'retiro' : ENTREGA.test(n) ? 'entrega' : null,
      direccion: z ? z.zona : null, zona: z?.zona ?? null, exacta: false, eta: z?.etaMin ?? null,
    };
    const out = [];
    if (res.agotados.length) out.push(textoAgotados(T, res.agotados, sucursalId));
    if (!sl.lineas.length) { reset(id); return [m(out.join('\n'))]; }
    if (res.desconocidos.length) out.push(T.noEntendidos(res.desconocidos.join(', ')));
    out.push(resumen(T, sl));
    if (res.agotados.length) out.push(T.agotadoSigue);
    out.push(T.confirmarPreg);
    setStep(id, 'confirmar', sl);
    return [m(out.join('\n'), [T.si, T.cancelar])];
  }

  const clave = (l) => `${l.productoId}|${[...l.modificadores].sort().join('|')}`;
  function fusionar(lineas) {
    const mapa = new Map();
    for (const l of lineas) {
      const k = clave(l);
      if (mapa.has(k)) mapa.get(k).cantidad += l.cantidad;
      else mapa.set(k, { productoId: l.productoId, cantidad: l.cantidad, modificadores: [...l.modificadores] });
    }
    return [...mapa.values()];
  }

  // Líneas del pedido que el texto menciona (las de mayor coincidencia de palabras del nombre).
  function lineasMencionadas(texto, lineas) {
    const tw = new Set(palabras(normalize(texto).split(' ').map((w) => EN_PROD[w] ?? w).join(' ')));
    const puntaje = lineas.map((l) => palabras(nombreProd(l.productoId)).filter((w) => tw.has(w)).length);
    const max = Math.max(0, ...puntaje);
    return max ? lineas.filter((_, i) => puntaje[i] === max) : [];
  }

  function mostrarEdicion(id, T, sl, previo = []) {
    if (!sl.lineas.length) { reset(id); return [m(T.pedidoVacio)]; }
    setStep(id, 'confirmar', sl);
    return [m([...previo, resumen(T, sl), T.confirmarPreg].join('\n'), [T.si, T.cancelar])];
  }

  function editarPedido(id, texto, n) {
    const T = lang(id);
    const sl = JSON.parse(JSON.stringify(getConv(id).slots));
    const hint = (extra) => [m([extra, T.hintEdicion].filter(Boolean).join('\n'), [T.si, T.cancelar])];
    const objetivo = lineasMencionadas(texto, sl.lineas);
    const mc = CANT.exec(n);
    if (mc) {
      const q = /^\d+$/.test(mc[1]) ? Number(mc[1]) : NUMS[mc[1]];
      if (q === undefined) return hint();
      if (q < 1 || q > 20) return hint(T.cantidadMax);
      sl.lineas[sl.lineas.length - 1].cantidad = q;
      return mostrarEdicion(id, T, { ...sl, lineas: fusionar(sl.lineas) });
    }
    if (QUITAR.test(n) || (/^sin (el|la|los|las|the) /.test(n) && objetivo.length)) {
      if (!objetivo.length) return hint(T.noEncuentroLinea);
      sl.lineas = sl.lineas.filter((l) => !objetivo.includes(l));
      return mostrarEdicion(id, T, sl);
    }
    const mm = MOD.exec(n);
    if (mm && !AGREGAR.test(n)) {
      const ing = mm[1].split(' ').map((w) => EN_ING[w] ?? w).join(' ').replace(/[^a-z ]/g, '').trim();
      for (const cand of [ing, ing.replace(/s$/, '')]) {
        for (let i = sl.lineas.length - 1; i >= 0; i--) {
          const prod = state().productos.find((p) => p.id === sl.lineas[i].productoId);
          const soportado = prod?.modificadores.find((x) => normalize(x) === `sin ${cand}`);
          if (!soportado) continue;
          if (!sl.lineas[i].modificadores.includes(soportado)) sl.lineas[i].modificadores.push(soportado);
          return mostrarEdicion(id, T, { ...sl, lineas: fusionar(sl.lineas) });
        }
      }
      return hint(T.noEncuentroLinea);
    }
    const res = parseOrder(texto, state(), sl.sucursalId);
    const previo = [];
    if (res.agotados.length) previo.push(textoAgotados(T, res.agotados, sl.sucursalId));
    if (res.lineas.length) {
      const nuevas = fusionar([...sl.lineas, ...res.lineas]);
      if (nuevas.some((l) => l.cantidad > 20)) return hint(T.cantidadMax);
      sl.lineas = nuevas;
    }
    if (!res.lineas.length && !res.agotados.length) {
      return hint(res.desconocidos.length ? T.noEntendidos(res.desconocidos.join(', ')) : '');
    }
    if (res.desconocidos.length) previo.push(T.noEntendidos(res.desconocidos.join(', ')));
    return mostrarEdicion(id, T, sl, previo);
  }

  function pasoConfirmar(id, texto, n) {
    const T = lang(id);
    const sl = getConv(id).slots;
    if (NO.test(n)) { reset(id); return [m(T.cancelado, T.botonesInicio)]; }
    if (SI.test(n)) return despuesDeConfirmar(id, sl);
    return editarPedido(id, texto, n);
  }

  function pedirPago(id, sl, previo = []) {
    const T = lang(id);
    setStep(id, 'pago', sl);
    return [m([...previo, T.pedirPago].join('\n'), T.botonesPago)];
  }

  function despuesDeConfirmar(id, sl) {
    const T = lang(id);
    if (!sl.tipo) { setStep(id, 'tipo', sl); return [m(T.pedirTipo, T.botonesTipo)]; }
    if (sl.tipo === 'entrega' && !sl.direccion) { setStep(id, 'direccion', sl); return [m(T.pedirDireccion)]; }
    const s = state().sucursales.find((x) => x.id === sl.sucursalId);
    const previo = sl.tipo === 'retiro' ? [T.retiraEn(s.nombre, s.direccion)] : [];
    if (sl.tipo === 'entrega' && sl.zona && !sl.exacta) previo.push(T.pedirDetalle(sl.zona));
    return pedirPago(id, sl, previo);
  }

  function pasoTipo(id, texto, n) {
    const T = lang(id);
    const sl = getConv(id).slots;
    if (zonaDe(texto)) return pasoDireccion(id, texto, n);
    if (RETIRO.test(n)) return despuesDeConfirmar(id, { ...sl, tipo: 'retiro' });
    if (ENTREGA.test(n)) return despuesDeConfirmar(id, { ...sl, tipo: 'entrega' });
    return [m(T.pedirTipo, T.botonesTipo)];
  }

  function pasoDireccion(id, texto) {
    const T = lang(id);
    const sl = { ...getConv(id).slots };
    const z = zonaDe(texto);
    if (!z) {
      const zonas = state().sucursales.flatMap((s) => s.zonasEntrega).join(', ');
      return [m(T.fueraZona(zonas), T.botonesTipo)];
    }
    Object.assign(sl, { tipo: 'entrega', direccion: texto.trim().slice(0, MAX_DIR), zona: z.zona, exacta: true, eta: z.etaMin });
    if (z.sucursalId !== sl.sucursalId) {
      sl.sucursalId = z.sucursalId;
      const faltan = sl.lineas.filter((l) => !isAvailable(state(), l.productoId, z.sucursalId));
      if (faltan.length) {
        sl.lineas = sl.lineas.filter((l) => isAvailable(state(), l.productoId, z.sucursalId));
        const out = [`${T.atiende(sucNombre(z.sucursalId), z.etaMin)}\n${textoAgotados(T, faltan.map((l) => l.productoId), z.sucursalId)}`];
        if (!sl.lineas.length) { reset(id); return [m(out[0])]; }
        setStep(id, 'confirmar', sl);
        return [m(`${out[0]}\n${resumen(T, sl)}\n${T.confirmarPreg}`, [T.si, T.cancelar])];
      }
    }
    return pedirPago(id, sl, [T.atiende(sucNombre(sl.sucursalId), z.etaMin)]);
  }

  function pasoPago(id, texto, n) {
    const T = lang(id);
    const sl = getConv(id).slots;
    const metodo = /yappy/.test(n) ? 'yappy' : /tarjeta|card|credit|debit|debito/.test(n) ? 'tarjeta' : /efectivo|cash/.test(n) ? 'efectivo' : null;
    if (!metodo) {
      if (RETIRO.test(n)) return despuesDeConfirmar(id, { ...sl, tipo: 'retiro' });
      if (ENTREGA.test(n) && sl.tipo !== 'entrega') return despuesDeConfirmar(id, { ...sl, tipo: 'entrega' });
      if (sl.tipo === 'entrega' && n.length > 2) {
        if (zonaDe(texto)) return pasoDireccion(id, texto);
        const cola = sl.zona ? `, ${sl.zona}` : '';
        const dir = `${texto.trim().slice(0, MAX_DIR - cola.length)}${cola}`;
        return pedirPago(id, { ...sl, direccion: dir, exacta: true }, [T.direccionAnotada]);
      }
      return [m(T.pagoInvalido, T.botonesPago)];
    }
    let r;
    try {
      r = createOrder(store, { lineas: sl.lineas, tipo: sl.tipo, sucursalId: sl.sucursalId, direccion: sl.direccion, canal: 'whatsapp', conversacionId: id });
    } catch { return falla(id); }
    if (!r.ok) {
      if (r.razon === 'agotado') {
        const ids = r.detalle.agotados.map((a) => a.id);
        const rest = sl.lineas.filter((l) => !ids.includes(l.productoId));
        const out = textoAgotados(T, ids, sl.sucursalId);
        if (!rest.length) { reset(id); return [m(out)]; }
        const nuevo = { ...sl, lineas: rest };
        setStep(id, 'confirmar', nuevo);
        return [m(`${out}\n${resumen(T, nuevo)}\n${T.confirmarPreg}`, [T.si, T.cancelar])];
      }
      if (r.razon === 'sin_zona') { setStep(id, 'direccion', sl); return [m(T.pedirDireccion)]; }
      if (r.razon === 'vacio') { reset(id); return [m(T.pedidoVacio)]; }
      return falla(id);
    }
    const p = r.pedido;
    try { payOrder(store, p.id, metodo); } catch { return falla(id); }
    reset(id);
    const total = priceOrder(state(), p.lineas).total;
    const pago = { yappy: T.pagoYappy, tarjeta: T.pagoTarjeta, efectivo: T.pagoEfectivo }[metodo];
    return [m(T.pedidoListo(p.id, total, pago, p.etaMin), undefined, [{ type: 'pedido:creado', payload: { pedidoId: p.id } }])];
  }

  function falla(id) {
    handoff(id);
    reset(id);
    return [m(lang(id).error)];
  }

  // ---------- reservas ----------
  function pasoReserva(id, texto, n, esperado) {
    const T = lang(id);
    const sl = { ...(getConv(id).slots ?? {}) };
    const sinH = sinHora(texto);
    if (!sl.fecha) sl.fecha = parseFecha(texto, ahora()) ?? undefined;
    if (!sl.hora) sl.hora = parseHora(texto, { suelto: esperado === 'hora' }) ?? undefined;
    if (sl.personas === undefined) {
      const mp = /(\d+)\s*(personas?|people|persons?|pax|guests?|comensales)/.exec(sinH)
        ?? /\b(?:para|for|somos|we are)\s+(\d+)\b/.exec(sinH)
        ?? (esperado === 'personas' ? /^\D*(\d+)\D*$/.exec(sinH) : null);
      if (mp) sl.personas = Number(mp[1]);
    }
    if (!sl.ocasion) {
      if (/cumple|birthday/.test(n)) sl.ocasion = 'cumpleaños';
      else if (/aniversario|anniversary/.test(n)) sl.ocasion = 'aniversario';
      else if (/evento|event/.test(n)) sl.ocasion = 'evento';
      else if (esperado === 'ocasion') sl.ocasion = /^(no|ninguna|none|nada|nope|ninguno)\b/.test(n) ? 'ninguna' : texto.trim();
    }
    for (const s of state().sucursales) {
      if (new RegExp(`\\b${normalize(s.nombre).split(' ').pop()}\\b`).test(n)) sl.sucursalId = s.id;
    }
    sl.sucursalId ??= sucDefault();

    if (sl.personas > MAX_PERSONAS || sl.ocasion === 'evento') {
      handoff(id); reset(id);
      return [m(T.handoffReserva)];
    }
    if (sl.personas !== undefined && sl.personas < 1) { delete sl.personas; setStep(id, 'personas', sl); return [m(T.personasInvalidas)]; }
    const falta = [['fecha', sl.fecha], ['hora', sl.hora], ['personas', sl.personas], ['ocasion', sl.ocasion]].find(([, v]) => v === undefined)?.[0];
    if (falta) {
      setStep(id, falta, sl);
      const fallo = esperado === falta && falta !== 'ocasion';
      const ask = { fecha: fallo ? T.fechaNo : T.pedirFecha, hora: fallo ? T.horaNo : T.pedirHora, personas: fallo ? T.personasInvalidas : T.pedirPersonas, ocasion: T.pedirOcasion }[falta];
      return [m(ask, falta === 'ocasion' ? T.botonesOcasion : undefined)];
    }
    let r;
    try {
      r = createReservation(store, { sucursalId: sl.sucursalId, fecha: sl.fecha, hora: sl.hora, personas: sl.personas, ocasion: sl.ocasion }, { ahora: ahora() });
    } catch { return falla(id); }
    if (r.ok) { reset(id); return [m(T.reservaOk(r.reserva, sucNombre(sl.sucursalId)))]; }
    const suc = state().sucursales.find((s) => s.id === sl.sucursalId);
    switch (r.razon) {
      case 'handoff': handoff(id); reset(id); return [m(T.handoffReserva)];
      case 'sin_mesa': { const h = sl.hora; delete sl.hora; setStep(id, 'hora', sl); return [m(T.sinMesa(h))]; }
      case 'fuera_de_horario': delete sl.hora; setStep(id, 'hora', sl); return [m(T.fueraHorario(suc.nombre, suc.horario))];
      case 'fecha_pasada': delete sl.fecha; delete sl.hora; setStep(id, 'fecha', sl); return [m(T.fechaPasada)];
      case 'personas_invalidas': delete sl.personas; setStep(id, 'personas', sl); return [m(T.personasInvalidas)];
      default: return falla(id);
    }
  }

  // ---------- información ----------
  function info(id, n, texto) {
    const T = lang(id);
    const s = state();
    if (ESTADO.test(n)) {
      const p = s.pedidos.find((x) => x.conversacionId === id);
      if (!p) { handoff(id); return [m(T.sinPedido)]; }
      return [m(T.estadoPedido(p.id, p.estado))];
    }
    if (ALERGENO_CUE(n)) {
      const r = allergenReply(T, s, n);
      if (r.handoff) handoff(id);
      return [m(r.texto)];
    }
    if (RESERVA.test(n)) return pasoReserva(id, texto, n, null);
    if (HORARIO.test(n)) return [m(T.horarios(s.sucursales.map((x) => T.horarioLinea(x.nombre, x.horario))))];
    if (UBICACION.test(n)) return [m(T.ubicaciones(s.sucursales.map((x) => T.ubicacionLinea(x.nombre, x.direccion))))];
    if (MENU.test(n)) {
      const combos = (s.combos ?? []).filter((c) => c.items.every((i) => isAvailable(s, i.productoId, sucDefault())));
      if (!combos.length) { handoff(id); return [m(T.sinDato)]; }
      return [m(T.menuDia(combos.map((c) => T.comboLinea(c))), [T.botonesInicio[0]])];
    }
    const res = parseOrder(texto, s, sucDefault());
    if (res.lineas.length || res.agotados.length || ORDEN.test(n)) return iniciarPedido(id, texto);
    if (SALUDO.test(n)) return [m(T.saludo, T.botonesInicio)];
    if (GRACIAS.test(n)) return [m(T.gracias)];
    const limpio = n.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    const nPal = limpio ? limpio.split(' ').length : 0;
    if (nPal >= 2 && (PREGUNTA.test(limpio) || (/\?/.test(texto) && nPal >= 3))) { handoff(id); return [m(T.sinDato)]; }
    return [m(T.aclarar, T.botonesInicio)];
  }

  function respond(id, texto) {
    const T = lang(id);
    const n = normalize(texto);
    if (!n) return [m(T.aclarar, T.botonesInicio)];
    if (HUMANO.test(n)) { handoff(id); return [m(T.humano)]; }
    if (CANCELAR.test(n)) { reset(id); return [m(T.cancelado, T.botonesInicio)]; }
    const paso = getConv(id).paso;
    if (paso === 'confirmar') return pasoConfirmar(id, texto, n);
    if (paso === 'tipo') return pasoTipo(id, texto, n);
    if (paso === 'direccion') return pasoDireccion(id, texto, n);
    if (paso === 'pago') return pasoPago(id, texto, n);
    if (['fecha', 'hora', 'personas', 'ocasion'].includes(paso)) return pasoReserva(id, texto, n, paso);
    return info(id, n, texto);
  }

  // Avisos de estado del pedido hacia la conversación que lo originó.
  store.on('pedido:estado', ({ pedidoId, estado, conversacionId } = {}) => {
    try {
      if (!conversacionId || !getConv(conversacionId)) return;
      const T = lang(conversacionId);
      let texto = T.avisoEstado(pedidoId, estado);
      const factura = state().pedidos.find((p) => p.id === pedidoId)?.factura;
      if (estado === 'Entregado' && factura) texto += `\n${T.avisoFactura(factura)}`;
      const mensaje = append(conversacionId, m(texto));
      store.emit('chat:mensaje', { convId: conversacionId, mensaje });
    } catch { /* un aviso fallido no debe romper el cambio de estado */ }
  });

  return {
    reply(convId, texto) {
      const raw = typeof texto === 'string' ? texto : String(texto ?? '');
      if (!getConv(convId)) {
        store.update((s) => { s.conversaciones.push({ id: convId, idioma: 'es', mensajes: [], requiereHumano: false, paso: null, slots: {} }); });
      }
      append(convId, { de: 'cliente', texto: raw });
      const idioma = pickLang(raw, getConv(convId).idioma);
      upd(convId, (c) => { c.idioma = idioma; });
      let msgs;
      try {
        msgs = respond(convId, raw);
      } catch {
        handoff(convId);
        msgs = [m(t(idioma).error)];
      }
      for (const x of msgs) append(convId, x);
      return msgs;
    },
  };
}
