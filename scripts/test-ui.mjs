// Page test: real browser on the built site. Run after a build: npm run test:ui
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, root, entry } from './e2e-lib.mjs';

const srv = await serve();
const browser = await launch();
const errors = [];
let passed = 0;
const step = async (name, fn) => { try { await fn(); passed++; } catch (e) { console.error(`FAIL ${name}\n  ${e.message}`); process.exitCode = 1; } };
const SIZES = { letter: [2550, 3300], a4: [2480, 3508], post: [1080, 1350], square: [1080, 1080], story: [1080, 1920] };
const pngWH = (b) => [b.readUInt32BE(16), b.readUInt32BE(20)];

async function open(width, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 500 ? 844 : 900 }, acceptDownloads: true, locale: 'en-US', ...opts });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(srv.url + entry);
  await page.waitForSelector('#tool[data-ready="true"]');
  return { ctx, page };
}
async function grab(page, btn) {
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click(btn)]);
  return { name: dl.suggestedFilename(), bytes: fs.readFileSync(await dl.path()) };
}

const { ctx, page } = await open(1280);

await step('default is Letter for en-US, sample picture shown', async () => {
  assert.equal(await page.isChecked('input[name="np-format"][value="letter"]'), true);
  assert.equal(await page.textContent('.np-photo[data-slot="main"] [data-role="name"]'), 'Sample picture');
  assert.equal(await page.isVisible('#np-pdf'), true);
});

await step('tap the headline, type, the field list and page follow', async () => {
  await page.click('.np-hit[data-id="headline"]');
  assert.equal(await page.isVisible('#np-editor'), true);
  await page.fill('#np-editor', 'Grandma Rose Wins the Pie Contest');
  assert.equal(await page.inputValue('#np-f-headline'), 'Grandma Rose Wins the Pie Contest');
  await page.keyboard.press('Escape');
  assert.equal(await page.isVisible('#np-editor-box'), false);
  // Focus returns to the headline target.
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.id), 'headline');
});

await step('every visible text field has a tap target', async () => {
  const ids = await page.$$eval('.np-hit', (els) => els.map((e) => e.dataset.id));
  for (const f of ['paper', 'motto', 'earLeft', 'earRight', 'volume', 'date', 'price', 'kicker', 'headline', 'deck', 'byline', 'body', 'caption', 'sideHead', 'sideBody', 'teasers', 'notice']) assert.ok(ids.includes(f), f);
  assert.ok(ids.includes('photo:main'));
});

await step('name swap changes every field', async () => {
  await page.fill('#np-name', 'Maria');
  assert.match(await page.inputValue('#np-f-body'), /Maria is now 40/);
  assert.equal(await page.inputValue('#np-f-headline'), 'Grandma Rose Wins the Pie Contest');
  await page.fill('#np-num', '50');
  assert.match(await page.inputValue('#np-f-sideHead'), /Maria/);
  assert.match(await page.inputValue('#np-f-volume'), /Vol\. 50/);
});

