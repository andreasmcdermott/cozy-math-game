# Paws & Potions

A cozy fifth-grade math puzzle game about brewing potions and collecting magical familiars. Built for touch, including iPad Safari. Each potion has a fresh, guaranteed-solvable tray of pre-measured fractions plus decoys. Choose a subset, leave unused portions, and earn coins for pets and decorations.

Each familiar has four themed ingredients, six recipes, and a personal room to furnish. Switching brewing buddies keeps unfinished puzzles safe.

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

Production preview runs at http://localhost:4180. Cloudflare Pages is the new hosting target; read [CLOUDFLARE.md](CLOUDFLARE.md) for the prepared deployment and progress-transfer steps. The old .openai/hosting.json is historical context and is not used for Cloudflare deployment. The build generates a content-versioned service worker that precaches all local art, fonts, code, and application metadata. Production module URLs share a source version so an older offline cache cannot mix incompatible rule and UI modules during an upgrade.

## Play

The playable screens render in canvas, including the recipe, portion tray, coin counter, and navigation. Transparent native buttons preserve Tab, Enter, Space, touch, and screen-reader labels. Shop and errand scenes keep their full 3:2 paintings inside a cottage outline, surrounded by a sunset landscape. Inside each scene, characters and props share its scale and floor. Recipe and ingredient panels sit outside the cottage, with the tray below the house on portrait/tablet layouts. Potion customers stand outside with connected speech bubbles; your labeled familiar stays inside. Settings, recovery, and progress transfer use native dialogs. Phones can scroll the taller shop; familiar and furnishing collections use page arrows.


1. Read the customer's order and the recipe for one bottle.
2. Select an ingredient and inspect this puzzle's portions. Combine the ones that reach the recipe quantity. Other amounts and ingredient kinds are decoys; you do not have to use everything.
3. Undo a choice, return the mixture, or use Reset puzzle freely. Reset restores the same original tray and keeps your coins and pets.
4. Brew an exact recipe to earn coins. The next potion automatically comes with a different full tray. There is no inventory to restock between puzzles.
5. Village offers three optional errands at a time. Completing one replaces only that notice with a random new kind. The 16 kinds include triangle area, fractions of planted or unplanted garden area, missing lengths, fencing, planter volume, deliveries, change, trip times, seed fractions, missing numbers, and patterns. Garden diagrams show dimensions and planted sections. Rewards follow difficulty: Easy pays 4 coins, Standard 8, and Challenge 14. Unfinished notices keep their questions and rewards across reloads and Auto progression. Changing difficulty refreshes the board. Errands never change your potion tray.

The generator first chooses a valid combination for every required ingredient, then adds decoys. All targets can be reached using whole portions from the tray. No single portion matches a required ingredient's full target, and using every portion cannot solve it. Different correct combinations earn the same reward.

Use the level control or gear button to choose Easy, Standard, Challenge, or Auto:

- Easy uses halves and quarters, 2–3 portions, and fewer decoys.
- Standard uses unlike denominators and 2–5 portions.
- Challenge addition solutions require at least 4 portions per ingredient, with more decoys and batches of 2 or 3 bottles. Subtraction recovery is also available. Decoys cannot introduce a shorter shortcut.
- Auto starts Easy, moves to Standard after 3 completed potions, then Challenge after 8. Errands do not advance the level. Manual levels remain fixed.

Every mode has a guaranteed solution. Running totals are off by default. Added portions display as operands, such as ¼ + ¼, without an unknown-sum suffix. Optional totals, amount bars, and hints remain available for support. To recover a portion, choose an illustrated ingredient card, tap the amount to return, and enter the remainder in the subtraction equation. Other lets you enter a custom fraction, mixed number, or exact decimal. Recovery is optional; incorrect answers leave your potion unchanged.

Coins, pets, decorations, completed orders, settings, and your current puzzle attempt save in this browser. A reload keeps the same tray and poured portions. A reset never rerolls the puzzle. Changing difficulty refreshes all familiar trays for that mode, while retaining their recipe progress, rooms, and coins.

Older saves migrate to schema 5, retaining coins, pets, decorations, order count, and errand progress. Version 4 unfinished puzzles keep their exact portions and quantities with ingredient names mapped to the equipped familiar’s theme. The old shared room’s purchases and hidden items move into that familiar’s personal room. Earlier pantry attempts receive fresh trays. Legacy Fraction alchemist maps to Standard and Master of batches to Challenge. New games start on Auto. Clearing browser data clears progress. If storage is blocked, play continues with a visible save warning.

## Familiar specialties and rooms

Clover is the free starter familiar. Fern costs 180 coins and Pip 450. Already adopted familiars stay yours after the price update. Standard potions pay 16–18 coins; Easy pays less and Challenge more. Prices and rewards live in src/game.js and src/puzzles.js.

