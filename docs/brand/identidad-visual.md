# Identidad visual · Plato & Co.

Bloque V · 11 nov 2026. Guía viva: `#/estilo` → sección **Identidad**. Código: `src/ui/brand-marks.js` (API), `src/assets/brand/` (archivos y geometría), `src/styles/marca.css` (clases `.marca-*`). Todo se deriva de `src/config/brand.js`.

## 1. Concepto: «Mesa de barrio con ganas»

Plato & Co. es la fonda de barrio que cocina en serio: platos generosos, servidos al momento, en una mesa sin pretensiones. La identidad sale de los objetos de esa mesa:

- **El plato de peltre visto desde arriba**: borde esmaltado tomate, cuerpo de papel y un **sol de mostaza** (la yema) descentrado que pisa el aro del pozo. Es el símbolo maestro.
- **El &**: el «y compañía», la gente que se sienta a la mesa. Se usa enorme y recortado como gráfico de firma.
- **El sello «Hecho al momento»**: la promesa, estampada como en la bolsa de papel.
- **El ticket de comanda**: dientes de papel, letra de caja registradora, línea de corte y barras.
- **Tomate y mostaza**: los dos frascos que hay en toda mesa de barrio. Paleta propia, distinta de las referencias.

## 2. Catálogo de piezas

| Pieza | API | Archivo listo | Uso | Mal uso (no) |
|---|---|---|---|---|
| Símbolo (el plato) | `logo({ variante: 'simbolo' })` · `brand.logoSvg` | `simbolo*.svg`, `favicon*.svg` | cabecera, avatar del chat, favicon, panel | girarlo, cambiar el sol de lugar, ponerle sombra, recolorear piezas sueltas |
| Horizontal | `logo()` | `logo-horizontal*.svg` | cabecera, pie, correos, og-image | estirarlo, separar el símbolo, cambiar el tamaño del & |
| Apilado | `logo({ variante: 'apilado' })` | `logo-apilado*.svg` | portadas cuadradas, 404, bolsa, redes | usarlo por debajo de 64 px de ancho |
| Palabra | `logo({ variante: 'palabra' })` | `logo-palabra*.svg` | pie de borde a borde, cabeceras muy angostas | reemplazar el punto-plato por un punto normal |
| Monograma «P&C» | `logo({ variante: 'monograma' })` | `monograma*.svg` | avatar de WhatsApp, sello de cocina, admin | escribir otras iniciales a mano (use `brand.iniciales`) |
| Sello «Hecho al momento» | `sello({ color, fondo })` | `sello*.svg` | héroe/banda CTA, confirmación de pedido, factura | menos de 96 px (el texto deja de leerse), sobre foto sin `fondo` |
| Sello de sucursal | `selloSucursal(n)` | `sucursal-0n.svg` | selector de sucursal, seguimiento de retiro, cocina | numerar a mano (sale del orden de `brand.sucursales`) |
| & de firma | `ampersand({ color, estilo })` | `ampersand.svg` | marca de agua recortada en bandas, estados vacíos, 404 | más de un & grande por pantalla; & sobre texto |
| Patrón | `patron({ tono })` → url() · clase `.marca-patron` | `patron-claro.svg`, `patron-oscuro.svg` | pie, estados vacíos, banda CTA | detrás de texto largo o de fotos; más de una zona por página |
| Ticket | `ticketBorde()`, `ticketMascara()`, `barras(texto)`, `--ticket-*`, `.marca-ticket` | — | carrito, resumen de pago, factura, cocina | dientes en tarjetas que no son comprobantes |
| Favicon / iconos | `favicon(16|32)` | `favicon.svg`, `favicon-16.svg`, `safari-pinned-tab.svg`, `apple-touch-icon.png` | `index.html` | — |
| Imagen para compartir | generador | `og-image.svg` → `public/marca/og-image.png` | Open Graph / Twitter | — |

**Contorneado.** Todo texto de las marcas (logotipo, monograma, sellos, &, og-image) se dibuja con los contornos de Anton (`src/assets/brand/glifos-anton.js`, OFL 1.1, licencia en `OFL-Anton.txt`): funciona dentro de `<img>`, data-URI y PNG sin cargar la fuente. **Única excepción:** `sello({ modo: 'texto' })` usa `<textPath>` con `font-family="Anton, Impact, 'Haettenschweiler', 'Arial Narrow Bold', 'Arial Narrow', sans-serif"` y `textLength` (si falta Anton, el texto igual reparte la vuelta completa). Úselo solo en línea, nunca como imagen.

