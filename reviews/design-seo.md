# Design and SEO review (newspaper-front-page-maker)
Reviewer: Lisbeth. Date: 2026-10-21. Viewed with playwright-cli at 1440, 390 (iPhone 15, touch), 810 (iPad, touch), light and dark. Served from my own build on port 4931.

**Lighthouse (mobile, local server):** Performance 99, Accessibility 97, Best practices 100, SEO 100. LCP 1.9 s, CLS 0.007, TBT 20 ms. The a11y point lost is target-size on page lines (see row 1; mitigated, not chased to 100).

| Severity | Area | Finding | Fix / status |
|---|---|---|---|
| should | Phone a11y, one-handed use | Lines on the page are 5 to 8 CSS px tall at 390 (motto, notice, volume, date, price, kicker, caption, byline). "Tap any text" was hard to hit | Fixed: a tap within 18 px opens the nearest text part; Back and Next in the editor step through every part; UI test taps beside the volume line |
| should | Phone UX (spec 4) | No bottom bar: after changing options under the page, you scroll all the way back to download | Fixed: bar with "See the page" and "Download PNG (size)", shown only while the page is out of view, hidden while typing or editing; tested |
| should | Tablet | iPad portrait: the page filled the screen, the download buttons and every control started below the fold | Fixed: on 600 to 959 px the preview height is capped; Download is on the first screen (checked at 810 x 1080) |
| should | Export (story) | Text under the app bars in 9:16 | Fixed (250 px bands) |
| nice | Keyboard | Focus order goes page lines, download, then the left-hand panel on desktop (visual order is panel first) | Open; acceptable (logical within each region) |
| nice | Desktop 1440 x 900 | Preview is about 400 px wide; small text is hard to read without zoom | Open; download is true size, and the field list covers reading |

No fake affordances: I clicked every control (7 + Wedding chips, name, number, date, Surprise me, 3 layout cards, 3 selects, label checkbox, Add/Change/Remove photo x2, zoom, drag and arrow-key pan, 5 sizes, All text list, Start over, every page line, Download PNG at 5 sizes, PDF Letter and A4, Print, Share on desktop Chrome, Copy link, theme toggle). All work. Layout sketch cards are real radio buttons. The Share button shows only where the browser can share files.

Trademark check (passes): preset paper names are generic and invented (Birthday Bugle, Anniversary Herald, Wedding Day Dispatch, Retirement Review, Graduate Gazette, Cradle Courier, Break Room Bulletin, The Daily Page). No real outlet names or slogans (unit test greps for them, including "fit to print"). Blackletter masthead with ears, and a black band with a round price flash, are common newspaper conventions, not one outlet's look; the tabloid band is black, not a red top. The masthead font is UnifrakturMaguntia (OFL, licence shipped). Logo and OG image are our own.

Photo privacy (passes): File API plus canvas only; network test uploads a JPEG with a byte marker and types a text marker, exports PNG, PDF, print and story, opens a Copy link URL: every request is a plain GET to the same host and none carries either marker. Photos are not in localStorage or in links.

SEO (Bingemind build): title "Newspaper Generator With Photo: Front Page Maker" (48 chars); description 152 chars; one H1; H2 outline for the article; JSON-LD WebApplication, BreadcrumbList, FAQPage (8 Q) all parse, no aggregateRating; canonical and og:image under the tool path; sitemap lists tool, about, privacy only; article now names wedding, cut text and story bands. Internal links: poster tiler, DPI changer, online ruler, /tools/.
