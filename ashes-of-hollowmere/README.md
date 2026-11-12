# Ashes of Hollowmere

A browser text adventure with combat and magic, in the spirit of classic interactive fiction.

**Play it here:** https://rabnerjon.github.io/Games/ashes-of-hollowmere/

For twenty years, Castle Duskholm has brooded over the village of Hollowmere. Its king
wanted to live forever, and now, as the Hollow King, he is dragging the dead out of
their graves every night. Choose to play as a Warrior, Mage or Rogue and put a stop to it.

## Features

- Type commands in plain English (`examine well`, `give cheese to troll`, `cast firebolt`), or click buttons
- Turn-based combat with 15 enemy types and a final boss
- 9 learnable spells, potions, weapons, armor and shops
- 28 locations to explore, with puzzles that have more than one solution
- ASCII art, health and mana bars, and a map that fills in as you explore
- Saves automatically in your browser
- **Hall of Records** on the start screen: lifetime stats (adventures begun, victories, deaths,
  highest level, fastest victory) kept in `localStorage`, so they survive refreshing or closing the browser

## Running it locally

There's nothing to install or build. Just open `index.html` in a web browser, or serve the folder with any static web server.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page layout |
| `style.css` | Look and feel |
| `data.js` | Art, classes, spells, items and enemies |
| `rooms.js` | The world map, characters and puzzles |
| `game.js` | Game engine, command parser and interface |
| `SECURITY.md` | Security review |

Built with Claude (Anthropic) as a vibe-coding class project.
