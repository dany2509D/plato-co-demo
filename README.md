# Plato & Co. · demo de pedidos, reservas y cocina

Demo comercial de **Panacea Logic AI** para restaurantes. Plato & Co. es un restaurante ficticio con tres sucursales en Ciudad de Panamá; todo lo que se ve (menú, pedidos, reservas, reseñas, teléfonos) es inventado.

> **Frase de venta:** «El pedido que hoy alguien copia del WhatsApp a la caja entra solo, va a la cocina correcta y sale facturado.»

## 1. Qué es y qué muestra

Un solo sitio con cuatro piezas que trabajan sobre los mismos datos:

- **Tienda web** (`#/`, `#/menu`, `#/carrito`, `#/pedido/:id`): menú con 40 platos, combos, menú del día, horario de cada sucursal en hora de Panamá, pago simulado (Yappy, tarjeta o efectivo) y seguimiento del pedido.
- **Asistente por chat** (`#/chat`): un teléfono tipo WhatsApp que toma pedidos y reservas escritos como habla la gente, y un panel «En vivo» donde el restaurante ve entrar todo al instante.
- **Panel del restaurante** (botón «Entrar como administrador», sin contraseña): Cocina, Reservas con plano de mesas, Menú (agotar un plato en un clic) e Indicadores por sucursal.
- **Modo Presentación**: recorrido guiado de seis pasos, con botón «Hacer por mí», pensado para reuniones.

Reglas que la demo cumple siempre: no confirma pedidos con platos agotados o de otra sucursal; la cocina ve las mismas líneas y modificadores que el chat; los alérgenos salen solo del menú (si no hay dato, el bot deriva a una persona y no afirma nada).

## 2. Cómo correrlo

Requisitos: Node 18 o superior (probado con Node 24) y npm.

```bash
npm install        # instala Vite y Vitest
npm run dev        # servidor de desarrollo en http://localhost:5173
npm run build      # genera dist/ para publicar
npm run preview    # sirve dist/ en http://localhost:4173 (compruebe el build)
npm test           # pruebas unitarias (Vitest)
```

Los datos viven en el navegador (`localStorage`, una sola clave). Si el navegador lo bloquea, la demo sigue funcionando en memoria hasta cerrar la pestaña. **«Reiniciar demo»** restablece exactamente los datos de ejemplo.

## 3. Cómo desplegarlo

La demo es un sitio **estático**: no necesita servidor.

1. `npm run build` y suba el contenido de `dist/` a cualquier hosting estático (Netlify, Vercel, Cloudflare Pages, Nginx…). Destino previsto: `restaurante.panacealogic.dev`, siempre con **HTTPS**.
2. Las rutas usan `#/…` (hash), así que **no hace falta ninguna regla de reescritura** ni configuración de SPA.
3. Las únicas peticiones externas son las tipografías de Google Fonts. Si el hosting las bloquea, el sitio se ve con tipografías de respaldo.
4. **Opcional, IA real:** para activar el botón «IA real» hay que desplegar también `api/chat.js` como función serverless (ver sección 6). **Sin esa función la demo funciona completa en modo guion**: el botón simplemente cae al guion.

## 4. Guion de 2 minutos

### Antes de empezar

1. Abra el sitio y pulse **«Reiniciar demo»** (arriba; confirme el diálogo). Así no queda nada de la reunión anterior.
2. Use pantalla ancha para el panel y, si puede, un teléfono o ventana estrecha para mostrar el chat.
3. Confirme que está en la sucursal **Centro** (es la que atiende Obarrio).

### Opción A: modo Presentación (recomendado)

En la cabecera abra **«Demo ▾» → «Presentación guiada»** (en celular: **«Menú»** → grupo «Demo»). No hay botón flotante. Aparece una barra con una nota por paso y estos botones: **Anterior**, **Siguiente**, **Hacer por mí**, **Pausar** y **Salir** (al final, «Terminar»). También funcionan las flechas ← → del teclado y **Esc** para salir.

| Paso | Qué ve la audiencia | «Hacer por mí» |
|------|---------------------|----------------|
| 1. El cliente pide por WhatsApp | El chat arma el pedido y lo confirma | Escribe el pedido, confirma, da la dirección y paga con Yappy |
| 2. El restaurante lo ve al instante | Panel «En vivo» con el pedido y el aviso | (solo mirar) |
| 3. La cocina avanza el pedido | Tarjeta en Cocina; el cliente recibe avisos | Avanza el pedido hasta entregarlo y se emite la factura |
| 4. Un plato se agota | Menú: «agotado» en un clic | Agota el plato |
| 5. Una reserva para 4 | Reserva por una frase y mesa en el plano | Hace la reserva y muestra la mesa |
| 6. Todo medido | Indicadores y mensaje de cierre | (solo mirar) |

