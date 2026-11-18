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

## Canvas game garden

`public/art/village-garden.webp` is a new 1536 × 1024 background for the optional geometry errands, generated on 2026-11-17 with the built-in ChatGPT image-generation tool. The existing `shop.webp` was supplied as a style reference. No existing painting or character sprite was replaced. Delivery and formula settings reuse the original local backgrounds and sprites, with cart, lighting, parchment, and UI drawn in canvas.

The generated source is retained locally as ignored `art-source/village-garden.png`. Run `node scripts/prepare-errand-art.mjs` with `cwebp` installed to recompress it at quality 88. The runtime painting is local and is included in the offline cache. All quantities, expressions, garden cells, and dimension labels are rendered in code.

### Exact garden prompt

Use case: illustration-story. Asset type: local background for the optional herb-garden errand in a cozy children's potion game. Input image 1 is a visual STYLE REFERENCE ONLY, not an edit target. Create a new outdoor cottage herb garden in the same hand-painted gouache storybook style, visible paper and brush texture, warm amber sunset lighting, cream/dusty-plum/sage colors, softly rounded forms and carefully illustrated foliage. A weathered little wooden gate and low fence, terracotta pots of mint and lavender, a few flower beds at the edges, rolling soft wooded hills and distant cottage roofs. A broad quiet grassy clearing and winding warm stone path fill the foreground and middle. Compose as a wide landscape 3:2 game stage, with botanical detail framing the outer edges, open usable space on the left for a separately rendered mushroom-frog character and UI, and a quieter right half behind a separately rendered parchment challenge panel. Inviting, magical and richly painted, matching the reference's texture and detail. No characters or creatures, no grid, no diagrams, no quantities, no letters, no numbers, no text, no logos or watermark. Background fills the image edge to edge.

Tool options: `referenced_image_paths=[public/art/shop.webp]`, `transparent_background=false`.

Inspected the generated painting and optimized WebP for matching gouache texture, warm palette, usable foreground, complete scenery, and absence of characters, lettering, numbers, or diagrams. Inspected it behind both desktop and phone challenge panels.

## Cottage landscape surround

`public/art/cottage-landscape.webp` is a new 1536 × 1024 sunset landscape, generated on 2026-11-17 with the built-in ChatGPT image-generation tool using the original shop as a style and window-view reference. It surrounds the fixed-aspect cottage stages and may crop to fill the page. It does not replace any existing painting. The gabled cottage outline, chimney, round attic window, roof shingles, and timber beams are drawn in canvas code so their opening fits the original stage exactly.

The original PNG is retained locally as ignored `art-source/cottage-landscape.png`. With `cwebp` installed, run `node scripts/prepare-landscape-art.mjs` to reproduce the quality-88 WebP. Sprite alpha bounds are used only while drawing to align visible feet with the scene's floor. Original sprites remain unchanged.

### Exact landscape prompt

Use case: illustration-story. Asset type: local panoramic landscape backdrop surrounding a cozy cottage cutaway in a children's potion game. Input image 1 is a visual STYLE AND VIEW REFERENCE ONLY, not an edit target. Paint the outdoor world glimpsed through the arched windows of this shop: layered lavender and dusty purple wooded hills, a small distant storybook village with warm golden windows, soft sage trees, golden sun low on the horizon, peach and pink sunset clouds. Warm amber meadow and gentle green foliage at the lower outer edges, open soft central distance. Match the reference's hand-painted gouache texture, visible paper/brush grain, rounded detailed botanical forms, warm cream/amber/plum/sage palette, and welcoming mood. Wide 3:2 landscape painting, edge to edge; it must tolerate cropping to very wide and tall screens. The game will place a separate cottage frame and existing shop interior on top, so do not draw a large foreground cottage or any foreground building, interiors, characters, cauldrons, picture frames, UI, text, letters, numbers, symbols, logos, or watermark. This is a new landscape painting only.

Tool options: `referenced_image_paths=[public/art/shop.webp]`, `transparent_background=false`.

Inspected the generated painting and optimized WebP for matching brush texture, sunset palette, distant village/hills, and absence of foreground buildings, characters, lettering, quantities, or diagrams. Inspected the surround with the framed shop and every errand on desktop, phone, portrait tablet, and ultrawide layouts.

## Familiar specialties and personal rooms

Generated on 2026-11-17 using the built-in ChatGPT image-generation tool. Existing paintings and sprites are preserved. These additions supply ten ingredient sprites, two bare room backgrounds, and eighteen furnishing sprites. Clover reuses the original room and furniture. Theme garlands and every mathematical label remain code-rendered.

