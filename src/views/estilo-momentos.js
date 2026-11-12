import { buildSeed } from '../data/seed.js';
import { ticket, ticketDesdePedido } from '../ui/ticket.js';
import { estadoVacio, TIPOS_VACIO } from '../ui/estados-vacios.js';
import { cargaHTML, esqueletoTarjetas, mostrarCarga } from '../ui/carga.js';
import { toast, cerrarToasts } from '../ui/toast.js';
import { plateProgress } from '../ui/seguimiento-marca.js';
import { vistaNoEncontrado } from './no-encontrado.js';
import { fotoEscena } from '../ui/photo.js';
import { ESTADOS } from '../core/estados.js';

// Sección «Momentos de marca» de la guía #/estilo (bloque M). Se monta al final de vistaEstilo.
export function seccionMomentos(main) {
  const st = buildSeed(new Date());
  const entregado = st.pedidos.find((p) => p.estado === 'Entregado' && p.factura) ?? st.pedidos[0];
  const enCocina = st.pedidos.find((p) => p.estado === 'En cocina') ?? st.pedidos[1];
  const demo = ticket({
    titulo: 'Plato & Co.', codigo: 'PED-052', pie: 'Gracias por pedir por WhatsApp',
    meta: [{ k: 'Fecha', v: '11 nov, 12:41' }, { k: 'Tipo', v: 'Entrega' }, { k: 'Sucursal', v: 'Centro' }, { k: 'Pago', v: 'Yappy' }],
    lineas: [
      { cantidad: 2, nombre: 'Hamburguesa clásica', detalle: 'sin cebolla', precio: 17.9 },
      { cantidad: 1, nombre: 'Papas rústicas', detalle: 'con salsa de la casa', precio: 4.5 },
      { cantidad: 2, nombre: 'Limonada de coco', precio: 6 },
    ],
    totales: { subtotal: 28.4, itbms: 1.99, total: 30.39 },
  });

  const sec = document.createElement('section');
  sec.id = 'eg-momentos';
  sec.innerHTML = `
    <h2>Momentos de marca</h2>
    <p class="t-muted">Lo que hace que se sienta como Plato &amp; Co. y no como una plantilla: el ticket de comanda, los vacíos, la carga, los avisos, el plato que se llena y el 404. Detalle en <code>docs/brand/momentos-de-marca.md</code>.</p>

    <h3>Ticket de comanda</h3>
    <div class="mm-fila">
      <div class="mm-celda">${demo}<p class="t-small t-muted">papel</p></div>
      <div class="mm-celda mm-foto">${fotoEscena('ambiente_parrilla', { ratio: '4/5', alt: '' })}<div class="mm-sobre">${ticket({ titulo: 'Plato & Co.', codigo: 'PED-052', variante: 'oscuro', sello: 'Hecho al momento', meta: [{ k: 'Tipo', v: 'Retiro' }, { k: 'Sucursal', v: 'Centro' }], lineas: [{ cantidad: 2, nombre: 'Hamburguesa clásica', detalle: 'sin cebolla', precio: 17.9 }, { cantidad: 1, nombre: 'Papas rústicas', precio: 4.5 }], totales: { subtotal: 22.4, itbms: 1.57, total: 23.97 }, pie: 'Listo en 15 min' })}</div></div>
      <div class="mm-celda">${ticketDesdePedido(st, entregado, { fotos: true })}<p class="t-small t-muted">desde un pedido entregado, con factura SIMULADA y miniaturas</p></div>
      <div class="mm-celda">${ticketDesdePedido(st, enCocina)}<p class="t-small t-muted">pedido en cocina (sin factura)</p></div>
    </div>
    <div class="cluster"><button class="btn btn--ghost" type="button" data-imprimir>Vista de impresión del ticket</button></div>

    <h3>Estados vacíos</h3>
    <div class="mm-vacios">${TIPOS_VACIO.map((t) => `<div class="mm-vacio"><code>${t}</code>${estadoVacio(t)}</div>`).join('')}</div>
    <div class="band band--dark eg-banda"><div class="mm-vacios">${['en-vivo', 'carrito'].map((t) => estadoVacio(t, { tono: 'oscuro' })).join('')}</div></div>

    <h3>Carga y esqueleto</h3>
    <div class="mm-fila mm-fila--c">
      <div class="mm-celda mm-plana" data-carga>${cargaHTML()}</div>
      <div class="mm-celda mm-ancha">${esqueletoTarjetas(3)}</div>
    </div>
    <p class="t-small t-muted">El anillo gira en 1,1 s (estático con movimiento reducido). El esqueleto pulsa; sin brillo ni degradado.</p>

    <h3>Avisos (toasts)</h3>
    <div class="cluster">
      <button class="btn" type="button" data-toast="ok">Agregado al carrito</button>
      <button class="btn btn--ghost" type="button" data-toast="aviso">Agotado hoy</button>
      <button class="btn btn--ghost" type="button" data-toast="error">Error</button>
      <button class="btn btn--ghost" type="button" data-toast="accion">Con acción (Deshacer)</button>
    </div>
    <p class="t-small t-muted">Abajo al centro, 4 s, se pausan con cursor o foco, Esc cierra, máximo 3.</p>

    <h3>El plato que se llena (seguimiento)</h3>
    <div class="mm-plato">${ESTADOS.map((e) => `<figure>${plateProgress(e, { tam: 120 })}<figcaption>${e}</figcaption></figure>`).join('')}</div>
    <div class="mm-plato mm-plato--g">${['En cocina', 'Entregado'].map((e) => `<figure>${plateProgress(e, { tam: 200 })}<figcaption>${e} · 200 px</figcaption></figure>`).join('')}
      <figure>${plateProgress('Entregado', { tam: 120, retiro: true, animar: false })}<figcaption>Retiro (4 pasos), sin animación</figcaption></figure></div>
    <div class="cluster"><button class="btn btn--ghost" type="button" data-repetir>Repetir la animación</button></div>

    <h3>404</h3>
    <div class="mm-marco" data-404></div>`;
  main.append(sec);

  vistaNoEncontrado(sec.querySelector('[data-404]'));
  sec.querySelector('[data-404] a')?.setAttribute('tabindex', '-1');
  sec.querySelectorAll('[data-404] a').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));
  const msg = { ok: { mensaje: 'Agregamos 1 Hamburguesa clásica al carrito.' }, aviso: { tipo: 'aviso', mensaje: 'Costillas BBQ está agotado hoy en esta sucursal.' }, error: { tipo: 'error', mensaje: 'No pudimos guardar el cambio. Intente de nuevo.' }, accion: { mensaje: 'Quitamos Papas rústicas del carrito.', accion: { texto: 'Deshacer', alClic: () => toast({ mensaje: 'Listo, lo devolvimos.' }) } } };
  sec.querySelectorAll('[data-toast]').forEach((b) => b.addEventListener('click', () => toast(msg[b.dataset.toast])));
  sec.querySelector('[data-imprimir]')?.addEventListener('click', () => window.print());
  sec.querySelector('[data-repetir]')?.addEventListener('click', () => {
    sec.querySelectorAll('.mm-plato svg').forEach((s) => { const c = s.cloneNode(true); s.replaceWith(c); });
  });
  void mostrarCarga; void cerrarToasts;
}
