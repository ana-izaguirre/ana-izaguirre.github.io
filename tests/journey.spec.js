// End-to-end journeys a recruiter actually performs on the page.
import { test, expect } from './fixtures.js';

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
      await page.fill('#q-mini', q);
      await page.press('#q-mini', 'Enter');
      await page.waitForTimeout(350);
      const marks = await page.$$eval('mark', (els) => [...new Set(els.map((e) => e.textContent.toLowerCase()))]);
      const stray = marks.filter((m) => !m.includes(q.slice(0, 4).toLowerCase()));
      expect(stray, `"${q}" highlighted unrelated terms`).toEqual([]);
    }
  });

  test('says so when there is no match', async ({ page }) => {
    await open(page);
    await page.fill('#q-mini', 'zzzqqq');
    await page.press('#q-mini', 'Enter');
    await expect(page.locator('#answer')).toContainText(/No|no aparece/);
  });

  test('can be cleared, by button and by Escape', async ({ page }) => {
    await open(page);
    await page.fill('#q-mini', 'aws');
    await page.press('#q-mini', 'Enter');
    await expect(page.locator('.ans-x')).toBeVisible();

    await page.click('.ans-x');
    await expect(page.locator('#q-mini')).toHaveValue('');
    await expect(page.locator('#hist')).toBeHidden();
    await expect(page.locator('.ans-x')).toBeHidden();

    await page.fill('#q-mini', 'jest');
    await page.press('#q-mini', 'Enter');
    await page.press('#q-mini', 'Escape');
    await expect(page.locator('#q-mini')).toHaveValue('');
  });

  test('"see it in the CV" scrolls to the cited passage', async ({ page }) => {
    await open(page);
    await page.fill('#q-mini', 'supabase');
    await page.press('#q-mini', 'Enter');
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

test.describe('CV search, every way in', () => {
  test('a suggested question answers when tapped', async ({ page }) => {
    await open(page, '?quiet=1');
    const chip = page.locator('#chips .chip').nth(1);
    const text = (await chip.textContent()).trim();
    await chip.click();
    await expect(page.locator('.ans-q')).toHaveText(text);
  });

  // "intel" sits in the role's heading, not in any of its bullet lines: the
  // answer must still quote that role instead of coming back empty.
  test('a match only in a role\'s title still quotes that role', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.fill('#q-mini', 'intel');
    await page.press('#q-mini', 'Enter');
    const first = page.locator('#answer .hit').first();
    await expect(first).toContainText('Intel');
    await expect(first.locator('p, li, blockquote').first()).not.toHaveText('');
  });

  test('the arrow button submits the question', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.fill('#q-mini', 'docker');
    await page.click('#ask-mini .go');
    await expect(page.locator('.ans-q')).toHaveText('docker');
    await expect(page.locator('#q-mini')).toHaveValue('');
  });

  test('the history asks a previous question again', async ({ page }) => {
    await open(page, '?quiet=1');
    for (const q of ['aws', 'jest']) {
      await page.fill('#q-mini', q);
      await page.press('#q-mini', 'Enter');
      await expect(page.locator('.ans-q')).toHaveText(q);
    }
    await page.locator('#hist .chip', { hasText: /^aws$/ }).click();
    await expect(page.locator('.ans-q')).toHaveText('aws');
  });

  test('Escape inside an answer clears the search', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.fill('#q-mini', 'graphql');
    await page.press('#q-mini', 'Enter');
    await page.locator('.ans-x').focus();
    await page.keyboard.press('Escape');
    await expect(page.locator('#hist')).toBeHidden();
    await expect(page.locator('.ans-x')).toBeHidden();
  });

  // Constraint learned the hard way elsewhere: a failure must be visible.
  test('a search that throws says so and offers the email', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.evaluate(() => { String.prototype.normalize = () => { throw new Error('boom'); }; });
    await page.fill('#q-mini', 'aws');
    await page.press('#q-mini', 'Enter');
    await expect(page.locator('#answer')).toContainText('Algo falló en la búsqueda');
  });

  test('an error before the first answer is shown, not swallowed', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.evaluate(() => {
      document.getElementById('answer').replaceChildren();
      window.dispatchEvent(new ErrorEvent('error', { message: 'boom' }));
    });
    await expect(page.locator('#answer')).toContainText('Algo falló en la búsqueda');
  });
});

test.describe('one question box', () => {
  test('the cover box is the only place to type a question', async ({ page }) => {
    await open(page, '?quiet=1');
    await expect(page.locator('input[type=text], input:not([type]), textarea')).toHaveCount(1);
    await expect(page.locator('#q-mini')).toBeVisible();
  });

  test('"ask something else" goes back to the box', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.fill('#q-mini', 'docker');
    await page.press('#q-mini', 'Enter');
    await page.click('#ask-again');
    await expect(page.locator('#q-mini')).toBeFocused();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5);
  });

  // Only About and Projects are on screen; the rest of the CV feeds the PDF
  // and this search. Sending someone to a hidden passage would go nowhere.
  test('answers from hidden parts of the CV carry no link', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.fill('#q-mini', 'snowflake');
    await page.press('#q-mini', 'Enter');
    await expect(page.locator('#answer .hit').first()).toBeVisible(); // the premise: it did answer
    await expect(page.locator('#answer .hit a')).toHaveCount(0);
  });
});

