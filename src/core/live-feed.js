import { priceOrder } from './orders.js';
import { formatHora } from './chat-view.js';

// Convierte el estado en la línea de tiempo del panel "En vivo" (más nuevo primero).
// Solo pedidos que nacieron en el chat (tienen conversacionId), reservas creadas desde el chat
// (acciones guardadas en los mensajes) y conversaciones marcadas "Requiere persona".
const usd = (n) => `US$ ${Number(n).toFixed(2)}`;
const nombreSuc = (state, id) => state.sucursales.find((s) => s.id === id)?.nombre ?? id;
const ms = (iso) => Date.parse(iso) || 0;

export function construirFeed(state, { limite = 12, humanoEn = {} } = {}) {
  const items = [];
  for (const p of state.pedidos ?? []) {
    if (!p.conversacionId) continue;
    const total = priceOrder(state, p.lineas ?? []).total;
    items.push({
      id: `pedido-${p.id}`, tipo: 'pedido', icono: '🧾', en: p.creadoEn, hora: formatHora(p.creadoEn),
      titulo: `Pedido ${p.id} creado`,
      detalle: `Canal WhatsApp · ${nombreSuc(state, p.sucursalId)} · Total ${usd(total)} · Estado: ${p.estado}`,
      enlace: { href: '#/admin/cocina', texto: 'Ver en cocina' },
    });
    (p.historial ?? []).slice(1).forEach((h, i) => items.push({
      id: `estado-${p.id}-${i}`, tipo: 'estado', icono: '🍳', en: h.en, hora: formatHora(h.en),
      titulo: `Pedido ${p.id} pasó a ${h.estado}`,
      detalle: 'El cliente recibe el aviso en su chat.',
      enlace: { href: '#/admin/cocina', texto: 'Ver en cocina' },
    }));
  }
  for (const c of state.conversaciones ?? []) {
    for (const m of c.mensajes ?? []) {
      for (const a of m.actions ?? []) {
        if (a?.type !== 'reserva:creada') continue;
        const r = (state.reservas ?? []).find((x) => x.id === a.payload?.reservaId);
        if (!r) continue;
        items.push({
          id: `reserva-${r.id}`, tipo: 'reserva', icono: '📅', en: m.en, hora: formatHora(m.en),
          titulo: `Reserva ${r.id} creada`,
          detalle: `${r.personas} ${r.personas === 1 ? 'persona' : 'personas'} · ${r.fecha} ${r.hora} · mesa ${r.mesaId} · ${nombreSuc(state, r.sucursalId)}`,
          enlace: { href: '#/admin/reservas', texto: 'Ver reservas' },
        });
      }
    }
    if (c.requiereHumano) {
      const ult = c.mensajes?.[c.mensajes.length - 1]?.en;
      const en = humanoEn[c.id] ?? ult ?? '';
      items.push({
        id: `humano-${c.id}`, tipo: 'humano', icono: '🙋', en, hora: formatHora(en),
        titulo: 'Conversación marcada: Requiere persona',
        detalle: 'El equipo la ve en el panel y responde por el chat.',
        enlace: null,
      });
    }
  }
  items.sort((a, b) => ms(b.en) - ms(a.en));
  return items.slice(0, limite);
}
