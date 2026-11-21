// Almacenamiento resistente: nunca lanza; si localStorage falla usa memoria.
export function createStorage(key) {
  let memoria = null;
  let usaMemoria = false;

  return {
    read() {
      if (!usaMemoria) {
        try {
          const crudo = globalThis.localStorage.getItem(key);
          if (crudo == null) return null;
          const valor = JSON.parse(crudo);
          return valor && typeof valor === 'object' ? valor : null;
        } catch {
          // localStorage bloqueado o JSON corrupto: se cae a memoria
          return memoria ? JSON.parse(memoria) : null;
        }
      }
      try { return memoria ? JSON.parse(memoria) : null; } catch { return null; }
    },
    // Avisa cuando OTRA pestaña/ventana escribe esta clave (evento `storage`). Nunca lanza.
    subscribe(cb) {
      const w = typeof window !== 'undefined' ? window : null;
      if (!w || typeof w.addEventListener !== 'function') return () => {};
      const h = (e) => { if (e && (e.key === key || e.key === null)) { try { cb(); } catch { /* un oyente roto no afecta a los demás */ } } };
      w.addEventListener('storage', h);
      return () => w.removeEventListener('storage', h);
    },
    write(obj) {
      let texto;
      try { texto = JSON.stringify(obj); } catch { return; }
      memoria = texto;
      try {
        globalThis.localStorage.setItem(key, texto);
        usaMemoria = false;
      } catch {
        usaMemoria = true;
      }
    },
  };
}
