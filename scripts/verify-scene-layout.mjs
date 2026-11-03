import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i < 0 ? fallback : process.argv[i + 1]; };
const beforeName = arg('--before', 'scenes-before'), afterName = arg('--after', 'scenes-after');
const pixelBeforeName = arg('--pixel-before', beforeName);
const expectedHead = arg('--expected-head', '52cfa85');
const negative = process.argv.includes('--negative-control');
const out = `output/playwright/scene-layout${negative ? '-negative' : ''}`;
await mkdir(out, { recursive: true });
const before = JSON.parse(await readFile(`output/playwright/${beforeName}/report.json`, 'utf8'));
const after = JSON.parse(await readFile(`output/playwright/${afterName}/report.json`, 'utf8'));
const report = { baselineHead: before.head, baselineSource: before.sourceBefore, currentSource: after.sourceBefore, pixelReference: pixelBeforeName, checks: [], pixels: [], negativeControl: negative, passed: false };
const check = (name, passed, evidence) => { report.checks.push({ name, passed: !!passed, evidence }); if (!passed) console.error(`FAIL ${name}`, JSON.stringify(evidence)); };
async function fingerprint() {
  const files = [];
  async function walk(dir) { for (const f of await readdir(dir, { withFileTypes: true })) { const p = `${dir}/${f.name}`; f.isDirectory() ? await walk(p) : files.push(p); } }
  await walk('src'); const hash = createHash('sha256');
  for (const file of files.sort()) { hash.update(file); hash.update(await readFile(file)); }
  return hash.digest('hex');
}
const within = (a, b) => Math.abs(a - b) <= 1;
const stableCopy = text => text.replace(/\d+ contributions in the last year/g, '<live contribution count>')
  .replace(/last_build: \d{4}-\d{2}-\d{2}/g, 'last_build: <runtime calendar date>');
