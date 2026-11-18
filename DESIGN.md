# Paws & Potions

## Goal and audience

A cozy single-player math puzzle game for a fifth grader who likes potions, collecting, and magical pets. Runs in a browser on an iPad. Keep the existing illustrated shop and simple transform animations.

## Current user direction

Each potion is a self-contained fraction puzzle. It comes with a fresh selection of pre-measured ingredient portions containing at least one exact solution and some decoys. The player chooses which portions to combine and can ignore the rest. Stock does not run out across orders, and restocking is never required.

This supersedes the previous persistent-pantry design. Its finite portions made an interesting subset-sum puzzle, but resource management distracted from that puzzle. The earliest version's freely selectable measuring cups also remains superseded because matching a measure to a recipe required too little arithmetic.

## Game presentation

The user requested a game screen in place of the website layout, while keeping the illustrated art style and customer requests. Render the playable screens and their UI in canvas. Keep the shop and errand paintings at their full 3:2 aspect ratio inside a cottage cutaway with roof, chimney, window, and timber border. Crop only the surrounding sunset landscape, matching the world outside the shop windows. The painting and everything inside it, including the familiar, props, and cauldron, share one uniformly scaled scene coordinate system. Place recipe and ingredient panels outside the scene. Make the house the main visual focus. The customer stands outside with a speech-bubble tail connected to their portrait; the selected familiar stays inside beside the cauldron. Label these roles briefly. Move the ingredient tray below the house in portrait/tablet layouts, keeping sidebars only for wide landscape screens. Keep compact recipe parchment and symbols for correction tools. Keep names and math labels where they help understanding. Remove the website header, introductory banner, repeated ingredient instructions, and footer. Optional errands have themed settings. Preserve keyboard play, readable fractions, large touch targets, and reduced motion.

Native transparent buttons align with painted controls for keyboard and screen-reader support. Text entry, settings, recovery, and backup dialogs stay native. The familiar and furnishing collections use pages, keeping the room beside its catalog on larger screens. The phone shop can scroll vertically.

## Familiar identities and personal rooms

Equipped familiars determine the brewing catalog. Each has four exclusive ingredient types and six recipes. Clover uses moonwater, lavender, chamomile, and mint. Fern uses forest dew, ruby-cap mushrooms, moon truffles, and golden spores. Pip uses ember tea, dragon chili, ginger, and cinnamon. The main shop painting stays unchanged. All ingredient labels, portions, recipes, and optional recovery choices follow the equipped familiar.

Coins, completed-potion totals, errands, and difficulty settings are shared. Recipe counts are per familiar, so alternating buddies still cycles through every recipe in each catalog. Equipping another buddy parks the exact current attempt and restores that buddy's saved attempt, or creates their first tray. Each attempt records the global order number and difficulty mode at creation. An unfinished Auto puzzle retains its original level if another buddy advances the global difficulty; its next puzzle uses the new global level. Changing difficulty explicitly refreshes every familiar's tray, preserving their recipe counts and all achievements.

The Room screen selects an unlocked familiar's room independently of the equipped brewing buddy. Clover keeps the original herbal cottage, Fern has a sage mushroom cottage, and Pip has a lavender-stone ember tower. Each starts bare and has ten distinct themed furnishing choices. Coins are shared, but furniture ownership and placed/hidden flags belong to that room. Buying the same slot in another room is a separate purchase. Locked rooms cannot be decorated. Viewing a room does not equip its familiar.

## Play loop

1. A customer requests a potion. The recipe gives quantities for one bottle; batch mode asks for multiple bottles.
2. A fresh puzzle tray supplies the equipped familiar’s required ingredient kinds and thematic distractor ingredients. Each required ingredient has portions that can combine to exactly its target, plus extra portions that may be ignored.
3. Select an ingredient and tap whole portions to add them. The blend shows only the added operands, such as ¼ + ¼, with no = ? suffix. It does not automatically calculate the sum unless support is enabled.
4. Undo a choice, return the mixture, or reset the puzzle freely. Reset restores this same puzzle rather than rerolling an easier one. Subtraction recovery remains an optional way to remove part of an ingredient after calculating the remainder.
5. Brew an exact solution, earn coins, and advance to a different tray. Leftover portions do not carry over and do not reduce rewards.
6. Spend coins on familiars/decorations. Village offers three optional arithmetic, algebra, or geometry notices. Completing one replaces only that notice with a random different kind, excluding the other visible kinds. Unfinished notices retain their questions and difficulty-scaled coin rewards across reloads and Auto progression. Explicit difficulty changes refresh the board. Errands never gate brewing or alter a puzzle tray.

