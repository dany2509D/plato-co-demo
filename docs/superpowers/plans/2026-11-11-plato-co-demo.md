# Plato & Co. Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la demo "Pedidos y reservas por WhatsApp"  para restaurantes con varias sucursales, bajo la marca ficticia Plato & Co.

**Architecture:** Sitio estático Vite + JavaScript puro. Un store único (estado en `localStorage` con respaldo en memoria, con eventos) lo comparten la web, el bot y el panel, así que un cambio en uno se ve en los demás. La lógica de negocio vive en `src/core` y `src/bot` (probada con Vitest); las vistas solo dibujan y llaman a esa lógica.

**Tech Stack:** Vite, JavaScript ES modules, Vitest, Playwright (verificación). Sin framework ni librerías de gráficos (SVG propio).

**Spec:** `docs/specs/2026-11-11-plato-co-demo-design.md` (junto con `08-restaurante-pedidos-reservas.md` y `00-base-comun.md`, que mandan si hay conflicto).

## Global Constraints

- Sitio estático, navegación por hash (`#/ruta`), sin backend obligatorio; JavaScript ≤ 300 KB comprimido.
- Todo acceso a `localStorage` dentro de `try/catch` con respaldo en memoria (BASE-RNF-02).
- Banner fijo en todas las rutas, también en `#/admin`: "Demo · Datos ficticios · No ingrese información real", con un enlace a "Agende un diagnóstico gratis de 30 minutos" en pestaña nueva.
- Botón visible "Reiniciar demo" con confirmación; deja exactamente el estado semilla.
- Marca ficticia **Plato & Co.**, sin nombres, logos ni datos reales; teléfonos `+507 6000-0000`.
- Español de Panamá, trato de "usted". Moneda **US$** en toda la demo. ITBMS 7%. Zona horaria `America/Panama`.
- Pagos solo simulados: Yappy, tarjeta, efectivo. WhatsApp siempre simulado en la página.
- Texto "Una persona del equipo revisa los casos importantes" y botón "Pasar a una persona" en todo chat; deja la conversación marcada (`requiereHumano`) en el panel.
- Estados del pedido en este orden: Recibido → En cocina → Listo → En camino → Entregado. Retiro salta "En camino".
- Semilla: 40 productos, 6 combos, 3 sucursales con zonas y mesas, 50 pedidos del día, 15 reservas.
- Grupos de más de 8 personas y eventos pasan a una persona (9 va a persona, 8 no).
- El bot nunca afirma que un plato está libre de un alérgeno si el menú no lo declara; un plato agotado no se puede pedir por ningún canal.
- Responsive 360–1440 px, contraste AA, formularios con etiquetas, uso completo con teclado, foco visible. Cocina legible a 2 m en tableta horizontal.
- La clave de la API de Claude solo en variable de entorno del servidor; nunca en archivos, en el navegador ni en el chat. IA real opcional: si `/api/chat` falla, se vuelve al modo guion.
- Al terminar no queda ningún servidor corriendo.

## Review Focus

Entradas que la spec no nombra pero que una persona va a probar en la reunión (cada una tiene su prueba en la tarea indicada):

1. Mensaje vacío, solo espacios o texto sin sentido en el chat → el bot pide aclarar con ejemplo, no se rompe (Task 7).
2. `localStorage` con JSON corrupto o bloqueado → arranca con la semilla, sin error en consola (Task 2).
3. Producto que se agota mientras ya está en el carrito o en un pedido a medio confirmar → el pago se rechaza y se ofrece alternativa (Task 4).
4. Dirección fuera de todas las zonas de entrega → ofrece retiro o persona, no asigna sucursal al azar (Task 4).
5. Reserva fuera de horario, en el pasado, para 0 o 9 personas, o para una mesa ya ocupada en la franja (Task 5).

## File Structure

