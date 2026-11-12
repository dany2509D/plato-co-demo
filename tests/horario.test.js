import { describe, it, expect } from 'vitest';
import { horaPanama, aMinutos, estaAbierto, estadoSucursal, menuDelDiaActivo } from '../src/core/horario.js';

// Panamá = UTC-5 todo el año: 15:00Z son las 10:00 en Panamá.
const enPanama = (fecha, hhmm) => new Date(`${fecha}T${hhmm}:00-05:00`);
const centro = { abre: '11:00', cierra: '22:00' };

describe('horaPanama', () => {
  it('convierte UTC a hora de Panamá (sin horario de verano)', () => {
    expect(horaPanama(new Date('2026-11-11T15:30:00Z'))).toEqual({ dia: 3, minutos: 10 * 60 + 30 });
    expect(horaPanama(new Date('2026-07-01T15:30:00Z')).minutos).toBe(10 * 60 + 30);
  });
  it('cambia de día al cruzar la medianoche de Panamá', () => {
    // 03:30Z del jueves 12 = 22:30 del miércoles 11 en Panamá
    expect(horaPanama(new Date('2026-11-12T03:30:00Z'))).toEqual({ dia: 3, minutos: 22 * 60 + 30 });
  });
});

describe('aMinutos', () => {
  it('lee HH:MM', () => {
    expect(aMinutos('11:30')).toBe(690);
    expect(aMinutos('9:05')).toBe(545);
    expect(aMinutos('24:00')).toBe(1440);
  });
  it('rechaza formatos inválidos', () => {
    expect(aMinutos('')).toBeNull();
    expect(aMinutos('25:00')).toBeNull();
    expect(aMinutos('10:75')).toBeNull();
    expect(aMinutos(undefined)).toBeNull();
  });
});

describe('estaAbierto', () => {
  it('abre justo a la hora de apertura y cierra justo a la de cierre', () => {
    expect(estaAbierto(centro, 11 * 60 - 1)).toBe(false);
    expect(estaAbierto(centro, 11 * 60)).toBe(true);
    expect(estaAbierto(centro, 22 * 60 - 1)).toBe(true);
    expect(estaAbierto(centro, 22 * 60)).toBe(false);
  });
  it('maneja horarios que cruzan la medianoche', () => {
    const noche = { abre: '18:00', cierra: '01:30' };
    expect(estaAbierto(noche, 23 * 60)).toBe(true);
    expect(estaAbierto(noche, 60)).toBe(true);
    expect(estaAbierto(noche, 90)).toBe(false);
    expect(estaAbierto(noche, 17 * 60 + 59)).toBe(false);
  });
  it('sin horario válido se considera cerrado', () => {
    expect(estaAbierto({ abre: '11:00' }, 12 * 60)).toBe(false);
    expect(estaAbierto({ abre: '10:00', cierra: '10:00' }, 10 * 60)).toBe(false);
    expect(estaAbierto(null, 12 * 60)).toBe(false);
  });
});

describe('estadoSucursal', () => {
  it('abierta: indica la hora de cierre', () => {
    const e = estadoSucursal(centro, enPanama('2026-11-11', '12:00'));
    expect(e).toMatchObject({ abierto: true, etiqueta: 'Abierto ahora', detalle: 'Cierra a las 22:00', cierraPronto: false });
  });
  it('avisa cuando cierra en 30 minutos o menos', () => {
    expect(estadoSucursal(centro, enPanama('2026-11-11', '21:30')).cierraPronto).toBe(true);
    expect(estadoSucursal(centro, enPanama('2026-11-11', '21:29')).cierraPronto).toBe(false);
  });
  it('cerrada antes de abrir: abre hoy; después del cierre: abre mañana', () => {
    expect(estadoSucursal(centro, enPanama('2026-11-11', '08:00'))).toMatchObject({ abierto: false, etiqueta: 'Cerrado', detalle: 'Abre hoy a las 11:00' });
    expect(estadoSucursal(centro, enPanama('2026-11-11', '22:00'))).toMatchObject({ abierto: false, detalle: 'Abre mañana a las 11:00' });
  });
  it('usa la hora de Panamá aunque la fecha venga en UTC', () => {
    // 02:30Z = 21:30 en Panamá: Centro abierto (cierra 22:00)
    expect(estadoSucursal(centro, new Date('2026-11-12T02:30:00Z')).abierto).toBe(true);
    // 03:00Z = 22:00 en Panamá: cerrado
    expect(estadoSucursal(centro, new Date('2026-11-12T03:00:00Z')).abierto).toBe(false);
  });
  it('sin horario devuelve un estado neutro', () => {
    expect(estadoSucursal(undefined, new Date())).toMatchObject({ abierto: false, etiqueta: 'Horario no disponible' });
  });
});

describe('menuDelDiaActivo', () => {
  it('lunes a viernes de 11:00 a 15:00 (hora de Panamá)', () => {
    expect(menuDelDiaActivo(enPanama('2026-11-11', '11:00'))).toBe(true); // miércoles
    expect(menuDelDiaActivo(enPanama('2026-11-11', '14:59'))).toBe(true);
    expect(menuDelDiaActivo(enPanama('2026-11-11', '15:00'))).toBe(false);
    expect(menuDelDiaActivo(enPanama('2026-11-14', '12:00'))).toBe(false); // sábado
  });
});
