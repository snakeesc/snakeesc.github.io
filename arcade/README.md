# /arcade/ — Escape the Snake Arcade Edition

Full working game with the new neon arcade theme applied.
Drop this folder at the root of `snakeesc.github.io` so it's accessible at
`https://snakeesc.github.io/arcade/`.

## What this is

A complete clone of the production game with theme-only changes. Every gameplay
feature — upgrades, leaderboard, snake sheds, orb buffs, ghost frogs, scoreboard,
end-of-run summary — works identically to production. Only the visual styling
has changed.

## Folder structure

```
arcade/
├── index.html
├── css/
│   ├── style.css           ← exact copy of production style.css
│   └── arcade-theme.css    ← NEW theme overrides (loaded after style.css)
├── js/
│   ├── frog-game.js        ← MODIFIED: HUD inline styles → class names
│   ├── frog-game-config.js ← MODIFIED: image paths → ../images/
│   ├── frog-game-utils.js  ← unchanged
│   ├── frog-audio.js       ← MODIFIED: audio path → ../audio/
│   ├── frog-leaderboard.js ← MODIFIED: mini leaderboard rows use class names
│   └── frog-profanity.js   ← unchanged
└── README.md
```

## Asset paths

The arcade build does **not** duplicate `/images/` or `/audio/`. It references
the production assets via `../images/` and `../audio/` so the existing FreshFrogs
sprite folder, snake skin PNGs, and audio files all keep working.

This means:
- `/arcade/` will only function correctly when sitting next to your existing
  `/images/` and `/audio/` folders at the site root.
- No duplication, no stale assets.
- If you ever rename or move those folders in production, update the paths in
  `frog-game-config.js` and `frog-audio.js`.

## What was changed in the JS

Production game files create UI DOM with inline styles. To let CSS take over,
those inline styles needed to become class names. The changes were surgical:

### `frog-game.js` (around lines 1080–1240)

Before, the HUD bar / mini leaderboard / stats panel / controls / game over
banner were created with `style.cssText = "..."`. They now use class names
like `arc-hud-main`, `arc-hud-mini-board`, `arc-hud-stats-panel`,
`arc-hud-controls`, `arc-hud-btn`, `arc-game-over-banner`.

The `updateStatsPanel()` function had inline-styled "icon chip" HTML hardcoded.
It now produces `<div class="arc-stat-chip arc-stat-cat-{mobility|survival|orb|role}">`
rows that the theme styles via category-specific border/colors.

The display toggles (`hud.style.display = "flex"`, etc.) were untouched —
the new CSS still uses `display: flex` for those panels.

### `frog-leaderboard.js` (around line 545)

The mini leaderboard rows previously had `row.style.color = "#ffd700"` for the
"that's me" highlight. Now they get `row.classList.add("arc-mini-lb-me")` and
the theme styles it.

### `frog-game-config.js` and `frog-audio.js`

Asset paths shifted from `./images/` and `./audio/` to `../images/` and
`../audio/` so that, when running from `/arcade/`, asset URLs still resolve
to the same production folders.

## What's in `arcade-theme.css`

A pure-CSS overlay that targets the existing class names from `style.css` and
overrides their visual treatment — and styles the new HUD class names added
in the JS edits.

It does NOT delete or replace anything in `style.css`. Both files load; theme
wins via load order and `!important` where necessary.

Major sections:
- Base body/font overrides
- `#frog-bg` repurposed as the arena (grid + scanlines, grass tufts hidden)
- `.frog-overlay`, `.frog-panel`, `.frog-btn` re-skinned
- `.frog-upgrade-choice` category colors swapped to the neon palette
- `.scoreboard-card`, `.summary-pill`, `.scoreboard-row` re-skinned
- `.buff-card`, `.upgrade-guide-list` re-skinned
- HUD classes (`arc-hud-*`, `arc-stat-chip`, `arc-mini-lb-row`)
- Command center, dashboard, wallet stats also overridden
- Mobile breakpoints at 768px and 480px

## Deployment

1. Drop the entire `arcade/` folder at the root of `snakeesc.github.io`.
2. Push to GitHub Pages.
3. Visit `https://snakeesc.github.io/arcade/`.
4. Production game at `https://snakeesc.github.io/` is untouched.

## Reverting

If anything breaks, just delete the `/arcade/` folder. Production is
completely unaffected since this is a self-contained clone.

## Known things to test

- **Start a run** — HUD bar, mini leaderboard, controls, stats panel should
  all be neon-themed
- **Upgrade selection** — category-colored cards (mobility green, survival
  pink, orb amber, role purple) — should match the theme
- **Snake sheds** — visuals should still trigger normally; HUD should update
- **Orb collection** — orb buff icons should appear in the bottom-left stats
  panel with category coloring
- **Game over** — `Game Over` banner should appear in red-bordered theme
- **Scoreboard at end of run** — should use the theme's table styling
- **Leaderboard overlay** from main menu — theme styling applied
- **Dashboard** — theme styling on stats and recent runs
- **Snake skin selector in dashboard** — should still work, themed
- **Mobile** — at 480px the mini leaderboard hides; main HUD compresses

## Known limitations / next steps

- **Sprites** are the original FreshFrogs PNGs and red snake. Sprite swap is
  the next phase; currently the entities don't match the neon theme.
- The grass background was hidden, but if `MAIN_MENU_BACKGROUND_ENABLED` is
  flipped to `true` in config, grass will start spawning behind the menu
  again. The CSS hides the tufts, but ideally `seedMatchGrass()` should be
  gated off entirely. Not worth touching unless you re-enable it.
- Inline `style="background: transparent;"` on the main menu's `.frog-panel`
  in `index.html` is preserved from the original — it makes the main menu
  panel borderless. If you want the neon panel border on the main menu,
  remove that inline style.
