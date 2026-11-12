import { brand } from '../config/brand.js';
import {
  logo, sello, selloSucursal, ampersand, ticketBorde, barras, favicon, paleta,
} from '../ui/brand-marks.js';
import { fotoEscena } from '../ui/photo.js';
import { esc } from '../ui/dom.js';

// Sección «Identidad» de la guía #/estilo (bloque V). Se monta al final de vistaEstilo.
// Todo sale de brand-marks.js (que lee src/config/brand.js). Guía: docs/brand/identidad-visual.md
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const cr = (a, b) => { const x = lum(a); const y = lum(b); return ((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2).replace('.', ','); };

const pieza = (lienzo, contenido, nota) => `<figure class="mi-pieza"><div class="mi-lienzo ${lienzo}">${contenido}</div><figcaption class="mi-nota">${nota}</figcaption></figure>`;

export function seccionIdentidad(main) {
  const raiz = main.querySelector('.eg') || main;
  const P = paleta();
  const colores = [
    ['Tomate', P.tomate, P.crema, '--c-ember', 'borde del plato, enlaces, banda de acento'],
    ['Mostaza', P.oro, P.carbon, '--c-gold', 'el sol del plato; relleno y texto grande sobre oscuro'],
    ['Carbón', P.carbon, P.oro, '--c-char', 'héroe, pie, bandas'],
    ['Tinta', P.tinta, P.crema, '--c-ink', 'texto y logotipo sobre claro'],
    ['Pergamino', P.crema, P.tinta, '--c-canvas', 'fondo de página'],
    ['Papel', P.papel, P.tomate, '--c-paper', 'cuerpo del plato, ticket'],
  ];

  const sec = document.createElement('section');
  sec.id = 'eg-identidad';
  sec.innerHTML = `
    <h2>Identidad</h2>
    <p class="t-lead">«Mesa de barrio con ganas.» Un plato de peltre visto desde arriba con su sol de mostaza, un &amp; de firma, el sello «${esc(brand.lema)}» y el ticket de comanda. Todo sale de <code>src/config/brand.js</code>: cambie nombre, iniciales, lema y colores y esta sección se redibuja. Guía: <code>docs/brand/identidad-visual.md</code>.</p>

    <h3>Paleta «tomate y mostaza»</h3>
    <div class="mi-colores">${colores.map(([n, c, t, tok, uso]) => `<div class="mi-color"><div class="mi-color__chip" style="background:${esc(c)};color:${esc(t)}">${n} · ${cr(c, t)}:1</div><p class="mi-nota"><code>${tok}</code> ${esc(c.toUpperCase())}<br>${uso}</p></div>`).join('')}</div>

    <h3>Símbolo: el plato</h3>
    <div class="mi-rejilla">
      ${pieza('', `<div class="mi-tamanos">${[160, 96, 64, 32].map((t) => `<figure>${logo({ variante: 'simbolo', tam: t, decorativo: true })}<span>${t}</span></figure>`).join('')}<figure>${favicon(16)}<span>16 (favicon)</span></figure></div>`, 'A todo color. Mínimo: 16 px (favicon ajustado al píxel) · 24 px en pantalla.')}
      ${pieza('mi-lienzo--carbon', `<div class="mi-tamanos">${[160, 64, 32].map((t) => logo({ variante: 'simbolo', tam: t, decorativo: true })).join('')}</div>`, 'Sobre carbón: el cuerpo de papel recorta el plato.')}
      ${pieza('', `<div class="mi-tamanos">${logo({ variante: 'simbolo', color: 'tinta', tam: 96, decorativo: true })}${logo({ variante: 'simbolo', color: 'tomate', tam: 96, decorativo: true })}</div>`, 'Una tinta: tinta · tomate (sobre claro).')}
      ${pieza('mi-lienzo--carbon', `<div class="mi-tamanos">${logo({ variante: 'simbolo', color: 'crema', tam: 96, decorativo: true })}${logo({ variante: 'simbolo', color: 'oro', tam: 96, decorativo: true })}</div>`, 'Una tinta: crema · oro (sobre oscuro y fotos).')}
    </div>

    <h3>Logotipos</h3>
    <div class="mi-rejilla">
      ${pieza('', logo({ variante: 'horizontal', tam: 72 }), 'Horizontal · <code>logo()</code> · mínimo 24 px de alto (120 px de ancho).')}
      ${pieza('mi-lienzo--carbon', logo({ variante: 'horizontal', color: 'marca-oscuro', tam: 72 }), 'Horizontal · <code>marca-oscuro</code>: letras crema, &amp; mostaza.')}
      ${pieza('mi-lienzo--oro', logo({ variante: 'horizontal', color: 'tinta', tam: 56 }), 'Sobre mostaza: siempre en tinta.')}
      ${pieza('mi-lienzo--tomate', logo({ variante: 'horizontal', color: 'crema', tam: 56 }), 'Sobre tomate: siempre en crema.')}
      ${pieza('', logo({ variante: 'apilado', tam: 200 }), 'Apilado · mínimo 64 px de ancho.')}
      ${pieza('mi-lienzo--carbon', logo({ variante: 'monograma', tam: 140 }) + logo({ variante: 'monograma', color: 'oro', tam: 64 }), `Monograma «${esc(brand.iniciales)}» dentro del plato · mínimo 32 px.`)}
    </div>
    <div class="mi-rejilla" style="margin-top:24px">
      ${pieza('mi-lienzo--carbon', `<div style="width:100%">${logo({ variante: 'palabra', color: 'oro' })}</div>`, 'Palabra sola (pie, de borde a borde). El punto de «CO.» es un plato.')}
      ${pieza('', `<span class="mi-espacio" style="--mi-aire:36px">${logo({ variante: 'horizontal', tam: 72 })}</span>`, 'Aire mínimo = medio plato (½ del diámetro del símbolo) por cada lado.')}
      ${pieza('mi-lienzo--foto mi-lienzo--foto-arriba', `${fotoEscena('hero', { alt: '' })}<div class="mi-sobre">${logo({ variante: 'horizontal', color: 'crema', tam: 48 })}</div>`, 'Sobre foto: en crema y solo en la zona oscura (aquí, el negro sobre la hamburguesa) o con velo.')}
    </div>

    <h3>Sello «${esc(brand.lema)}»</h3>
    <div class="mi-rejilla">
      ${pieza('', `<span class="marca-sello marca-sello--vivo" style="--sello-tam:180px">${sello({ color: 'tinta' })}</span>`, 'Tinta sobre pergamino (gira al pasar el cursor).')}
      ${pieza('mi-lienzo--carbon', `<span class="marca-sello" style="--sello-tam:180px">${sello({ color: 'oro' })}</span>`, 'Oro sobre carbón.')}
      ${pieza('mi-lienzo--foto', `${fotoEscena('delivery', { alt: '' })}<div class="mi-sobre"><span class="marca-sello" style="--sello-tam:160px">${sello({ color: 'oro', fondo: true })}</span></div>`, 'Sobre foto: con <code>fondo: true</code>. Mínimo 96 px.')}
      ${pieza('', `<span class="marca-sello" style="--sello-tam:160px;--sello-giro:0deg">${sello({ modo: 'texto' })}</span>`, '<code>modo: \'texto\'</code>: &lt;textPath&gt; con Anton (y respaldo Impact).')}
    </div>

    <h3>Sellos de sucursal</h3>
    <div class="mi-rejilla">
      ${pieza('', `<div class="mi-tamanos">${brand.sucursales.map((_, i) => `<span class="marca-sello" style="--sello-tam:120px;--sello-giro:0deg">${selloSucursal(i + 1)}</span>`).join('')}</div>`, '<code>selloSucursal(n)</code>: número en el plato, nombre en el anillo.')}
      ${pieza('mi-lienzo--carbon', `<div class="mi-tamanos">${brand.sucursales.map((_, i) => `<span class="marca-sello" style="--sello-tam:120px;--sello-giro:0deg">${selloSucursal(i + 1, { color: 'oro' })}</span>`).join('')}</div>`, 'En oro sobre carbón.')}
    </div>

    <h3>El &amp; de firma y el patrón</h3>
    <div class="mi-rejilla">
      <figure class="mi-pieza"><div class="mi-lienzo mi-lienzo--carbon" style="position:relative;overflow:hidden;min-height:240px;place-items:start">${ampersand({ color: 'oro', clase: 'marca-amp-agua' })}<p class="t-sub" style="position:relative;color:var(--c-on-dark);margin:0">¿Con hambre?</p></div><figcaption class="mi-nota">Marca de agua recortada (<code>.marca-amp-agua</code>, oro al 10 %).</figcaption></figure>
      ${pieza('', ampersand({ color: 'tomate', tam: 160 }), '&amp; tomate como gráfico.')}
      ${pieza('marca-patron mi-patron', '', 'Patrón claro (<code>.marca-patron</code>): pie, vacíos, banda CTA. Con moderación.')}
      ${pieza('mi-lienzo--carbon marca-patron marca-patron--oscuro mi-patron', '', 'Patrón oscuro (<code>.marca-patron--oscuro</code>).')}
    </div>

    <h3>Piezas del ticket</h3>
    <div class="mi-rejilla">
      <figure class="mi-pieza"><div class="mi-lienzo mi-lienzo--carbon"><div class="marca-ticket mi-ticket"><p class="marca-ticket__titulo" style="margin:0 0 8px">${esc(brand.nombre)} · Centro</p><div class="marca-ticket__fila"><span>2 × Hamburguesa clásica</span><span>17.90</span></div><div class="marca-ticket__corte"></div><div class="marca-ticket__fila"><strong>TOTAL</strong><strong>US$ 19.15</strong></div><div style="margin-top:10px">${barras('PED-052', { alto: 28 })}</div></div></div><figcaption class="mi-nota"><code>.marca-ticket</code> (dientes) + <code>__corte</code> + <code>barras(texto)</code>; fuente <code>--font-ticket</code>.</figcaption></figure>
      ${pieza('', `<div style="width:100%;color:var(--c-paper)">${ticketBorde({ forma: 'ondas', lado: 'arriba' })}<div style="background:var(--c-paper);height:48px"></div>${ticketBorde({ forma: 'perforado', lado: 'abajo' })}</div>`, '<code>ticketBorde({ forma: \'dientes\'|\'ondas\'|\'perforado\', lado })</code> y <code>--ticket-*</code> en CSS.')}
    </div>

    <h3>Favicon e imagen para compartir</h3>
    <div class="mi-rejilla">
      ${pieza('mi-lienzo--papel', `<div class="mi-tamanos"><figure>${favicon(16)}<span>16</span></figure><figure>${favicon(32)}<span>32</span></figure><figure><img src="marca/og-image.png" width="300" height="158" alt="Imagen para compartir: hamburguesa, logotipo y lema" loading="lazy" decoding="async"><span>og-image 1200×630</span></figure></div>`, 'Favicon SVG ajustado al píxel, apple-touch-icon 180 px y og-image (public/marca).')}
    </div>
  `;
  raiz.append(sec);
  const nav = main.querySelector('.eg-cab nav');
  if (nav && !nav.querySelector('[data-ir="eg-identidad"]')) {
    const a = document.createElement('a');
    a.className = 'chip'; a.href = '#/estilo'; a.dataset.ir = 'eg-identidad'; a.textContent = 'identidad';
    a.addEventListener('click', (e) => { e.preventDefault(); sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    nav.append(a);
  }
}
