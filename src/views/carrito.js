import { store } from '../core/app-store.js';
import { assignBranch, createOrder, payOrder } from '../core/orders.js';
import { el, esc, money, irA } from '../ui/dom.js';
import { branchPicker } from '../ui/branch-picker.js';
import { cart } from '../ui/cart-singleton.js';

const METODOS = [
  ['yappy', 'Yappy', 'Pago desde su celular'],
  ['tarjeta', 'Tarjeta', 'Débito o crédito'],
  ['efectivo', 'Efectivo contra entrega', 'Pague al recibir o al retirar'],
];
const cap = (m) => m.charAt(0).toUpperCase() + m.slice(1);

export function vistaCarrito(main) {
  const nodo = el('<div class="carrito-vista"></div>');
  main.append(nodo);
  // Estado del formulario que debe sobrevivir a repintados.
  const form = { tipo: 'entrega', direccion: '', metodo: 'tarjeta' };
  let aviso = null; // {tipo:'agotado'|'sin_zona'|'error', ...}

  function lineasHTML(state) {
    return cart.items().map((l) => {
      const p = state.productos.find((x) => x.id === l.productoId);
      if (!p) return '';
      return `<li><span><strong>${l.cantidad} × ${esc(p.nombre)}</strong>${l.modificadores.length ? `<br><small>${l.modificadores.map((m) => esc(cap(m))).join(' · ')}</small>` : ''}</span><span>${money(p.precio * l.cantidad)}</span></li>`;
    }).join('');
  }

  function avisoHTML() {
    if (!aviso) return '';
    if (aviso.tipo === 'agotado') {
      return `<div class="aviso aviso-error" role="alert" tabindex="-1" data-aviso>
        <strong>Algo se agotó en esa sucursal.</strong>
        ${aviso.agotados.map((a) => `
          <div class="agotado">
            <p>“${esc(a.nombre)}” no está disponible ahora.</p>
            ${a.alternativas.length ? `<p>Puede cambiarlo por:</p><div class="alt-botones">${a.alternativas.map((alt) => `<button type="button" class="btn btn-sec" data-swap="${esc(a.id)}" data-por="${esc(alt.id)}">${esc(alt.nombre)}</button>`).join('')}</div>` : '<p>No hay alternativas similares ahora.</p>'}
            <button type="button" class="link-btn" data-quitar="${esc(a.id)}">Quitarlo del pedido</button>
          </div>`).join('')}
      </div>`;
    }
    if (aviso.tipo === 'sin_zona') {
      return `<div class="aviso aviso-error" role="alert" tabindex="-1" data-aviso>
        <strong>Todavía no llegamos a esa dirección.</strong>
        <p>Puede retirar su pedido en la sucursal que elija.</p>
        <button type="button" class="btn btn-sec" data-a-retiro>Cambiar a retiro</button></div>`;
    }
    return `<div class="aviso aviso-error" role="alert" tabindex="-1" data-aviso>${esc(aviso.mensaje)}</div>`;
  }

  function pintar() {
    const state = store.get();
    const items = cart.items();
    if (!items.length) {
      nodo.innerHTML = `
        <div class="vacio-grande">
          <h1>Su pedido está vacío</h1>
          <p>Aún no ha elegido nada. El menú tiene mucho que ofrecerle.</p>
          <a class="btn btn-primario btn-grande" href="#/menu">Ver el menú</a>
        </div>`;
      return;
    }
    const t = cart.totals();
    const suc = state.sucursales.find((s) => s.id === state.ui.sucursalCliente) ?? state.sucursales[0];
    const zona = form.tipo === 'entrega' && form.direccion.trim() ? assignBranch(state, form.direccion) : null;
    const sucZona = zona ? state.sucursales.find((s) => s.id === zona.sucursalId) : null;

    nodo.innerHTML = `
      <h1>Su pedido</h1>
      <div class="carrito-grid">
        <form class="carrito-form" novalidate data-form>
          <fieldset class="bloque">
            <legend>1. ¿Cómo lo quiere?</legend>
            <div class="opciones-fila">
              <label class="opcion-tarjeta"><input type="radio" name="tipo" value="entrega" ${form.tipo === 'entrega' ? 'checked' : ''}><span><strong>Entrega a domicilio</strong><small>Lo llevamos a su puerta</small></span></label>
              <label class="opcion-tarjeta"><input type="radio" name="tipo" value="retiro" ${form.tipo === 'retiro' ? 'checked' : ''}><span><strong>Retiro en sucursal</strong><small>Sin costo y sin espera de ruta</small></span></label>
            </div>
          </fieldset>

          ${form.tipo === 'entrega' ? `
          <div class="bloque">
            <h2 class="bloque-t">2. ¿A dónde lo llevamos?</h2>
            <div class="campo">
              <label for="direccion">Dirección de entrega</label>
              <input id="direccion" name="direccion" type="text" autocomplete="street-address" placeholder="Calle, casa o edificio y barrio" value="${esc(form.direccion)}" aria-describedby="dir-ayuda">
              <p id="dir-ayuda" class="ayuda">Incluya su barrio. Zonas de ejemplo: ${esc([...new Set(state.sucursales.flatMap((s) => s.zonasEntrega))].join(', '))}.</p>
            </div>
            <div class="asignada" aria-live="polite">
              ${sucZona ? `<span class="chip chip-ok">Le atiende ${esc(sucZona.nombre)} · llega en unos ${zona.etaMin} min</span>`
                : form.direccion.trim() ? '<span class="chip chip-warn">No encontramos esa zona en nuestra cobertura</span>' : ''}
            </div>
          </div>` : `
          <div class="bloque">
            <h2 class="bloque-t">2. ¿Dónde lo retira?</h2>
            <div data-picker></div>
            <p class="ayuda">Listo en unos ${suc.etaBaseMin - 10 > 0 ? suc.etaBaseMin - 10 : 15} a ${suc.etaBaseMin - 5} min aproximadamente. Retira en ${esc(suc.direccion)}.</p>
          </div>`}

          <fieldset class="bloque">
            <legend>3. Forma de pago</legend>
            <div class="opciones-col">
              ${METODOS.map(([v, n, d]) => `<label class="opcion-tarjeta"><input type="radio" name="metodo" value="${v}" ${form.metodo === v ? 'checked' : ''}><span><strong>${n}</strong><small>${d}</small></span></label>`).join('')}
            </div>
            <p class="aviso-sim"><strong>Pago simulado</strong> · Datos ficticios · No ingrese información real</p>
          </fieldset>

          ${avisoHTML()}
          <button type="submit" class="btn btn-primario btn-grande btn-bloque">Confirmar pedido · ${money(t.total)}</button>
        </form>

        <aside class="resumen" aria-label="Resumen del pedido">
          <h2>Resumen</h2>
          <ul class="resumen-lineas">${lineasHTML(state)}</ul>
          <dl class="totales">
            <div><dt>Subtotal</dt><dd>${money(t.subtotal)}</dd></div>
            <div><dt>ITBMS 7%</dt><dd>${money(t.itbms)}</dd></div>
            <div class="total"><dt>Total</dt><dd>${money(t.total)}</dd></div>
          </dl>
          <a class="link-btn" href="#/menu">Seguir pidiendo</a>
        </aside>
      </div>`;
    const pk = nodo.querySelector('[data-picker]');
    if (pk) pk.append(branchPicker(store, (v) => { aviso = null; pintar(); nodo.querySelector(`input[name="sucursal-cliente"][value="${v}"]`)?.focus(); }));
    if (aviso) nodo.querySelector('[data-aviso]')?.focus();
  }

  nodo.addEventListener('input', (e) => {
    if (e.target.name === 'direccion') {
      form.direccion = e.target.value;
      // Repinta solo el chip de zona, sin perder el foco del campo.
      const zona = form.direccion.trim() ? assignBranch(store.get(), form.direccion) : null;
      const suc = zona && store.get().sucursales.find((s) => s.id === zona.sucursalId);
      nodo.querySelector('.asignada').innerHTML = suc
        ? `<span class="chip chip-ok">Le atiende ${esc(suc.nombre)} · llega en unos ${zona.etaMin} min</span>`
        : form.direccion.trim() ? '<span class="chip chip-warn">No encontramos esa zona en nuestra cobertura</span>' : '';
    }
  });
  nodo.addEventListener('change', (e) => {
    if (e.target.name === 'tipo') { form.tipo = e.target.value; aviso = null; pintar(); nodo.querySelector(`input[name="tipo"][value="${form.tipo}"]`)?.focus(); }
    if (e.target.name === 'metodo') form.metodo = e.target.value;
  });
  nodo.addEventListener('click', (e) => {
    const swap = e.target.closest('[data-swap]');
    if (swap) { cart.replaceProduct(swap.dataset.swap, swap.dataset.por); aviso = null; pintar(); return; }
    const quitar = e.target.closest('[data-quitar]');
    if (quitar) { cart.removeProduct(quitar.dataset.quitar); aviso = null; pintar(); return; }
    if (e.target.closest('[data-a-retiro]')) { form.tipo = 'retiro'; aviso = null; pintar(); }
  });
  nodo.addEventListener('submit', (e) => {
    e.preventDefault();
    const state = store.get();
    const draft = { canal: 'web', lineas: cart.items(), tipo: form.tipo };
    if (form.tipo === 'entrega') {
      draft.direccion = form.direccion.trim();
      if (!draft.direccion) {
        aviso = { tipo: 'error', mensaje: 'Escriba la dirección de entrega o cambie a retiro en sucursal.' };
        pintar(); return;
      }
    } else {
      draft.sucursalId = state.ui.sucursalCliente;
    }
    const r = createOrder(store, draft);
    if (!r.ok) {
      if (r.razon === 'agotado') aviso = { tipo: 'agotado', agotados: r.detalle.agotados };
      else if (r.razon === 'sin_zona') aviso = { tipo: 'sin_zona' };
      else if (r.razon === 'vacio') aviso = { tipo: 'error', mensaje: 'Su pedido está vacío.' };
      else aviso = { tipo: 'error', mensaje: 'No pudimos procesar el pedido. Revise las cantidades e intente de nuevo.' };
      pintar();
      return;
    }
    try {
      payOrder(store, r.pedido.id, form.metodo);
    } catch {
      aviso = { tipo: 'error', mensaje: 'No pudimos registrar el pago simulado. Intente de nuevo.' };
      pintar();
      return;
    }
    cart.clear();
    irA(`#/pedido/${r.pedido.id}`);
  });

  pintar();
  // Si el carrito cambia desde fuera (p. ej. reiniciar demo) se repinta, salvo mientras se escribe.
  const off = store.subscribe(() => {
    if (nodo.contains(document.activeElement) && document.activeElement.tagName === 'INPUT' && document.activeElement.type === 'text') return;
    pintar();
  });
  return off;
}
