import { INGREDIENTS, FAMILIARS, ingredientsFor, equipFamiliar, CUP, AUTO_THRESHOLDS, difficultyFor, mixtureFor, resetPuzzle, setDifficulty, canFinishOrder, loadSave, persistSave, formatCups, cupLabel, parseCups, currentOrder, assessMixture, pour, undoPour, returnMixture, recoverPortion, completeOrder, currentSupplyTask, completeSupplyTask, adopt, decorate, toggleDecoration } from './game.js';
import { icon } from './icons.js';
import { renderGame } from './canvas-ui.js';
import { serializeBackup, parseBackup, MAX_BACKUP_BYTES } from './backups.js';
import { commonDenominator } from './fractions.js';

let storage;
try { storage = window.localStorage; } catch { storage = { getItem() { throw new Error('Storage unavailable'); }, setItem() { throw new Error('Storage unavailable'); } }; }
const loaded = loadSave(storage);
let save = loaded.save;
let storageAvailable = loaded.available;
const state = { tab: 'shop', ingredient: 'moonwater', mixture: mixtureFor(save), supplySlot: 0, supplySuccess: null, supplyFeedback: '', supplyAnswer: '', feedback: '', feedbackType: '', success: null, showHint: false, petLine: '', lastIngredient: null };
const app = document.getElementById('app');
const art = name => `/art/${name}.webp`;
let toastTimer;
let dialogReturnFocus;
let audio;
let serviceWorkerReady = false;
let pendingBackup = null;
let importRequest = 0;

function commit() {
  storageAvailable = persistSave(storage, save);
}
function chime(success = false) {
  if (!save.settings.sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume().catch(() => {});
    const notes = success ? [523.25, 659.25, 783.99] : [440];
    notes.forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      const start = audio.currentTime + index * 0.12;
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(0.065, start + 0.015); gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(start); oscillator.stop(start + 0.35);
    });
  } catch { /* The game remains playable when audio is unavailable. */ }
}
function announce(message) { document.getElementById('game-status').textContent = message; }
function notify(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message; toast.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('visible'), 4000);
}
const familiar = () => FAMILIARS.find(p => p.id === save.active);
const totalUnits = () => Object.values(state.mixture).reduce((a, b) => a + b, 0);
function hintText(order, reveal = state.showHint) {
  const { differences } = assessMixture(state.mixture, order);
  if (!differences.length) return 'Your ingredient quantities match. Ready to brew!';
  const extra = differences.find(d => d.actual > d.needed);
  if (extra) return extra.needed === 0 ? `${extra.ingredient.name} is not in this recipe. Undo that pour or use Recover to return it.` : `${extra.ingredient.name} has too much.${reveal ? ` Recover ${cupLabel(extra.actual - extra.needed)} to reach the target.` : ' Add your fractions, then use Recover to subtract the extra amount.'}`;
  const d = differences[0], delta = d.needed - d.actual;
  if (!canFinishOrder(save)) return 'Try Undo or Reset puzzle to explore a different combination. Reset restores this same tray, with a guaranteed solution.';
  if (!reveal) return `Check the total ${d.ingredient.noun}. Combine your portions${order.batch > 1 ? ` and multiply the recipe by ${order.batch}` : ''}. A little hint can show the remaining amount.`;
  const available = Object.keys(save.stock[d.ingredient.id]).map(Number).sort((a, b) => b - a);
  const unlike = available.find(n => n !== available[0]);
  const common = available.length > 1 ? commonDenominator(available[0], unlike) : null;
  return `You still need ${cupLabel(delta)} of ${d.ingredient.noun}.${common ? ` A common denominator helps: ${formatCups(available[0])} = ${common.a}/${common.denominator}, and ${formatCups(unlike)} = ${common.b}/${common.denominator}.` : ' You can combine portions or pour a larger amount and recover the excess.'}`;
}
let disposeScreen;
function render() {
  if (!ingredientsFor(save).some(i=>i.id===state.ingredient)) state.ingredient=ingredientsFor(save)[0].id;
  state.mixture = state.success ? state.success.mixture : mixtureFor(save);
  const focused = document.activeElement;
  const focusKey = focused?.dataset?.action ? { ...focused.dataset } : null;
  const answerFocus = focused?.id === 'supply-answer';
  disposeScreen?.();
  disposeScreen = renderGame(app, save, state, storageAvailable);
  if (focusKey) {
    const candidates = [...app.querySelectorAll('button[data-action]')];
    const match = candidates.find(b => Object.entries(focusKey).every(([k, v]) => (focusKey.action === 'decor-page' && k === 'page') || b.dataset[k] === v));
    if (match && !match.disabled) match.focus({ preventScroll: true });
    else if (focusKey.action === 'decorate') app.querySelector(`[data-action="toggle-decoration"][data-decoration="${focusKey.decoration}"]`)?.focus({ preventScroll: true });
    else if (focusKey.action === 'pour') (app.querySelector('.portion-button:not(:disabled)') || app.querySelector('[data-action="undo"]:not(:disabled)'))?.focus({ preventScroll: true });
    else if (['decor-page', 'friend-page'].includes(focusKey.action)) candidates.find(b => b.dataset.action === focusKey.action && !b.disabled)?.focus({ preventScroll: true });
    else app.querySelector('[data-action="next"], [data-action="next-supply"], [data-action="brew"]:not(:disabled)')?.focus({ preventScroll: true });
  } else if (answerFocus) app.querySelector('#supply-answer')?.focus({ preventScroll: true });
}
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(render, 100); });

