import { generatePuzzleStock, LEVELS, AUTO_THRESHOLDS } from './puzzles.js';
export { LEVELS, AUTO_THRESHOLDS } from './puzzles.js';
import { CUP, CAPACITY, formatCups, cupLabel, parseCups } from './fractions.js';
export { CUP, CAPACITY, formatCups, cupLabel, parseCups } from './fractions.js';
export const SAVE_KEY = 'paws-potions-v1';
export const INGREDIENTS = [
  { id: 'moonwater', name: 'Moonwater', color: '#79b6cf', art: 'moonwater', noun: 'moonwater' },
  { id: 'moonberries', name: 'Moonberries', color: '#a87eb8', art: 'moonberries', noun: 'moonberry juice' },
  { id: 'honey', name: 'Sunshine honey', color: '#e1ae54', art: 'honey', noun: 'honey' },
  { id: 'mint', name: 'Garden mint', color: '#85ad86', art: 'mint', noun: 'mint tea' },
];
export const RECIPES = [
  { id: 'moonbeam', name: 'Moonbeam tonic', subtitle: 'A little bottled moonlight', color: '#ab8ec1', amounts: { moonwater: 35, moonberries: 40, honey: 24 }, reward: 18, customer: 'Hazel', request: 'My reading nook could use a little glow. One moonbeam tonic, please!', purpose: 'Makes a cozy reading light', art: 'rabbit' },
  { id: 'garden', name: 'Garden giggles', subtitle: 'For very happy houseplants', color: '#87ab85', amounts: { moonwater: 40, mint: 45 }, reward: 16, customer: 'Fern', request: 'My little seedlings need some encouragement. Could you make garden giggles?', purpose: 'Helps sleepy seeds sprout', art: 'mushroom-frog' },
  { id: 'dream', name: 'Sweet dreams', subtitle: 'Cloud-soft and sleepy', color: '#b29ac7', amounts: { moonwater: 50, moonberries: 30 }, reward: 16, customer: 'Pip', request: 'I have a big adventure tomorrow. A sweet dreams potion would be lovely.', purpose: 'Brings wonderfully silly dreams', art: 'lavender-dragon' },
  { id: 'sunshine', name: 'Pocket sunshine', subtitle: 'A bright spot on a rainy day', color: '#dcaf67', amounts: { moonwater: 36, honey: 45, mint: 20 }, reward: 18, customer: 'Hazel', request: 'It is raining at our picnic! Can you bottle a little pocket sunshine?', purpose: 'Warms up rainy picnics', art: 'rabbit' },
  { id: 'bravery', name: 'Brave little brew', subtitle: 'A warm sip of courage', color: '#a08bb8', amounts: { moonberries: 45, honey: 30, mint: 24 }, reward: 18, customer: 'Fern', request: 'I am singing at the forest fair. A brave little brew might help my butterflies!', purpose: 'Helps butterflies settle', art: 'mushroom-frog' },
  { id: 'dew', name: 'Morning dew', subtitle: 'Fresh as a forest morning', color: '#7faeaf', amounts: { moonwater: 45, moonberries: 24, mint: 50 }, reward: 18, customer: 'Pip', request: 'My wings are still a little sleepy. Morning dew will get me ready to explore!', purpose: 'Wakes up sleepy wings', art: 'lavender-dragon' },
];
export const FAMILIARS = [
  { id: 'clover', name: 'Clover', species: 'Moss kitten', art: 'moss-kitten', cost: 0, description: 'A curious little companion with a very green paw.', perk: 'Loves moonbeam tonic', greeting: 'Every great potion starts with a little patience.', lines: ['Purr-fectly measured!', 'I believe in you. And snacks.', 'A little practice makes a lot of magic.', 'Shall we make something wonderful?'] },
  { id: 'fern', name: 'Fern', species: 'Mushroom frog', art: 'mushroom-frog', cost: 180, description: 'Small, bouncy, and always ready to cheer you on.', perk: 'Loves garden giggles', greeting: 'One scoop at a time. You have got this!', lines: ['That deserves a happy hop!', 'You make this shop feel like home.', 'My mushroom hat says you can do it.', 'The garden is rooting for you!'] },
  { id: 'pip', name: 'Pip', species: 'Pocket dragon', art: 'lavender-dragon', cost: 450, description: 'A tiny dragon with a warm heart and sleepy wings.', perk: 'Loves sweet dreams', greeting: 'Let us cook up a little magic together.', lines: ['A tiny roar for a wonderful alchemist!', 'Your potions give me happy wings.', 'I could warm the kettle. Just a little.', 'Another cozy adventure?'] },
];
export const DECORATIONS = [
  { id: 'herbs', name: 'A bundle of green', description: 'Fresh garden herbs, ready to hang and dry.', cost: 16, art: 'decor-herbs' },
  { id: 'plants', name: 'Window fern', description: 'A leafy little friend to catch the sunlight.', cost: 24, art: 'decor-plant' },
  { id: 'lantern', name: 'Firefly lantern', description: 'A warm glow for long storybook evenings.', cost: 36, art: 'decor-lantern' },
  { id: 'garland', name: 'Moon & star garland', description: 'Little wonders strung across the room.', cost: 40, icon: 'sparkles' },
  { id: 'rug', name: 'Moonberry rug', description: 'A soft woven circle for tiny paws.', cost: 48, art: 'decor-rug' },
  { id: 'painting', name: 'A moonlit view', description: 'A little landscape to dream about.', cost: 60, art: 'decor-painting' },
  { id: 'bed', name: 'Cloud-soft pet bed', description: 'The best place for an afternoon nap.', cost: 72, art: 'decor-bed' },
  { id: 'shelf', name: 'Potion shelf', description: 'A small shelf for your favorite brews.', cost: 84, art: 'decor-potion-shelf' },
  { id: 'tea', name: 'Tea for two', description: 'A little table for you and your familiar.', cost: 100, art: 'decor-tea-table' },
  { id: 'bookshelf', name: 'Storybook shelves', description: 'A home for books and future adventures.', cost: 120, art: 'decor-bookshelf' },
];

