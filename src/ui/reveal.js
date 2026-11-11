// Aparece al hacer scroll: marca .reveal -> .is-in con IntersectionObserver. Sin soporte o con
// movimiento reducido, todo queda visible (el CSS solo oculta cuando <html> tiene .rv-ready).
let io = null;
const reducido = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function iniciarReveal(raiz = document) {
  if (!('IntersectionObserver' in window) || reducido()) return;
  document.documentElement.classList.add('rv-ready');
  io ||= new IntersectionObserver((entradas) => {
    for (const e of entradas) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  raiz.querySelectorAll('.reveal:not(.is-in):not([data-rv])').forEach((el) => { el.dataset.rv = '1'; io.observe(el); });
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
