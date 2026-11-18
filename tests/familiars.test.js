import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { INGREDIENTS, FAMILIARS, newSave, startPuzzle, setDifficulty, currentOrder, ingredientsFor, recipesFor, decorationsFor, roomFor, equipFamiliar, adopt, decorate, toggleDecoration, pour, mixtureFor, resetPuzzle, findCombination, canFinishOrder, completeOrder, sanitizeSave } from '../src/game.js';
import { serializeBackup, parseBackup } from '../src/backups.js';
const unlocked = () => equipFamiliar(adopt(adopt({...newSave(),coins:5000},'fern'),'pip'),'clover');
const attempt = s => ({id:s.puzzleId,stock:s.stock,brew:s.brew,number:s.orderNumber,mode:s.orderMode,legacy:s.legacySeed});
function fill(s) {
  const order=currentOrder(s), mix=mixtureFor(s);
  for(const i of ingredientsFor(s)) {
    const path=findCombination(s.stock[i.id],order.target[i.id]-mix[i.id]);
    assert.notEqual(path,null);
    for(const units of path)s=pour(s,i.id,units);
  }
  return s;
}

test('each familiar has four exclusive ingredients, six thematic recipes and a distinct room/catalog',()=>{
  const seen=new Set();
  for(const pet of FAMILIARS){
    const ingredients=ingredientsFor(pet.id), ids=ingredients.map(i=>i.id);
    assert.equal(ids.length,4);assert.equal(recipesFor(pet.id).length,6);
    for(const id of ids){assert(!seen.has(id));seen.add(id);}
    for(const r of recipesFor(pet.id)){assert.equal(r.familiar,pet.id);assert(Object.keys(r.amounts).every(id=>ids.includes(id)));}
    assert.equal(decorationsFor(pet.id).length,10);
  }
  assert.equal(seen.size,INGREDIENTS.length);
  assert.equal(new Set(FAMILIARS.map(p=>p.roomArt)).size,3);
  for(const id of ['plants','bed','rug','tea','bookshelf'])assert.equal(new Set(FAMILIARS.map(p=>decorationsFor(p.id).find(d=>d.id===id).art)).size,3);
});

test('equipping a familiar parks exact progress and restores it through reloads and backups',()=>{
  let save=unlocked();
  save=pour(save,'moonwater',Number(Object.keys(save.stock.moonwater)[0]));
  const clover=attempt(save);
  save=equipFamiliar(save,'fern');save=pour(save,'dew',Number(Object.keys(save.stock.dew)[0]));const fern=attempt(save);
  save=equipFamiliar(save,'pip');save=pour(save,'embertea',Number(Object.keys(save.stock.embertea)[0]));const pip=attempt(save);
  save=parseBackup(serializeBackup(save));assert.deepEqual(attempt(save),pip);
  save=equipFamiliar(save,'clover');assert.deepEqual(attempt(save),clover);assert(canFinishOrder(save));
  save=equipFamiliar(save,'fern');assert.deepEqual(attempt(save),fern);assert(canFinishOrder(save));
  save=equipFamiliar(save,'pip');assert.deepEqual(attempt(save),pip);assert(canFinishOrder(save));
  const coins=save.coins,oldId=currentOrder(save).id;
  save=completeOrder(fill(save),oldId).save;assert(save.coins>coins);
  save=equipFamiliar(equipFamiliar(save,'clover'),'pip');assert.notEqual(currentOrder(save).id,oldId);assert.equal(completeOrder(save,oldId).earned,0);
});

test('an unfinished Auto puzzle remains stable while another familiar advances the global level',()=>{
  let save=unlocked();save=pour(save,'moonwater',15);const parked=attempt(save);
  save=equipFamiliar(save,'fern');
  for(let n=0;n<9;n++)save=completeOrder(fill(save),currentOrder(save).id).save;
  assert.equal(currentOrder(save).level.id,'challenge');
  save=equipFamiliar(save,'clover');assert.deepEqual(attempt(save),parked);assert.equal(currentOrder(save).level.id,'easy');
  save=completeOrder(fill(save),currentOrder(save).id).save;assert.equal(currentOrder(save).level.id,'challenge');assert.equal(save.completed,10);
});

test('only equipped ingredients are available, including decoys, and locked buddies cannot be equipped',()=>{
  assert.equal(equipFamiliar(newSave(),'pip').active,'clover');
  for(const pet of FAMILIARS){
    const save=equipFamiliar(unlocked(),pet.id), ids=new Set(ingredientsFor(save).map(i=>i.id));
    for(const i of INGREDIENTS){
      if(ids.has(i.id))assert(Object.keys(save.stock[i.id]).length>0);
      else {assert.deepEqual(save.stock[i.id],{});assert.equal(pour(save,i.id,15),save);}
    }
  }
});