// Recovery shares the pantry's ingredient cards and portion tiles, but the child
// must calculate the remainder before anything moves out of the cauldron.
function recoveryFields(ingredient) {
  const mix = mixtureFor(save), before = mix[ingredient];
  const sizes = [5, 6, 10, 12, 15, 20, 30, 40, 45, 60].filter(units => units <= before);
  return `<input type="hidden" name="ingredient" value="${ingredient}"/>
    <fieldset class="recover-ingredients"><legend>1. Choose an ingredient</legend><div class="ingredients">${INGREDIENTS.filter(i => mix[i.id] > 0).map(i => `<button type="button" class="ingredient ${i.id === ingredient ? 'selected-ingredient' : ''}" data-action="recover-ingredient" data-ingredient="${i.id}" aria-pressed="${i.id === ingredient}" style="--ingredient-color:${i.color}"><span class="ingredient-art"><img src="${art(i.art)}" alt=""/></span><span class="ingredient-name">${i.name}</span><span class="ingredient-amount">${cupLabel(mix[i.id])} in cauldron</span></button>`).join('')}</div></fieldset>
    <fieldset class="recover-portions"><legend>2. Choose how much to return</legend><div class="portion-buttons">${sizes.map(units => `<button type="button" class="portion-button" data-action="recover-amount" data-units="${units}" aria-pressed="false" aria-label="Return ${cupLabel(units)}"><strong>${formatCups(units)} <small>cup</small></strong></button>`).join('')}<button type="button" class="portion-button recover-custom" data-action="recover-amount" data-units="custom" aria-pressed="false" aria-controls="recover-custom-entry"><strong>Other</strong><span>Choose an amount</span></button></div><div id="recover-custom-entry" hidden><label for="recover-amount">Your amount to return, in cups</label><input id="recover-amount" name="amount" type="text" disabled autocomplete="off" placeholder="For example, 7/12" aria-describedby="recover-format"/><p id="recover-format" class="fraction-input-note">Fractions, mixed numbers, or exact decimals work here.</p></div></fieldset>
    <div class="recover-calculation"><label for="recover-remaining">3. What will be left in the cauldron?</label><div class="recover-equation"><span class="recover-operand"><small>In cauldron</small><strong id="recover-before">${formatCups(before)}</strong></span><span class="recover-operator" aria-label="minus">−</span><span class="recover-operand"><small>Return</small><strong id="recover-chosen">?</strong></span><span class="recover-operator" aria-label="equals">=</span><span class="recover-answer"><input id="recover-remaining" name="remaining" type="text" required autocomplete="off" placeholder="?" aria-describedby="recover-answer-note recover-feedback"/><small>cups left</small></span></div><p id="recover-answer-note">Subtract, then enter your answer. You can use 0, a fraction, or a mixed number.</p></div>
    <p id="recover-feedback" class="errand-feedback" role="status"></p><div class="recover-actions"><button class="button soft-button" type="button" data-action="close-dialog">Keep brewing</button><button class="button primary" type="submit">${icon('bottle')} Check & recover</button></div>`;
}
function updateRecoveryAmount(form) {
  const amount = parseCups(form.elements.amount.value);
  form.querySelector('#recover-chosen').textContent = amount === null || amount === 0 ? '?' : formatCups(amount);
  form.querySelector('#recover-feedback').textContent = '';
  form.elements.remaining.value = '';
  form.elements.remaining.removeAttribute('aria-invalid');
}

