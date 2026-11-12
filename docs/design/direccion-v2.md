# Dirección de arte v2 · Plato & Co.

Fecha: 11 nov 2026. Base: capturas reales (Playwright) de las tres referencias a 1440 px y 390 px, y de nuestra demo en `http://localhost:5173` a 1440 y 390 (portada, menú, carrito, hoja del carrito, diálogo de modificadores, pedido, chat, cocina, indicadores, reservas). Sunday se capturó desde el archivo público de web.archive.org (versión del 1 ago 2026) porque el sitio en vivo responde 403 con verificación de Cloudflare.
Skills aplicadas: `ui-ux-pro-max`, `design:design-critique`, `zizi-skills:design-guide`, `zizi-skills:design-assets` (no se generan assets: las fotos ya existen en `src/assets/photos/`, 40 de menú + 8 de escena, con `manifest.json`).

**Idea en una línea:** «Mesa de pergamino con fotografía a sangre». Estructura editorial de Amrit (lienzo claro, fotos a sangre, secciones partidas texto/foto, filetes de 1 px, menú con precio a la derecha, logotipo gigante en el pie) + momentos de póster de Tiger (titular de una línea a todo el ancho, filetes punteados oro, píldoras, botón flotante) + claridad SaaS de Sunday (frases grandes con cola apagada, tarjetas por rol con foto, cifras gigantes, panel claro).

---

## 1. Diagnóstico honesto (de mayor a menor impacto)

Nuestras pantallas se ven «plantilla» por tres razones de fondo: **cero fotografía** (0 `<img>` y 33 `<svg>` en `#/`), **todo grita igual** (Anton de 26 a 153 px en casi cada título) y **todo vive dentro de una caja** (18 contenedores con borde en `#/`). Las referencias hacen lo contrario: foto real dominante, un solo momento tipográfico por pantalla y contenido suelto sobre el lienzo separado por filetes.

1. **Sin fotografía (todas las vistas).** Nuestro `#/` tiene 0 fotos; Amrit tiene 8 fotos ≥ 450 px de ancho (≈36 % del área de la página), Tiger ~12, Sunday ~10. Las ilustraciones SVG repiten el mismo fondo radial marrón/oro y vuelven idénticas las 8 tarjetas. **Arreglo:** foto real en héroe, platos, sucursales, bandas y miniaturas; el SVG solo como respaldo.
2. **Héroe de 4 líneas + dibujo.** `#/` a 1440: h1 Anton 153,6 px en 4 renglones (2 crema + 2 oro) en el 45 % izquierdo y una hamburguesa caricatura en un disco de 640 px con sello giratorio. Tiger: «BOLD FLAVOR» 213 px **en una sola línea** de 1376 px; Amrit: foto 1440×900 a sangre con titular centrado sobre ella. **Arreglo:** foto a sangre + titular de una línea que ocupe el ancho (sección 3).
3. **Cabecera sobrecargada.** 1440: banner pegajoso 28 px + cabecera 61 px con 9 controles (3 enlaces, Reservar, Pedir, carrito, Reiniciar demo, Entrar como administrador). 390: banner pegajoso 62 px (2 líneas) + cabecera 147 px en 3 filas = **209 px de cromo, 25 % del viewport**. Amrit: cabecera transparente flotando sobre el héroe (altura de flujo 0), 5 enlaces + 2 botones cuadrados; en celular solo logo + «Menu ≡». **Arreglo:** cabecera 72/56 px, utilidades en un menú «Demo», banner no pegajoso de una línea.
4. **Monotonía tipográfica.** Anton se usa para nombres de plato (26 px, 2 líneas), «RESUMEN», «SU PEDIDO» (≈150 px en un checkout), «EN VIVO» (72 px), «PED-048», combos, títulos de pasos. Las tres referencias reservan la display para 1–3 momentos por pantalla y ponen el resto en sans pequeña (Amrit: nombre de plato 13–15 px; Sunday: 14–16 px). **Arreglo:** Anton solo ≥ 64 px (titulares de sección, cifras, logotipo) y cifras de precio/KPI; todo lo demás DM Sans.
5. **Cajas por todas partes.** `#/` tiene 18 cajas con borde de 1 px y fondo papel (8 platos, 6 combos, menú del día, 3 reseñas). Amrit no usa una sola tarjeta en su portada salvo las reseñas: el contenido se apoya en el lienzo y en filetes de columna. **Arreglo:** quitar bordes y fondos; la foto es la «tarjeta»; filetes de 1 px entre columnas y filas.
6. **Ping-pong de fondos.** `#/` cambia de fondo 7 veces (carbón → pergamino → lino → carbón → pergamino → óxido → carbón). Amrit se queda en pergamino con fotos a sangre y un pie oscuro. **Arreglo:** pergamino como base; carbón solo en héroe, «cómo funciona» y pie; la banda final es una **foto**, no un color. Se eliminan la banda óxido y la de lino.
7. **Tarjeta de plato sin jerarquía.** 322×408 px: dibujo 4:3, nombre Anton en 2 líneas, precio Anton, insignia verde, línea de alérgenos y píldora oscura «Pedir +». Tiger: foto 423×346 dominante, 2 etiquetas píldora, título, 2 líneas. **Arreglo:** anatomía nueva (sección 3): foto 4:3 a sangre de la tarjeta, nombre DM Sans 600, precio tabular, botón «+» redondo.
8. **Menú como bloque oscuro.** `#/menu` abre con una banda carbón de 305 px y «NUESTRO MENÚ» ≈150 px, 9 píldoras con borde, rejilla de 3 + caja «SU PEDIDO» con borde. Amrit `/menu`: pergamino, «MENU» centrado flanqueado por dos rótulos de 13 px, franja de foto a sangre 1440×720, categorías con título a la izquierda y lista con filetes y precio a la derecha. **Arreglo:** cabecera clara editorial + franja de foto + pestañas de texto + rejilla de fotos (sección 2.2).
9. **Escalas de página equivocadas en el flujo de compra.** `#/carrito`: h1 «SU PEDIDO» ≈150 px y subtítulos «01 ¿CÓMO LO QUIERE?» Anton 48 px; parece un póster, no un pago. Sunday resuelve formularios con 32–48 px peso 400 y campos limpios. **Arreglo:** h1 ≤ 96 px, pasos en DM Sans 600 28 px con numeral oro.
10. **Iconos emoji.** `core/live-feed.js` (📥 🍳 ✅ 🛵 🎉 🧾 🔔 📅 🙋), `views/admin-cocina.js` (🛍 🛵), `views/chat.js` (📱 🖥️), `kitchen.css` (✆). Se ven distintos en cada sistema y abaratan el panel. Tiger usa iconos de línea de 1,5 px en oro dentro de círculos. **Arreglo:** juego SVG propio (sección 5).
11. **Escenario del chat vacío y pesado.** `#/chat` a 1440: «EN VIVO» Anton 72 px dentro de una caja marrón de 696 px; estado vacío con borde punteado; ~400 px de carbón muerto bajo el panel; rótulos con emoji. Sunday muestra el producto como una pantalla real (laptop/teléfono en contexto fotográfico). **Arreglo:** el panel se presenta como una ventana clara del restaurante sobre una foto de salón velada (sección 2.6).
12. **Defectos visibles que delatan plantilla.** (a) Cocina 1440: segmentos inactivos «Costa / Norte» ilegibles (texto crema sobre píldora crema). (b) Cocina 390: el `<select>` de sucursal muestra el chevron **teselado** (falta `background-repeat: no-repeat`). (c) `#/menu` 390: la píldora «Presentación» tapa la barra «Ver carrito · 2 productos». (d) La píldora «Presentación» de 170×44 px flota en todas las rutas.
13. **Pie sin gesto final.** Logotipo «PLATO & CO.» ≈190 px alineado a la izquierda ocupando ~65 % del ancho, y una columna de enlaces apilada. Amrit y Tiger cierran con el logotipo de **borde a borde** (198/195 px) y una rejilla de 4 columnas con filetes verticales. **Arreglo:** logotipo ajustado al ancho (sección 3.10).
14. **Espaciado interno apretado.** El espaciado entre secciones ya es correcto (126 px arriba a 1440), pero dentro de cada sección hay demasiados elementos (8 platos, 6 combos, 3 reseñas, cifras, filas). Amrit: una idea por sección (título + 2 líneas + 1 botón + 1 foto). **Arreglo:** 4 destacados (no 8), combos como lista, cifras con 3–4 elementos y aire de 96–136 px.
15. **Sucursales sin lugar.** El selector de filas (01 CENTRO / 02 COSTA / 03 NORTE) es correcto pero abstracto. Amrit y Sunday anclan cada local con una foto (rejilla 3×452×504). **Arreglo:** selector con foto de portada por sucursal (sección 3.4).
16. **Movimiento sin intención.** Solo hay una marquesina y un `reveal` genérico; ninguna foto se revela, nada reacciona al cursor salvo colores. **Arreglo:** 5 interacciones baratas (sección 6).
17. **Panel admin sin imagen ni contexto.** Indicadores y reservas son solo texto y barras. Sunday muestra comparativa multi-local con identidad visual de cada local. **Arreglo:** miniaturas de sucursal y de plato en comparativa y «más vendidos».

