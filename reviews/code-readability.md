# Code review: readability lens (newspaper-front-page-maker)
Reviewer: Lisbeth. Date: 2026-10-21.

**Verdict:** Readable. Module names match their jobs, comments explain why (UTC date trap, focus snapshot for name swap, touch move mode). No placeholder text on any page. 0 must-fix.

| Severity | File:line | Finding | Why | Fix / status |
|---|---|---|---|---|
| should | README.md | Said seven presets; no word on pHYs, story bands, Copy link or NP_PORTS | README must match the code | Fixed (6107808) |
| nice | src/lib/np/ui.js | One-letter globals `S`, `L`, `k` | Commented at their declaration; fine in a 600-line module, but `state`, `lastLayout`, `scale` would read better | Open |
| nice | src/lib/np/layout.js | `o.print` means "print size", not "printing now" | Small trip hazard | Open (rename to `printSize` later) |
| nice | src/lib/np/ui.js:105 | aria-label strips " (first line is the label)" with a regex | Works; a separate short label field in FIELDS would be clearer | Open |

Content check: About, Privacy, Terms, Contact, article and FAQ use US spelling, short sentences, no em dashes, no lorem, no TODO. Privacy now explains Copy link (words in the # part, never photos).