En el último paso aparece el enlace **«Agende su diagnóstico gratis»**.

### Opción B: a mano, con el texto exacto

1. **Pedido por chat.** Vaya a `#/chat` y escriba:
   `Quiero 2 hamburguesas clásicas sin cebolla y una limonada para Obarrio`
   El bot responde con las líneas, **Total US$ 22.10** (subtotal 20.65 + ITBMS 1.45), «Lo prepara Plato & Co. Centro, tiempo estimado 30 min» y pregunta «¿Desea confirmar el pedido?». Pulse **Sí, confirmar**.
2. El bot pide la dirección exacta. Escriba `Calle 50, Obarrio`. Responde «Le atenderá Plato & Co. Centro…» y pregunta cómo pagar: pulse **Yappy**. Respuesta: «Pedido ped-NNN registrado… Pago con Yappy simulado: recibido». En el panel «En vivo» ya aparece el pedido.
3. **Cocina.** Pulse «Entrar como administrador», en Cocina pulse «Avanzar» sobre ese pedido (Recibido → En cocina → Listo → En camino → Entregado). Vuelva a `#/chat`: cada cambio llegó como aviso y, al entregar, la **factura electrónica simulada** con CUFE ficticio.
4. **Agotado.** En el panel, Menú, busque «Hamburguesa clásica» y márquela agotada. En el chat escriba:
   `Quiero una hamburguesa clásica para Obarrio`
   El bot responde «Hamburguesa clásica está agotado en esta sucursal. Le puedo ofrecer: …» (alternativas de la misma categoría).
5. **Reserva.** Escriba `cancelar` y luego:
   `Quiero reservar para 4 mañana a las 8 pm, cumpleaños`
   Respuesta: «Reserva confirmada: … 4 persona(s), mesa …». En Reservas (panel) la mesa aparece en el plano.
6. **Una persona.** En el chat pulse **«Pasar a una persona»**: el bot confirma y en «En vivo» queda «Conversación marcada: Requiere persona».
7. **Cierre.** Muestre Indicadores y diga: «Cero pedidos copiados a mano, en todas sus sucursales». Invite al diagnóstico gratis de 30 minutos.

### Consejos de presentador

- Pulse **Reiniciar demo** antes de cada reunión y al terminar.
- El chat detecta el idioma por palabras clave y también responde en inglés.
- Los botones rápidos bajo cada respuesta del bot sirven si no quiere escribir.
- Si una sucursal está cerrada a esa hora, el pago avisa que el pedido quedará programado; no bloquea la demo.
- **Qué NO prometer:** no hay integración real con el POS, con WhatsApp, con Yappy ni con la DGI; todo es simulado y es la propuesta de trabajo, no el producto terminado. La IA real es opcional y no está activa por defecto.

## 5. Cómo cambiar la marca para otro restaurante

Todo lo propio de Plato & Co. está en pocos archivos:

| Qué | Dónde |
|-----|-------|
| Nombre, logo (SVG), colores de marca, moneda, ITBMS, teléfono | `src/config/brand.js` |
| Sucursales: dirección, horario, zonas de entrega, tiempo base, mesas y capacidades | `src/config/brand.js` (`sucursales`) |
| Menú (productos, categorías, precios, modificadores, alérgenos, combos, menú del día), pedidos y reservas de ejemplo | `src/data/seed.js` |
| Colores, tipografías, espacios y sombras | `src/styles/tokens.css` (guía viva en `#/estilo`) |
| Textos del bot (es/en) | `src/bot/texts.js` |
| Textos y fotos de la portada | `src/views/inicio.js`, `src/ui/dish-art.js` |

**Lista de verificación para una adaptación (estilo Ossa, Slabón, Mentiritas Blancas):**

1. Cambie nombre, logo, teléfono y colores en `brand.js` y los tokens en `tokens.css`.
2. Cargue las sucursales reales (o ficticias) con horarios, zonas y mesas.
3. Reemplace el menú en `seed.js`: categorías, precios en US$, modificadores, alérgenos declarados (un plato sin dato no se afirma libre de un alérgeno) y disponibilidad por sucursal.
4. Ajuste los titulares de la portada y los platos destacados en `inicio.js`, y los ejemplos del guion (frases de `src/core/tour.js`) a platos y barrios del nuevo menú.
5. Revise `npm test` (las pruebas de la semilla validan el menú), `npm run build` y recorra el guion completo.
6. Conserve el aviso de demo (banner superior) y los datos ficticios mientras no haya acuerdo comercial.

