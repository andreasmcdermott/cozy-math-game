# Paws & Potions

## Goal and audience

A cozy, single-player math game for a fifth grader who enjoys potions, collecting, and magical pets. Runs in a browser on an iPad. Math determines useful game actions: combining limited supplies, recovering ingredients, scaling recipes, and earning supply deliveries.

The first version was too easy. Matching a half-cup scoop to a half-cup recipe required recognition rather than arithmetic. The user's November 17 feedback explicitly replaces that mechanic with finite, pre-measured ingredient portions. Preserve the illustrated shop and collectible familiars.

## User decisions

- Single player; multiplayer is deferred.
- Cozy potion shop plus collectible familiars and decorations.
- Original generated artwork. Simple transform animation is sufficient.
- The child is in fifth grade.
- Ingredients exist as specific finite quantities. Using two quarter-cup portions consumes those portions, leaving the other quantities in the pantry.
- Include fraction subtraction. Find useful places for multiplication, other arithmetic, algebra, and geometry.
- Keep this document current so future agents can resume quickly.

## Revised play loop

1. Read a recipe and customer bottle count.
2. Select an ingredient. Inspect its remaining pre-measured portions, such as 1/3, 1/4, 1/5, 1/6, 1/10, and 1/12 cup.
3. Combine whole portions to reach each target. Stock counts decrease immediately and persist across orders and reloads.
4. To remove part of an ingredient, use Recover. Choose an amount to remove and calculate what remains. A correct subtraction returns that amount as a new pantry portion.
5. Brew an exact mixture, earn coins, and adopt pets or decorate.
6. Help with supply errands to earn new finite stock. Arithmetic handles deliveries, algebra restores missing formula values, and geometry plans herb beds and planters.

There are no timers, neglect penalties, ads, or purchases. Mistakes provide explanations. Undo and returning the mixture restore the actual poured portions. Restocking is always reachable without coins, preventing a resource deadlock.

## Learning and resource contracts

- Use exact integers with 60 ticks per cup. This supports thirds, quarters, fifths, sixths, tenths, and twelfths. Never compare floating-point sums.
- Fraction display reduces to lowest terms and supports mixed numbers. Input accepts whole numbers, exactly representable decimals, ordinary fractions, mixed numbers, and common fraction glyphs.
- Starter recipes require combinations; their target quantities are not simply available single portions. Unlike denominators occur in the opening order.
- A pour transfers one portion from finite stock into the cauldron. A successful brew consumes those contents without refilling stock.
- Save stock and in-progress pours together. Reloading must neither duplicate resources nor lose a valid unfinished mixture.
- Undo returns the last eligible poured portion. Returning the full mixture returns individual remaining lots, not a freely synthesized combined portion.
- Recover verifies the player's subtraction before transferring a partial amount. It preserves total ingredient quantity and clears the old undo sequence.
- Every ingredient, including unwanted ingredients, must match before awarding coins. Completed orders and errands earn their rewards once.
- Running totals are optional support, off by default for this fifth-grade game. Hints can reveal a common-denominator strategy or remaining amount.
- The harder recipe setting scales every ingredient for multiple bottles. Difficulty changes return an unfinished mixture to the pantry first.
- Supply errands require typed answers. Wrong answers do not consume resources. Tasks and rewards are deterministic and testable.
- Migrate v1 saves without losing coins, completed orders, adopted pets, or decorations. Give migrated players starter pantry stock and the new defaults.

## Architecture

- src/game.js: recipe and familiar data, integer fraction helpers, stock transfers, subtraction, save migration, purchases, and supply task rules.
- src/main.js: browser-module UI, selected ingredient, dialogs, feedback, optional sound, and persisted gameplay actions.
- src/style.css: responsive layout and animation. public/art retains the original generated graphics; ART.md records their prompts and provenance.
- scripts/serve.mjs: dependency-free local HTTP server.
- scripts/build.mjs and scripts/build-sw.mjs: static build and content-versioned offline cache.
- tests/game.test.js: executable learning and resource contracts.
- .openai/hosting.json: authoritative existing private Site identity. Reuse it when publishing.

Run commands are in README.md. No npm dependencies are required. The save key remains paws-potions-v1 for migration; the stored schema version advances to 2.

## Completion criteria for this revision

- Finite pantry replaces arbitrary cup selection, including unlike-denominator combinations.
- Stock persists across orders, with atomic unfinished-brew saves.
- Subtraction recovery preserves quantities and gives useful feedback for mistakes.
- Supply errands provide arithmetic, algebra, and geometry challenges plus a coin-free route out of depleted stock.
- Batch multiplication, familiars, decorations, hints, accessibility, local art, offline support, and old progress continue working.
- Tests cover exact fractions, all recipes, conservation, failed/repeated actions, restocking, and v1 migration.
- Browser playthrough checks a full new order, persistence, subtraction, errands, and responsive touch layouts.
- Update the existing private preview after verification.

## Handoff status

Revision implemented after recording the new design. The generated artwork and existing Site identity are preserved.

- All 17 rule tests pass, covering exact fraction parsing/display, finite consumption, conservation, undo/refunds, subtraction, every recipe and batch cycle, stale reward rejection, arithmetic/algebra/geometry errands, coin-free restocking, v1 migration, and partial-brew saves.
- Browser playthrough completed the opening unlike-denominator recipe after a reload and subtraction recovery. An incorrect recovery did not change stock; a correct one returned exactly the requested portion.
- Browser playthrough completed a three-bottle order, refunded a partial mixture during a difficulty change, and adopted a familiar without losing pantry progress.
- Arithmetic and algebra errands awarded 48 portions only after correct answers. Geometry area/perimeter/volume answer rules passed tests; the planted-grid interface was inspected.
- Touch viewport checks at 1024×768, 768×1024, 390×844, and 320×740 found no horizontal overflow. Enabled controls met 44-pixel touch targets; reduced-motion mode disabled pet animation. Additional pantry rows can require vertical scrolling.
- Production upgrade was checked against an actual old v1 service-worker cache and v1 save. A single navigation loaded the coherent new module graph, preserving 31 coins, eight completed orders, the adopted frog, and a purchased plant. The next pour persisted the migrated v2 schema.
- Stopped the production HTTP server, reloaded offline, and verified the pantry, unfinished mixture, art, and local fonts. Browser checks had no console warnings/errors and no external runtime requests.

The existing private Site is the publication destination. Consult its native deployment result for current published status. The implementation is ready for the next child playtest; watch the balance between stock planning and restocking frequency before adding more content.

## Deferred and limits

Multiplayer, cloud saves, free-roaming exploration, pet care simulation, advanced animation, and a full school curriculum remain deferred. Saves are local to a browser/device. The hosted Site is owner-private. Actual iPad Safari hardware has not been tested; touch viewport emulation is available.
