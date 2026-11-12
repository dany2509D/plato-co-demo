import { describe, it, expect } from 'vitest';
import { estadoVacio, TIPOS_VACIO } from '../src/ui/estados-vacios.js';

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

describe('estadoVacio', () => {
  it('cubre los 7 tipos pedidos', () => {
    expect(TIPOS_VACIO).toEqual(['carrito', 'pedidos-cocina', 'reservas', 'en-vivo', 'busqueda', 'agotados', 'historial']);
  });
  it.each(TIPOS_VACIO)('%s: título, ayuda e ilustración decorativa, sin emoji', (t) => {
    const h = estadoVacio(t);
    expect(h.length).toBeGreaterThan(200);
    expect(h).toContain('<svg');
    expect(h).toContain('aria-hidden="true"');
    expect(h).toMatch(/<p class="ev__t">[^<]+<\/p>/);
    expect(h).toMatch(/<p class="ev__txt">[^<]+<\/p>/);
    expect(EMOJI.test(h)).toBe(false);
  });
  it('ningún enlace o botón queda vacío ni sin href', () => {
    for (const t of TIPOS_VACIO) {
      const h = estadoVacio(t);
      for (const m of h.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
        expect(m[1]).toMatch(/href="[^"]+"/);
        expect(m[2].replace(/<[^>]*>/g, '').trim().length).toBeGreaterThan(0);
      }
      for (const m of h.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)) expect(m[1].trim().length).toBeGreaterThan(0);
    }
  });
  it('acepta t() inyectable, sobrescrituras y escapa', () => {
    const h = estadoVacio('carrito', { t: (k, d) => (k === 'vacio.carrito.titulo' ? 'Vacío <b>' : d), accion: { texto: 'Ir', href: '#/x"y' } });
    expect(h).toContain('Vacío &lt;b&gt;');
    expect(h).toContain('href="#/x&quot;y"');
  });
  it('accion:false quita la acción; sin href la acción es un botón', () => {
    expect(estadoVacio('carrito', { accion: false })).not.toContain('ev__accion');
    expect(estadoVacio('busqueda')).toContain('<button class="ev__accion" type="button" data-accion="limpiar">');
  });
  it('tipo desconocido cae a un estado válido; tono oscuro', () => {
    expect(estadoVacio('nada')).toContain('ev--en-vivo');
    expect(estadoVacio('carrito', { tono: 'oscuro' })).toContain('ev--oscuro');
  });
});
