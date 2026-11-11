import { store } from '../core/app-store.js';
import { brand } from '../config/brand.js';
import { reiniciarDemo } from '../ui/reiniciar.js';
import { el, esc } from '../ui/dom.js';

const NAV = [
  { ruta: 'admin-cocina', href: '#/admin/cocina', texto: 'Cocina' },
  { ruta: 'admin-reservas', href: '#/admin/reservas', texto: 'Reservas' },
  { ruta: 'admin-menu', href: '#/admin/menu', texto: 'Menú' },
  { ruta: 'admin-indicadores', href: '#/admin/indicadores', texto: 'Indicadores' },
];

// Marco del administrador: navegación, selector de sucursal (persistido en ui.sucursalAdmin) y
// botón para volver al cliente. `content(contenedor)` puede devolver una función de limpieza.
// Devuelve la limpieza total (el router la llama al salir de la ruta).
export function adminShell(content, route) {
  const main = document.querySelector('main.vista') || document.querySelector('main');
  main.innerHTML = '';
  const sucursales = store.get().sucursales;
  if (!sucursales.some((s) => s.id === store.get().ui.sucursalAdmin)) {
    store.update((s) => { s.ui.sucursalAdmin = sucursales[0].id; });
  }

  const corto = (n) => n.replace(/^Plato & Co\.\s*/, '') || n;
  const marco = el(`
    <div class="adm${route === 'admin-cocina' ? ' adm--cocina on-dark' : ''}">
      <header class="adm-barra">
        <div class="adm-fila">
          <div class="adm-marca">${brand.logoSvg}<span><strong>${esc(brand.nombre)}</strong><small>Administración</small></span></div>
          <div class="adm-suc" role="group" aria-label="Sucursal">
            <span class="adm-suc__etq" aria-hidden="true">Sucursal</span>
            <div class="adm-seg seg" data-seg>${sucursales.map((s) => `<button type="button" data-suc-btn="${esc(s.id)}" aria-pressed="false" aria-label="${esc(s.nombre)}">${esc(corto(s.nombre))}</button>`).join('')}</div>
            <select class="select" data-suc aria-label="Sucursal">${sucursales.map((s) => `<option value="${esc(s.id)}">${esc(s.nombre)}</option>`).join('')}</select>
          </div>
          <div class="adm-acciones">
            <button type="button" class="btn btn--ghost btn--sm adm-reiniciar" data-reiniciar>Reiniciar demo</button>
            <a class="btn btn--sm adm-volver" href="#/">Volver a la vista de cliente</a>
          </div>
        </div>
        <nav class="adm-nav" aria-label="Administración">
          ${NAV.map((n) => `<a href="${n.href}" ${n.ruta === route ? 'aria-current="page"' : ''}>${n.texto}</a>`).join('')}
        </nav>
      </header>
      <div class="adm-contenido" data-contenido></div>
    </div>`);
  main.append(marco);

  marco.querySelector('[data-reiniciar]').addEventListener('click', reiniciarDemo);
  const select = marco.querySelector('[data-suc]');
  select.value = store.get().ui.sucursalAdmin;
  select.addEventListener('change', () => {
    store.update((s) => { s.ui.sucursalAdmin = select.value; });
  });
  const botones = [...marco.querySelectorAll('[data-suc-btn]')];
  const sincronizar = (id) => {
    if (select.value !== id) select.value = id;
    for (const b of botones) b.setAttribute('aria-pressed', String(b.dataset.sucBtn === id));
  };
  sincronizar(store.get().ui.sucursalAdmin);
  for (const b of botones) {
    b.addEventListener('click', () => { store.update((s) => { s.ui.sucursalAdmin = b.dataset.sucBtn; }); });
  }
  const off = store.subscribe((s) => sincronizar(s.ui.sucursalAdmin));

  // Altura de la barra fija: la usan los elementos pegajosos de cada vista (categorías del menú).
  const barra = marco.querySelector('.adm-barra');
  const medir = () => marco.style.setProperty('--adm-h', `${barra.offsetHeight}px`);
  medir();
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(medir) : null;
  ro?.observe(barra);

  const limpiarContenido = content(marco.querySelector('[data-contenido]'));
  return () => { off(); ro?.disconnect(); if (typeof limpiarContenido === 'function') limpiarContenido(); };
}
