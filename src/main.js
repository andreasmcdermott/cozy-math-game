import { INGREDIENTS, RECIPES, FAMILIARS, DECORATIONS, blankMixture, newSave, loadSave, persistSave, formatCups, cupLabel, currentOrder, assessMixture, pour, completeOrder, adopt, decorate } from './game.js';
import { icon } from './icons.js';

let storage;
try { storage = window.localStorage; } catch { storage = { getItem() { throw new Error('Storage unavailable'); }, setItem() { throw new Error('Storage unavailable'); } }; }
const loaded = loadSave(storage);
let save = loaded.save;
let storageAvailable = loaded.available;
const state = { tab: 'shop', scoop: 1, mixture: blankMixture(), history: [], feedback: '', feedbackType: '', success: null, showHint: false, petLine: '', lastIngredient: null };
const app = document.getElementById('app');
const art = name => `/art/${name}.webp`;
let toastTimer;
let dialogReturnFocus;
let audio;
let serviceWorkerReady = false;

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
function notify(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message; toast.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('visible'), 4000);
}
const familiar = () => FAMILIARS.find(p => p.id === save.active);
const totalUnits = () => Object.values(state.mixture).reduce((a, b) => a + b, 0);
function fractionBar(units, max, color, label) {
  const segments = Array.from({ length: max }, (_, n) => `<span class="fraction-segment ${n < units ? 'filled' : ''}" style="--ingredient-color:${color}"></span>`).join('');
  return `<div class="fraction-bar" role="img" aria-label="${label}">${segments}</div>`;
}
function cauldron(color) {
  const total = totalUnits();
  const y = Math.max(112, 153 - total * 5);
  return `<svg class="cauldron ${total ? 'has-potion' : ''} ${state.success ? 'cauldron-success' : ''}" viewBox="0 0 300 270" role="img" aria-label="Cauldron containing ${cupLabel(total)}">
    <defs><linearGradient id="pot-body" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#4b3a57"/><stop offset=".5" stop-color="#302c40"/><stop offset="1" stop-color="#211f2d"/></linearGradient><linearGradient id="potion-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="#6b5481"/></linearGradient><clipPath id="pot-clip"><ellipse cx="150" cy="126" rx="99" ry="24"/></clipPath></defs>
    <ellipse cx="150" cy="246" rx="113" ry="12" fill="#2d223e" opacity=".17"/>
    <path d="m81 209-9 28q-1 9 10 8l20-21m117-15 9 28q1 9-10 8l-20-21" fill="#332b40"/>
    <path d="M53 133C32 114 18 140 36 161l18 10m193-38c21-19 35 7 17 28l-18 10" fill="none" stroke="#59465e" stroke-width="12"/>
    <path d="M54 126C36 210 70 242 150 242s114-32 96-116Z" fill="url(#pot-body)"/>
    <path d="M73 161q-3 38 20 50" fill="none" stroke="#b39ab7" opacity=".2" stroke-width="9" stroke-linecap="round"/>
    <ellipse cx="150" cy="126" rx="104" ry="29" fill="#6a526e"/><ellipse cx="150" cy="126" rx="96" ry="21" fill="#242331"/>
    ${total ? `<g clip-path="url(#pot-clip)"><ellipse cx="150" cy="${y}" rx="104" ry="27" fill="url(#potion-fill)"/><ellipse cx="150" cy="${y - 4}" rx="69" ry="13" fill="#fff" opacity=".15"/></g><g class="potion-bubbles" fill="${color}"><circle cx="112" cy="100" r="5"/><circle cx="168" cy="89" r="7"/><circle cx="194" cy="111" r="3"/></g>` : ''}
    <path d="m151 163 7 12 14 3-10 10 1 14-12-7-13 7 2-14-10-10 14-3Z" fill="#d9b575" opacity=".9"/>
    <path class="stirring-spoon" d="m210 52-34 78" stroke="#bc9061" stroke-width="9" stroke-linecap="round"/>
    <ellipse cx="210" cy="49" rx="7" ry="14" fill="#d3ac7d" transform="rotate(24 210 49)"/>
  </svg>`;
}
function scene() {
  const pet = familiar();
  const order = currentOrder(save);
  const decor = save.decorations;
  return `<div class="shop-scene" aria-label="Your cozy potion shop">
    <img class="shop-background" src="${art('shop')}" alt="Sunlit potion shop with wooden shelves, magical bottles, and hanging herbs" fetchpriority="high" />
    <div class="scene-shade"></div>
    <div class="shop-sign">${icon('leaf')}<span>The Moss & Moon</span><span class="sign-subtitle">POTION SHOP</span></div>
    <span class="scene-tag">${icon('sun')} A lovely day to brew</span>
    ${decor.includes('garland') ? '<div class="star-garland" aria-label="Moon and star garland"><span>✦</span><span>☾</span><span>✧</span><span>☾</span><span>✦</span></div>' : ''}
    ${decor.includes('plants') ? `<img class="decoration-plant" src="${art('mint')}" alt="Your leafy shop decoration"/>` : ''}
    <div class="brewing-glow" style="--potion-color:${state.success?.color || order.recipe.color}"></div>
    <button class="scene-familiar" data-action="pet" aria-label="Pet ${pet.name}"><img src="${art(pet.art)}" alt="${pet.name}, your ${pet.species.toLowerCase()}"/><span class="pet-heart" aria-hidden="true">♡</span></button>
    <div class="cauldron-wrap">${cauldron(state.success?.color || order.recipe.color)}</div>
    <div class="familiar-caption"><span class="familiar-caption-name">${pet.name} ${icon('heart')}</span><span>Your brewing buddy</span></div>
    <div class="pet-speech" aria-live="polite">${state.petLine || pet.greeting}</div>
    <div class="counter-front"></div>
  </div>`;
}
function ingredientShelf() {
  const order = currentOrder(save);
  return `<section class="ingredient-shelf" aria-labelledby="ingredients-heading">
    <div class="shelf-heading"><div><h2 id="ingredients-heading">A spoonful of something special</h2><p>Choose a measure, then tap an ingredient to pour.</p></div>
      <div class="scoop-picker" role="group" aria-label="Measuring cup size">${[1, 2, 4].map(n => `<button class="scoop-button ${state.scoop === n ? 'selected' : ''}" data-action="scoop" data-value="${n}" aria-pressed="${state.scoop === n}" aria-label="Use ${formatCups(n)} cup scoop"><span class="scoop-drawing" style="--fill:${n / 4 * 100}%"><span></span></span><span>${formatCups(n)} cup</span></button>`).join('')}</div>
    </div>
    <div class="ingredients">${INGREDIENTS.map(i => `<button class="ingredient ${state.lastIngredient === i.id ? 'just-poured' : ''}" data-action="pour" data-ingredient="${i.id}" aria-label="Pour ${formatCups(state.scoop)} cup of ${i.noun}" ${state.success ? 'disabled' : ''} style="--ingredient-color:${i.color}"><span class="ingredient-art"><img src="${art(i.art)}" alt=""/></span><span class="ingredient-name">${i.name}</span><span class="ingredient-amount">${cupLabel(state.mixture[i.id])} added</span>${order.target[i.id] ? '<span class="needed-dot" aria-label="Needed for this recipe"></span>' : ''}</button>`).join('')}</div>
  </section>`;
}
function recipeRows(order) {
  return INGREDIENTS.filter(i => order.target[i.id]).map(i => {
    const actual = state.mixture[i.id];
    const needed = order.target[i.id];
    const exact = actual === needed;
    const showTarget = order.batch === 1 || state.showHint;
    const max = Math.max(4, needed, actual);
    return `<div class="recipe-row ${exact ? 'ingredient-complete' : ''}">
      <div class="recipe-row-label"><span class="ingredient-swatch" style="--ingredient-color:${i.color}"></span><span>${i.name}</span><span class="recipe-quantity">${cupLabel(order.recipe.amounts[i.id])}</span></div>
      <div class="recipe-progress">${save.settings.visualHints ? fractionBar(actual, max, i.color, `${cupLabel(actual)} of ${i.name} added${showTarget ? `; need ${cupLabel(needed)}` : ''}`) : '<span></span>'}<span class="recipe-count">${formatCups(actual)}${showTarget ? ` / ${formatCups(needed)}` : ''} ${exact && showTarget ? icon('check') : ''}</span></div>
    </div>`;
  }).join('');
}
function hintText(order) {
  const { differences } = assessMixture(state.mixture, order);
  if (!differences.length) return 'Everything is measured. Your potion is ready to brew!';
  const extra = differences.find(d => d.actual > d.needed);
  if (extra) return extra.needed === 0 ? `${extra.ingredient.name} is not in this recipe. Use Undo to take out the last scoop, or empty the cauldron and try again.` : `There is ${cupLabel(extra.actual - extra.needed)} too much ${extra.ingredient.noun}. Use Undo or empty the cauldron to try a smaller scoop.`;
  const d = differences[0];
  const delta = d.needed - d.actual;
  if (order.batch > 1 && !state.showHint) return `This order needs ${order.batch} bottles. Use ${order.batch} times each amount in the recipe. Tap “A little hint” for the total amounts.`;
  return `Add ${cupLabel(delta)} more ${d.ingredient.noun}. ${delta === 2 ? 'Two ¼-cup scoops make ½ cup.' : delta === 3 ? 'One ½-cup scoop and one ¼-cup scoop make ¾ cup.' : delta === 4 ? 'Four ¼-cup scoops make 1 cup.' : 'Choose a measuring cup and keep going.'}`;
}
function orderPanel() {
  const order = currentOrder(save);
  const recipe = order.recipe;
  if (state.success) return `<aside class="order-panel success-panel" aria-labelledby="success-heading"><div class="success-sparkles" aria-hidden="true">✧ ✦ ✧</div><div class="success-potion" style="--potion-color:${state.success.color}">${icon('bottle')}</div><span class="eyebrow">BEAUTIFULLY BREWED</span><h2 id="success-heading">A little magic,<br/>made by you.</h2><p>${state.success.name} is ready. Your customer is going to love it!</p><div class="earned-coins">${icon('coin')} +${state.success.earned} coins</div><div class="learning-note">${icon('sparkles')}<p>${state.success.batch > 1 ? `You scaled a recipe to make ${state.success.batch} bottles. That is multiplication magic!` : 'You measured a whole potion using fractions. That is real math magic!'}</p></div><button class="button primary next-order" data-action="next">Next customer ${icon('arrow')}</button><button class="button text-button" data-action="tab" data-tab="familiars">Visit your familiars ${icon('paw')}</button></aside>`;
  return `<aside class="order-panel" aria-labelledby="order-heading">
    <div class="order-topline"><span class="eyebrow">A LITTLE REQUEST</span><span class="reward-tag">${icon('coin')} ${order.reward}</span></div>
    <div class="customer"><div class="customer-portrait"><img src="${art(recipe.art)}" alt="${recipe.customer}, your customer"/></div><div><span class="customer-name">${recipe.customer}</span><span class="customer-role">Your next customer</span></div><span class="order-number">No. ${String(save.completed + 1).padStart(2, '0')}</span></div>
    <p class="customer-request">“${order.batch > 1 ? `Could you make ${order.batch} bottles of ${recipe.name.toLowerCase()} for my friends?` : recipe.request}”</p>
    <div class="recipe-heading"><span class="tiny-bottle" style="--potion-color:${recipe.color}">${icon('bottle')}</span><div><h2 id="order-heading">${recipe.name}</h2><p>${recipe.subtitle}</p></div></div>
    <div class="recipe-meta"><span>${icon('book')} Recipe for 1 bottle</span><span class="batch-badge">Make ${order.batch} ${order.batch === 1 ? 'bottle' : 'bottles'}</span></div>
    <div class="recipe-rows">${recipeRows(order)}</div>
    <div class="recipe-total"><span>In your cauldron</span><strong>${cupLabel(totalUnits())}</strong></div>
    ${order.batch > 1 ? `<div class="batch-notice">${icon('sparkles')} Multiply each recipe amount by ${order.batch}.</div>` : ''}
    <div class="feedback ${state.feedbackType}" role="status">${state.feedback || (state.showHint ? hintText(order) : 'No rush. Every scoop is a little bit of learning.')}</div>
    <button class="hint-button" data-action="hint">${icon('help')} ${state.showHint ? 'Another little hint' : 'A little hint'}</button>
    <div class="brew-actions"><button class="button primary brew-button" data-action="brew" ${totalUnits() === 0 ? 'disabled' : ''}>${icon('sparkles')} Brew potion</button><div class="correction-actions"><button class="icon-button" data-action="undo" aria-label="Undo last scoop" data-tooltip="Undo last scoop" ${!state.history.length ? 'disabled' : ''}>${icon('undo')}</button><button class="icon-button" data-action="clear" aria-label="Empty cauldron" data-tooltip="Empty cauldron" ${!totalUnits() ? 'disabled' : ''}>${icon('trash')}</button></div></div>
    <p class="no-penalty">Unlimited ingredients. All the time you need.</p>
  </aside>`;
}
function shopView() {
  return `<div class="shop-layout"><div class="workbench">${scene()}${ingredientShelf()}</div>${orderPanel()}</div><div class="below-shop"><span>${icon('heart')} A cozy place to practice, one potion at a time.</span><button class="text-link" data-action="help">New here? Let us show you around ${icon('arrow')}</button></div>`;
}
function familiarsView() {
  return `<section class="collection-view" aria-labelledby="collection-heading"><div class="collection-heading"><div><span class="eyebrow">GOOD COMPANY, GREAT POTIONS</span><h2 id="collection-heading">A familiar kind of friendship.</h2><p>Fill your little shop with friends. Your brewing buddy is always here to cheer you on.</p></div><span class="collection-count">${save.owned.length} of ${FAMILIARS.length} adopted</span></div><div class="familiar-grid">${FAMILIARS.map(p => {
    const owned = save.owned.includes(p.id); const active = save.active === p.id; const enough = save.coins >= p.cost;
    return `<article class="familiar-card ${active ? 'active-familiar' : ''}"><div class="familiar-art"><span class="familiar-halo"></span><img src="${art(p.art)}" alt="${p.name}, a ${p.species.toLowerCase()}"/>${owned ? `<span class="owned-tag">${icon(active ? 'heart' : 'check')} ${active ? 'Brewing buddy' : 'Adopted'}</span>` : ''}</div><span class="eyebrow">${p.species}</span><h3>${p.name}</h3><p>${p.description}</p><span class="favorite">${icon('bottle')} ${p.perk}</span><button class="button ${active ? 'soft-button' : 'primary'}" data-action="${owned ? 'select-pet' : 'adopt'}" data-pet="${p.id}" ${active || (!owned && !enough) ? 'disabled' : ''}>${active ? `${icon('check')} By your side` : owned ? 'Choose as buddy' : `${icon('coin')} Adopt for ${p.cost} coins`}</button>${!owned && !enough ? `<span class="cost-note">${p.cost - save.coins} more coins to meet ${p.name}</span>` : '<span class="cost-note">A friend for every little adventure.</span>'}</article>`;
  }).join('')}</div><button class="button back-to-brewing" data-action="tab" data-tab="shop">${icon('bottle')} Back to brewing ${icon('arrow')}</button></section>`;
}
function cozyView() {
  return `<section class="collection-view" aria-labelledby="cozy-heading"><div class="collection-heading"><div><span class="eyebrow">MAKE YOURSELF AT HOME</span><h2 id="cozy-heading">Your own little cozy corner.</h2><p>A few well-earned coins, a few lovely things. Make the shop feel like yours.</p></div></div><div class="cozy-layout"><div class="cozy-scene">${scene()}</div><div class="decorations">${DECORATIONS.map(d => {
    const owned = save.decorations.includes(d.id); const enough = save.coins >= d.cost;
    return `<article class="decoration-card"><span class="decoration-icon">${icon(d.icon)}</span><h3>${d.name}</h3><p>${d.description}</p><button class="button ${owned ? 'soft-button' : 'primary'}" data-action="decorate" data-decoration="${d.id}" ${owned || !enough ? 'disabled' : ''}>${owned ? `${icon('check')} In your shop` : `${icon('coin')} ${d.cost} coins`}</button>${!owned && !enough ? `<span class="cost-note">${d.cost - save.coins} more coins</span>` : ''}</article>`;
  }).join('')}</div></div></section>`;
}
function render() {
  const focused = document.activeElement;
  const focusKey = focused?.dataset?.action ? { action: focused.dataset.action, value: focused.dataset.value, ingredient: focused.dataset.ingredient, tab: focused.dataset.tab, pet: focused.dataset.pet } : null;
  app.innerHTML = `<header class="site-header"><a class="brand" href="#" aria-label="Paws and Potions home"><span class="brand-mark">${icon('bottle')}${icon('sparkles', 'brand-sparkle')}</span><span class="brand-text">Paws <span class="brand-amp">&</span> Potions<small>A LITTLE EVERYDAY MAGIC</small></span></a><div class="header-actions"><div class="coin-balance" aria-label="${save.coins} coins">${icon('coin')}<strong>${save.coins}</strong><span>coins</span></div><button class="icon-button settings-button" data-action="settings" aria-label="Learning settings">${icon('settings')}</button></div></header>
    <main><div class="page-intro"><div><span class="eyebrow intro-eyebrow">WELCOME TO YOUR LITTLE APOTHECARY</span><h1>A little everyday magic.</h1><p>Good potions. New friends. A spoonful of discovery.</p></div><div class="progress-note">${icon('bottle')}<div><strong>${save.completed} ${save.completed === 1 ? 'potion order' : 'potion orders'} brewed</strong><span>${save.completed ? 'Look at all the magic you have made.' : 'Your first little adventure is waiting.'}</span></div></div></div>
    <nav class="main-nav" aria-label="Shop areas">${[['shop', 'bottle', 'The potion shop'], ['familiars', 'paw', 'My familiars'], ['cozy', 'leaf', 'The cozy corner']].map(([tab, glyph, label]) => `<button class="nav-tab ${state.tab === tab ? 'active' : ''}" data-action="tab" data-tab="${tab}" aria-current="${state.tab === tab ? 'page' : 'false'}">${icon(glyph)}${label}${tab === 'familiars' ? `<span class="nav-count">${save.owned.length}</span>` : ''}</button>`).join('')}<span class="nav-aside">${icon('leaf')} Made for growing minds</span></nav>
    ${state.tab === 'shop' ? shopView() : state.tab === 'familiars' ? familiarsView() : cozyView()}
    ${!storageAvailable ? '<div class="storage-warning" role="status">Your browser cannot save right now. You can keep playing, but this session may not be remembered.</div>' : ''}
    </main><footer><span>Paws & Potions <span class="footer-star">✦</span> Small steps. Wonderful things.</span><button class="text-link" data-action="help">${icon('help')} A helping paw</button></footer>`;
  if (focusKey) {
    const candidates = [...app.querySelectorAll('button[data-action]')];
    const match = candidates.find(b => Object.entries(focusKey).every(([k, v]) => v === undefined || b.dataset[k] === v));
    if (match && !match.disabled) match.focus({ preventScroll: true });
  }
}

