// Disposición del plano de mesas: cuadrícula simple, sin dependencias del DOM.
const CELDA_W = 180;
const CELDA_H = 150;
const ALTO_MESA = 100;

// layoutMesas(mesas, {columnas = 3}) -> {mesas: [{id, capacidad, x, y, w, h, forma}], ancho, alto}
// Coordenadas en unidades del lienzo; cada mesa va centrada en su celda.
export function layoutMesas(mesas, { columnas = 3 } = {}) {
  const lista = Array.isArray(mesas) ? mesas : [];
  const cols = Math.max(1, Math.floor(columnas) || 1);
  const filas = Math.ceil(lista.length / cols);
  const out = lista.map((m, i) => {
    const redonda = m.capacidad <= 2;
    const w = redonda ? ALTO_MESA : Math.min(CELDA_W - 16, 76 + m.capacidad * 10);
    const col = i % cols;
    const fila = Math.floor(i / cols);
    return {
      id: m.id,
      capacidad: m.capacidad,
      x: col * CELDA_W + Math.round((CELDA_W - w) / 2),
      y: fila * CELDA_H + Math.round((CELDA_H - ALTO_MESA) / 2),
      w,
      h: ALTO_MESA,
      forma: redonda ? 'redonda' : 'rectangular',
    };
  });
  return { mesas: out, ancho: Math.min(cols, lista.length || 1) * CELDA_W, alto: filas * CELDA_H };
}
