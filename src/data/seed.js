import { brand } from '../config/brand.js';
import { ESTADOS } from '../core/estados.js';

// Generador pseudoaleatorio determinista (mulberry32) con semilla fija.
function crearPrng(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const OFFSET_PANAMA_MS = -5 * 3600 * 1000; // America/Panama: UTC-5 todo el año

const MOD_CARNE = ['término medio', 'término tres cuartos', 'término bien cocido'];

// [nombre, categoria, precio, vegetariano, modificadores, alergenos, alergenosDeclarados]
const MENU = [
  ['Aros de cebolla', 'Entradas', 4.5, true, ['sin salsa', 'agrandar'], ['gluten'], true],
  ['Alitas con salsa', 'Entradas', 7.5, false, ['sin salsa', 'agrandar'], [], false],
  ['Nachos con queso', 'Entradas', 6.75, true, ['sin cebolla', 'agrandar'], ['lácteos'], true],
  ['Bastones de queso', 'Entradas', 5.95, true, ['sin salsa'], ['lácteos', 'gluten'], true],
  ['Papas fritas', 'Entradas', 3.5, true, ['agrandar', 'sin salsa'], [], false],
  ['Sopa de tomate', 'Entradas', 4.95, true, ['sin cebolla'], ['lácteos'], true],
  ['Hamburguesa clásica', 'Hamburguesas', 8.95, false, [...MOD_CARNE, 'sin cebolla', 'sin tomate', 'agrandar'], ['gluten', 'lácteos'], true],
  ['Hamburguesa doble', 'Hamburguesas', 11.5, false, [...MOD_CARNE, 'sin cebolla', 'agrandar'], ['gluten', 'lácteos'], true],
  ['Hamburguesa con tocino', 'Hamburguesas', 10.25, false, [...MOD_CARNE, 'sin cebolla', 'sin tomate'], ['gluten', 'lácteos'], false],
  ['Hamburguesa de pollo', 'Hamburguesas', 8.75, false, ['sin cebolla', 'sin tomate', 'agrandar'], ['gluten'], true],
  ['Hamburguesa vegetariana', 'Hamburguesas', 9.25, true, ['sin cebolla', 'sin tomate', 'agrandar'], ['gluten', 'soya'], true],
  ['Hamburguesa picante', 'Hamburguesas', 9.95, false, [...MOD_CARNE, 'sin cebolla'], ['gluten', 'lácteos'], false],
  ['Espagueti a la boloñesa', 'Pastas', 9.5, false, ['agrandar', 'sin cebolla'], ['gluten'], true],
  ['Fettuccine Alfredo', 'Pastas', 9.95, true, ['agrandar'], ['gluten', 'lácteos'], true],
  ['Penne al pesto', 'Pastas', 9.75, true, ['agrandar'], ['gluten', 'frutos secos'], false],
  ['Lasaña de carne', 'Pastas', 11.25, false, ['agrandar'], ['gluten', 'lácteos'], true],
  ['Macarrones con queso', 'Pastas', 8.5, true, ['agrandar'], ['gluten', 'lácteos'], true],
  ['Pollo a la parrilla', 'Platos fuertes', 12.5, false, ['sin salsa', 'sin cebolla'], [], false],
  ['Churrasco', 'Platos fuertes', 16.95, false, [...MOD_CARNE, 'sin salsa'], [], true],
  ['Filete de pescado', 'Platos fuertes', 14.5, false, ['sin salsa', 'sin cebolla'], ['pescado'], true],
  ['Costillas BBQ', 'Platos fuertes', 15.25, false, ['sin salsa', 'agrandar'], [], false],
  ['Chuleta de cerdo', 'Platos fuertes', 13.5, false, [...MOD_CARNE, 'sin salsa'], [], true],
  ['Camarones al ajillo', 'Platos fuertes', 15.95, false, ['sin cebolla'], ['mariscos'], true],
  ['Ensalada César', 'Ensaladas y bowls', 8.25, false, ['sin salsa', 'sin cebolla'], ['lácteos', 'gluten'], true],
  ['Ensalada de la casa', 'Ensaladas y bowls', 7.25, true, ['sin cebolla', 'sin tomate', 'sin salsa'], [], false],
  ['Bowl de pollo y arroz', 'Ensaladas y bowls', 10.5, false, ['sin cebolla', 'sin salsa'], [], true],
  ['Bowl vegetariano', 'Ensaladas y bowls', 9.95, true, ['sin cebolla', 'sin salsa'], ['soya'], true],
  ['Ensalada griega', 'Ensaladas y bowls', 8.75, true, ['sin cebolla', 'sin tomate'], ['lácteos'], true],
  ['Brownie con helado', 'Postres', 5.5, true, ['agrandar'], ['gluten', 'lácteos', 'huevo', 'frutos secos'], true],
  ['Cheesecake', 'Postres', 5.95, true, [], ['lácteos', 'gluten', 'huevo'], true],
  ['Helado de vainilla', 'Postres', 3.75, true, ['agrandar'], ['lácteos'], false],
  ['Tarta de manzana', 'Postres', 4.95, true, [], ['gluten'], false],
  ['Flan de caramelo', 'Postres', 4.5, true, [], ['lácteos', 'huevo'], true],
  ['Limonada', 'Bebidas', 2.75, true, ['agrandar', 'sin hielo'], [], true],
  ['Té helado', 'Bebidas', 2.5, true, ['agrandar', 'sin hielo'], [], true],
  ['Refresco', 'Bebidas', 2.25, true, ['agrandar', 'sin hielo'], [], true],
  ['Agua mineral', 'Bebidas', 1.75, true, [], [], true],
  ['Jugo de naranja', 'Bebidas', 3.25, true, ['agrandar', 'sin hielo'], [], true],
  ['Batido de fresa', 'Bebidas', 4.25, true, ['agrandar'], ['lácteos'], true],
  ['Café americano', 'Bebidas', 2.5, true, ['agrandar'], [], true],
];

// [nombre, descripcion, [nombres de productos], precio]
const COMBOS = [
  ['Combo clásico', 'Hamburguesa clásica, papas fritas y refresco', ['Hamburguesa clásica', 'Papas fritas', 'Refresco'], 11.95],
  ['Combo doble', 'Hamburguesa doble, aros de cebolla y limonada', ['Hamburguesa doble', 'Aros de cebolla', 'Limonada'], 15.5],
  ['Combo pasta', 'Fettuccine Alfredo, ensalada de la casa y té helado', ['Fettuccine Alfredo', 'Ensalada de la casa', 'Té helado'], 15.95],
  ['Combo parrilla', 'Pollo a la parrilla, papas fritas y limonada', ['Pollo a la parrilla', 'Papas fritas', 'Limonada'], 16.25],
  ['Combo verde', 'Bowl vegetariano, sopa de tomate y jugo de naranja', ['Bowl vegetariano', 'Sopa de tomate', 'Jugo de naranja'], 14.5],
  ['Combo dulce', 'Brownie con helado y café americano', ['Brownie con helado', 'Café americano'], 7.25],
];

const slug = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const CALLES = ['Calle 50', 'Calle 5.ª', 'Avenida Balboa', 'Calle 74', 'Vía Ejemplo', 'Calle 12'];
const OCASIONES = ['cumpleaños', 'aniversario', 'reunión de trabajo', 'cena familiar', 'sin ocasión especial'];

function fechaPanama(ms) {
  return new Date(ms + OFFSET_PANAMA_MS).toISOString().slice(0, 10);
}

export function buildSeed(now) {
  const rnd = crearPrng(20261111);
  const entero = (min, max) => min + Math.floor(rnd() * (max - min + 1));
  const elegir = (arr) => arr[Math.floor(rnd() * arr.length)];
  const ahora = Math.floor(now.getTime() / 60000) * 60000; // a minuto exacto
  const medianoche = Math.floor((ahora + OFFSET_PANAMA_MS) / 86400000) * 86400000 - OFFSET_PANAMA_MS;
  const maxHace = Math.max(1, Math.min(600, Math.floor((ahora - medianoche) / 60000)));
  const sucursales = JSON.parse(JSON.stringify(brand.sucursales));

  const productos = MENU.map(([nombre, categoria, precio, vegetariano, modificadores, alergenos, declarados], i) => {
    const disponiblePorSucursal = {};
    for (const s of sucursales) disponiblePorSucursal[s.id] = true;
    // algunos productos agotados en una sucursal, para dar variedad a la demo
    if (i % 11 === 7) disponiblePorSucursal[sucursales[i % 3].id] = false;
    return {
      id: `prod-${String(i + 1).padStart(2, '0')}-${slug(nombre)}`,
      nombre, categoria, precio, vegetariano,
      modificadores: [...modificadores], alergenos: [...alergenos],
      alergenosDeclarados: declarados,
      disponiblePorSucursal,
    };
  });
  const porNombre = Object.fromEntries(productos.map((p) => [p.nombre, p]));

  const combos = COMBOS.map(([nombre, descripcion, items, precio], i) => ({
    id: `combo-${i + 1}`, nombre, descripcion, precio,
    items: items.map((n) => ({ productoId: porNombre[n].id, cantidad: 1 })),
  }));

  // Plan de estados: todos representados, mezclados con el PRNG
  const plan = [
    ...Array(26).fill('Entregado'), ...Array(7).fill('Recibido'),
    ...Array(8).fill('En cocina'), ...Array(5).fill('Listo'), ...Array(4).fill('En camino'),
  ];
  for (let i = plan.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [plan[i], plan[j]] = [plan[j], plan[i]];
  }

  const pedidos = plan.map((estado, i) => {
    const sucursal = elegir(sucursales);
    const tipo = estado === 'En camino' || rnd() < 0.6 ? 'entrega' : 'retiro';
    const hace = entero(Math.min(30, maxHace), maxHace); // minutos desde la creación (siempre el día actual de Panamá)
    const creado = ahora - hace * 60000;
    const flujo = tipo === 'entrega' ? ESTADOS : ESTADOS.filter((e) => e !== 'En camino');
    const pasos = flujo.slice(0, flujo.indexOf(estado) + 1);
    const paso = Math.min(4, hace / pasos.length) * 60000; // nunca pasa de 'ahora'
    const historial = pasos.map((e, k) => ({ estado: e, en: new Date(creado + k * paso).toISOString() }));

    const lineas = [];
    for (let k = entero(1, 3); k > 0; k--) {
      const p = elegir(productos);
      const mods = p.modificadores.length && rnd() < 0.4 ? [elegir(p.modificadores)] : [];
      lineas.push({ productoId: p.id, modificadores: mods, cantidad: entero(1, 2) });
    }
    const pedido = {
      id: `ped-${String(i + 1).padStart(3, '0')}`,
      canal: rnd() < 0.55 ? 'web' : 'whatsapp',
      sucursalId: sucursal.id,
      lineas, tipo, estado, historial,
      pago: { metodo: rnd() < 0.6 ? 'tarjeta' : 'efectivo', estado: estado === 'Entregado' ? 'pagado' : 'pendiente' },
      creadoEn: new Date(creado).toISOString(),
    };
    if (tipo === 'entrega') {
      pedido.direccion = `${elegir(CALLES)}, casa ${entero(1, 99)}, ${elegir(sucursal.zonasEntrega)}`;
    }
    return pedido;
  });
  pedidos.sort((a, b) => Date.parse(b.creadoEn) - Date.parse(a.creadoEn)); // más recientes primero

  const reservas = Array.from({ length: 15 }, (_, i) => {
    const sucursal = sucursales[i % 3];
    const personas = elegir([2, 2, 3, 4, 4, 5, 6, 8]);
    const mesa = sucursal.mesas.find((m) => m.capacidad >= personas);
    const hAbre = Number(sucursal.horario.abre.split(':')[0]);
    const hCierra = Number(sucursal.horario.cierra.split(':')[0]);
    const hora = entero(Math.max(hAbre, 12), hCierra - 2);
    const confirmada = i % 5 !== 4;
    return {
      id: `res-${String(i + 1).padStart(2, '0')}`,
      sucursalId: sucursal.id,
      fecha: fechaPanama(ahora + Math.floor(i / 5) * 86400000),
      hora: `${String(hora).padStart(2, '0')}:${elegir(['00', '30'])}`,
      personas,
      ocasion: elegir(OCASIONES),
      ...(confirmada && mesa ? { mesaId: mesa.id } : {}),
      estado: confirmada ? 'confirmada' : 'pendiente',
    };
  });

  return {
    sucursales, productos, combos, pedidos, reservas, conversaciones: [],
    ui: { sucursalAdmin: sucursales[0].id, sucursalCliente: sucursales[0].id, carrito: [], iaReal: false },
  };
}
