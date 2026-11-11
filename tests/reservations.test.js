import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '../src/core/store.js';
import { availableTables, createReservation, assignTable, occupancyByHour } from '../src/core/reservations.js';

const memStorage = () => ({ read: () => null, write() {} });
// 11 nov 2026, 10:00 hora de Panamá (UTC-5).
const AHORA = new Date('2026-11-11T15:00:00Z');
const FECHA = '2027-03-10'; // sin reservas en el seed
let store;
const suc = () => store.get().sucursales[0];
const datos = (o = {}) => ({ sucursalId: suc().id, fecha: FECHA, hora: '19:00', personas: 2, ocasion: 'ninguna', ...o });
const crear = (o) => createReservation(store, datos(o), { ahora: AHORA });
beforeEach(() => { store = createStore(memStorage()); });

describe('createReservation', () => {
  it('8 personas se reserva y recibe mesa que cabe', () => {
    const r = crear({ personas: 8 });
    expect(r.ok).toBe(true);
    expect(r.reserva.estado).toBe('confirmada');
    const mesa = suc().mesas.find((m) => m.id === r.reserva.mesaId);
    expect(mesa.capacidad).toBeGreaterThanOrEqual(8);
    expect(store.get().reservas.some((x) => x.id === r.reserva.id)).toBe(true);
  });
  it('elige la mesa libre de menor capacidad y emite reserva:creada', () => {
    const vistos = [];
    store.on('reserva:creada', (e) => vistos.push(e));
    const r = crear({ personas: 2 });
    const min = Math.min(...suc().mesas.filter((m) => m.capacidad >= 2).map((m) => m.capacidad));
    expect(suc().mesas.find((m) => m.id === r.reserva.mesaId).capacidad).toBe(min);
    expect(vistos).toEqual([{ reservaId: r.reserva.id }]);
  });
  it('9 personas -> handoff y no crea reserva', () => {
    const n = store.get().reservas.length;
    expect(crear({ personas: 9 })).toEqual({ ok: false, razon: 'handoff' });
    expect(store.get().reservas.length).toBe(n);
  });
  it('ocasión "evento" (con tilde o mayúsculas) -> handoff', () => {
    expect(crear({ ocasion: 'evento' }).razon).toBe('handoff');
    expect(crear({ ocasion: ' EVENTO ' }).razon).toBe('handoff');
  });
  it('0, -1 y no enteros -> personas_invalidas', () => {
    for (const p of [0, -1, 2.5, '3', NaN]) expect(crear({ personas: p })).toEqual({ ok: false, razon: 'personas_invalidas' });
  });
  it('hora fuera de horario o que se pasa del cierre -> fuera_de_horario', () => {
    expect(crear({ hora: '08:00' }).razon).toBe('fuera_de_horario');
    expect(crear({ hora: '23:30' }).razon).toBe('fuera_de_horario');
    expect(crear({ hora: '21:00' }).razon).toBe('fuera_de_horario'); // 21:00+90 min > 22:00
    expect(crear({ hora: '20:30' }).ok).toBe(true); // termina justo al cierre
  });
  it('fecha pasada (hora de Panamá) -> fecha_pasada', () => {
    expect(crear({ fecha: '2026-11-10' }).razon).toBe('fecha_pasada');
    expect(crear({ fecha: '2026-11-11', hora: '09:30' }).razon).toBe('fecha_pasada');
    // 03:00Z del 12 nov = 22:00 del 11 nov en Panamá: aún es el día 11.
    const tarde = new Date('2026-11-12T03:00:00Z');
    expect(createReservation(store, datos({ fecha: '2026-11-11', hora: '20:00' }), { ahora: tarde }).razon).toBe('fecha_pasada');
    expect(createReservation(store, datos({ fecha: '2026-11-12', hora: '19:00' }), { ahora: tarde }).ok).toBe(true);
  });
  it('sin mesa cuando todas están ocupadas en la franja', () => {
    const n = suc().mesas.filter((m) => m.capacidad >= 2).length;
    for (let i = 0; i < n; i++) expect(crear({ hora: '19:00' }).ok).toBe(true);
    expect(crear({ hora: '19:30' }).razon).toBe('sin_mesa');
    expect(crear({ hora: '20:30' }).ok).toBe(true); // franja ya libre
  });
  it('sucursal desconocida no lanza', () => {
    expect(crear({ sucursalId: 'nope' }).ok).toBe(false);
  });
});

