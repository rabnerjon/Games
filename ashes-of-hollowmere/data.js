/* Ashes of Hollowmere — game content: art, classes, spells, items, enemies.
   Rooms live in rooms.js. Everything is plain data; the engine is in game.js. */
'use strict';
// ============================================================================
// WHAT THIS FILE IS (a beginner's guide)
// ============================================================================
// This is a JavaScript file. JavaScript is the programming language web
// browsers run to make pages interactive. This file holds no game LOGIC
// (rules); it is the game's CONTENT, like a big catalogue: pictures, the
// three hero classes, spells, items and monsters. game.js reads this
// catalogue to run the game.
//
// Lines starting with // are COMMENTS: notes for humans that the computer
// ignores. Text between /* and */ is also a comment, and can span many lines.
//
// A few terms you'll see a lot:
//   - VARIABLE: a named box that holds a value. "const" makes one whose
//     contents won't be swapped for something else later.
//   - STRING: a piece of text, written in quotes: 'like this'.
//   - NUMBER: e.g. 42. ARRAY: an ordered list in square brackets: [3, 7].
//   - OBJECT: a group of named values in curly braces, e.g.
//       { name: 'oak staff', value: 3 }
//     Each "name: value" pair is called a PROPERTY.
//   - FUNCTION: a reusable set of instructions that can take inputs and
//     give back a result.
// ============================================================================

// 'use strict' (at the top of this file) turns on JavaScript's "strict mode", which
// makes the browser report common mistakes as errors instead of quietly
// ignoring them.

