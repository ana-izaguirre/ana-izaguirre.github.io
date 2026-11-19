// End-to-end journeys a recruiter actually performs on the page.
const { test, expect } = require('@playwright/test');

const EMAIL = 'ana.izaguirrematamoros@gmail.com';

/** Load the page and fail the test on any console error or page error. */
async function open(page, query = '') {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`/index.html${query}`);
  await page.waitForTimeout(1500);
  return errors;
}

test.describe('page loads clean', () => {
  test('no console errors and nothing is fetched from outside', async ({ page }) => {
    const external = [];
    page.on('request', (r) => {
      const u = r.url();
      if (!u.startsWith('http://127.0.0.1') && !u.startsWith('http://localhost') && !u.startsWith('data:')) {
        external.push(u);
      }
    });
    const errors = await open(page);
    expect(errors, 'console/page errors').toEqual([]);
    expect(external, 'external requests').toEqual([]);
  });

  test('the loader goes away', async ({ page }) => {
    await open(page);
    await expect(page.locator('#loader')).toHaveClass(/gone/);
  });
});

test.describe('career story', () => {
  test('plays on its own and can be driven by hand', async ({ page }) => {
    await open(page);
    await expect(page.locator('#rp-step')).not.toHaveText('Paso 1/4 · 1/6');

    await page.click('#rp-play');                 // pause
    const intel = page.locator('.seg', { has: page.locator('.lb', { hasText: /^Intel$/ }) });
    await intel.click();
    await expect(page.locator('#c-co')).toHaveText('Intel');
    // Every technology listed for the stage must render, and as an icon.
    const listed = (await page.getAttribute('#c-intel', 'data-tech')).split(',').length;
    const logos = page.locator('#c-logos .lg');
    await expect(logos).toHaveCount(listed);
    await expect(logos.locator('svg')).toHaveCount(listed);

    await page.click('#rp-prev');
    await expect(page.locator('#rp-step')).toContainText('Paso 3/4');
  });

  test('clicking a technology logo searches for it', async ({ page }) => {
    await open(page);
    await page.click('#rp-play');
    await page.locator('.seg').nth(4).click();
    const first = page.locator('#c-logos .lg').first();
    const name = await first.getAttribute('aria-label');   // icon-only: the name lives here
    expect(name, 'a technology icon has no accessible name').toBeTruthy();
    await first.click();
    await expect(page.locator('.ans-q')).toHaveText(name.trim());
  });
});

test.describe('CV search', () => {
  test('finds content and only highlights what was typed', async ({ page }) => {
    await open(page);
    for (const q of ['sql', 'kubernetes', 'graphql']) {
      await page.fill('#q', q);
      await page.press('#q', 'Enter');
      await page.waitForTimeout(350);
      const marks = await page.$$eval('mark', (els) => [...new Set(els.map((e) => e.textContent.toLowerCase()))]);
      const stray = marks.filter((m) => !m.includes(q.slice(0, 4).toLowerCase()));
      expect(stray, `"${q}" highlighted unrelated terms`).toEqual([]);
    }
  });

  test('says so when there is no match', async ({ page }) => {
    await open(page);
    await page.fill('#q', 'zzzqqq');
    await page.press('#q', 'Enter');
    await expect(page.locator('#answer')).toContainText(/No|no aparece/);
  });

  test('can be cleared, by button and by Escape', async ({ page }) => {
    await open(page);
    await page.fill('#q', 'aws');
    await page.press('#q', 'Enter');
    await expect(page.locator('.ans-x')).toBeVisible();

    await page.click('.ans-x');
    await expect(page.locator('#q')).toHaveValue('');
    await expect(page.locator('#hist')).toBeHidden();
    await expect(page.locator('.ans-x')).toBeHidden();

    await page.fill('#q', 'jest');
    await page.press('#q', 'Enter');
    await page.press('#q', 'Escape');
    await expect(page.locator('#q')).toHaveValue('');
  });

  test('"see it in the CV" scrolls to the cited passage', async ({ page }) => {
    await open(page);
    await page.fill('#q', 'snowflake');
    await page.press('#q', 'Enter');
    await page.locator('.hit a').first().click();
    await page.waitForTimeout(1000);
    const onScreen = await page.evaluate(() => {
      const e = document.querySelector('.flash');
      if (!e) return false;
      const r = e.getBoundingClientRect();
      return r.top > 0 && r.top < innerHeight;
    });
    expect(onScreen, 'cited passage is not in view').toBe(true);
  });
});

test.describe('contact', () => {
  test('popup opens, copies the address and closes with Escape', async ({ page }) => {
    await open(page);
    await page.click('#fab');
    await expect(page.locator('#pop')).toBeVisible();

    const labels = await page.$$eval('#pop .btn', (els) => els.map((e) => e.textContent.trim()));
    expect(labels.join(' ')).toContain('Gmail');
    expect(labels.join(' ')).not.toContain('Descargar CV');

    await page.click('#pop-copy');
    await expect(page.locator('#pop-copy')).toHaveText('Copiado');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(EMAIL);

    const gmail = await page.getAttribute('#pop a[href*="mail.google"]', 'href');
    expect(gmail).toContain(`to=${EMAIL}`);

    await page.keyboard.press('Escape');
    await expect(page.locator('#pop')).toBeHidden();
  });

  test('the links at the foot of the CV are visible', async ({ page }) => {
    await open(page);
    await page.locator('.contact').scrollIntoViewIfNeeded();
    const colors = await page.$$eval('.cta .btn', (els) => els.map((e) => getComputedStyle(e).color));
    for (const c of colors) expect(c, 'a contact button is transparent').not.toBe('rgba(0, 0, 0, 0)');
  });
});

test.describe('language and theme', () => {
  test('switch, change the CV download, and survive a reload', async ({ page }) => {
    await open(page);
    await expect(page.locator('a.dl')).toHaveAttribute('href', 'Ana-Izaguirre-CV-ES.pdf');

    await page.click('#lang');
    await expect(page.locator('h1')).toContainText(/engineer/i);
    await expect(page.locator('a.dl')).toHaveAttribute('href', 'Ana-Izaguirre-CV-EN.pdf');

    await page.click('#theme');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.reload();
    await page.waitForTimeout(1200);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('spirits stay still and the content is all there', async ({ page }) => {
    await open(page);
    const moving = await page.evaluate(
      () => [...document.querySelectorAll('.sp')].some((e) => getComputedStyle(e).animationName !== 'none')
    );
    expect(moving, 'spirits animate under prefers-reduced-motion').toBe(false);
    await expect(page.locator('#sheet')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });
});
