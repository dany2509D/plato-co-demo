# Sistema de diseño · Plato & Co.

Guía viva: `#/estilo` (no enlazada). Referencias: `reference-tokens.md`. Archivos: `src/styles/tokens.css` (variables), `base.css` (reinicio, tipografía, utilidades), `components.css` (botones, formularios, insignias, chips, tarjetas, bandas, stat), `layout.css` (banner, cabecera, pie), `estilo.css` (solo la guía).
Orden de carga en `main.js`: tokens, base, components, layout, client, carta, portada, admin, kitchen, gestion. `photo.css` e `icons.css` se importan desde su JS.

## Tokens (usar siempre el rol, nunca el hex)
- **Lienzo/tinta**: `--c-canvas` pergamino, `--c-linen` un escalón más oscuro, `--c-paper` más claro (tarjetas/inputs), `--c-rule` filete decorativo, `--c-line-strong` borde de controles, `--c-ink` texto (nunca #000), `--c-ink-soft`, `--c-ink-muted`.
- **Bandas oscuras**: `--c-char` carbón, `--c-card` marrón de tarjeta, `--c-ember` brasa, `--c-ember-deep`, `--c-line-dark`, `--c-on-dark`, `--c-on-dark-muted`.
- **Acento único**: `--c-gold` (+`--c-gold-hover`). `--c-chili` solo insignias de picante.
- **Semánticos**: `--c-success|warn|danger` y `-bg`. Siempre con texto o icono.
- **Panel claro (C)**: `--c-adm-surface` #fff, `--c-adm-soft`, `--c-adm-hair` #dedede, `--c-adm-muted`, `--c-adm-placeholder`; clase `.surface-adm`.
- **Contexto**: `--ctx-bg/fg/muted/link/rule/focus/accent/surface`; cambian dentro de `.on-dark` y `.band--*`. Los componentes las leen: no vuelva a colorear a mano sobre oscuro.
- **Tipo**: `--font-display` Anton, `--font-body` DM Sans; `--fs-d1` 72→200 px, `d2` 52→128, `d3` 40→72, `d4` 28→48, `d5` 20→26, `--fs-lead`, `base` 16, `sm` 14, `xs` 12; `--lh-display` .88; `--tr-display` −.02em, `--tr-title` −.01em, `--tr-label` +.08em.
- **Espaciado** (8 px): `--sp-0..8` = 4, 8, 16, 24, 32, 48, 64, 80, 120; `--gutter` fluido; `--section-y`.
- **Geometría**: `--r-sharp` 0, `--r-card` 6px, `--r-pill`, `--r-photo` 0 (fotos del cliente), `--r-panel` 16px (solo panel admin y ventana «En vivo»); `--rule-w` 1px; `--tap` 44px; `--w-content` 1200, `--w-wide` 1440.
- **Rediseño 2** (ver `direccion-v2.md` §4): `--fs-hero` (titular de una línea, 181 px a 1440), `--fs-h2`, `--fs-statement`, `--fs-wordmark`; `--section-y` 88→136 px; `--sp-9` 160; `--header-h` 72 (56 < 900); `--photo-filter`, `--photo-filter-warm`; `--scrim-t|b`, `--veil`, `--veil-soft`; `--ease-out`, `--dur-fast` .2s, `--dur-photo` .7s.
- **Movimiento/capas**: `--dur` .4s, `--ease`; `--z-sticky` 40, `banner` 100, `float` 120, `modal` 200, `toast` 300. `--shadow-sticky` solo para la cabecera con scroll.

## Catálogo de clases
- Tipo: `.t-numeral`, `.t-hero`, `.t-title` (=h1), `.t-sub` (=h2), `.t-card` (=h3), `.t-lead`, `.t-small`, `.t-muted`, `.eyebrow`. h1–h3 ya son Anton en mayúsculas.
- Estructura: `.container` (1200), `.container--wide` (1440), `.section`, `.stack`, `.cluster`, `.grid-auto`, `.band` + `--light|linen|dark|card|rust|ink`, `.on-dark`.
- Filetes: `.rule`, `.rule-dotted` (tinta, sobre claro), `.rule-dotted-gold` (sobre oscuro).
- Botón: `.btn` (tinta sobre claro; oro automático en `.on-dark`/`.band--*`), `--ghost`, `--text`, `--sm` (36 px + zona táctil 44), `--lg`, `--block`, `--icon`, `[disabled]`.
- Formularios: `.field` > `.label` + `.input|.select|.textarea` + `.help` / `.error` (con `aria-invalid="true"` y `aria-describedby`).
- `.badge` + `--veg|spicy|gold|outline|status|ok|warn|danger`; `.chip` / `.tab-pill` (+`aria-pressed`/`aria-selected`; el seleccionado lleva ✓, relleno y peso 700); `.tabs-pill`.
- `.card` (+`--linen`, `--flat`, `a.card` con hover por tono), `.stat` (`.stat__num`, `.stat__label`), `.stat-row`, `.surface-adm`.
- Efectos: `.grain`, `.reveal` (+`--rv-delay`), `.reveal--foto` (máscara de foto), `[data-count]` (contador de cifras). La marquesina (`.marquee`) se quitó del producto a pedido del cliente (11 nov 2026): no la vuelva a usar.
- Layout cliente: `.app-header`, `.brand`, `.nav`, `.site-footer`, `.skip-link`, `.sr-only`.

## Las 11 reglas
1. Un solo display: Anton, mayúsculas, interlínea .85–.95, tracking negativo; cuerpo DM Sans 400/500/700.
2. El oro es relleno, borde o texto grande sobre oscuro. **Nunca** texto pequeño sobre crema (use tinta o ember).
3. Nunca #000 ni blanco puro de texto; use `--c-ink` / `--c-on-dark`.
4. Cliente: fotos y tarjetas con radio 0 (`--r-photo`); botones, inputs, insignias y chips en píldora. Admin y panel «En vivo»: 16 px (`--r-panel`).
5. Sin `box-shadow` ni gradientes (solo `--shadow-sticky` en cabecera con scroll). **Única excepción de degradado: el velo de foto (`--scrim-t`, `--scrim-b`), solo detrás de texto sobre fotografía.** Donde el texto no toca la foto no hay velo; fondos, botones y tarjetas siguen sin degradado. La profundidad es por tono.
6. Filetes de 1 px; punteados entre bandas (oro sobre oscuro, tinta sobre claro).
7. Foco visible siempre: anillo de 2 px de tinta sobre crema, de oro sobre oscuro. No lo quite.
8. Objetivos táctiles ≥ 44 px, etiquetas visibles en inputs, nada de estado solo por color.
9. Movimiento: 0.4 s con `--ease`; respete `prefers-reduced-motion`.
10. Funciona a 360 px sin scroll horizontal; no use colores literales, use tokens.
11. **Anton solo ≥ 48 px o en cifras** (precios grandes, KPIs, conteos); máximo 3 usos por viewport. Nombres de plato, títulos de tarjeta y de paso van en DM Sans 600.

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

## Fotografía
Todas las fotos salen de `src/ui/photo.js` (estilos en `photo.css`); 40 de menú (`menu/<productId>.webp`, 800×600) y 8 de escena (`hero/*.webp`), con `manifest.json` (alt y crédito; `scripts/check-photos.mjs` lo valida). Nunca escriba `<img>` a mano.
- `fotoProducto(p, { variante: 'grid'|'fila'|'mini'|'modal', eager = false, clase })`: `grid` 4:3 a todo el ancho; `fila` 120 px; `mini` 64 px (64×48); `modal` 16:9 (recorte con `object-position: 50% 55%`). Sin foto o con error de carga → `dishArt(p)` en la misma caja.
- `fotoEscena(clave, { eager, clase, ratio, alt })`, `urlEscena(clave)`, `hayFoto(id)`. Claves: `hero`, `ambiente_salon`, `ambiente_parrilla`, `delivery`, `cta_ingredientes`, `sucursal_1..3`.
- Siempre `<img alt width height loading decoding>`; `eager` solo para la foto del LCP (`loading="eager" fetchpriority="high"`). Contenedor `.foto` (radio `--r-photo`, fondo de tono mientras carga, `aspect-ratio` explícito: sin CLS). Filtro `--photo-filter` en la `img`; `.foto--warm` usa `--photo-filter-warm`; `.foto--agotado` en gris y 60 %.
- Zoom 1.04 al pasar el cursor (`.foto:hover img`; en la tarjeta entera, `.foto-host`); sin escala con movimiento reducido. Revelado con máscara: clase `.reveal--foto` (el observador es de `reveal.js`); nunca en el héroe.
- Texto sobre foto: solo con velo (`--scrim-t/-b`, `--veil`). Contraste calculado en `tokens.css`; `--veil-soft` solo sobre fotos oscuras.

## Contrato para A2 / B / C (rediseño 2)
**Archivos y dueños** (en la cascada, `carta.css` y `portada.css` van después de `client.css`: sobrescriba en su archivo, no edite el de otro):
`client.css` → C (menú, carrito, pago, seguimiento, diálogos) · `carta.css` → A2 (tarjeta de plato, menú del día, combos) · `portada.css` → B (héroe, selector de sucursal, secciones de portada) · `photo.css` + `photo.js` → A1 (hechos) · `icons.css` + `icons.js` → C.
**API de fotos:** ver «Fotografía» (programar contra ella desde ya).
**Selectores que nunca se renombran.** Modo Presentación: `.tel-texto`, `.tel-enviar`, `.tel-compositor`, `.tel-rapido`, `.vivo`, `.vivo-item`, `main.vista[data-ruta]`, `[data-avanzar]`, `[data-agotado]`, `[data-fecha]`, `[data-franja]`, `[data-mesa]`. E2E (`tests/e2e/recorrido.spec.js`): `.app-header__inner`, `.banner-demo`, `.site-footer .container--wide`, `.pago-op`, `.seg__op`, `.ck-sim`, `.pd-datos`, `.pd-pasos`, `.mn-agotado`, `.adm-reiniciar`, `.pres-barra`, `[data-add]`, `[data-cta]`, `[data-paso]`, `[data-reserva]`, `[data-humano]`, `[data-min]`, `role="tab"` en las categorías, y la **única** entrada al modo Presentación: «Demo ▾» → «Presentación guiada» (`[data-accion="presentar"]`, un solo control visible con ese nombre al abrir el menú o la hoja móvil). No hay botón flotante: `.pres-lanzar` sigue en el DOM (lo monta `presenter.js`) pero está oculto con `display:none`.
**No tocar:** `src/bot/*`, `src/core/*` (salvo valores de `icono` en `live-feed.js`), `src/ui/presenter.js`, `api/*`.

## Iconos SVG y tarjeta de plato (A2)
**Iconos** (`src/ui/icons.js`, estilos en `icons.css`): `icono(nombre, { tam = 20, etiqueta })` → `<svg viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none">`; sin `etiqueta` es decorativo (`aria-hidden`), con ella `role="img"` + `aria-label` (escapado). `circuloIcono(nombre, { tam, etiqueta, tono: 'claro'|'oscuro' })` → anillo de 40 px (borde 1 px: `--c-rule` en claro, oro en oscuro). Nombres: pedido, cocina, listo, en-camino, entregado, retiro, reserva, persona, usuario, chat, web, check, alerta, movil, panel, menu, cerrar, flecha, mas, reloj, bolsa, lupa, estrella, picante. Nombre desconocido → círculo discreto, nunca lanza. Catálogo visual en `#/estilo`.
**Tarjeta de plato** (`product-card.js`, `carta.css`): `productCardHTML(p, { etiqueta='Agregar', clase, variante:'grid'|'fila', eager, agotado })`. Sin borde, fondo, sombra ni radio; foto 4:3 (`fotoProducto`), nombre DM Sans 600 18 px + «(V)», precio tabular, meta 13 px solo con alérgenos declarados («Contiene…», «Sin alérgenos declarados», icono alerta + «Consulte alérgenos»), insignia «Picante», botón «+» 44 px sobre la foto (`data-add`, `aria-label="Agregar {nombre}"`), toda la tarjeta pulsable (`bindAdd`). En `.dish-grid--menu` a < 600 px la misma tarjeta pasa a fila (foto 120×90, filete entre filas) solo con CSS. Ningún elemento de `.dish` usa Anton. `miniProducto(p)` → miniatura 64×48 (carrito, pedido, admin). `dialogoCabecera(p)` → foto 16:9 + nombre 28 px + precio, usada por el diálogo de modificadores.
**Combos y menú del día** (`combos.js`): sin cajas, filetes de 1 px; combos en 1/2/3 columnas según el ancho del contenedor (`@container`); miniaturas con foto real. Los combos muestran su precio pero el carrito cobra precio de lista: se mantiene la nota visible hasta corregir la lógica del carrito.