function closeDialog() { const dialog = document.querySelector('dialog'); if (dialog) { dialog.close(); dialog.remove(); } if (dialogReturnFocus?.isConnected) dialogReturnFocus.focus(); }
function openDialog(kind) {
  closeDialog(); dialogReturnFocus = document.activeElement;
  const dialog = document.createElement('dialog'); dialog.className = 'game-dialog';
  const settings = kind === 'settings';
  dialog.innerHTML = `<div class="dialog-heading"><span class="dialog-icon">${icon(settings ? 'settings' : 'paw')}</span><button class="icon-button" data-action="close-dialog" aria-label="Close ${settings ? 'settings' : 'help'}">${icon('close')}</button></div><span class="eyebrow">${settings ? 'A LITTLE ROOM TO GROW' : 'A HELPING PAW'}</span><h2>${settings ? 'Every alchemist learns differently.' : 'Let us make a little magic.'}</h2>${settings ? `<p>Choose what feels right. There are no timers and no penalties for trying.</p><fieldset><legend>Recipe difficulty</legend><label class="setting-option"><input type="radio" name="difficulty" value="gentle" ${save.settings.difficulty === 'gentle' ? 'checked' : ''}/><span><strong>A gentle start</strong><small>One bottle at a time. Practice halves and quarters.</small></span></label><label class="setting-option"><input type="radio" name="difficulty" value="growing" ${save.settings.difficulty === 'growing' ? 'checked' : ''}/><span><strong>A little more magic</strong><small>Make batches of 2 or 3. Multiply recipe quantities.</small></span></label></fieldset><label class="toggle-setting"><span><strong>Visual fraction helpers</strong><small>Show quarter-cup bars beside each ingredient.</small></span><input type="checkbox" name="visualHints" ${save.settings.visualHints ? 'checked' : ''}/></label><label class="toggle-setting"><span><strong>Gentle sounds</strong><small>A little chime when you pour or finish a potion.</small></span><input type="checkbox" name="sound" ${save.settings.sound ? 'checked' : ''}/></label><p class="settings-note">Changing recipe difficulty starts a fresh mixture. Coins and friends stay with you.</p><button class="button primary" data-action="save-settings">Save & keep brewing ${icon('arrow')}</button>` : `<ol class="help-steps"><li><span>1</span><div><strong>Meet your customer.</strong><p>The recipe shows what goes into one bottle. Check how many bottles they need.</p></div></li><li><span>2</span><div><strong>Pick a measuring cup.</strong><p>Choose ¼, ½, or 1 cup, then tap an ingredient to pour that amount.</p></div></li><li><span>3</span><div><strong>Stir up something wonderful.</strong><p>Match the recipe and tap Brew potion. Undo, empty, and hints are always here to help.</p></div></li><li><span>4</span><div><strong>Make a friend.</strong><p>Spend your coins on new familiars or something lovely for your shop. Tap your buddy for encouragement.</p></div></li></ol><div class="install-note">${icon('heart')}<p>On iPad, open this page in Safari and choose Share → Add to Home Screen. ${serviceWorkerReady ? 'Your shop is ready for offline visits on this device.' : 'Visit once online to let the shop prepare for offline play.'} Progress stays in this browser on this device.</p></div><button class="button primary" data-action="close-dialog">Let us brew ${icon('sparkles')}</button>`}`;
  document.body.append(dialog); dialog.showModal();
  dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDialog(); } });
  dialog.addEventListener('cancel', e => { e.preventDefault(); closeDialog(); });
}

