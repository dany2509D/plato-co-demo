/**
 * Carga de marca · Plato & Co.
 *   mostrarCarga(contenedor, { texto })  → quitar()   Anillo de plato que gira (estático con movimiento reducido), role="status".
 *   cargaHTML({ texto })                 → string HTML del mismo indicador
 *   esqueletoTarjetas(n = 6)             → string HTML: n tarjetas de foto en gris (tonos del sistema); pulso suave, sin brillo
 *   decidirSplash({ heroListo, ms, yaVisto, espera = 300 })  → 'omitir' | 'esperar' | 'mostrar'   (pura)
 *   iniciarSplash({ min = 0, espera = 300, claveSesion })    → cancelar()   Portada de arranque solo si el héroe no llegó en 300 ms.
 *
 * La portada nunca retrasa el LCP: no se pinta nada antes de `espera`; si el héroe ya cargó, no se pinta jamás.
 */
import { esc } from './dom.js';
import '../styles/momentos.css';

const ANILLO = '<svg class="cg__aro" viewBox="0 0 48 48" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="24" cy="24" r="20" opacity=".35"/><circle cx="24" cy="24" r="13" opacity=".35"/><path class="cg__giro" d="M24 4a20 20 0 0 1 20 20"/></svg>';

export function cargaHTML({ texto = 'Preparando su mesa' } = {}) {
  return `<div class="cg" role="status" aria-live="polite">${ANILLO}<span class="cg__txt">${esc(texto)}</span></div>`;
}

export function mostrarCarga(contenedor, opts = {}) {
  if (!contenedor) return () => {};
  const nodo = document.createElement('div');
  nodo.innerHTML = cargaHTML(opts);
  const el = nodo.firstElementChild;
  contenedor.append(el);
  return () => el.remove();
}

export function esqueletoTarjetas(n = 6) {
  const c = Math.max(1, Math.min(12, Math.trunc(Number(n)) || 1));
  const tarjeta = '<div class="cg-card"><div class="cg-card__foto"></div><div class="cg-card__l cg-card__l--a"></div><div class="cg-card__l cg-card__l--b"></div></div>';
  return `<div class="cg-grid" role="status" aria-busy="true" aria-label="Cargando platos">${tarjeta.repeat(c)}</div>`;
}

export function decidirSplash({ heroListo = false, ms = 0, yaVisto = false, espera = 300 } = {}) {
  if (yaVisto || heroListo) return 'omitir';
  return ms >= espera ? 'mostrar' : 'esperar';
}

export function iniciarSplash({ min = 0, espera = 300, claveSesion = 'plato-splash' } = {}) {
  if (typeof document === 'undefined') return () => {};
  let yaVisto = false;
  try { yaVisto = sessionStorage.getItem(claveSesion) === '1'; } catch { /* sin almacenamiento */ }
  const inicio = performance.now();
  const hero = () => document.querySelector('[data-hero] img, .hero img, .portada-hero img, main img');
  const heroListo = () => { const i = hero(); return !!i && i.complete && i.naturalWidth > 0; };
  let nodo = null; let terminado = false; let t1; let t2;
  const marcar = () => { try { sessionStorage.setItem(claveSesion, '1'); } catch { /* nada */ } };
  const cerrar = () => {
    if (terminado) return;
    terminado = true;
    if (!nodo) return;
    nodo.classList.add('splash--sale');
    const n = nodo; nodo = null;
    setTimeout(() => n.remove(), 320);
  };
  const intentarCerrar = () => {
    const resto = min - (performance.now() - inicio);
    if (resto > 0) { t2 = setTimeout(intentarCerrar, resto); return; }
    cerrar();
  };
  const sondear = () => {
    if (terminado) return;
    if (heroListo()) { intentarCerrar(); return; }
    t2 = setTimeout(sondear, 100);
  };
  t1 = setTimeout(() => {
    const d = decidirSplash({ heroListo: heroListo(), ms: performance.now() - inicio, yaVisto, espera });
    if (d !== 'mostrar') { terminado = true; return; }
    marcar();
    nodo = document.createElement('div');
    nodo.className = 'splash';
    nodo.setAttribute('role', 'status');
    nodo.innerHTML = `${ANILLO}<p class="splash__marca">Plato &amp; Co.</p><span class="sr-only">Cargando</span>`;
    document.body.append(nodo);
    const listo = document.fonts?.ready ?? Promise.resolve();
    listo.then(sondear, sondear);
    setTimeout(cerrar, 4000); // tope de seguridad
  }, espera);
  return () => { terminado = true; clearTimeout(t1); clearTimeout(t2); nodo?.remove(); nodo = null; };
}