export const blankMixture = () => Object.fromEntries(INGREDIENTS.map(i => [i.id, 0]));
export const emptyBrew = () => ({ lots: [], undoDepth: 0 });
export const newSave = () => resetPuzzle({ version: 4, coins: 0, completed: 0, owned: ['clover'], active: 'clover', decorations: [], hiddenDecorations: [], settings: { difficulty: 'auto', visualHints: false, sound: false }, stock: {}, brew: emptyBrew(), supplyCompleted: 0 });
export const puzzleStock = save => generatePuzzleStock(currentOrder(save));
export function resetPuzzle(save) {
  return { ...save, puzzleId: currentOrder(save).id, stock: puzzleStock(save), brew: emptyBrew() };
}
export function setDifficulty(save, difficulty) {
  if (!['auto', 'easy', 'standard', 'challenge'].includes(difficulty) || save.settings.difficulty === difficulty) return save;
  return resetPuzzle({ ...save, settings: { ...save.settings, difficulty } });
}
const validIngredient = id => INGREDIENTS.some(i => i.id === id);
const validInteger = (n, max = 1_000_000) => Number.isSafeInteger(n) && n >= 0 && n <= max;
const copyStock = stock => Object.fromEntries(INGREDIENTS.map(i => [i.id, { ...stock[i.id] }]));
const addStock = (stock, ingredient, units, count = 1) => { stock[ingredient][units] = (stock[ingredient][units] || 0) + count; };
export function mixtureFor(save) {
  const mixture = blankMixture();
  for (const lot of save.brew.lots) mixture[lot.ingredient] += lot.units;
  return mixture;
}
export function stockTotal(save, ingredient) {
  return Object.entries(save.stock[ingredient]).reduce((total, [units, count]) => total + Number(units) * count, 0);
}
export function sanitizeSave(value) {
  const base = newSave();
  if (!value || typeof value !== 'object' || ![1, 2, 3, 4].includes(value.version)) return base;
  base.coins = validInteger(value.coins) ? value.coins : 0;
  base.completed = validInteger(value.completed) ? value.completed : 0;
  base.owned = ['clover', ...FAMILIARS.filter(p => p.id !== 'clover' && Array.isArray(value.owned) && value.owned.includes(p.id)).map(p => p.id)];
  base.active = base.owned.includes(value.active) ? value.active : 'clover';
  base.decorations = DECORATIONS.filter(d => Array.isArray(value.decorations) && value.decorations.includes(d.id)).map(d => d.id);
  base.hiddenDecorations = base.decorations.filter(id => Array.isArray(value.hiddenDecorations) && value.hiddenDecorations.includes(id));
  base.settings.difficulty = ['auto', 'easy', 'standard', 'challenge'].includes(value.settings?.difficulty) ? value.settings.difficulty : ['scholar', 'growing'].includes(value.settings?.difficulty) ? 'challenge' : 'standard';
  base.settings.visualHints = value.version >= 2 && value.settings?.visualHints === true;
  base.settings.sound = value.settings?.sound === true;
  base.supplyCompleted = validInteger(value.supplyCompleted) ? value.supplyCompleted : 0;
  if (value.version < 4) return resetPuzzle(base);
  base.puzzleId = value.puzzleId;
  if (value.stock && typeof value.stock === 'object' && !Array.isArray(value.stock)) {
    base.stock = Object.fromEntries(INGREDIENTS.map(i => [i.id, Object.fromEntries(Object.entries(value.stock[i.id] || {}).filter(([units, count]) => /^\d+$/.test(units) && validInteger(Number(units), CAPACITY) && Number(units) > 0 && validInteger(count) && count > 0))]));
  }
  if (Array.isArray(value.brew?.lots)) {
    let total = 0;
    base.brew.lots = value.brew.lots.slice(0, CAPACITY).filter(lot => {
      if (!lot || !validIngredient(lot.ingredient) || !validInteger(lot.units, CAPACITY) || !lot.units || total + lot.units > CAPACITY) return false;
      total += lot.units; return true;
    }).map(lot => ({ ingredient: lot.ingredient, units: lot.units }));
    base.brew.undoDepth = validInteger(value.brew.undoDepth, CAPACITY) ? Math.min(value.brew.undoDepth, base.brew.lots.length) : 0;
  }
  const generated = puzzleStock(base);
  const mixture = mixtureFor(base);
  const validAttempt = base.puzzleId === currentOrder(base).id && INGREDIENTS.every(i => {
    const expected = Object.entries(generated[i.id]).reduce((sum, [units, count]) => sum + Number(units) * count, 0);
    return stockTotal(base, i.id) + mixture[i.id] === expected;
  });
  return validAttempt ? base : resetPuzzle(base);
}
export function loadSave(storage) {
  try { return { save: sanitizeSave(JSON.parse(storage.getItem(SAVE_KEY))), available: true }; }
  catch { return { save: newSave(), available: false }; }
}
export function persistSave(storage, save) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(save)); return true; } catch { return false; }
}
export function difficultyFor(save) {
  const selected = save.settings.difficulty;
  const id = selected === 'auto' ? (save.completed < AUTO_THRESHOLDS.standard ? 'easy' : save.completed < AUTO_THRESHOLDS.challenge ? 'standard' : 'challenge') : selected;
  return LEVELS[id] || LEVELS.standard;
}
export function currentOrder(save) {
  const baseRecipe = RECIPES[save.completed % RECIPES.length];
  const level = difficultyFor(save);
  const amounts = level.id === 'easy' ? Object.fromEntries(Object.keys(baseRecipe.amounts).map((ingredient, index) => [ingredient, [30, 45, 60][(save.completed + index) % 3]])) : baseRecipe.amounts;
  const recipe = { ...baseRecipe, amounts };
  const batch = level.id === 'challenge' ? [2, 3, 2, 3][save.completed % 4] : 1;
  return { id: `p4-${save.completed}-${save.settings.difficulty}`, recipe, level, batch, reward: level.potionCoins + (Object.keys(amounts).length - 2) * 2 + (batch - 1) * 4, target: Object.fromEntries(INGREDIENTS.map(i => [i.id, (recipe.amounts[i.id] || 0) * batch])) };
}
export function assessMixture(mixture, order) {
  const differences = INGREDIENTS.map(i => ({ ingredient: i, actual: mixture[i.id] || 0, needed: order.target[i.id] })).filter(i => i.actual !== i.needed);
  return { correct: differences.length === 0, differences };
}
export function pour(save, ingredient, units) {
  if (!validIngredient(ingredient) || !validInteger(units, CAPACITY) || !units || !(save.stock[ingredient][units] > 0)) return save;
  const total = save.brew.lots.reduce((n, lot) => n + lot.units, 0);
  if (total + units > CAPACITY) return save;
  const stock = copyStock(save.stock); stock[ingredient][units]--;
  if (!stock[ingredient][units]) delete stock[ingredient][units];
  return { ...save, stock, brew: { lots: [...save.brew.lots, { ingredient, units }], undoDepth: save.brew.undoDepth + 1 } };
}
export function undoPour(save) {
  if (!save.brew.undoDepth) return save;
  const lots = save.brew.lots.slice(); const lot = lots.pop(); const stock = copyStock(save.stock);
  addStock(stock, lot.ingredient, lot.units);
  return { ...save, stock, brew: { lots, undoDepth: save.brew.undoDepth - 1 } };
}
export function returnMixture(save) {
  if (!save.brew.lots.length) return save;
  const stock = copyStock(save.stock);
  for (const lot of save.brew.lots) addStock(stock, lot.ingredient, lot.units);
  return { ...save, stock, brew: emptyBrew() };
}
export function recoverPortion(save, ingredient, remove, remaining) {
  if (!validIngredient(ingredient) || !validInteger(remove, CAPACITY) || !remove || !validInteger(remaining, CAPACITY)) return { save, correct: false, reason: 'invalid' };
  const before = mixtureFor(save)[ingredient];
  if (remove > before) return { save, correct: false, reason: 'too-much' };
  if (before - remove !== remaining) return { save, correct: false, reason: 'subtraction' };
  let toRemove = remove; const lots = save.brew.lots.map(lot => ({ ...lot }));
  for (let n = lots.length - 1; n >= 0 && toRemove; n--) {
    if (lots[n].ingredient !== ingredient) continue;
    const taken = Math.min(lots[n].units, toRemove); lots[n].units -= taken; toRemove -= taken;
  }
  const stock = copyStock(save.stock); addStock(stock, ingredient, remove);
  return { save: { ...save, stock, brew: { lots: lots.filter(lot => lot.units > 0), undoDepth: 0 } }, correct: true, before, remaining, removed: remove };
}
export function completeOrder(save, orderId) {
  const order = currentOrder(save);
  if (order.id !== orderId || !assessMixture(mixtureFor(save), order).correct) return { save, earned: 0 };
  return { save: resetPuzzle({ ...save, coins: save.coins + order.reward, completed: save.completed + 1 }), earned: order.reward };
}
export function findCombination(portions, target) {
  if (!validInteger(target, CAPACITY)) return null;
  const paths = Array(target + 1).fill(null); paths[0] = [];
  for (const [size, count] of Object.entries(portions)) {
    const units = Number(size);
    if (!validInteger(units, CAPACITY) || !units || !validInteger(count)) continue;
    for (let copy = 0; copy < Math.min(count, Math.floor(target / units)); copy++) {
      for (let sum = target; sum >= units; sum--) if (!paths[sum] && paths[sum - units]) paths[sum] = [...paths[sum - units], units];
    }
  }
  return paths[target];
}
export function canFinishOrder(save) {
  const mixture = mixtureFor(save), order = currentOrder(save);
  return INGREDIENTS.every(i => mixture[i.id] <= order.target[i.id] && findCombination(save.stock[i.id], order.target[i.id] - mixture[i.id]) !== null);
}
export function adopt(save, id) {
  const familiar = FAMILIARS.find(p => p.id === id);
  if (!familiar || save.owned.includes(id) || save.coins < familiar.cost) return save;
  return { ...save, coins: save.coins - familiar.cost, owned: [...save.owned, id], active: id };
}
export function decorate(save, id) {
  const decoration = DECORATIONS.find(d => d.id === id);
  if (!decoration || save.decorations.includes(id) || save.coins < decoration.cost) return save;
  return { ...save, coins: save.coins - decoration.cost, decorations: [...save.decorations, id] };
}

