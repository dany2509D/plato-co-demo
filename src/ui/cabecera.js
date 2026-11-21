/**
 * Cabecera del cliente (rediseño 2, bloque B · direccion-v2 §3.9).
 *
 *   crearCabecera({ alReiniciar, alPresentar, alTema }) → <header class="app-header">
 *     Escritorio (≥ 900 px, 72 px): logo + «Plato & Co.», nav (Inicio · Carta · Asistente), «Reservar» (fantasma),
 *     «Pedir» (píldora), carrito (círculo 44 px con contador) y «Demo ▾» (menú accesible: Entrar como administrador,
 *     Reiniciar demo, Presentación guiada). Celular (56 px): logo, carrito y «Menú ≡», que abre una hoja carbón a
 *     pantalla completa (<dialog> modal: Esc, foco atrapado, el foco vuelve al botón).
 *   vigilarCabecera(header) → transparente sobre el héroe de #/ ([data-hero]) y sólida al pasarlo (300 ms);
 *     fija --stick-top (alto de la cabecera pegajosa) y --banner-h (0: el banner ya no es pegajoso).
 *
 * Lógica pura exportada (con pruebas en tests/cabecera.test.js): estadoCabecera, indiceMenu.
 * Contrato: .app-header__inner, [data-nav], [data-cuenta], .nav-carrito, .btn-reiniciar, [data-accion="presentar"].
 * «Presentación guiada» ([data-accion="presentar"], en el menú «Demo» y en la hoja móvil) es la ÚNICA entrada al modo
 * Presentación: no hay botón flotante (.pres-lanzar sigue en el DOM porque lo monta presenter.js, pero está oculto).
 * Al salir del recorrido, presenter.js devuelve el foco al control que lo abrió («Demo» o «Menú»).
 */
import { brand } from '../config/brand.js';
import { esc } from './dom.js';
import { icono } from './icons.js';
import { t } from '../config/copy.js';
import { TEMAS, temaActivoId } from '../config/temas.js';

// Botón «Diseño»: un ítem por tema (menuitemradio). El activo lleva aria-checked="true".
const itemsTema = (rol) => Object.values(TEMAS).map((x) => rol === 'menu'
  ? `<li role="none"><button role="menuitemradio" tabindex="-1" type="button" data-accion="tema:${x.id}" aria-checked="${x.id === temaActivoId()}">Diseño: ${esc(x.nombre)}${x.id === temaActivoId() ? ' ✓' : ''}</button></li>`
  : `<button type="button" data-accion="tema:${x.id}" aria-pressed="${x.id === temaActivoId()}">Diseño: ${esc(x.nombre)}${x.id === temaActivoId() ? ' ✓' : ''}</button>`).join('');

/**
 * Estado visual de la cabecera. Pura.
 * hayHeroe: la vista actual tiene un héroe oscuro bajo la cabecera; finHeroe: borde inferior del héroe respecto del
 * viewport (px); altoCabecera: alto de la cabecera (px); scrollY: desplazamiento vertical.
 * → 'transparente' (sobre el héroe) | 'solida' (arriba del todo, sin héroe) | 'flotante' (sólida con sombra).
 */
export function estadoCabecera({ hayHeroe = false, finHeroe = 0, altoCabecera = 0, scrollY = 0 } = {}) {
  if (hayHeroe && finHeroe > altoCabecera) return 'transparente';
  return scrollY > 8 ? 'flotante' : 'solida';
}

/**
 * Siguiente índice de un menú con teclado (patrón menu button de WAI-ARIA). Pura.
 * actual: índice enfocado (-1 si ninguno); total: n.º de ítems; tecla: KeyboardEvent.key.
 * → índice nuevo (con vuelta al principio/final) o null si la tecla no mueve el foco.
 */
export function indiceMenu(actual, total, tecla) {
  if (!total) return null;
  switch (tecla) {
    case 'ArrowDown': return actual < 0 ? 0 : (actual + 1) % total;
    case 'ArrowUp': return actual < 0 ? total - 1 : (actual - 1 + total) % total;
    case 'Home': case 'PageUp': return 0;
    case 'End': case 'PageDown': return total - 1;
    default: return null;
  }
}

const NAV = [['inicio', '#/', t('nav.inicio')], ['menu', '#/menu', t('nav.carta')], ['chat', '#/chat', t('nav.asistente')]];
const logo = () => brand.logoSvg.replace(/role="img"\s+aria-label="[^"]*"/, 'aria-hidden="true" focusable="false"');
const marca = () => `<a class="brand" href="#/">${logo()}<span class="brand__name">${esc(brand.nombre)}</span></a>`;

