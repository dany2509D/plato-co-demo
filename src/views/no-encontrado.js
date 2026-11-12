import '../styles/momentos.css';
import { icono } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { tm } from '../config/copy.js';

// Textos de la baraja de W (src/config/copy.js → sistema.noEncontrado) con respaldo local.
const tx = (k, def) => tm('sistema.noEncontrado.' + k) || def;

// Vista 404 de marca. Cableado (lo hace la integración): ver docs/brand/momentos-de-marca.md §Router.
// «404» es el único momento Anton de la página; el 0 es un plato al que le falta un bocado.
const PLATO_MORDIDO = `<svg class="nf__plato" viewBox="0 0 96 120" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
  <path d="M87.06 48.56A42 42 0 1 1 63.44 24.94A18 18 0 0 0 87.06 48.56"/>
  <path d="M77.35 57.85A30 30 0 1 1 54.15 34.65"/>
  <path class="nf__vapor" d="M28 20c-5-6 5-9 0-16M44 18c-5-7 5-11 0-17M60 20c-5-6 5-9 0-16"/></svg>`;

export function vistaNoEncontrado(main) {
  main.innerHTML = `
  <section class="nf container--wide" aria-labelledby="nf-t">
    <p class="nf__num" aria-hidden="true"><span>4</span>${PLATO_MORDIDO}<span>4</span></p>
    <div class="nf__txt">
      <p class="eyebrow">${esc(tx('eyebrow', 'Error 404'))}</p>
      <h1 id="nf-t" class="nf__t">${esc(tx('titulo', 'Esa mesa no está en el salón.'))}</h1>
      <p class="t-lead">${esc(tx('lead', 'El enlace no lleva a ninguna página de Plato & Co. Vuelva al inicio o abra la carta.'))}</p>
      <div class="cluster">
        <a class="btn btn--lg" href="#/menu">${esc(tx('carta', 'Ver la carta'))} ${icono('flecha', { tam: 18 })}</a>
        <a class="btn btn--lg btn--ghost" href="#/">${esc(tx('inicio', 'Volver al inicio'))}</a>
      </div>
    </div>
  </section>`;
  return null;
}
