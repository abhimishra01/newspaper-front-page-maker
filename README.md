# Newspaper Front Page Maker

Free novelty front page maker. Live target: https://bingemind.com/newspaper-front-page-maker/ (Pages copy: https://abhimishra01.github.io/newspaper-front-page-maker/, noindex).
Astro (static) + Tailwind 4. No backend. The page is drawn on a canvas in the browser; photos never leave the device.
Spec and rival research: ~/Desktop/personal/microtools/research/newspaper/ (SPEC.md, R-AND-D.md).

## What it does
- Three original layouts (classic broadsheet, tabloid, vintage 1920s), seven occasion presets with a name and number swap, "Surprise me" headlines.
- Tap any text on the page to edit it in place; the "All text on the page" list has every field.
- Main and second photo: add, drop, drag to move, zoom, color / black and white / halftone.
- Sizes: Letter and A4 (PNG or PDF, 300 DPI), 1080x1350, 1080x1080, 1080x1920. Print and Share. No watermark; the PNG carries a "Novelty print. Fictional." tEXt chunk.
- Text and settings are saved in localStorage (`bm.newspaper.v1`); photos are never saved.

## Where the logic lives (src/lib/np/)
- `formats.js` sizes; `layout.js` the three layouts (pure, design units 1000 wide); `text.js` wrap, fit and column flow.
- `draw.js` paints layout ops on a canvas; `photo.js` reads photos locally; `ui.js` page logic.
- `pdf.js` one-page PDF writer; `png.js` tEXt chunk; `presets.js` occasion text; `date.js` local dates; `filename.js`.

## Commands
- `npm run dev` (port 4981), `npm test` (known-answer tests, Node), `npm run build`.
- `npm run test:browser` after a build: privacy network test and page test in Chrome (ports 4983 to 4988).
- `npm run build:bingemind`: tests, Bingemind build into dist-bingemind/, then the browser tests on it.

## Rules
- Original layouts only. No real outlet names, mastheads, slogans or look-alikes. Presets stay kind (npm test checks a blocked-word list).
- The masthead font is UnifrakturMaguntia (SIL OFL 1.1), self-hosted at public/fonts/ with its license.
