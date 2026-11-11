import { describe, it, expect } from 'vitest';
import {
  formatHora, diaPanama, etiquetaDia, agruparPorDia, segmentos, textoSeguroHtml, escapeHtml,
  mensajesNuevos, retardoEscribiendo, leidos, horaMensaje,
} from '../src/core/chat-view.js';

describe('hora de Panamá', () => {
  it('convierte UTC a UTC-5 en 12 horas', () => {
    expect(formatHora('2026-11-11T20:05:00Z')).toBe('3:05 p. m.');
    expect(formatHora('2026-11-11T05:00:00Z')).toBe('12:00 a. m.');
    expect(formatHora('2026-11-11T17:30:00Z')).toBe('12:30 p. m.');
    expect(formatHora('basura')).toBe('');
  });
  it('el día cambia a medianoche de Panamá, no de UTC', () => {
    expect(diaPanama('2026-11-12T03:00:00Z')).toBe('2026-11-11');
    expect(diaPanama('2026-11-12T05:00:00Z')).toBe('2026-11-12');
  });
  it('etiquetas de día', () => {
    const ahora = '2026-11-11T20:00:00Z';
    expect(etiquetaDia('2026-11-11', ahora)).toBe('Hoy');
    expect(etiquetaDia('2026-11-10', ahora)).toBe('Ayer');
    expect(etiquetaDia('2026-10-03', ahora)).toBe('3 oct. 2026');
  });
  it('horaMensaje usa en y cae a hora', () => {
    expect(horaMensaje({ en: '2026-11-11T20:05:00Z', hora: '99:99' })).toBe('3:05 p. m.');
    expect(horaMensaje({ hora: '15:05' })).toBe('15:05');
  });
});

describe('agruparPorDia', () => {
  it('agrupa en orden y separa por día de Panamá', () => {
    const ms = [
      { texto: 'a', en: '2026-11-10T20:00:00Z' },
      { texto: 'b', en: '2026-11-10T23:00:00Z' },
      { texto: 'c', en: '2026-11-11T20:00:00Z' },
    ];
    const g = agruparPorDia(ms);
    expect(g.map((x) => [x.dia, x.mensajes.length])).toEqual([['2026-11-10', 2], ['2026-11-11', 1]]);
  });
});

describe('mensajesNuevos', () => {
  it('devuelve solo los no mostrados (sin duplicar)', () => {
    const ms = [{ texto: 1 }, { texto: 2 }, { texto: 3 }];
    expect(mensajesNuevos(2, ms)).toEqual({ reiniciar: false, nuevos: [{ texto: 3 }] });
    expect(mensajesNuevos(3, ms).nuevos).toEqual([]);
  });
  it('pide repintar si el historial se acortó', () => {
    expect(mensajesNuevos(5, [{ texto: 1 }])).toEqual({ reiniciar: true, nuevos: [{ texto: 1 }] });
  });
});

describe('retardoEscribiendo', () => {
  it('queda entre 300 y 900 ms', () => {
    expect(retardoEscribiendo('')).toBe(300);
    expect(retardoEscribiendo('x'.repeat(50))).toBeGreaterThan(300);
    expect(retardoEscribiendo('x'.repeat(5000))).toBe(900);
  });
});

describe('leidos', () => {
  it('marca leído el mensaje del cliente con respuesta posterior', () => {
    expect(leidos([{ de: 'bot' }, { de: 'cliente' }, { de: 'bot' }, { de: 'cliente' }])).toEqual([false, true, false, false]);
  });
});

describe('texto seguro (XSS)', () => {
  const hostil = '<img src=x onerror=alert(1)>';
  it('escapeHtml neutraliza etiquetas', () => {
    expect(escapeHtml(hostil)).toBe('&lt;img src=x onerror=alert(1)&gt;');
    expect(escapeHtml(`"a" & 'b'`)).toBe('&quot;a&quot; &amp; &#39;b&#39;');
  });
  it('segmentos conserva el texto literal y no genera HTML', () => {
    expect(segmentos(hostil)).toEqual([{ t: 'texto', v: hostil }]);
    expect(textoSeguroHtml(hostil)).not.toContain('<img');
  });
  it('negrita se aplica después de escapar', () => {
    expect(segmentos('Total *US$ 5*\nlisto')).toEqual([
      { t: 'texto', v: 'Total ' }, { t: 'negrita', v: 'US$ 5' }, { t: 'texto', v: '\nlisto' },
    ]);
    expect(textoSeguroHtml('*<b>x</b>*')).toBe('<strong>&lt;b&gt;x&lt;/b&gt;</strong>');
  });
});
