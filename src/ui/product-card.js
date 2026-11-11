import { esc, money, toast } from './dom.js';
import { dishArt } from './dish-art.js';
import { abrirDialogo } from './dialog.js';
import { cart } from './cart-singleton.js';

const SIN_DATO = 'Consulte alérgenos con una persona';

// Sellos solo a partir de los datos declarados del producto.
export function badgesHTML(p) {
  const out = [];
  if (p.vegetariano) out.push('<span class="badge badge-veg" title="Vegetariano">(V) Vegetariano</span>');
  if (/picante/i.test(p.nombre)) out.push('<span class="badge badge-hot">Picante</span>');
  if (!p.alergenosDeclarados) out.push(`<span class="badge badge-ask">${SIN_DATO}</span>`);
  else if (p.alergenos.length) out.push(...p.alergenos.map((a) => `<span class="badge badge-alg">Contiene ${esc(a)}</span>`));
  else out.push('<span class="badge badge-alg">Sin alérgenos declarados</span>');
  return out.join('');
}

export function productCardHTML(p, { etiqueta = 'Pedir' } = {}) {
  return `
    <article class="dish">
      <div class="dish-media">${dishArt(p)}${p.vegetariano ? '<span class="dish-v" aria-hidden="true">V</span>' : ''}</div>
      <div class="dish-body">
        <div class="dish-head"><h3>${esc(p.nombre)}</h3><span class="dish-precio">${money(p.precio)}</span></div>
        <div class="badges">${badgesHTML(p)}</div>
        <button type="button" class="btn btn-primario btn-pedir" data-add="${esc(p.id)}" aria-label="${esc(etiqueta)} ${esc(p.nombre)}">${esc(etiqueta)} <span aria-hidden="true">+</span></button>
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
    <h2>${esc(p.nombre)}</h2>
    <p class="mod-precio">${money(p.precio)}</p>
    ${termino.length ? `<fieldset class="mod-grupo"><legend>Término de la carne</legend>
      ${termino.map((m, i) => `<label class="opcion"><input type="radio" name="termino" value="${esc(m)}" ${i === 0 ? 'checked' : ''}> ${esc(etiquetaMod(m.replace('término ', '')))}</label>`).join('')}
    </fieldset>` : ''}
    ${extras.length ? `<fieldset class="mod-grupo"><legend>Personalice a su gusto</legend>
      ${extras.map((m) => `<label class="opcion"><input type="checkbox" name="extra" value="${esc(m)}"> ${esc(etiquetaMod(m))}</label>`).join('')}
      ${extras.includes('agrandar') ? '<p class="nota">Agrandar no tiene cargo adicional en esta demo.</p>' : ''}
    </fieldset>` : ''}
    <div class="mod-cant">
      <label for="mod-cantidad">Cantidad</label>
      <div class="stepper">
        <button type="button" data-d="-1" aria-label="Una menos">−</button>
        <input id="mod-cantidad" name="cantidad" type="number" inputmode="numeric" min="1" max="20" value="1">
        <button type="button" data-d="1" aria-label="Una más">+</button>
      </div>
    </div>
    <div class="mod-acciones">
      <button type="button" class="btn btn-sec" data-cerrar>Cancelar</button>
      <button type="submit" class="btn btn-primario">Agregar al pedido</button>
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
