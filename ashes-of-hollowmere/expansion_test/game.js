/* Ashes of Hollowmere — engine, parser and UI.
   Security note: all game text is written with textContent, never innerHTML,
   so nothing a player types (or puts in a save file) can become page code. */
// ============================================================================
// WHAT THIS FILE IS (a beginner's guide)
// ============================================================================
// game.js is the game's ENGINE: the code that makes everything happen.
// data.js and rooms.js describe WHAT is in the game (items, monsters, places).
// This file decides HOW the game runs:
//   - reading what the player types and working out what they mean (the "parser")
//   - moving between rooms, picking things up, buying and selling
//   - turn-based combat and spells
//   - saving and loading progress with localStorage
//   - drawing everything on screen: text, health bars, the map, buttons
//
// Comments (after //, or between /* and */) are notes for humans; the browser
// skips them.
//
// Terms you'll meet in this file:
//   - VARIABLE: a named box holding a value. "const" = its contents are never
//     swapped for a different value; "let" = it can be changed later.
//   - FUNCTION: a named, reusable set of instructions. "function name(x) { }"
//     and the shorter "(x) => ..." ("arrow function") are two ways to write one.
//   - OBJECT: named values in curly braces { }. ARRAY: a list in square brackets [ ].
//   - The DOM ("Document Object Model"): the browser's live version of the
//     HTML page, which JavaScript can read and change.
//   - EVENT: something that happens on the page (a click, a key press). An
//     "event listener" is code that waits for an event and then runs.
//   - localStorage: a small storage area in the visitor's browser that keeps
//     data even after the page is closed.
//   - JSON ("JavaScript Object Notation"): a way to turn an object into plain
//     text (so it can be stored) and back again.
// ============================================================================

