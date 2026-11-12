import { el, esc } from './dom.js';
import { estadoSucursal } from '../core/horario.js';

const corto = (s) => s.nombre.replace('Plato & Co. ', '');
const eta = (s) => `${s.etaBaseMin}–${s.etaBaseMin + 10}`;

// Selector de sucursal (radios nativos: flechas para cambiar). Recuerda la elección en state.ui.sucursalCliente.
// variante: 'filas' (portada, editorial), 'pildoras' (menú, compacto) o 'tarjetas' (retiro en el pago).
export function branchPicker(store, onChange, { variante = 'tarjetas', leyenda = '¿En qué sucursal quiere pedir?' } = {}) {
  const actual = store.get().ui.sucursalCliente;
  const ahora = new Date();
  const opciones = store.get().sucursales.map((s, i) => {
    const st = estadoSucursal(s.horario, ahora);
    const input = `<input type="radio" name="sucursal-cliente" value="${esc(s.id)}" ${s.id === actual ? 'checked' : ''}>`;
    const estado = `<span class="suc-estado${st.abierto ? ' is-abierto' : ''}">${esc(st.etiqueta)}${st.detalle ? `<span>${esc(st.cierraPronto ? `Cierra pronto (${s.horario.cierra})` : st.detalle)}</span>` : ''}</span>`;
    if (variante === 'pildoras') {
      return `<label class="suc-pill">${input}<span>${esc(corto(s))}<small>${st.abierto ? 'Abierto' : 'Cerrado'}</small></span></label>`;
    }
    if (variante === 'filas') {
      return `<label class="suc-fila">${input}
        <span class="suc-fila__n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <span class="suc-fila__nombre">${esc(corto(s))}</span>
        <span class="suc-fila__datos"><span>${esc(s.direccion)}</span><span>Hoy de ${esc(s.horario.abre)} a ${esc(s.horario.cierra)}</span></span>
        ${estado}
        <span class="suc-fila__eta"><b>${eta(s)}</b> min<small>entrega aprox.</small></span>
        <span class="suc-fila__marca"><span class="si">✓ Su sucursal</span><span class="no">Elegir</span></span>
      </label>`;
    }
    return `<label class="suc-tarjeta">${input}<span class="suc-tarjeta__in">
        <strong>${esc(corto(s))}</strong>
        <span>${esc(s.direccion)}</span>
        <span>Hoy de ${esc(s.horario.abre)} a ${esc(s.horario.cierra)}</span>
        ${estado}
      </span></label>`;
  }).join('');
  const nodo = el(`
    <fieldset class="branch-picker branch-picker--${variante}">
      <legend class="${variante === 'tarjetas' ? 'label' : 'sr-only'}">${esc(leyenda)}</legend>
      <div class="suc-grupo">${opciones}</div>
    </fieldset>`);
  nodo.addEventListener('change', (e) => {
    if (e.target.name !== 'sucursal-cliente') return;
    store.update((s) => { s.ui.sucursalCliente = e.target.value; });
    onChange?.(e.target.value);
  });
  return nodo;
}
