import { describe, it, expect, vi, afterEach } from 'vitest';
import { createStorage } from '../src/core/storage.js';

afterEach(() => vi.unstubAllGlobals());

describe('createStorage', () => {
  it('con localStorage que lanza, lee null y usa memoria', () => {
    vi.stubGlobal('localStorage', {
      getItem() { throw new Error('bloqueado'); },
      setItem() { throw new Error('bloqueado'); },
    });
    const s = createStorage('k');
    expect(s.read()).toBeNull();
    s.write({ a: 1 });
    expect(s.read()).toEqual({ a: 1 });
  });

  it('con JSON corrupto read devuelve null sin lanzar', () => {
    vi.stubGlobal('localStorage', { getItem: () => '{no es json', setItem() {} });
    const s = createStorage('k');
    expect(() => s.read()).not.toThrow();
    expect(s.read()).toBeNull();
  });

  it('persiste en localStorage cuando funciona', () => {
    const m = {};
    vi.stubGlobal('localStorage', { getItem: (k) => m[k] ?? null, setItem: (k, v) => { m[k] = v; } });
    const s = createStorage('k');
    s.write({ b: 2 });
    expect(JSON.parse(m.k)).toEqual({ b: 2 });
    expect(s.read()).toEqual({ b: 2 });
  });
});
