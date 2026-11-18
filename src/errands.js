import { LEVELS } from './puzzles.js';

// Saved cards contain only generation inputs. Wording, mathematics, and diagrams
// are rebuilt together so an imported answer cannot change the reward rules.
export const ERRAND_KINDS = {
  shipment: 'arithmetic', crates: 'arithmetic', change: 'arithmetic', time: 'arithmetic', stockFraction: 'arithmetic',
  missingAdd: 'algebra', missingGroup: 'algebra', formula: 'algebra', pattern: 'algebra', missingSide: 'geometry',
  area: 'geometry', perimeter: 'geometry', triangle: 'geometry', planting: 'geometry', remaining: 'geometry', volume: 'geometry',
};
const kinds = Object.keys(ERRAND_KINDS);
const levelIds = Object.keys(LEVELS);
function randomFor(seed) {
  let value = seed >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}
export function createErrandBoard(level, completed = 0) {
  return ['shipment', 'missingAdd', 'planting'].map((kind, slot) => ({
    serial: completed + slot, seed: (Math.imul(completed + slot + 1, 2654435761) >>> 0), kind, level: level.id,
  }));
}
export function readErrandBoard(raw, level, completed) {
  const valid = Array.isArray(raw) && raw.length === 3 && raw.every(card => card &&
    Number.isSafeInteger(card.serial) && card.serial >= 0 && card.serial <= completed + 2 &&
    Number.isSafeInteger(card.seed) && card.seed >= 0 && card.seed <= 0xffffffff &&
    kinds.includes(card.kind) && levelIds.includes(card.level)) &&
    new Set(raw.map(card => card.serial)).size === 3 && new Set(raw.map(card => card.kind)).size === 3;
  return valid ? raw.map(({serial, seed, kind, level}) => ({serial, seed, kind, level})) : createErrandBoard(level, completed);
}
export function replaceErrand(board, slot, level, completed, random = Math.random) {
  const choices = kinds.filter(kind => !board.some(card => card.kind === kind));
  const next = { serial: completed + 3, seed: Math.floor(random() * 4294967296), kind: choices[Math.floor(random() * choices.length)], level: level.id };
  return board.map((card, i) => i === slot ? next : card);
}
export function taskForCard(card) {
  const level = LEVELS[card.level], rank = level.id === 'easy' ? 0 : level.id === 'standard' ? 1 : 2;
  const random = randomFor(card.seed), pick = (low, high) => low + Math.floor(random() * (high - low + 1));
  const a = pick(...[[2, 5], [6, 15], [12, 25]][rank]);
  const b = pick(...[[2, 5], [3, 9], [6, 12]][rank]);
  const extra = pick(2, rank === 2 ? 25 : 9);
  const context = { id: `errand-${card.serial}-${card.seed}-${card.kind}-${level.id}`, kind: card.kind, skill: ERRAND_KINDS[card.kind], level, reward: level.errandCoins };
  const make = (title, story, prompt, expression, answer, unit, hint, details = {}) => ({ ...context, title, story, prompt, expression, answer, unit, hint, ...details });
  const delivery = 'Hazel is getting supplies ready for the village.';
  const formula = 'Pip found a smudged page in the recipe book.';
  const garden = 'Fern is tending the village herb garden.';
  switch (card.kind) {
    case 'shipment': {
      const reserved = rank === 2 ? extra : 0;
      return make('Count the shipment', delivery, `${a} trays carry ${b} bottles each.${reserved ? ` Keep ${reserved} for the healer. How many go to the other shops?` : ' How many bottles are there altogether?'}`, `${a} × ${b}${reserved ? ` − ${reserved}` : ''} = ?`, a * b - reserved, 'bottles', 'Multiply the trays by the bottles on each tray. Then subtract any bottles kept for the healer.', { values: { a, b, reserved } });
    }
    case 'crates': return make('Pack the delivery', delivery, `${a * b} bottles go into crates of ${b}. How many full crates can Hazel pack?`, `${a * b} ÷ ${b} = ?`, a, 'crates', 'Find how many groups of this size make the total.', { values: { total: a * b, perCrate: b } });
    case 'change': {
      const cost = a * b, paid = Math.ceil(cost / 10) * 10 + 10;
      return make('Market change', delivery, `Hazel buys ${a} seed packets for ${b} coins each and pays ${paid} coins. How much change should she get?`, `${paid} − (${a} × ${b}) = ?`, paid - cost, 'coins', 'Work out the cost of all the packets, then subtract it from the payment.', { values: { a, b, paid } });
    }
    case 'time': {
      const start = 8 * 60 + pick(0, 3) * 15, duration = pick(2, rank === 2 ? 9 : 5) * 15, end = start + duration;
      const clock = minutes => `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
      return make('Time the delivery', delivery, `The cart leaves at ${clock(start)} in the morning and arrives at ${clock(end)}. How many minutes did the trip take?`, `${clock(start)} → ${clock(end)}`, duration, 'minutes', 'Count forward to the next hour, then count the remaining minutes.', { values: { start, end } });
    }
    case 'stockFraction': {
      const denominator = pick(2, [3, 5, 6][rank]), numerator = rank === 2 ? pick(1, denominator - 1) : 1, total = a * denominator;
      return make('Share the seed packets', delivery, `${numerator}/${denominator} of ${total} seed packets go to the school garden. How many packets is that?`, `${numerator}/${denominator} of ${total}`, a * numerator, 'packets', `Split the total into ${denominator} equal groups, then take ${numerator}.`, { values: { total, numerator, denominator } });
    }
    case 'missingAdd': return make('Restore a lost number', formula, `A basket has x berries. Add ${extra} and there are ${a + extra}. How many were in the basket?`, `x + ${extra} = ${a + extra}`, a, 'berries', 'Subtract the added berries from the total.', { values: { total: a + extra, extra } });
    case 'missingGroup': return make('Find the bundle size', formula, `${b} equal bundles hold ${a * b} herbs. How many herbs are in each bundle?`, `${b} × x = ${a * b}`, a, 'herbs per bundle', 'Divide the total by the number of equal bundles.', { values: { groups: b, total: a * b } });
    case 'formula': {
      const total = rank === 2 ? b * (a + extra) : b * a + extra;
      return make('Mend the recipe', formula, rank === 2 ? `${b} jars each contain x blue beads and ${extra} green beads. There are ${total} beads in all. How many blue beads are in each jar?` : `${b} bundles of x herbs and ${extra} loose herbs make ${total}. How many herbs are in one bundle?`, rank === 2 ? `${b}(x + ${extra}) = ${total}` : `${b}x + ${extra} = ${total}`, a, rank === 2 ? 'blue beads per jar' : 'herbs per bundle', rank === 2 ? 'Divide into equal jars first, then subtract the green beads in one jar.' : 'Subtract the loose herbs first, then divide into equal bundles.', { values: { groups: b, extra, total, groupedExtra: rank === 2 } });
    }
    case 'pattern': {
      const factor = rank === 2 ? pick(2, 3) : null, sequence = [a];
      for (let i = 0; i < 4; i++) sequence.push(factor ? sequence.at(-1) * factor : sequence.at(-1) + b);
      return make('Follow the growing spell', formula, `The same rule connects every number. ${factor ? `Multiply by ${factor}` : `Add ${b}`} each time. Which number comes next?`, `${sequence.slice(0, 4).join(', ')}, ?`, sequence[4], 'number', 'Apply the same rule once more to the last number.', { values: { sequence, step: factor || b, multiply: !!factor } });
    }
  }
  let width = pick(...[[2, 4], [3, 7], [6, 12]][rank]);
  let height = pick(2, rank === 2 ? 8 : 4);
  if (card.kind === 'triangle') width *= 2;
  const denominator = pick(2, [3, 5, 6][rank]), numerator = rank === 2 ? pick(1, denominator - 1) : 1;
  if (['planting', 'remaining'].includes(card.kind)) {
    // Easy starts with halves; Standard includes 2×3 m plots with one third planted.
    width = rank === 0 ? pick(2, 3) : rank === 1 ? pick(2, 4) : pick(3, 5);
    height = denominator;
  }
  const area = width * height, dimensions = { width, height, depth: 1, shape: card.kind === 'triangle' ? 'triangle' : 'rectangle' };
  const details = { dimensions };
  switch (card.kind) {
    case 'triangle': return make('A triangular herb bed', garden, `A triangular bed has a base of ${width} m and a perpendicular height of ${height} m. What is its area?`, `Triangle · base ${width} m · height ${height} m`, area / 2, 'square meters', 'A matching triangle completes a rectangle. Find the rectangle area, then take half.', details);
    case 'planting': case 'remaining': {
      dimensions.fraction = { numerator, denominator };
      const remaining = card.kind === 'remaining';
      return make(remaining ? 'Room for more herbs' : 'Plant part of the garden', garden, `The bed is ${width} m by ${height} m. Fern plants ${numerator}/${denominator} of it with mint. ${remaining ? 'What area is still unplanted?' : 'What area is planted with mint?'}`, `${numerator}/${denominator} planted`, area * (remaining ? denominator - numerator : numerator) / denominator, 'square meters', `Find the whole bed's area. Divide it into ${denominator} equal parts${numerator > 1 ? ` and take ${numerator}` : ''}.${remaining ? ' Subtract the planted area from the whole.' : ''}`, details);
    }
    case 'perimeter': return make('Fence the herb garden', garden, `A rectangular bed is ${width} m by ${height} m. How many meters of fencing go all the way around?`, `${width} m × ${height} m rectangle`, 2 * (width + height), 'meters', 'Add all four sides. There are two long sides and two short sides.', details);
    case 'missingSide':
      dimensions.hideHeight = true;
      return make('The missing garden length', garden, `A rectangular bed has an area of ${area} m² and is ${width} m long. How wide is it?`, `${width} × ? = ${area} m²`, height, 'meters', 'Divide the area by the known length.', details);
    case 'volume': {
      const depth = rank === 0 ? 1 : pick(2, rank === 2 ? 5 : 3);
      dimensions.depth = depth;
      return make('Fill the planter', garden, `A planter is ${width} m long, ${height} m wide, and ${depth} m deep. What volume of soil fills it?`, `${width} m × ${height} m × ${depth} m`, area * depth, 'cubic meters', 'Find the base area, then multiply by the depth.', details);
    }
    default: return make('Plan an herb bed', garden, `A rectangular bed is ${width} m long and ${height} m wide. What is its area?`, `${width} m × ${height} m rectangle`, area, 'square meters', 'Multiply the length by the width.', details);
  }
}