// Spec 002: each project opens into a case with the same five parts, in order,
// citing its own repository.
// Spec 003: search modes and visible evidence.
test.describe('ask my CV: modes and evidence', () => {
  const sources = (page) => page.locator('#answer .hit-src').allTextContents();

  test('a mode limits which part of the CV may answer', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.fill('#q-mini', 'typescript');
    await page.press('#q-mini', 'Enter');
    expect((await sources(page)).some((s) => s.startsWith('Experiencia')), 'the premise: it answers from experience first').toBe(true);
    await page.locator('#modes label', { has: page.locator('input[value="proj"]') }).click();
    await expect(page.locator('.ans-q')).toHaveText('typescript');
    const only = await sources(page);
    expect(only.length).toBeGreaterThan(0);
    expect(only.every((s) => s.startsWith('Proyectos') || s.startsWith('Caso de estudio')), `non-project sources: ${only}`).toBe(true);
  });

  test('the modes are a radio group the keyboard can drive', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.focus('#modes input[value="all"]');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#modes input[value="exp"]')).toBeChecked();
    await expect(page.locator('#modes input[value="exp"]')).toBeFocused();
  });

  test('nothing in a mode offers the whole CV instead of a dead end', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.locator('#modes label', { has: page.locator('input[value="proj"]') }).click();
    await page.fill('#q-mini', 'jmeter');
    await page.press('#q-mini', 'Enter');
    await expect(page.locator('#answer')).toContainText('No aparece en Proyectos.');
    await page.click('.try-all');
    await expect(page.locator('#modes input[value="all"]')).toBeChecked();
    await expect(page.locator('#answer .hit')).toHaveCount(1);
  });

  test('each answer shows the words that matched, synonyms marked as such', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.fill('#q-mini', 'sql');
    await page.press('#q-mini', 'Enter');
    const first = page.locator('#answer .hit').first();
    await expect(first.locator('.hit-why .ev').first()).toBeVisible();
    // "sql" is never written in the CV; everything it reaches is through synonyms.
    await expect(first.locator('.ev:not(.syn)')).toHaveCount(0);
    await expect(first.locator('.ev.syn').first()).toContainText('(sinónimo)');
    await page.fill('#q-mini', 'kubernetes');
    await page.press('#q-mini', 'Enter');
    await expect(page.locator('#answer .hit').first().locator('.ev:not(.syn)')).toContainText(['Kubernetes']);
  });
});

// Spec 005: the case studies answer questions, and "see it" opens them.
test.describe('ask my CV: case studies', () => {
  const sources = (page) => page.locator('#answer .hit-src').allTextContents();
  const QUESTION = {
    es: ['¿Qué decisiones de arquitectura tomaste en trainer-flow?', 'Caso de estudio: trainer-flow'],
    en: ['What architectural decisions did you make in trainer-flow?', 'Case study: trainer-flow'],
  };

  for (const [lang, [q, title]] of Object.entries(QUESTION)) {
    test(`the trainer-flow decisions question cites its case, and "see it" opens it — ${lang}`, async ({ page }) => {
      await open(page, `?quiet=1&lang=${lang}`);
      await expect(page.locator('#case-trainer')).not.toHaveAttribute('open', '');
      await page.fill('#q-mini', q);
      await page.press('#q-mini', 'Enter');
      expect(await sources(page)).toContain(title);
      await page.locator('#answer .hit', { has: page.locator('.hit-src', { hasText: title }) }).locator('a').click();
      await expect(page.locator('#case-trainer')).toHaveAttribute('open', '');
      await expect(page.locator('#case-trainer.flash')).toBeInViewport();
    });
  }

  test('the Projects mode answers from cases too', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.locator('#modes label', { has: page.locator('input[value="proj"]') }).click();
    await page.fill('#q-mini', 'supabase');
    await page.press('#q-mini', 'Enter');
    const only = await sources(page);
    expect(only).toContain('Caso de estudio: trainer-flow');
    expect(only.every((s) => s.startsWith('Proyectos') || s.startsWith('Caso de estudio')), `other sources: ${only}`).toBe(true);
  });

  test('a removed false friend no longer widens the question', async ({ page }) => {
    await open(page, '?quiet=1');
    // "education" used to be a synonym of "studies", and pulled in Laureate Education.
    await page.fill('#q-mini', '¿Qué estudiaste?');
    await page.press('#q-mini', 'Enter');
    expect((await sources(page)).join(' ')).not.toContain('Laureate');
  });
});

// Spec 008: on a phone the box sits with its suggested questions.
test.describe('ask my CV on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('one box, right above the questions', async ({ page }) => {
    await open(page, '?quiet=1');
    await expect(page.locator('input#q-mini')).toHaveCount(1);
    await expect(page.locator('#ask-sec #ask-mini')).toHaveCount(1);
    const before = await page.evaluate(() => !!(document.querySelector('#ask-mini').compareDocumentPosition(document.querySelector('#chips')) & Node.DOCUMENT_POSITION_FOLLOWING));
    expect(before, 'the box is not before the questions').toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.fill('#q-mini', 'docker');
    await page.press('#q-mini', 'Enter');
    await expect(page.locator('.ans-q')).toHaveText('docker');
  });

  // Spec 012: no sideways scrolling; four questions, then four more per tap.
  test('the questions come four at a time, and the new ones take the focus', async ({ page }) => {
    await open(page, '?quiet=1');
    const shown = () => page.locator('#chips .chip').evaluateAll((cs) => cs.filter((c) => c.offsetParent).length);
    expect(await shown()).toBe(4);
    await expect(page.locator('#chips-more')).toHaveText('Más preguntas +8');
    await page.locator('#chips-more').tap();
    expect(await shown()).toBe(8);
    await expect(page.locator('#chips .chip').nth(4)).toBeFocused();
    expect(await page.locator('#chips .chip').nth(5).evaluate((c) => [c.style.getPropertyValue('--k'), getComputedStyle(c).animationName])).toEqual(['1', 'chip-in']);
    await page.locator('#chips-more').tap();
    expect(await shown()).toBe(12);
    await expect(page.locator('#chips-more')).toBeHidden();
    const sideways = await page.$eval('#chips', (e) => e.scrollWidth > e.clientWidth);
    expect(sideways, 'the questions scroll sideways').toBe(false);
  });

  test('the button speaks English', async ({ page }) => {
    await open(page, '?quiet=1&lang=en');
    await expect(page.locator('#chips-more')).toHaveText('More questions +8');
  });

  test('"ask something else" brings the box back into view', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.locator('#chips .chip').first().click();
    await page.locator('#ask-again').click();
    await expect(page.locator('#q-mini')).toBeFocused();
    await expect(page.locator('#ask-mini')).toBeInViewport();
  });

  test('a wider window takes the box back to the cover', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(page.locator('#top #ask-mini')).toHaveCount(1);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('#ask-sec #ask-mini')).toHaveCount(1);
  });
});

test('on a desktop the box stays on the cover, with every question and no button', async ({ page }) => {
  await open(page, '?quiet=1');
  await expect(page.locator('#top #ask-mini')).toHaveCount(1);
  await expect(page.locator('#chips .chip:visible')).toHaveCount(12);
  await expect(page.locator('#chips-more')).toBeHidden();
});