**Lo que sí funciona (se conserva):** paleta cálida con un solo acento oro; cifras gigantes de estadística; píldoras para botones; filetes punteados; numerales en pasos; ~~marquesina pausable~~ (quitada a pedido del cliente); foco visible; contraste AA documentado en `tokens.css`.

## 2. Dirección por página

Convenciones: contenedor 1376 px a 1440 (gutter 32), 12 columnas con separación 24; a 390, gutter 16 y una columna. «A sangre» = ancho de la ventana, sin gutter. Todas las fotos con radio 0. «Velo» = degradado de foto definido en la sección 4 (solo bajo texto sobre foto).

### 2.1 Portada `#/`
Orden final (desktop 1440 → celular 390):
1. **Héroe** (carbón + foto `hero/hero`). Ver composición exacta en 3.1.
2. ~~**Marquesina** (pergamino, filetes de 1 px arriba y abajo, 28 px de padding): nombres de platos en Anton 64 px tinta (40 px a 390), separador ✦ oro 16 px, 36 s lineal, pausable.~~ **Quitada a pedido del cliente (11 nov 2026):** el héroe pasa directo a «Elija su sucursal».
3. **Elija su sucursal** con fotos `hero/sucursal_1..3` (3.4). Título a la izquierda, nota 17 px a la derecha.
4. **Lo que más se pide**: 4 tarjetas de plato con foto en una fila (no 8); a 390 fila deslizable con scroll-snap, tarjeta 78 vw.
5. **Cómo funciona** (banda carbón): frase grande + 3 pasos con iconos + 3 tarjetas por rol con foto (3.5).
6. **Cifras** (pergamino): 4 cifras Anton con filetes verticales; nota «cifras ficticias» 12 px debajo, no como encabezado.
7. **Menú del día + combos** como listas editoriales con miniaturas (3.7).
8. **Reseñas**: título «4,8 de 5» + 3 tarjetas altas de filete (única excepción de caja) en fila; a 390 deslizables.
9. **Banda CTA con foto** `hero/cta_ingredientes` (3.8).
10. **Pie** (3.10).

### 2.2 Menú `#/menu`
- **Cabecera clara (pergamino)**, sin banda oscura. Fila centrada: rótulo 13 px «40 platos» · h1 Anton «LA CARTA» 160 px (72 px a 390) · rótulo 13 px «3 sucursales» (patrón Amrit). Debajo, píldoras de sucursal centradas (variante `pildoras`).
- **Franja de foto a sangre** `hero/ambiente_parrilla`: 1440×360 (`aspect-ratio: 4/1`, `object-position: 50% 45%`); a 390: 390×200. Sin texto encima, sin velo.
- **Barra de categorías pegajosa**: pestañas de **texto** DM Sans 500 15 px, subrayado oro de 2 px + peso 700 en la activa (no depende solo del color), separación 28 px, fondo pergamino con filete inferior. Sin píldoras con borde. A 390: fila deslizable con 16 px de padding.
- **Cuerpo**: columna de productos (8/12) + carrito lateral (4/12, 340 px).
  - Encabezado de categoría: Anton 92 px a la izquierda, descripción 17 px y «6 platos» a la derecha, filete debajo.
  - Rejilla 3 columnas de tarjetas con foto (≈316 px de ancho, foto 316×237). Separación 24 horizontal, 56 vertical.
  - A 390: filas horizontales (foto 120×90 a la izquierda, texto a la derecha, botón «+» 44 px), filete entre filas. Barra fija «Ver carrito · n · total».
- Fotos: `menu/<productId>.webp` con `loading="lazy"`.

### 2.3 Tarjeta de plato (todas las vistas)
Anatomía exacta en 3.3. Variantes: `grid` (portada, menú desktop), `fila` (menú celular), `mini` (miniatura 4:3 de 64×48 para carrito, pedido y admin). El diálogo de modificadores abre con la foto 16:9 a sangre arriba (recorte de la 4:3 con `object-position: 50% 55%`), nombre DM Sans 600 28 px y precio tabular a la derecha.

