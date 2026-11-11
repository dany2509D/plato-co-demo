import '../styles/phone.css';
import { store } from '../core/app-store.js';
import { getAppBot } from '../bot/instance.js';
import { replyWithFallback } from '../bot/ai-adapter.js';
import { horaPanama } from '../bot/datetime.js';
import { SALUDO, mensajesNuevos, retardoEscribiendo } from '../core/chat-view.js';
import { phone } from '../ui/phone.js';
import { livePanel } from '../ui/live-panel.js';

const CONV = 'c-web';
const HUMANO = 'Pasar a una persona';

const getBot = () => getAppBot(store);

function asegurarConversacion() {
  const s = store.get();
  let c = s.conversaciones.find((x) => x.id === CONV);
  if (c?.mensajes.length) return;
  const d = new Date();
  const saludo = { de: 'bot', texto: SALUDO.texto, botones: SALUDO.botones, hora: horaPanama(d), en: d.toISOString() };
  store.update((st) => {
    c = st.conversaciones.find((x) => x.id === CONV);
    if (!c) st.conversaciones.push({ id: CONV, idioma: 'es', mensajes: [saludo], requiereHumano: false, paso: null, slots: {} });
    else c.mensajes.push(saludo);
  });
}

function adjuntar({ nombre, tipo }) {
  const d = new Date();
  const base = { hora: horaPanama(d), en: d.toISOString() };
  const idioma = store.get().conversaciones.find((c) => c.id === CONV)?.idioma;
  const resp = idioma === 'en'
    ? 'Got your file. This demo does not store anything; a person on the team would review it.'
    : 'Recibimos su archivo. En esta demo no se guarda nada; una persona del equipo lo revisaría.';
  store.update((s) => {
    const c = s.conversaciones.find((x) => x.id === CONV);
    c.mensajes.push({ de: 'cliente', texto: `[Archivo adjunto: ${nombre}]`, adjunto: { nombre, tipo }, ...base });
    const d2 = new Date();
    c.mensajes.push({ de: 'bot', texto: resp, hora: horaPanama(d2), en: d2.toISOString() });
  });
}

export function vistaChat(main) {
  asegurarConversacion();
  main.innerHTML = `
    <div class="chat-pag">
      <header class="chat-intro">
        <h1>Pida y reserve por WhatsApp</h1>
        <p>Así atiende el asistente de ${'Plato & Co.'.replace('&', '&amp;')} a un cliente. A la derecha, lo que ve el equipo en el mismo instante.</p>
      </header>
      <div class="chat-cols">
        <div class="chat-col-tel">
          <p class="chat-etq"><span aria-hidden="true">📱</span> Cliente · lo que ve quien escribe</p>
          <div data-tel></div>
          <p class="tel-nota">Chat simulado · No se conecta a WhatsApp real</p>
          <div class="ia-caja">
            <label class="ia-sw"><input type="checkbox" role="switch" data-ia><span class="ia-pista" aria-hidden="true"></span><span>Modo IA real (opcional)</span></label>
            <p class="ia-ayuda" id="ia-ayuda">Si no está disponible, la demo vuelve al modo guion automáticamente.</p>
          </div>
        </div>
        <div class="chat-col-vivo">
          <p class="chat-etq"><span aria-hidden="true">🖥️</span> Panel · lo que ve el restaurante</p>
          <div data-vivo></div>
        </div>
      </div>
    </div>`;
  const q = (s) => main.querySelector(s);
  q('[data-ia]').setAttribute('aria-describedby', 'ia-ayuda');

  let mostrados = 0;
  let corriendo = false;
  let ocupado = false;
  let esperandoIA = false;
  let timer = null;
  let vivo = true;

  const conv = () => store.get().conversaciones.find((c) => c.id === CONV);
  const pantalla = phone(q('[data-tel]'), {
    onSend: (t) => enviar(t),
    onHandoff: () => enviar(HUMANO),
    onAttach: (a) => { if (!ocupado && !corriendo) adjuntar(a); },
  });

  function estado() {
    pantalla.setTyping(corriendo || esperandoIA);
    pantalla.setBusy(corriendo || ocupado);
  }

  // Muestra los mensajes del estado. Los del cliente salen al instante; los del bot, tras "escribiendo…".
  function drenar() {
    if (!vivo || corriendo) return;
    const lista = conv()?.mensajes ?? [];
    const { reiniciar, nuevos } = mensajesNuevos(mostrados, lista);
    if (reiniciar) { pantalla.clear(); mostrados = 0; }
    const pendientes = reiniciar ? lista : nuevos;
    if (!pendientes.length) {
      estado();
      return;
    }
    const sig = pendientes[0];
    if (sig.de === 'cliente' || mostrados === 0) {
      pantalla.clearPending();
      pantalla.push(sig);
      mostrados += 1;
      drenar();
      return;
    }
    corriendo = true;
    estado();
    timer = setTimeout(() => {
      corriendo = false;
      pantalla.push(sig);
      mostrados += 1;
      drenar();
      const a = document.activeElement;
      if (!corriendo && !ocupado && (a === document.body || pantalla.el.contains(a))) pantalla.focus();
    }, retardoEscribiendo(sig.texto));
  }

  async function enviar(texto) {
    const t = String(texto ?? '').trim();
    if (!t || ocupado || corriendo) return;
    ocupado = true;
    const ia = store.get().ui.iaReal === true && t !== HUMANO;
    if (ia) { esperandoIA = true; pantalla.showPending(t); }
    estado();
    try {
      if (t === HUMANO) getBot().reply(CONV, t); // el guion marca "Requiere persona" siempre
      else await replyWithFallback(getBot(), store, CONV, t, { iaReal: ia });
    } catch {
      try { getBot().reply(CONV, t); } catch { /* sin banners de error */ }
    } finally {
      esperandoIA = false;
      ocupado = false;
      pantalla.clearPending();
      if (vivo) drenar();
    }
  }

  // Historial guardado: se pinta completo, sin retardo.
  for (const m of conv()?.mensajes ?? []) { pantalla.push(m); mostrados += 1; }
  estado();

  const offStore = store.subscribe(() => { drenar(); });
  const iaBox = q('[data-ia]');
  iaBox.checked = store.get().ui.iaReal === true;
  iaBox.addEventListener('change', () => { store.update((s) => { s.ui.iaReal = iaBox.checked; }); });
  const offIa = store.subscribe((s) => { if (iaBox.checked !== (s.ui.iaReal === true)) iaBox.checked = s.ui.iaReal === true; });
  const offVivo = livePanel(q('[data-vivo]'), store);

  return () => {
    vivo = false;
    clearTimeout(timer);
    offStore(); offIa(); offVivo();
    pantalla.destroy();
  };
}
