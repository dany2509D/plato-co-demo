import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { copy, t, tm, plural, usd, claveEstado, OBLIGATORIOS } from '../src/config/copy.js';
import { SALUDO } from '../src/core/chat-view.js';
import { TEXTS } from '../src/bot/texts.js';
import { ESTADOS } from '../src/core/estados.js';
import { STEPS } from '../src/core/tour.js';
import { brand } from '../src/config/brand.js';

const src = (f) => readFileSync(resolve(__dirname, '..', f), 'utf8');

// Recorre el árbol y entrega [ruta, texto] por cada cadena.
function* textos(nodo, ruta = '') {
  if (typeof nodo === 'string') { yield [ruta, nodo]; return; }
  if (Array.isArray(nodo)) { for (const [i, v] of nodo.entries()) yield* textos(v, `${ruta}[${i}]`); return; }
  if (nodo && typeof nodo === 'object') for (const [k, v] of Object.entries(nodo)) yield* textos(v, ruta ? `${ruta}.${k}` : k);
}
const TODOS = [...textos(copy)];
const palabras = (s) => s.trim().split(/\s+/).filter(Boolean);

afterEach(() => vi.restoreAllMocks());

describe('baraja de textos: forma', () => {
  it('está congelada a fondo', () => {
    expect(Object.isFrozen(copy)).toBe(true);
    expect(Object.isFrozen(copy.portada.comoFunciona.pasos)).toBe(true);
    expect(Object.isFrozen(copy.portada.comoFunciona.pasos[0])).toBe(true);
    expect(Object.isFrozen(copy.chat.respuestas.inicio)).toBe(true);
    expect(() => { copy.marca.nombre = 'X'; }).toThrow();
  });
  it('trae todas las áreas', () => {
    for (const k of ['marca', 'nav', 'portada', 'menu', 'carrito', 'pedido', 'chat', 'admin', 'presentacion', 'ticket', 'sistema', 'meta']) {
      expect(copy[k], k).toBeTruthy();
    }
  });
  it('la marca coincide con brand.js', () => {
    expect(copy.marca.nombre).toBe(brand.nombre);
  });
  it('tiene tres reseñas con nombre, inicial y sucursal', () => {
    const r = copy.portada.resenas.lista;
    expect(r).toHaveLength(3);
    for (const x of r) {
      expect(x.autor).toMatch(/^[A-ZÁÉÍÓÚ][a-záéíóúñ]+( [A-ZÁÉÍÓÚ][a-záéíóúñ]+)? [A-Z]\.$/);
      expect(x.sucursal).toMatch(/^Sucursal /);
      expect(x.estrellas).toBeGreaterThanOrEqual(4);
    }
  });
  it('tiene tres pasos de «cómo funciona»', () => {
    expect(copy.portada.comoFunciona.pasos).toHaveLength(3);
  });
});

describe('t()', () => {
  it('resuelve claves anidadas', () => {
    expect(t('pedido.estados.EnCocina')).toBe(copy.pedido.estados.EnCocina);
    expect(t('marca.lema')).toBe('Mesa de barrio con ganas');
  });
  it('interpola {variables}', () => {
    expect(t('carrito.confirmar', { total: 'US$ 8.95' })).toBe('Confirmar pedido · US$ 8.95');
    expect(t('menu.agregado', { nombre: 'Limonada' })).toBe('Agregado: Limonada');
    expect(tm('portada.pie.legal')).toContain('Plato & Co. es un restaurante ficticio');
    expect(tm('portada.pie.legal')).toContain('Panacea Logic AI');
  });
  it('si falta una variable la deja visible y avisa', () => {
    const w = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(t('menu.agregado')).toBe('Agregado: {nombre}');
    expect(w).toHaveBeenCalled();
  });
  it('si falta la clave devuelve vacío y avisa', () => {
    const w = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(t('no.existe.nada')).toBe('');
    expect(t('constructor.name')).toBe('');
    expect(t('portada')).toBe(''); // un grupo no es un texto
    expect(w).toHaveBeenCalledTimes(3);
  });
  it('plural, usd y clave de estado', () => {
    expect(plural(1, 'plato', 'platos')).toBe('1 plato');
    expect(plural(3, 'plato', 'platos')).toBe('3 platos');
    expect(usd(8.95)).toBe('US$ 8.95');
    expect(usd(3)).toBe('US$ 3.00');
    expect(claveEstado('En cocina')).toBe('EnCocina');
  });
});