## Learning and generation contracts

- Quantities are exact integers, 60 ticks per cup. Supported fractions include thirds, quarters, fifths, sixths, tenths, and twelfths. Fraction labels and input are rendered in code.
- Build each required ingredient's tray by first choosing a valid multi-portion decomposition of its target, then adding decoys. Do not rely on random sampling eventually finding a solution.
- Prefer unlike-denominator combinations. Do not include a single portion equal to a required ingredient's full target. Multiple correct solutions are welcome.
- A required ingredient's full tray must contain more than its target, so using everything cannot solve the puzzle. Include distractor ingredients where the recipe allows them.
- Generation is deterministic for the order number and difficulty. Reloading or resetting keeps the same puzzle. New orders and difficulty settings produce their own trays.
- Every generated recipe/batch must be independently solvable by whole-portion addition without errands or subtraction recovery.
- Using and returning portions conserves quantities within an attempt. Reset restores the original generated tray. A successful brew consumes the attempt and creates the next complete puzzle.
- Save the puzzle identity, remaining portions, and unfinished mixture together. Reloading must not regenerate a partially played tray or duplicate rewards.
- Validate restored puzzle state against generated ingredient totals; reset damaged attempts while preserving coins and pets.
- Keep hints optional and running totals off by default. Allow correction without a timer, penalties, or loss of progress.
- Brew and optional errand rewards are awarded once. Existing coins, pets, decorations, completed orders, and errand progress migrate from older saves. Old pantry attempts are replaced by fresh puzzle trays during migration.

## Difficulty levels

The user requested both selectable difficulty and gradual progression during this revision. New games default to Auto. Existing users keep a comparable manually selected level when migrating.

- Easy uses halves, quarters, and whole cups. Each required ingredient has a solution using 2–3 portions and one decoy portion. No portion equals its full target.
- Standard uses unlike denominators and 2–5 portions per ingredient, with two added decoys.
- Challenge addition solutions require at least four portions per ingredient, have three added decoys, and ask for two or three bottles. Optional subtraction recovery remains a valid alternative. Decoys are checked so they cannot introduce a shorter two-portion shortcut.
- Auto starts Easy for the first three completed potions, uses Standard for potions four through eight, then moves to Challenge. Advancement depends on completed potions, not guesses or time. Errands do not advance difficulty. Manual levels stay fixed.

Every level remains guaranteed-solvable by addition. A visible level control opens settings. Changing level resets the current attempt to that mode's deterministic tray, preserving achievements. Resetting or reloading never changes level or rerolls the tray.

## Village errand variety

The noticeboard draws from 16 kinds: shipment multiplication, packing crates, market change, elapsed trip time, fractions of seed packets, missing addends, missing group sizes, multistep formulas, number patterns, missing garden dimensions, rectangle area, perimeter, triangle area, fractional planting, unplanted area, and planter volume. Parameters and complexity follow the selected level. Triangle diagrams mark the base and perpendicular height. Partial gardens shade the planted fraction and label each square meter, including 2×3 m beds with one third planted. Missing-side diagrams hide the unknown length and use an ungridded sketch so counting does not reveal it. All math labels are drawn in code.

Three compact notices select the available tasks. Saves and portable backups retain three generation descriptors with unique serials, seeds, kinds, and stamped levels. Generated questions and rewards come from code, never imported answer fields. Completion validates the exact notice ID, awards once, and immediately saves a random replacement in that slot. Existing saves without a board gain three notices without changing achievements or unfinished potions. The save schema remains 5 with this additive field.

## Coin economy and the cozy corner

The user asked for difficulty-scaled errand rewards and more substantial familiar goals. Errands scale their questions as well as payouts: Easy pays 4 coins, Standard 8, and Challenge 14. Potion rewards scale with level, ingredient count, and batch size. Standard potions still pay 16–18 coins. Fern costs 180 and Pip 450; already adopted familiars remain owned. Existing coin balances are preserved.

