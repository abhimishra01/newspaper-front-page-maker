// Page layout. Pure functions: no DOM. Input: template id, format id, doc, measure(text, font).
// Output: { W, H, ops, hits, hidden } in design units (page is 1000 wide).
//   ops:    drawing steps for draw.js
//   hits:   [{ field | photo, x, y, w, h }] tap targets for inline editing
//   hidden: { field: reason } for fields this page cannot show
import { DESIGN_W, designHeight, FORMATS } from './formats.js';
import { wrap, fitText, flow, ellipsize } from './text.js';

export const TEMPLATES = {
  classic: { id: 'classic', name: 'Classic broadsheet', face: 'serif', look: 'bw' },
  tabloid: { id: 'tabloid', name: 'Tabloid', face: 'sans', look: 'color' },
  vintage: { id: 'vintage', name: 'Vintage 1920s', face: 'old', look: 'halftone' },
};
export const TEMPLATE_IDS = Object.keys(TEMPLATES);

export const FONTS = {
  old: '"NP Masthead", "Old English Text MT", Georgia, serif',
  serif: 'Georgia, "Times New Roman", "Noto Serif", "DejaVu Serif", serif',
  head: '"Times New Roman", Times, "Noto Serif", Georgia, serif',
  sans: '"Helvetica Neue", Helvetica, Arial, "Noto Sans", sans-serif',
  condensed: 'Impact, Haettenschweiler, "Arial Narrow", "Roboto Condensed", "Helvetica Neue", Arial, sans-serif',
};
const font = (family, weight = 400, style = 'normal') => (size) => `${style} ${weight} ${size}px ${family}`;

const PAPER = {
  classic: { tint: '#f3f0e7', white: '#ffffff', ink: '#16161a', soft: '#4a4740' },
  tabloid: { tint: '#f7f5f0', white: '#ffffff', ink: '#111111', soft: '#3d3d3d' },
  vintage: { tint: '#ece0c3', white: '#ffffff', ink: '#2a2016', soft: '#544433' },
};
const RED = '#c8102e';
const YELLOW = '#ffd21f';

/** Masthead face to use: the user's choice, or the template's own. */
export function mastFace(template, face) {
  const f = face && face !== 'auto' ? face : TEMPLATES[template].face;
  return f === 'old' ? font(FONTS.old) : f === 'sans' ? font(FONTS.condensed, 400) : font(FONTS.head, 700);
}

class Page {
  constructor(W, H, measure) {
    this.W = W; this.H = H; this.measure = measure;
    this.ops = []; this.hits = []; this.hidden = {};
  }
  rect(x, y, w, h, fill, stroke, lw = 1) { this.ops.push({ t: 'rect', x, y, w, h, fill, stroke, lw }); }
  line(x1, y1, x2, y2, color, lw = 1) { this.ops.push({ t: 'line', x1, y1, x2, y2, color, lw }); }
  circle(cx, cy, r, fill) { this.ops.push({ t: 'circle', cx, cy, r, fill }); }
  hit(field, x, y, w, h) { if (w > 0 && h > 0) this.hits.push({ field, x, y, w, h }); }
  hide(field, reason) { this.hidden[field] = reason; }

  /** Draw wrapped lines (top-left at x,y). Returns the height used. */
  lines(field, lines, x, y, w, size, lh, fontStr, color, align = 'left', justify = false, upper = false) {
    const step = size * lh;
    lines.forEach((ln, i) => {
      const base = y + i * step + (step - size) / 2 + size * 0.8;
      const ax = align === 'center' ? x + w / 2 : align === 'right' ? x + w : x;
      this.ops.push({ t: 'text', x: ax, y: base, text: upper ? ln.text.toUpperCase() : ln.text, font: fontStr, color, align, jw: justify && !ln.end ? w : 0 });
    });
    const h = lines.length * step;
    if (field) this.hit(field, x, y, w, h);
    return h;
  }

  /** Text at a fixed size, cut to maxH with an ellipsis. */
  block(field, text, x, y, w, maxH, fontFn, size, lh, color, align = 'left', opt = {}) {
    const fs = fontFn(size);
    const src = opt.upper ? String(text).toUpperCase() : text;
    let ls = wrap(src, w, fs, this.measure);
    const room = Math.max(0, Math.floor((maxH + 0.01) / (size * lh)));
    if (ls.length > room) {
      ls = ls.slice(0, room);
      if (ls.length) ls[ls.length - 1] = { text: ellipsize(ls[ls.length - 1].text, w, fs, this.measure), end: true };
    }
    return this.lines(field, ls, x, y, w, size, lh, fs, color, align, !!opt.justify);
  }

