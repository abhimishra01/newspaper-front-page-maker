// Page logic for the newspaper maker. Everything runs in this browser tab:
// photos are read with the File API and drawn on a canvas; nothing is uploaded.
import { FORMATS, FORMAT_IDS, designHeight, defaultFormat, DESIGN_W } from './formats.js';
import { layout, TEMPLATE_IDS } from './layout.js';
import { paint } from './draw.js';
import { loadPhoto } from './photo.js';
import { PRESETS, PRESET_IDS, FIELDS, FIELD_IDS, presetFields, swapValue, surprise } from './presets.js';
import { parseISODate, formatDateLine, toISODate } from './date.js';
import { addPngText, addPngDpi, pngSize } from './png.js';
import { buildPdf } from './pdf.js';
import { fileName } from './filename.js';
import { samplePicture } from './sample.js';
import { encodeState, decodeState } from './link.js';

const KEY = 'bm.newspaper.v1';
const NOTE = 'Novelty print. Fictional. Made with bingemind.com/newspaper-front-page-maker';
const $ = (id) => document.getElementById(id);
const LABEL = Object.fromEntries(FIELDS.map((f) => [f.id, f.label]));
const LINE = new Set(FIELDS.filter((f) => f.line).map((f) => f.id));

let S; // saved state
const photos = { main: null, side: null };
let L = null; // last layout
let k = 1; // CSS px per design unit in the preview
let editing = null; // field being edited inline

// ---------- state ----------
function fresh(presetId = 'birthday') {
  const p = PRESETS[presetId];
  const { fields, gen } = presetFields(presetId, p.name, p.n);
  const today = new Date();
  fields.date = formatDateLine(today);
  return {
    v: 1, preset: presetId, name: p.name, n: p.n, nameTouched: false,
    template: 'classic', format: defaultFormat(navigator.language || ''), iso: toISODate(today),
    fields, gen, opts: { face: 'auto', paper: 'tint', look: 'auto', notice: true },
  };
}

// Saved or shared state -> a full, checked state, or null.
function restore(s) {
  if (s && s.v === 1 && s.fields && PRESET_IDS.includes(s.preset) && TEMPLATE_IDS.includes(s.template) && FORMAT_IDS.includes(s.format)) {
    // Only known keys and plain strings are kept: a shared link comes from someone else.
    const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : null);
    const base = fresh(s.preset);
    const fields = { ...base.fields }, gen = { ...base.gen };
    for (const f of FIELD_IDS) {
      fields[f] = str(s.fields[f], 5000) ?? fields[f];
      gen[f] = str(s.gen?.[f], 5000) ?? gen[f];
    }
    const pick = (v, ok, dflt) => (ok.includes(v) ? v : dflt);
    const o = s.opts || {};
    return {
      ...base, preset: s.preset, template: s.template, format: s.format, fields, gen,
      name: str(s.name, 60) ?? base.name, n: str(s.n, 8) ?? base.n, nameTouched: !!s.nameTouched,
      iso: /^\d{4}-\d{2}-\d{2}$/.test(s.iso) ? s.iso : base.iso,
      opts: {
        face: pick(o.face, ['auto', 'old', 'serif', 'sans'], 'auto'),
        paper: pick(o.paper, ['tint', 'white'], 'tint'),
        look: pick(o.look, ['auto', 'color', 'bw', 'halftone'], 'auto'),
        notice: o.notice !== false,
      },
    };
  }
  return null;
}

function load() {
  try { return restore(JSON.parse(localStorage.getItem(KEY) || 'null')) || fresh(); } catch { return fresh(); }
}

let saveTimer = 0;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }, 300);
}

// ---------- measuring and drawing ----------
const mctx = document.createElement('canvas').getContext('2d');
let mcache = new Map();
function measure(text, font) {
  const key = font + '\u0001' + text;
  let w = mcache.get(key);
  if (w === undefined) { mctx.font = font; w = mctx.measureText(text).width; mcache.set(key, w); }
  return w;
}

