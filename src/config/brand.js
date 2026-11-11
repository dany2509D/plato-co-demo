const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" role="img" aria-label="Plato &amp; Co.">
  <circle cx="24" cy="24" r="22" fill="#B4472A"/>
  <circle cx="24" cy="24" r="14" fill="#FFF6E5"/>
  <circle cx="24" cy="24" r="8" fill="#F5B82E"/>
</svg>`;

export const brand = {
  nombre: 'Plato & Co.',
  logoSvg,
  colores: {
    crema: '#FFF6E5',
    terracota: '#B4472A',
    amarillo: '#F5B82E',
    tinta: '#2B1810',
  },
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
