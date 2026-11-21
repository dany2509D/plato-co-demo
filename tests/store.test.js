import { describe, it, expect, vi, afterEach } from 'vitest';
import { createStore } from '../src/core/store.js';
import { buildSeed } from '../src/data/seed.js';

function memStorage(initial = null) {
  let v = initial;
  return { read: () => v, write: (o) => { v = JSON.parse(JSON.stringify(o)); } };
}

afterEach(() => vi.useRealTimers());

describe('createStore', () => {
  it('reset deja get() igual a buildSeed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-11T15:00:30Z'));
    const st = createStore(memStorage());
    st.update((d) => { d.pedidos.length = 0; });
    st.reset();
    const { ultimaActividad, rev, ...sinSello } = st.get(); // sellos volátiles (actividad y revisión)
    expect(rev).toBeGreaterThan(0);
    expect(ultimaActividad).toBe(new Date().toISOString());
    const esperado = buildSeed(new Date());
    expect(sinSello.seedId).not.toBe(esperado.seedId); // en el mismo instante igual cambia (nunca se repite)
    const norm = (x) => JSON.parse(JSON.stringify(x).split(sinSello.seedId).join('X').split(esperado.seedId).join('X'));
    expect(norm(sinSello)).toEqual(norm(esperado));
  });
  it('update guarda y notifica', () => {
    const storage = memStorage();
    const st = createStore(storage);
    const fn = vi.fn();
    const off = st.subscribe(fn);
    st.update((d) => { d.ui.sucursalAdmin = 'suc-2'; });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(st.get().ui.sucursalAdmin).toBe('suc-2');
    expect(storage.read().ui.sucursalAdmin).toBe('suc-2');
    off();
    st.update(() => {});
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('carga estado guardado', () => {
    const a = createStore(memStorage());
    a.update((d) => { d.ui.sucursalAdmin = 'suc-3'; });
    const b = createStore(memStorage(JSON.parse(JSON.stringify(a.get()))));
    expect(b.get().ui.sucursalAdmin).toBe('suc-3');
  });
  it('emit/on', () => {
    const st = createStore(memStorage());
    const fn = vi.fn();
    const off = st.on('x', fn);
    st.emit('x', { a: 1 });
    st.emit('y', 2);
    expect(fn).toHaveBeenCalledWith({ a: 1 });
    expect(fn).toHaveBeenCalledTimes(1);
    off();
    st.emit('x', 3);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('estado viejo (staleness)', () => {
  const guardadoA = (iso) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(iso));
    const a = createStore(memStorage());
    a.update((d) => { d.ui.sucursalAdmin = 'suc-3'; });
    return JSON.parse(JSON.stringify(a.get()));
  };
  it('el estado lleva seedDia (Panamá) y seedEn', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-12T03:30:00Z')); // 22:30 del 11 en Panamá
    const st = createStore(memStorage());
    expect(st.get().seedDia).toBe('2026-11-11');
    expect(st.get().seedEn).toBe('2026-11-12T03:30:00.000Z');
  });
  it('conserva cambios manuales dentro del mismo día y sesión corta', () => {
    const guardado = guardadoA('2026-11-11T15:00:00Z');
    vi.setSystemTime(new Date('2026-11-11T16:00:00Z'));
    expect(createStore(memStorage(guardado)).get().ui.sucursalAdmin).toBe('suc-3');
  });
  it('re-siembra si cambió el día en Panamá', () => {
    const guardado = guardadoA('2026-11-11T15:00:00Z');
    vi.setSystemTime(new Date('2026-11-12T15:00:00Z'));
    const st = createStore(memStorage(guardado));
    expect(st.get().ui.sucursalAdmin).not.toBe('suc-3');
    expect(st.get().seedDia).toBe('2026-11-12');
  });
  it('el mismo día UTC pero otro día en Panamá cuenta como otro día', () => {
    const guardado = guardadoA('2026-11-11T20:00:00Z'); // 15:00 del 11
    vi.setSystemTime(new Date('2026-11-12T06:00:00Z')); // 01:00 del 12
    expect(createStore(memStorage(guardado)).get().seedDia).toBe('2026-11-12');
  });
  it('re-siembra si la siembra tiene más de 4 h y hay pedidos activos viejos', () => {
    const guardado = guardadoA('2026-11-11T15:00:00Z'); // 10:00 Panamá
    vi.setSystemTime(new Date('2026-11-11T20:30:00Z')); // 15:30 Panamá, mismo día
    const st = createStore(memStorage(guardado));
    expect(st.get().ui.sucursalAdmin).not.toBe('suc-3');
    expect(st.get().seedEn).toBe('2026-11-11T20:30:00.000Z');
  });
  it('estado guardado sin seedDia (versión anterior) se re-siembra', () => {
    const guardado = guardadoA('2026-11-11T15:00:00Z');
    delete guardado.seedDia; delete guardado.seedEn;
    expect(createStore(memStorage(guardado)).get().ui.sucursalAdmin).not.toBe('suc-3');
  });
  it('funciona con JSON corrupto y con localStorage bloqueado', async () => {
    const { createStorage } = await import('../src/core/storage.js');
    vi.stubGlobal('localStorage', { getItem: () => '{corrupto', setItem: () => { throw new Error('x'); } });
    const st = createStore(createStorage('k'));
    expect(st.get().seedDia).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('x'); } });
    expect(() => createStore(createStorage('k2'))).not.toThrow();
    vi.unstubAllGlobals();
  });
});