| Runtime files in public/art | Purpose |
| --- | --- |
| lavender.webp, chamomile.webp | Clover's new herbal ingredients; original moonwater.webp and mint.webp remain in use |
| dew.webp, mushrooms.webp, truffles.webp, spores.webp | Fern's woodland ingredients |
| embertea.webp, chili.webp, ginger.webp, cinnamon.webp | Pip's warming ingredients |
| room-fern.webp, room-pip.webp | Bare sage mushroom cottage and lavender-stone tower |
| fern-plants.webp, fern-rug.webp, fern-bed.webp, fern-bookshelf.webp, fern-lantern.webp, fern-shelf.webp, fern-tea.webp, fern-painting.webp, fern-herbs.webp | Nine mushroom, moss, and pond furnishings |
| pip-plants.webp, pip-rug.webp, pip-bed.webp, pip-bookshelf.webp, pip-lantern.webp, pip-shelf.webp, pip-tea.webp, pip-painting.webp, pip-herbs.webp | Nine copper, spice, crystal, and ember furnishings |

Original PNGs are retained locally in ignored art-source/. Run `node scripts/prepare-familiar-art.mjs` with cwebp and dwebp installed. The script detects each cell's main connected alpha component, keeps a five-source-pixel edge allowance, resizes to a maximum dimension of 480 pixels, and adds a 12-pixel transparent border. Sprites use quality 90 and alpha quality 100; room backgrounds use quality 88. The ingredient source has twelve cells; its last two mint/moonwater companions are not extracted, preserving the original runtime assets. Rug sprites are projected into the floor plane by the renderer.

Inspected both bare rooms, all three themed brews, fully furnished room composites, phone layouts, and representative individual ingredient/furniture crops. Verified all 28 new transparent sprites have visible bodies, maximum dimension 480, and a completely transparent 12-pixel border. Existing creature bitmaps are unchanged. Code positions the kitten's contact shadow upward and right, the rabbit's shadow upward, and removes the rabbit's separate platform.

### Ingredient sheet

Use case: illustration-story. Asset type: transparent ingredient sprite sheet for a cozy children's potion game. Image 1 is a visual style reference only. Create exactly twelve distinct objects in a precise 4-column by 3-row grid of equal cells on a truly transparent background, wide landscape composition. Row 1 left to right: (1) a small tied bunch of lavender flowers, (2) a tied chamomile sprig with white flowers and yellow centers, (3) a corked round glass bottle of pale green dewdrops, (4) a connected cluster of red spotted woodland mushrooms. Row 2: (5) a touching cluster of pale blue glowing truffles, (6) a glass jar containing golden magical spores with a closed lid, (7) a round corked bottle of warm amber-red ember tea, (8) two red chili peppers joined at their green stems. Row 3: (9) a golden fresh ginger root, (10) cinnamon sticks tied together with twine, (11) a mint sprig, (12) a round corked blue moonwater bottle. Match the warm hand-painted gouache, visible brush texture, softly rounded shapes, and cream/sage/plum/amber palette of the reference. Each object centered in the middle 60 percent of its cell, no crossing cell edges, generous transparent gutters. All leaves, flowers, stoppers and tips complete. Objects in a cell must touch or be tied together so each cell contains one connected cluster. No ground shadows, scenery, grid lines, frames, lettering, quantities, labels, numbers, logos, or watermark. Genuine alpha transparency. Do not render a checkerboard. The last two objects are style companions; existing versions will remain in the game.

Source: `art-source/theme-ingredients.png`. Tool options: referenced_image_paths=[art-source/ingredients.png], transparent_background=true.

### Fern’s bare room

Use case: illustration-story. Asset type: empty room background for a mushroom frog's personal room in a cozy potion game. Images 1 and 2 are style and character palette references only, not edit targets. Create a NEW mostly bare room inside a rounded mushroom cottage: warm pale sage/cream plaster walls, organically curved dark wood ceiling ribs, earthy muted terracotta and moss-green trim, a clean wooden floor, one round-topped cottage window on the right showing the same peach-and-lavender sunset forest. Match the hand-painted gouache texture, rounded inviting shapes, paper grain and warmth of the reference. Front-facing gentle game-stage perspective, landscape 3:2, 1536 by 1024. Wall/floor seam around 69 percent height; arched window centered at 72 percent width spanning roughly x60–85 percent, y12–55 percent. Leave the left wall and foreground floor EMPTY for separate earned decorations and a pet. The room should look distinct from a human cottage but remain warm and spacious. No permanent furniture, mushrooms on the floor, pots, plants, books, shelves, lamps, rugs, decorations, creatures, lettering, numbers, labels, logos, or watermark. Only architecture, bare walls, window and floor. No UI.