Clover brews with moonwater, lavender, chamomile, and mint. Fern uses forest dew, ruby-cap mushrooms, glowing truffles, and spores. Pip uses ember tea, dragon chili, ginger, and cinnamon. Each has six recipes and a separate recipe rotation. Changing buddies parks the exact current tray and mixture. Returning restores it, including across reloads and backups. An unfinished Auto puzzle keeps its original difficulty until finished; new puzzles follow the shared progression.

Use the familiar buttons on the Room screen to decorate any unlocked room without changing your brewing buddy. Clover has an herbal cottage, Fern a mushroom cottage, and Pip an ember tower. Each room has its own ten themed furnishings, costing 16–120 coins each and 600 coins in total. Ownership and display preferences save separately for each room. Put an item away or place it again without paying twice. Furniture positions are fixed; the brewing shop keeps its existing illustration.

## iPad and offline play

Open the HTTPS site in Safari, then use Share → Add to Home Screen. After the initial online load and successful offline-cache installation, the production build can reopen offline on that device. The help dialog reports when the cache is ready. Offline caching requires HTTPS or localhost; the Mac's plain HTTP Wi-Fi address supports online play but does not enable service workers on an iPad.

The old ChatGPT Sites copy is private to the parent account. The prepared Cloudflare Pages deployment opens without a player account or ChatGPT sign-in. Actual Cloudflare publication is a separate step; no project is created by the preparation command. No cloud save is implemented. Actual iPad hardware testing remains to be done; development verification uses touch viewport emulation.

## Cloudflare deployment preparation

```sh
npm run cloudflare:prepare
npm run cloudflare:preview
```

The first command runs tests, builds dist/, and verifies Pages headers and offline caching. The second uses the pinned Wrangler local emulator on http://127.0.0.1:4181. Neither publishes or requires the child to have an account.

When ready, the parent can run cloudflare:login, cloudflare:create once, and cloudflare:deploy. See [CLOUDFLARE.md](CLOUDFLARE.md) before deploying, including how to choose the project name and transfer progress from the old address. Settings → Back up or restore progress moves saved games between addresses/devices. The older published game needs the documented one-time export snippet.

## Source map

- src/catalog.js: familiar identities, 12 ingredient types, 18 recipes, and three furnishing catalogs.
- src/game.js: equipped/parked puzzle attempts, per-familiar recipe counts, rooms, recovery, errand board completion, rewards, purchases, and save migration.
- src/errands.js: seeded questions for 16 errand kinds, board descriptors, validation, and random replacements.
- src/puzzles.js: difficulty/reward configurations, deterministic solution-first generation, and decoys that preserve the required number of steps.
- src/backups.js: validated portable save export/import and legacy raw-save support.
- src/fractions.js: exact arithmetic with 60 ticks per cup, simplified display, and typed fraction parsing.
- src/main.js: game interactions, focus, native dialogs, saved progress, and optional Web Audio chimes.
- src/canvas-ui.js: canvas scenes, cottage outlines, recipe parchment, portion tiles, illustrated errands, paged collections, and aligned accessible controls.
- src/stage.js: fixed scene dimensions, uniform scaling, cottage geometry, and visible-foot anchoring.
- src/style.css and src/fonts.css: responsive layout, local typography, and reduced-motion behavior.
- public/art: 51 local WebP assets, including themed ingredient sprites, three bare rooms, 27 furnishing sprites, village garden, and sunset landscape.
- public/fonts: locally bundled DM Sans and Lora font faces, with license files.
- scripts/serve.mjs: dependency-free local HTTP server.
- scripts/build.mjs and scripts/build-sw.mjs: static build and offline-cache generation.
- tests/game.test.js, tests/familiars.test.js, tests/errands.test.js, and tests/backups.test.js: game rules, themed catalogs, independent room ownership, parked puzzles, migrations, rewards, and portable backups.
- tests/stage.test.js: complete-painting fit, uniform scale, height bounds, and floor registration.
- checks/cloudflare.test.mjs: deployable module graph, cache/header contracts, and canonical offline behavior.
- wrangler.jsonc, cloudflare/headers.template, and scripts/cloudflare.mjs: Cloudflare Pages configuration and deployment commands.

Use exact integer ticks, 60 per cup, for every quantity. Keep mathematical labels in code. The cauldron holds 12 cups. Transfers conserve quantities within an attempt; reset restores its generated tray and a successful brew creates the next puzzle. New recipes must have a multi-portion decomposition in the generator catalogue. Independently test many seeds and both difficulty modes. Reward only exact mixtures, including rejecting unrequested ingredients. Never make errands necessary for brewing.