### 2.4 Hoja del carrito (celular) y carrito lateral (desktop)
- **Desktop (carrito lateral en `#/menu`)**: sin caja. `position: sticky` bajo la barra de categorías; filete izquierdo de 1 px y padding-left 32. Título DM Sans 600 20 px «Su pedido» + contador 13 px. Cada línea: miniatura 64×48, nombre 15 px 600, modificadores 13 px apagados, cantidad (stepper 36 px) y precio tabular a la derecha. Totales con filete; total en Anton 56 px; botón píldora tinta a lo ancho «Continuar al pago →».
- **Celular (hoja inferior existente `.modal-hoja`)**: alto máx. 85 svh, asa de arrastre de 36×4 px, mismo contenido que el lateral, botón fijo abajo. Fondo pergamino, sin bordes internos salvo filetes.
- La barra «Ver carrito» reserva 72 px a la izquierda para el botón de presentación en celular (ver 3.9).

### 2.5 Pago `#/carrito` y seguimiento `#/pedido/:id`
- **Pago**: h1 Anton 96 px (56 px a 390) «Su pedido», eyebrow «Paso final · 2 productos». Columna izquierda 7/12 con pasos: numeral Anton oro 40 px + título DM Sans 600 28 px («¿Cómo lo quiere?», «¿A dónde lo llevamos?», «Forma de pago»), filete entre pasos, 64 px de aire. «Retiro en sucursal» muestra las 3 tarjetas de sucursal con foto 4:3 de 240×180. Resumen a la derecha 4/12 sin caja (filete izquierdo), miniaturas `mini`, total Anton 72 px. Botón «Confirmar pedido · US$ x» píldora tinta a lo ancho.
- **Seguimiento**: banda carbón con estado Anton 128 px oro («RECIBIDO») a la izquierda y ETA Anton 200 px crema a la derecha (como hoy). Fila de 5 pasos con icono SVG (sección 5) en círculo de 40 px; el paso actual con relleno oro. Debajo, 2 columnas: «Su pedido» con miniaturas `mini`; «Detalles» encabezado por una foto 4:3 de 100 % del ancho de la columna: `hero/delivery` si es entrega, `hero/sucursal_N` si es retiro.

### 2.6 Chat `#/chat` (escenario + teléfono + panel en vivo)
- **Escenario**: fondo `hero/ambiente_salon` a sangre con velo sólido `--veil` (carbón al 82 %), así se intuye un restaurante sin competir. Contenido a 1440 en 2 columnas: teléfono 400 px (5/12) y panel (7/12).
- **Intro**: eyebrow «Demo en vivo · WhatsApp» y frase estilo Sunday en DM Sans 400 48 px/1,08 (30 px a 390): «Lo que escribe su cliente.» + cola apagada «Lo que ve su equipo, al instante.» La pista para el presentador baja a 15 px en `--c-on-dark-muted`.
- **Rótulos de columna**: icono SVG `movil` / `panel` + texto 13 px en mayúsculas, sin emoji.
- **Teléfono**: se conserva (hooks `.tel-*` intactos). Quitar la sombra bajo el teléfono; marco carbón con filete `--c-line-dark`.
- **Panel en vivo como «ventana del restaurante»**: superficie clara `--c-adm-surface`, radio `--r-panel` 16 px, barra superior de 40 px con 3 puntos y la etiqueta «panel.platoyco.example · Centro». Título DM Sans 600 20 px «En vivo» con punto oro pulsante (estático con movimiento reducido). Ítems: icono SVG en círculo de 36 px, título 16 px 600, hora tabular a la derecha, detalle 14 px, enlace texto. Estado vacío: una línea con icono `chat`, sin caja punteada. Botones «Ver en cocina» (píldora tinta) y «Ver reservas» (fantasma).
- **Modo IA**: interruptor en una línea bajo el teléfono, sin caja.
- 390: intro, teléfono a lo ancho (alto 640 px), panel debajo; sin espacio muerto.

### 2.7 Panel admin (cáscara, cocina, indicadores, reservas)
- **Cáscara**: barra blanca 64 px con filete `--c-adm-hair`; marca a la izquierda; pestañas de texto con subrayado tinta 2 px; selector de sucursal segmentado con **inactivos en `--c-ink-soft` sobre `--c-adm-soft`** (corrige el defecto 12a); «Reiniciar demo» como botón de texto; «Volver a la vista de cliente» fantasma. En cocina la barra es carbón (pantalla de cocina), pero los segmentos inactivos usan `--c-on-dark-muted` sobre `--c-card`. El `<select>` de 390 lleva `background-repeat: no-repeat` (defecto 12b). El rol («Vista por rol · Cocina») pasa de píldora a eyebrow 12 px.
- **Cocina (oscura, legible a 2 m)**: columnas con título DM Sans 700 18 px en mayúsculas y conteo Anton 96 px oro. Tarjetas sin borde de color grueso: franja de estado de 4 px a la izquierda + píldora de estado con icono (`check`, `alerta`) y texto. ID en DM Sans 700 26 px tabular (no Anton). Tipo con icono `en-camino`/`retiro` y canal con `web`/`chat`. Platos 22 px. Botón «Avanzar a …» píldora oro a lo ancho.
- **Indicadores (blanco, Sunday)**: KPIs Anton 112 px (64 px a 390) con etiqueta 14 px gris y filetes verticales entre KPI. «Comparativa entre sucursales»: cada fila con miniatura de portada 96×72 (`hero/sucursal_N`), nombre, barra y cifras tabulares. «Platos más vendidos»: miniatura `mini` 48×36 + nombre + barra. «Resumen diario por correo»: tarjeta blanca radio 16 con filete, tipografía 15 px, sin sombra.
- **Reservas**: franjas horarias como tira horizontal con filetes (no 11 cajas): cada franja hora 13 px + «1/6» Anton 32 px; seleccionada = relleno tinta + ✓. Lista del día con hora Anton 40 px. Plano de mesas en blanco con filetes, seleccionado en tinta.

## 3. Qué cortar, qué agrandar y composiciones exactas

**Cortar:** `heroArt()` y los dos sellos giratorios (`selloArt`) de portada; 4 renglones de titular; 4 de los 8 destacados; bordes y fondo papel de tarjetas de plato, combos y menú del día; píldora oscura «Pedir +» en cada tarjeta; banda óxido y banda lino; textura `.grain` donde haya foto; caja punteada de estados vacíos; Anton en nombres de plato, títulos de tarjeta, «Resumen», «En vivo», IDs de pedido y títulos de pasos; banner pegajoso y de 2 líneas; «Reiniciar demo» y «Entrar como administrador» visibles en la cabecera; emoji; sombra del teléfono y degradado radial del chat (excepciones de la ronda 1).
**Agrandar:** foto (héroe ≥ 55 % del primer viewport); titular a una línea de borde a borde; aire entre secciones 136 px a 1440 (88 px a 390); ~~marquesina 64 px~~ (quitada); logotipo del pie ajustado al ancho; cifras; precios como números tabulares claros; tarjetas por rol con foto.

