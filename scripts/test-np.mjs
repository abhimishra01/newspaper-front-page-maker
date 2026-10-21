// Known-answer tests for the newspaper maker core (no browser). Run: npm test
import assert from 'node:assert/strict';
import { FORMATS, FORMAT_IDS, designHeight, defaultFormat } from '../src/lib/np/formats.js';
import { wrap, fitText, flow, paragraphs } from '../src/lib/np/text.js';
import { parseISODate, formatDateLine, toISODate } from '../src/lib/np/date.js';
import { addPngText, crc32, pngSize } from '../src/lib/np/png.js';
import { buildPdf } from '../src/lib/np/pdf.js';
import { fileName } from '../src/lib/np/filename.js';
import { PRESETS, PRESET_IDS, SURPRISE, BLOCKED, FIELD_IDS, presetFields, swapValue, surprise, fill } from '../src/lib/np/presets.js';
import { layout, TEMPLATE_IDS } from '../src/lib/np/layout.js';

let passed = 0;
const test = (name, fn) => {
  try { fn(); passed++; } catch (e) { console.error(`FAIL ${name}\n  ${e.message}`); process.exitCode = 1; }
};

// Fake text measure: width = characters x size x factor (capitals are wider).
const measure = (text, font) => {
  const size = +/(\d+(?:\.\d+)?)px/.exec(font)[1];
  let w = 0;
  for (const ch of text) w += (/[A-Z0-9]/.test(ch) ? 0.62 : ch === ' ' ? 0.28 : 0.5) * size;
  return w;
};

// 1. Formats
test('format pixel and PDF sizes', () => {
  assert.deepEqual([FORMATS.letter.w, FORMATS.letter.h], [2550, 3300]);
  assert.deepEqual([FORMATS.a4.w, FORMATS.a4.h], [2480, 3508]);
  assert.deepEqual([FORMATS.post.w, FORMATS.post.h], [1080, 1350]);
  assert.deepEqual([FORMATS.square.w, FORMATS.square.h], [1080, 1080]);
  assert.deepEqual([FORMATS.story.w, FORMATS.story.h], [1080, 1920]);
  assert.deepEqual(FORMATS.letter.pdf, [612, 792]);
  assert.deepEqual(FORMATS.a4.pdf, [595.28, 841.89]);
  // 300 DPI: Letter 8.5 x 11 in, A4 210 x 297 mm.
  assert.equal(Math.round(8.5 * 300), 2550); assert.equal(Math.round(11 * 300), 3300);
  assert.equal(Math.round(210 / 25.4 * 300), 2480); assert.equal(Math.round(297 / 25.4 * 300), 3508);
  assert.equal(+(210 / 25.4 * 72).toFixed(2), 595.28); assert.equal(+(297 / 25.4 * 72).toFixed(2), 841.89);
});
test('design heights', () => {
  const h = Object.fromEntries(FORMAT_IDS.map((f) => [f, +designHeight(f).toFixed(2)]));
  assert.deepEqual(h, { letter: 1294.12, a4: 1414.52, post: 1250, square: 1000, story: 1777.78 });
});
test('default format by language', () => {
  assert.equal(defaultFormat('en-US'), 'letter');
  assert.equal(defaultFormat('en-CA'), 'letter');
  assert.equal(defaultFormat('en-GB'), 'a4');
  assert.equal(defaultFormat('hi-IN'), 'a4');
  assert.equal(defaultFormat(''), 'a4');
});

// 2. PDF writer
test('PDF structure, MediaBox and xref', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 1, 2, 3, 4, 5, 0xff, 0xd9]);
  for (const [id, box] of [['letter', '0 0 612 792'], ['a4', '0 0 595.28 841.89']]) {
    const f = FORMATS[id];
    const pdf = buildPdf(jpeg, f.w, f.h, f.pdf, { title: 'The (Birthday) Bugle', subject: 'Novelty print. Fictional.' });
    const s = Buffer.from(pdf).toString('latin1');
    assert.ok(s.startsWith('%PDF-1.4\n'));
    assert.ok(s.includes(`/MediaBox [${box}]`), `MediaBox for ${id}`);
    assert.ok(s.includes(`/Width ${f.w} /Height ${f.h}`));
    assert.ok(s.includes(`/Length ${jpeg.length} >>\nstream\n`));
    assert.ok(s.includes('(The \\(Birthday\\) Bugle)'), 'title escaped');
    // The image stream holds exactly the JPEG bytes.
    const at = s.indexOf('stream\n', s.indexOf('/Subtype /Image')) + 7;
    assert.deepEqual([...pdf.subarray(at, at + jpeg.length)], [...jpeg]);
    assert.equal(s.slice(at + jpeg.length, at + jpeg.length + 10), '\nendstream');
    // Each xref offset points at "N 0 obj"; startxref points at "xref".
    const startxref = +/startxref\n(\d+)\n%%EOF/.exec(s)[1];
    assert.equal(s.slice(startxref, startxref + 4), 'xref');
    const rows = s.slice(startxref).split('\n').slice(3, 9);
    rows.forEach((row, i) => {
      const off = +row.slice(0, 10);
      assert.equal(s.slice(off, off + `${i + 1} 0 obj`.length), `${i + 1} 0 obj`, `xref ${i + 1}`);
    });
    // Content stream length matches its bytes.
    const m = /<< \/Length (\d+) >>\nstream\n(q [^\n]*\n)endstream/.exec(s);
    assert.equal(+m[1], m[2].length);
    assert.ok(m[2].startsWith(`q ${box.split(' ')[2]} 0 0 ${box.split(' ')[3]} 0 0 cm`));
  }
});

