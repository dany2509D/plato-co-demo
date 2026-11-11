import { store } from '../core/app-store.js';
import { ESTADOS, priceOrder } from '../core/orders.js';
import { el, esc, money } from '../ui/dom.js';

const cap = (m) => m.charAt(0).toUpperCase() + m.slice(1);
const hora = (iso) => new Date(iso).toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Panama' });
const METODO = { yappy: 'Yappy', tarjeta: 'Tarjeta', efectivo: 'Efectivo contra entrega' };

export function vistaPedido(main, { id }) {
  const nodo = el('<div class="pedido-vista"></div>');
  main.append(nodo);

  function pintar() {
    const state = store.get();
    const p = state.pedidos.find((x) => x.id === id);
    if (!p) {
      nodo.innerHTML = `
        <div class="vacio-grande">
          <h1>No encontramos ese pedido</h1>
          <p>Puede que el enlace esté incompleto o que la demo se haya reiniciado.</p>
          <a class="btn btn-primario btn-grande" href="#/menu">Ir al menú</a>
        </div>`;
      return;
    }
    const flujo = p.tipo === 'retiro' ? ESTADOS.filter((e) => e !== 'En camino') : ESTADOS;
    const idx = flujo.indexOf(p.estado);
    const t = priceOrder(state, p.lineas);
    const suc = state.sucursales.find((s) => s.id === p.sucursalId);
    const pasos = flujo.map((e, i) => {
      const h = p.historial?.find((x) => x.estado === e);
      const cls = i < idx ? 'hecho' : i === idx ? 'actual' : 'pendiente';
      return `<li class="paso ${cls}" ${i === idx ? 'aria-current="step"' : ''}>
        <span class="paso-punto" aria-hidden="true">${i < idx ? '✓' : i + 1}</span>
        <span class="paso-texto"><strong>${e}</strong><small>${h ? hora(h.en) : ''}</small></span>
      </li>`;
    }).join('');
    const entregado = p.estado === 'Entregado';
    const mensaje = entregado ? '¡Buen provecho! Su pedido fue entregado.'
      : p.estado === 'Listo' && p.tipo === 'retiro' ? 'Su pedido está listo para retirar.'
      : p.estado === 'En camino' ? 'Su pedido va en camino.'
      : p.estado === 'En cocina' ? 'Estamos preparando su pedido.'
      : 'Recibimos su pedido.';

    nodo.innerHTML = `
      <p class="migas"><a href="#/menu">← Seguir en el menú</a></p>
      <h1>Pedido ${esc(p.id)}</h1>
      <p class="estado-msg" role="status" aria-live="polite"><span class="chip chip-ok">${esc(p.estado)}</span> ${mensaje}</p>
      <ol class="stepper-estados" aria-label="Estado del pedido">${pasos}</ol>
      <div class="pedido-grid">
        <section class="bloque" aria-labelledby="ped-det">
          <h2 id="ped-det" class="bloque-t">Su pedido</h2>
          <ul class="resumen-lineas">
            ${p.lineas.map((l) => {
              const pr = state.productos.find((x) => x.id === l.productoId);
              if (!pr) return '';
              return `<li><span><strong>${l.cantidad} × ${esc(pr.nombre)}</strong>${l.modificadores?.length ? `<br><small>${l.modificadores.map((m) => esc(cap(m))).join(' · ')}</small>` : ''}</span><span>${money(pr.precio * l.cantidad)}</span></li>`;
            }).join('')}
          </ul>
          <dl class="totales">
            <div><dt>Subtotal</dt><dd>${money(t.subtotal)}</dd></div>
            <div><dt>ITBMS 7%</dt><dd>${money(t.itbms)}</dd></div>
            <div class="total"><dt>Total</dt><dd>${money(t.total)}</dd></div>
          </dl>
        </section>
        <section class="bloque" aria-labelledby="ped-info">
          <h2 id="ped-info" class="bloque-t">Detalles</h2>
          <dl class="datos">
            <div><dt>${p.tipo === 'retiro' ? 'Retiro en' : 'Prepara'}</dt><dd>${esc(suc?.nombre ?? '')}${p.tipo === 'retiro' && suc ? `<br><small>${esc(suc.direccion)}</small>` : ''}</dd></div>
            ${p.tipo === 'entrega' ? `<div><dt>Entrega en</dt><dd>${esc(p.direccion ?? '')}</dd></div>` : ''}
            ${p.etaMin && !entregado ? `<div><dt>Tiempo estimado</dt><dd>unos ${p.etaMin} min</dd></div>` : ''}
            <div><dt>Pago</dt><dd>${esc(METODO[p.pago?.metodo] ?? 'Pendiente')} · ${esc(p.pago?.estado ?? '')} <small>(simulado)</small></dd></div>
          </dl>
          ${entregado && p.factura ? `
            <div class="factura">
              <h3>Factura <span class="sello">Simulada</span></h3>
              <p><strong>${esc(p.factura.id)}</strong></p>
              <p class="cufe"><small>CUFE (simulado): ${esc(p.factura.cufe)}</small></p>
              <p class="ayuda">Documento de demostración: no tiene validez fiscal ni se envió a la DGI.</p>
            </div>` : ''}
        </section>
      </div>`;
  }
  pintar();
  const off = store.subscribe(pintar);
  return off;
}
