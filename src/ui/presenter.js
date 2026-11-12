import '../styles/presentation.css';
import { store } from '../core/app-store.js';
import { advanceStatus } from '../core/orders.js';
import { parseRoute } from './router.js';
import {
  CONV, FRASE_PEDIDO, FRASE_AGOTADO, FRASE_RESERVA, DIRECCION, URL_DIAGNOSTICO,
  createTour, createContext, falta, pedidoDelTour, reservaDelTour, elegirAgotado, registrarAgotado,
  restaurarAgotado, reiniciarParaTour,
} from '../core/tour.js';

// Modo Presentación (DOM): barra flotante, resaltado, escritura animada y automatización de cada paso.
// Todo se hace con la interfaz real (escribir en el chat, tocar botones de cocina y menú), así la
// audiencia ve la aplicación reaccionar de verdad. La lógica pura vive en core/tour.js.

class Cancelado extends Error {}

const reducido = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const estrecho = () => !!window.matchMedia?.('(max-width: 480px)').matches;
const $ = (s, r = document) => r.querySelector(s);
const dormir = (ms) => new Promise((ok) => setTimeout(ok, ms));

let sesion = null; // recorrido activo (solo uno a la vez)

export function startPresentation() {
  if (sesion) return sesion.api;
  sesion = crearSesion();
  return sesion.api;
}

// Botón flotante "Presentación" disponible en todas las rutas (cliente, chat y administración).
export function montarPresentacion(contenedor = document.body) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn pres-lanzar';
  b.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M7 4.5v15l12-7.5z"/></svg><span>Presentación</span>';
  b.setAttribute('aria-label', 'Iniciar el modo Presentación (recorrido guiado)');
  b.addEventListener('click', () => { startPresentation(b); });
  contenedor.append(b);
  lanzador = b;
  return b;
}
let lanzador = null;

