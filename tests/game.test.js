import test from 'node:test';
import assert from 'node:assert/strict';
import { SAVE_KEY, CUP, CAPACITY, INGREDIENTS, RECIPES, newSave, sanitizeSave, loadSave, persistSave, formatCups, parseCups, currentOrder, mixtureFor, stockTotal, pour, undoPour, returnMixture, recoverPortion, completeOrder, findCombination, canFinishOrder, currentSupplyTask, completeSupplyTask, adopt, decorate } from '../src/game.js';

const quantities = save => INGREDIENTS.map(i => stockTotal(save, i.id) + mixtureFor(save)[i.id]);
const countPortions = save => Object.values(save.stock).reduce((total, stock) => total + Object.values(stock).reduce((a, b) => a + b, 0), 0);
function restock(save, skill = 'arithmetic') {
  const task = currentSupplyTask(save, skill);
  return completeSupplyTask(save, skill, task.id, String(task.answer)).save;
}
function fillOrder(save) {
  const order = currentOrder(save);
  for (const ingredient of INGREDIENTS) {
    let combination = findCombination(save.stock[ingredient.id], order.target[ingredient.id]);
    for (let n = 0; combination === null && n < 3; n++) {
      save = restock(save); combination = findCombination(save.stock[ingredient.id], order.target[ingredient.id]);
    }
    assert.notEqual(combination, null, `Recipe ${order.recipe.id}, batch ${order.batch}, ingredient ${ingredient.id} is solvable`);
    for (const units of combination) save = pour(save, ingredient.id, units);
  }
  return save;
}

test('fraction formatting and parsing are exact for unlike denominators and mixed quantities', () => {
  assert.equal(CUP, 60);
  assert.equal(parseCups('1/3') + parseCups('1/6'), parseCups('1/2'));
  assert.equal(formatCups(parseCups('1/3') + parseCups('1/5')), '8/15');
  assert.equal(formatCups(35), '7/12'); assert.equal(formatCups(50), '⅚'); assert.equal(formatCups(75), '1 ¼');
  for (let units = 0; units <= CAPACITY; units++) assert.equal(parseCups(formatCups(units)), units);
  assert.equal(parseCups('1 1/2'), 90); assert.equal(parseCups('1½'), 90); assert.equal(parseCups('0.25'), 15);
  assert.equal(parseCups(' 2 / 3 '), 40); assert.equal(parseCups('0'), 0);
  for (const invalid of ['', '1/0', '-1/3', '2/7', '0.333333', '2+3', '13', '<script>', 'Infinity']) assert.equal(parseCups(invalid), null, invalid);
  assert.throws(() => formatCups(1.5));
});

test('two quarter portions are consumed while other measured stock remains', () => {
  const original = newSave();
  let save = pour(original, 'moonwater', 15); save = pour(save, 'moonwater', 15);
  assert.equal(save.stock.moonwater[15], undefined);
  assert.equal(save.stock.moonwater[20], 1);
  assert.equal(mixtureFor(save).moonwater, 30);
  assert.equal(pour(save, 'moonwater', 15), save);
  assert.equal(pour(save, 'moonwater', 30), save, 'There is no freely selectable half-cup portion');
  assert.equal(original.stock.moonwater[15], 2, 'The previous state is not mutated');
  assert.deepEqual(quantities(save), quantities(original));
});

test('undo and return restore the exact portions without synthesizing a combined one', () => {
  const original = newSave(); let save = pour(original, 'moonwater', 20); save = pour(save, 'moonwater', 15);
  save = undoPour(save); assert.equal(mixtureFor(save).moonwater, 20); assert.equal(save.stock.moonwater[15], 2);
  save = pour(save, 'moonwater', 15); save = returnMixture(save);
  assert.deepEqual(save.stock, original.stock); assert.equal(save.stock.moonwater[35], undefined); assert.equal(save.brew.lots.length, 0);
  assert.equal(undoPour(save), save);
});

