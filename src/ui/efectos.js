// Efectos adaptados de componentes de 21st.dev (MIT, https://github.com/serafimcloud/21st), reescritos en JS sin
// React ni Tailwind para el estilo «libro de cocina» de esta demo. Ver docs/design/ATTRIBUTIONS.md.
//   · textMorph   ← TextMorph   (letras que se transforman de una palabra a la siguiente)
//   · TextShimmer, HeroPill, Skeleton y ShimmerButton son solo CSS: ver la sección «21st» de motion.css.

const reducido = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Letras comunes en la misma posición se quedan quietas; las demás salen hacia arriba y entran desde abajo, en
 * cascada. Pura: devuelve qué índice se conserva (true) y cuál cambia (false) entre `de` y `a`.
 */
export function letrasQueSeQuedan(de, a) {
  return Array.from(a, (ch, i) => de[i] === ch);
}

/**
 * Rota `palabras` dentro de `el` cada `intervalo` ms con un morph letra a letra. El texto accesible es fijo (la lista
 * completa en .sr-only, fuera de `el`): un lector de pantalla no oye cada cambio. Devuelve la función de limpieza.
 */
export function textMorph(el, palabras, { intervalo = 2600 } = {}) {
  if (!el || !palabras?.length) return () => {};
  let i = 0;
  const pintar = (palabra, previa = '') => {
    const quedan = letrasQueSeQuedan(previa, palabra);
    let n = 0;
    el.innerHTML = Array.from(palabra, (ch, k) => {
      const nueva = !quedan[k];
      const d = nueva ? n++ : 0;
      return `<span class="tm-l${nueva ? ' tm-l--entra' : ''}" style="--d:${d}">${ch === ' ' ? '&nbsp;' : ch.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}</span>`;
    }).join('');
  };
  pintar(palabras[0]);
  if (palabras.length < 2 || reducido()) return () => {};

  let t = 0;
  const siguiente = () => {
    if (document.hidden) { t = setTimeout(siguiente, intervalo); return; }
    const previa = palabras[i];
    i = (i + 1) % palabras.length;
    // salida: las letras que cambian suben y se desvanecen; luego entra la palabra nueva
    const quedan = letrasQueSeQuedan(palabras[i], previa);
    let n = 0;
    el.querySelectorAll('.tm-l').forEach((s, k) => { if (!quedan[k]) { s.style.setProperty('--d', n++); s.classList.add('tm-l--sale'); } });
    t = setTimeout(() => { pintar(palabras[i], previa); t = setTimeout(siguiente, intervalo); }, 260 + n * 18);
  };
  t = setTimeout(siguiente, intervalo);
  return () => clearTimeout(t);
}
