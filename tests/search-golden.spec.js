// The search's results, pinned. tests/golden/search.json holds the top passages
// and quoted lines for every suggested question and a set of edge queries, in
// both languages. A change to the ranking must be deliberate: regenerate the
// file and review its diff in the same PR.
const { test, expect } = require('./fixtures');
const golden = require('./golden/search.json');

for (const lang of ['es', 'en']) {
  test(`search results match the golden file — ${lang}`, async ({ page }) => {
    await page.goto(`/index.html?quiet=1&lang=${lang}`);
    await expect.poll(() => page.evaluate(() => typeof window.__cv)).toBe('object');
    const got = await page.evaluate((queries) => {
      const out = {};
      for (const q of queries) {
        const res = window.__cv.search(q);
        out[q] = { terms: [...res.terms].sort(), hits: res.hits.map((h) => [h.el.id, h.lines.map((l) => l.textContent.trim().slice(0, 60))]) };
      }
      return out;
    }, Object.keys(golden[lang]));
    expect(got).toEqual(golden[lang]);
  });
}