Each familiar now has a separate, mostly bare personal room with only that room’s familiar to start. Each has ten collectible furnishings priced at 16–120 coins, totaling 600 coins per room. Clover keeps the herbal decorations; Fern gets mushroom, moss, and pond furnishings; Pip gets copper, spice, crystal, and flame furnishings. The child can choose quicker decorating goals or save for a familiar. Owned items can be placed or put away without buying them again. Store hidden items in rooms[familiar].hiddenDecorations while retaining ownership in rooms[familiar].decorations. Preserve the old plants and garland IDs when migrating.

The main brewing shop keeps its existing full illustration. The new corner background is intentionally bare, with separate transparent furniture layers. Furniture has fixed positions in this version. Do not add permanent room decorations to the background that would take away the child's opportunity to furnish it.

## Architecture and commands

- src/catalog.js owns familiar identities, themed ingredient/recipe catalogs, room backgrounds, and per-room furnishing catalogs.
- src/game.js owns equipped/parked attempts, per-familiar recipe counts, rooms, save migration, subset solving, subtraction, rewards, purchases, and errand board completion.
- src/errands.js owns pure seeded errand content, board validation, and random replacement selection.
- src/fractions.js owns exact fraction parsing/display and cup constants.
- src/main.js owns selection, dialogs, hints, focus, and interactions.
- src/canvas-ui.js owns canvas painting, cottage frames, responsive scene layout, and aligned native controls.
- src/stage.js owns the 1536×1024 scene geometry, uniform transforms, height fitting, and visible-foot anchoring.
- src/style.css styles aligned native controls, focus, dialogs, and reduced motion. public/art and ART.md retain the existing generated art and provenance.
- tests/game.test.js verifies generation, fraction rules, resource transfers, progression, and migration.
- scripts/build.mjs, scripts/build-sw.mjs, and scripts/serve.mjs build/cache/serve the dependency-free static app. README.md contains commands.
- wrangler.jsonc and CLOUDFLARE.md define the new Cloudflare Pages deployment. The old .openai/hosting.json is historical context only; do not republish there as part of this move.

The browser save key stays paws-potions-v1 for migration; the stored schema is version 5. Active attempt fields remain at the root; paused holds the other buddies’ unfinished attempts, brewCounts tracks their recipe rotations, and rooms holds independent furnishings. Version 4 attempts retain exact trays and quantities through legacy seed IDs and ingredient-slot mapping. The old shared decorations move into the previously equipped familiar’s room. Versions 1–3 retain achievements and receive fresh trays. Internal stock maps now describe only the current puzzle, not persistent inventory.

## Completion criteria

- Every potion arrives with a solvable fresh tray and decoys. Finishing a long sequence never requires restocking.
- Correct answers can leave unused portions; multiple valid combinations are accepted.
- Reset, undo, recovery, saved partial attempts, batch mode, pets, and decorations continue working.
- Village errands remain available as optional coin challenges with no stock reward.
- Existing progress migrates, and invalid attempts recover without deleting achievements.
- Exercise many generated orders in both modes with an independent subset solver, then verify complete playthroughs and touch layouts in a browser.
- Build and verify the portable Cloudflare Pages release. Publishing to Cloudflare is a separate step after the parent chooses the account/project.

## Handoff status

The rotating errand board and question expansion are complete. See the latest handoff section below for current checks; earlier entries record previous versions.

The combined puzzle, difficulty, economy, and room update is implemented. The original brewing art remains intact; the corner has a new bare background and nine generated furnishing sprites, recorded in ART.md.