**Accesibilidad.** `logo()`, `sello()`, `selloSucursal()` y `favicon()` llevan `role="img"`, `aria-label` y `<title>` con el texto escapado; con `decorativo: true` pasan a `aria-hidden="true" focusable="false"` (úselo cuando el nombre ya está escrito al lado, p. ej. cabecera). `ampersand()`, `patronSvg()`, `ticketBorde()` y `barras()` son decorativos por defecto.

## 3. Logotipos: aire, tamaños mínimos y color

- **Aire mínimo**: medio plato (½ del diámetro del símbolo) en los cuatro lados. En el apilado, la altura del sol.
- **Tamaños mínimos**: símbolo 16 px (solo favicon ajustado al píxel) y 24 px en pantalla · horizontal 24 px de alto (≈120 px de ancho) · apilado 64 px de ancho · palabra 88 px de ancho · monograma 32 px · sello y sello de sucursal 96 px.
- **El & del logotipo**: 80 % de la altura de mayúsculas, centrado ópticamente, en tomate (sobre claro) o mostaza (sobre oscuro). **El punto de «CO.»** es un plato en miniatura (borde grueso + sol descentrado). Kerning propio: `LA −15`, `TO −45`, `CO −45` (unidades de 2048).
- **Qué color sobre qué fondo**:

| Fondo | Logotipo |
|---|---|
| Pergamino / papel | `marca` (letras tinta, & tomate, plato a color) o `tinta` |
| Carbón / tinta | `marca-oscuro` (letras crema, & mostaza) o `crema` / `oro` |
| Mostaza | `tinta` (nunca crema) |
| Tomate | `crema` u `oro` (nunca `marca`: el borde tomate del plato desaparece) |
| Foto | `crema` u `oro`, **solo** en la zona oscura de la foto o sobre un velo (`--scrim-*`, `--veil`). Nunca sobre la comida |

No: contornos, sombras, degradados, girar, cambiar proporciones, recolorear piezas sueltas, encerrar el logotipo en una caja.

## 4. Color «tomate y mostaza»

