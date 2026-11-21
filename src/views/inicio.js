import { brand } from '../config/brand.js';
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
import { estadoSucursal } from '../core/horario.js';
import { estadoCorto } from '../ui/branch-picker.js';
import { montarHeroVideo } from '../ui/hero-video.js';
import { textMorph, rellenoAlScroll } from '../ui/efectos.js';
import { menuDelDiaActivo } from '../core/horario.js';

import { DESTACADOS } from '../data/descripciones.js';
const PORTADA = brand.tema?.portada ?? {};
// Video del héroe (public/media). Un tema puede traer el suyo en portada.heroVideo; si falta el archivo queda la foto.
const HERO_VIDEO = PORTADA.heroVideo ?? 'media/hero-cocina.mp4?v=1'; // subir ?v= al cambiar el archivo (evita cachés viejas)
// Palabras que rotan en «Hoy en la cocina: …» (TextMorph de 21st.dev, ver efectos.js)
const EYEBROW = PORTADA.eyebrow ?? 'Hamburguesas · pastas · parrilla · bowls';
const PALABRAS = EYEBROW.split('·').map((w) => w.trim().toLowerCase()).filter(Boolean);
const MDD = brand.tema?.menuDelDia ?? { nombre: 'Menú del día', precio: 9.95 };

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

// Titular del héroe palabra por palabra (motion.css las hace subir desde una máscara). El texto sigue siendo uno
// solo para lectores de pantalla: los espacios quedan entre las palabras.
// Ahora letra por letra («Vertical Cut Reveal» de 21st.dev): cada letra lleva su --c; la última palabra va en cursiva.
// El h1 lleva aria-label con el texto completo y las letras van aria-hidden (los lectores no deletrean).
function palabrasHTML(t) {
  const palabras = String(t).split(/\s+/).filter(Boolean);
  let c = 0;
  return `<span aria-hidden="true">${palabras.map((w, i) => `<span class="w${i === palabras.length - 1 && palabras.length > 1 ? ' w--acento' : ''}">${
    Array.from(w, (ch) => `<span class="ch" style="--c:${c++}">${esc(ch)}</span>`).join('')}</span>`).join(' ')}</span>`;
}

// Frase que se entinta al bajar («Scroll Fill Headline» de 21st.dev): una <span class="rl"> por palabra con su --i.
function rellenoHTML(principal, cola) {
  let i = 0;
  const pal = (t) => String(t).split(/\s+/).filter(Boolean).map((w) => `<span class="rl" style="--i:${i++}">${esc(w)}</span>`).join(' ');
  const a = pal(principal);
  const b = pal(cola);
  return { html: `${a} <em>${b}</em>`, n: i };
}
const FRASE = rellenoHTML('Su cliente escribe como a un amigo.', 'La cocina lo recibe sola y la factura sale por el mismo chat.');

// Cifra con contador: el valor real en .sr-only; el número animado (aria-hidden) lo maneja reveal.js.
function cifra(valor, { dec = 0, unidad = '', unidadSr = unidad, etiqueta, animar }) {
  const txt = formatearCifra(valor, dec);
  return `<div class="c-cifra">
    <p class="c-cifra__num"><span class="sr-only">${esc(txt)}${unidadSr ? ` ${esc(unidadSr)}` : ''}</span><span aria-hidden="true"${animar ? ` data-count="${Number(valor)}" data-dec="${Number(dec)}"` : ''}>${esc(txt)}</span>${unidad ? `<span class="c-cifra__u" aria-hidden="true">${esc(unidad)}</span>` : ''}</p>
    <p class="c-cifra__lbl">${esc(etiqueta)}</p>
  </div>`;
}

