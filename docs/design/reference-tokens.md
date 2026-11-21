# Referencias de diseño — tokens reales (aportados por el cliente)

Fuente: tres archivos DESIGN.md que el cliente pegó (extraídos de sundayapp.com, eathungrytiger.com y amritpalace.com). Se usan como **ideas y medidas de referencia**, no se copian textos, logos, fotos ni tipografías propietarias (Salmond, TT Ramillas, Satoshi, Helvetica Neue → sustitutos de Google Fonts).

## 1. Hungry Tiger — "póster de especias" (oscuro, cálido, maximalista)
- Lienzo `#823513` (ember rust) → tarjetas `#402011` → núcleo `#281006`. Acento único **Tiger Gold `#faae33`**. Rojo `#d1255c` solo para insignias de picante. Bordes `#6b2e12`, secundario `#9f531b`.
- Tipografía: una sola familia gigante. Titulares de 130–213 px, peso 700, interlínea 0.80–0.90, tracking −0.02em; texto pequeño 11–18 px con tracking +0.01–0.02em. Sustitutos sugeridos: Druk Wide / Antonio / Bebas Neue (display), Inter (pequeño).
- Botones, insignias e inputs **100 % píldora** (radio 9999px). Tarjetas radio 6px. Botón relleno oro con texto `#281006`; botón fantasma borde 1px oro, texto oro, 13 px peso 500.
- **Sin sombras.** Profundidad por pasos de color (3 marrones). Separadores **punteados** de 1px dorados entre secciones. Marcas de agua botánicas casi invisibles. Iconos de línea fina 1.5px en oro dentro de círculos. Botones flotantes (bolsa/carrito) abajo a la derecha.
- Composición: póster; titular enorme + pequeño producto aislado, texto ≈ 90 %.
- No: segunda tipografía display, sombras, fotos enmarcadas en rectángulos, colores fríos.

## 2. Amrit Palace — "galería de pergamino" (claro, editorial, restaurante)
- Lienzo pergamino `#d8cbb8`, secundarios `#bfb4a3` / `#b6ab9c` (líneas de 1px), texto `#2c2c2c` (nunca negro puro), apagado `#978e81` / `#615b53`, banda oscura `#292622`. Acento único **azafrán `#d49653`** (estrellas, estados activos), máximo 2–3 veces por pantalla.
- Tipografía: serif display **peso 300**, MAYÚSCULAS, 50–115 px, interlínea 0.8–0.9, tracking −0.04em (sustitutos: Cormorant Garamond, DM Serif Display); sans de 500 para nav/botones/cuerpo 14–15 px uppercase con tracking −0.01em (Inter / DM Sans). La serif nunca baja de 22 px.
- Geometría **afilada**: tarjetas 0px, botones/inputs/tags 3px. Botones fantasma (borde 1px, texto en mayúsculas, padding 20×28). Sin sombras, sin degradados; separadores de 1px `#b6ab9c` como "regla de columna" editorial.
- Fotografía de ambiente a pantalla completa con degradado oscuro arriba; después secciones sobre pergamino, texto alineado a la izquierda, huecos de 120–160 px. Barra de navegación transparente flotando sobre el héroe, con menús desplegables por sede ("Reservar", "Pedir"). Prueba social: 4,7 con estrellas doradas; tarjetas de reseñas. **Marquesina** de nombres de platos (27 s lineal) como único movimiento; transiciones 0.4 s `cubic-bezier(0.25,0.46,0.45,0.94)`.
- Menú: precio a la derecha, marcas (V), pasos numerados en menús cerrados.

## 3. Sunday — "galería blanca con un pulso neón" (claro, SaaS de hostelería)
- Lienzo `#ffffff`, texto `#000000`, gris cálido `#736f7c`, líneas `#dedede`, placeholder `#bdbdbd`, bandas oscuras `#000000`. Acento único **neón `#ff17e9`** (solo logo, subrayado activo, palabras resaltadas, borde de insignias; nunca relleno).
- Tipografía: una familia (Helvetica Neue → Inter), solo peso 400; la jerarquía sale del tamaño y el tracking: 12–14 px uppercase +0.08em; 16–24 px −0.01em; 32–48 px −0.03em; 64–200 px **−0.05em**. **Cifras de 200 px** para estadísticas (3.500+ clientes, 80M+…), etiqueta 14 px gris debajo.
- Radios: tarjetas e inputs 16px, **botón principal píldora 64px negro con texto blanco**, tags 100px, tarjetas grandes 48px. Inputs: borde 1px `#dedede`, foco → `#000`. Sin sombras salvo la de la barra sticky (`0 12px 60px rgba(0,0,0,.15)`).
- Estructura: héroe en dos columnas (titular + foto 16px de radio), fila de 4 estadísticas gigantes, banda negra con tarjetas de producto en scroll horizontal, bloque "una mesa, tres personas" (comensal/personal/dueño), formulario, pie con rejilla de enlaces. Analítica: ingresos, ticket medio, covers, comparativa multi-local, resumen semanal por correo.
- Espaciado base 8 px; ancho 1200 px; separación de secciones 80 px.

## 4. Qué tomar de cada una para Plato & Co. (decisión del controlador, ajustable por el diseñador)
| Elemento | De dónde |
|---|---|
| Tipografía display enorme con interlínea 0.8–0.9 y tracking negativo, MAYÚSCULAS | las tres (misma idea: escala extrema + tracking inverso al tamaño) |
| Lienzo cálido de pergamino, texto `#2c2c2c`, líneas de 1px como reglas editoriales | Amrit |
| Bandas oscuras marrón/carbón con acento dorado (héroe, "cómo funciona", pie) | Tiger (marrones) + Sunday (banda negra) |
| **Un solo acento**: oro/azafrán (usar un único tono, p. ej. entre `#faae33` y `#d49653`, comprobando AA) | Tiger + Amrit |
| Botón principal: píldora rellena (oscura sobre claro / oro sobre oscuro); secundario: fantasma de 1px | Sunday + Tiger |
| Tarjetas afiladas (0–6px), sin sombras, profundidad por tono | Amrit + Tiger |
| Separadores punteados dorados entre bandas | Tiger |
| Marquesina de platos, prueba social con estrellas, menú con precio a la derecha y pasos numerados en combos, selector por sucursal en "Reservar/Pedir" | Amrit |
| Cifras gigantes de estadísticas, bloque por roles (comensal / cocina / gerente), banda de tarjetas en scroll horizontal | Sunday |
| Panel de administración: lienzo blanco, hairlines `#dedede`, KPIs enormes, comparativa entre sucursales, resumen por correo, botones píldora negros | Sunday |
| Botones flotantes de carrito, iconos de línea fina, insignias píldora (picante/vegetariano) | Tiger |
| Fotos: no disponibles → **ilustraciones SVG a gran tamaño** y texturas (grano de papel, marcas de agua) en lugar de fotografía | decisión propia |

Reglas de oro: una sola tipografía display (sin mezclar con otra display); sin sombras ni degradados (salvo la barra sticky); radios coherentes (afilado en tarjetas, píldora en botones/etiquetas); nunca negro puro para texto; acento usado con moderación.
