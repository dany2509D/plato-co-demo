import { esc, money } from './dom.js';
import { cart } from './cart-singleton.js';
import { precioHTML } from './product-card.js';

const cap = (m) => m.charAt(0).toUpperCase() + m.slice(1);

// Pinta el carrito dentro de `cont` y lo mantiene al día con el store. Devuelve la función para dejar de escuchar.
export function montarPanelCarrito(cont, store, { onContinuar } = {}) {
  cont.classList.add('cart-panel');
  function pintar() {
    const foco = document.activeElement?.dataset?.fk;
    const state = store.get();
    const items = cart.items();
    const t = cart.totals();
    const n = cart.count();
    const filas = items.map((l, i) => {
      const p = state.productos.find((x) => x.id === l.productoId);
      if (!p) return '';
      return `
        <li class="cart-linea">
          <div class="cart-linea__info">
            <strong>${esc(p.nombre)}</strong>
            ${l.modificadores.length ? `<span class="cart-linea__mods">${l.modificadores.map((m) => esc(cap(m))).join(' · ')}</span>` : ''}
          </div>
          <span class="cart-linea__precio">${money(p.precio * l.cantidad)}</span>
          <div class="stepper stepper--sm" role="group" aria-label="Cantidad de ${esc(p.nombre)}">
            <button type="button" data-q="${i}" data-d="-1" data-fk="m${i}" aria-label="Quitar una de ${esc(p.nombre)}">−</button>
            <span aria-live="polite">${l.cantidad}</span>
            <button type="button" data-q="${i}" data-d="1" data-fk="p${i}" aria-label="Agregar una más de ${esc(p.nombre)}">+</button>
          </div>
          <button type="button" class="link-btn cart-linea__rm" data-rm="${i}" data-fk="r${i}" aria-label="Eliminar ${esc(p.nombre)}">Eliminar</button>
        </li>`;
    }).join('');
    cont.innerHTML = `
      <div class="cart-panel__head"><h2 class="cart-panel__t">Su pedido</h2><span class="cart-panel__n">${n} ${n === 1 ? 'producto' : 'productos'}</span></div>
      ${items.length ? `<ul class="cart-panel__lista">${filas}</ul>
        <dl class="totales">
          <div><dt>Subtotal</dt><dd>${money(t.subtotal)}</dd></div>
          <div><dt>ITBMS 7%</dt><dd>${money(t.itbms)}</dd></div>
          <div class="totales__total"><dt>Total</dt><dd>${precioHTML(t.total, 'totales__cifra')}</dd></div>
        </dl>
        <a class="btn btn--lg btn--block" href="#/carrito" data-continuar>Continuar al pago <span aria-hidden="true">→</span></a>`
        : '<p class="cart-panel__vacio">Aún no ha agregado nada.<br>Elija algo rico del menú y aparecerá aquí.</p>'}`;
    if (foco) cont.querySelector(`[data-fk="${foco}"]`)?.focus();
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
