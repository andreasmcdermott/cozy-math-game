import test from 'node:test';
import assert from 'node:assert/strict';
import { SAVE_KEY, CUP, CAPACITY, INGREDIENTS, ingredientsFor, recipesFor, startPuzzle, equipFamiliar, roomFor, decorationsFor, RECIPES, FAMILIARS, DECORATIONS, LEVELS, newSave as freshSave, sanitizeSave, loadSave, persistSave, formatCups, parseCups, difficultyFor, currentOrder, puzzleStock, resetPuzzle, setDifficulty, mixtureFor, stockTotal, pour, undoPour, returnMixture, recoverPortion, completeOrder, findCombination, canFinishOrder, currentSupplyTask, completeSupplyTask, adopt, decorate, toggleDecoration } from '../src/game.js';

const newSave = () => setDifficulty(freshSave(), 'standard');
const quantities = save => INGREDIENTS.map(i => stockTotal(save, i.id) + mixtureFor(save)[i.id]);
const firstPortion = (save, ingredient = 'moonwater') => Number(Object.keys(save.stock[ingredient])[0]);
function fillOrder(save) {
  const order = currentOrder(save);
  for (const i of INGREDIENTS) {
    const combination = findCombination(save.stock[i.id], order.target[i.id] - mixtureFor(save)[i.id]);
    assert.notEqual(combination, null, `${order.id} ${i.id} must be solvable without errands`);
    for (const units of combination) save = pour(save, i.id, units);
  }
  return save;
}
// Independent bounded-subset enumeration, separate from the generation code
// and the production solver. Tracks the fewest portions for each reachable sum.
function minimumSubset(stock, target) {
  let sums = new Map([[0, 0]]);
  for (const [size, count] of Object.entries(stock)) for (let n = 0; n < count; n++) {
    const next = new Map(sums);
    for (const [sum, used] of sums) if (sum + Number(size) <= target) next.set(sum + Number(size), Math.min(next.get(sum + Number(size)) ?? Infinity, used + 1));
    sums = next;
  }
  return sums.get(target) ?? Infinity;
}

test('exact fractions support unlike denominators, mixed values, and the 5/6 example', () => {
  assert.equal(CUP, 60); assert.equal([20, 5, 5, 10, 10].reduce((a, b) => a + b, 0), parseCups('5/6'));
  assert.equal(parseCups('1/3') + parseCups('1/6'), parseCups('1/2'));
  assert.equal(formatCups(parseCups('1/3') + parseCups('1/5')), '8/15');
  for (let units = 0; units <= CAPACITY; units++) assert.equal(parseCups(formatCups(units)), units);
  assert.equal(parseCups('1 1/2'), 90); assert.equal(parseCups('1½'), 90); assert.equal(parseCups('0.25'), 15);
  for (const value of ['', '1/0', '-1/3', '2/7', '0.333333', '2+3', '13', '<script>', 'Infinity']) assert.equal(parseCups(value), null);
  assert.throws(() => formatCups(1.5));
});

test('12,000 familiar puzzles are independently solvable with real decoys at every difficulty', () => {
  for (const active of ['clover','fern','pip']) for (const mode of ['auto', 'easy', 'standard', 'challenge']) for (let completed = 0; completed < 1000; completed++) {
    const save = startPuzzle({ ...setDifficulty(freshSave(), mode), active, owned:['clover','fern','pip'], completed, brewCounts:{[active]:completed} });
    const order = currentOrder(save), level = difficultyFor(save);
    assert.ok(Object.values(order.target).reduce((a, b) => a + b, 0) <= CAPACITY);
    for (const i of ingredientsFor(save)) {
      const target = order.target[i.id], stock = save.stock[i.id], minimum = minimumSubset(stock, target);
      assert.ok(Number.isFinite(minimum), `${order.id} ${i.id}`);
      if (target) {
        assert.equal(stock[target], undefined, 'No single portion matches the full target');
        assert.ok(stockTotal(save, i.id) > target, 'Using all portions must not solve the puzzle');
        assert.ok(minimum >= level.minParts, `${order.id} ${i.id} has a shortcut`);
        assert.ok(minimum <= level.maxParts);
        assert.ok(Object.values(stock).reduce((a, b) => a + b, 0) - minimum >= level.decoys);
      } else assert.ok(stockTotal(save, i.id) > 0);
    }
  }
});