  /** Text fitted to a box (largest size that fits). Returns the height used. */
  fit(field, text, x, y, w, h, fontFn, minSize, maxSize, lh, color, align = 'left', opt = {}) {
    const src = opt.upper ? String(text).toUpperCase() : text;
    const r = fitText(src, { font: fontFn, minSize, maxSize, w, h, lh, maxLines: opt.maxLines ?? 99 }, this.measure);
    return this.lines(field, r.lines, x, y, w, r.size, lh, fontFn(r.size), color, align);
  }

  /** One line, shortened with an ellipsis if needed. */
  one(field, text, x, y, w, fontFn, size, color, align = 'left', upper = false) {
    if (!String(text).trim()) return 0;
    const fs = fontFn(size);
    let t = String(text).replace(/\s+/g, ' ').trim();
    if (upper) t = t.toUpperCase();
    if (this.measure(t, fs) > w) t = ellipsize(t, w, fs, this.measure);
    return this.lines(field, [{ text: t, end: true }], x, y, w, size, 1.25, fs, color, align);
  }

  /** Flow a story through columns. Returns { cut, used } and adds one hit for the whole block. */
  flowText(field, text, cols, fontFn, size, lh, color) {
    const fs = fontFn(size);
    const r = flow(text, cols, fs, size, lh, this.measure);
    const step = size * lh;
    for (const p of r.placed) {
      const base = p.y + (step - size) / 2 + size * 0.8;
      this.ops.push({ t: 'text', x: p.x, y: base, text: p.text, font: fs, color, align: 'left', jw: p.end ? 0 : p.w });
    }
    if (r.placed.length) {
      const used = cols.map((c, i) => ({ c, h: r.usedH[i] })).filter((u) => u.h > 0);
      const x0 = Math.min(...used.map((u) => u.c.x));
      const x1 = Math.max(...used.map((u) => u.c.x + u.c.w));
      const y0 = Math.min(...used.map((u) => u.c.y));
      const y1 = Math.max(...used.map((u) => u.c.y + u.h));
      this.hit(field, x0, y0, x1 - x0, y1 - y0);
    }
    return r;
  }

  photo(slot, x, y, w, h, look) {
    this.ops.push({ t: 'photo', slot, x, y, w, h, look });
    this.hits.push({ photo: slot, x, y, w, h });
  }
}

const has = (s) => String(s ?? '').trim().length > 0;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Ear box (small box beside the name): first line is a bold label.
function ear(P, field, text, x, y, w, maxH, ink, double = false) {
  const [label, ...rest] = String(text).split('\n');
  const pad = 9;
  let h = pad;
  const lf = font(FONTS.sans, 700);
  const bf = font(FONTS.serif, 400, 'italic');
  const labelLines = wrap(label.toUpperCase(), w - 2 * pad, lf(12), P.measure).slice(0, 2);
  const bodyLines = wrap(rest.join('\n'), w - 2 * pad, bf(14), P.measure);
  const room = Math.max(0, Math.floor((maxH - 2 * pad - labelLines.length * 15) / 17));
  const shown = bodyLines.slice(0, room);
  if (bodyLines.length > room && shown.length) shown[shown.length - 1] = { text: ellipsize(shown[shown.length - 1].text, w - 2 * pad, bf(14), P.measure), end: true };
  const boxH = 2 * pad + labelLines.length * 15 + shown.length * 17;
  P.rect(x, y, w, boxH, null, ink, 1.2);
  if (double) P.rect(x + 3, y + 3, w - 6, boxH - 6, null, ink, 0.6);
  h += P.lines(null, labelLines, x + pad, y + pad, w - 2 * pad, 12, 1.25, lf(12), ink, 'center');
  P.lines(null, shown, x + pad, y + h, w - 2 * pad, 14, 17 / 14, bf(14), ink, 'center');
  P.hit(field, x, y, w, boxH);
  return boxH;
}

