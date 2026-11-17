# Paws & Potions

A cozy math game about brewing potions and collecting magical familiars. Built for touch, including iPad Safari. The first version practices halves and quarters; the harder setting introduces recipe batches of two and three.

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

Production preview runs at http://localhost:4180. Deploy the contents of dist/ to a static HTTPS host. The checked-in .openai/hosting.json identifies this project's private Sites deployment. The build generates a content-versioned service worker that precaches all local art, fonts, code, and application metadata.

## Play

1. Read the customer's order and the recipe for one bottle.
2. Select a quarter-, half-, or whole-cup measure, then tap an ingredient to pour it.
3. Match each quantity and brew. Undo, empty, and hints are free. Ingredients never run out.
4. Spend earned coins on familiars or decorations. Tap a familiar for encouragement.

Learning settings are under the gear button. A gentle start makes one bottle at a time. A little more magic includes batches of two and three; multiply every ingredient by the bottle count. Visual fraction bars and optional synthesized sound can be toggled independently.

Coins, completed orders, pets, decorations, and settings save in this browser on this device. Mixtures in progress are intentionally not saved. Reloading after a successful brew retains the earned reward and advances to the next order. Clearing browser data clears progress. If storage is blocked, play continues with a visible save warning.

## iPad and offline play

Open the HTTPS site in Safari, then use Share → Add to Home Screen. After the initial online load and successful offline-cache installation, the production build can reopen offline on that device. The help dialog reports when the cache is ready. Offline caching requires HTTPS or localhost; the Mac's plain HTTP Wi-Fi address supports online play but does not enable service workers on an iPad.

The hosted preview is private to the owner's account. Its platform sign-in can affect first-time access and access on another device. No game account or cloud save is implemented. Actual iPad hardware testing remains to be done; development verification uses touch viewport emulation.

## Source map

- src/game.js: recipe data, integer quarter-cup math, order rewards, purchases, and validated save schema.
- src/main.js: native browser-module UI, interaction state, dialogs, and optional Web Audio chimes.
- src/style.css and src/fonts.css: responsive layout, local typography, and reduced-motion behavior.
- public/art: nine optimized, generated WebP assets.
- public/fonts: locally bundled DM Sans and Lora font faces, with license files.
- scripts/serve.mjs: dependency-free local HTTP server.
- scripts/build.mjs and scripts/build-sw.mjs: static build and offline-cache generation.
- tests/game.test.js: math, reward, purchase, and save behavior tests.

Use integer quarter-cup units for every quantity. Keep numerical labels in code. New recipes should remain solvable within the six-cup cauldron capacity. Do not award coins unless every ingredient matches, including ingredients absent from a recipe.