// En el título, *palabra* se marca con el subrayado de marcador (.resalta, tipografia.css).
const cabeza = (id, eyebrow, titulo, extra = '', rv = '') => `
  <div class="c-head${rv}">
    <div><p class="eyebrow">${esc(eyebrow)}</p><h2 id="${esc(id)}" class="c-h2">${esc(titulo).replace(/\*(.+?)\*/g, '<mark class="resalta">$1</mark>')}</h2></div>
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
    const s = state.sucursales.find((x) => x.id === suc) ?? state.sucursales[0];
    if (s) {
      const st = estadoSucursal(s.horario, new Date());
      const corto = s.nombre.replace(`${brand.nombre} `, '');
      nodo.querySelector('[data-hero-estado]').innerHTML = `<b class="${st.abierto ? 'is-abierto' : ''}">${esc(corto)}</b> · <span class="${st.abierto ? 't-brillo' : ''}">${esc(estadoCorto(st, s.horario))}</span>`;
      nodo.querySelector('[data-hero-eta]').textContent = `${s.etaBaseMin}–${s.etaBaseMin + 10} min`;
    }
  }

  function pintar() {
    const state = store.get();
    const rv = ' reveal';
    const animar = true; // contadores de cifras (reveal.js); el valor real va en .sr-only

    nodo.innerHTML = `
      <section class="c-hero c-hero--video" data-hero-video aria-labelledby="hero-t">
        <div class="c-hero__pin">
        <div class="c-hero__marco">
          <div class="c-hero__media" aria-hidden="true">
            ${fotoEscena(PORTADA.heroFoto ?? 'hero', { eager: true, clase: 'c-hero__foto', alt: '' })}
            <video class="c-hero__video" src="${esc(HERO_VIDEO)}" muted loop playsinline preload="auto" disablepictureinpicture tabindex="-1"></video>
          </div>
          <div class="container--wide c-hero__txt">
            <a class="c-hero__pill" href="#/menu?c=menu-del-dia">
              <span class="c-hero__pill-i" aria-hidden="true">${icono('estrella', { tam: 12 })}</span>
              <span>${esc(MDD.nombre)} · $${Number(MDD.precio).toFixed(2)}${menuDelDiaActivo() ? ' · <span class="t-brillo">disponible ahora</span>' : ''}</span>
              <span class="c-hero__pill-f" aria-hidden="true">→</span>
            </a>
            <p class="eyebrow c-hero__eyebrow">Hoy en la cocina: <span class="tm" data-morph aria-hidden="true"></span><span class="sr-only">${esc(PALABRAS.join(', '))}</span></p>
            <h1 id="hero-t" class="c-hero__t" aria-label="${esc(PORTADA.titulo ?? 'Hecho al momento.')}">${palabrasHTML(PORTADA.titulo ?? 'Hecho al momento.')}</h1>
            <p class="c-hero__lead">${esc(PORTADA.lead ?? 'Platos generosos cocinados cuando usted pide. Entrega en Ciudad de Panamá, retiro en tienda o su mesa reservada en tres sucursales.')}</p>
            <div class="c-hero__cta">
              <a class="btn btn--accent btn--lg btn--brillo c-hero__btn" href="#/menu">Ver menú y pedir <span aria-hidden="true">→</span></a>
              <a class="btn btn--wa btn--lg c-hero__btn" href="#/chat">${icono('whatsapp', { tam: 20 })}<span>Pedir por WhatsApp</span></a>
            </div>
            <ul class="c-hero__datos" role="list">
              <li>${icono('reloj', { tam: 18 })}<span data-hero-estado></span></li>
              <li>${icono('en-camino', { tam: 18 })}<span>Entrega en <b data-hero-eta></b></span></li>
              <li>${estrellasHTML(5)}<span><b>4,8</b> · 2.140 reseñas <small>(ficticias)</small></span></li>
            </ul>
          </div>
          <button type="button" class="c-hero__pausa" data-video-pausa aria-pressed="false"><span class="c-hero__pausa-i" aria-hidden="true">${icono('pausa', { tam: 16 })}${icono('play', { tam: 16 })}</span><span data-t>Pausar video</span></button>
        </div>
        </div>
      </section>

      <section class="c-sec c-sucs" aria-labelledby="suc-t">
        <div class="container--wide">
          ${cabeza('suc-t', 'Ciudad de Panamá', 'Sucursales y *horarios*', '<p class="c-head__nota">Elija la suya: le mostramos lo que hay hoy en esa cocina, si está abierta, hasta dónde entrega y cuánto tarda su pedido.</p>', rv)}
          <div data-picker></div>
          <div class="c-contacto">
            <div class="c-contacto__txt">
              <p class="c-contacto__t">¿Prefiere escribir?</p>
              <p>Pida, reserve o pregunte por alérgenos por WhatsApp. Responde el asistente al momento y una persona si la necesita.</p>
              <p class="c-contacto__tel">WhatsApp y teléfono: <strong>${esc(brand.telefono)}</strong></p>
            </div>
            <div class="c-contacto__acc">
              <a class="btn btn--wa btn--lg" href="#/chat">${icono('whatsapp', { tam: 20 })}<span>Pedir por WhatsApp</span></a>
              <a class="btn btn--ghost btn--lg" href="tel:${esc(brand.telefono.replace(/[^+\d]/g, ''))}">Llamar</a>
            </div>
            <p class="c-contacto__nota">Demo: el botón abre el chat simulado de WhatsApp; el número es ficticio.</p>
          </div>
        </div>
      </section>

      <section class="c-sec c-dest" aria-labelledby="dest-t">
        <div class="container--wide">
          ${cabeza('dest-t', 'Los favoritos de la casa', 'Lo que *más* se pide', `<a class="btn btn--ghost" href="#/menu">Ver todo el menú <span aria-hidden="true">→</span></a>`, rv)}
          <div class="dish-grid dish-grid--fila c-dest__grid" data-destacados role="region" aria-label="Platos destacados" tabindex="0"></div>
        </div>
      </section>

      <section class="c-sec c-how" aria-labelledby="como-t">
        <div class="container--wide">
          <div class="c-how__intro${rv}">
            <div class="c-how__frase">
              <p class="eyebrow">Cómo funciona</p>
              <h2 id="como-t" class="c-statement" data-relleno style="--n:${FRASE.n}" aria-label="Su cliente escribe como a un amigo. La cocina lo recibe sola y la factura sale por el mismo chat.">${FRASE.html}</h2>
            </div>
            <div class="c-how__lado">
              <p>Así trabaja Plato &amp; Co. con un asistente de pedidos: el chat toma el pedido, la cocina lo ve al instante y la gerencia compara sus sucursales. En esta demo el chat simula WhatsApp y la factura es de ejemplo.</p>
              <a class="btn btn--ghost" href="#/chat">Probar el asistente <span aria-hidden="true">→</span></a>
            </div>
          </div>
          <ol class="c-how__pasos">
            ${PASOS.map(([ico, t, d], i) => `<li class="c-how__paso${rv}" style="--rv-delay:${i * 0.1}s">
              ${circuloIcono(ico, { tam: 24 })}
              <h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('')}
          </ol>
          <ul class="c-roles" role="list" aria-label="Una mesa, tres personas">
            ${ROLES.map(([foto, rol, titulo, href, cta]) => `<li class="c-rol">
              <div class="c-rol__media">
                ${fotoEscena(foto, { alt: '', ratio: '437/520', clase: 'c-rol__foto reveal--foto' })}
                <p class="c-rol__rol">${esc(rol)}</p>
              </div>
              <h3 class="c-rol__t">${esc(titulo)}</h3>
              <a class="c-rol__cta" href="${esc(href)}">${esc(cta)} ${icono('flecha', { tam: 18 })}</a>
            </li>`).join('')}
          </ul>
        </div>
      </section>

      <section class="c-sec c-stats" aria-labelledby="cifras-t">
        <div class="container--wide">
          <h2 id="cifras-t" class="eyebrow c-stats__t">Plato &amp; Co. en cifras</h2>
          <div class="c-stats__row">
            ${cifra(state.sucursales.length, { etiqueta: 'sucursales en Ciudad de Panamá', animar })}
            ${cifra(12, { unidad: 'min', unidadSr: 'minutos', etiqueta: 'en cocina, en promedio', animar })}
            ${cifra(state.productos.length, { etiqueta: 'platos en la carta', animar })}
            ${cifra(4.8, { dec: 1, unidad: '★', unidadSr: '', etiqueta: 'de 5 en 2.140 reseñas', animar })}
          </div>
          <p class="c-stats__nota">Cifras ficticias de la demostración.</p>
        </div>
      </section>

      <div data-dia></div>

      <section class="c-sec c-combos" aria-labelledby="combos-t">
        <div class="container--wide">
          ${cabeza('combos-t', 'Para resolver rápido', 'Combos con *ahorro*', `<a class="btn btn--ghost" href="#/menu?c=combos">Ver en el menú <span aria-hidden="true">→</span></a>`, rv)}
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

      <section class="c-cta" aria-labelledby="cta-t">
        <div class="container--wide c-cta__in">
          <h2 id="cta-t" class="c-cta__t">¿Con hambre?</h2>
          <p class="c-cta__lead">Pida en línea para entrega o retiro, o escríbanos y el asistente arma su pedido.</p>
          <div class="c-cta__acc">
            <a class="btn btn--accent btn--lg" href="#/menu">Ver menú y pedir <span aria-hidden="true">→</span></a>
            <a class="btn btn--wa btn--lg" href="#/chat">${icono('whatsapp', { tam: 20 })}<span>Pedir por WhatsApp</span></a>
          </div>
        </div>
      </section>`;
    nodo.querySelector('[data-picker]').append(branchPicker(store, () => pintarSucursal(), { variante: 'fotos' }));
    pintarSucursal({ rv });
    bindAdd(nodo.querySelector('[data-destacados]'), store);
    bindCombos(nodo.querySelector('[data-combos]'), store);
  }
  pintar();
  const offVideo = montarHeroVideo(nodo.querySelector('[data-hero-video]'));
  const offMorph = textMorph(nodo.querySelector('[data-morph]'), PALABRAS);
  const offRelleno = rellenoAlScroll(nodo.querySelector('[data-relleno]'));
  const off = store.on('menu:cambio', () => pintarSucursal());
  return () => { off(); offVideo(); offMorph(); offRelleno(); };
}
