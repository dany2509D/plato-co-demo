import { store } from '../core/app-store.js';
import { visibleMenu } from '../core/menu.js';
import { el, esc, money } from '../ui/dom.js';
import { branchPicker } from '../ui/branch-picker.js';
import { productCardHTML, bindAdd } from '../ui/product-card.js';
import { combosHTML, bindCombos, menuDelDiaHTML } from '../ui/combos.js';
import { montarPanelCarrito } from '../ui/cart-panel.js';
import { abrirDialogo } from '../ui/dialog.js';
import { cart } from '../ui/cart-singleton.js';

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

export function vistaMenu(main) {
  const total = store.get().productos.length;
  const nodo = el(`
    <div class="menu-vista">
      <header class="m-hero band band--dark on-dark grain">
        <div class="container--wide m-hero__in">
          <div class="m-hero__txt">
            <p class="eyebrow">La carta completa · ${total} platos</p>
            <h1 class="m-hero__t">Nuestro menú</h1>
          </div>
          <div class="m-hero__suc">
            <p class="m-hero__lead">Elija su sucursal, arme su pedido y lo preparamos al momento. Solo verá lo que hay hoy en esa cocina.</p>
            <div data-picker></div>
          </div>
        </div>
      </header>
      <div class="catbar"><div class="catbar-in container--wide" role="tablist" aria-label="Categorías del menú" data-cats></div></div>
      <div class="menu-layout container--wide">
        <div class="menu-main" data-secciones role="tabpanel" tabindex="-1"></div>
        <aside class="cart-side" aria-label="Su pedido" data-side></aside>
      </div>
      <div class="cart-bar on-dark"><button type="button" class="btn btn--lg btn--block" data-abrir-hoja></button></div>
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
    const nueva = tabs.map((t) => t.id).join('|');
    if (nueva !== firma) {
      firma = nueva;
      const enfocada = cats.contains(document.activeElement);
      cats.innerHTML = tabs.map((t, i) => `<button type="button" role="tab" class="tab-pill" id="tab-${esc(t.id)}" data-tab="${esc(t.id)}" aria-controls="panel-menu" aria-selected="${i === idx}" tabindex="${i === idx ? 0 : -1}">${esc(t.nombre)}</button>`).join('');
      if (enfocada) cats.querySelector('[aria-selected="true"]')?.focus();
    } else {
      cats.querySelectorAll('[role="tab"]').forEach((b, i) => { b.setAttribute('aria-selected', String(i === idx)); b.tabIndex = i === idx ? 0 : -1; });
    }
    cats.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    secciones.id = 'panel-menu';
    const t = tabs[idx];
    if (!t) { secciones.removeAttribute('aria-labelledby'); secciones.innerHTML = '<p class="m-vacio">Por ahora no hay platos disponibles en esta sucursal.</p>'; return; }
    secciones.setAttribute('aria-labelledby', `tab-${t.id}`);
    let cuerpo;
    if (t.tipo === 'categoria') {
      const g = grupos[idx];
      cuerpo = `<div class="m-sec__cab"><h2 class="m-sec__t">${esc(t.nombre)}</h2><p class="m-sec__nota"><span class="m-sec__n">${g.productos.length} ${g.productos.length === 1 ? 'plato' : 'platos'}</span>${esc(NOTAS[t.nombre] ?? '')}</p></div>
        <div class="dish-grid dish-grid--menu">${g.productos.map((p) => productCardHTML(p)).join('')}</div>`;
    } else if (t.tipo === 'combos') {
      cuerpo = `<div class="m-sec__cab"><h2 class="m-sec__t">Combos</h2><p class="m-sec__nota">Tres pasos, un precio. Se agregan plato por plato a su pedido.</p></div>${combosHTML(state, suc)}`;
    } else {
      cuerpo = mdd;
    }
    secciones.innerHTML = `<div class="m-sec ${animar ? 'm-sec--entra' : ''}">${cuerpo}<p class="m-sec__pie"><a class="btn btn--ghost" href="#/carrito">Ver mi pedido y pagar <span aria-hidden="true">→</span></a></p></div>`;
  }

  function elegir(id, { enfocar = false } = {}) {
    if (id === activa) return;
    activa = id;
    pintar(true);
    if (enfocar) cats.querySelector('[aria-selected="true"]')?.focus();
    const sticky = nodo.querySelector('.catbar').getBoundingClientRect();
    const tope = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--stick-top')) || 0;
    if (sticky.top < tope - 1 || nodo.querySelector('.menu-main').getBoundingClientRect().top < tope + sticky.height) {
      // Mantiene la barra a la vista sin llevar la página al inicio.
      window.scrollBy({ top: nodo.querySelector('.menu-main').getBoundingClientRect().top - tope - sticky.height - 12, behavior: 'auto' });
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
    tabs[i].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
  bindAdd(secciones, store);
  bindCombos(secciones, store);

  // Carrito: panel lateral (escritorio) y hoja inferior (móvil).
  const offPanel = montarPanelCarrito(nodo.querySelector('[data-side]'), store);
  function pintarBarra() {
    const n = cart.count();
    nodo.querySelector('.cart-bar').hidden = n === 0;
    barBtn.innerHTML = `<span>Ver carrito · ${n} ${n === 1 ? 'producto' : 'productos'}</span><span class="cart-bar__total">${money(cart.totals().total)}</span>`;
  }
  pintarBarra();
  const offBarra = store.subscribe(pintarBarra);
  let offHoja = null;
  barBtn.addEventListener('click', () => {
    const cont = document.createElement('div');
    cont.className = 'hoja';
    cont.innerHTML = '<button type="button" class="btn btn--ghost btn--icon hoja-cerrar" data-cerrar aria-label="Cerrar pedido"><span aria-hidden="true">×</span></button><div data-contenido></div>';
    offHoja = montarPanelCarrito(cont.querySelector('[data-contenido]'), store, { onContinuar: () => cerrar() });
    const cerrar = abrirDialogo(cont, { etiqueta: 'Su pedido', clase: 'modal-hoja', onClose: () => { offHoja?.(); offHoja = null; } });
    cont.querySelector('[data-cerrar]').addEventListener('click', cerrar);
  });

  const offMenu = store.on('menu:cambio', () => pintar());
  pintar();
  return () => { offPanel(); offBarra(); offMenu(); offHoja?.(); document.querySelectorAll('dialog.modal').forEach((d) => d.close()); };
}
