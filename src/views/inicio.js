import { store } from '../core/app-store.js';
import { visibleMenu } from '../core/menu.js';
import { el, esc } from '../ui/dom.js';
import { heroArt, selloArt } from '../ui/dish-art.js';
import { branchPicker } from '../ui/branch-picker.js';
import { productCardHTML, bindAdd } from '../ui/product-card.js';
import { combosHTML, bindCombos, menuDelDiaHTML } from '../ui/combos.js';

const DESTACADOS = [
  'Hamburguesa clásica', 'Hamburguesa doble', 'Fettuccine Alfredo', 'Churrasco',
  'Costillas BBQ', 'Bowl de pollo y arroz', 'Brownie con helado', 'Camarones al ajillo',
];
const MARQUESINA = ['Hamburguesa doble', 'Fettuccine Alfredo', 'Churrasco', 'Bowl de pollo y arroz', 'Costillas BBQ', 'Brownie con helado', 'Camarones al ajillo', 'Limonada'];

// Reseñas ficticias de la demo.
const RESENAS = [
  [5, 'Pedí por WhatsApp a la hora del almuerzo y en 25 minutos tenía la hamburguesa doble en la oficina, caliente y con la factura en el chat.', 'Mariela R.', 'Sucursal Centro'],
  [5, 'El fettuccine es de los que uno repite. La reserva para ocho personas salió en un minuto y la mesa estaba lista al llegar.', 'Jorge A.', 'Sucursal Costa'],
  [4, 'Porciones generosas y buen precio. El menú del día le salva cualquier martes, y el brownie con helado es obligatorio.', 'Ana Lucía P.', 'Sucursal Norte'],
];

const PASOS = [
  ['Escríbanos por WhatsApp', 'Pida como le escribe a un amigo: «dos clásicas sin cebolla y una limonada». El asistente confirma platos, precio y dirección.',
    '<path d="M4 20l1.4-4.2A8 8 0 1 1 8.2 18.7L4 20z"/><path d="M9 10.5h6M9 13.5h4"/>'],
  ['La cocina lo recibe', 'El pedido entra solo a la pantalla de cocina de su sucursal, con tiempos y alérgenos a la vista. Nadie lo copia a mano.',
    '<path d="M7 20h10M8 20v-5a5 5 0 1 1 8 0v5"/><path d="M12 4c-1.5 1.5-1.5 3 0 4.5"/>'],
  ['Llega facturado', 'Pague con Yappy, tarjeta o efectivo. La factura electrónica le llega por el mismo chat (simulada en esta demo).',
    '<path d="M7 3h10v18l-2.5-1.6L12 21l-2.5-1.6L7 21V3z"/><path d="M9.5 8h5M9.5 11.5h5M9.5 15h3"/>'],
];

