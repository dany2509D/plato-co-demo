import '../styles/indicadores.css';
import { metrics, compareBranches, bestPerMetric, totalPedidos, dailySummary, usd } from '../core/metrics.js';
import { kpiBlock, hBars, donut, esc } from '../ui/kpi.js';

function vistaHTML(state, sel) {
  const scope = sel === 'todas' || state.sucursales.some((s) => s.id === sel) ? sel : 'todas';
  const m = metrics(state, scope);
  const nombre = scope === 'todas' ? 'Todas las sucursales' : state.sucursales.find((s) => s.id === scope).nombre;
  const { web, whatsapp } = m.pedidosPorCanal;
  const total = web + whatsapp;
  const lider = total === 0 ? 'Sin datos' : web === whatsapp ? 'Empate' : web > whatsapp ? 'Web' : 'WhatsApp';
  const comp = compareBranches(state);
  const best = bestPerMetric(comp);
  const nombreSuc = (id) => state.sucursales.find((s) => s.id === id)?.nombre ?? id;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
  const mejor = (k, id) => (best[k] === id ? '<span class="mejor"> ★ Mejor</span>' : '');
  const email = dailySummary(state, new Date());

  const filas = comp.map((c) => `<tr${c.sucursalId === scope ? ' class="actual"' : ''}>
    <th scope="row">${esc(nombreSuc(c.sucursalId))}</th>
    <td>${totalPedidos(c)}${mejor('pedidos', c.sucursalId)}</td>
    <td>${usd(c.ticketPromedio)}${mejor('ticketPromedio', c.sucursalId)}</td>
    <td>${c.tiempoPrepMin ? `${c.tiempoPrepMin} min` : 'Sin datos'}${mejor('tiempoPrepMin', c.sucursalId)}</td></tr>`).join('');
  const maxPed = Math.max(1, ...comp.map(totalPedidos));
  const grupos = comp.map((c) => {
    const n = totalPedidos(c);
    return `<li class="grupo${best.pedidos === c.sucursalId ? ' es-mejor' : ''}"><span class="g-nombre">${esc(nombreSuc(c.sucursalId))}</span>
      <span class="g-pista" role="img" aria-label="${n} pedidos"><span class="g-barra" style="width:${(n / maxPed) * 100}%"></span></span>
      <span class="g-val">${n}</span></li>`;
  }).join('');

  const topTexto = m.topPlatos.map((p) => `${p.nombre} ${p.unidades}`).join(', ');
  return `<div class="ind">
    <header class="ind-cab"><h2>Indicadores</h2><p class="ind-sub">${esc(nombre)} · pedidos del día</p></header>
    <section class="kpis" aria-label="Indicadores principales">
      ${kpiBlock({ valor: total, etiqueta: 'Pedidos del día' })}
      ${kpiBlock({ valor: usd(m.ticketPromedio), etiqueta: 'Ticket promedio', nota: 'ITBMS incluido' })}
      ${kpiBlock({ valor: m.tiempoPrepMin ? `${m.tiempoPrepMin} min` : '—', etiqueta: 'Tiempo de preparación', nota: m.tiempoPrepMin ? 'promedio hasta “Listo”' : 'sin pedidos listos' })}
      ${kpiBlock({ valor: lider, etiqueta: 'Canal con más pedidos', nota: total ? `${web} web · ${whatsapp} WhatsApp` : '' })}
    </section>
    <div class="ind-cols">
      <section class="tarjeta" aria-labelledby="ind-top"><h3 id="ind-top">Platos más vendidos</h3>
        ${m.topPlatos.length ? hBars(m.topPlatos.map((p) => ({ etiqueta: p.nombre, valor: p.unidades, texto: `${p.unidades} u.` })), { titulo: `Platos más vendidos: ${topTexto}` }) : '<p class="vacio">Aún no hay pedidos.</p>'}
      </section>
      <section class="tarjeta" aria-labelledby="ind-canal"><h3 id="ind-canal">Web y WhatsApp</h3>
        <div class="canal">${donut(web, whatsapp, { titulo: `Pedidos por canal: ${web} web, ${whatsapp} WhatsApp`, etiquetaA: 'Web', etiquetaB: 'WhatsApp' })}
        <ul class="leyenda"><li><span class="sw sw-a" aria-hidden="true"></span>Web: <strong>${web}</strong> (${pct(web)} %)</li>
        <li><span class="sw sw-b" aria-hidden="true"></span>WhatsApp: <strong>${whatsapp}</strong> (${pct(whatsapp)} %)</li></ul></div>
      </section>
    </div>
    <section class="tarjeta" aria-labelledby="ind-comp"><h3 id="ind-comp">Comparativa entre sucursales</h3>
      <ul class="grupos" aria-label="Pedidos por sucursal">${grupos}</ul>
      <div class="tabla-scroll"><table class="tabla"><caption class="sr">Pedidos, ticket promedio y tiempo de preparación por sucursal. La estrella marca la mejor.</caption>
      <thead><tr><th scope="col">Sucursal</th><th scope="col">Pedidos</th><th scope="col">Ticket promedio</th><th scope="col">Preparación</th></tr></thead><tbody>${filas}</tbody></table></div>
    </section>
    <section class="tarjeta correo" aria-labelledby="ind-mail"><h3 id="ind-mail">Resumen diario por correo</h3>
      <div class="mail"><div class="mail-cab"><div><span class="mail-et">Para:</span> ${esc(email.para)}</div><div><span class="mail-et">Asunto:</span> ${esc(email.asunto)}</div></div>
      <pre class="mail-cuerpo">${esc(email.cuerpo)}</pre>
      <p class="mail-pie">Enviado automáticamente a ${esc(email.para)} (ficticio). Es una simulación: no se envía ningún correo real.</p></div>
    </section>
  </div>`;
}

export function renderIndicadores(container, store) {
  const pintar = () => {
    const s = store.get();
    container.innerHTML = vistaHTML(s, s.ui?.sucursalAdmin ?? 'todas');
  };
  pintar();
  return store.subscribe(pintar);
}