Según la sección 2 de la spec: `src/config/brand.js`, `src/data/seed.js`, `src/core/{storage,store,menu,orders,reservations}.js`, `src/bot/{parser,engine,ai-adapter}.js`, `src/ui/*`, `src/views/*`, `src/presentation.js`, `src/styles/*`, `api/chat.js`, `tests/*`, `README.md`.

---

### Task 1: Esqueleto, marca, banner y router

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.js`, `src/config/brand.js`, `src/ui/banner.js`, `src/ui/router.js`, `src/styles/tokens.css`, `src/styles/base.css`, `tests/router.test.js`

**Interfaces:**
- Produces: `parseRoute(hash: string): {name: string, params: Record<string,string>}`; rutas válidas: `inicio`, `menu`, `carrito`, `chat`, `pedido` (`:id`), `admin-cocina`, `admin-reservas`, `admin-menu`, `admin-indicadores`; ruta desconocida → `inicio`. `brand` exporta `{nombre:'Plato & Co.', logoSvg, colores, sucursales[], moneda:'US$', itbms:0.07, telefono:'+507 6000-0000'}`. Las 3 sucursales traen `id, nombre, direccion, horario{abre,cierra}, zonasEntrega[], etaBaseMin, mesas[{id,capacidad}]`.

- [ ] **Step 1: Write failing tests** in `tests/router.test.js`: `parseRoute('#/menu')` → `{name:'menu'}`; `parseRoute('#/pedido/P-7')` → params `{id:'P-7'}`; `parseRoute('#/admin/cocina')` → `admin-cocina`; `parseRoute('')` y `parseRoute('#/nada')` → `inicio`.
- [ ] **Step 2: Run** `npx vitest run tests/router.test.js` — Expected: FAIL (módulo no existe).
- [ ] **Step 3:** Scaffold Vite (`npm create vite` vanilla, sin dependencias extra salvo `vitest`), implementar `parseRoute` en `src/ui/router.js`, `brand.js` con las 3 sucursales ficticias (zonas de entrega distintas y sin solaparse, mesas de 2, 4, 6 y 8), tokens CSS de la paleta (crema, terracota, amarillo; contraste AA) y banner fijo que no tapa contenido a 360 px. `main.js` monta banner + `<main>` y renderiza una vista vacía por ruta.
- [ ] **Step 4: Run** `npx vitest run` — Expected: PASS; `npm run build` termina sin errores.
- [ ] **Step 5: Commit** `feat: esqueleto, marca Plato & Co., banner y router`

### Task 2: Almacenamiento, store y semilla

**Files:**
- Create: `src/core/storage.js`, `src/core/store.js`, `src/data/seed.js`, `tests/storage.test.js`, `tests/store.test.js`, `tests/seed.test.js`
- Modify: `src/main.js` (botón "Reiniciar demo" con confirmación)

**Interfaces:**
- Produces: `createStorage(key: string): {read(): object|null, write(obj: object): void}` (nunca lanza). `buildSeed(now: Date): State` determinista. `createStore(storage): {get(): State, update(fn: (draft: State) => void): void, subscribe(fn): () => void, emit(type: string, payload?): void, on(type: string, fn): () => void, reset(): void}`; `update` guarda y notifica. `State = {sucursales, productos, combos, pedidos, reservas, conversaciones, ui:{sucursalAdmin}}`. Producto: `{id, nombre, categoria, precio, vegetariano, modificadores[], alergenos[], alergenosDeclarados:boolean, disponiblePorSucursal:{[sucursalId]: boolean}}`. Pedido: `{id, canal:'web'|'whatsapp', sucursalId, lineas[{productoId, modificadores[], cantidad}], tipo:'entrega'|'retiro', direccion?, estado, historial[{estado, en: ISOString}], pago?, facturaId?, creadoEn}`. Reserva: `{id, sucursalId, fecha, hora, personas, ocasion, mesaId?, estado}`. Conversación: `{id, idioma, mensajes[], requiereHumano}`.

- [ ] **Step 1: Write failing tests:** (a) con `localStorage` que lanza en `getItem`/`setItem`, `createStorage('k')` lee `null` y `write` + `read` siguen funcionando en memoria; (b) con JSON corrupto en la clave, `read()` devuelve `null` y no lanza; (c) `buildSeed` da 40 productos, 6 combos, 3 sucursales, 50 pedidos, 15 reservas, y dos llamadas con la misma fecha dan resultado idéntico; todo pedido semilla tiene `historial` coherente con `estado`; (d) `store.reset()` deja `get()` igual a `buildSeed`; `update` notifica a `subscribe`.
- [ ] **Step 2: Run** `npx vitest run tests/storage.test.js tests/store.test.js tests/seed.test.js` — Expected: FAIL.
- [ ] **Step 3: Implement** los tres módulos. El semillero usa un generador pseudoaleatorio con semilla fija y el menú neutro de la spec (entradas, hamburguesas, pastas, platos fuertes, ensaladas y bowls, postres, bebidas; algunos sin alérgenos declarados a propósito). Hora según `America/Panama`.
- [ ] **Step 4: Run** `npx vitest run` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: store con respaldo en memoria y datos semilla`

