import { esc, money } from './dom.js';
import { cart } from './cart-singleton.js';

const cap = (m) => m.charAt(0).toUpperCase() + m.slice(1);

// Pinta el carrito dentro de `cont` y lo mantiene al día con el store. Devuelve la función para dejar de escuchar.
export function montarPanelCarrito(cont, store, { onContinuar } = {}) {
  cont.classList.add('cart-panel');
  function pintar() {
    const foco = document.activeElement?.dataset?.fk;
    const state = store.get();
    const items = cart.items();
    const t = cart.totals();
    const filas = items.map((l, i) => {
      const p = state.productos.find((x) => x.id === l.productoId);
      if (!p) return '';
      return `
        <li class="cart-linea">
          <div class="cart-info">
            <strong>${esc(p.nombre)}</strong>
            ${l.modificadores.length ? `<span class="cart-mods">${l.modificadores.map((m) => esc(cap(m))).join(' · ')}</span>` : ''}
            <span class="cart-precio">${money(p.precio * l.cantidad)}</span>
          </div>
          <div class="stepper stepper-sm" role="group" aria-label="Cantidad de ${esc(p.nombre)}">
            <button type="button" data-q="${i}" data-d="-1" data-fk="m${i}" aria-label="Quitar una de ${esc(p.nombre)}">−</button>
            <span aria-live="polite">${l.cantidad}</span>
            <button type="button" data-q="${i}" data-d="1" data-fk="p${i}" aria-label="Agregar una más de ${esc(p.nombre)}">+</button>
          </div>
          <button type="button" class="link-btn" data-rm="${i}" data-fk="r${i}" aria-label="Eliminar ${esc(p.nombre)}">Eliminar</button>
        </li>`;
    }).join('');
    cont.innerHTML = `
      <h2 class="cart-titulo">Su pedido</h2>
      ${items.length ? `<ul class="cart-lista">${filas}</ul>
        <dl class="totales">
          <div><dt>Subtotal</dt><dd>${money(t.subtotal)}</dd></div>
          <div><dt>ITBMS 7%</dt><dd>${money(t.itbms)}</dd></div>
          <div class="total"><dt>Total</dt><dd>${money(t.total)}</dd></div>
        </dl>
        <a class="btn btn-primario btn-bloque" href="#/carrito" data-continuar>Continuar al pago</a>`
        : `<p class="vacio">Aún no ha agregado nada. Elija algo rico del menú.</p>`}`;
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