await step('typing a name key by key never changes partial words in edited text', async () => {
  if (!(await page.$eval('#np-all', (d) => d.open))) await page.click('#np-all summary');
  await page.fill('#np-name', 'Sam');
  await page.locator('#np-name').blur();
  await page.fill('#np-f-body', 'I have no idea. An apple. Sam rocks. 4 cakes.');
  await page.fill('#np-num', '40');
  await page.locator('#np-num').blur();
  await page.click('#np-name', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.keyboard.type('Ivy', { delay: 20 });
  assert.equal(await page.inputValue('#np-f-body'), 'I have no idea. An apple. Ivy rocks. 4 cakes.');
  await page.click('#np-name', { clickCount: 3 });
  await page.keyboard.type('Andy', { delay: 20 });
  assert.equal(await page.inputValue('#np-f-body'), 'I have no idea. An apple. Andy rocks. 4 cakes.');
  await page.click('#np-num', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.keyboard.type('45', { delay: 20 });
  assert.equal(await page.inputValue('#np-f-body'), 'I have no idea. An apple. Andy rocks. 4 cakes.');
  assert.match(await page.inputValue('#np-f-volume'), /Vol\. 45/);
  await page.locator('#np-num').blur();
});

await step('date picker fills the date line from local parts', async () => {
  await page.fill('#np-date', '2026-10-21');
  await page.dispatchEvent('#np-date', 'change');
  assert.equal(await page.inputValue('#np-f-date'), 'Wednesday, October 21, 2026');
});

await step('PNG at every size has the right pixels and the text chunk', async () => {
  for (const [f, wh] of Object.entries(SIZES)) {
    await page.check(`input[name="np-format"][value="${f}"]`, { force: true });
    const { name, bytes } = await grab(page, '#np-png');
    assert.deepEqual(pngWH(bytes), wh, f);
    assert.ok(name.endsWith(`-${f}.png`), name);
    assert.ok(bytes.includes(Buffer.from('tEXtComment\0Novelty print. Fictional.')), 'tEXt chunk');
    assert.equal(bytes.includes(Buffer.from('pHYs')), f === 'letter' || f === 'a4', 'pHYs only on print sizes');
    assert.equal(await page.isVisible('#np-pdf'), f === 'letter' || f === 'a4');
  }
});

await step('PDF for Letter and A4 has the right page size', async () => {
  for (const [f, box] of [['letter', '0 0 612 792'], ['a4', '0 0 595.28 841.89']]) {
    await page.check(`input[name="np-format"][value="${f}"]`, { force: true });
    const { bytes } = await grab(page, '#np-pdf');
    const s = bytes.toString('latin1');
    assert.ok(s.startsWith('%PDF-1.4'));
    assert.ok(s.includes(`/MediaBox [${box}]`), f);
    assert.ok(s.includes(`/Width ${SIZES[f][0]} /Height ${SIZES[f][1]}`), f);
  }
});

await step('square lists the second story as not shown', async () => {
  await page.check('input[name="np-format"][value="square"]', { force: true });
  await page.waitForTimeout(150);
  assert.equal(await page.textContent('[data-note="sideBody"]'), 'Not shown at this size');
  await page.check('input[name="np-format"][value="letter"]', { force: true });
});

await step('layouts switch and keep the text', async () => {
  for (const t of ['tabloid', 'vintage', 'classic']) {
    await page.check(`input[name="np-template"][value="${t}"]`, { force: true });
    await page.waitForTimeout(100);
    assert.equal(await page.inputValue('#np-f-headline'), 'Grandma Rose Wins the Pie Contest');
  }
});

await step('photo: add, zoom, keyboard pan, remove', async () => {
  await page.setInputFiles('.np-photo[data-slot="main"] input[type=file]', path.join(root, 'scripts/fixtures/party.jpg'));
  await page.waitForFunction(() => document.querySelector('.np-photo[data-slot="main"] [data-role="name"]').textContent === 'party.jpg');
  assert.equal(await page.textContent('.np-photo[data-slot="main"] [data-role="add"]'), 'Change photo');
  await page.fill('.np-photo[data-slot="main"] [data-role="zoom"]', '2');
  await page.focus('.np-hit[data-id="photo:main"]');
  await page.keyboard.press('ArrowLeft');
  await page.click('.np-photo[data-slot="main"] [data-role="remove"]');
  await page.waitForFunction(() => !document.querySelector('.np-hit[data-id="photo:main"]'));
  assert.equal(await page.textContent('[data-note="caption"]'), 'Add a photo to show it');
});

await step('a file that is not a picture shows a plain message', async () => {
  const bad = path.join(root, 'package.json');
  await page.setInputFiles('.np-photo[data-slot="main"] input[type=file]', bad);
  await page.waitForFunction(() => /not a picture/.test(document.getElementById('np-status').textContent));
});

await step('reload keeps the text, Start over clears it', async () => {
  await page.waitForTimeout(400);
  await page.reload();
  await page.waitForSelector('#tool[data-ready="true"]');
  assert.equal(await page.inputValue('#np-f-headline'), 'Grandma Rose Wins the Pie Contest');
  page.once('dialog', (d) => d.accept());
  await page.click('#np-reset');
  assert.equal(await page.inputValue('#np-f-headline'), 'Sam Turns 40, Town Declares a Holiday');
});

await step('occasion change asks first when text was edited', async () => {
  if (!(await page.$eval('#np-all', (d) => d.open))) await page.click('#np-all summary');
  await page.fill('#np-f-deck', 'My own deck');
  page.once('dialog', (d) => d.dismiss());
  await page.click('.np-chip:has(input[value="retirement"])');
  assert.equal(await page.inputValue('#np-f-deck'), 'My own deck');
  assert.equal(await page.isChecked('input[name="np-occasion"][value="birthday"]'), true);
  page.once('dialog', (d) => d.accept());
  await page.click('.np-chip:has(input[value="retirement"])');
  assert.match(await page.inputValue('#np-f-headline'), /Retires After 30 Great Years/);
  await page.click('#np-surprise');
  assert.doesNotMatch(await page.inputValue('#np-f-headline'), /Retires After 30 Great Years/);
});
await ctx.close();

await step('phone: no sideways scroll, A4 for en-GB, tap targets work', async () => {
  const { ctx: c2, page: p2 } = await open(390, { locale: 'en-GB', hasTouch: true, isMobile: true });
  assert.equal(await p2.isChecked('input[name="np-format"][value="a4"]'), true);
  assert.ok(await p2.evaluate(() => document.documentElement.scrollWidth <= 390), 'horizontal scroll');
  await p2.tap('.np-hit[data-id="paper"]');
  assert.equal(await p2.isVisible('#np-editor'), true);
  const fs16 = await p2.$eval('#np-editor', (e) => parseFloat(getComputedStyle(e).fontSize));
  assert.ok(fs16 >= 16, 'editor font at least 16px');
  // Back and Next step through the text parts without hunting for tiny lines.
  await p2.click('#np-editor-next');
  assert.equal(await p2.textContent('#np-editor-label'), 'Line under the name');
  await p2.click('#np-editor-prev');
  assert.equal(await p2.textContent('#np-editor-label'), 'Newspaper name');
  await p2.click('#np-editor-done');
  // A tap just beside a line that is only a few pixels tall opens the nearest text part.
  const near = await p2.evaluate(() => {
    const hits = document.getElementById('np-hits').getBoundingClientRect();
    const v = document.querySelector('.np-hit[data-id="volume"]').getBoundingClientRect();
    return { x: v.left - 6 - hits.left, y: v.top + v.height / 2 - hits.top, h: v.height };
  });
  assert.ok(near.h < 24, 'the volume line should be a small target at 390');
  await p2.click('#np-hits', { position: { x: near.x, y: near.y } });
  assert.equal(await p2.textContent('#np-editor-label'), 'Volume and number');
  await p2.keyboard.press('Escape');
  // The bottom bar shows once the page is scrolled away, and gets back to it.
  assert.equal(await p2.isVisible('#np-bar'), false);
  await p2.locator('#np-photos').scrollIntoViewIfNeeded();
  await p2.waitForSelector('#np-bar', { state: 'visible' });
  const [dl] = await Promise.all([p2.waitForEvent('download'), p2.click('#np-bar-png')]);
  assert.ok(dl.suggestedFilename().endsWith('-a4.png'));
  await p2.click('#np-bar-see');
  await p2.waitForSelector('#np-bar', { state: 'hidden' });
  // A swipe over the photo scrolls the page; a tap turns on move mode, a second tap ends it.
  assert.equal(await p2.$eval('.np-hit[data-id="photo:main"]', (e) => getComputedStyle(e).touchAction), 'pan-y pinch-zoom');
  await p2.tap('.np-hit[data-id="photo:main"]');
  await p2.waitForFunction(() => document.querySelector('.np-hit[data-id="photo:main"]').classList.contains('is-moving'));
  assert.equal(await p2.$eval('.np-hit[data-id="photo:main"]', (e) => getComputedStyle(e).touchAction), 'none');
  await p2.tap('.np-hit[data-id="photo:main"]');
  await p2.waitForFunction(() => !document.querySelector('.np-hit[data-id="photo:main"]').classList.contains('is-moving'));
  await c2.close();
});

await browser.close();
await srv.close();
assert.deepEqual(errors.filter((e) => !/favicon\.ico/.test(e)), [], 'console errors: ' + errors.join(' | '));
console.log(`ui test: ${passed} steps passed${process.exitCode ? ', some FAILED' : ''}`);