export function crearCabecera({ alReiniciar = () => {}, alPresentar = () => {}, alTema = () => {} } = {}) {
  const header = document.createElement('header');
  header.className = 'app-header';
  header.dataset.estado = 'solida';
  header.innerHTML = `
    <div class="app-header__inner container--wide">
      ${marca()}
      <nav class="nav" aria-label="Principal">
        ${NAV.map(([n, h, x]) => `<a href="${h}" data-nav="${n}">${esc(x)}</a>`).join('')}
      </nav>
      <div class="app-header__cta">
        <a class="btn btn--ghost btn--sm hdr-reservar" href="#/chat">${esc(t('nav.reservar'))}</a>
        <a class="btn btn--sm hdr-pedir" href="#/menu">${esc(t('nav.pedir'))}</a>
        <a class="nav-carrito" href="#/carrito" data-nav="carrito" aria-label="${esc(t('nav.carrito', { n: 0 }))}">${icono('bolsa', { tam: 20 })}<span class="nav-cuenta" data-cuenta>0</span></a>
        <div class="demo-menu">
          <button type="button" class="demo-menu__btn" id="demo-menu-btn" aria-haspopup="menu" aria-expanded="false" aria-controls="demo-menu-lista">${esc(t('nav.demo'))} <span class="demo-menu__flecha" aria-hidden="true">▾</span></button>
          <ul class="demo-menu__lista" id="demo-menu-lista" role="menu" aria-labelledby="demo-menu-btn" hidden>
            <li role="none"><a role="menuitem" tabindex="-1" class="btn-admin" href="#/admin/cocina">${esc(t('nav.admin'))}</a></li>
            <li role="none"><button role="menuitem" tabindex="-1" type="button" class="btn-reiniciar" data-accion="reiniciar">${esc(t('nav.reiniciar'))}</button></li>
            <li role="none"><button role="menuitem" tabindex="-1" type="button" data-accion="presentar">${esc(t('nav.presentacion'))}</button></li>
            ${itemsTema('menu')}
          </ul>
        </div>
        <button type="button" class="hdr-hoja-btn" aria-haspopup="dialog" aria-expanded="false" aria-controls="hoja-nav">${esc(t('nav.abrirMenu'))} ${icono('menu', { tam: 20 })}</button>
      </div>
    </div>
    <dialog class="hoja-nav on-dark" id="hoja-nav" aria-label="Menú del sitio">
      <div class="hoja-nav__in container--wide">
        <div class="hoja-nav__cab">
          ${marca()}
          <button type="button" class="hoja-nav__cerrar" data-cerrar>${esc(t('nav.cerrar'))} ${icono('cerrar', { tam: 20 })}</button>
        </div>
        <nav aria-label="Principal">
          <ul class="hoja-nav__links">
            ${[...NAV, ['carrito', '#/carrito', t('nav.suPedido')]].map(([n, h, x]) => `<li><a href="${h}" data-nav="${n}">${esc(x)}</a></li>`).join('')}
          </ul>
        </nav>
        <div class="hoja-nav__cta">
          <a class="btn btn--lg" href="#/menu">${esc(t('nav.pedir'))}</a>
          <a class="btn btn--ghost btn--lg" href="#/chat">${esc(t('nav.reservar'))}</a>
        </div>
        <div class="hoja-nav__demo" role="group" aria-labelledby="hoja-demo-t">
          <p class="eyebrow" id="hoja-demo-t">${esc(t('nav.demo'))}</p>
          <a href="#/admin/cocina">${esc(t('nav.admin'))}</a>
          <button type="button" data-accion="reiniciar">${esc(t('nav.reiniciar'))}</button>
          <button type="button" data-accion="presentar">${esc(t('nav.presentacion'))}</button>
          ${itemsTema('hoja')}
        </div>
      </div>
    </dialog>`;
  enlazarMenuDemo(header, { alReiniciar, alPresentar, alTema });
  enlazarHoja(header, { alReiniciar, alPresentar, alTema });
  return header;
}

// ---------- Menú «Demo ▾» (botón de menú: flechas, Inicio/Fin, Esc, Tab; el foco vuelve al botón) ----------
function enlazarMenuDemo(header, { alReiniciar, alPresentar, alTema }) {
  const btn = header.querySelector('.demo-menu__btn');
  const lista = header.querySelector('.demo-menu__lista');
  const items = () => [...lista.querySelectorAll('[role="menuitem"]')];
  const abierto = () => btn.getAttribute('aria-expanded') === 'true';

  function enfocar(i) { items()[i]?.focus(); }
  function abrir(i = 0) {
    lista.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', fuera, true);
    enfocar(i);
  }
  function cerrar({ devolver = true } = {}) {
    if (!abierto()) return;
    lista.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', fuera, true);
    if (devolver) btn.focus();
  }
  function fuera(e) { if (!header.querySelector('.demo-menu').contains(e.target)) cerrar({ devolver: false }); }

  btn.addEventListener('click', () => (abierto() ? cerrar() : abrir(0)));
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      abrir(e.key === 'ArrowDown' ? 0 : items().length - 1);
    }
  });
  lista.addEventListener('keydown', (e) => {
    const lst = items();
    if (e.key === 'Escape') { e.preventDefault(); cerrar(); return; }
    if (e.key === 'Tab') { cerrar({ devolver: false }); return; }
    const i = indiceMenu(lst.indexOf(document.activeElement), lst.length, e.key);
    if (i !== null) { e.preventDefault(); enfocar(i); }
  });
  lista.addEventListener('click', (e) => {
    const it = e.target.closest('[role="menuitem"]');
    if (!it) return;
    const accion = it.dataset.accion;
    cerrar();
    if (accion === 'reiniciar') alReiniciar();
    else if (accion?.startsWith('tema:')) alTema(accion.slice(5));
    else if (accion === 'presentar') alPresentar();
  });
}

