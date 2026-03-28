/* =========================================================
   1) CONSTANTS / DEFAULTS
========================================================= */
const STORAGE_KEY = 'culinary_planner_jsfiddle_baseline_v1';

const STARTER_COLLECTIONS = [
  { key:'freezer-pack',  label:'2-week freezer pack',       provider:'mealdb',      query:'chicken',                  mode:'ingredient', facets:{ storage:'freezer', mealType:'dinner', protein:'chicken' } },
  { key:'high-protein',  label:'high-protein weeknights',   provider:'mealdb',      query:'beef',                     mode:'ingredient', facets:{ mealType:'dinner', protein:'beef', time:'30' } },
  { key:'japanese-core', label:'Japanese core component',   provider:'wikipedia',   query:'Japanese cuisine',         mode:'name',       facets:{} },
  { key:'cookbook-search',label:'cookbook research',        provider:'openlibrary', query:'meal prep cookbook',       mode:'name',       facets:{} }
];

const HOUSEHOLD_PRESETS = {
  solo:         { preset:'solo',         people:1, pantryLevel:'normal', shoppingFrequency:'weekly',   prepStyle:'standard' },
  couple:       { preset:'couple',       people:2, pantryLevel:'normal', shoppingFrequency:'weekly',   prepStyle:'batch' },
  family:       { preset:'family',       people:4, pantryLevel:'high',   shoppingFrequency:'biweekly', prepStyle:'batch' },
  'teacher-demo':{ preset:'teacher-demo',people:2, pantryLevel:'normal', shoppingFrequency:'weekly',   prepStyle:'showcase' }
};

function emptyMapState(){
  return {
    view:{ x:0, y:0, k:1 },
    pos:{},
    pinned:{},
    layers:{ query:true, source:true, bucket:true, idea:true, docs:true },
    collapsedBuckets:{}
  };
}

function emptyShoppingWeek(){
  return {
    produce:[], protein:[], dairyEggs:[], frozen:[],
    pantry:[], condiments:[], spices:[], specialty:[]
  };
}

function defaultUI(){
  return {
    step:'Discover',
    provider:'mealdb',
    mode:'name',
    query:'chicken',
    selectedNodeId:null,
    selectedDocSection:'cover',
    recipeEditId:null,
    status:'Ready',
    searchStatus:'idle',
    searchError:null,
    calAssign:null
  };
}

function defaultProject(name='Meal Prep Plan'){
  const rotationDays = Array.from({ length:7 }, (_, i) => ({
    day:i+1,
    storage:i < 3 ? 'fridge' : 'freezer',
    breakfast:'',
    lunch:'',
    dinner:'',
    snacks:['','']
  }));

  return {
    id: genId(),
    name,
    brief:{
      title:name,
      days:7,
      people:1,
      cuisine:'Any',
      core:'chicken, beans, tofu',
      likes:'umami, ginger, sesame',
      avoid:'very lemon-forward',
      targets:{ protein_g:140, fiber_g:30, carbs:'balanced' }
    },
    trail:[],
    sources:[],
    ideas:[],
    searchResults:[],
    discoverFacets:{
      include:'', exclude:'',
      mealType:'any', storage:'any', time:'any', protein:'any', difficulty:'any'
    },
    docs:{
      cover:null,
      outline:null,
      citations:[],
      pinnedSources:[],
      notes:''
    },
    recipes:[],
    prepMap:{
      cookDay1:[], midweek:[], cookDay2:[],
      containers:{ meals:0, sides:0, snacks:0 }
    },
    shopping:{ week1:emptyShoppingWeek(), week2:emptyShoppingWeek() },
    rotation:{ mode:'A', days:rotationDays },
    map:emptyMapState(),

    pantryConsumption:{},
    pantryBaseline:[],
    usageStats:{ recipesUsed:{}, sourcesUsed:{}, systemsUsed:{} },
    performanceTrends:{ recipeUses:{}, systemUses:{}, sourceInfluence:{} },

    comparison:{ lastComparedProjectId:null, lastComparison:null },
    mergeLog:[],
    mergeConflicts:[],

    sourceConfidence:{},
    sourceConfidenceSuggestions:[],

    householdProfile:{
      preset:'solo',
      people:1,
      pantryLevel:'normal',
      shoppingFrequency:'weekly',
      prepStyle:'standard'
    },

    recommendationMemory:{
      favoriteIdeas:{},
      favoriteRecipes:{},
      favoriteSystems:{},
      favoriteSources:{}
    },
    recommendationTuning:{
      memoryWeight:2,
      confidenceWeight:1.5,
      usageWeight:1,
      systemWeight:1
    },
    recommendationDebug:{ lastRanked:[] },
    learningControls:{ mode:'balanced', contributionStrength:1 },

    auditRules:{
      minSources:5,
      minRecipes:4,
      minCitations:3,
      minCoveredDays:5
    },

    exportTemplate:'planner',
    exportLayoutPreset:'cards',
    exportSectionOrder:['cover','overview','calendar','recipes','prep','shopping','references'],
    exportCompositionOverrides:{},
    shareMode:'planner-pdf',

    lineageFilters:{ search:'', mode:'all' },
    lineageGrouping:'none',

    stabilizationLog:[],
    debugHistory:[]
  };
}

function defaultState(){
  return {
    projects:[],
    activeProjectId:null,
    ui:defaultUI()
  };
}

/* =========================================================
   2) NORMALIZATION / PERSISTENCE
========================================================= */
function normalizeProject(raw={}){
  const base = defaultProject(raw.name || 'Meal Prep Plan');
  return {
    ...base,
    ...raw,
    brief:{ ...base.brief, ...(raw.brief || {}), targets:{ ...base.brief.targets, ...((raw.brief || {}).targets || {}) } },
    trail:Array.isArray(raw.trail) ? raw.trail : [],
    sources:Array.isArray(raw.sources) ? raw.sources : [],
    ideas:Array.isArray(raw.ideas) ? raw.ideas : [],
    searchResults:Array.isArray(raw.searchResults) ? raw.searchResults : [],
    discoverFacets:{ ...base.discoverFacets, ...(raw.discoverFacets || {}) },
    docs:{
      ...base.docs,
      ...(raw.docs || {}),
      citations:Array.isArray(raw?.docs?.citations) ? raw.docs.citations : [],
      pinnedSources:Array.isArray(raw?.docs?.pinnedSources) ? raw.docs.pinnedSources : []
    },
    recipes:Array.isArray(raw.recipes) ? raw.recipes : [],
    prepMap:{
      ...base.prepMap,
      ...(raw.prepMap || {}),
      cookDay1:Array.isArray(raw?.prepMap?.cookDay1) ? raw.prepMap.cookDay1 : [],
      midweek:Array.isArray(raw?.prepMap?.midweek) ? raw.prepMap.midweek : [],
      cookDay2:Array.isArray(raw?.prepMap?.cookDay2) ? raw.prepMap.cookDay2 : [],
      containers:{ ...base.prepMap.containers, ...((raw.prepMap || {}).containers || {}) }
    },
    shopping:{
      week1:{ ...emptyShoppingWeek(), ...((raw.shopping || {}).week1 || {}) },
      week2:{ ...emptyShoppingWeek(), ...((raw.shopping || {}).week2 || {}) }
    },
    rotation:{
      ...base.rotation,
      ...(raw.rotation || {}),
      days:Array.isArray(raw?.rotation?.days) ? raw.rotation.days : base.rotation.days
    },
    map:{
      ...emptyMapState(),
      ...(raw.map || {}),
      view:{ ...emptyMapState().view, ...((raw.map || {}).view || {}) },
      pos:{ ...((raw.map || {}).pos || {}) },
      pinned:{ ...((raw.map || {}).pinned || {}) },
      layers:{ ...emptyMapState().layers, ...((raw.map || {}).layers || {}) },
      collapsedBuckets:{ ...((raw.map || {}).collapsedBuckets || {}) }
    },
    pantryConsumption:{ ...(raw.pantryConsumption || {}) },
    pantryBaseline:Array.isArray(raw.pantryBaseline) ? raw.pantryBaseline : [],
    usageStats:{
      recipesUsed:{ ...((raw.usageStats || {}).recipesUsed || {}) },
      sourcesUsed:{ ...((raw.usageStats || {}).sourcesUsed || {}) },
      systemsUsed:{ ...((raw.usageStats || {}).systemsUsed || {}) }
    },
    performanceTrends:{
      recipeUses:{ ...((raw.performanceTrends || {}).recipeUses || {}) },
      systemUses:{ ...((raw.performanceTrends || {}).systemUses || {}) },
      sourceInfluence:{ ...((raw.performanceTrends || {}).sourceInfluence || {}) }
    },
    comparison:{
      lastComparedProjectId:((raw.comparison || {}).lastComparedProjectId || null),
      lastComparison:((raw.comparison || {}).lastComparison || null)
    },
    mergeLog:Array.isArray(raw.mergeLog) ? raw.mergeLog : [],
    mergeConflicts:Array.isArray(raw.mergeConflicts) ? raw.mergeConflicts : [],
    sourceConfidence:{ ...(raw.sourceConfidence || {}) },
    sourceConfidenceSuggestions:Array.isArray(raw.sourceConfidenceSuggestions) ? raw.sourceConfidenceSuggestions : [],
    householdProfile:{
      preset:((raw.householdProfile || {}).preset || 'solo'),
      people:Number(((raw.householdProfile || {}).people ?? 1)),
      pantryLevel:((raw.householdProfile || {}).pantryLevel || 'normal'),
      shoppingFrequency:((raw.householdProfile || {}).shoppingFrequency || 'weekly'),
      prepStyle:((raw.householdProfile || {}).prepStyle || 'standard')
    },
    recommendationMemory:{
      favoriteIdeas:{ ...((raw.recommendationMemory || {}).favoriteIdeas || {}) },
      favoriteRecipes:{ ...((raw.recommendationMemory || {}).favoriteRecipes || {}) },
      favoriteSystems:{ ...((raw.recommendationMemory || {}).favoriteSystems || {}) },
      favoriteSources:{ ...((raw.recommendationMemory || {}).favoriteSources || {}) }
    },
    recommendationTuning:{
      memoryWeight:Number(((raw.recommendationTuning || {}).memoryWeight ?? 2)),
      confidenceWeight:Number(((raw.recommendationTuning || {}).confidenceWeight ?? 1.5)),
      usageWeight:Number(((raw.recommendationTuning || {}).usageWeight ?? 1)),
      systemWeight:Number(((raw.recommendationTuning || {}).systemWeight ?? 1))
    },
    recommendationDebug:{
      lastRanked:Array.isArray((raw.recommendationDebug || {}).lastRanked) ? raw.recommendationDebug.lastRanked : []
    },
    learningControls:{
      mode:((raw.learningControls || {}).mode || 'balanced'),
      contributionStrength:Number(((raw.learningControls || {}).contributionStrength ?? 1))
    },
    auditRules:{
      minSources:Number(((raw.auditRules || {}).minSources ?? 5)),
      minRecipes:Number(((raw.auditRules || {}).minRecipes ?? 4)),
      minCitations:Number(((raw.auditRules || {}).minCitations ?? 3)),
      minCoveredDays:Number(((raw.auditRules || {}).minCoveredDays ?? 5))
    },
    exportTemplate:raw.exportTemplate || 'planner',
    exportLayoutPreset:raw.exportLayoutPreset || 'cards',
    exportSectionOrder:Array.isArray(raw.exportSectionOrder) ? raw.exportSectionOrder : ['cover','overview','calendar','recipes','prep','shopping','references'],
    exportCompositionOverrides:{ ...((raw.exportCompositionOverrides || {})) },
    shareMode:raw.shareMode || 'planner-pdf',
    lineageFilters:{
      search:((raw.lineageFilters || {}).search || ''),
      mode:((raw.lineageFilters || {}).mode || 'all')
    },
    lineageGrouping:raw.lineageGrouping || 'none',
    stabilizationLog:Array.isArray(raw.stabilizationLog) ? raw.stabilizationLog : [],
    debugHistory:Array.isArray(raw.debugHistory) ? raw.debugHistory : []
  };
}

