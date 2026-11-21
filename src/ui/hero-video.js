// Héroe con video de cocina (portada). El marco ocupa la pantalla y, al bajar, se encoge hasta quedar como una lámina
// montada sobre el pergamino (motion.css / portada.css leen --p: 0 → 1). Solo transform: barato para el compositor.
//
//  · Sin video (archivo ausente o error): queda la foto del héroe debajo, que además es el LCP.
//  · Movimiento reducido: el video no se reproduce solo (se ve el póster) y el marco no se encoge.
//  · WCAG 2.2.2: contenido en movimiento de más de 5 s → botón para pausar / reanudar, siempre visible.

/** Progreso del encogido (0 → 1) para un héroe de `alto` px con un marco fijo de `visible` px. Pura. */
export function progresoHero(scrollDentro, alto, visible) {
  const recorrido = Math.max(1, alto - visible);
  return Math.min(1, Math.max(0, scrollDentro / recorrido));
}

export function montarHeroVideo(seccion) {
  if (!seccion) return () => {};
  const video = seccion.querySelector('video');
  const boton = seccion.querySelector('[data-video-pausa]');
  const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)');

  // ---- Reproducción ----
  const pintarBoton = () => {
    if (!boton || !video) return;
    const pausado = video.paused;
    boton.setAttribute('aria-pressed', String(pausado));
    boton.querySelector('[data-t]').textContent = pausado ? 'Reproducir video' : 'Pausar video';
    seccion.classList.toggle('is-pausado', pausado);
  };
  if (video) {
    video.addEventListener('error', () => { seccion.classList.add('sin-video'); }, true);
    video.addEventListener('playing', () => seccion.classList.add('video-listo'));
    video.addEventListener('play', pintarBoton);
    video.addEventListener('pause', pintarBoton);
    if (!reducido?.matches) video.play?.().catch(() => pintarBoton());
    else pintarBoton();
  }
  boton?.addEventListener('click', () => {
    if (!video) return;
    if (video.paused) video.play?.().catch(() => {}); else video.pause();
  });

  // ---- Encogido ligado al scroll ----
  let raf = 0;
  const medir = () => {
    raf = 0;
    if (reducido?.matches) { seccion.style.setProperty('--p', '0'); return; }
    const r = seccion.getBoundingClientRect();
    const pin = seccion.querySelector('.c-hero__pin');
    const p = progresoHero(-r.top, r.height, pin ? pin.offsetHeight : window.innerHeight);
    seccion.style.setProperty('--p', p.toFixed(4));
    // Fuera de pantalla no hace falta gastar batería decodificando video.
    if (video && !video.paused && r.bottom < 0) { video.pause(); seccion.dataset.autoPausa = '1'; }
    else if (video && video.paused && seccion.dataset.autoPausa && r.bottom > 0) { delete seccion.dataset.autoPausa; video.play?.().catch(() => {}); }
  };
  const pedir = () => { if (!raf) raf = requestAnimationFrame(medir); };
  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', pedir);
  medir();

  return () => {
    window.removeEventListener('scroll', pedir);
    window.removeEventListener('resize', pedir);
    if (raf) cancelAnimationFrame(raf);
    video?.pause();
  };
}
