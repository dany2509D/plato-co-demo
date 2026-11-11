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
