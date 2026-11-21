/**
 * Fotografía · Plato & Co. (rediseño 2, bloque A). Único punto de acceso a las fotos de `src/assets/photos/`.
 * Toda vista debe usar estas funciones; no escriba `<img>` de fotos a mano.
 *
 * API (todas devuelven un string HTML listo para `innerHTML`; todo texto del manifiesto va escapado con esc()):
 *
 *   fotoProducto(p, { variante = 'grid', eager = false, clase = '' })
 *     p        producto del store (usa p.id, p.nombre, p.categoria, y p.agotado opcional → `.foto--agotado`).
 *     variante 'grid'  4:3 a todo el ancho de su contenedor (img 800×600)
 *              'fila'  4:3, 120 px de ancho (img 120×90 en atributos; menú en celular)
 *              'mini'  4:3, 64 px de ancho (img 64×48; carrito, pedido, admin, «más vendidos»)
 *              'modal' 16:9 (recorte de la 4:3 con object-position 50% 55%; diálogo de modificadores)
 *     eager    true → loading="eager" fetchpriority="high" (solo para la primera foto visible / LCP).
 *     clase    clases extra para el contenedor `.foto` (p. ej. 'foto--warm').
 *     Sin foto en el manifiesto → el SVG `dishArt(p)` dentro de la MISMA caja `.foto` (misma proporción).
 *     Si la imagen falla al cargar, un único listener global la sustituye por ese SVG (img[data-respaldo]).
 *   fotoEscena(clave, { eager = false, clase = '', ratio, alt })
 *     clave  una clave de `manifest.hero`: hero, ambiente_salon, ambiente_parrilla, delivery, cta_ingredientes,
 *            sucursal_1, sucursal_2, sucursal_3. width/height salen del manifiesto (1600×900 u 800×600).
 *     ratio  'W/H' o número para el aspect-ratio del contenedor (por defecto, el de la foto). alt: sobrescribe el del
 *            manifiesto; alt: '' la marca como decorativa. Clave desconocida → caja `.foto` vacía, sin <img>.
 *   urlEscena(clave)  → URL con hash de la foto de escena ('' si no existe)  (para fondos CSS o precarga)
 *   hayFoto(id)       → true si el producto `id` tiene foto resuelta
 *   resolver(manifest, files) → { menu: {id: {url, alt}}, hero: {clave: {url, alt, width, height}} }  (pura, para pruebas)
 *
 * Clases (photo.css): `.foto` (+ `--grid|--fila|--mini|--modal`, `--warm`, `--agotado`, `--respaldo`), `.reveal--foto`
 * (estado base del revelado con máscara; el observador vive en reveal.js).
 * Zoom al pasar el cursor: `.foto:hover img`; si la tarjeta entera debe reaccionar, añada `.foto-host` a la tarjeta.
 */
import manifestJson from '../assets/photos/manifest.json';
import { esc } from './dom.js';
import { dishArt } from './dish-art.js';
import '../styles/photo.css';

const ARCHIVOS = import.meta.glob('../assets/photos/**/*.webp', { eager: true, query: '?url', import: 'default' });

const DIM = { grid: [800, 600], fila: [120, 90], mini: [64, 48], modal: [800, 600] };

/** Puro: combina el manifiesto con el mapa archivo→URL que entrega Vite. Entradas sin archivo se omiten. */
export function resolver(manifest, files) {
  const url = (file) => files[`../assets/photos/${file}`];
  const out = { menu: {}, hero: {} };
  for (const [id, e] of Object.entries(manifest.menu || {})) {
    const u = url(e.file);
    if (u) out.menu[id] = { url: u, alt: e.alt || '' };
  }
  for (const [k, e] of Object.entries(manifest.hero || {})) {
    const u = url(e.file);
    if (u) out.hero[k] = { url: u, alt: e.alt || '', width: e.width, height: e.height };
  }
  return out;
}

const ORIGINAL = resolver(manifestJson, ARCHIVOS);
let FOTOS = ORIGINAL;
const respaldos = new Map(); // id → producto, para que el listener de error pueda dibujar el SVG

/** Solo para pruebas: sustituye el manifiesto resuelto (sin argumento, lo restaura). */
export function _usarFotos(f) { FOTOS = f ?? ORIGINAL; }

export const hayFoto = (id) => Boolean(FOTOS.menu[id]);
export const urlEscena = (clave) => FOTOS.hero[clave]?.url || '';

const carga = (eager) => (eager ? 'loading="eager" fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"');

export function fotoProducto(p, { variante = 'grid', eager = false, clase = '' } = {}) {
  const v = DIM[variante] ? variante : 'grid';
  const [w, h] = DIM[v];
  const cls = ['foto', `foto--${v}`, p.agotado ? 'foto--agotado' : '', clase].filter(Boolean).join(' ');
  const f = FOTOS.menu[p.id];
  if (!f) return `<div class="${esc(cls)} foto--respaldo">${dishArt(p)}</div>`;
  respaldos.set(p.id, p);
  return `<div class="${esc(cls)}"><img src="${esc(f.url)}" alt="${esc(f.alt)}" width="${w}" height="${h}" ${carga(eager)} data-respaldo="${esc(p.id)}"></div>`;
}

export function fotoEscena(clave, { eager = false, clase = '', ratio, alt } = {}) {
  const f = FOTOS.hero[clave];
  const cls = ['foto', 'foto--escena', clase].filter(Boolean).join(' ');
  if (!f) return `<div class="${esc(cls)} foto--respaldo"></div>`;
  const r = ratio ?? `${f.width}/${f.height}`;
  const texto = alt ?? f.alt;
  return `<div class="${esc(cls)}" style="--foto-ratio:${esc(r)}"><img src="${esc(f.url)}" alt="${esc(texto)}" width="${f.width}" height="${f.height}" ${carga(eager)}></div>`;
}

// Un único listener de error en captura (los eventos de carga no burbujean). Idempotente.
export function instalarRespaldo(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc || doc.__fotoRespaldo) return;
  doc.__fotoRespaldo = true;
  doc.addEventListener('error', (ev) => {
    const img = ev.target;
    if (!img || img.tagName !== 'IMG' || !img.hasAttribute('data-respaldo')) return;
    const p = respaldos.get(img.getAttribute('data-respaldo'));
    const caja = img.closest('.foto');
    const t = doc.createElement('template');
    t.innerHTML = p ? dishArt(p) : '';
    if (caja) caja.classList.add('foto--respaldo');
    img.replaceWith(...t.content.childNodes);
  }, true);
}
instalarRespaldo();