export function toggleDecoration(save, id) {
  if (!save.decorations.includes(id)) return save;
  const hidden = save.hiddenDecorations || [];
  return { ...save, hiddenDecorations: hidden.includes(id) ? hidden.filter(item => item !== id) : [...hidden, id] };
}

export const SUPPLY_SKILLS = ['arithmetic', 'algebra', 'geometry'];
export function currentSupplyTask(save, skill = 'arithmetic') {
  if (!SUPPLY_SKILLS.includes(skill)) skill = 'arithmetic';
  const n = save.supplyCompleted, variant = n % 3, level = difficultyFor(save);
  const context = { id: `${n}-${skill}-${level.id}`, skill, level, reward: level.errandCoins };
  if (skill === 'arithmetic') {
    const trays = level.id === 'easy' ? 2 + n % 4 : 12 + n % (level.id === 'challenge' ? 12 : 9);
    const bottles = level.id === 'easy' ? 3 + Math.floor(n / 3) % 4 : level.id === 'challenge' ? 11 + Math.floor(n / 3) % 9 : 4 + Math.floor(n / 3) % 6;
    if (variant === 1) return { ...context, title: 'Pack the delivery', story: 'Hazel is sorting a shipment for the forest shops.', prompt: `There are ${trays * bottles} ingredient bottles. Each crate holds ${bottles}. How many crates do we need?`, expression: `${trays * bottles} ÷ ${bottles} = ?`, answer: trays, unit: 'crates', hint: 'Think about the multiplication fact that makes the total number of bottles.' };
    const reserved = level.id === 'challenge' && variant === 2 ? 7 + n % 8 : 0;
    return { ...context, title: 'Count the shipment', story: 'Hazel needs a hand checking the ingredient delivery.', prompt: `There are ${trays} trays with ${bottles} ingredient bottles on each tray.${reserved ? ` We reserve ${reserved} bottles for the village healer. How many are left for the other shops?` : ' How many bottles are there altogether?'}`, expression: `${trays} × ${bottles}${reserved ? ` − ${reserved}` : ''} = ?`, answer: trays * bottles - reserved, unit: 'bottles', hint: reserved ? 'Multiply the trays by the bottles on each tray. Then subtract the bottles reserved for the healer.' : 'Multiply the trays by the bottles on one tray. You can split a factor into easier parts.' };
  }
  if (skill === 'algebra') {
    const extra = 3 + n % 5;
    if (level.id === 'easy') {
      const x = 4 + n % 8;
      return { ...context, title: 'Restore a lost formula', story: 'Pip spilled moonwater on a page. One number is missing.', prompt: `A bundle has x bottles. Add ${extra} loose bottles and there are ${x + extra} altogether. What is x?`, expression: `x + ${extra} = ${x + extra}`, answer: x, unit: 'bottles', hint: `Subtract the ${extra} loose bottles from the total.` };
    }
    if (level.id === 'challenge') {
      const x = 12 + n % 13, multiplier = 3 + n % 4;
      return { ...context, title: 'Restore a lost formula', story: 'Pip needs the missing number from a more complicated recipe.', prompt: `Each of ${multiplier} crates holds x blue bottles and ${extra} green bottles. There are ${multiplier * (x + extra)} bottles in all. How many blue bottles are in each crate?`, expression: `${multiplier}(x + ${extra}) = ${multiplier * (x + extra)}`, answer: x, unit: 'blue bottles per crate', hint: `Divide the total equally among ${multiplier} crates. Then subtract the ${extra} green bottles in one crate.` };
    }
    const x = 8 + n % 12, multiplier = 2 + n % 3;
    return { ...context, title: 'Restore a lost formula', story: 'Pip spilled moonwater on a page of the recipe book. One number is missing.', prompt: `The missing number is x. ${multiplier} identical bundles plus ${extra} loose bottles make ${multiplier * x + extra} bottles. What is x?`, expression: `${multiplier}x + ${extra} = ${multiplier * x + extra}`, answer: x, unit: 'bottles per bundle', hint: `Subtract the ${extra} loose bottles, then divide what is left into ${multiplier} equal bundles.` };
  }
  const width = level.id === 'easy' ? 2 + n % 4 : level.id === 'challenge' ? 6 + n % 7 : 3 + n % 5;
  const height = level.id === 'easy' ? 2 + Math.floor(n / 2) % 3 : level.id === 'challenge' ? 4 + Math.floor(n / 2) % 5 : 2 + Math.floor(n / 2) % 4;
  const depth = level.id === 'challenge' ? 3 + n % 3 : 2 + n % 2;
  const volume = variant === 2 && level.id !== 'easy';
  const dimensions = { width, height, depth: volume ? depth : 1 };
  if (variant === 1) return { ...context, dimensions, title: 'A fence for the herb garden', story: 'Fern is making a safe little garden for the mint.', prompt: `The rectangular herb bed is ${width} m long and ${height} m wide. How many meters of fencing go all the way around it?`, expression: `Perimeter of a ${width} m × ${height} m rectangle`, answer: 2 * (width + height), unit: 'meters', hint: 'Add all four sides. A rectangle has two long sides and two short sides.' };
  if (volume) return { ...context, dimensions, title: 'Fill the enchanted planter', story: 'Fern needs soil for a new rectangular planter.', prompt: `The planter is ${width} m long, ${height} m wide, and ${depth} m deep. What volume of soil fills it?`, expression: `${width} m × ${height} m × ${depth} m`, answer: width * height * depth, unit: 'cubic meters', hint: 'Find the area of the base, then multiply by the number of one-meter layers.' };
  return { ...context, dimensions, title: 'Plan an herb bed', story: 'Fern is finding room to grow more potion ingredients.', prompt: `The rectangular garden is ${width} m long and ${height} m wide. What is its area?`, expression: `Area of a ${width} m × ${height} m rectangle`, answer: width * height, unit: 'square meters', hint: 'Count the square-meter spaces in each row, then multiply by the number of rows.' };
}
export function completeSupplyTask(save, skill, taskId, answer) {
  if (!SUPPLY_SKILLS.includes(skill)) return { save, correct: false };
  const task = currentSupplyTask(save, skill);
  if (task.id !== taskId || parseCups(answer, 10000) !== task.answer * CUP) return { save, correct: false };
  const earned = task.reward;
  return { save: { ...save, coins: save.coins + earned, supplyCompleted: save.supplyCompleted + 1 }, correct: true, earned };
}
