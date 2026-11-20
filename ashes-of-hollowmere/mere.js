/* Ashes of Hollowmere — expansion region: THE DROWNED MERE.
   Ten new places west of the Whispering Woods, with their own monsters,
   items, spells, people and puzzles, plus a boss: the Drowned Queen.
   Loaded after rooms.js and systems.js, and before game.js. */
'use strict';
// ============================================================================
// WHAT THIS FILE IS (a beginner's guide)
// ============================================================================
// The original game keeps its content in data.js (things) and rooms.js
// (places). This expansion keeps ALL of its new content in this one file, so
// it can be added or removed without touching the originals. It works by
// ADDING entries to the same catalogue, window.GameData:
//
//   Object.assign(target, extra) copies every property of "extra" into
//   "target". So Object.assign(D.ITEMS, { ... }) adds new items to the
//   existing item list without replacing the old ones.
//
// The only changes to original places are small and additive: the woods get
// a new exit west (into the reeds), and Old Nettle's hut gets a cauldron.
//
// HOW THE REGION FITS TOGETHER
//   Woods -> Reed Path -> Mere Shore (the hub)
//     Shore north:  Odda's fishing hut (quests, the ferry)
//     Shore south:  the Drowned Village (a keepsake, a recipe page)
//     Reeds south:  the Bog (dark) -> Grizel's Hollow (the witch, a cauldron)
//     Shore west:   the Causeway (lever puzzle) -> the Bell Tower
//     Tower down:   the Sunken Chapel (needs a water-breathing draught)
//     Chapel north: the Mere Depths, once the bell is rung (the boss)
//
// FLAGS this file uses (true/false notes saved with the game):
//   causeway_raised, lever_oiled, oyster_opened, water_breathing,
//   bell_rung, queen_rest, laid_<keepsake id>
// ============================================================================
(function () {
  const D = window.GameData;
  // Same helpers as rooms.js and data.js (each file keeps its own copies).
  const has = (noun, re) => re.test(noun || '');
  const a = (s) => s.replace(/^\n/, '').replace(/\n\s*$/, '');

  // ---------------------------------------------------------------- VERBS
  // New words the player can type. Each list maps onto one command. The game
  // never lets these replace a word it already knows.
  //   'give'  - so "place locket on shrine" or "lay doll" work like give
  //   'ring'  - ring the drowned bell
  //   'oil'   - oil the rusty lever
  //   'dive'  - dive into the water at the bell tower
  //   'ferry' - ask Odda to row you across
  D.EXTRA_VERBS = Object.assign(D.EXTRA_VERBS || {}, {
    give: ['place', 'lay', 'leave', 'return'],
    ring: ['ring', 'toll', 'clang'],
    oil: ['oil', 'grease', 'lubricate', 'pour'],
    dive: ['dive', 'plunge', 'submerge'],
    ferry: ['ferry', 'row', 'sail', 'boat'],
  });

  // ------------------------------------------------------------------ ART
  Object.assign(D.ART, {
    mere: a(String.raw`
       ~    ~        |>       ~     ~
            ~      _/_\_          ~
     ~           |  _  |    ~
         ~       | | | |         ~
   ~~~~~~~~~~~~~~|_|_|_|~~~~~~~~~~~~~~
    ~  ~    ~  ~   ~~~   ~   ~   ~  ~
   ''' ''  '''  ''   ''' ''  '''   ''
`),
    reeds: a(String.raw`
     |  ||   | ||  |   ||  |  | ||
     || | |  ||  | ||  | | ||  | |
    \|/ |/  \|/ \| |/ \|/ |/ \|/  |/
   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     ~   ~    ~    ~    ~    ~   ~
`),
    bog: a(String.raw`
        .   o       .    o    .
     o    ~~~~   .     ~~~~     o
       ~~(    )~~~  ~~(    )~~
     ~~~  ~~~~    ~~~   ~~~~  ~~~
       ,,  \|/  ,,, \|/  ,,  \|/
`),
    witch: a(String.raw`
              (  )   (
               )  (   )
           ____|__|___|___
          /   _______    /\
         /   (~~~~~~~)  /  \
        /____ \_____/ _/____\
         | []  |   |  [] |
`),
    drowned: a(String.raw`
          /\        /\
         /  \  ~~  /  \   ~~
    ~~~~|_[]_|~~~~|_[]_|~~~~~~
    ~  ~  ~~  ~  ~   ~~  ~   ~
      ~~    ~   ~~~    ~   ~~
`),
    sunken: a(String.raw`
     ~   o    _____     o   ~
       o     /     \      o
     ~      |  ___  |   ~
         o  | /   \ |  o
     ~      | \___/ |      ~
        o   |_______|   o
`),
    leech: a(String.raw`
           ____________
       ___/  o         \___
      (___    ))))))     __)
          \____________/
`),
    wisp: a(String.raw`
                 .
             .  ( )  .
               (   )
             .  ( )  .
                 '
`),
    drowned_one: a(String.raw`
           ~~~~~~~
          / -   - \
         |    o    |
          \ ~~~~~ /
        ___\_____/___
       ~  |  ~ ~  |  ~
          |_______|
`),
    serpent: a(String.raw`
              ____
            /  o  \___
           |    ___   >~
     ~~~~~  \__/   \___
    ~  ~~~~\__     ___/~~~~
     ~   ~    \___/   ~  ~
`),
    hag: a(String.raw`
            /\
           /  \
          /____\
         ( o  o )
          \ /\ /
       ___/\__/\___
      /  /|    |\  \
        ~ |____| ~
`),
    queen: a(String.raw`
            _ /\ _ /\ _
           | V  V  V  |
           \ ~  ~  ~  /
          (  (o)  (o)  )
           \    __    /
        ~~~~\  \__/  /~~~~
      ~~  ~~ \______/ ~~  ~~
     ~   ~  ~ ~ ~~ ~ ~  ~   ~
`),
  });

  // --------------------------------------------------------------- SPELLS
  // All three use spell types the engine already knows (attack, poison, heal).
  Object.assign(D.SPELLS, {
    tidecall: { name: 'Tidecall', kw: ['tidecall', 'tide', 'wave', 'water'], mp: 9, type: 'attack', dmg: [12, 18], freeze: 0.2,
      msg: 'A wall of black water rises out of nowhere and crashes down on {e} for {d} damage!',
      desc: 'Drowns your enemy under a crashing wave. A small chance to leave it stunned.' },
    mire_grasp: { name: 'Mire Grasp', kw: ['mire', 'grasp', 'mud'], mp: 7, type: 'poison', turns: 3, tick: 6,
      msg: 'Cold mud boils up around your weapon. You strike, and the mire clings to the wound!',
      desc: 'Strike with a mud-soaked weapon. The mire keeps hurting the enemy for 3 turns.' },
    purify: { name: 'Purify', kw: ['purify', 'cleanse', 'pure'], mp: 6, type: 'heal', amount: 22, cure: true,
      desc: 'Clear water washes through you. Restores 22 health and cures poison.' },
  });

  // ---------------------------------------------------------------- ITEMS
  // New item types: 'ingredient' (used in recipes), 'recipe' (read it to learn
  // recipes), and 'keepsake' (quest items for the shrine).
  Object.assign(D.ITEMS, {
    // --- Ingredients ---
    bog_myrtle: { name: 'sprig of bog myrtle', kw: ['myrtle', 'bog', 'sprig', 'herb'], type: 'ingredient', value: 4,
      desc: 'A resinous little shrub that smells like a pine tree that has been to a party. A brewing ingredient.' },
    mallow_root: { name: 'marsh mallow root', kw: ['mallow', 'root', 'marsh'], type: 'ingredient', value: 4,
      desc: 'A pale, sticky root. Sweet, soothing, and the base of most healing brews. A brewing ingredient.' },
    leech_oil: { name: 'vial of leech oil', kw: ['oil', 'leech', 'vial'], type: 'ingredient', value: 6,
      desc: 'Thick, dark and slippery. It gets into everything, including rusty hinges. A brewing ingredient.' },
    wisp_dust: { name: 'pinch of wisp dust', kw: ['dust', 'wisp', 'pinch'], type: 'ingredient', value: 8,
      desc: 'Faintly glowing dust left behind by a will-o\'-wisp. It tingles. A brewing ingredient.' },
    drowned_pearl: { name: 'drowned pearl', kw: ['pearl', 'drowned', 'grey'], type: 'ingredient', value: 15,
      desc: 'A grey pearl, cold as the bottom of the mere. Brewers say it remembers how to breathe water. A brewing ingredient.' },

    // --- Things you brew or buy ---
    marsh_salve: { name: 'marsh salve', kw: ['salve', 'marsh', 'ointment'], type: 'potion', heal: 25, cure: true, value: 12,
      desc: 'A green, sharp-smelling ointment in a clamshell. Restores 25 health and cures poison.',
      use: 'You smear the marsh salve on your wounds. It stings like a scolding, then soothes like an apology. (+25 health, poison cured)' },
    breathing_draught: { name: 'water-breathing draught', kw: ['breathing', 'water', 'draught', 'breath'], type: 'potion', value: 30, setFlag: 'water_breathing',
      desc: 'A cloudy grey potion with a pearl dissolving at the bottom. Drink it and you can breathe underwater.',
      use: 'You drink the draught. It tastes of rain and river stones. Your throat goes cold, and when you breathe in, it feels as if you could breathe anything. (You can now breathe underwater.)' },
    bog_fire: { name: 'flask of bog fire', kw: ['bog', 'fire', 'flask', 'firebomb'], type: 'throw', dmg: 26, dmgLiving: 22, value: 20,
      hitMsg: 'The flask bursts over {e} in a sheet of eerie green flame! ({d} damage)',
      weakMsg: 'The flask bursts over {e} in a sheet of eerie green flame! ({d} damage)',
      desc: "Leech oil and wisp dust, corked in a flask. 'throw' it at anything for about 22 damage (26 against the undead)." },
    smoked_eel: { name: 'smoked eel', kw: ['eel', 'smoked', 'fish'], type: 'food', heal: 14, value: 4,
      desc: "Odda's smoked eel. Chewy, salty and better than it looks.",
      use: 'You eat the smoked eel. It fights you all the way down, but it is surprisingly good. (+14 health)' },

    // --- Scrolls ---
    scroll_tidecall: { name: 'scroll of tidecall', kw: ['scroll', 'tidecall', 'tide', 'wave'], type: 'scroll', spell: 'tidecall', value: 35,
      desc: "A water-stained scroll that is somehow still dripping. 'read' it to learn Tidecall." },
    scroll_mire: { name: 'scroll of mire grasp', kw: ['scroll', 'mire', 'grasp', 'mud'], type: 'scroll', spell: 'mire_grasp', value: 30,
      desc: "A scroll written in mud on birch bark. 'read' it to learn Mire Grasp." },
    scroll_purify: { name: 'scroll of purify', kw: ['scroll', 'purify', 'cleanse'], type: 'scroll', spell: 'purify', value: 30,
      desc: "A scroll that smells of clean rain. 'read' it to learn Purify." },

    // --- Recipe page ---
    recipe_page: { name: 'waterlogged recipe page', kw: ['page', 'recipe', 'waterlogged', 'paper'], type: 'recipe', value: 0,
      teaches: ['healing_draught', 'mana_draught', 'greater_draught'],
      desc: "A soggy page from a village healer's book. 'read' it to learn its recipes.",
      text: "Most of the ink has run, but three recipes survive. HEALING: two mallow roots, boiled down. MANA: one mallow root and a pinch of wisp dust. GREATER HEALING: two mallow roots and a drowned pearl — 'simmer until it stops screaming.' All want a proper cauldron. — Hester, healer of Mereside" },

    // --- Keepsakes (for "Rest for the Drowned") ---
    keepsake_locket: { name: 'tarnished locket', kw: ['locket', 'tarnished', 'keepsake'], type: 'keepsake', value: 0,
      desc: "A tarnished locket. Inside, a tiny painting of a smiling girl and the words 'For Bet, from Tam'. A keepsake of the drowned." },
    keepsake_doll: { name: 'rag doll', kw: ['doll', 'rag', 'keepsake', 'toy'], type: 'keepsake', value: 0,
      desc: 'A sodden rag doll with button eyes and a stitched-on smile. A keepsake of the drowned.' },
    keepsake_ring: { name: "Old Jory's wedding band", kw: ['band', 'wedding', 'jory', 'jorys', 'copper', 'keepsake'], type: 'keepsake', value: 0,
      desc: 'A plain copper band, worn thin by years of rope and net. A keepsake of the drowned.' },

    // --- The relic ---
    mere_tear: { name: 'Tear of the Mere', kw: ['tear', 'mere', 'amulet', 'jewel', 'relic'], type: 'amulet', def: 2, hp: 15, mp: 10, value: 0,
      desc: "A blue jewel shaped like a teardrop, always cold, always faintly wet. Queen Elspeth's last tear. The Hollow King once loved her, and it is said he cannot stand against her grief. (+15 max health, +10 max mana, +2 defense)" },
  });

  // -------------------------------------------------------------- ENEMIES
  Object.assign(D.ENEMIES, {
    bog_leech: { name: 'bog leech', kw: ['leech', 'bog'], hp: 22, dmg: [2, 5], def: 0, xp: 14, gold: [0, 2], art: 'leech', aggressive: true, drain: 3,
      drops: [{ id: 'leech_oil', chance: 0.7 }],
      intro: 'The mud heaves, and a leech as long as your leg flops out of it, mouth first!',
      hits: ['The leech latches on and sucks ({d} damage).', 'The leech slaps you with its whole slimy body ({d} damage).'] },
    will_o_wisp: { name: "will-o'-wisp", kw: ['wisp', 'will', 'light', 'willowisp'], hp: 18, dmg: [3, 6], def: 4, xp: 18, gold: [0, 0], art: 'wisp', aggressive: true, drain: 4,
      drops: [{ id: 'wisp_dust', chance: 0.8 }],
      intro: "A pretty little light bobs toward you over the water. Then it shows you its teeth. A will-o'-wisp!",
      hits: ['The wisp flares in your eyes and burns ({d} damage).', 'The wisp darts through you, leaving you cold and dizzy ({d} damage).'] },
    drowned_one: { name: 'drowned villager', kw: ['drowned', 'villager', 'corpse', 'dead', 'one'], hp: 30, dmg: [3, 8], def: 2, xp: 24, gold: [1, 6], art: 'drowned_one', aggressive: true, undead: true,
      drops: [{ id: 'drowned_pearl', chance: 0.4 }],
      intro: 'Water pours from its mouth as it rises: a drowned villager, eyes milky, still wearing its Sunday best. It reaches for you.',
      hits: ['The drowned villager grips you with cold, wrinkled hands ({d} damage).', 'The drowned villager vomits mere-water over you, then bites ({d} damage).'] },
    mire_serpent: { name: 'mire serpent', kw: ['serpent', 'snake', 'mire', 'eel'], hp: 40, dmg: [4, 9], def: 3, xp: 34, gold: [0, 0], art: 'serpent', aggressive: true, poison: 0.35,
      drops: [{ id: 'leech_oil', chance: 0.5 }],
      intro: 'The water by the causeway bulges, and a serpent thick as a barrel rears out of it, hissing like a kettle!',
      hits: ['The serpent strikes, fangs first ({d} damage).', 'The serpent coils around you and squeezes ({d} damage).'] },
    marsh_hag: { name: 'marsh hag', kw: ['hag', 'marsh', 'crone', 'witch'], hp: 50, dmg: [5, 9], def: 2, xp: 45, gold: [8, 18], art: 'hag', aggressive: true, drain: 4,
      drops: [{ id: 'scroll_tidecall', chance: 1 }, { id: 'wisp_dust', chance: 1 }],
      intro: "A hunched figure in a cloak of weed turns from the broken window. 'Grizel sent you, did she? My sister always did have terrible friends.'",
      hits: ['The marsh hag rakes you with black nails ({d} damage).', 'The hag spits a curse that lands like a slap ({d} damage).'],
      death: "The marsh hag shrieks, collapses into a heap of wet weed, and is gone. Something tells you Grizel won't be sending flowers." },
    // THE BOSS. special: 'queen' tells game.js to use her rules (see SPECIALS
    // in game.js): she drags you under every fourth turn, and the drowned mend
    // her once when she is badly hurt. She drops the Tear of the Mere.
    drowned_queen: { name: 'the Drowned Queen', proper: true, kw: ['queen', 'drowned', 'elspeth'], hp: 90, dmg: [6, 11], def: 3, xp: 150, gold: [20, 40], art: 'queen', aggressive: true, undead: true, special: 'queen',
      drops: [{ id: 'mere_tear', chance: 1 }],
      intro: "The water darkens, and a woman in a rotting gown of royal blue drifts up from the deep, a drowned crown woven into her hair. 'Varkhul?' she asks. Then she sees you are not him, and her face twists. 'He promised he would come back for me.'",
      hits: ["The Drowned Queen's cold fingers close around your throat ({d} damage).", 'A current of grief slams into you ({d} damage).', 'The Queen screams, and the water itself hits you ({d} damage).'],
      death: '"Tell him," she says, softer now, "that I waited." Her shape comes apart like silt in a current. Where her heart was, a single blue tear hangs in the water, then drifts into your hand.' },
  });

  // ---------------------------------------------------------- PUZZLE HELPERS
  // THE CAUSEWAY: raise the sunken stones by pulling the rusty lever.
  // Warriors can force it; anyone can oil it first; the Knock spell works too.
  function raiseCauseway(g, how) {
    g.set('causeway_raised');
    g.print(how, 'loot');
    g.print('With a long groan and a burst of bubbles, a line of slick stones rises out of the mere, leading west toward the bell tower.', 'desc');
    g.xp(20);
    return true;
  }

  // THE SHRINE: lay a keepsake to rest. When all three are laid, the drowned
  // give you a gift. The quest stage is 1 + the number laid so far.
  const KEEPSAKES = ['keepsake_locket', 'keepsake_doll', 'keepsake_ring'];
  function laySakes(g, itemId) {
    g.take(itemId);
    g.set('laid_' + itemId);
    const laid = KEEPSAKES.filter((k) => g.flag('laid_' + k)).length;
    const lines = {
      keepsake_locket: "You lay the locket on the stones. For a moment, two shapes stand at the water's edge, holding hands. Then they are gone.",
      keepsake_doll: 'You lay the rag doll on the stones. Somewhere, very faintly, a child laughs, and the reeds stop whispering for a while.',
      keepsake_ring: 'You lay the wedding band on the stones. An old man in oilskins nods to you from a boat that is not there, and rows away into the mist.',
    };
    g.print(lines[itemId], 'magic');
    if (laid >= 3) {
      g.quest('drowned', 4);
      g.print('The shrine glows softly. On the top stone, where there was nothing a moment ago, lies a scroll that smells of clean rain.', 'loot');
      g.give('scroll_purify');
      g.xp(40);
    } else {
      g.quest('drowned', 1 + laid);
      g.xp(10);
    }
    return true;
  }

  // ------------------------------------------------------------------ ROOMS
  Object.assign(D.ROOMS, {
    reed_path: {
      name: 'The Reed Path', x: -2, y: -2, z: 0, art: 'reeds',
      desc: 'A boardwalk of half-rotten planks winds through reeds taller than you are. Every step squelches. The mere glints through the reeds to the west; the trees of the Whispering Woods are east. A muddier track sinks south into the bog.',
      exits: { e: 'woods', w: 'mere_shore', s: 'bog' },
      items: ['bog_myrtle', 'bog_myrtle'],
      encounter: { chance: 0.3, pool: ['bog_leech', 'will_o_wisp'] },
      features: [{ kw: ['reeds', 'reed', 'planks', 'boardwalk'], text: 'Someone built this boardwalk long ago and nobody has fixed it since. A few planks have bite marks.' }],
    },

    mere_shore: {
      name: 'Shore of the Mere', x: -3, y: -2, z: 0, art: 'mere',
      desc(g) {
        let s = 'The mere stretches away under the mist, flat and black as a slate. Far out on the water stands a lonely bell tower, all that is left of the village of Mereside. ';
        s += g.flag('queen_rest') ? 'The water is calm now, almost peaceful. ' : 'Now and then, from somewhere deep below, comes the slow toll of a bell. ';
        s += 'At the water\'s edge, someone has piled flat stones into a little shrine. A fishing hut stands north; a drowned village wades into the water to the south; an old causeway runs west. The reeds are east.';
        return s;
      },
      exits: { e: 'reed_path', n: 'fisher_hut', s: 'drowned_village', w: 'causeway' },
      encounter: { chance: 0.25, pool: ['will_o_wisp', 'drowned_one'] },
      features: [
        { kw: ['tower', 'bell', 'belltower'], text: 'The bell tower leans like a tired drunk. Its belfry is empty. The bell must have fallen — but you can still hear it ringing, from under the water.' },
        { kw: ['water', 'mere', 'lake'], text: 'The water is so dark you can see your reflection. After a moment, you notice your reflection has company.' },
        { kw: ['shells', 'oyster', 'oysters', 'mussels'], text: 'A bed of big grey oysters clings to the stones at the waterline.' },
      ],
      on: {
        examine(g, noun) {
          if (has(noun, /shrine|stones|cairn/)) {
            const laid = KEEPSAKES.filter((k) => g.flag('laid_' + k)).length;
            g.print('A little cairn of flat stones, with names scratched into them: BET. TAM. LITTLE WREN. OLD JORY. And many more. ' +
              (laid >= 3 ? 'The keepsakes you laid here are gone, and the stones feel warm.' : "It feels like the kind of place you'd leave something for someone who isn't coming back. (" + laid + ' of 3 keepsakes laid)'));
            if (!g.questStage('drowned')) g.quest('drowned', 1);
            return true;
          }
          // A one-time freebie: prying open an oyster gives a pearl.
          if (has(noun, /oyster|shells|mussel/)) {
            if (g.flag('oyster_opened')) { g.print('The oysters have clamped shut and are not falling for that again.'); return true; }
            g.set('oyster_opened');
            g.print('You pry open the biggest oyster. Inside: a cold grey pearl. The oyster looks betrayed.', 'loot');
            g.give('drowned_pearl');
            return true;
          }
          return false;
        },
        give(g, noun, itemId) {
          if (!KEEPSAKES.includes(itemId)) return false;
          return laySakes(g, itemId);
        },
      },
    },

    fisher_hut: {
      name: "Odda's Hut", x: -3, y: -3, z: 0, art: 'hut',
      desc(g) {
        return "A hut on stilts, hung with nets, floats and strings of smoked eels. Odda the ferrywoman sits mending a net, her boat bobbing at the jetty below. You can 'list' what she sells" +
          (g.flag('causeway_raised') ? '.' : ", or pay her 10 gold to 'ferry' you out to the bell tower.") + ' The shore is south.';
      },
      exits: { s: 'mere_shore' },
      shop: ['smoked_eel', 'mallow_root', 'bog_myrtle', 'torch'],
      features: [{ kw: ['nets', 'net', 'eels', 'boat', 'jetty'], text: 'The boat is called the DOGGED. It looks it.' }],
      npc: { id: 'odda', name: 'Odda', kw: ['odda', 'ferrywoman', 'fisher', 'woman'],
        desc: 'A lean, weather-beaten woman with a pipe clamped in her teeth and forearms like knotted rope.',
        // The first talk starts two quests. After that, her normal lines.
        onTalk(g) {
          if (g.questStage('bell')) return false;
          g.print("'Hm. Another one come to stare at the water.' Odda puffs her pipe. 'That was Mereside, out there, before the King drowned it. Twenty years ago he sank his own queen in the mere, and the village went down with her. Some nights you can still hear the chapel bell, ringing at the bottom.'", 'npc');
          g.print("'If you want to know why it rings, you'll need to breathe water. Grizel in the bog knows a brew for that, if she likes you. She doesn't like anyone.' She taps the pipe out. 'And if you find anything of the drowned down there — a locket, a doll, Old Jory's wedding band — leave it on the shrine by the shore. They'd want it back.'", 'npc');
          g.quest('bell', 1);
          g.quest('drowned', 1);
          // Already did Grizel's errand? Then skip straight to the next step.
          if (g.questStage('remedy') >= 2) g.quest('bell', 2);
          return true;
        },
        talk: [
          "'The causeway to the tower sank years back. There's a lever on the shore end, rusted solid. Or I'll row you over for ten gold. Say 'ferry'.'",
          "'Queen Elspeth, her name was. Kind, they say. Too kind for him. He wanted to live forever and she said no, so he made sure she wouldn't live at all.'",
          "'Wisps on the water. Don't follow the pretty lights. They don't lead anywhere you want to be.'",
          "'Smoked eel, four gold. Mallow root and myrtle, if you're brewing. Torches too — the bog's black as a boot.'",
        ] },
      on: {
        ferry(g) {
          if (!g.spend(10)) { g.print("'Ten gold, and you've not got it. I row for coin, not for company.'", 'npc'); return true; }
          g.print("Odda pockets your coins and rows you out through the mist without a word. Things bump against the hull. She doesn't look at them, so you don't either. 'Mind the step,' she says, and leaves you at the foot of the bell tower. (-10 gold)", 'npc');
          g.moveTo('bell_tower');
          return true;
        },
        pay(g) { return D.ROOMS.fisher_hut.on.ferry(g); },
      },
      actions: (g) => [{ label: 'Ferry to the tower (10g)', cmd: 'ferry', cls: 'gold' }],
    },

    bog: {
      name: 'The Sucking Bog', x: -2, y: -1, z: 0, art: 'bog', dark: true,
      stumble: 'You blunder off the tussocks in the dark and sink to your waist in freezing mud. Something under it nibbles you. (-2 health) Maybe find a light.',
      desc: 'Black mud, black water, and black roots tangled together under a ceiling of dead trees so thick the daylight gives up. Things pop and gurgle in the dark. A path of tussocks leads south toward a faint glow; the drowned village lies west, and the reed path north.',
      exits: { n: 'reed_path', s: 'witch_hollow', w: 'drowned_village' },
      enemy: 'bog_leech', items: ['mallow_root', 'mallow_root', 'keepsake_doll'],
      encounter: { chance: 0.3, pool: ['bog_leech'] },
      features: [{ kw: ['mud', 'roots', 'trees', 'bubbles'], text: 'You poke the mud with a stick. The mud keeps the stick.' }],
    },

    witch_hollow: {
      name: "Grizel's Hollow", x: -2, y: 0, z: 0, art: 'witch', cauldron: true,
      desc: "A dry island in the bog, crowded with a hut made from a capsized boat. A huge iron cauldron bubbles over a peat fire, and jars of things that used to be alive line every shelf. Grizel the bog witch stirs it, muttering. You can 'list' her wares, or use her cauldron to 'brew'. The bog is north.",
      exits: { n: 'bog' },
      shop: ['bog_myrtle', 'leech_oil', 'scroll_mire'],
      features: [
        { kw: ['cauldron', 'pot', 'fire'], text: "Grizel's cauldron is big enough to bathe in. You hope nobody has. Type 'recipes' to see what you could brew in it." },
        { kw: ['jars', 'jar', 'shelves'], text: 'One jar holds eyes. Another holds eyes that are looking at the first jar. You stop reading the labels.' },
      ],
      npc: { id: 'grizel', name: 'Grizel', kw: ['grizel', 'witch', 'hag', 'crone', 'woman'],
        desc: 'A stooped old woman with green-tinged skin, a nose like a parsnip, and a walking stick she clearly uses mostly for hitting things.',
        onTalk(g) {
          const st = g.questStage('remedy');
          if (st === 0) {
            g.print("'Visitors. Wonderful. Delightful. Go away.' Grizel squints at you. 'No? Then make yourself useful. My knees are full of bog. Brew me a marsh salve — a sprig of bog myrtle, a vial of leech oil, mix 'em anywhere — and give it here. Then maybe I'll teach you something worth knowing.'", 'npc');
            g.learnRecipe('marsh_salve');
            g.quest('remedy', 1);
            return true;
          }
          if (st === 1) {
            g.print(g.has('marsh_salve') ? "'Is that a salve I smell? Well, don't wave it about. GIVE it to me.'" : "'Salve. Myrtle and leech oil. Leeches are in the bog, and they're not shy. Off you go.'", 'npc');
            return true;
          }
          return false;
        },
        talk: [
          "'Water-breathing draught: one drowned pearl, one bog myrtle, one leech oil, and a cauldron. Don't drink it on a full stomach. Don't drink it on an empty one either. Just drink it.'",
          "'Drowned pearls come from the drowned, mostly. Or from the big oysters on the shore, if you're quick with a knife.'",
          "'My sister lives in the old bell tower. Don't let her talk you into anything. Actually, don't let her talk. Hit her.'",
          "'Bog fire. Leech oil and wisp dust, shaken not stirred. Throw it. Don't hold it. People always hold it.'",
        ] },
      on: {
        give(g, noun, itemId) {
          if (itemId !== 'marsh_salve') {
            if (itemId) { g.print("'What would I want with that? Keep it.'", 'npc'); return true; }
            return false;
          }
          if (g.questStage('remedy') >= 2) { g.print("'Another one? Bless you. I'll keep it for my other knee.' She keeps it.", 'npc'); g.take('marsh_salve'); g.addGold(8); return true; }
          g.take('marsh_salve');
          g.print("Grizel snatches the salve, slaps it on both knees and lets out a sigh that rattles the jars. 'Ohh, that's the stuff. Fine. A deal's a deal.' She teaches you two of her brews, slowly and rudely.", 'npc');
          g.quest('remedy', 2);
          g.learnRecipe('breathing_draught');
          g.learnRecipe('bog_fire');
          if (g.questStage('bell') === 1) g.quest('bell', 2);
          g.xp(25);
          return true;
        },
      },
    },

    drowned_village: {
      name: 'The Drowned Village', x: -3, y: -1, z: 0, art: 'drowned',
      desc: 'The roofs of Mereside poke out of the shallows like the backs of sleeping animals. You wade between them, waist-deep and very cold. Doors hang open underwater. In one window, a curtain still moves. The shore is north; the bog squelches away to the east.',
      exits: { n: 'mere_shore', e: 'bog' },
      enemy: 'drowned_one', items: ['keepsake_locket', 'recipe_page'],
      encounter: { chance: 0.3, pool: ['drowned_one'] },
      features: [
        { kw: ['roofs', 'houses', 'doors', 'window', 'curtain'], text: "Through one open door you see a table still set for dinner. You decide you aren't hungry." },
      ],
    },

    causeway: {
      name: 'The Sunken Causeway', x: -4, y: -2, z: 0, art: 'mere',
      desc(g) {
        if (g.flag('causeway_raised')) return 'A line of slick, weed-hung stones crosses the black water westward to the bell tower. The rusty lever stands thrown at the shore end. The shore is east.';
        return "Here an old stone causeway once ran out to the bell tower. Now it is under a fathom of black water; you can just make out the stones below. At the shore end, a big iron lever stands rusted in place. The shore is east.";
      },
      exits: { e: 'mere_shore', w: 'bell_tower' },
      enemy: 'mire_serpent', items: ['keepsake_ring'],
      features: [{ kw: ['stones', 'causeway', 'water'], text: 'The stones are down there, waiting. Something probably raises them.' }],
      canExit(g, dir) {
        if (dir === 'w' && !g.flag('causeway_raised')) return 'The causeway is under deep, cold water. You would sink like a dropped anvil. The lever at the shore end might raise it — or Odda could row you over.';
        return null;
      },
      on: {
        examine(g, noun) {
          if (!has(noun, /lever|rust/)) return false;
          if (g.flag('causeway_raised')) { g.print('The lever is thrown. It looks quietly proud of itself.'); return true; }
          g.print(g.flag('lever_oiled') ? 'The lever glistens with leech oil. It might move now.' : 'The lever is rusted solid. Something slippery might loosen it. Or someone very strong. Or a spell for stuck things.');
          return true;
        },
        // "pull lever" (pull means push in this game's dictionary).
        push(g, noun) {
          if (noun && !has(noun, /lever|handle/)) return false;
          if (g.flag('causeway_raised')) { g.print('The lever is already thrown.'); return true; }
          if (g.flag('lever_oiled')) return raiseCauseway(g, 'You pull the oiled lever. It slides over with a long, greasy groan.');
          if (g.cls() === 'warrior') return raiseCauseway(g, 'You plant your feet, grab the rusted lever with both hands and heave until something in it — or in you — gives. It does. It was the lever. Probably.');
          g.print('You pull with everything you have. The lever does not care. It is rusted solid. Maybe something oily would help.');
          return true;
        },
        oil(g, noun) {
          if (g.flag('causeway_raised')) { g.print('No need. The causeway is up.'); return true; }
          if (!g.has('leech_oil')) { g.print("You don't have anything to oil it with. Leech oil would do nicely, if you can stomach getting it."); return true; }
          g.take('leech_oil');
          g.set('lever_oiled');
          g.print('You pour the leech oil over the rusted joint. It soaks in with a satisfied gurgle. Now try pulling it.', 'loot');
          return true;
        },
        use(g, noun, itemId) {
          if (itemId !== 'leech_oil') return false;
          return D.ROOMS.causeway.on.oil(g, noun);
        },
        knock(g) {
          if (g.flag('causeway_raised')) { g.print('Your spell nudges the lever. It is already thrown.', 'magic'); return; }
          raiseCauseway(g, 'Your spell finds the rust inside the lever and politely asks it to leave. The lever swings over on its own.');
        },
      },
      actions: (g) => (g.flag('causeway_raised') ? [] : [{ label: 'Pull the lever', cmd: 'pull lever' }]),
    },

    bell_tower: {
      name: 'The Bell Tower', x: -5, y: -2, z: 0, art: 'tower',
      desc: 'All that is left of Mereside chapel: a leaning tower standing in the middle of the mere, its lower floor flooded to the stairs. The belfry above is empty and full of nests. Through a hole in the floor, black water goes down and down. The causeway leads east.',
      exits: { e: 'causeway', d: 'sunken_chapel' },
      enemy: 'marsh_hag',
      features: [{ kw: ['hole', 'water', 'floor'], text: 'Somewhere below, a bell tolls, slow and patient. You would need to breathe water to follow it.' },
        { kw: ['belfry', 'nests', 'nest'], text: 'Herons, by the look of it. They regard you as a possible fish.' }],
      canExit(g, dir) {
        if (dir === 'd' && !g.flag('water_breathing')) return 'You peer into the black water. You would drown long before you found the bottom. Grizel knows a water-breathing brew.';
        return null;
      },
      on: {
        // "dive" works like going down.
        dive(g) {
          if (!g.flag('water_breathing')) { g.print('You peer into the black water. You would drown long before you found the bottom. Grizel knows a water-breathing brew.'); return true; }
          g.moveTo('sunken_chapel');
          return true;
        },
      },
    },

    sunken_chapel: {
      name: 'The Sunken Chapel', x: -5, y: -2, z: -2, art: 'sunken',
      desc(g) {
        let s = 'You walk on the bottom of the mere, breathing water like air. The old Mereside chapel stands around you, pews drifting, candles long dead. ';
        s += g.flag('bell_rung') ? 'The great bronze bell has rung, and a cold current now pulls north, into the deep.' : 'In the aisle lies the great bronze bell, fallen from the tower, its rope floating up like a strand of hair.';
        return s + ' Light wavers far above, where the tower is.';
      },
      exits: { u: 'bell_tower', n: { to: 'mere_depths', flag: 'bell_rung' } },
      items: ['drowned_pearl'],
      encounter: { chance: 0.3, pool: ['drowned_one'] },
      features: [{ kw: ['pews', 'candles', 'altar'], text: "Carved into the altar: 'ELSPETH, OUR QUEEN. SHE WOULD NOT LIVE FOREVER, SO HE DID NOT LET HER LIVE.'" }],
      onEnter(g) { g.quest('bell', 3); },
      on: {
        examine(g, noun) {
          if (!has(noun, /bell|rope/)) return false;
          g.print(g.flag('bell_rung') ? 'The bell is silent now. It has said what it had to say.' : "A great bronze bell, green with age. Its rope floats within reach. You could 'ring' it.");
          return true;
        },
        ring(g, noun) {
          if (g.flag('bell_rung')) { g.print('You pull the rope. The bell has said its piece and will not say it again.'); return true; }
          g.set('bell_rung');
          g.print('You haul on the rope. The bell swings, slow as a dream, and its voice goes out through the water: BONG. You feel it in your teeth. Far to the north, in the dark, something stirs and starts to rise.', 'danger');
          g.quest('bell', 4);
          g.xp(20);
          return true;
        },
        push(g, noun) { if (!has(noun, /bell|rope/)) return false; return D.ROOMS.sunken_chapel.on.ring(g, noun); },
      },
      actions: (g) => (g.flag('bell_rung') ? [] : [{ label: 'Ring the bell', cmd: 'ring bell', cls: 'magic' }]),
    },

    mere_depths: {
      name: 'The Mere Depths', x: -5, y: -3, z: -2, art: 'sunken',
      desc(g) {
        if (g.flag('queen_rest')) return 'The deepest part of the mere is quiet now. Silt settles slowly over a drowned throne. Nothing waits here anymore. The sunken chapel is south.';
        return 'The bottom drops away into cold, crushing dark. Here, on a throne of silt and bone, someone has been waiting a very long time. The sunken chapel is south.';
      },
      exits: { s: 'sunken_chapel' },
      enemy: 'drowned_queen',
      features: [{ kw: ['throne', 'silt', 'bone'], text: 'A throne built of silt and the bones of fish. A queen should not have to sit on a thing like that.' }],
    },
  });

  // ------------------------------------------------ CHANGES TO OLD PLACES
  // The woods get a way west into the reeds.
  const woods = D.ROOMS.woods;
  woods.exits.w = 'reed_path';
  woods.desc = woods.desc.replace('The road is east.', 'The road is east, and to the west the pines thin into reeds and the flat, cold smell of still water.');
  woods.features.push({ kw: ['reeds', 'west', 'water', 'mere'], text: 'Through the trees to the west, you can see reeds, and beyond them the grey shine of a mere.' });

  // Old Nettle gets a cauldron you can brew in, and stocks two ingredients.
  const hut = D.ROOMS.hut;
  hut.cauldron = true;
  hut.shop.push('mallow_root', 'bog_myrtle');
  hut.features.push({ kw: ['cauldron', 'pot'], text: "A squat black cauldron simmers by the fire. Nettle waves a hand at it: 'Use it if you like. Brew anything. Clean up after.' (Type 'recipes'.)" });
  hut.npc.talk.push("'Out by the mere there's a witch called Grizel. Taught me half of what I know, and all of the rude words. Mind her.'");
})();
