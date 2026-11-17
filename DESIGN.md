# Paws & Potions

## Goal

Build a cozy, single-player, touch-friendly math game for a child who enjoys Prodigy, fraction war, collecting, potions, and pets. The player runs a potion shop, measures ingredients, helps customers, and earns coins to adopt magical familiars and decorate the shop. Math should determine the brewing actions.

## User decisions

- Web-based v1 that runs on an iPad.
- Single player only for now. Multiplayer is deferred.
- Combine potion brewing and collectible familiars.
- Use ChatGPT image generation for illustrated art.
- Limited animation through rotation, scaling, and translation is sufficient.
- Write this document before implementation so another agent can resume.

The child's age and grade are not yet known. Start with visual halves and quarters; keep recipe content data-driven so difficulty can change. A clarification is pending, but it does not block the shop, graphics, or persistence.

## Experience

The game opens directly into a warm illustrated shop. A familiar sits by the cauldron. A customer order names a potion and shows ingredient quantities. The player selects a measuring cup, taps ingredients to pour them, and brews when ready. A successful potion earns coins and advances to another customer. A mistake offers a specific hint, and the player can undo or empty the cauldron without losing coins or ingredients.

The secondary loop is spending coins to adopt familiars and decorate the shop. Owned familiars can be selected freely. There are no timers, neglected-pet penalties, ads, accounts, or purchases.

## V1 scope and completion criteria

- Illustrated shop, original familiar art, and illustrated ingredient assets.
- At least five fraction recipes, with repeated-scoop and scaled-batch challenges.
- Visible half- and quarter-cup measures, accurate ingredient totals, undo, clear, hints, and explicit success feedback.
- Three familiars with adoption costs and selection. At least two cosmetic shop upgrades.
- Browser-local save of coins, completed orders, adopted pets, selected pet, decorations, and learning settings. Reloading preserves progress; damaged or unavailable storage does not crash play.
- Responsive landscape iPad and narrow mobile layouts, large touch targets, keyboard-accessible controls, reduced-motion support, and no required dragging or hover.
- Installation metadata and offline caching for the static game after an initial online visit where supported.
- Runnable development and production commands, automated checks of math/reward/save rules, and browser verification of a complete brew, adoption, persistence, and responsive layouts.

## Learning rules

- Store quantities as integer quarter-cup units. Never use approximate floating-point equality for answers.
- A recipe specifies quantities per bottle. A batch multiplies every ingredient by the same whole-number factor.
- Compare every ingredient, including unexpected ingredients, before awarding a reward.
- A brew earns its reward exactly once. Repeated taps during success cannot duplicate rewards.
- Reveal visual support and hints without penalty. Default to untimed practice.
- Let the player correct a mixture. Undo returns to the preceding pour.
- In challenge mode, the recipe lists per-bottle amounts and the customer asks for multiple bottles. Assistance can reveal batch totals.

## Visual direction

Cozy painted storybook art, warm cream and plum interface, botanical details, wooden shelves, jewel-colored potion bottles, and expressive rounded creatures. A moss kitten, mushroom frog, and tiny lavender dragon form the starter collection. Art must remain readable at tablet sizes. Generate environments separately from transparent asset sheets so the app can position and animate objects.

Render all numbers, fraction markings, recipe instructions, buttons, and liquid measurements in code for accuracy and accessibility. Keep animated parts separate from background art. Use restrained CSS animation and respect prefers-reduced-motion.

## Technical direction

Use a small static web app with native JavaScript modules and dependency-free Node build/serve scripts. Keep pure game rules separate from DOM rendering and recipe data. Use localStorage with a versioned, validated schema. No backend or runtime image-generation dependency. Generated assets live in the repository, with a prompt/provenance record. Use native buttons and dialog semantics, visible focus, and live feedback announcements.

## Deferred

Multiplayer, accounts/cloud saves, free-roaming exploration, pet care simulation, complex sprite animation, voice acting, procedural recipes, analytics, and a broad curriculum. Gather actual play feedback before expanding.

## Handoff status

V1 implemented on 2026-11-17. The design was recorded before implementation. The pending age/grade question was not answered during development, so the default remains visual halves and quarters, with an optional batch setting for multiplication.

### What exists

- Six rotating customer recipes and four illustrated ingredients.
- Quarter-, half-, and whole-cup measures, exact checking, undo, empty, visual fraction bars, and specific correction hints.
- One starter moss kitten, plus a mushroom frog and pocket dragon purchasable with earned coins. Owned pets can be selected and petted.
- Two purchasable decorations, immediately visible in the shop.
- Versioned, validated browser-local progress; graceful fallback when storage is blocked or corrupt. In-progress mixtures reset on reload.
- Nine generated WebP assets, approximately 758 KB, plus self-hosted fonts and licenses. See ART.md for prompts, source paths, and regeneration.
- Native modal settings/help, optional synthesized chimes, reduced-motion support, 44-pixel touch targets, and responsive phone/tablet/desktop layouts.
- Production install metadata and an automatically versioned offline cache containing every local runtime asset.

### Where to work

- src/game.js owns recipes, quantity math, save validation, rewards, and purchases. Quantities are quarter-cup integers.
- src/main.js owns rendering, transient mixtures and pour history, dialogs, sound, and interaction dispatch. Saved state is separate from transient UI state.
- src/style.css owns the layout and animation. Compact landscape tablet rules keep the ingredient controls and brew button visible at 1024×768.
- scripts/build.mjs copies a static production build into dist/. scripts/build-sw.mjs generates the content-hashed offline cache. scripts/serve.mjs serves development or production files without dependencies.
- public/art contains production graphics. Local-only originals in art-source are ignored by Git; preserve them when working in this checkout.
- .openai/hosting.json is the authoritative Site identity. Reuse that project; do not create another Site for edits.

### Verification completed

- npm test: ten passing tests, covering every recipe across all batch cycles, incorrect/extra ingredients, duplicate-reward prevention, purchases, corrupted/denied storage, save round-trip, exact formatting, and pour immutability/capacity.
- npm run build: static output and complete offline precache generated successfully.
- Browser playthrough: incorrect ingredient → hint → undo → correct brew; multiple orders; unaffordable adoption disabled; earned adoption selects new pet; reload retains coins, progress, and selected pet.
- Browser playthrough: change to batch mode; complete a three-bottle order; purchase a decoration and see it in the shop.
- Chromium touch emulation at 1024×768, 768×1024, 390×844, and 320×740: no horizontal overflow. Checked 44-pixel touch targets and reduced-motion behavior. Inspected desktop, tablet, and phone screenshots.
- Production browser loaded all images and fonts without external runtime requests or console warnings/errors. Offline cache activated. Stopped the actual production HTTP server, then reloaded successfully with working controls, art, and local fonts.

### Known limits and next useful work

Actual iPad Safari hardware has not been tested. The hosted Site is owner-private, so platform sign-in can affect access on another device; see README.md for a same-Wi-Fi local alternative and Home Screen instructions. Saves are per browser/device and do not sync. There is no separate ingredient-gathering scene, advanced animation, inventory scarcity, or pet care simulation. Fraction and multiplication difficulty is limited to the recipe quantities and batches above.

Watch a child complete several orders before expanding. First tune text size, recipe difficulty, and the discoverability of measuring cups from that observation. Avoid broadening into multiplayer or a large curriculum before that feedback.
