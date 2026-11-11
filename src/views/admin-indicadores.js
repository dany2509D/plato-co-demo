import '../styles/indicadores.css';
import { metrics, compareBranches, bestPerMetric, totalPedidos, dailySummary, usd } from '../core/metrics.js';
import { kpiBlock, hBars, splitBar, esc } from '../ui/kpi.js';

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
  const grupos = hBars(comp.map((c) => ({ etiqueta: nombreSuc(c.sucursalId), valor: totalPedidos(c), texto: `${totalPedidos(c)} pedidos`, mejor: best.pedidos === c.sucursalId && totalPedidos(c) > 0 })),
    { titulo: `Pedidos por sucursal: ${comp.map((c) => `${nombreSuc(c.sucursalId)} ${totalPedidos(c)}`).join(', ')}` });

  const topTexto = m.topPlatos.map((p) => `${p.nombre} ${p.unidades}`).join(', ');
  const topMax = Math.max(0, ...m.topPlatos.map((p) => p.unidades));
  return `<div class="ind">
    <header class="pg-cab"><p class="rol">Vista por rol · Gerente</p><h1 id="ind-titulo">Indicadores</h1><p class="pg-sub">${esc(nombre)} · pedidos del día</p></header>
    <section class="kpis" aria-label="Indicadores principales">
      ${kpiBlock({ valor: total, etiqueta: 'Pedidos del día' })}
      ${kpiBlock({ valor: usd(m.ticketPromedio), etiqueta: 'Ticket promedio', nota: 'ITBMS incluido' })}
      ${kpiBlock({ valor: m.tiempoPrepMin ? `${m.tiempoPrepMin} min` : '—', etiqueta: 'Tiempo de preparación', nota: m.tiempoPrepMin ? 'promedio hasta “Listo”' : 'sin pedidos listos' })}
      ${kpiBlock({ valor: lider, etiqueta: 'Canal con más pedidos', nota: total ? `${web} web · ${whatsapp} WhatsApp` : '', texto: true })}
    </section>
    <section class="ind-sec" aria-labelledby="ind-comp"><h2 id="ind-comp">Comparativa entre sucursales</h2>
      <div class="ind-comp">
        <div>${grupos}</div>
        <div class="tabla-scroll"><table class="tabla"><caption class="sr">Pedidos, ticket promedio y tiempo de preparación por sucursal. La estrella marca la mejor.</caption>
        <thead><tr><th scope="col">Sucursal</th><th scope="col">Pedidos</th><th scope="col">Ticket promedio</th><th scope="col">Preparación</th></tr></thead><tbody>${filas}</tbody></table></div>
      </div>
    </section>
    <div class="ind-cols">
      <section class="ind-sec" aria-labelledby="ind-top"><h2 id="ind-top">Platos más vendidos</h2>
        ${m.topPlatos.length ? hBars(m.topPlatos.map((p) => ({ etiqueta: p.nombre, valor: p.unidades, texto: `${p.unidades} u.`, mejor: p.unidades === topMax })), { titulo: `Platos más vendidos: ${topTexto}` }) : '<p class="vacio">Aún no hay pedidos.</p>'}
      </section>
      <section class="ind-sec" aria-labelledby="ind-canal"><h2 id="ind-canal">Web y WhatsApp</h2>
        ${splitBar(web, whatsapp, { titulo: `Pedidos por canal: ${web} web, ${whatsapp} WhatsApp` })}
        <ul class="leyenda"><li><span class="sw sw-a" aria-hidden="true"></span><span class="leyenda-n">${web}</span><span>Web · ${pct(web)} %</span></li>
        <li><span class="sw sw-b" aria-hidden="true"></span><span class="leyenda-n">${whatsapp}</span><span>WhatsApp · ${pct(whatsapp)} %</span></li></ul>
      </section>
    </div>
    <section class="ind-sec" aria-labelledby="ind-mail"><h2 id="ind-mail">Resumen diario por correo</h2>
      <article class="mail"><header class="mail-cab"><span class="mail-sello">Simulado</span><div><span class="mail-et">Para:</span> ${esc(email.para)}</div><div><span class="mail-et">Asunto:</span> ${esc(email.asunto)}</div></header>
      <pre class="mail-cuerpo">${esc(email.cuerpo)}</pre>
      <p class="mail-pie">Enviado automáticamente a ${esc(email.para)} (ficticio). Es una simulación: no se envía ningún correo real.</p></article>
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
