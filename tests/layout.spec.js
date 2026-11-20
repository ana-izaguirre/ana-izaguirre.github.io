// Layout invariants. These exist because each one was a real bug at some point:
// text clipped by its own line-height, chips sliding under the CV sheet,
// a section band bleeding past the viewport.
const { test, expect } = require('./fixtures');

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
    if (e.closest('.world')) continue;
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

      for (const sel of ['h1', '#h-about', '#sobre-mi .txt', '#h-proj', '#c-trainer']) {
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

// The story lives in its own section now. Reached through "Explore my world",
// the whole card — timeline and controls included — must fit one screen
// below the sticky bar, so it can be watched without scrolling.
test.describe('the career story fits one screen', () => {
  for (const size of SIZES.filter((s) => s.width >= 390)) {
    test(`${size.name}`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto('/index.html?quiet=1');
      await page.waitForTimeout(900);
      await page.click('.pill');
      await page.waitForTimeout(900);
      const r = await page.evaluate(() => {
        const card = document.querySelector('.replay').getBoundingClientRect();
        const bar = document.querySelector('.bar').getBoundingClientRect();
        return { top: Math.round(card.top - bar.bottom), spare: Math.round(innerHeight - card.bottom) };
      });
      expect(r.top, 'the story card hides under the bar').toBeGreaterThanOrEqual(0);
      expect(r.spare, 'the story card runs past the fold').toBeGreaterThanOrEqual(0);
    });
  }
});

test.describe('hero', () => {
  test('the hero question box hands off to the CV search', async ({ page }) => {
    await page.goto('/index.html?quiet=1');
    await page.waitForTimeout(900);
    await page.fill('#q-mini', 'kubernetes');
    await page.press('#q-mini', 'Enter');
    await expect(page.locator('.ans-q')).toHaveText('kubernetes');
    await expect(page.locator('#q-mini')).toHaveValue('');
    await page.waitForTimeout(900);
    const inView = await page.evaluate(() => {
      const r = document.getElementById('answer').getBoundingClientRect();
      return r.top < innerHeight && r.bottom > 0;
    });
    expect(inView, 'the answer is not on screen after asking from the hero').toBe(true);
  });

  test('the family and the basilica stay in frame on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/index.html?quiet=1');
    await page.waitForTimeout(900);
    // The band crops the landscape twice: once by its viewBox, again by
    // `slice` to the band's own proportions. Work out what is really visible.
    const seen = await page.evaluate(() => {
      const svg = document.querySelector('.land');
      const [x, y, w, h] = svg.getAttribute('viewBox').split(' ').map(Number);
      const r = svg.getBoundingClientRect();
      const scale = Math.max(r.width / w, r.height / h);
      const visibleW = r.width / scale;
      const left = x + (w - visibleW) / 2;
      return { left, right: left + visibleW };
    });
    // Half-widths in user units, from tools/scene.py: the family spans about
    // ±90 around its centre, the basilica's outer towers about ±120.
    for (const [name, at, half] of [['family', 820, 90], ['basilica', 1150, 120]]) {
      expect(at - half, `${name} is cut by the left edge`).toBeGreaterThan(seen.left);
      expect(at + half, `${name} is cut by the right edge`).toBeLessThan(seen.right);
    }
  });

  test('aria labels survive a round trip through English', async ({ page }) => {
    await page.goto('/index.html?quiet=1&lang=es');
    await page.waitForTimeout(800);
    await page.click('#lang');
    await page.click('#lang');
    await page.waitForTimeout(400);
    const broken = await page.$$eval('[aria-label]', (els) =>
      els.filter((e) => /^(undefined|null)?$/.test(e.getAttribute('aria-label'))).map((e) => e.id || e.className)
    );
    expect(broken, 'aria-label lost after switching language back').toEqual([]);
  });
});

test.describe('resizing', () => {
  test('the timeline, the story and the bar re-fit when the window changes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/index.html?quiet=1');
    await page.waitForTimeout(900);
    await expect(page.locator('a.dl').first()).toHaveText('Descargar CV');

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('a.dl').first()).toHaveText('CV');
    await page.waitForTimeout(500);
    const fit = await page.evaluate(() => {
      const card = document.getElementById('card').getBoundingClientRect();
      const scene = document.getElementById('scene').getBoundingClientRect();
      const labels = [...document.querySelectorAll('.seg:not(.tight) .lb')].map((e) => e.getBoundingClientRect());
      const overlap = labels.some((r, i) => i && r.left < labels[i - 1].right);
      return { cardFits: card.bottom <= scene.bottom + 1, overlap };
    });
    expect(fit.cardFits, 'the story card spills out of its scene after a resize').toBe(true);
    expect(fit.overlap, 'timeline labels collide after a resize').toBe(false);

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('a.dl').first()).toHaveText('Descargar CV');
  });
});