// 3. PNG text chunk
test('PNG tEXt chunk after IHDR with a correct CRC', () => {
  // CRC-32 known answers.
  assert.equal(crc32(new TextEncoder().encode('IEND')).toString(16), 'ae426082');
  assert.equal(crc32(new TextEncoder().encode('123456789')).toString(16), 'cbf43926');
  // A minimal 1x1 PNG.
  const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64'));
  const out = addPngText(png, 'Comment', 'Novelty print. Fictional. Made with bingemind.com');
  assert.equal(out.length, png.length + 12 + 'Comment'.length + 1 + 'Novelty print. Fictional. Made with bingemind.com'.length);
  assert.deepEqual([...out.subarray(0, 33)], [...png.subarray(0, 33)]);
  const dv = new DataView(out.buffer);
  const len = dv.getUint32(33);
  assert.equal(Buffer.from(out.subarray(37, 41)).toString('latin1'), 'tEXt');
  assert.equal(Buffer.from(out.subarray(41, 41 + len)).toString('latin1'), 'Comment\0Novelty print. Fictional. Made with bingemind.com');
  assert.equal(dv.getUint32(41 + len), crc32(out, 37, 41 + len));
  assert.deepEqual([...out.subarray(45 + len)], [...png.subarray(33)]);
  assert.deepEqual(pngSize(out), { w: 1, h: 1 });
  assert.throws(() => addPngText(new Uint8Array(40), 'a', 'b'));
});

// 4. Text wrap
test('wrap: paragraphs, long words, empty', () => {
  const f = '400 10px serif';
  assert.deepEqual(wrap('', 100, f, measure), []);
  assert.deepEqual(wrap('   ', 100, f, measure), []);
  assert.deepEqual(paragraphs('a\n\n b  c \r\nd'), ['a', 'b c', 'd']);
  const l = wrap('one two\nthree', 1000, f, measure);
  assert.deepEqual(l.map((x) => [x.text, x.end]), [['one two', true], ['three', true]]);
  const long = wrap('supercalifragilistic', 40, f, measure);
  assert.ok(long.length > 1);
  assert.equal(long.map((x) => x.text).join(''), 'supercalifragilistic');
  for (const x of long) assert.ok(measure(x.text, f) <= 40);
  const many = wrap('a  b    c', 1000, f, measure);
  assert.equal(many[0].text, 'a b c');
});
test('fitText never overflows and picks the largest size', () => {
  const font = (s) => `700 ${s}px serif`;
  const r = fitText('Sam Turns 40, Town Declares a Holiday', { font, minSize: 20, maxSize: 100, w: 600, h: 200, lh: 1.1, maxLines: 3 }, measure);
  assert.ok(r.lines.length * r.size * 1.1 <= 200 + 0.01);
  for (const l of r.lines) assert.ok(measure(l.text, font(r.size)) <= 600);
  const up = fitText('Sam Turns 40, Town Declares a Holiday', { font, minSize: 20, maxSize: 100, w: 600, h: 200, lh: 1.1, maxLines: 3 }, measure);
  assert.equal(up.size, r.size);
  // One size larger does not fit.
  const bigger = wrap('Sam Turns 40, Town Declares a Holiday', 600, font(r.size + 1), measure);
  assert.ok(bigger.length > 3 || bigger.length * (r.size + 1) * 1.1 > 200);
  // Too much text at the min size: cut with an ellipsis, still inside the box.
  const cut = fitText('word '.repeat(200), { font, minSize: 20, maxSize: 40, w: 300, h: 100, lh: 1.1, maxLines: 4 }, measure);
  assert.equal(cut.cut, true);
  assert.ok(cut.lines.length * 20 * 1.1 <= 100);
  assert.ok(cut.lines[cut.lines.length - 1].text.endsWith('…'));
});
test('flow: columns of different widths, cut with ellipsis', () => {
  const f = '400 10px serif';
  const cols = [{ x: 0, y: 0, w: 100, h: 50 }, { x: 120, y: 0, w: 60, h: 50 }];
  const r = flow('alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigma tau upsilon phi chi psi omega', cols, f, 10, 1.3, measure);
  assert.equal(r.cut, true);
  for (const p of r.placed) { assert.ok(measure(p.text, f) <= cols[p.col].w + 0.01); assert.ok(p.y + 13 <= 50 + 0.01); }
  assert.ok(r.placed.at(-1).text.endsWith('…'));
  const ok = flow('short text', cols, f, 10, 1.3, measure);
  assert.equal(ok.cut, false);
  assert.equal(ok.placed.length, 1);
});