La pareja anterior (#823513 / #faae33) era casi idéntica a la referencia Hungry Tiger. Se cambió solo el **valor** de los tokens (los nombres no cambian; nada se rompe):

| Token | Antes | Ahora | Nombre | Rol |
|---|---|---|---|---|
| `--c-ember` | #823513 | **#8e1f16** | Tomate | borde del plato, enlaces y texto de acento sobre crema, banda de acento |
| `--c-ember-deep` | #6b2a0e | #731811 | Tomate oscuro | hover/pressed |
| `--c-line-dark` | #6b2e12 | #74241a | — | filete 1 px sobre carbón (misma visibilidad: 1,72 vs 1,74) |
| `--c-gold` | #faae33 | **#efc547** | Mostaza | el sol del plato; relleno, borde y texto grande sobre oscuro |
| `--c-gold-hover` | #ffc25c | #f6d677 | — | hover del botón mostaza |

Sin cambio: pergamino #ece2d0, papel #f6f0e4, tinta #2a1a12, carbón #281006, tarjeta #402011, chile #d1255c. ΔE2000 frente a la referencia: tomate 7,7 (de óxido marrón a ladrillo-tomate, tono 18° → 5°), mostaza 10,1 (de ámbar a mostaza, 37° → 45°). Ambos combinan con la foto del héroe (tomates cherry y papas).

**Pares AA** (WCAG 2.1, script con la misma fórmula que `#/estilo`; prueba automática en `tests/brand-marks.test.js`):

| Par | Uso | Antes | Ahora |
|---|---|---|---|
| ember / canvas | enlaces y texto de acento | 6,63 | 6,94 |
| ember / linen | ídem sobre lino | 5,76 | 6,02 |
| ember / paper | ídem sobre papel | 7,50 | 7,85 |
| on-dark / ember | texto crema en banda/botón tomate | 6,63 | 6,94 |
| on-dark-muted / ember | secundario sobre tomate | 4,95 | 5,18 |
| canvas / ember-deep | botón tomate en hover | 8,33 | 8,76 |
| char / gold | texto del botón mostaza | 9,57 | 10,92 |
| char / gold-hover | botón mostaza en hover | 11,25 | 12,69 |
| gold / char | mostaza sobre carbón | 9,57 | 10,92 |
| gold / card | mostaza sobre tarjeta | 7,79 | 8,90 |
| gold / ember | mostaza sobre tomate | 4,53 | 5,41 |
| gold / ink | mostaza sobre tinta | 8,90 | 10,16 |
| gold / canvas | **no es texto** (solo relleno) | 1,46 | 1,28 |
| oro sobre velo de foto (peor caso, foto blanca) | `--scrim-t` · `--scrim-b` · `--veil` | 6,20 · 5,17 · 5,57 | 7,08 · 5,91 · 6,36 |

Reglas que siguen igual: mostaza nunca es texto sobre crema; un solo acento por pantalla; sin degradados salvo los velos de foto.

**Pendiente fuera de mi bloque:** `src/styles/admin.css` (flecha del `<select>`, `%23faae33`), `src/ui/dish-art.js` (respaldo SVG) y `src/styles/estilo.css` (velo `rgb(40 16 6)`, sin cambio de color) tienen hex literales; los dos primeros conviene pasarlos a `#efc547` / `#8e1f16` en la pasada de integración.

## 5. Tipografía de marca

Anton (display, mayúsculas) y DM Sans (todo lo demás) no cambian. El ticket usa la pila del sistema `--font-ticket` (ui-monospace, Cascadia Mono, SF Mono, Consolas…): es «letra de caja registradora», un dispositivo, no una tercera voz; solo dentro del ticket.

## 6. Archivos y Vite

- **Iconos de `index.html`** (`favicon.svg`, `apple-touch-icon.png`, `safari-pinned-tab.svg`): se enlazan como `/src/assets/brand/...`; Vite los procesa al compilar (`dist/assets/*-hash.*`; el SVG de máscara lo incrusta como data-URI, por eso no lleva `aria-label`). Se mantiene un favicon en línea (data-URI) como respaldo: el navegador nunca pide `/favicon.ico` (sin 404).
- **og-image**: necesita una URL **estable y absoluta** para los rastreadores, así que vive en `public/marca/og-image.png` (Vite la copia tal cual a `dist/marca/`). `og:image` apunta a `https://restaurante.panacealogic.dev/marca/og-image.png` (destino del README): cámbielo si el dominio cambia. Fuente editable: `src/assets/brand/og-image.svg` (foto incrustada, texto contorneado).
- **Marcas en páginas**: siempre por JS (`brand-marks.js`), no con `<img>` de los archivos: así heredan `brand.js`, `currentColor` y accesibilidad. Los `.svg` de la carpeta son para correo, redes, imprenta y herramientas externas.
- **Regenerar**: `npx vite-node src/assets/brand/generar-marca.mjs` reescribe todos los SVG. Los PNG se rasterizan con Playwright (abrir `og-image.svg` a 1200×630 y `apple-touch-icon.svg` a 180×180 y capturar exacto; ver el informe del bloque V).
- `brand-marks.js` importa `marca.css` y, al cargarse en el navegador, fija `--marca-patron-claro` y `--marca-patron-oscuro` en `:root` (`instalarMarca()`).

## 7. Dónde va cada marca (para la pasada de integración)

| Marca | Página / componente (dueño) | Tamaño · color | Comportamiento |
|---|---|---|---|
| `brand.logoSvg` (símbolo nuevo) | cabecera `cabecera.js` (B), `admin-shell.js`, avatar `phone.js` | 32 px (28 < 900) · a todo color | **ya activo**: la cabecera lo toma de `brand.js`; sin cambios de código |
| `logo({ variante: 'palabra', color: 'oro', decorativo: true })` | pie `footer.js` (B), reemplaza el texto Anton `.site-footer__mark` | ancho del contenedor (SVG fluido, sin `tam`) | el enlace conserva su `aria-label`; el SVG es decorativo |
| `ampersand({ color: 'oro', clase: 'marca-amp-agua' })` | banda CTA «¿Con hambre?» (`inicio.js`, B) | alto 135 %, recortado abajo a la derecha, opacidad .1 | contenedor `position: relative; overflow: hidden`; estático |
| `sello({ color: 'oro', fondo: true })` dentro de `.marca-sello` | héroe de portada, esquina de la foto (B) o junto a la valoración | `--sello-tam: 120px` (96 a 390 px) · giro −8° | `.marca-sello--vivo`: gira 24° al pasar el cursor; nada de giro continuo |
| `selloSucursal(n, { fondo: true })` | selector de sucursal con fotos (`branch-picker.js`, B), esquina sup. izq. de cada foto | 88 px (72 a 390) | decorativo si el nombre ya está escrito (`decorativo: true`) |
| `selloSucursal(n)` | seguimiento de retiro (`pedido.js`, C1) y cocina (C) | 64 px, tinta (oro en cocina oscura) | estático |
| `sello({ color: 'tinta' })` | confirmación de pedido y factura (`ticket.js`, M) | 96–110 px, tinta sobre papel | clase `.marca-sello--estampa`: se «estampa» una vez (escala 1,15 → 1, 300 ms; quieto con `prefers-reduced-motion`) |
| `--font-ticket`, `barras(pedido.ref)`, `--ticket-dientes-*` | ticket de carrito, resumen de pago, factura, cocina (`ticket.js` + `momentos.css`, M) | según el componente de M | el componente es de M: puede adoptar las variables o mantener su borde (ondas 14×8, compatible con `forma: 'ondas'`) |
| `.marca-patron` / `.marca-patron--oscuro` | pie (B) y estados vacíos (`estados-vacios.js`, M); opcional banda «Cómo funciona» | mosaico 120 px | una zona por página; nunca detrás de párrafos largos |
| `logo({ variante: 'monograma' })` | avatar del chat de WhatsApp (`phone.js`) y marca del panel admin | 40 px · a todo color | — |
| `logo({ variante: 'apilado', color: 'marca-oscuro' })` | 404 y pantalla de carga (`no-encontrado.js`, `carga.js`, M) | 160–200 px de ancho | estático |
| `logo({ color: 'marca-oscuro', tam: 52 })` + sello | og-image, correos, redes | — | archivos de `src/assets/brand/` |
| favicon / apple-touch / máscara / theme-color / OG | `index.html` | — | **ya activo** |

## 8. Cambiar de marca (vendedor, ~10 minutos)

1. En `src/config/brand.js`: `nombre` (si termina en «.», el punto se vuelve plato), `iniciales` (monograma, 2–3 caracteres, puede llevar &), `lema` (texto del sello), `colores` (`tomate` = borde y acento sobre claro, `oro` = sol y acento sobre oscuro, más `crema`, `papel`, `tinta`, `carbon`) y `sucursales` (nombres → sellos 01, 02, 03…).
2. Copie los mismos hex a `src/styles/tokens.css` (`--c-ember`, `--c-ember-deep`, `--c-gold`, `--c-gold-hover`, `--c-line-dark`) y corra `npx vitest run tests/brand-marks.test.js`: la prueba de paleta falla si un par baja de AA o si `tokens.css` y `brand.js` no coinciden.
3. `npx vite-node src/assets/brand/generar-marca.mjs` (SVG nuevos) y rasterice los dos PNG.
4. En `index.html`: el favicon en línea (copie `aDataUri(favicon(32))`), `mask-icon color`, `theme-color`, `description` y las etiquetas `og:*` / `twitter:*`.
5. Revise `#/estilo` → Identidad: logotipo a 24 px, sellos a 96 px, contraste de la paleta.
6. Límites: el logotipo solo dibuja los caracteres de `glifos-anton.js` (A–Z, Ñ, vocales con tilde, Ü, 0–9 y `& . , ' ’ - · ! ? ¡ ¿ / # : +`); los demás se omiten. Para otra tipografía display, regenere ese archivo con fontTools (ver el informe del bloque V).

## 9. Licencias

Anton © 2020 The Anton Project Authors, SIL Open Font License 1.1 (`src/assets/brand/OFL-Anton.txt`). Los contornos se usan como dibujo del logotipo y viajan con su licencia. Foto de `og-image`: `hero/hero.webp` (ver `docs/design/ATTRIBUTIONS.md`). Ninguna marca copia logotipos reales ni de las referencias (Hungry Tiger, Amrit, Sunday).
