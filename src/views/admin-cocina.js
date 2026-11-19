import { store } from '../core/app-store.js';
import { advanceStatus, etiquetaPago } from '../core/orders.js';
import {
  COLUMNAS, activeOrders, deliveredOrders, groupByEstado, elapsedMinutes, urgency, formatElapsed, nextLabel,
} from '../core/kitchen.js';
import { esc } from '../ui/dom.js';
import { icono } from '../ui/icons.js';

const REFRESCO_MS = 30000;
const SEMAFORO = {
  verde: { icono: 'check', texto: 'A tiempo' },
  amarillo: { icono: 'alerta', texto: 'Atención' },
  rojo: { icono: 'alerta', texto: 'Retrasado' },
};

function lineasHtml(state, p) {
  return (p.lineas || []).map((l) => {
    const prod = state.productos.find((x) => x.id === l.productoId);
    const mods = (l.modificadores || []).map((m) => `<span class="kc-mod">${esc(m)}</span>`).join('');
    return `<li><strong>${l.cantidad} ×</strong> ${esc(prod ? prod.nombre : l.productoId)}${mods ? `<span class="kc-mods">${mods}</span>` : ''}</li>`;
  }).join('');
}

function tarjeta(state, p, now) {
  const min = elapsedMinutes(p, now);
  const u = urgency(min);
  const sem = SEMAFORO[u];
  const sig = nextLabel(p);
  const wa = p.canal === 'whatsapp';
  const tipo = p.tipo === 'retiro' ? 'Retiro en local' : `Entrega: ${esc(p.direccion || 'sin dirección')}`;
  return `
    <article class="kc-card kc-${u}" aria-label="Pedido ${esc(p.id)}">
      <header class="kc-card-top">
        <h3>${esc(p.id)}</h3>
        <span class="kc-canal kc-canal-${wa ? 'wa' : 'web'}">${icono(wa ? 'chat' : 'web', { tam: 18 })}${wa ? 'WhatsApp' : 'Web'}</span>
      </header>
      <p class="kc-tiempo"><span class="kc-sem">${icono(sem.icono, { tam: 22 })} ${sem.texto}</span> <strong>${formatElapsed(min)}</strong></p>
      <p class="kc-tipo">${icono(p.tipo === 'retiro' ? 'retiro' : 'en-camino', { tam: 24 })}<span>${tipo}</span></p>
      ${p.pago?.metodo === 'yappy' && p.pago.historial ? `<p class="kc-pago${p.pago.estado === 'pagado' ? '' : ' kc-pago--pend'}">${icono(p.pago.estado === 'pagado' ? 'check' : 'reloj', { tam: 18 })}<span>Pago: ${esc(etiquetaPago(p.pago))}</span></p>` : ''}
      <ul class="kc-lineas">${lineasHtml(state, p)}</ul>
      ${sig ? `<button type="button" class="btn btn--lg btn--block kc-avanzar" data-avanzar="${esc(p.id)}">Avanzar a ${esc(sig)}</button>` : ''}
    </article>`;
}

function entregado(p) {
  const h = [...(p.historial || [])].reverse().find((x) => x.estado === 'Entregado');
  const hora = h ? new Date(h.en).toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Panama' }) : '';
  return `<li><strong>${esc(p.id)}</strong> · ${p.canal === 'whatsapp' ? 'WhatsApp' : 'Web'} · ${p.tipo === 'retiro' ? 'Retiro' : 'Entrega'}${hora ? ` · ${hora}` : ''}</li>`;
}

export function adminCocina(cont) {
  cont.innerHTML = `
    <section class="kc" aria-labelledby="kc-titulo">
      <div class="pg-cab"><p class="rol">Vista por rol · Cocina</p><h1 id="kc-titulo" tabindex="-1">Cocina</h1><p class="pg-sub" data-sub></p></div>
      <div class="kc-cols" data-cols></div>
      <p class="kc-aviso" role="status" aria-live="polite" data-aviso></p>
      <details class="kc-hist"><summary data-hist-t></summary><ul data-hist-l></ul></details>
    </section>`;
  const q = (s) => cont.querySelector(s);

  function pintar() {
    const state = store.get();
    const suc = state.sucursales.find((s) => s.id === state.ui.sucursalAdmin) || state.sucursales[0];
    const now = Date.now();
    const grupos = groupByEstado(activeOrders(state, suc.id));
    const foco = document.activeElement?.dataset?.avanzar;
    const y = window.scrollY;

    q('[data-sub]').textContent = `${suc.nombre} · se actualiza solo`;
    q('[data-cols]').innerHTML = COLUMNAS.map((e) => `
      <section class="kc-col" aria-label="${e}">
        <h2><span class="kc-col-t">${e}</span> <span class="kc-col-n">${grupos[e].length}</span></h2>
        ${grupos[e].length ? grupos[e].map((p) => tarjeta(state, p, now)).join('') : '<p class="kc-vacio">Sin pedidos</p>'}
      </section>`).join('');
    const ent = deliveredOrders(state, suc.id, 8);
    q('[data-hist-t]').textContent = `Últimos entregados (${ent.length})`;
    q('[data-hist-l]').innerHTML = ent.length ? ent.map(entregado).join('') : '<li>Todavía no hay entregas.</li>';

    if (foco) (q(`[data-avanzar="${CSS.escape(foco)}"]`) || q("#kc-titulo"))?.focus({ preventScroll: true });
    if (window.scrollY !== y) window.scrollTo(0, y);
  }

  cont.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-avanzar]');
    q("[data-aviso]").textContent = "";
    if (!b) return;
    try { advanceStatus(store, b.dataset.avanzar); } catch {
      q("[data-aviso]").textContent = "El pedido ya no existe";
      pintar();
    }
  });

  pintar();
  const offSub = store.subscribe(pintar);
  const offEv = store.on('pedido:estado', pintar);
  const timer = setInterval(pintar, REFRESCO_MS);
  return () => { offSub(); offEv(); clearInterval(timer); };
}