// The whole engine is wrapped in a function that runs immediately. Everything
// inside is private, so other scripts (or curious visitors typing in the
// browser's developer console) can't easily tamper with the game's variables.
(function () {
  // Strict mode: makes JavaScript report common mistakes as errors.
  'use strict';

  // ---- SETTINGS AND CONSTANTS: fixed values used throughout the file ----
  // D is a short nickname for the content catalogue built by data.js and rooms.js.
  const D = window.GameData;
  // localStorage stores data under a name called a "key". These are our two keys:
  // one for the saved game, one for the Hall of Records (lifetime stats).
  // "v1" is a version number, in case the save format ever changes.
  // EXPANSION TEST COPY: these keys differ from the original game's so the two never share saves.
  const SAVE_KEY = 'ashesOfHollowmere.expansionTest.save.v1';
  const RECORDS_KEY = 'ashesOfHollowmere.expansionTest.records.v1';
  const SAVE_VERSION = 1;
  // Keep at most 400 lines of story on screen, so a long game doesn't slow the page down.
  const MAX_LINES = 400;
  // Commands are cut off at 120 characters (a safety limit).
  const MAX_INPUT = 120;
  // Experience points needed to reach the next level. The number at position 1
  // is what level 1 needs (30), position 2 is what level 2 needs (80), and so on.
  const XP_TABLE = [0, 30, 80, 150, 250, 370, 520, 700, 920, 1200, 1500];
  // All the ways a player can type a direction, mapped to one short code.
  // For example "north" and "n" both mean 'n'.
  const DIR_ALIASES = { n: 'n', north: 'n', s: 's', south: 's', e: 'e', east: 'e', w: 'w', west: 'w',
    u: 'u', up: 'u', upstairs: 'u', upward: 'u', d: 'd', down: 'd', downstairs: 'd', downward: 'd' };
  // The reverse: turns a short code back into a full word to show the player.
  const DIR_NAMES = { n: 'north', s: 'south', e: 'east', w: 'west', u: 'up', d: 'down' };
  // Labels shown above the map for each height level (the z number in rooms.js).
  const LEVEL_NAMES = { 2: 'Tower Roof', 1: 'Tower Study', 0: 'Hollowmere & Duskholm', '-1': 'The Dungeons', '-2': 'Beneath the Mere' };
  // "Filler" words the parser ignores, so "take the sword" means the same as
  // "take sword". A Set is a list where each word appears only once and can
  // be checked very quickly.
  const FILLER = new Set(['the', 'a', 'an', 'to', 'at', 'with', 'on', 'in', 'into', 'from', 'of', 'my', 'some',
    'that', 'this', 'about', 'for', 'using', 'upon', 'around', 'inside', 'under', 'please', 'it']);

  // VERB_MAP translates many words into one "canonical" (official) command.
  // For example "get", "grab" and "take" all become 'take'. addVerbs is a
  // little function that fills in the map: for each word in the list, it
  // records which command that word means. "forEach" runs the code once per
  // item in a list.
  const VERB_MAP = {};
  const addVerbs = (canon, words) => words.forEach((w) => { VERB_MAP[w] = canon; });
  addVerbs('look', ['look', 'l']);
  addVerbs('examine', ['examine', 'x', 'inspect', 'check', 'search', 'study', 'describe', 'observe']);
  addVerbs('take', ['take', 'get', 'grab', 'pickup', 'collect', 'loot', 'steal']);
  addVerbs('drop', ['drop', 'discard']);
  addVerbs('inventory', ['inventory', 'i', 'inv', 'items', 'bag', 'pack']);
  addVerbs('equip', ['equip', 'wield', 'wear', 'don']);
  addVerbs('drink', ['drink', 'quaff', 'sip']);
  addVerbs('eat', ['eat', 'consume', 'munch']);
  addVerbs('use', ['use', 'apply']);
  addVerbs('read', ['read']);
  addVerbs('cast', ['cast', 'c', 'invoke']);
  addVerbs('spells', ['spells', 'magic', 'spellbook']);
  addVerbs('attack', ['attack', 'kill', 'hit', 'fight', 'strike', 'slay', 'stab', 'slash', 'a', 'punch']);
  addVerbs('defend', ['defend', 'block', 'parry', 'guard']);
  addVerbs('flee', ['flee', 'run', 'escape', 'retreat']);
  addVerbs('talk', ['talk', 'speak', 'chat', 'greet', 'ask']);
  addVerbs('buy', ['buy', 'purchase']);
  addVerbs('sell', ['sell']);
  addVerbs('list', ['list', 'shop', 'wares', 'browse', 'trade']);
  addVerbs('rest', ['rest', 'sleep']);
  addVerbs('pray', ['pray', 'worship', 'kneel']);
  addVerbs('pay', ['pay', 'bribe']);
  addVerbs('give', ['give', 'offer', 'feed', 'hand']);
  addVerbs('open', ['open']);
  addVerbs('unlock', ['unlock']);
  addVerbs('picklock', ['picklock', 'lockpick', 'pick']);
  addVerbs('push', ['push', 'move', 'shove', 'pull', 'slide']);
  addVerbs('break', ['break', 'smash', 'destroy', 'shatter', 'crush']);
  addVerbs('throw', ['throw', 'hurl', 'splash']);
  addVerbs('stats', ['stats', 'status', 'score', 'character', 'char', 'me']);
  addVerbs('help', ['help', 'h', 'commands', 'hint']);
  addVerbs('save', ['save']);
  addVerbs('load', ['load', 'restore']);
  addVerbs('restart', ['restart']);
  addVerbs('wait', ['wait', 'z']);
  addVerbs('go', ['go', 'walk', 'travel', 'head', 'enter', 'climb', 'descend', 'ascend']);
  addVerbs('map', ['map']);
  addVerbs('journal', ['journal', 'j', 'quests', 'quest', 'log', 'tasks']);
  addVerbs('recipes', ['recipes', 'recipe', 'cookbook']);
  addVerbs('craft', ['craft', 'brew', 'mix', 'make', 'cook', 'combine', 'distill']);
  // Extra words that content files (like mere.js) ask for, e.g. { ring: ['ring', 'toll'] }.
  // They never replace a word the game already knows.
  for (const [canon, words] of Object.entries(D.EXTRA_VERBS || {})) words.forEach((w) => { if (!VERB_MAP[w]) VERB_MAP[w] = canon; });
  addVerbs('fun', ['jump', 'sing', 'dance', 'xyzzy', 'plugh', 'hello', 'hi', 'cry', 'scream', 'laugh', 'shout', 'yell', 'swim', 'think']);

  // Two-word commands that mean something different from their first word
  // alone. "pick up" means take, but "pick lock" means picklock.
  const MULTI = { 'pick up': 'take', 'pick lock': 'picklock', 'look at': 'examine', 'look in': 'examine',
    'look into': 'examine', 'look under': 'examine', 'look around': 'look', 'talk to': 'talk', 'speak to': 'talk',
    'speak with': 'talk', 'talk with': 'talk', 'put on': 'equip', 'go to': 'go', 'run away': 'flee', 'lie down': 'rest' };

  // ---- THE GAME'S MEMORY while it runs ----
  // S ("state") holds everything about the current adventure: your stats,
  // inventory, location and progress. It is what gets saved to localStorage.
  // C holds the current fight (or null, meaning "nothing", when not fighting).
  // hist and histPos remember your past commands so the up/down arrow keys can recall them.
  let S = null;   // saved game state
  let C = null;   // current combat (never saved)
  const hist = [];
  let histPos = 0;

  // ---- SMALL HELPER FUNCTIONS used all over the file ----
  // $('output') finds the HTML element with id="output" (a common shortcut name).
  const $ = (id) => document.getElementById(id);
  // rand(1, 6): a random whole number from 1 to 6, like rolling a die.
  // Math.random() gives a random decimal between 0 and 1; Math.floor rounds down.
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  // chance(0.25): true 25% of the time, false the rest.
  const chance = (p) => Math.random() < p;
  // pick([...]): chooses one random entry from a list (used for varied messages).
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  // own(obj, 'x'): does this object really have its OWN property called 'x'?
  // (A safer check than obj.x, which can also find hidden built-in properties.
  // This matters for security when checking data loaded from localStorage.)
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  // item('torch'): looks up an item's details from data.js.
  const item = (id) => D.ITEMS[id];
  // cap('sword') gives 'Sword' (capitalizes the first letter).
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  // fill('hits you for {d}', { d: 5 }) gives 'hits you for 5'. It swaps
  // {placeholders} in message text for real values.
  const fill = (s, map) => s.replace(/\{(\w)\}/g, (m, k) => (own(map, k) ? String(map[k]) : m));

  // ================================================================ OUTPUT
  // print(): adds one line of text to the story log.
  //   text = what to show; cls = a CSS class that sets its color (see style.css).
  // SECURITY: it uses "textContent", which always shows text as plain text.
  // Even if someone typed HTML code, like <script>, it would just appear as
  // letters on screen and never run. (The risky alternative, "innerHTML",
  // is never used in this game.)
  function print(text, cls) {
    const out = $('output');
    const p = document.createElement('p');
    p.className = 'line' + (cls ? ' ' + cls : '');
    p.textContent = text;
    out.appendChild(p);
    while (out.childElementCount > MAX_LINES) out.removeChild(out.firstChild);
  }
  // Scrolls the story log to the bottom so the newest text is visible.
  function scrollOutput() { const o = $('output'); o.scrollTop = o.scrollHeight; }

  // ========================================================= DERIVED STATS
  // "Derived" stats are calculated rather than stored: e.g. your maximum
  // health is your base health PLUS bonuses from what you are wearing.
  // equipStat('def') adds up a stat across your weapon, armor and amulet.
  function equipStat(stat) {
    let t = 0;
    for (const id of [S.weapon, S.armor, S.amulet]) if (id && item(id)[stat]) t += item(id)[stat];
    return t;
  }
  const maxHp = () => S.baseHp + equipStat('hp');
  const maxMp = () => S.baseMp + equipStat('mp');
  const defense = () => S.baseDef + equipStat('def');
  const spellPower = () => D.CLASSES[S.cls].spellPower + equipStat('spell');
  // XP needed for the next level ("||" means "or": if the table runs out, use a formula instead).
  const xpNext = () => XP_TABLE[S.level] || S.level * S.level * 15;
  const room = () => D.ROOMS[S.room];
  const hasItem = (id) => S.inv.includes(id) || S.weapon === id || S.armor === id || S.amulet === id;

  // Lists the exits from a room that are currently open. Hidden exits (like
  // the stair under the throne) only count once their flag is set.
  function exitsOf(id) {
    const out = {};
    for (const [d, v] of Object.entries(D.ROOMS[id].exits || {})) {
      if (typeof v === 'string') out[d] = v;
      else if (!v.flag || S.flags[v.flag]) out[d] = v.to;
    }
    return out;
  }
  // Can the player see? True if the room isn't dark, OR they carry a torch,
  // OR they lit it with the Light spell.
  function isLit(id) {
    id = id || S.room;
    return !D.ROOMS[id].dark || S.inv.includes('torch') || !!S.flags['lit_' + id];
  }
  // Returns the person in this room you can talk to, or null if there is nobody.
  function npcHere() {
    const n = room().npc;
    if (!n) return null;
    if (n.present && !n.present(api)) return null;
    return n;
  }
  // Some room descriptions are functions (so they can change). This runs them
  // if needed and returns the final text either way.
  const resolve = (v) => (typeof v === 'function' ? v(api) : v);

  // Removes ONE copy of an item from the inventory. Returns true if it was there.
  function removeInv(id) {
    const i = S.inv.indexOf(id);
    if (i >= 0) { S.inv.splice(i, 1); return true; }
    return false;
  }

  // ====================================================== API FOR ROOMS.JS
  // An "API" (Application Programming Interface) is a set of tools one piece
  // of code offers to another. This is the "g" toolbox that puzzle code in
  // rooms.js receives. It only offers safe, simple actions (show text, check
  // or give an item, set a flag), so room code can't accidentally break the engine.
  const api = {
    print: (t, c) => print(t, c || 'desc'),
    flag: (n) => !!S.flags[n],
    set: (n, v) => { S.flags[n] = v !== false; },
    has: hasItem,
    give: (id) => { S.inv.push(id); print('You receive: ' + item(id).name + '.', 'loot'); },
    take: removeInv,
    addGold: (n) => { S.gold += n; },
    spend: (n) => { if (S.gold < n) return false; S.gold -= n; return true; },
    cls: () => S.cls,
    xp: (n) => gainXp(n),
    enemyHere: () => !!S.enemies[S.room],
    removeEnemy: () => { delete S.enemies[S.room]; },
    roomHas: (id) => (S.items[S.room] || []).includes(id),
    healFull: () => { S.hp = maxHp(); S.mp = maxMp(); S.poison = 0; },
    healHp: () => { S.hp = maxHp(); S.poison = 0; },
    save: () => autosave(),
    // ---- Extra tools added for the expansion ----
    // Walk the player straight into another room (a ferry ride, a fall, a current).
    moveTo: (id) => { if (own(D.ROOMS, id)) enterRoom(id); },
    // Start a fight with a monster that doesn't live in this room (it won't stay afterwards).
    fight: (id) => { if (own(D.ENEMIES, id) && !C) startCombat(id, true); },
    // Make a monster live in the current room (it stays until defeated).
    placeEnemy: (id) => { if (own(D.ENEMIES, id)) S.enemies[S.room] = id; },
    // Put an item on the floor of a room (the current room if none is given).
    placeItem: (id, roomId) => { if (own(D.ITEMS, id)) S.items[roomId || S.room].push(id); },
    // Hurt the player outside combat. Never kills: it stops at 1 health.
    hurt: (n) => { S.hp = Math.max(1, S.hp - n); },
    // How many of an item the player carries (not counting what they wear).
    count: (id) => S.inv.filter((x) => x === id).length,
    // Which room the player is in.
    here: () => S.room,
    // Quests: move a quest forward to a stage (never backward), or read its stage (0 = not started).
    quest: (id, stage) => advanceQuest(id, stage),
    questStage: (id) => questStage(id),
    // Recipes: teach one (returns false if already known), or check if it's known.
    learnRecipe: (id) => learnRecipe(id),
    knowsRecipe: (id) => S.recipes.includes(id),
  };

  // ================================================================ QUESTS
  // A quest's current stage: 0 = not started. The main quest works its
  // stage out from puzzle flags instead of storing it.
  function questStage(id) {
    const q = D.QUESTS[id];
    if (!q) return 0;
    if (q.derive) return q.derive((f) => !!S.flags[f]);
    return S.quests[id] || 0;
  }
  // Moves a quest forward and announces it in the story log.
  function advanceQuest(id, stage) {
    const q = D.QUESTS[id];
    if (!q || q.derive || !Number.isInteger(stage) || stage < 1 || stage > q.done) return;
    if (questStage(id) >= stage) return;
    const isNew = !S.quests[id];
    S.quests[id] = stage;
    if (stage >= q.done) print('Quest complete: ' + q.name + '. ' + q.doneText, 'levelup');
    else print((isNew ? 'New quest: ' : 'Journal updated: ') + q.name + ' — ' + q.stages[stage], 'quest');
  }
  // Learns a recipe. Returns true if it was new.
  function learnRecipe(id) {
    if (!own(D.RECIPES, id) || S.recipes.includes(id)) return false;
    S.recipes.push(id);
    print('You learned a recipe: ' + D.RECIPES[id].name + ". (Type 'recipes' to see what you can make.)", 'magic');
    return true;
  }

  // ================================================================= STATE
  // Builds a brand-new adventure for a hero with the given name and class:
  // starting stats and gear from data.js, the village square as the starting
  // room, and a fresh copy of every room's items and monsters.
  function newState(name, clsId) {
    const c = D.CLASSES[clsId];
    const s = {
      v: SAVE_VERSION, name, cls: clsId, level: 1, xp: 0, gold: c.gold,
      baseHp: c.hp, baseMp: c.mp, str: c.str, baseDef: c.def, hp: 1, mp: 0,
      weapon: c.weapon, armor: c.armor, amulet: null,
      inv: c.items.slice(), spells: c.spells.slice(), poison: 0,
      room: 'square', prev: 'square', visited: { square: true },
      flags: {}, items: {}, enemies: {}, talk: {}, moves: 0, kills: 0, started: Date.now(),
      // Expansion: quest stages ({ bell: 2 }) and the recipes you have learned.
      quests: {}, recipes: [],
    };
    for (const [id, r] of Object.entries(D.ROOMS)) {
      s.items[id] = (r.items || []).slice();
      if (r.enemy) s.enemies[id] = r.enemy;
    }
    return s;
  }

  // ============================================================= SAVE/LOAD
  // autosave(): writes the whole adventure into localStorage.
  // localStorage can only store text, so JSON.stringify turns the state
  // object into a text string first. It skips saving mid-fight, after death
  // or after winning. "try/catch" means: TRY this, and if it fails (for
  // example, storage is full or blocked in a private window), CATCH the
  // error quietly instead of crashing the game.
  function autosave() {
    if (!S || C || S.hp <= 0 || S.won) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage full or blocked */ }
  }
  // SECURITY: tidies a hero name. Keeps only letters, numbers, spaces,
  // apostrophes and hyphens, squeezes extra spaces, and limits it to 20
  // characters. An empty name becomes "Wanderer".
  function cleanName(n) {
    return String(n || '').replace(/[^\p{L}\p{N} '\-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 20) || 'Wanderer';
  }
  // Never trust saved data: it lives in the browser and can be edited by anyone.
  // Rebuild a fresh state object from only known fields and known IDs.
  function readSave() {
    let raw;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { return null; }
    if (!raw || raw.length > 100000) return null;
    let o;
    try { o = JSON.parse(raw); } catch (e) { return null; }
    try { return validateSave(o); } catch (e) { return null; }
  }
  // SECURITY: "validation" means checking data before trusting it. Anyone can
  // edit their own localStorage, so a save could be broken or malicious. This
  // checks every field: numbers must be whole and within sensible limits, and
  // every room, item, spell and class must be one that really exists. If
  // anything is wrong, it returns null ("no valid save"). If it passes, it
  // builds a brand-new state and copies over ONLY the known, checked fields,
  // so nothing unexpected can sneak in.
  function validateSave(o) {
    const int = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
    const isId = (table, id) => typeof id === 'string' && own(table, id);
    if (!o || typeof o !== 'object' || o.v !== SAVE_VERSION) return null;
    if (!isId(D.CLASSES, o.cls) || !isId(D.ROOMS, o.room) || !isId(D.ROOMS, o.prev)) return null;
    const nums = { level: [1, 99], xp: [0, 1e7], gold: [0, 1e7], baseHp: [1, 5000], baseMp: [0, 5000], str: [0, 500],
      baseDef: [0, 500], hp: [1, 10000], mp: [0, 10000], poison: [0, 50], moves: [0, 1e8], kills: [0, 1e7] };
    for (const [k, [min, max]] of Object.entries(nums)) if (!int(o[k], min, max)) return null;
    const typed = (id, type) => isId(D.ITEMS, id) && D.ITEMS[id].type === type;
    if (!typed(o.weapon, 'weapon')) return null;
    if (o.armor !== null && !typed(o.armor, 'armor')) return null;
    if (o.amulet !== null && !typed(o.amulet, 'amulet')) return null;
    if (!Array.isArray(o.inv) || o.inv.length > 300 || !o.inv.every((id) => isId(D.ITEMS, id))) return null;
    if (!Array.isArray(o.spells) || o.spells.length > 50 || !o.spells.every((id) => isId(D.SPELLS, id))) return null;
    for (const k of ['visited', 'flags', 'items', 'enemies', 'talk']) if (!o[k] || typeof o[k] !== 'object' || Array.isArray(o[k])) return null;

    const s = newState(cleanName(o.name), o.cls);
    for (const k of Object.keys(nums)) s[k] = o[k];
    s.weapon = o.weapon; s.armor = o.armor; s.amulet = o.amulet;
    s.inv = o.inv.slice(); s.spells = [...new Set(o.spells)];
    s.room = o.room; s.prev = o.prev;
    s.started = Number.isFinite(o.started) ? o.started : Date.now();
    s.visited = {};
    for (const k of Object.keys(o.visited)) if (own(D.ROOMS, k) && o.visited[k] === true) s.visited[k] = true;
    // Keys must look like our own flag names and must not shadow built-in object
    // properties such as "constructor" or "__proto__".
    const safeKey = (k, re) => re.test(k) && !(k in Object.prototype);
    s.flags = {};
    for (const k of Object.keys(o.flags)) if (safeKey(k, /^[a-z0-9_]{1,40}$/) && typeof o.flags[k] === 'boolean') s.flags[k] = o.flags[k];
    for (const id of Object.keys(D.ROOMS)) {
      // A room the save has never heard of was added to the game after the save
      // was made (an expansion). Keep its fresh items and monster from newState.
      if (!own(o.items, id)) continue;
      const list = o.items[id];
      s.items[id] = Array.isArray(list) && list.length < 100 && list.every((x) => isId(D.ITEMS, x)) ? list.slice() : [];
      if (own(o.enemies, id) && isId(D.ENEMIES, o.enemies[id])) s.enemies[id] = o.enemies[id];
      else delete s.enemies[id];
    }
    for (const k of Object.keys(o.talk)) if (safeKey(k, /^[a-z]{1,20}$/) && int(o.talk[k], 0, 1e6)) s.talk[k] = o.talk[k];
    // Expansion fields. Saves from before the expansion don't have them, so a
    // missing field just means "nothing yet". Unknown or out-of-range entries
    // are skipped rather than rejecting the whole save.
    const Q = D.QUESTS || {};
    if (o.quests && typeof o.quests === 'object' && !Array.isArray(o.quests)) {
      for (const k of Object.keys(o.quests)) {
        if (own(Q, k) && !Q[k].derive && int(o.quests[k], 1, Q[k].done)) s.quests[k] = o.quests[k];
      }
    }
    if (Array.isArray(o.recipes) && o.recipes.length <= 50) {
      s.recipes = [...new Set(o.recipes.filter((id) => isId(D.RECIPES || {}, id)))];
    }
    s.hp = Math.min(s.hp, s.baseHp + 100);
    return s;
  }

  // ============================================================ MOVEMENT
  // Prints the current room: its name, description (or a warning if it's
  // dark), the items you can see, and the exits.
  function describeRoom() {
    const r = room();
    print(r.name, 'room-title');
    if (!isLit()) {
      print('It is pitch dark. Something with too many legs is rearranging the furniture nearby. You will want a light — a torch, or the Light spell.', 'desc');
    } else {
      print(resolve(r.desc), 'desc');
      const items = S.items[S.room];
      if (items.length) print('You see: ' + listNames(items) + '.', 'loot');
    }
    printExits();
  }
  function printExits() {
    const ex = Object.keys(exitsOf(S.room)).map((d) => DIR_NAMES[d]);
    print('Exits: ' + (ex.length ? ex.join(', ') : 'none') + '.', 'exits');
  }
  // Turns a list of item IDs into readable text, grouping duplicates:
  // e.g. "2 × healing potion, torch".
  function listNames(ids) {
    const counts = {};
    ids.forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
    return Object.entries(counts).map(([id, n]) => (n > 1 ? n + ' × ' + item(id).name : item(id).name)).join(', ');
  }

  // Tries to walk in a direction. It refuses if you're in a fight, if there's
  // no exit that way, or if the room blocks you (like the troll). In the dark
  // you may bump into things. Otherwise you move.
  function go(dir) {
    if (C) { print("You can't just stroll off mid-fight. Try 'flee'.", 'sys'); return; }
    const ex = exitsOf(S.room);
    if (!ex[dir]) { print(pick(["You can't go that way.", 'A wall disagrees with you.', 'There is no path ' + DIR_NAMES[dir] + '. You check twice. Still no.']), 'sys'); return; }
    if (!isLit() && S.prev !== ex[dir] && chance(0.5)) {
      S.hp = Math.max(1, S.hp - 2);
      // A room can describe its own stumble ("stumble"); the default fits indoor rooms.
      print(room().stumble || 'You stumble around in the dark and walk face-first into a shelf. (-2 health) Maybe find a light.', 'dmg');
      return;
    }
    const r = room();
    if (r.canExit) {
      const block = r.canExit(api, dir);
      if (block) { print(block, 'sys'); return; }
    }
    enterRoom(ex[dir]);
  }

  // Arrives in a new room: records the visit, regenerates a little health and
  // mana, describes the room, then either starts a fight (if a monster lives
  // here or a random one appears) or saves the game.
  function enterRoom(id) {
    S.prev = S.room;
    S.room = id;
    S.moves++;
    const first = !S.visited[id];
    S.visited[id] = true;
    // A little regeneration as you travel.
    S.hp = Math.min(maxHp(), S.hp + 1);
    S.mp = Math.min(maxMp(), S.mp + (S.cls === 'mage' ? 2 : 1));
    if (S.poison > 0) { S.poison--; S.hp = Math.max(1, S.hp - 1); print('The poison still burns in your veins. (-1 health)', 'dmg'); }
    print('', 'spacer');
    describeRoom();
    const r = room();
    if (r.onEnter) r.onEnter(api, first);
    const en = S.enemies[id];
    if (en && D.ENEMIES[en].aggressive) startCombat(en, false);
    else if (!en && r.encounter && !first && chance(r.encounter.chance)) startCombat(pick(r.encounter.pool), true);
    else autosave();
  }

  // ================================================================ COMBAT
  // Combat is "turn-based": you act, then the enemy acts, and so on.
  // startCombat sets up a fight with a monster. "temp" is true for random
  // monsters that shouldn't stay in the room afterwards.
  function startCombat(id, temp) {
    const e = D.ENEMIES[id];
    const the = e.proper ? e.name : 'the ' + e.name;
    C = { the, The: cap(the), id, e, hp: e.hp, max: e.hp, poison: 0, poisonDmg: 0, frozen: false, temp, turn: 0, revives: 0, defending: false };
    print(e.intro || 'A ' + e.name + ' attacks!', 'danger');
    print("You're in combat! Attack, cast a spell, use an item, defend, or flee.", 'sys');
  }
  // How armor reduces damage: subtract 60% of the defense from the hit, but
  // every hit still does at least 35% of its full damage (so armor can't make
  // you completely invincible).
  const mitigate = (roll, def) => Math.max(Math.ceil(roll * 0.35), roll - Math.floor(def * 0.6));

  // Your weapon attack: 90% chance to hit. Damage = a random roll in the
  // weapon's range + your strength, doubled on a critical hit, then reduced
  // by the enemy's armor. Warriors sometimes strike twice; the silver sword
  // does extra damage to the undead.
  function playerAttack() {
    const w = item(S.weapon);
    const strikes = S.cls === 'warrior' && chance(0.15) ? 2 : 1;
    for (let i = 0; i < strikes && C.hp > 0; i++) {
      if (i === 1) print('Your momentum carries you into a second strike!', 'combat');
      if (!chance(0.9)) { print(pick(['You swing and miss.', C.The + ' dodges your attack.', 'Your blow glances harmlessly away.']), 'combat'); continue; }
      let roll = rand(w.dmg[0], w.dmg[1]) + S.str;
      const crit = chance(D.CLASSES[S.cls].crit);
      if (crit) roll *= 2;
      if (C.e.undead && w.holy) roll = Math.round(roll * w.holy);
      const dmg = mitigate(roll, C.e.def);
      C.hp -= dmg;
      print((crit ? 'CRITICAL HIT! ' : '') + 'You strike ' + C.the + ' with your ' + w.name + ' for ' + dmg + ' damage.' +
        (C.e.undead && w.holy ? ' The silver sears it!' : ''), crit ? 'crit' : 'combat');
    }
  }

  // After you act: if the enemy is out of health, handle its defeat;
  // otherwise it's the enemy's turn.
  function afterPlayerTurn() {
    if (!C) return;
    if (C.hp <= 0 && enemyDefeated()) return;
    enemyTurn();
  }

  // When an enemy's health hits zero: the lich revives if his jar is intact;
  // otherwise you collect gold, item drops and XP, and the monster is removed.
  // Defeating the lich wins the game.
  // Returns true if combat is over.
  function enemyDefeated() {
    const e = C.e;
    const sp = SPECIALS[e.special];
    // A boss can refuse to die (the lich reviving). Then the fight goes on.
    if (sp && sp.cheatDeath && sp.cheatDeath()) return false;
    print(e.death || C.The + ' falls and does not get up.', 'victory');
    const gold = e.gold ? rand(e.gold[0], e.gold[1]) : 0;
    if (gold > 0) { S.gold += gold; print('You find ' + gold + ' gold.', 'loot'); }
    for (const d of e.drops || []) {
      if (chance(d.chance)) { S.inv.push(d.id); print('You take: ' + item(d.id).name + '.', 'loot'); }
    }
    if (!C.temp) delete S.enemies[S.room];
    S.kills++;
    const xp = e.xp;
    C = null;
    gainXp(xp);
    // A boss may do something once it is truly dead (the lich's death wins the game).
    if (sp && sp.defeated && sp.defeated()) return true;
    autosave();
    return true;
  }

  // SPECIALS: bosses with their own unusual rules. An enemy in data.js names
  // one with "special: 'lich'". Each entry can have up to three functions:
  //   cheatDeath(): runs when the boss hits 0 health. Return true to keep fighting.
  //   attack():     runs on the boss's turn. Return a damage number to use a
  //                 special move instead of a normal hit, or null for a normal hit.
  //   defeated():   runs once the boss is truly dead. Return true if it ended
  //                 the game (so we don't autosave afterwards).
  const SPECIALS = {
    // Varkhul, the Hollow King.
    lich: {
      cheatDeath() {
        if (S.flags.phylactery_destroyed) return false;
        // The Tear of the Mere (from the expansion) breaks his hold on undeath.
        if (S.amulet === 'mere_tear') {
          print('Varkhul\'s bones begin to drag themselves back together, then the Tear of the Mere at your throat flares cold and blue. "Elspeth?" he whispers, as if he has seen a ghost. Then he crumbles, and stays crumbled.', 'magic');
          return false;
        }
        C.revives++;
        C.hp = C.max;
        print('Varkhul collapses into a heap of bones... which immediately drag themselves back together. Green fire floods his eyes. "Did you think it would be that easy? I am ETERNAL."', 'danger');
        if (C.revives >= 2) print('(Something far below is keeping him alive. Maybe you should find it before you try this again. You can always flee.)', 'sys');
        return true;
      },
      attack() {
        if (C.turn % 3 !== 0) return null;
        let dmg = rand(14, 20);
        print('Varkhul raises a skeletal hand and a bolt of grave-light tears straight through your armor! (' + dmg + ' damage)', 'dmg');
        // The Tear of the Mere soaks up half of it.
        if (S.amulet === 'mere_tear') { dmg = Math.ceil(dmg / 2); print('The Tear of the Mere drinks in half of the grave-light. (You take ' + dmg + '.)', 'magic'); }
        return dmg;
      },
      defeated() { S.flags.lich_dead = true; win(); return true; },
    },
    // Queen Elspeth, the Drowned Queen (mere expansion). Every fourth turn she
    // drags you under (ignores armor, drains mana). Once, when badly hurt, the
    // drowned dead wrap around her and mend her.
    queen: {
      attack() {
        if (C.hp <= C.max / 2 && !C.mended) {
          C.mended = true;
          C.hp = Math.min(C.max, C.hp + 25);
          print('Pale hands rise out of the black water and wrap around the Drowned Queen, pressing her wounds closed. (She regains 25 health.)', 'danger');
          return 0;
        }
        if (C.turn % 4 !== 0) return null;
        const dmg = rand(8, 13);
        const m = Math.min(S.mp, 5);
        S.mp -= m;
        print('The Drowned Queen drags you down into the cold. Water fills your eyes and ears and the world goes quiet. (' + dmg + ' damage' + (m ? ', -' + m + ' mana' : '') + ')', 'dmg');
        return dmg;
      },
      defeated() {
        // Her farewell and the Tear itself come from her "death" text and "drops" in mere.js.
        S.flags.queen_rest = true;
        advanceQuest('bell', 5);
        return false;
      },
    },
  };

  // The enemy's turn: poison hurts it, a frozen enemy loses its turn, the
  // lich casts his big spell every third turn, and otherwise it tries to
  // hit you (halved if you chose "defend"). Some enemies poison you or drain
  // your mana. If your health reaches zero, you die.
  function enemyTurn() {
    const e = C.e;
    C.turn++;
    if (C.poison > 0) {
      C.poison--;
      C.hp -= C.poisonDmg;
      print('Poison eats at ' + C.the + ' (' + C.poisonDmg + ' damage).', 'magic');
      if (C.hp <= 0 && enemyDefeated()) return;
    }
    if (C.frozen) {
      C.frozen = false;
      print(C.The + ' is frozen solid and can only glare at you.', 'magic');
    } else {
      let dmg = 0;
      const sp = SPECIALS[e.special];
      const special = sp && sp.attack ? sp.attack() : null;
      if (special !== null) {
        dmg = special;
      } else if (!chance(S.cls === 'rogue' ? 0.75 : 0.85)) {
        print(pick([C.The + ' misses you.', 'You sidestep the attack.', C.The + ' lunges and hits nothing but air.']), 'combat');
      } else {
        dmg = mitigate(rand(e.dmg[0], e.dmg[1]), defense());
        if (C.defending) dmg = Math.max(1, Math.floor(dmg / 2));
        print(fill(pick(e.hits || [C.The + ' hits you ({d} damage).']), { d: dmg }) + (C.defending ? ' Your guard soaks up half the blow.' : ''), 'dmg');
        if (e.poison && chance(e.poison) && S.poison === 0) { S.poison = 3; print('You have been poisoned!', 'dmg'); }
        if (e.drain && S.mp > 0) { const m = Math.min(S.mp, e.drain); S.mp -= m; print('The cold drains ' + m + ' mana from you.', 'magic'); }
      }
      S.hp -= dmg;
    }
    C.defending = false;
    if (S.poison > 0 && S.hp > 0) { S.poison--; S.hp -= 2; print('Poison burns in your veins. (2 damage)', 'dmg'); }
    if (S.hp <= 0) die();
  }

  // Adds experience points. A "while" loop repeats as long as its condition
  // is true, so if you earn enough XP for several levels at once, you level
  // up several times. Each level raises your stats and fully heals you.
  function gainXp(n) {
    S.xp += n;
    print('+' + n + ' XP', 'xp');
    const c = D.CLASSES[S.cls];
    while (S.xp >= xpNext()) {
      S.xp -= xpNext();
      S.level++;
      S.baseHp += c.levelHp;
      S.baseMp += c.levelMp;
      if (c.levelStr || S.level % 2 === 0) S.str += Math.max(1, c.levelStr);
      if (S.level % 3 === 0) S.baseDef++;
      S.hp = maxHp();
      S.mp = maxMp();
      print('*** LEVEL UP! You are now level ' + S.level + '. You feel stronger, and fully restored. ***', 'levelup');
      noteLevel();
    }
  }

  // ======================================================= HALL OF RECORDS
  // Lifetime stats kept in localStorage, separate from the saved game, so they
  // survive refreshes, closing the browser, deaths and new games.
  // The starting values: all zeros and no record-holder yet.
  function emptyRecords() {
    return { started: 0, deaths: 0, wins: 0, bestLevel: 0, bestHero: '', fewestMoves: 0 };
  }
  // Like the save loader, never trust stored data: keep only known fields with sane values.
  function readRecords() {
    const r = emptyRecords();
    let o;
    try { o = JSON.parse(localStorage.getItem(RECORDS_KEY) || 'null'); } catch (e) { return r; }
    if (!o || typeof o !== 'object') return r;
    const int = (n) => Number.isInteger(n) && n >= 0 && n <= 1e9;
    for (const k of ['started', 'deaths', 'wins', 'bestLevel', 'fewestMoves']) if (int(o[k])) r[k] = o[k];
    if (typeof o.bestHero === 'string') r.bestHero = o.bestHero.replace(/[^\p{L}\p{N} '\-]/gu, '').slice(0, 40);
    if (!r.bestLevel) r.bestHero = '';
    return r;
  }
  // Loads the records, applies a change (passed in as a function, such as
  // "add 1 to deaths"), and saves them back to localStorage.
  function updateRecords(change) {
    const r = readRecords();
    change(r);
    try { localStorage.setItem(RECORDS_KEY, JSON.stringify(r)); } catch (e) { /* storage full or blocked */ }
    return r;
  }
  // If the current hero beat the highest level on record, remember their level and name.
  function noteLevel() {
    updateRecords((r) => {
      if (S.level > r.bestLevel) { r.bestLevel = S.level; r.bestHero = S.name + ' the ' + D.CLASSES[S.cls].name; }
    });
  }
  // "Render" means draw on screen: fills the Hall of Records panel on the
  // start screen, or shows "No legends yet" if no game has been played.
  function renderRecords() {
    const r = readRecords();
    $('records-empty').hidden = r.started > 0;
    $('records-grid').hidden = r.started === 0;
    $('clear-records-btn').hidden = r.started === 0;
    $('rec-started').textContent = r.started;
    $('rec-wins').textContent = r.wins;
    $('rec-deaths').textContent = r.deaths;
    $('rec-level').textContent = r.bestLevel || '—';
    $('rec-level-who').textContent = r.bestHero;
    $('rec-moves').textContent = r.fewestMoves || '—';
  }

  // Game over: counts the death in the Hall of Records and shows a pop-up
  // offering to load the last save or start again.
  function die() {
    S.hp = 0;
    C = null;
    updateRecords((r) => { r.deaths++; });
    print('You have died.', 'danger');
    const quips = [
      'Your adventure ends here, in a manner the bards will describe as "brief".',
      'The villagers will speak of you for years. Mostly as a warning.',
      'On the bright side, you are now uniquely qualified to join the Hollow King\'s army.',
    ];
    showModal('You Have Died', [pick(quips)], [
      readSave() ? { label: 'Load last save', action: () => { hideModal(); loadGame(); } } : null,
      { label: 'Start a new game', action: () => { hideModal(); showStart(); } },
    ].filter(Boolean));
  }

  // Victory: prints the ending, deletes the finished save, records the win
  // (and fastest win) in the Hall of Records, and shows your final stats.
  function win() {
    S.won = true;
    const mins = Math.max(1, Math.round((Date.now() - S.started) / 60000));
    print('', 'spacer');
    print('The curse of Castle Duskholm is broken.', 'victory');
    print('Dawn breaks over the ridge for the first time in twenty years, and in the village below, somebody starts ringing the chapel bell. You climb back into the light.', 'desc');
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
    updateRecords((r) => {
      r.wins++;
      if (!r.fewestMoves || S.moves < r.fewestMoves) r.fewestMoves = S.moves;
    });
    showModal('Victory!', [
      'Varkhul, the Hollow King, is truly dead. Hollowmere is free — and you have been awarded three chickens, as promised.',
      S.flags.queen_rest ? 'Out on the mere, the drowned bell rings once more, all by itself. Queen Elspeth has her answer.' : null,
      S.name + ' the ' + D.CLASSES[S.cls].name + ' — Level ' + S.level + ' · ' + S.kills + ' foes defeated · ' + S.moves + ' moves · about ' + mins + ' minute' + (mins === 1 ? '' : 's') + '.',
    ].filter(Boolean), [{ label: 'Play again', action: () => { hideModal(); showStart(); } }]);
  }

  // ================================================================ PARSER
  // A "parser" breaks text into parts a program can understand. parse()
  // lowercases what the player typed, removes punctuation, splits it into
  // words, and works out the VERB (the action, e.g. 'take') and the REST
  // (what it applies to, e.g. ['rusty', 'sword']).
  function parse(raw) {
    const words = raw.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9\s?-]/g, ' ').split(/\s+/).filter(Boolean);
    if (!words.length) return null;
    let verb, rest;
    const two = words[0] + ' ' + (words[1] || '');
    // own() stops words like "constructor" from matching built-in object properties.
    if (own(MULTI, two)) { verb = MULTI[two]; rest = words.slice(2); }
    else if (words[0] === '?') { verb = 'help'; rest = []; }
    else if (own(DIR_ALIASES, words[0]) && words.length === 1) { verb = 'go'; rest = words; }
    else { verb = own(VERB_MAP, words[0]) ? VERB_MAP[words[0]] : words[0]; rest = words.slice(1); }
    return { verb, rest, raw: words };
  }
  // Removes filler words ("the", "at"...), leaving the important ones.
  const nounOf = (words) => words.filter((w) => !FILLER.has(w));

  // All the words that can refer to a thing: its name split into words, plus its keywords.
  function wordsOf(name, kw) {
    return new Set(name.toLowerCase().replace(/'/g, '').split(/[\s-]+/).concat(kw || []));
  }
  // "Candidates" are the possible things the player might mean. Each one gets
  // a score: one point for every typed word that fits it. The highest score
  // wins, so "healing potion" picks the healing potion over the mana potion.
  // Finds the best match for the typed words among {id, name, kw} candidates.
  function match(words, cands) {
    if (!words.length) return null;
    const phrase = words.join(' ');
    let best = null; let bestScore = 0; let bestSize = 1e9;
    for (const c of cands) {
      if (c.name.toLowerCase().replace(/'/g, '') === phrase) return c;
      const ws = wordsOf(c.name, c.kw);
      let score = 0;
      for (const w of words) if (ws.has(w)) score++;
      if (score > bestScore || (score === bestScore && score > 0 && ws.size < bestSize)) { best = c; bestScore = score; bestSize = ws.size; }
    }
    return bestScore > 0 ? best : null;
  }
  // Builders for candidate lists: any list of item IDs, just your pack, or your pack plus what you're wearing.
  const itemCands = (ids) => [...new Set(ids)].map((id) => ({ id, name: item(id).name, kw: item(id).kw }));
  const invCands = () => itemCands(S.inv);
  const allMyCands = () => itemCands(S.inv.concat([S.weapon, S.armor, S.amulet].filter(Boolean)));

  // =============================================================== COMMANDS
  // The only commands allowed during a fight. (No wandering off mid-battle!)
  const COMBAT_OK = new Set(['attack', 'cast', 'drink', 'eat', 'use', 'throw', 'defend', 'flee', 'look', 'examine',
    'inventory', 'stats', 'spells', 'help', 'equip', 'wait', 'map', 'journal', 'recipes']);

  // run(): the heart of the game. Every typed command and every button click
  // ends up here. It: (1) cuts the input to a safe length, (2) shows it in
  // the log, (3) parses it, (4) finds the matching command in CMDS below and
  // runs it, (5) autosaves, and (6) refreshes the screen.
  function run(input) {
    if (!S) return;
    const text = String(input).slice(0, MAX_INPUT).trim();
    if (!text) return;
    print('> ' + text, 'echo');
    if (S.hp <= 0 || S.won) { print('The game is over. Start a new game or load your save.', 'sys'); scrollOutput(); return; }
    const p = parse(text);
    if (!p) return;
    const noun = nounOf(p.rest);
    if (C && !COMBAT_OK.has(p.verb)) {
      print("You're a bit busy being attacked right now. (Try attack, defend, cast, drink, throw or flee.)", 'sys');
    } else {
      const fn = own(CMDS, p.verb) ? CMDS[p.verb] : null;
      const r = room();
      if (fn) fn(noun, p);
      // A room can invent its own verbs ("ring bell", "wade") just by having
      // an on.<verb> hook, without a new command here. own() makes sure we only
      // ever run the room's own hooks, never built-in object properties.
      else if (r.on && own(r.on, p.verb) && roomHook(p.verb, noun)) { /* handled by the room */ }
      else print("I don't know how to '" + p.raw[0] + "'. Type 'help' for a list of commands.", 'sys');
    }
    if (S && !C && p.verb !== 'load' && p.verb !== 'restart') autosave();
    updateUI();
    scrollOutput();
  }

  // A "hook" is a spot where other code can plug in. This checks whether the
  // current room (in rooms.js) has its own special response for this verb,
  // such as "push" in the throne room, and runs it if so.
  function roomHook(verb, noun, extra) {
    const r = room();
    if (r.on && r.on[verb]) return !!r.on[verb](api, noun.join(' '), extra);
    return false;
  }

  // CMDS: one function per command the player can use. The function's name is
  // the command (go, look, take, attack...). "noun" is the list of important
  // words typed after the verb; "p" is the full parsed command, for commands
  // that need more detail (like "give X to Y").
  const CMDS = {
    // "go north", "go tavern", "climb stairs"...
    go(noun) {
      const w = noun.filter((x) => x !== 'go');
      let dir = w.map((x) => (own(DIR_ALIASES, x) ? DIR_ALIASES[x] : null)).find(Boolean);
      if (!dir && w.some((x) => /stairs?|ladder|tower|staircase/.test(x))) {
        const ex = exitsOf(S.room);
        dir = ex.u ? 'u' : ex.d ? 'd' : null;
      }
      if (!dir && w.length) {
        // "go tavern", "enter graveyard": match the names of neighbouring rooms.
        const ex = exitsOf(S.room);
        const found = match(w, Object.entries(ex).map(([d, id]) => ({ id: d, name: D.ROOMS[id].name.replace(/[—']/g, ' '), kw: [] })));
        if (found) dir = found.id;
      }
      if (!dir) { print('Go where? Try north, south, east, west, up or down.', 'sys'); return; }
      go(dir);
    },
    look(noun) {
      if (noun.length) { CMDS.examine(noun); return; }
      if (C) { print('You are fighting ' + C.the + ' (' + Math.max(0, C.hp) + '/' + C.max + ' health).', 'combat'); return; }
      describeRoom();
    },
    // "examine X": looks for X in this order: you, your items, special room
    // responses, items on the floor, the enemy, the person here, then scenery.
    examine(noun) {
      if (!noun.length) { describeRoom(); return; }
      if (noun.some((w) => ['me', 'self', 'myself'].includes(w))) { CMDS.stats(); return; }
      const mine = match(noun, allMyCands());
      if (mine) { print(cap(item(mine.id).name) + ': ' + item(mine.id).desc, 'desc'); return; }
      if (roomHook('examine', noun)) return;
      if (isLit()) {
        const here = match(noun, itemCands(S.items[S.room]));
        if (here) { print(cap(item(here.id).name) + ': ' + item(here.id).desc, 'desc'); return; }
      }
      const enemyId = C ? C.id : S.enemies[S.room];
      if (enemyId && match(noun, [{ id: enemyId, name: D.ENEMIES[enemyId].name, kw: D.ENEMIES[enemyId].kw }])) {
        const e = D.ENEMIES[enemyId];
        const npc = npcHere();
        print(npc && npc.desc ? npc.desc : cap(e.name) + (e.undead ? ' — undead.' : '.') + (C ? ' Health: ' + Math.max(0, C.hp) + '/' + C.max + '.' : ''), 'desc');
        return;
      }
      const npc = npcHere();
      if (npc && match(noun, [npc])) { print(npc.desc, 'desc'); return; }
      if (isLit()) {
        const f = (room().features || []).find((ft) => noun.some((w) => ft.kw.includes(w)));
        if (f) { print(f.text, 'desc'); return; }
      }
      print(isLit() ? "You don't see anything like that here." : "It's too dark to make anything out.", 'sys');
    },
    // "take X" or "take all": moves items from the room into your inventory
    // (gold goes straight into your purse). Won't work in the dark.
    take(noun) {
      if (!noun.length) { print('Take what?', 'sys'); return; }
      if (roomHook('take', noun)) return;
      if (!isLit()) { print('You grope around in the dark and find only something soft that moves away. Get a light first.', 'sys'); return; }
      const list = S.items[S.room];
      const targets = noun[0] === 'all' || noun[0] === 'everything' ? [...new Set(list)] : [match(noun, itemCands(list))].filter(Boolean).map((c) => c.id);
      if (!targets.length) {
        if (noun[0] === 'all') print('There is nothing here to take.', 'sys');
        else if ((room().features || []).some((ft) => noun.some((w) => ft.kw.includes(w)))) print("You can't take that. It's quite firmly part of the scenery.", 'sys');
        else print("You don't see that here.", 'sys');
        return;
      }
      const all = noun[0] === 'all' || noun[0] === 'everything';
      for (const id of targets) {
        const copies = all ? list.filter((x) => x === id).length : 1;
        for (let k = 0; k < copies; k++) {
          list.splice(list.indexOf(id), 1);
          const it = item(id);
          if (it.type === 'gold') { S.gold += it.amount; print('You take the ' + it.name + ': ' + it.amount + ' gold inside!', 'loot'); }
          else { S.inv.push(id); print('Taken: ' + it.name + '.', 'loot'); }
        }
      }
    },
    drop(noun) {
      const m = match(noun, invCands());
      if (!m) { print("You aren't carrying that.", 'sys'); return; }
      const it = item(m.id);
      if (it.type === 'key') { print("Better hang on to the " + it.name + ". It looks important.", 'sys'); return; }
      removeInv(m.id);
      S.items[S.room].push(m.id);
      print('Dropped: ' + it.name + '.', 'desc');
    },
    inventory() {
      print('You are wielding: ' + item(S.weapon).name + '. Wearing: ' + (S.armor ? item(S.armor).name : 'nothing') +
        (S.amulet ? ', ' + item(S.amulet).name : '') + '.', 'desc');
      print(S.inv.length ? 'You are carrying: ' + listNames(S.inv) + '.' : 'Your pack is empty, apart from some lint.', 'desc');
      print('Gold: ' + S.gold + '.', 'loot');
    },
    // "equip X": wear or wield an item. Whatever was in that slot goes back
    // into your pack. During a fight this uses up your turn.
    equip(noun) {
      const m = match(noun, invCands());
      if (!m) { print(noun.length ? "You aren't carrying that." : 'Equip what?', 'sys'); return; }
      const it = item(m.id);
      const slot = { weapon: 'weapon', armor: 'armor', amulet: 'amulet' }[it.type];
      if (!slot) { print("You can't equip the " + it.name + '.', 'sys'); return; }
      removeInv(m.id);
      if (S[slot]) S.inv.push(S[slot]);
      S[slot] = m.id;
      S.hp = Math.min(S.hp, maxHp());
      S.mp = Math.min(S.mp, maxMp());
      print('You ' + (slot === 'weapon' ? 'ready the ' : 'put on the ') + it.name + '.', 'loot');
      if (C) enemyTurn();
    },
    drink(noun) { consume(noun, 'drink'); },
    eat(noun) { consume(noun, 'eat'); },
    // "use X": works out the sensible action for each kind of item and hands
    // off to it (drink a potion, read a scroll, equip a sword, and so on).
    use(noun) {
      const m = match(noun, allMyCands());
      if (!m) { print("You don't have that.", 'sys'); return; }
      const it = item(m.id);
      if (it.type === 'potion' || it.type === 'food') consume(noun, 'use');
      else if (it.type === 'throw') CMDS.throw(noun);
      else if (it.type === 'scroll' || it.type === 'note' || it.type === 'recipe') CMDS.read(noun);
      // Ingredients: the room gets first say ("use leech oil" on a rusty lever);
      // otherwise it's a nudge towards brewing.
      else if (it.type === 'ingredient') { if (!roomHook('use', noun, m.id)) print('The ' + it.name + " is a brewing ingredient. Type 'recipes' to see what you can make with it.", 'sys'); }
      // Anything else: let the room decide ("use leech oil" on a rusty lever).
      else if (roomHook('use', noun, m.id)) { /* handled by the room */ }
      else if (['weapon', 'armor', 'amulet'].includes(it.type)) CMDS.equip(noun);
      else if (it.type === 'key') { if (!roomHook('unlock', noun, m.id)) print("There's nothing here that the " + it.name + ' fits.', 'sys'); }
      else if (m.id === 'lockpicks') CMDS.picklock(noun);
      else if (m.id === 'torch') print('The torch is already lit. It lights your way automatically.', 'sys');
      else print("You aren't sure how to use the " + it.name + '.', 'sys');
    },
    // "read X": shows a note's text, or learns the spell on a scroll (which is used up).
    read(noun) {
      const m = match(noun, invCands());
      if (!m) {
        if (isLit() && match(noun, itemCands(S.items[S.room]))) { print('Pick it up first.', 'sys'); return; }
        CMDS.examine(noun);
        return;
      }
      const it = item(m.id);
      if (it.type === 'note') { print(it.text, 'note'); return; }
      // Recipe pages: show the text, then learn every recipe listed in "teaches".
      if (it.type === 'recipe') {
        print(it.text, 'note');
        const learned = (it.teaches || []).filter((id) => learnRecipe(id));
        if (!learned.length) print('You already know everything on this page.', 'sys');
        return;
      }
      if (it.type !== 'scroll') { print('There is nothing written on the ' + it.name + '.', 'sys'); return; }
      const sp = D.SPELLS[it.spell];
      if (S.spells.includes(it.spell)) { print('You already know ' + sp.name + '. The ' + it.name + ' has nothing new to teach you.', 'sys'); return; }
      removeInv(m.id);
      S.spells.push(it.spell);
      print('You read the ' + it.name + '. The words burn themselves into your memory, and the page crumbles to dust. You have learned ' + sp.name + '! (' + sp.mp + ' MP: ' + sp.desc + ")", 'magic');
      if (S.cls === 'warrior') print('Your head hurts. Warriors are not big on reading.', 'sys');
    },
    spells() {
      if (!S.spells.length) { print("You don't know any spells.", 'sys'); return; }
      print('You know these spells (' + S.mp + '/' + maxMp() + ' MP):', 'magic');
      for (const id of S.spells) { const sp = D.SPELLS[id]; print('  ' + sp.name + ' — ' + sp.mp + ' MP. ' + sp.desc, 'magic'); }
      print("Type 'cast <spell name>' to use one.", 'sys');
    },
    // "cast X": finds which known spell you mean, then castSpell() does the work.
    cast(noun) {
      if (!noun.length) { print('Cast what? Type "spells" to see what you know.', 'sys'); return; }
      const known = S.spells.map((id) => ({ id, name: D.SPELLS[id].name, kw: D.SPELLS[id].kw }));
      const m = match(noun, known);
      if (!m) {
        const any = match(noun, Object.entries(D.SPELLS).map(([id, s]) => ({ id, name: s.name, kw: s.kw })));
        print(any ? "You don't know " + D.SPELLS[any.id].name + ' yet. Wiggling your fingers meaningfully accomplishes nothing.' : "You don't know a spell like that.", 'sys');
        return;
      }
      castSpell(m.id);
    },
    // "attack": starts a fight if a monster is here, then swings your weapon.
    attack(noun) {
      if (!C) {
        const en = S.enemies[S.room];
        if (!en) {
          if (room().on && room().on.break && noun.length && roomHook('break', noun)) return;
          const npc = npcHere();
          print(npc ? "You'd rather not attack " + npc.name + '. They have done nothing to deserve it. Yet.' : 'There is nothing here to attack except the scenery, and it has done nothing to you.', 'sys');
          return;
        }
        startCombat(en, false);
      }
      playerAttack();
      afterPlayerTurn();
    },
    // "defend": halves the next hit and recovers 2 mana.
    defend() {
      if (!C) { print('You take up a defensive stance against nothing in particular. The air backs off.', 'sys'); return; }
      C.defending = true;
      S.mp = Math.min(maxMp(), S.mp + 2);
      print('You raise your guard and catch your breath. (+2 MP)', 'combat');
      enemyTurn();
    },
    // "flee": a chance (better for Rogues) to escape to the previous room.
    // If it fails, the enemy gets a free attack.
    flee() {
      if (!C) { print('You flee from nothing. Very dramatic.', 'sys'); return; }
      if (chance(S.cls === 'rogue' ? 0.85 : 0.6)) {
        const name = C.the;
        C = null;
        let back = S.prev;
        if (back === S.room || !D.ROOMS[back]) back = Object.values(exitsOf(S.room))[0];
        print('You turn and run from ' + name + '!', 'combat');
        enterRoom(back);
      } else {
        print('You try to flee, but ' + C.the + ' cuts you off!', 'combat');
        enemyTurn();
      }
    },
    // "talk": the person here says their next line. S.talk counts how many
    // times you've spoken to each person, and "%" (remainder) loops back to
    // their first line after the last.
    talk(noun) {
      const npc = npcHere();
      if (!npc) {
        if (S.enemies[S.room]) print('It does not seem interested in conversation.', 'sys');
        else print(pick(['You talk to yourself for a while. You make some good points.', 'There is no one here to talk to.']), 'sys');
        return;
      }
      if (noun.length && !match(noun, [npc])) { print("There's no one by that name here.", 'sys'); return; }
      if (npc.onTalk && npc.onTalk(api)) return;
      const i = S.talk[npc.id] || 0;
      print(npc.talk[i % npc.talk.length], 'npc');
      S.talk[npc.id] = i + 1;
    },
    // SHOPPING: "list" shows what's for sale, "buy" spends gold, "sell" pays half the item's value.
    list() {
      const shop = room().shop;
      if (!shop) { print('There is nothing for sale here.', 'sys'); return; }
      print('For sale:', 'loot');
      for (const id of shop) print('  ' + cap(item(id).name) + ' — ' + item(id).value + ' gold. ' + item(id).desc, 'shop');
      print("You have " + S.gold + " gold. Type 'buy <item>' or 'sell <item>' (shops pay half price).", 'sys');
    },
    buy(noun) {
      const shop = room().shop;
      if (!shop) { print('There is no one here to buy from.', 'sys'); return; }
      const m = match(noun, itemCands(shop));
      if (!m) { print("They don't sell that here. Type 'list' to see what they have.", 'sys'); return; }
      const it = item(m.id);
      if (S.gold < it.value) { print('You need ' + it.value + ' gold for the ' + it.name + ', but you only have ' + S.gold + '.', 'sys'); return; }
      S.gold -= it.value;
      S.inv.push(m.id);
      print('You buy the ' + it.name + ' for ' + it.value + ' gold.', 'loot');
    },
    sell(noun) {
      if (!room().shop) { print("There's no one here to sell to. Try a shop in the village.", 'sys'); return; }
      const m = match(noun, invCands());
      if (!m) { print("You aren't carrying that. (You can't sell equipped items; unequip them by equipping something else.)", 'sys'); return; }
      const it = item(m.id);
      const price = Math.floor((it.value || 0) / 2);
      if (price <= 0 || it.type === 'key' || it.type === 'note') { print('Nobody wants to buy the ' + it.name + '.', 'sys'); return; }
      removeInv(m.id);
      S.gold += price;
      print('You sell the ' + it.name + ' for ' + price + ' gold.', 'loot');
    },
    // These commands only do something in particular rooms (the tavern,
    // chapel, troll bridge...). Otherwise they give a friendly "not here" reply.
    rest() {
      if (roomHook('rest', [])) return;
      print("You can't rest here. Too many things would like to eat you in your sleep. The tavern has beds.", 'sys');
    },
    pray() {
      if (roomHook('pray', [])) return;
      print('You pray. Nobody seems to be listening out here. Try the chapel.', 'sys');
    },
    pay() {
      if (roomHook('pay', [])) return;
      print('There is no one here to pay.', 'sys');
    },
    // "give X to Y": splits the typed words at "to" to find the item.
    give(noun, p) {
      const idx = p.rest.indexOf('to');
      const itemWords = nounOf(idx >= 0 ? p.rest.slice(0, idx) : p.rest);
      const m = match(itemWords, invCands()) || match(noun, invCands());
      if (!m) { print("You don't have that to give.", 'sys'); return; }
      if (roomHook('give', noun, m.id)) return;
      const npc = npcHere();
      print(npc ? npc.name + ' politely declines the ' + item(m.id).name + '.' : 'There is no one here to give it to.', 'sys');
    },
    open(noun) { if (!roomHook('open', noun)) print(noun.length ? "You can't open that." : 'Open what?', 'sys'); },
    unlock(noun) { if (!roomHook('unlock', noun)) print('There is nothing here to unlock.', 'sys'); },
    picklock(noun) {
      if (!hasItem('lockpicks')) { print("You don't have any lockpicks.", 'sys'); return; }
      if (!roomHook('picklock', noun)) print('There is no lock here worth picking.', 'sys');
    },
    push(noun) { if (!roomHook('push', noun)) print('You push it. Nothing happens. You feel a little silly.', 'sys'); },
    break(noun) { if (!roomHook('break', noun)) print("Violence isn't the answer here. Well, not to that question.", 'sys'); },
    // "throw holy water at X": big damage to the undead, a splash to anything else.
    throw(noun, p) {
      const idx = p.rest.indexOf('at');
      const itemWords = nounOf(idx >= 0 ? p.rest.slice(0, idx) : p.rest);
      const m = match(itemWords, invCands()) || match(noun, invCands());
      if (!m) { print("You don't have that to throw.", 'sys'); return; }
      const it = item(m.id);
      if (it.type !== 'throw') { print('You consider throwing the ' + it.name + ', then think better of it.', 'sys'); return; }
      if (!C) { print("Better save it for something that's actually trying to kill you.", 'sys'); return; }
      removeInv(m.id);
      // Holy water only really hurts the undead. Other thrown items (like bog
      // fire) can set their own damage against the living ("dmgLiving") and
      // their own messages ("hitMsg" / "weakMsg", where {e} = enemy, {d} = damage).
      const strong = C.e.undead || it.dmgLiving;
      const dmg = C.e.undead ? it.dmg : (it.dmgLiving || 4);
      C.hp -= dmg;
      const hitMsg = it.hitMsg || 'The holy water splashes over {e}, which shrieks and smokes! ({d} damage)';
      const weakMsg = it.weakMsg || 'The holy water splashes over {e}. It is not undead — just wet now, and annoyed. ({d} damage)';
      print(fill(strong ? hitMsg : weakMsg, { e: C.the, d: dmg }), 'magic');
      afterPlayerTurn();
    },
    // "stats": prints your character sheet.
    stats() {
      const c = D.CLASSES[S.cls];
      const w = item(S.weapon);
      print(S.name + ' the ' + c.name + ' — Level ' + S.level, 'room-title');
      print('Health ' + S.hp + '/' + maxHp() + ' · Mana ' + S.mp + '/' + maxMp() + ' · XP ' + S.xp + '/' + xpNext() + ' · Gold ' + S.gold, 'desc');
      print('Attack ' + (w.dmg[0] + S.str) + '-' + (w.dmg[1] + S.str) + ' · Defense ' + defense() + ' · Spell power ' + Math.round(spellPower() * 100) + '%', 'desc');
      print('Class perk: ' + c.perk + (S.poison ? ' You are poisoned.' : ''), 'desc');
      print('Foes defeated: ' + S.kills + ' · Moves: ' + S.moves + ' · Places discovered: ' + Object.keys(S.visited).length + '/' + Object.keys(D.ROOMS).length, 'desc');
    },
    help() {
      [
        'HOW TO PLAY — type commands in plain English, or use the buttons.',
        '  Move:      north, south, east, west, up, down  (or n, s, e, w, u, d)',
        '  Look:      look (l), examine <thing> (x), read <thing>',
        '  Items:     take <item>, take all, drop, inventory (i), equip <item>,',
        '             drink / eat / use <item>, throw <item> at <enemy>',
        '  Combat:    attack (a), defend, flee, cast <spell>, spells',
        '  People:    talk to <person>, give <item> to <person>, pay',
        '  Shops:     list, buy <item>, sell <item>',
        '  Brewing:   recipes, brew <recipe>  (some recipes need a cauldron)',
        '  Other:     journal (j), open, unlock, pick lock, push, smash, rest, pray,',
        '             stats, save, load, restart',
        'Tips: examine everything, talk to everyone twice, and press the up arrow to repeat a command.',
      ].forEach((l) => print(l, 'help'));
    },
    // save / load / restart: manage your saved game in localStorage.
    save() {
      if (C) { print("You can't save in the middle of a fight.", 'sys'); return; }
      autosave();
      print('Game saved. (The game also saves automatically whenever you reach a safe spot.)', 'sys');
    },
    load() {
      if (!readSave()) { print('There is no saved game to load.', 'sys'); return; }
      loadGame();
    },
    restart() {
      showModal('Start over?', ['Your current adventure will be lost.'], [
        { label: 'Yes, start over', action: () => { hideModal(); try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } showStart(); } },
        { label: 'Cancel', action: hideModal },
      ]);
    },
    wait() {
      if (C) { print('You hesitate.', 'combat'); enemyTurn(); return; }
      print(pick(['Time passes. Somewhere, a crow judges you.', 'You wait. Nothing happens, very slowly.']), 'sys');
    },
    map() {
      print('Your map is in the side panel; it fills in as you explore. You have discovered ' + Object.keys(S.visited).length + ' of ' + Object.keys(D.ROOMS).length + ' places.', 'sys');
    },
    // "journal": lists every quest you have started, newest stage first.
    journal() {
      const ids = Object.keys(D.QUESTS).filter((id) => questStage(id) > 0);
      print('JOURNAL', 'room-title');
      for (const id of ids) {
        const q = D.QUESTS[id];
        const st = questStage(id);
        print((st >= q.done ? '✔ ' : '• ') + q.name + ': ' + (st >= q.done ? q.doneText : q.stages[st]), st >= q.done ? 'desc' : 'quest');
      }
    },
    // "recipes": what you know how to make, and what you're still missing.
    recipes() {
      if (!S.recipes.length) { print("You don't know any recipes yet. Somebody who brews things might teach you.", 'sys'); return; }
      print('You know these recipes' + (room().cauldron ? ' (there is a cauldron here):' : ':'), 'magic');
      for (const id of S.recipes) {
        const r = D.RECIPES[id];
        const parts = Object.entries(r.needs).map(([ing, n]) => {
          const have = S.inv.filter((x) => x === ing).length;
          return n + ' ' + item(ing).name + (have >= n ? ' ✔' : ' (have ' + have + ')');
        });
        print('  ' + cap(r.name) + ' — ' + parts.join(', ') + (r.cauldron ? '. Needs a cauldron.' : '.'), 'magic');
      }
      print("Type 'brew <name>' to make one.", 'sys');
    },
    // "craft X" / "brew X": uses up the ingredients and gives you the result.
    craft(noun) {
      if (!noun.length) { CMDS.recipes(); return; }
      const cands = Object.entries(D.RECIPES).map(([id, r]) => ({ id, name: r.name, kw: r.kw }));
      const known = match(noun, cands.filter((c) => S.recipes.includes(c.id)));
      if (!known) {
        print(match(noun, cands) ? "You don't know how to make that yet." : "You don't know a recipe like that. Type 'recipes' to see the ones you know.", 'sys');
        return;
      }
      const r = D.RECIPES[known.id];
      if (r.cauldron && !room().cauldron) { print('You need a cauldron to brew ' + r.name + '. There is one in Old Nettle\'s hut, and another in the bog.', 'sys'); return; }
      const missing = Object.entries(r.needs).filter(([ing, n]) => S.inv.filter((x) => x === ing).length < n);
      if (missing.length) {
        print('You are missing: ' + missing.map(([ing, n]) => n + ' ' + item(ing).name).join(', ') + '.', 'sys');
        return;
      }
      for (const [ing, n] of Object.entries(r.needs)) for (let k = 0; k < n; k++) removeInv(ing);
      S.inv.push(r.makes);
      print(r.cauldron
        ? 'You drop the ingredients into the cauldron one by one. It bubbles, belches, and turns a colour you have no name for. You ladle out: ' + item(r.makes).name + '.'
        : 'You grind, mix and stopper everything with great care and a little swearing. You made: ' + item(r.makes).name + '.', 'loot');
    },
    // Joke replies for silly commands like "jump", "dance" or "xyzzy".
    fun(noun, p) {
      const w = p.raw[0];
      const lines = {
        jump: 'You jump on the spot. Nothing happens, but you feel slightly more athletic.',
        sing: 'You sing a few bars of a tavern song. Somewhere, a dog howls in protest.',
        dance: 'You dance a little jig. If anyone saw, they are too polite to mention it.',
        xyzzy: "A hollow voice says: 'Wrong adventure, friend.'",
        plugh: "A hollow voice says: 'Still the wrong adventure.'",
        hello: 'Hello to you too.', hi: 'Hi there.',
        cry: 'You have a little cry. It helps, honestly.',
        scream: 'You scream into the void. The void politely declines to comment.',
        laugh: 'You laugh. The echo laughs back a little too long.',
        shout: 'You shout. Somewhere, something shouts back. Maybe stop that.',
        yell: 'You yell. Somewhere, something yells back. Maybe stop that.',
        swim: 'There is nowhere nice to swim here, and the water in these parts has faces in it.',
        think: 'You think. It is a nice change of pace.',
      };
      print(lines[w] || 'Nothing happens.', 'sys');
    },
  };

  // Drinks or eats an item: removes it from your pack and applies its
  // healing, mana or poison cure. In a fight this uses your turn.
  function consume(noun, how) {
    const m = match(noun, invCands());
    if (!m) { print(noun.length ? "You don't have that." : cap(how) + ' what?', 'sys'); return; }
    const it = item(m.id);
    if (it.type !== 'potion' && it.type !== 'food') {
      print(how === 'eat' ? 'You gnaw on the ' + it.name + ' briefly. It is not food.' : "You can't drink the " + it.name + '.', 'sys');
      return;
    }
    removeInv(m.id);
    const before = { hp: S.hp, mp: S.mp };
    if (it.heal) S.hp = Math.min(maxHp(), S.hp + it.heal);
    if (it.mana) S.mp = Math.min(maxMp(), S.mp + it.mana);
    if (it.cure) S.poison = 0;
    // Some potions leave a lasting effect, remembered as a flag (e.g. breathing underwater).
    if (it.setFlag) S.flags[it.setFlag] = true;
    if (it.use) print(it.use, 'heal');
    else print('You ' + (it.type === 'food' ? 'eat' : 'drink') + ' the ' + it.name + '. (+' + (S.hp - before.hp) + ' health' + (it.mana ? ', +' + (S.mp - before.mp) + ' mana' : '') + ')', 'heal');
    if (C) enemyTurn();
  }

  // Casts a spell if you have enough mana. A "switch" statement picks which
  // block of code to run based on a value, here the spell's type: each
  // "case" handles one type, and "return" ends the function after it.
  function castSpell(id) {
    const sp = D.SPELLS[id];
    if (S.mp < sp.mp) { print('You need ' + sp.mp + ' mana to cast ' + sp.name + ', but you only have ' + S.mp + '.', 'sys'); return; }
    switch (sp.type) {
      case 'attack': {
        if (!C) {
          const en = S.enemies[S.room];
          if (!en) { print('You have nothing to aim ' + sp.name + ' at.', 'sys'); return; }
          startCombat(en, false);
        }
        S.mp -= sp.mp;
        let dmg = Math.round(rand(sp.dmg[0], sp.dmg[1]) * spellPower());
        if (sp.undead && C.e.undead) dmg *= sp.undead;
        C.hp -= dmg;
        print(fill(sp.msg, { e: C.the, d: dmg }), 'magic');
        if (sp.freeze && C.hp > 0 && chance(sp.freeze)) { C.frozen = true; print(C.The + ' is frozen in place!', 'magic'); }
        afterPlayerTurn();
        return;
      }
      case 'poison': {
        if (!C) {
          const en = S.enemies[S.room];
          if (!en) { print('You coat your blades in venom, then wipe them off again. Nothing here to stab.', 'sys'); return; }
          startCombat(en, false);
        }
        S.mp -= sp.mp;
        C.poison = sp.turns;
        C.poisonDmg = sp.tick + Math.floor(S.level / 2);
        print(sp.msg || 'You coat your weapon in green venom and strike!', 'magic');
        playerAttack();
        afterPlayerTurn();
        return;
      }
      case 'heal': {
        if (S.hp >= maxHp() && !S.poison) { print('You are already at full health.', 'sys'); return; }
        S.mp -= sp.mp;
        const amount = Math.round(sp.amount * (S.cls === 'mage' ? spellPower() : 1));
        const before = S.hp;
        S.hp = Math.min(maxHp(), S.hp + amount);
        if (id === 'heal' || sp.cure) S.poison = 0;
        print('You cast ' + sp.name + '. Warmth floods through you. (+' + (S.hp - before) + ' health)', 'heal');
        if (C) enemyTurn();
        return;
      }
      case 'light': {
        if (!room().dark || isLit()) { print('Light flares from your palm, impressing nobody. It is bright enough here already.', 'magic'); return; }
        S.mp -= sp.mp;
        S.flags['lit_' + S.room] = true;
        print('A globe of soft white light blooms above your head and settles into the ceiling, where it will stay.', 'magic');
        describeRoom();
        return;
      }
      case 'knock': {
        const r = room();
        if (!r.on || !r.on.knock) { print('Your spell finds nothing locked here and wanders off, embarrassed.', 'magic'); return; }
        S.mp -= sp.mp;
        r.on.knock(api);
        return;
      }
      default: print('Nothing happens.', 'sys');
    }
  }

  // ===================================================================== UI
  // "UI" = User Interface: everything the player sees and clicks.
  // setBar(): sets a health/mana/XP bar's colored fill to the right
  // percentage width and writes the numbers on it (e.g. "30 / 42").
  function setBar(fillId, textId, cur, max) {
    const pct = max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0;
    $(fillId).style.width = pct + '%';
    $(textId).textContent = Math.max(0, cur) + ' / ' + max;
  }

  // Creates a new <button> element in code. The command it sends is stored
  // in "dataset.cmd" (the button's data-cmd attribute) for the click
  // listener in init() to read. "title" is the tooltip shown on hover.
  function button(label, cmd, cls, title) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.dataset.cmd = cmd;
    if (cls) b.className = cls;
    if (title) b.title = title;
    return b;
  }

  // Refreshes the whole screen after every command: character sheet, bars,
  // picture, enemy panel, compass buttons, quick actions, inventory, spells
  // and map. Redrawing everything each time keeps the screen in step with
  // the game state, at the cost of a little extra work.
  function updateUI() {
    if (!S) return;
    const c = D.CLASSES[S.cls];
    S.hp = Math.min(S.hp, maxHp());
    $('char-name').textContent = S.name;
    $('char-class').textContent = 'Level ' + S.level + ' ' + c.name;
    setBar('hp-fill', 'hp-text', S.hp, maxHp());
    setBar('mp-fill', 'mp-text', S.mp, maxMp());
    setBar('xp-fill', 'xp-text', S.xp, xpNext());
    $('hp-fill').classList.toggle('low', S.hp <= maxHp() * 0.3);
    $('poison-tag').hidden = !S.poison;
    const w = item(S.weapon);
    $('stat-gold').textContent = S.gold;
    $('stat-atk').textContent = (w.dmg[0] + S.str) + '-' + (w.dmg[1] + S.str);
    $('stat-def').textContent = defense();
    $('eq-weapon').textContent = w.name;
    $('eq-armor').textContent = (S.armor ? item(S.armor).name : 'none') + (S.amulet ? ', ' + item(S.amulet).name : '');
    $('location').textContent = room().name;

    // Scene art + enemy panel
    const r = room();
    $('scene').textContent = C ? D.ART[C.e.art] || '' : (isLit() ? D.ART[r.art] || '' : D.ART.dark);
    $('scene').classList.toggle('enemy', !!C);
    $('enemy-panel').hidden = !C;
    if (C) {
      $('enemy-name').textContent = cap(C.e.name) + (C.frozen ? ' (frozen)' : '') + (C.poison ? ' (poisoned)' : '');
      setBar('enemy-fill', 'enemy-text', Math.max(0, C.hp), C.max);
    }

    // Compass
    const ex = exitsOf(S.room);
    document.querySelectorAll('#compass button[data-dir]').forEach((b) => { b.disabled = !!C || !ex[b.dataset.dir]; });

    // Context actions
    const act = $('actions');
    act.replaceChildren();
    if (C) {
      act.append(button('⚔ Attack', 'attack', 'danger'), button('🛡 Defend', 'defend'), button('🏃 Flee', 'flee'));
      if (S.inv.includes('healing_potion')) act.append(button('Drink potion', 'drink healing potion', 'good'));
      else if (S.inv.includes('greater_healing')) act.append(button('Drink big potion', 'drink greater healing potion', 'good'));
      if (S.inv.includes('mana_potion')) act.append(button('Drink mana', 'drink mana potion', 'magic'));
      if (S.inv.includes('holy_water') && C.e.undead) act.append(button('Throw holy water', 'throw holy water', 'magic'));
      if (S.inv.includes('bog_fire')) act.append(button('Throw bog fire', 'throw bog fire', 'danger'));
    } else {
      act.append(button('Look', 'look'));
      const npc = npcHere();
      if (npc) act.append(button('Talk to ' + npc.name, 'talk'));
      if (S.enemies[S.room]) act.append(button('Attack', 'attack', 'danger'));
      if (r.shop) act.append(button('Shop', 'list', 'gold'));
      if (isLit() && S.items[S.room].length) act.append(button('Take all', 'take all', 'gold'));
      if (S.room === 'tavern') act.append(button('Rest (5g)', 'rest', 'good'));
      if (r.on && r.on.pray) act.append(button('Pray', 'pray', 'good'));
      if (S.room === 'bridge' && S.enemies[S.room] && !S.flags.troll_paid) act.append(button('Pay toll (15g)', 'pay', 'gold'));
      if (S.room === 'throne_room' && !S.flags.throne_moved) act.append(button('Push throne', 'push throne'));
      if (S.room === 'bone_pit' && !S.flags.phylactery_destroyed && !S.enemies[S.room]) act.append(button('Smash the jar', 'smash jar', 'danger'));
      // Any room can add its own buttons with actions(g), returning a list
      // like [{ label: 'Ring the bell', cmd: 'ring bell', cls: 'magic' }].
      if (r.actions) for (const a of r.actions(api) || []) act.append(button(a.label, a.cmd, a.cls));
      act.append(button('Help', 'help'));
    }

    // Inventory
    const inv = $('inv-list');
    inv.replaceChildren();
    const counts = {};
    S.inv.forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
    if (!S.inv.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'Nothing but lint.'; inv.append(li); }
    for (const [id, n] of Object.entries(counts)) {
      const it = item(id);
      const verb = { potion: 'drink', food: 'eat', scroll: 'read', note: 'read', weapon: 'equip', armor: 'equip', amulet: 'equip', throw: 'throw', recipe: 'read' }[it.type] || 'examine';
      const li = document.createElement('li');
      li.append(button(cap(it.name) + (n > 1 ? ' ×' + n : ''), verb + ' ' + it.name, 'item ' + it.type, verb + ': ' + it.desc));
      inv.append(li);
    }

    // Spells
    const sl = $('spell-list');
    sl.replaceChildren();
    if (!S.spells.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'No spells known.'; sl.append(li); }
    for (const id of S.spells) {
      const sp = D.SPELLS[id];
      const li = document.createElement('li');
      const b = button(sp.name + ' (' + sp.mp + ' MP)', 'cast ' + sp.kw[0], 'spell', sp.desc);
      b.disabled = S.mp < sp.mp;
      li.append(b);
      sl.append(li);
    }

    // Quests: one line per unfinished quest. Clicking it prints the full journal.
    const ql = $('quest-list');
    if (ql) {
      ql.replaceChildren();
      const open = Object.keys(D.QUESTS).filter((id) => { const st = questStage(id); return st > 0 && st < D.QUESTS[id].done; });
      if (!open.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'No open quests.'; ql.append(li); }
      for (const id of open) {
        const li = document.createElement('li');
        li.append(button(D.QUESTS[id].name, 'journal', 'quest', D.QUESTS[id].stages[questStage(id)]));
        ql.append(li);
      }
    }

    drawMap();
  }

  // Draws the map on the <canvas>. "ctx" (context) is the canvas's drawing
  // toolkit. The current room is drawn in the center; other visited rooms on
  // the same level sit around it, joined by lines for their exits. Short
  // stubs show exits to places not yet visited. "dpr" (device pixel ratio)
  // keeps the drawing sharp on high-resolution screens.
  function drawMap() {
    const cv = $('map');
    const ctx = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth || 240;
    const h = cv.clientHeight || 200;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const cur = room();
    const STEP = 30; const BOX = 16;
    const pos = (r) => [w / 2 + (r.x - cur.x) * STEP, h / 2 + (r.y - cur.y) * STEP];
    const same = Object.keys(S.visited).filter((id) => D.ROOMS[id].z === cur.z);
    const delta = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };

    ctx.lineWidth = 2;
    for (const id of same) {
      const r = D.ROOMS[id];
      const [x, y] = pos(r);
      for (const [d, to] of Object.entries(exitsOf(id))) {
        if (!delta[d]) continue;
        const t = D.ROOMS[to];
        if (S.visited[to] && t.z === cur.z) {
          const [tx, ty] = pos(t);
          ctx.strokeStyle = '#5a4e66';
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
        } else {
          ctx.strokeStyle = '#3a3247';
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + delta[d][0] * STEP * 0.5, y + delta[d][1] * STEP * 0.5); ctx.stroke();
        }
      }
    }
    for (const id of same) {
      const r = D.ROOMS[id];
      const [x, y] = pos(r);
      const isCur = id === S.room;
      ctx.fillStyle = isCur ? '#e0b44c' : (S.enemies[id] ? '#7a3b3b' : '#4a4058');
      ctx.fillRect(x - BOX / 2, y - BOX / 2, BOX, BOX);
      if (isCur) { ctx.strokeStyle = '#fff3c4'; ctx.lineWidth = 1.5; ctx.strokeRect(x - BOX / 2 - 2, y - BOX / 2 - 2, BOX + 4, BOX + 4); ctx.lineWidth = 2; }
      const ex = exitsOf(id);
      ctx.fillStyle = isCur ? '#1a1620' : '#d8cfc0';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const mark = (ex.u ? '▲' : '') + (ex.d ? '▼' : '');
      if (mark) ctx.fillText(mark, x, y + 1);
    }
    $('map-label').textContent = LEVEL_NAMES[cur.z] || '';
  }

  // ========================================================= SCREENS/MODAL
  // Shows the pop-up box with a title, some paragraphs and a row of buttons.
  // Each button is given a function ("action") to run when clicked.
  function showModal(title, paragraphs, buttons) {
    $('modal-title').textContent = title;
    const body = $('modal-body');
    body.replaceChildren(...paragraphs.map((t) => { const p = document.createElement('p'); p.textContent = t; return p; }));
    const bar = $('modal-buttons');
    bar.replaceChildren();
    buttons.forEach((b, i) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.textContent = b.label;
      if (i === 0) el.className = 'primary';
      el.addEventListener('click', b.action);
      bar.append(el);
    });
    $('modal').hidden = false;
    const first = bar.querySelector('button');
    if (first) first.focus();
  }
  function hideModal() { $('modal').hidden = true; }

  // Which class card the player has clicked on the start screen (none yet).
  let chosenClass = null;
  // Shows the start screen, offers "Continue" only if a valid save exists,
  // and fills in the Hall of Records.
  function showStart() {
    S = null; C = null;
    $('app').hidden = true;
    $('start').hidden = false;
    $('continue-btn').hidden = !readSave();
    renderRecords();
    $('start-art').textContent = D.ART.title;
    chosenClass = null;
    document.querySelectorAll('.class-card').forEach((b) => b.classList.remove('selected'));
    $('begin-btn').disabled = true;
  }

  // Switches from the start screen to the game. For a new game it shows the
  // story intro and counts it in the Hall of Records; for a loaded game it
  // says "Welcome back".
  function beginGame(state, isNew) {
    S = state;
    C = null;
    $('start').hidden = true;
    $('app').hidden = false;
    $('output').replaceChildren();
    if (isNew) {
      S.hp = maxHp(); S.mp = maxMp();
      updateRecords((r) => { r.started++; });
      noteLevel();
      print('ASHES OF HOLLOWMERE', 'room-title');
      print('For twenty years, Castle Duskholm has brooded on the ridge above the village of Hollowmere. Its king, Varkhul, wanted to live forever. He managed it — technically — as the Hollow King, a lich whose curse drags the dead out of their graves every night.', 'desc');
      print('You are ' + S.name + ' the ' + D.CLASSES[S.cls].name + '. You arrived in Hollowmere this morning looking for work. The villagers took one look at you and decided that you were the work.', 'desc');
      print("Type 'help' for commands, or use the buttons. Talk to the villagers — they know more than they look.", 'sys');
    } else {
      print('Welcome back, ' + S.name + '.', 'sys');
    }
    print('', 'spacer');
    describeRoom();
    autosave();
    updateUI();
    scrollOutput();
    $('cmd').focus();
  }

  // Loads the saved game (only if it passes validation).
  function loadGame() {
    const s = readSave();
    if (!s) { showStart(); return; }
    beginGame(s, false);
  }

  // ================================================================ WIRE-UP
  // "Wiring up" means connecting the HTML page to the code: telling the
  // browser which function to run when a button is clicked, a form is
  // submitted, or a key is pressed.
  // Clickjacking defence: GitHub Pages can't send the frame-ancestors header,
  // so refuse to run if another site has loaded the game inside a frame.
  function isFramed() {
    try { return window.top !== window.self; } catch (e) { return true; }
  }
  function showFramedNotice() {
    document.body.replaceChildren();
    const box = document.createElement('div');
    box.className = 'screen';
    const p = document.createElement('p');
    p.textContent = 'For your safety, Ashes of Hollowmere does not run inside other websites.';
    const a = document.createElement('a');
    a.href = window.location.href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = 'Open the game in its own tab';
    box.append(p, a);
    document.body.append(box);
  }

  // init() ("initialize") runs once when the page loads. It builds the class
  // cards and attaches all the event listeners. "addEventListener('click', ...)"
  // means "when this is clicked, run this code". "ev.preventDefault()" stops
  // the browser's default reaction to a form submit, which would reload the page.
  function init() {
    if (isFramed()) { showFramedNotice(); return; }
    // Class cards
    const cards = $('class-cards');
    for (const [id, c] of Object.entries(D.CLASSES)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'class-card';
      b.dataset.cls = id;
      const h = document.createElement('h3'); h.textContent = c.name;
      const p = document.createElement('p'); p.textContent = c.blurb;
      const st = document.createElement('p'); st.className = 'card-stats';
      st.textContent = 'HP ' + c.hp + ' · MP ' + c.mp + ' · STR ' + c.str + ' · DEF ' + c.def;
      const pk = document.createElement('p'); pk.className = 'card-perk'; pk.textContent = c.perk;
      b.append(h, p, st, pk);
      b.addEventListener('click', () => {
        chosenClass = id;
        document.querySelectorAll('.class-card').forEach((x) => x.classList.toggle('selected', x === b));
        $('begin-btn').disabled = false;
      });
      cards.append(b);
    }
    $('start-form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      if (!chosenClass) return;
      beginGame(newState(cleanName($('hero-name').value), chosenClass), true);
    });
    $('continue-btn').addEventListener('click', loadGame);
    $('clear-records-btn').addEventListener('click', () => {
      showModal('Clear the Hall of Records?', ['Your lifetime stats will be wiped. Your saved game will not be affected.'], [
        { label: 'Yes, clear them', action: () => { hideModal(); try { localStorage.removeItem(RECORDS_KEY); } catch (e) { /* ignore */ } renderRecords(); } },
        { label: 'Cancel', action: hideModal },
      ]);
    });

    // Command line
    $('cmd-form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const v = $('cmd').value;
      $('cmd').value = '';
      if (v.trim()) { hist.push(v.trim()); if (hist.length > 50) hist.shift(); histPos = hist.length; }
      run(v);
    });
    $('cmd').addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowUp' && hist.length) { histPos = Math.max(0, histPos - 1); $('cmd').value = hist[histPos]; ev.preventDefault(); }
      if (ev.key === 'ArrowDown' && hist.length) { histPos = Math.min(hist.length, histPos + 1); $('cmd').value = hist[histPos] || ''; ev.preventDefault(); }
    });

    // Any button with data-cmd runs that command.
    document.addEventListener('click', (ev) => {
      const b = ev.target.closest('button[data-cmd], button[data-dir]');
      if (!b || !S || b.disabled) return;
      run(b.dataset.cmd || DIR_NAMES[b.dataset.dir]);
      if (window.matchMedia('(pointer: fine)').matches) $('cmd').focus();
    });
    window.addEventListener('resize', () => { if (S) drawMap(); });

    showStart();
  }

  // Start everything once the browser has finished reading the HTML page
  // ("DOMContentLoaded"), so all the elements game.js needs already exist.
  document.addEventListener('DOMContentLoaded', init);
})();
