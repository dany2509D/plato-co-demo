// Genera los archivos de marca (SVG contorneados) a partir de src/config/brand.js.
// Uso (desde la raíz del repo):  npx vite-node src/assets/brand/generar-marca.mjs
// Después: rasterice los PNG (apple-touch-icon 180×180 y og-image 1200×630) como indica docs/brand/identidad-visual.md
// (Playwright: abrir og-image.svg / apple-touch-icon.svg y hacer captura exacta). Ningún archivo depende de la fuente.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  logo, sello, selloSucursal, ampersand, patronSvg, favicon, paleta, textoContorno,
} from '../../ui/brand-marks.js';
import { plato, coloresPlato } from './geometria.js';
import { brand } from '../../config/brand.js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(DIR, '../../..');
const P = paleta();
const escribir = (nombre, svg) => { fs.writeFileSync(path.join(DIR, nombre), svg.trim() + '\n'); console.log('·', nombre, svg.length, 'B'); };

// Favicons e iconos
escribir('favicon.svg', favicon(32));
escribir('favicon-16.svg', favicon(16));
// Sin aria-label: Vite incrusta este archivo como data-URI en index.html y un «&amp;» decodificado rompería el XML.
escribir('safari-pinned-tab.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true">${plato(50, 50, 49, { uno: '#000' })}</svg>`);
escribir('apple-touch-icon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180" aria-hidden="true" focusable="false"><rect width="180" height="180" fill="${P.carbon}"/>${plato(90, 90, 62, { color: coloresPlato(P) })}</svg>`);

// Logotipos
for (const [sufijo, color] of [['', 'marca'], ['-oscuro', 'marca-oscuro'], ['-tinta', 'tinta'], ['-crema', 'crema'], ['-oro', 'oro']]) {
  escribir(`logo-horizontal${sufijo}.svg`, logo({ variante: 'horizontal', color }));
  escribir(`logo-apilado${sufijo}.svg`, logo({ variante: 'apilado', color }));
  escribir(`logo-palabra${sufijo}.svg`, logo({ variante: 'palabra', color }));
  escribir(`simbolo${sufijo}.svg`, logo({ variante: 'simbolo', color }));
  escribir(`monograma${sufijo}.svg`, logo({ variante: 'monograma', color }));
}

// Sellos, &, patrón
escribir('sello.svg', sello({ color: 'tinta' }));
escribir('sello-fondo.svg', sello({ color: 'tinta', fondo: true }));
escribir('sello-oro.svg', sello({ color: 'oro', fondo: true }));
(brand.sucursales || []).forEach((_, i) => escribir(`sucursal-${String(i + 1).padStart(2, '0')}.svg`, selloSucursal(i + 1, { fondo: true })));
escribir('ampersand.svg', ampersand({ color: 'oro' }));
escribir('patron-claro.svg', patronSvg({ tono: 'claro' }));
escribir('patron-oscuro.svg', patronSvg({ tono: 'oscuro' }));

// Imagen para compartir 1200×630 (la foto va incrustada como data-URI: el SVG no enlaza nada externo)
const heroRuta = path.join(RAIZ, 'src/assets/photos/hero/hero.webp');
if (fs.existsSync(heroRuta)) {
  const b64 = fs.readFileSync(heroRuta).toString('base64');
  const titulo = textoContorno(`${brand.lema}.`, { x: 64, base: 252, cap: 92, color: P.crema });
  const bajada = textoContorno('Pida por WhatsApp · reserve en línea', { x: 66, base: 298, cap: 22, color: P.oro, espacio: 1 });
  const logoH = logo({ variante: 'horizontal', color: 'marca-oscuro', tam: 52, decorativo: true }).replace('<svg ', '<svg x="64" y="56" ');
  const selloO = sello({ color: 'oro', fondo: true, tam: 170, decorativo: true }).replace('<svg ', '<svg x="976" y="44" ');
  const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="${brand.nombre.replace(/&/g, '&amp;')} · ${brand.lema}">`
    + '<rect width="1200" height="630" fill="#0d0e10"/>' // negro de la propia foto: sin franja en el borde superior
    + `<image href="data:image/webp;base64,${b64}" x="-110" y="0" width="1352" height="760" preserveAspectRatio="xMidYMid slice"/>`
    + `${logoH}${titulo.svg}${bajada.svg}<g transform="rotate(-8 1061 129)">${selloO}</g></svg>`;
  escribir('og-image.svg', og);
}
