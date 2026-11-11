import { layoutMesas } from '../core/floor.js';
import { estadoMesas } from '../core/reservas-admin.js';
import { esc } from './dom.js';

// Plano de mesas de una sucursal para una franja horaria.
// floorplan(container, {mesas, reservas, franja, onAssign(reservaId, mesaId)})
//   mesas: [{id, capacidad}]; reservas: reservas del día; franja: 'HH:00'.
// Extras opcionales para que la vista maneje la selección:
//   reservaSel: id de la reserva elegida en la lista (al tocar una mesa se llama onAssign);
//   mesaSel / onSelectMesa(mesaId): selección inversa (primero la mesa, luego la reserva).
// Cada mesa es un botón: se opera con teclado (Tab, Enter, Espacio), ratón o toque.
// El estado se dice con texto e ícono, además del color y la trama.
const handlers = new WeakMap();

function onClick(ev, container) {
  const b = ev.target.closest('[data-mesa]');
  if (!b || !container.contains(b)) return;
  const h = handlers.get(container);
  if (!h) return;
  const mesaId = b.dataset.mesa;
  if (h.reservaSel) h.onAssign?.(h.reservaSel, mesaId);
  else h.onSelectMesa?.(mesaId);
}

export function floorplan(container, { mesas, reservas = [], franja, onAssign, reservaSel = null, mesaSel = null, onSelectMesa } = {}) {
  const ocup = estadoMesas(mesas, reservas, franja);
  const lay = layoutMesas(mesas);
  const sel = reservas.find((r) => r.id === reservaSel) || null;
  const foco = container.contains(document.activeElement) ? document.activeElement.dataset?.mesa : null;

  const botones = lay.mesas.map((m) => {
    const r = ocup[m.id];
    const elegida = mesaSel === m.id;
    const estado = r ? 'ocupada' : 'libre';
    const icono = elegida ? '✓' : r ? '■' : '○';
    const texto = r ? `Ocupada: ${r.nombre || r.id} · ${r.personas} pers.` : 'Libre';
    const noCabe = sel && !r && m.capacidad < sel.personas;
    const label = `Mesa ${m.id}, ${m.capacidad} puestos, ${r ? `ocupada por ${r.nombre || r.id}, ${r.personas} personas` : 'libre'}${elegida ? ', seleccionada' : ''}${noCabe ? ', no tiene capacidad para la reserva elegida' : ''}`;
    const pos = `left:${(m.x / lay.ancho) * 100}%;top:${(m.y / lay.alto) * 100}%;width:${(m.w / lay.ancho) * 100}%;height:${(m.h / lay.alto) * 100}%`;
    return `<button type="button" class="fp-mesa fp-${m.forma} fp-${estado}${elegida ? ' fp-sel' : ''}${noCabe ? ' fp-nocabe' : ''}" style="${pos}"
      data-mesa="${esc(m.id)}" aria-pressed="${elegida}" aria-label="${esc(label)}">
      <span class="fp-id"><span aria-hidden="true">${icono}</span> ${esc(m.id)}</span>
      <span class="fp-cap">${m.capacidad} puestos</span>
      <span class="fp-est">${esc(elegida && !r ? 'Seleccionada' : texto)}</span>
      ${noCabe ? '<span class="fp-aviso">No cabe</span>' : ''}
    </button>`;
  }).join('');

  const aspecto = lay.ancho && lay.alto ? `aspect-ratio:${lay.ancho}/${lay.alto};max-width:${lay.ancho * 1.5}px` : '';
  container.innerHTML = `
    <div class="fp" style="${aspecto}" role="group" aria-label="Plano de mesas, franja de ${esc(franja)}">${botones}</div>
    <ul class="fp-leyenda" aria-label="Leyenda">
      <li><span class="fp-chip fp-libre" aria-hidden="true">○</span> Libre</li>
      <li><span class="fp-chip fp-ocupada" aria-hidden="true">■</span> Ocupada</li>
      <li><span class="fp-chip fp-sel" aria-hidden="true">✓</span> Seleccionada</li>
    </ul>`;

  handlers.set(container, { onAssign, onSelectMesa, reservaSel });
  if (!container.dataset.fpListo) {
    container.dataset.fpListo = '1';
    container.addEventListener('click', (ev) => onClick(ev, container));
  }
  if (foco) container.querySelector(`[data-mesa="${CSS.escape(foco)}"]`)?.focus({ preventScroll: true });
}