Source: `art-source/room-fern.png`. Tool options: referenced_image_paths=[public/art/cozy-corner.webp, public/art/mushroom-frog.webp], transparent_background=false.

### Pip’s bare room

Use case: illustration-story. Asset type: empty personal room for a tiny lavender dragon in a cozy children's potion game. Images 1 and 2 are style and character references only. Create a NEW mostly bare room in a little round stone tower or friendly dragon grotto: soft lavender-gray stone walls, gently arched ceiling of rounded stone blocks, warm copper/amber trim, a broad clean warm stone floor, one tall arched window on the RIGHT revealing peach/lavender sunset mountain peaks. Match the reference's warm hand-painted gouache paper/brush texture, rounded storybook forms and inviting non-scary mood. Distinct from a wooden cottage: pale amethyst and dusk-gray stone, warm golden sunset light, no lava. Frontal gentle game-stage perspective, wide landscape 3:2, 1536 by 1024. Wall/floor seam around 69 percent height; window centered at 72 percent width spanning roughly x60–85 percent and y12–55 percent. Left wall and foreground floor empty for earned separate furniture and a pet. No furniture, treasure, crystals on floor, plants, shelves, books, lamps, candles, rugs, decorations, creatures, labels, numbers, lettering, logos or watermark. Architecture, window, bare walls and floor only. No UI.

Source: `art-source/room-pip.png`. Tool options: referenced_image_paths=[public/art/cozy-corner.webp, public/art/lavender-dragon.webp], transparent_background=false.

### Fern’s furniture sheet

Use case: illustration-story. Asset type: transparent furniture sprite sheet for the mushroom frog's collectible room. Images are style and character references only. Create exactly nine separate full objects in a precise 3 by 3 grid of equal cells on genuine alpha transparency. Match the warm cozy hand-painted gouache texture, rounded forms, cream/sage/amber/terracotta palette of the reference. Row 1 left to right: (1) terracotta planter with a connected group of red spotted mushrooms and moss, (2) round woven lily-pad green rug viewed gently from above, (3) soft moss-green nest-shaped pet bed with tiny cream mushroom motifs. Row 2: (4) short stump-shaped wooden bookcase containing field guides and no writing on their spines, (5) hanging brass lantern with a little glowing mushroom inside, (6) rustic wall shelf with three small corked spore jars. Row 3: (7) low mushroom-shaped tea table with a small teapot and cup sitting on top, (8) framed moonlit lily-pond painting, (9) bunch of dried small mushrooms tied with twine for hanging. Keep each complete object within the middle 65 percent of its cell, centered with generous transparent gutters. Only listed objects, no other props, floor, room, cast shadows outside objects, creatures, grid lines, cell borders, letters, numbers, labels or watermark. Parts within each cell should touch or be tied together into one object. Genuine transparency, no checkerboard.

Source: `art-source/fern-furnishings.png`. Tool options: referenced_image_paths=[public/art/cozy-corner.webp, public/art/mushroom-frog.webp], transparent_background=true.

### Pip’s furniture sheet

Use case: illustration-story. Asset type: transparent furniture sprite sheet for a tiny lavender dragon's collectible room. Images are style and character references only. Create exactly nine separate full objects in a precise 3 by 3 grid of equal cells on genuine alpha transparency. Match the reference's warm hand-painted gouache texture, softly rounded carefully drawn forms and welcoming children's storybook mood; palette lavender, dusty plum, amber/copper and dark warm wood. Row 1 left to right: (1) small copper pot containing a connected cluster of warm glowing lavender/amber crystals, (2) round woven sunburst rug in plum and gold, (3) soft deep-plum pet cushion embroidered with a simple flame motif. Row 2: (4) short dark wooden treasure bookcase containing a few books, smooth stones and a little closed treasure chest, with no writing, (5) hanging copper lantern enclosing a friendly glowing ember, (6) small wall shelf with three warm-colored spice jars. Row 3: (7) low dark wooden tea table with a copper kettle and cup on top, (8) framed painting of starlit mountain peaks, (9) braid of red chili peppers tied for hanging. Every complete object centered within the middle 65 percent of its own cell with generous transparent gutters; parts in a cell connected. Only listed objects, no room, floor, extra props, cast shadows outside objects, creatures, grid lines, cell borders, lettering, numbers, labels, logos, or watermark. Genuine alpha background, never a checkerboard.

Source: `art-source/pip-furnishings.png`. Tool options: referenced_image_paths=[public/art/cozy-corner.webp, public/art/lavender-dragon.webp], transparent_background=true.

