import { esc, money, toast } from './dom.js';
import { dishArt } from './dish-art.js';
import { abrirDialogo } from './dialog.js';
import { cart } from './cart-singleton.js';

const SIN_DATO = 'Consulte alérgenos con una persona';

// Sellos solo a partir de los datos declarados del producto (también los usa el panel de menú del admin).
export function badgesHTML(p) {
  const out = [];
  if (p.vegetariano) out.push('<span class="badge badge--veg" title="Vegetariano">(V) Vegetariano</span>');
  if (/picante/i.test(p.nombre)) out.push('<span class="badge badge--spicy">Picante</span>');
  if (!p.alergenosDeclarados) out.push(`<span class="badge badge-ask">${SIN_DATO}</span>`);
  else if (p.alergenos.length) out.push(...p.alergenos.map((a) => `<span class="badge badge-alg">Contiene ${esc(a)}</span>`));
  else out.push('<span class="badge badge-alg">Sin alérgenos declarados</span>');
  return out.join('');
}

// Precio con la moneda pequeña y la cifra en Anton.
export const precioHTML = (n, cls = 'precio') => {
  const [, cifra] = money(n).split(' ');
  return `<span class="${cls}"><span class="precio__mon">US$</span>${cifra}</span>`;
};

function alergenosTexto(p) {
  if (!p.alergenosDeclarados) return `<p class="dish__alg dish__alg--ask">${SIN_DATO}</p>`;
  if (!p.alergenos.length) return '<p class="dish__alg">Sin alérgenos declarados</p>';
  return `<p class="dish__alg">Contiene: ${p.alergenos.map(esc).join(', ')}</p>`;
}

export function productCardHTML(p, { etiqueta = 'Pedir', clase = '' } = {}) {
  const sellos = [
    p.vegetariano ? '<span class="badge badge--veg">(V) Vegetariano</span>' : '',
    /picante/i.test(p.nombre) ? '<span class="badge badge--spicy">Picante</span>' : '',
  ].join('');
  return `
    <article class="dish ${clase}">
      <div class="dish__media">${dishArt(p)}</div>
      <div class="dish__body">
        <div class="dish__head"><h3 class="dish__name">${esc(p.nombre)}</h3>${precioHTML(p.precio, 'dish__price')}</div>
        ${sellos ? `<div class="dish__sellos">${sellos}</div>` : ''}
        ${alergenosTexto(p)}
        <button type="button" class="btn btn--sm dish__add" data-add="${esc(p.id)}" aria-label="${esc(etiqueta)} ${esc(p.nombre)}">${esc(etiqueta)} <span aria-hidden="true">+</span></button>
      </div>
    </article>`;
}

// Delegación: cualquier [data-add] dentro del contenedor agrega al carrito.
export function bindAdd(contenedor, store) {
  contenedor.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]');
    if (!b || !contenedor.contains(b)) return;
    const p = store.get().productos.find((x) => x.id === b.dataset.add);
    if (p) agregarFlujo(p);
  });
}

export function agregarFlujo(p) {
  if (!p.modificadores.length) {
    cart.add(p.id, [], 1);
    toast(`Agregado: ${p.nombre}`);
    return;
  }
  abrirModificadores(p);
}

const etiquetaMod = (m) => m.charAt(0).toUpperCase() + m.slice(1);

function abrirModificadores(p) {
  const termino = p.modificadores.filter((m) => m.startsWith('término'));
  const extras = p.modificadores.filter((m) => !m.startsWith('término'));
  const form = document.createElement('form');
  form.className = 'mod-form';
  form.method = 'dialog';
  form.innerHTML = `
    <div class="mod-art">${dishArt(p)}</div>
    <div class="mod-body">
      <div class="mod-head"><h2>${esc(p.nombre)}</h2>${precioHTML(p.precio, 'mod-precio')}</div>
      ${termino.length ? `<fieldset class="mod-grupo"><legend class="label">Término de la carne</legend><div class="mod-ops">
        ${termino.map((m, i) => `<label class="mod-op"><input type="radio" name="termino" value="${esc(m)}" ${i === 0 ? 'checked' : ''}><span>${esc(etiquetaMod(m.replace('término ', '')))}</span></label>`).join('')}
      </div></fieldset>` : ''}
      ${extras.length ? `<fieldset class="mod-grupo"><legend class="label">Personalice a su gusto</legend><div class="mod-ops">
        ${extras.map((m) => `<label class="mod-op"><input type="checkbox" name="extra" value="${esc(m)}"><span>${esc(etiquetaMod(m))}</span></label>`).join('')}
      </div>${extras.includes('agrandar') ? '<p class="help">Agrandar no tiene cargo adicional en esta demo.</p>' : ''}
      </fieldset>` : ''}
      <div class="mod-cant">
        <label class="label" for="mod-cantidad">Cantidad</label>
        <div class="stepper">
          <button type="button" data-d="-1" aria-label="Una menos">−</button>
          <input id="mod-cantidad" name="cantidad" type="number" inputmode="numeric" min="1" max="20" value="1">
          <button type="button" data-d="1" aria-label="Una más">+</button>
        </div>
      </div>
      <div class="mod-acciones">
        <button type="button" class="btn btn--ghost" data-cerrar>Cancelar</button>
        <button type="submit" class="btn">Agregar al pedido</button>
      </div>
    </div>`;
  const input = form.querySelector('#mod-cantidad');
  form.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => {
    input.value = Math.max(1, Math.min(20, (Number(input.value) || 1) + Number(b.dataset.d)));
  }));
  const cerrar = abrirDialogo(form, { etiqueta: `Personalizar ${p.nombre}`, clase: 'modal-mod' });
  form.querySelector('[data-cerrar]').addEventListener('click', cerrar);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const mods = [fd.get('termino'), ...fd.getAll('extra')].filter(Boolean);
    cart.add(p.id, mods, Number(fd.get('cantidad')) || 1);
    cerrar();
    toast(`Agregado: ${p.nombre}`);
  });
}
