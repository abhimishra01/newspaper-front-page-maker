# Review summary: newspaper-front-page-maker
Reviewer: Lisbeth (independent; did not build it). Date: 2026-10-21. Base commit cfe54a0. Ports used: 4931 to 4936 only.

## Result
No Critical or High findings. 9 accepted Medium ("should") findings, all fixed, tested and committed. Gate after fixes: `npm test` 19 passed, `npm run build` ok, `npm run build:bingemind` ok (network privacy test and 15-step UI test pass on the Bingemind build).

| Lens | Report | Must | Should found / fixed |
|---|---|---|---|
| Maintainer | code-maintainer.md | 0 | 3 / 3 |
| Minimalism | code-minimalism.md | 0 | 0 (1 nice fixed) |
| Regression | code-regression.md | 0 | 4 / 4 (overlaps maintainer on pHYs) |
| Readability | code-readability.md | 0 | 1 / 1 |
| Design and SEO | design-seo.md | 0 | 4 / 4 (overlaps on story) |
| Customers (8 personas) | customers.md | 2 asked "must" | 6 / 6 |

## Special checks
- **No trademark look-alikes:** pass. Invented paper names, no outlet names or slogans (tested), generic newspaper forms only.
- **Photo never leaves the device:** pass. Network test with byte and text markers over PNG, PDF, print, story and a Copy link round trip: all same-host GETs, no marker, no body. Photos are not stored and never go in links.
- **Export sizes:** pass. 2550x3300, 2480x3508, 1080x1350, 1080x1080, 1080x1920; PDF MediaBox 612x792 and 595.28x841.89; print PNGs now carry 300 DPI (pHYs).
- **Phone one-handed editing:** was weak (lines 5 to 8 px tall, no bottom bar); now fixed with nearest-line tap, Back/Next in the editor, and a bottom bar.

## Fixes (site commits)
- 145e8e2: nearest-line tap, Back/Next, phone bottom bar, story safe bands, "(continued on page 2)" and cut notes, Wedding preset, tablet preview cap, NP_PORTS for test ports.
- 3ee0862: Copy link (words in the # part only), checked restore of shared state, network test opens the link.
- 8be8858: 300 DPI pHYs chunk on Letter and A4 PNGs.
- 6107808: removed unused `blockHeight`; README updated.
- b6df83e: article section on printing many copies or a poster.

## Open (nice, not blocking)
Print a blank page for classrooms; own logo as the name; back page; name swap across focus sessions; one real iPhone/Android/Firefox check (owner or Barney); `vintage()` duplicates the story solver.

## Comparison
comparison/newspaper-front-page-maker.md: round 2 score ours 65/80 vs fakenewspaper.app 52, 101planners 46, jaguarpaw 30. Best tool for the core job: yes. Only domain strength is still lost (101planners).
