# Security Review — Ashes of Hollowmere

**Date:** November 5, 2026
**Scope:** `index.html`, `style.css`, `data.js`, `rooms.js`, `game.js`, plus hosting on GitHub Pages.

## What kind of site this is

A static, single-page browser game. There is no server, no database, no login, no
payments, no cookies, and no third-party code. The only data stored is the player's
saved game, kept in the browser's own `localStorage` on the player's own computer.

That rules out whole classes of attacks: SQL injection, stolen passwords, server
break-ins and session hijacking. What remains is attacks that run inside the
player's browser.

## Threats considered and results

| # | Threat | Risk to this site | Result |
|---|--------|-------------------|--------|
| 1 | **Cross-site scripting (XSS)**: typed text or a save file being run as code | Medium if present | **Not vulnerable.** All game text is written with `textContent`; the code never uses `innerHTML`, `eval`, `document.write` or similar. Tested by typing `<img src=x onerror=...>` and `<script>` payloads into the name box and command line; nothing ran. |
| 2 | **Malicious or corrupted save data**: someone edits `localStorage` | Medium | **Protected.** Saves are size-limited (100 KB), parsed in a `try/catch`, and every field is checked against known values (room/item/spell IDs, number ranges, data types). A fresh object is rebuilt from only the known fields. Tested with oversized, wrong-type, invalid-JSON and fake-room saves; all were rejected. |
| 3 | **Prototype pollution** via `__proto__` / `constructor` keys in a save | Low | **Fixed during review.** Such keys were already harmless, but `constructor` could slip into the flags list. The loader now rejects any key that matches a built-in object property. Tested: `({}).polluted` stays `undefined`. |
| 4 | **Injected or outside scripts** (e.g. if a future bug allowed injection) | Defence in depth | **Protected** by a Content Security Policy: `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; object-src 'none'`. Tested: inline scripts, scripts from other sites, and tracking images are all blocked. |
| 5 | **Clickjacking**: another site loading the game in a hidden frame | Low | **Fixed during review.** GitHub Pages can't send the `frame-ancestors` header, so the game now detects being framed and shows "open in its own tab" instead of running. Tested by framing it; it refused. |
| 6 | **Leaking data to other sites** | Low | **Protected.** The site makes no network requests, loads nothing from other domains, and sets `referrer` to `no-referrer`. |
| 7 | **Denial of service in the page** (huge input, endless output) | Low | **Protected.** Commands are capped at 120 characters, names at 20, and the output log keeps only the last 400 lines. |
| 8 | **Vulnerable third-party libraries** | n/a | **None used.** All code is hand-written; there is nothing to patch. |
| 9 | **Secrets in the repository** | n/a | **None.** No API keys, tokens or passwords exist anywhere in the project. |
| 10 | **Unencrypted connection** | Low | **Handled at publish time** by turning on "Enforce HTTPS" in GitHub Pages. |

## Accepted risk

- **Players can cheat** by editing their own save (for example, giving themselves gold),
  as long as the values stay within the valid ranges. The game runs entirely on the
  player's own computer, so this only affects that player's own game. It is not a
  security problem.

## Changes made during this review

1. `game.js`: save loader rejects keys such as `__proto__` and `constructor`.
2. `game.js`: refuses to run inside a frame on another site (clickjacking defence).

## Update — Hall of Records (November 11, 2026)

A second `localStorage` entry (`ashesOfHollowmere.records.v1`) now stores lifetime stats.
It gets the same treatment as saves: it is read inside `try/catch`, only known fields are kept,
numbers must be whole and in range, the hero name is stripped to letters, digits and spaces,
and everything is displayed with `textContent`. Tested with broken JSON, negative and text
values, and an `<img onerror>` name: bad values were discarded and no script ran.