- All 23 rule tests pass. An independent bounded-subset check verifies 4,000 generated puzzles across Auto, Easy, Standard, and Challenge. It checks exact solutions, decoys, no full-target vials, and the minimum required steps. A further 200-potion simulation finishes without errands or restocking.
- Tests cover Auto thresholds at 3 and 8 completed potions, fixed manual levels, exact fractions, reset/undo/recovery, varied/reproducible trays, alternate solutions, stale reward rejection, difficulty-scaled questions/rewards, new familiar prices, ten furnishings, placement persistence, migration, and damaged/blocked saves.
- Browser playthrough verified free reset, saved partial attempts, unused decoys receiving full rewards, a fresh solvable next tray, and optional errands leaving the puzzle unchanged.
- Browser playthrough completed the first three Auto potions, showed the move to Standard, selected Challenge, answered a harder errand, and received exactly 14 coins.
- Empty and fully furnished room composites were inspected. All ten purchases appeared, deducted exactly 600 coins in total, and could be put away/replaced without repurchase. Hiding the rug survived reload. Existing owned items and familiars are preserved.
- Touch layouts were checked at 1024×768, 768×1024, 390×844, and 320×740. No horizontal overflow or short enabled touch buttons were found in the checked views. Reduced-motion mode stops familiar animation. Settings fit the narrow viewport.
- Production upgrade preserved an existing 31-coin balance, eight completed potions, adopted Fern, and a bought plant while migrating to schema 4 and Standard. Stopping the production server and reloading retained the partial puzzle; the new cozy room, all ten catalog items, images, and local fonts loaded offline.
- Production code now uses a content-versioned directory, rather than query-only module URLs. This avoids old service workers that ignored query strings and otherwise kept serving the old pantry interface after a refresh.

The older Sites deployment remains unchanged during the Cloudflare move. Next useful work after Cloudflare publication is a child playtest of the difficulty ramps, coin pacing, and room goals, followed by actual iPad Safari hardware checks.

## Hosting migration

The user requested preparing a move to Cloudflare Pages, correcting an initial mention of CloudFront. Prepare a static release, pinned Wrangler deployment commands, cache/security headers, and a progress backup/import path. Do not create AWS resources or republish to ChatGPT Sites. The game must work anonymously on the new Pages URL.

Browser storage is tied to the exact origin. Moving from chatgpt.site to pages.dev, or later to a custom domain, does not move saves automatically. Export a game file on the old origin and explicitly restore it on the new origin. The old published version needs the manual export snippet in CLOUDFLARE.md because it predates the new backup controls. Keep the old site/access intact during preparation.

Cloudflare treats _headers as deployment configuration, not a public asset, and redirects /index.html to /. The offline worker must precache the canonical root URL, exclude control files, and use the cached root as its navigation fallback. Hashed module paths remain immutable; HTML, worker, and mutable art/font URLs revalidate.

Migration preparation is complete. wrangler.jsonc, pinned deployment helpers, Pages headers, CLOUDFLARE.md, and an upload-ready release/paws-potions-cloudflare.zip are ready. Actual Cloudflare project creation/deployment remains outside this preparation step.

- npm run cloudflare:prepare passes 27 game/save tests and 3 deployment checks. Backup tests cover full state, legacy raw saves, unknown/corrupt files, and size limits.
- The pinned Wrangler local Pages emulator parsed all 12 header rules. Root HTML had the configured security/cache headers; /index.html redirected to /; the service worker installed without requesting _headers.
- Browser transfer checks rejected an invalid file without changing storage, previewed an imported 77-coin/two-familiar save, waited for explicit replacement, and retained the selected familiar, hidden furniture, and partial potion after reload.
- Browser export produced a portable game-only file with the local calendar date in its filename. The narrow transfer dialog fit a 390-pixel touch viewport.
- After stopping Wrangler, the actual Pages-emulated app reopened offline with the restored save, furnished room, all images, and local fonts. No external runtime requests or browser console errors occurred.
- The ZIP contains 45 files with index.html and _headers at its root; integrity was checked. No login, cloud project creation, production deployment, DNS change, or old-site access change was performed.

## Recovery interface

Recovery now uses the shop's illustrated ingredient cards and fraction portion buttons instead of a dropdown and two plain text fields. Only ingredients in the cauldron are selectable. Common return amounts are limited to the selected ingredient's current quantity; Other accepts any supported exact fraction, mixed number, or decimal. Switching ingredients clears the previous selection and answer.

The equation displays the starting quantity and selected return amount, leaving the remainder for the child to calculate. It never supplies the answer. Incorrect answers and excessive custom return amounts leave the save untouched. A correct subtraction returns exactly that portion to the tray, including when the remainder is zero. Game rules and save format are unchanged.

