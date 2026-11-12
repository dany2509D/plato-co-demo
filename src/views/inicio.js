// Portada #/ (rediseño 2, bloque B · direccion-v2 §2.1): héroe con foto a sangre y titular de una línea →
// sucursales con foto → lo que más se pide (4) → cómo funciona (banda carbón) → cifras →
// menú del día + combos → reseñas → banda CTA con foto. El pie lo monta main.js.
// (La cinta de platos en movimiento se quitó a pedido del cliente, 11 nov 2026.)
// Honestidad: cifras, reseñas y nombres son ficticios y así se rotulan.
import { store } from '../core/app-store.js';
import { visibleMenu } from '../core/menu.js';
import { el, esc } from '../ui/dom.js';
import { branchPicker } from '../ui/branch-picker.js';
import { productCardHTML, bindAdd } from '../ui/product-card.js';
import { combosHTML, bindCombos, menuDelDiaHTML } from '../ui/combos.js';
import { fotoEscena } from '../ui/photo.js';
import { icono, circuloIcono } from '../ui/icons.js';
import { formatearCifra } from '../ui/reveal.js';

const DESTACADOS = ['Hamburguesa doble', 'Fettuccine Alfredo', 'Churrasco', 'Bowl de pollo y arroz'];

// Reseñas ficticias de la demo.
const RESENAS = [
  [5, 'Pedí por WhatsApp a la hora del almuerzo y en 25 minutos tenía la hamburguesa doble en la oficina, caliente y con la factura en el chat.', 'Mariela R.', 'Sucursal Centro'],
  [5, 'El fettuccine es de los que uno repite. La reserva para ocho personas salió en un minuto y la mesa estaba lista al llegar.', 'Jorge A.', 'Sucursal Costa'],
  [4, 'Porciones generosas y buen precio. El menú del día le salva cualquier martes, y el brownie con helado es obligatorio.', 'Ana Lucía P.', 'Sucursal Norte'],
];

const PASOS = [
  ['chat', 'Pide por WhatsApp', 'Como le escribe a un amigo: «dos clásicas sin cebolla y una limonada». El asistente confirma platos, precio y dirección.'],
  ['cocina', 'La cocina lo recibe', 'El pedido entra solo a la pantalla de cocina de la sucursal, con tiempos y alérgenos a la vista. Nadie lo copia a mano.'],
  ['pedido', 'Sale con su factura', 'Pago con Yappy, tarjeta o efectivo, y la factura electrónica por el mismo chat (simulada en esta demo).'],
];

const ROLES = [
  ['delivery', 'Quien pide', 'Pide por WhatsApp en un minuto', '#/chat', 'Ver el chat'],
  ['ambiente_parrilla', 'Quien cocina', 'Ve cada pedido en pantalla, con alérgenos', '#/admin/cocina', 'Ver la cocina'],
  ['ambiente_salon', 'Quien gerencia', 'Compara ventas y tiempos entre sucursales', '#/admin/indicadores', 'Ver indicadores'],
];

