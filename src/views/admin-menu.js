import { store } from '../core/app-store.js';
import { setAvailable, setPrice } from '../core/menu.js';
import { adminMenuGroups, countAgotados, categoriasDe, parsePrecio } from '../core/menu-admin.js';
import { badgesHTML } from '../ui/product-card.js';
import { esc } from '../ui/dom.js';

const MSG_PRECIO = 'Escriba un precio mayor que 0, por ejemplo 8.95';

export function adminMenu(cont) {
  cont.innerHTML = `
    <section class="mn" aria-labelledby="mn-titulo">
      <div class="gs-cab"><h1 id="mn-titulo">Administrar menú</h1><p class="gs-sub" data-sub></p></div>
      <div class="mn-barra">
        <p class="mn-cuenta" data-cuenta role="status" aria-live="polite"></p>
        <label class="gs-campo mn-buscar"><span>Buscar plato</span><input type="search" data-buscar placeholder="Ej.: hamburguesa" autocomplete="off"></label>
      </div>
      <div class="mn-chips" role="group" aria-label="Filtrar por categoría" data-chips></div>
      <div data-grupos></div>
    </section>`;
  const q = (s) => cont.querySelector(s);
  const ui = { sucursalId: null, texto: '', categoria: '', soloAgotados: false, errores: {} };

  function chip(valor, texto, activo, attr = 'data-cat') {
    return `<button type="button" class="mn-chip" ${attr}="${esc(valor)}" aria-pressed="${activo}">${esc(texto)}</button>`;
  }

  function pintar() {
    const state = store.get();
    const suc = state.sucursales.find((s) => s.id === state.ui.sucursalAdmin) || state.sucursales[0];
    if (ui.sucursalId !== suc.id) { ui.sucursalId = suc.id; ui.errores = {}; }
    const act = document.activeElement;
    const foco = cont.contains(act) ? (act.dataset.precio ? `[data-precio="${CSS.escape(act.dataset.precio)}"]` : act.dataset.agotado ? `[data-agotado="${CSS.escape(act.dataset.agotado)}"]` : null) : null;
    const y = window.scrollY;

    const n = countAgotados(state, suc.id);
    q('[data-sub]').textContent = `${suc.nombre} · los cambios se ven al instante en el menú del cliente`;
    q('[data-cuenta]').innerHTML = `<strong>${n}</strong> ${n === 1 ? 'plato agotado' : 'platos agotados'} en esta sucursal`;
    q('[data-chips]').innerHTML = chip('', 'Todas', !ui.categoria && !ui.soloAgotados)
      + categoriasDe(state).map((c) => chip(c, c, ui.categoria === c)).join('')
      + chip('1', `Solo agotados (${n})`, ui.soloAgotados, 'data-solo');

    const grupos = adminMenuGroups(state, suc.id, ui);
    q('[data-grupos]').innerHTML = grupos.length ? grupos.map((g) => `
      <section class="mn-grupo" aria-label="${esc(g.categoria)}">
        <h2>${esc(g.categoria)} <span class="gs-n">${g.productos.length}</span></h2>
        <ul class="mn-lista">${g.productos.map((p) => {
    const err = ui.errores[p.id];
    const valor = err ? err.valor : Number(p.precio).toFixed(2);
    return `<li class="mn-item${p.agotado ? ' mn-agotado' : ''}">
            <div class="mn-info">
              <h3>${esc(p.nombre)}</h3>
              <div class="mn-badges">${badgesHTML(p)}</div>
            </div>
            <div class="mn-precio">
              <label for="pr-${esc(p.id)}">Precio (US$)<span class="sr-only"> de ${esc(p.nombre)}</span></label>
              <input id="pr-${esc(p.id)}" type="number" step="0.01" min="0.01" inputmode="decimal" data-precio="${esc(p.id)}" value="${esc(valor)}"
                ${err ? `aria-invalid="true" aria-describedby="pe-${esc(p.id)}"` : ''}>
              ${err ? `<p class="gs-error mn-err" id="pe-${esc(p.id)}" role="alert">${MSG_PRECIO}</p>` : ''}
            </div>
            <button type="button" class="mn-switch" data-agotado="${esc(p.id)}" aria-pressed="${p.agotado}" aria-label="Marcar agotado: ${esc(p.nombre)}">
              <span class="mn-knob" aria-hidden="true">${p.agotado ? '✕' : '✓'}</span>
              <span>${p.agotado ? 'Agotado' : 'Disponible'}</span>
            </button>
          </li>`;
  }).join('')}</ul>
      </section>`).join('') : '<p class="gs-vacio">No hay platos que coincidan con la búsqueda.</p>';

    if (foco) q(foco)?.focus({ preventScroll: true });
    if (window.scrollY !== y) window.scrollTo(0, y);
  }

  function guardarPrecio(input) {
    const id = input.dataset.precio;
    const precio = parsePrecio(input.value);
    if (precio === null) ui.errores[id] = { valor: input.value };
    else {
      delete ui.errores[id];
      const actual = store.get().productos.find((p) => p.id === id)?.precio;
      if (precio !== actual) setPrice(store, id, precio);
    }
    pintar();
  }

  cont.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-agotado]');
    if (a) {
      setAvailable(store, a.dataset.agotado, ui.sucursalId, a.getAttribute('aria-pressed') === 'true');
      return;
    }
    const c = ev.target.closest('[data-cat]');
    if (c) { ui.categoria = c.dataset.cat; ui.soloAgotados = false; pintar(); return; }
    if (ev.target.closest('[data-solo]')) { ui.soloAgotados = !ui.soloAgotados; ui.categoria = ''; pintar(); }
  });
  cont.addEventListener('change', (ev) => {
    if (ev.target.matches('[data-precio]')) guardarPrecio(ev.target);
  });
  cont.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && ev.target.matches('[data-precio]')) { ev.preventDefault(); guardarPrecio(ev.target); }
  });
  q('[data-buscar]').addEventListener('input', (ev) => { ui.texto = ev.target.value; pintar(); });

  pintar();
  // No se repinta mientras se escribe un precio, para no pisar lo que la persona está tecleando.
  const offSub = store.subscribe(() => { if (!document.activeElement?.matches?.('[data-precio]')) pintar(); });
  return () => { offSub(); };
}
