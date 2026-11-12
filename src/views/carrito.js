import { store } from '../core/app-store.js';
import { assignBranch, createOrder, payOrder } from '../core/orders.js';
import { el, esc, money, irA } from '../ui/dom.js';
import { cart } from '../ui/cart-singleton.js';
import { precioHTML, miniProducto } from '../ui/product-card.js';
import { avisoSucursalCerrada, estadoSucursal } from '../core/horario.js';
import { enlacePedido } from '../core/pedido-ref.js';
import { fotoEscena } from '../ui/photo.js';
import { icono } from '../ui/icons.js';
import { cuentaTexto, claveFotoSucursal, nombreCorto } from './compra-util.js';

const METODOS = [
  ['yappy', 'Yappy', 'Pago desde su celular'],
  ['tarjeta', 'Tarjeta', 'Débito o crédito'],
  ['efectivo', 'Efectivo', 'Pague al recibir o al retirar'],
];
const TIPOS = [
  ['entrega', 'Entrega a domicilio', 'Lo llevamos a su puerta', 'en-camino'],
  ['retiro', 'Retiro en sucursal', 'Sin costo y sin espera de ruta', 'retiro'],
];
const cap = (m) => m.charAt(0).toUpperCase() + m.slice(1);
const rangoRetiro = (s) => [s.etaBaseMin - 10 > 0 ? s.etaBaseMin - 10 : 15, s.etaBaseMin - 5];
const chipZona = (suc, zona, dir) => (suc
  ? `<span class="ck-chip ck-chip--ok">${icono('check', { tam: 18 })} Le atiende ${esc(suc.nombre)} · llega en unos ${zona.etaMin} min</span>`
  : dir ? `<span class="ck-chip ck-chip--warn">${icono('alerta', { tam: 18 })} No encontramos esa zona en nuestra cobertura</span>` : '');

// Paso numerado: numeral Anton (decorativo) + título DM Sans 600. Va en <legend> si el paso es un grupo de radios.
const cabPaso = (n, titulo, tag = 'legend') => `<${tag} class="ck-paso__cab"><span class="ck-paso__n" aria-hidden="true">${n}</span><span class="ck-paso__t">${titulo}</span></${tag}>`;