// ---------- Hoja móvil (<dialog> modal a pantalla completa) ----------
function enlazarHoja(header, { alReiniciar, alPresentar, alTema }) {
  const btn = header.querySelector('.hdr-hoja-btn');
  const hoja = header.querySelector('.hoja-nav');
  if (typeof hoja.showModal !== 'function') { btn.hidden = true; return; }
  const cerrar = () => { if (hoja.open) hoja.close(); };
  btn.addEventListener('click', () => {
    hoja.showModal();
    btn.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('hoja-abierta');
    hoja.querySelector('.hoja-nav__links a')?.focus();
  });
  hoja.addEventListener('close', () => {
    btn.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('hoja-abierta');
    if (!document.body.classList.contains('pres-activa')) btn.focus({ preventScroll: true });
  });
  hoja.addEventListener('click', (e) => {
    if (e.target.closest('[data-cerrar]') || e.target.closest('a[href^="#"]')) { cerrar(); return; }
    const accion = e.target.closest('[data-accion]')?.dataset.accion;
    if (!accion) return;
    cerrar();
    if (accion === 'reiniciar') alReiniciar();
    else if (accion.startsWith('tema:')) alTema(accion.slice(5));
    else alPresentar();
  });
  // Si la ventana pasa a escritorio con la hoja abierta, se cierra (la hoja solo existe en celular).
  window.matchMedia?.('(min-width: 900px)').addEventListener?.('change', (m) => { if (m.matches) cerrar(); });
}

// ---------- Estado al desplazarse + medidas para los elementos pegajosos ----------
export function vigilarCabecera(header) {
  let raf = 0;
  const pintar = () => {
    raf = 0;
    const heroe = document.querySelector('main [data-hero]');
    const e = estadoCabecera({
      hayHeroe: Boolean(heroe) && header.offsetHeight > 0,
      finHeroe: heroe ? heroe.getBoundingClientRect().bottom : 0,
      altoCabecera: header.offsetHeight,
      scrollY: window.scrollY,
    });
    if (header.dataset.estado !== e) header.dataset.estado = e;
  };
  const pedir = () => { if (!raf) raf = requestAnimationFrame(pintar); };
  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', pedir);
  // La vista se pinta después de este listener (main.js registra la ruta al final): dos cuadros de margen.
  window.addEventListener('hashchange', () => requestAnimationFrame(pedir));

  const medir = () => {
    const root = document.documentElement.style;
    root.setProperty('--banner-h', '0px'); // el banner ya no es pegajoso (direccion-v2 §3.9)
    root.setProperty('--stick-top', `${header.offsetHeight}px`);
    pedir();
  };
  if ('ResizeObserver' in window) new ResizeObserver(medir).observe(header);
  window.addEventListener('resize', medir);
  medir();
  vigilarFinPresentacion(header);
  return pedir;
}

/**
 * Destino del foco al terminar el modo Presentación. Pura.
 * Si el foco quedó en <body> (el recorrido termina en una vista de admin, donde la cabecera del cliente está oculta y
 * presenter.js no puede devolverlo a «Demo»), va a «Demo» si se ve, si no a «Menú» (celular), si no al contenido.
 * → 'demo' | 'hoja' | 'contenido' | null (no tocar: el foco ya está en un control).
 */
export function destinoFocoFinal({ focoEnBody, demoVisible, hojaVisible }) {
  if (!focoEnBody) return null;
  if (demoVisible) return 'demo';
  if (hojaVisible) return 'hoja';
  return 'contenido';
}

function vigilarFinPresentacion(header) {
  if (!('MutationObserver' in window)) return;
  const visible = (el) => Boolean(el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
  let activa = document.body.classList.contains('pres-activa');
  new MutationObserver(() => {
    const ahora = document.body.classList.contains('pres-activa');
    if (activa && !ahora) {
      setTimeout(() => { // después del foco que intenta presenter.js
        const demo = header.querySelector('.demo-menu__btn');
        const hoja = header.querySelector('.hdr-hoja-btn');
        const d = destinoFocoFinal({ focoEnBody: document.activeElement === document.body || !document.activeElement, demoVisible: visible(demo), hojaVisible: visible(hoja) });
        const el = { demo, hoja, contenido: document.getElementById('contenido') }[d];
        el?.focus({ preventScroll: true });
      }, 0);
    }
    activa = ahora;
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
}