function closeDialog() { pendingBackup = null; importRequest++; const dialog = document.querySelector('dialog'); if (dialog) { dialog.close(); dialog.remove(); } if (dialogReturnFocus?.isConnected) dialogReturnFocus.focus(); else if (dialogReturnFocus?.dataset.action) [...app.querySelectorAll('[data-action]')].find(b => b.dataset.action === dialogReturnFocus.dataset.action)?.focus({ preventScroll: true }); }
function openDialog(kind) {
  closeDialog(); dialogReturnFocus = document.activeElement;
  const dialog = document.createElement('dialog'); dialog.className = 'game-dialog';
  const settings = kind === 'settings';
  if (kind === 'transfer') {
    dialog.innerHTML = `<div class="dialog-heading"><span class="dialog-icon">${icon('book')}</span><button class="icon-button" data-action="close-dialog" aria-label="Close saved game transfer">${icon('close')}</button></div><span class="eyebrow">KEEP YOUR LITTLE WORLD</span><h2>Take your progress with you.</h2><p>Download your saved game before moving to a new address or device. Restore that file when you arrive.</p><button class="button primary backup-download" data-action="download-save">${icon('heart')} Download saved game</button><hr class="backup-divider"/><label class="backup-file-label" for="backup-file">Restore a saved game</label><input id="backup-file" type="file" accept=".json,application/json"/><p id="backup-preview" class="backup-preview" aria-live="polite">Choose a saved game file to see what it contains.</p><p class="backup-warning">Restoring replaces the progress saved in this browser. Download your current game first if you want to keep both.</p><p id="backup-feedback" class="errand-feedback" role="status"></p><button class="button primary" data-action="restore-save" disabled>Replace saved progress ${icon('arrow')}</button>`;
  } else if (kind === 'recover') {
    const mix = mixtureFor(save);
    const options = INGREDIENTS.filter(i => mix[i.id] > 0);
    if (!options.length) return;
    const chosen = options.find(i => i.id === state.ingredient) || options[0];
    dialog.classList.add('recover-dialog');
    dialog.setAttribute('aria-labelledby', 'recover-heading');
    dialog.setAttribute('aria-describedby', 'recover-description');
    dialog.innerHTML = `<div class="dialog-heading"><span class="dialog-icon">${icon('bottle')}</span><button class="icon-button" data-action="close-dialog" aria-label="Close recovery">${icon('close')}</button></div><span class="eyebrow">A LITTLE SUBTRACTION MAGIC</span><h2 id="recover-heading">Back to the bottle.</h2><p id="recover-description">Return a portion to your puzzle tray. Choose an amount, then work out what stays in the cauldron.</p><form id="recover-form">${recoveryFields(chosen.id)}</form>`;
  } else {
    dialog.innerHTML = `<div class="dialog-heading"><span class="dialog-icon">${icon(settings ? 'settings' : 'paw')}</span><button class="icon-button" data-action="close-dialog" aria-label="Close ${settings ? 'settings' : 'help'}">${icon('close')}</button></div><span class="eyebrow">${settings ? 'A LITTLE ROOM TO GROW' : 'A HELPING PAW'}</span><h2>${settings ? 'A challenge that grows with you.' : 'Plan your portions. Make some magic.'}</h2>${settings ? `<p>Fifth-grade fraction puzzles, without a timer. Every potion gets a fresh, solvable tray with decoys.</p><fieldset><legend>Puzzle difficulty</legend>${[
      ['auto', 'Auto · grow as you play', `Start Easy. After ${AUTO_THRESHOLDS.standard} potions, move to Standard; after ${AUTO_THRESHOLDS.challenge}, move to Challenge.`],
      ['easy', 'Easy · a gentle warm-up', 'Halves and quarters. Combine 2 or 3 portions, with fewer decoys.'],
      ['standard', 'Standard · mix your fractions', 'Unlike denominators. Choose 2 to 5 portions from a tray with decoys.'],
      ['challenge', 'Challenge · a bigger puzzle', 'Addition solutions use 4–6 portions per ingredient, with more decoys and batches of 2 or 3 bottles.'],
    ].map(([value, label, description]) => `<label class="setting-option"><input type="radio" name="difficulty" value="${value}" ${save.settings.difficulty === value ? 'checked' : ''}/><span><strong>${label}</strong><small>${description}</small></span></label>`).join('')}</fieldset><label class="toggle-setting"><span><strong>Show running totals</strong><small>Optional fraction totals and visual amount bars. Off by default so you can do the addition.</small></span><input type="checkbox" name="visualHints" ${save.settings.visualHints ? 'checked' : ''}/></label><label class="toggle-setting"><span><strong>Gentle sounds</strong><small>A little chime when you pour or finish a potion.</small></span><input type="checkbox" name="sound" ${save.settings.sound ? 'checked' : ''}/></label><p class="settings-note">Changing difficulty refreshes potion trays and village errands. Your coins, rooms, and friends stay with you.</p><button class="button primary" data-action="save-settings">Save & keep brewing ${icon('arrow')}</button><button class="button backup-settings" data-action="transfer">${icon('book')} Back up or restore progress</button>` : `<ol class="help-steps"><li><span>1</span><div><strong>Explore a fresh puzzle tray.</strong><p>Every potion comes with a guaranteed solution and decoys. Select an ingredient to see its portions. The × number is how many are available for this puzzle.</p></div></li><li><span>2</span><div><strong>Combine fractions.</strong><p>Tap a portion to pour it all. For example, 1/3 cup + 1/6 cup makes 1/2 cup. Unlike denominators need a common denominator.</p></div></li><li><span>3</span><div><strong>Subtract to recover.</strong><p>Recover lets you subtract part of an ingredient. Undo returns your last portion. Reset puzzle restores the same tray so you can try another combination.</p></div></li><li><span>4</span><div><strong>Solve puzzles and make friends.</strong><p>Correct potions earn coins for pets and decorations. Village errands offer optional arithmetic, algebra, and geometry challenges for bonus coins. No restocking is needed.</p></div></li></ol><div class="install-note">${icon('heart')}<p>Your current tray and unfinished potion save in this browser. On iPad, use Safari → Share → Add to Home Screen. ${serviceWorkerReady ? 'The offline cache is ready on this device.' : 'An online visit prepares the production game for offline play.'}</p></div><button class="button primary" data-action="close-dialog">Let us brew ${icon('sparkles')}</button>`}`;
  }
  document.body.append(dialog); dialog.showModal();
  dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDialog(); } });
  dialog.addEventListener('cancel', e => { e.preventDefault(); closeDialog(); });
}

