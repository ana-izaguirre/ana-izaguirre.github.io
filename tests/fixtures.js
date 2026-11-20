// Every spec imports `test` from here instead of from @playwright/test, so each
// page a test opens records V8 coverage of the page's own scripts. The raw data
// goes to coverage/raw/; scripts/coverage.js merges it into a number.
import { test as base, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const RAW = path.join(import.meta.dirname, '..', 'coverage', 'raw');
const OURS = /\/(app\.js|index\.html|js\/[\w-]+\.js)(\?|$)/;

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const runs = [];
    const take = async () => {
      runs.push(...(await page.coverage.stopJSCoverage()).filter((e) => OURS.test(e.url)));
    };
    await page.coverage.startJSCoverage({ resetOnNavigation: false });

    // V8 drops the previous document's counts on navigation, whatever
    // resetOnNavigation says: a click followed by page.reload() would vanish.
    // So every explicit navigation banks what the current document ran first.
    for (const method of ['goto', 'reload']) {
      const original = page[method].bind(page);
      page[method] = async (...args) => {
        if (page.url() !== 'about:blank') {
          await take();
          await page.coverage.startJSCoverage({ resetOnNavigation: false });
        }
        return original(...args);
      };
    }

    await use(page);
    await take();
    fs.mkdirSync(RAW, { recursive: true });
    fs.writeFileSync(path.join(RAW, `${testInfo.testId}-${testInfo.retry}.json`), JSON.stringify(runs));
  },
});

export { expect };
