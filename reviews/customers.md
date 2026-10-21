# Mock-customer panel (newspaper-front-page-maker)
Reviewer: Lisbeth. Date: 2026-10-21. 8 US personas ran real flows in Chrome via playwright-core (locale en-US; party.jpg as the photo; real downloads read back). Times are for the scripted path; a person reading the page takes 30 to 90 s. All runs used the fixed build. "Asked by" counts mix what personas asked for in their run with problems I found on the base build (marked "reviewer").

**Denise, 41, birthday planner, iPhone.** Typed "Grandpa Joe" and 80. Headline became "Grandpa Joe Turns 80, Town Declares a Holiday". Letter was the default. PDF came out 612 x 792. "Done in a minute. I would click it over the ad-heavy one. I want real news from 1946 too." (non-goal)
**Marcus, 55, retirement party organiser, desktop.** Retirement preset, "Linda", 32 years, pasted a long story, Vintage, PNG 2550 x 3300. "Printing at the office printer will be fine." Reviewer note: on the base build the print PNG had no DPI, so photo apps would print it at about 35 inches or scale it; fixed (pHYs 300 DPI).
**Ms. Okafor, 34, teacher, desktop.** Blank, Vintage, date 1929-10-29 shows "Tuesday, October 29, 1929", white paper, Letter PDF. "Exactly what my history class needs. A blank one to print for kids to fill by hand would be nice."
**Jess, 27, social media manager for a bakery, desktop.** Blank, paper "The Crumb Chronicle", label off, photo, post 1080 x 1350, square 1080 x 1080, story 1080 x 1920. "Sizes are right, and the story keeps clear of the app bars. I would like our logo in place of the name."
**Ruth, 72, grandparent, iPad.** Tapped the headline, typed "Happy 5th Birthday, Mia!", tapped Done; Download is on the first screen. "Big buttons. I did not need help."
**Carla, 38, wedding planner, desktop.** Before the fix there was no Wedding occasion (used Anniversary). Now Wedding: "Priya and Sam Tie the Knot", Surprise me gave "Two Become One: Priya and Sam Make It Official", two photos, Letter PDF. "I would print 80 copies for the tables. A program page on the back would sell me forever."
**Kevin's coworker Dev, 30, office joker, Android.** Office joke, "Kevin", typed a headline on the page, Next went to Subheadline, Tabloid, PNG. "Next is great for getting to the small lines." Reviewer note: on the base build those lines were 5 to 8 px tall at 390.
**Tyler, 17, student, iPhone.** Birthday, friend's name and 17, Story size, photo, Surprise me, PNG 1080 x 1920, no sideways scroll. "Copy link lets my friend add his own photo. Cool."

## Ranked changes
| Rank | Change | Asked by | Status |
|---|---|---|---|
| must | Hit small lines on a phone (nearest tap, Back/Next) | reviewer + 1 (Dev) | Fixed |
| must | Download without scrolling back on phone and iPad | reviewer + 1 (Ruth) | Fixed (bar, tablet cap) |
| should | Wedding occasion | 1 (Carla), big search demand | Fixed |
| should | Story text clear of app bars | reviewer + 1 (Jess) | Fixed |
| should | PNG prints at true size | reviewer | Fixed (pHYs 300 DPI) |
| should | Share the words with someone | 1 (Tyler) + rival has it | Fixed (Copy link) |
| nice | Print a blank page to fill by hand | 1 (Okafor) | Open |
| nice | Own logo or image as the newspaper name | 1 (Jess) | Open (P1) |
| nice | Back page (wedding program) | 1 (Carla) | Open (P1) |
| nice | Real news from a birth year | 1 (Denise) | Won't do (spec non-goal) |
