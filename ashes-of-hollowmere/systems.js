/* Ashes of Hollowmere — quests (the journal) and crafting recipes.
   Loaded after rooms.js and before game.js. Plain data, like data.js. */
'use strict';
// ============================================================================
// WHAT THIS FILE IS (a beginner's guide)
// ============================================================================
// This file adds two new lists to window.GameData, the game's catalogue:
//
//   QUESTS  - the tasks shown in your journal. Each quest has numbered
//             "stages". Stage 1 is where it begins; the highest number is
//             "done". The game only ever moves a quest FORWARD, so a quest
//             can't accidentally go back a step.
//
//   RECIPES - what you can brew or craft. "needs" lists the ingredients and
//             how many of each; "makes" is the item you get. "cauldron: true"
//             means you have to be standing next to a cauldron to brew it.
//
// The main quest ("The Hollow King") is special: it has no saved stage.
// Instead, its "derive" function works the stage out from puzzle flags the
// original game already keeps (like 'troll_paid'). That way even saves made
// before the journal existed show the right progress.
// ============================================================================
(function () {
  const D = window.GameData;

  D.QUESTS = {
    main: {
      name: 'The Hollow King',
      // Works out the stage from flags the game already records.
      derive(flag) {
        if (flag('lich_dead')) return 7;
        if (flag('phylactery_destroyed')) return 6;
        if (flag('throne_moved')) return 5;
        if (flag('throne_unlocked')) return 4;
        if (flag('postern_open')) return 3;
        if (flag('troll_paid') || flag('troll_gone')) return 2;
        return 1;
      },
      stages: {
        1: 'End the curse of Castle Duskholm. First, get past the troll on the Chasm Bridge, north of Crow Road.',
        2: 'Get into Castle Duskholm. The portcullis is rusted shut, but there is a small postern door.',
        3: 'Explore the castle and find a way into the throne room. Its doors have a crown-shaped lock.',
        4: 'The throne room is open. The charred note said the way down lies beneath the throne itself.',
        5: "Find the Hollow King's soul-jar among the bones below, and smash it before you face him.",
        6: 'The jar is smashed. Face Varkhul, the Hollow King, in his sanctum.',
      },
      done: 7,
      doneText: 'Varkhul is truly dead. Hollowmere is free.',
    },

    bell: {
      name: 'The Drowned Bell',
      stages: {
        1: "Odda the ferrywoman says the old chapel bell still tolls under the mere. Grizel, the bog witch south of the reeds, may know how to breathe underwater.",
        2: 'Brew a water-breathing draught, cross the causeway to the old bell tower, and dive.',
        3: 'You have found the sunken chapel. Ring the drowned bell.',
        4: 'The bell has rung. Something answered from the deep water north of the chapel. Face it.',
      },
      done: 5,
      doneText: 'The Drowned Queen is at rest. Her last tear is yours, and the Hollow King will not like it.',
    },

    remedy: {
      name: "Grizel's Remedy",
      stages: {
        1: 'Grizel wants a marsh salve for her joints. Brew one (bog myrtle and leech oil) and give it to her.',
      },
      done: 2,
      doneText: 'Grizel got her salve, and you learned how to brew water-breathing draughts and bog fire.',
    },

    drowned: {
      name: 'Rest for the Drowned',
      stages: {
        1: 'Three drowned villagers lost their keepsakes in the mere. Lay them at the shrine of stones on the shore. (0 of 3)',
        2: 'Lay the drowned villagers\' keepsakes at the shrine on the shore. (1 of 3)',
        3: 'Lay the drowned villagers\' keepsakes at the shrine on the shore. (2 of 3)',
      },
      done: 4,
      doneText: 'All three of the drowned are at rest. They left you a gift.',
    },
  };

  // Ingredient IDs (bog_myrtle, leech_oil...) are defined with the other mere
  // items in mere.js.
  D.RECIPES = {
    marsh_salve: { name: 'marsh salve', kw: ['salve', 'marsh'], needs: { bog_myrtle: 1, leech_oil: 1 }, makes: 'marsh_salve' },
    healing_draught: { name: 'healing potion', kw: ['healing', 'heal', 'potion', 'red'], needs: { mallow_root: 2 }, makes: 'healing_potion', cauldron: true },
    mana_draught: { name: 'mana potion', kw: ['mana', 'potion', 'blue'], needs: { mallow_root: 1, wisp_dust: 1 }, makes: 'mana_potion', cauldron: true },
    greater_draught: { name: 'greater healing potion', kw: ['greater', 'healing', 'potion', 'big'], needs: { mallow_root: 2, drowned_pearl: 1 }, makes: 'greater_healing', cauldron: true },
    breathing_draught: { name: 'water-breathing draught', kw: ['breathing', 'water', 'draught', 'breath'], needs: { drowned_pearl: 1, bog_myrtle: 1, leech_oil: 1 }, makes: 'breathing_draught', cauldron: true },
    bog_fire: { name: 'flask of bog fire', kw: ['bog', 'fire', 'flask'], needs: { leech_oil: 1, wisp_dust: 1 }, makes: 'bog_fire' },
  };
})();
