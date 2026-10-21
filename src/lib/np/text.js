// Text measuring helpers. All sizes are design units. `measure(text, font)` returns a width.
// `font` is a function size -> CSS font string, so one style can be tried at many sizes.

/** Split text into paragraphs (one per line break), trimming each and dropping empty ones. */
export function paragraphs(text) {
  return String(text ?? '').replace(/\r\n?/g, '\n').split('\n').map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

/**
 * Wrap text to a width. Hard line breaks start a new paragraph.
 * Returns lines: { text, end } where end = last line of its paragraph (not justified).
 */
export function wrap(text, maxW, fontStr, measure) {
  const lines = [];
  for (const para of paragraphs(text)) {
    let line = '';
    for (const word of para.split(' ')) {
      const tryLine = line ? line + ' ' + word : word;
      if (measure(tryLine, fontStr) <= maxW) { line = tryLine; continue; }
      if (line) { lines.push({ text: line, end: false }); line = ''; }
      // A word wider than the line is cut into pieces that fit.
      let rest = word;
      while (measure(rest, fontStr) > maxW && rest.length > 1) {
        let n = rest.length - 1;
        while (n > 1 && measure(rest.slice(0, n), fontStr) > maxW) n--;
        lines.push({ text: rest.slice(0, n), end: false });
        rest = rest.slice(n);
      }
      line = rest;
    }
    if (line) lines.push({ text: line, end: true });
  }
  return lines;
}

/** Shorten a line with an ellipsis until it fits. */
export function ellipsize(text, maxW, fontStr, measure) {
  let t = text.replace(/[\s.,;:!?-]+$/, '');
  while (t && measure(t + '…', fontStr) > maxW) t = t.slice(0, -1).replace(/\s+$/, '');
  return t + '…';
}

/**
 * Largest size from maxSize down to minSize at which the text fits w x h (lines * size * lh <= h)
 * and at most maxLines lines. At minSize, extra lines are cut and the last one gets an ellipsis.
 * Returns { size, lines, cut }.
 */
export function fitText(text, { font, minSize, maxSize, w, h, lh = 1.1, maxLines = 99 }, measure) {
  const fits = (size) => {
    const lines = wrap(text, w, font(size), measure);
    return { lines, ok: lines.length <= maxLines && lines.length * size * lh <= h + 0.01 };
  };
  let lo = Math.ceil(minSize), hi = Math.floor(maxSize), best = null;
  // Sizes are whole units; binary search for the largest size that fits.
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const r = fits(mid);
    if (r.ok) { best = { size: mid, lines: r.lines }; lo = mid + 1; } else hi = mid - 1;
  }
  if (best) return { ...best, cut: false };
  const size = Math.ceil(minSize);
  const all = wrap(text, w, font(size), measure);
  const room = Math.max(1, Math.min(maxLines, Math.floor((h + 0.01) / (size * lh))));
  const lines = all.slice(0, room);
  if (all.length > room && lines.length) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] = { text: ellipsize(last.text, w, font(size), measure), end: true };
  }
  return { size, lines, cut: all.length > room };
}

/**
 * Flow text through columns ({x, y, w, h}); columns may have different widths.
 * Lines are size*lh apart. Returns { placed: [{ col, x, y, w, text, end }], cut, usedH }.
 * When the text does not fit, the last line ends with an ellipsis.
 */
export function flow(text, cols, fontStr, size, lh, measure) {
  const step = size * lh;
  const placed = [];
  const usedH = cols.map(() => 0);
  // Remaining text as paragraphs of words; each column wraps what is left at its own width.
  const paras = paragraphs(text).map((p) => p.split(' '));
  let p = 0, wi = 0;
  for (let c = 0; c < cols.length && p < paras.length; c++) {
    const col = cols[c];
    const room = Math.floor((col.h + 0.01) / step);
    let r = 0;
    while (r < room && p < paras.length) {
      // Fill one line from paras[p] starting at word wi.
      const words = paras[p];
      let line = '';
      while (wi < words.length) {
        const tryLine = line ? line + ' ' + words[wi] : words[wi];
        if (measure(tryLine, fontStr) <= col.w) { line = tryLine; wi++; continue; }
        if (!line) {
          // One word wider than the column: cut it.
          let n = words[wi].length - 1;
          while (n > 1 && measure(words[wi].slice(0, n), fontStr) > col.w) n--;
          line = words[wi].slice(0, n);
          words[wi] = words[wi].slice(n);
        }
        break;
      }
      const end = wi >= words.length;
      placed.push({ col: c, x: col.x, y: col.y + r * step, w: col.w, text: line, end });
      r++;
      usedH[c] = r * step;
      if (end) { p++; wi = 0; }
    }
  }
  const cut = p < paras.length;
  if (cut && placed.length) {
    const last = placed[placed.length - 1];
    last.text = ellipsize(last.text, last.w, fontStr, measure);
    last.end = true;
  }
  return { placed, cut, usedH };
}

/** Height a block of text needs at a given size and width. */
export function blockHeight(text, w, fontStr, size, lh, measure) {
  return wrap(text, w, fontStr, measure).length * size * lh;
}

/**
 * Shorten columns to a common bottom line so the text is spread evenly (newspaper style),
 * without cutting text that fits. Returns new column boxes.
 */
export function balance(text, cols, fontStr, size, lh, measure) {
  if (!cols.length) return cols;
  const step = size * lh;
  const bottom = Math.max(...cols.map((c) => c.y + c.h));
  const top = Math.min(...cols.map((c) => c.y));
  const at = (b) => cols.map((c) => ({ ...c, h: Math.max(0, b - c.y) }));
  if (flow(text, cols, fontStr, size, lh, measure).cut) return cols;
  let lo = top + step, hi = bottom;
  while (hi - lo > step / 4) {
    const mid = (lo + hi) / 2;
    if (flow(text, at(mid), fontStr, size, lh, measure).cut) lo = mid; else hi = mid;
  }
  return at(hi);
}
