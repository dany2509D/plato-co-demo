import { describe, it, expect, vi, afterEach } from 'vitest';
import { createStore } from '../src/core/store.js';
import { createStorage } from '../src/core/storage.js';

// Dos "pestañas" comparten un mismo almacenamiento; el evento solo llega a la otra pestaña (como `storage`).
function compartido() {
  let v = null;
  const oyentes = new Set();
  return () => {
    let mio = null;
    return {
      read: () => (v === null ? null : JSON.parse(v)),
      write: (o) => { v = JSON.stringify(o); for (const f of [...oyentes]) if (f !== mio) f(); },
      subscribe: (fn) => { mio = fn; oyentes.add(fn); return () => oyentes.delete(fn); },
    };
  };
}
const A_ID = 'prod-01-aros-de-cebolla';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('sincronización entre pestañas (C2)', () => {
  it('lo que la pestaña B marca agotado, la A lo ve antes de pedir', () => {
    const mk = compartido();
    const a = createStore(mk());
    const b = createStore(mk());
    b.update((s) => { s.productos[0].disponiblePorSucursal['suc-1'] = false; });
    expect(a.get().productos[0].disponiblePorSucursal['suc-1']).toBe(false);
    expect(a.get().productos[0].id).toBe(A_ID);
  });
  it('notifica a los suscriptores de A cuando B cambia algo, una sola vez', () => {
    const mk = compartido();
    const a = createStore(mk());
    const b = createStore(mk());
    const fn = vi.fn();
    a.subscribe(fn);
    b.update((s) => { s.ui.sucursalAdmin = 'suc-2'; });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(a.get().ui.sucursalAdmin).toBe('suc-2');
  });
  it('el pedido nuevo de A no se pierde cuando B avanza otro pedido', () => {
    const mk = compartido();
    const a = createStore(mk());
    const b = createStore(mk());
    a.update((s) => { s.pedidos.unshift({ ...s.pedidos[0], id: 'ped-051' }); });
    b.update((s) => { s.pedidos.find((p) => p.id === 'ped-001').estado = 'Listo'; });
    expect(b.get().pedidos.some((p) => p.id === 'ped-051')).toBe(true);
    expect(a.get().pedidos.some((p) => p.id === 'ped-051')).toBe(true);
    expect(a.get().pedidos.find((p) => p.id === 'ped-001').estado).toBe('Listo');
  });
  it('sin evento todavía, update re-lee lo guardado antes de aplicar (no pisa)', () => {
    let v = null; // almacenamiento sin evento (otro navegador lento)
    const mk = () => ({ read: () => (v === null ? null : JSON.parse(v)), write: (o) => { v = JSON.stringify(o); } });
    const a = createStore(mk());
    const b = createStore(mk());
    b.update((s) => { s.productos[1].disponiblePorSucursal['suc-1'] = false; });
    a.update((s) => { s.ui.sucursalCliente = 'suc-2'; });
    const final = JSON.parse(v);
    expect(final.productos[1].disponiblePorSucursal['suc-1']).toBe(false);
    expect(final.ui.sucursalCliente).toBe('suc-2');
  });
  it('no hay bucle: un evento no provoca escrituras ni más notificaciones', () => {
    const mk = compartido();
    const sa = mk();
    const escribe = vi.spyOn(sa, 'write');
    const a = createStore(sa);
    const b = createStore(mk());
    const fn = vi.fn();
    a.subscribe(fn);
    escribe.mockClear();
    for (let i = 0; i < 5; i++) b.update((s) => { s.ui.sucursalAdmin = i % 2 ? 'suc-1' : 'suc-3'; });
    expect(fn).toHaveBeenCalledTimes(5);
    expect(escribe).not.toHaveBeenCalled();
  });
  it('reset en una pestaña llega a la otra', () => {
    const mk = compartido();
    const a = createStore(mk());
    const b = createStore(mk());
    b.update((s) => { s.ui.sucursalAdmin = 'suc-3'; });
    expect(a.get().ui.sucursalAdmin).toBe('suc-3');
    b.reset();
    expect(a.get().ui.sucursalAdmin).toBe('suc-1');
    expect(a.get().seedId).toBe(b.get().seedId);
  });
  it('ignora estados inválidos que llegan por el evento', () => {
    let v = null;
    let cb;
    const st = { read: () => (v === null ? null : JSON.parse(v)), write: (o) => { v = JSON.stringify(o); }, subscribe: (f) => { cb = f; return () => {}; } };
    const a = createStore(st);
    const antes = a.get();
    v = JSON.stringify({ rev: 999, pedidos: 'x' });
    expect(() => cb()).not.toThrow();
    expect(a.get()).toBe(antes);
    v = '{roto';
    expect(() => cb()).not.toThrow();
  });
  it('createStorage.subscribe: usa window.storage y no falla sin window o con localStorage bloqueado', () => {
    // sin window (node)
    const sinWin = createStorage('k');
    expect(() => sinWin.subscribe(() => {})()).not.toThrow();
    const oyentes = {};
    const fakeWin = { addEventListener: (t, f) => { oyentes[t] = f; }, removeEventListener: (t) => { delete oyentes[t]; } };
    vi.stubGlobal('window', fakeWin);
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('x'); } });
    const s = createStorage('k');
    const cb = vi.fn();
    const off = s.subscribe(cb);
    oyentes.storage({ key: 'otra' });
    expect(cb).not.toHaveBeenCalled();
    oyentes.storage({ key: 'k' });
    expect(cb).toHaveBeenCalledTimes(1);
    cb.mockImplementation(() => { throw new Error('x'); });
    expect(() => oyentes.storage({ key: 'k' })).not.toThrow();
    off();
    expect(oyentes.storage).toBeUndefined();
    expect(() => createStore(s)).not.toThrow();
  });
});