document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (action === 'close-dialog') { closeDialog(); return; }
  if (action === 'settings' || action === 'help') { openDialog(action); return; }
  if (action === 'save-settings') {
    const dialog = document.querySelector('dialog');
    const difficulty = dialog.querySelector('input[name="difficulty"]:checked').value;
    if (save.settings.difficulty !== difficulty) { state.mixture = blankMixture(); state.history = []; state.success = null; state.feedback = ''; state.showHint = false; }
    save = { ...save, settings: { difficulty, visualHints: dialog.querySelector('input[name="visualHints"]').checked, sound: dialog.querySelector('input[name="sound"]').checked } };
    commit(); closeDialog(); render(); notify('Your learning settings are saved.'); return;
  }
  if (action === 'tab') { state.tab = button.dataset.tab; render(); return; }
  if (action === 'scoop') { state.scoop = Number(button.dataset.value); state.lastIngredient = null; render(); return; }
  if (action === 'pet') {
    const p = familiar(); state.petLine = p.lines[Math.floor(Math.random() * p.lines.length)];
    const speech = app.querySelector('.pet-speech'); if (speech) speech.textContent = state.petLine;
    button.classList.remove('petted'); void button.offsetWidth; button.classList.add('petted'); chime(); return;
  }
  if (action === 'adopt') {
    const next = adopt(save, button.dataset.pet); if (next === save) return;
    save = next; state.petLine = ''; commit(); render(); chime(true); notify(`${familiar().name} is home! Your new friend is ready to brew with you.`); return;
  }
  if (action === 'select-pet') { if (save.owned.includes(button.dataset.pet)) { save.active = button.dataset.pet; state.petLine = ''; commit(); render(); notify(`${familiar().name} is your brewing buddy.`); } return; }
  if (action === 'decorate') { const next = decorate(save, button.dataset.decoration); if (next !== save) { save = next; commit(); render(); chime(true); notify('Your shop is a little cozier.'); } return; }
  if (action === 'next') { state.success = null; state.mixture = blankMixture(); state.history = []; state.feedback = ''; state.feedbackType = ''; state.showHint = false; state.lastIngredient = null; render(); app.querySelector('[data-action="pour"]')?.focus({ preventScroll: true }); return; }
  if (state.success) return;
  if (action === 'pour') {
    const next = pour(state.mixture, button.dataset.ingredient, state.scoop);
    if (next === state.mixture) { notify('Your cauldron is full. Undo a scoop or empty it to keep experimenting.'); return; }
    state.history.push(state.mixture); state.mixture = next; state.lastIngredient = button.dataset.ingredient; state.feedback = ''; state.feedbackType = ''; chime();
    if (assessMixture(state.mixture, currentOrder(save)).correct) { state.feedback = 'Just right! Your potion is ready to brew.'; state.feedbackType = 'ready'; }
    render(); return;
  }
  if (action === 'undo') { state.mixture = state.history.pop() || blankMixture(); state.feedback = ''; state.feedbackType = ''; state.lastIngredient = null; render(); return; }
  if (action === 'clear') { state.mixture = blankMixture(); state.history = []; state.feedback = 'A fresh cauldron. You can try as many times as you like.'; state.feedbackType = ''; state.lastIngredient = null; render(); return; }
  if (action === 'hint') { state.showHint = true; state.feedback = hintText(currentOrder(save)); state.feedbackType = 'helpful'; render(); return; }
  if (action === 'brew') {
    const order = currentOrder(save);
    const result = completeOrder(save, state.mixture, order.id);
    if (!result.earned) { state.feedback = hintText(order); state.feedbackType = 'helpful'; render(); return; }
    save = result.save; state.success = { name: order.recipe.name, color: order.recipe.color, batch: order.batch, earned: result.earned }; state.petLine = 'You did it! That was a wonderful bit of math magic.'; commit(); chime(true); render(); app.querySelector('[data-action="next"]')?.focus({ preventScroll: true });
  }
});
document.addEventListener('click', e => { if (e.target.closest('.brand')) { e.preventDefault(); state.tab = 'shop'; render(); } });
const toast = document.createElement('div'); toast.id = 'toast'; toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.append(toast);
render();
if ('serviceWorker' in navigator && document.querySelector('meta[name="paws-build"]')?.content === 'production') {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').then(async registration => { await navigator.serviceWorker.ready; serviceWorkerReady = true; registration.update().catch(() => {}); }).catch(() => {}));
}