### 3.1 Héroe — 1440×900
- Sección `min-height: calc(100svh - banner)` con fondo `--c-char`; la cabecera transparente (72 px) se superpone (`margin-top: -72px` en el héroe y padding-top 104 px).
- **Bloque titular (≈260 px de alto)**: eyebrow DM Sans 600 13 px +0.08em oro «Hamburguesas · pastas · parrilla · bowls»; h1 **una sola línea** «HECHO AL MOMENTO.» en Anton crema, `font-size: clamp(5.25rem, calc((100vw - 2 * var(--gutter)) / 7.6), 11.5rem)` → **181 px a 1440** (medido: a 168 px ocupa 1240 px; a 181 px ≈1336 de 1376). Interlínea .86, tracking −0.02em. Filete punteado oro de 1 px debajo (Tiger). La segunda frase «Servido con ganas.» pasa al lead, no al h1.
- **Foto**: `hero/hero` (1600×900) a sangre, 1440×560 (`object-fit: cover; object-position: 50% 78%`). Velo superior `--scrim-t` en el primer 28 % para fundir el negro de la foto con el carbón; velo inferior `--scrim-b` bajo el texto.
- **Superpuesto en la foto, abajo a la izquierda** (32 px de margen): lead DM Sans 400 19 px crema, 2 líneas, máx. 440 px; debajo CTA «Pedir ahora →» (píldora oro, 52 px) + «Reservar mesa» (fantasma crema).
- **Abajo a la derecha**: tarjeta de valoración pergamino, radio 0, 320×120, que sobresale 40 px por debajo del borde de la foto (Amrit 4,7): estrellas oro 16 px, «4,8» Anton 56 px, «2.140 reseñas · cifras ficticias» 13 px.
- Medidas de control: banner 28 + titular 260 + foto 560 = 848 px ≤ 900; los CTA quedan dentro del primer viewport; la foto cubre ≈62 % del área visible.

### 3.2 Héroe — 390×844
Banner 28 px (no pegajoso) → cabecera 56 px transparente → eyebrow 12 px → h1 en **2 líneas** «HECHO AL / MOMENTO.» Anton 84 px (medido: «MOMENTO.» a 76 px = 292 px; a 84 px ≈ 323 de 358) → foto a sangre 390×300 (`object-position: 40% 80%`, se ve la hamburguesa) → lead 17 px → CTA a lo ancho apilados (52 px) → valoración en una línea. Los CTA terminan antes de 790 px.

### 3.3 Tarjeta de plato con foto (variante `grid`)
- Sin borde, sin fondo, sin sombra, radio 0. `cursor: pointer` en toda la tarjeta (abre el diálogo/agrega).
- Foto 4:3 a todo el ancho de la tarjeta (`width="800" height="600"`, `aspect-ratio: 4/3`), filtro `--photo-filter`, zoom 1.04 al pasar el cursor (sección 6).
- Bajo la foto (16 px): fila nombre + precio. Nombre DM Sans 600 18 px/1.25, sentido de oración, hasta 2 líneas; marca «(V)» 13 px tras el nombre si es vegetariano (patrón Amrit). Precio DM Sans 600 18 px `tabular-nums`, «US$» 12 px, alineado a la derecha.
- Línea meta 13 px `--c-ink-muted`, 1 línea con elipsis: «Contiene: gluten, lácteos» / «Sin alérgenos declarados» / icono `alerta` + «Consulte alérgenos». Insignia «Picante» (rojo chili) solo si aplica.
- Botón «+» redondo 44 px (borde 1 px tinta, icono 20 px) en la esquina inferior derecha **de la foto**, a 12 px; hover: relleno oro; `aria-label="Agregar {nombre}"`. Conserva `data-add`.
- Agotado: foto en `grayscale(1) opacity(.6)` + etiqueta «Agotado hoy» sobre la foto; botón deshabilitado.

### 3.4 Selector de sucursal con foto (variante `fotos` en portada)
3 columnas de 437 px: foto `hero/sucursal_N` 4:3 (437×328); debajo «01» DM Sans 600 13 px, nombre Anton 64 px («CENTRO»), dirección 15 px, horario, estado con punto + texto («Abierto · cierra 22:00») y ETA DM Sans 600 17 px «30–40 min». Toda la columna es el `<label>` del radio (teclado con flechas, como hoy). Seleccionada: anillo tinta de 2 px con 6 px de separación alrededor de la foto + píldora tinta «✓ Su sucursal» sobre la foto arriba a la izquierda. `sucursal_1` es fría y luminosa: aplicarle `--photo-filter-warm`. A 390: fila deslizable con scroll-snap, tarjetas de 82 vw y foto 4:3.

### 3.5 Banda «Cómo funciona» (carbón, 136 px arriba y abajo)
- Fila 1: 7 columnas con eyebrow + frase DM Sans 400 48 px/1.08 −0.03em crema: «Su cliente escribe como a un amigo.» + cola en `--c-on-dark-muted`: «La cocina lo recibe sola y la factura sale por el mismo chat.» 4 columnas a la derecha: párrafo 17 px + «Probar el asistente →» fantasma.
- Fila 2 (96 px después): 3 pasos separados por filetes verticales `--c-line-dark`. Cada uno: icono 24 px en círculo de 48 px con borde oro 1 px; «01» DM Sans 600 13 px; título DM Sans 600 24 px; texto 16 px. Sin numerales Anton.
- Fila 3 (120 px después): **3 tarjetas por rol** (Sunday), 437×520, radio 0: «Quien pide» (`hero/delivery`), «Quien cocina» (`hero/ambiente_parrilla`), «Quien gerencia» (`hero/ambiente_salon`). Velo superior; arriba a la izquierda rótulo 12 px +0.08em y título DM Sans 500 26 px crema (p. ej. «Pide por WhatsApp en un minuto»); abajo enlace «Ver el chat →» / «Ver la cocina →» / «Ver indicadores →». A 390: deslizables 82 vw, proporción 4:5.

### 3.6 Cifras
4 columnas con filete vertical; cifra Anton `clamp(5rem, 9vw, 10rem)` (160 px a 1440, 80 px a 390 en rejilla 2×2), unidad DM Sans 600 24 px, etiqueta 15 px. Contador animado (sección 6).

