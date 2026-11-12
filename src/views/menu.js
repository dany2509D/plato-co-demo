import { store } from '../core/app-store.js';
import { visibleMenu } from '../core/menu.js';
import { el, esc, money } from '../ui/dom.js';
import { branchPicker } from '../ui/branch-picker.js';
import { productCardHTML, bindAdd } from '../ui/product-card.js';
import { combosHTML, bindCombos, menuDelDiaHTML } from '../ui/combos.js';
import { montarPanelCarrito } from '../ui/cart-panel.js';
import { abrirDialogo } from '../ui/dialog.js';
import { cart } from '../ui/cart-singleton.js';
import { fotoEscena } from '../ui/photo.js';
import { icono } from '../ui/icons.js';
import { cuentaTexto } from './compra-util.js';

import { buildTabs, resolveActiveTab, nextTabIndex } from '../core/menu-tabs.js';

// Una línea editorial por categoría (texto de la demo, cocina neutra).
const NOTAS = {
  Entradas: 'Para abrir la mesa y compartir mientras llega lo demás.',
  Hamburguesas: 'Pan tostado, carne a la plancha y salsas de la casa. Elija el término.',
  Pastas: 'Salsas preparadas cada mañana y porciones para quedar bien.',
  'Platos fuertes': 'Parrilla, pescado y mariscos, con guarnición del día.',
  'Ensaladas y bowls': 'Frescos, completos y armados al momento.',
  Postres: 'El final que la mesa siempre pide.',
  Bebidas: 'Naturales, frías o calientes. Agrandar no tiene cargo en esta demo.',
};

