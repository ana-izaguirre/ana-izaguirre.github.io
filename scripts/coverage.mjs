// Merges the V8 coverage the suite recorded (coverage/raw/, see tests/fixtures.js)
// and reports how much of the page's own JavaScript actually ran.
//
// Code coverage is measured in non-whitespace characters: V8 reports executed
// ranges, not lines, and the scripts are dense enough that "lines" would mean
// little. A function counts as covered when it ran at least once.
//
// Writes coverage/summary.json and coverage/badge.json (shields.io endpoint
// format; the deploy publishes it as /coverage.json). Fails below COVERAGE_MIN.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

// A ratchet: raise it when the suite covers more, never lower it to pass.
const COVERAGE_MIN = Number(process.env.COVERAGE_MIN ?? 100);

const RAW = 'coverage/raw';
if (!existsSync(RAW)) {
  console.error('No coverage recorded. Run the Playwright suite first.');
  process.exit(1);
}

/** One script, identified by where it lives and what it contains. */
const scripts = new Map();

for (const file of readdirSync(RAW)) {
  for (const entry of JSON.parse(readFileSync(`${RAW}/${file}`, 'utf8'))) {
    const key = entry.url.replace(/\?.*$/, '') + '#' + createHash('sha1').update(entry.source).digest('hex').slice(0, 8);
    let s = scripts.get(key);
    if (!s) {
      s = { url: entry.url.replace(/\?.*$/, ''), source: entry.source, hits: new Uint8Array(entry.source.length), fns: new Map() };
      scripts.set(key, s);
    }
    // V8 lists the whole function first, then nested blocks; a nested range
    // overrides its parent. Applying them in that order within one run gives
    // the run's view; OR-ing runs together gives the suite's.
    const run = new Int8Array(entry.source.length).fill(-1);
    for (const fn of entry.functions) {
      for (const r of fn.ranges) run.fill(r.count > 0 ? 1 : 0, r.startOffset, r.endOffset);
      const first = fn.ranges[0];
      const id = fn.functionName + '@' + first.startOffset;
      if (first.startOffset === 0 && first.endOffset === entry.source.length) continue; // the script itself
      s.fns.set(id, (s.fns.get(id) ?? false) || first.count > 0);
    }
    for (let i = 0; i < run.length; i++) if (run[i] === 1) s.hits[i] = 1;
  }
}

let code = 0;
let ran = 0;
let fnTotal = 0;
let fnRan = 0;
const rows = [];

for (const s of scripts.values()) {
  let c = 0;
  let r = 0;
  for (let i = 0; i < s.source.length; i++) {
    if (/\s/.test(s.source[i])) continue;
    c++;
    if (s.hits[i]) r++;
  }
  const f = [...s.fns.values()];
  code += c;
  ran += r;
  fnTotal += f.length;
  fnRan += f.filter(Boolean).length;
  rows.push({ script: s.url.split('/').pop() + ' (' + c + ' chars)', code: r / c, functions: f.length ? f.filter(Boolean).length / f.length : 1 });
}

const pct = (x) => (x * 100).toFixed(1) + '%';
const total = ran / code;
for (const r of rows.sort((a, b) => a.code - b.code)) console.log(`  ${r.script.padEnd(32)} code ${pct(r.code).padStart(6)}   functions ${pct(r.functions).padStart(6)}`);
console.log('-'.repeat(64));
console.log(`  ${'all scripts'.padEnd(32)} code ${pct(total).padStart(6)}   functions ${pct(fnRan / fnTotal).padStart(6)}`);

const shown = Math.floor(total * 1000) / 10;
const color = shown >= 95 ? 'brightgreen' : shown >= 85 ? 'green' : shown >= 70 ? 'yellow' : 'orange';
writeFileSync('coverage/summary.json', JSON.stringify({ code: total, functions: fnRan / fnTotal, scripts: rows }, null, 2));
writeFileSync('coverage/badge.json', JSON.stringify({ schemaVersion: 1, label: 'coverage', message: shown + '%', color }));

if (total * 100 < COVERAGE_MIN) {
  console.error(`\nCoverage ${pct(total)} is below the minimum of ${COVERAGE_MIN}%.`);
  process.exit(1);
}
