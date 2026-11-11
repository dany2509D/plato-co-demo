# Sistema de diseño · Plato & Co.

Guía viva: `#/estilo` (no enlazada). Referencias: `reference-tokens.md`. Archivos: `src/styles/tokens.css` (variables), `base.css` (reinicio, tipografía, utilidades), `components.css` (botones, formularios, insignias, chips, tarjetas, bandas, stat), `layout.css` (banner, cabecera, pie), `estilo.css` (solo la guía).
Orden de carga en `main.js`: tokens, base, components, layout, client, admin, kitchen, gestion.

## Tokens (usar siempre el rol, nunca el hex)
- **Lienzo/tinta**: `--c-canvas` pergamino, `--c-linen` un escalón más oscuro, `--c-paper` más claro (tarjetas/inputs), `--c-rule` filete decorativo, `--c-line-strong` borde de controles, `--c-ink` texto (nunca #000), `--c-ink-soft`, `--c-ink-muted`.
- **Bandas oscuras**: `--c-char` carbón, `--c-card` marrón de tarjeta, `--c-ember` brasa, `--c-ember-deep`, `--c-line-dark`, `--c-on-dark`, `--c-on-dark-muted`.
- **Acento único**: `--c-gold` (+`--c-gold-hover`). `--c-chili` solo insignias de picante.
- **Semánticos**: `--c-success|warn|danger` y `-bg`. Siempre con texto o icono.
- **Panel claro (C)**: `--c-adm-surface` #fff, `--c-adm-soft`, `--c-adm-hair` #dedede, `--c-adm-muted`, `--c-adm-placeholder`; clase `.surface-adm`.
- **Contexto**: `--ctx-bg/fg/muted/link/rule/focus/accent/surface`; cambian dentro de `.on-dark` y `.band--*`. Los componentes las leen: no vuelva a colorear a mano sobre oscuro.
- **Tipo**: `--font-display` Anton, `--font-body` DM Sans; `--fs-d1` 72→200 px, `d2` 52→128, `d3` 40→72, `d4` 28→48, `d5` 20→26, `--fs-lead`, `base` 16, `sm` 14, `xs` 12; `--lh-display` .88; `--tr-display` −.02em, `--tr-title` −.01em, `--tr-label` +.08em.
- **Espaciado** (8 px): `--sp-0..8` = 4, 8, 16, 24, 32, 48, 64, 80, 120; `--gutter` fluido; `--section-y`.
- **Geometría**: `--r-sharp` 0, `--r-card` 6px, `--r-pill`; `--rule-w` 1px; `--tap` 44px; `--w-content` 1200, `--w-wide` 1440.
- **Movimiento/capas**: `--dur` .4s, `--ease`; `--z-sticky` 40, `banner` 100, `float` 120, `modal` 200, `toast` 300. `--shadow-sticky` solo para la cabecera con scroll.

## Catálogo de clases
- Tipo: `.t-numeral`, `.t-hero`, `.t-title` (=h1), `.t-sub` (=h2), `.t-card` (=h3), `.t-lead`, `.t-small`, `.t-muted`, `.eyebrow`. h1–h3 ya son Anton en mayúsculas.
- Estructura: `.container` (1200), `.container--wide` (1440), `.section`, `.stack`, `.cluster`, `.grid-auto`, `.band` + `--light|linen|dark|card|rust|ink`, `.on-dark`.
- Filetes: `.rule`, `.rule-dotted` (tinta, sobre claro), `.rule-dotted-gold` (sobre oscuro).
- Botón: `.btn` (tinta sobre claro; oro automático en `.on-dark`/`.band--*`), `--ghost`, `--text`, `--sm` (36 px + zona táctil 44), `--lg`, `--block`, `--icon`, `[disabled]`.
- Formularios: `.field` > `.label` + `.input|.select|.textarea` + `.help` / `.error` (con `aria-invalid="true"` y `aria-describedby`).
- `.badge` + `--veg|spicy|gold|outline|status|ok|warn|danger`; `.chip` / `.tab-pill` (+`aria-pressed`/`aria-selected`; el seleccionado lleva ✓, relleno y peso 700); `.tabs-pill`.
- `.card` (+`--linen`, `--flat`, `a.card` con hover por tono), `.stat` (`.stat__num`, `.stat__label`), `.stat-row`, `.surface-adm`.
- Efectos: `.grain`, `.reveal` (+`--rv-delay`), `.marquee` > `.marquee__track` > dos `.marquee__group` (el segundo `aria-hidden="true"`).
- Layout cliente: `.app-header`, `.brand`, `.nav`, `.site-footer`, `.skip-link`, `.sr-only`.

## Las 10 reglas
1. Un solo display: Anton, mayúsculas, interlínea .85–.95, tracking negativo; cuerpo DM Sans 400/500/700.
2. El oro es relleno, borde o texto grande sobre oscuro. **Nunca** texto pequeño sobre crema (use tinta o ember).
3. Nunca #000 ni blanco puro de texto; use `--c-ink` / `--c-on-dark`.
4. Tarjetas e imágenes 0–6 px; botones, inputs, insignias y chips en píldora.
5. Sin `box-shadow` ni gradientes (solo `--shadow-sticky` en cabecera con scroll). La profundidad es por tono.
6. Filetes de 1 px; punteados entre bandas (oro sobre oscuro, tinta sobre claro).
7. Foco visible siempre: anillo de 2 px de tinta sobre crema, de oro sobre oscuro. No lo quite.
8. Objetivos táctiles ≥ 44 px, etiquetas visibles en inputs, nada de estado solo por color.
9. Movimiento: 0.4 s con `--ease`; respete `prefers-reduced-motion`.
10. Funciona a 360 px sin scroll horizontal; no use colores literales, use tokens.

## Alias antiguos (borrar cuando B y C migren)
Tokens: `--crema`→`--c-canvas`, `--crema-2`→`--c-linen`, `--terracota`→`--c-ember`, `--terracota-osc`→`--c-ember-deep`, `--amarillo`→`--c-gold`, `--tinta`→`--c-ink`, `--tinta-suave`→`--c-ink-soft`, `--blanco`→`--c-paper`, `--radio`→`--r-card`, `--sombra`→`none`, `--fuente`→`--font-body`. Sin tocar: `--stick-top`, `--banner-h` (los fija `main.js`), `--verde`/`--fondo-chat`/`--burbuja-propia` (locales de `.tel`).
Clases: `.btn-primario`, `.btn-sec`, `.btn-amarillo`, `.btn-claro`, `.btn-grande`, `.btn-bloque`, `.btn-nav`, `.badge-veg|hot|ask`, `.chip-ok|warn`, `.link-btn`, `.vista`.
`client.css`, `admin.css`, `kitchen.css`, `gestion.css`, `phone.css`, `indicadores.css` aún tienen sombras duras, bordes de 2 px y radios grandes: se eliminan al rehacer cada vista.

## Lista de verificación para B (cliente) y C (admin + chat)
- [ ] Ninguna sombra, degradado, radio > 6 px en tarjetas ni color literal (grep `#`, `box-shadow`, `gradient`).
- [ ] Títulos con `h1–h3`/`.t-*`; una sola cifra gigante por bloque.
- [ ] Botones `.btn` (primario) y `.btn--ghost`; sobre oscuro dentro de `.band--*`.
- [ ] Secciones con `.band`/`.section` y filete punteado entre bandas; `.reveal` en bloques de entrada.
- [ ] Admin: superficies `--c-adm-*`, hairlines, KPIs con `.stat`, píldoras negras; no use el pie del cliente (se oculta con `body.modo-admin`).
- [ ] Revisar a 360 y 1440 px, foco con teclado y `prefers-reduced-motion`.
- [ ] Revise `#/estilo` y reutilice componentes antes de crear otros; si falta uno, agréguelo a `components.css` y a la guía.