// Spec 009: a call to action on the cover and where the page ends.
test.describe('call to action', () => {
  for (const [name, viewport] of [['phone', { width: 390, height: 844 }], ['desktop', { width: 1280, height: 800 }]]) {
    test(`"let's talk" lands on the closing card — ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await open(page, '?quiet=1');
      await page.click('.pill-go');
      await expect(page.locator('#hablemos')).toBeInViewport({ ratio: 0.9, timeout: 4000 });
      await expect(page).toHaveURL(/#hablemos$/);
    });
  }

  test('on a phone the closing card keeps the same side margins as the CV', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, '?quiet=1');
    const edges = await page.evaluate(() => ['#sheet', '#hablemos'].map((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right)]; }));
    expect(edges[0][0], 'the premise: the CV has a margin').toBeGreaterThan(0);
    expect(edges[1]).toEqual(edges[0]);
  });

  test('the closing card offers email, LinkedIn and the CV in the current language', async ({ page }) => {
    await open(page, '?quiet=1');
    const card = page.locator('#hablemos');
    await expect(card.locator('a[href^="mailto:"]')).toHaveText('Escríbeme');
    await expect(card.locator('a[href*="linkedin.com"]')).toHaveCount(1);
    await expect(card.locator('a.dl')).toHaveAttribute('href', 'Ana-Izaguirre-CV-ES.pdf');
    await page.click('#lang');
    await expect(card.locator('a.dl')).toHaveAttribute('href', 'Ana-Izaguirre-CV-EN.pdf');
    await expect(card.locator('a[href^="mailto:"]')).toHaveText('Write to me');
    await expect(page.locator('.pill-go')).toContainText("Let's talk");
  });
});

// Spec 010: motion on scroll, in CSS alone.
test.describe('motion on scroll', () => {
  const style = (page, sel, prop) => page.$eval(sel, (e, p) => getComputedStyle(e).getPropertyValue(p), prop);
  const progress = (page) => page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('.bar'), '::after').transform).a);

  test('the reading line fills from empty at the top to full at the bottom', async ({ page }) => {
    await open(page, '?quiet=1');
    expect(await progress(page)).toBeLessThan(0.02);
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => progress(page)).toBeGreaterThan(0.98);
  });

  test('a row below the fold rises into place as it arrives', async ({ page }) => {
    await open(page, '?quiet=1');
    const row = '#c-trainer';
    expect(Number(await style(page, row, 'opacity')), 'the premise: it waits, transparent').toBeLessThan(0.05);
    await page.$eval(row, (e) => e.scrollIntoView({ block: 'center' }));
    await expect.poll(async () => Number(await style(page, row, 'opacity'))).toBe(1);
    expect(await style(page, row, 'transform')).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  });

  test('a highlighted row keeps its flash', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.fill('#q-mini', 'supabase');
    await page.press('#q-mini', 'Enter');
    await page.locator('.hit a').first().click();
    await expect(page.locator('.flash')).toHaveCount(1);
    expect(await page.$eval('.flash', (e) => getComputedStyle(e).animationName)).toBe('flash');
  });

  test('on paper every row is there, still and opaque', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.emulateMedia({ media: 'print' });
    const rows = await page.$$eval('.sheet .row', (els) => els.map((e) => [getComputedStyle(e).opacity, getComputedStyle(e).animationName]));
    expect(rows.length).toBeGreaterThan(5);
    expect(rows.filter(([o, a]) => o !== '1' || a !== 'none')).toEqual([]);
  });
});

// Spec 011: the page answers where the pointer is.
test.describe('pointer response', () => {
  const tilt = (page) => page.$eval('.tile[data-focus=proj]', (e) => [e.style.getPropertyValue('--tx'), e.style.getPropertyValue('--ty')]);

  test('a cover card leans toward the pointer, and lets go when it leaves', async ({ page }) => {
    await open(page, '?quiet=1');
    await expect(page.locator('#loader')).toHaveClass(/gone/);
    const box = await page.locator('.tile[data-focus=proj]').boundingBox();
    await page.mouse.move(box.x + box.width * 0.95, box.y + box.height * 0.5);
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.5);
    const [tx] = await tilt(page);
    expect(parseFloat(tx), 'leans right').toBeGreaterThan(2);
    await expect.poll(() => page.$eval('.tile[data-focus=proj]', (e) => getComputedStyle(e).transform)).toMatch(/^matrix3d/);
    await page.mouse.move(5, 5);
    expect(await tilt(page)).toEqual(['', '']);
  });

  test('a project row glows where the pointer is', async ({ page }) => {
    await open(page, '?quiet=1');
    const row = page.locator('#c-trainer');
    // hover() waits for the row to stop moving: the page scrolls smoothly.
    await row.hover({ position: { x: 40, y: 20 } });
    await row.hover({ position: { x: 60, y: 30 } });
    const [mx, bg] = await row.evaluate((e) => [e.style.getPropertyValue('--mx'), getComputedStyle(e).backgroundImage]);
    expect(mx).toBe('60px');
    expect(bg).toContain('radial-gradient');
  });

  test('the sources of an answer arrive one after another', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.fill('#q-mini', 'docker kubernetes aws');
    await page.press('#q-mini', 'Enter');
    const hits = await page.$$eval('#answer .hit', (els) => els.map((e) => [e.style.getPropertyValue('--i'), getComputedStyle(e).animationName]));
    expect(hits.length).toBeGreaterThan(1);
    expect(hits.map(([i]) => i)).toEqual(hits.map((_, i) => String(i)));
    expect(hits.every(([, a]) => a === 'hit-in')).toBe(true);
  });
});

test.describe('pointer response, not for touch', () => {
  test.use({ viewport: { width: 1024, height: 800 }, isMobile: true, hasTouch: true });
  test('a tap leaves no card tilted', async ({ page }) => {
    await open(page, '?quiet=1');
    expect(await page.evaluate(() => matchMedia('(hover:hover) and (pointer:fine)').matches), 'the premise: a touch device').toBe(false);
    await page.locator('.tile[data-focus=proj]').dispatchEvent('pointermove', { clientX: 900, clientY: 300 });
    expect(await page.$eval('.tile[data-focus=proj]', (e) => e.style.getPropertyValue('--tx'))).toBe('');
  });
});

// The two signs stand at their places in the landscape, not bunched to one side.
test.describe('the Honduras and Zaragoza signs', () => {
  for (const [name, viewport] of [['phone', { width: 390, height: 844 }], ['desktop', { width: 1280, height: 800 }], ['wide', { width: 1680, height: 950 }]]) {
    test(`Honduras on the left, Zaragoza toward the basilica — ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await open(page, '?quiet=1');
      const [h, z] = await page.$$eval('.signs span', (els) => els.map((e) => { const r = e.getBoundingClientRect(); return (r.left + r.width / 2) / innerWidth; }));
      expect(h, 'Honduras is not on the left').toBeLessThan(0.3);
      expect(z, 'Zaragoza is not on the right half').toBeGreaterThan(0.5);
    });
  }
});

