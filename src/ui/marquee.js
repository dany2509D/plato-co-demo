// Cinta de platos: botón visible para pausar/reanudar (WCAG 2.2.2) y pausa al tocarla.
// La animación también se detiene al pasar el cursor, con el foco dentro y con «reducir movimiento» (CSS).
export function bindMarquee(root) {
  root.querySelectorAll('.marquee').forEach((m) => {
    if (m.querySelector('[data-marquee-toggle]')) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'marquee__toggle';
    b.dataset.marqueeToggle = '';
    const pintar = (pausada) => {
      b.setAttribute('aria-pressed', String(pausada));
      b.setAttribute('aria-label', pausada ? 'Reanudar cinta de platos' : 'Pausar cinta de platos');
      b.textContent = pausada ? 'Reanudar' : 'Pausar';
      m.classList.toggle('is-paused', pausada);
    };
    pintar(false);
    b.addEventListener('click', () => pintar(b.getAttribute('aria-pressed') !== 'true'));
    // En pantallas táctiles la cinta se detiene mientras se la toca.
    m.addEventListener('touchstart', () => m.classList.add('is-touching'), { passive: true });
    ['touchend', 'touchcancel'].forEach((ev) => m.addEventListener(ev, () => m.classList.remove('is-touching'), { passive: true }));
    m.append(b);
  });
}
