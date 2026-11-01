import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const value = (flag, fallback) => { const i = process.argv.indexOf(flag); return i < 0 ? fallback : process.argv[i + 1]; };
const baselinePath = path.resolve(value('--baseline', 'output/playwright/baseline'));
const afterPath = path.resolve(value('--after', 'output/playwright/after'));
const out = path.resolve(value('--output', 'output/playwright/comparison'));
await mkdir(out, { recursive: true });
const baseline = JSON.parse(await readFile(path.join(baselinePath, 'report.json'), 'utf8'));
const after = JSON.parse(await readFile(path.join(afterPath, 'report.json'), 'utf8'));
const negativeControl = process.argv.includes('--negative-control');
if (negativeControl) {
  // Mutate only an in-memory copy of captured evidence, never the app or saved receipts.
  after.viewports.desktop.sections.find(section => section.key === 'about').rect.y += 10;
}
const report = { baselineSource: baseline.sourceBefore, afterSource: after.sourceBefore, negativeControl, screenshotSource: 'Full-page screenshot cropped to captured document section rectangles. Original individual section captures are retained; mobile element screenshots can reposition fixed navigation during automatic screenshot scrolling.', tolerances: { rectPixels: 0.1, screenshotChannelDelta: 12, maximumUnmaskedPixelDifferenceRatio: 0.0015 }, authorizedExceptions: ['Project content/cards/media/flowchart changed at user request; outer grid and section geometry must still match', 'Microsoft replaces original badge; badge width may grow, original height/vertical position must match', 'Owner portrait replaces original avatar; original image rectangle must match', 'Hero repository count metadata is an explicitly requested content change', 'Original animated role text and finale marquee are masked because they vary independently with elapsed time'], failures: [], viewports: {} };
const fail = (viewport, kind, detail) => report.failures.push({ viewport, kind, ...detail });
const dimensions = ['x', 'y', 'width', 'height'];
function compareRect(viewport, kind, key, beforeRect, afterRect) {
  if (!afterRect) { fail(viewport, kind, { key, reason: 'missing rectangle' }); return; }
  for (const dimension of dimensions) {
    const delta = afterRect[dimension] - beforeRect[dimension];
    if (Math.abs(delta) > report.tolerances.rectPixels) fail(viewport, kind, { key, dimension, before: beforeRect[dimension], after: afterRect[dimension], delta });
  }
}
function namedElements(elements) {
  const counts = new Map(); const result = new Map();
  for (const element of elements) {
    // Grid/section aggregate text necessarily changes when requested content is replaced.
    if (['section', 'div'].includes(element.tag) || element.section === 'projects') continue;
    // Hero annotations and badge copy are intentional content edits, while the h1,
    // existing social controls, CV and role/technology slots retain independent checks.
    if (element.section === 'hero' && ['p', 'img'].includes(element.tag)) continue;
    const base = `${element.section}|${element.tag}|${element.text}`;
    const occurrence = counts.get(base) || 0; counts.set(base, occurrence + 1);
    result.set(`${base}|${occurrence}`, element);
  }
  return result;
}
function masksFor(name, section, beforeView, afterView, width, height) {
  const masks = [];
  const localRect = (rect, sectionRect) => ({ x: rect.x - sectionRect.x, y: rect.y - sectionRect.y, width: rect.width, height: rect.height });
  const add = rect => masks.push({ x: Math.max(0, Math.floor(rect.x) - 3), y: Math.max(0, Math.floor(rect.y) - 3), width: Math.ceil(rect.width) + 6, height: Math.ceil(rect.height) + 6 });
  const beforeSection = beforeView.sections.find(s => s.key === section).rect;
  const afterSection = afterView.sections.find(s => s.key === section).rect;
  if (section === 'hero') {
    for (const view of [beforeView, afterView]) {
      const sectionRect = view === beforeView ? beforeSection : afterSection;
      // Original badge region and its authorized Microsoft replacement.
      if (view.heroSlots[0]) add(localRect(view.heroSlots[0].rect, sectionRect));
      // Existing continuously animated role occupies a stable 32px reserved slot.
      if (view.heroSlots[2]) add(localRect(view.heroSlots[2].rect, sectionRect));
      for (const element of view.elements.filter(e => e.section === 'hero' && e.tag === 'p' && /const (projects|repos)|public|private|selected/.test(e.text))) add(localRect(element.rect, sectionRect));
    }
  }
  if (section === 'about') {
    for (const [view, sectionRect] of [[beforeView, beforeSection], [afterView, afterSection]]) {
      const image = view.elements.find(e => e.section === 'about' && e.tag === 'img');
      if (image) add(localRect(image.rect, sectionRect));
    }
  }
  if (section === 'finale') masks.push({ x: 0, y: 0, width, height: 82 });
  return masks.map(mask => ({ ...mask, width: Math.min(mask.width, width - mask.x), height: Math.min(mask.height, height - mask.y) })).filter(mask => mask.width > 0 && mask.height > 0);
}
async function pixelDiff(viewport, section, beforeView, afterView) {
  const beforeFile = path.join(baselinePath, viewport, 'full-page.png');
  const afterFile = path.join(afterPath, viewport, 'full-page.png');
  const crop = rect => ({ left: Math.floor(rect.x), top: Math.floor(rect.y), width: Math.ceil(rect.width), height: Math.ceil(rect.height) });
  // Cropping the same full-page coordinate system avoids locator.screenshot's
  // automatic scroll changing the position of an unrelated fixed mobile nav.
  const before = await sharp(beforeFile).extract(crop(beforeView.sections.find(s => s.key === section).rect)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const next = await sharp(afterFile).extract(crop(afterView.sections.find(s => s.key === section).rect)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (before.info.width !== next.info.width || before.info.height !== next.info.height) {
    fail(viewport, 'screenshot-dimensions', { section, before: before.info, after: next.info });
    return { section, passed: false, reason: 'image dimensions differ' };
  }
  const { width, height } = before.info;
  const masks = masksFor(viewport, section, beforeView, afterView, width, height);
  const diff = Buffer.alloc(width * height * 4);
  let compared = 0, changed = 0, maximumDelta = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const offset = (y * width + x) * 4;
    const masked = masks.some(m => x >= m.x && x < m.x + m.width && y >= m.y && y < m.y + m.height);
    const delta = Math.max(...[0, 1, 2].map(channel => Math.abs(before.data[offset + channel] - next.data[offset + channel])));
    if (!masked) { compared++; maximumDelta = Math.max(maximumDelta, delta); if (delta > 12) changed++; }
    diff[offset] = !masked && delta > 12 ? 255 : before.data[offset] * 0.22;
    diff[offset + 1] = masked ? 160 : before.data[offset + 1] * 0.22;
    diff[offset + 2] = masked ? 180 : before.data[offset + 2] * 0.22;
    diff[offset + 3] = 255;
  }
  const ratio = compared ? changed / compared : 0;
  const passed = ratio <= report.tolerances.maximumUnmaskedPixelDifferenceRatio;
  if (!passed) fail(viewport, 'screenshot-pixels', { section, compared, changed, ratio });
  await sharp(diff, { raw: { width, height, channels: 4 } }).png().toFile(path.join(out, `${viewport}-${section}-diff.png`));
  return { section, width, height, masks, compared, changed, ratio, maximumDelta, passed };
}

for (const [name, beforeView] of Object.entries(baseline.viewports)) {
  const next = after.viewports[name];
  if (!next) { fail(name, 'viewport', { reason: 'missing capture' }); continue; }
  const previousFailureCount = report.failures.length;
  if (next.scrollWidth !== next.innerWidth) fail(name, 'overflow', { scrollWidth: next.scrollWidth, innerWidth: next.innerWidth });
  if (next.pageErrors.length) fail(name, 'page-errors', { errors: next.pageErrors });
  if (next.failedRequests.length) fail(name, 'failed-requests', { requests: next.failedRequests });
  if (next.fonts !== 'loaded') fail(name, 'fonts', { status: next.fonts });
  const unloadedImages = next.loadedImages.filter(img => !img.complete || img.width === 0);
  if (unloadedImages.length) fail(name, 'images', { unloadedImages });
  for (const section of beforeView.sections) compareRect(name, 'section', section.key, section.rect, next.sections.find(s => s.key === section.key)?.rect);
  for (let i = 0; i < beforeView.heroSlots.length; i++) {
    if (i === 0) {
      const beforeSlot = beforeView.heroSlots[i]?.rect; const nextSlot = next.heroSlots[i]?.rect;
      if (!nextSlot || Math.abs(beforeSlot.y - nextSlot.y) > 0.1 || Math.abs(beforeSlot.height - nextSlot.height) > 0.1) fail(name, 'hero-badge', { before: beforeSlot, after: nextSlot });
    } else compareRect(name, 'hero-slot', `index:${i}`, beforeView.heroSlots[i].rect, next.heroSlots[i]?.rect);
  }
  const oldElements = namedElements(beforeView.elements); const newElements = namedElements(next.elements);
  let matchedElements = 0;
  for (const [key, beforeElement] of oldElements) {
    const afterElement = newElements.get(key);
    if (!afterElement) { fail(name, 'preserved-content', { key, reason: 'missing original content/control' }); continue; }
    matchedElements++;
    compareRect(name, 'element', key, beforeElement.rect, afterElement.rect);
    for (const property of ['font', 'display', 'margin', 'padding']) if (JSON.stringify(beforeElement[property]) !== JSON.stringify(afterElement[property])) fail(name, 'element-style', { key, property, before: beforeElement[property], after: afterElement[property] });
  }
  for (let i = 0; i < beforeView.grids.length; i++) {
    const oldGrid = beforeView.grids[i]; const newGrid = next.grids[i];
    compareRect(name, 'grid', oldGrid.selector, oldGrid.rect, newGrid?.rect);
    if (oldGrid.template !== newGrid?.template || oldGrid.gap !== newGrid?.gap) fail(name, 'grid-structure', { key: oldGrid.selector, before: { template: oldGrid.template, gap: oldGrid.gap }, after: { template: newGrid?.template, gap: newGrid?.gap } });
    if (!oldGrid.selector.startsWith('#projects')) oldGrid.children.forEach((child, index) => compareRect(name, 'grid-child', `${oldGrid.selector}:${index}`, child.rect, newGrid?.children[index]?.rect));
  }
  const screenshots = [];
  for (const section of beforeView.sections) {
    if (section.key === 'projects') continue; // Requested replaced content, geometry independently enforced above.
    screenshots.push(await pixelDiff(name, section.key, beforeView, next));
  }
  report.viewports[name] = { matchedElements, sectionsCompared: beforeView.sections.length, gridsCompared: beforeView.grids.length, screenshots, failures: report.failures.length - previousFailureCount };
}
if (after.sourceChangedDuringCapture) fail('all', 'source', { reason: 'source changed during after capture' });
report.passed = report.failures.length === 0;
await writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ passed: report.passed, negativeControl, failures: report.failures, viewports: Object.fromEntries(Object.entries(report.viewports).map(([name, result]) => [name, { matchedElements: result.matchedElements, screenshots: result.screenshots.map(s => ({ section: s.section, changed: s.changed, ratio: s.ratio, passed: s.passed })), failures: result.failures }])) }, null, 2));
process.exitCode = report.passed ? 0 : 1;
