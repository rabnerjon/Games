# Ashes of Hollowmere

A browser text adventure with combat and magic, in the spirit of classic interactive fiction.

**Play it here:** https://rabnerjon.github.io/Games/ashes-of-hollowmere/

For twenty years, Castle Duskholm has brooded over the village of Hollowmere. Its king
wanted to live forever, and now, as the Hollow King, he is dragging the dead out of
their graves every night. Choose to play as a Warrior, Mage or Rogue and put a stop to it.

## Features

- Type commands in plain English (`examine well`, `give cheese to troll`, `cast firebolt`), or click buttons
- Turn-based combat with 21 enemy types and two bosses
- 12 learnable spells, potions, weapons, armor and shops
- 39 locations to explore, with puzzles that have more than one solution
- ASCII art, health and mana bars, and a map that fills in as you explore
- A **quest journal** (`journal`, or the Quests panel) that tracks the main quest and side quests
- **Brewing**: learn recipes, gather ingredients and `brew` potions at a cauldron
- Saves automatically in your browser
- **Hall of Records** on the start screen: lifetime stats (adventures begun, victories, deaths,
  highest level, fastest victory) kept in `localStorage`, so they survive refreshing or closing the browser

## Expansion: The Drowned Mere

West of the Whispering Woods lies the mere that gave Hollowmere its name. Twenty years ago
the Hollow King drowned his own queen there, and the village of Mereside went down with her.
Some nights you can still hear the chapel bell ringing under the water.

- 10 new locations, including a dark bog, a drowned village and a sunken chapel
- 6 new enemies, including a new boss: the Drowned Queen
- 3 new spells: Tidecall, Mire Grasp and Purify
- New people: Odda the ferrywoman and Grizel the bog witch
- Three side quests: *The Drowned Bell*, *Grizel's Remedy* and *Rest for the Drowned*
- An optional relic, the **Tear of the Mere**, that stops the Hollow King from rising again

The expansion is entirely optional; the original route to victory works exactly as before.
Saves from before the expansion still load, and the new region is ready for them.

## Running it locally

There's nothing to install or build. Just open `index.html` in a web browser, or serve the folder with any static web server.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page layout |
| `style.css` | Look and feel |
| `data.js` | Art, classes, spells, items and enemies |
| `rooms.js` | The world map, characters and puzzles |
| `systems.js` | Quests (the journal) and brewing recipes |
| `mere.js` | The Drowned Mere expansion: its rooms, people, monsters, items, spells and art |
| `game.js` | Game engine, command parser and interface |
| `SECURITY.md` | Security review |

Built with Claude (Anthropic) as a vibe-coding class project.
