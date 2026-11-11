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
