import { store } from '../core/app-store.js';
import { advanceStatus } from '../core/orders.js';
import {
  COLUMNAS, activeOrders, deliveredOrders, groupByEstado, elapsedMinutes, urgency, formatElapsed, nextLabel,
} from '../core/kitchen.js';
import { esc } from '../ui/dom.js';

const REFRESCO_MS = 30000;
const SEMAFORO = {
  verde: { icono: '●', texto: 'A tiempo' },
  amarillo: { icono: '▲', texto: 'Atención' },
  rojo: { icono: '■', texto: 'Retrasado' },
};

function lineasHtml(state, p) {
  return p.lineas.map((l) => {
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
        <span class="kc-canal kc-canal-${wa ? 'wa' : 'web'}">${wa ? 'WhatsApp' : 'Web'}</span>
      </header>
      <p class="kc-tiempo"><span class="kc-sem"><span aria-hidden="true">${sem.icono}</span> ${sem.texto}</span> <strong>${formatElapsed(min)}</strong></p>
      <p class="kc-tipo">${tipo}</p>
      <ul class="kc-lineas">${lineasHtml(state, p)}</ul>
      ${sig ? `<button type="button" class="kc-avanzar" data-avanzar="${esc(p.id)}">Avanzar a ${esc(sig)}</button>` : ''}
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
      <div class="kc-cab"><h1 id="kc-titulo">Cocina</h1><p class="kc-sub" data-sub></p></div>
      <div class="kc-kpis" data-kpis></div>
      <div class="kc-cols" data-cols></div>
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
    q('[data-kpis]').innerHTML = COLUMNAS.map((e) => `
      <div class="kc-kpi"><span class="kc-kpi-n">${grupos[e].length}</span><span class="kc-kpi-t">${e}</span></div>`).join('');
    q('[data-cols]').innerHTML = COLUMNAS.map((e) => `
      <section class="kc-col" aria-label="${e}">
        <h2>${e} <span class="kc-col-n">${grupos[e].length}</span></h2>
        ${grupos[e].length ? grupos[e].map((p) => tarjeta(state, p, now)).join('') : '<p class="kc-vacio">Sin pedidos</p>'}
      </section>`).join('');
    const ent = deliveredOrders(state, suc.id, 8);
    q('[data-hist-t]').textContent = `Últimos entregados (${ent.length})`;
    q('[data-hist-l]').innerHTML = ent.length ? ent.map(entregado).join('') : '<li>Todavía no hay entregas.</li>';

    if (foco) q(`[data-avanzar="${CSS.escape(foco)}"]`)?.focus({ preventScroll: true });
    if (window.scrollY !== y) window.scrollTo(0, y);
  }

  cont.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-avanzar]');
    if (!b) return;
    try { advanceStatus(store, b.dataset.avanzar); } catch { pintar(); }
  });

  pintar();
  const offSub = store.subscribe(pintar);
  const offEv = store.on('pedido:estado', pintar);
  const timer = setInterval(pintar, REFRESCO_MS);
  return () => { offSub(); offEv(); clearInterval(timer); };
}
