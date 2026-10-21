# Code review: regression lens (newspaper-front-page-maker)
Reviewer: Lisbeth. Date: 2026-10-21.

**Verdict:** Sizes, dates and file formats are correct by hand and by test. One spec miss (cut text) and one size issue (story under app bars) were fixed. 0 must-fix open.

## Hand recomputes
| Case | By hand | Code / file | Source |
|---|---|---|---|
| Letter pixels | 8.5 in x 300 = 2550, 11 x 300 = 3300 | PNG header 2550 x 3300 | US Letter 8.5 x 11 in |
| Letter PDF | 8.5 x 72 = 612, 11 x 72 = 792 pt | MediaBox [0 0 612 792] | PDF 1.4: 1 pt = 1/72 in |
| A4 pixels | 210/25.4 x 300 = 2480.3 -> 2480; 297/25.4 x 300 = 3507.9 -> 3508 | 2480 x 3508 | ISO 216 (A4 210 x 297 mm) |
| A4 PDF | 210/25.4 x 72 = 595.28; 297/25.4 x 72 = 841.89 pt | MediaBox [0 0 595.28 841.89] | ISO 216 |
| Design heights | 1000 x 3300/2550 = 1294.12; 1000 x 3508/2480 = 1414.52; 1000 x 1920/1080 = 1777.78; post 1250; square 1000 | test-np "design heights" | formats.js |
| Print margin | classic 50 units x 8.5 in/1000 = 0.425 in (Letter); 50 x 210/1000 = 10.5 mm = 0.41 in (A4); vintage text 56 units = 0.48 in, frame rule 40 units = 0.34 in | layout.js | spec 3.2 (0.4 in) |
| Story band | 250 px x 1000/1080 = 231.5 units | layout.js inset; new unit test | common 9:16 safe-zone guidance (about 250 px top and bottom) |
| 300 DPI in PNG | 300 / 0.0254 = 11811.02 -> 11811 px per meter | pHYs 11811, 11811, unit 1 | PNG spec 11.3.5.3 pHYs |
| Date | 2026-10-21: day 294; Jan 1 2026 is Thursday; 293 mod 7 = 6 -> Wednesday | "Wednesday, October 21, 2026" in LA, Kolkata, UTC | local-part parsing |
| CRC-32 | IEND -> AE426082; "123456789" -> CBF43926 | test-np | PNG spec annex D, CRC-32 check value |

## Findings
| Severity | File:line | Finding | Why | Fix / status |
|---|---|---|---|---|
| should | src/lib/np/text.js `flow` | Cut story ended with "…" only; spec 3.1 asks for "(continued on page 2)" style text | Spec P0; tells the reader the story goes on | Fixed: suffix when it fits (falls back to "…"); unit test |
| should | layout.js / ui.js notes | No sign in the field list when a field is cut to fit | Users could not tell why words vanished at Square | Fixed: separate `cut` map (not `hidden`), note "Cut short to fit this size..." |
| should | layout.js story | Story PNG put the masthead 43 px from the top and the teasers at the very bottom | Story apps draw the progress bar, name and reply box there | Fixed: 250 px bands (dark backdrop) on story only; unit test checks every op and hit |
| should | png.js | No pHYs (see maintainer) | "300 DPI" claim | Fixed |

Template rules hold in the Bingemind build: canonical `https://bingemind.com/newspaper-front-page-maker/`, og:image under the tool path, robots index,follow, no robots.txt (hub owns it), sitemap with the tool URLs only, contact and terms noindex and out of the sitemap, 404 present, GA and AdSense off (empty IDs, AdSlot renders nothing). Pages build: canonical to bingemind, noindex, follow. `_headers` keeps pages.dev noindex.
