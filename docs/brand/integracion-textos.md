# Integración de textos · Plato & Co.

Para quien aplique `src/config/copy.js` en la interfaz cuando las páginas se estabilicen. Números de línea tomados el 11 nov 2026 (cambian mientras B y C1 editan; busque por el texto actual).

**Cómo aplicar.** `import { t, tm, plural, usd, claveEstado } from '../config/copy.js'`. Use `tm()` si el texto lleva `{marca}`. En HTML con `esc()`, escape el resultado de `t()`.
**Marca de columnas.** OBL = obligatorio, no cambiar el texto (la clave solo mueve el literal); = igual = el texto ya es el correcto (solo centralizar); NUEVO = cambia la redacción.
**Después de integrar:** `npx vitest run` (la prueba `copy.test.js` acepta el literal o la lectura por clave) y revisar pruebas que busquen texto: `tests/e2e`, `portada-b.test.js`, `tour.test.js`, `chat-view.test.js`.

## Cabecera, banner y pie

| Archivo:línea | Texto actual | Clave | Texto nuevo |
|---|---|---|---|
| ui/banner.js:13 | Demo de Panacea Logic AI · Datos ficticios · No ingrese información real | sistema.bannerDemo | OBL (el enlace a Panacea Logic AI sigue envolviendo el nombre) |
| ui/cabecera.js:47 | Inicio · Menú · Asistente | nav.inicio, nav.carta, nav.asistente | Inicio · **Carta** · Asistente |
| ui/footer.js:27 | Menú | nav.carta | **Carta** |
| ui/footer.js:34 | …es un restaurante ficticio. Esta página es una demostración creada por Panacea Logic AI… | portada.pie.legal (tm) | = igual (el enlace va sobre {creador}) |

Sin cambio de texto, solo centralizar (línea → clave): ui/banner.js:14 → sistema.bannerCta; ui/banner.js:17 → sistema.bannerCtaCorto; ui/banner.js:9 → sistema.bannerAria; ui/cabecera.js:62-63,88-89 → nav.reservar, nav.pedir; ui/cabecera.js:66-70,92-95 → nav.demo, nav.admin, nav.reiniciar, nav.presentacion; ui/cabecera.js:73 → nav.abrirMenu; ui/cabecera.js:84 → nav.suPedido; ui/cabecera.js:64 → nav.carrito; ui/footer.js:21 → portada.pie.horario; ui/footer.js:22 → portada.pie.entregas; ui/footer.js:25 → portada.pie.contacto, telefonoNota; ui/footer.js:28 → portada.pie.reservarAsistente; ui/footer.js:36 → portada.pie.fotos.
## Portada (views/inicio.js)

| Línea | Texto actual | Clave | Texto nuevo |
|---|---|---|---|
| 111 | Le mostramos lo que hay hoy en esa cocina, si está abierta y cuánto tarda su pedido. | portada.sucursales.subtitulo | Cada cocina le muestra lo que tiene hoy, si está abierta y cuánto tarda. |
| 118 | (sin subtítulo) | portada.masPedidos.subtitulo | NUEVO: Los cuatro que la mesa repite. |
| 118 | Ver todo el menú | portada.masPedidos.verTodo | Ver toda la carta |
| 171 | Para resolver rápido / Combos en tres pasos | portada.combos.eyebrow, titulo | Combos **que ya vienen pensados** (el combo dulce tiene dos platos) |
| 171 | (sin subtítulo) | portada.combos.subtitulo | NUEVO: Platos que se llevan bien, listos en un solo toque. |
| 171 | Ver en el menú | portada.combos.verEnCarta | Ver en la carta |
| 13-17 (RESENAS) | tres reseñas | portada.resenas.lista | Reescritas más cortas («media hora», «no se negocia») |
| 192 | …o escríbanos y el asistente arma su pedido. | portada.cta.lead | …o escríbale al asistente y él arma su pedido. |

Sin cambio de texto, solo centralizar (línea → clave): 86 → portada.eyebrow; 88 → portada.heroTitulo; 95 → portada.heroLead; 99-100 → portada.ctaPedir, ctaReservar; 106 → portada.valoracion; 111 → portada.sucursales.eyebrow, titulo; 118 → portada.masPedidos.eyebrow, titulo; 134 → portada.comoFunciona.frase, fraseCola; 137 → portada.comoFunciona.parrafo; 25-27 (PASOS) → portada.comoFunciona.pasos[0..2]; 29-33 (ROLES) → portada.comoFunciona.roles[0..2]; 157-160 → portada.cifras.*; 163 → portada.cifras.nota; 178 → portada.resenas.*; 191 → portada.cta.titulo; 195-196 → portada.cta.enLinea, porChat.
## Carta (views/menu.js, ui/combos.js, ui/product-card.js, ui/cart-panel.js)

