import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/client.css';
import './styles/carta.css';
import './styles/portada.css';
import './styles/admin.css';
import './styles/kitchen.css';
import './styles/gestion.css';
import { brand } from './config/brand.js';
import { crearBanner } from './ui/banner.js';
import { onRouteChange, parseRoute } from './ui/router.js';
import { store } from './core/app-store.js';
import { reiniciarDemo } from './ui/reiniciar.js';
import { cart } from './ui/cart-singleton.js';
import { vistaInicio } from './views/inicio.js';
import { vistaMenu } from './views/menu.js';
import { vistaCarrito } from './views/carrito.js';
import { vistaPedido } from './views/pedido.js';
import { adminShell } from './views/admin-shell.js';
import { adminCocina } from './views/admin-cocina.js';
import { adminReservas } from './views/admin-reservas.js';
import { adminMenu } from './views/admin-menu.js';
import { renderIndicadores } from './views/admin-indicadores.js';
import { vistaChat } from './views/chat.js';
import { vistaEstilo } from './views/estilo.js';
import { crearFooter } from './ui/footer.js';
import { vigilarReveal } from './ui/reveal.js';
import { getAppBot } from './bot/instance.js';
import { montarPresentacion } from './ui/presenter.js';

const TITULOS = {
  inicio: 'Inicio', menu: 'Menú', carrito: 'Su pedido', chat: 'Asistente', estilo: 'Guía de estilo', pedido: 'Seguimiento de pedido',
  'admin-cocina': 'Cocina', 'admin-reservas': 'Reservas', 'admin-menu': 'Administrar menú', 'admin-indicadores': 'Indicadores',
};

const VISTAS = { inicio: vistaInicio, menu: vistaMenu, carrito: vistaCarrito, pedido: vistaPedido, chat: vistaChat, estilo: vistaEstilo };

const ADMIN = {
  'admin-cocina': adminCocina,
  'admin-reservas': adminReservas,
  'admin-menu': adminMenu,
  'admin-indicadores': (cont) => renderIndicadores(cont, store),
};

getAppBot(store); // registra desde el arranque el aviso de estado de pedidos hacia el chat

const app = document.getElementById('app');
const skip = document.createElement('a');
skip.className = 'skip-link';
skip.href = '#contenido';
skip.textContent = 'Saltar al contenido';
skip.addEventListener('click', (e) => { e.preventDefault(); main.focus(); });
app.append(skip);
const banner = crearBanner();
app.append(banner);

const ICONO_BOLSA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';
const header = document.createElement('header');
header.className = 'app-header';
header.innerHTML = `
  <div class="app-header__inner container--wide">
    <a class="brand" href="#/">${brand.logoSvg}<span class="brand__name">${brand.nombre.replace('&', '&amp;')}</span></a>
    <nav class="nav" aria-label="Principal">
      <a href="#/" data-nav="inicio">Inicio</a>
      <a href="#/menu" data-nav="menu">Menú</a>
      <a href="#/chat" data-nav="chat">Asistente</a>
    </nav>
    <div class="app-header__cta">
      <a class="btn btn--ghost btn--sm" href="#/chat">Reservar</a>
      <a class="btn btn--sm" href="#/menu">Pedir</a>
      <a class="btn btn--ghost btn--sm nav-carrito" href="#/carrito" data-nav="carrito" aria-label="Carrito, 0 productos">${ICONO_BOLSA}<span class="nav-cuenta" data-cuenta>0</span></a>
    </div>
    <div class="app-header__util"></div>
  </div>`;
const util = header.querySelector('.app-header__util');
const reiniciar = document.createElement('button');
reiniciar.type = 'button';
reiniciar.className = 'btn btn--text btn--sm btn-reiniciar';
reiniciar.textContent = 'Reiniciar demo';
reiniciar.addEventListener('click', reiniciarDemo);
const admin = document.createElement('a');
admin.className = 'btn btn--ghost btn--sm btn-admin';
admin.href = '#/admin/cocina';
admin.textContent = 'Entrar como administrador';
util.append(reiniciar, admin);
app.append(header);

const main = document.createElement('main');
main.className = 'vista';
main.id = 'contenido';
main.tabIndex = -1;
app.append(main);
const footer = crearFooter();
app.append(footer);
vigilarReveal(main);

// Sombra suave de la cabecera solo cuando hay scroll.
let rafScroll = 0;
const marcarScroll = () => { rafScroll = 0; header.classList.toggle('is-scrolled', window.scrollY > 8); };
window.addEventListener('scroll', () => { if (!rafScroll) rafScroll = requestAnimationFrame(marcarScroll); }, { passive: true });

// Alturas de banner y encabezado para los elementos fijos (barra de categorías, anclas).
function medir() {
  const root = document.documentElement.style;
  root.setProperty('--banner-h', `${banner.offsetHeight}px`);
  const sticky = window.matchMedia('(min-width: 900px)').matches;
  root.setProperty('--stick-top', `${banner.offsetHeight + (sticky ? header.offsetHeight : 0)}px`);
}
if ('ResizeObserver' in window) { const ro = new ResizeObserver(medir); ro.observe(banner); ro.observe(header); }
window.addEventListener('resize', medir);
medir();

function pintarCuenta() {
  const n = cart.count();
  header.querySelector('[data-cuenta]').textContent = String(n);
  header.querySelector('.nav-carrito').setAttribute('aria-label', `Carrito, ${n} ${n === 1 ? 'producto' : 'productos'}`);
}
store.subscribe(pintarCuenta);
pintarCuenta();

let limpiar = null;
function renderVista(ruta) {
  limpiar?.();
  limpiar = null;
  const titulo = TITULOS[ruta.name] || 'Inicio';
  main.innerHTML = '';
  main.dataset.ruta = ruta.name;
  document.title = `${titulo} · ${brand.nombre}`;
  header.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === ruta.name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  const esAdmin = ruta.name in ADMIN;
  document.body.classList.toggle('modo-admin', esAdmin);
  footer.hidden = esAdmin;
  const vista = VISTAS[ruta.name];
  if (esAdmin) limpiar = adminShell(ADMIN[ruta.name], ruta.name);
  else if (vista) limpiar = vista(main, ruta.params);
  else {
    const h = document.createElement('h1');
    h.textContent = titulo;
    main.append(h);
  }
  window.scrollTo(0, 0);
}

montarPresentacion(); // botón flotante «Presentación» (modo guiado para reuniones)
onRouteChange(renderVista);
