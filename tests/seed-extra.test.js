import { describe, it, expect } from 'vitest';
import { buildSeed } from '../src/data/seed.js';
import { priceOrder } from '../src/core/orders.js';

const horas = ['2026-11-11T06:30:00Z', '2026-11-11T15:00:00Z', '2026-11-11T22:10:00Z', '2026-11-12T03:30:00Z'];
const aMin = (h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3));

describe('seed: totales, facturas y seedId (I9, M10, M4)', () => {
  const s = buildSeed(new Date(horas[1]));
  it('los 50 pedidos traen subtotal/itbms/total iguales a priceOrder', () => {
    expect(s.pedidos).toHaveLength(50);
    for (const p of s.pedidos) {
      const t = priceOrder(s, p.lineas);
      expect([p.subtotal, p.itbms, p.total]).toEqual([t.subtotal, t.itbms, t.total]);
    }
  });
  it('los Entregado traen factura simulada con id único; los demás no', () => {
    const ent = s.pedidos.filter((p) => p.estado === 'Entregado');
    expect(ent.length).toBe(26);
    const ids = ent.map((p) => p.facturaId);
    expect(new Set(ids).size).toBe(26);
    for (const p of ent) {
      expect(p.facturaId).toMatch(/^fac-\d{4}$/);
      expect(p.factura).toMatchObject({ id: p.facturaId, simulada: true });
      expect(p.factura.cufe).toMatch(/^SIMULADO-.*NO-VALIDO-FISCALMENTE$/);
      expect(Date.parse(p.factura.emitidaEn)).toBeLessThanOrEqual(Date.parse(horas[1]));
    }
    expect(s.pedidos.filter((p) => p.estado !== 'Entregado').every((p) => !p.facturaId)).toBe(true);
  });
  it('seedId en el estado y en cada pedido', () => {
    expect(typeof s.seedId).toBe('string');
    expect(s.pedidos.every((p) => p.seedId === s.seedId)).toBe(true);
    expect(buildSeed(new Date(horas[2])).seedId).not.toBe(s.seedId);
  });
});

describe('seed: reservas sin choques (T2)', () => {
  for (const h of horas) {
    it(`sin dobles reservas de mesa y todas las confirmadas con mesa (${h})`, () => {
      const s = buildSeed(new Date(h));
      expect(s.reservas).toHaveLength(15);
      const cap = (r) => s.sucursales.find((x) => x.id === r.sucursalId).mesas.find((m) => m.id === r.mesaId)?.capacidad;
      for (const r of s.reservas) {
        if (r.estado === 'confirmada') { expect(r.mesaId).toBeTruthy(); expect(cap(r)).toBeGreaterThanOrEqual(r.personas); }
        const suc = s.sucursales.find((x) => x.id === r.sucursalId);
        expect(aMin(r.hora)).toBeGreaterThanOrEqual(aMin(suc.horario.abre));
        expect(aMin(r.hora) + 90).toBeLessThanOrEqual(aMin(suc.horario.cierra));
      }
      const con = s.reservas.filter((r) => r.mesaId);
      for (let i = 0; i < con.length; i++) for (let j = i + 1; j < con.length; j++) {
        const a = con[i], b = con[j];
        if (a.sucursalId === b.sucursalId && a.fecha === b.fecha && a.mesaId === b.mesaId) {
          expect(Math.abs(aMin(a.hora) - aMin(b.hora))).toBeGreaterThanOrEqual(90);
        }
      }
    });
  }
});
