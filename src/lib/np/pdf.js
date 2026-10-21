// A one-page PDF that holds one JPEG, scaled to fill the page. No library needed.
const enc = (s) => Uint8Array.from(s, (c) => c.charCodeAt(0) & 0xff);
const num = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
// PDF strings: escape \ ( ) and keep plain ASCII.
const pdfStr = (s) => '(' + String(s).replace(/[^\x20-\x7e]/g, '?').replace(/([\\()])/g, '\\$1') + ')';

/**
 * @param {Uint8Array} jpeg  baseline JPEG bytes
 * @param {number} pxW pixel width of the JPEG
 * @param {number} pxH pixel height of the JPEG
 * @param {[number, number]} page page size in points
 * @param {{title?: string, subject?: string}} info
 * @returns {Uint8Array}
 */
export function buildPdf(jpeg, pxW, pxH, page, info = {}) {
  const [pw, ph] = page;
  const content = `q ${num(pw)} 0 0 ${num(ph)} 0 0 cm /Im1 Do Q\n`;
  const parts = [];
  const offsets = [];
  let length = 0;
  const push = (p) => { const b = typeof p === 'string' ? enc(p) : p; parts.push(b); length += b.length; };
  const obj = (n, body) => { offsets[n] = length; push(`${n} 0 obj\n`); for (const b of [].concat(body)) push(b); push('\nendobj\n'); };

  push('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(pw)} ${num(ph)}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>`);
  obj(4, [`<< /Type /XObject /Subtype /Image /Width ${pxW} /Height ${pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`, jpeg, '\nendstream']);
  obj(5, `<< /Length ${content.length} >>\nstream\n${content}endstream`);
  obj(6, `<< /Title ${pdfStr(info.title || 'Front page')} /Subject ${pdfStr(info.subject || '')} /Producer (bingemind.com) >>`);
  const xref = length;
  let x = 'xref\n0 7\n0000000000 65535 f \n';
  for (let i = 1; i <= 6; i++) x += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  push(x + `trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

  const out = new Uint8Array(length);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
