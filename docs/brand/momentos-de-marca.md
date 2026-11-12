# Momentos de marca (bloque M)

Los momentos pequeños que hacen que Plato & Co. se sienta como una marca y no como una plantilla. Dispositivo central: **el ticket de comanda** (papel de cocina con borde perforado, tipografía monoespaciada para códigos, línea de rasgado, tira de barras, aro de plato como viñeta). Todo es plano: sin sombras, sin degradados visibles, radio 0, filete de 1 px, trazo de 1,5 px. Sin emoji. Guía viva: `#/estilo` → «Momentos de marca». Estilos: `src/styles/momentos.css`.

## Catálogo

| Pieza | Archivo | API | Notas |
|---|---|---|---|
| Ticket | `src/ui/ticket.js` | `ticket({titulo, codigo, lineas:[{cantidad,nombre,detalle,precio,fotoHtml}], totales, meta:[{k,v}], factura, pie, variante:'papel'\|'oscuro', sello, etiquetas})`; `ticketDesdePedido(state, pedido, {fotos, variante})` | Todo con `esc()`. `ticketDesdePedido` usa totales GUARDADOS (`totalesPedido`) y `pedido.factura` (id + CUFE con marca SIMULADO y «Sin validez fiscal»). `fotoHtml` es el único campo sin escapar: solo de `fotoProducto()`. Ancho máx. 380 px. |
| Estados vacíos | `src/ui/estados-vacios.js` | `estadoVacio(tipo, {t, titulo, texto, accion, tono, tam})`, `TIPOS_VACIO` | Tipos: carrito, pedidos-cocina, reservas, en-vivo, busqueda, agotados, historial. Copy local con claves `vacio.<tipo>.titulo\|texto\|accion` para inyectar `t()`. Acción: `{texto, href}` (enlace) o `{texto, dato}` (botón `data-accion`). |
| Carga | `src/ui/carga.js` | `cargaHTML`, `mostrarCarga(el)`, `esqueletoTarjetas(n)`, `decidirSplash`, `iniciarSplash({min, espera})` | Anillo que gira 1,1 s; esqueleto con pulso de opacidad (sin brillo). La portada de arranque solo se pinta si el héroe no cargó a los 300 ms; una vez por sesión. |
| Avisos | `src/ui/toast.js` | `toast({mensaje, tipo:'ok'\|'aviso'\|'error', accion:{texto, alClic\|href}, duracion})`, `cerrarToasts()`, `crearGestor()` | Abajo al centro, 4 s, pausa con cursor/foco, Esc cierra el más reciente, máx. 3. 72 px libres a la izquierda (botón «Presentación»); en < 1024 px sube 84 px sobre la barra del carrito. Error = `role="alert"`. Prefijo oculto «Listo/Aviso/Error». |
| Plato de seguimiento | `src/ui/seguimiento-marca.js` | `plateProgress(estado, {retiro, tam, animar, texto, etiqueta})`, `etapaDe` | Ver «Uso» abajo. |
| 404 | `src/views/no-encontrado.js` | `vistaNoEncontrado(main)` | Textos de `sistema.noEncontrado` (W) con respaldo local. «404» en Anton (único momento Anton), el 0 es un plato con un bocado. Acciones: Volver a la carta / Ir al inicio. |

### Plato de seguimiento: uso para C1/C2
- Tamaño: `tam` en px, mínimo 96; legible desde 120 (panel En vivo, tarjeta de cocina); 160-240 en la página de seguimiento. El texto del sello «Hecho al momento» solo se dibuja con `tam >= 180`; por debajo, el sello lleva una marca de verificación.
- Color: trazo `currentColor` (tinta sobre pergamino, crema dentro de `.on-dark`/`.band--dark`), vapor y detalles `var(--ctx-accent)` (brasa / oro). Rellenos: oro y brasa. Fondo de campana/sello: `--pp-bg` (por defecto `--c-paper`; sobre otro fondo defínalo).
- Etapas: Recibido (plato vacío) → En cocina (vapor) → Listo (comida) → En camino (campana, o bolsa en retiro, rayas de velocidad) → Entregado (sello, 600 ms). Retiro: 4 pasos.
- Movimiento: solo entra el elemento nuevo (0,4 s) y el sello aterriza (0,6 s). Con `prefers-reduced-motion` o `animar:false`, solo el fotograma final.
- a11y: `role="img"`, `aria-label="Seguimiento: En cocina, paso 2 de 5"`. Muestre además el texto del estado a su lado.

