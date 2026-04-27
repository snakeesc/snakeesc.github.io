# /arcade/ — Escape the Snake (Neon Arcade Edition) v2

Full working game with the new neon arcade theme applied. Drop this folder
at the root of `snakeesc.github.io` so it's accessible at
`https://snakeesc.github.io/arcade/`.

## Folder structure

```
arcade/
├── index.html              ← rewritten markup for menu/leaderboard/upgrade overlays
├── css/
│   ├── style.css           ← exact copy of production style.css
│   └── arcade-theme.css    ← theme overrides + new layouts
├── js/
│   ├── frog-game.js        ← MODIFIED (HUD classes, leaderboard grid, upgrade card head)
│   ├── frog-game-config.js ← MODIFIED (asset paths → ../images/)
│   ├── frog-game-utils.js  ← unchanged
│   ├── frog-audio.js       ← MODIFIED (audio path → ../audio/)
│   ├── frog-leaderboard.js ← MODIFIED (mini leaderboard rows use class names)
│   └── frog-profanity.js   ← unchanged
└── README.md
```

## What changed since v1

v1 was theme-only and didn't match the preview because the markup wasn't
restructured. v2 actually rewrites the markup and rendering for the
overlays that needed structural changes:

### Main menu (markup rewritten in `index.html`)
- Two-line title "ESCAPE / THE SNAKE" with the snake word in red
- Eyebrow "— ARCADE EDITION —"
- Tagline "KEEP YOUR FROGS ALIVE. MOUSE TO MOVE."
- Primary button "▸ START RUN"
- 2-column grid for HOW TO PLAY / UPGRADES / LEADERBOARD / DASHBOARD
- Footer split with "TAG: …" and "BEST: …"

### Leaderboard overlay (markup + JS rewritten)
- Replaced single-line `▸ #1 Him · 131:10.4 · 30,080 score` with a real grid:
  rank | tag | time | score columns
- Top 3 rows get rank-1/2/3 colors (amber / purple / green)
- Player's row gets a green left-border highlight + "(you)" suffix
- Footer pager: "◂ PREV   1 / 5   NEXT ▸"

### Upgrade selection (JS rewritten)
- Cards now have `[N]` numbering and a category badge in the corner
- Vertical stacked layout instead of horizontal
- Category-colored borders, backgrounds, and text matching the preview

### HUD (JS rewritten)
- Top-center bar gets new structured layout (TIME · FROGS · SCORE)
- Mini leaderboard top-right styled with rank colors and "you" highlight
- Stats panel chips are now category-coded (mobility/survival/orb/role)
- Controls top-left themed; END RUN gets danger styling

### Dashboard
Preserved the existing structure (PFP / level / orbs / tag editor / starting
buff selector / snake skin selector). It's themed via overrides because
restructuring it would break features.

## Asset paths

References to `../images/` and `../audio/` from `/arcade/` resolve to
`/images/` and `/audio/` at the site root — no asset duplication.

## Deployment

1. Drop the entire `arcade/` folder at the root of `snakeesc.github.io`.
2. Push to GitHub Pages.
3. Visit `https://snakeesc.github.io/arcade/`.
4. Production game at `https://snakeesc.github.io/` is untouched.

## Test checklist

1. Main menu loads with eyebrow / two-line title / tagline / 2-col grid / footer
2. TAG and BEST in footer populate from saved values (or show `—` for fresh users)
3. Click START RUN — HUD bar, mini leaderboard, controls, stats panel themed
4. First upgrade prompt — vertical cards with [1] [2] [3] and category badges
5. Pick upgrade — stat chip appears bottom-left with right category color
6. Snake shed — visuals continue, HUD updates
7. Game Over — red-bordered banner appears
8. End-of-run scoreboard — themed table
9. Main menu → LEADERBOARD — proper grid table with rank/tag/time/score
10. Main menu → DASHBOARD — themed (preserves existing layout)
11. Main menu → HOW TO PLAY / UPGRADES — themed text panels
12. Mobile — at 480px the mini-LB hides; main HUD compresses

## Known limitations

- **Sprites** still original (FreshFrogs frog, red snake). Sprite swap is
  the next phase.
- **Dashboard layout** preserves the existing PFP/level system rather than
  matching the preview's stat-grid layout. The preview design dropped
  features the dashboard already has (level progression, orb counts, tag
  editor, starting buff selector); a true match would require reimplementing
  those, which is out of scope for the theming pass.
- **Buff guide overlay** uses the original list-based layout, themed.
- **Command center** themed via overrides.

## Reverting

Delete the `/arcade/` folder. Production is untouched.
