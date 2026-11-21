import { brand } from '../config/brand.js';
import { esc } from './dom.js';
import { icono } from './icons.js';
import { t, tm, copy } from '../config/copy.js';

// Pie del cliente (direccion-v2 §3.10): carbón; 4 columnas con filetes verticales (3 sucursales + contacto),
// logotipo oro ajustado al ancho (--fs-wordmark) y fila legal tras un filete punteado oro. Oculto en el admin.
// Contrato E2E: .site-footer .container--wide (alineado con .app-header__inner a 1440).
export function crearFooter() {
  const el = document.createElement('footer');
  el.className = 'site-footer';
  const corto = (s) => s.nombre.replace(`${brand.nombre} `, '');
  el.innerHTML = `
    <div class="container--wide">
      <div class="site-footer__grid">
        ${brand.sucursales.map((s, i) => `
        <section class="site-footer__col" aria-labelledby="pie-suc-${i}">
          <h2 id="pie-suc-${i}">${esc(corto(s))}</h2>
          <p>${esc(s.direccion)}</p>
          <p>${esc(t('portada.pie.horario', { abre: s.horario.abre, cierra: s.horario.cierra }))}</p>
          <p>${esc(t('portada.pie.entregas', { zonas: s.zonasEntrega.join(', ') }))}</p>
        </section>`).join('')}
        <section class="site-footer__col" aria-labelledby="pie-contacto">
          <h2 id="pie-contacto">${esc(t('portada.pie.contacto'))}</h2>
          <p><a class="btn btn--wa site-footer__wa" href="#/chat">${icono('whatsapp', { tam: 20 })}<span>Pedir por WhatsApp</span></a></p>
          <p><a href="tel:${esc(brand.telefono.replace(/[^+\d]/g, ''))}">${esc(brand.telefono)}</a> <span class="site-footer__nota">${esc(t('portada.pie.telefonoNota'))}</span></p>
          <ul>
            <li><a href="#/menu">${esc(t('nav.carta'))}</a></li>
            <li><a href="#/chat">${esc(t('portada.pie.reservarAsistente'))}</a></li>
            <li><a href="#/carrito">${esc(t('nav.suPedido'))}</a></li>
            <li><a href="#/admin/cocina">${esc(t('nav.admin'))}</a></li>
          </ul>
        </section>
      </div>
      <a class="site-footer__mark" href="#/" aria-label="${esc(t('nav.irInicio', { marca: brand.nombre }))}"><span aria-hidden="true">${esc(brand.nombre)}</span></a>
      <hr class="rule">
      <div class="site-footer__legal">
        <p>${esc(tm('portada.pie.legal')).replace(esc(copy.marca.creador), `<a href="https://panacealogic.dev" target="_blank" rel="noopener">${esc(copy.marca.creador)}</a>`)}</p>
        <p>${esc(t('portada.pie.fotos'))}</p>
      </div>
    </div>`;
  return el;
}