const ESTRELLA = 'M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z';
export const estrellasHTML = (n, clase = '') => `<span class="estrellas ${esc(clase)}" role="img" aria-label="${Number(n)} de 5 estrellas">${
  Array.from({ length: 5 }, (_, i) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${ESTRELLA}" class="${i < n ? 'on' : ''}"/></svg>`).join('')}</span>`;

// Cifra con contador: el valor real en .sr-only; el número animado (aria-hidden) lo maneja reveal.js.
function cifra(valor, { dec = 0, unidad = '', etiqueta, animar }) {
  const txt = formatearCifra(valor, dec);
  return `<div class="c-cifra">
    <p class="c-cifra__num"><span class="sr-only">${esc(txt)}${unidad ? ` ${esc(unidad)}` : ''}</span><span aria-hidden="true"${animar ? ` data-count="${Number(valor)}" data-dec="${Number(dec)}"` : ''}>${esc(txt)}</span>${unidad ? `<span class="c-cifra__u" aria-hidden="true">${esc(unidad)}</span>` : ''}</p>
    <p class="c-cifra__lbl">${esc(etiqueta)}</p>
  </div>`;
}

const cabeza = (id, eyebrow, titulo, extra = '', rv = '') => `
  <div class="c-head${rv}">
    <div><p class="eyebrow">${esc(eyebrow)}</p><h2 id="${esc(id)}" class="c-h2">${esc(titulo)}</h2></div>
    ${extra}
  </div>`;

// Cuatro destacados disponibles en la sucursal (los de la lista primero; si falta alguno, el siguiente de la carta).
function destacados(state, suc) {
  const disponibles = visibleMenu(state, suc).flatMap((g) => g.productos);
  const elegidos = DESTACADOS.map((n) => disponibles.find((p) => p.nombre === n)).filter(Boolean);
  for (const p of disponibles) { if (elegidos.length >= 4) break; if (!elegidos.includes(p)) elegidos.push(p); }
  return elegidos;
}

export function vistaInicio(main) {
  const nodo = el('<div class="inicio"></div>');
  main.append(nodo);

  // Solo lo que depende de la sucursal (destacados, menú del día, combos): el selector no se repinta,
  // así el foco y la selección se quedan donde están y las fotos no vuelven a revelarse.
  function pintarSucursal({ rv = '' } = {}) {
    const state = store.get();
    const suc = state.ui.sucursalCliente;
    nodo.querySelector('[data-destacados]').innerHTML = destacados(state, suc).map((p) => productCardHTML(p, { clase: rv.trim() })).join('');
    const mdd = menuDelDiaHTML(state, suc, { id: 'mdd-t' });
    nodo.querySelector('[data-dia]').innerHTML = mdd ? `<section class="c-sec c-dia" aria-labelledby="mdd-t"><div class="container--wide${rv}">${mdd}</div></section>` : '';
    nodo.querySelector('[data-combos]').innerHTML = combosHTML(state, suc);
  }

  function pintar() {
    const state = store.get();
    const rv = ' reveal';
    const animar = true; // contadores de cifras (reveal.js); el valor real va en .sr-only

    nodo.innerHTML = `
      <section class="c-hero on-dark" data-hero aria-labelledby="hero-t">
        <div class="container--wide c-hero__cab">
          <p class="eyebrow c-hero__eyebrow">Hamburguesas · pastas · parrilla · bowls</p>
          <h1 id="hero-t" class="c-hero__t">Hecho al momento.</h1>
        </div>
        <div class="c-hero__escena">
          ${fotoEscena('hero', { eager: true, clase: 'c-hero__foto', alt: 'Hamburguesa con papas fritas y tomates cherry sobre una pizarra oscura' })}
          <div class="container--wide c-hero__sobre">
            <div class="c-hero__txt">
              <p class="c-hero__lead">Servido con ganas: platos generosos, ingredientes frescos y su mesa lista cuando llegue.</p>
              <div class="c-hero__cta">
                <a class="btn c-hero__btn" href="#/menu">Pedir ahora <span aria-hidden="true">→</span></a>
                <a class="btn btn--ghost c-hero__btn c-hero__btn--ghost" href="#/chat">Reservar mesa</a>
              </div>
            </div>
            <div class="c-proof">
              ${estrellasHTML(5)}
              <p class="c-proof__n">4,8</p>
              <p class="c-proof__t">2.140 reseñas · cifras ficticias</p>
            </div>
          </div>
        </div>
      </section>

      <section class="c-sec c-sucs" aria-labelledby="suc-t">
        <div class="container--wide">
          ${cabeza('suc-t', 'Pedir o reservar', 'Elija su sucursal', '<p class="c-head__nota">Le mostramos lo que hay hoy en esa cocina, si está abierta y cuánto tarda su pedido.</p>', rv)}
          <div data-picker></div>
        </div>
      </section>

      <section class="c-sec c-dest" aria-labelledby="dest-t">
        <div class="container--wide">
          ${cabeza('dest-t', 'Los favoritos de la casa', 'Lo que más se pide', `<a class="btn btn--ghost" href="#/menu">Ver todo el menú <span aria-hidden="true">→</span></a>`, rv)}
          <div class="dish-grid dish-grid--fila c-dest__grid" data-destacados role="region" aria-label="Platos destacados" tabindex="0"></div>
        </div>
      </section>

      <section class="c-sec c-how on-dark" aria-labelledby="como-t">
        <div class="container--wide">
          <div class="c-how__intro${rv}">
            <div class="c-how__frase">
              <p class="eyebrow">Cómo funciona</p>
              <h2 id="como-t" class="c-statement">Su cliente escribe como a un amigo. <span>La cocina lo recibe sola y la factura sale por el mismo chat.</span></h2>
            </div>
            <div class="c-how__lado">
              <p>Así trabaja Plato &amp; Co. con un asistente de pedidos: el chat toma el pedido, la cocina lo ve al instante y la gerencia compara sus sucursales. En esta demo el chat simula WhatsApp y la factura es de ejemplo.</p>
              <a class="btn btn--ghost" href="#/chat">Probar el asistente <span aria-hidden="true">→</span></a>
            </div>
          </div>
          <ol class="c-how__pasos">
            ${PASOS.map(([ico, t, d], i) => `<li class="c-how__paso${rv}" style="--rv-delay:${i * 0.1}s">
              ${circuloIcono(ico, { tam: 24, tono: 'oscuro' })}
              <p class="c-how__n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</p>
              <h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('')}
          </ol>
          <ul class="c-roles" role="list" aria-label="Una mesa, tres personas">
            ${ROLES.map(([foto, rol, titulo, href, cta]) => `<li class="c-rol">
              ${fotoEscena(foto, { alt: '', ratio: '437/520', clase: 'c-rol__foto reveal--foto' })}
              <div class="c-rol__txt">
                <p class="c-rol__rol">${esc(rol)}</p>
                <h3 class="c-rol__t">${esc(titulo)}</h3>
                <a class="c-rol__cta" href="${esc(href)}">${esc(cta)} ${icono('flecha', { tam: 18 })}</a>
              </div>
            </li>`).join('')}
          </ul>
        </div>
      </section>

      <section class="c-sec c-stats" aria-labelledby="cifras-t">
        <div class="container--wide">
          <h2 id="cifras-t" class="eyebrow c-stats__t">Plato &amp; Co. en cifras</h2>
          <div class="c-stats__row">
            ${cifra(state.sucursales.length, { etiqueta: 'sucursales en Ciudad de Panamá', animar })}
            ${cifra(12, { unidad: 'min', etiqueta: 'en cocina, en promedio', animar })}
            ${cifra(state.productos.length, { etiqueta: 'platos en la carta', animar })}
            ${cifra(4.8, { dec: 1, unidad: '★', etiqueta: 'de 5 en 2.140 reseñas', animar })}
          </div>
          <p class="c-stats__nota">Cifras ficticias de la demostración.</p>
        </div>
      </section>

      <div data-dia></div>

      <section class="c-sec c-combos" aria-labelledby="combos-t">
        <div class="container--wide">
          ${cabeza('combos-t', 'Para resolver rápido', 'Combos en tres pasos', `<a class="btn btn--ghost" href="#/menu?c=combos">Ver en el menú <span aria-hidden="true">→</span></a>`, rv)}
          <div data-combos></div>
        </div>
      </section>

      <section class="c-sec c-resenas" aria-labelledby="res-t">
        <div class="container--wide">
          ${cabeza('res-t', 'Lo que dicen en la mesa', '4,8 de 5', '<p class="c-head__nota">Reseñas, nombres y cifras ficticias de la demostración.</p>', rv)}
          <ul class="c-resenas__grid" role="list" tabindex="0" aria-label="Reseñas">
            ${RESENAS.map(([n, txt, nombre, suc2], i) => `<li class="c-resena${rv}" style="--rv-delay:${i * 0.1}s">
              ${estrellasHTML(n, 'estrellas--tinta')}
              <blockquote><p>${esc(txt)}</p></blockquote>
              <p class="c-resena__autor"><strong>${esc(nombre)}</strong> ${esc(suc2)}</p></li>`).join('')}
          </ul>
        </div>
      </section>

      <section class="c-cta on-dark" aria-labelledby="cta-t">
        ${fotoEscena('cta_ingredientes', { alt: '', clase: 'c-cta__foto reveal--foto' })}
        <div class="container--wide c-cta__in">
          <h2 id="cta-t" class="c-cta__t">¿Con hambre?</h2>
          <p class="c-cta__lead">Pida en línea para entrega o retiro, o escríbanos y el asistente arma su pedido.</p>
          <div class="c-cta__acc">
            <a class="btn btn--lg" href="#/menu">Pedir en línea</a>
            <a class="btn btn--ghost btn--lg c-cta__ghost" href="#/chat">Pedir por chat</a>
          </div>
        </div>
      </section>`;
    nodo.querySelector('[data-picker]').append(branchPicker(store, () => pintarSucursal(), { variante: 'fotos' }));
    pintarSucursal({ rv });
    bindAdd(nodo.querySelector('[data-destacados]'), store);
    bindCombos(nodo.querySelector('[data-combos]'), store);
  }
  pintar();
  const off = store.on('menu:cambio', () => pintarSucursal());
  return () => off();
}
