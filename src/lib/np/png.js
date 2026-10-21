// Adds a tEXt chunk to a PNG, right after IHDR. Used to keep the "Novelty print. Fictional." note
// in the file without drawing a watermark on the picture.
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes, start = 0, end = bytes.length) {
  let c = 0xffffffff;
  for (let i = start; i < end; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const latin1 = (s) => Uint8Array.from(String(s).replace(/[^\x20-\x7e]/g, '?'), (ch) => ch.charCodeAt(0));

/** Returns a new PNG (Uint8Array) with one chunk (4-letter type, data bytes) inserted after IHDR. */
function insertChunk(png, type, data) {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) if (png[i] !== sig[i]) throw new Error('Not a PNG');
  const ihdrLen = ((png[8] << 24) | (png[9] << 16) | (png[10] << 8) | png[11]) >>> 0;
  const at = 8 + 12 + ihdrLen; // signature + IHDR (length, type, data, crc)
  const chunk = new Uint8Array(12 + data.length);
  const dv = new DataView(chunk.buffer);
  dv.setUint32(0, data.length);
  chunk.set(latin1(type), 4);
  chunk.set(data, 8);
  dv.setUint32(8 + data.length, crc32(chunk, 4, 8 + data.length));
  const out = new Uint8Array(png.length + chunk.length);
  out.set(png.subarray(0, at), 0);
  out.set(chunk, at);
  out.set(png.subarray(at), at + chunk.length);
  return out;
}

/** Returns a new PNG with a tEXt chunk keyword=text after IHDR. */
export function addPngText(png, keyword, text) {
  return insertChunk(png, 'tEXt', new Uint8Array([...latin1(keyword).slice(0, 79), 0, ...latin1(text)]));
}

/** Returns a new PNG with a pHYs chunk, so apps print it at `dpi` dots per inch (300 DPI = 11811 per meter). */
export function addPngDpi(png, dpi) {
  const ppm = Math.round(dpi / 0.0254);
  const data = new Uint8Array(9);
  const dv = new DataView(data.buffer);
  dv.setUint32(0, ppm); dv.setUint32(4, ppm); data[8] = 1; // unit: meter
  return insertChunk(png, 'pHYs', data);
}

/** Width and height from a PNG header. */
export function pngSize(png) {
  const dv = new DataView(png.buffer, png.byteOffset, png.byteLength);
  return { w: dv.getUint32(16), h: dv.getUint32(20) };
}
