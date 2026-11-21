import { describe, it, expect, afterEach } from 'vitest';
import { buildSeed } from '../src/data/seed.js';
import { fotoProducto, fotoEscena, urlEscena, hayFoto, resolver, _usarFotos } from '../src/ui/photo.js';
import manifest from '../src/assets/photos/manifest.json';

const productos = buildSeed(new Date('2026-11-11T15:00:00Z')).productos;
const HERO = ['hero', 'ambiente_salon', 'ambiente_parrilla', 'delivery', 'cta_ingredientes', 'sucursal_1', 'sucursal_2', 'sucursal_3'];

describe('photo.js · productos', () => {
  it('los 40 productos de la semilla tienen foto resuelta (URL no vacía)', () => {
    expect(productos).toHaveLength(40);
    for (const p of productos) {
      expect(hayFoto(p.id), p.id).toBe(true);
      expect(fotoProducto(p)).toMatch(/<img src="[^"]+\.webp/);
    }
  });

  it('img siempre con alt, width, height, loading y decoding; grid 800×600 lazy', () => {
    const h = fotoProducto(productos[0]);
    expect(h).toMatch(/alt="[^"]+"/);
    expect(h).toContain('width="800" height="600"');
    expect(h).toContain('loading="lazy"');
    expect(h).toContain('decoding="async"');
    expect(h).toContain('data-respaldo=');
    expect(h).not.toMatch(/ on\w+=/); // sin JS en línea
  });

  it('variantes: fila 120×90, mini 64×48, modal 800×600 con clase foto--modal', () => {
    expect(fotoProducto(productos[0], { variante: 'fila' })).toContain('width="120" height="90"');
    expect(fotoProducto(productos[0], { variante: 'mini' })).toContain('width="64" height="48"');
    const m = fotoProducto(productos[0], { variante: 'modal' });
    expect(m).toContain('foto--modal');
    expect(m).toContain('width="800" height="600"');
  });

  it('eager añade loading="eager" y fetchpriority="high" (y no lazy)', () => {
    const h = fotoProducto(productos[0], { eager: true });
    expect(h).toContain('loading="eager"');
    expect(h).toContain('fetchpriority="high"');
    expect(h).not.toContain('loading="lazy"');
    expect(fotoProducto(productos[0])).not.toContain('fetchpriority');
  });

  it('id sin foto → dishArt dentro de la misma caja 4:3, sin <img>', () => {
    const h = fotoProducto({ id: 'prod-99-desconocido', nombre: 'Plato nuevo', categoria: 'Entradas' });
    expect(hayFoto('prod-99-desconocido')).toBe(false);
    expect(h).toContain('class="foto foto--grid foto--respaldo"');
    expect(h).toContain('<svg class="dish-art"');
    expect(h).not.toContain('<img');
  });

  it('agotado marca foto--agotado', () => {
    expect(fotoProducto({ ...productos[0], agotado: true })).toContain('foto--agotado');
  });
});

describe('photo.js · escapado y escenas', () => {
  afterEach(() => _usarFotos());

  it('el alt del manifiesto se escapa: un alt con "< no rompe el atributo', () => {
    const malo = resolver(
      { menu: { x1: { file: 'menu/a.webp', alt: 'Uno "><script>alert(1)</script>' } }, hero: { hero: { file: 'hero/h.webp', alt: 'Hé "<b>', width: 1600, height: 900 } } },
      { '../assets/photos/menu/a.webp': '/a.webp', '../assets/photos/hero/h.webp': '/h.webp' },
    );
    _usarFotos(malo);
    const h = fotoProducto({ id: 'x1', nombre: 'X', categoria: 'Entradas' });
    expect(h).not.toContain('<script');
    expect(h).toContain('alt="Uno &quot;&gt;&lt;script&gt;');
    const e = fotoEscena('hero');
    expect(e).not.toContain('<b>');
    expect(e).toContain('alt="Hé &quot;&lt;b&gt;"');
  });
});

describe('photo.js · escenas (hero)', () => {
  it('las 8 claves del manifiesto resuelven URL con width/height', () => {
    expect(Object.keys(manifest.hero).sort()).toEqual([...HERO].sort());
    for (const k of HERO) {
      expect(urlEscena(k), k).toMatch(/\.webp/);
      const h = fotoEscena(k);
      expect(h).toContain(`width="${manifest.hero[k].width}" height="${manifest.hero[k].height}"`);
      expect(h).toMatch(/alt="[^"]+"/);
    }
    expect(fotoEscena('hero')).toContain('width="1600" height="900"');
    expect(fotoEscena('sucursal_1')).toContain('width="800" height="600"');
  });

  it('eager, ratio, clase y alt sobrescrito', () => {
    const h = fotoEscena('hero', { eager: true, clase: 'foto--warm', ratio: '4/1', alt: '' });
    expect(h).toContain('loading="eager" fetchpriority="high"');
    expect(h).toContain('foto--warm');
    expect(h).toContain('--foto-ratio:4/1');
    expect(h).toContain('alt=""');
    expect(fotoEscena('delivery')).toContain('loading="lazy"');
  });

  it('clave desconocida: caja vacía sin img y urlEscena vacío', () => {
    expect(fotoEscena('no-existe')).not.toContain('<img');
    expect(urlEscena('no-existe')).toBe('');
  });
});
