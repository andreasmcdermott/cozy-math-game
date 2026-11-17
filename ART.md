# Art provenance

All illustrated artwork was created for this project on 2026-11-17 using the built-in ChatGPT image-generation tool. No API key, CLI image-generation fallback, downloaded stock art, or third-party character reference was used. Mathematical labels and controls belong in application code.

## Runtime assets

| File in public/art | Purpose |
| --- | --- |
| shop.webp | 1536 × 1024 shop background |
| moss-kitten.webp | Starter familiar |
| mushroom-frog.webp | Collectible familiar |
| lavender-dragon.webp | Collectible familiar |
| rabbit.webp | Customer portrait |
| moonwater.webp | Ingredient illustration |
| moonberries.webp | Ingredient illustration |
| honey.webp | Ingredient illustration |
| mint.webp | Ingredient illustration |

The eight sprites are 480 pixels wide, with their original alpha channel preserved. Each was extracted from one quadrant of a generated sheet, so some transparent padding remains around the illustrated object. Position and animate the individual sprites independently of the background. Runtime art totals approximately 758 KB.

## Source and preparation

Original generated PNGs are retained as art-source/shop.png, art-source/familiars.png, and art-source/ingredients.png. To reproduce runtime assets, install the cwebp command-line tool and run:

```sh
node scripts/prepare-art.mjs
```

The preparation script reads each PNG's dimensions, extracts its four equal quadrants, scales sprites to 480 pixels wide, and compresses to WebP at quality 90 with alpha quality 100. The background uses quality 88 at its original size. This is deterministic asset preparation, not image creation or creative editing. No package installation is needed for the preparation script itself.

## Exact generation prompts

### Shop background

Use case: illustration-story. Asset type: background for a cozy children's 2D potion-brewing web game. Create a wide landscape storybook illustration of the inside of a tiny magical potion shop, a warm inviting room with wooden shelves of jewel-colored glass bottles, arched windows with sunset light, bundles of hanging herbs, small botanical details and a worn wooden counter. Color palette warm cream, soft dusty plum, sage green, amber wood. Hand-painted gouache texture, soft rounded forms, carefully drawn charming details, polished game background art. Composition must leave the center and lower center fairly quiet and uncluttered so a separate cauldron and pet can be overlaid by the game. Gentle frontal stage-like perspective, wide 3:2 landscape frame, room fills image edge to edge. No people, no creatures, no cauldron, no lettering, no symbols that look like letters, no logos, no watermark. Not a screenshot or interface.

Tool option: transparent_background=false. No input/reference image.

### Familiar and customer sheet

Use case: illustration-story. Asset type: transparent game sprite sheet. Create exactly four separate cute full-body magical animals on an actually transparent background, in a precise 2 by 2 grid of four equal cells. Top left: a round moss-green and cream kitten with leaflike ears, moss tuft and bright curious eyes, sitting. Top right: a squat sage-green frog with a red-brown spotted mushroom cap, sitting. Bottom left: a tiny chubby lavender dragon with small wings, curled tail and cream belly, sitting. Bottom right: a friendly cream rabbit with peach inner ears and a little sage scarf, sitting as a shop customer. Cozy hand-painted gouache storybook game illustration, clean expressive silhouettes, soft shaded texture, warm cream, dusty plum and sage palette. Each creature is centered in its own quadrant, same apparent body scale, wholly contained inside the middle 65 percent of its quadrant, with generous transparent gutters around it. No object or shadow crosses the center grid lines. No scenery, no ground plane, no frame, no cell borders, no grid lines, no labels, no text, no watermark. Keep full ears, tails and wings inside each cell. Genuine transparent alpha background, not a checkerboard.

Tool option: transparent_background=true. No input/reference image. The four generated animals occupy the requested quadrants.

### Ingredient sheet

Use case: illustration-story. Asset type: transparent ingredient sprite sheet for a cozy potion-shop game. Create exactly four separate ingredients in a precise 2 by 2 grid of four equal cells on an actually transparent background. Top left: a rounded clear glass bottle filled with luminous pale blue moonwater, tiny cork stopper, readable blue liquid silhouette. Top right: a small cluster of plump blue-purple moonberries with two sage leaves. Bottom left: a rounded golden honey jar with a cream cloth lid and a little wooden honey dipper, no label. Bottom right: a fresh mint sprig of several broad sage-green leaves. Cozy hand-painted gouache storybook game illustration, soft shaded paper texture, rounded clear shapes, warm cream, dusty plum, sage and amber palette. Each ingredient is centered within the middle 60 percent of its own quadrant, same apparent icon scale, wholly contained in that quadrant. Generous transparent gutters on every side and across center grid lines. All objects full and uncropped. No scenery, no ground, no cast shadow outside the object, no frame, no cell borders, no grid lines, no labels or text, no watermark. Genuine alpha transparency, not a checkerboard.

Tool option: transparent_background=true. No input/reference image. The four generated ingredients occupy the requested quadrants.

## Inspection

Inspected the three generated images for style, subjects, layout, and absence of text. Inspected optimized kitten, dragon, and moonwater crops for complete silhouettes. Confirmed both generated sprite sources have alpha channels. A temporary cream-background composite confirmed clean visible sprite edges; the transparency preview's bright fringe artifacts do not appear in the composited asset. The temporary composite was removed after inspection.

For future art, use these source images as visual references and keep the same warm gouache style, palette, silhouette clarity, and transparent asset separation. Preserve existing assets or create versioned replacements when trying a new direction.