function crearSesion() {
  const abridor = document.activeElement instanceof HTMLElement ? document.activeElement : lanzador;
  const tour = createTour();
  const ctx = createContext();
  let corrida = 0; // identifica la corrida de automatización vigente
  let actual = null; // { promesa, cancelado }
  let corriendo = false;
  let pausado = false;
  let min = estrecho();
  let aviso = '';
  let avisoTimer = 0;
  let vigilarAnillo = 0;
  let objetivo = null;
  if (lanzador) lanzador.hidden = true;

  // ---------- DOM ----------
  const barra = document.createElement('section');
  barra.className = 'pres-barra on-dark';
  barra.setAttribute('role', 'region');
  barra.setAttribute('aria-label', 'Modo Presentación');
  barra.tabIndex = -1;
  barra.innerHTML = `
    <div class="pres-cab">
      <p class="pres-paso" data-paso></p>
      <h2 class="pres-tit" data-tit></h2>
      <button type="button" class="btn btn--ghost btn--icon pres-min" data-min aria-expanded="true" aria-label="Minimizar el panel"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    </div>
    <div class="pres-cuerpo" data-cuerpo>
      <p class="pres-nota" data-nota></p>
      <p class="pres-estado" data-estado></p>
    </div>
    <div class="pres-acc">
      <button type="button" class="btn btn--ghost" data-ant>Anterior</button>
      <button type="button" class="btn btn--ghost" data-pausa hidden>Pausar</button>
      <button type="button" class="btn" data-hacer>Hacer por mí</button>
      <button type="button" class="btn" data-sig>Siguiente</button>
      <a class="btn" data-cta href="${URL_DIAGNOSTICO}" target="_blank" rel="noopener" hidden><span class="pres-largo">Agende su&nbsp;</span>diagnóstico gratis</a>
      <button type="button" class="btn btn--text" data-salir>Salir</button>
    </div>
    <p class="sr-only" role="status" aria-live="polite" data-anuncio></p>`;
  const anillo = document.createElement('div');
  anillo.className = 'pres-anillo';
  anillo.hidden = true;
  anillo.setAttribute('aria-hidden', 'true');
  document.body.append(anillo, barra);
  document.body.classList.add('pres-activa');
  const q = (s) => $(s, barra);

  const medir = () => document.documentElement.style.setProperty('--pres-h', `${barra.offsetHeight + 24}px`);
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(medir) : null;
  ro?.observe(barra);

  // ---------- Control de corrida (cancelar / pausar) ----------
  function ctl() {
    if (!tour.activo || !actual || actual.cancelado) throw new Cancelado();
  }
  async function esperar(ms) {
    let resto = reducido() ? Math.min(ms, 120) : ms;
    for (;;) {
      ctl();
      if (pausado) { await dormir(100); continue; }
      if (resto <= 0) return;
      const d = Math.min(100, resto);
      await dormir(d);
      resto -= d;
    }
  }
  async function esperarEl(sel, ms = 8000) {
    for (let t = 0; t <= ms; t += 100) {
      ctl();
      const el = $(sel);
      if (el) return el;
      await dormir(100);
    }
    throw new Error(`No apareció ${sel}`);
  }

  async function cancelarCorrida() {
    if (!actual) return;
    actual.cancelado = true;
    try { await actual.promesa; } catch { /* ya cancelada */ }
  }

  function correr(fn, { alTerminar } = {}) {
    const mia = { cancelado: false, promesa: null };
    const previa = actual;
    actual = mia;
    corrida += 1;
    corriendo = true;
    pausado = false;
    pintar();
    mia.promesa = (async () => {
      if (previa) { previa.cancelado = true; try { await previa.promesa; } catch { /* cancelada */ } }
      try {
        await fn();
        if (!mia.cancelado) alTerminar?.();
      } catch (e) {
        if (!(e instanceof Cancelado)) avisar('No se pudo completar este paso solo; puede seguirlo a mano.', 0);
      } finally {
        quitarResaltado();
        if (actual === mia) { corriendo = false; pausado = false; pintar(); }
      }
    })();
    return mia.promesa;
  }

  // ---------- Resaltado (anillo, sin mover el diseño) ----------
  function posicionarAnillo() {
    if (!objetivo || !objetivo.isConnected) { anillo.hidden = true; return; }
    const r = objetivo.getBoundingClientRect();
    const pad = 6;
    Object.assign(anillo.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px` });
    anillo.hidden = false;
    vigilarAnillo = requestAnimationFrame(posicionarAnillo);
  }
  function resaltar(el) {
    objetivo = el;
    cancelAnimationFrame(vigilarAnillo);
    if (el) posicionarAnillo(); else anillo.hidden = true;
  }
  function quitarResaltado() { resaltar(null); }
  function mostrar(el) {
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: reducido() ? 'auto' : 'smooth' });
  }

  async function clic(el) {
    mostrar(el);
    await esperar(550);
    resaltar(el);
    await esperar(650);
    el.click();
    await esperar(350);
    quitarResaltado();
  }

  // ---------- Navegación y chat ----------
  async function ir(hash) {
    const esperada = parseRoute(hash).name;
    const main = $('main.vista');
    if (location.hash !== hash) location.hash = hash;
    else if (main?.dataset.ruta !== esperada) window.dispatchEvent(new HashChangeEvent('hashchange'));
    for (let i = 0; i < 60; i++) {
      if ($('main.vista')?.dataset.ruta === esperada) break;
      await dormir(50);
    }
    await dormir(80);
  }

  async function chatQuieto() {
    let estable = 0;
    for (let i = 0; i < 400; i++) {
      await esperar(100);
      const inp = $('.tel-texto');
      const ocupado = !inp || inp.disabled || $('.tel-escribiendo');
      if (ocupado) estable = 0; else if (++estable >= 4) return;
    }
  }

  async function escribir(input, texto) {
    input.focus({ preventScroll: true });
    input.value = '';
    if (reducido()) {
      input.value = texto;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    for (const ch of texto) {
      input.value += ch;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await esperar(24 + Math.round(Math.random() * 30));
    }
  }

  async function enviarTexto(textoMensaje) {
    await chatQuieto();
    const input = await esperarEl('.tel-texto');
    mostrar(input);
    await esperar(400);
    await escribir(input, textoMensaje);
    await esperar(450);
    const enviar = $('.tel-enviar');
    resaltar(enviar);
    await esperar(450);
    $('.tel-compositor')?.requestSubmit();
    await esperar(250);
    quitarResaltado();
    await chatQuieto();
  }

  async function tocarRapido(etiqueta) {
    await chatQuieto();
    const btn = [...document.querySelectorAll('.tel-rapido')].reverse().find((b) => b.textContent.trim() === etiqueta);
    if (!btn) return false;
    await clic(btn);
    await chatQuieto();
    return true;
  }

  const conv = () => store.get().conversaciones.find((c) => c.id === CONV);
  const fijarSucursal = (id) => {
    if (id && store.get().ui.sucursalAdmin !== id) store.update((s) => { s.ui.sucursalAdmin = id; });
  };

  // ---------- Pasos automatizados (idempotentes: miran el estado antes de actuar) ----------
  async function hacerPedido() {
    await ir('#/chat');
    await esperarEl('.tel-texto');
    for (let i = 0; i < 8 && falta('pedido', store.get(), ctx); i++) {
      const msgs = conv()?.mensajes ?? [];
      const clientes = msgs.filter((m) => m.de === 'cliente');
      const ult = [...msgs].reverse().find((m) => m.de === 'bot');
      if (!clientes.length) await enviarTexto(FRASE_PEDIDO);
      else if (ult?.botones?.includes('Sí, confirmar')) await tocarRapido('Sí, confirmar');
      else if (!clientes.some((m) => m.texto === DIRECCION) && /direcci/i.test(ult?.texto ?? '')) await enviarTexto(DIRECCION);
      else if (ult?.botones?.includes('Yappy')) await tocarRapido('Yappy');
      else break;
    }
    const p = pedidoDelTour(store.get(), ctx);
    if (p) fijarSucursal(p.sucursalId);
    await esperar(1200);
  }

  async function asegurarPedido() {
    if (falta('pedido', store.get(), ctx)) await hacerPedido();
  }

  async function hacerCocina() {
    await asegurarPedido();
    const p = pedidoDelTour(store.get(), ctx);
    if (!p) return;
    let pasos = 0;
    while (falta('avanzar', store.get(), ctx)) {
      fijarSucursal(ctx.sucursalId);
      await ir('#/admin/cocina');
      const btn = await esperarEl(`[data-avanzar="${CSS.escape(ctx.orderId)}"]`);
      await clic(btn);
      pasos += 1;
      await esperar(900);
      if (pasos % 2 === 0 || !falta('avanzar', store.get(), ctx)) {
        await ir('#/chat');
        await chatQuieto();
        await esperar(2200);
      }
    }
  }

  async function hacerAgotado() {
    const suc = ctx.sucursalId ?? store.get().ui.sucursalAdmin;
    ctx.sucursalId = suc;
    if (!ctx.agotadoProductId) {
      const prod = elegirAgotado(store.get(), suc);
      if (!prod) return;
      registrarAgotado(store.get(), ctx, prod.id, suc);
    }
    if (falta('marcarAgotado', store.get(), ctx)) {
      fijarSucursal(ctx.agotadoSucursalId);
      await ir('#/admin/menu');
      const btn = await esperarEl(`[data-agotado="${CSS.escape(ctx.agotadoProductId)}"]`);
      await clic(btn);
      await esperar(1200);
    }
    if (falta('pedirAgotado', store.get(), ctx)) {
      await ir('#/chat');
      await esperarEl('.tel-texto');
      await enviarTexto(FRASE_AGOTADO);
      ctx.agotadoPedido = true;
      await esperar(1500);
    }
  }

  async function hacerReserva() {
    if (falta('reserva', store.get(), ctx)) {
      await ir('#/chat');
      await esperarEl('.tel-texto');
      await enviarTexto(FRASE_RESERVA);
      await esperar(1200);
    }
    const r = reservaDelTour(store.get(), ctx);
    if (!r) return;
    fijarSucursal(r.sucursalId);
    await ir('#/admin/reservas');
    const sel = await esperarEl('[data-fecha]');
    if (sel.value !== r.fecha) { sel.value = r.fecha; sel.dispatchEvent(new Event('change', { bubbles: true })); await esperar(300); }
    const franja = $(`[data-franja="${CSS.escape(`${r.hora.slice(0, 2)}:00`)}"]`);
    if (franja && franja.getAttribute('aria-pressed') !== 'true') await clic(franja);
    const mesa = await esperarEl(`[data-mesa="${CSS.escape(r.mesaId ?? '')}"]`).catch(() => null);
    if (mesa) { mostrar(mesa); await esperar(500); resaltar(mesa); await esperar(2500); quitarResaltado(); }
  }

  const ACCIONES = { pedido: hacerPedido, cocina: hacerCocina, agotado: hacerAgotado, reserva: hacerReserva };

  // ---------- Entrada a un paso (navega y resalta, sin cambiar datos) ----------
  async function entrar() {
    const paso = tour.step;
    await cancelarCorrida();
    quitarResaltado();
    if (paso.id === 'cocina' || paso.id === 'agotado') fijarSucursal(ctx.sucursalId);
    if (paso.id === 'reserva') { const r = reservaDelTour(store.get(), ctx); if (r) fijarSucursal(r.sucursalId); }
    await ir(paso.ruta);
    if (!tour.activo) return;
    pintar();
    if (paso.id === 'envivo') {
      await correr(async () => {
        const item = await esperarEl('.vivo-item, .vivo');
        mostrar(item);
        await esperar(500);
        resaltar(item);
        await esperar(4000);
      });
    }
  }

  // ---------- Pintado de la barra ----------
  function avisar(texto, ms = 4500) {
    aviso = texto;
    clearTimeout(avisoTimer);
    if (ms) avisoTimer = setTimeout(() => { aviso = ''; pintar(); }, ms);
    pintar();
  }

  function pintar() {
    const paso = tour.step;
    const ult = tour.esUltimo;
    q('[data-paso]').textContent = `Paso ${tour.index + 1} de ${tour.total}`;
    q('[data-tit]').textContent = paso.titulo;
    q('[data-nota]').textContent = paso.nota;
    q('[data-estado]').textContent = aviso;
    q('[data-estado]').hidden = !aviso;
    barra.classList.toggle('pres-min', min);
    const bmin = q('[data-min]');
    bmin.setAttribute('aria-expanded', String(!min));
    bmin.setAttribute('aria-label', min ? 'Mostrar el panel completo' : 'Minimizar el panel');
    const hecho = tour.hecho(paso.id);
    const mostrarHacer = !!paso.auto && !hecho && !corriendo;
    const hacer = q('[data-hacer]');
    hacer.hidden = !mostrarHacer;
    hacer.textContent = paso.auto || 'Hacer por mí';
    q('[data-pausa]').hidden = !corriendo || !paso.auto;
    q('[data-pausa]').textContent = pausado ? 'Continuar' : 'Pausar';
    q('[data-pausa]').setAttribute('aria-pressed', String(pausado));
    q('[data-ant]').disabled = tour.index === 0;
    const sig = q('[data-sig]');
    sig.hidden = ult;
    sig.classList.toggle('btn--ghost', mostrarHacer);
    q('[data-cta]').hidden = !ult;
    q('[data-salir]').textContent = ult ? 'Terminar' : 'Salir';
    barra.dataset.corriendo = corriendo ? 'true' : 'false';
    medir();
  }

  function anunciar() {
    const paso = tour.step;
    q('[data-anuncio]').textContent = `Paso ${tour.index + 1} de ${tour.total}: ${paso.titulo}. ${paso.nota}`;
  }

  // ---------- Acciones de la barra ----------
  async function mover(fn) {
    if (!fn()) return;
    await cancelarCorrida();
    corriendo = false;
    pintar();
    anunciar();
    await entrar();
  }
  const siguiente = () => mover(() => tour.next());
  const anterior = () => mover(() => tour.prev());

  function hacer() {
    const accion = ACCIONES[tour.step.id];
    if (!accion || corriendo) return;
    const id = tour.step.id;
    correr(accion, { alTerminar: () => { tour.marcar(id); pintar(); } });
  }
  function pausar() {
    if (!corriendo) return;
    pausado = !pausado;
    avisar(pausado ? 'En pausa. Pulse «Continuar» para seguir.' : '', pausado ? 0 : 1);
    pintar();
  }

  async function salir() {
    if (!tour.exit()) return;
    document.removeEventListener('keydown', teclas, true);
    if (actual) actual.cancelado = true;
    cancelAnimationFrame(vigilarAnillo);
    clearTimeout(avisoTimer);
    try { await actual?.promesa; } catch { /* cancelada */ }
    const habia = ctx.agotadoProductId;
    restaurarAgotado(store, ctx);
    ro?.disconnect();
    barra.remove();
    anillo.remove();
    document.body.classList.remove('pres-activa');
    document.documentElement.style.removeProperty('--pres-h');
    if (lanzador) { lanzador.hidden = false; }
    sesion = null;
    const vivo = document.createElement('p');
    vivo.className = 'sr-only';
    vivo.setAttribute('role', 'status');
    document.body.append(vivo);
    setTimeout(() => { vivo.textContent = habia ? 'Presentación terminada. El plato agotado volvió a estar disponible.' : 'Presentación terminada.'; }, 50);
    setTimeout(() => vivo.remove(), 3000);
    (abridor?.isConnected && !abridor.hidden ? abridor : lanzador)?.focus?.({ preventScroll: true });
  }

  function teclas(ev) {
    if (!tour.activo) return;
    if (ev.key === 'Escape') { ev.preventDefault(); salir(); return; }
    if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
    const t = ev.target;
    // No se secuestran las flechas mientras alguien escribe; con el campo vacío no hay nada que mover.
    if (t instanceof HTMLElement && (t.isContentEditable || t.tagName === 'SELECT' || (/^(INPUT|TEXTAREA)$/.test(t.tagName) && t.value))) return;
    if (ev.key === 'ArrowRight') { ev.preventDefault(); siguiente(); }
    else if (ev.key === 'ArrowLeft') { ev.preventDefault(); anterior(); }
  }

  q('[data-ant]').addEventListener('click', anterior);
  q('[data-sig]').addEventListener('click', siguiente);
  q('[data-hacer]').addEventListener('click', hacer);
  q('[data-pausa]').addEventListener('click', pausar);
  q('[data-salir]').addEventListener('click', salir);
  q('[data-min]').addEventListener('click', () => { min = !min; pintar(); });
  document.addEventListener('keydown', teclas, true);

  // ---------- Arranque: reinicio completo de datos y llegada al chat ----------
  reiniciarParaTour(store, ctx);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  avisar('Datos reiniciados para la presentación', 6000);
  pintar();
  anunciar();
  barra.focus({ preventScroll: true });
  entrar();

  const api = {
    pause: pausar,
    next: siguiente,
    exit: salir,
  };
  return { api };
}
