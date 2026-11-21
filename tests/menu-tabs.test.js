import { describe, it, expect } from 'vitest';
import { tabSlug, buildTabs, resolveActiveTab, nextTabIndex } from '../src/core/menu-tabs.js';

const grupos = [
  { categoria: 'Hamburguesas', productos: [{}, {}] },
  { categoria: 'Postres y más', productos: [{}] },
];

describe('tabSlug', () => {
  it('normaliza tildes y espacios', () => {
    expect(tabSlug('Bebidas frías')).toBe('bebidas-frias');
    expect(tabSlug('Postres y más')).toBe('postres-y-mas');
  });
});

describe('buildTabs', () => {
  it('una pestaña por categoría en orden, luego Combos y Menú del día', () => {
    const t = buildTabs(grupos, { combos: true, menuDelDia: true });
    expect(t.map((x) => x.id)).toEqual(['hamburguesas', 'postres-y-mas', 'combos', 'menu-del-dia']);
    expect(t[0]).toMatchObject({ tipo: 'categoria', nombre: 'Hamburguesas', cuenta: 2 });
  });
  it('omite Combos y Menú del día si no aplican; sin categorías queda vacío', () => {
    expect(buildTabs(grupos, {}).map((x) => x.id)).toEqual(['hamburguesas', 'postres-y-mas']);
    expect(buildTabs([], {})).toEqual([]);
  });
});

describe('resolveActiveTab', () => {
  const tabs = buildTabs(grupos, { combos: true });
  it('conserva la activa si existe', () => expect(resolveActiveTab(tabs, 'combos')).toBe('combos'));
  it('cae a la primera si desapareció o es nula', () => {
    expect(resolveActiveTab(tabs, 'sopas')).toBe('hamburguesas');
    expect(resolveActiveTab(tabs, null)).toBe('hamburguesas');
  });
  it('sin pestañas devuelve null', () => expect(resolveActiveTab([], 'x')).toBeNull());
});

describe('nextTabIndex', () => {
  it('flechas con vuelta circular, Home y End', () => {
    expect(nextTabIndex(0, 3, 'ArrowRight')).toBe(1);
    expect(nextTabIndex(2, 3, 'ArrowRight')).toBe(0);
    expect(nextTabIndex(0, 3, 'ArrowLeft')).toBe(2);
    expect(nextTabIndex(1, 3, 'Home')).toBe(0);
    expect(nextTabIndex(0, 3, 'End')).toBe(2);
  });
  it('otras teclas o lista vacía devuelven null', () => {
    expect(nextTabIndex(0, 3, 'a')).toBeNull();
    expect(nextTabIndex(0, 0, 'ArrowRight')).toBeNull();
  });
});