// "window" is the browser tab. Saving our catalogue as window.GameData makes
// it available to the other script files (rooms.js and game.js).
// The "(function () { ... })()" pattern creates a function and runs it right
// away. Everything made inside it stays private unless it is "returned" at
// the bottom of the file. This keeps the catalogue tidy and self-contained.
window.GameData = (function () {
  // HELPER FUNCTION "a": cleans up each piece of ASCII art below.
  // It uses "regular expressions" (patterns for matching text, written
  // between slashes) to delete the blank line at the start and the end.
  // Strips the leading newline from template-literal art.
  const a = (s) => s.replace(/^\n/, '').replace(/\n\s*$/, '');

  // ------------------------------------------------------------------ ART
  // ASCII ART: pictures drawn with ordinary keyboard characters.
  // ART is an object: each property name (title, village, tavern, ...) is a
  // picture's label, and its value is the picture itself as a string.
  // String.raw`...` is a "template literal" (text between backticks) that
  // keeps backslashes \ exactly as typed, which ASCII art needs.
  // (No comments are placed INSIDE the pictures, because anything between
  // the backticks would show up on screen as part of the drawing.)
  // The first group is locations; the second group (after "enemies") is monsters.
  const ART = {
    title: a(String.raw`
            /\                          /\
           /  \          |>            /  \
          /____\        /\            /____\
          |[] |        /  \           | []|
          |   |_______/____\__________|   |
          |   | []  |  []  |   []    |   |
          | []|     |  __  |         |[] |
          |   |  [] | |  | |  []     |   |
       ___|___|_____|_|__|_|_________|___|___
`),
    village: a(String.raw`
      .       *        .          *       .
         ___         ____          ___
        /   \   ~   /    \   ~    /   \
       /_____\ ~~  /______\  ~~  /_____\
       | [] |      | []  []|      | [] |
       |  _ |  _   |   _   |  _   | _  |
   ____|_|_||_(o)__|__|_|__|_(o)__||_|_|____
`),
    tavern: a(String.raw`
        _________________________________
       |    ~ T H E   D R O W N E D ~    |
       |            ~ R A T ~            |
       |_________________________________|
        |  ____    ________    ____   |
        | |o o |  |  ____  |  | ** |  |
        | |____|  | | () | |  |____|  |
        |  [==]   |_|____|_|   [==]   |
     ___|_____________________________|___
`),
    smithy: a(String.raw`
                 (  )  (   )
                  )  (  )
          ________[  ]________
         /                    \
        /    B R A M ' S       \
       /________________________\
        |   __        ___|___   |
        |  /  \  *    \_____/   |
        |  |##|  *\     |_|     |
     ___|__|__|____\___/___\____|___
`),
    hut: a(String.raw`
              ,  .  ,
            .~~~~~~~~.
           /  ^    ^  \
          /~~~~~~~~~~~~\
         /  *  NETTLE  * \
        /~~~~~~~~~~~~~~~~~\
          |  _     _    |
          | |o|   |_|   |  (=^.^=)
       ___|_|_|_________|___________
`),
    chapel: a(String.raw`
                   +
                  /_\
                 |   |
              ___|___|___
             /     +     \
            /_____________\
            |  _   ^   _  |
            | | | / \ | | |
            | |_||   ||_| |
         ___|____|___|____|___
`),
    gate: a(String.raw`
    /\  /\  /\  /\ ______ /\  /\  /\  /\
    ||  ||  ||  ||| ____ |||  ||  ||  ||
    ||  ||  ||  |||| || ||||  ||  ||  ||
    ||  ||  ||  |||| || ||||  ||  ||  ||
    ||  ||  ||  ||||_||_||||  ||  ||  ||
  __||__||__||__||________||__||__||__||__
`),
    road: a(String.raw`
                         _   |>   _
                        |=|_/^\__|=|
                        | |  ^  |  |
          ^^      v     |_|_____|__|     v
    ~~~~~~~~~~~~~~~~/           \~~~~~~~~~~~
                  /      ::      \
     v          /       ::        \      v
              /        ::           \
`),
    woods: a(String.raw`
       ^        ^      ^          ^      ^
      /|\      /|\    /|\   ^    /|\    /|\
     //|\\    //|\\  //|\\ /|\  //|\\  //|\\
    ///|\\\  ///|\\\///|\\//|\\///|\\\///|\\\
       |        |      |   |      |      |
     . : .    o o   . : .    o o    . : .
`),
    den: a(String.raw`
              \  |  /
           ____\ | /____
          /     \|/     \
              ___|___
             /   |   \
       _____/    |    \_____
      /  )=(    .-.   )=(   \
     /  )=(    (   )    )=(  \
    /__________'---'__________\
`),
    graveyard: a(String.raw`
       _____        ___          ____
      /     \  +   /   \   +    /    \
      | RIP |  |   | R |  |     | RI |
      |     |  |   | I |  |  _  |    |
   ~~~|_____|~~~~~~|_P_|~~~~(_)~|____|~~~
     ~   ~ ~  .  ~   ~  .  ~ ~   ~  ~
`),
    mausoleum: a(String.raw`
              _______________
             /       +       \
            /_________________\
             | |  |  _  |  | |
             | |  | | | |  | |
             | |  | | | |  | |
           __|_|__|_|_|_|__|_|__
          /_____________________\
`),
    bridge: a(String.raw`
     ____                               ____
    |    |_____________________________|    |
    |    |   TOLE                      |    |
    |    |=============================|    |
    |____|      \               /      |____|
                 \    . . .    /
                  \           /
`),
    castle_gate: a(String.raw`
          _   _   _   _   _   _   _
         | |_| |_| |_| |_| |_| |_| |
         |                         |
         |      .-----------.      |
         |     /|||||||||||||\     |  .--.
         |    | ||||||||||||| |    |  |  |
         |    | ||||||||||||| |    |  |  |
       __|____|_|||||||||||||_|____|__|__|__
`),
    courtyard: a(String.raw`
            ___________________________
           |  []   []   ||   []   []  |
           |            ||            |
           |         .--''--.         |
           |        (  o  o  )        |
           |         \ ~~~~ /         |
           |      ____)    (____      |
         __|_____(______________)_____|__
`),
    armory: a(String.raw`
        |\   |\   |\        ___
        | |  | |  | |      /   \
        | |  | |  | |     | o o |
        |_|  |_|  |_|      \___/
       /___\/___\/___\   /|  |  |\
       ======|======     / |  |  | \
        *  ~~~  *  ~~~  *  ~~~  *
`),
    tower: a(String.raw`
                 _
                | |
            ____|_|____
           |  _  _  _  |
           | |_||_||_| |
           |     __    |
           |    |  |   |
           |    |  |   |
           |____|__|___|
`),
    study: a(String.raw`
       ___       _      ___
      |   |     | |    (   )   ~ ~
      | o |   __|_|__   ) (   ~ ~ ~
      |___|  |  ~~~  | (___)
     _______ |_______|  _____
    |  ===  |         |=====|
    |_______|  [  ]   |_____|
`),
    roof: a(String.raw`
     _   _   _   _   _   _   _   _
    | |_| |_| |_| |_| |_| |_| |_| |
    |  /\                     /\  |
    | (oo)       ~ ~         (oo) |
    |  \/                     \/  |
`),
    hall: a(String.raw`
     ___________________________________
    |  |\  |\           /|  /|         |
    |  | | | |          | | | |        |
    |  |/  |/           \|  \|         |
    |      ________________            |
    |     |________________|   ______  |
    |      ||            ||   | (W)  | |
    |______||____________||___|______|_|
`),
    kitchen: a(String.raw`
             ___________
            (           )
             \_________/
              |  ~~~  |
              |_______|
          ____)       (____
         /_________________\
          ||    [====]    ||
`),
    library: a(String.raw`
    _________________________________
   ||=|=|=|=|=||=|=|=|=|=||=|=|=|=|=||
   ||_|_|_|_|_||_|_|_|_|_||_|_|_|_|_||
   ||=|=|=|=|=||=|=|=|=|=||=|=|=|=|=||
   ||_|_|_|_|_||_|_|_|_|_||_|_|_|_|_||
   ||=|=|=|=|=||=|=|=|=|=||=|=|=|=|=||
   ||_|_|_|_|_||_|_|_|_|_||_|_|_|_|_||
`),
    throne: a(String.raw`
               _  _  _
              | || || |
              |  \/\/ |
             _|_______|_
            |  _______  |
            | |       | |
            | |       | |
           _|_|_______|_|_
          |_______________|
`),
    dungeon: a(String.raw`
   _________________________________
   |  ||  ||  ||  |    |  ||  ||  ||
   |  ||  ||  ||  |    |  ||  ||  ||
   |  ||  ||  ||  |    |  ||  ||  ||
   |__||__||__||__|    |__||__||__||
        .   .      (  )      .   .
   _________________________________
`),
    crypt: a(String.raw`
      _______          _______
     |   +   |        |   +   |
     |_______|        |_______|
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   ~  ~ o ~  ~  ~   ~  ~  o  ~   ~  ~
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
`),
    bonepit: a(String.raw`
              ___
             (###)
           ___\_/___
          |_________|
   o-o  )=(  o-o  )=(  o-o  )=( o-o
 )=(  o-o  )=(  o-o  )=(  o-o  )=(
`),
    sanctum: a(String.raw`
            .  *  .  *  .  *  .
         *    _____________     *
       .     /  ~  ~  ~  ~  \     .
      *     |   (  o   o  )   |     *
       .     \     _^_     /     .
         *    \___________/     *
            .  *  .  *  .  *  .
`),
    dark: a(String.raw`

         .                    .
                 o   o
     .                          .
                         o  o
           .     o o
`),
    // ---- enemies
    // Monster pictures. Each enemy in ENEMIES (further down) names one of
    // these with its "art" property. game.js shows it during a fight.
    rat: a(String.raw`
            ____
      (\_/)/    \___
      (o o)          \~~~~~~
      ( ^ )\____ ___/
       " "    " "
`),
    wolf: a(String.raw`
        /\      /\
       /  \____/  \
      |   o    o   |
      |      __    |
       \    \  /  /
        \___VVVV_/
          /      \
`),
    bandit: a(String.raw`
          _______
         /       \
        |  =====  |
        |  o   o  |
         \  ___  /
     _____\_____/_____
    |     |     |  /  |
    |     | +-+ | /   |
`),
    skeleton: a(String.raw`
          _____
         / x x \
         \  ^  /
          |vvv|
       ___/---\___
      /  |=====|  \
         |=====|
         /     \
       _/       \_
`),
    ghoul: a(String.raw`
          ,,,,,,,
         / o   o \
        |    ^    |
        |  /VVV\  |
         \ \^^^/ /
       ___\_____/___
      / /|       |\ \
     ~~  |       |  ~~
`),
    troll: a(String.raw`
            _______
          /  ^   ^  \
         |  (o) (o)  |
         |     <>     |
         |  \______/  |
       __ \__________/ __
      /  \|          |/  \
     |    |  TOLE?   |    |
`),
    spider: a(String.raw`
       \  \  ____  /  /
        \  \/    \/  /
     ----\ ( o oo o) /----
     ----/  \ __ /  \----
        /  / \/\/ \  \
       /  /        \  \
`),
    armor: a(String.raw`
          _____
         |#####|
         |#---#|
          \___/
      ___/=====\___
     | o |=====| o |
     |   |=====|   |
         |__|__|
         |_|  |_|
`),
    gargoyle: a(String.raw`
     /\___                ___/\
     \    \___  /\_/\  ___/    /
      \       \( o o )/       /
       \___    (  V  )    ___/
           \___/     \___/
               | | | |
               ^^   ^^
`),
    wraith: a(String.raw`
           .--------.
          /  o    o  \
         |     __     |
          \   (  )   /
           )  ~~~~  (
          (  ~    ~  )
           ) ~  ~  ~(
            ~ ~  ~ ~
`),
    golem: a(String.raw`
           ___________
          |  O     O  |
          |    ___    |
       ___|___|vvv|___|___
      |)=(|  )=(  )=(  |)=(|
      |___|  )=(  )=(  |___|
             )=(  )=(
            /___| |___\
`),
    lich: a(String.raw`
             _/\_/\_/\_
            |__________|
            /  _    _  \
           |  (*)  (*)  |
           |     /\     |
            \  |vvvv|  /
         ____\________/____
        /  /   \    /   \  \
       ~~ /     \  /     \ ~~
`),
  };

  // ------------------------------------------------------------- CLASSES
  // The three hero types the player can choose on the start screen.
  // What each property means:
  //   name / blurb / perk   - text shown on the class card
  //   hp / mp               - starting health points and mana points
  //                           (mana is the "fuel" spells use up)
  //   str                   - strength: added to weapon damage
  //   def                   - defense: reduces damage taken
  //   crit                  - chance of a "critical hit" (double damage);
  //                           0.25 means 25%
  //   gold                  - starting money
  //   spellPower            - spell damage multiplier (1.35 = 35% stronger)
  //   weapon / armor        - starting equipment (IDs from ITEMS below)
  //   items / spells        - starting inventory and known spells (arrays of IDs)
  //   levelHp / levelMp / levelStr - how much each stat grows per level gained
  // An "ID" is a short, unique code name (like 'oak_staff') that the code uses
  // to refer to something. Players never see IDs.
  const CLASSES = {
    warrior: {
      name: 'Warrior',
      blurb: 'Tough, hits hard, and sometimes strikes twice. Not big on reading.',
      hp: 42, mp: 10, str: 4, def: 2, crit: 0.08, gold: 15, spellPower: 1,
      weapon: 'rusty_longsword', armor: 'padded_jerkin',
      items: ['healing_potion', 'healing_potion'], spells: ['second_wind'],
      levelHp: 10, levelMp: 3, levelStr: 1,
      perk: '15% chance to strike twice.',
    },
    mage: {
      name: 'Mage',
      blurb: 'Fragile, but throws fire at problems. Spells hit 35% harder.',
      hp: 26, mp: 36, str: 1, def: 0, crit: 0.06, gold: 15, spellPower: 1.35,
      weapon: 'oak_staff', armor: 'apprentice_robes',
      items: ['healing_potion', 'mana_potion'], spells: ['firebolt', 'light'],
      levelHp: 5, levelMp: 8, levelStr: 0,
      perk: 'Spells deal +35% damage. Regains mana faster.',
    },
    rogue: {
      name: 'Rogue',
      blurb: 'Quick, sneaky, and frequently lethal. Can pick locks.',
      hp: 32, mp: 16, str: 3, def: 1, crit: 0.25, gold: 40, spellPower: 1,
      weapon: 'twin_daggers', armor: 'padded_jerkin',
      items: ['lockpicks', 'healing_potion'], spells: ['poison'],
      levelHp: 7, levelMp: 4, levelStr: 1,
      perk: '25% critical hits, better dodging and fleeing, picks locks.',
    },
  };

  // -------------------------------------------------------------- SPELLS
  // Every spell in the game. Players learn them from scrolls and tomes.
  //   name  - the name players see
  //   kw    - "keywords": words the player can type to mean this spell
  //           (so "cast fire" and "cast fireball" both work)
  //   mp    - mana cost to cast it
  //   type  - what it does: 'attack', 'poison', 'heal', 'light' or 'knock';
  //           game.js has a different set of rules for each type
  //   dmg   - [lowest, highest] damage; a random number in that range is used
  //   msg   - the message shown when cast. {e} and {d} are placeholders that
  //           game.js swaps for the enemy's name and the damage number
  //   freeze / undead / turns / tick / amount - extra numbers some types use
  //   desc  - description shown to the player
  const SPELLS = {
    firebolt: { name: 'Firebolt', kw: ['firebolt', 'fire', 'fireball', 'bolt', 'flame'], mp: 6, type: 'attack', dmg: [8, 14],
      msg: 'A bolt of fire roars from your fingertips and engulfs {e} for {d} damage!',
      desc: 'Hurls a bolt of fire. Ignores armor.' },
    frost: { name: 'Frost Shard', kw: ['frost', 'shard', 'ice', 'freeze'], mp: 8, type: 'attack', dmg: [10, 15], freeze: 0.35,
      msg: 'A jagged shard of ice slams into {e} for {d} damage!',
      desc: 'Ice damage with a chance to freeze the enemy for a turn.' },
    lightning: { name: 'Chain Lightning', kw: ['lightning', 'chain', 'shock', 'thunder'], mp: 12, type: 'attack', dmg: [16, 24],
      msg: 'Lightning cracks through the air and dances across {e} for {d} damage!',
      desc: 'Devastating lightning damage.' },
    smite: { name: 'Holy Smite', kw: ['smite', 'holy'], mp: 10, type: 'attack', dmg: [10, 16], undead: 2,
      msg: 'Golden light lances down from nowhere and strikes {e} for {d} damage!',
      desc: 'Holy light. Double damage against the undead.' },
    poison: { name: 'Poison Blade', kw: ['poison', 'venom', 'blade'], mp: 5, type: 'poison', turns: 4, tick: 4,
      desc: 'Coat your weapon in venom and strike. Poisons the enemy for 4 turns.' },
    heal: { name: 'Mending', kw: ['heal', 'mending', 'mend', 'cure'], mp: 8, type: 'heal', amount: 28,
      desc: 'Restores 28 health and cures poison.' },
    second_wind: { name: 'Second Wind', kw: ['second', 'wind', 'secondwind'], mp: 5, type: 'heal', amount: 16,
      desc: 'Grit your teeth and recover 16 health.' },
    light: { name: 'Light', kw: ['light', 'illuminate', 'glow'], mp: 2, type: 'light',
      desc: 'Permanently lights a dark room.' },
    knock: { name: 'Knock', kw: ['knock', 'unlock', 'open'], mp: 4, type: 'knock',
      desc: 'Opens ordinary locks. Ordinary.' },
  };

  // --------------------------------------------------------------- ITEMS
  // type: weapon | armor | amulet | potion | food | throw | scroll | key | tool | gold | treasure | note
  // Every item in the game, looked up by its ID.
  //   name / desc - what the player sees
  //   kw          - extra words the player can type to mean this item
  //   type        - the kind of item (listed in the "type:" comment above); it decides
  //                 what "use" does with it
  //   value       - price in gold at a shop (shops buy it back for half)
  //   dmg         - weapons: [lowest, highest] damage
  //   def / hp / mp / spell / holy - bonuses the item gives while equipped
  //   heal / mana / cure          - what drinking or eating it restores
  //   spell (on scrolls)          - the ID of the spell the scroll teaches
  //   amount (on gold)            - how many coins are inside
  //   text (on notes)             - what you read when you "read" it
  //   use                         - a special message shown when it is used
  // --- Weapons ---
  const ITEMS = {
    rusty_longsword: { name: 'rusty longsword', kw: ['sword', 'longsword', 'rusty', 'blade'], type: 'weapon', dmg: [3, 7], value: 4,
      desc: 'It has seen better centuries. Still pointy at the important end. (3-7 damage)' },
    oak_staff: { name: 'oak staff', kw: ['staff', 'oak'], type: 'weapon', dmg: [2, 4], value: 3,
      desc: "A sturdy oak staff, worn smooth by an apprentice's anxious grip. (2-4 damage)" },
    twin_daggers: { name: 'twin daggers', kw: ['daggers', 'dagger', 'twin', 'knives'], type: 'weapon', dmg: [3, 6], value: 6,
      desc: 'A matched pair. One is for stabbing. The other is also for stabbing. (3-6 damage)' },
    iron_sword: { name: 'iron sword', kw: ['sword', 'iron'], type: 'weapon', dmg: [5, 8], value: 25,
      desc: "Bram's work: plain, heavy and honest. (5-8 damage)" },
    battleaxe: { name: 'battleaxe', kw: ['axe', 'battleaxe', 'battle'], type: 'weapon', dmg: [6, 11], value: 45,
      desc: 'Heavy, honest, and extremely persuasive. (6-11 damage)' },
    steel_sword: { name: "knight's steel sword", kw: ['sword', 'steel', 'knight', 'knights'], type: 'weapon', dmg: [7, 11], value: 40,
      desc: 'A fine blade from the Duskholm armory, still sharp after twenty years. (7-11 damage)' },
    meat_cleaver: { name: 'meat cleaver', kw: ['cleaver', 'meat'], type: 'weapon', dmg: [3, 6], value: 3,
      desc: 'Smells faintly of onions and violence. (3-6 damage)' },
    ladle: { name: 'ladle of destiny', kw: ['ladle', 'destiny', 'spoon'], type: 'weapon', dmg: [1, 2], value: 1,
      desc: "A soup ladle. Someone has carved DESTINY into the handle. Someone was wrong. (1-2 damage)" },
    staff_embers: { name: 'staff of embers', kw: ['staff', 'embers', 'ember'], type: 'weapon', dmg: [4, 7], spell: 0.25, value: 40,
      desc: 'Warm to the touch, with a coal glowing in its crook. (4-7 damage, +25% spell damage)' },
    silver_sword: { name: 'silver sword', kw: ['sword', 'silver'], type: 'weapon', dmg: [7, 12], holy: 1.5, value: 60,
      desc: 'Bright silver, etched with prayers. The undead hate it. (7-12 damage, +50% vs undead)' },

    // --- Armor and amulets (worn for defense and other bonuses) ---
    padded_jerkin: { name: 'padded jerkin', kw: ['jerkin', 'padded'], type: 'armor', def: 1, value: 3,
      desc: 'Quilted cloth. Stops splinters and mild insults. (+1 defense)' },
    apprentice_robes: { name: 'apprentice robes', kw: ['robes', 'robe', 'apprentice'], type: 'armor', def: 1, mp: 5, value: 5,
      desc: 'Comes with complimentary scorch marks. (+1 defense, +5 max mana)' },
    leather_armor: { name: 'leather armor', kw: ['leather', 'armor', 'armour'], type: 'armor', def: 2, value: 20,
      desc: 'Boiled leather, sturdy and only slightly smelly. (+2 defense)' },
    chainmail: { name: 'chainmail', kw: ['chainmail', 'chain', 'mail', 'armor', 'armour'], type: 'armor', def: 4, value: 55,
      desc: 'Thousands of tiny rings, each one personally committed to your survival. (+4 defense)' },
    knight_plate: { name: "knight's breastplate", kw: ['breastplate', 'plate', 'knight', 'knights', 'armor', 'armour'], type: 'armor', def: 6, value: 70,
      desc: 'Heavy steel plate bearing the Duskholm crest. (+6 defense)' },
    wolf_amulet: { name: 'wolf-tooth amulet', kw: ['amulet', 'wolf', 'tooth', 'necklace'], type: 'amulet', def: 1, hp: 10, value: 30,
      desc: "A great fang on a leather cord. You feel tougher just wearing it. (+10 max health, +1 defense)" },

    // --- Potions, food, holy water and tools ---
    healing_potion: { name: 'healing potion', kw: ['potion', 'healing', 'heal', 'red'], type: 'potion', heal: 30, value: 10,
      desc: 'A red potion that tastes of cherries and regret. Restores 30 health.' },
    greater_healing: { name: 'greater healing potion', kw: ['potion', 'greater', 'healing', 'heal', 'big'], type: 'potion', heal: 60, value: 25,
      desc: 'A large, glowing red potion. Restores 60 health and cures poison.', cure: true },
    mana_potion: { name: 'mana potion', kw: ['potion', 'mana', 'blue'], type: 'potion', mana: 25, value: 12,
      desc: 'A blue potion that fizzes in an alarming way. Restores 25 mana.' },
    ale: { name: 'mug of ale', kw: ['ale', 'mug', 'beer'], type: 'potion', heal: 5, value: 2,
      desc: "The Drowned Rat's finest. Which is to say, its only.",
      use: 'You drink the ale. It tastes like a wet dog told you a sad story. You feel slightly braver. (+5 health)' },
    cheese: { name: 'wheel of cheese', kw: ['cheese', 'wheel'], type: 'food', heal: 10, value: 5,
      desc: "A wheel of Hollowmere Stinking Bishop. It smells like a troll's idea of heaven.",
      use: 'You eat the cheese. All of it. Your breath could now strip paint. (+10 health)' },
    bread: { name: 'loaf of bread', kw: ['bread', 'loaf'], type: 'food', heal: 8, value: 2,
      desc: 'Dense, dark bread. Could double as a weapon in a pinch.',
      use: 'You eat the bread. It fights back a little, but you win. (+8 health)' },
    holy_water: { name: 'flask of holy water', kw: ['holy', 'water', 'flask'], type: 'throw', dmg: 28, value: 15,
      desc: "Blessed by Sister Maud. 'throw' it at the undead for 28 damage." },
    torch: { name: 'torch', kw: ['torch', 'light'], type: 'tool', value: 3,
      desc: "A pitch-soaked torch. While you carry it, dark places aren't." },
    lockpicks: { name: 'lockpicks', kw: ['lockpicks', 'picks', 'lockpick'], type: 'tool', value: 0,
      desc: "A rogue's best friend. Use 'pick lock' near something locked." },

    // --- Keys: needed to get past locked doors (they can't be sold or dropped) ---
    postern_key: { name: 'rusted postern key', kw: ['key', 'postern', 'rusted', 'rusty'], type: 'key', value: 0,
      desc: "A heavy iron key, crusted with rust and something worse. Its tag reads 'POSTERN'." },
    crown_key: { name: 'crown key', kw: ['key', 'crown', 'golden'], type: 'key', value: 0,
      desc: 'A golden key whose bow is shaped like a tiny crown.' },
    cell_keys: { name: 'ring of cell keys', kw: ['keys', 'key', 'cell', 'ring'], type: 'key', value: 0,
      desc: "A jailer's ring of keys, each one labelled in a cramped, unpleasant hand." },

    // --- Scrolls and tomes: "read" one to learn its spell (it is used up) ---
    scroll_light: { name: 'scroll of light', kw: ['scroll', 'light'], type: 'scroll', spell: 'light', value: 15,
      desc: "A scroll inscribed with the spell Light. 'read' it to learn the spell." },
    scroll_firebolt: { name: 'scroll of firebolt', kw: ['scroll', 'firebolt', 'fire'], type: 'scroll', spell: 'firebolt', value: 30,
      desc: "A scroll inscribed with the spell Firebolt. 'read' it to learn the spell." },
    scroll_mending: { name: 'scroll of mending', kw: ['scroll', 'mending', 'heal', 'healing'], type: 'scroll', spell: 'heal', value: 25,
      desc: "A scroll inscribed with the spell Mending. 'read' it to learn the spell." },
    scroll_knock: { name: 'scroll of knock', kw: ['scroll', 'knock', 'unlock'], type: 'scroll', spell: 'knock', value: 20,
      desc: "A scroll inscribed with the spell Knock. 'read' it to learn the spell." },
    tome_frost: { name: 'tome of frost', kw: ['tome', 'frost', 'book', 'ice'], type: 'scroll', spell: 'frost', value: 30,
      desc: "A book bound in pale blue leather, cold to the touch. 'read' it to learn Frost Shard." },
    tome_lightning: { name: 'tome of lightning', kw: ['tome', 'lightning', 'book', 'storm'], type: 'scroll', spell: 'lightning', value: 40,
      desc: "A book that crackles when you open it. Your hair stands on end. 'read' it to learn Chain Lightning." },
    tome_smite: { name: 'tome of holy smite', kw: ['tome', 'holy', 'smite', 'book', 'prayer'], type: 'scroll', spell: 'smite', value: 30,
      desc: "A prayer book with a golden sun on the cover. 'read' it to learn Holy Smite." },

    // --- Gold, treasure to sell, and notes with clues ---
    coin_purse: { name: "hunter's coin purse", kw: ['purse', 'coin', 'coins', 'hunters', 'pouch'], type: 'gold', amount: 14,
      desc: 'A small leather purse. It clinks.' },
    wolf_pelt: { name: 'wolf pelt', kw: ['pelt', 'fur', 'wolf', 'skin'], type: 'treasure', value: 12,
      desc: 'A thick grey pelt. Bram or Nettle would buy it.' },
    candlestick: { name: 'tarnished candlestick', kw: ['candlestick', 'candle', 'tarnished'], type: 'treasure', value: 10,
      desc: 'Silver, under all that tarnish. Probably worth something to a shopkeeper.' },
    silver_goblet: { name: 'silver goblet', kw: ['goblet', 'silver', 'cup'], type: 'treasure', value: 40,
      desc: 'A jeweled royal goblet. Shopkeepers will pay well for it.' },
    royal_scepter: { name: 'royal scepter', kw: ['scepter', 'sceptre', 'royal', 'rod'], type: 'treasure', value: 60,
      desc: "Varkhul's scepter, heavy with gold and bad decisions. Worth a small fortune." },
    old_note: { name: 'charred note', kw: ['note', 'charred', 'paper', 'letter'], type: 'note', value: 0,
      desc: 'A half-burnt page in a spidery hand.',
      text: "...the King's heart is no longer in his chest. He keeps it below, among the bones, in a jar of black glass. While the jar endures, so does he. Strike him down a hundred times and he will rise a hundred times. I have hidden the way down beneath his own throne, for he is vain, and would never think to look under his own seat... — Court Wizard Ellery" },
    diary: { name: "alchemist's diary", kw: ['diary', 'journal', 'alchemists', 'book'], type: 'note', value: 0,
      desc: 'A stained diary, most of its pages glued together by spilled reagents.',
      text: "Day 302: The King had me enchant a gargoyle to guard the crown key on the tower roof. The gargoyle has started guarding the rest of the roof too. And my lunch. Day 303: Stone hide makes it shrug off swords. Magic, however, gets right through. Must remember this. Day 304: I have remembered this. It ate my lunch again." },
  };

  // ------------------------------------------------------------- ENEMIES
  // Every monster, looked up by its ID.
  //   name / kw     - display name, and words the player can type to target it
  //   proper: true  - it's a named character, so messages say "Grumbold"
  //                   rather than "the Grumbold"
  //   hp            - health points (damage needed to defeat it)
  //   dmg           - [lowest, highest] damage it deals per hit
  //   def           - armor that reduces the player's weapon damage
  //   xp            - experience points the player earns for winning
  //   gold          - [lowest, highest] coins it drops
  //   art           - which picture from ART to show
  //   aggressive    - true = attacks as soon as you enter the room;
  //                   false = waits (like the troll, who wants a toll first)
  //   undead        - true = holy water, Holy Smite and the silver sword hurt it more
  //   drops         - items it may leave behind; chance 1 = always, 0.4 = 40%
  //   poison / drain / special - special powers that game.js checks for
  //   intro / hits / death     - text shown when the fight starts, when it
  //                              hits you ({d} becomes the damage), and when it dies
  const ENEMIES = {
    rat: { name: 'giant rat', kw: ['rat', 'giant'], hp: 10, dmg: [1, 4], def: 0, xp: 6, gold: [0, 2], art: 'rat', aggressive: true,
      intro: 'A giant rat the size of a sheepdog lunges at you, squeaking with what can only be called malice!',
      hits: ['The rat sinks its yellow teeth into your ankle ({d} damage).', 'The rat scrabbles up your leg and bites ({d} damage).'] },
    rat_swarm: { name: 'swarm of rats', kw: ['rats', 'swarm', 'rat'], hp: 20, dmg: [2, 4], def: 0, xp: 14, gold: [1, 4], art: 'rat', aggressive: true,
      intro: 'The larder explodes in a squeaking tide. A swarm of rats pours toward you!',
      hits: ['Rats swarm over your boots, biting ({d} damage).', 'A rat drops on you from a shelf ({d} damage). Why are they on the shelves?'] },
    wolf: { name: 'grey wolf', kw: ['wolf', 'grey', 'gray'], hp: 16, dmg: [2, 5], def: 1, xp: 10, gold: [0, 0], art: 'wolf', aggressive: true,
      drops: [{ id: 'wolf_pelt', chance: 0.4 }],
      intro: 'A grey wolf slinks out of the undergrowth, hackles raised, and springs at you!',
      hits: ["The wolf's jaws snap shut on your arm ({d} damage).", 'The wolf bowls you over and bites ({d} damage).'] },
    alpha_wolf: { name: 'Old One-Eye', proper: true, kw: ['wolf', 'one', 'eye', 'alpha', 'old'], hp: 36, dmg: [4, 8], def: 2, xp: 35, gold: [0, 0], art: 'wolf', aggressive: true,
      drops: [{ id: 'wolf_amulet', chance: 1 }, { id: 'wolf_pelt', chance: 1 }],
      intro: 'A massive grey wolf with one milky eye rises from the bones. Old One-Eye, the pack leader. He looks at you the way you look at a sandwich.',
      hits: ['Old One-Eye tears into you ({d} damage).', 'Old One-Eye slams into your chest, jaws first ({d} damage).'] },
    highwayman: { name: 'highwayman', kw: ['highwayman', 'bandit', 'man', 'robber', 'thief'], hp: 20, dmg: [3, 6], def: 1, xp: 14, gold: [6, 14], art: 'bandit', aggressive: true,
      intro: "A masked highwayman steps out from behind a tree. 'Your money or your life!' He doesn't wait for an answer, which seems rude.",
      hits: ['The highwayman slashes at you ({d} damage).', 'The highwayman kicks you somewhere unsporting ({d} damage).'] },
    skeleton: { name: 'skeleton', kw: ['skeleton', 'bones', 'skelly'], hp: 18, dmg: [2, 6], def: 2, xp: 12, gold: [2, 6], art: 'skeleton', aggressive: true, undead: true,
      intro: 'Bones rattle together into the shape of a skeleton, which raises a rusted blade and clatters toward you!',
      hits: ['The skeleton hacks at you with its rusty blade ({d} damage).', 'The skeleton punches you with a bony fist ({d} damage). It hurts more than it should.'] },
    ghoul: { name: 'mausoleum ghoul', kw: ['ghoul', 'mausoleum'], hp: 30, dmg: [3, 8], def: 2, xp: 28, gold: [4, 10], art: 'ghoul', aggressive: true, undead: true,
      drops: [{ id: 'postern_key', chance: 1 }],
      intro: 'A grey, hunched ghoul looks up from its meal — the old castellan, by the look of it. A rusty key dangles from its belt. It decides you look fresher.',
      hits: ['The ghoul rakes you with filthy claws ({d} damage).', 'The ghoul bites you. You will need a long bath ({d} damage).'] },
    troll: { name: 'Grumbold the troll', proper: true, kw: ['troll', 'grumbold'], hp: 65, dmg: [6, 12], def: 3, xp: 70, gold: [20, 30], art: 'troll', aggressive: false,
      intro: "Grumbold cracks his knuckles. 'Ooh, a fighter! I like fighters. They're crunchy.'",
      hits: ['Grumbold swats you like a fly ({d} damage).', 'Grumbold brings both fists down on you ({d} damage).', "Grumbold headbutts you. His head is mostly rock ({d} damage)."],
      death: "Grumbold topples off the bridge with a long, fading 'Oi, that's not fair!' A long while later there is a distant splash." },
    spider: { name: 'giant spider', kw: ['spider', 'giant'], hp: 32, dmg: [3, 7], def: 2, xp: 26, gold: [0, 4], art: 'spider', aggressive: true, poison: 0.3,
      intro: 'One of the cobwebs moves. Then it keeps moving, and it has legs. A giant spider drops from the rafters!',
      hits: ['The spider bites you ({d} damage).', 'The spider lashes you with a hairy leg ({d} damage).'] },
    animated_armor: { name: 'animated armor', kw: ['armor', 'armour', 'animated', 'suit', 'knight'], hp: 45, dmg: [4, 8], def: 5, xp: 35, gold: [5, 12], art: 'armor', aggressive: true,
      intro: 'An empty suit of armor clanks to its feet, raises a sword, and strides toward you. Nobody is home, but it is very much awake.',
      hits: ['The armor swings its greatsword ({d} damage).', 'The armor slams you with a steel gauntlet ({d} damage).'] },
    gargoyle: { name: 'gargoyle', kw: ['gargoyle', 'statue', 'stone'], hp: 55, dmg: [5, 9], def: 7, xp: 50, gold: [0, 0], art: 'gargoyle', aggressive: true,
      drops: [{ id: 'crown_key', chance: 1 }],
      intro: 'One of the gargoyles stretches, cracks its stone neck, and spreads its wings. Something golden hangs around its neck. It screeches and dives!',
      hits: ['The gargoyle rakes you with stone talons ({d} damage).', 'The gargoyle crashes into you like a falling wall ({d} damage).'] },
    jailer: { name: 'ghoul jailer', kw: ['jailer', 'ghoul', 'guard'], hp: 46, dmg: [4, 9], def: 3, xp: 40, gold: [5, 12], art: 'ghoul', aggressive: true, undead: true,
      drops: [{ id: 'cell_keys', chance: 1 }],
      intro: "The jailer looks up from its card game. A ring of keys jangles at its hip. 'New prisoner,' it rasps, and reaches for you.",
      hits: ['The jailer clubs you with a cudgel ({d} damage).', "The jailer's claws find a gap in your guard ({d} damage)."] },
    wraith: { name: 'wraith', kw: ['wraith', 'ghost', 'spirit', 'spectre', 'specter'], hp: 52, dmg: [5, 10], def: 2, xp: 48, gold: [0, 0], art: 'wraith', aggressive: true, undead: true, drain: 5,
      intro: 'The black water ripples. A wraith rises from it, trailing cold mist, and shrieks loud enough to curdle your bones.',
      hits: ['The wraith passes through you. Everything goes cold ({d} damage).', "The wraith's icy fingers close on your heart ({d} damage)."] },
    bone_golem: { name: 'bone golem', kw: ['golem', 'bone', 'bones'], hp: 75, dmg: [7, 13], def: 5, xp: 75, gold: [0, 0], art: 'golem', aggressive: true, undead: true,
      intro: 'The piles of bones rattle, rise and lock together into a hulking golem. It steps between you and the black jar.',
      hits: ['The bone golem crushes you with a fist made of femurs ({d} damage).', 'The golem flings a skull at you ({d} damage). Rude.'] },
    // The final boss. special: 'lich' tells game.js to use his unique rules:
    // a powerful spell every third turn, and coming back to life until his
    // phylactery (the jar holding his soul, in the Bone Pit) is smashed.
    lich: { name: 'Varkhul, the Hollow King', proper: true, kw: ['lich', 'varkhul', 'king', 'hollow'], hp: 150, dmg: [10, 16], def: 4, xp: 250, gold: [0, 0], art: 'lich', aggressive: true, undead: true, special: 'lich',
      intro: "'A visitor! How long since anyone came down here who wasn't already dead. Don't worry,' says the Hollow King, raising a skeletal hand. 'That's easily arranged.'",
      hits: ['Varkhul lashes you with a whip of shadow ({d} damage).', "Varkhul's cold hand closes on your shoulder and steals your warmth ({d} damage)."],
      death: 'Varkhul shrieks as his crown clatters to the floor. His body crumbles into ash, his robes into dust, and with no jar to call him home, he does not come back. The green runes flicker and go dark.' },
  };

  // Hand the finished catalogue back so it is stored in window.GameData.
  // ROOMS starts as an empty object {}; rooms.js fills it in next.
  return { ART, CLASSES, SPELLS, ITEMS, ENEMIES, ROOMS: {} };
})();
