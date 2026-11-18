import { INGREDIENTS, FAMILIARS, decorationsFor, ingredientsFor, roomFor, CUP, currentOrder, currentSupplyTask, supplyTasks, puzzleStock, formatCups, cupLabel } from './game.js';
import { icon } from './icons.js';
import { STAGE_WIDTH, STAGE_HEIGHT, cottageBounds, stagePoint, groundedRect } from './stage.js';

const C = { ink: '#493950', muted: '#806b78', plum: '#765585', cream: '#fff4dc', gold: '#e7bd72', wood: '#654433', green: '#597250' };
const images = new Map();
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let invalidate = () => {};
function imageFor(src) {
  if (!images.has(src)) {
    const image = new Image();
    image.onload = () => invalidate();
    image.src = src;
    images.set(src, image);
  }
  return images.get(src);
}
const art = name => `/art/${name}.webp`;
const font = (size, serif, weight) => `${weight || 400} ${size}px ${serif ? 'Lora, Georgia' : '"DM Sans", sans-serif'}`;

// Canvas paints the whole game. Native, transparent controls share the same
// coordinates, retaining browser keyboard, touch, focus, and accessibility behavior.
class Screen {
  constructor(width, height) {
    this.w = width; this.h = height; this.commands = []; this.controls = []; this.descriptions = [];
    this.measure = document.createElement('canvas').getContext('2d');
  }
  draw(fn) { this.commands.push(fn); }
  box(x, y, w, h, fill, stroke, radius = 14, shadow = false) {
    this.draw(ctx => {
      ctx.save();
      if (shadow) { ctx.shadowColor = '#26152a55'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 5; }
      ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fillStyle = fill; ctx.fill();
      ctx.shadowColor = 'transparent';
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
      ctx.restore();
    });
  }
  ellipse(x, y, rx, ry, fill) {
    this.draw(ctx => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); });
  }
  line(x, y, x2, y2, color, width = 1) {
    this.draw(ctx => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); });
  }
  text(text, x, y, size = 14, color = C.ink, options = {}) {
    this.draw(ctx => {
      ctx.font = font(size, options.serif, options.weight); ctx.fillStyle = color;
      ctx.textAlign = options.align || 'left'; ctx.textBaseline = 'top';
      ctx.fillText(String(text), x, y);
    });
  }
  wrap(text, x, y, width, size = 14, color = C.ink, options = {}) {
    this.measure.font = font(size, options.serif, options.weight);
    let line = '', row = 0;
    const height = options.lineHeight || Math.ceil(size * 1.5);
    for (const word of String(text).split(/\s+/)) {
      if (line && this.measure.measureText(`${line} ${word}`).width > width) {
        this.text(line, x, y + row++ * height, size, color, options); line = word;
      } else line += `${line ? ' ' : ''}${word}`;
    }
    if (line) this.text(line, x, y + row++ * height, size, color, options);
    return row * height;
  }
  image(name, x, y, w, h, cover = false, alpha = 1) {
    const image = imageFor(name.startsWith('data:') ? name : art(name));
    this.draw(ctx => {
      if (!image.complete || !image.naturalWidth) return;
      const scale = cover ? Math.max(w / image.width, h / image.height) : Math.min(w / image.width, h / image.height);
      const dw = image.width * scale, dh = image.height * scale;
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.globalAlpha = alpha;
      if (cover === 'floor') ctx.drawImage(image, x, y, w, h);
      else ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); ctx.restore();
    });
  }
  glyph(name, x, y, size = 22, color = C.ink) {
    const svg = icon(name).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace('class="icon "', 'width="24" height="24"').replaceAll('currentColor', color);
    this.image(`data:image/svg+xml,${encodeURIComponent(svg)}`, x, y, size, size);
  }
  control(label, action, x, y, w, h, options = {}) {
    const data = Object.entries(options.data || {}).map(([key, value]) => `data-${key}="${escapeHTML(value)}"`).join(' ');
    this.controls.push(`<button type="${options.submit ? 'submit' : 'button'}" class="canvas-control ${options.className || ''}" ${options.submit ? 'form="supply-form"' : `data-action="${action}"`} ${data} aria-label="${escapeHTML(label)}" title="${escapeHTML(label)}" ${options.pressed !== undefined ? `aria-pressed="${options.pressed}"` : ''} ${options.current ? 'aria-current="page"' : ''} ${options.disabled ? 'disabled' : ''} style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">${escapeHTML(label)}</button>`);
  }
  button(label, action, x, y, w, h = 46, options = {}) {
    const disabled = options.disabled;
    const fill = disabled ? '#e0d5cf' : options.primary ? C.plum : options.dark ? '#543c32ed' : options.selected ? '#e8d8ed' : '#fff4df';
    const color = disabled ? '#85767e' : options.primary || options.dark ? '#fff4dc' : C.ink;
    this.box(x, y, w, h, fill, options.primary ? '#b89bc2' : '#bd9b7d', 12, options.shadow);
    if (options.glyph && !options.iconOnly) this.glyph(options.glyph, x + 13, y + (h - 20) / 2, 20, color);
    if (options.iconOnly) this.glyph(options.glyph, x + (w - 22) / 2, y + (h - 22) / 2, 22, color);
    else this.text(options.text || label, x + w / 2 + (options.glyph ? 10 : 0), y + (h - 16) / 2, options.size || 14, color, { align: 'center', weight: 600 });
    this.control(label, action, x, y, w, h, options);
  }
  parchment(x, y, w, h) {
    this.box(x, y, w, h, '#fff2dbeF', '#c6a77f', 18, true);
    this.box(x + 7, y + 7, w - 14, h - 14, '#fff7e400', '#ddc7a3', 13);
    this.ellipse(x + 25, y + 20, 3, 3, '#c8a773');
    this.ellipse(x + w - 25, y + 20, 3, 3, '#c8a773');
  }
  bubble(text, x, y, w, speaker, target) {
    this.measure.font = font(14, true);
    // Measure first so long customer requests get a complete bubble.
    const probe = new Screen(w, 0);
    const h = probe.wrap(text, 0, 0, w - 32, 14, C.ink, { serif: true }) + (speaker ? 52 : 30);
    this.box(x, y, w, h, '#fff7e8f5', '#c4a680', 18, true);
    this.draw(ctx => {
      ctx.beginPath();
      if (target && target.x < x) {
        const anchor = Math.max(y + 22, Math.min(y + h - 22, target.y));
        ctx.moveTo(x + 1, anchor - 9); ctx.lineTo(target.x, target.y); ctx.lineTo(x + 1, anchor + 9);
      } else if (target) {
        const anchor = Math.max(x + 22, Math.min(x + w - 22, target.x));
        ctx.moveTo(anchor - 10, y + h - 1); ctx.lineTo(target.x, target.y); ctx.lineTo(anchor + 10, y + h - 1);
      } else { ctx.moveTo(x + 23, y + h - 1); ctx.lineTo(x + 12, y + h + 15); ctx.lineTo(x + 48, y + h - 1); }
      ctx.fillStyle = '#fff7e8'; ctx.fill();
    });
    if (speaker) this.text(speaker, x + 16, y + 12, 13, C.plum, { weight: 700 });
    this.wrap(text, x + 16, y + (speaker ? 35 : 14), w - 32, 14, C.ink, { serif: true });
    return h;
  }
}