- All 27 game/save tests and 3 Cloudflare deployment checks passed after the interface update.
- Browser checks verified preset and custom fractions, mixed-number display, decimal entry, ingredient switching, incorrect subtraction, excessive returns, zero remainders, and exact transfers.
- Keyboard Enter opens/submits recovery; Escape closes it. Focus returns to the recovery button. The final browser check reported no console errors or accessibility issues.
- Checked 320×740, 390×844, 768×1024, and 1024×768 touch viewports. The dialog scrolls within the screen, has no horizontal overflow, and keeps enabled buttons at least 44 pixels tall. Inspected phone and tablet screenshots.
- Rebuilt the Cloudflare upload archive with the new recovery interface. No deployment was performed.

## Canvas presentation handoff

The canvas redesign is implemented. Shop, recipe, portion tray, coin HUD, navigation, errands, familiars, and room catalog are painted in canvas. Native controls share the painted hit areas and retain accessible names, keyboard activation, focus rings, and form behavior. Dialogs retain native focus trapping and Escape. Pour sparkles run briefly after a transfer and respect reduced motion. There is no idle animation loop.

- Existing paintings and sprites are preserved. The new local `village-garden.webp` matches the gouache shop reference. ART.md records its exact built-in image-generation prompt and preparation command. Delivery uses an ingredient cart, and formulas use the cottage room, bookshelves, lantern, and sparkles. Mathematical labels and garden cells remain code-rendered.
- All 27 game/save tests and 3 Cloudflare deployment checks pass. Existing tests independently verify 4,000 generated puzzles and a 200-potion run. Recipe data, deterministic generation, tick arithmetic, rewards, and save schema are unchanged.
- Browser checks passed pouring, partial-attempt reload, undo, free reset, incorrect and correct subtraction, Enter submission, Escape/focus behavior, exact brewing and rewards, next tray, optional errand rewards without puzzle changes, error correction, hints, difficulty changes, all ten purchases, furniture placement persistence, and familiar adoption. Two Challenge batches completed on a 320-pixel screen. Touch tap/undo/navigation, backup download, and blocked-storage play also passed.
- Checked 35 combinations of screen/ingredient layout at 1280×800, 1024×768, 768×1024, 390×844, and 320×740. No horizontal overflow, overlapping interactive targets, or enabled targets below 44 pixels were found. Long mixed fractions fit their tiles. Desktop, phone, success, empty/furnished room, delivery, formula, and garden screenshots were inspected. No browser JavaScript errors occurred.
- Production offline checks verified canvas modules, local fonts, original sprites, and the new garden painting load from the service-worker cache, retaining the partial puzzle. Rebuilt the 47-file Cloudflare upload ZIP. No deployment was performed.

Remaining limits: phones scroll through the taller brewing screen. Native forms/dialogs remain DOM-based. Actual iPad Safari hardware and VoiceOver testing remain outstanding; browser verification used Chromium and emulated touch layouts.

## Cottage stage handoff

The user reported distorted framing and floating characters when the viewport aspect ratio changed. The previous renderer cropped a page-sized background independently of fixed-pixel actors. Shop and all three errands now use the complete 1536×1024 painting with a single uniform transform shared by their actors and props. The cauldron also keeps its own drawing aspect ratio. Sprite alpha gutters are excluded at draw time so visible feet meet the scene's floor.

A canvas-drawn cottage outline adds a shingled gable, chimney, round attic window, and timber beams. The new local sunset landscape matches the view through the shop windows. Only that decorative surround may crop. The cottage fits both width and available viewport height; external panels can extend the page without changing the stage. Wide shop layouts place ingredients and recipe on opposite sides. Narrow layouts stack these panels below the house. Sidebar fraction tiles use two columns to retain readable mixed fractions.

- All 29 tests pass, including two new geometry regressions covering complete-painting fit, aspect ratio, height bounds, and fixed floor coordinates. Existing rule/save tests still cover 4,000 puzzles, long playthroughs, exact transfers, rewards, and migration.
- Browser instrumentation checked the actual canvas draw calls for 52 shop/errand scenes at 13 viewports from 320×740 through 2560×1080, including 844×390 and 1920×720. Every stage drew its entire painting with equal x/y scale; actors shared that transform, visible feet stayed at their intended floor coordinates, and the cauldron stayed registered to the painting. Changing ingredients and opening hints left the stage unchanged.
- Those scene checks found no horizontal overflow, overlapping controls, or touch targets below 44 pixels. Inspected phone, iPad portrait, small landscape, desktop, and ultrawide screenshots of the shop, delivery, formula room, and garden. Browser playthrough checks passed pouring, correction, recovery, brewing/rewards, errands, save reload, purchases, placement persistence, and adoption without JavaScript errors.
- All 3 Cloudflare deployment checks pass. The production build reopened offline with the stage module, new landscape, original art, and fonts cached, preserving the partial potion. Rebuilt the 49-file upload ZIP. No deployment was performed.
- ART.md records the built-in landscape-generation prompt and deterministic preparation command. Existing paintings and sprites remain unchanged. Mathematical labels remain in code. Pure gameplay and save format are unchanged.

