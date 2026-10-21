# Code review: maintainer lens (newspaper-front-page-maker)
Reviewer: Lisbeth (independent). Date: 2026-10-21. Base: cfe54a0. Fixes: 145e8e2, 3ee0862, 8be8858, 6107808.

**Verdict:** Ownable for years. Pure layout core, injected `measure`, Node known-answer tests plus two real-browser gates (network privacy, UI). No dependency risk (no runtime libraries; own PDF and PNG writers). 0 must-fix open.

| Severity | File:line | Finding | Why | Fix / status |
|---|---|---|---|---|
| should | scripts/e2e-lib.mjs:33 | Browser tests could bind only 4983 to 4988 | Other agents share the machine; a reviewer or CI on other ports could not run the release gate | Fixed: `NP_PORTS` env list, default unchanged |
| should | src/lib/np/ui.js:41 (`restore`) | New share link reads state from someone else; the old loader spread every key and trusted `PRESETS[s.preset]` (`constructor` passes) | Untrusted input must not set unknown keys or non-strings that later crash name swap | Fixed: own-key id lists, strings only, option whitelist, length caps |
| should | src/lib/np/png.js | Print PNGs had no pHYs chunk | The site says 300 DPI; without pHYs photo apps assume 72 DPI and print a 35 inch page or scale it | Fixed: `addPngDpi` (11811 px/m) on Letter and A4, unit test plus UI check |
| nice | src/lib/np/ui.js `swap` | Clear the Name box, leave it, then type a new name later: edited fields keep the blank (generated fields are fine) | Rare; snapshot logic only spans one focus | Open (P1). Keep the last non-empty name as `from` |
| nice | src/lib/np/draw.js `grayOf` | Grayscale copy cached on the photo object, never freed | Fine today (photo objects are replaced); note for a photo strip in P1 | Open |
| nice | QA open item | Not run on real iOS Safari, Android Chrome or Firefox (canvas fonts, Share, date input) | Engine gaps show up on real devices only | Owner or Barney: one real-phone check before launch |

Edge input checked by hand in the browser: 15,000-character story, 300-character headline with emoji and CJK, empty fields, `$1 (x) [y]` names, non-image file (plain message), 2550x3300 canvas (8.4 MP, under the iOS 16.7 MP limit).
Template leftovers (template README, scripts/new-tool.sh, tracked screenshots, duplicate legal links, build-date Last updated, British spelling) are on the fixer list; none found that affect this tool.
