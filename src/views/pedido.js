import { store } from '../core/app-store.js';
import { el, esc, money } from '../ui/dom.js';
import { precioHTML, miniProducto } from '../ui/product-card.js';
import { pedidoPorId } from '../core/pedido-ref.js';
import { fotoEscena } from '../ui/photo.js';
import { icono, circuloIcono } from '../ui/icons.js';
import { totalesPedido, lineasPedido, pasosSeguimiento, claveFotoSucursal, nombreCorto } from './compra-util.js';

const cap = (m) => m.charAt(0).toUpperCase() + m.slice(1);
const hora = (iso) => new Date(iso).toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Panama' });
const METODO = { yappy: 'Yappy', tarjeta: 'Tarjeta', efectivo: 'Efectivo' };
const MARCA = { hecho: 'Hecho', actual: 'Ahora', pendiente: 'Pendiente' };

export function vistaPedido(main, { id, seed } = {}) {
  const nodo = el('<div class="pedido-vista"></div>');
  main.append(nodo);

  function noEncontrado() {
    nodo.innerHTML = `
      <section class="ck-vacio pd-vacio container--wide">
        <div class="ck-vacio__txt">
          <p class="eyebrow">Seguimiento</p>
          <h1 class="ck-titulo">No encontramos ese pedido</h1>
          <p class="t-lead">Puede que el enlace esté incompleto o que la demo se haya reiniciado y ese pedido ya no exista. Sus pedidos nuevos aparecen aquí apenas los confirma.</p>
          <div class="cluster">
            <a class="btn btn--lg" href="#/menu">Ir a la carta <span aria-hidden="true">→</span></a>
            <a class="btn btn--lg btn--ghost" href="#/chat">Pedir por el asistente</a>
          </div>
        </div>
        ${fotoEscena('delivery', { ratio: '4/3', alt: '', clase: 'ck-vacio__foto' })}
      </section>`;
  }

  function pintar() {
    const state = store.get();
    const p = pedidoPorId(state, id, seed);
    if (!p) { noEncontrado(); return; }
    const pasos = pasosSeguimiento(p);
    const t = totalesPedido(state, p);
    const filas = lineasPedido(state, p);
    const suc = state.sucursales.find((s) => s.id === p.sucursalId);
    const entregado = p.estado === 'Entregado';
    const retiro = p.tipo === 'retiro';
    const mensaje = entregado ? (retiro ? '¡Buen provecho! Ya retiró su pedido.' : '¡Buen provecho! Su pedido fue entregado.')
      : p.estado === 'Listo' && retiro ? 'Su pedido está listo para retirar.'
      : p.estado === 'Listo' ? 'Su pedido está listo y sale en breve.'
      : p.estado === 'En camino' ? 'Su pedido va en camino.'
      : p.estado === 'En cocina' ? 'Estamos preparando su pedido.'
      : 'Recibimos su pedido. La cocina ya lo tiene en pantalla.';
    const horaEntrega = entregado ? p.historial?.find((h) => h.estado === 'Entregado')?.en : null;

    // Cifra grande de la derecha: ETA (entrega en curso), hora de entrega (entregado) o sucursal de retiro.
    let lado = '';
    if (!entregado && p.etaMin) {
      lado = `<div class="pd-eta"><span class="pd-eta__num">${p.etaMin}<span class="pd-eta__u">min</span></span><span class="pd-eta__lbl">tiempo estimado · prepara ${esc(nombreCorto(suc))}</span></div>`;
    } else if (entregado && horaEntrega) {
      lado = `<div class="pd-eta"><span class="pd-eta__num pd-eta__num--hora">${esc(hora(horaEntrega))}</span><span class="pd-eta__lbl">${retiro ? 'retirado' : 'entregado'} a las ${esc(hora(horaEntrega))} · hora de Panamá</span></div>`;
    } else if (retiro && suc) {
      lado = `<div class="pd-eta"><span class="pd-eta__num pd-eta__num--suc">${esc(nombreCorto(suc))}</span><span class="pd-eta__lbl">retire en · ${esc(suc.direccion)}</span></div>`;
    } else if (p.creadoEn) {
      // Entrega sin ETA guardada (pedidos de ejemplo): solo lo que se sabe, la hora en que se pidió.
      lado = `<div class="pd-eta"><span class="pd-eta__num pd-eta__num--hora">${esc(hora(p.creadoEn))}</span><span class="pd-eta__lbl">pedido a las ${esc(hora(p.creadoEn))} · hora de Panamá · prepara ${esc(nombreCorto(suc))}</span></div>`;
    }

    const pasosHTML = pasos.map((x) => `
      <li class="pd-paso is-${x.fase}"${x.fase === 'actual' ? ' aria-current="step"' : ''}>
        ${circuloIcono(x.icono, { tam: 22, tono: 'oscuro' })}
        <span class="pd-paso__t">${esc(x.estado)}</span>
        <span class="pd-paso__m">${x.fase === 'hecho' ? icono('check', { tam: 14 }) : ''}${x.fase === 'actual' && x.estado === 'Entregado' ? 'Completado' : MARCA[x.fase]}${x.en && x.fase !== 'pendiente' ? ` · ${esc(hora(x.en))}` : ''}</span>
      </li>`).join('');

    const foto = retiro ? claveFotoSucursal(state, p.sucursalId) : 'delivery';

    nodo.innerHTML = `
      <section class="pd-hero band band--dark on-dark" aria-labelledby="pd-t">
        <div class="container--wide">
          <p class="pd-migas"><a href="#/menu">${icono('flecha', { tam: 18 })} Seguir en la carta</a></p>
          <div class="pd-hero__top">
            <div class="pd-hero__estado">
              <h1 id="pd-t" class="pd-titulo"><span class="pd-titulo__id">Pedido ${esc(p.id)} · ${retiro ? 'Retiro en sucursal' : 'Entrega a domicilio'}</span> <span class="pd-titulo__estado">${esc(p.estado)}</span></h1>
              <p class="pd-msg" role="status" aria-live="polite">${mensaje}${p.etaMin && !entregado ? ` Tiempo estimado: unos ${p.etaMin} min.` : ''}</p>
            </div>
            ${lado}
          </div>
          <ol class="pd-pasos pd-pasos--${pasos.length}" aria-label="Estado del pedido">${pasosHTML}</ol>
        </div>
      </section>
      <div class="pd-grid container--wide">
        <section class="pd-bloque" aria-labelledby="ped-det">
          <h2 id="ped-det" class="pd-bloque__t">Su pedido</h2>
          <ul class="ck-lineas">
            ${filas.map((f) => `<li class="ck-linea">${miniProducto(f.producto)}<span class="ck-linea__n"><strong><span class="ck-linea__q">${f.cantidad}×</span> ${esc(f.producto.nombre)}</strong>${f.modificadores.length ? `<small>${f.modificadores.map((m) => esc(cap(m))).join(' · ')}</small>` : ''}</span><span class="ck-linea__p">${f.importe === null ? '' : money(f.importe)}</span></li>`).join('')}
          </ul>
          <dl class="totales">
            <div><dt>Subtotal</dt><dd>${money(t.subtotal)}</dd></div>
            <div><dt>ITBMS 7%</dt><dd>${money(t.itbms)}</dd></div>
            <div class="totales__total"><dt>Total</dt><dd>${precioHTML(t.total, 'totales__cifra')}</dd></div>
          </dl>
        </section>
        <section class="pd-bloque" aria-labelledby="ped-info">
          ${fotoEscena(foto, { ratio: '4/3', alt: '', clase: `pd-foto${foto === 'sucursal_1' ? ' foto--warm' : ''}` })}
          <h2 id="ped-info" class="pd-bloque__t">Detalles</h2>
          <dl class="pd-datos">
            <div><dt>${retiro ? 'Retiro en' : 'Prepara'}</dt><dd>${esc(suc?.nombre ?? '')}${retiro && suc ? `<small>${esc(suc.direccion)}</small>` : ''}</dd></div>
            ${!retiro ? `<div><dt>Entrega en</dt><dd>${esc(p.direccion ?? '')}</dd></div>` : ''}
            ${p.etaMin && !entregado ? `<div><dt>Tiempo estimado</dt><dd>unos ${p.etaMin} min</dd></div>` : ''}
            <div><dt>Pago</dt><dd>${esc(METODO[p.pago?.metodo] ?? 'Pendiente')} · ${esc(p.pago?.estado ?? '')}<small>Pago simulado</small></dd></div>
          </dl>
          ${entregado && p.factura ? `
            <div class="pd-factura on-dark">
              <div class="pd-factura__cab"><h3 class="pd-factura__t">Factura electrónica</h3><span class="badge badge--gold">Simulada</span></div>
              <p class="pd-factura__id">${esc(p.factura.id)}</p>
              <p class="pd-factura__cufe"><span>CUFE · SIMULADO</span>${esc(p.factura.cufe)}</p>
              <p class="pd-factura__nota">Documento de demostración: no tiene validez fiscal ni se envió a la DGI.</p>
            </div>` : `
            <p class="pd-factura-pend">${icono('pedido', { tam: 20 })}<span>La factura electrónica se emite cuando su pedido se entrega <span>(simulada en esta demo)</span>.</span></p>`}
        </section>
      </div>`;
  }
  pintar();
  const off = store.subscribe(pintar);
  return off;
}
