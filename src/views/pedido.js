import { store } from '../core/app-store.js';
import { ESTADOS, priceOrder } from '../core/orders.js';
import { el, esc, money } from '../ui/dom.js';
import { precioHTML } from '../ui/product-card.js';
import { dishArt } from '../ui/dish-art.js';

const cap = (m) => m.charAt(0).toUpperCase() + m.slice(1);
const hora = (iso) => new Date(iso).toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Panama' });
const METODO = { yappy: 'Yappy', tarjeta: 'Tarjeta', efectivo: 'Efectivo' };

export function vistaPedido(main, { id }) {
  const nodo = el('<div class="pedido-vista"></div>');
  main.append(nodo);

  function pintar() {
    const state = store.get();
    const p = state.pedidos.find((x) => x.id === id);
    if (!p) {
      nodo.innerHTML = `
        <section class="ck-vacio container--wide">
          <p class="eyebrow">Seguimiento</p>
          <h1 class="ck-titulo">No encontramos ese pedido</h1>
          <p class="t-lead">Puede que el enlace esté incompleto o que la demo se haya reiniciado.</p>
          <a class="btn btn--lg" href="#/menu">Ir al menú <span aria-hidden="true">→</span></a>
        </section>`;
      return;
    }
    const flujo = p.tipo === 'retiro' ? ESTADOS.filter((e) => e !== 'En camino') : ESTADOS;
    const idx = flujo.indexOf(p.estado);
    const t = priceOrder(state, p.lineas);
    const suc = state.sucursales.find((s) => s.id === p.sucursalId);
    const pasos = flujo.map((e, i) => {
      const h = p.historial?.find((x) => x.estado === e);
      const cls = i < idx ? 'is-hecho' : i === idx ? 'is-actual' : 'is-pendiente';
      const marca = i < idx ? '✓ Hecho' : i === idx ? 'Ahora' : 'Pendiente';
      return `<li class="pd-paso ${cls}"${i === idx ? ' aria-current="step"' : ''}>
        <span class="pd-paso__n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <span class="pd-paso__t">${esc(e)}</span>
        <span class="pd-paso__m">${marca}${h ? ` · ${hora(h.en)}` : ''}</span>
      </li>`;
    }).join('');
    const entregado = p.estado === 'Entregado';
    const mensaje = entregado ? '¡Buen provecho! Su pedido fue entregado.'
      : p.estado === 'Listo' && p.tipo === 'retiro' ? 'Su pedido está listo para retirar.'
      : p.estado === 'En camino' ? 'Su pedido va en camino.'
      : p.estado === 'En cocina' ? 'Estamos preparando su pedido.'
      : 'Recibimos su pedido.';

    nodo.innerHTML = `
      <section class="pd-hero band band--dark on-dark grain" aria-labelledby="pd-t">
        <div class="container--wide">
          <p class="pd-migas"><a href="#/menu">← Seguir en el menú</a></p>
          <div class="pd-hero__top">
            <div>
              <h1 id="pd-t" class="pd-titulo"><span class="pd-titulo__id">Pedido ${esc(p.id)} · ${p.tipo === 'retiro' ? 'Retiro' : 'Entrega'}</span> <span class="pd-titulo__estado">${esc(p.estado)}</span></h1>
              <p class="pd-msg" role="status" aria-live="polite">${mensaje}${p.etaMin && !entregado ? ` Tiempo estimado: unos ${p.etaMin} min.` : ''}</p>
            </div>
            ${p.etaMin && !entregado ? `<div class="pd-eta" aria-hidden="true"><span class="pd-eta__num">${p.etaMin}<span>min</span></span><span class="pd-eta__lbl">tiempo estimado · ${esc(suc?.nombre ?? '')}</span></div>` : ''}
          </div>
          <ol class="pd-pasos" aria-label="Estado del pedido">${pasos}</ol>
        </div>
      </section>
      <div class="pd-grid container--wide">
        <section class="pd-bloque" aria-labelledby="ped-det">
          <h2 id="ped-det" class="pd-bloque__t">Su pedido</h2>
          <ul class="ck-lineas">
            ${p.lineas.map((l) => {
              const pr = state.productos.find((x) => x.id === l.productoId);
              if (!pr) return '';
              return `<li><span class="ck-linea__art">${dishArt(pr)}</span><span class="ck-linea__q">${l.cantidad}×</span><span class="ck-linea__n"><strong>${esc(pr.nombre)}</strong>${l.modificadores?.length ? `<small>${l.modificadores.map((m) => esc(cap(m))).join(' · ')}</small>` : ''}</span><span class="ck-linea__p">${money(pr.precio * l.cantidad)}</span></li>`;
            }).join('')}
          </ul>
          <dl class="totales">
            <div><dt>Subtotal</dt><dd>${money(t.subtotal)}</dd></div>
            <div><dt>ITBMS 7%</dt><dd>${money(t.itbms)}</dd></div>
            <div class="totales__total"><dt>Total</dt><dd>${precioHTML(t.total, 'totales__cifra')}</dd></div>
          </dl>
        </section>
        <section class="pd-bloque" aria-labelledby="ped-info">
          <h2 id="ped-info" class="pd-bloque__t">Detalles</h2>
          <dl class="pd-datos">
            <div><dt>${p.tipo === 'retiro' ? 'Retiro en' : 'Prepara'}</dt><dd>${esc(suc?.nombre ?? '')}${p.tipo === 'retiro' && suc ? `<small>${esc(suc.direccion)}</small>` : ''}</dd></div>
            ${p.tipo === 'entrega' ? `<div><dt>Entrega en</dt><dd>${esc(p.direccion ?? '')}</dd></div>` : ''}
            ${p.etaMin && !entregado ? `<div><dt>Tiempo estimado</dt><dd>unos ${p.etaMin} min</dd></div>` : ''}
            <div><dt>Pago</dt><dd>${esc(METODO[p.pago?.metodo] ?? 'Pendiente')} · ${esc(p.pago?.estado ?? '')} <small>Pago simulado</small></dd></div>
          </dl>
          ${entregado && p.factura ? `
            <div class="pd-factura on-dark">
              <div class="pd-factura__cab"><h3>Factura electrónica</h3><span class="badge badge--gold">Simulada</span></div>
              <p class="pd-factura__id">${esc(p.factura.id)}</p>
              <p class="pd-factura__cufe"><span>CUFE · SIMULADO</span>${esc(p.factura.cufe)}</p>
              <p class="pd-factura__nota">Documento de demostración: no tiene validez fiscal ni se envió a la DGI.</p>
            </div>` : `
            <p class="pd-factura-pend">La factura electrónica se emite cuando su pedido se entrega <span>(simulada en esta demo)</span>.</p>`}
        </section>
      </div>`;
  }
  pintar();
  const off = store.subscribe(pintar);
  return off;
}