test('600 consecutive familiar potions never require errands or restocking', () => {
  for (const active of ['clover','fern','pip']) for (const mode of ['auto', 'easy', 'standard', 'challenge']) {
    let save = startPuzzle({...setDifficulty(freshSave(),mode),active,owned:['clover','fern','pip']});
    for (let n = 0; n < 50; n++) {
      assert.equal(canFinishOrder(save), true);
      const result = completeOrder(fillOrder(save), currentOrder(save).id);
      assert.ok(result.earned > 0); save = result.save;
      assert.equal(save.supplyCompleted, 0); assert.equal(save.brew.lots.length, 0); assert.deepEqual(save.stock, puzzleStock(save));
    }
    assert.equal(save.completed, 50);
  }
});

test('Auto starts Easy and advances only after 3 and 8 completed potions', () => {
  let save = freshSave(); assert.equal(save.settings.difficulty, 'auto');
  for (let n = 0; n < 10; n++) {
    assert.equal(difficultyFor(save).id, n < 3 ? 'easy' : n < 8 ? 'standard' : 'challenge');
    const task = currentSupplyTask(save); const rewarded = completeSupplyTask(save, 0, task.id, String(task.answer)).save;
    assert.equal(difficultyFor(rewarded).id, difficultyFor(save).id, 'Errands do not advance levels');
    save = completeOrder(fillOrder(save), currentOrder(save).id).save;
  }
});

test('manual levels stay fixed and changing a level starts that mode’s puzzle', () => {
  for (const id of Object.keys(LEVELS)) {
    const save = startPuzzle({ ...setDifficulty(freshSave(), id), completed: 100 });
    assert.equal(difficultyFor(save).id, id);
  }
  let save = newSave(); save = pour(save, 'moonwater', firstPortion(save));
  const changed = setDifficulty(save, 'challenge');
  assert.equal(changed.brew.lots.length, 0); assert.notEqual(changed.puzzleId, save.puzzleId); assert.equal(canFinishOrder(changed), true);
  assert.deepEqual(changed.stock, puzzleStock(changed));
});

test('Easy uses only halves, quarters, and whole cups while Challenge scales batches', () => {
  const easy = setDifficulty(freshSave(), 'easy');
  for (const stock of Object.values(easy.stock)) for (const size of Object.keys(stock)) assert.ok([15, 30, 60].includes(Number(size)));
  const challenge = setDifficulty(freshSave(), 'challenge'), order = currentOrder(challenge);
  assert.equal(order.batch, 2); assert.deepEqual(order.target, Object.fromEntries(INGREDIENTS.map(i=>[i.id,({moonwater:70,lavender:80,chamomile:48})[i.id] || 0])));
});

test('generation is stable across reload/reset and varies when the same recipe returns', () => {
  const save = newSave(); assert.deepEqual(puzzleStock(save), puzzleStock(save));
  const trays = new Set(); for (let n = 0; n < 30; n++) trays.add(JSON.stringify(puzzleStock(startPuzzle({ ...save, completed:n*recipesFor(save).length,brewCounts:{clover:n*recipesFor(save).length} }))));
  assert.ok(trays.size >= 25);
});

test('using portions depletes only the current tray and conserves quantities', () => {
  const original = newSave(), units = firstPortion(original);
  const save = pour(original, 'moonwater', units);
  assert.equal(save.stock.moonwater[units] || 0, original.stock.moonwater[units] - 1);
  assert.equal(mixtureFor(save).moonwater, units); assert.deepEqual(quantities(save), quantities(original));
  assert.equal(pour(save, 'moonwater', currentOrder(save).target.moonwater), save);
});

test('reset restores the same puzzle without changing coins, pets, or level', () => {
  const original=adopt({...newSave(),coins:211},'fern'), id=ingredientsFor(original)[0].id;
  const save = pour(original, id, firstPortion(original,id)); const reset = resetPuzzle(save);
  assert.deepEqual(reset.stock, original.stock); assert.equal(reset.puzzleId, original.puzzleId); assert.equal(reset.coins, 31);
  assert.equal(reset.active, 'fern'); assert.equal(reset.settings.difficulty, original.settings.difficulty); assert.deepEqual(reset.brew.lots, []);
});

test('undo and return restore individual portions without creating a combined vial', () => {
  const original = newSave(), parts = findCombination(original.stock.moonwater, currentOrder(original).target.moonwater);
  let save = pour(pour(original, 'moonwater', parts[0]), 'moonwater', parts[1]);
  save = undoPour(save); assert.equal(mixtureFor(save).moonwater, parts[0]);
  save = returnMixture(pour(save, 'moonwater', parts[1])); assert.deepEqual(save.stock, original.stock); assert.equal(save.brew.lots.length, 0);
});