### 3.7 Menú del día y combos (sin cajas)
- Menú del día: izquierda 4/12 (insignia de disponibilidad, h2 Anton 92 px, horario 17 px, precio DM Sans 600 40 px «US$ 9.95» + «por persona · solo en sala» 13 px). Derecha 8/12: lista numerada I–III; cada fila 104 px con miniatura 96×72, numeral romano en círculo, nombre DM Sans 500 20 px; filetes entre filas.
- Combos: 3 columnas con filetes verticales. Cada una: nombre DM Sans 600 22 px + precio a la derecha; 3 filas con miniatura 64×48 + numeral + plato; «Por separado ~~US$ x~~» 13 px; botón fantasma «Pedir combo». A 390: columnas apiladas con filete horizontal.

### 3.8 Banda CTA con foto
`hero/cta_ingredientes` a sangre, 1440×640 (390×560), `object-position: 50% 50%` (el centro de la foto es pizarra oscura vacía). Velo sólido `--veil-soft` (carbón 35 %). Centrado: «¿CON HAMBRE?» Anton 200 px crema (72 px a 390, 2 líneas), lead 19 px, dos CTA (oro + fantasma crema) centrados.

### 3.9 Cabecera, banner y presentación
- Desktop 72 px: logo + «Plato & Co.» DM Sans 700 18 px; nav central 15 px con subrayado oro 2 px en la activa; derecha: «Reservar» (fantasma 40 px), «Pedir» (píldora oro sobre héroe / tinta sobre claro), carrito círculo 44 px con contador oro 18 px, y botón de texto «Demo ▾» que abre un menú con: Entrar como administrador · Reiniciar demo · Presentación guiada (llama a `startPresentation()`; no usar el texto «modo Presentación», ver contrato E2E). En `#/` empieza transparente con texto crema y filete crema al 16 %; al bajar del héroe pasa a pergamino + `--shadow-sticky` (300 ms). En el resto de rutas, pergamino desde el inicio.
- Celular 56 px: logo, carrito 44 px y botón «Menú ≡» 44 px que abre una hoja a pantalla completa (carbón) con enlaces Anton 48 px, botones Reservar/Pedir y el grupo «Demo».
- Banner: 1 línea 28 px, 12 px, **no pegajoso**; a 390: «Demo · datos ficticios · Agendar diagnóstico →» con elipsis.
- Píldora «Presentación» (`.pres-lanzar`): desktop igual pero 40 px; < 900 px se convierte en círculo de 44 px abajo a la izquierda con texto solo para lectores de pantalla; las barras fijas inferiores reservan 72 px a la izquierda.

### 3.10 Pie
Carbón, padding-top 120. Fila de 4 columnas con filetes verticales `--c-line-dark` (3 sucursales + contacto/enlaces), texto 14 px. Logotipo «PLATO & CO.» Anton oro **ajustado al ancho**: `font-size: calc((100vw - 2 * var(--gutter)) / 4.2)` (≈328 px a 1440, ≈85 px a 390; medido: a 300 px ocupa 1255 px). Fila legal 13 px tras un filete punteado oro, con el aviso de demostración.

### 3.11 Rejilla y espaciado
| Bloque | 1440 | 390 |
|---|---|---|
| Separación entre secciones | 136 px arriba/abajo (≥ 120) | 88 px |
| Destacados / sucursales / roles / pasos / cifras | 4 / 3 / 3 / 3 / 4 columnas | deslizable / deslizable / deslizable / 1 / 2×2 |
| Menú: productos + carrito | 3 columnas (8/12) + 340 px | 1 columna en filas |
| Título de sección h2 | Anton `clamp(3rem, 5vw + 1.25rem, 6rem)` = 92 px | 48 px |
| Frase grande (Sunday) | DM Sans 400 48 px | 30 px |

## 4. Ajustes de tokens (`src/styles/tokens.css`)
Solo **añadir**; no renombrar ni borrar (B y C dependen de los nombres actuales).

| Token nuevo/cambio | Valor | Por qué (evidencia) |
|---|---|---|
| `--fs-hero` | `clamp(5.25rem, calc((100vw - 2*var(--gutter))/7.6), 11.5rem)` | Tiger 213 px en una línea; medido Anton: 181 px llena 1376 px |
| `--fs-h2` | `clamp(3rem, 5vw + 1.25rem, 6rem)` | Títulos de sección 92 px: Amrit 50–60, Tiger 64; los nuestros eran 72 pero se repetían en todo |
| `--fs-statement` | `clamp(1.875rem, 1.2rem + 2.2vw, 3rem)` + DM Sans 400, −0.03em, lh 1.08 | Sunday: frases 40–48 px peso 400 con cola apagada |
| `--fs-wordmark` | `calc((100vw - 2*var(--gutter))/4.2)` | Amrit 198 px / Tiger 195 px de borde a borde |
| `--section-y` | `clamp(88px, 3vw + 92px, 136px)` | Amrit 120–160 px entre secciones |
| `--sp-9` | `160px` | huecos grandes dentro de bandas |
| `--r-photo` | `0` | Amrit y Tiger: radio 0 medido en todas las fotos |
| `--r-panel` | `16px` (solo panel admin y ventana «En vivo») | Sunday: tarjetas 16 px. Separa «software del restaurante» (suave) de «marca del restaurante» (afilada) |
| `--photo-filter` | `saturate(.92) contrast(1.05) sepia(.08)` | Unifica fotos de fondo blanco con las oscuras (nachos, cheesecake, helado, batido, limonada son outliers) |
| `--photo-filter-warm` | `saturate(.85) sepia(.18) contrast(1.04)` | `sucursal_1` es fría y luminosa |
| `--scrim-t` / `--scrim-b` | `linear-gradient(to bottom, rgb(40 16 6 / .85), rgb(40 16 6 / 0) 28%)` / `linear-gradient(to top, rgb(40 16 6 / .8), rgb(40 16 6 / 0) 50%)` | Amrit usa velo oscuro sobre su héroe; ver decisión abajo |
| `--veil` / `--veil-soft` | `rgb(40 16 6 / .82)` / `rgb(40 16 6 / .35)` | velo sólido para fondo del chat y banda CTA |
| `--ease-out`, `--dur-fast`, `--dur-photo` | `cubic-bezier(.2,.7,.2,1)`, `.2s`, `.7s` | hover 150–300 ms; revelado de foto más lento |
| `--header-h` | `72px` (56 px < 900) | Amrit/Tiger 72–76 px; hoy 61 + banner pegajoso |

