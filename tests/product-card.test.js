import { describe, it, expect, afterEach } from 'vitest';
import { productCardHTML, miniProducto, dialogoCabecera } from '../src/ui/product-card.js';
import { _usarFotos } from '../src/ui/photo.js';

const P = { id: 'prod-07-hamburguesa-clasica', nombre: 'Hamburguesa <b>clásica</b>', precio: 8.95, categoria: 'Hamburguesas', vegetariano: true, alergenosDeclarados: true, alergenos: ['gluten'], modificadores: [] };

describe('tarjeta de plato', () => {
  afterEach(() => _usarFotos());
  it('foto 800×600 lazy, botón accesible y data-add; escapa el nombre', () => {
    const h = productCardHTML(P);
    expect(h).toContain('width="800" height="600"');
    expect(h).toContain('loading="lazy"');
    expect(h).toContain(`data-add="${P.id}"`);
    expect(h).toContain('aria-label="Agregar Hamburguesa &lt;b&gt;clásica&lt;/b&gt;"');
    expect(h).toContain('Contiene: gluten');
    expect(h).toContain('(V)');
  });
  it('sin datos declarados no afirma nada: pide consultar', () => {
    const h = productCardHTML({ ...P, alergenosDeclarados: false });
    expect(h).toContain('Consulte alérgenos');
    expect(h).not.toMatch(/libre de|sin gluten/i);
  });
  it('agotado: etiqueta y botón deshabilitado', () => {
    const h = productCardHTML(P, { agotado: true });
    expect(h).toContain('Agotado hoy');
    expect(h).toMatch(/data-add="[^"]+"[^>]*disabled/);
    expect(h).toContain('foto--agotado');
  });
  it('sin foto en el manifiesto muestra el SVG de respaldo, no un img roto', () => {
    _usarFotos({ menu: {}, hero: {} });
    const h = productCardHTML(P);
    expect(h).toContain('svg class="dish-art"');
    expect(h).not.toContain('<img');
  });
  it('mini y cabecera del diálogo usan la foto', () => {
    expect(miniProducto(P)).toContain('foto--mini');
    expect(dialogoCabecera(P)).toContain('foto--modal');
  });
});
