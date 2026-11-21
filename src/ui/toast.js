/**
 * Avisos (toasts) de marca · Plato & Co.
 *   toast({ mensaje, tipo = 'ok'|'aviso'|'error', accion: { texto, alClic | href }, duracion = 4000 })  → id
 *   cerrarToasts()
 *   crearGestor({ max = 3, duracion = 4000, alCambiar })  → gestor puro (cola) usado por toast() y por las pruebas:
 *       agregar(item) → id · descartar(id) · pausar(id) · reanudar(id) · lista() · limpiar()
 *
 * Abajo al centro, por encima de la barra del carrito (celular) y con 72 px libres a la izquierda para el botón «Presentación».
 * 4 s; se detiene con el cursor o el foco; Esc cierra el más reciente; máximo 3 a la vez (el más antiguo sale primero).
 * Cada aviso es role="status" (error: role="alert"), con prefijo oculto «Listo/Aviso/Error» para no depender del color.
 */
import { esc } from './dom.js';
import { icono } from './icons.js';
import '../styles/momentos.css';

const TIPOS = { ok: { icono: 'check', pref: 'Listo' }, aviso: { icono: 'alerta', pref: 'Aviso' }, error: { icono: 'alerta', pref: 'Error' } };

export function crearGestor({ max = 3, duracion = 4000, alCambiar = () => {}, ahora = () => Date.now() } = {}) {
  let items = []; let n = 0;
  const parar = (it) => { clearTimeout(it.timer); it.timer = null; };
  const armar = (it) => {
    parar(it);
    it.inicio = ahora();
    it.timer = setTimeout(() => descartar(it.id), it.resto);
  };
  function descartar(id) {
    const it = items.find((x) => x.id === id);
    if (!it) return false;
    parar(it);
    items = items.filter((x) => x.id !== id);
    alCambiar(lista());
    return true;
  }
  function agregar(item) {
    const it = { ...item, id: ++n, resto: Number.isFinite(item.duracion) ? item.duracion : duracion, timer: null, pausado: false };
    items.push(it);
    while (items.length > max) { const viejo = items.shift(); parar(viejo); }
    armar(it);
    alCambiar(lista());
    return it.id;
  }
  function pausar(id) {
    const it = items.find((x) => x.id === id);
    if (!it || it.pausado) return;
    it.pausado = true;
    it.resto = Math.max(1000, it.resto - (ahora() - it.inicio)); // al volver, al menos 1 s
    parar(it);
  }
  function reanudar(id) {
    const it = items.find((x) => x.id === id);
    if (!it || !it.pausado) return;
    it.pausado = false;
    armar(it);
  }
  function lista() { return items.map(({ timer, ...r }) => r); }
  function limpiar() { items.forEach(parar); items = []; alCambiar([]); }
  return { agregar, descartar, pausar, reanudar, lista, limpiar };
}

// ---------- DOM ----------
let region = null; let gestor = null; const acciones = new Map();

function pintar(lista) {
  if (!region) return;
  const previos = new Map([...region.children].map((c) => [c.dataset.id, c]));
  const vivos = new Set(lista.map((i) => String(i.id)));
  previos.forEach((nodo, id) => { if (!vivos.has(id)) { nodo.remove(); acciones.delete(Number(id)); } });
  lista.forEach((it) => {
    if (previos.has(String(it.id))) return;
    const T = TIPOS[it.tipo] ?? TIPOS.ok;
    const a = it.accion?.texto
      ? (it.accion.href ? `<a class="tt__accion" href="${esc(it.accion.href)}">${esc(it.accion.texto)}</a>` : `<button class="tt__accion" type="button" data-accion>${esc(it.accion.texto)}</button>`)
      : '';
    const nodo = document.createElement('div');
    nodo.className = `tt tt--${esc(TIPOS[it.tipo] ? it.tipo : 'ok')}`;
    nodo.dataset.id = String(it.id);
    nodo.setAttribute('role', it.tipo === 'error' ? 'alert' : 'status');
    nodo.innerHTML = `<span class="tt__ico">${icono(T.icono, { tam: 20 })}</span><p class="tt__msg"><span class="sr-only">${esc(T.pref)}: </span>${esc(it.mensaje)}</p>${a}<button class="tt__x" type="button" aria-label="Cerrar aviso">${icono('cerrar', { tam: 16 })}</button>`;
    nodo.addEventListener('mouseenter', () => gestor.pausar(it.id));
    nodo.addEventListener('mouseleave', () => gestor.reanudar(it.id));
    nodo.addEventListener('focusin', () => gestor.pausar(it.id));
    nodo.addEventListener('focusout', () => gestor.reanudar(it.id));
    nodo.querySelector('.tt__x').addEventListener('click', () => gestor.descartar(it.id));
    nodo.querySelector('[data-accion]')?.addEventListener('click', () => { try { it.accion.alClic?.(); } finally { gestor.descartar(it.id); } });
    region.append(nodo);
  });
}

function asegurar() {
  if (region && document.body.contains(region)) return;
  region = document.createElement('div');
  region.className = 'tt-region';
  region.id = 'avisos';
  document.body.append(region);
  gestor = crearGestor({ alCambiar: pintar });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !gestor) return;
    const l = gestor.lista();
    if (l.length) gestor.descartar(l.at(-1).id);
  });
}

export function toast({ mensaje, tipo = 'ok', accion, duracion } = {}) {
  if (!mensaje || typeof document === 'undefined') return null;
  asegurar();
  return gestor.agregar({ mensaje: String(mensaje), tipo, accion, duracion });
}
export function cerrarToasts() { gestor?.limpiar(); }