// Shared top for classic and vintage: ears, name, motto, notice. Returns the new y.
function nameRow(P, d, o, tpl, m, ink, double) {
  const { W } = P;
  const showEars = has(d.earLeft) || has(d.earRight);
  const earW = showEars ? 150 : 0;
  const gap = showEars ? 22 : 0;
  const mx = m + earW + gap, mw = W - 2 * m - 2 * earW - 2 * gap;
  const mf = mastFace(tpl, o.face);
  const mr = fitText(d.paper, { font: mf, minSize: 30, maxSize: tpl === 'vintage' ? 118 : 104, w: mw, h: 130, lh: 1.0, maxLines: 1 }, P.measure);
  const mastH = has(d.paper) ? mr.size * 1.08 : 0;
  // Ears are measured first so the row is tall enough for both.
  let earH = 0;
  if (showEars) {
    const probe = new Page(P.W, P.H, P.measure);
    earH = Math.max(has(d.earLeft) ? ear(probe, 'x', d.earLeft, 0, 0, earW, 120, ink) : 0, has(d.earRight) ? ear(probe, 'x', d.earRight, 0, 0, earW, 120, ink) : 0);
  }
  const rowH = Math.max(mastH, earH, 40);
  const y = m;
  if (has(d.earLeft)) ear(P, 'earLeft', d.earLeft, m, y + (rowH - earH) / 2, earW, 120, ink, double);
  if (has(d.earRight)) ear(P, 'earRight', d.earRight, W - m - earW, y + (rowH - earH) / 2, earW, 120, ink, double);
  if (mastH) P.lines('paper', mr.lines, mx, y + (rowH - mastH) / 2, mw, mr.size, 1.08, mf(mr.size), ink, 'center');
  let yy = y + rowH + 6;
  yy += P.one('motto', d.motto, m, yy, W - 2 * m, font(FONTS.serif, 400, 'italic'), 17, ink, 'center');
  if (o.notice && has(d.notice)) yy += P.one('notice', d.notice, m, yy, W - 2 * m, font(FONTS.sans, 400), 11, ink, 'center');
  return yy + 4;
}

function datelineRow(P, d, m, y, ink, items) {
  const { W } = P;
  const w = (W - 2 * m) / items.length;
  const f = font(FONTS.sans, 700);
  items.forEach((id, i) => {
    const align = items.length === 1 ? 'center' : i === 0 ? 'left' : i === items.length - 1 ? 'right' : 'center';
    P.one(id, d[id], m + i * w, y, w - 8, f, 13, ink, align, true);
  });
  return 13 * 1.25;
}

/**
 * Lay out a main story: optional photo with caption, byline, then body in columns.
 * Photo height and body size adjust so the story fills the space without being cut when possible.
 */
function solveStory(P, { x, y, w, h, cols, gutter, photo, look, d, ink, bodySize, photoMax, captionFont, bylineFont, rules }) {
  const bodyFont = font(FONTS.serif, 400);
  const capH = (pw) => (photo && has(d.caption) ? Math.min(2, wrap(d.caption, pw, captionFont(13), P.measure).length) * 16 + 6 : 0);
  const byH = has(d.byline) ? 13 * 1.25 + 8 : 0;
  const colW = (w - (cols - 1) * gutter) / cols;
  const tryLayout = (ph, size) => {
    const top = y + (photo ? ph + 8 + capH(w) : 0) + byH;
    const colsR = Array.from({ length: cols }, (_, i) => ({ x: x + i * (colW + gutter), y: top, w: colW, h: y + h - top }));
    const r = flow(d.body, colsR, bodyFont(size), size, 1.32, P.measure);
    return { ph, size, colsR, cut: r.cut, fill: Math.max(0, ...r.usedH), room: y + h - top };
  };
  const minPh = photo ? Math.max(120, h * 0.22) : 0;
  let ph = photo ? clamp(Math.min(w * 0.62, photoMax ?? Infinity), minPh, h * 0.55) : 0;
  let best = tryLayout(ph, bodySize);
  while (best.cut && photo && best.ph > minPh) best = tryLayout(Math.max(minPh, best.ph - 12), bodySize);
  if (!best.cut) {
    // Spare room: let the photo grow, then the body text.
    const cap = photo ? Math.min(h * 0.62, (photoMax ?? Infinity) * 1.25, w * 1.1) : 0;
    while (photo && best.ph + 12 <= cap) { const n = tryLayout(best.ph + 12, best.size); if (n.cut) break; best = n; }
    while (best.size + 0.5 <= bodySize * 1.3) { const n = tryLayout(best.ph, best.size + 0.5); if (n.cut) break; best = n; }
  }
  let yy = y;
  if (photo) {
    P.photo('main', x, yy, w, best.ph, look);
    yy += best.ph + 6;
    if (has(d.caption)) { P.block('caption', d.caption, x, yy, w, 32, captionFont, 13, 16 / 13, ink, 'left'); }
    yy += capH(w) - 6 + 8;
  }
  if (byH) { P.one('byline', d.byline, x, yy, w, bylineFont, 13, ink, 'left', true); yy += byH; }
  if (rules) for (let i = 1; i < cols; i++) P.line(x + i * (colW + gutter) - gutter / 2, yy, x + i * (colW + gutter) - gutter / 2, y + h, rules, 0.6);
  P.flowText('body', d.body, best.colsR, bodyFont, best.size, 1.32, ink);
  return best;
}

