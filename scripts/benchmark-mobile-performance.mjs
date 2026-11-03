import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = '/Clean_Portofoio/';
const [baselineDir, candidateDir, outputFile] = process.argv.slice(2);
if (!baselineDir || !candidateDir || !outputFile) {
  throw new Error('Usage: node scripts/benchmark-mobile-performance.mjs <baseline build> <candidate build> <report.json>');
}

const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.pdf': 'application/pdf',
};

async function serve(dir, port) {
  const files = new Map();
  const digest = createHash('sha256');
  async function collect(folder, prefix = '') {
    for (const entry of (await readdir(folder, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const name = prefix + entry.name;
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) await collect(file, name + '/');
      else {
        const body = await readFile(file);
        const type = mime[path.extname(file)] ?? 'application/octet-stream';
        const compressed = /^(?:text\/|image\/svg)/.test(type) ? gzipSync(body) : null;
        digest.update(name).update(body);
        files.set(name, { body, type, compressed });
      }
    }
  }
  await collect(dir);
  const server = createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (!url.pathname.startsWith(base)) { response.writeHead(404).end(); return; }
    const relative = decodeURIComponent(url.pathname.slice(base.length));
    const file = files.get(relative || 'index.html');
    if (!file) { response.writeHead(404).end(); return; }
    const gzip = file.compressed && request.headers['accept-encoding']?.includes('gzip');
    const body = gzip ? file.compressed : file.body;
    response.writeHead(200, {
      'Content-Type': file.type, 'Content-Length': body.length,
      'Cache-Control': relative && relative !== 'index.html' ? 'public, max-age=3600' : 'no-cache',
      ...(gzip ? { 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' } : {}),
    }).end(body);
  });
  await new Promise((resolve, reject) => server.once('error', reject).listen(port, '127.0.0.1', resolve));
  return { server, url: 'http://127.0.0.1:' + port + base, buildHash: digest.digest('hex') };
}

const quantile = (values, fraction) => {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return null;
  return sorted[Math.ceil(fraction * sorted.length) - 1];
};
const median = values => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length ? (sorted[middle] + sorted[Math.floor((sorted.length - 1) / 2)]) / 2 : null;
};
const profiles = [{ name: 'mobile-6x', cpu: 6, mobile: true }, { name: 'mobile-12x', cpu: 12, mobile: true }, { name: 'desktop', cpu: 1, mobile: false }];
const network = { offline: false, latency: 150, downloadThroughput: 1_600_000 / 8, uploadThroughput: 750_000 / 8 };
const startupMs = 12000;
const pairs = Number(process.env.PERF_PAIRS || 5);
const selected = process.env.PERF_PROFILE ? profiles.filter(p => p.name === process.env.PERF_PROFILE) : profiles;
if (!selected.length || !Number.isInteger(pairs) || pairs < 1) throw new Error('Invalid profile or pair count');

