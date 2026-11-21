// Abre contenido en un <dialog> modal (el navegador atrapa el foco y Esc cierra). Devuelve close().
export function abrirDialogo(contenido, { etiqueta, clase = '', onClose } = {}) {
  const prev = document.activeElement;
  const d = document.createElement('dialog');
  d.className = `modal ${clase}`.trim();
  d.setAttribute('aria-label', etiqueta);
  d.append(contenido);
  document.body.append(d);
  const cerrar = () => { if (d.open) d.close(); };
  d.addEventListener('close', () => {
    d.remove();
    if (prev && prev.isConnected) prev.focus();
    onClose?.();
  });
  d.addEventListener('click', (e) => { if (e.target === d) cerrar(); });
  d.showModal();
  return cerrar;
}