**Decisión sobre degradados.** La regla 5 prohíbe degradados. Se mantiene para fondos, botones y tarjetas, **con una sola excepción documentada: el velo de foto (`--scrim-t`, `--scrim-b`) y solo detrás de texto sobre fotografía**. Un velo sólido sobre toda la foto (alternativa sin degradado) apaga la comida y la vuelve gris; el velo localizado protege el contraste AA del texto y deja intacta la parte apetitosa. Donde el texto no toca la foto, no hay velo. Actualizar la regla 5 en `docs/design/system.md`.

**Decisión sobre «una sola display».** Se mantiene Anton como única display; **no** se añade una serif tipo Amrit. Razón: la lección de Amrit no es la serif sino la contención (display solo en momentos clave, todo lo demás pequeño y claro). Sumar una serif ligera a Anton + DM Sans daría tres voces y un collage de plantilla. El contraste editorial lo da DM Sans 400 grande con cola apagada (Sunday). Regla nueva: **Anton solo ≥ 48 px o en cifras (precios grandes, KPIs, conteos)**; máximo 3 usos de Anton por viewport.

**Radios y bordes.** Cliente: fotos y tarjetas 0; botones, chips e insignias píldora (2 de 3 referencias). Admin y ventana «En vivo»: 16 px. Bordes de caja solo en reseñas, inputs y el resumen por correo; el resto son filetes de 1 px entre filas o columnas.

## 5. Iconos SVG (sustituyen a todos los emoji)
Nuevo `src/ui/icons.js`: `icono(nombre, { tam = 20, etiqueta } = {})` devuelve `<svg viewBox="0 0 24 24" width height fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">`. Si hay `etiqueta`, se pone `role="img"` y `aria-label`; si no, el texto visible al lado da el significado. Contenedor «estilo Tiger»: círculo de 40 px con borde 1 px (oro en oscuro, `--c-rule` en claro).

| Nombre | Trazo sugerido (24×24) | Dónde |
|---|---|---|
| `pedido` | `M7 3h10v18l-2.5-1.6L12 21l-2.5-1.6L7 21V3z M9.5 8h5 M9.5 11.5h5 M9.5 15h3` | live-feed «pedido creado», paso «Recibido» |
| `cocina` | sartén `M3 13h13v1a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-1z M16 14h5` + vapor `M9 4c-1.2 1.4-1.2 2.6 0 4 M12.5 5c-1 1.1-1 2.1 0 3.2` | estado «En cocina» |
| `listo` | campana `M4 17h16 M6 17a6 6 0 0 1 12 0 M12 9V7 M10 7h4 M3 20h18` | estado «Listo» |
| `en-camino` | moto: 2 ruedas `r=2` en (7,17) y (17,17) + `M9 17h6 M17 17l-2-7h-3 M6 15l2-5h4` | estado «En camino», cocina «Entrega» |
| `entregado` | casa con check `M4 11l8-7 8 7v9H4z M9 15l2 2 4-4` | estado «Entregado» |
| `retiro` | bolsa `M5 8h14l-1 12H6L5 8z M9 8V6a3 3 0 0 1 6 0v2` | cocina «Retiro en local», pago |
| `reserva` | calendario `M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4 M8 14h3` | live-feed «reserva», admin reservas |
| `persona` | `circle 12,8 r4 + M4 21a8 8 0 0 1 16 0` | live-feed «pide hablar con una persona», botón «Pasar a una persona» |
| `chat` | burbuja tipo mensajería (no el logo de WhatsApp) `M4 20l1.4-4.2A8 8 0 1 1 8.2 18.7L4 20z M9 10.5h6 M9 13.5h4` | canal WhatsApp en cocina (reemplaza `✆`), paso 1 de «Cómo funciona», estado vacío |
| `web` | globo `circle r9 + M3 12h18 + M12 3a14 14 0 0 1 0 18 + M12 3a14 14 0 0 0 0 18` | canal Web en cocina |
| `check` | `M5 12.5l4.5 4.5L19 7.5` | «A tiempo», pasos hechos |
| `alerta` | `M12 4l9 16H3L12 4z M12 10v4 M12 17.5v.01` | «Atención», «Retrasado», «Consulte alérgenos» |
| `movil` / `panel` | `M8 3h8v18H8z M11 18h2` / `M3 5h18v11H3z M8 20h8 M12 16v4` | rótulos de columnas del chat (reemplazan 📱 🖥️) |
| `menu`, `cerrar`, `flecha`, `mas`, `reloj` | líneas simples de 1,5 px | cabecera celular, hoja, CTA, botón «+», ETA |

En `core/live-feed.js` el campo `icono` pasa de emoji a clave (`'pedido'`, `'cocina'`…) y se actualiza `tests/live-feed.test.js` (hoy espera `'🎉'` para «Entregado»); `live-panel.js` llama a `icono(it.icono)`. Si ese archivo está siendo editado por la ola de correcciones F2, hacer el mapeo emoji→clave dentro de `live-panel.js` y dejar `live-feed.js` y su prueba para después. `✓ ✦ ★` tipográficos pueden quedarse.

## 6. Movimiento (5 interacciones, todas con `prefers-reduced-motion`)
1. **Revelado de foto con máscara**: fotos grandes (sucursales, roles, franja del menú, banda CTA) entran con `clip-path: inset(0 0 100% 0)` → `inset(0)` en 700 ms `--ease-out`, y la imagen interna `scale(1.08)` → `1` en 900 ms. Reutiliza `reveal.js` con la clase `.reveal--foto`. **Nunca** en la foto del héroe (es el LCP): esa solo hace `scale(1.03)`→`1` en 1200 ms. Reducido: visible sin animación.
2. **Zoom al pasar el cursor**: `.foto { overflow: hidden }` y `img { transition: transform 600ms var(--ease-out), filter 300ms }`; en `:hover`/`:focus-within` de la tarjeta, `scale(1.04)` y filtro neutro. Botón «+» rellena oro en 200 ms. `cursor: pointer` en toda la tarjeta. Reducido: sin escala, solo color.
3. ~~**Marquesina**: 36 s lineal infinita, pausa con hover, foco, toque y botón (ya existe). Reducido: estática y sin duplicado visible.~~ Quitada a pedido del cliente (11 nov 2026): no hay ningún elemento en movimiento continuo.
4. **Contador de cifras**: al entrar al 50 % en pantalla, de 0 al valor en 900 ms (easeOutCubic) con `font-variant-numeric: tabular-nums` para no mover el diseño; el valor real está en el DOM desde el inicio (el número animado es un `<span aria-hidden>`). Reducido: valor final directo.
5. **Entrada de actividad «En vivo»**: cada ítem nuevo entra con `translateY(-8px)`→`0` y opacidad 0→1 en 300 ms, más un filete izquierdo oro de 2 px que se desvanece en 1,2 s (es el momento «wow» de la venta). Reducido: aparece con el filete fijo 1,2 s.
Además: transiciones de color/fondo/borde de controles 150–250 ms; cabecera transparente→sólida en 300 ms.