test('recovery requires correct subtraction and conserves all ingredient quantity', () => {
  let save = newSave(); save = pour(save, 'moonwater', 20); save = pour(save, 'moonwater', 10);
  const before = quantities(save), stockBefore = save.stock.moonwater[12];
  assert.equal(recoverPortion(save, 'moonwater', 12, 20).save, save, '1/2 - 1/5 is not 1/3');
  assert.equal(recoverPortion(save, 'moonwater', 40, 0).reason, 'too-much');
  const result = recoverPortion(save, 'moonwater', 12, 18);
  assert.equal(result.correct, true); assert.equal(mixtureFor(result.save).moonwater, 18);
  assert.equal(result.save.stock.moonwater[12], stockBefore + 1);
  assert.deepEqual(quantities(result.save), before); assert.equal(result.save.brew.undoDepth, 0);
  assert.equal(recoverPortion(result.save, 'moonwater', 12, 18).correct, false);
  assert.deepEqual(quantities(returnMixture(result.save)), before);
});

test('after recovery only subsequent pours can be undone', () => {
  let save = pour(newSave(), 'moonwater', 20);
  save = recoverPortion(save, 'moonwater', 5, 15).save;
  assert.equal(undoPour(save), save);
  const recovered = save; save = pour(save, 'honey', 6); save = undoPour(save);
  assert.deepEqual(save.stock, recovered.stock); assert.deepEqual(save.brew, recovered.brew);
});

test('the opening order requires combining fractions rather than matching a single vial', () => {
  const save = newSave(), order = currentOrder(save);
  assert.equal(order.target.moonwater, 35);
  assert.equal(save.stock.moonwater[35], undefined);
  const combination = findCombination(save.stock.moonwater, 35);
  assert.ok(combination.length > 1);
  assert.ok(new Set(combination).size > 1, 'Opening moonwater needs unlike portion sizes');
  for (const i of INGREDIENTS.filter(i => order.target[i.id])) assert.equal(save.stock[i.id][order.target[i.id]], undefined);
});

test('every recipe and batch remains solvable with finite restocking', () => {
  for (const difficulty of ['apprentice', 'scholar']) {
    for (let completed = 0; completed < RECIPES.length * 4; completed++) {
      let save = newSave(); save.completed = completed; save.settings.difficulty = difficulty;
      save = fillOrder(save); const order = currentOrder(save);
      const result = completeOrder(save, order.id);
      assert.equal(result.earned, order.reward); assert.equal(result.save.completed, completed + 1);
      assert.equal(result.save.brew.lots.length, 0);
    }
  }
});

test('a successful brew consumes stock, awards coins once, and never refills the pantry', () => {
  const original = newSave(); let save = original;
  for (const [ingredient, portions] of Object.entries({ moonwater: [20, 15], moonberries: [20, 20], honey: [12, 12] })) for (const units of portions) save = pour(save, ingredient, units);
  const order = currentOrder(save), beforeStock = save.stock;
  const result = completeOrder(save, order.id);
  assert.equal(result.earned, 18); assert.equal(result.save.coins, 18); assert.deepEqual(result.save.stock, beforeStock);
  assert.equal(stockTotal(result.save, 'moonwater'), stockTotal(original, 'moonwater') - 35);
  assert.equal(completeOrder(result.save, order.id).earned, 0);
});

test('wrong amounts and extra ingredients cannot earn coins', () => {
  let save = fillOrder(newSave()); const id = currentOrder(save).id;
  save = pour(save, 'mint', 5); assert.equal(completeOrder(save, id).earned, 0);
  save = undoPour(save); save = undoPour(save); assert.equal(completeOrder(save, id).earned, 0);
  assert.equal(completeOrder(newSave(), id).earned, 0);
});

test('batch scaling applies to every ingredient and whole stock portions remain finite', () => {
  const save = newSave(); save.settings.difficulty = 'scholar';
  const order = currentOrder(save); assert.equal(order.batch, 2);
  assert.deepEqual(order.target, { moonwater: 70, moonberries: 80, honey: 48, mint: 0 });
  assert.equal(save.stock.moonwater[70], undefined);
});

test('supply answers restock exactly once and preserve an unfinished mixture', () => {
  let save = pour(newSave(), 'moonwater', 20); const task = currentSupplyTask(save, 'arithmetic');
  assert.equal(task.answer, 24);
  assert.equal(completeSupplyTask(save, 'arithmetic', task.id, '23').save, save);
  const result = completeSupplyTask(save, 'arithmetic', task.id, '24');
  assert.equal(result.correct, true); assert.equal(countPortions(result.save) - countPortions(save), 48);
  assert.deepEqual(result.save.brew, save.brew); assert.equal(result.save.coins, save.coins);
  assert.equal(completeSupplyTask(result.save, 'arithmetic', task.id, '24').correct, false);
});

