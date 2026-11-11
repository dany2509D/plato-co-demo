import './styles/tokens.css';
import './styles/base.css';
import { brand } from './config/brand.js';
import { crearBanner } from './ui/banner.js';
import { onRouteChange } from './ui/router.js';

const TITULOS = {
  inicio: 'Inicio', menu: 'Menú', carrito: 'Carrito', chat: 'Asistente', pedido: 'Seguimiento de pedido',
  'admin-cocina': 'Cocina', 'admin-reservas': 'Reservas', 'admin-menu': 'Administrar menú', 'admin-indicadores': 'Indicadores',
};

const app = document.getElementById('app');
app.append(crearBanner());

const header = document.createElement('header');
header.className = 'app-header';
header.innerHTML = `${brand.logoSvg}<strong>${brand.nombre.replace('&', '&amp;')}</strong>`;
app.append(header);

const main = document.createElement('main');
main.className = 'vista';
main.tabIndex = -1;
app.append(main);

function renderVista(ruta) {
  const titulo = TITULOS[ruta.name] || 'Inicio';
  main.innerHTML = '';
  const h = document.createElement('h1');
  h.textContent = titulo;
  main.append(h);
  main.dataset.ruta = ruta.name;
  document.title = `${titulo} · ${brand.nombre}`;
}

onRouteChange(renderVista);