function docFor() { return { fields: S.fields, opts: S.opts }; }
function present() { return { main: !!photos.main, side: !!photos.side }; }

let raf = 0;
function render() { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }

function draw() {
  const wrapEl = $('np-wrap');
  const canvas = $('np-canvas');
  const H = designHeight(S.format);
  wrapEl.style.setProperty('--ratio', String(DESIGN_W / H));
  const cssW = wrapEl.clientWidth || 300;
  k = cssW / DESIGN_W;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const pxW = Math.round(cssW * dpr), pxH = Math.round(cssW * dpr * H / DESIGN_W);
  if (canvas.width !== pxW || canvas.height !== pxH) { canvas.width = pxW; canvas.height = pxH; }
  L = layout(S.template, S.format, docFor(), present(), measure);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, pxW, pxH);
  paint(ctx, L, pxW / DESIGN_W, photos);
  placeHits();
  notes();
  if (editing) placeEditor();
}

// ---------- tap targets on the page ----------
function placeHits() {
  const box = $('np-hits');
  const want = L.hits;
  while (box.children.length > want.length) box.lastChild.remove();
  want.forEach((h, i) => {
    let b = box.children[i];
    if (!b) { b = document.createElement('button'); b.type = 'button'; box.appendChild(b); }
    const id = h.field || 'photo:' + h.photo;
    if (b.dataset.id !== id) {
      b.dataset.id = id;
      b.className = h.photo ? 'np-hit np-hit-photo' : 'np-hit';
      b.setAttribute('aria-label', h.photo ? `${h.photo === 'main' ? 'Main' : 'Second'} photo: drag or use arrow keys to move it, plus and minus to zoom` : `Edit ${LABEL[h.field].replace(/ \(.*\)$/, '').toLowerCase()}`);
      b.title = h.photo ? 'Drag to move the photo' : `Edit ${LABEL[h.field].replace(/ \(.*\)$/, '').toLowerCase()}`;
    }
    Object.assign(b.style, { left: h.x * k + 'px', top: h.y * k + 'px', width: h.w * k + 'px', height: h.h * k + 'px' });
  });
}

// ---------- inline editor ----------
function openEditor(field) {
  editing = field;
  const ed = $('np-editor');
  $('np-editor-label').textContent = LABEL[field];
  ed.value = S.fields[field];
  ed.rows = LINE.has(field) ? 1 : field === 'body' || field === 'sideBody' ? 6 : 3;
  $('np-editor-box').hidden = false;
  bar();
  placeEditor();
  ed.focus();
  ed.setSelectionRange(ed.value.length, ed.value.length);
}

function placeEditor() {
  const box = $('np-editor-box');
  const h = L.hits.find((x) => x.field === editing);
  const wrapEl = $('np-wrap');
  const W = wrapEl.clientWidth, Hh = wrapEl.clientHeight;
  const r = h || box._last || { x: 0, y: 0, w: DESIGN_W, h: 40 };
  box._last = r;
  const bw = Math.min(W - 8, Math.max(r.w * k + 16, 260));
  const left = Math.max(4, Math.min(r.x * k - 8, W - bw - 4));
  box.style.width = bw + 'px';
  box.style.left = left + 'px';
  const bh = box.offsetHeight;
  // Below the text when it fits, else above it, so the change stays in view.
  const below = (r.y + r.h) * k + 6, above = r.y * k - bh - 6;
  const top = below + bh <= Hh - 4 ? below : above >= 4 ? above : Math.max(4, Hh - bh - 4);
  box.style.top = top + 'px';
}

function closeEditor(refocus) {
  if (!editing) return;
  const f = editing;
  editing = null;
  $('np-editor-box').hidden = true;
  bar();
  if (refocus) {
    const b = [...$('np-hits').children].find((x) => x.dataset.id === f);
    (b || $('np-canvas')).focus?.();
  }
}

function setField(field, value, from) {
  S.fields[field] = value;
  if (from !== 'list') { const el = $('np-f-' + field); if (el && el.value !== value) el.value = value; }
  if (from !== 'editor' && editing === field) $('np-editor').value = value;
  save();
  render();
}