test('algebra, area, perimeter, volume, and division errands have the expected answers', () => {
  const save = newSave(); assert.equal(currentSupplyTask(save, 'algebra').answer, 4);
  assert.equal(currentSupplyTask(save, 'geometry').answer, 6);
  save.supplyCompleted = 1;
  assert.equal(currentSupplyTask(save, 'arithmetic').answer, 5);
  assert.equal(currentSupplyTask(save, 'algebra').answer, 5);
  assert.equal(currentSupplyTask(save, 'geometry').answer, 12);
  save.supplyCompleted = 2; assert.equal(currentSupplyTask(save, 'geometry').answer, 30);
  for (const skill of ['arithmetic', 'algebra', 'geometry']) {
    const task = currentSupplyTask(save, skill);
    assert.equal(completeSupplyTask(save, skill, task.id, String(task.answer)).correct, true);
  }
});

test('an empty pantry has a coin-free way back to a solvable order', () => {
  let save = newSave(); save.stock = Object.fromEntries(INGREDIENTS.map(i => [i.id, {}]));
  assert.equal(canFinishOrder(save), false); assert.equal(save.coins, 0);
  save = restock(save); assert.equal(canFinishOrder(save), true); assert.equal(save.coins, 0);
  assert.ok(completeOrder(fillOrder(save), currentOrder(save).id).earned > 0);
});

test('v1 progress migrates to v2 with starter stock and fifth-grade defaults', () => {
  const old = { version: 1, coins: 31, completed: 8, owned: ['clover', 'fern'], active: 'fern', decorations: ['plants'], settings: { difficulty: 'gentle', visualHints: true, sound: true } };
  const save = sanitizeSave(old);
  assert.equal(save.version, 2); assert.equal(save.coins, 31); assert.equal(save.completed, 8); assert.equal(save.active, 'fern'); assert.deepEqual(save.decorations, ['plants']);
  assert.equal(save.settings.visualHints, false); assert.equal(save.settings.difficulty, 'apprentice'); assert.ok(stockTotal(save, 'moonwater') > 0);
});

test('saving and reloading a partial brew neither refunds nor duplicates a portion', () => {
  const map = new Map(); const storage = { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) };
  const original = newSave(); let save = pour(original, 'moonwater', 20); save = pour(save, 'moonwater', 15);
  assert.equal(persistSave(storage, save), true); assert.ok(map.has(SAVE_KEY));
  const loaded = loadSave(storage).save; assert.deepEqual(loaded, save); assert.deepEqual(quantities(loaded), quantities(original));
  assert.deepEqual(returnMixture(loaded).stock, original.stock);
});

test('corrupt or blocked saves stay playable and invalid inventory is rejected', () => {
  const blocked = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); } };
  assert.deepEqual(loadSave(blocked).save, newSave()); assert.equal(persistSave(blocked, newSave()), false);
  assert.deepEqual(loadSave({ getItem: () => '{broken' }).save, newSave());
  const raw = newSave(); raw.coins = -1; raw.active = 'missing'; raw.stock.moonwater = { 0: 10, 20: 2, 5: -3, bad: 2 }; raw.brew = { lots: [{ ingredient: 'missing', units: 10 }, { ingredient: 'mint', units: 15 }], undoDepth: 99 };
  const safe = sanitizeSave(raw); assert.equal(safe.coins, 0); assert.equal(safe.active, 'clover'); assert.deepEqual(safe.stock.moonwater, { 20: 2 }); assert.deepEqual(safe.brew, { lots: [{ ingredient: 'mint', units: 15 }], undoDepth: 1 });
});

test('purchases preserve pantry and unfinished potions', () => {
  const save = { ...pour(newSave(), 'moonwater', 20), coins: 100 };
  const adopted = adopt(save, 'fern'); assert.equal(adopted.coins, 76); assert.equal(adopted.active, 'fern'); assert.deepEqual(adopted.stock, save.stock); assert.deepEqual(adopted.brew, save.brew);
  assert.equal(adopt(adopted, 'fern'), adopted);
  const decorated = decorate(adopted, 'plants'); assert.equal(decorated.coins, 60); assert.deepEqual(decorated.brew, save.brew); assert.equal(decorate(decorated, 'plants'), decorated);
});