function backdrop(s, name = 'cottage-landscape', shade = true) {
  s.image(name, 0, 0, s.w, s.h, true);
  if (shade) s.draw(ctx => {
    const g = ctx.createLinearGradient(0, 0, 0, s.h);
    g.addColorStop(0, '#25172e60'); g.addColorStop(.35, '#25172e00'); g.addColorStop(1, '#2d1b2d88');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s.w, s.h);
  });
}
// Alpha bounds remove only the sprites' transparent gutters at draw time.
// Their visible feet, rather than their image boxes, meet the painted floor.
const SPRITE_CROPS = {
  'moss-kitten': [83, 44, 346, 381], 'mushroom-frog': [60, 79, 322, 346],
  'lavender-dragon': [87, 35, 346, 377], rabbit: [92, 12, 267, 395],
};
function groundedSprite(world, name, center, floor, height) {
  const crop = SPRITE_CROPS[name], rect = groundedRect(center, floor, height, crop), image = imageFor(art(name));
  const contact = name === 'moss-kitten' ? { dx:.08, dy:-.055, width:.31 } : name === 'rabbit' ? { dx:0, dy:-.045, width:.34 } : { dx:0, dy:-.025, width:.36 };
  world.ellipse(center + height * contact.dx, floor + height * contact.dy, rect.w * contact.width, Math.max(2, height * .022), '#2d1b3538');
  world.draw(ctx => { if (image.complete && image.naturalWidth) ctx.drawImage(image, ...crop, rect.x, rect.y, rect.w, rect.h); });
  return rect;
}
function stageControl(s, scene, label, action, rect) {
  const point = stagePoint(scene, rect.x, rect.y), visualW = rect.w * scene.scale, visualH = rect.h * scene.scale;
  const w = Math.max(44, visualW), h = Math.max(44, visualH);
  const x = Math.max(scene.x, Math.min(scene.x + scene.w - w, point.x + (visualW - w) / 2));
  const y = Math.max(scene.y, Math.min(scene.y + scene.h - h, point.y + (visualH - h) / 2));
  s.control(label, action, x, y, w, h);
}
function cottageStage(s, house, painting) {
  const { scene, roof } = house, x = scene.x, y = scene.y, w = scene.w, h = scene.h;
  s.draw(ctx => {
    ctx.save();
    ctx.shadowColor = '#2b193b75'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8;
    // Chimney and gabled roof make the stage read as a cottage cutaway.
    const chimneyX = x + w * .76, chimneyW = Math.max(25, w * .075);
    ctx.fillStyle = '#a67b63'; ctx.strokeStyle = '#664735'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(chimneyX, house.y + roof * .2, chimneyW, roof * .72, 3); ctx.fill(); ctx.stroke();
    ctx.shadowColor = 'transparent';
    for (let row = 0; row < 3; row++) {
      const by = house.y + roof * (.27 + row * .18);
      ctx.strokeStyle = '#78523f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(chimneyX, by); ctx.lineTo(chimneyX + chimneyW, by); ctx.stroke();
    }
    ctx.fillStyle = '#734f3e'; ctx.fillRect(chimneyX - 4, house.y + roof * .16, chimneyW + 8, 9);
    ctx.shadowColor = '#2b193b75';
    ctx.fillStyle = '#72544f'; ctx.strokeStyle = '#4c3434'; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(x - 17, y - 3); ctx.lineTo(x + w / 2, house.y); ctx.lineTo(x + w + 17, y - 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowColor = 'transparent'; ctx.save(); ctx.clip();
    const courses = 5, tileW = Math.max(28, w / 12), tileH = roof / courses;
    for (let row = 0; row < courses; row++) for (let col = -1; col < w / tileW + 1; col++) {
      const tx = x + col * tileW + (row % 2) * tileW / 2, ty = house.y + row * tileH;
      ctx.fillStyle = ['#936b5f', '#82625b', '#a47a66', '#876b5e'][(row + col + 8) % 4];
      ctx.beginPath(); ctx.roundRect(tx + 1, ty + 1, tileW - 2, tileH + 4, [2, 2, 6, 6]); ctx.fill();
      ctx.strokeStyle = '#5b414044'; ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = '#c99c6b'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - 17, y - 3); ctx.lineTo(x + w / 2, house.y); ctx.lineTo(x + w + 17, y - 3); ctx.stroke();
    const windowY = house.y + roof * .58, radius = Math.max(8, roof * .2);
    ctx.fillStyle = '#f5ce83'; ctx.strokeStyle = '#4e3739'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x + w / 2, windowY, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + w / 2 - radius, windowY); ctx.lineTo(x + w / 2 + radius, windowY); ctx.moveTo(x + w / 2, windowY - radius); ctx.lineTo(x + w / 2, windowY + radius); ctx.stroke();
    const wood = ctx.createLinearGradient(x - 13, y, x + w + 13, y);
    wood.addColorStop(0, '#8e6243'); wood.addColorStop(.5, '#b58b5a'); wood.addColorStop(1, '#80583e');
    ctx.fillStyle = wood; ctx.strokeStyle = '#593e30'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x - 13, y - 6, w + 26, h + 23, 7); ctx.fill(); ctx.stroke();
    // Small irregular grain marks give the beams some texture.
    ctx.strokeStyle = '#e2bc7a75'; ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const offset = 2 + i * 2;
      ctx.beginPath(); ctx.moveTo(x - offset, y + 5); ctx.bezierCurveTo(x - offset - 3, y + h * .3, x - offset + 2, y + h * .7, x - offset, y + h + 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + w + offset, y + 5); ctx.lineTo(x + w + offset, y + h + 6); ctx.stroke();
    }
    ctx.restore();
  });
  const world = new Screen(STAGE_WIDTH, STAGE_HEIGHT);
  world.image(painting, 0, 0, STAGE_WIDTH, STAGE_HEIGHT);
  s.draw(ctx => {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.translate(x, y); ctx.scale(scene.scale, scene.scale);
    for (const command of world.commands) command(ctx);
    ctx.restore();
  });
  return world;
}
function hud(s, save, state) {
  if (s.w >= 760) {
    s.box(22, 18, 230, 47, '#513b31ed', '#b89464', 8, true);
    s.glyph('leaf', 35, 31, 20, '#dbc69e');
    s.text('The Moss & Moon', 64, 29, 19, C.cream, { serif: true });
  }
  const coinsX = s.w < 760 ? 14 : s.w - 245;
  s.box(coinsX, 18, 112, 46, '#fff2dbf5', '#c6a576', 23, true);
  s.glyph('coin', coinsX + 12, 29, 24, '#ad7c2e'); s.text(save.coins, coinsX + 45, 29, 19, '#78552e', { weight: 700 });
  s.button('How to play', 'help', s.w - 116, 18, 46, 46, { glyph: 'help', iconOnly: true });
  s.button('Learning settings', 'settings', s.w - 62, 18, 46, 46, { glyph: 'settings', iconOnly: true });

}
function dock(s, tab) {
  const width = Math.min(s.w - 24, 440), x = (s.w - width) / 2, y = s.h - 78;
  s.box(x, y, width, 64, '#49332deF', '#b88c62', 21, true);
  [['shop', 'bottle', 'Brew'], ['familiars', 'paw', 'Friends'], ['cozy', 'leaf', 'Room'], ['supplies', 'book', 'Village']].forEach(([id, glyph, label], index) => {
    const bx = x + 5 + index * (width - 10) / 4, bw = (width - 10) / 4;
    if (tab === id) s.box(bx + 2, y + 5, bw - 4, 54, '#ac835955', '#e0b677', 14);
    s.glyph(glyph, bx + bw / 2 - 11, y + 10, 22, tab === id ? '#ffe0a0' : '#d4bca5');
    s.text(label, bx + bw / 2, y + 38, 11, tab === id ? '#fff2d8' : '#e0cdb9', { align: 'center', weight: 600 });
    s.control(label, 'tab', bx, y + 4, bw, 56, { data: { tab: id }, current: tab === id, className: 'nav-tab' });
  });
}
function cauldron(s, x, y, w, h, color, total) {
  s.ellipse(x + w / 2, y + h * .91, w * .39, h * .055, '#2a1b3650');
  s.draw(ctx => {
    ctx.save(); ctx.translate(x, y); ctx.scale(w / 300, h / 270);
    ctx.lineWidth = 12; ctx.strokeStyle = '#68516e';
    ctx.beginPath(); ctx.ellipse(44, 156, 23, 27, -.5, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(256, 156, 23, 27, .5, 0, Math.PI * 2); ctx.stroke();
    const g = ctx.createLinearGradient(55, 115, 235, 250); g.addColorStop(0, '#52405c'); g.addColorStop(1, '#292638');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(54, 126); ctx.bezierCurveTo(32, 220, 78, 242, 150, 242); ctx.bezierCurveTo(224, 242, 268, 220, 246, 126); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#312b40'; ctx.beginPath(); ctx.roundRect(74, 221, 20, 27, 7); ctx.roundRect(206, 221, 20, 27, 7); ctx.fill();
    ctx.fillStyle = '#7f6485'; ctx.beginPath(); ctx.ellipse(150, 126, 103, 29, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = total ? color : '#262433'; ctx.beginPath(); ctx.ellipse(150, 126, 94, 21, 0, 0, Math.PI * 2); ctx.fill();
    if (total) { ctx.fillStyle = '#ffffff66'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(112 + i * 37, 121 + (i % 2) * 8, 5, 3, 0, 0, Math.PI * 2); ctx.fill(); } }
    ctx.strokeStyle = '#d3ad76'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(178, 130); ctx.lineTo(215, 48); ctx.stroke();
    ctx.fillStyle = '#e7c78b'; ctx.beginPath(); ctx.ellipse(215, 47, 7, 15, .4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d7b778'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const angle = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 12 : 23; ctx.lineTo(150 + Math.cos(angle) * r, 189 + Math.sin(angle) * r); } ctx.closePath(); ctx.fill();
    ctx.restore();
  });
}
function potionRecipe(s, save, state, x, y, w) {
  const order = currentOrder(save), reveal = save.settings.visualHints || state.showHint;
  const rows = INGREDIENTS.filter(i => order.target[i.id]).map(i => {
    const lots = save.brew.lots.filter(lot => lot.ingredient === i.id), actual = state.mixture[i.id];
    const equation = reveal ? `${formatCups(actual)} / ${formatCups(order.target[i.id])} cups${actual === order.target[i.id] ? ' ✓' : ''}` : lots.length ? lots.map(lot => formatCups(lot.units)).join(' + ') : '—';
    const textHeight = new Screen(w, 0).wrap(equation, 0, 0, w - 85, 11, C.ink, { lineHeight: 14 });
    return { i, lots, actual, equation, h: Math.max(64, 39 + textHeight + (reveal ? 10 : 0)) };
  });
  const feedbackHeight = state.feedback ? new Screen(w, 0).wrap(state.feedback, 0, 0, w - 40, 12) + 20 : 0;
  const titleH = new Screen(w, 0).wrap(order.recipe.name, 0, 0, w - 40, 22, C.ink, { serif: true, lineHeight: 27 });
  const headerH = 82 + titleH;
  const h = headerH + rows.reduce((sum, row) => sum + row.h, 0) + feedbackHeight + (order.batch > 1 ? 25 : 0) + 125;
  s.parchment(x, y, w, h);
  s.glyph('book', x + 20, y + 20, 21, C.plum); s.text('Recipe', x + 49, y + 22, 15, C.plum, { serif: true });
  s.glyph('coin', x + w - 66, y + 20, 20, '#a87b35'); s.text(order.reward, x + w - 40, y + 23, 14, '#8c632e', { weight: 600 });
  s.wrap(order.recipe.name, x + 20, y + 53, w - 40, 22, C.ink, { serif: true, lineHeight: 27 });
  s.text('1 bottle', x + 20, y + 59 + titleH, 12, C.muted);
  if (order.batch > 1) s.text(`Brew × ${order.batch}`, x + w - 20, y + 59 + titleH, 13, C.plum, { weight: 700, align: 'right' });
  let ry = y + headerH;
  for (const { i, lots, actual, equation, h: rowH } of rows) {
    s.line(x + 20, ry - 5, x + w - 20, ry - 5, '#d9c2a0');
    s.image(i.art, x + 13, ry + 1, 45, 45);
    s.text(i.name, x + 65, ry + 2, 12, C.ink, { weight: 600 });
    s.text(`${formatCups(order.recipe.amounts[i.id])} cup`, x + w - 20, ry + 20, 18, C.plum, { serif: true, align: 'right' });
    s.wrap(equation, x + 65, ry + 39, w - 85, 11, reveal && actual === order.target[i.id] ? C.green : C.muted, { lineHeight: 14 });
    if (reveal) {
      s.box(x + 65, ry + rowH - 7, w - 85, 3, '#d7c6b3', null, 1);
      if (actual) s.box(x + 65, ry + rowH - 7, (w - 85) * Math.min(1, actual / order.target[i.id]), 3, i.color, null, 1);
    }
    s.control(`Select ${i.name}. Recipe ${cupLabel(order.recipe.amounts[i.id])} per bottle. ${lots.length} portions added. ${equation}`, 'ingredient', x + 12, ry - 2, w - 24, rowH - 3, { data: { ingredient: i.id, origin: 'recipe' } });
    ry += rowH;
  }
  if (order.batch > 1) { s.text(`Each amount × ${order.batch}`, x + 20, ry + 3, 13, C.plum, { weight: 600 }); ry += 25; }
  if (state.feedback) { s.wrap(state.feedback, x + 20, ry + 8, w - 40, 12, state.feedbackType === 'ready' ? C.green : C.plum); ry += feedbackHeight; }
  const toolW = (w - 36 - 24) / 4;
  [['Show a hint', 'hint', 'help', false], ['Undo last portion', 'undo', 'undo', !save.brew.undoDepth], ['Return all portions to tray', 'clear', 'trash', !save.brew.lots.length], ['Recover a portion with subtraction', 'recover', 'bottle', !save.brew.lots.length]].forEach(([label, action, glyph, disabled], index) => {
    s.button(label, action, x + 18 + index * (toolW + 8), ry + 8, toolW, 46, { glyph, iconOnly: true, disabled });
    if (action === 'recover') s.text('−', x + 18 + index * (toolW + 8) + toolW - 16, ry + 30, 13, disabled ? '#a09299' : C.plum, { weight: 700 });
  });
  s.button('Brew potion', 'brew', x + 18, ry + 64, w - 36, 48, { glyph: 'sparkles', primary: true, disabled: !save.brew.lots.length });
  s.descriptions.push(`${order.recipe.customer} asks for ${order.batch} ${order.recipe.name}. Reward ${order.reward} coins. Recipe per bottle: ${rows.map(({ i }) => `${i.name} ${cupLabel(order.recipe.amounts[i.id])}`).join(', ')}.`);
  return h + 10;
}
function trayInfo(save, state, width) {
  const stock = save.stock[state.ingredient];
  const sizes = [...new Set([...Object.keys(puzzleStock(save)[state.ingredient]), ...Object.keys(stock)])].map(Number).sort((a, b) => b - a);
  const cols = Math.min(sizes.length, width < 300 ? 2 : Math.max(3, Math.floor((width - 32) / 90)));
  const lots = save.brew.lots.filter(l => l.ingredient === state.ingredient);
  const equation = lots.length ? `${lots.map(l => formatCups(l.units)).join(' + ')}${save.settings.visualHints ? ` = ${formatCups(state.mixture[state.ingredient])} cups` : ''}` : 'Choose portions to pour';
  const lineH = new Screen(width, 0).wrap(equation, 0, 0, width - 36, 16, C.ink, { serif: true, lineHeight: 23 });
  const ingredientCols = width < 300 ? 2 : 4, ingredientRows = 4 / ingredientCols;
  return { stock, sizes, cols, equation, ingredientCols, ingredientRows, h: 164 + (ingredientRows - 1) * 87 + Math.ceil(sizes.length / cols) * 70 + lineH };
}
function tray(s, save, state, x, y, w, info) {
  const ingredient = INGREDIENTS.find(i => i.id === state.ingredient);
  s.box(x, y, w, info.h, '#f8e8cbf5', '#b39370', 18, true);
  s.text(FAMILIARS.find(p=>p.id===save.active).trayName, x + 18, y + 14, 16, C.ink, { serif: true });
  s.button('Reset this puzzle', 'reset-puzzle', x + w - 58, y + 3, 46, 44, { glyph: 'undo', iconOnly: true, disabled: !!state.success });
  const gap = 7, tileW = (w - 32 - gap * (info.ingredientCols - 1)) / info.ingredientCols;
  ingredientsFor(save).forEach((i, index) => {
    const tx = x + 16 + (index % info.ingredientCols) * (tileW + gap), ty = y + 49 + Math.floor(index / info.ingredientCols) * 87, count = Object.values(save.stock[i.id]).reduce((a, b) => a + b, 0);
    s.box(tx, ty, tileW, 80, state.ingredient === i.id ? '#e8d9eb' : '#fff6e399', state.ingredient === i.id ? '#9b70ac' : '#d1b694', 12);
    s.image(i.art, tx + tileW / 2 - 25, ty, 50, 49);
    s.text(i.id === 'honey' ? 'Honey' : i.id === 'mint' ? 'Mint' : i.name, tx + tileW / 2, ty + 49, info.ingredientCols === 2 ? 11 : w < 370 ? 9 : 11, C.ink, { align: 'center', weight: 600 });
    s.text(`× ${count}`, tx + tileW / 2, ty + 64, 11, C.muted, { align: 'center' });
    s.control(`${i.name}, ${count} portions available`, 'ingredient', tx, ty, tileW, 80, { data: { ingredient: i.id, origin: 'tray' }, pressed: state.ingredient === i.id });
  });
  const portionW = (w - 32 - (info.cols - 1) * 8) / info.cols;
  info.sizes.forEach((units, index) => {
    const px = x + 16 + (index % info.cols) * (portionW + 8), py = y + 143 + (info.ingredientRows - 1) * 87 + Math.floor(index / info.cols) * 70;
    const count = info.stock[units] || 0, disabled = !count || !!state.success;
    s.box(px, py, portionW, 62, disabled ? '#e4d9c9' : '#fff8e9', disabled ? '#c7b9a6' : '#bda2c8', 10);
    const label = `${formatCups(units)} cup`;
    s.measure.font = font(18, false, 600);
    const labelSize = Math.min(18, 18 * (portionW - 12) / Math.max(1, s.measure.measureText(label).width));
    s.text(label, px + portionW / 2, py + 10, labelSize, disabled ? '#a49895' : C.plum, { align: 'center', weight: 600 });
    s.text(`× ${count}`, px + portionW / 2, py + 39, 12, C.muted, { align: 'center' });
    s.control(`Pour ${cupLabel(units)} of ${ingredient.noun}, ${count} available`, 'pour', px, py, portionW, 62, { data: { ingredient: ingredient.id, units }, disabled, className: 'portion-button' });
  });
  const eqY = y + 151 + (info.ingredientRows - 1) * 87 + Math.ceil(info.sizes.length / info.cols) * 70;
  s.wrap(info.equation, x + 18, eqY, w - 36, 16, C.ink, { serif: true, lineHeight: 23 });
  s.descriptions.push(`${ingredient.name}: ${info.equation}. Every tray has an exact solution. You can leave portions unused.`);
}
function shop(s, save, state) {
  const viewportHeight = s.h;
  const columns = s.w >= 700, sidebar = s.w >= 1100 && s.w / viewportHeight >= 1.25;
  const margin = columns ? 24 : 12, gap = 18;
  const contentW = Math.min(1600, s.w - margin * 2), left = (s.w - contentW) / 2;
  const recipeW = columns ? 280 : contentW;
  const trayW = sidebar ? 230 : columns ? contentW - recipeW - gap : contentW;
  const houseW = sidebar ? contentW - trayW - recipeW - gap * 2 : trayW;
  const houseX = sidebar ? left + trayW + gap : left;
  // The request no longer reserves space over the roof. Its speaker stands outside.
  const house = cottageBounds(houseX, 86, houseW, viewportHeight - 186, 1000);
  const pet = FAMILIARS.find(p => p.id === save.active), order = currentOrder(save);
  const customer = state.success?.customer || order.recipe.customer;
  const customerArt = state.success?.art || order.recipe.art;
  const request = state.success ? 'Thank you! Just the magic I needed.' : order.batch > 1 ? `Could you make ${order.batch} bottles of ${order.recipe.name.toLowerCase()} for my friends?` : order.recipe.request;
  const probe = new Screen(s.w, s.h);
  const recipeX = columns ? left + contentW - recipeW : left;
  let recipeY = 86;
  const recipeH = state.success ? 450 : potionRecipe(probe, save, state, 0, 0, recipeW);
  const info = trayInfo(save, state, trayW);
  const bubbleW = columns ? recipeW : contentW - 126;
  const bubbleH = probe.bubble(request, 0, 0, bubbleW, `${customer} · Customer`);
  const actorH = columns ? 136 : 140;
  let bubbleX, bubbleY, actorCenter, actorFloor, tail;
  if (columns) {
    bubbleX = recipeX; bubbleY = recipeY + recipeH + 18;
    actorCenter = recipeX + recipeW / 2;
    actorFloor = bubbleY + bubbleH + 12 + actorH;
    tail = { x: actorCenter, y: actorFloor - actorH * .82 };
  } else {
    const rowY = house.y + house.h + 22;
    bubbleX = left + 126; bubbleY = rowY;
    actorCenter = left + 57;
    actorFloor = rowY + Math.max(actorH + 8, bubbleH);
    const actor = groundedRect(actorCenter, actorFloor, actorH, SPRITE_CROPS[customerArt]);
    tail = { x: actor.x + actor.w * .86, y: actor.y + actor.h * .28 };
    recipeY = Math.max(actorFloor, bubbleY + bubbleH) + 26;
  }
  const trayX = left, trayY = sidebar ? 86 : columns ? house.y + house.h + 22 : recipeY + recipeH + 20;
  const customerRect = groundedRect(actorCenter, actorFloor, actorH, SPRITE_CROPS[customerArt]);
  const dockRight = (s.w + Math.min(s.w - 24, 440)) / 2;
  const customerClearance = columns && actorCenter - customerRect.w * .7 > dockRight + 8 ? 20 : 100;
  s.h = Math.max(viewportHeight, house.y + house.h + 100, recipeY + recipeH + 100, trayY + info.h + 100, actorFloor + customerClearance);
  backdrop(s);
  const world = cottageStage(s, house, 'shop');
  const petRect = groundedSprite(world, pet.art, 660, 940, 400);
  const pot = { x: 940, y: 930 - 432 * .915, w: 480, h: 432 };
  cauldron(world, pot.x, pot.y, pot.w, pot.h, state.success?.color || order.recipe.color, Object.values(state.mixture).reduce((a, b) => a + b, 0));
  s.pourOrigin = stagePoint(house.scene, pot.x + pot.w / 2, pot.y + pot.h * 126 / 270);
  stageControl(s, house.scene, `Pet ${pet.name}`, 'pet', petRect);
  const petLabel = `${pet.name} · Your familiar`;
  s.text(petLabel, house.scene.x + house.scene.w * 660 / STAGE_WIDTH, house.scene.y + house.scene.h + 3, 11, '#fff0d3', { align: 'center', weight: 600 });
  // Drawing the tail behind the portrait joins it to the customer's head.
  s.bubble(request, bubbleX, bubbleY, bubbleW, `${customer} · Customer`, tail);
  groundedSprite(s, customerArt, actorCenter, actorFloor, actorH);
  s.descriptions.push(`${customer}, the customer outside the house, says: ${request} ${pet.name} is your familiar inside the house.`);
  if (state.success) successPanel(s, state.success, recipeX, recipeY, recipeW);
  else potionRecipe(s, save, state, recipeX, recipeY, recipeW);
  tray(s, save, state, trayX, trayY, trayW, info);
  if (s.w >= 760) s.button('Change puzzle difficulty', 'settings', 274, 19, 170, 44, { text: `${order.level.label}${save.settings.difficulty === 'auto' ? ' · Auto' : ''}`, dark: true, size: 13 });
}
function successPanel(s, success, x, y, w) {
  s.parchment(x, y, w, 450);
  s.glyph('sparkles', x + w / 2 - 29, y + 35, 58, '#af864a');
  s.text('Potion ready!', x + w / 2, y + 114, 26, C.plum, { serif: true, align: 'center' });
  s.wrap(success.name, x + 24, y + 160, w - 48, 18, C.ink, { serif: true });
  s.glyph('coin', x + w / 2 - 45, y + 210, 26, '#a77b30'); s.text(`+${success.earned}`, x + w / 2 - 10, y + 212, 24, '#976a2d', { weight: 700 });
  if (success.levelUp) s.wrap(`Next puzzle: ${success.levelUp}`, x + 24, y + 257, w - 48, 14, C.plum);
  s.button('Next customer', 'next', x + 20, y + 320, w - 40, 50, { primary: true, glyph: 'arrow' });
  s.button('Visit your familiars', 'tab', x + 20, y + 385, w - 40, 44, { text: 'Friends', glyph: 'paw', data: { tab: 'familiars' } });
  s.descriptions.push(`Potion ready. ${success.name}. You earned ${success.earned} coins.${success.levelUp ? ` Next puzzle: ${success.levelUp}.` : ''}`);
}
function errandScenery(s, skill, house) {
  const world = cottageStage(s, house, skill === 'geometry' ? 'village-garden' : skill === 'algebra' ? 'cozy-corner' : 'shop');
  if (skill === 'algebra') {
    world.image('decor-bookshelf', 90, 365, 410, 450);
    world.image('decor-tea-table', 1010, 635, 350, 350);
    world.line(1350, 80, 1350, 210, '#815f40', 5);
    world.image('decor-lantern', 1285, 175, 130, 265);
    groundedSprite(world, 'lavender-dragon', 750, 930, 420);
    for (let i = 0; i < 8; i++) world.glyph('sparkles', 160 + i * 155, 240 + (i * 127) % 410, 22, '#ffe0a8');
  } else if (skill === 'arithmetic') {
    groundedSprite(world, 'rabbit', 380, 940, 430);
    const x = 790, y = 575, w = 570;
    world.ellipse(x + w / 2, 968, w / 2, 20, '#2d1d3545');
    world.box(x, y + 175, w, 155, '#a87648', '#5e4430', 10, true);
    for (let i = 1; i < 4; i++) world.line(x, y + 175 + i * 38, x + w, y + 175 + i * 38, '#795535', 5);
    for (const cx of [x + 70, x + w - 70]) { world.ellipse(cx, 914, 52, 52, '#654a39'); world.ellipse(cx, 914, 17, 17, '#ba9261'); }
    for (let i = 0; i < 3; i++) world.image(['moonwater', 'honey', 'moonberries'][i], x + 12 + i * 180, y - 10, 180, 210);
  } else groundedSprite(world, 'mushroom-frog', 520, 930, 390);
}
function gardenSize(task, w) {
  const d = task.dimensions;
  const cell = Math.min(30, (w - 80) / d.width, 130 / d.height);
  return { cell, gw: d.hideHeight ? Math.min(170, w - 90) : d.width * cell, gh: d.hideHeight ? 85 : d.height * cell };
}
function gardenDiagram(s, task, x, y, w) {
  const d = task.dimensions, {cell, gw, gh} = gardenSize(task, w);
  const gx = x + (w - gw) / 2, gy = y + 30;
  const triangle = d.shape === 'triangle';
  s.text(`${triangle ? 'Base ' : ''}${d.width} m`, x + w / 2, triangle ? y + gh + 42 : y, 14, C.green, { align: 'center', weight: 600 });
  if (triangle) {
    s.draw(ctx => {
      ctx.save(); ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.closePath();
      ctx.fillStyle = '#b6c18e'; ctx.fill(); ctx.strokeStyle = '#7f6243'; ctx.lineWidth = 3; ctx.stroke(); ctx.clip();
      ctx.strokeStyle = '#80986d'; ctx.lineWidth = .7;
      for (let col = 1; col < d.width; col++) { ctx.beginPath(); ctx.moveTo(gx + col * cell, gy); ctx.lineTo(gx + col * cell, gy + gh); ctx.stroke(); }
      for (let row = 1; row < d.height; row++) { ctx.beginPath(); ctx.moveTo(gx, gy + row * cell); ctx.lineTo(gx + gw, gy + row * cell); ctx.stroke(); }
      ctx.restore();
    });
    s.line(gx + 9, gy + gh, gx + 9, gy + gh - 9, C.green, 1.5);
    s.line(gx, gy + gh - 9, gx + 9, gy + gh - 9, C.green, 1.5);
  } else {
    s.box(gx - 5, gy - 5, gw + 10, gh + 10, '#b18a5e', '#7f6243', 5);
    if (d.hideHeight) s.box(gx, gy, gw, gh, '#c3ca9b', null, 2);
    else for (let row = 0; row < d.height; row++) for (let col = 0; col < d.width; col++) {
      const cx = gx + col * cell, cy = gy + row * cell;
      const planted = !d.fraction || row < d.height * d.fraction.numerator / d.fraction.denominator;
      s.box(cx, cy, cell - 2, cell - 2, planted ? '#b6c18e' : '#d9bc95', null, 2);
      if (planted && cell > 13) s.glyph('leaf', cx + cell * .16, cy + cell * .16, cell * .65, '#51734c');
    }
  }
  s.text(d.hideHeight ? '? m' : `${d.height} m`, gx - 12, gy + gh / 2 - 7, 12, C.green, { align: 'right' });
  const caption = d.hideHeight ? 'Sketch not to scale' : triangle ? 'Base and perpendicular height' : task.kind === 'volume' ? `${d.depth} m deep · each layer is 1 m` : d.fraction ? 'Mint is green · each square is 1 m²' : 'Each square is 1 m²';
  s.text(caption, x + w / 2, y + gh + (triangle ? 65 : 45), 12, C.muted, { align: 'center' });
  s.descriptions.push(triangle ? `Right triangular garden. Base ${d.width} meters; perpendicular height ${d.height} meters.` : `Rectangular garden ${d.width} meters long, ${d.hideHeight ? 'unknown width. Sketch not to scale.' : `${d.height} meters wide.${d.fraction ? ` ${d.fraction.numerator}/${d.fraction.denominator} is planted with mint, shown in green.` : ''} Each square is one square meter.`}`);
  return gh + (triangle ? 97 : 77);
}
const errandNames = {
  shipment: 'Bottles', crates: 'Crates', change: 'Market', time: 'Trip time', stockFraction: 'Seeds',
  missingAdd: 'Berries', missingGroup: 'Bundles', formula: 'Recipe', pattern: 'Pattern', missingSide: 'Length',
  area: 'Herb bed', perimeter: 'Fencing', triangle: 'Triangle', planting: 'Planting', remaining: 'Free space', volume: 'Soil',
};
function errands(s, save, state) {
  const task = state.supplySuccess?.task || currentSupplyTask(save, state.supplySlot), wide = s.w >= 760;
  const margin = wide ? 24 : 12, contentW = Math.min(1440, s.w - margin * 2), left = (s.w - contentW) / 2;
  const panelW = wide ? s.w >= 1100 ? 500 : s.w >= 900 ? 400 : 340 : contentW;
  const sceneW = wide ? contentW - panelW - 22 : contentW;
  const house = cottageBounds(left, 160, sceneW, s.h - 260);
  const px = wide ? left + contentW - panelW : left;
  const title = task.title;
  const probe = new Screen(s.w, s.h), innerW = panelW - 40;
  const titleH = probe.wrap(title, 0, 0, innerW, panelW < 380 ? 19 : 22);
  const promptH = probe.wrap(task.prompt, 0, 0, innerW, 15);
  const storyH = probe.wrap(task.story, 0, 0, innerW, 14, C.ink, { serif: true });
  const expressionH = probe.wrap(task.expression, 0, 0, innerW, task.skill === 'geometry' ? 21 : 29, C.ink, { serif: true });
  const diagramH = task.dimensions ? gardenSize(task, innerW).gh + (task.dimensions.shape === 'triangle' ? 97 : 77) : 0;
  const feedbackH = state.supplyFeedback ? probe.wrap(state.supplyFeedback, 0, 0, innerW, 13) + 10 : 0;
  const py = wide ? 88 : house.y + house.h + 24, panelH = state.supplySuccess ? 410 : 315 + titleH + promptH + storyH + expressionH + diagramH + feedbackH;
  s.h = Math.max(s.h, py + panelH + 100, house.y + house.h + 100);
  backdrop(s);
  errandScenery(s, task.skill, house);
  const tabsW = Math.min(sceneW, 500), tabX = left + (sceneW - tabsW) / 2;
  supplyTasks(save).forEach((notice, slot) => {
    const width = (tabsW - 16) / 3, glyph = {arithmetic:'bottle', algebra:'book', geometry:'leaf'}[notice.skill];
    s.button(`Errand ${slot + 1}: ${notice.title}. ${notice.level.label}, ${notice.reward} coins`, 'supply-slot', tabX + slot * (width + 8), 88, width, 48, { text: errandNames[notice.kind], glyph: width > 120 ? glyph : null, selected: state.supplySlot === slot, data: { slot }, pressed: state.supplySlot === slot });
  });
  s.parchment(px, py, panelW, panelH);
  if (state.supplySuccess) {
    s.glyph('check', px + panelW / 2 - 30, py + 35, 60, C.green);
    s.text('A happy neighbor!', px + panelW / 2, py + 117, 24, C.ink, { serif: true, align: 'center' });
    s.glyph('coin', px + panelW / 2 - 45, py + 175, 26, '#ae7e34'); s.text(`+${state.supplySuccess.earned}`, px + panelW / 2 - 8, py + 174, 26, '#9b6a2c', { weight: 700 });
    s.button('See the new errand', 'next-supply', px + 22, py + 255, panelW - 44, 48, { primary: true });
    s.button('Back to brewing', 'tab', px + 22, py + 320, panelW - 44, 46, { data: { tab: 'shop' }, glyph: 'bottle' });
    s.descriptions.push(`A new notice replaces the completed errand. The other two stay available. Errand complete. Earned ${state.supplySuccess.earned} coins. Your potion puzzle is unchanged.`);
    return;
  }
  s.wrap(title, px + 20, py + 21, innerW, panelW < 380 ? 19 : 22, C.ink, { serif: true });
  s.glyph('coin', px + panelW - 70, py + titleH + 36, 20, '#ac7b2d'); s.text(`+${task.reward}`, px + panelW - 44, py + titleH + 37, 14, '#95652d', { weight: 600 });
  s.text(task.level.label, px + 20, py + titleH + 39, 12, C.muted);
  let cy = py + titleH + 75;
  cy += s.wrap(task.story, px + 20, cy, innerW, 14, C.ink, { serif: true }); cy += 18;
  if (task.dimensions) cy += gardenDiagram(s, task, px + 20, cy, innerW);
  cy += s.wrap(task.prompt, px + 20, cy, innerW, 15); cy += 22;
  cy += s.wrap(task.expression, px + 20, cy, innerW, task.skill === 'geometry' ? 21 : 29, C.plum, { serif: true }); cy += 18;
  s.text(`Answer in ${task.unit}`, px + 20, cy, 12, C.muted); cy += 24;
  s.box(px + 20, cy, panelW - 110, 50, '#fffaf0', '#b795c0', 9);
  s.controls.push(`<form id="supply-form" data-task="${escapeHTML(task.id)}"><input id="supply-answer" class="canvas-answer" aria-label="${escapeHTML(task.prompt)} Answer in ${escapeHTML(task.unit)}" name="answer" type="text" inputmode="decimal" autocomplete="off" required value="${escapeHTML(state.supplyAnswer || '')}" placeholder="?" style="left:${px + 20}px;top:${cy}px;width:${panelW - 110}px;height:50px" /></form>`);
  s.button('Check answer and collect coins', null, px + panelW - 80, cy, 60, 50, { glyph: 'check', iconOnly: true, primary: true, submit: true }); cy += 62;
  if (state.supplyFeedback) cy += s.wrap(state.supplyFeedback, px + 20, cy, innerW, 13, C.plum) + 10;
  s.button('Show errand hint', 'supply-hint', px + 20, cy, 46, 44, { glyph: 'help', iconOnly: true });
  s.descriptions.push(`${task.title}. ${task.story} ${task.prompt} ${task.expression} Reward ${task.reward} coins. ${state.supplyFeedback}`);
}
function friends(s, save, state) {
  const columns = s.w >= 760 ? 3 : 1, m = s.w >= 760 ? 28 : 16, gap = 20;
  const w = (s.w - m * 2 - gap * (columns - 1)) / columns, cardH = 450;
  s.h = Math.max(s.h, 150 + cardH + gap + 92);
  backdrop(s, 'cozy-corner');
  s.text('Your familiars', m, 90, s.w < 400 ? 21 : 29, C.cream, { serif: true });
  const selectedIndex = Math.max(0, Math.min(2, state.friendIndex || 0));
  const pets = columns === 1 ? [FAMILIARS[selectedIndex]] : FAMILIARS;
  if (columns === 1) {
    s.button('Previous familiar', 'friend-page', s.w - 116, 83, 44, 44, { glyph: 'back', iconOnly: true, data: { step: -1 }, disabled: selectedIndex === 0 });
    s.button('Next familiar', 'friend-page', s.w - 64, 83, 44, 44, { glyph: 'arrow', iconOnly: true, data: { step: 1 }, disabled: selectedIndex === 2 });
  }
  pets.forEach((pet, i) => {
    const x = m + (i % columns) * (w + gap), y = 145 + Math.floor(i / columns) * (cardH + gap);
    const owned = save.owned.includes(pet.id), active = save.active === pet.id;
    s.parchment(x, y, w, cardH);
    groundedSprite(s, pet.art, x + w / 2, y + 224, Math.min(190, (w - 40) / .95));
    s.text(pet.name, x + w / 2, y + 244, 28, C.ink, { align: 'center', serif: true });
    s.text(pet.species, x + w / 2, y + 284, 13, C.muted, { align: 'center' });
    s.wrap(pet.description, x + 24, y + 315, w - 48, 14);
    s.button(active ? 'Your brewing buddy' : owned ? `Choose ${pet.name}` : `Adopt ${pet.name} for ${pet.cost} coins`, owned ? 'select-pet' : 'adopt', x + 18, y + 386, w - 36, 48, { text: active ? '♥  By your side' : owned ? 'Brew with buddy' : `${pet.cost} coins`, glyph: owned ? null : 'coin', primary: !active, disabled: active || (!owned && save.coins < pet.cost), data: { pet: pet.id } });
    s.descriptions.push(`${pet.name}, ${pet.species}. ${pet.description} ${owned ? active ? 'Your current buddy.' : 'Adopted.' : `Adopt for ${pet.cost} coins.`}`);
  });
}
const placement = {
  bookshelf: [.04, .38, .26, .35], shelf: [.07, .14, .28, .22], herbs: [.39, .12, .1, .16], painting: [.42, .33, .14, .22],
  lantern: [.88, .21, .09, .25], plants: [.82, .58, .17, .27], rug: [.29, .75, .47, .23], bed: [.04, .75, .29, .21], tea: [.58, .58, .24, .33],
};
function room(s, save, state) {
  const selected = save.owned.includes(state.room) ? state.room : save.active;
  const pet = FAMILIARS.find(p=>p.id===selected), collection=decorationsFor(selected), ownedRoom=roomFor(save,selected);
  const wide = s.w >= 900, m = wide ? 24 : 14, roomW = wide ? s.w * .56 - 36 : s.w - 28, roomH = roomW * 2 / 3;
  const title = `${pet.name}’s ${pet.roomName.toLowerCase()}`;
  const probe=new Screen(s.w,s.h), titleH=probe.wrap(title,0,0,roomW,s.w<400?22:28,C.cream,{serif:true,lineHeight:32});
  const tabsY=86+titleH+12, roomY=tabsY+58;
  const catalogX = wide ? roomW + 48 : m, catalogY = wide ? roomY : roomY + roomH + 130;
  const catalogW = wide ? s.w - catalogX - 24 : s.w - 28, cols = catalogW >= 480 ? 3 : 2, gap = 12, cardW = (catalogW - gap * (cols - 1)) / cols, cardH = 214;
  const pageSize = cols * 2, pageCount = Math.ceil(collection.length / pageSize), page = Math.min(state.decorPage || 0, pageCount - 1);
  s.h = Math.max(s.h, catalogY + 2 * (cardH + gap) + 92);
  backdrop(s);
  s.wrap(title,m,86,roomW,s.w<400?22:28,C.cream,{serif:true,lineHeight:32});
  const tabW=(Math.min(roomW,500)-16)/3;
  FAMILIARS.forEach((p,n)=>s.button(save.owned.includes(p.id)?`Decorate ${p.name}'s room`:`${p.name}'s room, adopt ${p.name} first`,'room-select',m+n*(tabW+8),tabsY,tabW,46,{text:p.name,selected:p.id===selected,pressed:p.id===selected,disabled:!save.owned.includes(p.id),data:{room:p.id}}));
  const rx = m, ry = roomY;
  s.box(rx - 3, ry - 3, roomW + 6, roomH + 6, '#bd9267', '#e0b87d', 4, true);
  s.image(pet.roomArt, rx, ry, roomW, roomH);
  const shown=ownedRoom.decorations.filter(id=>!ownedRoom.hiddenDecorations.includes(id));
  if (shown.includes('garland')) {
    s.line(rx+roomW*.1,ry+roomH*.08,rx+roomW*.9,ry+roomH*.08,'#b99c69');
    for(let i=0;i<5;i++){
      const x=rx+roomW*(.15+i*.16),y=ry+roomH*.08;
      if(selected==='fern'){s.ellipse(x,y+8,5,5,'#f2d784');s.glyph('leaf',x-6,y+15,14,'#82945f');}
      else if(selected==='pip')s.glyph('flame',x-9,y+2,20,'#e2ad64');
      else s.text(i%2?'☾':'✦',x,y,23,'#ceaa66');
    }
  }
  for(const id of ['bookshelf','shelf','herbs','painting','lantern','rug','bed','tea','plants']){
    if(!shown.includes(id))continue;
    const d=collection.find(item=>item.id===id),p=placement[id];
    s.image(d.art,rx+p[0]*roomW,ry+p[1]*roomH,p[2]*roomW,p[3]*roomH,id==='rug'?'floor':false);
  }
  const petRect=groundedSprite(s,pet.art,rx+roomW*.20,ry+roomH*.92,roomH*.30);
  s.control(`Pet ${pet.name}`,'pet',petRect.x,petRect.y,Math.max(44,petRect.w),Math.max(44,petRect.h),{data:{pet:pet.id}});
  if(state.petLine)s.bubble(state.petLine,rx+20,ry+20,Math.min(250,roomW-40));
  s.wrap(`${shown.length} placed · ${ownedRoom.decorations.length}/${collection.length} collected · Brew buddy: ${FAMILIARS.find(p=>p.id===save.active).name}`,rx+4,ry+roomH+14,roomW-8,11,'#fff0d3');
  s.button('Previous furnishings','decor-page',catalogX+catalogW-146,catalogY-58,44,44,{glyph:'back',iconOnly:true,data:{page:page-1,direction:'previous'},disabled:page===0});
  s.text(`${page+1} / ${pageCount}`,catalogX+catalogW-75,catalogY-42,12,C.cream,{align:'center'});
  s.button('Next furnishings','decor-page',catalogX+catalogW-44,catalogY-58,44,44,{glyph:'arrow',iconOnly:true,data:{page:page+1,direction:'next'},disabled:page===pageCount-1});
  collection.slice(page*pageSize,(page+1)*pageSize).forEach((d,index)=>{
    const x=catalogX+(index%cols)*(cardW+gap),y=catalogY+Math.floor(index/cols)*(cardH+gap);
    const owned=ownedRoom.decorations.includes(d.id),hidden=ownedRoom.hiddenDecorations.includes(d.id);
    s.parchment(x,y,cardW,cardH);
    if(d.art)s.image(d.art,x+12,y+12,cardW-24,100);
    else {s.glyph(selected==='fern'?'leaf':selected==='pip'?'flame':'sparkles',x+cardW/2-18,y+38,36,selected==='fern'?'#879b68':'#b78c49');}
    s.wrap(d.name,x+12,y+116,cardW-24,13,C.ink,{serif:true,lineHeight:18});
    s.button(owned?`${hidden?'Place':'Put away'} ${d.name}`:`Buy ${d.name} for ${d.cost} coins`,owned?'toggle-decoration':'decorate',x+10,y+160,cardW-20,44,{text:owned?hidden?'Place':'Put away':`${d.cost}`,glyph:owned?null:'coin',primary:!owned,disabled:!owned&&save.coins<d.cost,data:{decoration:d.id,room:selected}});
    s.descriptions.push(`${pet.name}'s room: ${d.name}. ${owned?hidden?'Collected and put away.':'Placed in room.':`${d.cost} coins.`}`);
  });
  s.descriptions.push(`Decorating ${pet.name}'s room. Equipped brewing familiar: ${save.active}. Changing rooms does not equip a familiar.`);
}

export function renderGame(app, save, state, storageAvailable) {
  const width = Math.max(320, document.documentElement.clientWidth), height = Math.max(740, window.innerHeight);
  const s = new Screen(width, height);
  if (!ingredientsFor(save).some(i=>i.id===state.ingredient)) state.ingredient=ingredientsFor(save)[0].id;
  if (state.tab === 'shop') shop(s, save, state);
  else if (state.tab === 'supplies') errands(s, save, state);
  else if (state.tab === 'familiars') friends(s, save, state);
  else room(s, save, state);
  hud(s, save, state); dock(s, state.tab);
  s.descriptions.unshift(`${save.coins} coins. ${save.completed} potions brewed.`);
  if (!storageAvailable) {
    s.box(12, 69, width - 24, 44, '#fff1cc', '#ae8144', 8);
    s.text('Progress cannot save in this browser.', 24, 82, 13, '#6e4d26');
    s.descriptions.push('Progress cannot save in this browser. You can keep playing.');
  }
  app.innerHTML = `<main class="game-surface" style="height:${s.h}px" aria-label="Paws and Potions"><canvas id="game-canvas" aria-hidden="true"></canvas><h1 class="sr-only">${{ shop: 'The potion shop', supplies: 'Village errands', familiars: 'Your familiars', cozy: 'Your cozy corner' }[state.tab]}</h1><div id="game-description" class="sr-only">${escapeHTML(s.descriptions.join(' '))}</div><div class="canvas-controls" role="group" aria-label="Game controls" aria-describedby="game-description">${s.controls.join('')}</div></main>`;
  const canvas = app.querySelector('canvas'), ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(s.h * dpr);
  canvas.style.width = `${width}px`; canvas.style.height = `${s.h}px`;
  let frame;
  function paint() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, s.h);
      for (const command of s.commands) command(ctx);
      const age = performance.now() - (state.pourEffect || -10000);
      if (s.pourOrigin && age >= 0 && age < 550 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        ctx.save(); ctx.fillStyle = '#fff0bf'; ctx.globalAlpha = 1 - age / 550;
        for (let i = 0; i < 7; i++) {
          const angle = i * Math.PI * 2 / 7, radius = 10 + age / 12;
          ctx.beginPath(); ctx.arc(s.pourOrigin.x + Math.cos(angle) * radius, s.pourOrigin.y - age / 8 + Math.sin(angle) * radius / 2, 2.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore(); frame = requestAnimationFrame(paint);
      }
    });
  }
  invalidate = paint;
  // Explicit font loads matter: canvas text doesn't trigger CSS font fetching.
  Promise.all([document.fonts.load('400 16px "DM Sans"'), document.fonts.load('600 16px "DM Sans"'), document.fonts.load('400 20px Lora'), document.fonts.load('700 20px "DM Sans"')]).then(() => { if (canvas.isConnected) paint(); });
  paint();
  return () => { cancelAnimationFrame(frame); };
}
