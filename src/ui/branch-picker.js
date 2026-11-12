import { el, esc } from './dom.js';
import { estadoSucursal } from '../core/horario.js';
import { fotoEscena } from './photo.js';

const corto = (s) => s.nombre.replace('Plato & Co. ', '');
const eta = (s) => `${s.etaBaseMin}–${s.etaBaseMin + 10}`;

/**
 * Estado en una línea para la variante con foto: «Abierto · cierra 22:00», «Cierra pronto · 22:00»,
 * «Cerrado · abre hoy 11:00», «Cerrado · abre mañana 11:00». Pura (recibe el resultado de estadoSucursal).
 */
export function estadoCorto(st, horario) {
  if (!st || !horario) return 'Horario no disponible';
  if (st.abierto) return st.cierraPronto ? `Cierra pronto · ${horario.cierra}` : `Abierto · cierra ${horario.cierra}`;
  if (st.etiqueta !== 'Cerrado') return st.etiqueta;
  return `Cerrado · ${st.detalle.replace(/^Abre (hoy|mañana) a las /, 'abre $1 ')}`;
}

// Foto de portada de cada sucursal (hero/sucursal_N); la 1 es fría y luminosa → filtro cálido (§3.4).
const fotoSucursal = (i, { clase = '' } = {}) => fotoEscena(`sucursal_${i + 1}`, { alt: '', ratio: '4/3', clase: [i === 0 ? 'foto--warm' : '', clase].filter(Boolean).join(' ') });

// Selector de sucursal (radios nativos: flechas para cambiar). Recuerda la elección en state.ui.sucursalCliente.
// variante: 'fotos' (portada: columnas con foto), 'filas' (editorial), 'pildoras' (menú, compacto)
// o 'tarjetas' (retiro en el pago, con foto 4:3).
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
    if (variante === 'fotos') {
      return `<label class="suc-foto">${input}
        <span class="suc-foto__media">${fotoSucursal(i, { clase: 'reveal--foto' })}<span class="suc-foto__marca" aria-hidden="true">✓ Su sucursal</span></span>
        <span class="suc-foto__n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <span class="suc-foto__nombre">${esc(corto(s))}</span>
        <span class="suc-foto__dir">${esc(s.direccion)}</span>
        <span class="suc-foto__hor">Hoy de ${esc(s.horario.abre)} a ${esc(s.horario.cierra)}</span>
        <span class="suc-foto__pie">
          <span class="suc-estado suc-estado--corto${st.abierto ? ' is-abierto' : ''}${st.cierraPronto ? ' is-pronto' : ''}">${esc(estadoCorto(st, s.horario))}</span>
          <span class="suc-foto__eta"><b>${eta(s)} min</b> <small>entrega aprox.</small></span>
        </span>
      </label>`;
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
        <span class="suc-tarjeta__foto">${fotoSucursal(i)}</span>
        <strong>${esc(corto(s))}</strong>
        <span>${esc(s.direccion)}</span>
        <span>Hoy de ${esc(s.horario.abre)} a ${esc(s.horario.cierra)}</span>
        ${estado}
      </span></label>`;
  }).join('');
  const nodo = el(`
    <fieldset class="branch-picker branch-picker--${esc(variante)}">
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
