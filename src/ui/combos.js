import { esc, money, toast } from './dom.js';
import { isAvailable } from '../core/menu.js';
import { cart } from './cart-singleton.js';

const ROMANOS = ['I', 'II', 'III', 'IV', 'V'];

export function combosHTML(state, sucursalId) {
  const tarjetas = state.combos.map((c) => {
    const prods = c.items.map((it) => state.productos.find((p) => p.id === it.productoId));
    if (prods.some((p) => !p || !isAvailable(state, p.id, sucursalId))) return '';
    const suma = c.items.reduce((n, it, i) => n + prods[i].precio * it.cantidad, 0);
    return `
      <article class="combo">
        <h3>${esc(c.nombre)}</h3>
        <ol class="combo-pasos">
          ${prods.map((p, i) => `<li><span class="paso-n" aria-hidden="true">${ROMANOS[i]}</span><span>${esc(p.nombre)}</span></li>`).join('')}
        </ol>
        <div class="combo-pie">
          <span class="combo-precio">${money(c.precio)}${suma > c.precio ? ` <s class="tachado">${money(suma)}</s>` : ''}</span>
          <button type="button" class="btn btn-primario" data-combo="${esc(c.id)}" aria-label="Pedir ${esc(c.nombre)}">Pedir <span aria-hidden="true">+</span></button>
        </div>
      </article>`;
  }).join('');
  return `<div class="combos-grid">${tarjetas}</div>
    <p class="nota">En esta demo cada combo se agrega plato por plato, al precio de lista del menú.</p>`;
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

// Hora de Panamá (UTC-5 todo el año).
export function ahoraPanama() {
  const d = new Date(Date.now() - 5 * 3600 * 1000);
  return { dia: d.getUTCDay(), minutos: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

export function menuDelDiaHTML(state, sucursalId) {
  const pick = (n) => state.productos.find((p) => p.nombre === n && isAvailable(state, p.id, sucursalId));
  const partes = [pick('Sopa de tomate'), pick('Pollo a la parrilla'), pick('Limonada')].filter(Boolean);
  if (partes.length < 2) return '';
  const { dia, minutos } = ahoraPanama();
  const activo = dia >= 1 && dia <= 5 && minutos >= 11 * 60 && minutos < 15 * 60;
  return `
    <div class="mdd">
      <div class="mdd-izq">
        <span class="sello ${activo ? 'sello-ok' : ''}">${activo ? 'Disponible ahora' : 'Almuerzo · lun a vie'}</span>
        <h3>Menú del día</h3>
        <p class="mdd-horario">De lunes a viernes, de 11:00 a 15:00.</p>
      </div>
      <ul class="mdd-lista">${partes.map((p) => `<li>${esc(p.nombre)}</li>`).join('')}</ul>
      <div class="mdd-precio"><strong>US$ 9.95</strong><span>por persona · solo en sala</span></div>
    </div>`;
}
