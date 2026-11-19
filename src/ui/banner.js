// Banner de demostración (BASE-RNF-04): una línea de 28 px, no pegajoso (direccion-v2 §3.9).
// Escritorio: frase completa + enlaces. Celular (< 600 px): «Demo · datos ficticios · Agendar diagnóstico →» con
// elipsis; la frase completa sigue disponible para lectores de pantalla (texto visualmente oculto).
const WEB = 'https://panacealogic.dev';
const DIAGNOSTICO = 'https://panacealogic.dev/cuentanos-tu-proyecto';

export function crearBanner() {
  const el = document.createElement('aside');
  el.className = 'banner-demo';
  el.setAttribute('aria-label', 'Aviso de demostración');
  el.innerHTML = `
    <p class="banner-demo__l">
      <span>Demo de <a href="${WEB}" target="_blank" rel="noopener">Panacea Logic AI</a> · Datos ficticios · No ingrese información real</span>
      <a class="banner-cta" href="${DIAGNOSTICO}" target="_blank" rel="noopener">Agende un diagnóstico gratis de 15 minutos <span aria-hidden="true">→</span></a>
    </p>
    <p class="banner-demo__c">
      <a href="${WEB}" target="_blank" rel="noopener"><span aria-hidden="true">Demo</span><span class="sr-only">Demo de Panacea Logic AI</span></a><span aria-hidden="true"> · datos ficticios · </span><span class="sr-only">· Datos ficticios · No ingrese información real ·</span><a class="banner-cta" href="${DIAGNOSTICO}" target="_blank" rel="noopener">Agendar diagnóstico<span class="sr-only"> gratis de 15 minutos</span> <span aria-hidden="true">→</span></a>
    </p>`;
  return el;
}
