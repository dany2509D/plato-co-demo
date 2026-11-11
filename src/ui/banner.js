export function crearBanner() {
  const el = document.createElement('aside');
  el.className = 'banner-demo';
  el.setAttribute('aria-label', 'Aviso de demostración');
  el.innerHTML = `
    <span>Demo de <a href="https://panacealogic.dev" target="_blank" rel="noopener">Panacea Logic AI</a> · Datos ficticios · No ingrese información real</span>
    <a class="banner-cta" href="https://panacealogic.dev/cuentanos-tu-proyecto" target="_blank" rel="noopener">Agende un diagnóstico gratis de 30 minutos</a>`;
  return el;
}