// Spec 015: who she is in one screen.
test.describe('who she is in one screen', () => {
  const COMPANIES = ['Allergan Data Labs (AbbVie)', 'Intel', 'AutoFi', 'Laureate Education', 'Agile Solutions', 'INFOP'];

  test('the "has worked at" band names each company once, and moves', async ({ page }) => {
    await open(page, '?quiet=1');
    await expect(page.locator('.trust .mq:not([aria-hidden]) li')).toHaveText(COMPANIES);
    await expect(page.locator('.trust .mq[aria-hidden="true"]')).toHaveCount(1);
    expect(await page.$eval('.trust .mq', (e) => getComputedStyle(e).animationName)).toBe('marquee');
    await expect(page.locator('#facts li.live')).toHaveText('Incorporación inmediata');
    expect(await page.$eval('#facts li.live', (e) => getComputedStyle(e, '::before').animationName)).toBe('live');
  });

  test('the band speaks English', async ({ page }) => {
    await open(page, '?quiet=1&lang=en');
    await expect(page.locator('#trust-h')).toHaveText('Has worked at');
  });
});

test.describe('who she is in one screen, reduced motion', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  test('the band stands still with every company in view', async ({ page }) => {
    await open(page, '?quiet=1');
    expect(await page.$eval('.trust .mq', (e) => getComputedStyle(e).animationName)).toBe('none');
    await expect(page.locator('.trust .mq[aria-hidden="true"]')).toBeHidden();
    const inside = await page.$$eval('.trust .mq:not([aria-hidden]) li', (els) => els.every((e) => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }));
    expect(inside, 'a company is cut off').toBe(true);
    expect(await page.$eval('#facts li.live', (e) => getComputedStyle(e, '::before').animationName)).toBe('none');
  });
});

// Spec 016: a numbered editorial index.
test.describe('editorial index', () => {
  const ES = ['01Trayectoria', '02Pregúntale a mi CV', '03Perfil', '04Trabajo propio', '05Hablemos'];

  test('each section opens with its number, and the footer lists them in order', async ({ page }) => {
    await open(page, '?quiet=1');
    await expect(page.locator('.eyebrow')).toHaveText(ES);
    await expect(page.locator('.idx a')).toHaveText(ES);
    await expect(page.locator('.idx')).toHaveAttribute('aria-label', 'Índice');
    const order = await page.$$eval('.eyebrow', (els) => els.map((e) => Math.round(e.getBoundingClientRect().top + scrollY)));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  test('every index link lands on its section', async ({ page }) => {
    await open(page, '?quiet=1');
    const targets = await page.$$eval('.idx a', (as) => as.map((a) => a.getAttribute('href')));
    for (const href of targets) {
      await page.click(`.idx a[href="${href}"]`);
      await expect(page.locator(href)).toBeInViewport({ timeout: 4000 });
    }
  });

  test('the index speaks English, and the numbers are not read twice', async ({ page }) => {
    await open(page, '?quiet=1&lang=en');
    await expect(page.locator('.idx a')).toHaveText(['01Journey', '02Ask my CV', '03Profile', '04Own work', "05Let's talk"]);
    await expect(page.locator('.idx')).toHaveAttribute('aria-label', 'Index');
    expect(await page.$$eval('.eyebrow', (els) => els.every((e) => e.getAttribute('aria-hidden') === 'true'))).toBe(true);
  });
});

// Spec 017: the stat row under the cover.
test.describe('stat row', () => {
  const n = (page) => page.$$eval('.st-n', (els) => els.map((e) => Number(getComputedStyle(e).getPropertyValue('--n'))));
  const at = (page, y) => page.evaluate((y) => scrollTo({ top: document.querySelector('.stats').getBoundingClientRect().top + scrollY - innerHeight + y, behavior: 'instant' }), y);

  test('the figures are the story\'s own totals', async ({ page }) => {
    await open(page, '?quiet=1');
    await expect(page.locator('.st-n b')).toHaveText(['8+', '6', '25', '3']);
    await page.locator('.seg').last().click();
    await page.click('#rp-next'); await page.click('#rp-next'); await page.click('#rp-next');
    await expect(page.locator('#rp-step')).toContainText('4/4 · 7/7');
    expect(await page.$$eval('#k-co, #k-te, #k-pr', (els) => els.map((e) => e.textContent))).toEqual(['6', '25', '3']);
  });

  test('they count up as they come into view', async ({ page }) => {
    await open(page, '?quiet=1');
    await at(page, 40);
    const part = await n(page);
    expect(part[2], 'the premise: partly in view, 25 has not been reached').toBeLessThan(25);
    await at(page, 500);
    await expect.poll(() => n(page)).toEqual([8, 6, 25, 3]);
  });

  test('the labels speak English', async ({ page }) => {
    await open(page, '?quiet=1&lang=en');
    await expect(page.locator('.st-l')).toHaveText(['years in production', 'companies', 'technologies', 'own projects']);
    await expect(page.locator('.stats')).toHaveAttribute('aria-label', 'In figures');
  });
});

test.describe('stat row, reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the plain figures show and nothing counts', async ({ page }) => {
    await open(page, '?quiet=1');
    expect(await page.$$eval('.st-n', (els) => els.map((e) => getComputedStyle(e).animationName))).toEqual(['none', 'none', 'none', 'none']);
    expect(await page.$eval('.st-n b', (e) => e.getBoundingClientRect().width)).toBeGreaterThan(5);
  });
});