/** Side story: headline, optional photo and caption, then text. */
function sideStory(P, { x, y, w, h, d, photo, look, ink, bodySize, headFont, headMax, upper }) {
  let yy = y;
  if (has(d.sideHead)) yy += P.fit('sideHead', d.sideHead, x, yy, w, Math.min(170, h * 0.3), headFont, 20, headMax, 1.08, ink, 'left', { upper, maxLines: 5 }) + 8;
  if (photo) {
    const ph = clamp(w * 0.8, 80, h * 0.4);
    P.photo('side', x, yy, w, ph, look);
    yy += ph + 6;
    if (has(d.sideCaption)) yy += P.block('sideCaption', d.sideCaption, x, yy, w, 32, font(FONTS.serif, 400, 'italic'), 12, 15 / 12, ink) + 6;
  }
  if (has(d.sideBody) && y + h - yy > bodySize * 1.32) P.flowText('sideBody', d.sideBody, [{ x, y: yy, w, h: y + h - yy }], font(FONTS.serif, 400), bodySize, 1.32, ink);
}

function classic(P, d, o, photos) {
  const { W, H } = P;
  const print = o.print;
  const m = print ? 50 : 40;
  const C = PAPER.classic;
  const ink = C.ink;
  P.rect(0, 0, W, H, o.paper === 'white' ? C.white : C.tint);
  let y = nameRow(P, d, o, 'classic', m, ink, false);
  P.line(m, y, W - m, y, ink, 1.6); y += 6;
  y += datelineRow(P, d, m, y, ink, ['volume', 'date', 'price']) + 4;
  P.line(m, y, W - m, y, ink, 2.6); P.line(m, y + 5, W - m, y + 5, ink, 0.8); y += 16;
  if (has(d.kicker)) y += P.one('kicker', d.kicker, m, y, W - 2 * m, font(FONTS.sans, 700), 17, RED, 'center', true) + 4;
  y += P.fit('headline', d.headline, m, y, W - 2 * m, clamp(H * 0.17, 120, 300), font(FONTS.head, 700), 34, 100, 1.04, ink, 'center', { maxLines: 3 }) + 6;
  if (has(d.deck)) y += P.fit('deck', d.deck, m + 40, y, W - 2 * m - 80, 72, font(FONTS.serif, 400, 'italic'), 18, 28, 1.2, ink, 'center', { maxLines: 2 }) + 8;
  P.line(m, y, W - m, y, ink, 0.8); y += 14;

  const roomy = H >= 1100;
  const showTeasers = roomy && has(d.teasers);
  const footH = showTeasers ? 64 : 0;
  const bottom = H - m - footH;
  const side = roomy && (has(d.sideHead) || has(d.sideBody));
  const gutter = 22;
  const mainW = side ? (W - 2 * m) * 0.66 : W - 2 * m;
  const bodySize = print ? 15 : 17;
  solveStory(P, { x: m, y, w: mainW, h: bottom - y, cols: 2, gutter: 20, photo: !!photos.main, look: o.look, d, ink, bodySize, photoMax: 430, captionFont: font(FONTS.serif, 400, 'italic'), bylineFont: font(FONTS.sans, 700), rules: null });
  if (side) {
    const sx = m + mainW + gutter;
    P.line(sx - gutter / 2, y, sx - gutter / 2, bottom - 8, ink, 0.8);
    sideStory(P, { x: sx, y, w: W - m - sx, h: bottom - 8 - y, d, photo: !!photos.side, look: o.look, ink, bodySize, headFont: font(FONTS.head, 700), headMax: 34 });
  }
  if (showTeasers) teaserStrip(P, d, m, H - m - footH + 12, W - 2 * m, footH - 12, ink, null, 'classic');
  return { roomy, side, showTeasers };
}

