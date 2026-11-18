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

## Cozy corner expansion

The new cozy corner starts as a separate bare room. Its furniture is layered by application code, so earning an item visibly changes the room without changing the original potion-shop background.

| File in public/art | Purpose |
| --- | --- |
| cozy-corner.webp | Empty cottage nook, 1536 × 1024 |
| decor-plant.webp | Potted leafy fern |
| decor-rug.webp | Round woven plum rug |
| decor-bed.webp | Lavender pet bed |
| decor-bookshelf.webp | Short bookcase |
| decor-lantern.webp | Glowing brass/firefly lantern |
| decor-potion-shelf.webp | Wall shelf and three potion bottles |
| decor-tea-table.webp | Tea table, teapot, and cup |
| decor-painting.webp | Framed moonlit landscape |
| decor-herbs.webp | Hanging herb bundles |

All ten assets were generated with the built-in image-generation tool. The existing shop.webp was supplied as a visual style reference only and remains unchanged. Both generations are new images, not edits of the original shop.

Original PNGs are retained locally under ignored art-source/cozy-corner.png and art-source/cozy-furnishings.png. Run `node scripts/prepare-cozy-art.mjs` with cwebp and dwebp installed to reproduce all outputs. Use `--sprites-only` to rebuild furniture without touching the room background.

The generated objects extend slightly beyond a few nominal grid boundaries, so preparation finds the nine main connected alpha components in the original sheet rather than blindly cropping cells. It uses alpha 3 or greater to locate each object, retains an eight-source-pixel allowance for soft glow and fine antialiased leaves, and preserves the original alpha within that crop. Each sprite is scaled without changing its aspect ratio, then receives a consistent 12-pixel transparent border. Its maximum dimension is 480 pixels. This removes excess asymmetric cell margins and prevents neighboring objects from bleeding into a sprite. Resizing uses a lossless intermediate; the final WebPs use quality 90 and alpha quality 100. The room background uses quality 88.

Final sprite sizes are fern 480 × 430, rug 480 × 278, bed 480 × 353, bookcase 460 × 480, lantern 297 × 480, potion shelf 480 × 300, tea table 480 × 458, painting 480 × 433, and herbs 480 × 401.

The room's wall/floor seam is around 69% of the image height. The arched window is centered around 71% width, spanning approximately 60–85% width and 11–55% height. The left wall and foreground floor intentionally remain empty for furniture layers. The furniture has been trimmed and centered for predictable room-layer positioning; its 12-pixel border remains fully transparent.

### Exact room prompt

Use case: illustration-story. Asset type: background for the decoratable cozy corner in a children's potion-shop game. Input image 1 is a visual STYLE REFERENCE ONLY, not an edit target. Create a new mostly empty magical cottage nook in the same warm hand-painted gouache storybook style, palette, texture, soft rounded forms and frontal stage-like perspective. Warm cream plaster walls, wooden beams and wood floor, soft sunset sunlight, one arched window on the back wall around 60 percent across the frame. The lower 40 percent of the image is an empty wooden floor for separately placed furniture and a pet. The walls are largely bare and leave room for separately placed shelves and pictures. Landscape 3:2 composition, room fills image edge to edge. This is a new bare room to furnish, not the busy potion shop. No furniture, no shelves, no rug, no plants or vines, no hanging herbs, no creatures or people, no bottles, no books, no lights or lanterns, no curtains, no lettering, no symbols resembling text, no logos or watermark. Preserve the inviting cozy warm gouache art direction of the reference.

Tool options: referenced_image_paths=[public/art/shop.webp], transparent_background=false.

### Exact furnishing-sheet prompt

Use case: illustration-story. Asset type: transparent game furniture sprite sheet. Input image 1 is a visual STYLE REFERENCE ONLY, not an edit target. Generate exactly nine distinct full objects in a precise 3 by 3 grid of nine equal square cells on an ACTUALLY TRANSPARENT background. Match the warm gouache storybook painting, cream/dusty-plum/sage/amber-wood colors, rounded carefully drawn forms of the reference. Top row left to right: (1) a potted leafy fern in a warm terracotta pot, (2) a round woven dusty-plum rug viewed from a slight frontal angle, (3) a cozy lavender pet cushion/bed. Middle row left to right: (4) a short wooden bookcase containing a few books, (5) a warm glowing brass lantern with little firefly lights inside, (6) a wooden wall shelf with three jewel-colored potion bottles. Bottom row left to right: (7) a small wooden tea table with a teapot and cup, (8) a framed moonlit landscape painting, (9) a hanging bundle of herbs on twine. Each object must be centered in its own equal cell, fully visible and wholly contained in the middle 65 percent of that cell, with generous transparent gutters at all cell boundaries. No object crosses any grid boundary. Full silhouettes, no cropping, same gentle frontal game perspective. Only the listed objects, no extra props. No characters, no labels, no numbers, no text or lettering, no scene background, no ground planes, no cell borders or grid lines, no watermark. Genuine transparent alpha, not a checkerboard.

Tool options: referenced_image_paths=[public/art/shop.webp], transparent_background=true.

### Cozy art inspection

Inspected both generated images, optimized room, and representative furniture crops for consistent style, complete silhouettes, lack of text, and correct object placement within grid cells. Confirmed sprite WebPs retain alpha. Rendered temporary cream-background composites of the fern, tea table, trimmed bookcase, and trimmed lantern to verify clean edges and preserved detail. The trimmed lantern no longer contains a sliver of its neighboring shelf; the bed and shelf are extracted fully even where they crossed nominal cell edges. Checked that every final sprite has alpha and a completely transparent outer 12-pixel border. The room is empty except for its window and architectural beams. Preparation script syntax check passed. Temporary composites were removed after inspection.