## 6. IA real (opcional)

El botón «IA real» llama a `/api/chat`, una función serverless (`api/chat.js`, estilo Vercel). La clave se configura **solo** como variable de entorno del servidor `ANTHROPIC_API_KEY` (nunca en el navegador, el repositorio ni el chat). `ANTHROPIC_MODEL` (opcional) cambia el modelo (por defecto `claude-haiku-5-5`). Vea `.env.example`.

- La IA solo **propone** acciones; el navegador valida cada una y el cliente confirma en el chat antes de crear pedidos o reservas.
- Sin clave, la función responde 503 y el chat sigue en modo guion. Lo mismo ocurre con `npm run dev` y `npm run preview`, que no sirven `/api/chat`: cae al guion.
- El endpoint **no tiene límite de peticiones**: despliéguelo detrás de los límites de la plataforma o agregue uno.
- **Vercel:** funciona tal cual si el archivo queda en `/api/chat.js` y la variable está en el panel del proyecto.
- **Netlify:** mueva el archivo a `netlify/functions/chat.js` y envuelva `createHandler` con un adaptador pequeño que convierta `event` a `req` (`method`, `body`) y `res` a `{statusCode, body}`; la lógica no cambia.

## 7. Estructura de carpetas

```
index.html            entrada (tipografías, favicon)
api/chat.js           función serverless opcional (IA real)
src/main.js           encabezado, pie, banner y enrutamiento
src/config/brand.js   marca, sucursales, horarios, mesas
src/data/seed.js      menú, pedidos y reservas de ejemplo
src/core/             lógica pura sin DOM: pedidos, cocina, reservas, horario, métricas, tour
src/bot/              parser, motor de conversación, textos es/en, adaptador de IA
src/views/            una vista por ruta (cliente, chat y panel)
src/ui/               componentes: teléfono, plano de mesas, carrito, presentador, banner
src/styles/           tokens y hojas por área
tests/                pruebas unitarias (Vitest)
tests/e2e/            recorrido E2E (Playwright) y su guía
docs/                 especificación y sistema de diseño
```

## 8. Calidad

- **Pruebas unitarias:** `npm test` (24 archivos, 341 pruebas): parser, bot, pedidos, cocina, reservas, horario, métricas, almacenamiento, rutas y semilla.
- **Recorrido E2E con Playwright** (`tests/e2e/recorrido.spec.js`, guía en `tests/e2e/recorrido.md`): portada, menú, pago, chat, cocina, agotado, reserva, «Pasar a una persona», indicadores, reinicio y modo Presentación, a 360, 768 y 1440 px y con `localStorage` bloqueado; verifica que no haya errores en la consola. Playwright no es dependencia del proyecto: instálelo en una carpeta aparte (pasos en `recorrido.md`).
- **Peso:** JS 206 KB (70,8 KB comprimido con gzip; el límite es 300 KB), CSS 88 KB (18,1 KB gzip). Un solo archivo de cada uno.
- **Lighthouse móvil** (sobre `npm run preview`):

  | Ruta | Accesibilidad | Rendimiento | Buenas prácticas |
  |------|---------------|-------------|------------------|
  | `#/` | 100 | 97 | 100 |
  | `#/menu` | 100 | 96 | 100 |
  | `#/chat` | 100 | 98 | 100 |

- **Accesibilidad:** navegación por teclado, foco visible, enlace «saltar al contenido», regiones con nombre, avisos con `aria-live`, contraste AA y respeto a «reducir movimiento» (sin máscaras, zoom ni contadores animados).
- **Navegadores:** probado en Chromium. No se ha probado en Safari ni Firefox, ni con lector de pantalla ni en dispositivos reales.

## 9. Limitaciones y avisos

- Datos **ficticios**; hay un aviso fijo en todas las pantallas («No ingrese información real»).
- Pagos (Yappy, tarjeta, efectivo), factura electrónica (CUFE ficticio) y WhatsApp son **simulaciones**; no se envía ni se cobra nada.
- Privacidad: todo se guarda solo en el navegador de quien usa la demo; no hay servidor, cuentas ni analítica. Con «IA real» activa, los mensajes del chat y el contexto del menú viajan a la API de Anthropic a través de su función.
- El administrador no tiene contraseña: es una demostración.
- La hora de las sucursales se calcula en hora de Panamá (UTC-5).

## 10. Enlaces

- Panacea Logic AI: <https://panacealogic.dev>
- Diagnóstico gratis de 30 minutos: <https://panacealogic.dev/cuentanos-tu-proyecto>
