# Recorrido E2E de Plato & Co.

Automatizado en `recorrido.spec.js` (Playwright Test). Se ejecuta en tres anchos (360, 768 y 1440 px) y una segunda vez con `localStorage` bloqueado (modo memoria). En cada prueba se verifica que **no haya errores en la consola**.

## Cómo correrlo

Playwright no es dependencia del proyecto. Desde una carpeta temporal fuera del repositorio:

```bash
# 1) Compile y sirva el sitio (otra terminal, se cierra con Ctrl+C al terminar)
npm run build && npx vite preview --port 4173

# 2) En una carpeta vacía fuera del repo
npm init -y && npm i @playwright/test && npx playwright install chromium
cp <ruta-al-repo>/tests/e2e/recorrido.spec.js .
npx playwright test recorrido.spec.js                 # los tres anchos
BLOQUEAR_LS=1 npx playwright test recorrido.spec.js   # con localStorage bloqueado
```

`BASE_URL` cambia la dirección (por defecto `http://localhost:4173`). En PowerShell use `$env:BLOQUEAR_LS=1`.

## Pasos y resultados esperados

| # | Prueba | Pasos | Resultado esperado |
|---|--------|-------|--------------------|
| 1 | Rutas | Visitar `#/`, `#/menu`, `#/carrito`, `#/chat`, `#/estilo`, `#/pedido/no-existe` y las cuatro de `#/admin/*` | Banner de demo visible en todas; todo `target=_blank` lleva `rel=noopener`; sin scroll horizontal fuera del admin; solo se piden recursos externos a Google Fonts |
| 2 | Portada | Abrir `#/`; pulsar «Pausar cinta de platos» | El botón pasa a «Reanudar cinta de platos» (`aria-pressed=true`) y la animación queda en pausa; a 1440 px el borde izquierdo del pie coincide con el del encabezado |
| 3 | Menú → pago | En `#/menu` abrir una pestaña, agregar un plato (con o sin modificadores), ir a `#/carrito`, elegir **Retiro**, **Yappy**, confirmar | Se lee «Pago simulado»; se llega a `#/pedido/ped-NNN` con la línea de pasos y «Yappy» en los detalles |
| 4 | Chat | En `#/chat` escribir `Quiero 2 hamburguesas clásicas sin cebolla y una limonada para Obarrio` | Resumen con 2 × Hamburguesa clásica (sin cebolla), 1 × Limonada, Total US$ 22.10, «Lo prepara Plato & Co. Centro» |
| 5 | Confirmar y pagar | «Sí, confirmar» → dirección `Calle 50, Obarrio` → «Yappy» | «Pedido ped-NNN registrado … Pago con Yappy simulado: recibido» |
| 6 | Cocina y avisos | En `#/admin/cocina` pulsar «Avanzar» sobre ese pedido hasta entregarlo; volver a `#/chat` | Avisos de cada estado en el chat y, al entregar, la factura electrónica simulada |
| 7 | Agotado | En `#/admin/menu` buscar «Hamburguesa clásica» y marcarla agotada; en el chat escribir `Quiero una hamburguesa clásica para Obarrio` | «… está agotado en esta sucursal. Le puedo ofrecer: …» |
| 8 | Reserva | Escribir `cancelar` y luego `Quiero reservar para 4 mañana a las 8 pm, cumpleaños`; abrir `#/admin/reservas` | «Reserva confirmada … 4 persona(s), mesa …»; el plano muestra mesas y la reserva aparece en la lista |
| 9 | Persona | Pulsar «Pasar a una persona» | El chat responde que una persona del equipo revisará el caso (y queda marcado en el panel «En vivo») |
| 10 | Indicadores | Abrir `#/admin/indicadores` | Se muestran las cifras del día |
| 11 | Reiniciar | Pulsar «Reiniciar demo» (confirma el diálogo) | Los datos vuelven a la semilla: el plato ya no figura como agotado |
| 12 | Presentación | Pulsar «Presentación»; en cada paso, «Hacer por mí» y «Siguiente» hasta el paso 6 de 6 | Los 6 pasos se completan; aparece «Agende su diagnóstico gratis»; «Terminar» cierra la barra (en 360 px el panel queda minimizado: se expande primero) |
