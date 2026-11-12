import { brand } from '../config/brand.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Pie del cliente: banda de carbón con marca gigante. Solo se muestra fuera del admin.
export function crearFooter() {
  const el = document.createElement('footer');
  el.className = 'site-footer band band--dark grain';
  el.innerHTML = `
    <div class="container--wide">
      <a class="site-footer__mark" href="#/" aria-label="${esc(brand.nombre)}, ir al inicio">${esc(brand.nombre)}</a>
      <hr class="rule-dotted-gold">
      <div class="site-footer__grid">
        ${brand.sucursales.map((s) => `
        <section aria-label="${esc(s.nombre)}">
          <h2>Sucursal</h2>
          <p><strong>${esc(s.nombre)}</strong>${esc(s.direccion)}</p>
          <p>Horario: ${esc(s.horario.abre)} a ${esc(s.horario.cierra)}</p>
        </section>`).join('')}
        <section aria-label="Contacto y enlaces">
          <h2>Contacto</h2>
          <p><a href="tel:${esc(brand.telefono.replace(/[^+\d]/g, ''))}">${esc(brand.telefono)}</a> (número ficticio)</p>
          <ul>
            <li><a href="#/">Inicio</a></li>
            <li><a href="#/menu">Menú</a></li>
            <li><a href="#/chat">Reservar con el asistente</a></li>
            <li><a href="#/carrito">Su pedido</a></li>
            <li><a href="#/admin/cocina">Entrar como administrador</a></li>
          </ul>
        </section>
      </div>
      <hr class="rule-dotted-gold">
      <p class="site-footer__legal">${esc(brand.nombre)} es un restaurante ficticio. Esta página es una demostración creada por
        <a href="https://panacealogic.dev" target="_blank" rel="noopener">Panacea Logic AI</a>: los platos, precios, direcciones, teléfonos y pedidos son de ejemplo y no se procesa ninguna información real.</p>
    </div>`;
  return el;
}
