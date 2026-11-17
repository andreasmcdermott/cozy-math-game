# Paws & Potions

A cozy fifth-grade math game about brewing potions and collecting magical familiars. Built for touch, including iPad Safari. Combine finite pre-measured fractions, subtract to recover ingredients, and solve arithmetic, algebra, and geometry supply errands.

Read [DESIGN.md](DESIGN.md) for the goal, scope, learning rules, and handoff status. [ART.md](ART.md) records the generated artwork and exact prompts.

## Run locally

Use Node.js 22 or newer. There are no npm dependencies to install.

```sh
npm run dev
```

Open http://localhost:4179. The command also prints a same-network address for an iPad on the same Wi-Fi. Keep the Mac awake and the server running while playing that way. This development server serves only application files.

## Build and verify

```sh
npm test
npm run build
npm run preview
```

Production preview runs at http://localhost:4180. Deploy the contents of dist/ to a static HTTPS host. The checked-in .openai/hosting.json identifies this project's private Sites deployment. The build generates a content-versioned service worker that precaches all local art, fonts, code, and application metadata. Production module URLs share a source version so an older offline cache cannot mix incompatible rule and UI modules during an upgrade.

## Play

1. Read the customer's order and the recipe for one bottle.
2. Select an ingredient, then combine its finite pre-measured portions. Stock includes thirds, quarters, fifths, sixths, tenths, and twelfths. The opening recipe needs 7/12 cup of moonwater, such as 1/3 + 1/4.
3. Recover lets you remove part of an ingredient after calculating the remaining amount. Undo returns the last eligible portion. The return button refunds the remaining individual portions.
4. Brew an exact recipe to earn coins for familiars and decorations. Used stock stays depleted.
5. Supply errands award crates of 48 portions. Choose delivery arithmetic, missing-number algebra, or garden area, perimeter, and volume. Restocking never costs coins.

Learning settings are under the gear button. Fraction alchemist makes one bottle from unlike-denominator portions. Master of batches requires two or three bottles; multiply every ingredient by the bottle count. Running totals are off by default and can be enabled for support. Optional synthesized sound is independent. Changing difficulty refunds an unfinished mixture before changing the order.

Coins, completed orders, pets, decorations, settings, pantry stock, errands, and the unfinished mixture save in this browser on this device. Each resource transfer saves stock and poured portions together. Reloading neither refunds nor duplicates a used portion. Successful brews retain the earned reward and advance the order. Original v1 saves migrate automatically, preserving pets, coins, orders, and decorations while adding starter pantry stock. Clearing browser data clears progress. If storage is blocked, play continues with a visible save warning.

## iPad and offline play

Open the HTTPS site in Safari, then use Share → Add to Home Screen. After the initial online load and successful offline-cache installation, the production build can reopen offline on that device. The help dialog reports when the cache is ready. Offline caching requires HTTPS or localhost; the Mac's plain HTTP Wi-Fi address supports online play but does not enable service workers on an iPad.

The hosted preview is private to the owner's account. Its platform sign-in can affect first-time access and access on another device. No game account or cloud save is implemented. Actual iPad hardware testing remains to be done; development verification uses touch viewport emulation.

## Source map

- src/game.js: recipes, finite inventory and cauldron lots, recovery, supply tasks, rewards, purchases, and save migration.
- src/fractions.js: exact arithmetic with 60 ticks per cup, simplified display, and typed fraction parsing.
- src/main.js: native browser-module UI, ingredient selection, supply errands, subtraction dialogs, and optional Web Audio chimes.
- src/style.css and src/fonts.css: responsive layout, local typography, and reduced-motion behavior.
- public/art: nine optimized, generated WebP assets.
- public/fonts: locally bundled DM Sans and Lora font faces, with license files.
- scripts/serve.mjs: dependency-free local HTTP server.
- scripts/build.mjs and scripts/build-sw.mjs: static build and offline-cache generation.
- tests/game.test.js: math, reward, purchase, and save behavior tests.

Use exact integer ticks, 60 per cup, for every quantity. Keep numerical labels in code. The cauldron holds 12 cups. Inventory transfers must conserve quantity until a successful brew consumes it. New recipes must be solvable using the finite restocking system. Do not award coins unless every ingredient matches, including ingredients absent from a recipe. Recovery must check the subtraction answer before changing stock.
