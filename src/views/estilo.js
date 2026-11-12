import { bindMarquee } from '../ui/marquee.js';
import '../styles/estilo.css';
import { brand } from '../config/brand.js';
import { icono, circuloIcono, ICONOS } from '../ui/icons.js';
import { productCardHTML, miniProducto } from '../ui/product-card.js';
import { combosHTML, menuDelDiaHTML } from '../ui/combos.js';
import { fotoEscena } from '../ui/photo.js';
import { buildSeed } from '../data/seed.js';

// Guía de estilo viva (#/estilo): pinta cada token y componente con los estilos reales.
// Los contrastes se calculan en el navegador a partir de las variables CSS actuales.
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const contraste = (a, b) => { const x = lum(a); const y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const hex = (v) => css('--' + v);

const GRUPOS = [
  ['Lienzo y tinta', [['c-canvas', 'Fondo de página'], ['c-linen', 'Tarjetas / hover'], ['c-paper', 'Tarjeta sobre canvas, inputs'], ['c-rule', 'Filete decorativo'], ['c-line-strong', 'Borde de controles'], ['c-ink', 'Texto, botón primario'], ['c-ink-soft', 'Texto secundario'], ['c-ink-muted', 'Ayudas, texto terciario']]],
  ['Bandas oscuras', [['c-char', 'Banda carbón'], ['c-card', 'Tarjeta sobre carbón'], ['c-ember', 'Banda brasa / enlaces sobre crema'], ['c-ember-deep', 'Hover brasa'], ['c-line-dark', 'Filete sobre oscuro'], ['c-on-dark', 'Texto sobre oscuro'], ['c-on-dark-muted', 'Texto secundario sobre oscuro']]],
  ['Acento y semánticos', [['c-gold', 'Acento único'], ['c-gold-hover', 'Hover del oro'], ['c-chili', 'Solo insignias de picante'], ['c-success', 'Éxito (texto)'], ['c-success-bg', 'Éxito (fondo)'], ['c-warn', 'Aviso (texto)'], ['c-warn-bg', 'Aviso (fondo)'], ['c-danger', 'Error (texto)'], ['c-danger-bg', 'Error (fondo)']]],
  ['Superficies del panel (claro)', [['c-adm-surface', 'Superficie'], ['c-adm-soft', 'Superficie suave'], ['c-adm-hair', 'Hairline'], ['c-adm-muted', 'Texto apagado'], ['c-adm-placeholder', 'Placeholder']]],
];

// [texto, fondo, uso, mínimo]
const PARES = [
  ['c-ink', 'c-canvas', 'Texto sobre lienzo', 4.5], ['c-ink', 'c-linen', 'Texto sobre linen', 4.5], ['c-ink-soft', 'c-canvas', 'Secundario / lienzo', 4.5], ['c-ink-soft', 'c-linen', 'Secundario / linen', 4.5],
  ['c-ink-muted', 'c-canvas', 'Ayudas / lienzo', 4.5], ['c-ink-muted', 'c-linen', 'Ayudas / linen', 4.5], ['c-ember', 'c-canvas', 'Enlace brasa / lienzo', 4.5], ['c-ember', 'c-linen', 'Enlace brasa / linen', 4.5],
  ['c-canvas', 'c-ink', 'Botón primario', 4.5], ['c-canvas', 'c-ember', 'Botón hover / banda brasa', 4.5], ['c-char', 'c-gold', 'Botón sobre oscuro (texto/oro)', 4.5], ['c-char', 'c-gold-hover', 'Botón oro hover', 4.5],
  ['c-on-dark', 'c-char', 'Texto sobre carbón', 4.5], ['c-on-dark', 'c-card', 'Texto sobre tarjeta', 4.5], ['c-on-dark-muted', 'c-char', 'Secundario / carbón', 4.5], ['c-on-dark-muted', 'c-card', 'Secundario / tarjeta', 4.5],
  ['c-gold', 'c-char', 'Oro sobre carbón', 4.5], ['c-gold', 'c-card', 'Oro sobre tarjeta', 4.5], ['c-gold', 'c-ember', 'Oro sobre brasa', 4.5], ['c-gold', 'c-ink', 'Oro sobre tinta', 4.5],
  ['c-on-dark', 'c-ember', 'Texto sobre brasa', 4.5], ['c-on-dark-muted', 'c-ember', 'Secundario / brasa', 4.5],
  ['c-line-strong', 'c-canvas', 'Borde de input (UI ≥ 3)', 3], ['c-line-strong', 'c-paper', 'Borde de input / paper (UI ≥ 3)', 3],
  ['c-success', 'c-success-bg', 'Éxito', 4.5], ['c-warn', 'c-warn-bg', 'Aviso', 4.5], ['c-danger', 'c-danger-bg', 'Error', 4.5], ['c-danger', 'c-canvas', 'Error / lienzo', 4.5], ['c-success', 'c-canvas', 'Éxito / lienzo', 4.5],
  ['c-adm-muted', 'c-adm-surface', 'Apagado / blanco', 4.5], ['c-adm-muted', 'c-adm-soft', 'Apagado / suave', 4.5], ['c-ink', 'c-adm-surface', 'Tinta / blanco', 4.5],
];

function sectionSwatches() {
  return GRUPOS.map(([titulo, items]) => `
    <h3>${titulo}</h3>
    <div class="eg-swatches">${items.map(([v, uso]) => {
      const h = hex(v);
      const ref = lum(h) > 0.35 ? hex('c-ink') : hex('c-canvas');
      return `<div class="eg-swatch"><div class="eg-chip" style="background:var(--${v});color:${ref}"><span>Aa</span><small>${contraste(h, ref).toFixed(2)}:1</small></div><p><code>--${v}</code><br>${h.toUpperCase()}<br><span class="t-muted">${uso}</span></p></div>`;
    }).join('')}</div>`).join('');
}

function tablaContraste() {
  const filas = PARES.map(([f, b, uso, min]) => {
    const r = contraste(hex(f), hex(b));
    const ok = r >= min;
    return `<tr><td><span class="eg-par" style="background:var(--${b});color:var(--${f})">Aa</span></td><td>${uso}<br><code>--${f}</code> / <code>--${b}</code></td><td>${r.toFixed(2)}:1</td><td>${min === 3 ? 'UI / grande ≥ 3' : 'texto ≥ 4,5'}</td><td><span class="badge ${ok ? 'badge--ok' : 'badge--danger'}">${ok ? 'Cumple' : 'Falla'}</span></td></tr>`;
  }).join('');
  return `<div class="eg-scroll"><table class="eg-tabla"><thead><tr><th>Muestra</th><th>Par</th><th>Razón</th><th>Criterio</th><th>AA</th></tr></thead><tbody>${filas}</tbody></table></div>`;
}

const dishes = ['Hamburguesa clásica', 'Fettuccine Alfredo', 'Churrasco', 'Brownie con helado', 'Bowl de pollo', 'Camarones al ajillo'];
const marquee = (aria) => `<ul class="marquee__group"${aria ? ' aria-hidden="true"' : ''}>${dishes.map((d) => `<li>${d}</li>`).join('')}</ul>`;
const BOLSA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';

function botones(oscuro) {
  const c = oscuro ? ' on-dark' : '';
  return `<div class="cluster">
      <button class="btn${c}" type="button">Pedir ahora</button>
      <button class="btn btn--ghost${c}" type="button">Reservar</button>
      <button class="btn btn--text${c}" type="button">Ver menú</button>
      <button class="btn btn--icon${c}" type="button" aria-label="Carrito">${BOLSA}</button>
      <button class="btn${c}" type="button" disabled>Deshabilitado</button>
    </div>
    <div class="cluster" style="margin-top:12px">
      <button class="btn btn--sm${c}" type="button">Pequeño</button>
      <button class="btn${c}" type="button">Normal</button>
      <button class="btn btn--lg${c}" type="button">Grande</button>
      <button class="btn btn--ghost btn--sm${c}" type="button">Pequeño fantasma</button>
    </div>`;
}

const campos = (oscuro) => {
  const s = oscuro ? 'd' : 'l';
  return `<div class="eg-cols${oscuro ? ' on-dark' : ''}">
    <div class="field"><label class="label" for="eg-n${s}">Nombre</label><input class="input" id="eg-n${s}" placeholder="Nombre y apellido"><p class="help">Como aparece en su reserva.</p></div>
    <div class="field"><label class="label" for="eg-s${s}">Sucursal</label><select class="select" id="eg-s${s}">${brand.sucursales.map((x) => `<option>${x.nombre}</option>`).join('')}</select></div>
    <div class="field"><label class="label" for="eg-e${s}">Teléfono</label><input class="input" id="eg-e${s}" aria-invalid="true" aria-describedby="eg-err${s}" value="60"><p class="error" id="eg-err${s}">Ingrese los 8 dígitos del número.</p></div>
    <div class="field"><label class="label" for="eg-t${s}">Notas</label><textarea class="textarea" id="eg-t${s}" placeholder="Alergias, celebración…"></textarea></div>
  </div>`;
};

const chips = (oscuro) => `<div class="tabs-pill${oscuro ? ' on-dark' : ''}" role="group" aria-label="Ejemplo de filtros">
    <button type="button" class="chip" aria-pressed="true">Hamburguesas</button><button type="button" class="chip" aria-pressed="false">Pastas</button><button type="button" class="chip" aria-pressed="false">Bowls</button><button type="button" class="chip" aria-pressed="false">Postres</button></div>`;
const badges = '<div class="cluster" style="--gap:8px"><span class="badge badge--veg">(V) Vegetariano</span><span class="badge badge--spicy">Picante</span><span class="badge badge--gold">Nuevo</span><span class="badge">Outline</span><span class="badge badge--status">En cocina</span><span class="badge badge--ok">Listo</span><span class="badge badge--warn">Demora</span><span class="badge badge--danger">Agotado</span></div>';

const tipo = [
  ['t-numeral', '--fs-d1', '3.500+', '72 → 200 px · cifras gigantes'], ['t-hero', '--fs-d2', 'Sabor de barrio', '52 → 128 px · héroe'], ['t-title', '--fs-d3', 'Nuestro menú', '40 → 72 px · título de sección (h1)'],
  ['t-sub', '--fs-d4', 'Platos del día', '28 → 48 px · subtítulo (h2)'], ['t-card', '--fs-d5', 'Fettuccine Alfredo', '20 → 26 px · título de tarjeta (h3)'],
];
const MUESTRAS = [
  { id: 'prod-07-hamburguesa-clasica', nombre: 'Hamburguesa clásica', precio: 8.95, alergenosDeclarados: true, alergenos: ['gluten', 'lácteos'], vegetariano: false },
  { id: 'prod-12-hamburguesa-picante', nombre: 'Hamburguesa picante', precio: 9.95, alergenosDeclarados: false, alergenos: [], vegetariano: false },
  { id: 'prod-11-hamburguesa-vegetariana', nombre: 'Hamburguesa vegetariana', precio: 9.25, alergenosDeclarados: true, alergenos: ['gluten', 'soya'], vegetariano: true },
];
let MDD = ''; let COMBOS = '';
try {
  const st = buildSeed(new Date());
  const suc = st.sucursales[0].id;
  MDD = menuDelDiaHTML(st, suc);
  COMBOS = combosHTML({ ...st, combos: st.combos.slice(0, 3) }, suc);
} catch { /* la guía sigue sin esta muestra */ }
const SECCIONES = ['colores', 'contraste', 'tipografia', 'botones', 'formularios', 'insignias', 'tarjetas', 'fotos', 'iconos', 'carta', 'bandas', 'estadisticas', 'movimiento', 'geometria'];

export function vistaEstilo(main) {
  main.innerHTML = `
  <div class="eg">
    <header class="eg-cab">
      <p class="eyebrow">Sistema de diseño · bloque A</p>
      <h1 class="t-hero">Guía de estilo</h1>
      <p class="t-lead">Cada token y componente de Plato &amp; Co., renderizado con los estilos reales. Ruta interna, no enlazada en la navegación.</p>
      <nav class="tabs-pill" aria-label="Secciones de la guía">${SECCIONES.map((i) => `<a class="chip" href="#/estilo" data-ir="eg-${i}">${i}</a>`).join('')}</nav>
    </header>

    <section id="eg-colores"><h2>Colores</h2>${sectionSwatches()}</section>
    <section id="eg-contraste"><h2>Contraste (WCAG 2.1 AA)</h2><p class="t-muted">Calculado en vivo desde las variables CSS. El oro nunca es texto pequeño sobre crema.</p>${tablaContraste()}</section>

    <section id="eg-tipografia"><h2>Tipografía</h2>
      <p class="t-muted">Anton (display, mayúsculas, interlínea 0,85–0,95, tracking negativo) + DM Sans 400/500/700.</p>
      ${tipo.map(([c, v, txt, nota]) => `<div class="eg-fila"><p class="eyebrow">.${c} · <code>${v}</code> · ${nota}</p><p class="${c}">${txt}</p></div>`).join('')}
      <div class="eg-fila"><p class="eyebrow">.t-lead · <code>--fs-lead</code></p><p class="t-lead">Hamburguesas, pastas y bowls hechos al momento, para pedir en línea o reservar por chat.</p></div>
      <div class="eg-fila"><p class="eyebrow">Cuerpo · <code>--fs-base</code> 16 px</p><p>Texto de cuerpo en DM Sans 400 con interlínea 1,55. <strong>Negrita 700</strong> y <a href="#/estilo">enlace sobre crema (ember)</a>.</p></div>
      <div class="eg-fila"><p class="eyebrow">.t-small · <code>--fs-sm</code> 14 px · <code>--fs-xs</code> 12 px</p><p class="t-small">Texto pequeño para ayudas y notas.</p></div>
      <div class="eg-fila"><p class="eyebrow">.eyebrow · 13 px, mayúsculas, +0,08em</p><p class="eyebrow">Etiqueta de sección</p></div>
    </section>

    <section id="eg-botones"><h2>Botones</h2>
      <h3>Sobre claro</h3>${botones(false)}
      <div class="band band--dark grain eg-banda"><h3>Sobre oscuro (.on-dark o dentro de .band--*)</h3>${botones(true)}</div>
    </section>

    <section id="eg-formularios"><h2>Formularios</h2>${campos(false)}
      <div class="band band--dark eg-banda"><h3>Sobre oscuro</h3>${campos(true)}</div>
    </section>

    <section id="eg-insignias"><h2>Insignias, chips y pestañas</h2>
      <h3>Insignias</h3>${badges}
      <div class="band band--dark eg-banda"><h3>Sobre oscuro</h3>${badges}</div>
      <h3>Chips / pestañas (seleccionado = relleno + ✓ + peso)</h3>${chips(false)}
      <div class="band band--dark eg-banda"><h3>Sobre oscuro</h3>${chips(true)}</div>
    </section>

    <section id="eg-tarjetas"><h2>Tarjetas</h2>
      <div class="grid-auto">
        <div class="card"><p class="eyebrow">.card</p><h3>Fettuccine Alfredo</h3><p>Borde 1 px, radio 6 px, sin sombra.</p><span class="badge badge--veg">(V) Vegetariano</span></div>
        <a class="card" href="#/estilo"><p class="eyebrow">a.card (enlace)</p><h3>Hover por tono</h3><p>Cambia de paper a linen.</p></a>
        <div class="card card--linen"><p class="eyebrow">.card--linen</p><h3>Un escalón más</h3><p>Profundidad por tono.</p></div>
      </div>
      <div class="band band--dark eg-banda"><div class="grid-auto"><div class="card"><p class="eyebrow">.card en banda oscura</p><h3 class="t-gold-on-dark">Costillas BBQ</h3><p>Marrón medio con filete oscuro.</p></div><div class="card"><p class="eyebrow">Otra</p><h3>Churrasco</h3><p>Texto sobre card #402011.</p></div></div></div>
    </section>


    <section id="eg-fotos"><h2>Tarjeta con foto</h2>
      <p class="t-muted">Sin caja, foto 4:3 con filtro <code>--photo-filter</code>, zoom 1,04 al pasar el cursor, «+» de 44 px. Meta solo con alérgenos declarados.</p>
      <h3>grid (portada y menú desktop)</h3>
      <div class="dish-grid dish-grid--menu">${MUESTRAS.map((p) => productCardHTML(p)).join('')}</div>
      <h3>Agotado</h3>
      <div class="dish-grid dish-grid--menu">${productCardHTML(MUESTRAS[0], { agotado: true })}</div>
      <h3>fila (menú en celular, &lt; 600 px)</h3>
      <div class="eg-fila-demo">${MUESTRAS.slice(0, 3).map((p) => productCardHTML(p, { variante: 'fila' })).join('')}</div>
      <h3>mini (64×48: carrito, pedido, admin)</h3>
      <div class="cluster" style="--gap:12px">${MUESTRAS.map((p) => miniProducto(p)).join('')}</div>
      <h3>Texto sobre foto con velo (el único degradado permitido)</h3>
      <div class="eg-velo">${fotoEscena('delivery', { ratio: '16/9' })}<div class="eg-velo__t"><p class="eyebrow">Quien pide</p><p>Pide por WhatsApp en un minuto</p></div></div>
    </section>

    <section id="eg-iconos"><h2>Iconos SVG</h2>
      <p class="t-muted">24×24, trazo 1,5 px, <code>currentColor</code>. Decorativos (aria-hidden) salvo con <code>etiqueta</code>.</p>
      <div class="eg-iconos">${ICONOS.map((n) => `<div class="eg-icono">${icono(n, { tam: 24 })}<code>${n}</code></div>`).join('')}</div>
      <h3>Anillo (estilo Tiger)</h3>
      <div class="cluster" style="--gap:16px">${circuloIcono('pedido')}${circuloIcono('cocina')}${circuloIcono('en-camino')}${circuloIcono('entregado')}</div>
      <div class="band band--dark eg-banda"><div class="cluster" style="--gap:16px">${circuloIcono('chat', { tono: 'oscuro' })}${circuloIcono('reserva', { tono: 'oscuro' })}${circuloIcono('persona', { tono: 'oscuro' })}${circuloIcono('check', { tono: 'oscuro' })}</div></div>
    </section>

    <section id="eg-carta"><h2>Menú del día y combos</h2>
      ${MDD}
      <h3>Combos</h3>
      ${COMBOS}
    </section>

    <section id="eg-bandas"><h2>Bandas y filetes</h2>
      <div class="band band--light eg-banda"><h3>.band--light</h3><p>Lienzo pergamino con texto de tinta. <a href="#/estilo">Enlace ember</a>.</p></div>
      <div class="band band--linen eg-banda"><h3>.band--linen</h3><p>Un escalón más oscuro.</p></div>
      <div class="band band--dark eg-banda"><h3>.band--dark</h3><p>Carbón. <a href="#/estilo">Enlace oro</a></p><hr class="rule-dotted-gold"><p class="t-muted">Texto secundario sobre carbón.</p></div>
      <div class="band band--card eg-banda"><h3>.band--card</h3><p>Marrón medio.</p></div>
      <div class="band band--rust eg-banda"><h3>.band--rust</h3><p>Brasa. Oro solo en texto grande o como relleno de botón.</p><button class="btn" type="button">Botón</button></div>
      <h3>Filetes</h3>
      <hr class="rule"><p class="t-small">.rule</p><hr class="rule-dotted"><p class="t-small">.rule-dotted</p>
      <div class="band band--dark eg-banda"><hr class="rule-dotted-gold"><p class="t-small">.rule-dotted-gold</p></div>
    </section>

    <section id="eg-estadisticas"><h2>Estadísticas</h2>
      <div class="stat-row"><div class="stat"><div class="stat__num">3.500+</div><p class="stat__label">pedidos al mes</p></div><div class="stat"><div class="stat__num">12 min</div><p class="stat__label">tiempo medio en cocina</p></div></div>
      <div class="band band--dark eg-banda"><div class="stat-row"><div class="stat"><div class="stat__num">98%</div><p class="stat__label">de reservas confirmadas</p></div><div class="stat"><div class="stat__num">3</div><p class="stat__label">sucursales</p></div></div></div>
      <h3>Superficie del panel (claro, estilo Sunday)</h3>
      <div class="surface-adm"><div class="stat"><div class="stat__num">US$ 1.240</div><p class="stat__label">ventas de hoy</p></div></div>
    </section>

    <section id="eg-movimiento"><h2>Movimiento, marquesina y grano</h2>
      <h3>Marquesina (27 s lineal, pausa al pasar el cursor, estática con movimiento reducido)</h3>
      <div class="marquee"><div class="marquee__track">${marquee(false)}${marquee(true)}</div></div>
      <div class="band band--dark marquee eg-banda" style="padding-block:16px"><div class="marquee__track">${marquee(false)}${marquee(true)}</div></div>
      <h3>Grano de papel (.grain)</h3>
      <div class="band band--linen grain eg-banda"><p>Textura sutil al 7 % de opacidad, SVG feTurbulence en data-URI.</p></div>
      <h3>Aparecer al scroll (.reveal)</h3>
      <div class="grid-auto">${[0, 1, 2].map((i) => `<div class="card reveal" style="--rv-delay:${i * 0.1}s"><h3>Tarjeta ${i + 1}</h3><p>Entra con 0,4 s y la curva del sistema.</p></div>`).join('')}</div>
      <h3>Foco visible</h3>
      <div class="cluster"><button class="btn" type="button">Tabule hasta aquí (anillo de tinta)</button></div>
      <div class="band band--dark eg-banda"><button class="btn btn--ghost" type="button">Anillo de oro sobre oscuro</button></div>
    </section>

    <section id="eg-geometria"><h2>Geometría y espaciado</h2>
      <div class="cluster" style="--gap:16px;align-items:flex-end">
        <div class="eg-geo" style="border-radius:0">0</div><div class="eg-geo" style="border-radius:6px">6 px · tarjeta</div><div class="eg-geo" style="border-radius:9999px">pill · control</div>
      </div>
      <div class="eg-esp">${[['sp-0', 4], ['sp-1', 8], ['sp-2', 16], ['sp-3', 24], ['sp-4', 32], ['sp-5', 48], ['sp-6', 64], ['sp-7', 80], ['sp-8', 120]].map(([n, v]) => `<div><span style="display:block;width:var(--${n});height:16px;background:var(--c-ink)"></span><code>--${n}</code> ${v}px</div>`).join('')}</div>
      <p class="t-muted">Contenedores: <code>--w-content</code> 1200 · <code>--w-wide</code> 1440. Movimiento: <code>--dur</code> .4s, <code>--ease</code> cubic-bezier(.25,.46,.45,.94). Capas: <code>--z-sticky</code> 40 · <code>--z-banner</code> 100 · <code>--z-modal</code> 200.</p>
    </section>
  </div>`;

  bindMarquee(main);
  main.querySelectorAll('[data-ir]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    main.querySelector('#' + a.dataset.ir)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  return null;
}