export function vistaCarrito(main) {
  const nodo = el('<div class="carrito-vista"></div>');
  main.append(nodo);
  // Estado del formulario que debe sobrevivir a repintados.
  const form = { tipo: 'entrega', direccion: '', metodo: 'tarjeta' };
  let aviso = null; // {tipo:'agotado'|'sin_zona'|'error', ...}
  let enviando = false; // evita el doble envío

  function lineasHTML(state) {
    return cart.items().map((l) => {
      const p = state.productos.find((x) => x.id === l.productoId);
      if (!p) return '';
      return `<li class="ck-linea">${miniProducto(p)}<span class="ck-linea__n"><strong><span class="ck-linea__q">${l.cantidad}×</span> ${esc(p.nombre)}</strong>${l.modificadores.length ? `<small>${l.modificadores.map((m) => esc(cap(m))).join(' · ')}</small>` : ''}</span><span class="ck-linea__p">${money(p.precio * l.cantidad)}</span></li>`;
    }).join('');
  }

  function sucursalesHTML(state) {
    const actual = state.ui.sucursalCliente;
    const ahora = new Date();
    return `<fieldset class="ck-sucs">
      <legend class="sr-only">Sucursal de retiro</legend>
      <div class="ck-sucs__grupo">${state.sucursales.map((s, i) => {
        const st = estadoSucursal(s.horario, ahora);
        const [desde, hasta] = rangoRetiro(s);
        const clave = claveFotoSucursal(state, s.id);
        return `<label class="ck-suc">
          <input type="radio" name="sucursal-cliente" value="${esc(s.id)}" ${s.id === actual ? 'checked' : ''}>
          <span class="ck-suc__foto">${fotoEscena(clave, { ratio: '4/3', alt: '', clase: clave === 'sucursal_1' ? 'foto--warm' : '' })}<span class="ck-suc__marca" aria-hidden="true">${icono('check', { tam: 16 })}<span class="ck-suc__marca-l">Su sucursal</span><span class="ck-suc__marca-c">Elegida</span></span></span>
          <span class="ck-suc__n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          <span class="ck-suc__nombre">${esc(nombreCorto(s))}</span>
          <span class="ck-suc__dato">${esc(s.direccion)}</span>
          <span class="suc-estado${st.abierto ? ' is-abierto' : ''}">${esc(st.abierto ? 'Abierto' : 'Cerrado')}<span>${esc(st.detalle)}</span></span>
          <span class="ck-suc__eta">Listo en ${desde}–${hasta} min</span>
        </label>`;
      }).join('')}</div>
    </fieldset>`;
  }

  function avisoHTML() {
    if (!aviso) return '';
    if (aviso.tipo === 'agotado') {
      return `<div class="ck-aviso" role="alert" tabindex="-1" data-aviso>
        <p class="ck-aviso__t">${icono('alerta', { tam: 20 })} Algo se agotó en esa sucursal.</p>
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
        <p class="ck-aviso__t">${icono('alerta', { tam: 20 })} Todavía no llegamos a esa dirección.</p>
        <p>Puede retirar su pedido en la sucursal que elija.</p>
        <button type="button" class="btn btn--ghost btn--sm" data-a-retiro>Cambiar a retiro</button></div>`;
    }
    return `<div class="ck-aviso" role="alert" tabindex="-1" data-aviso><p class="ck-aviso__t">${icono('alerta', { tam: 20 })} ${esc(aviso.mensaje)}</p></div>`;
  }

  function pintar() {
    const state = store.get();
    const items = cart.items();
    if (!items.length) {
      nodo.innerHTML = `
        <section class="ck-vacio container--wide">
          <div class="ck-vacio__txt">
            <p class="eyebrow">Su pedido</p>
            <h1 class="ck-titulo">Aún está vacío</h1>
            <p class="t-lead">Todavía no ha elegido nada. La carta tiene 40 platos hechos al momento.</p>
            <a class="btn btn--lg" href="#/menu">Ver la carta <span aria-hidden="true">→</span></a>
          </div>
          ${fotoEscena('delivery', { ratio: '4/3', alt: '', clase: 'ck-vacio__foto' })}
        </section>`;
      return;
    }
    const t = cart.totals();
    const n = cart.count();
    const suc = state.sucursales.find((s) => s.id === state.ui.sucursalCliente) ?? state.sucursales[0];
    const zona = form.tipo === 'entrega' && form.direccion.trim() ? assignBranch(state, form.direccion) : null;
    const sucZona = zona ? state.sucursales.find((s) => s.id === zona.sucursalId) : null;
    const cerrada = avisoSucursalCerrada(form.tipo === 'retiro' ? suc : sucZona);
    const [desde, hasta] = rangoRetiro(suc);

    nodo.innerHTML = `
      <header class="ck-cab container--wide">
        <p class="eyebrow">Paso final · ${cuentaTexto(n)}</p>
        <h1 class="ck-titulo">Su pedido</h1>
      </header>
      <div class="ck-grid container--wide">
        <form class="ck-form" novalidate data-form>
          <fieldset class="ck-paso">
            ${cabPaso('01', '¿Cómo lo quiere?')}
            <div class="seg">
              ${TIPOS.map(([v, nom, d, ico]) => `<label class="seg__op"><input type="radio" name="tipo" value="${v}" ${form.tipo === v ? 'checked' : ''}><span>${icono(ico, { tam: 24 })}<span class="seg__t">${nom}</span><span class="seg__d">${d}</span></span></label>`).join('')}
            </div>
          </fieldset>

          ${form.tipo === 'entrega' ? `
          <div class="ck-paso">
            ${cabPaso('02', '¿A dónde lo llevamos?', 'h2')}
            <div class="field">
              <label class="label" for="direccion">Dirección de entrega</label>
              <input class="input" id="direccion" name="direccion" type="text" autocomplete="street-address" placeholder="Calle, casa o edificio y barrio" value="${esc(form.direccion)}" aria-describedby="dir-ayuda">
              <p id="dir-ayuda" class="help">Incluya su barrio. Zonas de ejemplo: ${esc([...new Set(state.sucursales.flatMap((s) => s.zonasEntrega))].join(', '))}.</p>
            </div>
            <div class="asignada" aria-live="polite">${chipZona(sucZona, zona, form.direccion.trim())}</div>
          </div>` : `
          <div class="ck-paso">
            ${cabPaso('02', '¿Dónde lo retira?', 'h2')}
            ${sucursalesHTML(state)}
            <p class="ck-chip ck-chip--ok">${icono('reloj', { tam: 18 })} Listo en unos ${desde} a ${hasta} min en ${esc(suc.nombre)}</p>
          </div>`}

          <fieldset class="ck-paso">
            ${cabPaso('03', 'Forma de pago')}
            <div class="pago-ops">
              ${METODOS.map(([v, nom, d]) => `<label class="pago-op"><input type="radio" name="metodo" value="${v}" ${form.metodo === v ? 'checked' : ''}><span class="pago-op__t">${nom}</span><span class="pago-op__d">${d}</span></label>`).join('')}
            </div>
            <p class="ck-sim"><strong>Pago simulado</strong> · Datos ficticios · No ingrese información real</p>
          </fieldset>

          <div class="ck-final">
            ${cerrada ? `<p class="ck-chip ck-chip--warn ck-cerrada" role="status">${icono('alerta', { tam: 18 })} <span>${esc(cerrada)}</span></p>` : ''}
            ${avisoHTML()}
            <button type="submit" class="btn btn--lg btn--block ck-enviar"${enviando ? ' disabled' : ''}>Confirmar pedido · ${money(t.total)}</button>
          </div>
        </form>

        <aside class="ck-resumen" aria-labelledby="ck-res-t">
          <div class="ck-resumen__cab"><h2 class="ck-resumen__t" id="ck-res-t">Resumen</h2><span class="ck-resumen__n">${cuentaTexto(n)}</span></div>
          <ul class="ck-lineas">${lineasHTML(state)}</ul>
          <dl class="totales">
            <div><dt>Subtotal</dt><dd>${money(t.subtotal)}</dd></div>
            <div><dt>ITBMS 7%</dt><dd>${money(t.itbms)}</dd></div>
            <div class="totales__total"><dt>Total</dt><dd>${precioHTML(t.total, 'totales__cifra')}</dd></div>
          </dl>
          <a class="ck-seguir" href="#/menu">${icono('flecha', { tam: 18 })} Seguir pidiendo</a>
        </aside>
      </div>`;
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
    if (e.target.name === 'sucursal-cliente') {
      const v = e.target.value;
      aviso = null;
      store.update((s) => { s.ui.sucursalCliente = v; }); // el store repinta la vista
      nodo.querySelector(`input[name="sucursal-cliente"][value="${CSS.escape(v)}"]`)?.focus();
    }
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
    if (enviando) return;
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
    enviando = true;
    const r = createOrder(store, draft);
    if (!r.ok) {
      enviando = false;
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
      enviando = false;
      aviso = { tipo: 'error', mensaje: 'No pudimos registrar el pago simulado. Intente de nuevo.' };
      pintar();
      return;
    }
    // Solo tras el éxito se vacía el carrito y se lleva al seguimiento.
    const pedido = store.get().pedidos.find((p) => p.id === r.pedido.id) ?? r.pedido;
    cart.clear();
    irA(enlacePedido(pedido));
  });

  pintar();
  // Si el carrito cambia desde fuera (p. ej. reiniciar demo) se repinta, salvo mientras se escribe o tras enviar.
  const off = store.subscribe(() => {
    if (enviando) return;
    if (nodo.contains(document.activeElement) && document.activeElement.tagName === 'INPUT' && document.activeElement.type === 'text') return;
    pintar();
  });
  return off;
}
