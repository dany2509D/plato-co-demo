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
    expect(st.get()).toEqual(buildSeed(new Date()));
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
