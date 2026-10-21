// Privacy test (spec 5.2). Records every request while a photo with a marker is added, the marker is typed
// into the headline, and PNG and PDF files are made. Fails if any request is not a plain GET to this host,
// or carries the photo or text marker. Run after a build: npm run test:network
import assert from 'node:assert/strict';
import path from 'node:path';
import { serve, launch, root, entry } from './e2e-lib.mjs';

const PHOTO_MARK = 'PHOTO-MARKER-9d41'; // inside a comment segment of the fixture JPEG
const TEXT_MARK = 'TEXT-MARKER-51c8';
const srv = await serve();
const browser = await launch();
const ctx = await browser.newContext({ acceptDownloads: true, locale: 'en-US' });
const page = await ctx.newPage();
const seen = [];
ctx.on('request', (r) => seen.push({ url: r.url(), method: r.method(), headers: r.headers(), body: r.postData() || '' }));
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.addInitScript(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; });

await page.goto(srv.url + entry);
await page.waitForSelector('#tool[data-ready="true"]');
await page.setInputFiles('.np-photo[data-slot="main"] input[type=file]', path.join(root, 'scripts/fixtures/party.jpg'));
await page.setInputFiles('.np-photo[data-slot="side"] input[type=file]', path.join(root, 'scripts/fixtures/party.jpg'));
await page.waitForFunction(() => document.querySelector('.np-photo[data-slot="side"] [data-role="name"]').textContent === 'party.jpg');
await page.click('.np-hit[data-id="headline"]');
await page.fill('#np-editor', 'Headline ' + TEXT_MARK);
await page.keyboard.press('Escape');
for (const btn of ['#np-png', '#np-pdf']) {
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click(btn)]);
  await dl.path();
}
await page.click('#np-print');
await page.waitForFunction(() => window.__printed === 1);
await page.check('input[name="np-format"][value="story"]', { force: true });
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#np-png')]);
await dl.path();
await page.waitForTimeout(400);

const host = new URL(srv.url).host;
const problems = [];
for (const r of seen) {
  if (r.url.startsWith('data:') || r.url.startsWith('blob:')) continue;
  if (new URL(r.url).host !== host) problems.push(`host not allowed: ${r.url}`);
  if (r.method !== 'GET') problems.push(`not a GET: ${r.method} ${r.url}`);
  const text = r.url + JSON.stringify(r.headers) + r.body;
  for (const m of [PHOTO_MARK, TEXT_MARK]) if (text.includes(m)) problems.push(`marker in request: ${r.url}`);
  if (r.body) problems.push(`request has a body: ${r.url}`);
}
// The photo is never stored on the device either.
const stored = await page.evaluate(() => JSON.stringify(localStorage));
assert.ok(!stored.includes('party.jpg') && !stored.includes('data:image'), 'photo found in localStorage');
assert.ok(stored.includes(TEXT_MARK), 'text should be saved on this device');
await browser.close();
await srv.close();
assert.deepEqual(problems, [], problems.join('\n'));
assert.deepEqual(errors, [], 'console errors: ' + errors.join(' | '));
console.log(`network test: ${seen.length} requests, all GET to ${host}, none carry the photo or the text`);