// ---------- field list notes ----------
function notes() {
  for (const f of FIELD_IDS) {
    const el = document.querySelector(`[data-note="${f}"]`);
    const msg = L.hidden[f] || (L.cut[f] ? 'Cut short to fit this size. Shorten it or pick a bigger size.' : '');
    if (el && el.textContent !== msg) el.textContent = msg;
  }
  const sideShown = !L.hidden.sideHead && !L.hidden.sideBody;
  const n = document.querySelector('.np-photo[data-slot="side"] [data-role="note"]');
  n.textContent = !sideShown && L.hidden.sideBody === 'Not shown at this size' ? 'The second story is not shown at this size, so this photo is not shown either.' : '';
}

// ---------- controls ----------
function syncControls() {
  for (const r of document.querySelectorAll('input[name="np-occasion"]')) r.checked = r.value === S.preset;
  for (const r of document.querySelectorAll('input[name="np-template"]')) r.checked = r.value === S.template;
  for (const r of document.querySelectorAll('input[name="np-format"]')) r.checked = r.value === S.format;
  $('np-name').value = S.name;
  const p = PRESETS[S.preset];
  $('np-num-wrap').hidden = !p.numLabel;
  $('np-num-label').textContent = p.numLabel || 'Number';
  $('np-num').value = S.n;
  $('np-date').value = S.iso || '';
  $('np-face').value = S.opts.face;
  $('np-paper').value = S.opts.paper;
  $('np-look').value = S.opts.look;
  $('np-notice').checked = !!S.opts.notice;
  for (const f of FIELD_IDS) { const el = $('np-f-' + f); if (el) el.value = S.fields[f]; }
  formatButtons();
}

function formatButtons() {
  const print = FORMATS[S.format].print;
  $('np-pdf').hidden = !print;
  $('np-print').hidden = !print;
  $('np-png').textContent = `Download PNG (${FORMATS[S.format].short})`;
  $('np-bar-png').textContent = `Download PNG (${FORMATS[S.format].short})`;
}

function status(msg) { $('np-status').textContent = msg; $('np-bar-msg').textContent = msg; }

// Text parts on the page in reading order, for Back and Next in the editor.
function fieldOrder() { return L.hits.filter((h) => h.field).map((h) => h.field); }
function step(dir) {
  const order = fieldOrder();
  if (!order.length) return;
  const i = order.indexOf(editing);
  openEditor(order[(i + dir + order.length) % order.length]);
}

// A tap that lands between text parts (some lines are only a few pixels tall on a phone)
// opens the nearest one, if it is close enough.
function nearestField(clientX, clientY) {
  const r = $('np-hits').getBoundingClientRect();
  const x = (clientX - r.left) / k, y = (clientY - r.top) / k;
  let best = null, bestD = Infinity;
  for (const h of L.hits) {
    if (!h.field) continue;
    const dx = Math.max(h.x - x, 0, x - (h.x + h.w)), dy = Math.max(h.y - y, 0, y - (h.y + h.h));
    const d = Math.hypot(dx, dy) * k;
    if (d < bestD) { bestD = d; best = h.field; }
  }
  return bestD <= 18 ? best : null;
}

