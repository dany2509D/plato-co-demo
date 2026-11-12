// Recorrido E2E de Plato & Co. con Playwright Test.
// Playwright no es dependencia del proyecto: ver README (sección «Calidad») para ejecutarlo con npx.
// Variables: BASE_URL (por defecto http://localhost:4173), BLOQUEAR_LS=1 (localStorage bloqueado).
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const BLOQUEADO = process.env.BLOQUEAR_LS === '1';
const FRASE_PEDIDO = 'Quiero 2 hamburguesas clásicas sin cebolla y una limonada para Obarrio';
const FRASE_AGOTADO = 'Quiero una hamburguesa clásica para Obarrio';
const FRASE_RESERVA = 'Quiero reservar para 4 mañana a las 8 pm, cumpleaños';

const VISTAS = [['360', 360, 780], ['768', 768, 1024], ['1440', 1440, 900]];
const RUTAS = ['#/', '#/menu', '#/carrito', '#/chat', '#/estilo', '#/pedido/no-existe', '#/admin/cocina', '#/admin/reservas', '#/admin/menu', '#/admin/indicadores'];

for (const [nombre, width, height] of VISTAS) {
  test.describe(`${nombre} px${BLOQUEADO ? ' · localStorage bloqueado' : ''}`, () => {
    test.use({ viewport: { width, height } });
    test.setTimeout(180_000);

    let errores;
    test.beforeEach(async ({ page }) => {
      errores = [];
      page.on('console', (m) => { if (m.type() === 'error') errores.push(`console.error: ${m.text()}`); });
      page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`));
      page.on('dialog', (d) => d.accept());
      if (BLOQUEADO) {
        await page.addInitScript(() => {
          Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } });
        });
      }
    });
    test.afterEach(() => { expect(errores, 'sin errores en consola').toEqual([]); });

    const ir = async (page, hash) => { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForTimeout(250); };
    const decir = async (page, texto) => {
      await page.locator('.tel-texto').fill(texto);
      await page.locator('.tel-enviar').click();
    };

    test('rutas: banner, enlaces seguros y sin desbordes', async ({ page }) => {
      const externas = new Set();
      page.on('request', (r) => { const u = new URL(r.url()); if (!r.url().startsWith(BASE) && u.protocol.startsWith('http')) externas.add(u.origin); });
      await page.goto(BASE + '/');
      for (const r of RUTAS) {
        await ir(page, r);
        await expect(page.locator('.banner-demo'), `banner en ${r}`).toBeVisible();
        const sinNoopener = await page.$$eval('a[target=_blank]', (as) => as.filter((a) => !/noopener/.test(a.rel)).length);
        expect(sinNoopener, `noopener en ${r}`).toBe(0);
        if (!r.startsWith('#/admin')) {
          const desborda = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
          expect(desborda, `sin scroll horizontal en ${r}`).toBe(false);
        }
      }
      for (const o of externas) expect(['https://fonts.googleapis.com', 'https://fonts.gstatic.com']).toContain(o);
    });

    test('portada: cinta con pausa y pie alineado', async ({ page }) => {
      await page.goto(BASE + '/');
      await expect(page.locator('h1')).toContainText('Hecho al');
      const t = page.locator('.c-hero__marquee [data-marquee-toggle]');
      await expect(t).toHaveAttribute('aria-pressed', 'false');
      await expect(t).toHaveAccessibleName('Pausar cinta de platos');
      await t.click();
      await expect(t).toHaveAttribute('aria-pressed', 'true');
      await expect(t).toHaveAccessibleName('Reanudar cinta de platos');
      await expect(page.locator('.c-hero__marquee .marquee__track')).toHaveCSS('animation-play-state', 'paused');
      const izq = async (sel) => (await page.locator(sel).first().boundingBox()).x;
      if (width >= 1440) expect(Math.abs((await izq('.app-header__inner')) - (await izq('.site-footer .container--wide')))).toBeLessThan(2);
    });

    test('menú → carrito → retiro con Yappy → seguimiento', async ({ page }) => {
      await page.goto(BASE + '/#/menu');
      const tabs = page.getByRole('tab');
      expect(await tabs.count()).toBeGreaterThan(3);
      await tabs.nth(2).click();
      await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
      await page.locator('[data-add]').first().click();
      const dlg = page.locator('dialog[open] form');
      if (await dlg.count()) await dlg.locator('button[type=submit]').click();
      await ir(page, '#/carrito');
      await page.locator('.seg__op', { hasText: 'Retiro' }).click();
      await page.locator('.pago-op', { hasText: 'Yappy' }).click();
      await expect(page.locator('.ck-sim')).toContainText('Pago simulado');
      await page.getByRole('button', { name: /Confirmar pedido/ }).click();
      await expect(page.locator('main.vista')).toHaveAttribute('data-ruta', 'pedido');
      await expect(page.locator('.pd-pasos')).toBeVisible();
      await expect(page.locator('.pd-datos')).toContainText('Yappy');
    });

    test('pedido por chat → cocina → avisos y factura; agotado; reserva; humano; indicadores; reinicio', async ({ page }) => {
      await page.goto(BASE + '/#/chat');
      await decir(page, FRASE_PEDIDO);
      await expect(page.locator('.tel-log')).toContainText('Total', { timeout: 10_000 });
      await expect(page.locator('.tel-log')).toContainText(/sin cebolla/i);
      await page.locator('.tel-rapido', { hasText: 'Sí, confirmar' }).last().click();
      await expect(page.locator('.tel-log')).toContainText('dirección exacta');
      await decir(page, 'Calle 50, Obarrio');
      await page.locator('.tel-rapido', { hasText: 'Yappy' }).last().click();
      await expect(page.locator('.tel-log')).toContainText(/Pedido .* registrado/, { timeout: 10_000 });
      await expect(page.locator('.tel-log')).toContainText('Pago con Yappy simulado');

      // la cocina avanza hasta entregar; el cliente recibe avisos y la factura en el chat
      const id = /Pedido (ped-\d+) registrado/.exec(await page.locator('.tel-log').innerText())[1];
      await ir(page, '#/admin/cocina');
      for (let i = 0; i < 6; i++) {
        const b = page.locator(`[data-avanzar="${id}"]`);
        if (!(await b.count())) break;
        await b.click();
        await page.waitForTimeout(150);
      }
      await ir(page, '#/chat');
      await expect(page.locator('.tel-log')).toContainText(/cocina/i);
      await expect(page.locator('.tel-log')).toContainText(/factura/i);

      // agotado → alternativa
      await ir(page, '#/admin/menu');
      await page.getByLabel('Buscar plato').fill('Hamburguesa clásica');
      await page.locator('[data-agotado]').first().click();
      await ir(page, '#/chat');
      await decir(page, FRASE_AGOTADO);
      await expect(page.locator('.tel-log')).toContainText(/agotad/i, { timeout: 10_000 });
      await expect(page.locator('.tel-log')).toContainText(/Le puedo ofrecer/);

      // reserva para 4 → plano
      await decir(page, 'cancelar');
      await decir(page, FRASE_RESERVA);
      await expect(page.locator('.tel-log')).toContainText(/Reserva confirmada/, { timeout: 10_000 });
      await ir(page, '#/admin/reservas');
      await expect(page.locator('[data-mesa]').first()).toBeVisible();
      await expect(page.locator('[data-reserva]').first()).toBeVisible();

      // pasar a una persona
      await ir(page, '#/chat');
      await page.locator('[data-humano]').click();
      await expect(page.locator('.tel-log')).toContainText(/persona del equipo/);
      await expect(page.locator('.vivo')).toContainText('Requiere persona');

      // indicadores
      await ir(page, '#/admin/indicadores');
      await expect(page.locator('main.vista')).toContainText(/Indicadores/);

      // reiniciar demo: el agotado desaparece
      await page.locator('.adm-reiniciar').click();
      await ir(page, '#/admin/menu');
      await page.getByLabel('Buscar plato').fill('Hamburguesa clásica');
      await expect(page.locator('.mn-agotado')).toHaveCount(0);
    });

    test('Presentación guiada de punta a punta', async ({ page }) => {
      await page.goto(BASE + '/');
      await page.getByRole('button', { name: /modo Presentación/ }).click();
      for (let i = 1; i <= 6; i++) {
        await expect(page.locator('[data-paso]')).toContainText(`Paso ${i} de 6`);
        const hacer = page.locator('[data-hacer]');
        if (await hacer.isVisible() && await hacer.isEnabled()) {
          await hacer.click();
          await page.waitForTimeout(400);
          await expect(page.locator('[data-hacer]')).toBeEnabled({ timeout: 60_000 });
        }
        if (i < 6) await page.locator('[data-sig]').click();
      }
      await expect(page.locator('[data-cta]')).toBeVisible();
      // en pantallas estrechas el panel queda minimizado: se expande para terminar
      if (!(await page.locator('[data-salir]').isVisible())) await page.locator('[data-min]').click();
      await page.locator('[data-salir]').click();
      await expect(page.locator('.pres-barra')).toHaveCount(0);
    });
  });
}
