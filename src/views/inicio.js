import { store } from '../core/app-store.js';
import { visibleMenu } from '../core/menu.js';
import { el, esc } from '../ui/dom.js';
import { dishArt } from '../ui/dish-art.js';
import { branchPicker } from '../ui/branch-picker.js';
import { productCardHTML, bindAdd } from '../ui/product-card.js';
import { combosHTML, bindCombos, menuDelDiaHTML } from '../ui/combos.js';

const DESTACADOS = [
  'Hamburguesa clásica', 'Hamburguesa doble', 'Fettuccine Alfredo', 'Churrasco',
  'Costillas BBQ', 'Bowl de pollo y arroz', 'Brownie con helado', 'Camarones al ajillo',
];

export function vistaInicio(main) {
  const nodo = el('<div class="inicio"></div>');
  main.append(nodo);

  function pintar() {
    const state = store.get();
    const suc = state.ui.sucursalCliente;
    const disponibles = visibleMenu(state, suc).flatMap((g) => g.productos);
    const elegidos = DESTACADOS.map((n) => disponibles.find((p) => p.nombre === n)).filter(Boolean);
    for (const p of disponibles) { if (elegidos.length >= 8) break; if (!elegidos.includes(p)) elegidos.push(p); }
    const hero = ['Hamburguesa doble', 'Fettuccine Alfredo', 'Brownie con helado']
      .map((n) => state.productos.find((p) => p.nombre === n)).filter(Boolean);

    nodo.innerHTML = `
      <section class="hero" aria-labelledby="hero-t">
        <div class="hero-texto">
          <p class="hero-etiqueta">Hamburguesas · pastas · bowls · postres</p>
          <h1 id="hero-t">Hecho al momento. <span class="resalte">Servido con ganas.</span></h1>
          <p class="hero-sub">Platos generosos, ingredientes frescos y la mesa lista cuando usted llegue. Pida en línea y reciba en casa o pase a retirar.</p>
          <div class="hero-botones">
            <a class="btn btn-primario btn-grande" href="#/menu">Pedir ahora</a>
            <a class="btn btn-sec btn-grande" href="#/chat">Reservar mesa</a>
          </div>
          <p class="prueba-social"><span class="estrellas" aria-hidden="true">★★★★★</span> <strong>4.8 ★</strong> · 2,140 reseñas <span class="ficticio">(cifras ficticias de la demo)</span></p>
        </div>
        <div class="hero-arte" aria-hidden="true">
          ${hero.map((p, i) => `<div class="hero-foto hero-foto-${i + 1}">${dishArt(p)}</div>`).join('')}
          <span class="hero-sello">Hecho<br>hoy</span>
        </div>
      </section>

      <section class="seccion" id="sucursal-sec" aria-labelledby="suc-t">
        <h2 id="suc-t">Elija su sucursal</h2>
        <p class="seccion-sub">Así le mostramos lo que hay disponible hoy y cuánto tarda su pedido.</p>
        <div data-picker></div>
      </section>

      <section class="seccion" aria-labelledby="dest-t">
        <div class="seccion-cab">
          <h2 id="dest-t">Los favoritos de la casa</h2>
          <a class="btn btn-sec" href="#/menu">Ver todo el menú</a>
        </div>
        <div class="dish-grid" data-destacados>${elegidos.map((p) => productCardHTML(p)).join('')}</div>
        <p class="centro"><a class="btn btn-primario btn-grande" href="#/menu">Pedir del menú completo</a></p>
      </section>

      <section class="seccion" aria-labelledby="mdd-t">
        <h2 id="mdd-t" class="sr-only">Menú del día</h2>
        ${menuDelDiaHTML(state, suc)}
      </section>

      <section class="seccion" aria-labelledby="combos-t">
        <div class="seccion-cab"><h2 id="combos-t">Combos en tres pasos</h2><a class="btn btn-sec" href="#/menu">Pedir</a></div>
        <div data-combos>${combosHTML(state, suc)}</div>
      </section>

      <section class="cta-final" aria-labelledby="cta-t">
        <h2 id="cta-t">¿Con hambre? Nosotros nos encargamos.</h2>
        <div class="hero-botones">
          <a class="btn btn-amarillo btn-grande" href="#/menu">Pedir en línea</a>
          <a class="btn btn-claro btn-grande" href="#/chat">Pedir por WhatsApp</a>
        </div>
      </section>`;
    nodo.querySelector('[data-picker]').append(branchPicker(store, pintarSeguro));
    bindAdd(nodo.querySelector('[data-destacados]'), store);
    bindCombos(nodo.querySelector('[data-combos]'), store);
  }
  // Al cambiar de sucursal se repinta, devolviendo el foco al selector.
  function pintarSeguro(valor) {
    pintar();
    nodo.querySelector(`input[name="sucursal-cliente"][value="${esc(valor)}"]`)?.focus();
  }
  pintar();
  const off = store.on('menu:cambio', pintar);
  return () => off();
}