## Reglas comunes
- **Movimiento**: 0,25-0,6 s, curvas `--ease`/`--ease-out`; nada gira ni parpadea de forma continua salvo el anillo de carga (transitorio). Todo con `prefers-reduced-motion`.
- **Contraste** (calculado): papel: tinta/papel 14,7, secundario 7,6, brasa 7,5, filete 4,4 (UI ≥ 3). Oscuro: texto 14,0, secundario 10,5, oro 9,6; error `#ff8a9b` sobre carbón 8,0.
- **Impresión**: en `@media print` solo se imprime el ticket (negro sobre blanco, 80 mm, sin fotos).
- **Perforación**: máscara SVG (vectorial, nítida a 1x y 2x); decorativa (`aria-hidden`). Si V entrega `ticketBorde()` en `brand-marks.js`, puede sustituirse sin tocar el contrato.

## Tabla de integración

| Pieza | Dónde | Cómo |
|---|---|---|
| Ticket | `#/carrito` (resumen) — `src/views/carrito.js` | `ticket({titulo:'Su pedido', lineas, totales, pie})` en lugar del bloque de resumen; variante `papel`. |
| Ticket | `#/pedido/:id` Detalles y factura — `src/views/pedido.js` | `ticketDesdePedido(state, pedido, {fotos:true})`; incluye factura SIMULADA y sello si Entregado. |
| Ticket | Panel En vivo — `src/ui/live-panel.js` | Variante `oscuro` compacta por ítem de pedido nuevo (o solo el estilo `.tk`). |
| Ticket | Cocina — `src/views/admin-cocina.js` | Tarjeta de pedido con `ticket({... variante:'papel'})` sin totales. |
| Ticket | Bot (confirmación) | El chat renderiza HTML escapado: usar `ticketDesdePedido` dentro de la burbuja. |
| `estadoVacio` | carrito vacío (`carrito.js`), cocina por columna (`admin-cocina.js`), reservas (`admin-reservas.js`), En vivo (`live-panel.js`), búsqueda y agotados (`menu.js`), historial | `contenedor.innerHTML = estadoVacio('carrito')`; los botones `data-accion` los cablea la vista. |
| `plateProgress` | `#/pedido/:id` encabezado; fila de pedido del panel En vivo (120 px) | `plateProgress(p.estado, {retiro: p.tipo==='retiro', tam:200})`; repintar en cada cambio de estado. |
| `toast` | agregar al carrito, agotado, guardado en admin | Reemplaza `toast()` de `src/ui/dom.js` (misma idea; el nuevo es `toast({mensaje, tipo})`). |
| Carga | cambios de ruta lentos, listas | `esqueletoTarjetas(6)` mientras llega la carta. |
| Splash | `src/main.js` | `import { iniciarSplash } from './ui/carga.js'; iniciarSplash();` al inicio. |
| 404 | router + main | Ver abajo. |

## Cableado del 404 (3 líneas + pruebas)
1. `src/ui/router.js`, última línea de `parseRoute`: `return { name: 'inicio', params: {} };` → 
   `return partes.length === 0 ? { name: 'inicio', params: {} } : { name: 'no-encontrado', params: {} };`
   (el hash vacío y `#/` dan `partes = []`, así que siguen en inicio; la protección de `decodificar` no cambia).
2. `src/main.js`: `import { vistaNoEncontrado } from './views/no-encontrado.js';` y añadir `'no-encontrado': vistaNoEncontrado` a `VISTAS` y `'no-encontrado': 'Página no encontrada'` a `TITULOS`.
3. (Opcional) `header` no marca ninguna pestaña activa: ya ocurre porque `data-nav` no coincide.

Pruebas a cambiar en `tests/router.test.js`: `'#/%E0%A4%A'` y `'#/admin/%zz'` → `no-encontrado` (en lugar de `inicio`); `'#/nada'` y `'#/admin/xyz'` → `no-encontrado`; `'#/estilo/otra'` → `no-encontrado`; `''` y `'#/'` siguen en `inicio`. Añadir `expect(parseRoute('#/').name).toBe('inicio')`. Revisar también el E2E (`tests/e2e`) si navega a hashes desconocidos.

## Pendiente / decisiones
- Cambiar a `ticketBorde()` de V y a `t()` de W cuando existan (copy local de respaldo en cada módulo).
- Los `data-accion` de los vacíos y `alClic` de los avisos los cablea cada vista.
