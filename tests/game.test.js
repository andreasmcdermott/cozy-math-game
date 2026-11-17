import test from 'node:test';
import assert from 'node:assert/strict';
import { SAVE_KEY, INGREDIENTS, RECIPES, FAMILIARS, newSave, sanitizeSave, blankMixture, currentOrder, assessMixture, pour, completeOrder, adopt, decorate, loadSave, persistSave, formatCups } from '../src/game.js';

test('a measured first recipe earns coins once and advances the customer', () => {
  let save = newSave(); const first = currentOrder(save); let mixture = blankMixture();
  mixture = pour(mixture, 'moonwater', 1); mixture = pour(mixture, 'moonwater', 1);
  mixture = pour(mixture, 'moonberries', 1); mixture = pour(mixture, 'honey', 1);
  const result = completeOrder(save, mixture, first.id);
  assert.equal(result.earned, 12); assert.equal(result.save.coins, 12); assert.equal(result.save.completed, 1);
  const repeated = completeOrder(result.save, mixture, first.id);
  assert.equal(repeated.earned, 0); assert.equal(repeated.save.coins, 12);
});
test('incorrect and additional ingredients never earn a reward', () => {
  const save = newSave(); const order = currentOrder(save);
  for (const incorrect of [blankMixture(), { ...order.target, mint: 1 }, { ...order.target, moonwater: 3 }, { ...order.target, moonwater: 1 }]) {
    assert.equal(assessMixture(incorrect, order).correct, false);
    assert.equal(completeOrder(save, incorrect, order.id).earned, 0);
  }
});
test('every recipe can be brewed in every supported batch using quarter scoops', () => {
  for (const difficulty of ['gentle', 'growing']) {
    for (let completed = 0; completed < RECIPES.length * 4; completed++) {
      const save = { ...newSave(), completed, settings: { ...newSave().settings, difficulty } };
      const order = currentOrder(save); let mixture = blankMixture();
      for (const ingredient of INGREDIENTS) for (let n = 0; n < order.target[ingredient.id]; n++) mixture = pour(mixture, ingredient.id, 1);
      const result = completeOrder(save, mixture, order.id);
      assert.equal(result.earned, order.reward);
      assert.equal(Object.values(order.target).reduce((a, b) => a + b, 0), 4 * order.batch);
    }
  }
});
test('two-bottle orders double every ingredient rather than only the total', () => {
  const save = newSave(); save.completed = 1; save.settings.difficulty = 'growing';
  const order = currentOrder(save); assert.equal(order.batch, 2);
  assert.equal(order.target.moonwater, 4); assert.equal(order.target.mint, 4);
  assert.equal(completeOrder(save, { ...order.target, moonwater: 3, mint: 5 }, order.id).earned, 0);
});
test('adoption spends coins once and changes the active familiar', () => {
  const save = { ...newSave(), coins: 24 };
  assert.equal(adopt({ ...save, coins: 23 }, 'fern').owned.length, 1);
  const next = adopt(save, 'fern'); assert.equal(next.coins, 0); assert.equal(next.active, 'fern'); assert.deepEqual(next.owned, ['clover', 'fern']);
  assert.equal(adopt(next, 'fern'), next); assert.equal(adopt(save, 'missing'), save);
});
test('decorations require funds and cannot be purchased twice', () => {
  const save = newSave(); assert.equal(decorate(save, 'plants'), save);
  const next = decorate({ ...save, coins: 20 }, 'plants'); assert.equal(next.coins, 4); assert.deepEqual(next.decorations, ['plants']); assert.equal(decorate(next, 'plants'), next);
});
test('save round-trip retains purchases, progress, buddy, and settings', () => {
  const map = new Map(); const storage = { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) };
  const save = { ...newSave(), coins: 99, completed: 8, owned: FAMILIARS.map(p => p.id), active: 'pip', decorations: ['plants'], settings: { difficulty: 'growing', visualHints: false, sound: true } };
  assert.equal(persistSave(storage, save), true); assert.deepEqual(loadSave(storage).save, save); assert.ok(map.has(SAVE_KEY));
});
test('malformed saves and denied storage remain playable', () => {
  const corrupt = { getItem: () => '{broken', setItem: () => { throw new Error('quota'); } };
  assert.deepEqual(loadSave(corrupt).save, newSave()); assert.equal(persistSave(corrupt, newSave()), false);
  const blocked = { getItem() { throw new Error('denied'); } }; assert.deepEqual(loadSave(blocked).save, newSave());
  const sanitized = sanitizeSave({ version: 1, coins: -10, completed: Infinity, owned: ['missing', 'pip', 'pip'], active: 'missing', decorations: ['missing'], settings: { difficulty: 'unknown' } });
  assert.equal(sanitized.coins, 0); assert.equal(sanitized.completed, 0); assert.deepEqual(sanitized.owned, ['clover', 'pip']); assert.equal(sanitized.active, 'clover');
});
test('cup formatting stays exact including whole and mixed quantities', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 8, 12].map(formatCups), ['0', '¼', '½', '¾', '1', '1 ¼', '1 ½', '2', '3']);
  assert.throws(() => formatCups(1.5)); assert.throws(() => formatCups(-1));
});
test('scoops do not mutate history and reject unsupported inputs and overflows', () => {
  const original = blankMixture(); const after = pour(original, 'honey', 2);
  assert.equal(original.honey, 0); assert.equal(after.honey, 2); assert.notEqual(after, original);
  assert.equal(pour(after, 'missing', 1), after); assert.equal(pour(after, 'honey', 3), after);
  const full = { ...blankMixture(), honey: 24 }; assert.equal(pour(full, 'honey', 1), full);
});
