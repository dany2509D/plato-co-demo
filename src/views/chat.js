import { brand } from '../config/brand.js';
import '../styles/phone.css';
import { store } from '../core/app-store.js';
import { esc } from '../ui/dom.js';
import { getAppBot } from '../bot/instance.js';
import { replyWithFallback } from '../bot/ai-adapter.js';
import { horaPanama } from '../bot/datetime.js';
import { SALUDO, mensajesNuevos, retardoEscribiendo } from '../core/chat-view.js';
import { phone } from '../ui/phone.js';
import { livePanel } from '../ui/live-panel.js';
import { icono } from '../ui/icons.js';
import { fotoEscena } from '../ui/photo.js';

const CONV = 'c-web';
const HUMANO = 'Pasar a una persona';
const EJEMPLO = brand.tema?.ejemplo ? `Quiero ${brand.tema.ejemplo.frase}` : 'Quiero 2 hamburguesas clásicas sin cebolla y una limonada para Obarrio';

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
    <div class="chat-pag band band--dark on-dark">
      <div class="chat-fondo" aria-hidden="true">${fotoEscena('ambiente_salon', { alt: '', eager: true, ratio: '16/9' })}</div>
      <div class="chat-in">
        <header class="chat-intro">
          <p class="eyebrow">Demo en vivo · WhatsApp</p>
          <h1 class="chat-frase">Lo que escribe su cliente. <span>Lo que ve su equipo, al instante.</span></h1>
          <p class="chat-pista">Pida como lo haría por WhatsApp, por ejemplo: “${esc(EJEMPLO)}”. En el panel «En vivo» verá, en ese mismo instante, lo que recibe el restaurante.</p>
          <p class="chat-pista chat-pista--pres">Para quien presenta: escriba la frase de ejemplo y siga con las respuestas rápidas (dirección, Yappy, confirmar y comprobante). Muestre el panel «En vivo» al lado del chat en pantalla ancha, o debajo en el celular.</p>
        </header>
        <div class="chat-cols">
          <div class="chat-col-tel">
            <p class="chat-etq">${icono('movil', { tam: 18 })} Cliente · lo que ve quien escribe</p>
            <div data-tel></div>
            <p class="tel-nota">Chat simulado · No se conecta a WhatsApp real</p>
            <div class="ia-caja">
              <label class="ia-sw"><input type="checkbox" role="switch" data-ia><span class="ia-pista" aria-hidden="true"></span><span>Modo IA real (opcional)</span></label>
              <p class="ia-ayuda" id="ia-ayuda">Si no está disponible, la demo vuelve al modo guion automáticamente.</p>
            </div>
          </div>
          <div class="chat-col-vivo">
            <p class="chat-etq">${icono('panel', { tam: 18 })} Panel · lo que ve el restaurante</p>
            <div data-vivo></div>
          </div>
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
    onAttach: (a) => {
      if (ocupado || corriendo) return;
      // con un pedido esperando el Yappy, el archivo adjunto es el comprobante
      if (conv()?.paso === 'comprobante') enviar(`Comprobante adjunto: ${a.nombre}`);
      else adjuntar(a);
    },
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
