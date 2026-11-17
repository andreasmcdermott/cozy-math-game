import { INGREDIENTS, RECIPES, FAMILIARS, DECORATIONS, CUP, CAPACITY, mixtureFor, stockTotal, canFinishOrder, loadSave, persistSave, formatCups, cupLabel, parseCups, currentOrder, assessMixture, pour, undoPour, returnMixture, recoverPortion, completeOrder, currentSupplyTask, completeSupplyTask, adopt, decorate } from './game.js';
import { icon } from './icons.js';
import { commonDenominator } from './fractions.js';

let storage;
try { storage = window.localStorage; } catch { storage = { getItem() { throw new Error('Storage unavailable'); }, setItem() { throw new Error('Storage unavailable'); } }; }
const loaded = loadSave(storage);
let save = loaded.save;
let storageAvailable = loaded.available;
const state = { tab: 'shop', ingredient: 'moonwater', mixture: mixtureFor(save), supplySkill: 'arithmetic', supplySuccess: null, supplyFeedback: '', feedback: '', feedbackType: '', success: null, showHint: false, petLine: '', lastIngredient: null };
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
  return `<div class="fraction-meter" role="img" aria-label="${label}"><span style="width:${Math.min(100, units / max * 100)}%;--ingredient-color:${color}"></span></div>`;
}
function cauldron(color) {
  const total = totalUnits();
  const y = Math.max(112, 150 - total / CUP * 8);
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
  const ingredient = INGREDIENTS.find(i => i.id === state.ingredient);
  const stock = save.stock[ingredient.id];
  const sizes = [...new Set([5, 6, 10, 12, 15, 20, ...Object.keys(stock).map(Number)])].sort((a, b) => b - a);
  const lots = save.brew.lots.filter(lot => lot.ingredient === ingredient.id);
  return `<section class="ingredient-shelf pantry" aria-labelledby="ingredients-heading">
    <div class="shelf-heading"><div><h2 id="ingredients-heading">Your ingredient pantry</h2><p>Every portion is yours to plan with. Used portions leave your stock.</p></div><button class="text-link supply-link" data-action="tab" data-tab="supplies">${icon('leaf')} Get supplies ${icon('arrow')}</button></div>
    <div class="ingredients">${INGREDIENTS.map(i => `<button class="ingredient ${state.ingredient === i.id ? 'selected-ingredient' : ''}" data-action="ingredient" data-ingredient="${i.id}" aria-pressed="${state.ingredient === i.id}" style="--ingredient-color:${i.color}"><span class="ingredient-art"><img src="${art(i.art)}" alt=""/></span><span class="ingredient-name">${i.name}</span><span class="ingredient-amount">${Object.values(save.stock[i.id]).reduce((a, b) => a + b, 0)} portions left</span>${order.target[i.id] ? '<span class="needed-dot" aria-label="Needed for this recipe"></span>' : ''}</button>`).join('')}</div>
    <div class="portion-tray"><div class="portion-heading"><h3>${ingredient.name} portions</h3><span>Tap to pour the whole portion</span></div><div class="portion-buttons">${sizes.map(units => `<button class="portion-button" data-action="pour" data-ingredient="${ingredient.id}" data-units="${units}" aria-label="Pour ${cupLabel(units)} of ${ingredient.noun}, ${stock[units] || 0} available" ${!stock[units] || state.success ? 'disabled' : ''}><strong>${formatCups(units)} <small>cup${units > CUP ? 's' : ''}</small></strong><span>× ${stock[units] || 0} left</span></button>`).join('')}</div>
    <div class="blend-equation" aria-live="polite"><span>Your blend</span><strong>${lots.length ? `${lots.slice(-8).map(lot => formatCups(lot.units)).join(' + ')}${lots.length > 8 ? ' + …' : ''} = ${save.settings.visualHints ? formatCups(state.mixture[ingredient.id]) : '?'} cup${state.mixture[ingredient.id] > CUP ? 's' : ''}` : 'No portions added yet'}</strong></div></div>
    ${!canFinishOrder(save) && !state.success ? `<p class="pantry-low">${icon('leaf')} You need more stock for this order. Supply errands earn free ingredient crates.</p>` : ''}
  </section>`;
}
function recipeRows(order) {
  const reveal = save.settings.visualHints || state.showHint;
  return INGREDIENTS.filter(i => order.target[i.id]).map(i => {
    const actual = state.mixture[i.id], needed = order.target[i.id];
    const count = save.brew.lots.filter(lot => lot.ingredient === i.id).length;
    return `<div class="recipe-row ${reveal && actual === needed ? 'ingredient-complete' : ''}"><div class="recipe-row-label"><span class="ingredient-swatch" style="--ingredient-color:${i.color}"></span><span>${i.name}</span><span class="recipe-quantity">${cupLabel(order.recipe.amounts[i.id])}</span></div>
      <div class="recipe-progress">${reveal ? fractionBar(actual, Math.max(CUP, Math.ceil(needed / CUP) * CUP, actual), i.color, `${cupLabel(actual)} added; need ${cupLabel(needed)}`) : `<span class="portions-added">${count} ${count === 1 ? 'portion' : 'portions'} added</span>`}<span class="recipe-count">${reveal ? `${formatCups(actual)} / ${formatCups(needed)} ${actual === needed ? icon('check') : ''}` : 'Combine your fractions'}</span></div></div>`;
  }).join('');
}
function hintText(order, reveal = state.showHint) {
  const { differences } = assessMixture(state.mixture, order);
  if (!differences.length) return 'Your ingredient quantities match. Ready to brew!';
  const extra = differences.find(d => d.actual > d.needed);
  if (extra) return extra.needed === 0 ? `${extra.ingredient.name} is not in this recipe. Undo that pour or use Recover to return it.` : `${extra.ingredient.name} has too much.${reveal ? ` Recover ${cupLabel(extra.actual - extra.needed)} to reach the target.` : ' Add your fractions, then use Recover to subtract the extra amount.'}`;
  const d = differences[0], delta = d.needed - d.actual;
  if (!canFinishOrder(save)) return 'Your pantry needs a delivery. Help with a supply errand, then come back to this mixture.';
  if (!reveal) return `Check the total ${d.ingredient.noun}. Combine your portions${order.batch > 1 ? ` and multiply the recipe by ${order.batch}` : ''}. A little hint can show the remaining amount.`;
  const available = Object.keys(save.stock[d.ingredient.id]).map(Number).sort((a, b) => b - a);
  const unlike = available.find(n => n !== available[0]);
  const common = available.length > 1 ? commonDenominator(available[0], unlike) : null;
  return `You still need ${cupLabel(delta)} of ${d.ingredient.noun}.${common ? ` A common denominator helps: ${formatCups(available[0])} = ${common.a}/${common.denominator}, and ${formatCups(unlike)} = ${common.b}/${common.denominator}.` : ' You can combine portions or pour a larger amount and recover the excess.'}`;
}
function orderPanel() {
  const order = currentOrder(save);
  const recipe = order.recipe;
  if (state.success) return `<aside class="order-panel success-panel" aria-labelledby="success-heading"><div class="success-sparkles" aria-hidden="true">✧ ✦ ✧</div><div class="success-potion" style="--potion-color:${state.success.color}">${icon('bottle')}</div><span class="eyebrow">BEAUTIFULLY BREWED</span><h2 id="success-heading">A little magic,<br/>made by you.</h2><p>${state.success.name} is ready. Your customer is going to love it!</p><div class="earned-coins">${icon('coin')} +${state.success.earned} coins</div><div class="learning-note">${icon('sparkles')}<p>${state.success.batch > 1 ? `You scaled a recipe to make ${state.success.batch} bottles. That is multiplication magic!` : 'You combined your own finite portions into an exact recipe. That is fraction magic!' }</p></div><button class="button primary next-order" data-action="next">Next customer ${icon('arrow')}</button><button class="button text-button" data-action="tab" data-tab="familiars">Visit your familiars ${icon('paw')}</button></aside>`;
  return `<aside class="order-panel" aria-labelledby="order-heading">
    <div class="order-topline"><span class="eyebrow">A LITTLE REQUEST</span><span class="reward-tag">${icon('coin')} ${order.reward}</span></div>
    <div class="customer"><div class="customer-portrait"><img src="${art(recipe.art)}" alt="${recipe.customer}, your customer"/></div><div><span class="customer-name">${recipe.customer}</span><span class="customer-role">Your next customer</span></div><span class="order-number">No. ${String(save.completed + 1).padStart(2, '0')}</span></div>
    <p class="customer-request">“${order.batch > 1 ? `Could you make ${order.batch} bottles of ${recipe.name.toLowerCase()} for my friends?` : recipe.request}”</p>
    <div class="recipe-heading"><span class="tiny-bottle" style="--potion-color:${recipe.color}">${icon('bottle')}</span><div><h2 id="order-heading">${recipe.name}</h2><p>${recipe.subtitle}</p></div></div>
    <div class="recipe-meta"><span>${icon('book')} Recipe for 1 bottle</span><span class="batch-badge">Make ${order.batch} ${order.batch === 1 ? 'bottle' : 'bottles'}</span></div>
    <div class="recipe-rows">${recipeRows(order)}</div>
    <div class="recipe-total"><span>In your cauldron</span><strong>${save.settings.visualHints || state.showHint ? cupLabel(totalUnits()) : `${save.brew.lots.length} portions`}</strong></div>
    ${order.batch > 1 ? `<div class="batch-notice">${icon('sparkles')} Multiply each recipe amount by ${order.batch}.</div>` : ''}
    <div class="feedback ${state.feedbackType}" role="status">${state.feedback || (state.showHint ? hintText(order) : 'Take your time. Plan which portions make the recipe.')}</div>
    <button class="hint-button" data-action="hint">${icon('help')} ${state.showHint ? 'Another little hint' : 'A little hint'}</button>
    <button class="button recover-button" data-action="recover" ${!save.brew.lots.length ? 'disabled' : ''}>${icon('bottle')} Recover a portion · subtraction</button><div class="brew-actions"><button class="button primary brew-button" data-action="brew" ${totalUnits() === 0 ? 'disabled' : ''}>${icon('sparkles')} Brew potion</button><div class="correction-actions"><button class="icon-button" data-action="undo" aria-label="Undo last portion" ${!save.brew.undoDepth ? 'disabled' : ''}>${icon('undo')}</button><button class="icon-button" data-action="clear" aria-label="Return mixture to pantry" ${!totalUnits() ? 'disabled' : ''}>${icon('trash')}</button></div></div>
    <p class="no-penalty">Finite ingredients. Unlimited time to think.</p>
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
function supplyView() {
  const task = currentSupplyTask(save, state.supplySkill);
  const garden = task.dimensions;
  const success = state.supplySuccess;
  return `<section class="collection-view supply-view" aria-labelledby="supply-heading"><div class="collection-heading"><div><span class="eyebrow">A LITTLE WORK, A WELL-STOCKED PANTRY</span><h2 id="supply-heading">A helping paw earns supplies.</h2><p>Help your neighbors with a math errand. Each success brings a crate of 48 pre-measured ingredient portions.</p></div><span class="collection-count">${save.supplyCompleted} errands helped</span></div>
    <div class="supply-tabs" role="group" aria-label="Errand subject">${[['arithmetic', 'Delivery arithmetic'], ['algebra', 'Lost formulas'], ['geometry', 'Herb-garden geometry']].map(([skill, label]) => `<button class="button ${state.supplySkill === skill ? 'soft-button' : ''}" data-action="supply-skill" data-skill="${skill}" aria-pressed="${state.supplySkill === skill}">${label}</button>`).join('')}</div>
    <div class="errand-layout"><article class="errand-card">${success ? `<div class="delivery-success">${icon('check')}<span class="eyebrow">SUPPLIES HAVE ARRIVED</span><h3>Good thinking. Full shelves.</h3><p>You earned 2 portions of each size for every ingredient: 1/3, 1/4, 1/5, 1/6, 1/10, and 1/12 cup.</p><div class="delivery-reward">${icon('bottle')} +48 ingredient portions</div><button class="button primary" data-action="tab" data-tab="shop">Back to your potion ${icon('arrow')}</button><button class="button text-button" data-action="next-supply">Help with another errand</button></div>` : `<span class="eyebrow">${task.skill === 'algebra' ? 'SOLVE FOR THE MISSING NUMBER' : task.skill === 'geometry' ? 'GROW YOUR GEOMETRY' : 'A DELIVERY TO FIGURE OUT'}</span><h3>${task.title}</h3><p class="errand-story">${task.story}</p>
      ${garden ? `<figure class="garden-diagram" aria-label="Rectangular garden ${garden.width} meters long and ${garden.height} meters wide${garden.depth > 1 ? `, with ${garden.depth} one-meter layers` : ''}"><span class="garden-width">${garden.width} m long</span><div class="garden-grid" style="--columns:${garden.width}">${Array.from({ length: garden.width * garden.height }, () => `<span>${icon('leaf')}</span>`).join('')}</div><figcaption>${garden.height} m wide${garden.depth > 1 ? ` · ${garden.depth} m deep` : ' · each square is 1 m²'}</figcaption></figure>` : `<div class="errand-illustration"><img src="${art(task.skill === 'algebra' ? 'lavender-dragon' : 'rabbit')}" alt=""/><span>${icon(task.skill === 'algebra' ? 'book' : 'bottle')}</span></div>`}
      <div class="errand-expression">${task.expression}</div><p class="errand-prompt">${task.prompt}</p><form id="supply-form" data-task="${task.id}"><label for="supply-answer">Your answer, in ${task.unit}</label><div class="answer-row"><input id="supply-answer" name="answer" type="text" inputmode="decimal" autocomplete="off" required placeholder="Type your answer"/><button class="button primary" type="submit">Check & collect ${icon('arrow')}</button></div></form><p id="supply-feedback" class="errand-feedback" role="status"></p><button class="hint-button" data-action="supply-hint">${icon('help')} A little hint</button>`}</article>
    <aside class="supply-side"><img src="${art(familiar().art)}" alt="Your familiar is cheering you on"/><h3>Every portion counts.</h3><p>Brewing spends the portions you choose. Errands bring new supplies without spending your coins.</p><div class="crate-sizes">${[20, 15, 12, 10, 6, 5].map(units => `<span>${formatCups(units)} cup <strong>× 2</strong></span>`).join('')}</div><p class="crate-caption">Of each size, for each of the four ingredients.</p><button class="text-link" data-action="tab" data-tab="shop">Your unfinished potion is saved ${icon('arrow')}</button></aside></div></section>`;
}
function render() {
  state.mixture = state.success ? state.success.mixture : mixtureFor(save);
  const focused = document.activeElement;
  const focusKey = focused?.dataset?.action ? { action: focused.dataset.action, value: focused.dataset.value, ingredient: focused.dataset.ingredient, tab: focused.dataset.tab, pet: focused.dataset.pet, units: focused.dataset.units, skill: focused.dataset.skill } : null;
  app.innerHTML = `<header class="site-header"><a class="brand" href="#" aria-label="Paws and Potions home"><span class="brand-mark">${icon('bottle')}${icon('sparkles', 'brand-sparkle')}</span><span class="brand-text">Paws <span class="brand-amp">&</span> Potions<small>A LITTLE EVERYDAY MAGIC</small></span></a><div class="header-actions"><div class="coin-balance" aria-label="${save.coins} coins">${icon('coin')}<strong>${save.coins}</strong><span>coins</span></div><button class="icon-button settings-button" data-action="settings" aria-label="Learning settings">${icon('settings')}</button></div></header>
    <main><div class="page-intro"><div><span class="eyebrow intro-eyebrow">WELCOME TO YOUR LITTLE APOTHECARY</span><h1>A little everyday magic.</h1><p>Good potions. New friends. A spoonful of discovery.</p></div><div class="progress-note">${icon('bottle')}<div><strong>${save.completed} ${save.completed === 1 ? 'potion order' : 'potion orders'} brewed</strong><span>${save.completed ? 'Look at all the magic you have made.' : 'Your first little adventure is waiting.'}</span></div></div></div>
    <nav class="main-nav" aria-label="Shop areas">${[['shop', 'bottle', 'The potion shop'], ['familiars', 'paw', 'My familiars'], ['cozy', 'leaf', 'The cozy corner'], ['supplies', 'book', 'Supply errands']].map(([tab, glyph, label]) => `<button class="nav-tab ${state.tab === tab ? 'active' : ''}" data-action="tab" data-tab="${tab}" aria-current="${state.tab === tab ? 'page' : 'false'}">${icon(glyph)}${label}${tab === 'familiars' ? `<span class="nav-count">${save.owned.length}</span>` : ''}</button>`).join('')}<span class="nav-aside">${icon('leaf')} Made for growing minds</span></nav>
    ${state.tab === 'shop' ? shopView() : state.tab === 'familiars' ? familiarsView() : state.tab === 'supplies' ? supplyView() : cozyView()}
    ${!storageAvailable ? '<div class="storage-warning" role="status">Your browser cannot save right now. You can keep playing, but this session may not be remembered.</div>' : ''}
    </main><footer><span>Paws & Potions <span class="footer-star">✦</span> Small steps. Wonderful things.</span><button class="text-link" data-action="help">${icon('help')} A helping paw</button></footer>`;
  if (focusKey) {
    const candidates = [...app.querySelectorAll('button[data-action]')];
    const match = candidates.find(b => Object.entries(focusKey).every(([k, v]) => v === undefined || b.dataset[k] === v));
    if (match && !match.disabled) match.focus({ preventScroll: true });
    else if (focusKey.action === 'pour') app.querySelector('.portion-button:not(:disabled)')?.focus({ preventScroll: true });
  }
}

function closeDialog() { const dialog = document.querySelector('dialog'); if (dialog) { dialog.close(); dialog.remove(); } if (dialogReturnFocus?.isConnected) dialogReturnFocus.focus(); }
function openDialog(kind) {
  closeDialog(); dialogReturnFocus = document.activeElement;
  const dialog = document.createElement('dialog'); dialog.className = 'game-dialog';
  const settings = kind === 'settings';
  if (kind === 'recover') {
    const mix = mixtureFor(save);
    const options = INGREDIENTS.filter(i => mix[i.id] > 0);
    if (!options.length) return;
    const chosen = options.find(i => i.id === state.ingredient) || options[0];
    dialog.innerHTML = `<div class="dialog-heading"><span class="dialog-icon">${icon('bottle')}</span><button class="icon-button" data-action="close-dialog" aria-label="Close recovery">${icon('close')}</button></div><span class="eyebrow">SUBTRACT A LITTLE, SAVE A LITTLE</span><h2>Recover a portion.</h2><p>Return part of an ingredient to your pantry. Work out what will remain in the cauldron.</p><form id="recover-form"><label for="recover-ingredient">Ingredient to recover</label><select id="recover-ingredient" name="ingredient">${options.map(i => `<option value="${i.id}" ${i.id === chosen.id ? 'selected' : ''}>${i.name}</option>`).join('')}</select><div class="recover-start">In the cauldron: <strong id="recover-before">${cupLabel(mix[chosen.id])}</strong></div><label for="recover-amount">How much will you return? In cups.</label><input id="recover-amount" name="amount" type="text" inputmode="text" required autocomplete="off" placeholder="For example, 1/6"/><label for="recover-remaining">How much will be left? In cups.</label><input id="recover-remaining" name="remaining" type="text" inputmode="text" required autocomplete="off" placeholder="Subtract, then enter a fraction"/><p class="fraction-input-note">Use fractions like 1/3, mixed numbers like 1 1/2, or exact decimals.</p><p id="recover-feedback" class="errand-feedback" role="status"></p><button class="button primary" type="submit">Check subtraction & recover ${icon('arrow')}</button></form>`;
  } else {
    dialog.innerHTML = `<div class="dialog-heading"><span class="dialog-icon">${icon(settings ? 'settings' : 'paw')}</span><button class="icon-button" data-action="close-dialog" aria-label="Close ${settings ? 'settings' : 'help'}">${icon('close')}</button></div><span class="eyebrow">${settings ? 'A LITTLE ROOM TO GROW' : 'A HELPING PAW'}</span><h2>${settings ? 'A challenge that grows with you.' : 'Plan your portions. Make some magic.'}</h2>${settings ? `<p>Fifth-grade fraction puzzles, without a timer. Your pantry portions are finite in both modes.</p><fieldset><legend>Recipe challenge</legend><label class="setting-option"><input type="radio" name="difficulty" value="apprentice" ${save.settings.difficulty === 'apprentice' ? 'checked' : ''}/><span><strong>Fraction alchemist</strong><small>Combine unlike denominators for one bottle. Thirds, quarters, fifths, and more.</small></span></label><label class="setting-option"><input type="radio" name="difficulty" value="scholar" ${save.settings.difficulty === 'scholar' ? 'checked' : ''}/><span><strong>Master of batches</strong><small>Multiply the fractions to make 2 or 3 bottles. Plan more of your stock.</small></span></label></fieldset><label class="toggle-setting"><span><strong>Show running totals</strong><small>Optional fraction totals and visual amount bars. Off by default so you can do the addition.</small></span><input type="checkbox" name="visualHints" ${save.settings.visualHints ? 'checked' : ''}/></label><label class="toggle-setting"><span><strong>Gentle sounds</strong><small>A little chime when you pour or finish a potion.</small></span><input type="checkbox" name="sound" ${save.settings.sound ? 'checked' : ''}/></label><p class="settings-note">Changing recipe challenge returns the unfinished mixture to your pantry. Your coins and friends stay with you.</p><button class="button primary" data-action="save-settings">Save & keep brewing ${icon('arrow')}</button>` : `<ol class="help-steps"><li><span>1</span><div><strong>Plan with what you have.</strong><p>The recipe is for one bottle. Select an ingredient to see the exact portions in your pantry. The × number is how many are left.</p></div></li><li><span>2</span><div><strong>Combine fractions.</strong><p>Tap a portion to pour it all. For example, 1/3 cup + 1/6 cup makes 1/2 cup. Unlike denominators need a common denominator.</p></div></li><li><span>3</span><div><strong>Subtract to recover.</strong><p>Recover lets you return part of an ingredient after calculating what remains. Undo returns the last portion. The return button restores the whole mixture to stock.</p></div></li><li><span>4</span><div><strong>Earn supplies and make friends.</strong><p>Supply errands restock your pantry through arithmetic, algebra, and garden geometry. Brew correct potions to earn coins for pets and decorations.</p></div></li></ol><div class="install-note">${icon('heart')}<p>Stock and unfinished potions save in this browser. On iPad, use Safari → Share → Add to Home Screen. ${serviceWorkerReady ? 'The offline cache is ready on this device.' : 'An online visit prepares the production game for offline play.'}</p></div><button class="button primary" data-action="close-dialog">Let us brew ${icon('sparkles')}</button>`}`;
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
  if (['settings', 'help', 'recover'].includes(action)) { openDialog(action); return; }
  if (action === 'save-settings') {
    const dialog = document.querySelector('dialog');
    const difficulty = dialog.querySelector('input[name="difficulty"]:checked').value;
    if (save.settings.difficulty !== difficulty) { save = returnMixture(save); state.success = null; state.feedback = ''; state.showHint = false; }
    save = { ...save, settings: { difficulty, visualHints: dialog.querySelector('input[name="visualHints"]').checked, sound: dialog.querySelector('input[name="sound"]').checked } };
    commit(); closeDialog(); render(); notify('Your learning settings are saved.'); return;
  }
  if (action === 'tab') { state.tab = button.dataset.tab; render(); const nav = app.querySelector('.main-nav'); if (nav.getBoundingClientRect().top < 0) nav.scrollIntoView({ block: 'start' }); return; }
  if (action === 'ingredient') { state.ingredient = button.dataset.ingredient; state.lastIngredient = null; render(); return; }
  if (action === 'supply-skill') { state.supplySkill = button.dataset.skill; state.supplySuccess = null; render(); return; }
  if (action === 'next-supply') { state.supplySuccess = null; render(); return; }
  if (action === 'supply-hint') { document.getElementById('supply-feedback').textContent = currentSupplyTask(save, state.supplySkill).hint; return; }
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
  if (action === 'next') { state.success = null; state.feedback = ''; state.feedbackType = ''; state.showHint = false; state.lastIngredient = null; state.ingredient = Object.keys(currentOrder(save).recipe.amounts)[0]; render(); return; }
  if (state.success) return;
  if (action === 'pour') {
    const next = pour(save, button.dataset.ingredient, Number(button.dataset.units));
    if (next === save) { notify('That portion is unavailable, or your cauldron is full. Return some of the mixture to keep planning.'); return; }
    save = next; state.lastIngredient = button.dataset.ingredient; state.feedback = ''; state.feedbackType = ''; commit(); chime(); render(); return;
  }
  if (action === 'undo') { save = undoPour(save); state.feedback = ''; state.feedbackType = ''; commit(); render(); return; }
  if (action === 'clear') { save = returnMixture(save); state.feedback = 'Your remaining portions are back in the pantry. Nothing is wasted.'; state.feedbackType = ''; commit(); render(); return; }
  if (action === 'hint') { state.showHint = true; state.feedback = hintText(currentOrder(save), true); state.feedbackType = 'helpful'; render(); return; }
  if (action === 'brew') {
    const order = currentOrder(save); const mixture = mixtureFor(save);
    const result = completeOrder(save, order.id);
    if (!result.earned) { state.feedback = hintText(order); state.feedbackType = 'helpful'; render(); return; }
    save = result.save; state.success = { name: order.recipe.name, color: order.recipe.color, batch: order.batch, earned: result.earned, mixture }; state.petLine = 'Well planned! Every fraction found its place.'; commit(); chime(true); render(); app.querySelector('[data-action="next"]')?.focus({ preventScroll: true });
  }
});

document.addEventListener('change', event => {
  if (event.target.id === 'recover-ingredient') document.getElementById('recover-before').textContent = cupLabel(mixtureFor(save)[event.target.value]);
});
document.addEventListener('submit', event => {
  if (event.target.id === 'recover-form') {
    event.preventDefault(); const form = event.target;
    const ingredient = form.elements.ingredient.value;
    const amount = parseCups(form.elements.amount.value), remaining = parseCups(form.elements.remaining.value);
    const feedback = document.getElementById('recover-feedback');
    if (amount === null || remaining === null || amount === 0) { feedback.textContent = 'Enter a positive amount to return and a remaining amount. Try fractions such as 1/3 or 7/12.'; return; }
    const result = recoverPortion(save, ingredient, amount, remaining);
    if (!result.correct) { feedback.textContent = result.reason === 'too-much' ? 'You cannot return more of this ingredient than the cauldron contains.' : 'Not quite. Use a common denominator, subtract the amount you will return, then simplify what remains.'; return; }
    save = result.save; state.feedback = `${formatCups(result.before)} − ${formatCups(amount)} = ${formatCups(remaining)} cup${remaining > CUP ? 's' : ''}. The recovered portion is back in your pantry.`; state.feedbackType = 'ready'; state.ingredient = ingredient; commit(); closeDialog(); render(); chime(); notify('Correct subtraction. Your portion is back in stock.');
  }
  if (event.target.id === 'supply-form') {
    event.preventDefault(); const form = event.target;
    const result = completeSupplyTask(save, state.supplySkill, form.dataset.task, form.elements.answer.value);
    if (!result.correct) { document.getElementById('supply-feedback').textContent = 'Not quite yet. Check the question and your calculation. A little hint can help you plan the next step.'; return; }
    save = result.save; state.supplySuccess = true; commit(); render(); chime(true); notify('A crate of 48 ingredient portions has arrived.');
  }
});
document.addEventListener('click', e => { if (e.target.closest('.brand')) { e.preventDefault(); state.tab = 'shop'; render(); } });
const toast = document.createElement('div'); toast.id = 'toast'; toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.append(toast);
render();
if ('serviceWorker' in navigator && document.querySelector('meta[name="paws-build"]')?.content === 'production') {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').then(async registration => { await navigator.serviceWorker.ready; serviceWorkerReady = true; registration.update().catch(() => {}); }).catch(() => {}));
}
