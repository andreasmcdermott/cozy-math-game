export const SAVE_KEY = 'paws-potions-v1';
export const INGREDIENTS = [
  { id: 'moonwater', name: 'Moonwater', color: '#79b6cf', art: 'moonwater', noun: 'moonwater' },
  { id: 'moonberries', name: 'Moonberries', color: '#a87eb8', art: 'moonberries', noun: 'moonberry juice' },
  { id: 'honey', name: 'Sunshine honey', color: '#e1ae54', art: 'honey', noun: 'honey' },
  { id: 'mint', name: 'Garden mint', color: '#85ad86', art: 'mint', noun: 'mint tea' },
];
export const RECIPES = [
  { id: 'moonbeam', name: 'Moonbeam tonic', subtitle: 'A little bottled moonlight', color: '#ab8ec1', amounts: { moonwater: 2, moonberries: 1, honey: 1 }, reward: 12, customer: 'Hazel', request: 'My reading nook could use a little glow. One moonbeam tonic, please!', purpose: 'Makes a cozy reading light', art: 'rabbit' },
  { id: 'garden', name: 'Garden giggles', subtitle: 'For very happy houseplants', color: '#87ab85', amounts: { moonwater: 2, mint: 2 }, reward: 10, customer: 'Fern', request: 'My little seedlings need some encouragement. Could you make garden giggles?', purpose: 'Helps sleepy seeds sprout', art: 'mushroom-frog' },
  { id: 'dream', name: 'Sweet dreams', subtitle: 'Cloud-soft and sleepy', color: '#b29ac7', amounts: { moonwater: 2, moonberries: 2 }, reward: 10, customer: 'Pip', request: 'I have a big adventure tomorrow. A sweet dreams potion would be lovely.', purpose: 'Brings wonderfully silly dreams', art: 'lavender-dragon' },
  { id: 'sunshine', name: 'Pocket sunshine', subtitle: 'A bright spot on a rainy day', color: '#dcaf67', amounts: { moonwater: 1, honey: 2, mint: 1 }, reward: 12, customer: 'Hazel', request: 'It is raining at our picnic! Can you bottle a little pocket sunshine?', purpose: 'Warms up rainy picnics', art: 'rabbit' },
  { id: 'bravery', name: 'Brave little brew', subtitle: 'A warm sip of courage', color: '#a08bb8', amounts: { moonberries: 2, honey: 1, mint: 1 }, reward: 12, customer: 'Fern', request: 'I am singing at the forest fair. A brave little brew might help my butterflies!', purpose: 'Helps butterflies settle', art: 'mushroom-frog' },
  { id: 'dew', name: 'Morning dew', subtitle: 'Fresh as a forest morning', color: '#7faeaf', amounts: { moonwater: 1, moonberries: 1, mint: 2 }, reward: 12, customer: 'Pip', request: 'My wings are still a little sleepy. Morning dew will get me ready to explore!', purpose: 'Wakes up sleepy wings', art: 'lavender-dragon' },
];
export const FAMILIARS = [
  { id: 'clover', name: 'Clover', species: 'Moss kitten', art: 'moss-kitten', cost: 0, description: 'A curious little companion with a very green paw.', perk: 'Loves moonbeam tonic', greeting: 'Every great potion starts with a little patience.', lines: ['Purr-fectly measured!', 'I believe in you. And snacks.', 'A little practice makes a lot of magic.', 'Shall we make something wonderful?'] },
  { id: 'fern', name: 'Fern', species: 'Mushroom frog', art: 'mushroom-frog', cost: 24, description: 'Small, bouncy, and always ready to cheer you on.', perk: 'Loves garden giggles', greeting: 'One scoop at a time. You have got this!', lines: ['That deserves a happy hop!', 'You make this shop feel like home.', 'My mushroom hat says you can do it.', 'The garden is rooting for you!'] },
  { id: 'pip', name: 'Pip', species: 'Pocket dragon', art: 'lavender-dragon', cost: 48, description: 'A tiny dragon with a warm heart and sleepy wings.', perk: 'Loves sweet dreams', greeting: 'Let us cook up a little magic together.', lines: ['A tiny roar for a wonderful alchemist!', 'Your potions give me happy wings.', 'I could warm the kettle. Just a little.', 'Another cozy adventure?'] },
];
export const DECORATIONS = [
  { id: 'plants', name: 'A little more green', description: 'A leafy friend for your shop window.', cost: 16, icon: 'leaf' },
  { id: 'garland', name: 'Moon & star garland', description: 'A string of little wonders above the counter.', cost: 28, icon: 'sparkles' },
];
export const blankMixture = () => Object.fromEntries(INGREDIENTS.map(i => [i.id, 0]));
export const newSave = () => ({ version: 1, coins: 0, completed: 0, owned: ['clover'], active: 'clover', decorations: [], settings: { difficulty: 'gentle', visualHints: true, sound: false } });
export function sanitizeSave(value) {
  const base = newSave();
  if (!value || typeof value !== 'object' || value.version !== 1) return base;
  const integer = (n, max = 1_000_000) => Number.isSafeInteger(n) && n >= 0 && n <= max;
  base.coins = integer(value.coins) ? value.coins : 0;
  base.completed = integer(value.completed) ? value.completed : 0;
  base.owned = ['clover', ...FAMILIARS.filter(p => p.id !== 'clover' && Array.isArray(value.owned) && value.owned.includes(p.id)).map(p => p.id)];
  base.active = base.owned.includes(value.active) ? value.active : 'clover';
  base.decorations = DECORATIONS.filter(d => Array.isArray(value.decorations) && value.decorations.includes(d.id)).map(d => d.id);
  base.settings.difficulty = value.settings?.difficulty === 'growing' ? 'growing' : 'gentle';
  base.settings.visualHints = value.settings?.visualHints !== false;
  base.settings.sound = value.settings?.sound === true;
  return base;
}
export function loadSave(storage) {
  try { return { save: sanitizeSave(JSON.parse(storage.getItem(SAVE_KEY))), available: true }; }
  catch { return { save: newSave(), available: false }; }
}
export function persistSave(storage, save) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(save)); return true; } catch { return false; }
}
export function formatCups(units) {
  if (!Number.isSafeInteger(units) || units < 0) throw new Error('Cup quantities must be nonnegative quarter units');
  const whole = Math.floor(units / 4);
  const fraction = ['', '¼', '½', '¾'][units % 4];
  return `${whole || ''}${whole && fraction ? ' ' : ''}${fraction}` || '0';
}
export const cupLabel = units => `${formatCups(units)} ${units > 0 && units <= 4 ? 'cup' : 'cups'}`;
export function currentOrder(save) {
  const recipe = RECIPES[save.completed % RECIPES.length];
  const batch = save.settings.difficulty === 'growing' ? [1, 2, 2, 3][save.completed % 4] : 1;
  return { id: `${save.completed}-${save.settings.difficulty}`, recipe, batch, reward: recipe.reward + (batch - 1) * 4, target: Object.fromEntries(INGREDIENTS.map(i => [i.id, (recipe.amounts[i.id] || 0) * batch])) };
}
export function assessMixture(mixture, order) {
  const differences = INGREDIENTS.map(i => ({ ingredient: i, actual: mixture[i.id] || 0, needed: order.target[i.id] })).filter(i => i.actual !== i.needed);
  return { correct: differences.length === 0, differences };
}
export function pour(mixture, ingredient, units) {
  if (!INGREDIENTS.some(i => i.id === ingredient) || ![1, 2, 4].includes(units)) return mixture;
  const total = Object.values(mixture).reduce((a, b) => a + b, 0);
  if (total + units > 24) return mixture;
  return { ...mixture, [ingredient]: mixture[ingredient] + units };
}
export function completeOrder(save, mixture, orderId) {
  const order = currentOrder(save);
  if (order.id !== orderId || !assessMixture(mixture, order).correct) return { save, earned: 0 };
  return { save: { ...save, coins: save.coins + order.reward, completed: save.completed + 1 }, earned: order.reward };
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