test('subtraction recovery conserves quantities and rejects incorrect remainders', () => {
  const original = newSave(), units = Number(Object.keys(original.stock.moonwater).find(n => Number(n) > 5));
  const save = pour(original, 'moonwater', units), before = quantities(save);
  assert.equal(recoverPortion(save, 'moonwater', 5, units).save, save);
  assert.equal(recoverPortion(save, 'moonwater', units + 1, 0).reason, 'too-much');
  const result = recoverPortion(save, 'moonwater', 5, units - 5);
  assert.equal(result.correct, true); assert.deepEqual(quantities(result.save), before); assert.equal(result.save.brew.undoDepth, 0);
  assert.equal(undoPour(result.save), result.save); assert.deepEqual(resetPuzzle(result.save).stock, original.stock);
  assert.deepEqual(sanitizeSave(JSON.parse(JSON.stringify(result.save))), result.save);
});

test('all valid combinations earn full rewards even with unused decoys', () => {
  // Search independently for a tray with more than one whole-portion solution.
  let chosen, alternatives;
  for (let completed = 0; completed < 100 && !chosen; completed++) {
    const save = startPuzzle({ ...newSave(), completed,brewCounts:{clover:completed} });
    const ingredient = INGREDIENTS.find(i => currentOrder(save).target[i.id] > 0);
    const entries = Object.entries(save.stock[ingredient.id]), solutions = [];
    const visit = (index, remaining, parts) => {
      if (remaining === 0) { solutions.push(parts); return; }
      if (index === entries.length || solutions.length >= 2) return;
      const [size, count] = entries[index];
      for (let n = 0; n <= count && n * Number(size) <= remaining; n++) visit(index + 1, remaining - n * Number(size), [...parts, ...Array(n).fill(Number(size))]);
    };
    visit(0, currentOrder(save).target[ingredient.id], []);
    if (solutions.length >= 2) { chosen = { save, ingredient }; alternatives = solutions.slice(0, 2); }
  }
  assert.ok(chosen);
  for (const parts of alternatives) {
    let save = chosen.save; for (const size of parts) save = pour(save, chosen.ingredient.id, size);
    save = fillOrder(save); assert.ok(Object.values(save.stock).some(stock => Object.values(stock).some(n => n > 0)));
    assert.equal(completeOrder(save, currentOrder(save).id).earned, currentOrder(save).reward);
  }
});

test('brewing awards once and prepares a fresh next puzzle', () => {
  const save = fillOrder(newSave()), order = currentOrder(save), result = completeOrder(save, order.id);
  assert.equal(result.earned, 18); assert.equal(result.save.completed, 1); assert.notEqual(result.save.puzzleId, save.puzzleId);
  assert.deepEqual(result.save.stock, puzzleStock(result.save)); assert.equal(result.save.brew.lots.length, 0); assert.equal(completeOrder(result.save, order.id).earned, 0);
});

test('wrong quantities and distractor ingredients do not earn coins', () => {
  let save = fillOrder(newSave()); const id = currentOrder(save).id;
  const unused = ingredientsFor(save).find(i => currentOrder(save).target[i.id] === 0);
  save = pour(save, unused.id, firstPortion(save, unused.id)); assert.equal(completeOrder(save, id).earned, 0);
  save = undoPour(undoPour(save)); assert.equal(completeOrder(save, id).earned, 0);
});

test('errand questions and payouts scale with difficulty and cannot change the puzzle', () => {
  const expected = { easy: 4, standard: 8, challenge: 14 };
  for (const [id, coins] of Object.entries(expected)) {
    let save = setDifficulty(freshSave(), id); save = pour(save, 'moonwater', firstPortion(save));
    const task = currentSupplyTask(save), answer = task.answer, result = completeSupplyTask(save, 0, task.id, String(answer));
    assert.ok(answer > 0); assert.equal(task.reward, coins); assert.equal(result.correct, true); assert.equal(result.earned, coins);
    assert.deepEqual(result.save.stock, save.stock); assert.deepEqual(result.save.brew, save.brew); assert.equal(result.save.puzzleId, save.puzzleId);
    assert.equal(completeSupplyTask(result.save, 0, task.id, String(answer)).correct, false);
    assert.equal(completeSupplyTask(save, 0, task.id, String(answer + 1)).save, save);
  }
});

test('stale errand forms cannot claim a higher difficulty reward', () => {
  const easy = setDifficulty(freshSave(), 'easy'), task = currentSupplyTask(easy);
  const challenge = setDifficulty(easy, 'challenge');
  assert.equal(completeSupplyTask(challenge, 0, task.id, String(task.answer)).correct, false);
});