## 7. Plan de implementación

### Paso 0 (controlador, secuencial, sin cambio visual, ~15 min)
Dividir `src/styles/client.css` por dueño: mover «Héroe», «Selector de sucursal» y «Portada: secciones» a `src/styles/portada.css` (B); mover «Tarjeta de plato» y «Menú del día y combos» a `src/styles/carta.css` (A); el resto queda en `client.css` (C). Importar en `src/main.js` después de `client.css`: `carta.css`, `portada.css`. Comprobar con capturas de `#/` y `#/menu` a 1440 que no cambió nada. Regla para todos: si necesita sobrescribir una regla compartida, hágalo en su propio archivo (va después en la cascada); no edite archivos de otro bloque.
**No tocar en ningún bloque** (ola de correcciones F1/F2 en curso): `src/bot/*`, `src/core/*` (salvo la nota de `live-feed.js`), `src/ui/presenter.js`, `api/*`, `tests/*` de bot. **Contrato del modo Presentación (no renombrar):** `.tel-texto`, `.tel-enviar`, `.tel-compositor`, `.tel-rapido`, `.vivo`, `.vivo-item`, `main.vista[data-ruta]`, `[data-avanzar]`, `[data-agotado]`, `[data-fecha]`, `[data-franja]`, `[data-mesa]`. **Contrato del E2E `tests/e2e/recorrido.spec.js` (conservar clases aunque cambie el diseño):** `.app-header__inner`, `.banner-demo`, `.site-footer .container--wide`, ~~`.c-hero__marquee .marquee__track` y su `[data-marquee-toggle]`~~ (marquesina quitada a pedido del cliente; el E2E ya no la prueba), `.pago-op`, `.seg__op`, `.ck-sim`, `.pd-datos`, `.pd-pasos`, `.mn-agotado`, `.adm-reiniciar`, `.pres-barra`, `[data-add]`, `[data-cta]`, `[data-paso]`, `[data-reserva]`, `[data-humano]`, `[data-min]`, `role="tab"` en las categorías, y **un solo** botón visible cuyo nombre accesible contenga «modo Presentación» (en el menú «Demo» use «Presentación guiada» u otro nombre para no duplicarlo).

### Bloque A — Fotos, tarjeta de plato y tokens (empieza primero)
Archivos: **nuevo** `src/ui/photo.js` (importa **nuevo** `src/styles/photo.css` desde el propio JS, así no toca `main.js`), `src/ui/product-card.js`, `src/ui/combos.js`, `src/ui/dish-art.js` (solo si hace falta exportar algo; no borrar `heroArt`/`selloArt` hasta el cierre), `src/styles/carta.css`, `src/styles/tokens.css`, `docs/design/system.md`, `src/views/estilo.js`, `src/styles/estilo.css`.
- `photo.js`: `import manifest from '../assets/photos/manifest.json'` y `import.meta.glob('../assets/photos/**/*.webp', { eager: true, query: '?url', import: 'default' })`. API (B y C programan contra ella desde ya): `fotoProducto(p, { variante: 'grid'|'fila'|'mini'|'modal', eager = false })` → HTML; `fotoEscena(clave, { eager, clase, ratio, alt })` → HTML con `width/height` del manifiesto; `urlEscena(clave)`; `hayFoto(id)`. Siempre `<img alt width height loading decoding>`; `eager` añade `loading="eager" fetchpriority="high"`. Sin foto en el manifiesto → `dishArt(p)` en la misma caja 4:3. Error de carga → un único listener `error` en captura sobre `document` que sustituye `img[data-respaldo]` por el SVG (sin JS en línea).
- Primer commit corto: tokens nuevos + `photo.js` + `photo.css`; avisar al controlador para liberar a B y C.
- Luego: tarjeta (3.3) con variantes, diálogo de modificadores con foto, combos y menú del día (3.7), guía `#/estilo` con tarjeta, velo e iconos, reglas 1, 4 y 5 de `system.md` actualizadas.
**Aceptación A (medible):** (1) en `#/menu` hay 1 `<img>` por producto visible, cada una con `width="800" height="600"`, `loading="lazy"`, `decoding="async"` y `alt` no vacío; (2) 0 `svg.dish-art` en `#/menu` y `#/` con todas las fotos presentes; al quitar una clave del manifiesto aparece el SVG y no un icono roto; (3) en `.dish`: `box-shadow: none`, `border-width: 0`, `border-radius: 0`; la foto ocupa ≥ 58 % del alto de la tarjeta a 1440; (4) ningún elemento dentro de `.dish` usa Anton; (5) el `filter` computado de todas las fotos de plato es `--photo-filter`; (6) CLS < 0,02 en `#/menu` (Lighthouse o `PerformanceObserver`); (7) a 1440 el `img` de una tarjeta en hover tiene `transform` 1.04 y con `reducedMotion: 'reduce'` no cambia; (8) botón «+» ≥ 44×44 px con `aria-label`.

### Bloque B — Portada, cabecera, pie y sucursales (en paralelo con C, tras el primer commit de A)
Archivos: `src/views/inicio.js`, `src/ui/branch-picker.js` (las tres variantes; añade `fotos` y foto en `tarjetas`), ~~`src/ui/marquee.js`~~ (borrado), `src/ui/reveal.js` (`.reveal--foto` y contador `data-count`), `src/ui/footer.js`, `src/ui/banner.js`, `src/main.js` (solo el bloque de cabecera: menú «Demo» y hoja móvil; no tocar rutas ni `renderVista`), `src/styles/portada.css`, `src/styles/layout.css`, `src/styles/base.css` (sección de reveal; la de marquesina se borró), `src/styles/presentation.css` (solo la media query de `.pres-lanzar` < 900 px; avisar a F1).
**Aceptación B (medible):** (1) 1440×900 en `#/`: la foto del héroe mide 1440 px de ancho y ≥ 520 px de alto; foto ≥ 55 % del área del primer viewport; h1 en **una línea** con `font-size` ≥ 168 px y ancho renderizado ≥ 90 % del contenedor; CTA visibles sin scroll; (2) la imagen del héroe es el primer `<img>` del DOM, con `loading="eager"` y `fetchpriority="high"` (precarga opcional en `index.html` solo si `npm run build` reescribe la URL al archivo con hash); (3) cabecera con fondo transparente (alfa 0) sobre el héroe y sólida tras pasar el héroe; ≤ 6 controles visibles en la cabecera de desktop; (4) 390×844: cromo superior (banner + cabecera) ≤ 84 px y no pegajoso el banner; h1 en 2 líneas ≥ 80 px; la foto del héroe empieza antes de y = 520; (5) `padding-top` de cada sección de portada ≥ 120 px a 1440 y ≥ 72 px a 390 (salvo héroe); (6) ≤ 6 franjas de color en `#/` y ninguna con `--c-ember` ni `--c-linen` de fondo; (7) ≤ 6 cajas con borde ≥ 150×80 en `main` de `#/` (antes 18); (8) suma de áreas de `<img>` ≥ 30 % del área total de la página `#/` a 1440 (Amrit ≈36 %); (9) el logotipo del pie ocupa ≥ 95 % del ancho del contenedor a 1440 y 390; (10) el selector de sucursal funciona con flechas y muestra «✓ Su sucursal» en texto; (11) 0 `svg.hero-art` y 0 `svg.sello-art` en `#/`; (12) la píldora de presentación no se superpone a ninguna barra fija a 390 (comparar `getBoundingClientRect`).

