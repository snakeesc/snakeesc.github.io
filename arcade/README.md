# /arcade/ — Escape the Snake (Neon Arcade Edition) v3

Full working game with neon arcade theme + new NES-classic sprites.

## What's new in v3

### NES classic sprites
- `images/frog.png` — single 48x48 sprite, replaces FreshFrogs layered system
- `images/head.png`, `body.png`, `tail.png` — new snake skin (default "Classic")
- All four are pixel-perfect 16x16 native, scaled 3x to 48x48

### How to Play overlay
- New layout matching the preview: `// CONTROLS / // GOAL / // TIPS` with the
  amber `MOUSE` keyword and `▸` bullet markers

### End-of-run scoreboard
- Themed via CSS only — kept all existing features (tag editor, embedded
  leaderboard preview, OPEN DASHBOARD / PLAY AGAIN / MAIN MENU buttons)

### Dashboard hybrid
- New stat-grid (BEST SCORE / BEST TIME / RUNS / ORBS) like the preview
- Recent runs list themed
- Level/progress info preserved (no PFP — relies on disabled layer system)
- Tag editor preserved with new themed input + SAVE button
- Starting buff selector + snake skin selector preserved

## Folder structure

```
arcade/
├── index.html              ← preview-matching markup
├── css/
│   ├── style.css           ← exact copy of production
│   └── arcade-theme.css    ← all theme overrides
├── images/
│   ├── frog.png            ← NEW NES classic frog
│   ├── head.png            ← NEW NES classic snake head
│   ├── body.png            ← NEW NES classic snake body
│   └── tail.png            ← NEW NES classic snake tail
├── js/
│   ├── frog-game.js        ← MODIFIED extensively
│   ├── frog-game-config.js ← MODIFIED (asset paths)
│   ├── frog-game-utils.js  ← unchanged
│   ├── frog-audio.js       ← MODIFIED (audio path)
│   ├── frog-leaderboard.js ← MODIFIED (mini LB rows)
│   └── frog-profanity.js   ← unchanged
└── README.md
```

## Asset paths

- New arcade sprites use `./images/` (local to /arcade/)
- Audio still uses `../audio/` (production folder)
- Other production images (`build_files/Frog/`, alt snake skins, etc.) use
  `../images/` (production folder) — though the layered FreshFrogs system is
  now disabled in this build, so most of those references are dead code.

## What was changed in JS

### `frog-game.js`
- HUD elements use class names (was inline cssText) — top bar, mini LB,
  stats panel, controls, game-over banner
- Stat panel chips use category-coded class names (mobility/survival/orb/role)
- Leaderboard overlay rendering produces a 4-column grid (was single-line list)
- Upgrade choice cards include `[N]` numbering and category badge
- Frog rendering is now a single `<img src="./images/frog.png">` (was multi-layer)
- `buildLayersForFrog()` no-ops the trait system (was loading per-NFT layers)
- Dashboard rewritten as hybrid stat-grid + level info + tag editor

### `frog-game-config.js`
- `BUILD_BASE` and `FROG_FOLDER` point to `../images/` (still references
  production for the layered system, but the system is now disabled)

### `frog-audio.js`
- `AUDIO_BASE` → `../audio/`

### `frog-leaderboard.js`
- Mini leaderboard rows use class names instead of inline gold styling

## Deployment

1. Drop the `arcade/` folder at the root of `snakeesc.github.io`
2. Push to GitHub Pages
3. Visit `https://snakeesc.github.io/arcade/`
4. Production game at the root is untouched

## Test checklist

1. Main menu — eyebrow / two-line title / tagline / 2-col grid / footer
2. TAG and BEST in footer populate from saved values
3. Click START RUN — themed HUD: top-center bar, top-right mini LB,
   top-left controls, bottom-left active stats panel
4. **Frogs appear as new NES sprites** — green pill bodies with
   eye-bumps and leg pixels at the corners
5. **Snake appears as new NES skin** — wider red body with white eyes,
   black pupils, forked tongue on head; lighter scale dots on body segments;
   tapered tail
6. First upgrade prompt — vertical cards with `[1] [2] [3]` and category badges
7. Pick upgrade — stat chip appears bottom-left with right category color
8. Snake shed — visuals continue, HUD updates
9. Game Over — red-bordered banner appears
10. End-of-run scoreboard — themed, all features still work (tag editor,
    PLAY AGAIN, OPEN DASHBOARD, MAIN MENU)
11. Main menu → LEADERBOARD — proper grid table
12. Main menu → DASHBOARD — themed stat grid + recent runs + tag editor
13. Main menu → HOW TO PLAY — `// CONTROLS / // GOAL / // TIPS` layout
14. Main menu → UPGRADES — themed reference list
15. Mobile — at 480px the mini LB hides; main HUD compresses

## Known limitations

- **PFP avatar removed** from dashboard — it relied on the layered FreshFrogs
  sprites which are now disabled. The dashboard uses TAG name in the header
  instead.
- **All frogs look identical** — the trait system is disabled. Every frog is
  the same NES sprite. If you want variety later, you can add 2–3 alt frog
  PNGs and have the random sprite picker rotate them.
- **Alt snake skins (Serpent / Shadow)** still point at `../images/head2.png`
  etc. If you don't have those in production, those skins will appear broken
  if selected — only the default "Classic" uses the new arcade sprites.

## Reverting

Delete the `/arcade/` folder. Production untouched.
