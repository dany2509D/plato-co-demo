# Plato & Co. — Demo 08: pedidos y reservas por WhatsApp (diseño)

Fecha: 11 nov 2026 · Estado: pendiente de revisión del usuario
Fuentes: `08-restaurante-pedidos-reservas.md`, `00-base-comun.md` y las 12 reglas del encargo. Esta spec no las repite: define las decisiones de diseño. Si hay conflicto, mandan esos documentos.

## 1. Intención

Demo comercial de Panacea Logic AI para reuniones con restaurantes de varias sucursales. Debe mostrar que un pedido o una reserva que llega por WhatsApp entra a la sucursal correcta, pasa a cocina y sale facturado sin copiar nada a mano.

Cambios respecto a la spec 08 original (pedidos por el usuario):
- La marca ya no es "Fogón Criollo". Es **Plato & Co.**, una plantilla general de restaurante casual, sin cocina ni modismos locales. Sirve para Restaurante Ossa, Slabón Café Bistró y Mentiritas Blancas cambiando solo la configuración.
- Estilo cálido y atrevido, tomando ideas (no textos ni logos) de tres referencias:
  - Hungry Tiger: textos cortos con carácter, botón de pedir repetido, carrito lateral con subtotal, ITBMS y envío, sellos de alérgenos.
  - Amrit Palace: cabecera con Reservar y Pedir, selector de sucursal antes del menú, prueba social, platos destacados, barra de categorías con anclas, marcas (V), combos con pasos, menú del día con horario acotado.
  - Sunday: KPIs grandes, comparativa entre sucursales, turno actual frente al anterior, resumen diario simulado por correo, una vista por rol.

## 2. Stack y estructura

- Vite + JavaScript puro, sin framework. Navegación por hash. Sin backend obligatorio.
- JavaScript ≤ 300 KB comprimido. Sin librerías pesadas (gráficos hechos con SVG propio).

```
plato-co-demo/
  index.html
  src/
    main.js            arranque, router por hash, banner, Reiniciar, Presentación
    config/brand.js    nombre, logo SVG, paleta, sucursales, zonas, horarios, mesas
    data/seed.js       40 productos, 6 combos, 50 pedidos, 15 reservas
    core/store.js      estado único + eventos; localStorage con try/catch y respaldo en memoria
    core/orders.js     crear pedido, asignar sucursal por zona, estados, factura simulada
    core/reservations.js  disponibilidad de mesas, asignar mesa, reglas de >8 personas
    core/menu.js       disponibilidad por sucursal, agotado, búsqueda de productos
    bot/parser.js      lee pedidos en texto libre (es/en), tolerante a tildes y mayúsculas
    bot/engine.js      intenciones, pasos (slots), alérgenos/horarios solo desde datos
    bot/ai-adapter.js  modo IA real: llama /api/chat, valida acciones, vuelve al guion si falla
    ui/                componentes: banner, teléfono, carrito, tarjetas, plano de mesas, KPIs
    views/             cliente (inicio, menu, carrito, chat, pedido) y admin (cocina, reservas, menu, indicadores)
    presentation.js    modo Presentación (guion de 2 minutos)
    styles/            tokens + estilos
  api/chat.js          función serverless opcional (clave solo en variable de entorno)
  tests/               pruebas unitarias del parser, el bot y el store
  README.md
```

## 3. Rutas

Cliente: `#/` portada · `#/menu` · `#/carrito` · `#/chat` (teléfono + panel "En vivo") · `#/pedido/:id`.
Admin (botón "Entrar como administrador", sin contraseña): `#/admin/cocina` · `/reservas` · `/menu` · `/indicadores`. Selector de sucursal fijo arriba (RES-RF-09).

## 4. Datos

- Moneda **US$**, ITBMS 7% donde aplique. Zona horaria America/Panama.
- Marca: Plato & Co. con 3 sucursales ficticias, cada una con dirección, horario, zonas de entrega, tiempo base y mesas con capacidad.
- Menú neutro (entradas, hamburguesas, pastas, platos fuertes, ensaladas y bowls, postres, bebidas): 40 productos con modificadores, alérgenos declarados (un plato sin dato de un alérgeno no se afirma libre de él), marca (V) y disponibilidad por sucursal; 6 combos; menú del día con horario acotado.
- Semilla: 50 pedidos del día (web y WhatsApp), 15 reservas. Reseñas y valoración inventadas.
- Persistencia en una sola clave de `localStorage`. "Reiniciar demo" con confirmación y reseteo exacto a la semilla.

## 5. Bot (modo guion)

- Español e inglés. Detecta el idioma por palabras clave.
- Pedido: el parser reconoce cantidades ("dos", "2"), productos y sinónimos, y modificadores (sin cebolla, término, agrandar). Antes de enviar confirma líneas y total, y pide dirección o retiro. La zona de la dirección asigna la sucursal y da el tiempo estimado.
- Rechaza productos agotados o de otra sucursal y ofrece alternativa (RNF-02).
- Reservas: fecha, hora, personas, ocasión. Verifica mesas. Más de 8 personas o eventos pasan a una persona.
- Horarios, ubicación, menú del día y alérgenos salen solo de los datos. Si no hay dato, deriva.
- Avisos en el chat en cada cambio de estado del pedido: Recibido → En cocina → Listo → En camino → Entregado.
- Pago simulado (Yappy, tarjeta, efectivo) y factura electrónica simulada con CUFE ficticio, enviada por el chat al entregar.
- Texto "Una persona del equipo revisa los casos importantes" y botón "Pasar a una persona", que marca la conversación en el panel.

## 6. IA real (opcional)

`bot/ai-adapter.js` llama a `/api/chat` según el contrato de la base común. La IA propone `actions` y el navegador solo aplica las de la lista permitida de esta demo, validando cada `payload`. Si `/api/chat` no existe o falla, el chat sigue en modo guion. La clave vive solo en una variable de entorno del servidor; no se escribe en archivos ni en el chat.

## 7. Panel

- **Cocina:** una tarjeta por pedido, tiempo transcurrido, color según el tiempo, botón para avanzar. Tipografía grande y alto contraste, legible a 2 m, en tableta horizontal.
- **Reservas:** plano simple de mesas por franja; asignar mesa a una reserva.
- **Menú:** edición de precio y disponibilidad; "agotado" en un clic se refleja en la web y en el bot.
- **Indicadores:** pedidos por canal, ticket promedio, tiempo de preparación y platos más vendidos, por sucursal y total, con comparativa entre sucursales y resumen diario simulado.

## 8. Modo Presentación

Recorre el guion de 2 minutos de la spec 08, con una nota por paso, y se puede pausar, avanzar y salir: pedido por chat → avance en cocina con avisos → plato agotado y alternativa → reserva para 4 en el plano → cierre.

## 9. Verificación y definición de terminado

- Pruebas unitarias de parser, bot y store.
- Las tres reglas de "terminado" de la spec 08: ningún pedido confirmado con productos agotados o de otra sucursal; cocina coincide con el chat en líneas y modificadores; los alérgenos salen solo del menú.
- Recorrido completo con Playwright en 360, 768 y 1440 px y con `localStorage` bloqueado.
- Lighthouse: Accesibilidad ≥ 90, Rendimiento ≥ 85 en móvil.
- Se cierran todos los servidores al terminar.

## 10. Fuera de alcance

Integración real con delivery o punto de venta, GPS, pagos reales, WhatsApp real. Publicación en `restaurante.panacealogic.dev` queda para después, cuando el usuario la pida.