function teaserStrip(P, d, x, y, w, h, ink, bg, style) {
  const items = String(d.teasers).split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 5);
  if (!items.length) return;
  if (bg) P.rect(x, y, w, h, bg);
  else { P.line(x, y, x + w, y, ink, 2.2); P.line(x, y + h, x + w, y + h, ink, 0.8); }
  const cw = w / items.length;
  const color = bg ? '#ffffff' : ink;
  items.forEach((t, i) => {
    const first = i === 0;
    const f = first ? font(style === 'tabloid' ? FONTS.condensed : FONTS.sans, style === 'tabloid' ? 400 : 700) : font(FONTS.serif, 400, style === 'vintage' ? 'italic' : 'normal');
    const size = first ? 17 : 15;
    const ls = wrap(first ? t.toUpperCase() : t, cw - 18, f(size), P.measure).slice(0, 2);
    const th = ls.length * size * 1.2;
    P.lines(null, ls, x + i * cw + 9, y + (h - th) / 2, cw - 18, size, 1.2, f(size), first && bg ? YELLOW : color, 'center');
    if (i > 0) P.line(x + i * cw, y + 10, x + i * cw, y + h - 10, bg ? '#777777' : ink, 0.6);
  });
  P.hit('teasers', x, y, w, h);
}

function tabloid(P, d, o, photos) {
  const { W, H } = P;
  const print = o.print;
  const m = print ? 50 : 36;
  const T = PAPER.tabloid;
  const ink = T.ink;
  P.rect(0, 0, W, H, o.paper === 'white' ? T.white : T.tint);
  // Band with the name knocked out, and a round price flash.
  const bandH = 150;
  P.rect(m, m, W - 2 * m, bandH, ink);
  const flashR = has(d.price) ? 64 : 0;
  const mw = W - 2 * m - 48 - (flashR ? flashR * 2 + 16 : 0);
  const mf = mastFace('tabloid', o.face);
  const noticeOn = o.notice && has(d.notice);
  const mastBox = bandH - (noticeOn ? 34 : 20);
  if (has(d.paper)) {
    const r = fitText(d.paper, { font: mf, minSize: 30, maxSize: 120, w: mw, h: mastBox, lh: 1.0, maxLines: 1 }, P.measure);
    const mh = r.size * 1.0;
    P.lines('paper', r.lines, m + 24, m + (mastBox - mh) / 2 + 6, mw, r.size, 1.0, mf(r.size), '#ffffff', 'left');
  }
  if (noticeOn) P.one('notice', d.notice, m + 24, m + bandH - 24, mw, font(FONTS.sans, 400), 11, '#d9d9d9', 'left');
  if (flashR) {
    const cx = W - m - flashR - 14, cy = m + bandH / 2;
    P.circle(cx, cy, flashR, YELLOW);
    const pw = flashR * 1.45;
    const r = fitText(d.price, { font: font(FONTS.sans, 800), minSize: 12, maxSize: 24, w: pw, h: flashR * 1.2, lh: 1.05, maxLines: 4 }, P.measure);
    const th = r.lines.length * r.size * 1.05;
    P.lines('price', r.lines, cx - pw / 2, cy - th / 2, pw, r.size, 1.05, font(FONTS.sans, 800)(r.size), ink, 'center');
  }
  let y = m + bandH + 8;
  // Motto, volume and date under the band.
  const third = (W - 2 * m) / 3;
  P.one('motto', d.motto, m, y, third * 1.2 - 8, font(FONTS.sans, 700, 'italic'), 14, ink, 'left');
  P.one('volume', d.volume, m + third * 1.2, y, third * 0.8 - 8, font(FONTS.sans, 700), 13, ink, 'center', true);
  P.one('date', d.date, m + third * 2, y, third, font(FONTS.sans, 700), 13, ink, 'right', true);
  y += 22;
  P.line(m, y, W - m, y, ink, 2); y += 12;

  const tall = H >= 1290;
  if (tall && (has(d.earLeft) || has(d.earRight))) {
    const bw = (W - 2 * m - 16) / 2;
    let rowH = 0;
    [['earLeft', m], ['earRight', m + bw + 16]].forEach(([id, x]) => {
      if (!has(d[id])) return;
      const [label, ...rest] = String(d[id]).split('\n');
      const text = label.toUpperCase() + (rest.length ? ': ' + rest.join(' ') : '');
      const ls = wrap(text, bw - 24, font(FONTS.sans, 700)(16), P.measure).slice(0, 2);
      const bh = ls.length * 20 + 18;
      P.rect(x, y, bw, bh, YELLOW);
      P.lines(null, ls, x + 12, y + 9, bw - 24, 16, 1.25, font(FONTS.sans, 700)(16), ink, 'left');
      P.hit(id, x, y, bw, bh);
      rowH = Math.max(rowH, bh);
    });
    y += rowH + 12;
  } else if (!tall) {
    if (has(d.earLeft)) P.hide('earLeft', 'Not shown at this size');
    if (has(d.earRight)) P.hide('earRight', 'Not shown at this size');
  }

  const roomy = H >= 1100;
  const showTeasers = roomy && has(d.teasers);
  const footH = showTeasers ? 56 : 0;
  const bottom = H - m - footH - (footH ? 10 : 0);
  // Photo across the page, kicker as a red tag on it.
  const kickF = font(FONTS.sans, 800);
  const tag = (x, yy) => {
    if (!has(d.kicker)) return 0;
    const t = String(d.kicker).toUpperCase().replace(/\s+/g, ' ').trim();
    const fs = kickF(22);
    const tw = Math.min(P.measure(t, fs), W - 2 * m - 40);
    P.rect(x, yy, tw + 24, 36, RED);
    P.one('kicker', t, x + 12, yy + 4, tw + 2, kickF, 22, '#ffffff', 'left');
    return 36;
  };
  const headH = clamp(H * 0.17, 150, 300);
  if (photos.main) {
    const ph = clamp((bottom - y) * 0.4, 140, 640);
    P.photo('main', m, y, W - 2 * m, ph, o.look);
    tag(m + 14, y + 14);
    y += ph + 6;
    if (has(d.caption)) y += P.block('caption', d.caption, m, y, W - 2 * m, 18, font(FONTS.sans, 400, 'italic'), 13, 1.3, T.soft) + 4;
    y += 6;
  } else {
    const th = tag(m, y);
    if (th) y += th + 10;
  }
  y += P.fit('headline', d.headline, m, y, W - 2 * m, headH, font(FONTS.condensed, 400), 44, 210, 0.98, ink, 'left', { upper: true, maxLines: 4 }) + 8;
  if (has(d.deck)) y += P.fit('deck', d.deck, m, y, W - 2 * m, 64, font(FONTS.sans, 700), 18, 27, 1.18, ink, 'left', { maxLines: 2 }) + 10;
  P.line(m, y, W - m, y, ink, 1); y += 12;

  const side = roomy && (has(d.sideHead) || has(d.sideBody));
  const gutter = 22;
  const mainW = side ? (W - 2 * m) * 0.62 : W - 2 * m;
  const bodySize = print ? 15 : 17;
  solveStory(P, { x: m, y, w: mainW, h: bottom - y, cols: 2, gutter: 20, photo: false, look: o.look, d, ink, bodySize, captionFont: font(FONTS.sans, 400, 'italic'), bylineFont: font(FONTS.sans, 800), rules: null });
  if (side) {
    const sx = m + mainW + gutter;
    const sw = W - m - sx;
    P.rect(sx, y, sw, bottom - y, null, ink, 3);
    sideStory(P, { x: sx + 14, y: y + 14, w: sw - 28, h: bottom - y - 28, d, photo: !!photos.side, look: o.look, ink, bodySize, headFont: font(FONTS.condensed, 400), headMax: 40, upper: true });
  }
  if (showTeasers) teaserStrip(P, d, m, H - m - footH, W - 2 * m, footH, ink, ink, 'tabloid');
  return { roomy, side, showTeasers };
}