// ---------- phone bar ----------
// Under 960 px the controls sit below the page. While the page and its buttons are out of view,
// a bar at the bottom offers "See the page" and "Download PNG".
let stageSeen = true, toolSeen = true;
function bar() {
  const el = $('np-bar');
  // Hidden while typing, so it never sits on top of the phone keyboard.
  const typing = document.activeElement?.matches?.('input[type="text"], textarea, input:not([type])');
  const show = !stageSeen && toolSeen && !editing && !typing && matchMedia('(max-width: 959px)').matches;
  if (el.hidden === show) el.hidden = !show;
}
function wireBar() {
  if (!('IntersectionObserver' in window)) return;
  new IntersectionObserver((es) => { stageSeen = es[0].isIntersecting; bar(); }).observe($('np-wrap'));
  new IntersectionObserver((es) => { toolSeen = es[0].isIntersecting; bar(); }).observe($('tool'));
  addEventListener('resize', bar);
  document.addEventListener('focusin', bar);
  document.addEventListener('focusout', () => setTimeout(bar, 0));
  $('np-bar-see').addEventListener('click', () => {
    $('np-wrap').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
  $('np-bar-png').addEventListener('click', () => $('np-png').click());
}

function edited() { return FIELD_IDS.some((f) => f !== 'date' && S.fields[f] !== S.gen[f]); }

function applyPreset(id) {
  if (edited() && !confirm(`Replace your text with the ${PRESETS[id].label} text? Your photos stay.`)) { syncControls(); return; }
  const p = PRESETS[id];
  const name = S.nameTouched && S.name ? S.name : p.name;
  const n = p.n;
  const { fields, gen } = presetFields(id, name, n);
  fields.date = S.fields.date;
  Object.assign(S, { preset: id, name, n, fields, gen });
  syncControls();
  save();
  render();
}

// Name and number swaps are rebuilt from a snapshot taken when the box got focus, so the
// in-between values while typing ("I", "Iv" on the way to "Ivy") never touch the user's own text.
let snap = null;
function swap(kind, value) {
  if (!snap) snap = { fields: { ...S.fields }, gen: { ...S.gen }, name: S.name, n: S.n };
  const from = kind === 'name' ? snap.name : snap.n;
  const name = kind === 'name' ? value : snap.name;
  const n = kind === 'n' ? value : snap.n;
  const r = from === value ? { fields: { ...snap.fields }, gen: { ...snap.gen } } : swapValue(snap.fields, snap.gen, S.preset, name, n, from, value);
  r.fields.date = S.fields.date;
  Object.assign(S, { name, n, fields: r.fields, gen: r.gen });
  if (kind === 'name') S.nameTouched = true;
  for (const f of FIELD_IDS) { const el = $('np-f-' + f); if (el && el.value !== S.fields[f]) el.value = S.fields[f]; }
  save();
  render();
}

// ---------- photos ----------
async function setPhoto(slot, file) {
  if (!file) return;
  status('Opening the photo…');
  try {
    photos[slot] = await loadPhoto(file);
    status(`${slot === 'main' ? 'Main' : 'Second'} photo added. It stays on this device.`);
  } catch (e) {
    status(e.message);
  }
  photoUI();
  render();
}

function photoUI() {
  for (const el of document.querySelectorAll('.np-photo')) {
    const slot = el.dataset.slot;
    const p = photos[slot];
    el.querySelector('[data-role="name"]').textContent = p ? p.name : '';
    el.querySelector('[data-role="add"]').textContent = p && !p.sample ? 'Change photo' : 'Add photo';
    el.querySelector('[data-role="remove"]').hidden = !p;
    el.querySelector('[data-role="zoom-wrap"]').hidden = !p;
    if (p) el.querySelector('[data-role="zoom"]').value = String(p.zoom);
  }
}

function wirePhotoDrag() {
  const box = $('np-hits');
  let drag = null;
  box.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.np-hit-photo');
    if (!b) return;
    const slot = b.dataset.id.split(':')[1];
    if (!photos[slot]) return;
    // On touch screens a swipe over the photo scrolls the page. A tap turns on move mode first.
    const touch = e.pointerType === 'touch' && !b.classList.contains('is-moving');
    drag = { slot, b, touch, x: e.clientX, y: e.clientY, fx: photos[slot].fx, fy: photos[slot].fy, w: b.offsetWidth, h: b.offsetHeight, moved: false, id: e.pointerId };
    if (!touch) { b.setPointerCapture(e.pointerId); e.preventDefault(); }
  });
  box.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    if (drag.touch) return;
    const p = photos[drag.slot];
    p.fx = Math.max(-1, Math.min(1, drag.fx - (2 * dx) / drag.w));
    p.fy = Math.max(-1, Math.min(1, drag.fy - (2 * dy) / drag.h));
    render();
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (d.touch || (e.pointerType === 'touch' && !d.moved)) {
      if (e.type === 'pointerup' && !d.moved) {
        const on = d.b.classList.toggle('is-moving');
        status(on ? 'Move mode: drag the photo to move it. Tap it again when done.' : 'Photo placed.');
      }
      return;
    }
    if (!d.moved) {
      // A click on the photo opens its controls.
      const el = document.querySelector(`.np-photo[data-slot="${d.slot}"]`);
      el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      el.querySelector('[data-role="zoom"]').focus({ preventScroll: true });
    }
  };
  box.addEventListener('pointerup', end);
  // Tapping anywhere else ends move mode.
  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.np-hit-photo')) return;
    for (const b of document.querySelectorAll('.np-hit-photo.is-moving')) b.classList.remove('is-moving');
  });
  box.addEventListener('pointercancel', end);
  box.addEventListener('keydown', (e) => {
    const b = e.target.closest('.np-hit-photo');
    if (!b) return;
    const p = photos[b.dataset.id.split(':')[1]];
    if (!p) return;
    const step = 0.08;
    const k2 = { ArrowLeft: ['fx', step], ArrowRight: ['fx', -step], ArrowUp: ['fy', step], ArrowDown: ['fy', -step] }[e.key];
    if (k2) { p[k2[0]] = Math.max(-1, Math.min(1, p[k2[0]] + k2[1])); e.preventDefault(); }
    else if (e.key === '+' || e.key === '=') { p.zoom = Math.min(3, p.zoom + 0.1); e.preventDefault(); }
    else if (e.key === '-') { p.zoom = Math.max(1, p.zoom - 0.1); e.preventDefault(); }
    else return;
    photoUI();
    render();
  });
}

