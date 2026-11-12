import { brand } from '../config/brand.js';
import { esc } from './dom.js';

// Pie del cliente (direccion-v2 §3.10): carbón; 4 columnas con filetes verticales (3 sucursales + contacto),
// logotipo oro ajustado al ancho (--fs-wordmark) y fila legal tras un filete punteado oro. Oculto en el admin.
// Contrato E2E: .site-footer .container--wide (alineado con .app-header__inner a 1440).
export function crearFooter() {
  const el = document.createElement('footer');
  el.className = 'site-footer band band--dark';
  const corto = (s) => s.nombre.replace(`${brand.nombre} `, '');
  el.innerHTML = `
    <div class="container--wide">
      <div class="site-footer__grid">
        ${brand.sucursales.map((s, i) => `
        <section class="site-footer__col" aria-labelledby="pie-suc-${i}">
          <h2 id="pie-suc-${i}"><span aria-hidden="true">${String(i + 1).padStart(2, '0')} · </span>${esc(corto(s))}</h2>
          <p>${esc(s.direccion)}</p>
          <p>Todos los días, ${esc(s.horario.abre)} a ${esc(s.horario.cierra)}</p>
          <p>Entregas en ${esc(s.zonasEntrega.join(', '))}</p>
        </section>`).join('')}
        <section class="site-footer__col" aria-labelledby="pie-contacto">
          <h2 id="pie-contacto">Contacto</h2>
          <p><a href="tel:${esc(brand.telefono.replace(/[^+\d]/g, ''))}">${esc(brand.telefono)}</a> <span class="site-footer__nota">(número ficticio)</span></p>
          <ul>
            <li><a href="#/menu">Menú</a></li>
            <li><a href="#/chat">Reservar con el asistente</a></li>
            <li><a href="#/carrito">Su pedido</a></li>
            <li><a href="#/admin/cocina">Entrar como administrador</a></li>
          </ul>
        </section>
      </div>
      <a class="site-footer__mark" href="#/" aria-label="${esc(brand.nombre)}, ir al inicio"><span aria-hidden="true">${esc(brand.nombre)}</span></a>
      <hr class="rule-dotted-gold">
      <div class="site-footer__legal">
        <p>${esc(brand.nombre)} es un restaurante ficticio. Esta página es una demostración creada por
          <a href="https://panacealogic.dev" target="_blank" rel="noopener">Panacea Logic AI</a>: los platos, precios, direcciones, teléfonos, reseñas y pedidos son de ejemplo y no se procesa ninguna información real.</p>
        <p>Fotografías: Unsplash (licencia Unsplash).</p>
      </div>
    </div>`;
  return el;
}
