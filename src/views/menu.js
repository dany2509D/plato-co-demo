import { store } from '../core/app-store.js';
import { visibleMenu } from '../core/menu.js';
import { el, esc, money } from '../ui/dom.js';
import { branchPicker } from '../ui/branch-picker.js';
import { productCardHTML, bindAdd } from '../ui/product-card.js';
import { combosHTML, bindCombos, menuDelDiaHTML } from '../ui/combos.js';
import { montarPanelCarrito } from '../ui/cart-panel.js';
import { abrirDialogo } from '../ui/dialog.js';
import { cart } from '../ui/cart-singleton.js';

const slug = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

export function vistaMenu(main) {
  const nodo = el(`
    <div class="menu-vista">
      <header class="menu-cab">
        <h1>Nuestro menú</h1>
        <p class="seccion-sub">Elija su sucursal, arme su pedido y nosotros lo preparamos al momento.</p>
        <div data-picker></div>
      </header>
      <nav class="catbar" aria-label="Categorías del menú"><div class="catbar-in" data-cats></div></nav>
      <div class="menu-layout">
        <div class="menu-main" data-secciones></div>
        <aside class="cart-side" aria-label="Su pedido" data-side></aside>
      </div>
      <div class="cart-bar"><button type="button" class="btn btn-primario btn-bloque" data-abrir-hoja></button></div>
    </div>`);
  main.append(nodo);
  const cats = nodo.querySelector('[data-cats]');
  const secciones = nodo.querySelector('[data-secciones]');
  const barBtn = nodo.querySelector('[data-abrir-hoja]');
  let observer;

  nodo.querySelector('[data-picker]').append(branchPicker(store, () => pintar()));

  function pintar() {
    const state = store.get();
    const suc = state.ui.sucursalCliente;
    const grupos = visibleMenu(state, suc);
    const combos = combosHTML(state, suc);
    const mdd = menuDelDiaHTML(state, suc);
    const entradas = [
      ...(mdd ? [{ id: 'menu-dia', nombre: 'Menú del día' }] : []),
      ...(state.combos.length ? [{ id: 'combos', nombre: 'Combos' }] : []),
      ...grupos.map((g) => ({ id: `cat-${slug(g.categoria)}`, nombre: g.categoria })),
    ];
    cats.innerHTML = entradas.map((e, i) => `<button type="button" class="cat-btn" data-ir="${e.id}" ${i === 0 ? 'aria-current="true"' : ''}>${esc(e.nombre)}</button>`).join('');
    secciones.innerHTML = `
      ${mdd ? `<section class="menu-sec" id="menu-dia" aria-label="Menú del día">${mdd}</section>` : ''}
      <section class="menu-sec" id="combos" aria-labelledby="h-combos">
        <div class="seccion-cab"><h2 id="h-combos">Combos</h2></div>${combos}
      </section>
      ${grupos.map((g) => `
        <section class="menu-sec" id="cat-${slug(g.categoria)}" aria-labelledby="h-${slug(g.categoria)}">
          <div class="seccion-cab"><h2 id="h-${slug(g.categoria)}">${esc(g.categoria)}</h2><span class="cuenta">${g.productos.length} platos</span></div>
          <div class="dish-grid">${g.productos.map((p) => productCardHTML(p)).join('')}</div>
          <p class="sec-pedir"><a class="btn btn-sec" href="#/carrito">Ver mi pedido y pagar</a></p>
        </section>`).join('')}`;
    observar();
  }

  // Marca la categoría visible en la barra.
  function observar() {
    observer?.disconnect();
    if (!('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver((es) => {
      const vis = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!vis) return;
      cats.querySelectorAll('.cat-btn').forEach((b) => {
        if (b.dataset.ir === vis.target.id) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    secciones.querySelectorAll('.menu-sec').forEach((s) => observer.observe(s));
  }

  cats.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ir]');
    if (!b) return;
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(b.dataset.ir)?.scrollIntoView({ behavior: reducir ? 'auto' : 'smooth', block: 'start' });
  });
  bindAdd(secciones, store);
  bindCombos(secciones, store);

  // Carrito: panel lateral (escritorio) y hoja inferior (móvil).
  const offPanel = montarPanelCarrito(nodo.querySelector('[data-side]'), store);
  function pintarBarra() {
    const n = cart.count();
    nodo.querySelector('.cart-bar').hidden = n === 0;
    barBtn.textContent = `Ver mi pedido (${n}) · ${money(cart.totals().total)}`;
  }
  pintarBarra();
  const offBarra = store.subscribe(pintarBarra);
  let offHoja = null;
  barBtn.addEventListener('click', () => {
    const cont = document.createElement('div');
    cont.className = 'hoja';
    cont.innerHTML = '<button type="button" class="hoja-cerrar" data-cerrar aria-label="Cerrar pedido">×</button><div data-contenido></div>';
    offHoja = montarPanelCarrito(cont.querySelector('[data-contenido]'), store, { onContinuar: () => cerrar() });
    const cerrar = abrirDialogo(cont, { etiqueta: 'Su pedido', clase: 'modal-hoja', onClose: () => { offHoja?.(); offHoja = null; } });
    cont.querySelector('[data-cerrar]').addEventListener('click', cerrar);
  });

  const offMenu = store.on('menu:cambio', pintar);
  pintar();
  return () => { observer?.disconnect(); offPanel(); offBarra(); offMenu(); offHoja?.(); document.querySelectorAll('dialog.modal').forEach((d) => d.close()); };
}