test('every unlocked room owns its own furnishings without equipping its familiar',()=>{
  let save=unlocked();const before=attempt(save),coins=save.coins;
  save=decorate(save,'rug','fern');assert.equal(save.active,'clover');assert.deepEqual(attempt(save),before);
  assert.equal(save.coins,coins-48);assert.deepEqual(roomFor(save,'fern').decorations,['rug']);assert.deepEqual(roomFor(save,'clover').decorations,[]);
  assert.equal(decorate(save,'rug','fern'),save);
  save=decorate(save,'rug','clover');assert.equal(save.coins,coins-96);
  save=toggleDecoration(save,'rug','fern');assert.deepEqual(roomFor(save,'fern').hiddenDecorations,['rug']);assert.deepEqual(roomFor(save,'clover').hiddenDecorations,[]);
  save=parseBackup(serializeBackup(save));assert.deepEqual(roomFor(save,'fern').hiddenDecorations,['rug']);assert.equal(save.active,'clover');
  const locked=newSave();assert.equal(decorate(locked,'rug','pip'),locked);assert.equal(toggleDecoration(locked,'rug','pip'),locked);
});

test('difficulty changes refresh all familiar puzzles, preserve rooms, and cannot grant rewards from parked IDs',()=>{
  let save=decorate(unlocked(),'plants','fern');save=equipFamiliar(save,'fern');const old=currentOrder(save).id;
  const rooms=save.rooms,coins=save.coins;save=setDifficulty(save,'challenge');
  assert.deepEqual(save.paused,{});assert.deepEqual(save.rooms,rooms);assert.equal(save.coins,coins);assert.equal(canFinishOrder(save),true);
  assert.equal(completeOrder(save,old).earned,0);
  save=equipFamiliar(save,'clover');assert.equal(currentOrder(save).level.id,'challenge');assert(canFinishOrder(save));
});

test('36 pre-expansion v4 saves preserve exact unfinished trays, quantities, coins, purchases and ability to finish',async()=>{
  const fixtures=JSON.parse(await readFile(new URL('./fixtures/v4-attempts.json',import.meta.url),'utf8'));
  const oldIds=['moonwater','moonberries','honey','mint'];
  for(const {save:old,target,level}of fixtures){
    let save=parseBackup(JSON.stringify(old));const ids=ingredientsFor(save).map(i=>i.id),order=currentOrder(save);
    assert.equal(save.version,5);assert.equal(save.coins,old.coins);assert.equal(save.completed,old.completed);assert.equal(order.level.id,level);
    assert.equal(order.seedId,old.puzzleId);
    assert.deepEqual(new Set(roomFor(save).decorations),new Set(old.decorations));assert.deepEqual(roomFor(save).hiddenDecorations,old.hiddenDecorations);
    for(let n=0;n<4;n++){
      assert.deepEqual(save.stock[ids[n]],old.stock[oldIds[n]]);
      assert.equal(mixtureFor(save)[ids[n]],old.brew.lots.filter(l=>l.ingredient===oldIds[n]).reduce((sum,l)=>sum+l.units,0));
      assert.equal(order.target[ids[n]],target[oldIds[n]]);
    }
    assert.deepEqual(sanitizeSave(JSON.parse(JSON.stringify(save))),save);assert(canFinishOrder(save));
    const restored=equipFamiliar(equipFamiliar(save,FAMILIARS.find(p=>p.id!==save.active).id),save.active);assert.deepEqual(attempt(restored),attempt(save));
    save=completeOrder(fill(save),order.id).save;assert.equal(save.coins,old.coins+order.reward);assert.equal(save.legacySeed,false);assert(canFinishOrder(save));
  }
});

test('damaged parked attempts recover independently, and migration handles malformed legacy lots',async()=>{
  let save=unlocked();save=pour(save,'moonwater',15);save=equipFamiliar(save,'fern');
  const before=attempt(save);save=JSON.parse(JSON.stringify(save));save.paused.clover.stock.moonwater={};
  save=sanitizeSave(save);assert.deepEqual(attempt(save),before);save=equipFamiliar(save,'clover');assert.equal(save.brew.lots.length,0);assert(canFinishOrder(save));
  const {save:legacy}=JSON.parse(await readFile(new URL('./fixtures/v4-attempts.json',import.meta.url),'utf8'))[0];
  const repaired=sanitizeSave({...legacy,brew:{lots:[null,{ingredient:'unknown',units:15}],undoDepth:10}});
  assert.equal(repaired.coins,legacy.coins);assert.equal(repaired.brew.lots.length,0);assert(canFinishOrder(repaired));
});


test('alternating buddies still visits all six recipes for each familiar in order',()=>{
  let save=unlocked();const seen={clover:[],fern:[],pip:[]};
  for(let round=0;round<12;round++)for(const pet of FAMILIARS){
    save=equipFamiliar(save,pet.id);const order=currentOrder(save);
    seen[pet.id].push(order.recipe.id);
    assert.equal(order.recipe.id,recipesFor(pet.id)[round%6].id);
    save=completeOrder(fill(save),order.id).save;
  }
  assert.equal(save.completed,36);
  for(const pet of FAMILIARS){assert.equal(new Set(seen[pet.id]).size,6);assert.equal(save.brewCounts[pet.id],12);}
});