test('familiar prices require sustained progress and purchases charge only once', () => {
  assert.equal(FAMILIARS.find(p => p.id === 'fern').cost, 180); assert.equal(FAMILIARS.find(p => p.id === 'pip').cost, 450);
  const poor = { ...newSave(), coins: 179 }; assert.equal(adopt(poor, 'fern'), poor);
  const rich = { ...newSave(), coins: 500 }, adopted = adopt(rich, 'fern');
  assert.equal(adopted.coins, 320); assert.equal(adopted.active, 'fern'); assert.equal(adopt(adopted, 'fern'), adopted); assert.deepEqual(adopted.paused.clover.stock, rich.stock); assert.equal(canFinishOrder(adopted),true); assert.notDeepEqual(adopted.stock,rich.stock);
});

test('the corner starts bare and offers ten furnishings with saved placement choices', () => {
  const save = freshSave(); assert.deepEqual(roomFor(save).decorations, []); assert.deepEqual(roomFor(save).hiddenDecorations, []); assert.equal(DECORATIONS.length, 10);
  let decorated = decorate({ ...save, coins: 200 }, 'rug');
  assert.equal(decorated.coins, 152); assert.deepEqual(roomFor(decorated).decorations, ['rug']); assert.equal(decorate(decorated, 'rug'), decorated);
  const hidden = toggleDecoration(decorated, 'rug'); assert.deepEqual(roomFor(hidden).hiddenDecorations, ['rug']); assert.equal(hidden.coins, decorated.coins);
  assert.deepEqual(roomFor(sanitizeSave(JSON.parse(JSON.stringify(hidden)))).hiddenDecorations, ['rug']);
  assert.deepEqual(roomFor(toggleDecoration(hidden, 'rug')).hiddenDecorations, []); assert.equal(toggleDecoration(hidden, 'bookshelf'), hidden);
  assert.deepEqual(hidden.stock, save.stock); assert.deepEqual(hidden.brew, save.brew);
});

test('old saves migrate with coins, adopted pets, and bought furnishings intact', () => {
  for (const version of [1, 2, 3]) {
    const old = { version, coins: 31, completed: 8, owned: ['clover', 'fern'], active: 'fern', decorations: ['plants', 'garland'], settings: { difficulty: 'apprentice', visualHints: false, sound: true }, stock: {}, brew: { lots: [{ ingredient: 'mint', units: 10 }], undoDepth: 1 }, supplyCompleted: 3 };
    const save = sanitizeSave(old);
    assert.equal(save.version, 5); assert.equal(save.coins, 31); assert.equal(save.completed, 8); assert.equal(save.active, 'fern'); assert.deepEqual(roomFor(save).decorations, ['plants', 'garland']);
    assert.equal(save.settings.difficulty, 'standard'); assert.equal(save.supplyCompleted, 3); assert.equal(save.brew.lots.length, 0); assert.equal(canFinishOrder(save), true);
  }
  assert.equal(sanitizeSave({ ...freshSave(), version: 2, settings: { difficulty: 'scholar' } }).settings.difficulty, 'challenge');
});

test('saving a partial puzzle retains the same tray and poured portions', () => {
  const map = new Map(), storage = { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) };
  const original = newSave(), save = pour(original, 'moonwater', firstPortion(original));
  assert.equal(persistSave(storage, save), true); assert.ok(map.has(SAVE_KEY));
  const loaded = loadSave(storage).save; assert.deepEqual(loaded, save); assert.deepEqual(quantities(loaded), quantities(original)); assert.deepEqual(returnMixture(loaded).stock, original.stock);
});

test('corrupt attempts reset safely without deleting achievements', () => {
  const save = { ...newSave(), coins: 42 };
  const repaired = sanitizeSave({ ...save, stock: { ...save.stock, moonwater: {} } });
  assert.equal(repaired.coins, 42); assert.equal(repaired.brew.lots.length, 0); assert.deepEqual(repaired.stock, puzzleStock(repaired));
  assert.equal(canFinishOrder(sanitizeSave({ ...save, puzzleId: 'old' })), true);
});

test('blocked or malformed storage remains playable', () => {
  const blocked = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); } };
  assert.deepEqual(loadSave(blocked).save, freshSave()); assert.equal(persistSave(blocked, freshSave()), false); assert.deepEqual(loadSave({ getItem: () => '{broken' }).save, freshSave());
});
