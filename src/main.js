import './styles/tokens.css';
import './styles/base.css';
import './styles/client.css';
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
import { getAppBot } from './bot/instance.js';

const TITULOS = {
  inicio: 'Inicio', menu: 'Menú', carrito: 'Su pedido', chat: 'Asistente', pedido: 'Seguimiento de pedido',
  'admin-cocina': 'Cocina', 'admin-reservas': 'Reservas', 'admin-menu': 'Administrar menú', 'admin-indicadores': 'Indicadores',
};

const VISTAS = { inicio: vistaInicio, menu: vistaMenu, carrito: vistaCarrito, pedido: vistaPedido, chat: vistaChat };

const ADMIN = {
  'admin-cocina': adminCocina,
  'admin-reservas': adminReservas,
  'admin-menu': adminMenu,
  'admin-indicadores': (cont) => renderIndicadores(cont, store),
};

getAppBot(store); // registra desde el arranque el aviso de estado de pedidos hacia el chat

const app = document.getElementById('app');
const banner = crearBanner();
app.append(banner);

const header = document.createElement('header');
header.className = 'app-header';
header.innerHTML = `
  <a class="brand" href="#/">${brand.logoSvg}<strong>${brand.nombre.replace('&', '&amp;')}</strong></a>
  <nav class="nav" aria-label="Principal">
    <a href="#/" data-nav="inicio">Inicio</a>
    <a href="#/menu" data-nav="menu">Menú</a>
    <a href="#/chat" data-nav="chat">Reservar</a>
    <a class="btn btn-primario btn-nav" href="#/menu">Pedir</a>
    <a class="nav-carrito" href="#/carrito" data-nav="carrito" aria-label="Carrito, 0 productos">Carrito <span class="nav-cuenta" data-cuenta>0</span></a>
  </nav>`;
const reiniciar = document.createElement('button');
reiniciar.type = 'button';
reiniciar.className = 'btn-reiniciar';
reiniciar.textContent = 'Reiniciar demo';
reiniciar.addEventListener('click', reiniciarDemo);
header.append(reiniciar);
const admin = document.createElement('a');
admin.className = 'btn-admin';
admin.href = '#/admin/cocina';
admin.textContent = 'Entrar como administrador';
header.append(admin);
app.append(header);

const main = document.createElement('main');
main.className = 'vista';
main.tabIndex = -1;
app.append(main);

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

onRouteChange(renderVista);