describe('coherencia con la aplicación', () => {
  it('cada estado del pedido tiene nombre y frase', () => {
    for (const e of ESTADOS) {
      const k = claveEstado(e);
      expect(copy.pedido.nombres[k], k).toBe(e);
      expect(copy.pedido.estados[k], k).toBeTruthy();
    }
  });
  it('los pasos de la presentación usan los mismos ids que el recorrido', () => {
    expect(Object.keys(copy.presentacion.pasos)).toEqual(STEPS.map((s) => s.id));
    for (const s of STEPS) expect(Boolean(copy.presentacion.pasos[s.id].auto)).toBe(Boolean(s.auto));
  });
  it('las respuestas rápidas son idénticas a las del bot', () => {
    const r = copy.chat.respuestas;
    expect(r.inicio).toEqual(SALUDO.botones);
    expect(r.tipo).toEqual(TEXTS.es.botonesTipo);
    expect(r.pago).toEqual(TEXTS.es.botonesPago);
    expect(r.ocasion).toEqual(TEXTS.es.botonesOcasion);
    expect(r.confirmar).toBe(TEXTS.es.si);
    expect(r.cancelar).toBe(TEXTS.es.cancelar);
  });
  it('hay un texto por cada categoría de la carta', () => {
    const seed = src('src/data/seed.js');
    for (const c of ['Entradas', 'Hamburguesas', 'Pastas', 'Platos fuertes', 'Ensaladas y bowls', 'Postres', 'Bebidas']) {
      expect(seed).toContain(`'${c}'`);
      expect(copy.menu.categorias[c], c).toBeTruthy();
    }
  });
});

describe('textos obligatorios: exactos en la baraja y en la interfaz', () => {
  it('la baraja los trae exactos', () => {
    expect(OBLIGATORIOS['sistema.bannerDemo']).toBe('Demo de Panacea Logic AI · Datos ficticios · No ingrese información real');
    expect(OBLIGATORIOS['carrito.pagoSimulado']).toBe('Pago simulado · Datos ficticios · No ingrese información real');
    for (const [ruta, texto] of Object.entries(OBLIGATORIOS)) expect(t(ruta), ruta).toBe(texto);
  });
  // La interfaz lo pinta tal cual o lee la clave de la baraja (una vez integrada). Si cambia en un lado, esto avisa.
  const sitios = [
    ['sistema.bannerDemo', 'src/ui/banner.js', ['Panacea Logic AI', '· Datos ficticios · No ingrese información real']],
    ['carrito.pagoSimulado', 'src/views/carrito.js', ['Pago simulado', '· Datos ficticios · No ingrese información real']],
    ['chat.equipoRevisa', 'src/ui/phone.js', ['Una persona del equipo revisa los casos importantes']],
    ['chat.pasarPersona', 'src/ui/phone.js', ['Pasar a una persona']],
    ['chat.pasarPersona', 'src/core/chat-view.js', ['Pasar a una persona']],
    ['chat.notaSimulado', 'src/views/chat.js', ['Chat simulado · No se conecta a WhatsApp real']],
    ['chat.modoIA', 'src/views/chat.js', ['Modo IA real (opcional)']],
  ];
  for (const [clave, archivo, fragmentos] of sitios) {
    it(`${clave} en ${archivo}`, () => {
      const s = src(archivo);
      const leeClave = s.includes(`'${clave}'`) || s.includes(`"${clave}"`) || s.includes(`\`${clave}\``);
      if (leeClave) return;
      for (const f of fragmentos) expect(s, f).toContain(f);
    });
  }
});

