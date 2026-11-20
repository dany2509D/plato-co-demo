import { plato, coloresPlato } from '../assets/brand/geometria.js';
import { aplicarTema } from './temas.js';

// ---------------------------------------------------------------------------------------------------------------
// MARCA (plantilla). Para otra identidad cambie nombre, iniciales, lema y colores: todo lo demás (logo, sello,
// sellos de sucursal, patrón, favicon) se deriva de aquí. Guía: docs/brand/identidad-visual.md («Cambiar de marca»).
// ---------------------------------------------------------------------------------------------------------------
const nombre = 'Plato & Co.';

// Paleta «tomate y mostaza» (bloque V, 11 nov 2026). Los mismos hex que tokens.css (--c-ember, --c-gold…).
const colores = {
  crema: '#ECE2D0',   // pergamino: fondo de página
  papel: '#F6F0E4',   // cuerpo del plato, tarjetas claras
  tinta: '#2A1A12',   // texto y logotipo sobre claro
  carbon: '#281006',  // bandas oscuras
  tomate: '#8E1F16',  // borde esmaltado del plato, enlaces sobre crema (= --c-ember)
  oro: '#EFC547',     // el «sol» del plato, acento sobre oscuro (= --c-gold, mostaza)
};
colores.terracota = colores.tomate; // alias antiguos (no borrar: otros módulos pueden leerlos)
colores.amarillo = colores.oro;

const escAttr = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Símbolo cuadrado para la cabecera (32/28 px), el panel y el avatar del chat. Contrato: viewBox 48×48 y
// ` role="img" aria-label="…"` seguidos (cabecera.js y phone.js los sustituyen por aria-hidden).
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" role="img" aria-label="${escAttr(nombre)}">${plato(24, 24, 23.5, {
  color: coloresPlato({ tomate: colores.tomate, papel: colores.papel, oro: colores.oro }),
})}</svg>`;

const base = {
  nombre,
  iniciales: 'P&C',             // monograma dentro del plato
  lema: 'Hecho al momento',     // texto del sello redondo
  logoSvg,
  colores,
  moneda: 'US$',
  itbms: 0.07,
  telefono: '+507 6000-0000',
  sucursales: [
    {
      id: 'suc-1',
      nombre: 'Plato & Co. Centro',
      direccion: 'Calle Ficticia 123, Ciudad de Panamá',
      horario: { abre: '11:00', cierra: '22:00' },
      zonasEntrega: ['Obarrio', 'Marbella', 'Bella Vista'],
      etaBaseMin: 30,
      mesas: [
        { id: 'C1', capacidad: 2 },
        { id: 'C2', capacidad: 2 },
        { id: 'C3', capacidad: 4 },
        { id: 'C4', capacidad: 4 },
        { id: 'C5', capacidad: 6 },
        { id: 'C6', capacidad: 8 },
      ],
    },
    {
      id: 'suc-2',
      nombre: 'Plato & Co. Costa',
      direccion: 'Avenida Demo 45, Costa del Este',
      horario: { abre: '11:30', cierra: '23:00' },
      zonasEntrega: ['Costa del Este', 'Punta Pacífica', 'San Francisco'],
      etaBaseMin: 35,
      mesas: [
        { id: 'K1', capacidad: 2 },
        { id: 'K2', capacidad: 4 },
        { id: 'K3', capacidad: 4 },
        { id: 'K4', capacidad: 6 },
        { id: 'K5', capacidad: 8 },
      ],
    },
    {
      id: 'suc-3',
      nombre: 'Plato & Co. Norte',
      direccion: 'Vía Ejemplo 7, Albrook',
      horario: { abre: '10:00', cierra: '21:30' },
      zonasEntrega: ['Albrook', 'Clayton', 'Ancón'],
      etaBaseMin: 40,
      mesas: [
        { id: 'N1', capacidad: 2 },
        { id: 'N2', capacidad: 4 },
        { id: 'N3', capacidad: 6 },
        { id: 'N4', capacidad: 8 },
      ],
    },
  ],
};

// Tema de diseño activo (botón «Diseño» del menú Demo): «plato» deja la marca tal cual.
export const brand = aplicarTema(base);
