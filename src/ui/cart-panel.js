import { esc, money } from './dom.js';
import { cart } from './cart-singleton.js';
import { precioHTML, miniProducto } from './product-card.js';
import { icono } from './icons.js';
import { cuentaTexto } from '../views/compra-util.js';

const cap = (m) => m.charAt(0).toUpperCase() + m.slice(1);

// Pinta el carrito dentro de `cont` y lo mantiene al día con el store. Devuelve la función para dejar de escuchar.
// Mismo contenido en el carrito lateral (escritorio) y en la hoja inferior (celular).
export function montarPanelCarrito(cont, store, { onContinuar } = {}) {
  cont.classList.add('cart-panel');
  function pintar() {
    const foco = cont.contains(document.activeElement) ? document.activeElement.dataset?.fk : null;
    const state = store.get();
    const items = cart.items();
    const t = cart.totals();
    const n = cart.count();
    const filas = items.map((l, i) => {
      const p = state.productos.find((x) => x.id === l.productoId);
      if (!p) return '';
      const nom = esc(p.nombre);
      return `
        <li class="cart-linea">
          <span class="cart-linea__foto">${miniProducto(p)}</span>
          <div class="cart-linea__info">
            <span class="cart-linea__nom">${nom}</span>
            ${l.modificadores.length ? `<span class="cart-linea__mods">${l.modificadores.map((m) => esc(cap(m))).join(' · ')}</span>` : ''}
            <div class="cart-linea__ctrl">
              <div class="stepper stepper--sm" role="group" aria-label="Cantidad de ${nom}">
                <button type="button" data-q="${i}" data-d="-1" data-fk="m${i}" aria-label="${l.cantidad === 1 ? 'Quitar' : 'Una menos de'} ${nom}"><span aria-hidden="true">−</span></button>
                <span aria-live="polite">${l.cantidad}</span>
                <button type="button" data-q="${i}" data-d="1" data-fk="p${i}" aria-label="Una más de ${nom}"${l.cantidad >= 20 ? ' disabled' : ''}><span aria-hidden="true">+</span></button>
              </div>
              <button type="button" class="link-btn cart-linea__rm" data-rm="${i}" data-fk="r${i}" aria-label="Eliminar ${nom}">Eliminar</button>
            </div>
          </div>
          <span class="cart-linea__precio">${money(p.precio * l.cantidad)}</span>
        </li>`;
    }).join('');
    cont.innerHTML = `
      <div class="cart-panel__head"><h2 class="cart-panel__t" tabindex="-1">Su pedido</h2><span class="cart-panel__n">${cuentaTexto(n)}</span></div>
      ${items.length ? `<ul class="cart-panel__lista">${filas}</ul>
        <dl class="totales">
          <div><dt>Subtotal</dt><dd>${money(t.subtotal)}</dd></div>
          <div><dt>ITBMS 7%</dt><dd>${money(t.itbms)}</dd></div>
          <div class="totales__total"><dt>Total</dt><dd>${precioHTML(t.total, 'totales__cifra')}</dd></div>
        </dl>
        <div class="cart-panel__cta"><a class="btn btn--lg btn--block btn--brillo" href="#/carrito" data-continuar>Continuar al pago <span aria-hidden="true">→</span></a></div>`
        : `<div class="cart-panel__vacio">${icono('bolsa', { tam: 28 })}<p><strong>Aún no ha agregado nada.</strong></p><p>Toque «Agregar» en un plato y aparecerá aquí.</p></div>`}`;
    // Conserva el foco del teclado tras repintar; si la línea desapareció, lo deja en la siguiente o en el título.
    if (foco) (cont.querySelector(`[data-fk="${foco}"]`) ?? cont.querySelector('[data-fk]') ?? cont.querySelector('.cart-panel__t'))?.focus();
  }
  cont.addEventListener('click', (e) => {
    const q = e.target.closest('[data-q]');
    if (q) { const i = Number(q.dataset.q); cart.setQty(i, (cart.items()[i]?.cantidad ?? 0) + Number(q.dataset.d)); return; }
    const r = e.target.closest('[data-rm]');
    if (r) { cart.remove(Number(r.dataset.rm)); return; }
    if (e.target.closest('[data-continuar]')) onContinuar?.();
  });
  pintar();
  return store.subscribe(pintar);
}
