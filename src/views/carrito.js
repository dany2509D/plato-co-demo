import { store } from '../core/app-store.js';
import { assignBranch, createOrder, payOrder } from '../core/orders.js';
import { el, esc, money, irA } from '../ui/dom.js';
import { branchPicker } from '../ui/branch-picker.js';
import { cart } from '../ui/cart-singleton.js';
import { precioHTML } from '../ui/product-card.js';
import { avisoSucursalCerrada } from '../core/horario.js';
import { dishArt } from '../ui/dish-art.js';

const METODOS = [
  ['yappy', 'Yappy', 'Pago desde su celular'],
  ['tarjeta', 'Tarjeta', 'Débito o crédito'],
  ['efectivo', 'Efectivo', 'Pague al recibir o al retirar'],
];
const TIPOS = [['entrega', 'Entrega a domicilio', 'Lo llevamos a su puerta'], ['retiro', 'Retiro en sucursal', 'Sin costo y sin espera de ruta']];
const cap = (m) => m.charAt(0).toUpperCase() + m.slice(1);
const chipZona = (suc, zona, dir) => (suc
  ? `<span class="ck-chip ck-chip--ok"><span aria-hidden="true">✓</span> Le atiende ${esc(suc.nombre)} · llega en unos ${zona.etaMin} min</span>`
  : dir ? '<span class="ck-chip ck-chip--warn"><span aria-hidden="true">!</span> No encontramos esa zona en nuestra cobertura</span>' : '');

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
      return `<li><span class="ck-linea__art">${dishArt(p)}</span><span class="ck-linea__q">${l.cantidad}×</span><span class="ck-linea__n"><strong>${esc(p.nombre)}</strong>${l.modificadores.length ? `<small>${l.modificadores.map((m) => esc(cap(m))).join(' · ')}</small>` : ''}</span><span class="ck-linea__p">${money(p.precio * l.cantidad)}</span></li>`;
    }).join('');
  }

  function avisoHTML() {
    if (!aviso) return '';
    if (aviso.tipo === 'agotado') {
      return `<div class="ck-aviso" role="alert" tabindex="-1" data-aviso>
        <strong>Algo se agotó en esa sucursal.</strong>
        ${aviso.agotados.map((a) => `
          <div class="ck-aviso__item">
            <p>“${esc(a.nombre)}” no está disponible ahora.</p>
            ${a.alternativas.length ? `<p>Puede cambiarlo por:</p><div class="cluster">${a.alternativas.map((alt) => `<button type="button" class="btn btn--ghost btn--sm" data-swap="${esc(a.id)}" data-por="${esc(alt.id)}">${esc(alt.nombre)}</button>`).join('')}</div>` : '<p>No hay alternativas similares ahora.</p>'}
            <button type="button" class="link-btn" data-quitar="${esc(a.id)}">Quitarlo del pedido</button>
          </div>`).join('')}
      </div>`;
    }
    if (aviso.tipo === 'sin_zona') {
      return `<div class="ck-aviso" role="alert" tabindex="-1" data-aviso>
        <strong>Todavía no llegamos a esa dirección.</strong>
        <p>Puede retirar su pedido en la sucursal que elija.</p>
        <button type="button" class="btn btn--ghost btn--sm" data-a-retiro>Cambiar a retiro</button></div>`;
    }
    return `<div class="ck-aviso" role="alert" tabindex="-1" data-aviso>${esc(aviso.mensaje)}</div>`;
  }

  function pintar() {
    const state = store.get();
    const items = cart.items();
    if (!items.length) {
      nodo.innerHTML = `
        <section class="ck-vacio container--wide">
          <p class="eyebrow">Su pedido</p>
          <h1 class="ck-titulo">Aún está vacío</h1>
          <p class="t-lead">Todavía no ha elegido nada. El menú tiene mucho que ofrecerle.</p>
          <a class="btn btn--lg" href="#/menu">Ver el menú <span aria-hidden="true">→</span></a>
        </section>`;
      return;
    }
    const t = cart.totals();
    const n = cart.count();
    const suc = state.sucursales.find((s) => s.id === state.ui.sucursalCliente) ?? state.sucursales[0];
    const zona = form.tipo === 'entrega' && form.direccion.trim() ? assignBranch(state, form.direccion) : null;
    const sucZona = zona ? state.sucursales.find((s) => s.id === zona.sucursalId) : null;
    const cerrada = avisoSucursalCerrada(form.tipo === 'retiro' ? suc : sucZona);
    const desde = suc.etaBaseMin - 10 > 0 ? suc.etaBaseMin - 10 : 15;

    nodo.innerHTML = `
      <header class="ck-cab container--wide">
        <p class="eyebrow">Paso final · ${n} ${n === 1 ? 'producto' : 'productos'}</p>
        <h1 class="ck-titulo">Su pedido</h1>
      </header>
      <div class="ck-grid container--wide">
        <form class="ck-form" novalidate data-form>
          <fieldset class="ck-bloque">
            <legend class="ck-leg"><span class="ck-leg__n" aria-hidden="true">01</span>¿Cómo lo quiere?</legend>
            <div class="seg">
              ${TIPOS.map(([v, nom]) => `<label class="seg__op"><input type="radio" name="tipo" value="${v}" ${form.tipo === v ? 'checked' : ''}><span>${nom}</span></label>`).join('')}
            </div>
            <p class="help">${TIPOS.find(([v]) => v === form.tipo)[2]}.</p>
          </fieldset>

          ${form.tipo === 'entrega' ? `
          <div class="ck-bloque">
            <h2 class="ck-leg"><span class="ck-leg__n" aria-hidden="true">02</span>¿A dónde lo llevamos?</h2>
            <div class="field">
              <label class="label" for="direccion">Dirección de entrega</label>
              <input class="input" id="direccion" name="direccion" type="text" autocomplete="street-address" placeholder="Calle, casa o edificio y barrio" value="${esc(form.direccion)}" aria-describedby="dir-ayuda">
              <p id="dir-ayuda" class="help">Incluya su barrio. Zonas de ejemplo: ${esc([...new Set(state.sucursales.flatMap((s) => s.zonasEntrega))].join(', '))}.</p>
            </div>
            <div class="asignada" aria-live="polite">${chipZona(sucZona, zona, form.direccion.trim())}</div>
          </div>` : `
          <div class="ck-bloque">
            <h2 class="ck-leg"><span class="ck-leg__n" aria-hidden="true">02</span>¿Dónde lo retira?</h2>
            <div data-picker></div>
            <p class="ck-chip ck-chip--ok"><span aria-hidden="true">✓</span> Listo en unos ${desde} a ${suc.etaBaseMin - 5} min en ${esc(suc.nombre)}</p>
          </div>`}

          <fieldset class="ck-bloque">
            <legend class="ck-leg"><span class="ck-leg__n" aria-hidden="true">03</span>Forma de pago</legend>
            <div class="pago-ops">
              ${METODOS.map(([v, nom, d]) => `<label class="pago-op"><input type="radio" name="metodo" value="${v}" ${form.metodo === v ? 'checked' : ''}><span class="pago-op__t">${nom}</span><span class="pago-op__d">${d}</span></label>`).join('')}
            </div>
            <p class="ck-sim"><strong>Pago simulado</strong> · Datos ficticios · No ingrese información real</p>
          </fieldset>

          ${cerrada ? `<p class="ck-chip ck-chip--warn ck-cerrada" role="status"><span aria-hidden="true">!</span> ${esc(cerrada)}</p>` : ''}
          ${avisoHTML()}
          <button type="submit" class="btn btn--lg btn--block ck-enviar">Confirmar pedido · ${money(t.total)}</button>
        </form>

        <aside class="ck-resumen" aria-label="Resumen del pedido">
          <div class="ck-resumen__cab"><h2 class="ck-resumen__t">Resumen</h2><a class="link-btn" href="#/menu">Seguir pidiendo</a></div>
          <ul class="ck-lineas">${lineasHTML(state)}</ul>
          <dl class="totales">
            <div><dt>Subtotal</dt><dd>${money(t.subtotal)}</dd></div>
            <div><dt>ITBMS 7%</dt><dd>${money(t.itbms)}</dd></div>
            <div class="totales__total"><dt>Total</dt><dd>${precioHTML(t.total, 'totales__cifra')}</dd></div>
          </dl>
        </aside>
      </div>`;
    const pk = nodo.querySelector('[data-picker]');
    if (pk) pk.append(branchPicker(store, (v) => { aviso = null; pintar(); nodo.querySelector(`input[name="sucursal-cliente"][value="${v}"]`)?.focus(); }, { variante: 'tarjetas', leyenda: 'Sucursal de retiro' }));
    if (aviso) nodo.querySelector('[data-aviso]')?.focus();
  }

  nodo.addEventListener('input', (e) => {
    if (e.target.name === 'direccion') {
      form.direccion = e.target.value;
      // Repinta solo el chip de zona, sin perder el foco del campo.
      const zona = form.direccion.trim() ? assignBranch(store.get(), form.direccion) : null;
      const suc = zona && store.get().sucursales.find((s) => s.id === zona.sucursalId);
      nodo.querySelector('.asignada').innerHTML = chipZona(suc, zona, form.direccion.trim());
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
