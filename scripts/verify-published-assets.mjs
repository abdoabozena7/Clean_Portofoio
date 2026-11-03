import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const url = process.env.PORTFOLIO_URL || 'https://abdoabozena7.github.io/Clean_Portofoio/';
const out = process.env.PORTFOLIO_EVIDENCE_DIR || 'output/deploy-unified';
const source = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const branch = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
const localHtml = await readFile('dist/index.html', 'utf8');
const entry = localHtml.match(/assets\/index-[\w-]+\.js/)?.[0];
if (!entry) throw new Error('Built application entry missing');
const report = { url, source, branch, entry, assets: [], passed: false };
await mkdir(out, { recursive: true });
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
try {
  let live = '';
  for (let attempt = 0; attempt < 36; attempt++) {
    const response = await fetch(url, { cache: 'no-store' });
    live = await response.text();
    if (response.ok && live.includes(entry)) break;
    console.log(`Waiting for Pages to publish ${entry}`);
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  if (!live.includes(entry)) throw new Error('Public URL still serves a different release');
  for (const name of (await readdir('dist/assets')).filter(name => /\.(js|css)$/.test(name))) {
    const response = await fetch(new URL(`assets/${name}`, url), { cache: 'no-store' });
    const remote = Buffer.from(await response.arrayBuffer());
    const local = await readFile(`dist/assets/${name}`);
    if (!response.ok || digest(remote) !== digest(local)) throw new Error(`Published asset mismatch: ${name}`);
    report.assets.push({ name, sha256: digest(local) });
    console.log(`Exact published bytes: ${name}`);
  }
  report.passed = true;
} finally {
  await writeFile(`${out}/published-bytes.json`, JSON.stringify(report, null, 2));
}
