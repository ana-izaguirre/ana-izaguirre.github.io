// End-to-end journeys a recruiter actually performs on the page.
const { test, expect } = require('./fixtures');

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
    await expect(page.locator('#rp-step')).toContainText('4/4 · 7/7');
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#rp-step')).toContainText('3/4 · 7/7');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#rp-step')).toContainText('4/4 · 7/7');
  });

  test('typing in the search box does not move the story', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.press('#q-mini', 'ArrowLeft');
    await expect(page.locator('#rp-step')).toContainText('4/4 · 7/7');
  });

  test('it stops at both ends instead of wrapping', async ({ page }) => {
    await open(page, '?quiet=1');
    await page.click('#rp-next');
    await expect(page.locator('#rp-step')).toContainText('4/4 · 7/7');
    await page.locator('.seg').first().click();
    for (let i = 0; i < 3; i++) await page.click('#rp-prev');
    await expect(page.locator('#rp-step')).toContainText('1/4 · 1/7');
    await page.click('#rp-prev');
    await expect(page.locator('#rp-step')).toContainText('1/4 · 1/7');
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
    await swipe(300, 380);
    await expect(page.locator('#rp-step')).toContainText('3/4 · 7/7');
    await swipe(380, 300);
    await expect(page.locator('#rp-step')).toContainText('4/4 · 7/7');
    await swipe(300, 320); // too short to count
    await expect(page.locator('#rp-step')).toContainText('4/4 · 7/7');
  });

  // A virtual clock walks the whole autoplay in a moment instead of a minute.
  test('autoplay walks every stage and ends ready to replay', async ({ page }) => {
    await page.clock.install();
    await page.goto('/index.html');
    await page.clock.runFor(2_000);
    await expect(page.locator('html')).not.toHaveClass(/boot/);
    await page.clock.runFor(120_000);
    await expect(page.locator('#rp-step')).toContainText('4/4 · 7/7');
    await expect(page.locator('#rp-play')).toHaveClass(/replay/);
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

test.describe('fireflies', () => {
  test('a balanced number drift over the landscape', async ({ page }) => {
    await open(page);
    const n = await page.locator('.fly').count();
    expect(n, 'too few or too many fireflies').toBeGreaterThanOrEqual(8);
    expect(n).toBeLessThanOrEqual(30);
    const moving = await page.$eval('.fly', (e) => getComputedStyle(e).animationName);
    expect(moving).toBe('wander');
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
    expect(avg, `fireflies moved ${avg.toFixed(1)} px in 2 s on average`).toBeGreaterThan(18);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('fireflies stay still and the content is all there', async ({ page }) => {
    await open(page);
    // The premise first: without fireflies on the page this would pass for nothing.
    await expect(page.locator('.fly').first()).toBeAttached();
    const moving = await page.evaluate(() =>
      [...document.querySelectorAll('.fly, .fly i, .land *')].some((e) => getComputedStyle(e).animationName !== 'none')
    );
    expect(moving, 'something animates under prefers-reduced-motion').toBe(false);
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
});