document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (action === 'close-dialog') { closeDialog(); return; }
  if (action === 'recover-ingredient') {
    const form = button.closest('form');
    form.innerHTML = recoveryFields(button.dataset.ingredient);
    form.querySelector('.selected-ingredient').focus({ preventScroll: true });
    return;
  }
  if (action === 'recover-amount') {
    const form = button.closest('form'), custom = button.dataset.units === 'custom';
    form.querySelectorAll('[data-action="recover-amount"]').forEach(tile => {
      const selected = tile === button;
      tile.classList.toggle('selected-portion', selected);
      tile.setAttribute('aria-pressed', String(selected));
    });
    const input = form.elements.amount;
    form.querySelector('#recover-custom-entry').hidden = !custom;
    input.disabled = !custom;
    input.required = custom;
    input.value = custom ? '' : formatCups(Number(button.dataset.units));
    updateRecoveryAmount(form);
    if (custom) input.focus();
    return;
  }
  if (['settings', 'help', 'recover', 'transfer'].includes(action)) { openDialog(action); return; }
  if (action === 'download-save') {
    const blob = new Blob([serializeBackup(save)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    const now = new Date(), day = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
    link.href = url; link.download = `paws-potions-save-${day}.json`;
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    document.getElementById('backup-feedback').textContent = 'Your save file is ready. Keep it for your next visit or device.';
    return;
  }
  if (action === 'restore-save') {
    if (!pendingBackup) return;
    if (!persistSave(storage, pendingBackup)) { storageAvailable = false; document.getElementById('backup-feedback').textContent = 'This browser could not save the imported game. Your current game has not been replaced.'; return; }
    save = pendingBackup; storageAvailable = true; state.success = null; state.supplySuccess = null; state.supplyFeedback = ''; state.supplyAnswer = ''; state.feedback = ''; state.showHint = false; state.petLine = ''; state.room=save.active;state.decorPage=0; state.ingredient = Object.keys(currentOrder(save).recipe.amounts)[0];
    closeDialog(); render(); notify('Your saved game is restored. Welcome back.'); return;
  }
  if (action === 'save-settings') {
    const dialog = document.querySelector('dialog');
    const difficulty = dialog.querySelector('input[name="difficulty"]:checked').value;
    if (save.settings.difficulty !== difficulty) { save = setDifficulty(save, difficulty); state.success = null; state.supplySuccess = null; state.supplyFeedback = ''; state.supplyAnswer = ''; state.feedback = ''; state.showHint = false; }
    save = { ...save, settings: { difficulty, visualHints: dialog.querySelector('input[name="visualHints"]').checked, sound: dialog.querySelector('input[name="sound"]').checked } };
    commit(); closeDialog(); render(); notify('Your learning settings are saved.'); return;
  }
  if (action === 'tab') { state.tab = button.dataset.tab; state.petLine = ''; render(); window.scrollTo({ top: 0, behavior: 'instant' }); return; }
  if (action === 'room-select') { if (save.owned.includes(button.dataset.room)) {state.room=button.dataset.room;state.decorPage=0;state.petLine='';render();} return; }
  if (action === 'decor-page') { state.decorPage = Number(button.dataset.page); render(); return; }
  if (action === 'friend-page') { state.friendIndex = Math.max(0, Math.min(2, (state.friendIndex || 0) + Number(button.dataset.step))); render(); return; }
  if (action === 'ingredient') { state.ingredient = button.dataset.ingredient; state.lastIngredient = null; render(); return; }
  if (action === 'supply-slot') { state.supplySlot = Number(button.dataset.slot); state.supplySuccess = null; state.supplyFeedback = ''; state.supplyAnswer = ''; render(); return; }
  if (action === 'next-supply') { state.supplySuccess = null; state.supplyFeedback = ''; state.supplyAnswer = ''; render(); app.querySelector('#supply-answer')?.focus({ preventScroll: true }); return; }
  if (action === 'supply-hint') { state.supplyFeedback = currentSupplyTask(save, state.supplySlot).hint; render(); notify(state.supplyFeedback); return; }
  if (action === 'pet') {
    const p = FAMILIARS.find(p=>p.id===button.dataset.pet) || familiar(); state.petLine = p.lines[Math.floor(Math.random() * p.lines.length)];
    render(); chime(); notify(state.petLine); return;
  }
  if (action === 'adopt') {
    const next = adopt(save, button.dataset.pet); if (next === save) return;
    save = next; state.petLine = ''; state.success=null;state.feedback='';state.showHint=false; commit(); render(); chime(true); notify(`${familiar().name} is home! Your new friend is ready to brew with you.`); return;
  }
  if (action === 'select-pet') { const next=equipFamiliar(save,button.dataset.pet); if(next!==save){save=next;state.petLine='';state.success=null;state.feedback='';state.showHint=false;commit();render();notify(`${familiar().name}'s brewing puzzle is ready.`);} return; }
  if (action === 'toggle-decoration') { save=toggleDecoration(save,button.dataset.decoration,button.dataset.room);commit();render();return; }
  if (action === 'decorate') { const next=decorate(save,button.dataset.decoration,button.dataset.room);if(next!==save){save=next;commit();render();chime(true);notify('A new treasure for this room.');}return; }
  if (action === 'next') { state.success = null; state.feedback = ''; state.feedbackType = ''; state.showHint = false; state.lastIngredient = null; state.ingredient = Object.keys(currentOrder(save).recipe.amounts)[0]; render(); return; }
  if (state.success) return;
  if (action === 'pour') {
    const next = pour(save, button.dataset.ingredient, Number(button.dataset.units));
    if (next === save) { notify('That portion is unavailable, or your cauldron is full. Undo a pour or reset this puzzle to try again.'); return; }
    save = next; announce(`${cupLabel(Number(button.dataset.units))} of ${INGREDIENTS.find(i => i.id === button.dataset.ingredient).name} added.`); state.lastIngredient = button.dataset.ingredient; state.pourEffect = performance.now(); state.feedback = ''; state.feedbackType = ''; commit(); chime(); render(); return;
  }
  if (action === 'reset-puzzle') { save = resetPuzzle(save); state.feedback = 'Tray reset. You can leave portions unused.'; state.feedbackType = ''; state.showHint = false; commit(); render(); return; }
  if (action === 'undo') { save = undoPour(save); state.feedback = ''; state.feedbackType = ''; commit(); render(); return; }
  if (action === 'clear') { save = returnMixture(save); state.feedback = 'All portions returned.'; state.feedbackType = ''; commit(); render(); return; }
  if (action === 'hint') { state.showHint = true; state.feedback = hintText(currentOrder(save), true); state.feedbackType = 'helpful'; render(); return; }
  if (action === 'brew') {
    const order = currentOrder(save); const mixture = mixtureFor(save);
    const result = completeOrder(save, order.id);
    if (!result.earned) { state.feedback = hintText(order); state.feedbackType = 'helpful'; render(); return; }
    save = result.save; state.success = { name: order.recipe.name, customer: order.recipe.customer, art: order.recipe.art, color: order.recipe.color, batch: order.batch, earned: result.earned, mixture, levelUp: save.settings.difficulty === 'auto' && order.level.id !== difficultyFor(save).id ? difficultyFor(save).label : null }; state.petLine = 'Well planned! Every fraction found its place.'; commit(); chime(true); render(); app.querySelector('[data-action="next"]')?.focus({ preventScroll: true });
  }
});

