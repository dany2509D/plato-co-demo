import { brand } from '../config/brand.js';
import { diaPanama, etiquetaDia, formatHora, horaMensaje, segmentos } from '../core/chat-view.js';

// Teléfono simulado estilo WhatsApp. Solo dibuja: el estado vive en el store (ver views/chat.js).
// Todo texto (cliente, bot, IA, nombres de archivo) entra con textContent, nunca como HTML.
// API: phone(container, {onSend, onHandoff, onAttach}) -> {push, setTyping, setBusy, clear, showPending,
//   clearPending, focus, destroy}
const SVG_CLIP = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16.5 6.5v9.2a4.5 4.5 0 0 1-9 0V5.8a3 3 0 0 1 6 0v9.4a1.5 1.5 0 0 1-3 0V7h-1.5v8.2a3 3 0 0 0 6 0V5.8a4.5 4.5 0 0 0-9 0v9.9a6 6 0 0 0 12 0V6.5z"/></svg>';
const SVG_SEND = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3 20.5v-6.7l9-1.8-9-1.8V3.5L22 12z"/></svg>';
const SVG_FILE = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6 2h8l6 6v14H6zm7 1.5V9h5.5z"/></svg>';

function h(tag, cls, texto) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (texto != null) n.textContent = texto;
  return n;
}

function rellenarTexto(nodo, texto) {
  for (const s of segmentos(texto)) {
    if (s.t === 'negrita') nodo.append(h('strong', '', s.v));
    else nodo.append(document.createTextNode(s.v));
  }
}

