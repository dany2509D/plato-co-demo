import { describe, it, expect } from 'vitest';
import { construirFeed } from '../src/core/live-feed.js';
import { buildSeed } from '../src/data/seed.js';

function base() {
  const s = buildSeed(new Date('2026-11-11T15:00:00Z'));
  s.pedidos = [];
  return s;
}
const pedido = (s, extra = {}) => ({
  id: 'P-900', canal: 'whatsapp', sucursalId: s.sucursales[0].id, tipo: 'retiro', estado: 'Recibido',
  lineas: [{ productoId: s.productos[0].id, cantidad: 2, modificadores: [] }],
  historial: [{ estado: 'Recibido', en: '2026-11-11T20:00:00Z' }], creadoEn: '2026-11-11T20:00:00Z', conversacionId: 'c-web', ...extra,
});

describe('construirFeed', () => {
  it('vacío sin actividad del chat', () => {
    const s = base();
    s.pedidos = [pedido(s, { conversacionId: undefined, canal: 'web' })];
    expect(construirFeed(s)).toEqual([]);
  });
  it('pedido del chat: id, canal, sucursal, total y estado actual', () => {
    const s = base();
    s.pedidos = [pedido(s)];
    const [it] = construirFeed(s);
    expect(it.titulo).toBe('Pedido P-900 creado');
    expect(it.detalle).toContain('WhatsApp');
    expect(it.detalle).toContain(s.sucursales[0].nombre);
    expect(it.detalle).toMatch(/Total US\$ \d+\.\d{2}/);
    expect(it.detalle).toContain('Estado: Recibido');
    expect(it.hora).toBe('3:00 p. m.');
    expect(it.enlace.href).toBe('#/admin/cocina');
  });
  it('cambios de estado salen como ítems y reflejan el estado actual; más nuevo primero', () => {
    const s = base();
    s.pedidos = [pedido(s, { estado: 'En preparación', historial: [
      { estado: 'Recibido', en: '2026-11-11T20:00:00Z' }, { estado: 'En preparación', en: '2026-11-11T20:05:00Z' }] })];
    const f = construirFeed(s);
    expect(f.map((x) => x.tipo)).toEqual(['estado', 'pedido']);
    expect(f[0].titulo).toContain('En preparación');
    expect(f[1].detalle).toContain('Estado: En preparación');
  });
  it('reserva desde acciones del chat y marca de humano', () => {
    const s = base();
    const r = s.reservas[0];
    s.conversaciones = [{ id: 'c-web', idioma: 'es', requiereHumano: true, paso: null, slots: {}, mensajes: [
      { de: 'bot', texto: 'ok', en: '2026-11-11T21:00:00Z', actions: [{ type: 'reserva:creada', payload: { reservaId: r.id } }] },
      { de: 'bot', texto: 'humano', en: '2026-11-11T21:10:00Z' },
    ] }];
    const f = construirFeed(s, { humanoEn: { 'c-web': '2026-11-11T21:20:00Z' } });
    expect(f.map((x) => x.tipo)).toEqual(['humano', 'reserva']);
    expect(f[0].titulo).toContain('Requiere persona');
    expect(f[1].enlace.href).toBe('#/admin/reservas');
    expect(f[1].titulo).toContain(r.id);
  });
  it('respeta el límite', () => {
    const s = base();
    s.pedidos = Array.from({ length: 20 }, (_, i) => pedido(s, { id: `P-${i}` }));
    expect(construirFeed(s, { limite: 5 })).toHaveLength(5);
  });
});