Native dialogs and vertically scrolling small-window layouts remain. Actual iPad Safari/VoiceOver hardware checks remain outstanding.

## Larger house and customer handoff

The user asked for a larger house and a clear distinction between the customer and familiar. The shop now uses the upper space previously reserved for a disconnected speech bubble. In portrait and tablet layouts, the ingredient tray moves below the house; ingredient sidebars remain only in wide landscape layouts. The shop can use a wider opening while retaining the 3:2 painting and uniform actor/cauldron scale. The 1018×1310 layout's opening is 644 pixels wide, up from 376 pixels.

The requesting customer is rendered outside the cottage beside their request, with a speech-bubble tail ending at their head. The customer and selected familiar have explicit, brief role labels. Only the familiar remains inside. All customer types and successful-order replies use the same layout. Smaller screens place the customer and bubble side by side below the house. The customer clears the navigation dock. Original art is reused unchanged.

The recipe and blend show added fractions as operands only, such as ¼ + ¼. Removed the = ? suffix in both places. Optional running totals and hints retain their existing behavior; mathematical rules and saves are unchanged.

- All 29 rule/save/geometry tests pass. Geometry checks cover the expanded shop width as well as complete-painting fit, uniform scale, height bounds, and fixed floor coordinates.
- Browser instrumentation checked 14 viewports, including the supplied 1018×1310 shape, phone, tablet, small landscape, and ultrawide sizes. The customer stays outside the opening; the familiar stays inside; the bubble tail reaches the customer's head. All scenes retain 3:2 proportions. Inspected the corresponding portrait, desktop, phone, and tablet screenshots.
- No horizontal overflow, interactive-target overlaps, or enabled targets below 44 pixels were found. The customer also clears the navigation dock.
- Confirmed two ¼-cup pours render ¼ + ¼ in the recipe and tray with no = ? suffix. Enabling running totals still shows the computed sum. Browser playthrough checks passed pouring, reload, undo, recovery, reset, brewing/rewards, errands, settings, purchases, furniture persistence, adoption, and 35 screen/ingredient layout checks without JavaScript errors.
- The production build passed all 3 Cloudflare checks and reopened offline with the partial potion intact. Rebuilt the 49-file upload archive. No deployment was performed.

Actual iPad Safari/VoiceOver hardware testing remains outstanding. Small screens can scroll vertically.

## Familiar specialties handoff

The requested shadow, recipe, ingredient, and room expansion is implemented. Clover's contact shadow moves upward and right beneath the paws; Hazel's moves upward, and her separate platform is removed. The same contact-shadow logic is used in brewing, collections, and personal rooms. Existing character bitmaps are unchanged.