| Línea | Texto actual | Clave | Texto nuevo |
|---|---|---|---|
| menu.js:19 | Pan tostado, carne a la plancha y salsas de la casa. Elija el término. | menu.categorias.Hamburguesas | Pan tostado y salsas de la casa. En las de carne, elija el término. (pollo y vegetariana no llevan término) |
| menu.js:20 | Salsas preparadas cada mañana y porciones para quedar bien. | menu.categorias.Pastas | Pasta al dente, salsa caliente y porción para quedar contento. (sin promesas de proceso) |
| menu.js:21 | Parrilla, pescado y mariscos, con guarnición del día. | menu.categorias['Platos fuertes'] | Parrilla, pescado y mariscos para cuando el hambre va en serio. |
| menu.js:24 | Naturales, frías o calientes. Agrandar no tiene cargo en esta demo. | menu.categorias.Bebidas + menu.agrandarNota | Frías o calientes, para acompañar el plato o el rato. (la nota de «agrandar» sale a su propia clave) |
| menu.js:98 | Combos / Tres platos que van bien juntos… | menu.categorias.Combos | Platos que se llevan bien, listos en un solo toque. |
| combos.js:30 | En esta demo cada combo se agrega plato por plato, al precio de lista del menú. | portada.combos.nota | …de la carta. |
| product-card.js:7,12-16,28-30 | Vegetariano, Picante, Contiene: …, Sin alérgenos declarados, Consulte alérgenos | menu.vegetariano, picante, alergenos.* | = igual (solo datos declarados) |

Sin cambio de texto, solo centralizar (línea → clave): menu.js:18 → menu.categorias.Entradas; menu.js:22-23 → menu.categorias; menu.js:43 → menu.subtitulo; menu.js:90 → menu.vacioCategoria; menu.js:104-105 → menu.siguiente, listo, verPedidoPagar; menu.js:~148 → menu.carritoBarra + plural; combos.js:23 → portada.combos.pedir, porSeparado; combos.js:38 → sistema.toasts.agregado; combos.js:51-55 → portada.menuDia.*; product-card.js:55 → menu.agotado; product-card.js:95-112 → menu.termino, personalizar, cantidad, cancelar, agregarAlPedido; product-card.js:100 → menu.agrandarNota; cart-panel.js:42,45-49 → menu.carritoTitulo, subtotal, total, continuarPago; cart-panel.js:50 → menu.carritoVacioTitulo, carritoVacio.
## Pago y seguimiento (views/carrito.js, views/pedido.js)

| Línea | Texto actual | Clave | Texto nuevo |
|---|---|---|---|
| carrito.js:98-100 | Aún está vacío / Todavía no ha elegido nada… / Ver la carta | carrito.vacio.* | = igual (usar `{n}` con state.productos.length) |
| carrito.js:149 | **Pago simulado** · Datos ficticios · No ingrese información real | carrito.pagoSimulado | OBL (negrita sobre «Pago simulado» = carrito.pagoSimuladoCorto) |
| core/horario.js:52 | …está cerrada ahora (…). Puede enviar su pedido igualmente: quedará programado para cuando abra. | carrito.cerrada | = igual (texto sale de horario.js; solo otra clave si se quiere) |
| pedido.js:44-49 | Mensajes por estado (Buen provecho, Estamos preparando…) | pedido.estados.*, estadosRetiro.* | Lo recibimos… / Lo estamos preparando, al momento. / Ya está listo y sale en breve. / Va en camino hacia usted. |

Sin cambio de texto, solo centralizar (línea → clave): carrito.js:116 → carrito.eyebrow; carrito.js:122,130,139,145 → carrito.pasos.*; carrito.js:12-19 → carrito.metodos.*, tipos.*; carrito.js:133-134 → carrito.direccion.*; carrito.js:24-25,141 → carrito.chip.*; carrito.js:155 → carrito.confirmar; carrito.js:160,167 → carrito.resumen, seguir; carrito.js:72-87 → carrito.errores.*; carrito.js:207,219,220,228 → carrito.errores.sinDireccion, vacio, generico, pago; pedido.js:12,69 → pedido.marcas.*; pedido.js:55-62 → pedido.etaEtiqueta, entregadoA, retiradoA, retireEn, pedidoA; pedido.js:80,102-107 → pedido.titulo, detalles, prepara, …; pedido.js:107 → carrito.pagoSimuladoCorto; pedido.js:111-116 → pedido.factura.*; pedido.js:22-27 → pedido.noEncontrado.*.
## Asistente y panel en vivo (views/chat.js, ui/phone.js, ui/live-panel.js, core/live-feed.js)

