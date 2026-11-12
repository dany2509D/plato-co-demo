// Identidad visual (bloque V): logotipos, sello, sello de sucursal, patrón, ticket y paleta.
import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { brand } from '../src/config/brand.js';
import {
  logo, sello, selloSucursal, ampersand, patron, patronSvg, ticketBorde, ticketMascara, barras, aDataUri,
  VARIANTES, COLORES_LOGO,
} from '../src/ui/brand-marks.js';

const RAIZ = path.resolve(import.meta.dirname, '..');
const NOMBRE_ORIGINAL = brand.nombre;
afterEach(() => { brand.nombre = NOMBRE_ORIGINAL; });

/** Comprobación mínima de XML bien formado (sin DOMParser en Node): entidades, atributos y etiquetas balanceadas. */
function bienFormado(xml) {
  if (/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/.test(xml)) return 'ampersand sin escapar';
  const pila = [];
  const etiquetas = xml.match(/<[^>]*>/g) || [];
  for (const t of etiquetas) {
    if (t.startsWith('<?') || t.startsWith('<!')) continue;
    if (t.startsWith('</')) {
      const n = t.slice(2, -1).trim();
      if (pila.pop() !== n) return `cierre inesperado ${n}`;
      continue;
    }
    if (!/^<([a-zA-Z][\w:.-]*)(\s+[\w:.-]+="[^"<]*")*\s*\/?>$/.test(t)) return `etiqueta mal formada ${t.slice(0, 80)}`;
    if (!t.endsWith('/>')) pila.push(t.match(/^<([a-zA-Z][\w:.-]*)/)[1]);
  }
  // nada de '<' suelto en el texto
  const sinEtiquetas = xml.replace(/<[^>]*>/g, '');
  if (sinEtiquetas.includes('<')) return '< suelto';
  return pila.length === 0 ? true : `sin cerrar ${pila.join(',')}`;
}

/** Colores usados en fill/stroke/stop-color/color (sin 'none'). */
const coloresUsados = (svg) => [...svg.matchAll(/\b(?:fill|stroke|color)="([^"]+)"/g)].map((m) => m[1]).filter((c) => c !== 'none');

const sinReferenciasExternas = (s) => {
  expect(s).not.toMatch(/href="(?!#|data:image\/)/); // solo referencias internas (#id) o imágenes incrustadas
  expect(s).not.toMatch(/https?:\/\/(?!www\.w3\.org\/(2000\/svg|1999\/xlink))/);
  expect(s).not.toMatch(/<image\b(?![^>]*\shref="data:image\/)/); // <image> solo con la foto incrustada (og-image)
  expect(s).not.toMatch(/url\((?!["']?#|["']?data:)/);
};

describe('logo()', () => {
  it('ofrece las variantes y colores del contrato', () => {
    expect(VARIANTES).toEqual(expect.arrayContaining(['horizontal', 'apilado', 'monograma', 'palabra', 'simbolo']));
    expect(COLORES_LOGO).toEqual(expect.arrayContaining(['marca', 'marca-oscuro', 'tinta', 'crema', 'oro', 'actual']));
  });

  for (const variante of ['horizontal', 'apilado', 'monograma', 'palabra', 'simbolo']) {
    for (const color of ['marca', 'marca-oscuro', 'tinta', 'crema', 'oro', 'actual']) {
      it(`${variante} · ${color} es un SVG válido, accesible y sin referencias externas`, () => {
        const s = logo({ variante, color });
        expect(s).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
        expect(s).toMatch(/viewBox="[-\d. ]+"/);
        expect(s).toMatch(/<\/svg>$/);
        expect(bienFormado(s)).toBe(true);
        expect(s).toContain('role="img"');
        expect(s).toContain(`aria-label="Plato &amp; Co."`);
        expect(s).toContain('<title>Plato &amp; Co.</title>');
        expect(s).not.toContain('<text'); // contorneado: funciona como <img> sin la fuente
        sinReferenciasExternas(s);
      });
    }
  }

  it('las versiones de una tinta solo usan ese color (o currentColor)', () => {
    const esperado = { tinta: brand.colores.tinta, crema: brand.colores.crema, oro: brand.colores.oro, actual: 'currentColor' };
    for (const variante of ['horizontal', 'apilado', 'monograma', 'palabra', 'simbolo']) {
      for (const [color, valor] of Object.entries(esperado)) {
        const usados = new Set(coloresUsados(logo({ variante, color })).map((c) => c.toLowerCase()));
        expect([...usados], `${variante}/${color}`).toEqual([valor.toLowerCase()]);
      }
    }
  });

  it('la versión a todo color usa la paleta de brand.colores', () => {
    const s = logo({ variante: 'horizontal' }).toLowerCase();
    for (const c of [brand.colores.tinta, brand.colores.tomate, brand.colores.oro]) expect(s).toContain(c.toLowerCase());
  });

  it('escapa el nombre: «A&B <x>» no rompe el SVG', () => {
    brand.nombre = 'A&B <x>';
    for (const variante of ['horizontal', 'apilado', 'monograma', 'palabra', 'simbolo']) {
      const s = logo({ variante });
      expect(bienFormado(s), variante).toBe(true);
      expect(s).toContain('aria-label="A&amp;B &lt;x&gt;"');
      expect(s).not.toContain('<x>');
    }
    const d = logo({ variante: 'palabra', decorativo: true });
    expect(d).toContain('aria-hidden="true"');
    expect(d).not.toContain('role="img"');
  });

  it('tam fija el alto en px y conserva la proporción; sin tam es fluido', () => {
    const s = logo({ variante: 'horizontal', tam: 40 });
    const [, , w, h] = s.match(/viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/).slice(1).map(Number);
    expect(s).toContain('height="40"');
    const ancho = Number(s.match(/ width="([\d.]+)"/)[1]);
    expect(ancho).toBeCloseTo((40 * w) / h, 0);
    expect(logo({ variante: 'horizontal' })).not.toMatch(/ height="/);
  });

  it('valores desconocidos caen a los por defecto sin lanzar', () => {
    expect(() => logo({ variante: 'x', color: 'y', tam: 'z' })).not.toThrow();
    expect(bienFormado(logo({ variante: 'x', color: 'y', tam: 'z' }))).toBe(true);
  });
});

describe('sello()', () => {
  it('por defecto lleva el lema y el nombre, contorneado y accesible', () => {
    const s = sello();
    expect(bienFormado(s)).toBe(true);
    expect(s).toContain('role="img"');
    expect(s).toContain(`aria-label="${brand.lema} · Plato &amp; Co."`);
    expect(s).not.toContain('<text');
    sinReferenciasExternas(s);
  });

  it('dos combinaciones: tinta (sobre pergamino) y oro (sobre carbón), con fondo opcional para fotos', () => {
    const tinta = sello({ color: 'tinta', fondo: true });
    const oro = sello({ color: 'oro', fondo: true });
    expect(tinta.toLowerCase()).toContain(brand.colores.tinta.toLowerCase());
    expect(tinta.toLowerCase()).toContain(brand.colores.papel.toLowerCase());
    expect(oro.toLowerCase()).toContain(brand.colores.oro.toLowerCase());
    expect(oro.toLowerCase()).toContain(brand.colores.carbon.toLowerCase());
  });

  it('modo texto usa <textPath> con una pila de fuentes que cae con gracia', () => {
    const s = sello({ texto: 'Hecho al momento', modo: 'texto' });
    expect(bienFormado(s)).toBe(true);
    expect(s).toContain('<textPath');
    expect(s).toMatch(/font-family="Anton, Impact, [^"]*sans-serif"/);
    expect(s).toMatch(/href="#sello-\w+"/);
    expect(s).toContain('HECHO AL MOMENTO');
  });

  it('escapa el texto', () => {
    const s = sello({ texto: '<b>"x" & y</b>', modo: 'texto' });
    expect(bienFormado(s)).toBe(true);
    expect(s).not.toContain('<b>');
    const c = sello({ texto: '<b>"x" & y</b>' });
    expect(bienFormado(c)).toBe(true);
  });

  it('cada sello en modo texto tiene un id propio (varios en la misma página)', () => {
    const a = sello({ modo: 'texto' }).match(/id="([^"]+)"/)[1];
    const b = sello({ modo: 'texto' }).match(/id="([^"]+)"/)[1];
    expect(a).not.toBe(b);
  });
});

describe('selloSucursal()', () => {
  it('numera 01 · 02 · 03 con el nombre corto de cada sucursal', () => {
    const esperados = [['01', 'Centro'], ['02', 'Costa'], ['03', 'Norte']];
    esperados.forEach(([nn, corto], i) => {
      const s = selloSucursal(i + 1);
      expect(bienFormado(s)).toBe(true);
      expect(s).toContain(`aria-label="Sucursal ${nn} · ${corto}"`);
      expect(s).not.toContain('<text');
      sinReferenciasExternas(s);
    });
  });
  it('fuera de rango devuelve cadena vacía, sin lanzar', () => {
    expect(selloSucursal(0)).toBe('');
    expect(selloSucursal(99)).toBe('');
    expect(selloSucursal('x')).toBe('');
  });
});

describe('ampersand, patrón y ticket', () => {
  it('ampersand es decorativo por defecto y del color pedido', () => {
    const s = ampersand({ color: 'oro' });
    expect(bienFormado(s)).toBe(true);
    expect(s).toContain('aria-hidden="true"');
    expect(new Set(coloresUsados(s).map((c) => c.toLowerCase()))).toEqual(new Set([brand.colores.oro.toLowerCase()]));
    expect(ampersand({ estilo: 'contorno', color: 'actual' })).toContain('stroke="currentColor"');
  });

  it('patron() devuelve un data-URI de menos de 3 KB, uno por tono', () => {
    for (const tono of ['claro', 'oscuro']) {
      const u = patron({ tono });
      expect(u).toMatch(/^url\("data:image\/svg\+xml,/);
      expect(u.length).toBeLessThan(3072);
      expect(u.slice(5, -2)).not.toMatch(/[<>#"]/); // dentro de url("…"): sin caracteres que rompan el CSS
    }
    expect(patron({ tono: 'claro' })).not.toBe(patron({ tono: 'oscuro' }));
    const s = patronSvg({ tono: 'oscuro' });
    expect(bienFormado(s)).toBe(true);
    expect(s).toContain('aria-hidden="true"');
    sinReferenciasExternas(s);
  });

  it('ticketBorde() da una tira SVG decorativa en las tres formas; ticketMascara() un url() de CSS', () => {
    for (const forma of ['dientes', 'ondas', 'perforado']) {
      for (const lado of ['arriba', 'abajo']) {
        const s = ticketBorde({ forma, lado });
        expect(bienFormado(s), `${forma}/${lado}`).toBe(true);
        expect(s).toContain('aria-hidden="true"');
        expect(ticketMascara({ forma, lado })).toMatch(/^url\("data:image\/svg\+xml,/);
      }
    }
  });

  it('barras() es determinista por texto y decorativo', () => {
    expect(barras('PED-048')).toBe(barras('PED-048'));
    expect(barras('PED-048')).not.toBe(barras('PED-049'));
    expect(bienFormado(barras('<x>&'))).toBe(true);
    expect(barras('PED-048')).toContain('aria-hidden="true"');
  });

  it('aDataUri codifica lo justo para CSS', () => {
    const u = aDataUri('<svg xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="M0 0"/></svg>');
    expect(u.startsWith('data:image/svg+xml,')).toBe(true);
    expect(u).not.toMatch(/[<>#"]/);
  });
});

describe('brand.js', () => {
  it('logoSvg conserva el contrato de la cabecera y del teléfono', () => {
    expect(brand.logoSvg).toMatch(/viewBox="0 0 48 48"/);
    expect(brand.logoSvg).toContain(' role="img" aria-label="Plato &amp; Co."');
    const cabecera = brand.logoSvg.replace(/role="img"\s+aria-label="[^"]*"/, 'aria-hidden="true" focusable="false"');
    expect(cabecera).toContain('aria-hidden="true"');
    expect(bienFormado(brand.logoSvg)).toBe(true);
    sinReferenciasExternas(brand.logoSvg);
  });
  it('trae iniciales, lema y la paleta con alias antiguos', () => {
    expect(brand.iniciales).toBe('P&C');
    expect(brand.lema).toBe('Hecho al momento');
    for (const k of ['crema', 'terracota', 'amarillo', 'tinta', 'tomate', 'oro', 'papel', 'carbon']) expect(brand.colores[k]).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(brand.colores.terracota).toBe(brand.colores.tomate);
    expect(brand.colores.amarillo).toBe(brand.colores.oro);
  });
});

describe('archivos de src/assets/brand', () => {
  const dir = path.join(RAIZ, 'src/assets/brand');
  const svgs = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.svg')) : [];
  it('existen los archivos clave', () => {
    for (const f of ['favicon.svg', 'favicon-16.svg', 'safari-pinned-tab.svg', 'logo-horizontal.svg', 'logo-apilado.svg', 'monograma.svg', 'sello.svg', 'patron-claro.svg', 'apple-touch-icon.png', 'og-image.svg']) {
      expect(fs.existsSync(path.join(dir, f)), f).toBe(true);
    }
  });
  it('los PNG tienen las medidas de su uso (apple-touch 180×180; og-image 1200×630 en public/marca para una URL estable)', () => {
    const medidas = (f) => { const b = fs.readFileSync(f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
    expect(medidas(path.join(dir, 'apple-touch-icon.png'))).toEqual([180, 180]);
    expect(medidas(path.join(RAIZ, 'public/marca/og-image.png'))).toEqual([1200, 630]);
  });
  it('index.html enlaza favicon, apple-touch, mask-icon, theme-color y Open Graph', () => {
    const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
    expect(html).toMatch(/<link rel="icon" href="data:image\/svg\+xml,[^"]+"/); // respaldo en línea (sin 404 de /favicon.ico)
    expect(html).toMatch(/<link rel="icon" type="image\/svg\+xml" href="\/src\/assets\/brand\/favicon\.svg"/);
    expect(html).toContain('rel="apple-touch-icon" href="/src/assets/brand/apple-touch-icon.png"');
    expect(html).toMatch(/rel="mask-icon" href="\/src\/assets\/brand\/safari-pinned-tab\.svg" color="#[0-9a-f]{6}"/i);
    expect(html).toMatch(/<meta name="theme-color" content="#[0-9a-f]{6}"/i);
    for (const p of ['og:title', 'og:description', 'og:image', 'og:image:width', 'og:locale']) expect(html).toContain(`property="${p}"`);
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toMatch(/<meta name="description" content="[^"]{50,160}"/);
  });
  it('cada SVG está bien formado, contorneado (sin <text>) y sin referencias externas', () => {
    expect(svgs.length).toBeGreaterThan(8);
    for (const f of svgs) {
      const s = fs.readFileSync(path.join(dir, f), 'utf8').trim();
      expect(bienFormado(s), f).toBe(true);
      expect(s, f).not.toContain('<text');
      sinReferenciasExternas(s);
    }
  });
});

describe('paleta (tokens.css)', () => {
  const css = fs.readFileSync(path.join(RAIZ, 'src/styles/tokens.css'), 'utf8');
  const tok = (n) => css.match(new RegExp(`--${n}:\\s*(#[0-9a-fA-F]{6})`))[1];
  const lum = (h) => {
    const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const cr = (a, b) => { const x = lum(a); const y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  it.each([
    ['c-ember', 'c-canvas'], ['c-ember', 'c-linen'], ['c-ember', 'c-paper'], ['c-on-dark', 'c-ember'], ['c-on-dark-muted', 'c-ember'],
    ['c-char', 'c-gold'], ['c-char', 'c-gold-hover'], ['c-gold', 'c-char'], ['c-gold', 'c-card'], ['c-gold', 'c-ember'], ['c-gold', 'c-ink'],
    ['c-canvas', 'c-ember-deep'],
  ])('%s sobre %s ≥ 4,5:1 (AA)', (a, b) => {
    expect(cr(tok(a), tok(b))).toBeGreaterThanOrEqual(4.5);
  });
  it('el par tomate/mostaza ya no es el de la referencia (#823513 / #faae33)', () => {
    expect(tok('c-ember').toLowerCase()).not.toBe('#823513');
    expect(tok('c-gold').toLowerCase()).not.toBe('#faae33');
    expect(tok('c-ember').toLowerCase()).toBe(brand.colores.tomate.toLowerCase());
    expect(tok('c-gold').toLowerCase()).toBe(brand.colores.oro.toLowerCase());
  });
});