// Spec 006: the Curiosity Switch picks which parts of each case a reader sees.
test.describe('the Curiosity Switch', () => {
  const view = (page, v) => page.locator('#views label', { has: page.locator(`input[value="${v}"]`) });
  const parts = (page) => page.locator('#case-trainer dt').evaluateAll((ds) => ds.filter((d) => d.offsetParent).map((d) => d.textContent));
  const hint = (page) => page.locator('#case-trainer .case-hint').evaluateAll((hs) => hs.filter((h) => h.offsetParent).map((h) => h.textContent));

  test('engineering shows the five parts; hiring keeps problem and results', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.click('#case-trainer summary');
    expect(await parts(page)).toEqual(['Problema', 'Decisiones', 'Arquitectura', 'Trade-offs', 'Resultados']);
    await view(page, 'brief').click();
    expect(await parts(page)).toEqual(['Problema', 'Resultados']);
    expect(await hint(page)).toEqual(['problema y resultados']);
    await view(page, 'deep').click();
    expect(await parts(page)).toHaveLength(5);
  });

  test('the arrow keys move between the views', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.focus('#views input[value="deep"]');
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#views input[value="brief"]')).toBeChecked();
    await expect(page.locator('#views input[value="brief"]')).toBeFocused();
  });

  test('"see it" on a hidden part switches to engineering and shows the line', async ({ page }) => {
    await open(page, '?quiet=1');
    await view(page, 'brief').click();
    await page.fill('#q-mini', '¿Qué decisiones de arquitectura tomaste en trainer-flow?');
    await page.press('#q-mini', 'Enter');
    const hit = page.locator('#answer .hit', { has: page.locator('.hit-src', { hasText: 'Caso de estudio: trainer-flow' }) });
    await hit.locator('a').click();
    await expect(page.locator('#views input[value="deep"]')).toBeChecked();
    expect(await parts(page)).toHaveLength(5);
    await expect(page.locator('#case-trainer.flash')).toBeInViewport();
  });

  test('a hit on a part hiring keeps does not change the view', async ({ page }) => {
    await open(page, '?quiet=1');
    await view(page, 'brief').click();
    await page.fill('#q-mini', 'mutación');
    await page.press('#q-mini', 'Enter');
    await page.locator('#answer .hit', { has: page.locator('.hit-src', { hasText: 'Caso de estudio' }) }).first().locator('a').click();
    await expect(page.locator('#views input[value="brief"]')).toBeChecked();
  });

  test('the switch speaks English', async ({ page }) => {
    await open(page, '?quiet=1&lang=en');
    await expect(page.locator('#views')).toContainText('Read it as');
    await expect(page.locator('#views')).toContainText('Hiring');
    await expect(page.locator('#views')).toContainText('Engineering');
  });
});

// Spec 004: the cover's cards move the light over the landscape and whisper a
// line about themselves. CSS alone: no script, nothing that shifts layout.
test.describe('exploratory cover', () => {
  const spot = (page) => page.locator('.spot');
  const CARDS = { story: 'Todo empezó en Honduras', proj: 'Desde Zaragoza', about: 'Lista para un equipo nuevo' };

  test('hovering each card moves the light and shows its line; leaving clears both', async ({ page }) => {
    await open(page, '?quiet=1');
    // The intro overlay covers the page for its first 1.9 s; a pointer that
    // moved under it is not hovering anything until it moves again.
    await expect(page.locator('#loader')).toHaveClass(/gone/);
    await expect(spot(page)).toHaveCSS('opacity', '0');
    const transforms = new Set();
    for (const [key, line] of Object.entries(CARDS)) {
      const tile = page.locator(`.tile[data-focus="${key}"]`);
      await tile.hover();
      await expect(spot(page)).toHaveCSS('opacity', '1');
      await expect(tile.locator('.whisper')).toHaveCSS('opacity', '1');
      await expect(tile.locator('.whisper')).toContainText(line);
      await expect.poll(() => spot(page).evaluate((e) => getComputedStyle(e).transform)).not.toBe('none');
      transforms.add(await spot(page).evaluate((e) => getComputedStyle(e).transform));
    }
    expect(transforms.size, 'each card should point the light somewhere else').toBe(3);
    await page.mouse.move(5, 5);
    await expect(spot(page)).toHaveCSS('opacity', '0');
  });

  test('the keyboard gets the same, and nothing on the cover moves', async ({ page }) => {
    await open(page, '?quiet=1');
    // Layout boxes (offset*), not visual ones: the focused card's lift is a
    // transform, which never shifts layout and is not a layout shift.
    const boxes = () => page.$$eval('h1, .lead, .tile, .signs, #ask-mini', (els) => els.map((e) =>
      [e.offsetLeft, e.offsetTop, e.offsetWidth, e.offsetHeight]));
    const before = await boxes();
    await page.locator('.tile[data-focus="proj"]').focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab'); // focus-visible needs a keyboard-driven focus
    await expect(spot(page)).toHaveCSS('opacity', '1');
    await expect(page.locator('.tile[data-focus="proj"] .whisper')).toHaveCSS('opacity', '1');
    expect(await boxes(), 'the cover shifted on focus').toEqual(before);
  });

  test('the whisper is decoration: links keep their own names', async ({ page }) => {
    await open(page, '?quiet=1');
    await expect(page.locator('.tile[data-focus="story"]')).toHaveAccessibleName(/Mi trayectoria/);
    await expect(page.locator('.tile[data-focus="story"]')).not.toHaveAccessibleName(/Honduras, en 2015/);
  });
});

test.describe('exploratory cover on a touch screen', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('a tap follows the link without leaving the light on, and no whisper covers a card', async ({ page }) => {
    await open(page, '?quiet=1');
    expect(await page.evaluate(() => matchMedia('(hover: hover)').matches), 'the premise: this device cannot hover').toBe(false);
    await page.evaluate(() => document.getElementById('loader').classList.add('gone'));
    await page.locator('.tile[data-focus="proj"]').tap();
    await expect(page.locator('.spot')).toHaveCSS('opacity', '0');
    await expect(page.locator('.tile[data-focus="proj"] .whisper')).toBeHidden();
  });
});

test.describe('case studies', () => {
  const PARTS = {
    es: ['Problema', 'Decisiones', 'Arquitectura', 'Trade-offs', 'Resultados'],
    en: ['Problem', 'Decisions', 'Architecture', 'Trade-offs', 'Results'],
  };
  const REPOS = { trainer: 'trainer-flow', mcp: 'mcp-docs-search', latino: 'latino-migra' };

  for (const lang of ['es', 'en']) {
    test(`three cases, closed, with the five parts in order — ${lang}`, async ({ page }) => {
      await open(page, `?quiet=1&lang=${lang}`);
      for (const [slug, repo] of Object.entries(REPOS)) {
        const c = page.locator(`#case-${slug}`);
        await expect(c, `${slug} should start closed`).not.toHaveAttribute('open', '');
        await expect(c.locator('dt')).toHaveText(PARTS[lang]);
        const dd = await c.locator('dd').allTextContents();
        expect(dd.every((d) => d.trim().length > 20), `${slug} has an empty part`).toBe(true);
        const links = await c.locator('.case-src a').evaluateAll((as) => as.map((a) => a.href));
        expect(links.length, `${slug} cites no source`).toBeGreaterThan(0);
        for (const href of links) expect(href, `${slug} cites outside its repo`).toContain(`github.com/ana-izaguirre/${repo}`);
      }
    });
  }

  test('a case opens and closes from the keyboard', async ({ page }) => {
    await open(page, '?quiet=1');
    const summary = page.locator('#case-mcp summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#case-mcp')).toHaveAttribute('open', '');
    await expect(page.locator('#case-mcp .case-body')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('#case-mcp')).not.toHaveAttribute('open', '');
  });
});

