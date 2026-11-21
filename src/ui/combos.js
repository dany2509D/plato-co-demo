import { brand } from '../config/brand.js';
import { esc, money, toast } from './dom.js';
import { isAvailable } from '../core/menu.js';
import { menuDelDiaActivo } from '../core/horario.js';
import { cart } from './cart-singleton.js';
import { precioHTML } from './product-card.js';
import { fotoProducto } from './photo.js';

const ROL = ['Entrada', 'Plato fuerte', 'Bebida'];
// (Rediseño editorial, 19 nov 2026: sin numerales romanos sobre las fotos; el rol va en texto debajo.)
const aro = () => '';

export function combosHTML(state, sucursalId) {
  const tarjetas = state.combos.map((c) => {
    const prods = c.items.map((it) => state.productos.find((p) => p.id === it.productoId));
    if (prods.some((p) => !p || !isAvailable(state, p.id, sucursalId))) return '';
    const suma = c.items.reduce((n, it, i) => n + prods[i].precio * it.cantidad, 0);
    const ahorro = suma - c.precio;
    // Platos redondos superpuestos (como servidos en la mesa); al pasar el cursor se abren en abanico (forma.css).
    return `
      <article class="combo">
        <div class="combo__platos" aria-hidden="true">
          ${prods.map((p, i) => `<span class="combo__plato" style="--i:${i};--n:${prods.length}">${fotoProducto(p, { variante: 'grid' })}</span>`).join('')}
          ${ahorro > 0 ? `<span class="combo__sello">Ahorra<br><b>${money(ahorro)}</b></span>` : ''}
        </div>
        <div class="combo__head"><h3>${esc(c.nombre)}</h3>${precioHTML(c.precio, 'combo__price')}</div>
        <ul class="combo__lista" aria-label="Incluye">
          ${prods.map((p) => `<li>${esc(p.nombre)}</li>`).join('')}
        </ul>
        <div class="combo__pie">
          ${ahorro > 0 ? `<span class="combo__antes">Por separado <s>${money(suma)}</s></span>` : '<span></span>'}
          <button type="button" class="btn btn--sm" data-combo="${esc(c.id)}" aria-label="Pedir ${esc(c.nombre)}">Pedir combo <span aria-hidden="true">→</span></button>
        </div>
      </article>`;
  }).join('');
  return `<div class="combos-wrap"><div class="combos-grid" role="region" aria-label="Combos" tabindex="0">${tarjetas}</div></div>
    <p class="help combos-nota">En esta demo cada combo se agrega plato por plato, al precio de lista del menú.</p>`;
}

export function bindCombos(contenedor, store) {
  contenedor.addEventListener('click', (e) => {
    const b = e.target.closest('[data-combo]');
    if (!b) return;
    const c = store.get().combos.find((x) => x.id === b.dataset.combo);
    if (!c) return;
    c.items.forEach((it) => cart.add(it.productoId, [], it.cantidad));
    toast(`Agregado: ${c.nombre}`);
  });
}

// Menú del día (lunes a viernes de 11:00 a 15:00, hora de Panamá). Vacío si faltan platos en la sucursal.
export function menuDelDiaHTML(state, sucursalId, { id = '' } = {}) {
  const pick = (n) => state.productos.find((p) => p.nombre === n && isAvailable(state, p.id, sucursalId));
  const MDD = brand.tema?.menuDelDia;
  const partes = (MDD?.productos ?? ['Sopa de tomate', 'Pollo a la parrilla', 'Limonada']).map(pick).filter(Boolean);
  if (partes.length < 2) return '';
  const activo = menuDelDiaActivo();
  return `
    <div class="mdd-wrap"><div class="mdd">
      <div class="mdd__izq">
        <span class="badge ${activo ? 'badge--ok' : 'badge--outline'}">${activo ? '● <span class="t-brillo">Disponible ahora</span>' : esc(MDD?.etiqueta ?? 'Solo almuerzo · lun a vie')}</span>
        <h2 class="mdd__t"${id ? ` id="${esc(id)}"` : ''}>${esc(MDD?.nombre ?? 'Menú del día')}</h2>
        <p class="mdd__h">${esc(MDD?.horario ?? 'De lunes a viernes, de 11:00 a 15:00. Entrada, plato fuerte y bebida.')}</p>
        <div class="mdd__precio">${precioHTML(MDD?.precio ?? 9.95, 'mdd__cifra')}<span>por persona · solo en sala</span></div>
      </div>
      <ol class="mdd__lista" aria-label="Qué incluye el menú del día" tabindex="0">${partes.map((p, i) => `<li><div class="mdd__foto">${fotoProducto(p, { variante: 'grid' })}${aro(i)}</div><span class="mdd__n">${esc(p.nombre)}</span><span class="mdd__d">${ROL[i] ?? ''}</span></li>`).join('')}</ol>
    </div></div>`;
}