function probe(injectBlock) {
  const data = { tasks: [], frames: [], paints: [], events: [], layout: [], marks: {} };
  window.__perf = data;
  const observer = new MutationObserver(() => {
    if (!document.querySelector('h1') || !document.querySelector('[aria-label="Open Terminal"]')) return;
    data.marks.ready = performance.now();
    observer.disconnect();
    if (injectBlock) {
      setTimeout(() => {
        const until = performance.now() + 500;
        while (performance.now() < until) { /* Local negative control only. */ }
      }, 400);
    }
  });
  observer.observe(document, { subtree: true, childList: true });
  const observe = (type, list, options = {}) => {
    if (!PerformanceObserver.supportedEntryTypes.includes(type)) return;
    new PerformanceObserver(entries => entries.getEntries().forEach(e => list.push(e.toJSON()))).observe({ type, buffered: true, ...options });
  };
  observe('longtask', data.tasks);
  observe('largest-contentful-paint', data.paints);
  observe('layout-shift', data.layout);
  observe('event', data.events, { durationThreshold: 16 });
  let previous;
  function frame(at) {
    if (previous !== undefined) data.frames.push({ at, duration: at - previous });
    previous = at;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function summarize(raw, from, to) {
  const frames = raw.frames.filter(f => f.at - f.duration >= from && f.at <= to).map(f => f.duration);
  const tasks = raw.tasks.filter(t => t.startTime < to && t.startTime + t.duration > from);
  const blocking = tasks.reduce((sum, t) => sum + Math.max(0, Math.min(to, t.startTime + t.duration) - Math.max(from, t.startTime) - 50), 0);
  return {
    duration: to - from, blocking, maxTask: Math.max(0, ...tasks.map(t => t.duration)),
    late: frames.length ? frames.filter(dt => dt > 33.4).length / frames.length : null,
    frameP95: quantile(frames, .95), frameCount: frames.length,
  };
}

async function exercise(browser, site, profile, pair) {
  const viewport = profile.mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 };
  const context = await browser.newContext({ viewport, isMobile: profile.mobile, hasTouch: profile.mobile, deviceScaleFactor: profile.mobile ? 2 : 1 });
  await context.addInitScript(probe, !!process.env.PERF_NEGATIVE_CONTROL && site.url.includes(':4181/'));
  const page = await context.newPage();
  const session = await context.newCDPSession(page);
  await session.send('Network.enable');
  await session.send('Network.emulateNetworkConditions', network);
  await session.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu });
  await session.send('Performance.enable');
  const results = [];
  const errors = [];
  let navigationStarted = 0;
  let transferChunks = [];
  const localRequests = new Set();
  session.on('Network.requestWillBeSent', event => {
    if (!event.request.url.startsWith(site.url)) return;
    if (event.type === 'Document') navigationStarted = event.timestamp;
    localRequests.add(event.requestId);
  });
  session.on('Network.dataReceived', event => {
    if (localRequests.has(event.requestId)) transferChunks.push({ at: event.timestamp, bytes: event.encodedDataLength });
  });
  session.on('Network.loadingFinished', event => localRequests.delete(event.requestId));
  session.on('Network.loadingFailed', event => localRequests.delete(event.requestId));
  page.on('pageerror', error => errors.push(error.message));
  const mark = name => page.evaluate(key => { window.__perf.marks[key] = performance.now(); }, name);
  const metrics = async () => Object.fromEntries((await session.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));

  async function touch(delta, count, interval, origin) {
    const point = y => [{ x: 195, y }];
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(origin) });
    for (let i = 1; i <= count; i++) {
      await page.waitForTimeout(interval);
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(origin + delta * i) });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }

  async function journey(name, target, actions) {
    await page.locator(target).first().evaluate(node => node.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await page.waitForTimeout(450);
    const start = await page.evaluate(() => scrollY);
    await mark(name + '-start');
    await actions();
    await page.waitForTimeout(700);
    await mark(name + '-end');
    return { start, end: await page.evaluate(() => scrollY) };
  }

  try {
    for (const cache of ['cold', 'warm']) {
      localRequests.clear();
      transferChunks = [];
      const firstMetric = await metrics();
      await page.goto(site.url, { waitUntil: 'commit', timeout: 30000 });
      await page.locator('h1').waitFor({ state: 'attached', timeout: 25000 });
      const ready = await page.evaluate(() => window.__perf.marks.ready ?? performance.now());
      const elapsed = await page.evaluate(() => performance.now());
      await page.waitForTimeout(Math.max(0, startupMs - elapsed));
      const startData = await page.evaluate(() => ({
        completedBytes: performance.getEntriesByType('resource').reduce((sum, r) => sum + r.transferSize, 0) + performance.getEntriesByType('navigation')[0].transferSize,
        resources: performance.getEntriesByType('resource').map(r => ({ name: r.name, bytes: r.transferSize, end: r.responseEnd })),
        at: performance.now(),
      }));
      startData.bytes = transferChunks.filter(chunk => chunk.at <= navigationStarted + startupMs / 1000)
        .reduce((sum, chunk) => sum + chunk.bytes, 0);
      const lastMetric = await metrics();
      const scroll = await journey('scroll', '#experience', async () => {
        if (profile.mobile) {
          await touch(-26, 12, 28, 660);
          await touch(-25, 12, 28, 660);
          await touch(22, 10, 28, 390);
        } else {
          for (const delta of [130, 180, 130, 180, -120, -140]) {
            await page.mouse.wheel(0, delta);
            await page.waitForTimeout(110);
          }
        }
      });
      const fast = await journey('fast', '#projects', async () => {
        for (let i = 0; i < 3; i++) {
          if (profile.mobile) await touch(-300, 2, 16, 730);
          else await page.mouse.wheel(0, 750);
          await page.waitForTimeout(140);
        }
      });
      const menu = page.getByRole('button', { name: 'Menu', exact: true });
      if (profile.mobile) {
        await menu.tap();
        await page.getByRole('button', { name: 'Close', exact: true }).tap();
      }
      const terminal = page.getByRole('button', { name: 'Open Terminal', exact: true });
      await terminal.click();
      await page.getByText('Welcome to Abdelrahman\'s Portfolio Terminal v1.0.0', { exact: true }).waitFor();
      await page.keyboard.press('Escape');
      const raw = await page.evaluate(() => window.__perf);
      const actions = [...new Map(raw.events.filter(e => e.interactionId).sort((a, b) => a.duration - b.duration).map(e => [e.interactionId, e.duration])).values()];
      results.push({ pair, cache, ready, startData, scroll, fast, actions,
        startup: summarize(raw, 0, startupMs),
        scrollTiming: summarize(raw, raw.marks['scroll-start'], raw.marks['scroll-end']),
        fastTiming: summarize(raw, raw.marks['fast-start'], raw.marks['fast-end']),
        lcp: raw.paints.filter(e => e.startTime <= startupMs).at(-1)?.startTime ?? null,
        startupCpuMs: Math.max(0, (lastMetric.TaskDuration - firstMetric.TaskDuration) * 1000),
        errors: [...errors], raw,
      });
      console.log(JSON.stringify({ profile: profile.name, pair, site: site.url, cache, blocking: results.at(-1).startup.blocking, late: results.at(-1).scrollTiming.late, fastLate: results.at(-1).fastTiming.late, bytes: startData.bytes, lcp: results.at(-1).lcp }));
      if (process.env.PERF_COLD_ONLY) break;
    }
    return results;
  } finally { await context.close(); }
}

