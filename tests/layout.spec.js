// Layout invariants. These exist because each one was a real bug at some point:
// text clipped by its own line-height, chips sliding under the CV sheet,
// a section band bleeding past the viewport.
const { test, expect } = require('@playwright/test');

const SIZES = [
  { name: 'phone',        width: 360,  height: 740 },
  { name: 'phone large',  width: 390,  height: 844 },
  { name: 'phablet',      width: 480,  height: 800 },
  { name: 'tablet',       width: 768,  height: 1024 },
  { name: 'laptop',       width: 1280, height: 800 },
  { name: 'desktop',      width: 1920, height: 1080 },
];

/** Anything under <body> that sticks out past the viewport width. */
const OVERFLOW = () => {
  const vw = document.documentElement.clientWidth;
  const out = [];
  for (const e of document.querySelectorAll('body *')) {
    // The scene layers are deliberately wider than the viewport, clipped by overflow:hidden.
    if (e.closest('.sky, .spirits, .grain')) continue;
    const r = e.getBoundingClientRect();
    if (r.right > vw + 2 || r.left < -2) {
      const id = e.id
        ? '#' + e.id
        : (typeof e.className === 'string' && e.className ? '.' + e.className.split(' ')[0] : e.tagName);
      if (!out.includes(id)) out.push(id);
    }
  }
  return { scroll: Math.round(document.documentElement.scrollWidth - vw), offenders: out.slice(0, 6) };
};

/**
 * How far an element is cut off by the nearest ancestor that actually clips.
 * `overflow: visible` never clips, so a serif descender poking a few pixels past
 * its own box is fine; being pushed outside a `content-visibility` or
 * `overflow: hidden` ancestor is not. That was the real bug behind the
 * chopped-off name in the CV header.
 */
const CLIPPED = (sel) => {
  const e = document.querySelector(sel);
  if (!e) return { missing: true, cut: 0, by: '' };

  const r = e.getBoundingClientRect();
  let cut = 0;
  let by = '';

  for (let n = e.parentElement; n && n !== document.documentElement; n = n.parentElement) {
    const cs = getComputedStyle(n);
    const clips = /hidden|clip/.test(cs.overflowX + ' ' + cs.overflowY) || cs.contentVisibility === 'auto';
    if (!clips) continue;
    const p = n.getBoundingClientRect();
    const worst = Math.max(p.top - r.top, r.bottom - p.bottom, p.left - r.left, r.right - p.right);
    if (worst > cut) {
      cut = worst;
      by = n.id ? '#' + n.id : (typeof n.className === 'string' && n.className ? '.' + n.className.split(' ')[0] : n.tagName);
    }
  }

  // Explicit line-clamping that is actually truncating text.
  const own = getComputedStyle(e);
  const truncated = own.webkitLineClamp !== 'none' && e.scrollHeight - e.clientHeight > 1;

  return { missing: false, cut: Math.round(cut), by, truncated };
};

for (const size of SIZES) {
  test.describe(`${size.name} — ${size.width}x${size.height}`, () => {
    test.use({ viewport: { width: size.width, height: size.height } });

    test('nothing overflows horizontally', async ({ page }) => {
      await page.goto('/index.html?quiet=1');
      await page.waitForTimeout(900);

      const top = await page.evaluate(OVERFLOW);
      expect(top.scroll, `horizontal scroll at the top: ${top.offenders.join(', ')}`).toBeLessThanOrEqual(0);

      await page.locator('#cv').scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const bottom = await page.evaluate(OVERFLOW);
      expect(bottom.scroll, `horizontal scroll at the CV: ${bottom.offenders.join(', ')}`).toBeLessThanOrEqual(0);
    });

    test('no headline or summary is cut off', async ({ page }) => {
      await page.goto('/index.html?quiet=1');
      await page.locator('#cv').scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);

      for (const sel of ['.sh-name', '.sh-role', 'h1', '#c-perfil', '#c-disp']) {
        const r = await page.evaluate(CLIPPED, sel);
        expect(r.missing, `${sel} is not on the page`).toBe(false);
        expect(r.cut, `${sel} is cut off by ${r.by}`).toBeLessThanOrEqual(1);
        expect(r.truncated, `${sel} is truncated by line-clamp`).toBe(false);
      }
    });

    test('the question chips do not slide under the CV sheet', async ({ page }) => {
      await page.goto('/index.html?quiet=1');
      await page.locator('#ask-sec').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      const gap = await page.evaluate(() => {
        const chips = [...document.querySelectorAll('.chip')];
        if (!chips.length) return null;
        const last = chips[chips.length - 1].getBoundingClientRect();
        const sheet = document.getElementById('sheet').getBoundingClientRect();
        return Math.round(sheet.top - last.bottom);
      });
      expect(gap, 'no chips found').not.toBeNull();
      expect(gap, 'the CV sheet overlaps the last chip').toBeGreaterThan(8);
    });
  });
}

test.describe('the career story fits one screen', () => {
  for (const size of SIZES.filter((s) => s.width >= 390)) {
    test(`${size.name}`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto('/index.html?quiet=1');
      await page.waitForTimeout(900);
      const spare = await page.evaluate(
        () => Math.round(innerHeight - document.querySelector('.replay').getBoundingClientRect().bottom)
      );
      expect(spare, 'the story card runs past the fold').toBeGreaterThanOrEqual(0);
    });
  }
});

test.describe('print', () => {
  test('the CV prints and the interactive furniture does not', async ({ page }) => {
    await page.goto('/index.html?quiet=1');
    await page.waitForTimeout(800);
    await page.emulateMedia({ media: 'print' });

    for (const sel of ['.bar', '.sys', '.askwrap', '.top', '.dock', 'footer']) {
      const shown = await page.evaluate(
        (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e).display : 'none'; }, sel
      );
      expect(shown, `${sel} would be printed`).toBe('none');
    }
    await expect(page.locator('#sheet')).toBeVisible();
  });
});