### Bloque C — Menú, compra, chat, panel e iconos (en paralelo con B)
Archivos: **nuevo** `src/ui/icons.js` (+ **nuevo** `src/styles/icons.css` importado desde el JS), `src/views/menu.js`, `src/ui/cart-panel.js`, `src/views/carrito.js`, `src/views/pedido.js`, `src/styles/client.css`, `src/views/chat.js`, `src/ui/live-panel.js`, `src/styles/phone.css` (solo `.chat-*`, `.vivo-*`, `.ia-*`), `src/core/live-feed.js` (solo valores de `icono`, ver sección 5), `src/views/admin-shell.js`, `src/views/admin-cocina.js`, `src/views/admin-indicadores.js`, `src/views/admin-reservas.js`, `src/views/admin-menu.js`, `src/ui/kpi.js`, `src/ui/floorplan.js`, `src/styles/admin.css`, `src/styles/kitchen.css`, `src/styles/gestion.css`, `src/styles/indicadores.css`.
**Aceptación C (medible):** (1) en el `innerText` de todas las rutas (`#/`, `#/menu`, `#/carrito`, `#/pedido/:id`, `#/chat`, `#/admin/*`) la expresión `/\p{Extended_Pictographic}/u` da 0 coincidencias, y `grep` de emoji en `src/` también (única excepción tolerada: `core/live-feed.js` si el mapeo se hizo en `live-panel.js`); (2) todo icono es `<svg viewBox="0 0 24 24">` con `stroke-width="1.5"` y va con texto visible o `aria-label`; (3) `#/menu` 1440: cabecera clara (sin banda carbón), franja de foto a sangre 1440×360, tarjetas de 3 columnas ≥ 300 px de ancho, carrito lateral sin borde de caja; (4) `#/carrito` 1440: h1 ≤ 96 px y ningún título de paso en Anton; (5) `#/pedido/:id` muestra foto de entrega o de sucursal y 5 iconos de paso; (6) `#/chat` 1440: panel «En vivo» sobre superficie clara con radio 16 px, título ≤ 24 px, sin caja punteada; tras el pedido de demostración el ítem nuevo aparece con icono SVG en ≤ 1 s; sin hueco vacío > 160 px bajo el panel; (7) cocina 1440: texto de segmentos inactivos con contraste ≥ 4,5:1; cocina 390: el `select` tiene `background-repeat: no-repeat` (sin patrón); (8) indicadores: miniaturas de sucursal en la comparativa y de plato en «más vendidos», cada `<img>` con `width/height`; (9) reservas: ≤ 2 cajas con borde por franja horaria (tira con filetes); (10) ningún selector del contrato renombrado (E2E existentes en verde).

### Orden y cierre
Paso 0 → A (primer commit) → B y C en paralelo, A sigue con tarjeta/combos → el controlador corre el protocolo de la sección 8 con un revisor independiente → una ronda de correcciones → limpieza (borrar `heroArt`/`selloArt` si nadie los usa, alias viejos) → `npm run build`, `npm test`, Lighthouse móvil (`#/` y `#/menu` rendimiento ≥ 90, LCP < 2,5 s).

## 8. Protocolo de crítica para la ronda 2
El revisor **mira** capturas nuevas de nuestras rutas a 390, 768, 1024 y 1440, puestas lado a lado con las capturas de referencia en la misma posición de scroll, y responde sí/no con evidencia (captura o medición). Un «no» bloquea.
1. A 1440, en el primer viewport de `#/`, ¿la foto real ocupa ≥ 55 % del área y el titular es una sola línea ≥ 168 px que llega casi de borde a borde, como el héroe de Tiger/Amrit?
2. A 390, ¿el cromo superior mide ≤ 84 px, se ve foto antes de y = 520 y los CTA caben en el primer viewport?
3. ¿Cada plato en `#/`, `#/menu`, carrito, pedido y admin aparece con foto real, con el mismo tratamiento cálido (ninguna foto blanca o fría «salta» en una fila al compararla con la fila de recetas de Tiger)?
4. ¿Hay 0 `box-shadow` (salvo cabecera con scroll) y ≤ 6 cajas con borde en `#/`, y el contenido se apoya en filetes como en Amrit?
5. ¿En cada viewport hay como máximo 3 usos de Anton y ningún nombre de plato, título de tarjeta o título de paso en Anton?
6. ¿La separación entre secciones es ≥ 120 px a 1440 y ≥ 72 px a 390, y cada sección comunica una sola idea?
7. ¿Hay 0 emoji en todas las rutas y todos los iconos son SVG de línea 1,5 px con etiqueta?
8. ¿La cabecera es transparente sobre el héroe y sólida al bajar, y el pie cierra con el logotipo de borde a borde (≥ 95 %) como Amrit/Tiger?
9. Al poner lado a lado `#/menu` y Amrit `/menu`, y `#/chat` con el bloque de producto de Sunday, ¿un observador neutral diría «misma liga» (foto a sangre, lista limpia con precio a la derecha, panel que parece software real) y no «plantilla»?
10. ¿Funcionan a 375/768/1024/1440 sin scroll horizontal: `cursor: pointer` y transición de 150–300 ms en todo lo clicable, foco visible con teclado, `prefers-reduced-motion` (sin máscaras, zoom ni contadores), imágenes con `width/height` (CLS < 0,1) y la píldora de presentación sin tapar barras fijas?