### Task 3: Reglas de menú y disponibilidad

**Files:**
- Create: `src/core/menu.js`, `tests/menu.test.js`

**Interfaces:**
- Consumes: `store`, `State` (Task 2).
- Produces: `isAvailable(state, productoId, sucursalId): boolean`; `setAvailable(store, productoId, sucursalId, valor: boolean): void` (emite `menu:cambio`); `setPrice(store, productoId, precio: number): void` (rechaza precios ≤ 0); `findProducts(state, texto: string, sucursalId): Producto[]` (sinónimos, sin tildes ni mayúsculas); `alternativesFor(state, productoId, sucursalId): Producto[]` (misma categoría, disponibles, hasta 3); `visibleMenu(state, sucursalId): {categoria, productos[]}[]`.

- [ ] **Step 1: Write failing tests:** un producto agotado no aparece en `visibleMenu` de esa sucursal pero sí en otra; `findProducts(state,'hamburguesa clasica',…)` acierta con "Hamburguesa clásica"; `alternativesFor` nunca devuelve el mismo producto ni uno agotado; `setPrice(…, 0)` no cambia el precio.
- [ ] **Step 2: Run** `npx vitest run tests/menu.test.js` — Expected: FAIL.
- [ ] **Step 3: Implement** el módulo con normalización de texto (NFD, minúsculas) compartida en `src/core/text.js`.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: reglas de menú y disponibilidad por sucursal`

### Task 4: Pedidos, sucursal por zona, pago y factura

**Files:**
- Create: `src/core/orders.js`, `tests/orders.test.js`

**Interfaces:**
- Consumes: `isAvailable`, `alternativesFor` (Task 3); `store`.
- Produces: `ESTADOS = ['Recibido','En cocina','Listo','En camino','Entregado']`; `assignBranch(state, direccion: string): {sucursalId: string, etaMin: number}|null` (null si ninguna zona coincide); `priceOrder(state, lineas): {subtotal, itbms, total}` (redondeo a 2 decimales); `createOrder(store, draft: {canal, sucursalId, lineas, tipo, direccion?}): {ok:true, pedido}|{ok:false, razon:'agotado'|'sin_zona'|'vacio', detalle?}`; `advanceStatus(store, pedidoId): Pedido` (emite `pedido:estado`; retiro salta "En camino"; no pasa de "Entregado"); `payOrder(store, pedidoId, metodo: 'yappy'|'tarjeta'|'efectivo'): Pedido`; `issueInvoice(store, pedidoId): {id, cufe}` (al pasar a Entregado se emite sola, con CUFE ficticio); `prepMinutes(pedido): number|null`.

- [ ] **Step 1: Write failing tests:** total de 2 hamburguesas + limonada incluye ITBMS 7%; `createOrder` con un producto agotado en esa sucursal → `{ok:false, razon:'agotado'}` aun si estaba bien al armar el carrito (producto agotado después, Review Focus 3); dirección sin zona → `null` y `createOrder` con `sin_zona`; `advanceStatus` recorre los 5 estados y, para retiro, 4; al llegar a Entregado existe `facturaId`; cada cambio de estado agrega a `historial`.
- [ ] **Step 2: Run** `npx vitest run tests/orders.test.js` — Expected: FAIL.
- [ ] **Step 3: Implement.** `assignBranch` compara la dirección normalizada con `zonasEntrega` de cada sucursal; si varias coinciden gana la de menor `etaBaseMin`.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: pedidos, asignación por zona, pago y factura simulados`

