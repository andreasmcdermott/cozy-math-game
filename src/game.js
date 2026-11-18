import { createErrandBoard, readErrandBoard, replaceErrand, taskForCard } from './errands.js';
import { generatePuzzleStock, LEVELS, AUTO_THRESHOLDS } from './puzzles.js';
export { LEVELS, AUTO_THRESHOLDS } from './puzzles.js';
import { CUP, CAPACITY, formatCups, cupLabel, parseCups } from './fractions.js';
export { CUP, CAPACITY, formatCups, cupLabel, parseCups } from './fractions.js';
export const SAVE_KEY = 'paws-potions-v1';
import { INGREDIENTS, RECIPES, FAMILIARS, DECORATIONS, LEGACY_INGREDIENTS, familiarFor, ingredientsFor, recipesFor, decorationsFor } from './catalog.js';
export { INGREDIENTS, RECIPES, FAMILIARS, DECORATIONS, ingredientsFor, recipesFor, decorationsFor, familiarFor } from './catalog.js';

export const blankMixture = () => Object.fromEntries(INGREDIENTS.map(i => [i.id, 0]));
export const emptyBrew = () => ({ lots: [], undoDepth: 0 });
export const newSave = () => startPuzzle({ version: 5, coins: 0, completed: 0, owned: ['clover'], active: 'clover', rooms: { clover: { decorations: [], hiddenDecorations: [] } }, paused: {}, brewCounts: {clover:0}, settings: { difficulty: 'auto', visualHints: false, sound: false }, stock: {}, brew: emptyBrew(), supplyCompleted: 0, supplyBoard: createErrandBoard(LEVELS.easy) });
export const puzzleStock = save => generatePuzzleStock(currentOrder(save));
export function resetPuzzle(save) {
  return { ...save, puzzleId: currentOrder(save).id, stock: puzzleStock(save), brew: emptyBrew() };
}
export function startPuzzle(save) {
  return resetPuzzle({ ...save, orderNumber:save.completed, orderMode:save.settings.difficulty, legacySeed:false });
}
export function setDifficulty(save, difficulty) {
  if (!['auto','easy','standard','challenge'].includes(difficulty) || save.settings.difficulty===difficulty) return save;
  const next = { ...save, paused:{}, settings:{...save.settings,difficulty} };
  return startPuzzle({ ...next, supplyBoard:createErrandBoard(difficultyFor(next),save.supplyCompleted) });
}
const attemptKeys = ['orderNumber','orderMode','legacySeed','puzzleId','stock','brew'];
const snapshot = save => Object.fromEntries(attemptKeys.map(k=>[k,save[k]]));
export function equipFamiliar(save, id) {
  if (!FAMILIARS.some(p=>p.id===id) || !save.owned.includes(id) || id===save.active) return save;
  const paused = { ...save.paused, [save.active]:snapshot(save) }, stored = paused[id];
  delete paused[id];
  const next = { ...save, active:id, paused };
  return stored ? { ...next, ...stored } : startPuzzle(next);
}
export const roomFor = (save, id=save.active) => save.rooms?.[id] || { decorations:[], hiddenDecorations:[] };
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
function readAttempt(base, raw, id) {
  const active = { ...base, active:id };
  const number = validInteger(raw.orderNumber) && raw.orderNumber<=base.completed ? raw.orderNumber : base.completed;
  const orderMode = raw.orderMode===base.settings.difficulty ? raw.orderMode : base.settings.difficulty;
  const next = { ...active, orderNumber:number, orderMode, legacySeed:raw.legacySeed===true };
  next.puzzleId=raw.puzzleId;
  next.stock=Object.fromEntries(INGREDIENTS.map(i=>[i.id,Object.fromEntries(Object.entries(raw.stock?.[i.id] || {}).filter(([units,count])=>/^\d+$/.test(units) && validInteger(Number(units),CAPACITY) && Number(units)>0 && validInteger(count) && count>0))]));
  let total=0;
  next.brew={ lots:[], undoDepth:0 };
  if (Array.isArray(raw.brew?.lots)) next.brew.lots=raw.brew.lots.slice(0,CAPACITY).filter(lot=>{
    if (!lot || !validIngredient(lot.ingredient) || !validInteger(lot.units,CAPACITY) || !lot.units || total+lot.units>CAPACITY) return false;
    total+=lot.units; return true;
  }).map(lot=>({ingredient:lot.ingredient,units:lot.units}));
  next.brew.undoDepth=validInteger(raw.brew?.undoDepth,CAPACITY)?Math.min(raw.brew.undoDepth,next.brew.lots.length):0;
  const generated=puzzleStock(next), mixture=mixtureFor(next);
  const valid=next.puzzleId===currentOrder(next).id && INGREDIENTS.every(i=>stockTotal(next,i.id)+mixture[i.id]===Object.entries(generated[i.id]).reduce((n,[u,count])=>n+Number(u)*count,0));
  return valid ? next : resetPuzzle(next);
}
export function sanitizeSave(value) {
  const base = newSave();
  if (!value || typeof value!=='object' || ![1,2,3,4,5].includes(value.version)) return base;
  base.coins=validInteger(value.coins)?value.coins:0;
  base.completed=validInteger(value.completed)?value.completed:0;
  base.owned=['clover',...FAMILIARS.filter(p=>p.id!=='clover' && Array.isArray(value.owned) && value.owned.includes(p.id)).map(p=>p.id)];
  base.active=base.owned.includes(value.active)?value.active:'clover';
  base.brewCounts=Object.fromEntries(base.owned.map(id=>[id,value.version<5?(id===base.active?base.completed:0):validInteger(value.brewCounts?.[id])&&value.brewCounts[id]<=base.completed?value.brewCounts[id]:0]));
  base.settings.difficulty=['auto','easy','standard','challenge'].includes(value.settings?.difficulty)?value.settings.difficulty:['scholar','growing'].includes(value.settings?.difficulty)?'challenge':'standard';
  base.settings.visualHints=value.version>=2 && value.settings?.visualHints===true;
  base.settings.sound=value.settings?.sound===true;
  base.supplyCompleted=validInteger(value.supplyCompleted)?value.supplyCompleted:0;
  base.supplyBoard=readErrandBoard(value.supplyBoard,difficultyFor(base),base.supplyCompleted);
  base.rooms=Object.fromEntries(base.owned.map(id=>{
    const room=value.version===5?value.rooms?.[id]:id===base.active?value:null;
    const decorations=decorationsFor(id).filter(d=>Array.isArray(room?.decorations) && room.decorations.includes(d.id)).map(d=>d.id);
    return [id,{decorations,hiddenDecorations:decorations.filter(key=>Array.isArray(room?.hiddenDecorations) && room.hiddenDecorations.includes(key))}];
  }));
  if (value.version<4) return startPuzzle(base);
  if (value.version===4) {
    const map=Object.fromEntries(LEGACY_INGREDIENTS.map((old,n)=>[old,familiarFor(base.active).ingredients[n]]));
    const legacy={ orderNumber:base.completed, orderMode:base.settings.difficulty, legacySeed:true,
      stock:Object.fromEntries(LEGACY_INGREDIENTS.map(old=>[map[old],value.stock?.[old] || {}])),
      brew:{lots:Array.isArray(value.brew?.lots)?value.brew.lots.filter(lot=>lot&&typeof lot==='object').map(lot=>({...lot,ingredient:map[lot.ingredient]})):[],undoDepth:value.brew?.undoDepth},
    };
    const migrated={...base,...legacy};
    legacy.puzzleId=value.puzzleId===`p4-${base.completed}-${base.settings.difficulty}`?currentOrder(migrated).id:'invalid';
    return readAttempt(base,legacy,base.active);
  }
  base.paused=Object.fromEntries(base.owned.filter(id=>id!==base.active && value.paused?.[id]).map(id=>[id,snapshot(readAttempt(base,value.paused[id],id))]));
  return readAttempt(base,value,base.active);
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
  const number=validInteger(save.orderNumber)?save.orderNumber:save.completed;
  const mode=save.orderMode || save.settings.difficulty;
  const id=mode==='auto'?(number<AUTO_THRESHOLDS.standard?'easy':number<AUTO_THRESHOLDS.challenge?'standard':'challenge'):mode;
  const level=LEVELS[id] || LEVELS.standard;
  const baseRecipe=recipesFor(save)[(save.brewCounts?.[save.active] ?? number) % recipesFor(save).length];
  const amounts=level.id==='easy'?Object.fromEntries(Object.keys(baseRecipe.amounts).map((ingredient,n)=>[ingredient,[30,45,60][(number+n)%3]])):baseRecipe.amounts;
  const recipe={...baseRecipe,amounts};
  const batch=level.id==='challenge'?[2,3,2,3][number%4]:1;
  const ingredientIds=familiarFor(save.active).ingredients;
  return {id:`p5-${save.active}-${number}-${mode}${save.legacySeed?'-legacy':''}`,recipe,level,batch,ingredientIds,
    seedId:save.legacySeed?`p4-${number}-${mode}`:undefined,
    seedIngredients:save.legacySeed?Object.fromEntries(ingredientIds.map((key,n)=>[key,LEGACY_INGREDIENTS[n]])):undefined,
    reward:level.potionCoins+(Object.keys(amounts).length-2)*2+(batch-1)*4,
    target:Object.fromEntries(INGREDIENTS.map(i=>[i.id,(amounts[i.id] || 0)*batch]))};
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
  return { save: startPuzzle({ ...save, coins: save.coins + order.reward, completed: save.completed + 1, brewCounts:{...save.brewCounts,[save.active]:(save.brewCounts?.[save.active] || 0)+1} }), earned: order.reward };
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
  const familiar=FAMILIARS.find(p=>p.id===id);
  if (!familiar || save.owned.includes(id) || save.coins<familiar.cost) return save;
  return equipFamiliar({...save,coins:save.coins-familiar.cost,owned:[...save.owned,id],brewCounts:{...save.brewCounts,[id]:0},rooms:{...save.rooms,[id]:{decorations:[],hiddenDecorations:[]}}},id);
}
export function decorate(save, id, roomId=save.active) {
  if (!save.owned.includes(roomId)) return save;
  const item=decorationsFor(roomId).find(d=>d.id===id), room=roomFor(save,roomId);
  if (!item || room.decorations.includes(id) || save.coins<item.cost) return save;
  return {...save,coins:save.coins-item.cost,rooms:{...save.rooms,[roomId]:{...room,decorations:decorationsFor(roomId).map(d=>d.id).filter(key=>key===id || room.decorations.includes(key))}}};
}
export function toggleDecoration(save, id, roomId=save.active) {
  if (!save.owned.includes(roomId)) return save;
  const room=roomFor(save,roomId);
  if (!room.decorations.includes(id)) return save;
  const hidden=room.hiddenDecorations;
  return {...save,rooms:{...save.rooms,[roomId]:{...room,hiddenDecorations:hidden.includes(id)?hidden.filter(key=>key!==id):[...hidden,id]}}};
}

// Slots identify notices, not subjects. Completing one never refreshes the others.
export const supplyTasks = save => save.supplyBoard.map(taskForCard);
export function currentSupplyTask(save, slot = 0) {
  return taskForCard(save.supplyBoard[slot] || save.supplyBoard[0]);
}
export function completeSupplyTask(save, slot, taskId, answer, random = Math.random) {
  if (!Number.isInteger(slot) || slot < 0 || slot > 2) return { save, correct: false };
  const task = currentSupplyTask(save, slot);
  if (task.id !== taskId || parseCups(answer, 10000) !== task.answer * CUP) return { save, correct: false };
  const earned = task.reward;
  const supplyBoard = replaceErrand(save.supplyBoard,slot,difficultyFor(save),save.supplyCompleted,random);
  return { save: { ...save, supplyBoard, coins: save.coins + earned, supplyCompleted: save.supplyCompleted + 1 }, correct: true, earned };
}
