import { describe, it, expect } from 'vitest';
import { enFranja, reservasDelDia, estadoMesas, fechasConReservas, franjaDeHora, resumenReserva } from '../src/core/reservas-admin.js';

const R = (id, hora, extra = {}) => ({ id, sucursalId: 's1', fecha: '2026-11-11', hora, personas: 2, ocasion: 'ninguna', estado: 'confirmada', ...extra });
const state = {
  reservas: [
    R('a', '20:00', { mesaId: 'C1' }), R('b', '12:30'), R('c', '13:00', { estado: 'pendiente' }),
    R('d', '13:00', { sucursalId: 's2' }), R('e', '13:00', { fecha: '2026-11-12' }),
  ],
};

describe('enFranja (90 min, como occupancyByHour)', () => {
  it('una reserva de 12:30 cubre los bloques de 12:00 y 13:00 pero no 14:00', () => {
    expect(enFranja('12:30', '12:00')).toBe(true);
    expect(enFranja('12:30', '13:00')).toBe(true);
    expect(enFranja('12:30', '14:00')).toBe(false);
    expect(enFranja('12:30', '15:00')).toBe(false);
    expect(enFranja('12:30', '11:00')).toBe(false);
  });
  it('una reserva a la hora en punto cubre su bloque y el siguiente', () => {
    expect(enFranja('13:00', '13:00')).toBe(true);
    expect(enFranja('13:00', '14:00')).toBe(true);
    expect(enFranja('13:00', '15:00')).toBe(false);
    expect(enFranja('13:00', '12:00')).toBe(false);
  });
  it('horas inválidas dan false', () => { expect(enFranja('xx', '13:00')).toBe(false); });
});

describe('franjaDeHora', () => {
  it('redondea hacia abajo a la hora en punto', () => {
    expect(franjaDeHora('13:30')).toBe('13:00');
    expect(franjaDeHora('09:05')).toBe('09:00');
    expect(franjaDeHora('zz')).toBe(null);
  });
});

describe('reservasDelDia', () => {
  it('filtra por sucursal y fecha y ordena por hora', () => {
    expect(reservasDelDia(state, 's1', '2026-11-11').map((r) => r.id)).toEqual(['b', 'c', 'a']);
  });
  it('no muta el estado', () => {
    const antes = state.reservas.map((r) => r.id).join();
    reservasDelDia(state, 's1', '2026-11-11');
    expect(state.reservas.map((r) => r.id).join()).toBe(antes);
  });
});

describe('estadoMesas', () => {
  it('marca ocupadas las mesas con reserva en la franja, con su reserva', () => {
    const mesas = [{ id: 'C1', capacidad: 2 }, { id: 'C2', capacidad: 2 }];
    const res = reservasDelDia(state, 's1', '2026-11-11');
    const e = estadoMesas(mesas, res, '20:00');
    expect(e.C1.id).toBe('a');
    expect(e.C2).toBe(null);
    expect(estadoMesas(mesas, res, '13:00').C1).toBe(null);
  });
});

describe('fechasConReservas', () => {
  it('devuelve las fechas de la sucursal, únicas y ordenadas', () => {
    expect(fechasConReservas(state, 's1')).toEqual(['2026-11-11', '2026-11-12']);
  });
});

describe('resumenReserva', () => {
  it('marca sin mesa y pendiente', () => {
    expect(resumenReserva(R('x', '13:00', { estado: 'pendiente' }))).toEqual({ sinMesa: true, pendiente: true, atencion: true });
    expect(resumenReserva(R('x', '13:00', { mesaId: 'C1' }))).toEqual({ sinMesa: false, pendiente: false, atencion: false });
  });
});
