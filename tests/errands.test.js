import test from 'node:test';
import assert from 'node:assert/strict';
import { ERRAND_KINDS, taskForCard } from '../src/errands.js';
import { newSave, setDifficulty, supplyTasks, currentSupplyTask, completeSupplyTask, sanitizeSave, startPuzzle, adopt, decorate, pour } from '../src/game.js';
import { parseBackup, serializeBackup } from '../src/backups.js';

function independentAnswer(task) {
  const v = task.values, d = task.dimensions;
  switch (task.kind) {
    case 'shipment': return Array.from({length:v.a}, () => v.b).reduce((a,b) => a+b, 0) - v.reserved;
    case 'crates': return v.total / v.perCrate;
    case 'change': return v.paid - Array.from({length:v.a}, () => v.b).reduce((a,b) => a+b, 0);
    case 'time': return v.end - v.start;
    case 'stockFraction': return v.total / v.denominator * v.numerator;
    case 'missingAdd': return v.total - v.extra;
    case 'missingGroup': return v.total / v.groups;
    case 'formula': return v.groupedExtra ? v.total / v.groups - v.extra : (v.total - v.extra) / v.groups;
    case 'pattern': {
      for (let i = 1; i < v.sequence.length; i++) assert.equal(v.sequence[i], v.multiply ? v.sequence[i-1] * v.step : v.sequence[i-1] + v.step);
      return v.sequence.at(-1);
    }
    case 'triangle': return d.width * d.height / 2;
    case 'planting': case 'remaining': {
      const planted = d.width * d.height / d.fraction.denominator * d.fraction.numerator;
      return task.kind === 'planting' ? planted : d.width * d.height - planted;
    }
    case 'perimeter': return d.width + d.height + d.width + d.height;
    case 'missingSide': {
      const area = Number(task.prompt.match(/area of (\d+)/)[1]);
      return area / d.width;
    }
    case 'volume': return d.width * d.height * d.depth;
    case 'area': return d.width * d.height;
    default: assert.fail(`Unverified kind ${task.kind}`);
  }
}
test('12,000 generated errands have correct answers and scale across all three levels', () => {
  const seen = new Set(), gardenFractions = new Set();
  for (const level of ['easy','standard','challenge']) for (const kind of Object.keys(ERRAND_KINDS)) for (let n = 0; n < 250; n++) {
    const card = {serial:n, seed:Math.imul(n+1,2654435761) >>> 0, kind, level};
    const task = taskForCard(card);
    assert.deepEqual(taskForCard(card),task);
    assert.equal(task.answer,independentAnswer(task), `${level} ${kind} ${n}`);
    assert(Number.isSafeInteger(task.answer) && task.answer > 0 && task.answer < 10000);
    assert.equal(task.reward,{easy:4,standard:8,challenge:14}[level]);
    seen.add(kind);
    if (task.dimensions?.fraction) {
      const d = task.dimensions;
      gardenFractions.add(`${d.fraction.numerator}/${d.fraction.denominator}`);
      if (d.width === 2 && d.height === 3 && d.fraction.numerator === 1) seen.add('2x3-third');
    }
  }
  assert.equal(seen.size,17); assert(gardenFractions.size >= 10);
});

test('900 errand completions replace only the chosen notice and pay exactly once', () => {
  let save = setDifficulty(newSave(),'standard'), seed = 4;
  const random = () => {seed = (Math.imul(seed,1664525)+1013904223) >>> 0; return seed / 4294967296;};
  const seen = new Set();
  for (let n = 0; n < 900; n++) {
    const slot = n % 3, before = supplyTasks(save), task = before[slot]; seen.add(task.kind);
    const incorrect = completeSupplyTask(save,slot,task.id,String(task.answer+1),random);
    assert.equal(incorrect.save,save); assert.equal(incorrect.correct,false);
    const result = completeSupplyTask(save,slot,task.id,String(task.answer),random);
    assert(result.correct); assert.equal(result.save.coins,save.coins+8); assert.equal(result.save.supplyCompleted,n+1);
    const after = supplyTasks(result.save);
    assert.equal(after.length,3); assert.equal(new Set(after.map(t => t.kind)).size,3);
    assert(!before.some(t => t.kind === after[slot].kind));
    for (let other = 0; other < 3; other++) if (other !== slot) assert.deepEqual(before[other],after[other]);
    for (let other = 0; other < 3; other++) assert.equal(completeSupplyTask(result.save,other,task.id,String(task.answer)).correct,false);
    const {coins, supplyCompleted, supplyBoard, ...potionAndRooms} = result.save;
    assert.deepEqual(potionAndRooms,((({coins, supplyCompleted, supplyBoard, ...rest}) => rest)(save)));
    save = result.save;
    if (n % 30 === 0) {const restored = parseBackup(serializeBackup(save)); assert.deepEqual(restored,save); save = restored;}
  }
  assert.equal(seen.size,16);
});

test('unanswered cards survive Auto advancement with their original questions and rewards', () => {
  let save = newSave(); const before = supplyTasks(save);
  save = startPuzzle({...save,completed:3});
  assert.deepEqual(supplyTasks(save),before);
  const result = completeSupplyTask(save,2,before[2].id,String(before[2].answer),() => .4);
  assert.equal(result.earned,4); assert.equal(currentSupplyTask(result.save,2).level.id,'standard');
  assert.deepEqual(supplyTasks(result.save).slice(0,2),before.slice(0,2));
  assert.deepEqual(sanitizeSave(result.save),result.save);
  const changed = setDifficulty(result.save,'challenge');
  assert(supplyTasks(changed).every(t => t.level.id === 'challenge'));
  assert.equal(completeSupplyTask(changed,0,before[0].id,String(before[0].answer)).correct,false);
});

test('legacy and damaged boards retain achievements, rooms, parked attempts, and current potion', () => {
  let save = adopt({...newSave(),coins:1000},'fern'); save = decorate(save,'rug','fern');
  const ingredient = Object.keys(save.stock).find(id => Object.keys(save.stock[id]).length);
  save = pour(save,ingredient,Number(Object.keys(save.stock[ingredient])[0]));
  const {supplyBoard, ...legacy} = save;
  for (const board of [undefined,[],[null,null,null],supplyBoard.map(c => ({...c,level:'bogus'})),supplyBoard.map(c => ({...c,serial:0})),supplyBoard.map(c => ({...c,seed:Infinity}))]) {
    const restored = sanitizeSave({...legacy,supplyBoard:board});
    const {supplyBoard: repaired, ...unchanged} = restored;
    assert.deepEqual(unchanged,legacy); assert.equal(repaired.length,3);
    assert.deepEqual(sanitizeSave(restored),restored);
  }
});

test('invalid selections and malformed answers cannot complete a notice', () => {
  const save = newSave(), task = currentSupplyTask(save);
  for (const answer of ['', 'two', '-1', '1/0', `${task.answer} coins`, 'Infinity']) assert.equal(completeSupplyTask(save,0,task.id,answer).save,save);
  for (const slot of [-1,3,1.5,'bogus',null,undefined,false]) assert.equal(completeSupplyTask(save,slot,task.id,String(task.answer)).save,save);
});