test.describe('print', () => {
  test('the CV prints and the interactive furniture does not', async ({ page }) => {
    await page.goto('/index.html?quiet=1');
    await page.waitForTimeout(800);
    await page.emulateMedia({ media: 'print' });

    for (const sel of ['.bar', '.sys', '.story', '.askwrap', '.top', '.dock', 'footer', '.case']) {
      const shown = await page.evaluate(
        (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e).display : 'none'; }, sel
      );
      expect(shown, `${sel} would be printed`).toBe('none');
    }
    await expect(page.locator('#sheet')).toBeVisible();
    // The PDF is the whole CV: what the screen hides comes back, and the
    // screen-only About section stays out.
    for (const sel of ['#h-perfil', '#h-exp', '#h-sk', '#h-edu', '.sh-name']) {
      await expect(page.locator(sel), `${sel} is missing from the PDF`).toBeVisible();
    }
    await expect(page.locator('#sobre-mi')).toBeHidden();
  });

  test('on screen the CV shows only About and Projects', async ({ page }) => {
    await page.goto('/index.html?quiet=1');
    await page.waitForTimeout(600);
    for (const sel of ['#h-perfil', '#h-exp', '#h-sk', '#h-edu', '.sh-name']) {
      await expect(page.locator(sel), `${sel} is still on screen`).toBeHidden();
    }
    await expect(page.locator('#sobre-mi')).toBeVisible();
    await expect(page.locator('#h-proj')).toBeVisible();
    await page.click('.tile[href="#sobre-mi"]');
    await expect.poll(() => page.evaluate(() => {
      const r = document.getElementById('sobre-mi').getBoundingClientRect();
      return r.top >= 0 && r.top < innerHeight;
    })).toBe(true);
  });
});

test.describe('career timeline', () => {
  test('every stage is its own company and no two labels collide', async ({ page }) => {
    await page.goto('/index.html?quiet=1');
    await page.waitForTimeout(1200);

    const segs = await page.$$eval('.seg', (els) =>
      els.map((e) => ({
        label: e.querySelector('.lb')?.textContent.trim() ?? '',
        tight: e.classList.contains('tight'),
        left: Math.round(e.getBoundingClientRect().left),
        right: Math.round(e.getBoundingClientRect().right),
      }))
    );

    expect(segs.length, 'expected seven career stages').toBe(7);
    expect(segs.every((s) => s.label.length > 0), 'a stage has no label').toBe(true);

    // Any label still on screen must not run into the next one.
    const visible = segs.filter((s) => !s.tight);
    for (let i = 1; i < visible.length; i++) {
      expect(visible[i].left, `"${visible[i].label}" overlaps "${visible[i - 1].label}"`)
        .toBeGreaterThanOrEqual(visible[i - 1].right);
    }
  });

  // The active stage's label used to show on top of its neighbour
  // ("INFOPAgile Solutions"): checked with every stage active, at three widths.
  for (const width of [1440, 834, 390]) {
    test(`no labels collide whichever stage is active — ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/index.html?quiet=1');
      await page.waitForTimeout(900);
      const n = await page.locator('.seg').count();
      for (let i = 0; i < n; i++) {
        await page.evaluate((i) => document.querySelectorAll('.seg')[i].click(), i);
        await page.waitForTimeout(150);
        const shown = await page.$$eval('.seg', (els) => els
          // Read the decision, not the fade: a hidden label is still mid-transition here.
          .filter((e) => !e.classList.contains('tight') || e.classList.contains('on'))
          .map((e) => ({ t: e.textContent.trim(), r: e.querySelector('.lb').getBoundingClientRect() }))
          .filter((x) => x.r.width > 0)
          .map((x) => ({ t: x.t, l: x.r.left, r: x.r.right })));
        for (let a = 0; a < shown.length; a++) for (let b = a + 1; b < shown.length; b++) {
          const overlap = shown[a].l < shown[b].r && shown[b].l < shown[a].r;
          expect(overlap, `stage ${i + 1}: "${shown[a].t}" overlaps "${shown[b].t}"`).toBe(false);
        }
      }
    });
  }

  // Stopped at the end of a stage, the marker sat on the next stage's dot and
  // made that one look active. It only shows while the story plays.
  test('the progress marker shows only while playing', async ({ page }) => {
    await page.goto('/index.html?quiet=1');
    await page.waitForTimeout(900);
    await expect(page.locator('#knob')).toHaveCSS('opacity', '0');
    await page.click('#rp-play');
    await expect(page.locator('#knob')).toHaveCSS('opacity', '1');
    await page.click('#rp-play');
    await expect(page.locator('#knob')).toHaveCSS('opacity', '0');
  });

  test('on a phone the years show and do not swallow taps on the stages', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/index.html?quiet=1');
    await page.waitForTimeout(900);
    await page.evaluate(() => document.getElementById('loader').classList.add('gone'));
    await expect(page.locator('#years span').first()).toBeVisible();
    await page.locator('.seg').nth(4).click(); // a real click: fails if the years intercept it
    await expect(page.locator('#rp-step')).toContainText('5/7');
  });

  test('each stage shows icons for its tools and no text labels', async ({ page }) => {
    await page.goto('/index.html?quiet=1');
    await page.waitForTimeout(1200);
    await page.click('#rp-play');

    const n = await page.locator('.seg').count();
    for (let i = 0; i < n; i++) {
      // Click through the DOM: the progress knob sits over the earliest stations.
      await page.evaluate((i) => document.querySelectorAll('.seg')[i].click(), i);
      await page.waitForTimeout(240);
      const logos = await page.$$eval('#c-logos .lg', (els) =>
        els.map((e) => ({ name: e.getAttribute('aria-label'), icon: !!e.querySelector('svg'), text: e.textContent.trim() }))
      );
      const company = await page.textContent('#c-co');
      expect(logos.length, `${company} has no technologies`).toBeGreaterThan(0);
      for (const l of logos) {
        expect(l.icon, `${company}: "${l.name}" renders without an icon`).toBe(true);
        expect(l.text, `${company}: "${l.name}" still shows a text label`).toBe('');
        expect(l.name, `${company}: an icon has no accessible name`).toBeTruthy();
      }
    }
  });
});