test.describe('errors while reporting errors', () => {
  test('a failure inside the error handler does not loop', async ({ page }) => {
    await open(page, '?quiet=1');
    const survived = await page.evaluate(() => {
      const answer = document.getElementById('answer');
      answer.replaceChildren();
      let calls = 0;
      answer.replaceChildren = () => { calls += 1; throw new Error('cannot render'); };
      window.dispatchEvent(new ErrorEvent('error', { message: 'boom' }));
      return calls;
    });
    // The premise: the handler really tried to render, and failed, exactly once.
    expect(survived).toBe(1);
    await expect(page.locator('h1')).toBeVisible();
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
    await expect(page.locator('#pop-copy'), 'the button never goes back to its label').toHaveText('Copiar correo', { timeout: 4000 });
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(EMAIL);

    const gmail = await page.getAttribute('#pop a[href*="mail.google"]', 'href');
    expect(gmail).toContain(`to=${EMAIL}`);

    await page.keyboard.press('Escape');
    await expect(page.locator('#pop')).toBeHidden();
  });
});

test.describe('career story, other controls', () => {
  test('back to top scrolls up and rewinds the story', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.locator('#cv').scrollIntoViewIfNeeded();
    await expect(page.locator('#to-top')).toHaveClass(/show/);
    await page.click('#to-top');
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5);
    await expect(page.locator('#rp-step')).toContainText('1/4 · 1/7');
  });

  test('tapping the scene moves the story forward', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.click('#rp-prev');
    const before = await page.textContent('#rp-step');
    await page.locator('#card').click({ position: { x: 12, y: 12 } });
    await expect(page.locator('#rp-step')).not.toHaveText(before);
  });

  test('the next button moves the story forward', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.click('#rp-prev');
    const before = await page.textContent('#rp-step');
    await page.click('#rp-next');
    await expect(page.locator('#rp-step')).not.toHaveText(before);
  });
});

// Safari has no requestIdleCallback: everything deferred to idle time must
// still happen.
test.describe('without requestIdleCallback', () => {
  test('the page still finishes setting up', async ({ page }) => {
    await page.addInitScript(() => { window.requestIdleCallback = undefined; });
    const errors = await open(page, '?quiet=1');
    expect(await page.evaluate(() => typeof window.requestIdleCallback)).toBe('undefined');
    expect(errors).toEqual([]);
    await expect(page.locator('#answer .ans')).toHaveCount(1);
    await expect(page.locator('.fly').first()).toBeAttached();
    await expect(page.locator('.seg .lb').first()).not.toHaveText('');
  });
});

// app.js is requested after the first frame, so on a slow connection it can
// run before `load`. The story must still wake up once load arrives.
test.describe('slow fonts', () => {
  test('the story starts after load even when the script came first', async ({ page }) => {
    await page.route('**/fonts/fraunces.woff2', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });
    await page.addInitScript(() => {
      addEventListener('load', () => { window.__appBeforeLoad = !!window.__cv; });
    });
    await page.goto('/index.html');
    await expect.poll(() => page.evaluate(() => window.__appBeforeLoad), { timeout: 8000 }).toBe(true);
    await expect(page.locator('html')).not.toHaveClass(/boot/, { timeout: 8000 });
  });
});

test.describe('career story, edges and gestures', () => {
  test('the arrow keys step through the story', async ({ page }) => {
    await open(page, '?quiet=1');
    await expect(page.locator('#rp-step')).toContainText('1/4 · 1/7');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#rp-step')).toContainText('2/4 · 1/7');
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#rp-step')).toContainText('1/4 · 1/7');
  });

  test('typing in the search box does not move the story', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.press('#q-mini', 'ArrowRight');
    await expect(page.locator('#rp-step')).toContainText('1/4 · 1/7');
  });

  test('it stops at both ends instead of wrapping', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.click('#rp-prev');
    await expect(page.locator('#rp-step')).toContainText('1/4 · 1/7');
    await page.locator('.seg').last().click();
    await expect(page.locator('#rp-step')).toContainText('4/4 · 7/7');
    await page.click('#rp-next');
    await expect(page.locator('#rp-step')).toContainText('4/4 · 7/7');
  });

  test('stepping past the last beat crosses into the next stage and back', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.locator('.seg').first().click();
    await expect(page.locator('#rp-step')).toContainText('4/4 · 1/7');
    await page.click('#rp-next');
    await expect(page.locator('#rp-step')).toContainText('1/4 · 2/7');
    await page.click('#rp-prev');
    await expect(page.locator('#rp-step')).toContainText('4/4 · 1/7');
  });

  // Dispatched rather than dragged with the mouse: a real touch swipe never
  // fires a click, a mouse drag does, and that click would step once more.
  test('a swipe moves the story either way', async ({ page }) => {
    await open(page, '?quiet=1');
    const swipe = (from, to) => page.evaluate(([a, b]) => {
      const s = document.getElementById('scene');
      s.dispatchEvent(new PointerEvent('pointerdown', { clientX: a, bubbles: true }));
      s.dispatchEvent(new PointerEvent('pointerup', { clientX: b, bubbles: true }));
    }, [from, to]);
    await swipe(380, 300);
    await expect(page.locator('#rp-step')).toContainText('2/4 · 1/7');
    await swipe(300, 380);
    await expect(page.locator('#rp-step')).toContainText('1/4 · 1/7');
    await swipe(300, 320); // too short to count
    await expect(page.locator('#rp-step')).toContainText('1/4 · 1/7');
  });

  // Spec 013: the story waits at its first scene until it is seen. On the
  // cover it used to play out, unwatched, before anyone scrolled down.
  test('the story waits at its first scene while the visitor is on the cover', async ({ page }) => {
    await page.clock.install();
    await page.goto('/index.html');
    await page.clock.runFor(2_000);
    await expect(page.locator('html')).not.toHaveClass(/boot/);
    await page.clock.runFor(120_000);
    await expect(page.locator('#rp-step')).toContainText('1/4 · 1/7');
    await expect(page.locator('#rp-play')).toHaveClass(/ play/);
  });

  test('a story already moved by hand is not taken over when it comes into view', async ({ page }) => {
    await page.clock.install();
    await page.goto('/index.html');
    await page.clock.runFor(2_000);
    await page.locator('.seg').nth(2).click();
    await page.locator('#scene').evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.clock.runFor(10_000);
    await expect(page.locator('#rp-step')).toContainText('4/4 · 3/7');
  });

  // A virtual clock walks the whole autoplay in a moment instead of a minute.
  test('autoplay starts when the story comes into view, walks every stage and ends ready to replay', async ({ page }) => {
    await page.clock.install();
    await page.goto('/index.html');
    await page.clock.runFor(2_000);
    await expect(page.locator('html')).not.toHaveClass(/boot/);
    await page.locator('#scene').evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(page.locator('#rp-play')).toHaveClass(/pause/);
    await page.clock.runFor(120_000);
    await expect(page.locator('#rp-step')).toContainText('4/4 · 7/7');
    await expect(page.locator('#rp-play')).toHaveClass(/replay/);
    await page.click('#rp-play');
    await expect(page.locator('#rp-step')).toContainText('1/4 · 1/7');
  });
});

