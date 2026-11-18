// Generate the solution first, then add distractors. A tray never depends on
// the player's previous choices, coins, or optional errand completion.
const PORTIONS = [5, 6, 10, 12, 15, 20, 24, 25, 30, 35, 36, 40, 45, 50, 60];
export const LEVELS = {
  easy: { id: 'easy', label: 'Easy', sizes: [15, 30, 60], minParts: 2, maxParts: 3, decoys: 1, errandCoins: 4, potionCoins: 8 },
  standard: { id: 'standard', label: 'Standard', sizes: PORTIONS, minParts: 2, maxParts: 5, decoys: 2, errandCoins: 8, potionCoins: 16 },
  challenge: { id: 'challenge', label: 'Challenge', sizes: PORTIONS, minParts: 4, maxParts: 6, decoys: 3, errandCoins: 14, potionCoins: 26 },
};
export const AUTO_THRESHOLDS = { standard: 3, challenge: 8 };
const decompositionCache = new Map();

function decompositions(target, level) {
  const key = `${level.id}:${target}`;
  if (decompositionCache.has(key)) return decompositionCache.get(key);
  const sizes = level.sizes.filter(size => size < target);
  const solutions = [];
  function visit(remaining, start, parts) {
    if (remaining === 0) { if (parts.length >= level.minParts) solutions.push(parts); return; }
    if (parts.length === level.maxParts) return;
    for (let index = start; index < sizes.length; index++) {
      const size = sizes[index];
      if (size > remaining) break;
      if (parts.filter(part => part === size).length >= 3) continue;
      visit(remaining - size, index, [...parts, size]);
    }
  }
  visit(target, 0, []);
  const unlike = solutions.filter(parts => new Set(parts).size > 1);
  const candidates = unlike.length ? unlike : solutions;
  if (!candidates.length) throw new Error(`No multi-portion puzzle construction for ${target} ticks`);
  decompositionCache.set(key, candidates);
  return candidates;
}

function minimumParts(stock, target) {
  const best = Array(target + 1).fill(Infinity); best[0] = 0;
  for (const [size, count] of Object.entries(stock)) {
    const units = Number(size);
    for (let n = 0; n < count; n++) for (let sum = target; sum >= units; sum--) best[sum] = Math.min(best[sum], best[sum - units] + 1);
  }
  return best[target];
}

function randomFor(seed) {
  let value = 2166136261;
  for (const character of seed) value = Math.imul(value ^ character.charCodeAt(0), 16777619) >>> 0;
  return () => {
    value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
    return (value >>> 0) / 4294967296;
  };
}

export function generatePuzzleStock(order) {
  const level = order.level || LEVELS.standard;
  return Object.fromEntries(Object.entries(order.target).map(([ingredient, target]) => {
    const random = randomFor(`${order.id}:${ingredient}`);
    const stock = {};
    if (target > 0) {
      const candidates = decompositions(target, level);
      const solution = candidates[Math.floor(random() * candidates.length)];
      for (const size of solution) stock[size] = (stock[size] || 0) + 1;
    }
    const catalogue = [...level.sizes, ...(target && level.id === 'challenge' ? [target + 60] : [])].filter(size => size !== target);
    for (let n = 0; n < level.decoys; n++) {
      // A tempting decoy must not turn a 4-step Challenge into a 2-step sum.
      const safe = catalogue.filter(size => !target || level.minParts === 2 || minimumParts({ ...stock, [size]: (stock[size] || 0) + 1 }, target) >= level.minParts);
      const distinct = safe.filter(size => !stock[size]);
      const choices = distinct.length ? distinct : safe;
      const size = choices[Math.floor(random() * choices.length)];
      stock[size] = (stock[size] || 0) + 1;
    }
    return [ingredient, stock];
  }));
}
