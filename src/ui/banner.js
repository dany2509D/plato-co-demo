// Banner de demostración (BASE-RNF-04): una línea de 28 px, no pegajoso (direccion-v2 §3.9).
// Escritorio: frase completa + enlaces. Celular (< 600 px): «Demo · datos ficticios · Agendar diagnóstico →» con
// elipsis; la frase completa sigue disponible para lectores de pantalla (texto visualmente oculto).
// Textos de la baraja (sistema.banner*): el aviso de demo es OBLIGATORIO y no se reescribe.
import { t, copy } from '../config/copy.js';
import { esc } from './dom.js';

const WEB = 'https://panacealogic.dev';
const DIAGNOSTICO = 'https://panacealogic.dev/cuentanos-tu-proyecto';

export function crearBanner() {
  const creador = copy.marca.creador;
  const frase = esc(t('sistema.bannerDemo'));
  const enlace = `<a href="${WEB}" target="_blank" rel="noopener">${esc(creador)}</a>`;
  const [antes, despues] = frase.split(esc(creador));
  const cola = despues.replace(/^ · /, '');
  const el = document.createElement('aside');
  el.className = 'banner-demo';
  el.setAttribute('aria-label', t('sistema.bannerAria'));
  el.innerHTML = `
    <p class="banner-demo__l">
      <span>${antes}${enlace}${despues}</span>
      <a class="banner-cta" href="${DIAGNOSTICO}" target="_blank" rel="noopener">${esc(t('sistema.bannerCta'))} <span aria-hidden="true">→</span></a>
    </p>
    <p class="banner-demo__c">
      <a href="${WEB}" target="_blank" rel="noopener"><span aria-hidden="true">Demo</span><span class="sr-only">Demo de ${esc(creador)}</span></a><span aria-hidden="true"> · datos ficticios · </span><span class="sr-only">· ${esc(cola)} ·</span><a class="banner-cta" href="${DIAGNOSTICO}" target="_blank" rel="noopener">${esc(t('sistema.bannerCtaCorto'))}<span class="sr-only"> gratis de 15 minutos</span> <span aria-hidden="true">→</span></a>
    </p>`;
  return el;
}
