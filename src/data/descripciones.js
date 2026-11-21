import { brand } from '../config/brand.js';

// Ingredientes clave de cada plato de la carta base (una línea, para la tarjeta). Texto de demostración.
// Un tema (src/config/temas.js) puede traer las suyas en `tema.descripciones`; si un plato no tiene, la tarjeta
// simplemente no muestra la línea.
const BASE = {
  'Aros de cebolla': 'Cebolla blanca rebozada en cerveza, salsa de la casa',
  'Alitas con salsa': 'Alitas de pollo glaseadas, apio y aderezo de queso azul',
  'Nachos con queso': 'Totopos de maíz, queso fundido, pico de gallo y jalapeño',
  'Bastones de queso': 'Mozzarella empanizada, salsa marinara',
  'Papas fritas': 'Papa cortada a mano, sal de mar',
  'Sopa de tomate': 'Tomate asado, albahaca fresca y crema',
  'Hamburguesa clásica': 'Res 150 g, queso cheddar, lechuga, tomate y pan brioche',
  'Hamburguesa doble': 'Doble res 2 × 120 g, doble cheddar, pepinillos y salsa de la casa',
  'Hamburguesa con tocino': 'Res 150 g, tocino ahumado, cheddar y cebolla caramelizada',
  'Hamburguesa de pollo': 'Pechuga crujiente, repollo morado y mayonesa de limón',
  'Hamburguesa vegetariana': 'Medallón de garbanzo y quinoa, aguacate y tomate',
  'Hamburguesa picante': 'Res 150 g, jalapeño, pepper jack y salsa chipotle',
  'Espagueti a la boloñesa': 'Ragú de res cocido a fuego lento y parmesano',
  'Fettuccine Alfredo': 'Pasta fresca, salsa de crema y parmesano',
  'Penne al pesto': 'Pesto de albahaca, piñones y parmesano',
  'Lasaña de carne': 'Capas de pasta, ragú de res, bechamel y mozzarella',
  'Macarrones con queso': 'Tres quesos gratinados al horno',
  'Pollo a la parrilla': 'Muslo marinado en hierbas, vegetales asados',
  'Churrasco': 'Corte de res 300 g, chimichurri y papas rústicas',
  'Filete de pescado': 'Corvina a la plancha, mantequilla de limón y arroz',
  'Costillas BBQ': 'Costilla de cerdo ahumada, salsa BBQ y ensalada de col',
  'Chuleta de cerdo': 'Chuleta a la parrilla, puré de papa y piña asada',
  'Camarones al ajillo': 'Camarones salteados en ajo, guindilla y arroz blanco',
  'Ensalada César': 'Lechuga romana, crutones, parmesano y aderezo César',
  'Ensalada de la casa': 'Mezcla de hojas, tomate, pepino y vinagreta de maracuyá',
  'Bowl de pollo y arroz': 'Pollo asado, arroz, maíz, aguacate y salsa de yogur',
  'Bowl vegetariano': 'Tofu glaseado, arroz integral, edamame y vegetales',
  'Ensalada griega': 'Tomate, pepino, aceituna negra y queso feta',
  'Brownie con helado': 'Brownie tibio de chocolate y helado de vainilla',
  'Cheesecake': 'Base de galleta y coulis de fresa',
  'Helado de vainilla': 'Dos bolas de vainilla',
  'Tarta de manzana': 'Manzana horneada con canela',
  'Flan de caramelo': 'Flan casero con caramelo',
  'Limonada': 'Limón exprimido al momento',
  'Té helado': 'Té negro con limón',
  'Refresco': 'Lata de 355 ml',
  'Agua mineral': 'Botella de 500 ml',
  'Jugo de naranja': 'Naranja exprimida al momento',
  'Batido de fresa': 'Fresa y leche',
  'Café americano': 'Café panameño de altura',
};

// Platos que la carta presenta como novedad (honesto: es una etiqueta comercial de la demo, no un dato de ventas).
const NUEVOS_BASE = ['Bowl vegetariano', 'Camarones al ajillo', 'Penne al pesto'];

// «Más vendido»: los mismos que la portada destaca como «Lo que más se pide».
export const DESTACADOS = brand.tema?.destacados ?? ['Hamburguesa doble', 'Fettuccine Alfredo', 'Churrasco', 'Bowl de pollo y arroz'];

const DESC = brand.tema?.descripciones ?? (brand.tema?.menu ? {} : BASE);
const NUEVOS = brand.tema?.nuevos ?? (brand.tema?.menu ? [] : NUEVOS_BASE);

export const descripcionDe = (nombre) => DESC[nombre] ?? '';
export const esMasVendido = (nombre) => DESTACADOS.includes(nombre);
export const esNuevo = (nombre) => NUEVOS.includes(nombre);