const readMetrics = {
  blocking: run => run.startup.blocking, scrollLate: run => run.scrollTiming.late,
  fastLate: run => run.fastTiming.late, bytes: run => run.startData.bytes,
  lcp: run => run.lcp, ready: run => run.ready, cpu: run => run.startupCpuMs,
};
function comparisons(runs) {
  return selected.flatMap(profile => ['cold', 'warm'].map(cache => {
    const group = runs.filter(r => r.profile === profile.name && r.cache === cache);
    const before = group.filter(r => r.version === 'before');
    const after = group.filter(r => r.version === 'after');
    return { profile: profile.name, cache, samples: [before.length, after.length],
      metrics: Object.fromEntries(Object.entries(readMetrics).map(([key, metric]) => {
        const a = median(before.map(metric)), b = median(after.map(metric));
        return [key, { before: a, after: b, reductionPercent: a > 0 && b !== null ? (1 - b / a) * 100 : null }];
      })),
      actionP95: { before: quantile(before.flatMap(r => r.actions), .95), after: quantile(after.flatMap(r => r.actions), .95) },
    };
  }));
}

function gates(summary) {
  return summary.flatMap(row => {
    if (row.samples.some(count => count !== pairs)) return [];
    const { metrics: m, profile, cache } = row;
    const checks = [];
    const check = (name, passed) => checks.push({ profile, cache, name, passed: !!passed });
    const stable = (metric, tolerance = 0) => metric.after !== null && metric.before !== null &&
      metric.after <= metric.before * (1 + tolerance);
    if (profile === 'desktop') {
      check('startup CPU within 5%', stable(m.cpu, .05));
      check('LCP within 5%', stable(m.lcp, .05));
      check('mount readiness within 5%', stable(m.ready, .05));
      return checks;
    }
    if (cache === 'cold') check('first-window wire bytes reduced at least 60%', m.bytes.reductionPercent >= 60);
    check('startup blocking reduced at least 60%', m.blocking.before === 0 ? m.blocking.after === 0 : m.blocking.reductionPercent >= 60);
    for (const [name, metric] of [['ordinary touch', m.scrollLate], ['fast touch', m.fastLate]]) {
      // If fewer than 1% of the baseline intervals were late, enforce the same
      // smoothness ceiling and avoid reporting a percentage against noise.
      check(name + ' late frame gate', metric.before !== null && metric.after !== null &&
        (metric.before < .01 ? metric.after < .01 : metric.reductionPercent >= 60));
    }
    check('LCP maintained', stable(m.lcp));
    check('mount readiness maintained', stable(m.ready));
    check('interaction p95 at or below 200ms', row.actionP95.after !== null && row.actionP95.after <= 200);
    return checks;
  });
}

const sites = { before: await serve(baselineDir, 4180), after: await serve(candidateDir, 4181) };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = { chromium: browser.version(), profiles: selected, network, startupMs, pairs,
  negativeControl: !!process.env.PERF_NEGATIVE_CONTROL,
  builds: Object.fromEntries(Object.entries(sites).map(([key, site]) => [key, { url: site.url, sha256: site.buildHash }])), runs: [], comparisons: [], gates: [] };
await mkdir(path.dirname(path.resolve(outputFile)), { recursive: true });
try {
  for (let pair = 1; pair <= pairs; pair++) for (const profile of selected) {
    for (const version of pair % 2 ? ['before', 'after'] : ['after', 'before']) {
      if (process.env.PERF_BASELINE_ONLY && version === 'after') continue;
      const results = await exercise(browser, sites[version], profile, pair);
      report.runs.push(...results.map(result => ({ ...result, profile: profile.name, version })));
      report.comparisons = comparisons(report.runs);
      report.gates = gates(report.comparisons);
      await writeFile(outputFile, JSON.stringify(report, null, 2));
    }
  }
} finally {
  await browser.close();
  for (const site of Object.values(sites)) site.server.close();
}
if (report.gates.some(check => !check.passed) || report.runs.some(run => run.errors.length)) process.exitCode = 1;
