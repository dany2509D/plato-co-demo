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
import './styles/motion.css';
import './styles/forma.css';
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
import { vistaNoEncontrado } from './views/no-encontrado.js';
import { crearFooter } from './ui/footer.js';
import { vigilarReveal } from './ui/reveal.js';
import { getAppBot } from './bot/instance.js';
import { montarPresentacion, startPresentation } from './ui/presenter.js';
import { crearCabecera, vigilarCabecera } from './ui/cabecera.js';
import { TEMAS, aplicarTokens, guardarTema, temaActivo, temaActivoId } from './config/temas.js';

// Tema de diseño activo (botón «Diseño» del menú Demo): sus tokens CSS se aplican antes de pintar nada.
aplicarTokens(temaActivo());

// Cambiar de diseño reinicia los datos (la carta y las sucursales del tema se siembran al cargar) y recarga la página.
function cambiarTema(id) {
  if (id === temaActivoId() || !TEMAS[id]) return;
  if (!window.confirm(`¿Cambiar al diseño «${TEMAS[id].nombre}»? Se reiniciarán los datos de la demo (carta, pedidos y reservas de ejemplo).`)) return;
  if (!guardarTema(id)) return;
  try { localStorage.removeItem('plato-co-demo:v1'); } catch { /* sin almacenamiento: la recarga siembra igual */ }
  location.hash = '#/';
  location.reload();
}

const TITULOS = {
  inicio: 'Inicio', menu: 'La carta', carrito: 'Su pedido', chat: 'Asistente', estilo: 'Guía de estilo', pedido: 'Seguimiento de pedido',
  'no-encontrado': 'Página no encontrada',
  'admin-cocina': 'Cocina', 'admin-reservas': 'Reservas', 'admin-menu': 'Administrar menú', 'admin-indicadores': 'Indicadores',
};

const VISTAS = { inicio: vistaInicio, menu: vistaMenu, carrito: vistaCarrito, pedido: vistaPedido, chat: vistaChat, estilo: vistaEstilo, 'no-encontrado': vistaNoEncontrado };

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

// Cabecera (bloque B, src/ui/cabecera.js): utilidades de la demo en el menú «Demo ▾» y hoja móvil.
const header = crearCabecera({ alReiniciar: reiniciarDemo, alPresentar: () => startPresentation(), alTema: cambiarTema });
app.append(header);

const main = document.createElement('main');
main.className = 'vista';
main.id = 'contenido';
main.tabIndex = -1;
app.append(main);
const footer = crearFooter();
app.append(footer);
vigilarReveal(main);

// Transparente sobre el héroe → sólida al pasarlo; fija --stick-top / --banner-h para los elementos pegajosos.
vigilarCabecera(header);

let cuentaPrevia = null;
function pintarCuenta() {
  const n = cart.count();
  header.querySelector('[data-cuenta]').textContent = String(n);
  // Rebote del contador cuando sube (motion.css · .is-bump); no al cargar la página.
  const bolsa = header.querySelector('.nav-carrito');
  if (cuentaPrevia !== null && n > cuentaPrevia) { bolsa.classList.remove('is-bump'); void bolsa.offsetWidth; bolsa.classList.add('is-bump'); }
  cuentaPrevia = n;
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
  // Transición de página (motion.css): solo en las vistas del cliente; el panel no se mueve.
  main.classList.remove('vista-entra');
  if (!esAdmin) { void main.offsetWidth; main.classList.add('vista-entra'); }
  window.scrollTo(0, 0);
}

montarPresentacion(); // botón flotante «Presentación» (modo guiado para reuniones)
onRouteChange(renderVista);
