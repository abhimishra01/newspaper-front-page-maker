// Paints layout ops on a canvas. ctx must be scaled so 1 unit = 1 design unit (see paint()).
// Text is measured in design units, so the same ops give the same lines at every size.

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Source rectangle for a photo that covers a w x h box, with zoom (>= 1) and pan fx, fy in -1..1. */
export function coverCrop(srcW, srcH, w, h, zoom = 1, fx = 0, fy = 0) {
  const a = w / h;
  let cw = srcW, ch = srcW / a;
  if (ch > srcH) { ch = srcH; cw = srcH * a; }
  cw /= zoom; ch /= zoom;
  const cx = srcW / 2 + fx * (srcW - cw) / 2;
  const cy = srcH / 2 + fy * (srcH - ch) / 2;
  return { sx: cx - cw / 2, sy: cy - ch / 2, sw: cw, sh: ch };
}

function grayOf(photo) {
  if (photo.gray) return photo.gray;
  const c = document.createElement('canvas');
  c.width = photo.canvas.width; c.height = photo.canvas.height;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(photo.canvas, 0, 0);
  const img = g.getImageData(0, 0, c.width, c.height);
  const p = img.data;
  for (let i = 0; i < p.length; i += 4) {
    // Luma with a little extra contrast, like newsprint.
    let v = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
    v = Math.max(0, Math.min(255, (v - 128) * 1.12 + 128));
    p[i] = p[i + 1] = p[i + 2] = v;
  }
  g.putImageData(img, 0, 0);
  photo.gray = c;
  return c;
}

function drawPhoto(ctx, op, photo) {
  const { x, y, w, h } = op;
  if (!photo) return;
  const src = op.look === 'color' ? photo.canvas : grayOf(photo);
  const { sx, sy, sw, sh } = coverCrop(src.width, src.height, w, h, photo.zoom, photo.fx, photo.fy);
  if (op.look === 'halftone') {
    const cell = 5.2;
    const nx = Math.max(1, Math.round(w / cell)), ny = Math.max(1, Math.round(h / cell));
    const small = document.createElement('canvas');
    small.width = nx; small.height = ny;
    const s = small.getContext('2d', { willReadFrequently: true });
    s.imageSmoothingQuality = 'high';
    s.drawImage(src, sx, sy, sw, sh, 0, 0, nx, ny);
    const data = s.getImageData(0, 0, nx, ny).data;
    ctx.fillStyle = '#f5f0e4';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#1d1913';
    const cw = w / nx, chh = h / ny;
    ctx.beginPath();
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const v = data[(j * nx + i) * 4] / 255;
      const r = Math.min(cw, chh) * 0.62 * Math.sqrt(1 - v);
      if (r < 0.15) continue;
      const cx = x + (i + 0.5) * cw, cy = y + (j + 0.5) * chh;
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
    ctx.fill();
  } else {
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, sx, sy, sw, sh, x, y, w, h);
  }
  ctx.strokeStyle = 'rgba(0,0,0,.55)';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x, y, w, h);
}

function drawText(ctx, op) {
  ctx.font = op.font;
  ctx.fillStyle = op.color;
  ctx.textAlign = op.align;
  const words = op.jw ? op.text.split(' ') : null;
  if (words && words.length > 1) {
    const natural = ctx.measureText(op.text).width;
    const extra = op.jw - natural;
    // Justify only when the gaps stay reasonable.
    if (extra > 0 && extra < op.jw * 0.16 && extra / (words.length - 1) < op.jw * 0.06) {
      ctx.textAlign = 'left';
      const space = ctx.measureText(' ').width + extra / (words.length - 1);
      let cx = op.x;
      for (const wd of words) { ctx.fillText(wd, cx, op.y); cx += ctx.measureText(wd).width + space; }
      return;
    }
  }
  ctx.fillText(op.text, op.x, op.y);
}

/** Draw all ops. photos: { main, side } loaded photos (or null). */
export function paint(ctx, L, scale, photos = {}) {
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.textBaseline = 'alphabetic';
  for (const op of L.ops) {
    switch (op.t) {
      case 'rect':
        if (op.fill) { ctx.fillStyle = op.fill; ctx.fillRect(op.x, op.y, op.w, op.h); }
        if (op.stroke) { ctx.strokeStyle = op.stroke; ctx.lineWidth = op.lw; ctx.strokeRect(op.x, op.y, op.w, op.h); }
        break;
      case 'line':
        ctx.strokeStyle = op.color; ctx.lineWidth = op.lw;
        ctx.beginPath(); ctx.moveTo(op.x1, op.y1); ctx.lineTo(op.x2, op.y2); ctx.stroke();
        break;
      case 'circle':
        ctx.fillStyle = op.fill; ctx.beginPath(); ctx.arc(op.cx, op.cy, op.r, 0, Math.PI * 2); ctx.fill();
        break;
      case 'diamond':
        ctx.fillStyle = op.fill; ctx.beginPath();
        ctx.moveTo(op.x, op.y - op.r); ctx.lineTo(op.x + op.r, op.y); ctx.lineTo(op.x, op.y + op.r); ctx.lineTo(op.x - op.r, op.y); ctx.closePath(); ctx.fill();
        break;
      case 'speckle': {
        const r = rng(op.seed);
        ctx.fillStyle = op.color;
        for (let i = 0; i < op.count; i++) {
          ctx.globalAlpha = 0.05 + r() * 0.12;
          ctx.beginPath(); ctx.arc(op.x + r() * op.w, op.y + r() * op.h, 0.3 + r() * 1.1, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        break;
      }
      case 'text': drawText(ctx, op); break;
      case 'photo': drawPhoto(ctx, op, photos[op.slot]); break;
    }
  }
  ctx.restore();
}