test.describe('entering the page', () => {
  test('a reload starts at the top, not where the visitor left off', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.evaluate(() => scrollTo(0, 2500));
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(2000);
    await page.reload();
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => scrollY)).toBe(0);
  });

  test('everything starts collapsed: the cases closed, the story at its start', async ({ page }) => {
    await open(page, '?quiet=1');
    await expect(page.locator('details[open]')).toHaveCount(0);
    await expect(page.locator('#rp-step')).toContainText('1/4 · 1/7');
  });
});

// Private browsing in some browsers throws on any localStorage access.
test.describe('storage blocked', () => {
  test('the page works and the toggles still toggle', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('denied', 'SecurityError'); } });
    });
    const errors = await open(page, '?quiet=1');
    expect(errors).toEqual([]);
    await page.click('#lang');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.click('#theme');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.click('#theme');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

test.describe('contact, the rough edges', () => {
  test('copying still works when the clipboard API refuses', async ({ page }) => {
    await page.addInitScript(() => {
      navigator.clipboard.writeText = () => Promise.reject(new Error('denied'));
    });
    await open(page, '?quiet=1');
    await page.click('#fab');
    await page.click('#pop-copy');
    await expect(page.locator('#pop-copy')).toHaveText('Copiado');
  });

  test('when nothing can copy, the button shows the address instead of lying', async ({ page }) => {
    await page.addInitScript(() => {
      navigator.clipboard.writeText = () => Promise.reject(new Error('denied'));
      document.execCommand = () => { throw new Error('unsupported'); };
    });
    await open(page, '?quiet=1');
    await page.click('#fab');
    await page.click('#pop-copy');
    await expect(page.locator('#pop-copy')).toHaveText(EMAIL);
  });

  test('clicking outside closes the popup', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.click('#fab');
    await expect(page.locator('#pop')).toBeVisible();
    await page.mouse.click(20, 400);
    await expect(page.locator('#pop')).toBeHidden();
  });
});

test.describe('empty questions', () => {
  test('asking nothing keeps the focus in the box and changes nothing', async ({ page }) => {
    await open(page, '?quiet=1');
    const before = await page.textContent('.ans-q');
    await page.fill('#q-mini', '   ');
    await page.press('#q-mini', 'Enter');
    await expect(page.locator('#q-mini')).toBeFocused();
    await expect(page.locator('.ans-q')).toHaveText(before);
  });

  // The search time is shown with a decimal under 10 ms and whole above it.
  // Which one a real search hits depends on the machine (CI is faster than a
  // laptop), so the clock that times it is driven by hand here.
  test('the search time reads well whether it is fast or slow', async ({ page }) => {
    await open(page, '?quiet=1');
    const timed = async (step) => {
      await page.evaluate((s) => {
        let t = 0;
        window.__realNow = performance.now.bind(performance);
        performance.now = () => (t += s);
      }, step);
      await page.fill('#q-mini', 'aws');
      await page.press('#q-mini', 'Enter');
      const meta = await page.locator('#answer .ans-meta').first().textContent();
      await page.evaluate(() => { performance.now = window.__realNow; });
      return meta;
    };
    expect(await timed(1.5)).toContain('1,5 ms');
    expect(await timed(25)).toContain('25 ms');
  });

  test('a single match is counted in the singular', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.fill('#q-mini', 'jmeter');
    await page.press('#q-mini', 'Enter');
    await expect(page.locator('#answer')).toContainText('1 fragmento del CV');
  });
});

test.describe('in English', () => {
  test.use({ locale: 'en-US' });

  // applyLang() once lost its label() call to a comment: the play button kept
  // its Spanish name for screen readers on an English page.
  test('the story controls are named in English', async ({ page }) => {
    await open(page, '?quiet=1');
    await expect(page.locator('#rp-play')).toHaveAttribute('aria-label', 'Play');
    await page.click('#lang');
    await expect(page.locator('#rp-play')).toHaveAttribute('aria-label', 'Reproducir');
  });

  test('an English browser gets the English CV, search and contact', async ({ page }) => {
    await open(page, '?quiet=1');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.fill('#q-mini', 'jmeter');
    await page.press('#q-mini', 'Enter');
    await expect(page.locator('#answer')).toContainText('1 passage from the CV');

    await page.click('#fab');
    await page.click('#pop-copy');
    await expect(page.locator('#pop-copy')).toHaveText('Copied');
    await expect(page.locator('#pop-copy')).toHaveText('Copy email', { timeout: 4000 });
  });

  test('the search modes and evidence speak English', async ({ page }) => {
    await open(page, '?quiet=1');
    await expect(page.locator('#modes legend')).toHaveText('Search in');
    await page.locator('#modes label', { has: page.locator('input[value="skills"]') }).click();
    await page.fill('#q-mini', 'jmeter');
    await page.press('#q-mini', 'Enter');
    await expect(page.locator('#answer')).toContainText('Nothing in Skills.');
    await expect(page.locator('.try-all')).toHaveText('Search the whole CV');
  });

  test('a failed search apologises in English', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.evaluate(() => { String.prototype.normalize = () => { throw new Error('boom'); }; });
    await page.fill('#q-mini', 'aws');
    await page.press('#q-mini', 'Enter');
    await expect(page.locator('#answer')).toContainText('Something went wrong with the search');
  });
});

