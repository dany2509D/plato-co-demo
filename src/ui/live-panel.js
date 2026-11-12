import { construirFeed } from '../core/live-feed.js';
import { esc } from './dom.js';
import { circuloIcono, icono } from './icons.js';

// Panel "En vivo": línea de tiempo derivada del estado (así también aparece tras recargar).
// Se repinta con cada cambio del store; todo texto va escapado.
export function livePanel(container, store) {
  const sucActual = () => {
    const st = store.get();
    const s = st.sucursales?.find((x) => x.id === st.ui?.sucursalAdmin) ?? st.sucursales?.[0];
    return (s?.nombre ?? 'Centro').replace(/^Plato & Co\.\s*/, '');
  };
  container.innerHTML = `
    <section class="vivo" aria-labelledby="vivo-t">
      <div class="vivo-barra" aria-hidden="true"><span class="vivo-pts"><i></i><i></i><i></i></span><span class="vivo-url" data-url></span></div>
      <div class="vivo-win">
        <header class="vivo-cab">
          <h2 id="vivo-t"><span class="vivo-punto" aria-hidden="true"></span>En vivo</h2>
          <p>Lo que hace la automatización mientras el cliente chatea: pedidos, reservas y avisos al equipo.</p>
          <p class="vivo-enlaces"><a class="btn btn--sm" href="#/admin/cocina">Ver en cocina</a><a class="btn btn--ghost btn--sm" href="#/admin/reservas">Ver reservas</a></p>
        </header>
        <ol class="vivo-lista" data-lista aria-label="Actividad reciente, lo más nuevo primero"></ol>
        <p class="vivo-vacio" data-vacio>${icono('chat', { tam: 20 })}<span>Aún no hay actividad. Haga un pedido o una reserva en el chat y aparecerá aquí al instante.</span></p>
        <p class="vivo-pie">Se actualiza solo, sin recargar la página.</p>
      </div>
    </section>`;
  container.querySelector('[data-url]').textContent = `panel.platoyco.example · ${sucActual()}`;
  const lista = container.querySelector('[data-lista]');
  const vacio = container.querySelector('[data-vacio]');
  const humanoEn = {};
  const vistos = new Set();
  let primera = true;
  let firma = '';

  function pintar() {
    const state = store.get();
    for (const c of state.conversaciones ?? []) {
      if (!primera && c.requiereHumano && !humanoEn[c.id]) humanoEn[c.id] = new Date().toISOString();
      if (!c.requiereHumano) delete humanoEn[c.id];
    }
    const items = construirFeed(state, { limite: 12, humanoEn });
    const f = JSON.stringify(items);
    if (f === firma) return;
    firma = f;
    vacio.hidden = items.length > 0;
    lista.hidden = items.length === 0;
    lista.innerHTML = items.map((it) => {
      const nuevo = !primera && !vistos.has(it.id);
      return `<li class="vivo-item vivo-${esc(it.tipo)}${nuevo ? ' vivo-nuevo' : ''}">
        ${circuloIcono(it.icono, { tam: 18, tono: 'claro' })}
        <div class="vivo-cuerpo">
          <p class="vivo-tit"><strong>${esc(it.titulo)}</strong><time>${esc(it.hora)}</time></p>
          <p class="vivo-det">${esc(it.detalle)}</p>
          ${it.enlace ? `<a class="vivo-link btn btn--ghost btn--sm" href="${esc(it.enlace.href)}">${esc(it.enlace.texto)}</a>` : ''}
        </div>
      </li>`;
    }).join('');
    items.forEach((it) => vistos.add(it.id));
    primera = false;
  }

  pintar();
  const off = store.subscribe(pintar);
  return () => { off(); container.innerHTML = ''; };
}