// Pestaña activa: se recuerda al volver del carrito; #/menu?c=<slug> la fija al entrar.
let ultimaPestana = null;
const pestanaDeLaURL = () => new URLSearchParams((location.hash.split('?')[1]) || '').get('c');
const reducido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function vistaMenu(main) {
  const state0 = store.get();
  const total = state0.productos.length;
  const nodo = el(`
    <div class="menu-vista">
      <header class="m-cab container--wide">
        <div class="m-cab__fila">
          <p class="m-cab__rot">${cuentaTexto(total, 'plato', 'platos')}</p>
          <h1 class="m-cab__t">La carta</h1>
          <p class="m-cab__rot">${cuentaTexto(state0.sucursales.length, 'sucursal', 'sucursales')}</p>
        </div>
        <p class="m-cab__lead">Elija su sucursal: solo verá lo que esa cocina tiene hoy.</p>
        <div class="m-cab__suc" data-picker></div>
      </header>
      <div class="m-franja">${fotoEscena('ambiente_parrilla', { eager: true, clase: 'm-franja__foto', ratio: '4/1', alt: '' })}</div>
      <div class="catbar"><div class="catbar-in container--wide" role="tablist" aria-label="Categorías del menú" data-cats></div></div>
      <div class="menu-layout container--wide">
        <div class="menu-main" data-secciones role="tabpanel" tabindex="-1"></div>
        <aside class="cart-side" aria-label="Su pedido" data-side></aside>
      </div>
      <div class="cart-bar"><button type="button" class="cart-bar__btn" data-abrir-hoja aria-haspopup="dialog"></button></div>
    </div>`);
  main.append(nodo);
  const cats = nodo.querySelector('[data-cats]');
  const secciones = nodo.querySelector('[data-secciones]');
  const barBtn = nodo.querySelector('[data-abrir-hoja]');
  let activa = pestanaDeLaURL() ?? ultimaPestana;
  let firma = '';

  nodo.querySelector('[data-picker]').append(branchPicker(store, () => pintar(), { variante: 'pildoras' }));

  function pintar(animar = false) {
    const state = store.get();
    const suc = state.ui.sucursalCliente;
    const grupos = visibleMenu(state, suc);
    const mdd = menuDelDiaHTML(state, suc);
    const tabs = buildTabs(grupos, { combos: state.combos.length > 0, menuDelDia: !!mdd });
    activa = resolveActiveTab(tabs, activa);
    ultimaPestana = activa;
    const idx = tabs.findIndex((t) => t.id === activa);
    const nueva = tabs.map((t) => `${t.id}:${t.cuenta ?? ''}`).join('|');
    if (nueva !== firma) {
      firma = nueva;
      const enfocada = cats.contains(document.activeElement);
      cats.innerHTML = tabs.map((t, i) => `<button type="button" role="tab" class="m-tab" id="tab-${esc(t.id)}" data-tab="${esc(t.id)}" aria-controls="panel-menu" aria-selected="${i === idx}" tabindex="${i === idx ? 0 : -1}"><span class="m-tab__t" data-t="${esc(t.nombre)}">${esc(t.nombre)}</span>${t.cuenta ? `<span class="m-tab__n" aria-hidden="true">${t.cuenta}</span>` : ''}</button>`).join('');
      if (enfocada) cats.querySelector('[aria-selected="true"]')?.focus();
    } else {
      cats.querySelectorAll('[role="tab"]').forEach((b, i) => { b.setAttribute('aria-selected', String(i === idx)); b.tabIndex = i === idx ? 0 : -1; });
    }
    const sel = cats.querySelector('[aria-selected="true"]');
    if (sel) {
      // Desplaza solo la fila de pestañas (nunca la página) para que la activa quede a la vista en celular.
      const r = sel.getBoundingClientRect();
      const c = cats.getBoundingClientRect();
      if (r.left < c.left || r.right > c.right) cats.scrollBy({ left: r.left - c.left - 16, behavior: reducido() ? 'auto' : 'smooth' });
    }
    secciones.id = 'panel-menu';
    const t = tabs[idx];
    if (!t) { secciones.removeAttribute('aria-labelledby'); secciones.innerHTML = '<p class="m-vacio">Por ahora no hay platos disponibles en esta sucursal.</p>'; return; }
    secciones.setAttribute('aria-labelledby', `tab-${t.id}`);
    let cuerpo;
    if (t.tipo === 'categoria') {
      const g = grupos[idx];
      cuerpo = `<div class="m-sec__cab"><h2 class="m-sec__t">${esc(t.nombre)}</h2><div class="m-sec__nota"><p class="m-sec__n">${cuentaTexto(g.productos.length, 'plato', 'platos')}</p><p>${esc(NOTAS[t.nombre] ?? '')}</p></div></div>
        <div class="dish-grid dish-grid--menu">${g.productos.map((p) => productCardHTML(p)).join('')}</div>`;
    } else if (t.tipo === 'combos') {
      cuerpo = `<div class="m-sec__cab"><h2 class="m-sec__t">Combos</h2><div class="m-sec__nota"><p class="m-sec__n">${cuentaTexto(state.combos.length, 'combo', 'combos')}</p><p>Tres platos que van bien juntos. Se agregan plato por plato, al precio de lista del menú.</p></div></div>${combosHTML(state, suc)}`;
    } else {
      cuerpo = mdd;
    }
    const sig = tabs[idx + 1];
    const pie = sig
      ? `<button type="button" class="m-sig" data-ir-tab="${esc(sig.id)}"><span class="m-sig__rot">Siguiente</span><span class="m-sig__t">${esc(sig.nombre)}</span>${icono('flecha', { tam: 24 })}</button>`
      : `<a class="m-sig" href="#/carrito"><span class="m-sig__rot">Listo</span><span class="m-sig__t">Ver mi pedido y pagar</span>${icono('flecha', { tam: 24 })}</a>`;
    secciones.innerHTML = `<div class="m-sec ${animar ? 'm-sec--entra' : ''}">${cuerpo}<div class="m-sec__pie">${pie}</div></div>`;
  }

  function elegir(id, { enfocar = false } = {}) {
    if (id === activa) return;
    activa = id;
    pintar(true);
    if (enfocar) cats.querySelector('[aria-selected="true"]')?.focus({ preventScroll: true });
    const barra = nodo.querySelector('.catbar').getBoundingClientRect();
    const tope = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--stick-top')) || 0;
    const arriba = nodo.querySelector('.menu-main').getBoundingClientRect().top;
    if (barra.top < tope + 1 && arriba < tope + barra.height) {
      // La barra ya está pegada: lleva el inicio de la categoría justo debajo, sin volver al principio de la página.
      window.scrollBy({ top: arriba - tope - barra.height - 8, behavior: 'auto' });
    }
    try { history.replaceState(null, '', `#/menu?c=${encodeURIComponent(id)}`); } catch { /* sin historial */ }
  }

  cats.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (b) elegir(b.dataset.tab);
  });
  cats.addEventListener('keydown', (e) => {
    const tabs = [...cats.querySelectorAll('[role="tab"]')];
    const i = nextTabIndex(tabs.indexOf(document.activeElement), tabs.length, e.key);
    if (i === null) return;
    e.preventDefault();
    tabs[i].focus();
    elegir(tabs[i].dataset.tab, { enfocar: true });
  });
  secciones.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ir-tab]');
    if (b) elegir(b.dataset.irTab, { enfocar: true });
  });
  bindAdd(secciones, store);
  bindCombos(secciones, store);

  // Carrito: panel lateral (escritorio) y hoja inferior (celular).
  const offPanel = montarPanelCarrito(nodo.querySelector('[data-side]'), store);
  function pintarBarra() {
    const n = cart.count();
    nodo.querySelector('.cart-bar').hidden = n === 0;
    barBtn.innerHTML = `<span class="cart-bar__txt">Ver carrito <span aria-hidden="true">·</span> ${n}<span class="cart-bar__u"> ${n === 1 ? 'producto' : 'productos'}</span></span><span class="cart-bar__total">${money(cart.totals().total)}</span>`;
  }
  pintarBarra();
  const offBarra = store.subscribe(pintarBarra);
  let offHoja = null;
  barBtn.addEventListener('click', () => {
    const cont = document.createElement('div');
    cont.className = 'hoja';
    cont.innerHTML = `
      <div class="hoja__arrastre" data-arrastre><span class="hoja__asa" aria-hidden="true"></span></div>
      <button type="button" class="hoja-cerrar" data-cerrar aria-label="Cerrar su pedido">${icono('cerrar', { tam: 22 })}</button>
      <div data-contenido></div>`;
    offHoja = montarPanelCarrito(cont.querySelector('[data-contenido]'), store, { onContinuar: () => cerrar() });
    const cerrar = abrirDialogo(cont, {
      etiqueta: 'Su pedido',
      clase: 'modal-hoja',
      onClose: () => {
        offHoja?.(); offHoja = null;
        // Si se vació el carrito, la barra (que abrió la hoja) ya no existe: el foco va a la carta.
        if (nodo.isConnected && nodo.querySelector('.cart-bar').hidden) secciones.focus({ preventScroll: true });
      },
    });
    cont.querySelector('[data-cerrar]').addEventListener('click', cerrar);
    arrastrarParaCerrar(cont.closest('dialog'), cont.querySelector('[data-arrastre]'), cerrar);
  });

  const offMenu = store.on('menu:cambio', () => pintar());
  pintar();
  return () => { offPanel(); offBarra(); offMenu(); offHoja?.(); document.querySelectorAll('dialog.modal').forEach((d) => d.close()); };
}

// Asa de la hoja: arrastrar hacia abajo más de 80 px la cierra (Esc y el botón Cerrar siguen funcionando).
function arrastrarParaCerrar(dialogo, asa, cerrar) {
  if (!dialogo || !asa) return;
  let y0 = null;
  let dy = 0;
  asa.addEventListener('pointerdown', (e) => { y0 = e.clientY; dy = 0; asa.setPointerCapture?.(e.pointerId); dialogo.classList.add('is-arrastrando'); });
  asa.addEventListener('pointermove', (e) => {
    if (y0 === null) return;
    dy = Math.max(0, e.clientY - y0);
    dialogo.style.transform = `translateY(${dy}px)`;
  });
  const soltar = () => {
    if (y0 === null) return;
    y0 = null;
    dialogo.classList.remove('is-arrastrando');
    if (dy > 80) cerrar();
    else dialogo.style.transform = '';
  };
  asa.addEventListener('pointerup', soltar);
  asa.addEventListener('pointercancel', soltar);
}