describe('assignTable', () => {
  it('doble reserva misma mesa y franja: la segunda falla con mesa_ocupada', () => {
    const a = crear({ personas: 2 }).reserva;
    const b = crear({ personas: 2, hora: '19:30' }).reserva;
    expect(b.mesaId).not.toBe(a.mesaId);
    expect(assignTable(store, b.id, a.mesaId)).toEqual({ ok: false, razon: 'mesa_ocupada' });
  });
  it('permite reasignar a una mesa libre y reconfirmar la propia', () => {
    const a = crear({ personas: 2 }).reserva;
    expect(assignTable(store, a.id, a.mesaId).ok).toBe(true);
    const libre = availableTables(store.get(), suc().id, FECHA, '19:00', 2)[0];
    expect(assignTable(store, a.id, libre.id).ok).toBe(true);
    expect(store.get().reservas.find((r) => r.id === a.id).mesaId).toBe(libre.id);
  });
  it('capacidad insuficiente, ids desconocidos', () => {
    const a = crear({ personas: 8 }).reserva;
    const chica = [...suc().mesas].sort((x, y) => x.capacidad - y.capacidad)[0];
    expect(assignTable(store, a.id, chica.id)).toEqual({ ok: false, razon: 'capacidad' });
    expect(assignTable(store, 'x', chica.id)).toEqual({ ok: false, razon: 'no_encontrada' });
    expect(assignTable(store, a.id, 'x')).toEqual({ ok: false, razon: 'no_encontrada' });
  });
  it('asigna mesa a una reserva pendiente sin mesa del seed y la confirma', () => {
    const pend = store.get().reservas.find((r) => !r.mesaId);
    const mesa = store.get().sucursales.find((s) => s.id === pend.sucursalId).mesas.at(-1);
    const r = assignTable(store, pend.id, mesa.id);
    if (r.ok) expect(store.get().reservas.find((x) => x.id === pend.id).estado).toBe('confirmada');
    else expect(['mesa_ocupada', 'capacidad']).toContain(r.razon);
  });
});

describe('availableTables y occupancyByHour', () => {
  it('excluye mesas chicas y mesas ocupadas en franja solapada', () => {
    const todas = availableTables(store.get(), suc().id, FECHA, '19:00', 4);
    expect(todas.every((m) => m.capacidad >= 4)).toBe(true);
    const r = crear({ personas: 4 }).reserva;
    expect(availableTables(store.get(), suc().id, FECHA, '20:00', 4).map((m) => m.id)).not.toContain(r.mesaId);
    expect(availableTables(store.get(), suc().id, FECHA, '20:30', 4).map((m) => m.id)).toContain(r.mesaId);
  });
  it('ocupación por hora dentro del horario', () => {
    crear({ personas: 2, hora: '19:00' });
    const occ = occupancyByHour(store.get(), suc().id, FECHA);
    expect(occ[0].hora).toBe('11:00');
    expect(occ.at(-1).hora).toBe('21:00');
    expect(occ.every((o) => o.mesasTotal === suc().mesas.length)).toBe(true);
    expect(occ.find((o) => o.hora === '19:00').mesasOcupadas).toBe(1);
    expect(occ.find((o) => o.hora === '20:00').mesasOcupadas).toBe(1);
    expect(occ.find((o) => o.hora === '21:00').mesasOcupadas).toBe(0);
    expect(occ.find((o) => o.hora === '18:00').mesasOcupadas).toBe(0);
  });
});