### Task 5: Reservas y mesas

**Files:**
- Create: `src/core/reservations.js`, `tests/reservations.test.js`

**Interfaces:**
- Consumes: `store`, mesas de `brand.sucursales`.
- Produces: `availableTables(state, sucursalId, fecha: 'YYYY-MM-DD', hora: 'HH:mm', personas: number): Mesa[]` (capacidad suficiente y sin choque en la franja de 90 min); `createReservation(store, data: {sucursalId, fecha, hora, personas, ocasion}): {ok:true, reserva}|{ok:false, razon:'handoff'|'sin_mesa'|'fuera_de_horario'|'fecha_pasada'|'personas_invalidas'}`; `assignTable(store, reservaId, mesaId): {ok:boolean, razon?}`; `occupancyByHour(state, sucursalId, fecha): {hora, mesasOcupadas, mesasTotal}[]`. Evento ocasión `evento` o personas > 8 → `handoff`.

- [ ] **Step 1: Write failing tests:** 8 personas se reserva; 9 → `handoff`; ocasión "evento" → `handoff`; 0 y -1 personas → `personas_invalidas`; hora fuera del horario → `fuera_de_horario`; fecha anterior a hoy (hora de Panamá) → `fecha_pasada`; dos reservas en la misma mesa y franja → la segunda `assignTable` falla.
- [ ] **Step 2: Run** `npx vitest run tests/reservations.test.js` — Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: reservas con verificación de mesas`

### Task 6: Parser de pedidos en texto libre

**Files:**
- Create: `src/bot/parser.js`, `tests/parser.test.js`

**Interfaces:**
- Consumes: `findProducts`, `isAvailable` (Task 3), `normalize` (`src/core/text.js`).
- Produces: `detectLang(texto): 'es'|'en'`; `parseOrder(texto, state, sucursalId): {lineas: {productoId, cantidad, modificadores: string[]}[], agotados: string[], desconocidos: string[]}`. Reconoce cantidades en dígitos y palabras (un/una/dos…diez / one…ten), "sin X", "término medio/…", "agrandar/large", separadores "y", "," y "and".

- [ ] **Step 1: Write failing tests:** `"2 hamburguesas clásicas sin cebolla y una limonada"` → 2× hamburguesa clásica con `sin cebolla` + 1× limonada; `"two classic burgers and a lemonade"` → igual; con la limonada agotada → `agotados` la contiene y `lineas` no; "0 hamburguesas" y "9999 hamburguesas" → no crean línea (límite razonable 1–20); texto sin productos → `lineas: []`; mayúsculas y tildes no importan.
- [ ] **Step 2: Run** `npx vitest run tests/parser.test.js` — Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: parser de pedidos en español e inglés`

### Task 7: Motor del bot (modo guion)

**Files:**
- Create: `src/bot/engine.js`, `tests/engine.test.js`