| Línea | Texto actual | Clave | Texto nuevo |
|---|---|---|---|
| chat.js:60 | Chat simulado · No se conecta a WhatsApp real | chat.notaSimulado | OBL |
| chat.js:62 | Modo IA real (opcional) | chat.modoIA | OBL |
| chat.js:13 | Pasar a una persona | chat.pasarPersona | OBL |
| chat.js:35-36 | Recibimos su archivo… | chat.archivoRecibido | = igual (variante en inglés queda en el código) |
| phone.js:39 | Una persona del equipo revisa los casos importantes | chat.equipoRevisa | OBL |
| phone.js:39 | Pasar a una persona | chat.pasarPersona | OBL |
| core/chat-view.js:106 | botones del saludo | chat.respuestas.inicio | OBL (idénticos al bot; la prueba los compara) |

Sin cambio de texto, solo centralizar (línea → clave): chat.js:52-53 → chat.eyebrow, frase, fraseCola; chat.js:54 → chat.pista; chat.js:58,67 → chat.columnaCliente, columnaPanel; chat.js:63 → chat.modoIAAyuda; phone.js:44-45 → chat.etiquetaEntrada, marcador; live-panel.js:18-24 → chat.live.*; core/live-feed.js:21-50 → chat.live.pedidoCreado, pedidoPaso, avisoCliente, requierePersona.
## Panel del restaurante (views/admin-*.js)

| Línea | Texto actual | Clave | Texto nuevo |
|---|---|---|---|
| admin-shell.js:7-10,29,34,39-40 | Cocina / Reservas / Menú / Indicadores; Administración; Sucursal; Reiniciar demo; Volver… | admin.*, nav.reiniciar, volverCliente | Menú → **Carta** |
| main.js:35-36 | TITULOS por ruta | meta.paginas | Menú → Carta; Administrar menú → Carta |
| admin-menu.js:12 | Administrar menú | admin.menu.titulo | **Carta** |
| admin-reservas.js:9-11,25,33,38,98,113,121,129 | errores de mesa, títulos, vacíos, ayudas | admin.reservas.* | Se agrega punto final a los errores de mesa. |
| core/metrics.js:72-80 | Estimado equipo de gerencia… Si usted necesita el detalle, puede revisarlo en el panel. / Quedamos a la orden. | admin.resumenDiario.* | «El detalle completo está en el panel.» (revisar `metrics.test.js` antes) |
| core/tour.js:21-48 y ui/presenter.js | notas y rótulos de los 6 pasos, Hacer por mí, Pausar… | presentacion.pasos.*, botones | Notas más afiladas (mismo orden e ids); `tour.test.js` lee `STEPS`, no cambie ids ni `auto` nulos |

Sin cambio de texto, solo centralizar (línea → clave): admin-cocina.js:12-13,30,40,53,72,76,87 → admin.cocina.*; admin-menu.js:15,38-40,56,63,67 → admin.menu.*; admin-indicadores.js:34-62 → admin.indicadores.*.
## Sistema, ticket y metadatos

| Archivo:línea | Texto actual | Clave | Texto nuevo |
|---|---|---|---|
| (no existe) | Página no encontrada / sin conexión / cargando / error | sistema.noEncontrado, sinConexion, cargando, error | NUEVO: la vista de 404 la monta el agente de momentos de marca |
| (no existe) | Vacíos genéricos | sistema.vacios.* | NUEVO |
| (no existe, ticket.js) | Pedido, Cliente, Sucursal, Subtotal, ITBMS 7%, Total, Gracias por su pedido, Factura simulada · sin validez fiscal | ticket.* | NUEVO |
| index.html:10 | Plato &amp; Co. · Demo | meta.titulo | Plato & Co. · Mesa de barrio con ganas |
| index.html (sin descripción) | — | meta.descripcion, ogTitulo, ogDescripcion | NUEVO (≤155 caracteres) |
| bot/texts.js | (no se edita aquí) | — | Propuestas en `voz-y-tono.md` §13 |

Sin cambio de texto, solo centralizar (línea → clave): ui/reiniciar.js:5 → sistema.reiniciar.confirmacion; ui/presenter.js:512 → presentacion.reiniciado; ui/product-card.js:78,127; ui/combos.js:38 → sistema.toasts.agregado; main.js:91 → meta.paginas.*.