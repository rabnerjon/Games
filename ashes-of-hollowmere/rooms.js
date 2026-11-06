/* Ashes of Hollowmere — the world map, NPCs and puzzles.
   Each room: name, x/y/z (map position), art, desc (string or function),
   exits, items, enemy, npc, shop, features, and optional hooks:
     on.<verb>(g, noun, extra) -> true if the room handled the command
     canExit(g, dir) -> a message to block movement, or null
     onEnter(g, firstVisit)
   "g" is the small game API defined in game.js. */
'use strict';

(function () {
  const has = (noun, re) => re.test(noun || '');

  function openPostern(g) {
    if (g.flag('postern_open')) { g.print('The postern door is already open.'); return true; }
    if (g.has('postern_key')) {
      g.set('postern_open');
      g.print('The rusted key grinds, protests, and finally turns. The postern door creaks open onto the castle courtyard.', 'loot');
      g.xp(15);
      return true;
    }
    if (g.cls() === 'rogue' && g.has('lockpicks')) {
      g.print("The postern door is locked. Lucky for you, locks are more of a suggestion. Try 'pick lock'.");
    } else {
      g.print('The postern door is locked tight. There must be a key somewhere — or a spell, or someone with a less honest upbringing.');
    }
    return true;
  }

  function openThroneDoors(g) {
    if (g.flag('throne_unlocked')) { g.print('The great doors stand open.'); return true; }
    if (g.has('crown_key')) {
      g.set('throne_unlocked');
      g.print('You fit the crown key into the crowned lock. It turns with a sound like a sigh, and the great doors grind open.', 'loot');
      g.xp(20);
      return true;
    }
    g.print('The great doors are sealed by a lock shaped like a crown. You will need the matching key.');
    return true;
  }

  function freeSnik(g, how) {
    if (g.flag('snik_free')) { g.print('The cell is already open, and Snik is long gone.'); return true; }
    g.set('snik_free');
    g.print(how, 'loot');
    g.print("Snik bursts out and hugs your knees. 'FREE! Snik is FREE! Hero, here is Snik's secret: the Hollow King keeps his heart in a black jar, in the bone pit past the flooded crypt. Smash the jar FIRST, or he just gets back up. Also! Snik stole this from the armory. You have it.'", 'npc');
    g.give('silver_sword');
    g.print("Snik scampers off toward the cellar ladder, shouting something about starting a new life as an accountant.", 'npc');
    g.xp(30);
    return true;
  }

  const ROOMS = {
    // ================================================================ VILLAGE
    square: {
      name: 'Hollowmere — Village Square', x: 0, y: 0, z: 0, art: 'village',
      desc: "Mud, a sagging well, and a dozen houses huddled together like they're afraid of the dark — which, given the castle glowering on the northern ridge, is fair. A notice board leans beside the well. The Drowned Rat tavern is west, Bram's smithy clangs away to the east, and the little chapel sits south. The village gate lies north.",
      exits: { n: 'north_gate', w: 'tavern', e: 'smithy', s: 'chapel' },
      features: [
        { kw: ['board', 'notice', 'notices', 'sign'], text: "NOTICES:\n• REWARD: To whoever ends the curse of Castle Duskholm — the eternal gratitude of Hollowmere, and three chickens.\n• LOST: one cat, grey, answers to Pudding. Probably eaten.\n• The graveyard is CLOSED until the residents stop leaving.\n• The troll on the bridge is NOT a licensed toll collector. Please stop paying him. — Capt. Hode" },
        { kw: ['castle', 'ridge', 'duskholm'], text: 'Castle Duskholm squats on the ridge to the north, black against the sky. A green light flickers in its depths now and then, like it is thinking about you.' },
        { kw: ['houses', 'house', 'homes'], text: 'Shuttered, barred and garlanded with garlic. Someone has painted DEAD NOT WELCOME on a door. Someone else has added PLEASE.' },
      ],
      on: {
        examine(g, noun) {
          if (!has(noun, /well|bucket/)) return false;
          if (g.flag('well_coins')) { g.print('The well is deep, dark, and now entirely free of coins. The frog is still there, judging you.'); return true; }
          g.set('well_coins');
          g.addGold(5);
          g.print('You haul up the bucket. Inside: five gold coins and a very surprised frog. You keep the coins. The frog keeps its dignity. (+5 gold)', 'loot');
          return true;
        },
      },
    },
    tavern: {
      name: 'The Drowned Rat', x: -1, y: 0, z: 0, art: 'tavern',
      desc: "The Drowned Rat is warm, smoky, and roughly forty percent stale ale by volume. A fire crackles in the hearth. Behind the bar, Marta the innkeeper polishes a mug with the grim determination of someone who has given up on it ever being clean. You can 'rest' here for 5 gold, or 'list' what's for sale. The door leads east to the square.",
      exits: { e: 'square' },
      shop: ['ale', 'cheese', 'bread', 'torch'],
      npc: { id: 'marta', name: 'Marta', kw: ['marta', 'innkeeper', 'barkeep', 'woman'],
        desc: 'A broad woman with forearms like hams and the patient eyes of someone who has heard every excuse for an unpaid tab.',
        talk: [
          "'Welcome to the Drowned Rat. The name's a warning, not a menu item. Mostly.'",
          "'Heading for the castle? Then you'll meet Grumbold at the bridge. Ugly brute, charges a toll. Between you and me, he'd sell his own mother for a good wheel of cheese. Tried to, once.'",
          "'A bed's five gold — just say 'rest'. The sheets were washed this year. Probably.'",
          "'Ever since the old king went... hollow... the dead won't stay where we put them. Bad for business. Good for gravediggers. Busy lads.'",
        ] },
      on: {
        rest(g) {
          if (!g.spend(5)) { g.print("'Five gold for a bed, love. You've got the look of someone who has less than that.'", 'npc'); return true; }
          g.healFull();
          g.print('You pay Marta 5 gold and collapse into a lumpy bed. You dream of nothing, which is an improvement. You wake fully rested. (Health and mana restored. Game saved.)', 'heal');
          g.save();
          return true;
        },
      },
    },
    smithy: {
      name: "Bram's Smithy", x: 1, y: 0, z: 0, art: 'smithy',
      desc: "Heat rolls off Bram's forge in waves. Hammers, tongs and half-finished blades hang from every beam. Bram himself is built like his anvil, only with more eyebrows. Type 'list' to see his wares. The square is west; a muddy path leads south to Old Nettle's hut.",
      exits: { w: 'square', s: 'hut' },
      shop: ['iron_sword', 'battleaxe', 'leather_armor', 'chainmail', 'torch'],
      features: [{ kw: ['forge', 'anvil', 'fire'], text: 'The forge glows a happy orange. It is the only cheerful thing for miles.' }],
      npc: { id: 'bram', name: 'Bram', kw: ['bram', 'smith', 'blacksmith', 'man'],
        desc: 'A slab of a man with a leather apron, a burn-scarred grin and eyebrows that have survived several forge accidents.',
        talk: [
          "'Bram. Smith. I make things sharp, and other things dead. Say 'list' if you're buying.'",
          "'The castle? Portcullis has been rusted shut since before my beard. There's a little postern door, but the key went into the mausoleum with the old castellan. Something's been chewing on him since.'",
          "'A rogue could pick that postern lock, I'd wager. Not that I'd know anything about that. I'm very honest. Look at my honest face.'",
          "'I'll buy anything you drag back, at half price. Wolf pelts, silver, old crowns. No questions. Well, a few questions. Mostly about the smell.'",
        ] },
    },
    hut: {
      name: "Old Nettle's Hut", x: 1, y: 1, z: 0, art: 'hut',
      desc: "Old Nettle's hut is a crooked thing of wattle, daub and suspicious smells. Herbs hang from the rafters and shelves of bottles glint in the gloom. Some of the bottles are watching you. Old Nettle grins from her rocking chair. Type 'list' for potions and scrolls. The path leads north.",
      exits: { n: 'smithy' },
      shop: ['healing_potion', 'mana_potion', 'greater_healing', 'scroll_light', 'scroll_firebolt', 'scroll_mending'],
      features: [{ kw: ['bottles', 'bottle', 'shelves'], text: 'One of the bottles winks at you. You decide not to buy that one.' },
        { kw: ['cat', 'cats'], text: 'There are either two cats or one cat in two places. Neither of them will hold still long enough for you to find out.' }],
      npc: { id: 'nettle', name: 'Old Nettle', kw: ['nettle', 'old', 'witch', 'herbalist', 'woman'],
        desc: 'A tiny, ancient woman with more wrinkles than a map and very sharp, very amused eyes.',
        talk: [
          "'Heh. A visitor. Mind the cat — no, the other cat. The one that's mostly in this dimension.'",
          "'Potions, scrolls, sundries. Say 'list'. No refunds if you explode.'",
          "'The Hollow King? Liches keep their souls tucked away in a jar somewhere safe. Smash the jar before you smash the lich, or you'll just be making him angry in installments.'",
          "'It's dark in that castle. Carry a torch or learn the Light spell. Or grow excellent night vision and a high tolerance for spiders.'",
        ] },
    },
    chapel: {
      name: 'Chapel of the Dawn', x: 0, y: 1, z: 0, art: 'chapel',
      desc: "A small stone chapel, cool and quiet. Candles flicker before a worn statue of the Lady of Dawn. Sister Maud tends them, humming a hymn slightly off-key. You can 'pray' here to be healed for free. The square is north.",
      exits: { n: 'square' },
      shop: ['holy_water'],
      features: [{ kw: ['statue', 'lady', 'dawn', 'candles'], text: 'The Lady of Dawn smiles serenely. Someone has left her a turnip as an offering. She seems to appreciate it.' }],
      npc: { id: 'maud', name: 'Sister Maud', kw: ['maud', 'sister', 'nun', 'priestess'],
        desc: 'A small, round, unflappable woman in grey robes. She has buried half the village twice.',
        onTalk(g) {
          if (g.flag('maud_gift')) return false;
          g.set('maud_gift');
          g.print("'Bless you, traveler. Take this — holy water. Throw it at the dead and they'll remember why they stopped moving.'", 'npc');
          g.give('holy_water');
          return true;
        },
        talk: [
          "'If you are wounded, kneel and 'pray'. The Lady heals freely. She is very generous. Unlike the tavern.'",
          "'The dead in the graveyard rose again last night. I've started labelling the coffins RETURN TO SENDER.'",
          "'I sell more holy water if you need it. Fifteen gold. The Lady doesn't charge, but the flasks do.'",
        ] },
      on: {
        pray(g) {
          g.healHp();
          g.print('You kneel before the Lady of Dawn. Warm light settles over you like a blanket fresh from the line. Your wounds close. (Health restored.)', 'heal');
          return true;
        },
      },
    },
    north_gate: {
      name: 'Village Gate', x: 0, y: -1, z: 0, art: 'gate',
      desc: 'A wooden palisade rings Hollowmere, and this sagging gate is its only way north. Captain Hode leans on a spear beside it, doing an excellent impression of a man who is awake. The square lies south; Crow Road runs north.',
      exits: { s: 'square', n: 'road' },
      npc: { id: 'hode', name: 'Captain Hode', kw: ['hode', 'captain', 'guard', 'man'],
        desc: 'A weathered, unshaven guard captain whose armor fit him twenty pounds ago.',
        talk: [
          "'Captain Hode, Hollowmere Watch. Well. Watch is generous. It's me and a dog, and the dog's off duty.'",
          "'North is Crow Road. The woods to the west are full of wolves. The graveyard to the east is full of the formerly deceased. The castle's straight on, past the troll.'",
          "'Word of advice: if a fight's going badly, 'flee'. Dead heroes do get songs, but they can't hear them.'",
          "'Wolf pack's leader is an old brute called One-Eye. Kill him and you'll be a legend. Or lunch. Fifty-fifty.'",
        ] },
    },

    // ============================================================= WILDERNESS
    road: {
      name: 'Crow Road', x: 0, y: -2, z: 0, art: 'road',
      desc: 'Crow Road winds north toward the ridge where Castle Duskholm squats against the sky, black and broken. The crows here are fat and confident. To the west, the Whispering Woods crowd close; to the east, the leaning stones of a graveyard. The village gate is back south.',
      exits: { s: 'north_gate', n: 'bridge', w: 'woods', e: 'graveyard' },
      encounter: { chance: 0.25, pool: ['highwayman', 'wolf'] },
      features: [{ kw: ['crows', 'crow'], text: 'A crow looks you up and down, then makes a noise that sounds a lot like a laugh.' }],
    },
    woods: {
      name: 'Whispering Woods', x: -1, y: -2, z: 0, art: 'woods',
      desc: 'The Whispering Woods earn their name: the wind moves through the pines in hushed voices, saying nothing nice. Paw prints the size of dinner plates cross the trail. A narrow track leads north, deeper in. The road is east.',
      exits: { e: 'road', n: 'wolf_den' },
      enemy: 'wolf', items: ['coin_purse'],
      encounter: { chance: 0.3, pool: ['wolf'] },
      features: [{ kw: ['prints', 'paw', 'tracks'], text: 'Big prints. Lots of them. They lead north, toward the den.' }],
    },
    wolf_den: {
      name: 'Wolf Den', x: -1, y: -3, z: 0, art: 'den',
      desc: 'A hollow beneath an ancient, lightning-split oak. Bones litter the ground, some of them alarmingly recent. The air smells of wet fur and bad decisions. The trail leads back south.',
      exits: { s: 'woods' },
      enemy: 'alpha_wolf', items: ['healing_potion'],
      features: [{ kw: ['bones', 'bone'], text: 'Deer, mostly. One boot. You decide not to look closer at the boot.' },
        { kw: ['oak', 'tree'], text: 'Split down the middle by lightning long ago, and still stubbornly alive. You respect that.' }],
    },
    graveyard: {
      name: 'Hollowmere Graveyard', x: 1, y: -2, z: 0, art: 'graveyard',
      desc: 'Hollowmere graveyard has a real problem with occupancy. Half the graves are open — from the inside. Crooked headstones lean in the mist. A stone mausoleum looms to the north. The road is west.',
      exits: { w: 'road', n: 'mausoleum' },
      enemy: 'skeleton',
      encounter: { chance: 0.3, pool: ['skeleton'] },
      features: [{ kw: ['headstone', 'headstones', 'graves', 'grave', 'stones'], text: "One headstone reads: HERE LIES TOBIAS, WHO SAID 'IT'S ONLY A SMALL TROLL'. The grave is empty." }],
    },
    mausoleum: {
      name: 'The Mausoleum', x: 1, y: -3, z: 0, art: 'mausoleum',
      desc: "Cold, dark and quiet as... well, exactly. Stone shelves hold the remains of Duskholm's old castellans, or what's left of them after something has had a good chew. The way out is south.",
      exits: { s: 'graveyard' },
      enemy: 'ghoul', items: ['tome_smite'],
      features: [{ kw: ['shelves', 'remains', 'castellans', 'castellan'], text: 'The nameplates read like a list of very unlucky men. The newest one is mostly bones and a gnawed belt.' }],
    },
    bridge: {
      name: 'The Chasm Bridge', x: 0, y: -3, z: 0, art: 'bridge',
      desc(g) {
        let s = "A narrow stone bridge spans a chasm so deep that dropped stones take a while to stop screaming. A crooked sign reads TOLE. ";
        if (g.enemyHere()) {
          s += g.flag('troll_paid')
            ? 'Grumbold the troll lounges against the parapet, counting your coins again and waving you through.'
            : "At the near end squats an enormous troll — Grumbold — picking his teeth with what you hope is a stick. He holds out a hand the size of a cartwheel. You could 'pay' him, 'give' him something, 'talk' to him... or fight.";
        } else {
          s += "The troll's spot is empty, apart from a deeply troll-shaped dent and a lingering smell of cheese.";
        }
        return s + ' The castle gate lies north across the bridge; the road is south.';
      },
      exits: { s: 'road', n: 'castle_gate' },
      enemy: 'troll',
      npc: { id: 'grumbold', name: 'Grumbold', kw: ['troll', 'grumbold'], present: (g) => g.enemyHere(),
        desc: 'Nine feet of warty grey troll, wearing a waistcoat that has given up. He smells of moss and ambition.',
        talk: [
          "'Oi. This is a toll bridge. Toll is fifteen gold. Or summink tasty. Or I eat you, which is also summink tasty, so I win either way.'",
          "'Don't look at me like that. I got overheads. Bridge upkeep. Moss. You any idea what moss costs these days?'",
          "'Cheese. Now there's a word. Big stinky wheel o' cheese... ' (he drools a little) '...ahem. Fifteen gold.'",
        ] },
      canExit(g, dir) {
        if (dir === 'n' && g.enemyHere() && !g.flag('troll_paid')) {
          return "Grumbold plants a foot the size of a gravestone in your path. 'Toll first, friend. Fifteen gold — or summink tasty.'";
        }
        return null;
      },
      on: {
        pay(g) {
          if (!g.enemyHere()) { g.print('There is nobody to pay. You could leave money on the ground, but the crows would only spend it on shiny things.'); return true; }
          if (g.flag('troll_paid')) { g.print("'You already paid, friend. I'm a troll of my word. Mostly.'", 'npc'); return true; }
          if (!g.spend(15)) { g.print("Grumbold counts your coins on fingers that are mostly knuckle. 'That's not fifteen. That's sad.'", 'npc'); return true; }
          g.set('troll_paid');
          g.print("Grumbold bites each coin, tucks them somewhere you'd rather not think about, and squeezes aside. 'Pleasure doin' business. Mind the drop.' (-15 gold)", 'npc');
          return true;
        },
        give(g, noun, itemId) {
          if (!g.enemyHere()) return false;
          if (itemId !== 'cheese') {
            if (itemId) { g.print("Grumbold sniffs it and hands it back. 'Can't eat that. Well — I CAN. But I won't.'", 'npc'); return true; }
            return false;
          }
          g.take('cheese');
          g.removeEnemy();
          g.set('troll_gone');
          g.print("Grumbold's eyes go wide and wet. 'Is that... Stinking Bishop?' He cradles the cheese like a newborn. 'Bridge is yours, friend. I'm retiring. Gonna open a little cheese shop.' Before he lumbers off, he presses something into your hand. 'Found it on the last feller. He didn't need it. On account of I ate him.'", 'npc');
          g.give('greater_healing');
          g.xp(40);
          return true;
        },
      },
    },

    // ================================================================ CASTLE
    castle_gate: {
      name: 'Gatehouse of Castle Duskholm', x: 0, y: -4, z: 0, art: 'castle_gate',
      desc(g) {
        return 'The gatehouse of Castle Duskholm. The great portcullis is rusted shut, its teeth sunk deep in the earth. To one side, a small postern door is set into the wall — ' +
          (g.flag('postern_open') ? 'now standing open.' : 'firmly locked.') + ' The bridge is south.';
      },
      exits: { s: 'bridge', n: 'courtyard' },
      features: [{ kw: ['portcullis', 'gate', 'bars'], text: 'Twenty years of rust have welded it shut. It is not going anywhere, and neither are you — not this way.' },
        { kw: ['postern', 'door', 'lock'], text: 'A small, iron-bound door with a large, unfriendly lock.' }],
      canExit(g, dir) {
        if (dir === 'n' && !g.flag('postern_open')) return 'The portcullis is rusted shut and the postern door is locked. You need a key — or another way through that lock.';
        return null;
      },
      on: {
        open(g, noun) {
          if (has(noun, /portcullis|gate/)) { g.print('You heave at the portcullis. It does not so much as creak. Twenty years of rust have opinions.'); return true; }
          return openPostern(g);
        },
        unlock(g) { return openPostern(g); },
        picklock(g) {
          if (g.flag('postern_open')) { g.print('It is already open. Your talents are wasted here.'); return true; }
          if (g.cls() === 'rogue' && g.has('lockpicks')) {
            g.set('postern_open');
            g.print('You kneel, slide two picks into the lock and listen. Click... click... clunk. The postern door swings open. Somewhere, a locksmith weeps.', 'loot');
            g.xp(15);
          } else if (g.has('lockpicks')) {
            g.print('You poke at the lock with the picks. One of them snaps. You decide to leave this to professionals.');
          } else {
            g.print('You would need lockpicks — and the sort of upbringing that involves lockpicks.');
          }
          return true;
        },
        knock(g) {
          if (g.flag('postern_open')) { g.print('The door is already open. The spell fizzles, a little embarrassed.'); return true; }
          g.set('postern_open');
          g.print("You trace the rune of Knock. The lock's tumblers spin in a panic and the postern door bangs open.", 'magic');
          g.xp(15);
          return true;
        },
      },
    },
    courtyard: {
      name: 'Castle Courtyard', x: 0, y: -5, z: 0, art: 'courtyard',
      desc(g) {
        return 'The courtyard is a ruin of cracked flagstones and dead weeds. A dry fountain holds a statue of King Varkhul; someone has thoughtfully painted on a moustache. ' +
          (g.roomHas('torch') ? 'An iron sconce on the wall still holds an unlit torch. ' : 'An empty iron sconce hangs on the wall. ') +
          'The great hall is north, the armory west, and a crumbling tower rises to the east. The gatehouse is south.';
      },
      exits: { s: 'castle_gate', n: 'great_hall', w: 'armory', e: 'tower_base' },
      items: ['torch'],
      encounter: { chance: 0.15, pool: ['skeleton'] },
      features: [{ kw: ['statue', 'fountain', 'varkhul', 'moustache', 'mustache'], text: "A stern king in stone, holding a scepter, wearing a magnificent painted moustache. The plaque reads: VARKHUL THE ETERNAL. Below, scratched in later: 'ETERNAL PAIN IN THE NECK'." },
        { kw: ['sconce'], text: 'An iron torch holder bolted to the wall.' }],
    },
    armory: {
      name: 'Armory', x: -1, y: -5, z: 0, art: 'armory',
      desc: 'Racks of rusted weapons, toppled suits of armor, and enough cobwebs to rig a ship. Several of the cobwebs are larger than you, which is a worrying thing to notice about cobwebs. The courtyard is east.',
      exits: { e: 'courtyard' },
      enemy: 'spider', items: ['knight_plate', 'steel_sword'],
      features: [{ kw: ['cobwebs', 'cobweb', 'webs', 'web'], text: 'Thick, sticky and decorated with the husks of things that were once rats. Or small dogs.' },
        { kw: ['racks', 'weapons', 'rack'], text: 'Mostly rust held together by habit. A couple of pieces look salvageable.' }],
    },
    tower_base: {
      name: 'East Tower — Base', x: 1, y: -5, z: 0, art: 'tower',
      desc: 'The base of the east tower. A spiral staircase corkscrews upward into shadow. Scorch marks blacken the walls, as if someone up there once had a serious disagreement with chemistry. The courtyard is west.',
      exits: { w: 'courtyard', u: 'tower_study' },
    },
    tower_study: {
      name: "East Tower — Alchemist's Study", x: 1, y: -5, z: 1, art: 'study',
      desc: 'An alchemist\'s study, frozen mid-experiment twenty years ago. Glassware, cold cauldrons and drifts of notes cover every surface. Frost rimes one corner of the room where it has no business being. Stairs lead up and down.',
      exits: { d: 'tower_base', u: 'tower_top' },
      items: ['staff_embers', 'tome_frost', 'mana_potion', 'diary'],
      features: [{ kw: ['frost', 'corner', 'ice'], text: 'The frost spreads out from a pale blue book. Magic, leaking.' },
        { kw: ['glassware', 'cauldrons', 'cauldron', 'notes'], text: "Most labels have faded, but one jar clearly reads DO NOT LICK. It has a tongue print on it." }],
    },
    tower_top: {
      name: 'East Tower — Roof', x: 1, y: -5, z: 2, art: 'roof',
      desc: "The windswept roof of the tower. The whole valley spreads below: Hollowmere's few lights, the black woods, the chasm. Stone gargoyles crouch along the battlements. One of them is breathing. Stairs lead down.",
      exits: { d: 'tower_study' },
      enemy: 'gargoyle',
      features: [{ kw: ['view', 'valley', 'village'], text: 'From up here, Hollowmere looks small and brave, like a candle in a very big room.' },
        { kw: ['gargoyles', 'battlements'], text: 'Ordinary stone gargoyles. Probably. You poke one. It does not poke back. Good.' }],
    },
    great_hall: {
      name: 'Great Hall', x: 0, y: -6, z: 0, art: 'hall',
      desc(g) {
        return 'The great hall of Duskholm. Long tables lie overturned, banners hang in rags, and moonlight falls through a broken roof. ' +
          (g.flag('throne_unlocked') ? 'The great doors to the north stand open.' : 'Great iron-bound doors to the north are sealed with a lock shaped like a crown.') +
          ' Doorways lead west to the kitchens and east to the library. The courtyard is south.';
      },
      exits: { s: 'courtyard', w: 'kitchen', e: 'library', n: 'throne_room' },
      enemy: 'animated_armor', items: ['candlestick'],
      features: [{ kw: ['doors', 'door', 'lock', 'crown'], text: 'Iron-bound oak, ten feet tall. The keyhole sits in the middle of a carved crown.' },
        { kw: ['banners', 'banner', 'tables'], text: 'The banners show a black tower on a grey field. Whoever designed the Duskholm crest did not believe in cheerfulness.' }],
      canExit(g, dir) {
        if (dir !== 'n' || g.flag('throne_unlocked')) return null;
        if (g.has('crown_key')) { openThroneDoors(g); return null; }
        return 'The great doors are sealed by a lock shaped like a crown. You will need the matching key.';
      },
      on: {
        unlock(g, noun) { if (has(noun, /door|lock|crown/) || !noun) return openThroneDoors(g); return false; },
        open(g, noun) { if (has(noun, /door|lock|crown/) || !noun) return openThroneDoors(g); return false; },
        picklock(g) { g.print("You study the crowned lock. It is a royal lock, cunning and cursed. Your picks would just bend. You'll need its key."); return true; },
        knock(g) { g.print('Your Knock spell bounces off the crowned lock, which seems almost offended. Royal locks need royal keys.', 'magic'); return true; },
      },
    },
    kitchen: {
      name: 'Castle Kitchens', x: -1, y: -6, z: 0, art: 'kitchen',
      desc: 'The castle kitchens. A cauldron the size of a bathtub hangs over a long-dead fire. Something has been eating the larder, and judging by the noises, it is not finished. A trapdoor in the floor leads down. The great hall is east.',
      exits: { e: 'great_hall', d: 'cellar' },
      enemy: 'rat_swarm', items: ['ladle', 'meat_cleaver', 'bread'],
      features: [{ kw: ['cauldron'], text: 'Something green and crusted lines the bottom. It may have been soup once. It may be sentient now.' },
        { kw: ['trapdoor', 'trap'], text: 'A wooden trapdoor with a ladder leading down into the dark.' }],
    },
    library: {
      name: "The Hollow King's Library", x: 1, y: -6, z: 0, art: 'library', dark: true,
      desc: "Towering shelves of books, several of which are muttering. This is where Varkhul kept his darker studies — and judging by the claw marks, some of the books bite back. The great hall is west.",
      exits: { w: 'great_hall' },
      items: ['tome_lightning', 'scroll_knock', 'old_note'],
      features: [{ kw: ['books', 'shelves', 'book'], text: "You pull a book at random: 'Liches and You: A Beginner's Guide to Eternal Life.' Chapter one is titled 'Pick a Good Jar.'" }],
    },
    throne_room: {
      name: 'Throne Room', x: 0, y: -7, z: 0, art: 'throne',
      desc(g) {
        return 'The throne room. A long carpet, rotted to threads, leads to a great throne of black iron — empty, yet somehow still occupied-feeling. ' +
          (g.flag('throne_moved') ? 'The throne has been shoved aside, revealing a stair spiraling down into green-lit darkness.' : 'Cold air seeps from beneath it.') +
          ' The great hall is south.';
      },
      exits: { s: 'great_hall', d: { to: 'sanctum', flag: 'throne_moved' } },
      items: ['royal_scepter', 'greater_healing'],
      features: [{ kw: ['throne', 'chair', 'seat'], text: 'Black iron, cold as a grave. There are long scrape marks on the floor around its base, as though it has been moved before. Cold air breathes from beneath it.' },
        { kw: ['carpet'], text: 'Once red. Now mostly holes holding hands.' }],
      on: {
        push(g, noun) {
          if (!has(noun, /throne|chair|seat/) && noun) return false;
          if (g.flag('throne_moved')) { g.print('The throne is already pushed aside. The stair down is waiting.'); return true; }
          g.set('throne_moved');
          g.print('You set your shoulder to the iron throne and push. For a moment, nothing. Then, with a scream of metal on stone, it slides aside — revealing a spiral stair descending into green-lit darkness. Cold air breathes out, smelling of grave dust and very old magic.', 'magic');
          g.xp(20);
          return true;
        },
      },
    },

    // ============================================================== DUNGEON
    cellar: {
      name: 'Wine Cellar', x: -1, y: -6, z: -1, art: 'dungeon', dark: true,
      desc: 'A wine cellar, long since drunk dry by something with no lips. Broken barrels and shattered bottles crunch underfoot. A ladder leads up to the kitchen; a low archway leads east.',
      exits: { u: 'kitchen', e: 'guardroom' },
      enemy: 'rat', items: ['healing_potion'],
      features: [{ kw: ['barrels', 'barrel', 'bottles'], text: 'One barrel still sloshes. You sniff it. Vinegar, and something worse. You decide to stay sober.' }],
    },
    guardroom: {
      name: 'Dungeon Guardroom', x: 0, y: -6, z: -1, art: 'dungeon',
      desc: 'The dungeon guardroom. A table holds a half-finished game of cards — one hand is still clutching its cards, which is impressive for a hand with no arm attached. Cells lie to the north, a darker chamber east, and the cellar west.',
      exits: { w: 'cellar', n: 'cells', e: 'torture' },
      enemy: 'jailer',
      features: [{ kw: ['cards', 'table', 'hand', 'game'], text: 'The hand is holding three kings. It was winning. Sadly, it will never know.' }],
    },
    cells: {
      name: 'The Cells', x: 0, y: -7, z: -1, art: 'dungeon',
      desc(g) {
        return 'A row of rusted cells. Most are empty, unless you count the skeletons, and they would rather you did not. ' +
          (g.flag('snik_free') ? "The last cell stands open and empty, except for a scrawled note: THANK YOU — S." : 'In the last cell, a small green goblin is pressed against the bars, waving frantically at you.') +
          ' The guardroom is south.';
      },
      exits: { s: 'guardroom' },
      npc: { id: 'snik', name: 'Snik', kw: ['snik', 'goblin', 'prisoner'], present: (g) => !g.flag('snik_free'),
        desc: 'A skinny green goblin with enormous ears and a hopeful expression.',
        talk: [
          "'Psst! Big hero! Snik is innocent! Mostly! Open Snik's cell and Snik tells you a SECRET. A useful one!'",
          "'The jailer had keys. The jailer also had teeth. Snik recommends dealing with the teeth first.'",
          "'Snik has been in here so long, Snik has named all the rats. That one is Gerald. Gerald is a jerk.'",
        ] },
      features: [{ kw: ['cell', 'cells', 'bars', 'lock', 'door'], text: 'Rusty iron bars and a heavy lock. The last cell holds Snik.' }],
      on: {
        open(g, noun) {
          if (noun && !has(noun, /cell|door|bars|lock|snik|goblin/)) return false;
          if (g.flag('snik_free')) return freeSnik(g);
          if (g.has('cell_keys')) return freeSnik(g, 'You try three keys before the fourth turns with a clunk. The cell door swings open.');
          g.print("The cell is locked. The jailer must have the keys." + (g.cls() === 'rogue' ? " Or you could 'pick lock'." : ''));
          return true;
        },
        unlock(g, noun) { return this.open(g, noun); },
        picklock(g) {
          if (g.cls() === 'rogue' && g.has('lockpicks')) return freeSnik(g, 'You make short work of the old lock. Snik stares at you with deep professional admiration.');
          g.print('You lack the tools and the training. The keys would be easier.');
          return true;
        },
        knock(g) { return freeSnik(g, 'You cast Knock. The cell door flies open so hard it clangs against the wall.'); },
      },
    },
    torture: {
      name: 'Torture Chamber', x: 1, y: -6, z: -1, art: 'dungeon',
      desc: "The torture chamber. Racks, chains, and an iron maiden with a sign reading OUT OF ORDER. The walls have heard a lot of screaming and have opinions about it. The guardroom is west; a flooded passage leads east.",
      exits: { w: 'guardroom', e: 'crypt' },
      enemy: 'skeleton', items: ['greater_healing'],
      encounter: { chance: 0.2, pool: ['skeleton'] },
      features: [{ kw: ['maiden', 'iron', 'rack', 'chains', 'sign'], text: "The OUT OF ORDER sign has a smaller note pinned under it: 'Please do not hide in the iron maiden. — Management'." }],
    },
    crypt: {
      name: 'Flooded Crypt', x: 2, y: -6, z: -1, art: 'crypt',
      desc: 'A flooded crypt. Black water laps at stone sarcophagi, and your breath fogs in the deathly cold. Pale lights drift beneath the surface. The passage leads west; a narrow way north reeks of bone dust.',
      exits: { w: 'torture', n: 'bone_pit' },
      enemy: 'wraith', items: ['silver_goblet', 'mana_potion'],
      features: [{ kw: ['water', 'lights', 'sarcophagi', 'sarcophagus'], text: "The lights beneath the water look like faces. You decide they are fish. Very sad fish." }],
    },
    bone_pit: {
      name: 'The Bone Pit', x: 2, y: -7, z: -1, art: 'bonepit',
      desc(g) {
        return 'A vast pit of bones — thousands of them, sorted with horrible care into piles: skulls, ribs, femurs, miscellaneous. ' +
          (g.flag('phylactery_destroyed')
            ? 'Shards of black glass on the central altar are all that remain of the Hollow King\'s phylactery.'
            : "On an altar at the center sits a jar of black glass, pulsing faintly like a heartbeat. It practically begs to be smashed.") +
          ' The crypt is south.';
      },
      exits: { s: 'crypt' },
      enemy: 'bone_golem',
      features: [{ kw: ['jar', 'phylactery', 'glass', 'altar', 'vessel', 'heart'], text: "A jar of black glass, the size of a loaf of bread. Something inside beats slowly, like a heart. This is the Hollow King's phylactery. 'smash' it." }],
      on: {
        break(g, noun) {
          if (noun && !has(noun, /jar|phylactery|glass|vessel|altar|heart/)) return false;
          if (g.flag('phylactery_destroyed')) { g.print('The jar is already in pieces. You stamp on a shard for good measure. It feels great.'); return true; }
          g.set('phylactery_destroyed');
          g.print('You raise your weapon and bring it down on the black jar. It shatters with a scream that is not quite a sound — more a feeling, like every candle in the world going out at once. Far above, something howls in rage. The Hollow King is mortal again.', 'magic');
          g.xp(50);
          return true;
        },
        take(g, noun) {
          if (!has(noun, /jar|phylactery|glass|heart/)) return false;
          g.print("The jar is fused to the altar, and touching it makes your teeth ache. Better to 'smash' it.");
          return true;
        },
      },
    },
    sanctum: {
      name: "The Hollow King's Sanctum", x: 0, y: -8, z: -1, art: 'sanctum',
      desc(g) {
        if (g.flag('lich_dead')) return 'The sanctum is silent now. The green runes have gone dark, and a battered iron crown lies in a pile of ash. The stair leads up.';
        return 'A circular chamber carved with spiraling runes that glow a sickly green. At its heart floats Varkhul himself: a crowned skeleton in rotting royal robes, eyes burning with cold fire. The stair leads up.';
      },
      exits: { u: 'throne_room' },
      enemy: 'lich',
    },
  };

  window.GameData.ROOMS = ROOMS;
})();