**Interfaces:**
- Consumes: `parseOrder`, `detectLang` (Task 6); `createOrder`, `assignBranch`, `priceOrder` (Task 4); `createReservation` (Task 5); `alternativesFor` (Task 3); `store`.
- Produces: `createBot(store): {reply(convId: string, texto: string): BotMessage[]}` con `BotMessage = {de:'bot', texto: string, botones?: string[], actions?: {type: string, payload: object}[]}`. Mantiene en la conversación el paso actual (slots): pedido → confirmar → entrega/retiro → dirección → pago; reserva → fecha → hora → personas → ocasión. Intenciones: pedido, reserva, horario, ubicación, menú del día, alérgenos, estado del pedido, humano. Al confirmar crea el pedido con `canal:'whatsapp'`. Al cambiar el estado de un pedido (`pedido:estado`) agrega un mensaje de aviso a su conversación.

- [ ] **Step 1: Write failing tests:** el flujo del guion de 2 min: "Quiero 2 hamburguesas clásicas sin cebolla y una limonada para Obarrio" (usar la zona de la sucursal 1 de `brand`) → confirma líneas y total y menciona la sucursal asignada y el tiempo; "sí" → pedido creado con las mismas líneas y modificadores; un plato agotado → rechaza y ofrece alternativa; "¿tiene gluten la pasta X?" con `alergenosDeclarados:false` → deriva y marca `requiereHumano`, nunca dice "sin gluten"; "reserva para 9" → handoff; "" y "   " y "asdfgh" → pide aclarar con un ejemplo (Review Focus 1); mensaje en inglés recibe respuesta en inglés; "pasar a una persona" marca `requiereHumano`; al avanzar el estado llega el aviso al chat.
- [ ] **Step 2: Run** `npx vitest run tests/engine.test.js` — Expected: FAIL.
- [ ] **Step 3: Implement** el motor como máquina de pasos por conversación; textos en un diccionario `src/bot/texts.js` con claves `es` y `en`.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: motor del bot con pedidos, reservas y alérgenos`

### Task 8: Adaptador de IA real y `/api/chat`

**Files:**
- Create: `src/bot/ai-adapter.js`, `api/chat.js`, `tests/ai-adapter.test.js`

**Interfaces:**
- Consumes: `store`, `createBot`.
- Produces: `askAI(payload: {demo:'restaurante', sessionId, messages, context}): Promise<{reply, actions, handoff}|null>` (null si el fetch falla, tarda más de 8 s o la respuesta es inválida); `ALLOWED_ACTIONS = ['proponer_pedido','proponer_reserva','pasar_a_persona']`; `applyActions(store, convId, actions): void` descarta las que no estén en la lista o cuyo `payload` no valide (producto inexistente/agotado, personas fuera de rango). `api/chat.js`: función serverless que lee `process.env.ANTHROPIC_API_KEY`, arma el prompt con el menú y las reglas (no inventar precios ni alérgenos) y devuelve el contrato de la base común.

- [ ] **Step 1: Write failing tests:** con `fetch` que rechaza → `askAI` devuelve `null` y el chat sigue en guion; una acción desconocida se ignora; una acción `proponer_pedido` con producto agotado se ignora.
- [ ] **Step 2: Run** `npx vitest run tests/ai-adapter.test.js` — Expected: FAIL.
- [ ] **Step 3: Implement.** El interruptor "IA real" se guarda en el store de UI; por defecto apagado. No escribir ninguna clave en el código.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: adaptador de IA real con respaldo al guion`

### Task 9: Vistas del cliente: portada, menú, carrito y seguimiento

**Files:**
- Create: `src/views/inicio.js`, `src/views/menu.js`, `src/views/carrito.js`, `src/views/pedido.js`, `src/ui/cart.js`, `src/ui/branch-picker.js`, `src/styles/client.css`

**Interfaces:**
- Consumes: `visibleMenu`, `priceOrder`, `createOrder`, `payOrder`, `store`.
- Produces: `cart` con `{add(productoId, modificadores, cantidad), remove(i), items(), clear()}` guardado en el store de UI; `branchPicker(store): HTMLElement`.