const ESTRELLA = 'M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z';
export const estrellasHTML = (n, clase = '') => `<span class="estrellas ${clase}" role="img" aria-label="${n} de 5 estrellas">${
  Array.from({ length: 5 }, (_, i) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${ESTRELLA}" class="${i < n ? 'on' : ''}"/></svg>`).join('')}</span>`;

const marquesina = (aria) => `<ul class="marquee__group"${aria ? ' aria-hidden="true"' : ''}>${MARQUESINA.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>`;

export function vistaInicio(main) {
  const nodo = el('<div class="inicio"></div>');
  main.append(nodo);
  let primera = true;

  function pintar() {
    const state = store.get();
    const suc = state.ui.sucursalCliente;
    const rv = primera ? ' reveal' : ''; // solo anima la primera vez (al cambiar de sucursal no parpadea)
    primera = false;
    const disponibles = visibleMenu(state, suc).flatMap((g) => g.productos);
    const elegidos = DESTACADOS.map((n) => disponibles.find((p) => p.nombre === n)).filter(Boolean);
    for (const p of disponibles) { if (elegidos.length >= 8) break; if (!elegidos.includes(p)) elegidos.push(p); }
    const mdd = menuDelDiaHTML(state, suc, { id: 'mdd-t' });

    nodo.innerHTML = `
      <section class="c-hero band band--dark on-dark grain" aria-labelledby="hero-t">
        <div class="container--wide c-hero__grid">
          <div class="c-hero__txt">
            <p class="eyebrow">Hamburguesas · pastas · parrilla · bowls</p>
            <h1 id="hero-t" class="c-hero__t"><span>Hecho al</span> <span>momento.</span> <span class="t-gold">Servido</span> <span class="t-gold">con ganas.</span></h1>
            <p class="t-lead c-hero__lead">Platos generosos, ingredientes frescos y la mesa lista cuando usted llegue. Pida en línea para entrega o retiro, o reserve por chat en un minuto.</p>
            <div class="c-hero__cta">
              <a class="btn btn--lg" href="#/menu">Pedir ahora <span aria-hidden="true">→</span></a>
              <a class="btn btn--ghost btn--lg" href="#/chat">Reservar mesa</a>
            </div>
            <div class="c-proof">
              ${estrellasHTML(5)}
              <p><strong>4,8</strong> <span>2.140 reseñas · cifras ficticias de la demo</span></p>
            </div>
          </div>
          <div class="c-hero__art">${heroArt()}</div>
        </div>
        <div class="marquee c-hero__marquee"><div class="marquee__track">${marquesina(false)}${marquesina(true)}</div></div>
      </section>

      <section class="section c-sucs" aria-labelledby="suc-t">
        <div class="container--wide">
          <div class="c-head${rv}">
            <div><p class="eyebrow">Pedir o reservar</p><h2 id="suc-t" class="c-h2">Elija su sucursal</h2></div>
            <p class="c-head__nota">Le mostramos lo que hay hoy en esa cocina, si está abierta y cuánto tarda su pedido.</p>
          </div>
          <div data-picker></div>
        </div>
      </section>

      <section class="c-stats" aria-labelledby="cifras-t">
        <div class="container--wide">
          <div class="c-stats__cab"><h2 id="cifras-t" class="eyebrow">Plato &amp; Co. en cifras</h2><p class="help">Cifras ficticias de la demostración.</p></div>
          <div class="c-stats__row">
            <div class="stat${rv}"><p class="stat__num">${state.sucursales.length}</p><p class="stat__label">sucursales en Ciudad de Panamá</p></div>
            <div class="stat${rv}" style="--rv-delay:.08s"><p class="stat__num">12<span class="stat__unit">min</span></p><p class="stat__label">en cocina, en promedio</p></div>
            <div class="stat${rv}" style="--rv-delay:.16s"><p class="stat__num">${state.productos.length}</p><p class="stat__label">platos en la carta</p></div>
            <div class="stat${rv}" style="--rv-delay:.24s"><p class="stat__num">4,8<span class="stat__unit" aria-hidden="true">★</span></p><p class="stat__label">de 5 en 2.140 reseñas</p></div>
          </div>
        </div>
      </section>

      <section class="band band--linen c-dest" aria-labelledby="dest-t">
        <div class="container--wide">
          <div class="c-head${rv}">
            <div><p class="eyebrow">Los favoritos de la casa</p><h2 id="dest-t" class="c-h2">Lo que más se pide</h2></div>
            <a class="btn btn--ghost" href="#/menu">Ver todo el menú <span aria-hidden="true">→</span></a>
          </div>
          <div class="dish-grid dish-grid--fila" data-destacados>${elegidos.map((p) => productCardHTML(p, { clase: rv.trim() })).join('')}</div>
        </div>
      </section>

      <section class="band band--dark on-dark grain c-how" aria-labelledby="como-t">
        <div class="container--wide">
          <div class="c-head${rv}">
            <div><p class="eyebrow">Cómo funciona</p><h2 id="como-t" class="c-h2">Pedir sin copiar nada.</h2></div>
            <p class="c-head__nota">Su pedido por WhatsApp entra directo a la cocina y sale con factura. Usted solo escribe.</p>
          </div>
          <ol class="c-how__pasos">
            ${PASOS.map(([t, d, ico], i) => `<li class="c-how__paso${rv}" style="--rv-delay:${i * 0.1}s">
              <span class="c-how__n" aria-hidden="true">0${i + 1}</span>
              <span class="c-how__ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" focusable="false">${ico}</svg></span>
              <h3>${t}</h3><p>${d}</p></li>`).join('')}
          </ol>
          <a class="btn btn--ghost btn--lg" href="#/chat">Probar el asistente <span aria-hidden="true">→</span></a>
        </div>
      </section>

      ${mdd ? `<section class="section c-dia" aria-labelledby="mdd-t"><div class="container--wide${rv}">${mdd}</div></section>` : ''}

      <section class="section c-combos" aria-labelledby="combos-t">
        <div class="container--wide">
          <div class="c-head${rv}">
            <div><p class="eyebrow">Para resolver rápido</p><h2 id="combos-t" class="c-h2">Combos en tres pasos</h2></div>
            <a class="btn btn--ghost" href="#/menu?c=combos">Ver en el menú <span aria-hidden="true">→</span></a>
          </div>
          <div data-combos>${combosHTML(state, suc)}</div>
        </div>
      </section>

      <section class="section c-resenas" aria-labelledby="res-t">
        <div class="container--wide">
          <hr class="rule-dotted">
          <div class="c-head${rv}">
            <div><p class="eyebrow">Lo que dicen en la mesa</p><h2 id="res-t" class="c-h2">4,8 de 5. Y contando.</h2></div>
            <p class="c-head__nota">Reseñas, nombres y cifras ficticias de la demostración.</p>
          </div>
          <ul class="c-resenas__grid">
            ${RESENAS.map(([n, txt, nombre, suc2], i) => `<li class="c-resena${rv}" style="--rv-delay:${i * 0.1}s">
              ${estrellasHTML(n, 'estrellas--tinta')}
              <blockquote><p>${esc(txt)}</p></blockquote>
              <p class="c-resena__autor"><strong>${esc(nombre)}</strong> ${esc(suc2)}</p></li>`).join('')}
          </ul>
        </div>
      </section>

      <section class="band band--rust on-dark grain c-cta" aria-labelledby="cta-t">
        <div class="container--wide c-cta__in">
          <h2 id="cta-t" class="c-cta__t">¿Con hambre? Nosotros nos encargamos.</h2>
          <div class="c-cta__sello">${selloArt('cta-sello', 'ENTREGA ✦ RETIRO ✦ RESERVAS ✦ ENTREGA ✦ RETIRO ✦', 'P&amp;C')}</div>
          <hr class="rule-dotted-gold">
          <div class="c-cta__fila">
            <p class="t-lead">Pida en línea para entrega o retiro, o escríbanos y el asistente arma su pedido.</p>
            <div class="cluster">
              <a class="btn btn--lg" href="#/menu">Pedir en línea</a>
              <a class="btn btn--ghost btn--lg" href="#/chat">Pedir por WhatsApp</a>
            </div>
          </div>
        </div>
      </section>`;
    nodo.querySelector('[data-picker]').append(branchPicker(store, pintarSeguro, { variante: 'filas' }));
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