const reducido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function phone(container, { onSend, onHandoff, onAttach } = {}) {
  const raiz = h('div', 'tel');
  raiz.innerHTML = `
    <div class="tel-marco">
      <div class="tel-notch" aria-hidden="true"><span class="tel-bocina"></span><span class="tel-camara"></span></div>
      <div class="tel-pantalla">
        <div class="tel-estado" aria-hidden="true"><span data-reloj></span><span class="tel-estado-ic">5G ▂▄▆ ▮</span></div>
        <header class="tel-cab">
          <span class="tel-avatar">${brand.logoSvg.replace(' role="img" aria-label="Plato &amp; Co."', ' aria-hidden="true"')}</span>
          <span class="tel-quien"><strong class="tel-nombre"></strong><small class="tel-linea">en línea</small></span>
        </header>
        <p class="tel-equipo"><span>Una persona del equipo revisa los casos importantes</span><button type="button" class="tel-humano" data-humano>Pasar a una persona</button></p>
        <div class="tel-log" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversación con Plato &amp; Co." tabindex="0"></div>
        <form class="tel-compositor" autocomplete="off">
          <button type="button" class="tel-ic" data-adjuntar aria-label="Adjuntar una imagen o un PDF">${SVG_CLIP}</button>
          <input type="file" class="sr-only" data-archivo accept="image/*,application/pdf" tabindex="-1" aria-hidden="true">
          <label class="sr-only" for="tel-texto">Escriba su mensaje</label>
          <input id="tel-texto" class="tel-texto" type="text" name="mensaje" placeholder="Escriba un mensaje" maxlength="500" enterkeyhint="send" autocapitalize="sentences">
          <button type="submit" class="tel-enviar" aria-label="Enviar mensaje">${SVG_SEND}</button>
        </form>
      </div>
    </div>`;
  raiz.querySelector('.tel-nombre').textContent = brand.nombre;
  container.append(raiz);

  const q = (s) => raiz.querySelector(s);
  const log = q('.tel-log');
  const form = q('.tel-compositor');
  const input = q('.tel-texto');
  const reloj = q('[data-reloj]');
  const btnEnviar = q('.tel-enviar');
  const btnHumano = q('[data-humano]');
  const btnAdj = q('[data-adjuntar]');
  const archivo = q('[data-archivo]');

  let ultimoDia = '';
  let ticks = [];
  let escribiendo = null;
  let pendiente = null;
  let ocupado = false;

  const hora = () => { reloj.textContent = formatHora(new Date().toISOString()); };
  hora();
  const timerReloj = setInterval(hora, 30000);

  function bajar() {
    const fin = () => { log.scrollTop = log.scrollHeight; };
    fin();
    if (!reducido()) requestAnimationFrame(fin);
  }

  function quitarRapidos() { log.querySelectorAll('.tel-rapidos').forEach((n) => n.remove()); }
  function sacarEscribiendo() { escribiendo?.remove(); }

  function separadorDia(msg) {
    const iso = msg.en || new Date().toISOString();
    const dia = diaPanama(iso);
    if (dia && dia !== ultimoDia) {
      ultimoDia = dia;
      const sep = h('div', 'tel-dia');
      sep.append(h('span', '', etiquetaDia(dia, new Date().toISOString())));
      log.insertBefore(sep, escribiendo?.parentNode === log ? escribiendo : null);
    }
  }

  function burbuja(msg, { pendiente: esPend = false } = {}) {
    const propio = msg.de === 'cliente';
    const fila = h('div', `tel-fila ${propio ? 'tel-propio' : 'tel-bot'}`);
    const b = h('div', 'tel-burbuja');
    const quien = h('span', 'sr-only', propio ? 'Usted: ' : 'Plato & Co.: ');
    b.append(quien);
    if (msg.adjunto) {
      const adj = h('div', 'tel-adjunto');
      const ic = h('span', 'tel-adjunto-ic');
      ic.innerHTML = SVG_FILE;
      const nom = h('span', 'tel-adjunto-nombre', msg.adjunto.nombre);
      const tipo = h('small', '', msg.adjunto.tipo === 'pdf' ? 'Documento PDF' : 'Imagen');
      const col = h('span', 'tel-adjunto-col');
      col.append(nom, tipo);
      adj.append(ic, col);
      b.append(adj);
    } else {
      const t = h('span', 'tel-texto-msg');
      rellenarTexto(t, msg.texto);
      b.append(t);
    }
    const pie = h('span', 'tel-pie');
    pie.append(h('time', '', esPend ? '' : horaMensaje(msg)));
    if (propio) {
      const c = h('span', `tel-check${esPend ? ' tel-check-env' : ''}`, esPend ? '✓' : '✓✓');
      c.setAttribute('aria-label', esPend ? 'Enviando' : 'Entregado');
      if (!esPend) ticks.push(c);
      pie.append(c);
    }
    b.append(pie);
    fila.append(b);
    return fila;
  }

  function marcarLeidos() {
    for (const c of ticks) { c.classList.add('tel-leido'); c.setAttribute('aria-label', 'Leído'); }
    ticks = [];
  }

  function push(msg) {
    quitarRapidos();
    separadorDia(msg);
    const fila = burbuja(msg);
    log.insertBefore(fila, escribiendo?.parentNode === log ? escribiendo : null);
    if (msg.de === 'bot') marcarLeidos();
    if (msg.de === 'bot' && Array.isArray(msg.botones) && msg.botones.length) {
      const r = h('div', 'tel-rapidos');
      r.setAttribute('role', 'group');
      r.setAttribute('aria-label', 'Respuestas rápidas');
      for (const t of msg.botones) {
        const b = h('button', 'tel-rapido', String(t));
        b.type = 'button';
        b.disabled = ocupado;
        b.addEventListener('click', () => { if (!ocupado) onSend?.(String(t)); });
        r.append(b);
      }
      log.insertBefore(r, escribiendo?.parentNode === log ? escribiendo : null);
    }
    bajar();
  }

  function setTyping(on) {
    if (on && !escribiendo?.parentNode) {
      escribiendo = h('div', 'tel-fila tel-bot tel-escribiendo');
      escribiendo.setAttribute('aria-hidden', 'true');
      const b = h('div', 'tel-burbuja');
      b.append(h('span', 'tel-punto'), h('span', 'tel-punto'), h('span', 'tel-punto'), h('span', 'tel-escr-txt', 'escribiendo…'));
      escribiendo.append(b);
      log.append(escribiendo);
      q('.tel-linea').textContent = 'escribiendo…';
      bajar();
    } else if (!on) {
      sacarEscribiendo();
      q('.tel-linea').textContent = 'en línea';
    }
  }

  function setBusy(b) {
    ocupado = b;
    input.disabled = b;
    btnEnviar.disabled = b;
    btnAdj.disabled = b;
    btnHumano.disabled = b;
    log.querySelectorAll('.tel-rapido').forEach((x) => { x.disabled = b; });
    raiz.classList.toggle('tel-ocupado', b);
    log.setAttribute('aria-busy', b ? 'true' : 'false');
  }

  function showPending(texto) {
    clearPending();
    pendiente = burbuja({ de: 'cliente', texto }, { pendiente: true });
    pendiente.classList.add('tel-pendiente');
    pendiente.setAttribute('aria-hidden', 'true');
    log.insertBefore(pendiente, escribiendo?.parentNode === log ? escribiendo : null);
    bajar();
  }
  function clearPending() { pendiente?.remove(); pendiente = null; }

  function clear() {
    log.innerHTML = '';
    ultimoDia = '';
    ticks = [];
    escribiendo = null;
    pendiente = null;
  }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const t = input.value.trim();
    if (!t || ocupado) return;
    input.value = '';
    onSend?.(t);
  });
  btnHumano.addEventListener('click', () => { if (!ocupado) onHandoff?.(); });
  btnAdj.addEventListener('click', () => archivo.click());
  archivo.addEventListener('change', () => {
    const f = archivo.files?.[0];
    archivo.value = '';
    if (!f || ocupado) return;
    const pdf = /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name);
    onAttach?.({ nombre: String(f.name).slice(0, 80), tipo: pdf ? 'pdf' : 'imagen' });
  });

  return {
    el: raiz, push, setTyping, setBusy, clear, showPending, clearPending,
    focus: () => { if (!input.disabled) input.focus({ preventScroll: true }); },
    destroy: () => { clearInterval(timerReloj); raiz.remove(); },
  };
}