- [ ] **Step 1:** Portada con hero + prueba social ficticia, dos botones (Pedir, Reservar), 8 platos destacados, combos con pasos, menú del día con horario; el selector de sucursal se muestra antes del menú y se recuerda.
- [ ] **Step 2:** Menú con barra de categorías con anclas, fotos ilustrativas (SVG), sellos (V) y de alérgenos, modificadores, combos y botón "Pedir" repetido por sección; carrito lateral con subtotal, ITBMS y total.
- [ ] **Step 3:** Carrito: elegir entrega o retiro, dirección (con `assignBranch`), pago simulado (Yappy, tarjeta, efectivo) con aviso de datos ficticios; si `createOrder` responde `agotado` muestra alternativas. Seguimiento `#/pedido/:id` con los 5 estados y la factura simulada al entregar.
- [ ] **Step 4: Verify** a mano en 360 y 1440 px (`npm run dev`, cerrar el servidor al terminar): hacer un pedido web; aparece en la tarjeta de cocina del Task 11. Comprobar etiquetas de formularios y navegación con teclado.
- [ ] **Step 5: Commit** `feat: vistas del cliente (portada, menú, carrito, seguimiento)`

### Task 10: Teléfono simulado y chat con panel "En vivo"

**Files:**
- Create: `src/ui/phone.js`, `src/ui/live-panel.js`, `src/views/chat.js`, `src/styles/phone.css`

**Interfaces:**
- Consumes: `createBot`, `askAI` / `applyActions` (Task 8), `store.on`.
- Produces: `phone(container, {onSend(texto): Promise<BotMessage[]>}): {push(msg), setTyping(bool)}`; `livePanel(container, store)` muestra en vivo pedidos y reservas creados, y conversaciones marcadas.

- [ ] **Step 1:** Marco de teléfono con burbujas, hora de Panamá, doble check, "escribiendo…", botones rápidos, texto "Una persona del equipo revisa los casos importantes" y botón "Pasar a una persona".
- [ ] **Step 2:** Panel "En vivo" al lado (debajo en móvil) que se actualiza con los eventos del store; interruptor "IA real" que, si `askAI` da `null`, vuelve al guion sin avisar con errores.
- [ ] **Step 3: Verify** a mano: el mensaje del guion de 2 minutos crea un pedido visible en "En vivo" y en la cocina; con red cortada el chat sigue respondiendo.
- [ ] **Step 4: Commit** `feat: teléfono simulado y panel En vivo`

### Task 11: Admin: selector de sucursal y pantalla de cocina

**Files:**
- Create: `src/views/admin-shell.js`, `src/views/admin-cocina.js`, `src/styles/admin.css`, `src/styles/kitchen.css`

**Interfaces:**
- Consumes: `advanceStatus`, `ESTADOS`, `store`.
- Produces: `adminShell(content, route)` con botón "Entrar como administrador" (portada) y "Volver a la vista de cliente", navegación por rol y selector de sucursal (`state.ui.sucursalAdmin`).

- [ ] **Step 1:** Cocina: una tarjeta por pedido de la sucursal elegida, con líneas y modificadores, tiempo transcurrido (se refresca cada 30 s y se limpia al salir de la ruta), color verde/amarillo/rojo según el tiempo, botón grande "Avanzar a <siguiente estado>".
- [ ] **Step 2:** Tipografía y contraste pensados para 2 m; probar en tableta horizontal (1024×768) y con teclado.
- [ ] **Step 3: Verify** a mano: avanzar un pedido del chat muestra el aviso en el chat; las líneas de la tarjeta coinciden con las confirmadas.
- [ ] **Step 4: Commit** `feat: panel admin con selector de sucursal y cocina`

### Task 12: Admin: reservas sobre plano de mesas y menú editable

**Files:**
- Create: `src/views/admin-reservas.js`, `src/views/admin-menu.js`, `src/ui/floorplan.js`

**Interfaces:**
- Consumes: `availableTables`, `assignTable`, `occupancyByHour`, `setAvailable`, `setPrice`.
- Produces: `floorplan(container, {mesas, reservas, franja, onAssign(reservaId, mesaId)})`.

