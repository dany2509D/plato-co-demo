import { store } from '../core/app-store.js';
import { assignTable, occupancyByHour } from '../core/reservations.js';
import { reservasDelDia, fechasConReservas, franjaDeHora, enFranja, resumenReserva } from '../core/reservas-admin.js';
import { floorplan } from '../ui/floorplan.js';
import { esc } from '../ui/dom.js';

const MENSAJES = {
  mesa_ocupada: 'Esa mesa ya está ocupada en ese horario',
  capacidad: 'La mesa no tiene capacidad suficiente',
  no_encontrada: 'No se encontró la reserva o la mesa. Actualice la pantalla e intente de nuevo.',
};

const hoyPanama = () => new Date(Date.now() - 5 * 3600000).toISOString().slice(0, 10);

function etiquetaFecha(f, hoy) {
  const d = new Date(`${f}T12:00:00Z`);
  const t = d.toLocaleDateString('es-PA', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  return `${t}${f === hoy ? ' (hoy)' : ''}`;
}

export function adminReservas(cont) {
  cont.innerHTML = `
    <section class="rv" aria-labelledby="rv-titulo">
      <div class="pg-cab"><p class="rol">Vista por rol · Anfitrión</p><h1 id="rv-titulo">Reservas</h1><p class="pg-sub" data-sub></p></div>
      <div class="rv-filtros">
        <div class="field rv-fecha"><label class="label" for="rv-fecha">Fecha</label><select class="select" id="rv-fecha" data-fecha></select></div>
        <div class="rv-franjas" role="group" aria-label="Franja horaria" data-franjas></div>
      </div>
      <p class="gs-msg" role="status" aria-live="polite" data-msg></p>
      <div class="rv-cols">
        <section class="rv-lista" aria-labelledby="rv-lista-t">
          <h2 id="rv-lista-t">Reservas del día <span class="gs-n" data-n></span></h2>
          <p class="gs-ayuda" data-ayuda></p>
          <ul data-reservas></ul>
        </section>
        <section class="rv-plano" aria-labelledby="rv-plano-t">
          <h2 id="rv-plano-t">Plano de mesas</h2>
          <p class="gs-ayuda" data-ayuda-plano></p>
          <div data-plano></div>
        </section>
      </div>
    </section>`;
  const q = (s) => cont.querySelector(s);
  const ui = { sucursalId: null, fecha: hoyPanama(), franja: null, reservaSel: null, mesaSel: null, msg: '', msgError: false, fechasSig: '' };

  function decir(texto, error = false) { ui.msg = texto; ui.msgError = error; }

  function asignar(reservaId, mesaId) {
    const res = assignTable(store, reservaId, mesaId);
    if (res.ok) {
      const r = store.get().reservas.find((x) => x.id === reservaId);
      decir(`Listo: la mesa ${mesaId} quedó asignada a la reserva ${reservaId}${r ? ` de las ${r.hora}` : ''}.`);
      ui.reservaSel = null; ui.mesaSel = null;
    } else {
      decir(MENSAJES[res.razon] || 'No se pudo asignar la mesa.', true);
      ui.mesaSel = null;
    }
    pintar();
  }

  function pintar() {
    const state = store.get();
    const suc = state.sucursales.find((s) => s.id === state.ui.sucursalAdmin) || state.sucursales[0];
    if (ui.sucursalId !== suc.id) { ui.sucursalId = suc.id; ui.reservaSel = null; ui.mesaSel = null; ui.msg = ''; ui.franja = null; }
    const hoy = hoyPanama();
    const foco = document.activeElement?.dataset?.reserva;
    const focoFranja = document.activeElement?.dataset?.franja;

    // Fecha: hoy más las fechas que tienen reservas en esta sucursal.
    const fechas = [...new Set([hoy, ...fechasConReservas(state, suc.id)])].sort();
    if (!fechas.includes(ui.fecha)) ui.fecha = hoy;
    const sig = `${suc.id}|${fechas.join()}`;
    const selFecha = q('[data-fecha]');
    if (sig !== ui.fechasSig) {
      selFecha.innerHTML = fechas.map((f) => `<option value="${esc(f)}">${esc(etiquetaFecha(f, hoy))}</option>`).join('');
      ui.fechasSig = sig;
    }
    selFecha.value = ui.fecha;

    const reservas = reservasDelDia(state, suc.id, ui.fecha);
    if (ui.reservaSel && !reservas.some((r) => r.id === ui.reservaSel)) ui.reservaSel = null;
    const ocup = occupancyByHour(state, suc.id, ui.fecha);
    if (!ocup.some((o) => o.hora === ui.franja)) {
      const conRes = ocup.find((o) => o.mesasOcupadas > 0);
      ui.franja = (conRes || ocup[0] || {}).hora || null;
    }

    q('[data-sub]').textContent = `${suc.nombre} · ${suc.mesas.length} mesas · se actualiza solo`;
    q('[data-franjas]').innerHTML = ocup.map((o) => `
      <button type="button" class="rv-franja" data-franja="${esc(o.hora)}" aria-pressed="${o.hora === ui.franja}">
        <span class="rv-franja__h">${esc(o.hora)}</span><strong class="rv-franja__n">${o.mesasOcupadas}<small>/${o.mesasTotal}</small></strong><span class="rv-franja__t">ocupadas</span>
      </button>`).join('');

    q('[data-n]').textContent = String(reservas.length);
    const pend = reservas.filter((r) => resumenReserva(r).atencion).length;
    q('[data-ayuda]').textContent = reservas.length
      ? `${pend ? `${pend} necesitan atención (pendientes o sin mesa). ` : 'Todas tienen mesa. '}Elija una reserva y luego una mesa del plano.`
      : '';
    q('[data-reservas]').innerHTML = reservas.length ? reservas.map((r) => {
      const s = resumenReserva(r);
      const sel = ui.reservaSel === r.id;
      const mesa = r.mesaId ? `Mesa ${esc(r.mesaId)}` : 'Sin mesa';
      return `<li><button type="button" class="rv-fila${s.atencion ? ' rv-atencion' : ''}${enFranja(r.hora, ui.franja) ? ' rv-enfranja' : ''}" data-reserva="${esc(r.id)}" aria-pressed="${sel}">
        <span class="rv-hora">${esc(r.hora)}</span>
        <span class="rv-datos"><strong>${esc(r.nombre || r.id)} · ${r.personas} ${r.personas === 1 ? 'persona' : 'personas'}</strong>
          <span>${esc(r.ocasion && r.ocasion !== 'ninguna' ? r.ocasion : 'Sin ocasión especial')}</span></span>
        <span class="rv-tags">
          <span class="rv-tag ${s.pendiente ? 'rv-tag-pend' : 'rv-tag-ok'}">${s.pendiente ? '▲ Pendiente' : '✓ Confirmada'}</span>
          <span class="rv-tag ${s.sinMesa ? 'rv-tag-sin' : ''}">${s.sinMesa ? '■ ' : ''}${mesa}</span>
        </span>
      </button></li>`;
    }).join('') : '<li class="gs-vacio">No hay reservas para esta fecha. Cuando alguien reserve por el chat, aparecerá aquí.</li>';

    const msg = q('[data-msg]');
    msg.textContent = ui.msg;
    msg.className = `gs-msg${ui.msg ? (ui.msgError ? ' gs-error' : ' gs-ok') : ''}`;

    const rSel = reservas.find((r) => r.id === ui.reservaSel);
    q('[data-ayuda-plano]').textContent = rSel
      ? `Reserva ${rSel.id} de ${rSel.personas} ${rSel.personas === 1 ? 'persona' : 'personas'} a las ${rSel.hora}: toque la mesa que desea asignar.`
      : ui.mesaSel ? `Mesa ${ui.mesaSel} elegida: ahora toque una reserva de la lista.` : 'Elija una reserva de la lista o una mesa libre.';
    if (ui.franja) {
      floorplan(q('[data-plano]'), {
        mesas: suc.mesas, reservas, franja: ui.franja, onAssign: asignar,
        reservaSel: ui.reservaSel, mesaSel: ui.mesaSel,
        onSelectMesa: (id) => { ui.mesaSel = ui.mesaSel === id ? null : id; decir(''); pintar(); },
      });
    } else q('[data-plano]').innerHTML = '<p class="gs-vacio">Esta sucursal no tiene horario de atención.</p>';

    if (focoFranja) q(`[data-franja="${CSS.escape(focoFranja)}"]`)?.focus({ preventScroll: true });
    if (foco) q(`[data-reserva="${CSS.escape(foco)}"]`)?.focus({ preventScroll: true });
  }

  cont.addEventListener('click', (ev) => {
    const f = ev.target.closest('[data-franja]');
    if (f) { ui.franja = f.dataset.franja; pintar(); return; }
    const b = ev.target.closest('[data-reserva]');
    if (!b) return;
    const id = b.dataset.reserva;
    if (ui.mesaSel) { asignar(id, ui.mesaSel); return; }
    ui.reservaSel = ui.reservaSel === id ? null : id;
    decir('');
    const r = store.get().reservas.find((x) => x.id === id);
    const fr = r && franjaDeHora(r.hora);
    if (ui.reservaSel && fr && occupancyByHour(store.get(), ui.sucursalId, ui.fecha).some((o) => o.hora === fr)) ui.franja = fr;
    pintar();
  });
  q('[data-fecha]').addEventListener('change', (ev) => { ui.fecha = ev.target.value; ui.reservaSel = null; ui.mesaSel = null; ui.franja = null; decir(''); pintar(); });

  pintar();
  const offSub = store.subscribe(pintar);
  const offEv = store.on('reserva:creada', pintar);
  return () => { offSub(); offEv(); };
}
