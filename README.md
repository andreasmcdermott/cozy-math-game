# Paws & Potions

A cozy fifth-grade math puzzle game about brewing potions and collecting magical familiars. Built for touch, including iPad Safari. Each potion has a fresh, guaranteed-solvable tray of pre-measured fractions plus decoys. Choose a subset, leave unused portions, and earn coins for pets and decorations.

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
2. Select an ingredient and inspect this puzzle's portions. Combine the ones that reach the recipe quantity. Other amounts and ingredient kinds are decoys; you do not have to use everything.
3. Undo a choice, return the mixture, or use Reset puzzle freely. Reset restores the same original tray and keeps your coins and pets.
4. Brew an exact recipe to earn coins. The next potion automatically comes with a different full tray. There is no inventory to restock between puzzles.
5. Optional Village errands cover arithmetic, missing-number algebra, garden area/perimeter, and planter volume. Rewards follow difficulty: Easy pays 4 coins, Standard 8, and Challenge 14. The questions also get harder. Errands never change your potion tray.

The generator first chooses a valid combination for every required ingredient, then adds decoys. All targets can be reached using whole portions from the tray. No single portion matches a required ingredient's full target, and using every portion cannot solve it. Different correct combinations earn the same reward.

Use the level control or gear button to choose Easy, Standard, Challenge, or Auto:

- Easy uses halves and quarters, 2–3 portions, and fewer decoys.
- Standard uses unlike denominators and 2–5 portions.
- Challenge addition solutions require at least 4 portions per ingredient, with more decoys and batches of 2 or 3 bottles. Subtraction recovery is also available. Decoys cannot introduce a shorter shortcut.
- Auto starts Easy, moves to Standard after 3 completed potions, then Challenge after 8. Errands do not advance the level. Manual levels remain fixed.

Every mode has a guaranteed solution. Running totals are off by default, with optional totals, amount bars, and hints for support. Subtraction recovery remains an optional way to return part of an ingredient after calculating the remainder.

Coins, pets, decorations, completed orders, settings, and your current puzzle attempt save in this browser. A reload keeps the same tray and poured portions. A reset never rerolls the puzzle. Changing difficulty starts that mode's puzzle with a fresh tray.

Older saves migrate to schema 4, retaining coins, pets, decorations, order count, and errand progress. Legacy Fraction alchemist maps to Standard and Master of batches to Challenge. Previous attempts are replaced by fresh trays. New games start on Auto. Clearing browser data clears progress. If storage is blocked, play continues with a visible save warning.

## Friends and a room to furnish

Clover is the free starter familiar. Fern costs 180 coins and Pip 450. Already adopted familiars stay yours after the price update. Standard potions pay 16–18 coins; Easy pays less and Challenge more. Prices and rewards live in src/game.js and src/puzzles.js.

The cozy corner starts with bare walls, a wooden floor, a window, and your familiar. Ten furnishings cost 16–120 coins: herbs, a fern, lantern, garland, rug, painting, pet bed, potion shelf, tea table, and bookcase. Purchases appear immediately. Put an item away or place it again without paying twice. Ownership and display preferences save independently. Furniture positions are fixed in this version; the main brewing shop keeps its existing illustration.

## iPad and offline play

Open the HTTPS site in Safari, then use Share → Add to Home Screen. After the initial online load and successful offline-cache installation, the production build can reopen offline on that device. The help dialog reports when the cache is ready. Offline caching requires HTTPS or localhost; the Mac's plain HTTP Wi-Fi address supports online play but does not enable service workers on an iPad.

The hosted preview is private to the owner's account. Its platform sign-in can affect first-time access and access on another device. No game account or cloud save is implemented. Actual iPad hardware testing remains to be done; development verification uses touch viewport emulation.

## Source map

- src/game.js: recipes, current puzzle attempts, cauldron lots, recovery, optional errands, rewards, purchases, and save migration.
- src/puzzles.js: difficulty/reward configurations, deterministic solution-first generation, and decoys that preserve the required number of steps.
- src/fractions.js: exact arithmetic with 60 ticks per cup, simplified display, and typed fraction parsing.
- src/main.js: native browser-module UI, ingredient selection, supply errands, subtraction dialogs, and optional Web Audio chimes.
- src/style.css and src/fonts.css: responsive layout, local typography, and reduced-motion behavior.
- public/art: nineteen optimized, generated WebP assets, including a separate bare room and nine transparent furnishings.
- public/fonts: locally bundled DM Sans and Lora font faces, with license files.
- scripts/serve.mjs: dependency-free local HTTP server.
- scripts/build.mjs and scripts/build-sw.mjs: static build and offline-cache generation.
- tests/game.test.js: math, reward, purchase, and save behavior tests.

Use exact integer ticks, 60 per cup, for every quantity. Keep mathematical labels in code. The cauldron holds 12 cups. Transfers conserve quantities within an attempt; reset restores its generated tray and a successful brew creates the next puzzle. New recipes must have a multi-portion decomposition in the generator catalogue. Independently test many seeds and both difficulty modes. Reward only exact mixtures, including rejecting unrequested ingredients. Never make errands necessary for brewing.