- [ ] **Step 1:** Plano simple SVG con mesas libres y ocupadas por franja; lista de reservas del día; asignar mesa con clic o teclado.
- [ ] **Step 2:** Menú editable con precio y interruptor "Agotado" por sucursal; el cambio llega a la web y al bot sin recargar.
- [ ] **Step 3: Verify** a mano: marcar "agotado" y pedirlo por chat → el bot ofrece alternativa; reservar para 4 por chat y verla en el plano.
- [ ] **Step 4: Commit** `feat: reservas en plano de mesas y menú editable`

### Task 13: Indicadores

**Files:**
- Create: `src/core/metrics.js`, `src/views/admin-indicadores.js`, `src/ui/kpi.js`, `tests/metrics.test.js`

**Interfaces:**
- Consumes: `State`, `prepMinutes`.
- Produces: `metrics(state, sucursalId|'todas'): {pedidosPorCanal:{web,whatsapp}, ticketPromedio:number, tiempoPrepMin:number, topPlatos:{nombre,unidades}[]}`; `compareBranches(state): {sucursalId, ...metrics}[]`.

- [ ] **Step 1: Write failing tests:** con la semilla, los pedidos por canal suman 50 en total; el ticket promedio es el total entre pedidos; con 0 pedidos no hay división por cero (devuelve 0).
- [ ] **Step 2: Run** `npx vitest run tests/metrics.test.js` — Expected: FAIL.
- [ ] **Step 3: Implement** `metrics` y la vista: KPIs grandes (cifra + etiqueta corta), barras SVG propias, comparativa entre sucursales y "resumen diario" simulado como si se enviara por correo.
- [ ] **Step 4: Run** `npx vitest run` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: indicadores por sucursal y comparativa`

### Task 14: Modo Presentación

**Files:**
- Create: `src/presentation.js`, `src/ui/presenter.js`
- Modify: `src/main.js` (botón "Presentación")

**Interfaces:**
- Consumes: `createBot`, `advanceStatus`, `setAvailable`, `createReservation`, router.
- Produces: `startPresentation(ctx): {pause(), next(), exit()}` con 5 pasos del guion (pedido por chat; cocina avanza y avisos; plato agotado con alternativa; reserva de 4 en el plano; cierre), una nota por paso.

- [ ] **Step 1:** Implementar los pasos, que cambian de ruta, escriben el mensaje, avanzan y se pueden pausar, saltar y salir; al salir se restaura el estado previo (o se ofrece "Reiniciar demo").
- [ ] **Step 2: Verify** a mano: el recorrido completo funciona de principio a fin sin errores en consola.
- [ ] **Step 3: Commit** `feat: modo Presentación`

### Task 15: Verificación, README y cierre

**Files:**
- Create: `README.md`, `tests/e2e/recorrido.spec.js`, `playwright.config.js`
- Modify: lo que salga de la revisión de accesibilidad y rendimiento

- [ ] **Step 1:** Escribir el recorrido E2E con Playwright (la base lo levanta con `vite preview` y lo cierra): pedido por chat → cocina → avisos → agotado → reserva → factura; correrlo en 360, 768 y 1440 px y con `localStorage` bloqueado.
- [ ] **Step 2: Run** `npx vitest run` y el E2E — Expected: todo en verde, sin errores en consola.
- [ ] **Step 3:** Lighthouse móvil: Accesibilidad ≥ 90, Rendimiento ≥ 85; verificar peso de JS ≤ 300 KB comprimido; corregir lo que falle.
- [ ] **Step 4:** README en español: cómo correrlo, cómo desplegarlo (estático en un subdominio propio, `/api/chat` opcional con la clave en variable de entorno), cómo cambiar la marca en `src/config/brand.js` y el guion de 2 minutos.
- [ ] **Step 5:** Confirmar que no queda ningún servidor corriendo y que no hay claves en el repo (`git grep -i "sk-"`).
- [ ] **Step 6: Commit** `docs: README y verificación final`
