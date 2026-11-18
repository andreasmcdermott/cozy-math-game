import test from 'node:test';
import assert from 'node:assert/strict';
import { newSave, setDifficulty, pour, adopt, decorate, toggleDecoration, roomFor } from '../src/game.js';
import { serializeBackup, parseBackup, MAX_BACKUP_BYTES } from '../src/backups.js';

test('portable saves retain pets, coins, decor placement, difficulty, and the unfinished puzzle', () => {
  let save = setDifficulty(newSave(), 'standard');
  save = pour(save, 'moonwater', Number(Object.keys(save.stock.moonwater)[0]));
  save=adopt({...save,coins:1000},'fern');
  save=decorate(decorate(save,'rug','fern'),'plants','clover');
  save=toggleDecoration(save,'rug','fern');
  save={...save,coins:77};
  const exported = serializeBackup(save, '2026-11-17T20:00:00.000Z');
  const restored = parseBackup(exported);
  assert.deepEqual(restored,save);
  assert.equal(JSON.parse(exported).savedAt, '2026-11-17T20:00:00.000Z');
});

test('raw localStorage exports from the old host can be restored without changing its app', () => {
  const old = { version: 2, coins: 31, completed: 8, owned: ['clover', 'fern'], active: 'fern', decorations: ['plants'], settings: { difficulty: 'apprentice', visualHints: false, sound: false }, supplyCompleted: 2 };
  const restored = parseBackup(JSON.stringify(old));
  assert.equal(restored.coins, 31); assert.equal(restored.active, 'fern');
  assert.equal(restored.completed, 8); assert.deepEqual(roomFor(restored).decorations, ['plants']);
  assert.equal(restored.settings.difficulty, 'standard');
});

test('invalid files and unknown versions are rejected instead of silently replacing progress', () => {
  for (const text of ['', '<html>not a save</html>', 'null', '[]', '{}', JSON.stringify({ ...newSave(), version: 99 }), JSON.stringify({ ...newSave(), coins: -1 }), JSON.stringify({ ...newSave(), owned: [] })]) assert.throws(() => parseBackup(text));
  assert.throws(() => parseBackup(JSON.stringify({ format: 'another-game', formatVersion: 1, game: newSave() })));
  assert.throws(() => parseBackup(JSON.stringify({ format: 'paws-potions-save', formatVersion: 99, game: newSave() })));
});

test('oversized backup files are rejected before parsing', () => {
  assert.throws(() => parseBackup(' '.repeat(MAX_BACKUP_BYTES + 1)), /smaller than 1 MB/);
});