- Every familiar has four exclusive ingredient types and six themed recipes. Clover uses herbs and blossoms, Fern fungi and spores, and Pip peppers and warming spices. The brewing tray, recipe rows, recovery UI, and selected ingredient follow the equipped familiar. Separate recipe counts guarantee all six recipes rotate even when buddies are alternated.
- Equipping or adopting a new buddy parks the exact current attempt. Returning restores that familiar's portions, mixture, order identity, and original difficulty. Global coins and Auto progression remain shared; old unfinished Auto attempts keep their stamped level. Changing difficulty refreshes all trays while retaining recipe counts and room ownership.
- The Room screen can decorate any unlocked familiar's room without equipping them. Each has its own bare background and ten themed furnishing options. Ownership and hidden/placed flags save per room; prices remain 16–120 coins and total 600 per room. The new rugs are foreshortened into the floor plane. Room selection is UI state; reload initially shows the equipped buddy's room, with every room's contents preserved.
- Save schema is now 5. Version 4 trays and poured amounts migrate exactly using their old seed and canonical ingredient-slot mapping. Existing shared-room purchases and hidden flags move into the previously equipped buddy's room. Older pantry saves retain achievements and start fresh trays. Backup/import supports versions 1–5, including parked attempts and all rooms.
- All 38 tests pass. Independent bounded-subset checks cover 12,000 generated puzzles across three themes and every difficulty, plus 600 completed potions. Other tests cover parked progress through reload/backup, Auto advancement while another attempt waits, alternating buddies through all six recipes, independent room purchases, locked-room guards, stale rewards, difficulty changes, corrupted attempts, and 36 pre-expansion version-4 migration fixtures.
- Browser playthroughs checked three themed trays, exact partial-puzzle restoration, all 30 room purchases while Clover stayed equipped, hiding/replacing furnishings, reload, and completing each restored potion for one reward. Checked 40 screen/ingredient/room layouts at 1280×800, 1024×1366, 768×1024, 390×844, and 320×740. No horizontal overflow, overlapping controls, targets below 44 pixels, or JavaScript errors were found. Inspected themed brews and furnished/phone room screenshots.
- Art preparation verified all 28 new transparent sprites have a transparent 12-pixel border, intact visible bodies, and a maximum dimension of 480 pixels. Two new bare room paintings complete the 30 added assets. ART.md records every built-in generation prompt, source/reference, preparation command, and runtime filename.
- All 3 Cloudflare deployment checks pass. Production reopened offline with all 51 local art assets and the new catalog cached. Touch navigation, room selection, purchases, recovery, portable backups, parked puzzles, and a version-4 upgrade through the actual backup interface passed without JavaScript errors. Rebuilt the 80-file upload archive. No deployment was performed.

Actual iPad Safari/VoiceOver hardware testing remains outstanding. Furniture placement uses fixed slots; free dragging is still deferred.

## Rotating errands handoff

The errand expansion is complete. The three notices now select saved individual tasks rather than fixed subject tabs. Completing one pays its stamped reward once and replaces that slot with a random new kind, excluding all three previously visible kinds. The other two questions stay unchanged. A success screen leads to the new notice with keyboard focus on its answer field.

- Added 16 kinds spanning deliveries, coin change, elapsed time, seed fractions, missing numbers, multistep formulas, patterns, garden dimensions, area, perimeter, and volume. Gardens now include right triangles, fractional planting, and remaining unplanted area. Diagrams are drawn in code with square-meter grids, green planted sections, base/height labels, and a right-angle marker. Missing-side sketches hide their unknown dimension and grid.
- Unanswered cards keep their questions and rewards through reload, backups, familiar changes, and Auto advancement. Newly posted cards use the current level. Explicit difficulty changes refresh all three. Schema 5 gains an additive supplyBoard field; missing or damaged boards recover without changing coins, pets, rooms, parked attempts, or the active potion.
- All 42 rule/save/layout tests pass. Independent checks cover 12,000 generated errands across all 16 kinds and three levels, plus 900 consecutive completions with stable untouched notices, exact rewards, stale-answer rejection, and backup round trips. Existing 12,000-potion generation checks, 600-potion playthroughs, and migration fixtures also pass.
- Browser checks exercised every kind at 1280×800, 1024×1366, 768×1024, 390×844, and 320×740, totaling 80 layouts. No horizontal overflow, overlapping controls, targets smaller than 44 pixels, or JavaScript errors were found. Inspected triangle, partial-planting, and missing-side screenshots. Wrong answers, hints, Enter submission, success focus, replacement focus, untouched notices, saved replacements, and unchanged potion contents passed.
- The production build and all 3 Cloudflare checks pass. The new errands module and all 51 existing art assets loaded offline. A touch playthrough of a 2×3 m garden with one third planted accepted 2 m², replaced only that notice, preserved the partial potion, survived offline reload, and exported the exact board in a downloaded backup. Rebuilt the upload archive without deploying.

Actual iPad Safari/VoiceOver hardware testing remains outstanding. All triangles currently use a right-angle layout; more triangle orientations can be added later. The illustrated village backgrounds are reused, with all new mathematical diagrams drawn locally in canvas.

## Limits and deferred work

Actual iPad Safari hardware testing remains outstanding; use touch viewport emulation for local checks. Saves are per browser/device. Multiplayer, cloud saves, free-roaming exploration, complex sprite animation, and a full curriculum remain deferred.
