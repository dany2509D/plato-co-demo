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

// Tarjeta "Próximamente" para las secciones que llegan en tareas posteriores.
export function proximamente(titulo, texto) {
  return (cont) => {
    cont.innerHTML = `<section class="adm-proximamente"><h1>${esc(titulo)}</h1><p>${esc(texto)}</p><p class="adm-suave">Esta sección estará disponible muy pronto en la demo.</p></section>`;
  };
}

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

  const marco = el(`
    <div class="adm">
      <div class="adm-barra">
        <div class="adm-marca">${brand.logoSvg}<span><strong>${esc(brand.nombre)}</strong><small>Administración</small></span></div>
        <label class="adm-suc"><span>Sucursal</span>
          <select data-suc>${sucursales.map((s) => `<option value="${esc(s.id)}">${esc(s.nombre)}</option>`).join('')}</select>
        </label>
        <nav class="adm-nav" aria-label="Administración">
          ${NAV.map((n) => `<a href="${n.href}" ${n.ruta === route ? 'aria-current="page"' : ''}>${n.texto}</a>`).join('')}
        </nav>
        <a class="adm-volver" href="#/">Volver a la vista de cliente</a>
        <button type="button" class="adm-volver adm-reiniciar" data-reiniciar>Reiniciar demo</button>
      </div>
      <div class="adm-contenido" data-contenido></div>
    </div>`);
  main.append(marco);

  marco.querySelector('[data-reiniciar]').addEventListener('click', reiniciarDemo);
  const select = marco.querySelector('[data-suc]');
  select.value = store.get().ui.sucursalAdmin;
  select.addEventListener('change', () => {
    store.update((s) => { s.ui.sucursalAdmin = select.value; });
  });
  const off = store.subscribe((s) => { if (select.value !== s.ui.sucursalAdmin) select.value = s.ui.sucursalAdmin; });

  const limpiarContenido = content(marco.querySelector('[data-contenido]'));
  return () => { off(); if (typeof limpiarContenido === 'function') limpiarContenido(); };
}