function wireDrop() {
  const wrapEl = $('np-wrap');
  const drop = $('np-drop');
  const hasFile = (e) => [...(e.dataTransfer?.types || [])].includes('Files');
  wrapEl.addEventListener('dragover', (e) => { if (!hasFile(e)) return; e.preventDefault(); drop.hidden = false; });
  wrapEl.addEventListener('dragleave', (e) => { if (!wrapEl.contains(e.relatedTarget)) drop.hidden = true; });
  wrapEl.addEventListener('drop', (e) => {
    if (!hasFile(e)) return;
    e.preventDefault();
    drop.hidden = true;
    const file = [...e.dataTransfer.files].find((f) => /^image\//.test(f.type)) || e.dataTransfer.files[0];
    // Dropped on the second photo: replace it; otherwise the main photo.
    const r = wrapEl.getBoundingClientRect();
    const x = (e.clientX - r.left) / k, y = (e.clientY - r.top) / k;
    const side = L?.hits.find((h) => h.photo === 'side' && x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
    setPhoto(side ? 'side' : 'main', file);
  });
}

// ---------- export ----------
async function renderFull(format) {
  const F = FORMATS[format];
  const c = document.createElement('canvas');
  c.width = F.w; c.height = F.h;
  const ctx = c.getContext('2d');
  const LL = layout(S.template, format, docFor(), present(), measure);
  paint(ctx, LL, F.w / DESIGN_W, photos);
  return c;
}

const toBlob = (c, type, q) => new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Could not make the file.'))), type, q));

async function pngBytes(format) {
  const c = await renderFull(format);
  try {
    const b = new Uint8Array(await (await toBlob(c, 'image/png')).arrayBuffer());
    const withNote = addPngText(b, 'Comment', NOTE);
    // Print sizes carry 300 DPI, so a photo app prints them at 8.5 x 11 in or A4, not poster size.
    return FORMATS[format].print ? addPngDpi(withNote, 300) : withNote;
  } finally { c.width = 0; c.height = 0; }
}

async function pdfBytes(format) {
  const F = FORMATS[format];
  const c = await renderFull(format);
  try {
    const jpeg = new Uint8Array(await (await toBlob(c, 'image/jpeg', 0.92)).arrayBuffer());
    return buildPdf(jpeg, F.w, F.h, F.pdf, { title: S.fields.paper || 'Front page', subject: 'Novelty print. Fictional.' });
  } finally { c.width = 0; c.height = 0; }
}

function download(bytes, type, name) {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

async function busy(btn, label, job) {
  if (btn.disabled) return;
  const old = btn.textContent;
  btn.disabled = true; btn.textContent = label;
  try { await job(); } catch (e) { status(e.message || 'Something went wrong. Please try again.'); }
  finally { btn.disabled = false; btn.textContent = old; }
}

function wireExport() {
  $('np-png').addEventListener('click', () => busy($('np-png'), 'Making PNG…', async () => {
    const bytes = await pngBytes(S.format);
    const name = fileName(S.fields.paper, S.format, 'png');
    download(bytes, 'image/png', name);
    const { w, h } = pngSize(bytes);
    status(`Saved ${name} (${w} x ${h} px).`);
  }));
  $('np-pdf').addEventListener('click', () => busy($('np-pdf'), 'Making PDF…', async () => {
    const bytes = await pdfBytes(S.format);
    const name = fileName(S.fields.paper, S.format, 'pdf');
    download(bytes, 'application/pdf', name);
    status(`Saved ${name}. Print it at 100% or "Actual size".`);
  }));
  $('np-print').addEventListener('click', () => busy($('np-print'), 'Preparing…', async () => {
    const bytes = await pngBytes(S.format);
    const url = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
    const area = $('np-print-area');
    area.textContent = '';
    const img = new Image();
    img.alt = '';
    img.src = url;
    area.appendChild(img);
    await img.decode().catch(() => {});
    $('np-page-style').textContent = `@page { size: ${FORMATS[S.format].page}; margin: 0; }`;
    const clean = () => { area.textContent = ''; URL.revokeObjectURL(url); window.removeEventListener('afterprint', clean); };
    window.addEventListener('afterprint', clean);
    window.print();
  }));
  $('np-link').addEventListener('click', () => busy($('np-link'), 'Copying…', async () => {
    const link = location.origin + location.pathname + '#p=' + (await encodeState(S));
    try {
      await navigator.clipboard.writeText(link);
      status('Link copied. It holds your words and settings, not your photos.');
    } catch {
      window.prompt('Copy this link. It holds your words and settings, not your photos.', link);
    }
  }));
  const share = $('np-share');
  try {
    const probe = new File([new Uint8Array(1)], 'p.png', { type: 'image/png' });
    share.hidden = !(navigator.canShare && navigator.canShare({ files: [probe] }));
  } catch { share.hidden = true; }
  share.addEventListener('click', () => busy(share, 'Preparing…', async () => {
    const bytes = await pngBytes(S.format);
    const file = new File([bytes], fileName(S.fields.paper, S.format, 'png'), { type: 'image/png' });
    try { await navigator.share({ files: [file], title: S.fields.paper }); status('Shared.'); }
    catch (e) { if (e.name !== 'AbortError') throw e; }
  }));
}

// ---------- wiring ----------
function wire() {
  // Tap targets on the page.
  $('np-hits').addEventListener('click', (e) => {
    const b = e.target.closest('.np-hit');
    if (b && b.classList.contains('np-hit-photo')) return;
    const f = b ? b.dataset.id : nearestField(e.clientX, e.clientY);
    if (f) openEditor(f);
  });
  const ed = $('np-editor');
  ed.addEventListener('input', () => setField(editing, ed.value, 'editor'));
  ed.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeEditor(true); }
    else if (e.key === 'Enter' && (LINE.has(editing) || e.metaKey || e.ctrlKey)) { e.preventDefault(); closeEditor(true); }
  });
  $('np-editor-done').addEventListener('click', () => closeEditor(true));
  $('np-editor-prev').addEventListener('click', () => step(-1));
  $('np-editor-next').addEventListener('click', () => step(1));
  $('np-editor-box').addEventListener('focusout', (e) => {
    if (!$('np-editor-box').contains(e.relatedTarget)) setTimeout(() => { if (!$('np-editor-box').contains(document.activeElement)) closeEditor(false); }, 0);
  });

  // Field list.
  for (const el of document.querySelectorAll('[data-field]')) el.addEventListener('input', () => setField(el.dataset.field, el.value, 'list'));

  for (const r of document.querySelectorAll('input[name="np-occasion"]')) r.addEventListener('change', () => applyPreset(r.value));
  for (const r of document.querySelectorAll('input[name="np-template"]')) r.addEventListener('change', () => { S.template = r.value; save(); render(); });
  for (const r of document.querySelectorAll('input[name="np-format"]')) r.addEventListener('change', () => { S.format = r.value; formatButtons(); save(); render(); });
  for (const id of ['np-name', 'np-num']) {
    const el = $(id);
    el.addEventListener('focus', () => { snap = null; });
    el.addEventListener('blur', () => { snap = null; });
    el.addEventListener('input', () => swap(id === 'np-name' ? 'name' : 'n', el.value.trim() ? (id === 'np-name' ? el.value : el.value.trim()) : ''));
  }
  $('np-date').addEventListener('change', (e) => {
    const d = parseISODate(e.target.value);
    if (!d) return;
    S.iso = e.target.value;
    setField('date', formatDateLine(d));
  });
  $('np-surprise').addEventListener('click', () => {
    const [h, d] = surprise(S.preset, S.name, S.n, S.fields.headline);
    S.fields.deck = d;
    setField('headline', h);
    $('np-f-deck').value = d;
    status('New headline: ' + h);
  });
  const opt = (id, key, read) => $(id).addEventListener('change', (e) => { S.opts[key] = read(e.target); save(); render(); });
  opt('np-face', 'face', (t) => t.value);
  opt('np-paper', 'paper', (t) => t.value);
  opt('np-look', 'look', (t) => t.value);
  opt('np-notice', 'notice', (t) => t.checked);

  for (const el of document.querySelectorAll('.np-photo')) {
    const slot = el.dataset.slot;
    const input = el.querySelector('[data-role="file"]');
    input.addEventListener('change', () => { setPhoto(slot, input.files[0]); input.value = ''; });
    el.querySelector('[data-role="remove"]').addEventListener('click', () => {
      photos[slot] = null; photoUI(); render();
      status(`${slot === 'main' ? 'Main' : 'Second'} photo removed.`);
      input.focus();
    });
    el.querySelector('[data-role="zoom"]').addEventListener('input', (e) => { if (photos[slot]) { photos[slot].zoom = +e.target.value; render(); } });
  }

  $('np-reset').addEventListener('click', () => {
    if (!confirm('Start over? This clears your text and removes the photos from the page.')) return;
    try { localStorage.removeItem(KEY); } catch {}
    const fmt = S.format;
    S = fresh();
    S.format = fmt;
    photos.main = samplePicture();
    photos.side = null;
    closeEditor(false);
    syncControls(); photoUI(); save(); render();
    status('Started over.');
  });

  wirePhotoDrag();
  wireDrop();
  wireExport();
  wireBar();
  new ResizeObserver(() => render()).observe($('np-wrap'));
}

async function loadFont() {
  const src = $('tool').dataset.font;
  try {
    const face = new FontFace('NP Masthead', `url(${src}) format("woff2")`);
    document.fonts.add(face);
    await Promise.race([face.load(), new Promise((r) => setTimeout(r, 2500))]);
  } catch {}
  mcache = new Map();
}

export async function start() {
  S = load();
  // A shared link opens its words on this device, then the address is cleaned up.
  const shared = location.hash.startsWith('#p=') ? restore(await decodeState(location.hash.slice(3))) : null;
  if (shared) {
    S = shared;
    history.replaceState(null, '', location.pathname + location.search);
    save();
  }
  syncControls();
  photos.main = samplePicture();
  photoUI();
  wire();
  await loadFont();
  draw();
  $('tool').dataset.ready = 'true';
  if (shared) status('Opened a shared front page. Add your own photo if you like.');
  // When the font arrives late, measure again.
  document.fonts?.ready?.then(() => { mcache = new Map(); render(); });
}