document.addEventListener('change', async event => {
  if (event.target.id === 'backup-file') {
    const dialog = event.target.closest('dialog'), request = ++importRequest, file = event.target.files?.[0];
    pendingBackup = null; dialog.querySelector('[data-action="restore-save"]').disabled = true;
    dialog.querySelector('#backup-feedback').textContent = '';
    if (!file) return;
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('Choose a game save smaller than 1 MB.');
      const imported = parseBackup(await file.text());
      if (!dialog.isConnected || request !== importRequest) return;
      pendingBackup = imported;
      dialog.querySelector('#backup-preview').textContent = `${imported.coins} coins · ${imported.completed} potion orders · ${imported.owned.length} ${imported.owned.length === 1 ? 'familiar' : 'familiars'}`;
      dialog.querySelector('[data-action="restore-save"]').disabled = false;
    } catch (error) {
      if (!dialog.isConnected || request !== importRequest) return;
      dialog.querySelector('#backup-preview').textContent = 'Your current game has not been changed.';
      dialog.querySelector('#backup-feedback').textContent = error.message;
    }
    return;
  }
});
document.addEventListener('input', event => {
  if (event.target.id === 'supply-answer') state.supplyAnswer = event.target.value;
  if (event.target.id === 'recover-amount') updateRecoveryAmount(event.target.form);
  if (event.target.id === 'recover-remaining') {
    event.target.removeAttribute('aria-invalid');
    document.getElementById('recover-feedback').textContent = '';
  }
});
document.addEventListener('submit', event => {
  if (event.target.id === 'recover-form') {
    event.preventDefault(); const form = event.target;
    const ingredient = form.elements.ingredient.value;
    const amount = parseCups(form.elements.amount.value), remaining = parseCups(form.elements.remaining.value);
    const feedback = document.getElementById('recover-feedback');
    if (amount === null || amount === 0) { feedback.textContent = 'Choose a portion to return, or enter a positive amount using Other.'; return; }
    if (remaining === null) { feedback.textContent = 'Enter what will be left. Try a fraction such as 1/3, a mixed number, or 0.'; form.elements.remaining.setAttribute('aria-invalid', 'true'); form.elements.remaining.focus(); return; }
    const result = recoverPortion(save, ingredient, amount, remaining);
    if (!result.correct) { feedback.textContent = result.reason === 'too-much' ? 'You cannot return more of this ingredient than the cauldron contains. Choose a smaller amount.' : 'Not quite. Find a common denominator, then subtract. Your potion is safe while you try again.'; if (result.reason === 'subtraction') { form.elements.remaining.setAttribute('aria-invalid', 'true'); form.elements.remaining.focus(); } return; }
    save = result.save; state.feedback = `${formatCups(result.before)} − ${formatCups(amount)} = ${formatCups(remaining)} cup${remaining > CUP ? 's' : ''}. The recovered portion is back on your tray.`; state.feedbackType = 'ready'; state.ingredient = ingredient; commit(); closeDialog(); render(); chime(); notify('Correct subtraction. Your portion is back on the tray.');
  }
  if (event.target.id === 'supply-form') {
    event.preventDefault(); const form = event.target;
    const result = completeSupplyTask(save, state.supplySlot, form.dataset.task, form.elements.answer.value);
    if (!result.correct) { state.supplyAnswer = form.elements.answer.value; state.supplyFeedback = 'Try again. A hint can help you plan the next step.'; render(); notify(state.supplyFeedback); return; }
    state.supplySuccess = { earned: result.earned, task: currentSupplyTask(save, state.supplySlot) }; save = result.save; state.supplyFeedback = ''; state.supplyAnswer = ''; commit(); render(); app.querySelector('[data-action="next-supply"]')?.focus({ preventScroll: true }); chime(true); notify(`Your neighbor sent ${result.earned} bonus coins.`);
  }
});
const status = document.createElement('div'); status.id = 'game-status'; status.className = 'sr-only'; status.setAttribute('role', 'status'); status.setAttribute('aria-atomic', 'true'); document.body.append(status);
const toast = document.createElement('div'); toast.id = 'toast'; toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.append(toast);
render();
if ('serviceWorker' in navigator && document.querySelector('meta[name="paws-build"]')?.content === 'production') {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').then(async registration => { await navigator.serviceWorker.ready; serviceWorkerReady = true; registration.update().catch(() => {}); }).catch(() => {}));
}
