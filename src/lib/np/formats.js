// Output sizes. Pixels are what the PNG holds; pdf is the page size in points (1/72 in) for print sizes.
// The page is laid out 1000 design units wide; the height in units keeps the format's shape.
export const DESIGN_W = 1000;

export const FORMATS = {
  letter: { id: 'letter', name: 'Letter print (US)', short: 'Letter', w: 2550, h: 3300, pdf: [612, 792], print: true, page: 'letter' },
  a4: { id: 'a4', name: 'A4 print', short: 'A4', w: 2480, h: 3508, pdf: [595.28, 841.89], print: true, page: 'A4' },
  post: { id: 'post', name: 'Post 4:5 (1080 x 1350)', short: 'Post', w: 1080, h: 1350, pdf: null, print: false },
  square: { id: 'square', name: 'Square 1:1 (1080 x 1080)', short: 'Square', w: 1080, h: 1080, pdf: null, print: false },
  // safe: pixels kept clear at the top and bottom, where story apps draw their own bars.
  story: { id: 'story', name: 'Story 9:16 (1080 x 1920)', short: 'Story', w: 1080, h: 1920, pdf: null, print: false, safe: 250 },
};
export const FORMAT_IDS = Object.keys(FORMATS);

/** Page height in design units for a format. */
export function designHeight(id) {
  const f = FORMATS[id];
  return (DESIGN_W * f.h) / f.w;
}

/** Letter for US-style locales, A4 elsewhere. */
export function defaultFormat(lang = '') {
  return /^(en-us|en-ca|es-us|es-mx|fil)\b/i.test(lang) ? 'letter' : 'a4';
}
