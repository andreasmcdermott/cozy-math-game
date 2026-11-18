// Illustrated content and familiar identities. Exact quantities stay in ticks.
export const INGREDIENTS = [
  { id:'moonwater', name:'Moonwater', color:'#79b6cf', art:'moonwater', noun:'moonwater' },
  { id:'lavender', name:'Lavender', color:'#a87eb8', art:'lavender', noun:'lavender tea' },
  { id:'chamomile', name:'Chamomile', color:'#e1ae54', art:'chamomile', noun:'chamomile tea' },
  { id:'mint', name:'Garden mint', color:'#85ad86', art:'mint', noun:'mint tea' },
  { id:'dew', name:'Forest dew', color:'#92b7a2', art:'dew', noun:'forest dew' },
  { id:'mushrooms', name:'Ruby caps', color:'#c17665', art:'mushrooms', noun:'ruby-cap infusion' },
  { id:'truffles', name:'Moon truffles', color:'#97a6cc', art:'truffles', noun:'moon-truffle tea' },
  { id:'spores', name:'Golden spores', color:'#d5b35c', art:'spores', noun:'golden-spore infusion' },
  { id:'embertea', name:'Ember tea', color:'#d89062', art:'embertea', noun:'ember tea' },
  { id:'chili', name:'Dragon chili', color:'#c96859', art:'chili', noun:'dragon-chili infusion' },
  { id:'ginger', name:'Golden ginger', color:'#d8b269', art:'ginger', noun:'ginger tea' },
  { id:'cinnamon', name:'Cinnamon', color:'#ac8067', art:'cinnamon', noun:'cinnamon tea' },
];
export const FAMILIARS = [
  { id:'clover', name:'Clover', species:'Moss kitten', art:'moss-kitten', cost:0, ingredients:['moonwater','lavender','chamomile','mint'], roomArt:'cozy-corner', roomName:'Herbal cottage', trayName:'Herbal tray', specialty:'Herbs & blossoms', description:'Mint, lavender, and chamomile are Clover’s favorite ingredients.', perk:'Six herbal recipes', greeting:'Every great potion starts with a little patience.', lines:['Purr-fectly measured!','I believe in you. And snacks.','The mint smells wonderful today.','Shall we make something wonderful?'] },
  { id:'fern', name:'Fern', species:'Mushroom frog', art:'mushroom-frog', cost:180, ingredients:['dew','mushrooms','truffles','spores'], roomArt:'room-fern', roomName:'Mushroom cottage', trayName:'Woodland tray', specialty:'Mushrooms & spores', description:'Fern brews with forest dew, mushrooms, glowing truffles, and spores.', perk:'Six woodland recipes', greeting:'One scoop at a time. You have got this!', lines:['That deserves a happy hop!','These truffles have a lovely glow.','My mushroom hat says you can do it.','The garden is rooting for you!'] },
  { id:'pip', name:'Pip', species:'Pocket dragon', art:'lavender-dragon', cost:450, ingredients:['embertea','chili','ginger','cinnamon'], roomArt:'room-pip', roomName:'Ember tower', trayName:'Spice tray', specialty:'Peppers & warm spices', description:'Pip likes warming brews with dragon chili, ginger, and cinnamon.', perk:'Six warming recipes', greeting:'Let us cook up a little magic together.', lines:['A tiny roar for a wonderful alchemist!','Just a pinch of dragon chili!','I could warm the kettle. Just a little.','Another cozy adventure?'] },
];
export const LEGACY_INGREDIENTS = ['moonwater','moonberries','honey','mint'];
const PATTERNS = [[35,40,24,0],[40,0,0,45],[50,30,0,0],[36,0,45,20],[0,45,30,24],[45,24,0,50]];
const recipeNames = {
  clover:['Moonbeam tonic','Seedling sip','Lavender lullaby','Sunleaf tea','Courage blossom','Morning dew'],
  fern:['Firefly glow','Mushroom meadow','Spore sparkle','Truffle treasure','Rainy-day glow','Toadstool tonic'],
  pip:['Pocket embers','Dragon’s welcome','Cinnamon clouds','Pepper sparkle','Brave little flame','Sunrise wings'],
};
const requests = {
  clover:['My reading nook could use a little glow. One moonbeam tonic, please!','My seedlings look sleepy. Could you brew a seedling sip?','A lavender lullaby for a quiet evening, please.','Could you bottle some sunleaf tea for our picnic?','A courage blossom brew would help before my concert!','Some morning dew for a fresh start, please!'],
  fern:['Could you brew some firefly glow for our garden lanterns?','My mushrooms need a little magic. A mushroom meadow brew, please!','A spore sparkle potion would brighten the woodland fair!','Could you make a truffle treasure brew for my forest walk?','A rainy-day glow potion would cheer up this cloudy afternoon.','Some toadstool tonic for the forest garden, please!'],
  pip:['My paws are chilly. A pocket embers potion, please!','A dragon’s welcome brew for our visitors would be lovely!','Could you make cinnamon clouds for a cozy evening?','A little pepper sparkle for the winter festival, please!','I could use a brave little flame before my big adventure.','A sunrise wings potion would warm up our morning walk!'],
};
export const RECIPES = FAMILIARS.flatMap(p => PATTERNS.map((pattern,n) => ({
  id:`${p.id}-${n}`, familiar:p.id, name:recipeNames[p.id][n], subtitle:p.specialty,
  color:INGREDIENTS.find(i=>i.id===p.ingredients[(n+1)%4]).color,
  amounts:Object.fromEntries(pattern.flatMap((units,index)=>units?[[p.ingredients[index],units]]:[])),
  customer:'Hazel', art:'rabbit', request:requests[p.id][n],
})));

