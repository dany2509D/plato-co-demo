# Plato & Co. · demo de pedidos, reservas y cocina

Demo comercial de **Panacea Logic AI** para restaurantes. Plato & Co. es un restaurante ficticio con tres sucursales en Ciudad de Panamá: todo lo que se ve (menú, pedidos, reservas, reseñas, teléfonos) es inventado.

> **Frase de venta:** «El pedido que hoy alguien copia del WhatsApp a la caja entra solo, va a la cocina correcta y sale facturado.»

```bash
npm install && npm run dev     # http://localhost:5173
```

Sitio estático (Vite + JavaScript sin framework), sin servidor ni base de datos: los datos viven en el navegador. La IA real es opcional.

## Contenido

1. [Qué muestra](#1-qué-muestra)
2. [Cómo correrlo](#2-cómo-correrlo)
3. [Rutas](#3-rutas)
4. [Diseño y movimiento](#4-diseño-y-movimiento)
5. [Guion de 2 minutos](#5-guion-de-2-minutos)
6. [Adaptarlo a otro restaurante](#6-adaptarlo-a-otro-restaurante)
7. [IA real (opcional)](#7-ia-real-opcional)
8. [Cómo desplegarlo](#8-cómo-desplegarlo)
9. [Estructura de carpetas](#9-estructura-de-carpetas)
10. [Calidad](#10-calidad)
11. [Limitaciones y avisos](#11-limitaciones-y-avisos)
12. [Créditos y enlaces](#12-créditos-y-enlaces)

## 1. Qué muestra

Un solo sitio con cuatro piezas que trabajan sobre los mismos datos:

- **Tienda web:** portada con video, carta de 40 platos con ingredientes y etiquetas, combos, menú del día, horario de cada sucursal en hora de Panamá, carrito, pago simulado (Yappy, tarjeta o efectivo) y seguimiento del pedido.
- **Asistente por chat:** un teléfono tipo WhatsApp que toma pedidos y reservas escritos como habla la gente, y un panel «En vivo» donde el restaurante ve entrar todo al instante.
- **Panel del restaurante** (botón «Entrar como administrador», sin contraseña): Cocina, Reservas con plano de mesas, Menú (agotar un plato en un clic) e Indicadores por sucursal.
- **Modo Presentación:** recorrido guiado de seis pasos, con botón «Hacer por mí», pensado para reuniones.

Reglas que la demo cumple siempre:

- No confirma pedidos con platos agotados o de otra sucursal.
- La cocina ve las mismas líneas y modificadores que el chat.
- Los alérgenos salen solo del menú: si no hay dato, el bot deriva a una persona y nunca afirma que un plato es «libre de» algo (por eso la carta no tiene etiqueta «Sin gluten»).

## 2. Cómo correrlo

Requisitos: Node 18 o superior (probado con Node 24) y npm.

| Comando | Qué hace |
|---------|----------|
| `npm install` | Instala Vite y Vitest (las únicas dependencias). |
| `npm run dev` | Servidor de desarrollo en <http://localhost:5173>. |
| `npm test` | Pruebas unitarias con Vitest. |
| `npm run build` | Genera `dist/` para publicar. |
| `npm run preview` | Sirve `dist/` en <http://localhost:4173> para comprobar el build. |

Los datos viven en el navegador (`localStorage`, una sola clave). Si el navegador lo bloquea, la demo sigue funcionando en memoria hasta cerrar la pestaña. **«Reiniciar demo»** (menú «Demo») restablece exactamente los datos de ejemplo.

## 3. Rutas

Las rutas usan `#/…` (hash), así que funcionan en cualquier hosting estático sin reglas de reescritura.

| Ruta | Pantalla |
|------|----------|
| `#/` | Portada: héroe con video, sucursales y horarios, lo más pedido, cómo funciona, cifras, menú del día, combos, reseñas |
| `#/menu` | Carta por categorías (`#/menu?c=combos`, `#/menu?c=menu-del-dia`…) y panel «Su pedido» |
| `#/carrito` | Entrega o retiro, dirección, forma de pago y confirmación |
| `#/pedido/:id` | Seguimiento del pedido y factura simulada |
| `#/chat` | Asistente tipo WhatsApp y panel «En vivo» |
| `#/admin/cocina` · `#/admin/reservas` · `#/admin/menu` · `#/admin/indicadores` | Panel del restaurante |
| `#/estilo` | Guía de estilo viva: colores, tipografía, componentes e identidad |

## 4. Diseño y movimiento

Dirección actual (19 nov 2026): **editorial de libro de cocina**, una doble página impresa llevada a la pantalla.

- **Color:** papel pergamino `#f6f0e1`, tarjetas en lino `#fffaec` y tinta berenjena `#290a08` para el texto y el único botón lleno. Los enlaces en texto corrido van resaltados en mantequilla `#fff3cc`. Todos los pares de texto cumplen contraste AA (tinta sobre pergamino: 16,2).
- **Tipografía:** titulares en **Fraunces**, una serif variable «blanda» (peso 600, tamaño óptico automático, tracking cerrado y una palabra en cursiva como acento), y texto en **Geist**, la sans de 21st.dev. Ambas desde Google Fonts.
- **Forma:** esquinas suaves (tarjetas 18 px, fotos 12 px, botones y campos 10 px, etiquetas 6 px), sin botones píldora ni sombras. Lo redondo de verdad queda para los platos de los combos.
- **Héroe:** video de cocina a pantalla completa que, al bajar, se encoge y redondea hasta quedar como una lámina sobre el pergamino. Debajo está la foto del héroe: es el póster, lo primero que pinta y el respaldo si el video falla. Tiene botón «Pausar video».
- **Movimiento:** entrada del titular letra por letra, frase de «Cómo funciona» que se entinta al bajar, palabras clave subrayadas con marcador, transición entre páginas, tarjetas en cascada, parallax suave ligado al scroll, rellenos de tinta en los botones de contorno y confirmación «Agregado ✓» con rebote del carrito. Una sola curva y cuatro duraciones; nada queda oculto esperando al scroll.
- **Carta:** las tarjetas de una fila comparten filas (CSS subgrid), así que títulos, descripciones y botones quedan alineados aunque un nombre ocupe dos líneas.
- **Reducir movimiento:** con esa opción del sistema, todo queda quieto y visible, y el video no se reproduce solo.

| Archivo | Qué contiene |
|---------|--------------|
| `src/styles/tokens.css` | Fuente única de colores, tipografía, espacios y radios |
| `src/styles/motion.css` | Sistema de movimiento y efectos adaptados de 21st.dev |
| `src/styles/forma.css` | Escala de radios y diseño de los combos |
| `src/styles/tipografia.css` | Pesos, ejes de Fraunces y efectos de texto |
| `src/ui/hero-video.js` | Encogido del héroe al bajar, pausa y respaldos |
| `src/ui/efectos.js` | Palabra que rota en el héroe y frase que se entinta al bajar |
| `docs/design/system.md` | Sistema de diseño (reglas y componentes) |

**Temas de diseño:** el menú «Demo» tiene un botón **«Diseño»** para cambiar entre la marca original y vistas previas para prospectos (hoy, «Coyote CV», con su paleta y su carta). Cambiar de tema reinicia los datos. Se definen en `src/config/temas.js`.

## 5. Guion de 2 minutos

### Antes de empezar

1. Abra el sitio y pulse **«Reiniciar demo»** en el menú «Demo» y confirme. Así no queda nada de la reunión anterior.
2. Use pantalla ancha para el panel y, si puede, un teléfono o una ventana estrecha para mostrar el chat.
3. Confirme que está en la sucursal **Centro** (es la que atiende Obarrio).

### Opción A: modo Presentación (recomendado)

En la cabecera abra **«Demo ▾» → «Presentación guiada»** (en celular: **«Menú»** → grupo «Demo»). Aparece una barra con una nota por paso y los botones **Anterior**, **Siguiente**, **Hacer por mí**, **Pausar** y **Salir** (al final, «Terminar»). También funcionan las flechas ← → del teclado y **Esc** para salir.

| Paso | Qué ve la audiencia | «Hacer por mí» |
|------|---------------------|----------------|
| 1. El cliente pide por WhatsApp | El chat arma el pedido, pide dirección y pago, muestra el resumen y el cliente confirma | Escribe el pedido, da la dirección, elige Yappy, confirma y envía el comprobante |
| 2. El restaurante lo ve al instante | Panel «En vivo» con el pedido y el aviso | (solo mirar) |
| 3. La cocina avanza el pedido | Tarjeta en Cocina con el pago confirmado; el cliente recibe avisos | Avanza el pedido hasta entregarlo |
| 4. Un plato se agota | Menú: «agotado» en un clic | Agota el plato |
| 5. Una reserva para 4 | Reserva por una frase y mesa en el plano | Hace la reserva y muestra la mesa |
| 6. Todo medido | Indicadores y mensaje de cierre | (solo mirar) |

En el último paso aparece el enlace **«Agende su diagnóstico gratis»**.

### Opción B: a mano, con el texto exacto

1. **Pedido por chat.** Vaya a `#/chat` y escriba:
   `Quiero 2 hamburguesas clásicas sin cebolla y una limonada para Obarrio`
   El bot responde con las líneas, **Total US$ 22.10** (subtotal 20.65 + ITBMS 1.45), «Lo prepara Plato & Co. Centro, tiempo estimado 30 min» y pide la dirección exacta en Obarrio. Todavía no pregunta si confirma.
2. Escriba la dirección y, si quiere, la forma de pago en el mismo mensaje: `Calle 50, edificio Global Bank piso 3. Pago con Yappy` (o la dirección sola y luego pulse **Yappy**). El bot muestra el **resumen completo** (platos, total, dirección y forma de pago) y recién ahí pregunta «¿Desea confirmar el pedido?». Pulse **Sí, confirmar**.
3. **Yappy.** Respuesta: «Pedido ped-NNN registrado… Esperando su comprobante de Yappy». Pulse **Enviar comprobante** (o adjunte una imagen): «Comprobante recibido…» y, unos segundos después, «Pago confirmado» con la **factura electrónica simulada** (número, CUFE ficticio, total con ITBMS). En el panel «En vivo» se ve cada estado. Es el punto de venta: nadie revisa capturas de Yappy a mano.
4. **Cocina.** Pulse «Entrar como administrador»: la tarjeta muestra la dirección completa y «Pago: Yappy · Pago confirmado». Pulse «Avanzar» (Recibido → En cocina → Listo → En camino → Entregado). Vuelva a `#/chat`: cada cambio llegó como aviso. Con efectivo, la factura sale al entregar.
5. **Agotado.** En el panel, Menú, busque «Hamburguesa clásica» y márquela agotada. En el chat escriba:
   `Quiero una hamburguesa clásica para Obarrio`
   El bot responde que está agotada en esta sucursal y ofrece alternativas de la misma categoría.
6. **Reserva.** Escriba `cancelar` y luego:
   `Quiero reservar para 4 mañana a las 8 pm, cumpleaños`
   Respuesta: «Reserva confirmada: … 4 persona(s), mesa …». En Reservas (panel) la mesa aparece en el plano.
7. **Una persona.** En el chat pulse **«Pasar a una persona»**: el bot confirma y en «En vivo» queda «Conversación marcada: Requiere persona».
8. **Cierre.** Muestre Indicadores y diga: «Cero pedidos copiados a mano, en todas sus sucursales». Invite al diagnóstico gratis de 15 minutos.

### Consejos de presentador

- Pulse **Reiniciar demo** antes de cada reunión y al terminar.
- El chat detecta el idioma por palabras clave y también responde en inglés.
- Los botones rápidos bajo cada respuesta del bot sirven si no quiere escribir.
- Si una sucursal está cerrada a esa hora, el pago avisa que el pedido quedará programado; no bloquea la demo.
- **Qué NO prometer:** no hay integración real con el POS, con WhatsApp, con Yappy ni con la DGI. Todo es simulado y es la propuesta de trabajo, no el producto terminado. La IA real es opcional y no está activa por defecto.

## 6. Adaptarlo a otro restaurante

Todo lo propio de Plato & Co. está en pocos archivos:

| Qué | Dónde |
|-----|-------|
| Nombre, logo (SVG), colores del logotipo, moneda, ITBMS, teléfono | `src/config/brand.js` |
| Sucursales: dirección, horario, zonas de entrega, tiempo base, mesas | `src/config/brand.js` (`sucursales`) |
| Menú (productos, categorías, precios, modificadores, alérgenos), combos, menú del día, pedidos y reservas de ejemplo | `src/data/seed.js` |
| Ingredientes de cada plato y etiquetas «Más vendido» y «Nuevo» | `src/data/descripciones.js` |
| Colores, tipografía, espacios y radios de la interfaz | `src/styles/tokens.css` (guía viva en `#/estilo`) |
| Titulares de la portada | `src/views/inicio.js` |
| Video del héroe | `public/media/hero-cocina.mp4` (al cambiarlo, subir `?v=` en `HERO_VIDEO` de `inicio.js`) |
| Textos del bot (es/en) | `src/bot/texts.js` |
| Vista previa para un prospecto sin tocar la marca base | Un tema nuevo en `src/config/temas.js` |

**La vía rápida para una reunión** es un tema: copie el objeto `coyote` de `src/config/temas.js` y cambie marca, colores, tokens, sucursales, menú, combos y frases de ejemplo. Aparece en el botón «Diseño» sin tocar nada más.

**Lista de verificación para una adaptación completa:**

1. Cambie nombre, logo, teléfono y colores en `brand.js` y los tokens en `tokens.css`.
2. Cargue las sucursales (reales o ficticias) con horarios, zonas y mesas.
3. Reemplace el menú en `seed.js`: categorías, precios en US$, modificadores, alérgenos declarados y disponibilidad por sucursal. Un plato sin dato de alérgenos nunca se afirma libre de ellos.
4. Ajuste ingredientes y destacados en `descripciones.js`, los titulares en `inicio.js` y las frases del guion (`src/core/tour.js`) a platos y barrios del nuevo menú.
5. Corra `npm test` (las pruebas de la semilla validan el menú) y `npm run build`, y recorra el guion completo.
6. Conserve el aviso de demo (banner superior) y los datos ficticios mientras no haya acuerdo comercial.

## 7. IA real (opcional)

El botón «IA real» del chat llama a `/api/chat`, una función serverless (`api/chat.js`, estilo Vercel).

- **Clave:** se configura **solo** como variable de entorno del servidor `ANTHROPIC_API_KEY`, nunca en el navegador, el repositorio ni el chat. `ANTHROPIC_MODEL` (opcional) cambia el modelo; por defecto es `claude-haiku-5-5`. Vea `.env.example`.
- **El navegador no es de confianza:** menú, precios, horarios, zonas y alérgenos se arman en el servidor a partir de `seed.js`. La IA solo **propone** acciones; el navegador valida cada una y el cliente confirma en el chat antes de crear pedidos o reservas.
- **Límite de peticiones:** 20 por minuto por IP (responde 429). Es en memoria y de mejor esfuerzo: en serverless cada instancia lleva su propio contador. Para producción, súmele los límites de la plataforma.
- **Sin clave** la función responde 503 y el chat sigue en modo guion. Lo mismo pasa con `npm run dev` y `npm run preview`, que no sirven `/api/chat`.
- **Vercel:** funciona tal cual si el archivo queda en `/api/chat.js` y la variable está en el panel del proyecto.
- **Netlify:** mueva el archivo a `netlify/functions/chat.js` y envuelva `createHandler` con un adaptador pequeño que convierta `event` a `req` (`method`, `body`) y `res` a `{statusCode, body}`. La lógica no cambia.

## 8. Cómo desplegarlo

1. `npm run build` y suba el contenido de `dist/` a cualquier hosting estático (Netlify, Vercel, Cloudflare Pages, Nginx…). Destino previsto: `restaurante.panacealogic.dev`, siempre con **HTTPS**.
2. No hace falta ninguna regla de reescritura: las rutas son `#/…`.
3. Las únicas peticiones externas son las tipografías de Google Fonts (Fraunces y Geist). Si se bloquean, el sitio se ve con tipografías de respaldo (Georgia y la sans del sistema).
4. El video del héroe pesa 4 MB y se sirve desde `dist/media/`. Conviene que el hosting lo entregue con caché larga.
5. **Opcional:** para la IA real, despliegue también `api/chat.js` como función serverless (sección 7). Sin ella la demo funciona completa en modo guion.

## 9. Estructura de carpetas

```
index.html             entrada (tipografías, favicon, Open Graph)
api/chat.js            función serverless opcional (IA real)
public/media/          video del héroe
src/main.js            cabecera, pie, banner, estilos y enrutamiento
src/config/            marca y sucursales (brand.js), temas de diseño (temas.js), textos (copy.js)
src/data/              menú y datos de ejemplo (seed.js), ingredientes y etiquetas (descripciones.js)
src/core/              lógica pura sin DOM: pedidos, cocina, reservas, horario, métricas, tour
src/bot/               parser, motor de conversación, textos es/en, adaptador de IA
src/views/             una vista por ruta (cliente, chat y panel)
src/ui/                componentes: tarjeta de plato, combos, héroe con video, efectos, teléfono, plano de mesas…
src/styles/            tokens, una hoja por área, movimiento (motion.css) y forma (forma.css)
src/assets/            fotos (WebP) y piezas de marca (SVG)
tests/                 pruebas unitarias (Vitest)
tests/e2e/             recorrido E2E (Playwright) y su guía
docs/                  especificación, sistema de diseño, marca y atribuciones
```

## 10. Calidad

- **Pruebas unitarias:** `npm test` corre 44 archivos y 881 pruebas: parser, bot, pedidos, cocina, reservas, horario, métricas, almacenamiento, rutas, semilla, marca y contraste de la paleta.
- **Recorrido E2E con Playwright** (`tests/e2e/recorrido.spec.js`, guía en `tests/e2e/recorrido.md`): portada, menú, pago, chat, cocina, agotado, reserva, «Pasar a una persona», indicadores, reinicio y modo Presentación, a 360, 768 y 1440 px y con `localStorage` bloqueado. Playwright no es dependencia del proyecto: instálelo en una carpeta aparte (pasos en `recorrido.md`).
- **Peso del build** (un archivo de cada tipo): JS 375 KB (128,6 KB comprimido con gzip) y CSS 168 KB (33,2 KB gzip). Aparte, el video del héroe (4 MB) y las fotos en WebP.
- **Responsive:** comprobado sin desplazamiento horizontal a 375, 430, 768, 1280 y 1440 px.
- **Accesibilidad:** navegación por teclado, foco visible, enlace «saltar al contenido», regiones con nombre, avisos con `aria-live`, contraste AA, botón para pausar el video y respeto a «reducir movimiento».
- **Lighthouse móvil:** la última medición (accesibilidad 100, rendimiento 96–98 y buenas prácticas 100 en `#/`, `#/menu` y `#/chat`) es **anterior al rediseño del 19 nov 2026**. Hay que repetirla: el video y las nuevas tipografías pueden mover el rendimiento.
- **Navegadores:** probado en Chromium. El parallax usa animaciones CSS ligadas al scroll; en los navegadores que no las soportan, las fotos simplemente quedan quietas. No se ha probado en Safari, con lector de pantalla ni en dispositivos reales.

## 11. Limitaciones y avisos

- Datos **ficticios**, con un aviso fijo en todas las pantallas («No ingrese información real»).
- Pagos (Yappy, tarjeta, efectivo), factura electrónica (CUFE ficticio) y WhatsApp son **simulaciones**: no se envía ni se cobra nada. Los botones de WhatsApp abren el chat simulado, no `wa.me`, porque el número `+507 6000-0000` es ficticio.
- Privacidad: todo se guarda solo en el navegador de quien usa la demo; no hay servidor, cuentas ni analítica. Con «IA real» activa, los mensajes del chat viajan a la API de Anthropic a través de su función.
- El administrador no tiene contraseña: es una demostración.
- La hora de las sucursales se calcula en hora de Panamá (UTC-5).
- Precios: la carta, el carrito y los combos muestran `$11.50`; el ticket, el bot y el panel usan el formato fiscal `US$ 11.50`.

## 12. Créditos y enlaces

- **Fotos:** Unsplash. **Video del héroe:** Mixkit, «Chef cooking on a large grill». **Efectos de interfaz:** adaptados de componentes de [21st.dev](https://github.com/serafimcloud/21st) (MIT), reescritos sin React. Detalle y licencias en `docs/design/ATTRIBUTIONS.md`.
- Panacea Logic AI: <https://panacealogic.dev>
- Diagnóstico gratis de 15 minutos: <https://panacealogic.dev/cuentanos-tu-proyecto>
