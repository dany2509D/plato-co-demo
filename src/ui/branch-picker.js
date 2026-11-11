import { el, esc } from './dom.js';

// Selector de sucursal: tarjetas de radio. Recuerda la elección en state.ui.sucursalCliente.
export function branchPicker(store, onChange) {
  const actual = store.get().ui.sucursalCliente;
  const opciones = store.get().sucursales.map((s) => `
    <label class="suc-opcion">
      <input type="radio" name="sucursal-cliente" value="${esc(s.id)}" ${s.id === actual ? 'checked' : ''}>
      <span class="suc-tarjeta">
        <strong>${esc(s.nombre.replace('Plato & Co. ', ''))}</strong>
        <span class="suc-dir">${esc(s.direccion)}</span>
        <span class="suc-hora">Hoy ${esc(s.horario.abre)} – ${esc(s.horario.cierra)}</span>
      </span>
    </label>`).join('');
  const nodo = el(`
    <fieldset class="branch-picker">
      <legend>¿En qué sucursal quiere pedir?</legend>
      <div class="suc-grid">${opciones}</div>
    </fieldset>`);
  nodo.addEventListener('change', (e) => {
    if (e.target.name !== 'sucursal-cliente') return;
    store.update((s) => { s.ui.sucursalCliente = e.target.value; });
    onChange?.(e.target.value);
  });
  return nodo;
}
