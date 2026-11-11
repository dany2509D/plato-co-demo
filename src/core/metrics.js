import { priceOrder, prepMinutes } from './orders.js';

const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export const DESTINATARIO_RESUMEN = 'gerencia@platoyco.example';

export function pedidosDe(state, sucursalId = 'todas') {
  return sucursalId === 'todas' ? state.pedidos : state.pedidos.filter((p) => p.sucursalId === sucursalId);
}

export function metrics(state, sucursalId = 'todas') {
  const pedidos = pedidosDe(state, sucursalId);
  const pedidosPorCanal = { web: 0, whatsapp: 0 };
  let centavos = 0;
  const preps = [];
  const unidades = new Map();
  for (const p of pedidos) {
    if (p.canal === 'whatsapp') pedidosPorCanal.whatsapp++;
    else pedidosPorCanal.web++;
    centavos += Math.round(priceOrder(state, p.lineas).total * 100);
    const m = prepMinutes(p);
    if (m !== null && Number.isFinite(m)) preps.push(m);
    for (const l of p.lineas) unidades.set(l.productoId, (unidades.get(l.productoId) ?? 0) + l.cantidad);
  }
  const topPlatos = [...unidades.entries()]
    .map(([id, u]) => ({ nombre: state.productos.find((x) => x.id === id)?.nombre ?? id, unidades: u }))
    .sort((a, b) => b.unidades - a.unidades || a.nombre.localeCompare(b.nombre, 'es'))
    .slice(0, 5);
  return {
    pedidosPorCanal,
    ticketPromedio: pedidos.length ? r2(centavos / 100 / pedidos.length) : 0,
    tiempoPrepMin: preps.length ? Math.round(preps.reduce((a, b) => a + b, 0) / preps.length) : 0,
    topPlatos,
  };
}

export function compareBranches(state) {
  return state.sucursales.map((s) => ({ sucursalId: s.id, ...metrics(state, s.id) }));
}

export const totalPedidos = (m) => m.pedidosPorCanal.web + m.pedidosPorCanal.whatsapp;

// Anchos (0..max) proporcionales al mayor valor; sin división por cero.
export function barWidths(values, max = 100) {
  const top = Math.max(0, ...values);
  return values.map((v) => (top > 0 ? Math.round((v / top) * max * 100) / 100 : 0));
}

// Mejor sucursal por métrica: más pedidos, mayor ticket, menor tiempo de preparación (0 = sin datos, se ignora).
export function bestPerMetric(comp) {
  const pick = (score, ok = () => true) => {
    let best = null;
    for (const c of comp) {
      if (!ok(c)) continue;
      if (best === null || score(c) > score(best)) best = c;
    }
    return best ? best.sucursalId : null;
  };
  return {
    pedidos: pick((c) => totalPedidos(c)),
    ticketPromedio: pick((c) => c.ticketPromedio),
    tiempoPrepMin: pick((c) => -c.tiempoPrepMin, (c) => c.tiempoPrepMin > 0),
  };
}

export const usd = (n) => `US$ ${Number(n).toFixed(2)}`;

// Correo diario SIMULADO: no se envía nada.
export function dailySummary(state, fecha = new Date()) {
  const dia = new Intl.DateTimeFormat('es-PA', { dateStyle: 'full', timeZone: 'America/Panama' }).format(fecha);
  const lineas = ['Estimado equipo de gerencia:', '', `Este es el resumen de ${dia}. Si usted necesita el detalle, puede revisarlo en el panel.`, ''];
  for (const c of compareBranches(state)) {
    const suc = state.sucursales.find((s) => s.id === c.sucursalId);
    const n = totalPedidos(c);
    if (!n) { lineas.push(`${suc.nombre}: sin pedidos registrados hoy.`); continue; }
    const top = c.topPlatos[0] ? `; plato más vendido: ${c.topPlatos[0].nombre} (${c.topPlatos[0].unidades})` : '';
    const prep = c.tiempoPrepMin ? `, preparación ${c.tiempoPrepMin} min` : '';
    lineas.push(`${suc.nombre}: ${n} pedidos (${c.pedidosPorCanal.web} web, ${c.pedidosPorCanal.whatsapp} WhatsApp), ticket promedio ${usd(c.ticketPromedio)}${prep}${top}.`);
  }
  lineas.push('', 'Quedamos a la orden.', 'Plato & Co.');
  return { para: DESTINATARIO_RESUMEN, asunto: `Plato & Co. · Resumen diario · ${dia}`, cuerpo: lineas.join('\n') };
}
