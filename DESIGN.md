# Paws & Potions

## Goal and audience

A cozy single-player math puzzle game for a fifth grader who likes potions, collecting, and magical pets. Runs in a browser on an iPad. Keep the existing illustrated shop and simple transform animations.

## Current user direction

Each potion is a self-contained fraction puzzle. It comes with a fresh selection of pre-measured ingredient portions containing at least one exact solution and some decoys. The player chooses which portions to combine and can ignore the rest. Stock does not run out across orders, and restocking is never required.

This supersedes the previous persistent-pantry design. Its finite portions made an interesting subset-sum puzzle, but resource management distracted from that puzzle. The earliest version's freely selectable measuring cups also remains superseded because matching a measure to a recipe required too little arithmetic.

## Play loop

1. A customer requests a potion. The recipe gives quantities for one bottle; batch mode asks for multiple bottles.
2. A fresh puzzle tray supplies the required ingredient kinds and distractor ingredients. Each required ingredient has portions that can combine to exactly its target, plus extra portions that may be ignored.
3. Select an ingredient and tap whole portions to add them. The blend shows the operands without automatically calculating the sum unless support is enabled.
4. Undo a choice, return the mixture, or reset the puzzle freely. Reset restores this same puzzle rather than rerolling an easier one. Subtraction recovery remains an optional way to remove part of an ingredient after calculating the remainder.
5. Brew an exact solution, earn coins, and advance to a different tray. Leftover portions do not carry over and do not reduce rewards.
6. Spend coins on familiars/decorations. Village errands offer optional arithmetic, algebra, and geometry challenges for difficulty-scaled bonus coins. They never gate brewing or alter a puzzle tray.

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

## Coin economy and the cozy corner

The user asked for difficulty-scaled errand rewards and more substantial familiar goals. Errands scale their questions as well as payouts: Easy pays 4 coins, Standard 8, and Challenge 14. Potion rewards scale with level, ingredient count, and batch size. Standard potions still pay 16–18 coins. Fern costs 180 and Pip 450; already adopted familiars remain owned. Existing coin balances are preserved.

The cozy corner is now a separate, mostly bare room with only the selected familiar to start. It has ten collectable furnishings: herbs, fern, lantern, garland, rug, painting, pet bed, potion shelf, tea table, and bookcase. Prices range from 16 to 120 coins. The child can choose quicker decorating goals or save for a familiar. Owned items can be placed or put away without buying them again. Store hidden items in hiddenDecorations while retaining ownership in decorations. Preserve the old plants and garland IDs when migrating.

The main brewing shop keeps its existing full illustration. The new corner background is intentionally bare, with separate transparent furniture layers. Furniture has fixed positions in this version. Do not add permanent room decorations to the background that would take away the child's opportunity to furnish it.

## Architecture and commands

- src/game.js owns recipes, deterministic puzzle generation, saved attempts, subset solving, subtraction, rewards, purchases, and village errands.
- src/fractions.js owns exact fraction parsing/display and cup constants.
- src/main.js owns rendering, selection, dialogs, hints, and interactions.
- src/style.css owns responsive layout and animation. public/art and ART.md retain the existing generated art and provenance.
- tests/game.test.js verifies generation, fraction rules, resource transfers, progression, and migration.
- scripts/build.mjs, scripts/build-sw.mjs, and scripts/serve.mjs build/cache/serve the dependency-free static app. README.md contains commands.
- .openai/hosting.json is the authoritative identity of the existing owner-private Site. Reuse it when publishing.

The browser save key stays paws-potions-v1 for migration; the stored schema is version 4. Internal stock maps now describe only the current puzzle, not persistent inventory.

## Completion criteria

- Every potion arrives with a solvable fresh tray and decoys. Finishing a long sequence never requires restocking.
- Correct answers can leave unused portions; multiple valid combinations are accepted.
- Reset, undo, recovery, saved partial attempts, batch mode, pets, and decorations continue working.
- Village errands remain available as optional coin challenges with no stock reward.
- Existing progress migrates, and invalid attempts recover without deleting achievements.
- Exercise many generated orders in both modes with an independent subset solver, then verify complete playthroughs and touch layouts in a browser.
- Build and update the existing private preview after verification.

## Handoff status

The combined puzzle, difficulty, economy, and room update is implemented. The original brewing art remains intact; the corner has a new bare background and nine generated furnishing sprites, recorded in ART.md.

- All 23 rule tests pass. An independent bounded-subset check verifies 4,000 generated puzzles across Auto, Easy, Standard, and Challenge. It checks exact solutions, decoys, no full-target vials, and the minimum required steps. A further 200-potion simulation finishes without errands or restocking.
- Tests cover Auto thresholds at 3 and 8 completed potions, fixed manual levels, exact fractions, reset/undo/recovery, varied/reproducible trays, alternate solutions, stale reward rejection, difficulty-scaled questions/rewards, new familiar prices, ten furnishings, placement persistence, migration, and damaged/blocked saves.
- Browser playthrough verified free reset, saved partial attempts, unused decoys receiving full rewards, a fresh solvable next tray, and optional errands leaving the puzzle unchanged.
- Browser playthrough completed the first three Auto potions, showed the move to Standard, selected Challenge, answered a harder errand, and received exactly 14 coins.
- Empty and fully furnished room composites were inspected. All ten purchases appeared, deducted exactly 600 coins in total, and could be put away/replaced without repurchase. Hiding the rug survived reload. Existing owned items and familiars are preserved.
- Touch layouts were checked at 1024×768, 768×1024, 390×844, and 320×740. No horizontal overflow or short enabled touch buttons were found in the checked views. Reduced-motion mode stops familiar animation. Settings fit the narrow viewport.
- Production upgrade preserved an existing 31-coin balance, eight completed potions, adopted Fern, and a bought plant while migrating to schema 4 and Standard. Stopping the production server and reloading retained the partial puzzle; the new cozy room, all ten catalog items, images, and local fonts loaded offline.
- Production code now uses a content-versioned directory, rather than query-only module URLs. This avoids old service workers that ignored query strings and otherwise kept serving the old pantry interface after a refresh.

Current publication status comes from the native Sites deployment result. Next useful work is a child playtest of the difficulty ramps, coin pacing, and room goals, followed by actual iPad Safari hardware checks.

## Limits and deferred work

Actual iPad Safari hardware testing remains outstanding; use touch viewport emulation for local checks. Saves are per browser/device. Multiplayer, cloud saves, free-roaming exploration, complex sprite animation, and a full curriculum remain deferred.