// 7. Date line
test('date line from local parts in two time zones', () => {
  for (const tz of ['America/Los_Angeles', 'Asia/Kolkata', 'UTC']) {
    process.env.TZ = tz;
    const d = parseISODate('2026-10-21');
    assert.equal(formatDateLine(d), 'Wednesday, October 21, 2026', tz);
    assert.equal(toISODate(d), '2026-10-21', tz);
  }
  assert.equal(parseISODate('2026-02-30'), null);
  assert.equal(parseISODate('nope'), null);
  assert.equal(formatDateLine(parseISODate('2000-01-01')), 'Saturday, January 1, 2000');
});

// 8. Presets
test('presets fill every field and stay kind', () => {
  const word = (w) => new RegExp(`\\b${w}\\b`, 'i');
  const texts = [];
  for (const id of PRESET_IDS) {
    const p = PRESETS[id];
    const { fields } = presetFields(id, p.name, p.n);
    for (const f of FIELD_IDS) {
      if (f === 'date') continue;
      assert.ok(fields[f] && fields[f].trim(), `${id}.${f} empty`);
      assert.ok(!/[{}]/.test(fields[f]), `${id}.${f} has a placeholder left`);
      texts.push(fields[f]);
    }
    for (const [h, d] of SURPRISE[id]) texts.push(fill(h, p.name, p.n), fill(d, p.name, p.n));
  }
  for (const t of texts) for (const b of BLOCKED) assert.ok(!word(b).test(t), `blocked word "${b}" in: ${t}`);
  // No real outlet names or their slogans.
  for (const t of texts) assert.ok(!/(new york times|washington post|guardian|usa today|wall street|daily mail|the sun\b|times of india|fit to print)/i.test(t), t);
});
test('name swap: untouched fields rebuild, edited fields swap whole words', () => {
  const { fields, gen } = presetFields('birthday', 'Sam', '40');
  assert.equal(fields.headline, 'Sam Turns 40, Town Declares a Holiday');
  const edited = { ...fields, deck: 'Sam and Samantha share a cake' };
  const r = swapValue(edited, gen, 'birthday', 'Maria', '40', 'Sam', 'Maria');
  assert.equal(r.fields.headline, 'Maria Turns 40, Town Declares a Holiday');
  assert.equal(r.fields.deck, 'Maria and Samantha share a cake');
  assert.equal(r.gen.headline, r.fields.headline);
  // Number change.
  const r2 = swapValue(r.fields, r.gen, 'birthday', 'Maria', '50', '40', '50');
  assert.equal(r2.fields.headline, 'Maria Turns 50, Town Declares a Holiday');
  assert.equal(r2.fields.deck, 'Maria and Samantha share a cake');
  // Special characters in a name are safe.
  const r3 = swapValue(r2.fields, r2.gen, 'birthday', 'Mr. (Bo)', '50', 'Maria', 'Mr. (Bo)');
  assert.equal(r3.fields.headline, 'Mr. (Bo) Turns 50, Town Declares a Holiday');
  assert.equal(fill('{name} Turns {n}, Wow', '', ''), 'Someone Turns, Wow');
});
test('surprise picks a different headline', () => {
  const { fields } = presetFields('birthday', 'Sam', '40');
  for (let i = 0; i < 20; i++) {
    const [h, d] = surprise('birthday', 'Sam', '40', fields.headline, () => i / 20);
    assert.notEqual(h, fields.headline);
    assert.ok(h && d);
  }
});

// 9. File names
test('file names', () => {
  assert.equal(fileName('The Birthday Bugle', 'letter', 'png'), 'the-birthday-bugle-letter.png');
  assert.equal(fileName('  Ça va? Été!! ', 'a4', 'pdf'), 'ca-va-ete-a4.pdf');
  assert.equal(fileName('', 'story', 'png'), 'front-page-story.png');
  assert.equal(fileName('!!!', 'post', 'png'), 'front-page-post.png');
  assert.match(fileName('x'.repeat(200), 'square', 'png'), /^x{48}-square\.png$/);
});