describe('estilo: todas las cadenas', () => {
  it('hay cadenas que revisar', () => { expect(TODOS.length).toBeGreaterThan(300); });
  it('solo «usted»: nada de tuteo', () => {
    const tuteo = /(^|[^\p{L}])(tienes|quieres|puedes|necesitas|tú|tu|tus|ti|contigo|vos)([^\p{L}]|$)/iu;
    expect(TODOS.filter(([, s]) => tuteo.test(s))).toEqual([]);
  });
  it('sin espacios dobles ni sobrantes', () => {
    expect(TODOS.filter(([, s]) => /\s{2,}/.test(s) || s !== s.trim())).toEqual([]);
  });
  it('a lo sumo una exclamación por texto', () => {
    expect(TODOS.filter(([, s]) => (s.match(/!/g) ?? []).length > 1)).toEqual([]);
  });
  it('ningún texto largo en mayúsculas', () => {
    const gritos = TODOS.filter(([, s]) => palabras(s).length > 4 && s === s.toUpperCase() && /\p{L}/u.test(s));
    expect(gritos).toEqual([]);
  });
  it('los precios usan «US$ »', () => {
    expect(TODOS.filter(([, s]) => /\$/.test(s) && !/US\$/.test(s))).toEqual([]);
    expect(TODOS.filter(([, s]) => /US\$[^\s)]/.test(s) || /\b(USD|B\/\.?)\b/.test(s))).toEqual([]);
  });
  it('sin emojis', () => {
    expect(TODOS.filter(([, s]) => /\p{Extended_Pictographic}/u.test(s))).toEqual([]);
  });
  it('llaves balanceadas y variables con nombre simple', () => {
    for (const [r, s] of TODOS) {
      expect((s.match(/\{/g) ?? []).length, r).toBe((s.match(/\}/g) ?? []).length);
      for (const m of s.matchAll(/\{([^}]*)\}/g)) expect(m[1], r).toMatch(/^\w+$/);
    }
  });
  it('sin extranjerismos evitables', () => {
    const malas = /\b(checkout|delivery|take ?away|take-?out|ok|okay|stock|feedback|booking|click|login)\b/i;
    expect(TODOS.filter(([, s]) => malas.test(s))).toEqual([]);
  });
});

describe('límites de longitud', () => {
  it('descripción meta ≤ 155 y títulos ≤ 60', () => {
    expect(copy.meta.descripcion.length).toBeLessThanOrEqual(155);
    expect(copy.meta.ogDescripcion.length).toBeLessThanOrEqual(155);
    expect(copy.meta.titulo.length).toBeLessThanOrEqual(60);
    expect(copy.meta.ogTitulo.length).toBeLessThanOrEqual(60);
  });
  it('textos de categoría ≤ 14 palabras', () => {
    for (const [c, s] of Object.entries(copy.menu.categorias)) expect(palabras(s).length, c).toBeLessThanOrEqual(14);
  });
  it('subtítulos de sección ≤ 20 palabras', () => {
    for (const s of [copy.portada.sucursales.subtitulo, copy.portada.masPedidos.subtitulo, copy.portada.menuDia.subtitulo, copy.portada.combos.subtitulo]) {
      expect(palabras(s).length).toBeLessThanOrEqual(20);
    }
  });
  it('sin saltos de línea en ninguna cadena', () => {
    expect(TODOS.filter(([, s]) => /\n/.test(s))).toEqual([]);
  });
  it('el lema y las alternas son cortos', () => {
    for (const s of [copy.marca.lema, ...copy.marca.lemaAlternos]) expect(palabras(s).length).toBeLessThanOrEqual(8);
  });
});
