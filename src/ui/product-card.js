import { esc, toast } from './dom.js';
import { fotoProducto } from './photo.js';
import { icono } from './icons.js';
import { abrirDialogo } from './dialog.js';
import { cart } from './cart-singleton.js';
import { descripcionDe, esMasVendido, esNuevo } from '../data/descripciones.js';

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

// Precio «$11.50»: el signo pegado a la cifra, cifras tabulares.
export const precioHTML = (n, cls = 'precio') => {
  const cifra = Number(n).toFixed(2);
  return `<span class="${cls}"><span class="precio__mon">$</span>${cifra}</span>`;
};

// Etiquetas comerciales sobre la foto (máx. 2): Más vendido, Nuevo, Picante, Vegetariano. Solo con datos de la carta.
function etiquetasHTML(p) {
  const out = [];
  if (esMasVendido(p.nombre)) out.push('<span class="badge badge--top">Más vendido</span>');
  if (esNuevo(p.nombre)) out.push('<span class="badge badge--nuevo">Nuevo</span>');
  if (/picante/i.test(p.nombre)) out.push('<span class="badge badge--hot">Picante</span>');
  if (p.vegetariano) out.push('<span class="badge badge--veg">Vegetariano</span>');
  return out.length ? `<span class="dish__tags">${out.slice(0, 2).join('')}</span>` : '';
}

// Línea meta: solo datos declarados; nunca afirma «libre de».
function metaTexto(p) {
  if (!p.alergenosDeclarados) return `<p class="dish__meta dish__meta--ask">${icono('alerta', { tam: 14 })}<span>Consulte alérgenos</span></p>`;
  if (!p.alergenos.length) return '<p class="dish__meta">Sin alérgenos declarados</p>';
  return `<p class="dish__meta">Contiene: ${p.alergenos.map(esc).join(', ')}</p>`;
}

// Miniatura 64×48 para carrito, pedido y admin (la usan C1/C2).
export const miniProducto = (p) => fotoProducto(p, { variante: 'mini' });

// Cabecera del diálogo de modificadores: foto 16:9 a sangre, nombre y precio tabular.
export function dialogoCabecera(p) {
  return `<div class="mod-cab"><div class="mod-art">${fotoProducto(p, { variante: 'modal', eager: true })}</div>
    <div class="mod-head"><h2>${esc(p.nombre)}</h2>${precioHTML(p.precio, 'mod-precio')}</div></div>`;
}

/**
 * Tarjeta de plato con foto. Opciones: etiqueta (texto accesible del botón, por defecto «Agregar»),
 * clase, variante ('grid' | 'fila'), eager (primera foto visible), agotado (fuerza el estado agotado).
 */
export function productCardHTML(p, { etiqueta = 'Agregar', clase = '', variante = 'grid', eager = false, agotado = Boolean(p.agotado) } = {}) {
  const v = variante === 'fila' ? 'fila' : 'grid';
  const pp = agotado && !p.agotado ? { ...p, agotado: true } : p;
  const desc = descripcionDe(p.nombre);
  return `
    <article class="dish foto-host dish--${v}${agotado ? ' dish--agotado' : ''} ${esc(clase)}">
      <div class="dish__media">
        ${fotoProducto(pp, { variante: 'grid', eager })}
        ${agotado ? '' : etiquetasHTML(p)}
        ${agotado ? '<span class="dish__agotado">Agotado hoy</span>' : ''}
      </div>
      <div class="dish__body">
        <div class="dish__head"><h3 class="dish__name">${esc(p.nombre)}${p.vegetariano ? ' <span class="dish__v" role="img" aria-label="vegetariano">(V)</span>' : ''}</h3>${precioHTML(p.precio, 'dish__price')}</div>
        ${desc ? `<p class="dish__desc">${esc(desc)}</p>` : ''}
        ${metaTexto(p)}
        <button type="button" class="btn btn--sm dish__add" data-add="${esc(p.id)}" aria-label="${esc(etiqueta)} ${esc(p.nombre)}"${agotado ? ' disabled' : ''}>${agotado ? 'Agotado' : `${icono('mas', { tam: 18 })}<span>${esc(etiqueta)}</span>`}</button>
      </div>
    </article>`;
}

// Delegación: cualquier [data-add] dentro del contenedor agrega al carrito.
export function bindAdd(contenedor, store) {
  contenedor.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]') || e.target.closest('.dish')?.querySelector('[data-add]:not([disabled])');
    if (!b || !contenedor.contains(b) || b.disabled) return;
    const p = store.get().productos.find((x) => x.id === b.dataset.add);
    if (p) agregarFlujo(p, { alAgregar: () => confirmarBoton(b) });
  });
}

// «Agregar» → «Agregado» con una marca que se dibuja (motion.css · .is-ok) y vuelve a su estado en 1,4 s.
function confirmarBoton(b) {
  if (!b?.isConnected || b.classList.contains('is-ok')) return;
  const antes = b.innerHTML;
  b.classList.add('is-ok');
  b.innerHTML = `${icono('check', { tam: 18 })}<span>Agregado</span>`;
  setTimeout(() => { if (b.isConnected) { b.classList.remove('is-ok'); b.innerHTML = antes; } }, 1400);
}

export function agregarFlujo(p, { alAgregar } = {}) {
  if (!p.modificadores.length) {
    cart.add(p.id, [], 1);
    toast(`Agregado: ${p.nombre}`);
    alAgregar?.();
    return;
  }
  abrirModificadores(p, alAgregar);
}

const etiquetaMod = (m) => m.charAt(0).toUpperCase() + m.slice(1);

function abrirModificadores(p, alAgregar) {
  const termino = p.modificadores.filter((m) => m.startsWith('término'));
  const extras = p.modificadores.filter((m) => !m.startsWith('término'));
  const form = document.createElement('form');
  form.className = 'mod-form';
  form.method = 'dialog';
  form.innerHTML = `
    ${dialogoCabecera(p)}
    <div class="mod-body">
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
    alAgregar?.();
  });
}
