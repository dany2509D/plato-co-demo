// Aparecer al hacer scroll (direccion-v2 §6). Sin soporte o con movimiento reducido, todo queda visible
// (el CSS solo oculta cuando <html> tiene .rv-ready).
//   .reveal        → sube y aparece (.is-in)
//   .reveal--foto  → revelado con máscara (clip-path + escala interna; estilos en photo.css). Nunca en el héroe.
//   [data-count]   → contador: de 0 al valor en 900 ms (easeOutCubic) al entrar al 50 %. El número animado es un
//                    <span aria-hidden="true">; el valor real está en el DOM desde el inicio (texto .sr-only).
let io = null;
let ioCifras = null;
const reducido = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** easeOutCubic. Pura. */
export const easeOutCubic = (t) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;

/** Cifra con coma decimal y punto de miles (como el resto de la portada: «4,8», «2.140»). Pura. */
export function formatearCifra(valor, decimales = 0) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return '';
  const [ent, dec] = Math.abs(n).toFixed(decimales).split('.');
  const miles = ent.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${n < 0 ? '−' : ''}${miles}${dec ? `,${dec}` : ''}`;
}

/** Valor del contador en el instante `ms` de una animación de `dur` ms hacia `valor`. Pura. */
export function cifraEn(ms, valor, decimales = 0, dur = 900) {
  const v = Number(valor) * easeOutCubic(dur > 0 ? ms / dur : 1);
  const f = 10 ** decimales;
  return formatearCifra(Math.round(v * f) / f, decimales);
}

function contar(el) {
  const valor = Number(el.dataset.count);
  const dec = Number(el.dataset.dec || 0);
  const t0 = performance.now();
  const paso = (t) => {
    const ms = t - t0;
    el.textContent = cifraEn(ms, valor, dec);
    if (ms < 900) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

// .reveal--foto está recortada con clip-path (alto visible 0): Chrome la daría por no intersectada nunca.
// Se observa su contenedor (sin recorte) y se marca la foto.
const fotosDe = new WeakMap();

export function iniciarReveal(raiz = document) {
  if (!('IntersectionObserver' in window) || reducido()) return;
  document.documentElement.classList.add('rv-ready');
  io ||= new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      if (e.target.classList.contains('reveal')) e.target.classList.add('is-in');
      fotosDe.get(e.target)?.forEach((f) => f.classList.add('is-in'));
      fotosDe.delete(e.target);
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  ioCifras ||= new IntersectionObserver((entradas) => {
    for (const e of entradas) if (e.isIntersecting) { ioCifras.unobserve(e.target); contar(e.target); }
  }, { threshold: 0.5 });
  raiz.querySelectorAll('.reveal:not(.is-in):not([data-rv])').forEach((el) => { el.dataset.rv = '1'; io.observe(el); });
  raiz.querySelectorAll('.reveal--foto:not(.is-in):not([data-rv])').forEach((el) => {
    el.dataset.rv = '1';
    const host = el.parentElement || el;
    if (!fotosDe.has(host)) fotosDe.set(host, []);
    fotosDe.get(host).push(el);
    io.observe(host);
  });
  raiz.querySelectorAll('[data-count]:not([data-rv])').forEach((el) => {
    el.dataset.rv = '1';
    el.textContent = formatearCifra(0, Number(el.dataset.dec || 0)); // arranca en 0; el valor real está en .sr-only
    ioCifras.observe(el);
  });
}

// Vigila un contenedor: las vistas pintan de forma asíncrona.
export function vigilarReveal(contenedor) {
  iniciarReveal(contenedor);
  if (!('MutationObserver' in window)) return;
  let pendiente = false;
  new MutationObserver(() => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { pendiente = false; iniciarReveal(contenedor); });
  }).observe(contenedor, { childList: true, subtree: true });
}