export const DECORATIONS = [
  { id: 'herbs', name: 'A bundle of green', description: 'Fresh garden herbs, ready to hang and dry.', cost: 16, art: 'decor-herbs' },
  { id: 'plants', name: 'Window fern', description: 'A leafy little friend to catch the sunlight.', cost: 24, art: 'decor-plant' },
  { id: 'lantern', name: 'Firefly lantern', description: 'A warm glow for long storybook evenings.', cost: 36, art: 'decor-lantern' },
  { id: 'garland', name: 'Moon & star garland', description: 'Little wonders strung across the room.', cost: 40, icon: 'sparkles' },
  { id: 'rug', name: 'Moonberry rug', description: 'A soft woven circle for tiny paws.', cost: 48, art: 'decor-rug' },
  { id: 'painting', name: 'A moonlit view', description: 'A little landscape to dream about.', cost: 60, art: 'decor-painting' },
  { id: 'bed', name: 'Cloud-soft pet bed', description: 'The best place for an afternoon nap.', cost: 72, art: 'decor-bed' },
  { id: 'shelf', name: 'Potion shelf', description: 'A small shelf for your favorite brews.', cost: 84, art: 'decor-potion-shelf' },
  { id: 'tea', name: 'Tea for two', description: 'A little table for you and your familiar.', cost: 100, art: 'decor-tea-table' },
  { id: 'bookshelf', name: 'Storybook shelves', description: 'A home for books and future adventures.', cost: 120, art: 'decor-bookshelf' },
];
const themedDecor = {
  fern:['Dried mushroom bunch','Toadstool planter','Glowcap lantern','Firefly garland','Lily-pad rug','Moonlit pond','Moss nest','Spore shelf','Dewdrop tea','Field-guide nook'],
  pip:['Pepper braid','Crystal pot','Ember lantern','Flame bunting','Sunburst rug','Starry peaks','Ember cushion','Spice shelf','Warming kettle','Treasure bookshelf'],
};
export const ROOM_DECORATIONS = {
  clover:DECORATIONS,
  ...Object.fromEntries(['fern','pip'].map(pet=>[pet,DECORATIONS.map((d,n)=>({ ...d, name:themedDecor[pet][n], description:'A treasure for this room.', art:d.id==='garland'?undefined:`${pet}-${d.id}` }))])),
};
export const familiarFor = id => FAMILIARS.find(p=>p.id===id) || FAMILIARS[0];
export const ingredientsFor = saveOrId => familiarFor(typeof saveOrId==='string'?saveOrId:saveOrId.active).ingredients.map(id=>INGREDIENTS.find(i=>i.id===id));
export const recipesFor = saveOrId => RECIPES.filter(r=>r.familiar===(typeof saveOrId==='string'?saveOrId:saveOrId.active));
export const decorationsFor = id => ROOM_DECORATIONS[id] || ROOM_DECORATIONS.clover;
