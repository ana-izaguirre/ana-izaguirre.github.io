// Accessibility: axe-core must find nothing, in either theme and on a phone.
const { test, expect } = require('./fixtures');
const fs = require('fs');
const path = require('path');

const AXE = fs.readFileSync(path.join(require.resolve('axe-core'), '..', 'axe.min.js'), 'utf8');

const CONTEXTS = [
  { name: 'dark',   query: '?theme=dark&quiet=1',  viewport: { width: 1280, height: 900 } },
  { name: 'light',  query: '?theme=light&quiet=1', viewport: { width: 1280, height: 900 } },
  { name: 'mobile', query: '?theme=dark&quiet=1',  viewport: { width: 390,  height: 844 } },
];

for (const ctx of CONTEXTS) {
  test(`no axe violations — ${ctx.name}`, async ({ page }) => {
    await page.setViewportSize(ctx.viewport);
    await page.goto(`/index.html${ctx.query}`);
    await page.waitForTimeout(1200);
    await page.addScriptTag({ content: AXE });

    const { violations } = await page.evaluate(() =>
      window.axe.run(document, { resultTypes: ['violations'] })
    );

    const report = violations.map(
      (v) => `${v.id} (${v.impact}) — ${v.help}\n    ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join('\n    ')}`
    ).join('\n');

    expect(violations.length, `axe found ${violations.length} violation(s) in ${ctx.name}:\n${report}`).toBe(0);
  });
}

test('every interactive control has an accessible name', async ({ page }) => {
  await page.goto('/index.html?quiet=1');
  await page.waitForTimeout(1000);

  const unnamed = await page.$$eval('button, a[href], input, select', (els) =>
    els
      .filter((e) => e.offsetParent !== null)
      .filter((e) => {
        const name = (e.getAttribute('aria-label') || e.getAttribute('title') || e.textContent || '').trim();
        const labelled = e.getAttribute('aria-labelledby') || (e.id && document.querySelector(`label[for="${e.id}"]`));
        return !name && !labelled;
      })
      .map((e) => e.tagName + (e.id ? '#' + e.id : '') + (e.className ? '.' + String(e.className).split(' ')[0] : ''))
  );

  expect(unnamed, 'controls without an accessible name').toEqual([]);
});

test('the page can be driven from the keyboard alone', async ({ page }) => {
  await page.goto('/index.html?quiet=1');
  await page.waitForTimeout(1000);

  // Tab until the search field has focus, then search without touching the mouse.
  let reached = false;
  for (let i = 0; i < 40 && !reached; i++) {
    await page.keyboard.press('Tab');
    reached = await page.evaluate(() => document.activeElement?.id === 'q');
  }
  expect(reached, 'could not reach the search field by tabbing').toBe(true);

  await page.keyboard.type('docker');
  await page.keyboard.press('Enter');
  await expect(page.locator('.ans-q')).toContainText('docker');
});
