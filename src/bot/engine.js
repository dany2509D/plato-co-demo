import { normalize } from '../core/text.js';
import { alternativesFor, isAvailable } from '../core/menu.js';
import { assignBranch, createOrder, payOrder, priceOrder } from '../core/orders.js';
import { createReservation } from '../core/reservations.js';
import { detectLang, parseOrder } from './parser.js';
import { horaPanama, parseFecha, parseHora, sinHora } from './datetime.js';
import { t } from './texts.js';
import { allergenReply, ALERGENO_CUE, palabras } from './allergens.js';
import { estadoSucursal } from '../core/horario.js';
import { esPedirVacio, esAlergenoVacio, pareceDireccion, RESERVA_KW, ocasionNinguna, ocasionReconocida, ocasionLibre, CUE_SUMAR, mismasLineas } from './steps.js';

// Motor del bot en modo guion: una máquina de pasos por conversación.
// El paso actual (conv.paso) y los datos recogidos (conv.slots) viven en la conversación.
// No hay WhatsApp ni pagos reales: todo es simulado.

const HUMANO = /\b(pasar a una persona|hablar con (una |un )?(persona|humano|agente)|persona real|human|agent|representative|real person|speak (to|with) (a )?(person|someone))\b/;
const CANCELAR = /^(cancelar|cancela|cancelo|cancel)\b/;
// Confirma SOLO un «sí» limpio; «sí, pero sin cebolla» es una corrección y se aplica antes de confirmar.
const SI = /^(si|yes|yeah|yep|sure|ok|okay|dale|claro|correcto|listo|confirmo|confirmar|confirm|de acuerdo)(\W+(que si|por favor|please|confirm\w*|gracias|thanks))*\W*$/;
const AFIRMA = new Set(['si', 'yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'dale', 'claro', 'correcto', 'listo']);
const NO_SE = /^(no se|no estoy segur[oa]|no sabria|no se si|not sure|i don'?t know|i dont know|dunno|no idea)\W*$/;
const INTERROG = /^(a que|que|cual|cuales|cuanto|cuantos|cuando|donde|como|quien|por que|puedo|puede|pueden|tienen|tiene|hay|aceptan|se puede|do you|does|is|are|can|what|when|where|how|which|why|who|will)\b/;
const NO = /^(no|nop|nope)(\s+(gracias|thanks|thank you))?\W*$/;
const ES = /\b(hola|gracias|quiero|buenas|buenos|reserva|reservar|horario|pedido|manana|hoy|personas|persona|ubicacion|donde|cuanto|favor|sin|para|una|un|dos|del|dia|tarjeta|efectivo|entrega|retiro|cancelar|tiene|tienen|las|los|que|cumpleanos|ninguna)\b/;
const EN = /\b(add|coke|cokes|lemonade|burgers?|fries|water|juice|salad|another|extra|close|closes|does|do|the|contain|contains|have|has|what|which|yes|yeah|hi|hello|hey|please|hours|open|where|status|reservation|book|table|tomorrow|today|cancel|human|agent|thanks|thank|people|order|delivery|pickup|card|cash|allergens?|allergy|my|menu|would|like|want|none|birthday)\b/;
const ORDEN = /\b(quiero|quisiera|me regala|me da|dame|ponme|pedir|ordenar|pedido|i want|i'd like|i would like|order|can i get)\b/;
const ESTADO = /(como va|como esta|donde (esta|va|viene)|estado de|estatus|status|track|where is|how('?s| is)|cuanto (falta|demora|tarda)|how long).*(pedido|orden|order)|^(mi|my) (pedido|orden|order)\W*$|cuando (llega|llegara|va a llegar|me llega|llegan)|when (will|does|is) (it|my food|my order|the food) (arrive|come|get here|be here|ready)/;
// Búsqueda segura en objetos con texto del usuario: «constructor» o «__proto__» no son claves.
const own = (obj, k) => (Object.hasOwn(obj, k) ? obj[k] : undefined);
const RESERVA = /reserv|\bbook\b|booking|table for|mesa para|una mesa|a table/;
const HORARIO = /horario|hora de (atencion|apertura)|a que hora (abren|cierran|abre|cierra)|abierto|abren|cierran|\bopen\b|opening|\bhours\b|closing|\bclos(e|es|ed)\b|what time (do|does|are|is) (you|they|the)|when (do|does|are|is) (you|they|the) (open|close|closed|opening|closing)/;
const UBICACION = /ubicacion|ubicad|direccion de|donde (estan|queda|quedan|se encuentran)|location|address|where (are|is)/;
const MENU = /menu del dia|menu of the day|today'?s menu|combos?\b|especial(es)? del dia|daily special|\bmenu\b|\bcarta\b/;
const SALUDO = /^(hola|buenas|buenos dias|buenas tardes|buenas noches|hello|hi|hey|good (morning|afternoon|evening))\b/;
const GRACIAS = /\b(gracias|thanks|thank you)\b/;
const PREGUNTA = /^(tienen|tiene|hay|cuanto|cuantos|puedo|se puede|aceptan|do you|is there|are there|can i|how much|what|que|donde|cuando|como)\b/;
const QUITAR = /\b(quita|quitar|quitale|elimina|eliminar|saca|sacar|remove|delete|drop)\b/;
const AGREGAR = /^(y|and|tambien|also|mas)\b|\b(agrega|agregar|agregame|agregale|anade|anadir|suma|sumar|add|ponle|ponme|dame|quiero|i want|i'd like)\b/;
const CANT_PROD = /^(?:mejor|make it|cambia(?:lo|la|r)?(?: a)?|change it to|actually|ahora)\s+(\d+|[a-z]+)\s+([a-z ]+)$/;
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

  // Sucursal nombrada en el texto (por la última palabra de su nombre: Centro, Costa, Norte).
  function sucursalNombrada(texto) {
    const n = texto.replace(/\bnorth\b/g, 'norte').replace(/\b(center|centre|downtown)\b/g, 'centro').replace(/\bcoast\b/g, 'costa');
    let r = null;
    for (const x of state().sucursales) {
      if (new RegExp(String.raw`\b${normalize(x.nombre).split(' ').pop()}\b`).test(n)) r = x.id;
    }
    return r;
  }

  // Repite lo no identificado con las tildes y mayúsculas que escribió el cliente.
  function eco(texto, frags) {
    const orig = texto.split(/\s+/).filter(Boolean).map((w) => w.replace(/^[¡!¿?.,;:"()]+|[¡!¿?.,;:"()]+$/g, ''));
    const norm = orig.map((w) => normalize(w));
    return frags.map((f) => {
      const fw = f.split(' ').filter(Boolean);
      for (let i = 0; i + fw.length <= norm.length; i++) {
        if (fw.every((w, k) => norm[i + k] === w)) return orig.slice(i, i + fw.length).join(' ');
      }
      return f;
    });
  }

  // Avisos del parser: ambigüedades, cantidades inválidas y lo no identificado.
  function avisos(T, texto, res) {
    const out = [];
    for (const a of res.ambiguos ?? []) out.push(T.ambiguo(eco(texto, [a.termino ?? a.frag])[0], a.opciones));
    const inv = res.invalidas ?? [];
    const enteras = inv.filter((i) => i.motivo === 'entera');
    if (enteras.length) out.push(T.cantidadEntera(eco(texto, enteras.map((i) => i.frag)).join(', ')));
    if (inv.some((i) => i.motivo === 'rango')) out.push(T.cantidadMax);
    const resto = res.desconocidos.filter((f) => !inv.some((i) => i.frag === f));
    if (resto.length) out.push(T.noEntendidos(eco(texto, resto).join(', ')));
    return out;
  }

  // Aviso de sucursal cerrada ahora (hora de Panamá, reloj inyectable). '' si está abierta.
  function avisoCerrada(T, sucId, clave) {
    const sc = state().sucursales.find((x) => x.id === sucId);
    if (!sc) return '';
    const st = estadoSucursal(sc.horario, ahora());
    if (st.abierto || st.etiqueta !== 'Cerrado') return '';
    return T[clave](sc.nombre, /hoy/.test(st.detalle), sc.horario.abre);
  }

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
    const suc = state().sucursales.find((x) => x.id === sl.sucursalId);
    if (sl.tipo === 'retiro') partes.push(T.retiraEn(suc.nombre, suc.direccion));
    if ((sl.tipo === 'entrega' && sl.direccion) || sl.tipo === 'retiro') {
      partes.push(T.sucursalEta(suc.nombre, sl.eta ?? suc.etaBaseMin));
      const cerrada = avisoCerrada(T, sl.sucursalId, 'cerradaResumen');
      if (cerrada) partes.push(cerrada);
    }
    return partes.join('\n');
  }

  function textoAgotados(T, ids, sucId) {
    return ids.map((pid) => T.agotado(nombreProd(pid), alternativesFor(state(), pid, sucId).map((a) => a.nombre))).join('\n');
  }

  function iniciarPedido(id, texto) {
    const T = lang(id);
    const n = normalize(texto);
    // «para retirar en Norte / en Costa del Este»: retiro en la sucursal nombrada (no es una zona de entrega)
    const retiro = RETIRO.test(n);
    const z = retiro ? null : zonaDe(texto);
    const sucursalId = (retiro ? sucursalNombrada(n) : null) ?? z?.sucursalId ?? sucDefault();
    const res = parseOrder(texto, state(), sucursalId);
    if (!res.lineas.length && !res.agotados.length) {
      reset(id);
      const av = avisos(T, texto, res);
      const soloDesconocidos = !res.ambiguos.length && !res.invalidas.length;
      return [m([...av, ...(soloDesconocidos ? [T.aclarar] : [])].join('\n'))];
    }
    const sl = {
      lineas: res.lineas, sucursalId,
      tipo: retiro ? 'retiro' : z ? 'entrega' : ENTREGA.test(n) ? 'entrega' : null,
      direccion: z ? z.zona : null, zona: z?.zona ?? null, exacta: false, eta: z?.etaMin ?? null,
    };
    const out = [];
    if (res.agotados.length) out.push(textoAgotados(T, res.agotados, sucursalId));
    if (!sl.lineas.length) { reset(id); return [m([...out, ...avisos(T, texto, res)].join('\n'))]; }
    out.push(...avisos(T, texto, res));
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
    const tw = new Set(palabras(normalize(texto).split(' ').map((w) => own(EN_PROD, w) ?? own(EN_PROD, w.replace(/s$/, '')) ?? w).join(' ')));
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
    const mp = CANT_PROD.exec(n);
    const qp = mp ? (/^\d+$/.test(mp[1]) ? Number(mp[1]) : own(NUMS, mp[1])) : undefined;
    if (mp && qp !== undefined) {
      if (qp < 1 || qp > 20) return hint(T.cantidadMax);
      const obj = lineasMencionadas(mp[2], sl.lineas);
      if (!obj.length) return hint(T.noEncuentroLinea);
      obj[obj.length - 1].cantidad = qp;
      return mostrarEdicion(id, T, { ...sl, lineas: fusionar(sl.lineas) });
    }
    const mc = CANT.exec(n);
    if (mc) {
      const q = /^\d+$/.test(mc[1]) ? Number(mc[1]) : own(NUMS, mc[1]);
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
      const ing = mm[1].split(' ').map((w) => own(EN_ING, w) ?? w).join(' ').replace(/[^a-z ]/g, '').trim();
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
    // la misma frase otra vez, sin señal de sumar, no duplica lo que ya está en el pedido
    if (res.lineas.length && !res.agotados.length && !res.ambiguos.length && !res.invalidas.length && !CUE_SUMAR.test(n) && mismasLineas(res.lineas, sl.lineas)) {
      const lista = res.lineas.map((l) => T.linea(l.cantidad, nombreProd(l.productoId), l.modificadores)).join(', ');
      return [m(`${T.yaLoTengo(lista)}\n${resumen(T, sl)}\n${T.confirmarPreg}`, [T.si, T.cancelar])];
    }
    const previo = [];
    if (res.agotados.length) previo.push(textoAgotados(T, res.agotados, sl.sucursalId));
    if (res.lineas.length) {
      const nuevas = fusionar([...sl.lineas, ...res.lineas]);
      if (nuevas.some((l) => l.cantidad > 20)) return hint(T.cantidadMax);
      sl.lineas = nuevas;
    }
    if (!res.lineas.length && !res.agotados.length) return hint(avisos(T, texto, res).join('\n'));
    previo.push(...avisos(T, texto, res));
    return mostrarEdicion(id, T, sl, previo);
  }

  // Quita un «sí / ok / dale» inicial (y un «pero») para aplicar lo que viene después.
  function sinAfirmacion(texto) {
    const m1 = /^\s*[¡¿]?([^\s,.;:!]+)[\s,.;:!-]*/.exec(texto);
    if (!m1 || !AFIRMA.has(normalize(m1[1]))) return texto;
    const resto = texto.slice(m1[0].length);
    const m2 = /^(pero|but)(?![a-z])[\s,.;:!-]*/i.exec(resto);
    return m2 ? resto.slice(m2[0].length) : resto;
  }

  function pasoConfirmar(id, texto, n) {
    const T = lang(id);
    const sl = getConv(id).slots;
    if (NO.test(n)) { reset(id); return [m(T.cancelado, T.botonesInicio)]; }
    if (SI.test(n)) return despuesDeConfirmar(id, sl, true);
    if (NO_SE.test(n)) return [m(T.dudaConfirmar, [T.si, T.cancelar])];
    // «Sí, pero sin cebolla» / «ok, y agrégale una limonada»: se aplica la corrección y se vuelve a confirmar
    const resto = sinAfirmacion(texto);
    if (resto !== texto && normalize(resto)) return editarPedido(id, resto, normalize(resto));
    return editarPedido(id, texto, n);
  }

  function pedirPago(id, sl, previo = []) {
    const T = lang(id);
    setStep(id, 'pago', sl);
    return [m([...previo, T.pedirPago].join('\n'), T.botonesPago)];
  }

  // `resumenMostrado`: el resumen que acaba de confirmar el cliente ya decía dónde retira.
  function despuesDeConfirmar(id, sl, resumenMostrado = false) {
    const T = lang(id);
    if (!sl.tipo) { setStep(id, 'tipo', sl); return [m(T.pedirTipo, T.botonesTipo)]; }
    if (sl.tipo === 'entrega' && !sl.direccion) { setStep(id, 'direccion', sl); return [m(T.pedirDireccion)]; }
    const s = state().sucursales.find((x) => x.id === sl.sucursalId);
    const previo = sl.tipo === 'retiro' && !resumenMostrado ? [T.retiraEn(s.nombre, s.direccion)] : [];
    if (sl.tipo === 'entrega' && sl.zona && !sl.exacta) previo.push(T.pedirDetalle(sl.zona));
    return pedirPago(id, sl, previo);
  }

  function pasoTipo(id, texto, n) {
    const T = lang(id);
    const sl = getConv(id).slots;
    if (RETIRO.test(n)) return aplicarRetiro(id, sl, n);
    if (zonaDe(texto)) return pasoDireccion(id, texto, n);
    if (ENTREGA.test(n)) return despuesDeConfirmar(id, { ...sl, tipo: 'entrega' });
    return [m(T.pedirTipo, T.botonesTipo)];
  }

  // Retiro, en la sucursal nombrada si la hay: se re-verifica lo agotado en ESA sucursal.
  function aplicarRetiro(id, sl, n) {
    const T = lang(id);
    const nuevo = sucursalNombrada(n);
    const base = { ...sl, tipo: 'retiro' };
    if (nuevo && nuevo !== sl.sucursalId) {
      base.sucursalId = nuevo;
      base.eta = null;
      const faltan = sl.lineas.filter((l) => !isAvailable(state(), l.productoId, nuevo));
      if (faltan.length) {
        base.lineas = sl.lineas.filter((l) => isAvailable(state(), l.productoId, nuevo));
        const out = textoAgotados(T, faltan.map((l) => l.productoId), nuevo);
        if (!base.lineas.length) { reset(id); return [m(out)]; }
        setStep(id, 'confirmar', base);
        return [m(`${out}\n${resumen(T, base)}\n${T.confirmarPreg}`, [T.si, T.cancelar])];
      }
    }
    return despuesDeConfirmar(id, base);
  }

  function pasoDireccion(id, texto) {
    const T = lang(id);
    const sl = { ...getConv(id).slots };
    const z = zonaDe(texto);
    if (!z) {
      if (!parecedir(texto, normalize(texto))) return [m(T.direccionNoValida)];
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
      if (RETIRO.test(n)) return aplicarRetiro(id, sl, n);
      if (ENTREGA.test(n) && sl.tipo !== 'entrega') return despuesDeConfirmar(id, { ...sl, tipo: 'entrega' });
      if (sl.tipo === 'entrega' && n.length > 2 && parecedir(texto, n)) {
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
    const cerrada = avisoCerrada(T, p.sucursalId, 'cerradaListo');
    const eta = p.etaMin ?? (p.tipo === 'retiro' ? state().sucursales.find((x) => x.id === p.sucursalId)?.etaBaseMin : undefined);
    return [m(`${T.pedidoListo(p.id, total, pago, eta)}${cerrada ? `\n${cerrada}` : ''}`, undefined, [{ type: 'pedido:creado', payload: { pedidoId: p.id } }])];
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
      else if (esperado === 'ocasion') {
        if (ocasionNinguna(n)) sl.ocasion = 'ninguna';
        else if (ocasionReconocida(n) || ocasionLibre(texto, n)) sl.ocasion = texto.trim().slice(0, 60);
        else { setStep(id, 'ocasion', sl); return [m(T.ocasionRepite, T.botonesOcasion)]; }
      }
    }
    sl.sucursalId = sucursalNombrada(n) ?? sl.sucursalId ?? sucDefault();

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
    if (r.ok) { reset(id); return [m(T.reservaOk(r.reserva, sucNombre(sl.sucursalId)), undefined, [{ type: 'reserva:creada', payload: { reservaId: r.reserva.id } }])]; }
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
  const esPregunta = (texto, n) => /[?¿]/.test(texto) || INTERROG.test(n.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim());

  function horarioUbicacion(T, s, n) {
    const h = HORARIO.test(n);
    const u = UBICACION.test(n);
    if (!h && !u) return null;
    const partes = [];
    if (h) partes.push(T.horarios(s.sucursales.map((x) => T.horarioLinea(x.nombre, x.horario))));
    if (u) partes.push(T.ubicaciones(s.sucursales.map((x) => T.ubicacionLinea(x.nombre, x.direccion))));
    return [m(partes.join('\n'))];
  }

  // Consultas que se responden igual dentro o fuera de un flujo: pedido a secas, alérgenos a secas,
  // estado del pedido y alérgenos de un plato.
  function consulta(id, n) {
    const T = lang(id);
    const s = state();
    if (esPedirVacio(n)) return [m(T.pedirQue)];
    if (esAlergenoVacio(n)) return [m(T.pedirAlergeno)];
    if (ESTADO.test(n)) {
      const p = s.pedidos.find((x) => x.conversacionId === id);
      if (!p) {
        const c = getConv(id);
        if (['confirmar', 'tipo', 'direccion', 'pago'].includes(c.paso)) {
          const suc = s.sucursales.find((x) => x.id === c.slots.sucursalId);
          return [m(T.pedidoPendiente(c.slots.eta ?? suc?.etaBaseMin ?? 30))];
        }
        handoff(id);
        return [m(T.sinPedido)];
      }
      return [m(T.estadoPedido(p.id, p.estado))];
    }
    if (ALERGENO_CUE(n)) {
      const r = allergenReply(T, s, n);
      if (r.handoff) handoff(id);
      return [m(r.texto)];
    }
    return null;
  }

  function menuDia(id) {
    const T = lang(id);
    const s = state();
    const combos = (s.combos ?? []).filter((c2) => c2.items.every((i) => isAvailable(s, i.productoId, sucDefault())));
    if (!combos.length) { handoff(id); return [m(T.sinDato)]; }
    return [m(T.menuDia(combos.map((c2) => T.comboLinea(c2))), [T.botonesInicio[0]])];
  }

  function info(id, n, texto) {
    const T = lang(id);
    const s = state();
    const c = consulta(id, n);
    if (c) return c;
    if (RESERVA.test(n)) return pasoReserva(id, texto, n, null);
    const hu = horarioUbicacion(T, s, n);
    if (hu) return hu;
    if (MENU.test(n)) return menuDia(id);
    const res = parseOrder(texto, s, sucDefault());
    if (res.lineas.length || res.agotados.length || res.ambiguos.length || res.invalidas.length || ORDEN.test(n)) return iniciarPedido(id, texto);
    if (SALUDO.test(n)) return [m(T.saludo, T.botonesInicio)];
    if (GRACIAS.test(n)) return [m(T.gracias)];
    const limpio = n.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    const nPal = limpio ? limpio.split(' ').length : 0;
    if (nPal >= 2 && (PREGUNTA.test(limpio) || (/\?/.test(texto) && nPal >= 3))) { handoff(id); return [m(T.sinDato)]; }
    return [m(T.aclarar, T.botonesInicio)];
  }

  // ---------- preguntas dentro de un paso ----------
  // Repite lo que el paso está esperando.
  function repetirPaso(id) {
    const T = lang(id);
    const c = getConv(id);
    switch (c.paso) {
      case 'confirmar': return m(`${resumen(T, c.slots)}\n${T.confirmarPreg}`, [T.si, T.cancelar]);
      case 'tipo': return m(T.pedirTipo, T.botonesTipo);
      case 'direccion': return m(T.pedirDireccion);
      case 'pago': return m(T.pedirPago, T.botonesPago);
      case 'fecha': return m(T.pedirFecha);
      case 'hora': return m(T.pedirHora);
      case 'personas': return m(T.pedirPersonas);
      case 'ocasion': return m(T.pedirOcasion, T.botonesOcasion);
      default: return null;
    }
  }

  // Respuestas + lo que el paso sigue esperando, en un solo mensaje.
  function conRepeticion(id, msgs) {
    const rep = repetirPaso(id);
    if (!rep) return msgs;
    return [m([...msgs.map((x) => x.texto), rep.texto].join('\n'), rep.botones)];
  }

  // ¿Lo escrito parece una dirección? (números, calle, una zona conocida, o 3 palabras sin ser otra intención)
  function parecedir(texto, n) {
    const s = state();
    const res = parseOrder(texto, s, sucDefault());
    const fuerte = !!(res.lineas.length || res.agotados.length || res.ambiguos.length || res.invalidas.length) || ORDEN.test(n) || esPregunta(texto, n);
    const debil = HORARIO.test(n) || UBICACION.test(n) || MENU.test(n);
    return pareceDireccion(n, s.sucursales.flatMap((x) => x.zonasEntrega), { fuerte, debil });
  }

  // Una pregunta (alérgenos, horarios, ubicación, estado…) se responde SIN salir del paso y se repite
  // lo pendiente; un texto con forma de pregunta nunca se toma como dirección. null = no es una pregunta.
  function interrumpe(id, texto, n, paso) {
    const T = lang(id);
    const s = state();
    const preg = esPregunta(texto, n);
    const c = consulta(id, n);
    if (c) return conRepeticion(id, c);
    const hu = horarioUbicacion(T, s, n);
    // «Horarios» sin «?» también se responde, salvo que lo escrito parezca una dirección
    if (hu && (preg || !((paso === 'pago' || paso === 'direccion') && parecedir(texto, n)))) return conRepeticion(id, hu);
    if (!preg) return null;
    const unir = (msgs) => conRepeticion(id, msgs);
    const sl = getConv(id).slots;
    if (paso === 'pago') {
      if (RETIRO.test(n) || ENTREGA.test(n)) return null;
      if (/yappy|tarjeta|card|credit|debit|debito|efectivo|cash|pagar|pago|pay/.test(n)) return unir([m(T.pagoInfo)]);
    } else if (paso === 'tipo') {
      if (RETIRO.test(n) || ENTREGA.test(n) || zonaDe(texto)) return null;
    } else if (paso === 'direccion') {
      if (zonaDe(texto)) return null;
    } else if (paso === 'confirmar') {
      if (CANT.test(n) || QUITAR.test(n) || AGREGAR.test(n) || MOD.test(n)) return null;
      const r = parseOrder(texto, s, sl.sucursalId);
      if (r.lineas.length || r.agotados.length || r.ambiguos.length || r.invalidas.length) return null;
    }
    handoff(id);
    return unir([m(T.sinDato)]);
  }

  // Dentro de la reserva, un texto que es OTRA intención (pedido, horarios, alérgenos, una pregunta…) no se toma
  // como respuesta: un pedido empieza su flujo; lo demás se contesta y se repite lo que la reserva espera.
  function desvioReserva(id, texto, n, paso) {
    const T = lang(id);
    const s = state();
    if (RESERVA_KW.test(n)) return null;
    const res = parseOrder(texto, s, sucDefault());
    if (esPedirVacio(n) || res.lineas.length || res.agotados.length || res.ambiguos.length || res.invalidas.length) {
      reset(id);
      return info(id, n, texto);
    }
    const dato = {
      fecha: () => parseFecha(texto, ahora()) !== null,
      hora: () => parseHora(texto, { suelto: true }) !== null,
      personas: () => /\d|\b(un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|one|two|three|four|five|six|seven|eight|nine|ten)\b/.test(n),
      ocasion: () => ocasionNinguna(n) || ocasionReconocida(n),
    }[paso];
    if (dato()) return null;
    const otra = consulta(id, n) ?? horarioUbicacion(T, s, n) ?? (MENU.test(n) ? menuDia(id) : null)
      ?? (SALUDO.test(n) ? [m(T.saludo)] : GRACIAS.test(n) ? [m(T.gracias)] : null);
    if (otra) return conRepeticion(id, otra);
    if (esPregunta(texto, n)) { handoff(id); return conRepeticion(id, [m(T.sinDato)]); }
    return null;
  }

  function respond(id, texto) {
    const T = lang(id);
    const n = normalize(texto);
    if (!n) return [m(T.aclarar, T.botonesInicio)];
    if (HUMANO.test(n)) { handoff(id); return [m(T.humano)]; }
    if (CANCELAR.test(n)) { reset(id); return [m(T.cancelado, T.botonesInicio)]; }
    const paso = getConv(id).paso;
    if (['confirmar', 'tipo', 'direccion', 'pago'].includes(paso)) {
      const q = interrumpe(id, texto, n, paso);
      if (q) return q;
    }
    if (paso === 'confirmar') return pasoConfirmar(id, texto, n);
    if (paso === 'tipo') return pasoTipo(id, texto, n);
    if (paso === 'direccion') return pasoDireccion(id, texto, n);
    if (paso === 'pago') return pasoPago(id, texto, n);
    if (['fecha', 'hora', 'personas', 'ocasion'].includes(paso)) return desvioReserva(id, texto, n, paso) ?? pasoReserva(id, texto, n, paso);
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