// 6. Layout: every template x format x photo state
test('layout: inside the page, hits for shown fields, hidden reasons', () => {
  const inside = (W, H, x, y, w = 0, h = 0) => x >= -0.01 && y >= -0.01 && x + w <= W + 0.01 && y + h <= H + 0.01;
  for (const t of TEMPLATE_IDS) for (const f of FORMAT_IDS) for (const preset of ['birthday', 'blank', 'office']) for (const ph of [{}, { main: 1 }, { main: 1, side: 1 }]) {
    const p = PRESETS[preset];
    const doc = { fields: { ...presetFields(preset, p.name, p.n).fields, date: 'Wednesday, October 21, 2026' }, opts: {} };
    const L = layout(t, f, doc, ph, measure);
    const tag = `${t}/${f}/${preset}/${Object.keys(ph).join('+') || 'nophoto'}`;
    assert.equal(L.W, 1000);
    for (const op of L.ops) {
      if (op.t === 'rect' || op.t === 'photo') assert.ok(inside(L.W, L.H, op.x, op.y, op.w, op.h), `${tag} ${op.t} out of page ${JSON.stringify(op)}`);
      if (op.t === 'line') assert.ok(inside(L.W, L.H, op.x1, op.y1) && inside(L.W, L.H, op.x2, op.y2), `${tag} line out`);
      if (op.t === 'text') {
        assert.ok(inside(L.W, L.H, 0, op.y), `${tag} text y out: ${op.text}`);
        const w = measure(op.text, op.font);
        const x0 = op.align === 'center' ? op.x - w / 2 : op.align === 'right' ? op.x - w : op.x;
        assert.ok(x0 >= -0.01 && x0 + w <= L.W + 0.01, `${tag} text x out: ${op.text}`);
        assert.ok(!/undefined|NaN|\{name\}|\{n\}/.test(op.text), `${tag} bad text ${op.text}`);
      }
      for (const k of ['x', 'y', 'w', 'h', 'x1', 'y1', 'x2', 'y2']) if (k in op) assert.ok(Number.isFinite(op[k]), `${tag} ${op.t}.${k} not finite`);
    }
    for (const h of L.hits) assert.ok(inside(L.W, L.H, h.x, h.y, h.w, h.h), `${tag} hit out ${JSON.stringify(h)}`);
    for (const k of Object.keys(doc.fields)) {
      if (!doc.fields[k].trim()) continue;
      const shown = L.hits.some((h) => h.field === k);
      assert.ok(shown || L.hidden[k], `${tag}: ${k} neither shown nor listed as hidden`);
      assert.ok(!(shown && L.hidden[k]), `${tag}: ${k} shown and hidden`);
    }
    // The core fields always show.
    for (const k of ['paper', 'headline', 'body']) assert.ok(L.hits.some((h) => h.field === k), `${tag}: ${k} missing`);
    if (ph.main) assert.ok(L.ops.some((o) => o.t === 'photo' && o.slot === 'main'), `${tag}: main photo missing`);
    else assert.ok(!L.ops.some((o) => o.t === 'photo' && o.slot === 'main'), `${tag}: photo box without a photo`);
    if (f === 'square') for (const k of ['sideHead', 'sideBody', 'teasers']) assert.equal(L.hidden[k], 'Not shown at this size', `${tag}: ${k}`);
    if (!ph.main) assert.equal(L.hidden.caption, 'Add a photo to show it');
  }
});
test('layout: notice can be turned off, and long names stay on the page', () => {
  const doc = { fields: { ...presetFields('birthday', 'Sam', '40').fields, date: 'Wednesday, October 21, 2026' }, opts: { notice: false } };
  const L = layout('classic', 'letter', doc, {}, measure);
  assert.equal(L.hidden.notice, 'Turned off under Look');
  assert.ok(!L.ops.some((o) => o.t === 'text' && o.text.includes('Novelty')));
  const on = layout('classic', 'letter', { ...doc, opts: {} }, {}, measure);
  assert.ok(on.ops.some((o) => o.t === 'text' && o.text.includes('Novelty print')));
  const longDoc = { fields: { ...doc.fields, paper: 'The Extremely Long and Wonderful Name of a Very Small Family Newspaper', headline: 'W'.repeat(400) }, opts: {} };
  for (const t of TEMPLATE_IDS) {
    const LL = layout(t, 'square', longDoc, { main: 1 }, measure);
    for (const op of LL.ops) if (op.t === 'text') {
      const w = measure(op.text, op.font);
      const x0 = op.align === 'center' ? op.x - w / 2 : op.align === 'right' ? op.x - w : op.x;
      assert.ok(x0 >= -0.01 && x0 + w <= 1000.01, `${t} long text out: ${op.text.slice(0, 30)}`);
    }
  }
});

console.log(`${passed} tests passed${process.exitCode ? ', some FAILED' : ''}`);
