# Code review: minimalism lens (newspaper-front-page-maker)
Reviewer: Lisbeth. Date: 2026-10-21.

**Verdict:** Lean. 54 KB of JS for the whole editor (layout, PDF, PNG, presets), no runtime libraries, 384 KB built site. 0 must-fix.

| Severity | File:line | Finding | Why | Fix / status |
|---|---|---|---|---|
| nice | src/lib/np/text.js (`blockHeight`) | Exported, never used | Dead code | Fixed: removed (6107808) |
| nice | src/lib/np/layout.js `vintage()` | Repeats the photo and column solver from `solveStory` (about 25 lines) | Two copies of the same search loop to keep in step | Open; merge when a fourth layout is added |
| nice | src/lib/np/layout.js `nameRow` | Ears are laid out twice (probe page, then real) | Simple and cheap; a measure-only helper would be smaller | Open, low value |
| nice | src/components/Tool.astro | Three inline SVG layout sketches | Small and specific; fine | Keep |

Checked: no leftover json-diff code, no demo modules, no unused imports in ui.js or Tool.astro, fixture photo 32 KB, OG image 120 KB.
