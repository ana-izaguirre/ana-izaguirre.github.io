// The first frame, before app.js. Its own file because the trace has to be off,
// and Playwright only allows that per file: recording a trace snapshots the DOM
// and forces frames, which moves exactly the timing measured here.
const { test, expect } = require('@playwright/test');

test.use({ trace: 'off' });

// app.js arrives after the first frame, so the first frame has to be right on
// its own: the cover already in the visitor's language, and nothing moving
// when the script lands. Both broke once, invisibly, behind the loader.
test.describe('first paint', () => {
  // A real phone profile (DPR, touch): at DPR 1 the first frame rasterises fast
  // enough that the shift this guards against does not show up.
  test.use({ viewport: { width: 412, height: 823 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1.75 });

  for (const locale of ['en-US', 'es-ES']) {
    test.describe(locale, () => {
      test.use({ locale });

      test('the cover is in the visitor\'s language before app.js runs', async ({ page }) => {
        let blocked = 0;
        await page.route('**/app.js', (r) => { blocked += 1; return r.abort(); });
        await page.goto('/index.html');
        await page.waitForTimeout(600);
        expect(blocked, 'app.js was never requested, so nothing was tested').toBe(1);
        const big = await page.textContent('.h1-big');
        expect(big).toBe(locale === 'en-US' ? 'A curious mind.' : 'Una mente curiosa.');
      });

      // Deterministic rather than timed: the cover's geometry with app.js blocked
      // must equal its geometry once app.js has run. Anything the script changes
      // in the first screen would be a layout shift on a slow phone.
      test('app.js does not move anything on the cover', async ({ browser }) => {
        const BOXES = ['.h1-big', '.lead', '#facts', '#stack', '.pill', '.land', '#ask-mini'];
        const measure = async (blockScript) => {
          const ctx = await browser.newContext({ locale, viewport: { width: 412, height: 823 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1.75 });
          const page = await ctx.newPage();
          if (blockScript) await page.route('**/app.js', (r) => r.abort());
          await page.goto('/index.html?quiet=1');
          if (blockScript) await page.waitForTimeout(600);
          else await expect(page.locator('#stack li').first()).toBeAttached(); // the premise: the script ran
          await page.evaluate(() => document.fonts.ready);
          const boxes = await page.evaluate((sels) => sels.map((s) => {
            const r = document.querySelector(s).getBoundingClientRect();
            return [s, Math.round(r.top), Math.round(r.height)];
          }), BOXES);
          await ctx.close();
          return boxes;
        };
        expect(await measure(false), 'the cover moved when app.js ran').toEqual(await measure(true));
      });
    });
  }

  test('switching back to Spanish restores the cover an English first paint replaced', async ({ browser }) => {
    const ctx = await browser.newContext({ locale: 'en-US', viewport: { width: 412, height: 823 } });
    const page = await ctx.newPage();
    await page.goto('/index.html?quiet=1');
    await expect(page.locator('.h1-big')).toHaveText('A curious mind.');
    await page.click('#lang');
    await expect(page.locator('.h1-big')).toHaveText('Una mente curiosa.');
    await expect(page.locator('#q-mini')).toHaveAttribute('placeholder', 'p. ej. ¿Qué hiciste en Intel?');
    await expect(page.locator('#stack')).toHaveAttribute('aria-label', 'Stack principal');
    await ctx.close();
  });
});
