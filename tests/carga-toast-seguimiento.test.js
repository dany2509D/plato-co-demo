import { describe, it, expect, vi, afterEach } from 'vitest';
import { esqueletoTarjetas, decidirSplash, cargaHTML } from '../src/ui/carga.js';
import { crearGestor } from '../src/ui/toast.js';
import { plateProgress, etapaDe } from '../src/ui/seguimiento-marca.js';
import { vistaNoEncontrado } from '../src/views/no-encontrado.js';

describe('carga', () => {
  it('esqueleto: n tarjetas, acotado a 1-12', () => {
    const c = (n) => (esqueletoTarjetas(n).match(/class="cg-card"/g) ?? []).length;
    expect(c(6)).toBe(6); expect(c(0)).toBe(1); expect(c(99)).toBe(12); expect(c('x')).toBe(1);
    expect(esqueletoTarjetas(3)).toContain('role="status"');
  });
  it('cargaHTML escapa el texto', () => { expect(cargaHTML({ texto: '<i>' })).toContain('&lt;i&gt;'); });
  it('decisión del splash: nunca antes de 300 ms ni si el héroe ya cargó o ya se vio', () => {
    expect(decidirSplash({ heroListo: true, ms: 1000 })).toBe('omitir');
    expect(decidirSplash({ yaVisto: true, ms: 1000 })).toBe('omitir');
    expect(decidirSplash({ ms: 100 })).toBe('esperar');
    expect(decidirSplash({ ms: 300 })).toBe('mostrar');
  });
});

describe('toast: cola', () => {
  afterEach(() => vi.useRealTimers());
  it('máximo 3: el más antiguo sale primero', () => {
    const g = crearGestor({ max: 3 });
    const ids = [1, 2, 3, 4].map((i) => g.agregar({ mensaje: 'm' + i }));
    expect(g.lista().map((x) => x.id)).toEqual(ids.slice(1));
    g.limpiar();
  });
  it('expira a los 4 s', () => {
    vi.useFakeTimers();
    const g = crearGestor({});
    g.agregar({ mensaje: 'a' });
    vi.advanceTimersByTime(3999); expect(g.lista()).toHaveLength(1);
    vi.advanceTimersByTime(2); expect(g.lista()).toHaveLength(0);
  });
  it('pausar detiene el reloj y reanudar lo retoma (mín. 1 s)', () => {
    vi.useFakeTimers();
    let t = 0;
    const g = crearGestor({ ahora: () => t });
    const id = g.agregar({ mensaje: 'a' });
    t = 3500; vi.advanceTimersByTime(3500); g.pausar(id);
    vi.advanceTimersByTime(60000); expect(g.lista()).toHaveLength(1);
    g.reanudar(id);
    vi.advanceTimersByTime(900); expect(g.lista()).toHaveLength(1);
    vi.advanceTimersByTime(200); expect(g.lista()).toHaveLength(0);
  });
  it('descartar y notificar cambios', () => {
    const cambios = [];
    const g = crearGestor({ alCambiar: (l) => cambios.push(l.length) });
    const id = g.agregar({ mensaje: 'a' });
    expect(g.descartar(id)).toBe(true); expect(g.descartar(id)).toBe(false);
    expect(cambios).toEqual([1, 0]);
  });
});

describe('plateProgress', () => {
  it('5 etapas con aria-label y sin elementos de etapas futuras', () => {
    const r = ['Recibido', 'En cocina', 'Listo', 'En camino', 'Entregado'].map((e) => plateProgress(e));
    expect(r[0]).not.toContain('pp-acc');
    expect(r[1]).toContain('pp-acc'); expect(r[1]).not.toContain('pp-comida');
    expect(r[2]).toContain('pp-comida');
    expect(r[3]).toContain('pp-campana'); expect(r[3]).not.toContain('pp-sello');
    expect(r[4]).toContain('pp-sello');
    expect(r[1]).toContain('aria-label="Seguimiento: En cocina, paso 2 de 5"');
    expect(r.every((s) => s.includes('role="img"'))).toBe(true);
  });
  it('retiro: 4 pasos; texto del sello solo con tam grande', () => {
    expect(etapaDe('Entregado', true)).toMatchObject({ i: 3, n: 4 });
    expect(plateProgress('Entregado', { retiro: true })).toContain('paso 4 de 4');
    expect(plateProgress('Entregado', { tam: 200 })).toContain('AL MOMENTO');
    expect(plateProgress('Entregado', { tam: 120 })).not.toContain('AL MOMENTO');
    expect(plateProgress('Recibido', { animar: false })).not.toContain('pp--anim');
  });
  it('estado desconocido cae a etapa 0', () => { expect(plateProgress('???')).toContain('data-etapa="0"'); });
});

describe('404', () => {
  it('pinta 404, dos acciones y un h1', () => {
    const main = { innerHTML: '' };
    vistaNoEncontrado(main);
    expect(main.innerHTML).toContain('>4<');
    expect(main.innerHTML).toContain('href="#/menu"');
    expect(main.innerHTML).toContain('href="#/"');
    expect(main.innerHTML.match(/<h1/g)).toHaveLength(1);
  });
});