describe('actividad reciente (nunca se pierde una sesión viva)', () => {
  const sembrarA = (iso) => { vi.useFakeTimers(); vi.setSystemTime(new Date(iso)); return createStore(memStorage()); };
  const guardar = (st) => JSON.parse(JSON.stringify(st.get()));
  it('sembrado 09:00, actividad 12:50, recarga 13:05: se conserva', () => {
    const st = sembrarA('2026-11-11T14:00:00Z'); // 09:00 Panamá
    vi.setSystemTime(new Date('2026-11-11T17:50:00Z'));
    st.update((d) => { d.ui.sucursalAdmin = 'suc-3'; });
    vi.setSystemTime(new Date('2026-11-11T18:05:00Z'));
    expect(createStore(memStorage(guardar(st))).get().ui.sucursalAdmin).toBe('suc-3');
  });
  it('actividad 08:00, recarga 13:05: se re-siembra', () => {
    const st = sembrarA('2026-11-11T13:00:00Z'); // 08:00
    st.update((d) => { d.ui.sucursalAdmin = 'suc-3'; });
    vi.setSystemTime(new Date('2026-11-11T18:05:00Z'));
    const nuevo = createStore(memStorage(guardar(st)));
    expect(nuevo.get().ui.sucursalAdmin).not.toBe('suc-3');
    expect(nuevo.get().seedEn).toBe('2026-11-11T18:05:00.000Z');
  });
  it('cruza la medianoche de Panamá con actividad reciente: NO se re-siembra (presentador a las 23:50, recarga 00:05)', () => {
    const st = sembrarA('2026-11-12T04:00:00Z'); // 23:00 del 11
    vi.setSystemTime(new Date('2026-11-12T04:50:00Z')); // 23:50
    st.update((d) => { d.ui.sucursalAdmin = 'suc-3'; });
    vi.setSystemTime(new Date('2026-11-12T05:05:00Z')); // 00:05 del 12
    const nuevo = createStore(memStorage(guardar(st)));
    expect(nuevo.get().ui.sucursalAdmin).toBe('suc-3');
    expect(nuevo.get().seedDia).toBe('2026-11-11');
  });
  it('otro día de Panamá y SIN actividad reciente: se re-siembra', () => {
    const st = sembrarA('2026-11-12T01:00:00Z'); // 20:00 del 11
    st.update((d) => { d.ui.sucursalAdmin = 'suc-3'; });
    vi.setSystemTime(new Date('2026-11-12T13:00:00Z')); // 08:00 del 12, 12 h después
    expect(createStore(memStorage(guardar(st))).get().seedDia).toBe('2026-11-12');
  });
  it('sin sello de actividad: se re-siembra una sola vez', () => {
    const st = sembrarA('2026-11-11T15:00:00Z');
    st.update((d) => { d.ui.sucursalAdmin = 'suc-3'; });
    const g = guardar(st);
    delete g.ultimaActividad;
    const a = createStore(memStorage(g));
    expect(a.get().ui.sucursalAdmin).not.toBe('suc-3');
    expect(typeof a.get().ultimaActividad).toBe('string');
    a.update((d) => { d.ui.sucursalAdmin = 'suc-2'; });
    expect(createStore(memStorage(guardar(a))).get().ui.sucursalAdmin).toBe('suc-2');
  });
  it('sello corrupto cuenta como faltante', () => {
    const st = sembrarA('2026-11-11T15:00:00Z');
    const g = guardar(st);
    g.ultimaActividad = 'ayer';
    expect(createStore(memStorage(g)).get().ultimaActividad).toBe('2026-11-11T15:00:00.000Z');
  });
});