function normalizeState(raw={}){
  const base = defaultState();
  const projects = Array.isArray(raw.projects) ? raw.projects.map(normalizeProject) : [];
  const activeProjectId = raw.activeProjectId && projects.some(p => p.id === raw.activeProjectId)
    ? raw.activeProjectId
    : (projects[0]?.id || null);

  return {
    ...base,
    ...raw,
    projects,
    activeProjectId,
    ui:{ ...base.ui, ...(raw.ui || {}) }
  };
}

function loadState(){
  try {
    return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
  } catch {
    return defaultState();
  }
}

let saveTimer = null;
function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function saveStateThrottled(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveState, 400);
}

/* =========================================================
   3) ACTIVE HELPERS / MUTATION FLOW
========================================================= */
function activeProject(){
  return state.projects.find(p => p.id === state.activeProjectId) || state.projects[0];
}

function patchProject(updater, opts={ save:true, render:true, throttled:true }){
  const p = activeProject();
  if (!p) return;
  updater(p);
  if (opts.save) opts.throttled ? saveStateThrottled() : saveState();
  if (opts.render) render();
}

function setStatus(text, shouldRender=true){
  state.ui.status = text;
  if (shouldRender) render();
}

/* =========================================================
   4) DATA NORMALIZATION HELPERS
========================================================= */
function genId(){
  return Math.random().toString(36).slice(2,9) + Date.now().toString(36);
}

function escHtml(s){
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function parseFraction(s){
  if (!s) return 1;
  s = String(s).trim();
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) return parseInt(frac[1]) / parseInt(frac[2]);
  return parseFloat(s) || 1;
}