test.describe('language and theme', () => {
  test('switch, change the CV download, and survive a reload', async ({ page }) => {
    await open(page);
    await expect(page.locator('.bar a.dl')).toHaveAttribute('href', 'Ana-Izaguirre-CV-ES.pdf');

    await page.click('#lang');
    await expect(page.locator('h1')).toContainText(/engineer/i);
    await expect(page.locator('.bar a.dl')).toHaveAttribute('href', 'Ana-Izaguirre-CV-EN.pdf');

    await page.click('#theme');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.reload();
    await page.waitForTimeout(1200);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});

test.describe('fireflies', () => {
  test('a balanced number drift over the landscape', async ({ page }) => {
    await open(page);
    const n = await page.locator('.fly').count();
    expect(n, 'too few or too many fireflies').toBeGreaterThanOrEqual(8);
    expect(n).toBeLessThanOrEqual(30);
    const running = await page.$eval('.fly', (e) => e.getAnimations().filter((a) => a.playState === 'running').length);
    expect(running, 'the firefly is not flying').toBeGreaterThan(0);
  });
});

// Spec 014: the phone fix must not change the desktop. There they keep their
// calm drift: 130 px each way over 9-15 s.
test.describe('fireflies on a desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test('they keep their calm desktop flight', async ({ page }) => {
    await open(page);
    await expect(page.locator('.fly').first()).toBeAttached();
    const flights = await page.$$eval('.fly', (els) => els.map((e) => {
      const a = e.getAnimations().find((x) => x.effect.getKeyframes().length === 5);
      const xs = a.effect.getKeyframes().map((k) => Math.abs(parseFloat(k.transform.slice(10))));
      return [a.effect.getTiming().duration, Math.max(...xs)];
    }));
    expect(flights.length).toBeGreaterThanOrEqual(20);
    expect(flights.every(([d]) => d >= 9000 && d <= 15000), 'a desktop firefly flies at a phone pace').toBe(true);
    expect(flights.every(([, x]) => x <= 130), 'a desktop firefly flies too far').toBe(true);
  });
});

// They used to drift ~5 px a second: technically animated, visibly still on a
// phone. A firefly has to be seen flying.
test.describe('fireflies on a phone', () => {
  test.use({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });

  test('they visibly fly, not just flicker', async ({ page }) => {
    await open(page);
    await expect(page.locator('html')).not.toHaveClass(/boot/, { timeout: 8000 });
    const at = () => page.$$eval('.fly', (els) => els.map((e) => { const r = e.getBoundingClientRect(); return [r.left, r.top]; }));
    const a = await at();
    await page.waitForTimeout(2000);
    const b = await at();
    expect(a.length, 'no fireflies on a phone').toBeGreaterThanOrEqual(8);
    const avg = a.reduce((s, p, i) => s + Math.hypot(b[i][0] - p[0], b[i][1] - p[1]), 0) / a.length;
    // Spec 014: on a phone they cover a third of the band's width in 5-8 s.
    expect(avg, `fireflies moved ${avg.toFixed(1)} px in 2 s on average`).toBeGreaterThan(30);
  });

  // Spec 007: Safari on iPhone did not move keyframes that read var(), so the
  // dots only blinked. Chromium moves either kind, so check the cause itself.
  test('their flight is written in plain values, not var()', async ({ page }) => {
    await open(page);
    await expect(page.locator('.fly').first()).toBeAttached();
    const frames = await page.$$eval('.fly', (els) => els.flatMap((e) => e.getAnimations().flatMap((a) => a.effect.getKeyframes().map((k) => k.transform))));
    expect(frames.length, 'no flight animations at all').toBeGreaterThan(0);
    expect(frames.filter((t) => /var\(/.test(t))).toEqual([]);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('fireflies stay still and the content is all there', async ({ page }) => {
    await open(page);
    // The premise first: without fireflies on the page this would pass for nothing.
    await expect(page.locator('.fly').first()).toBeAttached();
    const moving = await page.evaluate(() =>
      [...document.querySelectorAll('.fly, .fly i, .land *')].some((e) => getComputedStyle(e).animationName !== 'none' || e.getAnimations().length > 0)
    );
    expect(moving, 'something animates under prefers-reduced-motion').toBe(false);
    const scrolled = await page.$$eval('.sheet .row, .replay, .cta, .ask-rule', (els) => els.filter((e) => getComputedStyle(e).animationName !== 'none' || getComputedStyle(e).opacity !== '1').length);
    expect(scrolled, 'scroll motion runs under prefers-reduced-motion').toBe(0);
    await page.locator('.tile[data-focus=proj]').dispatchEvent('pointermove', { clientX: 900, clientY: 300 });
    expect(await page.$eval('.tile[data-focus=proj]', (e) => e.style.getPropertyValue('--tx')), 'a card tilts under reduced motion').toBe('');
    await expect(page.locator('#sheet')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('every jump around the page is instant, not smooth', async ({ page }) => {
    await open(page, '?quiet=1');
    const jump = async (action) => {
      await action();
      // No smooth scroll: the position is final right away, not a frame later.
      const a = await page.evaluate(() => scrollY);
      await page.waitForTimeout(120);
      expect(await page.evaluate(() => scrollY)).toBe(a);
    };
    await jump(() => page.fill('#q-mini', 'supabase').then(() => page.press('#q-mini', 'Enter')));
    await jump(() => page.locator('.hit a').first().click());
    await jump(() => page.click('#to-top'));
    await jump(() => page.click('#ask-again'));
    await page.locator('.seg').last().click(); // last stage, all beats: its logos are showing
    await jump(() => page.locator('#c-logos .lg').first().click());
  });

  test('on a phone, "ask something else" is instant too', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, '?quiet=1');
    await page.locator('#chips .chip').first().click();
    await page.click('#ask-again');
    const a = await page.evaluate(() => scrollY);
    await page.waitForTimeout(120);
    expect(await page.evaluate(() => scrollY)).toBe(a);
    await expect(page.locator('#ask-mini')).toBeInViewport();
  });
});
