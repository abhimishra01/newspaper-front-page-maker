// Reads a photo on this device only: File API -> bitmap -> canvas. Nothing is uploaded or stored.
const MAX_SIDE = 2400;

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch {}
  }
  // Fallback: an <img> from a local blob: URL (browsers apply EXIF orientation to images).
  const src = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(src);
  }
}

/** Returns { canvas, w, h, zoom, fx, fy } or throws an Error with a plain message. */
export async function loadPhoto(file) {
  if (!file || !/^image\//.test(file.type || '') && !/\.(jpe?g|png|gif|webp|avif|heic|heif|bmp)$/i.test(file.name || '')) {
    throw new Error('That file is not a picture. Choose a JPG, PNG or WebP photo.');
  }
  let bmp;
  try { bmp = await decode(file); } catch {
    throw new Error('This browser cannot open that photo type. Try a JPG or PNG.');
  }
  const w0 = bmp.width || bmp.naturalWidth, h0 = bmp.height || bmp.naturalHeight;
  if (!w0 || !h0) throw new Error('That picture looks empty. Try another photo.');
  const k = Math.min(1, MAX_SIDE / Math.max(w0, h0));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w0 * k));
  canvas.height = Math.max(1, Math.round(h0 * k));
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  if (bmp.close) bmp.close();
  return { canvas, w: canvas.width, h: canvas.height, zoom: 1, fx: 0, fy: 0, name: file.name || 'photo' };
}