if (negative) after.viewports.desktop.elements.find(e => e.section === 'projects' && e.tag === 'img').rect.width += 10;
try {
  check('Before and after captures are source-coherent', before.sourceBefore === before.sourceAfter && after.sourceBefore === after.sourceAfter);
  check(`Baseline is the approved${expectedHead} source`, before.head.startsWith(expectedHead), before.head);
  check('Final capture belongs to the source currently checked out', await fingerprint() === after.sourceAfter);
  for (const viewport of ['desktop', 'laptop', 'tablet', 'mobile']) {
    const a = before.viewports[viewport], b = after.viewports[viewport];
    const aboutDelta = b.sections.find(s => s.key === 'about').rect.height - a.sections.find(s => s.key === 'about').rect.height;
    const followingAbout = id => a.sections.findIndex(s => s.key === id) > a.sections.findIndex(s => s.key === 'about');
    report.authorizedAboutUpdate ||= { source: 'User explicitly confirmed retaining concurrent3-paragraph About, inlineMicrosoftlogo and AIEngineer badge', heightDelta: {} };
    report.authorizedAboutUpdate.heightDelta[viewport] = aboutDelta;
    check(`${viewport}: no horizontal overflow`, b.scrollWidth === b.innerWidth, { scrollWidth: b.scrollWidth, width: b.innerWidth });
    check(`${viewport}: no uncaught errors or failed requests`, !b.pageErrors.length && !b.failedRequests.length, { errors: b.pageErrors, requests: b.failedRequests });
    check(`${viewport}: actual content images decoded`, b.loadedImages.every(i => i.complete && i.width > 0), b.loadedImages.filter(i => !i.complete || !i.width));
    check(`${viewport}: unchanged section order`, a.sections.map(s => s.key).join('|') === b.sections.map(s => s.key).join('|'));
    for (const old of a.sections) {
      const now = b.sections.find(s => s.key === old.key);
      const expected = { ...old.rect, y: old.rect.y + (followingAbout(old.key) ? aboutDelta : 0) };
      check(`${viewport}: ${old.key} section geometry`, !!now && ['x', 'y', 'width', ...(old.key === 'about' ? [] : ['height'])].every(k => within(expected[k], now.rect[k])), { before: old.rect, expected, after: now?.rect });
    }
    const portraitSelector = a.elements.find(e => e.section === 'about' && e.tag === 'img')?.selector;
    for (const old of a.elements.filter(e => e.rect.width > 0 && e.rect.height > 0)) {
      if (old.section === 'about' && old.tag !== 'h2' && old.selector !== portraitSelector) continue;
      const now = b.elements.find(e => e.selector === old.selector);
      check(`${viewport}: ${old.selector} element retained`, !!now);
      if (!now) continue;
      const expected = { ...old.rect, y: old.rect.y + (followingAbout(old.section) ? aboutDelta : 0) };
      check(`${viewport}: ${old.selector} finished bounds`, ['x', 'y', 'width', 'height'].every(k => within(expected[k], now.rect[k])), { before: old.rect, expected, after: now.rect });
      check(`${viewport}: ${old.selector} unchanged content/font/spacing`, stableCopy(old.text) === stableCopy(now.text) && JSON.stringify(old.font) === JSON.stringify(now.font) && old.padding === now.padding && old.margin === now.margin,
        old.text === now.text ? undefined : { before: old.text, after: now.text });
    }
    for (const section of a.sections) {
      if (section.key === 'about') continue;
      const currentSection = b.sections.find(s => s.key === section.key);
      // Original52 geometry remains authoritative above. A separately recorded
      // pixel reference may include ONLY the user-approved About content patch,
      // so its downstream raster origins match despite the authorized height shift.
      const baseFile = `output/playwright/${pixelBeforeName}/${viewport}/${section.key}-section.png`;
      const finalFile = `output/playwright/${afterName}/${viewport}/${section.key}-section.png`;
      const ma = await sharp(baseFile).metadata(), mb = await sharp(finalFile).metadata();
      check(`${viewport}: ${section.key} screenshot dimensions`, ma.width === mb.width && ma.height === mb.height, { before: [ma.width, ma.height], after: [mb.width, mb.height] });
      if (ma.width !== mb.width || ma.height !== mb.height) continue;
      let extract;
      // The hero's stochastic canvas and role loop are normalized by the capture;
      // compare its approved finished name separately as an exact visual invariant.
      if (section.key === 'hero') {
        const heading = a.elements.find(e => e.section === 'hero' && e.tag === 'h1');
        extract = { left: Math.floor(heading.rect.x - section.rect.x), top: Math.floor(heading.rect.y - section.rect.y), width: Math.floor(heading.rect.width), height: Math.floor(heading.rect.height) };
      }
      const size = extract || { left: 0, top: 0, width: ma.width, height: ma.height };
      const first = await sharp(baseFile).extract(size).ensureAlpha().raw().toBuffer();
      const second = await sharp(finalFile).extract(size).ensureAlpha().raw().toBuffer();
      const exceptions = [];
      if (section.key === 'experience') for (const logo of b.companyLogoBoxes || []) exceptions.push({ reason: 'User-requested evidence loader/color inside existing logo bounds', x: logo.x - currentSection.rect.x - 2, y: logo.y - currentSection.rect.y - 2, width: logo.width + 4, height: logo.height + 4 });
      if (section.key === 'skills' && b.calendarBox) exceptions.push({ reason: 'External live GitHub contributions changed after baseline capture; no application data fabricated', x: b.calendarBox.x - currentSection.rect.x, y: b.calendarBox.y - currentSection.rect.y, width: b.calendarBox.width, height: b.calendarBox.height });
      const diff = Buffer.alloc(first.length); let changed = 0, maximum = 0;
      for (let i = 0; i < first.length; i += 4) {
        const x = (i / 4) % size.width, y = Math.floor(i / 4 / size.width);
        if (exceptions.some(box => x >= box.x && x < box.x + box.width && y >= box.y && y < box.y + box.height)) { first.copy(diff, i, i, i + 4); continue; }
        const delta = Math.max(...[0, 1, 2].map(k => Math.abs(first[i + k] - second[i + k])));
        maximum = Math.max(maximum, delta);
        if (delta > 16) { changed++; diff[i] = 240; diff[i + 1] = 80; diff[i + 2] = 30; diff[i + 3] = 255; }
        else { diff[i] = first[i]; diff[i + 1] = first[i + 1]; diff[i + 2] = first[i + 2]; diff[i + 3] = 60; }
      }
      const ratio = changed / (size.width * size.height);
      report.pixels.push({ viewport, section: section.key, extract: extract || null, changed, changedRatio: ratio, maximumChannelDelta: maximum, exceptions });
      await sharp(diff, { raw: { width: size.width, height: size.height, channels: 4 } }).png().toFile(`${out}/${viewport}-${section.key}-diff.png`);
      check(`${viewport}: ${section.key} finished visual fidelity`, ratio <= .0005, { changedRatio: ratio, allowed: .0005, pixels: changed });
    }
    console.log(`${viewport}: ${report.checks.filter(c => c.name.startsWith(viewport) && c.passed).length} passing geometry/content/pixel checks`);
  }
  report.sourceAfter = await fingerprint();
  check('No source drift during comparison', report.sourceAfter === after.sourceAfter);
  report.passed = report.checks.every(c => c.passed);
} catch (error) { report.failure = error.stack; console.error(error); }
finally {
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, failed: report.checks.filter(c => !c.passed).length, out }));
  if (!report.passed) process.exitCode = 1;
}