function vintage(P, d, o, photos) {
  const { W, H } = P;
  const print = o.print;
  const m = print ? 56 : 44;
  const V = PAPER.vintage;
  const ink = V.ink;
  P.rect(0, 0, W, H, o.paper === 'white' ? V.white : V.tint);
  if (o.paper !== 'white') P.ops.push({ t: 'speckle', seed: 7, count: Math.round(W * H / 900), color: V.soft });
  P.rect(m - 16, m - 16, W - 2 * m + 32, H - 2 * m + 32, null, ink, 1.4);
  P.rect(m - 11, m - 11, W - 2 * m + 22, H - 2 * m + 22, null, ink, 0.5);
  // Top row: volume left, price right.
  const half = (W - 2 * m) / 2;
  P.one('volume', d.volume, m, m - 4, half - 10, font(FONTS.serif, 700), 13, ink, 'left', true);
  P.one('price', d.price, m + half + 10, m - 4, half - 10, font(FONTS.serif, 700), 13, ink, 'right', true);
  let y = nameRow(P, d, o, 'vintage', m, ink, true);
  // Ornamental rules with a diamond, then the date.
  const ornament = (yy) => {
    P.line(m, yy, W - m, yy, ink, 3); P.line(m, yy + 6, W - m, yy + 6, ink, 0.8);
  };
  ornament(y); y += 12;
  y += P.one('date', d.date, m, y, W - 2 * m, font(FONTS.serif, 700), 14, ink, 'center', true) + 2;
  P.line(m, y, W - m, y, ink, 0.8); P.line(m, y + 5, W - m, y + 5, ink, 3);
  P.ops.push({ t: 'diamond', x: W / 2, y: y + 2.5, r: 7, fill: ink });
  y += 18;
  if (has(d.kicker)) {
    const t = String(d.kicker).toUpperCase().replace(/\s+/g, ' ').trim();
    const kf = font(FONTS.head, 700);
    const tw = Math.min(P.measure(t, kf(22)), W - 2 * m - 160);
    P.line(W / 2 - tw / 2 - 70, y + 14, W / 2 - tw / 2 - 14, y + 14, ink, 1);
    P.line(W / 2 + tw / 2 + 14, y + 14, W / 2 + tw / 2 + 70, y + 14, ink, 1);
    y += P.one('kicker', t, W / 2 - tw / 2 - 2, y, tw + 4, kf, 22, ink, 'center') + 4;
  }
  y += P.fit('headline', d.headline, m, y, W - 2 * m, clamp(H * 0.15, 110, 260), font(FONTS.head, 700), 32, 84, 1.03, ink, 'center', { upper: true, maxLines: 3 }) + 6;
  if (has(d.deck)) y += P.fit('deck', d.deck, m + 30, y, W - 2 * m - 60, 64, font(FONTS.serif, 400, 'italic'), 17, 25, 1.2, ink, 'center', { maxLines: 2 }) + 6;
  P.line(m, y, W - m, y, ink, 1.4); y += 12;

  const roomy = H >= 1100;
  const showTeasers = roomy && has(d.teasers);
  const footH = showTeasers ? 44 : 0;
  const bottom = H - m - footH - (footH ? 8 : 0);
  const side = roomy && (has(d.sideHead) || has(d.sideBody));
  const g = 18;
  const nCols = 4;
  const colW = (W - 2 * m - (nCols - 1) * g) / nCols;
  const bodyCols = side ? 3 : 4;
  for (let i = 1; i < nCols; i++) P.line(m + i * (colW + g) - g / 2, y, m + i * (colW + g) - g / 2, bottom, ink, 0.6);
  const bodySize = print ? 14 : 16;
  const bodyFont = font(FONTS.serif, 400);
  const capF = font(FONTS.serif, 400, 'italic');
  const pw = colW * 2 + g;
  const capH = photos.main && has(d.caption) ? Math.min(2, wrap(d.caption, pw, capF(12), P.measure).length) * 15 + 6 : 0;
  const byH = has(d.byline) ? 14 * 1.25 + 6 : 0;
  const tryLayout = (ph, size) => {
    const top0 = y + (photos.main ? ph + 6 + capH : 0);
    const cols = [];
    for (let i = 0; i < bodyCols; i++) {
      const top = (i < 2 ? top0 : y) + (i === 0 ? byH : 0);
      cols.push({ x: m + i * (colW + g), y: top, w: colW, h: bottom - top });
    }
    const r = flow(d.body, cols, bodyFont(size), size, 1.3, P.measure);
    return { ph, size, cols, cut: r.cut };
  };
  const minPh = photos.main ? 140 : 0;
  let best = tryLayout(photos.main ? clamp(pw * 0.75, minPh, (bottom - y) * 0.5) : 0, bodySize);
  while (best.cut && best.ph > minPh) best = tryLayout(Math.max(minPh, best.ph - 12), bodySize);
  if (!best.cut) {
    while (photos.main && best.ph + 12 <= Math.min((bottom - y) * 0.6, pw * 1.2)) { const n = tryLayout(best.ph + 12, best.size); if (n.cut) break; best = n; }
    while (best.size + 0.5 <= bodySize * 1.3) { const n = tryLayout(best.ph, best.size + 0.5); if (n.cut) break; best = n; }
  }
  let yy = y;
  if (photos.main) {
    P.photo('main', m, yy, pw, best.ph, o.look);
    yy += best.ph + 6;
    if (has(d.caption)) P.block('caption', d.caption, m, yy, pw, 30, capF, 12, 15 / 12, ink, 'center');
  }
  if (byH) P.one('byline', d.byline, m, best.cols[0].y - byH, colW, font(FONTS.serif, 700), 14, ink, 'center', true);
  P.flowText('body', d.body, best.cols, bodyFont, best.size, 1.3, ink);
  if (side) {
    const sx = m + 3 * (colW + g);
    sideStory(P, { x: sx, y, w: colW, h: bottom - y, d, photo: !!photos.side, look: o.look, ink, bodySize, headFont: font(FONTS.head, 700), headMax: 26, upper: true });
  }
  if (showTeasers) {
    const items = String(d.teasers).split('\n').map((s) => s.trim()).filter(Boolean);
    const fy = H - m - footH;
    P.line(m, fy, W - m, fy, ink, 3); P.line(m, fy + 5, W - m, fy + 5, ink, 0.8);
    const t = items.join('   •   ');
    P.one(null, t, m, fy + 14, W - 2 * m, font(FONTS.serif, 400, 'italic'), 16, ink, 'center');
    P.hit('teasers', m, fy, W - 2 * m, footH);
  }
  return { roomy, side, showTeasers };
}