function normalizeIngredientName(line){
  if (!line || typeof line !== 'string') return '';
  return line
    .toLowerCase()
    .replace(/^\s*[\d\/\.\s\-]+/, '')
    .replace(/\b(cups?|tablespoons?|tbsps?|teaspoons?|tsps?|oz|ounces?|lbs?|pounds?|grams?|g\b|kg|ml|liters?|pieces?|slices?|cloves?|bunches?|heads?|cans?|jars?|bags?|packages?|pinch|dash|handful|sprigs?)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function categorizeIngredient(name){
  const n = normalizeIngredientName(name);
  const checks = [
    { cat:'protein',    keys:['chicken','beef','pork','lamb','fish','salmon','tuna','shrimp','prawn','egg','tofu','turkey','bacon','sausage','meat','steak','mince','ground'] },
    { cat:'produce',    keys:['tomato','onion','garlic','pepper','carrot','celery','spinach','mushroom','lemon','lime','apple','ginger','basil','parsley','cilantro','coriander','cucumber','zucchini','courgette','potato','lettuce','avocado','scallion','kale','broccoli','cauliflower','leek','cabbage','peas','corn','bean sprout','green onion'] },
    { cat:'dairyEggs',  keys:['milk','cream','butter','cheese','yogurt','parmesan','mozzarella','cheddar','ricotta','sour cream','heavy cream','half and half'] },
    { cat:'frozen',     keys:['frozen','ice cream'] },
    { cat:'condiments', keys:['ketchup','mayo','mayonnaise','mustard','soy sauce','hot sauce','worcestershire','honey','jam','aioli','tahini','hoisin','teriyaki','oyster sauce','fish sauce','sriracha'] },
    { cat:'spices',     keys:['cumin','paprika','cinnamon','turmeric','oregano','thyme','bay leaf','chili','chile','curry','nutmeg','cayenne','pepper','salt','seasoning','spice','cardamom','coriander seed','fennel seed','star anise','allspice','clove'] },
    { cat:'specialty',  keys:['wine','miso','coconut milk','anchovy','capers','truffle','mirin','sake','sesame oil','rice wine','dashi','bonito','nori','miso paste'] },
    { cat:'pantry',     keys:['flour','rice','pasta','bread','sugar','oat','lentil','bean','stock','broth','oil','vinegar','tomato paste','tomato puree','noodle','cracker','cereal','breadcrumb','cornstarch','baking','soda','yeast','canned','tinned'] },
  ];
  for (const { cat, keys } of checks) {
    if (keys.some(k => n.includes(k))) return cat;
  }
  return 'pantry';
}

function countAndFormat(items){
  const nameMap = new Map();
  const unitRe = /^([\d\/\.\s]+)\s*(cups?|tbsps?|tablespoons?|tsps?|teaspoons?|oz|ounces?|lbs?|pounds?|grams?|g|kg|ml|l)?\s*/i;

  items.forEach(line => {
    const name = normalizeIngredientName(line);
    if (!name) return;
    const entry = nameMap.get(name) || { parts:[] };
    const m = line.match(unitRe);
    if (m && m[1] && m[1].trim()) {
      const qty = parseFraction(m[1].trim());
      entry.parts.push({ qty: isNaN(qty) ? 1 : qty, unit: (m[2]||'').toLowerCase().replace(/s$/, '') });
    } else {
      entry.parts.push({ qty:1, unit:'' });
    }
    nameMap.set(name, entry);
  });

  const result = new Map();
  nameMap.forEach((entry, name) => {
    const byUnit = {};
    entry.parts.forEach(p => { byUnit[p.unit] = (byUnit[p.unit] || 0) + p.qty; });
    const parts = Object.entries(byUnit).map(([unit, qty]) => {
      const qtyStr = qty % 1 === 0 ? String(qty) : qty.toFixed(1);
      return unit ? `${qtyStr} ${unit}` : qtyStr;
    });
    result.set(name, parts.join(' + '));
  });
  return result;
}

function toSourceCard(provider, raw){
  if (!raw) return null;
  if (provider === 'mealdb') {
    const id = 'mdb-' + raw.idMeal;
    const url = raw.strSource || `https://www.themealdb.com/meal/${raw.idMeal}`;
    const snippet = raw.strInstructions
      ? raw.strInstructions.slice(0, 200).replace(/\r?\n/g, ' ') + '…'
      : (raw.strCategory ? `Category: ${raw.strCategory}` : '');
    // Trim raw to only fields we use (saves localStorage space)
    const trimmedRaw = {};
    for (let i = 1; i <= 20; i++) {
      if (raw[`strIngredient${i}`]) trimmedRaw[`strIngredient${i}`] = raw[`strIngredient${i}`];
      if (raw[`strMeasure${i}`])    trimmedRaw[`strMeasure${i}`]    = raw[`strMeasure${i}`];
    }
    trimmedRaw.strInstructions = raw.strInstructions ? raw.strInstructions.slice(0, 1000) : '';
    trimmedRaw.strMealThumb    = raw.strMealThumb || '';
    trimmedRaw.strCategory     = raw.strCategory || '';
    trimmedRaw.strArea         = raw.strArea || '';
    return { id, title:raw.strMeal||'', source:'TheMealDB', snippet, thumb:raw.strMealThumb||null, url, provider, raw:trimmedRaw };
  }
  if (provider === 'openlibrary') {
    const id = 'ol-' + (raw.key || '').replace(/\//g, '-');
    const authors = (raw.author_name || []).slice(0, 2).join(', ') || 'Unknown author';
    const year = raw.first_publish_year || '';
    const thumb = raw.cover_i ? `https://covers.openlibrary.org/b/id/${raw.cover_i}-M.jpg` : null;
    return {
      id, title:raw.title||'(Untitled)',
      source:`Open Library — ${authors}`,
      snippet:`${authors}${year ? ' · '+year : ''}`,
      thumb, url:`https://openlibrary.org${raw.key||''}`,
      provider, raw:{ key:raw.key, title:raw.title, author_name:raw.author_name, first_publish_year:raw.first_publish_year, cover_i:raw.cover_i }
    };
  }
  if (provider === 'wikipedia') {
    const id = 'wiki-' + (raw.pageid || genId());
    const snippet = raw.extract
      ? raw.extract.slice(0, 200) + '…'
      : (raw.snippet || '').replace(/<[^>]+>/g, '').slice(0, 200);
    const thumb = (raw.thumbnail && raw.thumbnail.source) ? raw.thumbnail.source : null;
    const url = raw.content_urls
      ? raw.content_urls.desktop.page
      : `https://en.wikipedia.org/wiki/${encodeURIComponent((raw.title||'').replace(/ /g,'_'))}`;
    return { id, title:raw.title||'', source:'Wikipedia', snippet, thumb, url, provider, raw:{ pageid:raw.pageid, title:raw.title } };
  }
  return null;
}

function dedupeSourceCards(cards){
  const seenUrls   = new Set();
  const seenTitles = new Set();
  return cards.filter(c => {
    if (!c) return false;
    const url   = (c.url   || '').toLowerCase().replace(/\/$/, '');
    const title = (c.title || '').toLowerCase().trim();
    if (url   && seenUrls.has(url))     return false;
    if (title && seenTitles.has(title)) return false;
    if (url)   seenUrls.add(url);
    if (title) seenTitles.add(title);
    return true;
  });
}

/* =========================================================
   5) DOMAIN HELPERS
========================================================= */
async function providerSearch(provider, mode, query){
  state.ui.searchStatus = 'loading';
  state.ui.searchError  = null;
  const proj = activeProject();
  if (proj) proj.searchResults = [];
  render();

  try {
    let items = [];

    if (provider === 'mealdb') {
      const paramKey = mode === 'ingredient' ? 'i' : mode === 'area' ? 'a' : 's';
      const endpoint = mode === 'name' ? 'search' : 'filter';
      const url = `https://www.themealdb.com/api/json/v1/1/${endpoint}.php?${paramKey}=${encodeURIComponent(query)}`;
      const res  = await fetch(url);
      const data = await res.json();
      items = (data.meals || []).map(m => toSourceCard('mealdb', m)).filter(Boolean);

    } else if (provider === 'openlibrary') {
      const url  = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&fields=key,title,author_name,first_publish_year,cover_i&limit=20`;
      const res  = await fetch(url);
      const data = await res.json();
      items = (data.docs || []).map(d => toSourceCard('openlibrary', d)).filter(Boolean);

    } else if (provider === 'wikipedia') {
      const url  = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=10&format=json&origin=*`;
      const res  = await fetch(url);
      const data = await res.json();
      items = ((data.query || {}).search || []).map(s => toSourceCard('wikipedia', s)).filter(Boolean);
    }

    // Apply project facets
    if (proj) items = applyDiscoverFacets(items, proj.discoverFacets);
    items = dedupeSourceCards(items);

    patchProject(p => { p.searchResults = items; }, { save:true, render:false, throttled:false });
    state.ui.searchStatus = 'done';
  } catch (err) {
    state.ui.searchStatus = 'error';
    state.ui.searchError  = err.message;
  }
  render();
}

function applyDiscoverFacets(cards, facets){
  if (!facets) return cards;
  const { include, exclude } = facets;
  // Only apply user-typed text filters; structural facets (mealType, protein, etc.)
  // are project metadata and not reliably present in API response payloads.
  return cards.filter(c => {
    const h = JSON.stringify(c).toLowerCase();
    if (include && include.trim() && !h.includes(include.toLowerCase())) return false;
    if (exclude && exclude.trim() &&  h.includes(exclude.toLowerCase())) return false;
    return true;
  });
}

function useStarterCollection(key){
  const col = STARTER_COLLECTIONS.find(c => c.key === key);
  if (!col) return;
  state.ui.provider = col.provider;
  state.ui.mode     = col.mode;
  state.ui.query    = col.query;
  patchProject(p => { p.discoverFacets = { ...p.discoverFacets, ...col.facets }; }, { save:true, render:false });
  runSearch();
}

function generateRecipeFromSource(source){
  const id = genId();
  let ingredients = [];
  let steps       = [];
  const thumb     = source.thumb || null;

  if (source.provider === 'mealdb' && source.raw) {
    const r = source.raw;
    for (let i = 1; i <= 20; i++) {
      const ing  = r[`strIngredient${i}`];
      const meas = r[`strMeasure${i}`];
      if (ing && ing.trim()) ingredients.push(`${meas ? meas.trim()+' ' : ''}${ing.trim()}`);
    }
    if (r.strInstructions) {
      steps = r.strInstructions.split(/\r?\n\r?\n|\r?\n/).map(s => s.trim()).filter(Boolean);
    }
  }

  const recipe = { id, title:source.title, sourceId:source.id, ingredients, steps, cookTime:30, thumb, cookAhead:false, ideaId:null };
  patchProject(p => { p.recipes.push(recipe); }, { save:true, render:false });
  return id;
}

function updateRecipe(id, fields){
  patchProject(p => {
    const idx = p.recipes.findIndex(r => r.id === id);
    if (idx !== -1) Object.assign(p.recipes[idx], fields);
  });
}

function removeRecipe(id){
  patchProject(p => {
    p.recipes = p.recipes.filter(r => r.id !== id);
    p.rotation.days.forEach(day => {
      ['breakfast','lunch','dinner'].forEach(slot => { if (day[slot] === id) day[slot] = ''; });
      day.snacks = day.snacks.map(s => s === id ? '' : s);
    });
  });
}

function buildShoppingList(project){
  const allIngredients = [];
  const warnings       = [];
  const pantryBaseline = (project.pantryBaseline || []).map(n => normalizeIngredientName(n));

  project.rotation.days.forEach((day, idx) => {
    const hasAny = day.breakfast || day.lunch || day.dinner;
    if (!hasAny) warnings.push(`Day ${idx+1} has no meal assigned.`);
    ['breakfast','lunch','dinner'].forEach(slot => {
      const recipeId = day[slot];
      if (!recipeId) return;
      const recipe = project.recipes.find(r => r.id === recipeId);
      if (!recipe) { warnings.push(`Day ${idx+1} ${slot}: recipe not found.`); return; }
      if (!recipe.ingredients || !recipe.ingredients.length) warnings.push(`"${recipe.title}" has no ingredients.`);
      allIngredients.push(...(recipe.ingredients || []));
    });
  });

  const filtered = allIngredients.filter(ing => {
    const n = normalizeIngredientName(ing);
    return !pantryBaseline.some(b => n.includes(b) || b.includes(n));
  });

  const agg = countAndFormat(filtered);
  const categories = { produce:[], protein:[], dairyEggs:[], frozen:[], pantry:[], condiments:[], spices:[], specialty:[] };
  agg.forEach((qty, name) => {
    const cat = categorizeIngredient(name);
    categories[cat].push({ name, qty, checked:false });
  });

  return { categories, warnings };
}

function assignMealToDay(day, slot, recipeId){
  patchProject(p => {
    if (slot === 'snack1') { p.rotation.days[day].snacks[0] = recipeId || ''; return; }
    if (slot === 'snack2') { p.rotation.days[day].snacks[1] = recipeId || ''; return; }
    p.rotation.days[day][slot] = recipeId || '';
  });
}

function buildPrepMap(project){
  const map = {};
  project.rotation.days.forEach((day, i) => {
    const recipes = ['breakfast','lunch','dinner']
      .map(s => project.recipes.find(r => r.id === day[s]))
      .filter(Boolean);
    map[i] = { isCookDay: recipes.some(r => r.cookAhead) || i === 0 || i === 3, recipes: recipes.map(r => r.id) };
  });
  return map;
}

function scoreAndRankSources(project){
  return (project.sources || []).map(src => {
    const conf    = (project.sourceConfidence[src.id] || 0.5);
    const usage   = ((project.usageStats.sourcesUsed || {})[src.id] || 0);
    const recency = project.sources.length > 1 ? project.sources.indexOf(src) / (project.sources.length - 1) : 0.5;
    const mem     = ((project.recommendationMemory.favoriteSources || {})[src.id] || {});
    const boost   = mem.boost || 0;
    const t       = project.recommendationTuning;
    const score   = conf * (t.confidenceWeight||1.5)
                  + usage * (t.usageWeight||1)
                  + recency * (t.systemWeight||1)
                  + boost * (t.memoryWeight||2);
    return { ...src, score, _debug:{ conf, usage, recency, boost } };
  }).sort((a, b) => b.score - a.score);
}

function explainRecommendation(item){
  const parts = [];
  if (item._debug) {
    const d = item._debug;
    if (d.conf >= 0.7) parts.push(`high confidence (${d.conf.toFixed(1)})`);
    if (d.usage >= 2)  parts.push(`used ${d.usage} times`);
    if (d.boost > 0)   parts.push('boosted by you');
    if (d.recency > 0.7) parts.push('recently added');
  }
  return parts.length ? parts.slice(0, 2).join(' and ') : 'general match';
}

function auditProject(project){
  const results = {};
  try {
    results.hasRecipes   = { pass: project.recipes.length >= project.auditRules.minRecipes,   detail:`${project.recipes.length}/${project.auditRules.minRecipes} recipes` };
    results.hasSources   = { pass: project.sources.length >= project.auditRules.minSources,   detail:`${project.sources.length}/${project.auditRules.minSources} sources` };
    results.hasCitations = { pass: (project.docs.citations||[]).length >= project.auditRules.minCitations, detail:`${(project.docs.citations||[]).length}/${project.auditRules.minCitations} citations` };
    const covered = project.rotation.days.filter(d => d.breakfast || d.lunch || d.dinner).length;
    results.coveredDays  = { pass: covered >= project.auditRules.minCoveredDays, detail:`${covered}/${project.auditRules.minCoveredDays} days covered` };
    const srcIds = new Set(project.sources.map(s => s.id));
    const orphaned = project.recipes.filter(r => r.sourceId && !srcIds.has(r.sourceId)).length;
    results.noOrphans    = { pass: orphaned === 0, detail: orphaned === 0 ? 'All sources intact' : `${orphaned} orphaned recipe(s)` };
    results.hasExport    = { pass: project.exportSectionOrder.length > 0, detail:`${project.exportSectionOrder.length} export sections` };
  } catch (e) {
    results.error = { pass:false, detail:e.message };
  }
  return results;
}

function getDebugSnapshot(project){
  return {
    recipeCount:      project.recipes.length,
    sourceCount:      project.sources.length,
    ideaCount:        project.ideas.length,
    daysCovered:      project.rotation.days.filter(d => d.breakfast || d.lunch || d.dinner).length,
    searchResultsCount: project.searchResults.length,
    stabilizationLogs:  project.stabilizationLog.length,
    auditResult:      auditProject(project)
  };
}

function compareProjects(p1, p2){
  const ids1 = new Set(p1.recipes.map(r => r.id));
  const ids2 = new Set(p2.recipes.map(r => r.id));
  const src1 = new Set(p1.sources.map(s => s.id));
  const src2 = new Set(p2.sources.map(s => s.id));
  return {
    added:   { recipes: p2.recipes.filter(r => !ids1.has(r.id)), sources: p2.sources.filter(s => !src1.has(s.id)) },
    removed: { recipes: p1.recipes.filter(r => !ids2.has(r.id)), sources: p1.sources.filter(s => !src2.has(s.id)) }
  };
}

function buildLineageChain(itemId, project){
  const chain = {};
  const src = project.sources.find(s => s.id === itemId);
  if (src) {
    chain.source = src;
    const idea   = project.ideas.find(i => i.sourceId === itemId);
    if (idea) {
      chain.idea   = idea;
      const recipe = project.recipes.find(r => r.ideaId === idea.id || r.sourceId === itemId);
      if (recipe) chain.recipe = recipe;
    } else {
      chain.recipe = project.recipes.find(r => r.sourceId === itemId);
    }
  } else {
    const recipe = project.recipes.find(r => r.id === itemId);
    if (recipe) {
      chain.recipe = recipe;
      if (recipe.sourceId) chain.source = project.sources.find(s => s.id === recipe.sourceId);
    }
  }
  if (chain.recipe) {
    project.rotation.days.forEach((day, d) => {
      ['breakfast','lunch','dinner'].forEach(slot => {
        if (day[slot] === chain.recipe.id) chain.day = { day:d, slot };
      });
    });
  }
  return chain;
}

function composeExport(project){
  const handlers = {
    cover:     () => project.brief,
    overview:  () => ({ name:project.name, people:project.brief.people, days:project.brief.days }),
    calendar:  () => project.rotation,
    recipes:   () => project.recipes,
    prep:      () => project.prepMap,
    shopping:  () => buildShoppingList(project).categories,
    references:() => project.sources,
    citations: () => project.docs.citations,
    audit:     () => auditProject(project),
  };
  const out = {};
  (project.exportSectionOrder || []).forEach(sec => { if (handlers[sec]) out[sec] = handlers[sec](); });
  return out;
}

function runStabilizationPass(project){
  const log = [];
  const recipeIds = new Set(project.recipes.map(r => r.id));

  // Remove rotation refs to missing recipes
  project.rotation.days.forEach((day, i) => {
    ['breakfast','lunch','dinner'].forEach(slot => {
      if (day[slot] && !recipeIds.has(day[slot])) {
        log.push(`Removed orphaned rotation ref day ${i+1} ${slot}`);
        day[slot] = '';
      }
    });
  });

  // Normalize recipe ingredients
  project.recipes.forEach(r => {
    const before = r.ingredients.length;
    r.ingredients = r.ingredients.map(i => i.trim()).filter(Boolean);
    if (r.ingredients.length !== before) log.push(`Normalized ingredients for "${r.title}"`);
  });

  // Remove sources with neither url nor title
  const srcBefore = project.sources.length;
  project.sources = project.sources.filter(s => s.url || s.title);
  if (project.sources.length < srcBefore) log.push(`Removed ${srcBefore - project.sources.length} invalid source(s)`);

  // Deduplicate sources
  const deduped = dedupeSourceCards(project.sources);
  if (deduped.length < project.sources.length) {
    log.push(`Removed ${project.sources.length - deduped.length} duplicate source(s)`);
    project.sources = deduped;
  }

  if (log.length > 0) project.stabilizationLog.push({ ts:new Date().toISOString(), entries:log });
  return project;
}

/* =========================================================
   6) ACTIONS
========================================================= */
function createProject(name){
  const newName = name || `Meal Prep Plan ${state.projects.length + 1}`;
  const p = defaultProject(newName);
  state.projects.push(p);
  state.activeProjectId = p.id;
  saveState();
  render();
}

function duplicateActiveProject(){
  const src = activeProject();
  if (!src) return;
  const dup   = JSON.parse(JSON.stringify(src));
  dup.id      = genId();
  dup.name    = src.name + ' (copy)';
  state.projects.push(dup);
  state.activeProjectId = dup.id;
  saveState();
  render();
}

function deleteActiveProject(){
  if (state.projects.length <= 1) { setStatus('Cannot delete the last project'); return; }
  state.projects = state.projects.filter(p => p.id !== state.activeProjectId);
  state.activeProjectId = state.projects[0].id;
  saveState();
  render();
}

function runSearch(){
  const q = (state.ui.query || '').trim();
  if (!q) { setStatus('Enter a query first'); return; }
  providerSearch(state.ui.provider || 'mealdb', state.ui.mode || 'name', q);
}

function saveSource(id){
  const p    = activeProject();
  if (!p)    return;
  const card = p.searchResults.find(c => c.id === id);
  if (!card) return;
  if (p.sources.some(s => s.id === id)) { setStatus('Already saved'); return; }
  patchProject(proj => { proj.sources.push({ ...card }); });
  setStatus('Source saved');
}

function citeSource(id){
  const p    = activeProject();
  if (!p)    return;
  const card = p.searchResults.find(c => c.id === id) || p.sources.find(s => s.id === id);
  if (!card) return;
  patchProject(proj => {
    if (!proj.sources.some(s => s.id === id)) proj.sources.push({ ...card });
    if (!proj.docs.citations.some(c => c.id === id))
      proj.docs.citations.push({ id, title:card.title, url:card.url });
  });
  setStatus('Source cited');
}

function promoteSource(id){
  const p    = activeProject();
  if (!p)    return;
  const card = p.searchResults.find(c => c.id === id) || p.sources.find(s => s.id === id);
  if (!card) return;
  if (!p.sources.some(s => s.id === id))
    patchProject(proj => { proj.sources.push({ ...card }); }, { save:true, render:false });
  const recipeId = generateRecipeFromSource(card);
  setStatus(`Recipe "${card.title}" added`);
  state.ui.selectedNodeId = recipeId;
  render();
}

function addRecipe(data){
  const recipe = { id:genId(), title:'New Recipe', ingredients:[], steps:[], cookTime:30, thumb:null, cookAhead:false, sourceId:null, ideaId:null, ...data };
  patchProject(p => { p.recipes.push(recipe); });
}

function editRecipe(id){
  state.ui.recipeEditId   = id;
  state.ui.selectedNodeId = id;
  render();
}

function deleteRecipe(id){
  if (state.ui.selectedNodeId === id) state.ui.selectedNodeId = null;
  if (state.ui.recipeEditId   === id) state.ui.recipeEditId   = null;
  removeRecipe(id);
}

function updateShoppingItem(week, category, idx, value){
  patchProject(p => { if (p.shopping[week]?.[category]) p.shopping[week][category][idx] = value; });
}

function setPantryBaseline(items){
  patchProject(p => { p.pantryBaseline = items; });
}

function applyRecommendationMemory(type, id, delta){
  patchProject(p => {
    const key = `favorite${type.charAt(0).toUpperCase() + type.slice(1)}s`;
    const mem = p.recommendationMemory[key] || {};
    mem[id]   = { ...(mem[id]||{}), ...delta };
    if (typeof mem[id].boost === 'number') mem[id].boost = Math.min(1, Math.max(0, mem[id].boost));
    p.recommendationMemory[key] = mem;
  });
}

function runComparison(otherId){
  const p1 = activeProject();
  const p2 = state.projects.find(p => p.id === otherId);
  if (!p1 || !p2) return;
  const result = compareProjects(p1, p2);
  patchProject(p => { p.comparison = { lastComparedProjectId:otherId, lastComparison:result }; }, { save:true, render:false });
  state.ui.step = 'Docs';
  state.ui.selectedDocSection = 'outline';
  render();
}

function mergeProject(otherId){
  const p2 = state.projects.find(p => p.id === otherId);
  if (!p2) return;
  const delta = compareProjects(activeProject(), p2);
  patchProject(p => {
    delta.added.recipes.forEach(r => { if (!p.recipes.some(x => x.id === r.id)) p.recipes.push(r); });
    delta.added.sources.forEach(s => { if (!p.sources.some(x => x.id === s.id)) p.sources.push(s); });
    p.mergeLog.push({ ts:new Date().toISOString(), fromId:otherId, addedRecipes:delta.added.recipes.length, addedSources:delta.added.sources.length });
  });
  setStatus(`Merged ${delta.added.recipes.length} recipes, ${delta.added.sources.length} sources`);
}

function runExport(){
  const p = activeProject();
  if (!p) return;
  const data = composeExport(p);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${p.name.replace(/\s+/g,'-').toLowerCase()}-export.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  setStatus('Exported');
}

function setShareMode(mode){
  patchProject(p => { p.shareMode = mode; });
}

function triggerStabilization(){
  patchProject(p => { runStabilizationPass(p); }, { save:true, render:false });
  setStatus('Stabilization complete');
}

/* =========================================================
   7) RENDER HELPERS
========================================================= */
function renderAppShell(){
  const p = activeProject();
  return `
    <div class="topbar">
      <div class="brand">
        <div class="logo">🍱</div>
        <div>
          <div class="title">Culinary Planner</div>
          <div class="small">Meal prep system</div>
        </div>
      </div>
      <div class="actions">
        <span class="pill">${escHtml(state.ui.status || 'Ready')}</span>
        <button class="btn primary" data-act="new-project">New</button>
        <button class="btn" data-act="duplicate-project">Duplicate</button>
        <button class="btn warn" data-act="delete-project">Delete</button>
        <button class="btn" data-act="run-stabilization-pass">Stabilize</button>
      </div>
    </div>
    <div class="layout">
      <div class="panel">
        <div class="hd"><b>Projects</b></div>
        <div class="bd" id="sidebarPanel">${renderSidebar(p)}</div>
      </div>
      <div class="panel">
        <div class="hd"><b>Main</b></div>
        <div class="bd" id="mainPanel">${renderMain(p)}</div>
      </div>
      <div class="panel">
        <div class="hd"><b>Inspector</b></div>
        <div class="bd" id="inspectorPanel" style="overflow-y:auto;max-height:calc(100vh - 120px)">${renderInspector(p)}</div>
      </div>
    </div>
  `;
}

function renderSidebar(project){
  return `
    <div class="list">
      ${state.projects.map(p => `
        <button class="btn ${p.id === state.activeProjectId ? 'primary' : ''}" data-project-id="${p.id}">
          ${escHtml(p.name)}
        </button>
      `).join('')}
    </div>
    <div class="hr"></div>
    <div id="compareSelectWrap"></div>
    <div class="hr"></div>
    <div class="small"><b>Household</b></div>
    <div class="row" style="margin-top:8px">
      ${Object.keys(HOUSEHOLD_PRESETS).map(key => `
        <button class="btn ${project && project.householdProfile.preset === key ? 'good' : ''}" data-act="set-household" data-preset="${key}">${key}</button>
      `).join('')}
    </div>
    ${project ? `
      <div class="hr"></div>
      <div class="small"><b>Brief</b></div>
      <div class="card" style="margin-top:6px">
        <div class="small">${escHtml(project.brief.people)} people · ${escHtml(project.brief.days)} days</div>
        <div class="small">Cuisine: ${escHtml(project.brief.cuisine)}</div>
        <div class="small">Core: ${escHtml(project.brief.core)}</div>
        <div class="small">Protein target: ${escHtml(project.brief.targets.protein_g)}g</div>
      </div>
    ` : ''}
  `;
}

function renderMain(project){
  const steps = ['Discover','Map','Calendar','Docs'];
  return `
    <div class="stepper">
      ${steps.map(s => `<button class="step ${state.ui.step===s?'active':''}" data-step="${s}">${s}</button>`).join('')}
    </div>
    <div class="hr"></div>
    ${
      state.ui.step === 'Discover'  ? renderDiscoverView(project) :
      state.ui.step === 'Map'       ? renderMapView(project) :
      state.ui.step === 'Calendar'  ? renderCalendarView(project) :
      renderDocsView(project)
    }
  `;
}

function renderDiscoverView(project){
  const status  = state.ui.searchStatus || 'idle';
  const error   = state.ui.searchError  || '';
  const results = project ? project.searchResults : [];

  const resultsHtml =
    status === 'loading' ? `<div style="padding:32px;text-align:center"><span class="spinner"></span> <span class="small">Searching…</span></div>` :
    status === 'error'   ? `<div style="padding:12px;color:var(--bad)">⚠ ${escHtml(error)}</div>` :
    results.length === 0 ? `<div style="padding:16px;text-align:center;color:var(--muted)">No results yet — search or pick a starter collection.</div>` :
    results.map(card => `
      <div class="tile">
        <div class="thumb">
          ${card.thumb
            ? `<img src="${escHtml(card.thumb)}" alt="" loading="lazy">`
            : `<div style="font-size:28px">🍽️</div>`}
        </div>
        <div style="padding:10px">
          <div><b>${escHtml(card.title)}</b></div>
          <div class="small">${escHtml(card.source)}</div>
          <div class="small" style="margin-top:4px;line-height:1.3">${escHtml((card.snippet||'').slice(0,120))}${card.snippet && card.snippet.length > 120 ? '…' : ''}</div>
          <div class="row" style="margin-top:8px">
            <button class="btn" data-save-source="${card.id}">Save</button>
            <button class="btn" data-cite-source="${card.id}">Cite</button>
            <button class="btn good" data-promote-source="${card.id}">→ Recipe</button>
          </div>
        </div>
      </div>
    `).join('');

  return `
    <div class="small"><b>Starter collections</b></div>
    <div class="row" style="margin-top:8px">
      ${STARTER_COLLECTIONS.map(c => `<button class="btn" data-starter="${c.key}">${c.label}</button>`).join('')}
    </div>
    <div class="hr"></div>
    <div class="three">
      <div>
        <div class="small">Provider</div>
        <select class="input" id="providerInput">
          <option value="mealdb"      ${state.ui.provider==='mealdb'      ? 'selected' : ''}>TheMealDB</option>
          <option value="openlibrary" ${state.ui.provider==='openlibrary' ? 'selected' : ''}>Open Library</option>
          <option value="wikipedia"   ${state.ui.provider==='wikipedia'   ? 'selected' : ''}>Wikipedia</option>
        </select>
      </div>
      <div>
        <div class="small">Mode</div>
        <select class="input" id="modeInput">
          <option value="name"       ${state.ui.mode==='name'       ? 'selected' : ''}>Name</option>
          <option value="ingredient" ${state.ui.mode==='ingredient' ? 'selected' : ''}>Ingredient</option>
          <option value="area"       ${state.ui.mode==='area'       ? 'selected' : ''}>Area</option>
        </select>
      </div>
      <div>
        <div class="small">Query</div>
        <input class="input" id="queryInput" value="${escHtml(state.ui.query || '')}" placeholder="e.g. chicken">
      </div>
    </div>
    <div class="row" style="margin-top:8px">
      <button class="btn primary" data-act="search">Search</button>
      ${results.length > 0 && status === 'done' ? `<span class="pill">${results.length} result${results.length===1?'':'s'}</span>` : ''}
    </div>
    <div class="hr"></div>
    <div class="gridCards" id="resultsGrid">${resultsHtml}</div>
    ${project && project.sources.length > 0 ? `
      <div class="hr"></div>
      <div class="small"><b>Saved sources (${project.sources.length})</b></div>
      <div class="list" style="margin-top:8px">
        ${project.sources.slice(0,5).map(s => `
          <div class="card" style="cursor:pointer" data-act="select-node" data-node-id="${s.id}">
            <div style="font-weight:600">${escHtml(s.title)}</div>
            <div class="small">${escHtml(s.source)}</div>
          </div>
        `).join('')}
        ${project.sources.length > 5 ? `<div class="small">+${project.sources.length - 5} more in Inspector</div>` : ''}
      </div>
    ` : ''}
  `;
}

function renderMapView(project){
  if (!project) return '<div class="small">No project.</div>';

  const layers = project.map.layers;
  const pos    = project.map.pos || {};

  const nodes = [];
  if (layers.source) {
    project.sources.forEach((s, i) => {
      const p = pos[s.id] || { x: 60 + i * 140, y: 80 };
      nodes.push({ id:s.id, label:s.title.slice(0,22), type:'source', x:p.x, y:p.y });
    });
  }
  if (layers.idea) {
    project.ideas.forEach((idea, i) => {
      const p = pos[idea.id] || { x: 60 + i * 140, y: 220 };
      nodes.push({ id:idea.id, label:(idea.title||'Idea').slice(0,22), type:'idea', x:p.x, y:p.y });
    });
  }
  if (layers.bucket) {
    project.recipes.forEach((r, i) => {
      const p = pos[r.id] || { x: 60 + i * 140, y: 360 };
      nodes.push({ id:r.id, label:r.title.slice(0,22), type:'recipe', x:p.x, y:p.y });
    });
  }

  const edges = [];
  project.recipes.forEach(r => {
    if (r.sourceId && nodes.find(n => n.id === r.sourceId) && nodes.find(n => n.id === r.id))
      edges.push({ from:r.sourceId, to:r.id });
    if (r.ideaId && nodes.find(n => n.id === r.ideaId) && nodes.find(n => n.id === r.id))
      edges.push({ from:r.ideaId, to:r.id });
  });
  project.ideas.forEach(idea => {
    if (idea.sourceId && nodes.find(n => n.id === idea.sourceId) && nodes.find(n => n.id === idea.id))
      edges.push({ from:idea.sourceId, to:idea.id });
  });

  const colorMap = { source:'var(--accent)', idea:'var(--warn)', recipe:'var(--good)' };
  const svgNodes = nodes.map(n => {
    const selected = state.ui.selectedNodeId === n.id;
    const stroke   = selected ? '#fff' : colorMap[n.type];
    const sw       = selected ? 3 : 1.5;
    const labelY   = n.y + 4;
    if (n.type === 'source') {
      return `<g data-act="select-node" data-node-id="${n.id}" style="cursor:pointer">
        <circle cx="${n.x}" cy="${n.y}" r="30" fill="rgba(122,162,255,.12)" stroke="${stroke}" stroke-width="${sw}"/>
        <text x="${n.x}" y="${labelY}" text-anchor="middle" fill="var(--text)" font-size="9" pointer-events="none">${escHtml(n.label)}</text>
      </g>`;
    }
    if (n.type === 'idea') {
      const pts = `${n.x},${n.y-28} ${n.x+28},${n.y} ${n.x},${n.y+28} ${n.x-28},${n.y}`;
      return `<g data-act="select-node" data-node-id="${n.id}" style="cursor:pointer">
        <polygon points="${pts}" fill="rgba(255,210,122,.12)" stroke="${stroke}" stroke-width="${sw}"/>
        <text x="${n.x}" y="${labelY}" text-anchor="middle" fill="var(--text)" font-size="9" pointer-events="none">${escHtml(n.label)}</text>
      </g>`;
    }
    return `<g data-act="select-node" data-node-id="${n.id}" style="cursor:pointer">
      <rect x="${n.x-42}" y="${n.y-20}" width="84" height="40" rx="10" fill="rgba(126,240,196,.10)" stroke="${stroke}" stroke-width="${sw}"/>
      <text x="${n.x}" y="${labelY}" text-anchor="middle" fill="var(--text)" font-size="9" pointer-events="none">${escHtml(n.label)}</text>
    </g>`;
  }).join('');

  const svgEdges = edges.map(e => {
    const from = nodes.find(n => n.id === e.from);
    const to   = nodes.find(n => n.id === e.to);
    if (!from || !to) return '';
    return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="var(--line)" stroke-width="1.5" marker-end="url(#map-arrow)"/>`;
  }).join('');

  const svgW = Math.max(800, nodes.length * 140 + 120);

  return `
    <div class="mapWrap" style="height:500px">
      <div class="row" style="padding:10px 12px 0;gap:6px">
        <span class="small">Layers:</span>
        ${Object.entries(layers).map(([layer, on]) => `
          <button class="btn ${on ? 'primary' : ''}" style="padding:3px 8px;font-size:11px" data-act="toggle-layer" data-layer="${layer}">${layer}</button>
        `).join('')}
      </div>
      ${nodes.length === 0
        ? `<div style="padding:40px;text-align:center;color:var(--muted)">
             No nodes yet.<br>Save sources and promote to recipes to build the map.
           </div>`
        : ''
      }
      <svg width="${svgW}" height="460" style="display:block;overflow:visible">
        <defs>
          <marker id="map-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="var(--muted)"/>
          </marker>
        </defs>
        <g class="edges">${svgEdges}</g>
        <g class="nodes">${svgNodes}</g>
      </svg>
    </div>
    <div class="small" style="margin-top:6px">
      Sources: ${project.sources.length} · Ideas: ${project.ideas.length} · Recipes: ${project.recipes.length}
      ${nodes.length > 0 ? ' · Click a node to inspect' : ''}
    </div>
  `;
}

function renderCalendarView(project){
  if (!project) return '<div class="small">No project.</div>';

  const days     = project.rotation.days;
  const prepMap  = buildPrepMap(project);
  const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const slots    = ['breakfast','lunch','dinner'];

  const gridStyle = `display:grid;grid-template-columns:70px repeat(7,1fr);gap:4px;font-size:12px;min-width:620px`;
  const cellBase  = `border:1px solid var(--line);border-radius:10px;padding:6px;background:rgba(255,255,255,.02);min-height:60px`;

  // Header row
  const headerRow = `
    <div></div>
    ${days.map((day, i) => `
      <div style="${cellBase};text-align:center;min-height:0;padding:8px 4px">
        <div style="font-weight:700">${dayNames[i] || 'Day '+(i+1)}</div>
        <div class="small" style="color:${day.storage==='freezer'?'var(--accent)':'var(--good)'}">${day.storage}</div>
        ${prepMap[i]?.isCookDay ? `<div style="margin-top:2px"><span class="pill" style="font-size:9px;padding:2px 6px">Cook</span></div>` : ''}
      </div>
    `).join('')}
  `;

  // Meal slot rows
  const slotRows = slots.map(slot => `
    <div class="cal-slot-label">${slot}</div>
    ${days.map((day, i) => {
      const recipeId = day[slot];
      const recipe   = recipeId ? project.recipes.find(r => r.id === recipeId) : null;
      if (recipe) {
        return `<div style="${cellBase}">
          <div style="font-weight:600;font-size:11px;line-height:1.3">${escHtml(recipe.title)}</div>
          ${recipe.cookTime ? `<div class="small">${recipe.cookTime}min</div>` : ''}
          <div class="row" style="margin-top:4px;gap:3px">
            <button class="btn" style="padding:2px 5px;font-size:10px" data-act="select-node" data-node-id="${recipe.id}" title="View recipe">ℹ</button>
            <button class="btn warn" style="padding:2px 5px;font-size:10px" data-act="remove-meal" data-day="${i}" data-slot="${slot}" title="Remove">✕</button>
          </div>
        </div>`;
      }
      return `<div style="${cellBase};cursor:pointer;display:flex;align-items:center;justify-content:center" class="cal-cell cal-cell-add" data-act="open-assign" data-day="${i}" data-slot="${slot}">
        <span style="color:var(--muted);font-size:22px;line-height:1">+</span>
      </div>`;
    }).join('')}
  `).join('');

  return `
    <div style="overflow-x:auto;padding-bottom:8px">
      <div style="${gridStyle}">
        ${headerRow}
        ${slotRows}
      </div>
    </div>
    ${project.recipes.length === 0 ? `
      <div style="margin-top:12px;padding:14px;border:1px dashed var(--line);border-radius:12px;text-align:center;color:var(--muted)">
        No recipes yet. Go to <b>Discover</b>, search, and click <b>→ Recipe</b> on any result.
      </div>
    ` : ''}
  `;
}

function renderDocsView(project){
  if (!project) return '<div class="small">No project.</div>';
  const section = state.ui.selectedDocSection || 'cover';
  const tabs    = ['cover','outline','citations','notes','export'];

  return `
    <div class="stepper">
      ${tabs.map(t => `<button class="step ${section===t?'active':''}" data-act="doc-section" data-section="${t}">${t}</button>`).join('')}
    </div>
    <div class="hr"></div>
    ${
      section === 'cover'     ? renderDocCover(project)     :
      section === 'outline'   ? renderDocOutline(project)   :
      section === 'citations' ? renderDocCitations(project) :
      section === 'notes'     ? renderDocNotes(project)     :
      renderDocExport(project)
    }
  `;
}

function renderDocCover(project){
  const b = project.brief;
  return `
    <div class="card" style="margin-bottom:12px">
      <div style="font-size:18px;font-weight:900;margin-bottom:8px">${escHtml(b.title || project.name)}</div>
      <div class="small">${b.people} ${b.people===1?'person':'people'} · ${b.days} days · ${escHtml(b.cuisine)} cuisine</div>
      <div class="hr"></div>
      <div class="small"><b>Core:</b> ${escHtml(b.core)}</div>
      <div class="small"><b>Likes:</b> ${escHtml(b.likes)}</div>
      <div class="small"><b>Avoid:</b> ${escHtml(b.avoid)}</div>
      <div class="small" style="margin-top:6px"><b>Targets:</b> ${b.targets.protein_g}g protein · ${b.targets.fiber_g}g fiber · carbs: ${b.targets.carbs}</div>
    </div>
    <div class="small"><b>Edit</b></div>
    <div class="list" style="margin-top:8px;gap:6px">
      <input class="input" placeholder="Project name" id="editBriefName" value="${escHtml(project.name)}">
      <div class="two">
        <input class="input" type="number" placeholder="People" id="editBriefPeople" value="${b.people}">
        <input class="input" type="number" placeholder="Days"   id="editBriefDays"   value="${b.days}">
      </div>
      <input class="input" placeholder="Core ingredients" id="editBriefCore" value="${escHtml(b.core)}">
      <input class="input" placeholder="Cuisine"          id="editBriefCuisine" value="${escHtml(b.cuisine)}">
      <button class="btn primary" data-act="save-brief">Save Brief</button>
    </div>
  `;
}

function renderDocOutline(project){
  const audit   = auditProject(project);
  const compare = project.comparison.lastComparison;
  return `
    <div class="small"><b>Audit</b></div>
    <div class="list" style="margin-top:8px">
      ${Object.entries(audit).map(([rule, result]) => `
        <div class="audit-card">
          <span class="${result.pass ? 'audit-good' : 'audit-warn'}">${result.pass ? '✓' : '✗'} ${rule}</span>
          <div class="small">${escHtml(result.detail)}</div>
        </div>
      `).join('')}
    </div>
    ${compare ? `
      <div class="hr"></div>
      <div class="small"><b>Last Comparison</b></div>
      <div class="card" style="margin-top:8px">
        <div class="small">Added: ${compare.added.recipes.length} recipes, ${compare.added.sources.length} sources</div>
        <div class="small">Removed: ${compare.removed.recipes.length} recipes, ${compare.removed.sources.length} sources</div>
        <button class="btn" style="margin-top:8px" data-act="run-merge-last">Merge in added items</button>
      </div>
    ` : ''}
  `;
}

function renderDocCitations(project){
  const cits = project.docs.citations || [];
  return `
    <div class="list">
      ${cits.length === 0
        ? `<div class="small">No citations yet. Use <b>Cite</b> on search results.</div>`
        : cits.map((c, i) => `
          <div class="card">
            <div style="font-weight:600">${escHtml(c.title)}</div>
            <div class="small"><a href="${escHtml(c.url)}" target="_blank" rel="noreferrer" style="color:var(--accent)">${escHtml(c.url)}</a></div>
            <button class="btn warn" style="margin-top:6px;padding:4px 8px;font-size:11px" data-act="remove-citation" data-idx="${i}">Remove</button>
          </div>
        `).join('')
      }
    </div>
  `;
}

function renderDocNotes(project){
  return `
    <div class="small">Project notes</div>
    <textarea class="input" style="margin-top:8px;min-height:200px" id="projectNotesArea">${escHtml(project.docs.notes||'')}</textarea>
    <button class="btn primary" style="margin-top:8px" data-act="save-notes">Save Notes</button>
  `;
}

function renderDocExport(project){
  return `
    <div class="card">
      <div class="small"><b>Export sections</b></div>
      <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px">
        ${project.exportSectionOrder.map(sec => `<span class="pill">${sec}</span>`).join('')}
      </div>
    </div>
    <div class="card" style="margin-top:10px">
      <div class="small"><b>Share mode</b></div>
      <div class="row" style="margin-top:8px">
        ${['planner-pdf','recipe-cards','shopping-only'].map(m => `
          <button class="btn ${project.shareMode===m?'primary':''}" data-act="set-share-mode" data-mode="${m}">${m}</button>
        `).join('')}
      </div>
    </div>
    <div class="row" style="margin-top:12px">
      <button class="btn primary" data-act="run-export">Export JSON</button>
    </div>
    ${project.stabilizationLog.length > 0 ? `
      <div class="hr"></div>
      <div class="small"><b>Stabilization log</b></div>
      <div class="list" style="margin-top:8px">
        ${project.stabilizationLog.slice(-3).reverse().map(entry => `
          <div class="card stabilize-log">
            <div class="small">${escHtml(entry.ts)}</div>
            ${entry.entries.map(e => `<div class="small stabilize-warn">${escHtml(e)}</div>`).join('')}
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}

function renderInspector(project){
  if (!project) return '<div class="small">No active project.</div>';

  // ── Calendar assign mode ──────────────────────────────
  if (state.ui.calAssign) {
    const { day, slot } = state.ui.calAssign;
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <b>Assign to Day ${day+1} ${slot}</b>
        <button class="btn" style="padding:4px 8px" data-act="close-assign">✕</button>
      </div>
      <div class="hr"></div>
      ${project.recipes.length === 0
        ? `<div class="small">No recipes yet. Discover → search → promote a source.</div>`
        : `<div class="list">
            ${project.recipes.map(r => `
              <div class="card" style="cursor:pointer" data-act="assign-meal-confirm" data-recipe-id="${r.id}" data-day="${day}" data-slot="${slot}">
                <div style="font-weight:600">${escHtml(r.title)}</div>
                <div class="small">${r.cookTime||0} min · ${r.ingredients.length} ingredients</div>
              </div>
            `).join('')}
          </div>`
      }
      <div class="hr"></div>
      <button class="btn primary" style="width:100%" data-act="add-blank-recipe">+ New blank recipe</button>
    `;
  }

  // ── Recipe edit mode ──────────────────────────────────
  if (state.ui.recipeEditId) {
    const recipe = project.recipes.find(r => r.id === state.ui.recipeEditId);
    if (!recipe) { state.ui.recipeEditId = null; return renderInspector(project); }
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <b>Edit Recipe</b>
        <button class="btn" style="padding:4px 8px" data-act="close-recipe-edit">✕</button>
      </div>
      <div class="hr"></div>
      <div class="list" style="gap:8px">
        <div>
          <div class="small">Title</div>
          <input class="input" id="recipeEditTitle" value="${escHtml(recipe.title)}">
        </div>
        <div>
          <div class="small">Cook time (min)</div>
          <input class="input" id="recipeEditTime" type="number" value="${recipe.cookTime||30}">
        </div>
        <div>
          <div class="small">Ingredients (one per line)</div>
          <textarea class="input" id="recipeEditIngredients" style="min-height:100px">${escHtml((recipe.ingredients||[]).join('\n'))}</textarea>
        </div>
        <div>
          <div class="small">Steps (one per line)</div>
          <textarea class="input" id="recipeEditSteps" style="min-height:80px">${escHtml((recipe.steps||[]).join('\n'))}</textarea>
        </div>
        <label style="display:flex;gap:8px;align-items:center;cursor:pointer">
          <input type="checkbox" id="recipeEditCookAhead" ${recipe.cookAhead?'checked':''}>
          <span>Batch / cook ahead</span>
        </label>
        <button class="btn primary" data-act="save-recipe-edit" data-recipe-id="${recipe.id}">Save Recipe</button>
        <button class="btn warn" data-act="delete-recipe" data-recipe-id="${recipe.id}">Delete Recipe</button>
      </div>
    `;
  }

  // ── Node selected ─────────────────────────────────────
  if (state.ui.selectedNodeId) {
    const nodeId  = state.ui.selectedNodeId;
    const source  = project.sources.find(s => s.id === nodeId) || project.searchResults.find(s => s.id === nodeId);
    const recipe  = !source && project.recipes.find(r => r.id === nodeId);

    if (source) {
      const chain   = buildLineageChain(nodeId, project);
      const isSaved = project.sources.some(s => s.id === nodeId);
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <b>Source</b>
          <button class="btn" style="padding:4px 8px" data-act="clear-selection">✕</button>
        </div>
        ${source.thumb ? `<img src="${escHtml(source.thumb)}" style="width:100%;max-height:160px;object-fit:cover;border-radius:12px;margin-bottom:10px" loading="lazy">` : ''}
        <div style="font-weight:700;font-size:14px">${escHtml(source.title)}</div>
        <div class="small" style="margin-top:2px">${escHtml(source.source)}</div>
        <div class="small" style="margin-top:6px;line-height:1.4">${escHtml(source.snippet||'')}</div>
        <div class="row" style="margin-top:12px">
          ${!isSaved ? `<button class="btn primary" data-save-source="${nodeId}">Save</button>` : `<span class="pill" style="color:var(--good)">✓ Saved</span>`}
          <button class="btn" data-cite-source="${nodeId}">Cite</button>
          <button class="btn good" data-promote-source="${nodeId}">→ Recipe</button>
          ${source.url ? `<a href="${escHtml(source.url)}" target="_blank" rel="noreferrer" class="btn">↗ Open</a>` : ''}
        </div>
        ${chain.recipe ? `
          <div class="hr"></div>
          <div class="small"><b>Lineage</b></div>
          <div class="small" style="margin-top:4px">→ Recipe: <b>${escHtml(chain.recipe.title)}</b>${chain.day ? ` → Day ${chain.day.day+1} ${chain.day.slot}` : ''}</div>
        ` : ''}
      `;
    }

    if (recipe) {
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <b>Recipe</b>
          <button class="btn" style="padding:4px 8px" data-act="clear-selection">✕</button>
        </div>
        ${recipe.thumb ? `<img src="${escHtml(recipe.thumb)}" style="width:100%;max-height:140px;object-fit:cover;border-radius:12px;margin-bottom:10px" loading="lazy">` : ''}
        <div style="font-weight:700;font-size:14px">${escHtml(recipe.title)}</div>
        <div class="small">${recipe.cookTime||0} min · ${recipe.ingredients.length} ingredients</div>
        ${recipe.ingredients.length > 0 ? `
          <div class="small" style="margin-top:10px"><b>Ingredients</b></div>
          <ul style="margin:6px 0 0 16px;padding:0;font-size:12px;color:var(--muted);line-height:1.6">
            ${recipe.ingredients.slice(0,8).map(i => `<li>${escHtml(i)}</li>`).join('')}
            ${recipe.ingredients.length > 8 ? `<li>+${recipe.ingredients.length-8} more…</li>` : ''}
          </ul>
        ` : ''}
        <div class="row" style="margin-top:12px">
          <button class="btn primary" data-act="edit-recipe" data-recipe-id="${recipe.id}">Edit</button>
          <button class="btn warn"    data-act="delete-recipe" data-recipe-id="${recipe.id}">Delete</button>
        </div>
      `;
    }

    return `<div class="small">Node not found. <button class="btn" data-act="clear-selection">Clear</button></div>`;
  }

  // ── Calendar step → Shopping list ────────────────────
  if (state.ui.step === 'Calendar') {
    const sl = buildShoppingList(project);
    const catLabels = {
      produce:'🥦 Produce', protein:'🥩 Protein', dairyEggs:'🥛 Dairy & Eggs',
      frozen:'❄️ Frozen',   pantry:'🫙 Pantry',   condiments:'🍶 Condiments',
      spices:'🌶️ Spices',   specialty:'⭐ Specialty'
    };
    const nonEmpty = Object.entries(sl.categories).filter(([, items]) => items.length > 0);
    return `
      <div style="margin-bottom:10px"><b>Shopping List</b></div>
      ${sl.warnings.length > 0 ? `
        <div class="list" style="margin-bottom:10px">
          ${sl.warnings.map(w => `<div class="card" style="color:var(--warn);font-size:12px">${escHtml(w)}</div>`).join('')}
        </div>
      ` : ''}
      ${nonEmpty.length === 0
        ? `<div class="small">Assign meals to days to generate the shopping list.</div>`
        : nonEmpty.map(([cat, items]) => `
          <div class="card" style="margin-bottom:6px">
            <div style="font-weight:700;margin-bottom:6px">${catLabels[cat]||cat}</div>
            ${items.map(item => `
              <div style="display:flex;justify-content:space-between;padding:3px 0;border-top:1px solid rgba(255,255,255,.05)">
                <span style="font-size:12px">${escHtml(item.name)}</span>
                <span style="font-size:11px;color:var(--muted)">${escHtml(item.qty)}</span>
              </div>
            `).join('')}
          </div>
        `).join('')
      }
    `;
  }

  // ── Default: stats + recommendations ─────────────────
  const ranked = scoreAndRankSources(project);
  const snap   = getDebugSnapshot(project);
  return `
    <div style="margin-bottom:10px"><b>Project Stats</b></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      <div class="metric"><div class="value">${snap.recipeCount}</div><div class="label">recipes</div></div>
      <div class="metric"><div class="value">${snap.sourceCount}</div><div class="label">sources</div></div>
      <div class="metric"><div class="value">${snap.daysCovered}</div><div class="label">days set</div></div>
      <div class="metric"><div class="value">${snap.ideaCount}</div><div class="label">ideas</div></div>
    </div>
    ${ranked.length > 0 ? `
      <div style="margin-bottom:8px"><b>Top Sources</b></div>
      <div class="list">
        ${ranked.slice(0,3).map(src => `
          <div class="card" style="cursor:pointer" data-act="select-node" data-node-id="${src.id}">
            <div style="font-weight:600;font-size:12px">${escHtml(src.title)}</div>
            <div class="small">${escHtml(explainRecommendation(src))}</div>
          </div>
        `).join('')}
      </div>
    ` : `<div class="small">Save sources to get recommendations.</div>`}
    <div class="hr"></div>
    <div style="margin-bottom:8px"><b>Audit</b></div>
    <div class="list" style="gap:4px">
      ${Object.entries(auditProject(project)).map(([rule, r]) => `
        <div style="display:flex;justify-content:space-between;padding:4px 0;border-top:1px solid rgba(255,255,255,.05)">
          <span class="small">${rule}</span>
          <span class="small ${r.pass?'audit-good':'audit-warn'}">${escHtml(r.detail)}</span>
        </div>
      `).join('')}
    </div>
    <div class="hr"></div>
    <button class="btn" style="width:100%" data-act="show-debug">Debug snapshot</button>
  `;
}

/* =========================================================
   8) HYDRATION / BINDING
========================================================= */
function hydrateUI(){
  const prov = document.getElementById('providerInput');
  const mode = document.getElementById('modeInput');
  const qry  = document.getElementById('queryInput');
  if (prov) prov.value = state.ui.provider || 'mealdb';
  if (mode) mode.value = state.ui.mode     || 'name';
  if (qry)  qry.value  = state.ui.query    || '';
}

// Event delegation is set up once at boot — no-op here
function bindDelegatedActions(){}

function bindSecondaryControls(){
  const prov = document.getElementById('providerInput');
  const mode = document.getElementById('modeInput');
  const qry  = document.getElementById('queryInput');
  if (prov) prov.onchange = () => { state.ui.provider = prov.value; saveStateThrottled(); };
  if (mode) mode.onchange = () => { state.ui.mode = mode.value; saveStateThrottled(); };
  if (qry) {
    qry.oninput   = () => { state.ui.query = qry.value; };
    qry.onkeydown = e  => { if (e.key === 'Enter') { state.ui.query = qry.value; runSearch(); } };
  }
  const notes = document.getElementById('projectNotesArea');
  if (notes) {
    notes.oninput = () => { patchProject(p => { p.docs.notes = notes.value; }, { save:true, render:false, throttled:true }); };
  }
}

function hydrateCompareSelect(){
  const wrap = document.getElementById('compareSelectWrap');
  if (!wrap) return;
  const active = activeProject();
  const others = state.projects.filter(p => p.id !== (active && active.id));
  if (others.length === 0) {
    wrap.innerHTML = '<div class="small" style="color:var(--muted)">Add another project to compare.</div>';
    return;
  }
  wrap.innerHTML = `
    <div class="small"><b>Compare with</b></div>
    <select class="input" id="compareProjectSelect" style="margin-top:6px">
      ${others.map(p => `<option value="${p.id}">${escHtml(p.name)}</option>`).join('')}
    </select>
    <button class="btn" style="margin-top:6px;width:100%" data-act="run-compare-select">Compare</button>
  `;
}

function handleAction(act, data){
  switch (act) {
    case 'new-project':            createProject(); break;
    case 'duplicate-project':      duplicateActiveProject(); break;
    case 'delete-project':         deleteActiveProject(); break;
    case 'run-stabilization-pass': triggerStabilization(); break;

    case 'search': {
      const q = document.getElementById('queryInput');
      const p = document.getElementById('providerInput');
      const m = document.getElementById('modeInput');
      if (q) state.ui.query    = q.value;
      if (p) state.ui.provider = p.value;
      if (m) state.ui.mode     = m.value;
      saveStateThrottled();
      runSearch();
      break;
    }

    case 'select-node':
      state.ui.selectedNodeId = state.ui.selectedNodeId === data.nodeId ? null : data.nodeId;
      state.ui.recipeEditId   = null;
      state.ui.calAssign      = null;
      render();
      break;

    case 'clear-selection':
      state.ui.selectedNodeId = null;
      state.ui.recipeEditId   = null;
      render();
      break;

    case 'toggle-layer':
      patchProject(p => { p.map.layers[data.layer] = !p.map.layers[data.layer]; });
      break;

    case 'set-household':
      patchProject(p => { p.householdProfile = { ...HOUSEHOLD_PRESETS[data.preset] }; });
      break;

    case 'open-assign':
      state.ui.calAssign = { day:Number(data.day), slot:data.slot };
      render();
      break;

    case 'close-assign':
      state.ui.calAssign = null;
      render();
      break;

    case 'assign-meal-confirm':
      assignMealToDay(Number(data.day), data.slot, data.recipeId);
      state.ui.calAssign = null;
      render();
      break;

    case 'remove-meal':
      assignMealToDay(Number(data.day), data.slot, '');
      break;

    case 'edit-recipe':
      state.ui.recipeEditId   = data.recipeId;
      state.ui.selectedNodeId = data.recipeId;
      state.ui.calAssign      = null;
      render();
      break;

    case 'delete-recipe':
      deleteRecipe(data.recipeId);
      render();
      break;

    case 'save-recipe-edit': {
      const title     = document.getElementById('recipeEditTitle');
      const time      = document.getElementById('recipeEditTime');
      const ings      = document.getElementById('recipeEditIngredients');
      const steps     = document.getElementById('recipeEditSteps');
      const cookAhead = document.getElementById('recipeEditCookAhead');
      updateRecipe(data.recipeId, {
        title:       title     ? title.value : undefined,
        cookTime:    time      ? Number(time.value) : undefined,
        ingredients: ings      ? ings.value.split('\n').map(s => s.trim()).filter(Boolean) : undefined,
        steps:       steps     ? steps.value.split('\n').map(s => s.trim()).filter(Boolean) : undefined,
        cookAhead:   cookAhead ? cookAhead.checked : undefined
      });
      state.ui.recipeEditId = null;
      render();
      break;
    }

    case 'add-blank-recipe': {
      const id = genId();
      addRecipe({ id, title:'New Recipe' });
      state.ui.recipeEditId   = id;
      state.ui.selectedNodeId = id;
      state.ui.calAssign      = null;
      render();
      break;
    }

    case 'close-recipe-edit':
      state.ui.recipeEditId = null;
      render();
      break;

    case 'doc-section':
      state.ui.selectedDocSection = data.section;
      render();
      break;

    case 'save-notes': {
      const area = document.getElementById('projectNotesArea');
      if (area) patchProject(p => { p.docs.notes = area.value; });
      setStatus('Notes saved');
      break;
    }

    case 'save-brief': {
      const nameEl    = document.getElementById('editBriefName');
      const peopleEl  = document.getElementById('editBriefPeople');
      const daysEl    = document.getElementById('editBriefDays');
      const coreEl    = document.getElementById('editBriefCore');
      const cuisineEl = document.getElementById('editBriefCuisine');
      patchProject(p => {
        if (nameEl)    p.name = nameEl.value || p.name;
        if (peopleEl)  p.brief.people  = Number(peopleEl.value) || 1;
        if (daysEl)    p.brief.days    = Number(daysEl.value)   || 7;
        if (coreEl)    p.brief.core    = coreEl.value;
        if (cuisineEl) p.brief.cuisine = cuisineEl.value;
        p.brief.title = p.name;
      });
      setStatus('Brief saved');
      break;
    }

    case 'remove-citation':
      patchProject(p => { p.docs.citations.splice(Number(data.idx), 1); });
      break;

    case 'run-export': runExport(); break;

    case 'run-compare-select':
    case 'run-comparison': {
      const sel = document.getElementById('compareProjectSelect');
      if (sel && sel.value) runComparison(sel.value);
      break;
    }

    case 'run-merge-last': {
      const p = activeProject();
      if (p && p.comparison.lastComparedProjectId) mergeProject(p.comparison.lastComparedProjectId);
      break;
    }

    case 'set-share-mode': setShareMode(data.mode); break;

    case 'show-debug': {
      const p = activeProject();
      if (p) alert(JSON.stringify(getDebugSnapshot(p), null, 2));
      break;
    }
  }
}

function setupEventDelegation(){
  document.body.addEventListener('click', function(e){
    let el = e.target;
    while (el && el !== document.body) {
      if (el.dataset) {
        if (el.dataset.step) {
          state.ui.step           = el.dataset.step;
          state.ui.selectedNodeId = null;
          state.ui.calAssign      = null;
          saveStateThrottled();
          render();
          return;
        }
        if (el.dataset.projectId) {
          state.activeProjectId = el.dataset.projectId;
          saveStateThrottled();
          render();
          return;
        }
        if (el.dataset.starter)       { useStarterCollection(el.dataset.starter); return; }
        if (el.dataset.saveSource)    { saveSource(el.dataset.saveSource);         return; }
        if (el.dataset.citeSource)    { citeSource(el.dataset.citeSource);         return; }
        if (el.dataset.promoteSource) { promoteSource(el.dataset.promoteSource);   return; }
        if (el.dataset.act)           { handleAction(el.dataset.act, el.dataset);  return; }
      }
      el = el.parentElement;
    }
  }, true);
}

/* =========================================================
   9) MAIN RENDER
========================================================= */
function render(){
  document.getElementById('app').innerHTML = renderAppShell();
  hydrateUI();
  hydrateCompareSelect();
  bindDelegatedActions();
  bindSecondaryControls();
}

/* =========================================================
   10) BOOT
========================================================= */
let state = loadState();
if (!state.projects.length) {
  const p = defaultProject();
  state.projects.push(p);
  state.activeProjectId = p.id;
  saveState();
}

// Ensure transient UI fields exist (not persisted across sessions)
state.ui.searchStatus = 'idle';
state.ui.searchError  = null;
state.ui.calAssign    = null;

setupEventDelegation();
render();
