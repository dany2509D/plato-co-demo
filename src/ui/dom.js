// Utilidades mínimas de DOM compartidas por las vistas del cliente.
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
// Precio de cara al cliente: «$11.50» (dólar, punto decimal). El bot y el panel usan su propio formato «US$».
export const money = (n) => `$${Number(n).toFixed(2)}`;

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

let toastTimer;
export function toast(mensaje) {
  let r = document.getElementById('toast-region');
  if (!r) {
    r = document.createElement('div');
    r.id = 'toast-region';
    r.className = 'toast-region';
    r.setAttribute('role', 'status');
    r.setAttribute('aria-live', 'polite');
    document.body.append(r);
  }
  r.textContent = '';
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = mensaje;
  r.append(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.remove(); }, 2600);
}

export function irA(hash) { location.hash = hash; }