const RENDER = { classic, tabloid, vintage };

/**
 * @param {string} template classic | tabloid | vintage
 * @param {string} format   letter | a4 | post | square | story
 * @param {object} doc      { fields: {...}, opts: { face, paper, look, notice } }
 * @param {{main?: any, side?: any}} photos which photo slots have a picture
 * @param {(text: string, font: string) => number} measure
 */
export function layout(template, format, doc, photos, measure) {
  const W = DESIGN_W;
  const H = designHeight(format);
  const P = new Page(W, H, measure);
  const tpl = RENDER[template] ? template : 'classic';
  const opts = { face: 'auto', paper: 'tint', look: 'auto', notice: true, ...(doc.opts || {}) };
  const o = { ...opts, print: FORMATS[format].print, look: opts.look === 'auto' ? TEMPLATES[tpl].look : opts.look };
  const d = doc.fields;
  const r = RENDER[tpl](P, d, o, photos || {});
  // Fields this page cannot show, with a reason the field list displays.
  if (!r.side) for (const f of ['sideHead', 'sideBody', 'sideCaption']) if (has(d[f]) && !P.hidden[f]) P.hide(f, r.roomy ? 'Empty second story' : 'Not shown at this size');
  if (!r.showTeasers && has(d.teasers)) P.hide('teasers', 'Not shown at this size');
  if (r.side && !photos?.side && has(d.sideCaption)) P.hide('sideCaption', 'Add a second photo to show it');
  if (!photos?.main && has(d.caption)) P.hide('caption', 'Add a photo to show it');
  if (!o.notice && has(d.notice)) P.hide('notice', 'Turned off under Look');
  // A field with text that got no tap target was squeezed out: tell the user.
  for (const f of Object.keys(d)) if (has(d[f]) && !P.hidden[f] && !P.hits.some((h) => h.field === f)) P.hide(f, 'No room at this size');
  return { W, H, ops: P.ops, hits: P.hits, hidden: P.hidden };
}
