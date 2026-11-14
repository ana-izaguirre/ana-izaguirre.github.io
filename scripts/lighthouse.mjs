// Lighthouse as a gate: the deploy workflow waits on this.
// Runs mobile and desktop, takes the best of N runs per profile (CI runners are
// noisy and a single slow run is not a regression), then asserts thresholds.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const PORT = Number(process.env.PORT ?? 8000);
const URL = `http://127.0.0.1:${PORT}/index.html`;
const RUNS = Number(process.env.LH_RUNS ?? 3);

// Accessibility, best practices and SEO are deterministic, so they must be perfect.
// Performance is measured on a throttled CPU and varies with the runner, so it has
// a floor rather than a target. The real numbers are in the README.
const THRESHOLDS = {
  mobile:  { performance: 90, accessibility: 100, 'best-practices': 100, seo: 100 },
  desktop: { performance: 95, accessibility: 100, 'best-practices': 100, seo: 100 },
};

const METRIC_LIMITS = {
  'cumulative-layout-shift': 0.02,
  'total-blocking-time': 400,
};

const PROFILES = {
  mobile: {},                                     // Lighthouse default: Moto G Power, slow 4G, 4x CPU
  desktop: {
    formFactor: 'desktop',
    screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
    throttling: { rttMs: 40, throughputKbps: 10 * 1024, cpuSlowdownMultiplier: 1 },
  },
};

function serve() {
  const p = spawn('python3', ['-m', 'http.server', String(PORT)], { stdio: 'ignore' });
  return () => p.kill();
}

async function waitForServer(timeoutMs = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(URL);
      if (r.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`server never answered on ${URL}`);
}

const pct = (c) => Math.round(c.score * 100);

async function profile(name, port) {
  let best = null;
  for (let i = 0; i < RUNS; i++) {
    const { lhr } = await lighthouse(URL, { port, output: 'json', logLevel: 'error' }, {
      extends: 'lighthouse:default',
      settings: PROFILES[name],
    });
    const scores = Object.fromEntries(Object.entries(lhr.categories).map(([k, v]) => [k, pct(v)]));
    const metrics = {
      'cumulative-layout-shift': lhr.audits['cumulative-layout-shift'].numericValue,
      'total-blocking-time': lhr.audits['total-blocking-time'].numericValue,
      'largest-contentful-paint': lhr.audits['largest-contentful-paint'].numericValue,
    };
    const run = { scores, metrics };
    console.log(
      `  ${name} run ${i + 1}/${RUNS}  ` +
      Object.entries(scores).map(([k, v]) => `${k.slice(0, 4)} ${v}`).join('  ') +
      `  | CLS ${metrics['cumulative-layout-shift'].toFixed(3)}` +
      `  TBT ${Math.round(metrics['total-blocking-time'])} ms` +
      `  LCP ${(metrics['largest-contentful-paint'] / 1000).toFixed(1)} s`
    );
    if (!best || scores.performance > best.scores.performance) best = run;
  }
  return best;
}

const stop = serve();
let chrome;
const failures = [];
const summary = {};

try {
  await waitForServer();
  chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'],
  });

  for (const name of Object.keys(PROFILES)) {
    console.log(`\n${name}`);
    const best = await profile(name, chrome.port);
    summary[name] = best;

    for (const [cat, min] of Object.entries(THRESHOLDS[name])) {
      if (best.scores[cat] < min) failures.push(`${name}: ${cat} ${best.scores[cat]} < ${min}`);
    }
    for (const [metric, max] of Object.entries(METRIC_LIMITS)) {
      const v = best.metrics[metric];
      if (v > max) failures.push(`${name}: ${metric} ${v.toFixed(2)} > ${max}`);
    }
  }

  mkdirSync('lighthouse-report', { recursive: true });
  writeFileSync('lighthouse-report/summary.json', JSON.stringify(summary, null, 2));

  console.log('\n' + '-'.repeat(60));
  for (const [name, r] of Object.entries(summary)) {
    console.log(
      `${name.padEnd(8)} ` +
      ['performance', 'accessibility', 'best-practices', 'seo'].map((k) => `${k} ${r.scores[k]}`).join('  ')
    );
  }
  console.log('-'.repeat(60));

  if (failures.length) {
    console.error('\nLighthouse gate FAILED:');
    for (const f of failures) console.error('  ✗ ' + f);
    process.exitCode = 1;
  } else {
    console.log('\nLighthouse gate passed.');
  }
} finally {
  if (chrome) await chrome.kill();
  stop();
}
