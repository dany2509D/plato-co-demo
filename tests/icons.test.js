import { describe, it, expect } from 'vitest';
import { icono, circuloIcono, ICONOS } from '../src/ui/icons.js';

const NOMBRES = ['pedido','cocina','listo','en-camino','entregado','retiro','reserva','persona','chat','web','check','alerta','movil','panel','menu','cerrar','flecha','mas','reloj'];

describe('icono', () => {
  it('incluye todos los nombres del contrato', () => {
    for (const n of NOMBRES) expect(ICONOS).toContain(n);
  });
  it.each(NOMBRES)('%s devuelve un svg válido', (n) => {
    const s = icono(n);
    expect(s).toMatch(/^<svg /);
    expect(s).toContain('viewBox="0 0 24 24"');
    expect(s).toContain('stroke-width="1.5"');
    expect(s).toContain('stroke="currentColor"');
    expect(s).toContain('fill="none"');
    expect(s).toContain('aria-hidden="true"');
    expect(s).toMatch(/<\/svg>$/);
    expect(s).toMatch(/<(path|circle)/);
  });
  it('respeta el tamaño', () => {
    expect(icono('mas', { tam: 32 })).toContain('width="32" height="32"');
    expect(icono('mas', { tam: 'x' })).toContain('width="20"');
  });
  it('con etiqueta usa role=img y escapa', () => {
    const s = icono('alerta', { etiqueta: '"><script>x</script>' });
    expect(s).toContain('role="img"');
    expect(s).not.toContain('<script>');
    expect(s).not.toContain('aria-hidden');
  });
  it('nombre desconocido no lanza y da un svg vacío seguro', () => {
    for (const n of ['nada', undefined, '__proto__', 'constructor']) {
      const s = icono(n);
      expect(s).toMatch(/^<svg /);
      expect(s).not.toContain('undefined');
    }
  });
  it('circuloIcono envuelve en un aro con tono', () => {
    expect(circuloIcono('check')).toContain('ico-aro--claro');
    expect(circuloIcono('check', { tono: 'oscuro' })).toContain('ico-aro--oscuro');
    expect(circuloIcono('check', { tono: 'raro' })).toContain('ico-aro--claro');
  });
});
