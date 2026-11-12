// Lógica pura del bloque B (cabecera, contadores de cifras, estado corto de sucursal).
import { describe, it, expect } from 'vitest';
import { estadoCabecera, indiceMenu } from '../src/ui/cabecera.js';
import { formatearCifra, cifraEn, easeOutCubic } from '../src/ui/reveal.js';
import { estadoCorto } from '../src/ui/branch-picker.js';
import { estadoSucursal } from '../src/core/horario.js';

describe('estadoCabecera', () => {
  it('es transparente mientras el héroe sigue bajo la cabecera', () => {
    expect(estadoCabecera({ hayHeroe: true, finHeroe: 848, altoCabecera: 72, scrollY: 0 })).toBe('transparente');
    expect(estadoCabecera({ hayHeroe: true, finHeroe: 73, altoCabecera: 72, scrollY: 775 })).toBe('transparente');
  });
  it('pasa a sólida con sombra al dejar atrás el héroe', () => {
    expect(estadoCabecera({ hayHeroe: true, finHeroe: 72, altoCabecera: 72, scrollY: 776 })).toBe('flotante');
    expect(estadoCabecera({ hayHeroe: true, finHeroe: -300, altoCabecera: 72, scrollY: 1200 })).toBe('flotante');
  });
  it('sin héroe es sólida arriba y flotante al desplazarse', () => {
    expect(estadoCabecera({ hayHeroe: false, scrollY: 0 })).toBe('solida');
    expect(estadoCabecera({ hayHeroe: false, scrollY: 8 })).toBe('solida');
    expect(estadoCabecera({ hayHeroe: false, scrollY: 9 })).toBe('flotante');
    expect(estadoCabecera()).toBe('solida');
  });
});

describe('indiceMenu (teclado del menú «Demo»)', () => {
  it('flechas con vuelta al principio y al final', () => {
    expect(indiceMenu(0, 3, 'ArrowDown')).toBe(1);
    expect(indiceMenu(2, 3, 'ArrowDown')).toBe(0);
    expect(indiceMenu(0, 3, 'ArrowUp')).toBe(2);
    expect(indiceMenu(1, 3, 'ArrowUp')).toBe(0);
  });
  it('sin foco: abajo va al primero, arriba al último', () => {
    expect(indiceMenu(-1, 3, 'ArrowDown')).toBe(0);
    expect(indiceMenu(-1, 3, 'ArrowUp')).toBe(2);
  });
  it('Inicio/Fin y teclas que no mueven', () => {
    expect(indiceMenu(1, 3, 'Home')).toBe(0);
    expect(indiceMenu(1, 3, 'End')).toBe(2);
    expect(indiceMenu(1, 3, 'a')).toBeNull();
    expect(indiceMenu(1, 3, 'Enter')).toBeNull();
    expect(indiceMenu(0, 0, 'ArrowDown')).toBeNull();
  });
});

describe('cifras animadas', () => {
  it('formatea con coma decimal y punto de miles', () => {
    expect(formatearCifra(4.8, 1)).toBe('4,8');
    expect(formatearCifra(2140)).toBe('2.140');
    expect(formatearCifra(40)).toBe('40');
    expect(formatearCifra(0, 1)).toBe('0,0');
    expect(formatearCifra(1234567.5, 1)).toBe('1.234.567,5');
    expect(formatearCifra('x')).toBe('');
  });
  it('easeOutCubic va de 0 a 1 y se acota', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(2)).toBe(1);
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875);
  });
  it('el contador empieza en 0, termina en el valor exacto y no lo supera', () => {
    expect(cifraEn(0, 40)).toBe('0');
    expect(cifraEn(900, 40)).toBe('40');
    expect(cifraEn(5000, 4.8, 1)).toBe('4,8');
    expect(cifraEn(450, 4.8, 1)).toBe('4,2');
    for (let ms = 0; ms <= 900; ms += 50) expect(Number(cifraEn(ms, 12))).toBeLessThanOrEqual(12);
  });
});

describe('estadoCorto (selector de sucursal con foto)', () => {
  const horario = { abre: '11:00', cierra: '22:00' };
  // 17:00 UTC = 12:00 en Panamá (UTC−5)
  const a = (iso) => estadoSucursal(horario, new Date(iso));
  it('abierto, cierra pronto y cerrado (hora de Panamá)', () => {
    expect(estadoCorto(a('2026-11-11T17:00:00Z'), horario)).toBe('Abierto · cierra 22:00');
    expect(estadoCorto(a('2026-11-12T02:45:00Z'), horario)).toBe('Cierra pronto · 22:00');
    expect(estadoCorto(a('2026-11-11T14:00:00Z'), horario)).toBe('Cerrado · abre hoy 11:00');
    expect(estadoCorto(a('2026-11-12T03:30:00Z'), horario)).toBe('Cerrado · abre mañana 11:00');
  });
  it('sin datos', () => {
    expect(estadoCorto(null, horario)).toBe('Horario no disponible');
    expect(estadoCorto(estadoSucursal({}), {})).toBe('Horario no disponible');
  });
});
