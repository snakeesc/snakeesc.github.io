# Escape the Snake — Arcade Edition (UI Preview)

Drop-in folder for testing the new neon arcade theme without touching
production. Lives at `/arcade/` on your site:
`https://snakeesc.github.io/arcade/`.

## What this is

A self-contained UI shell with the new theme applied to every overlay
and the in-game HUD. The actual game canvas is stubbed out with a
placeholder so you can navigate the menus and see what a "live run"
looks like with the new HUD chrome in place.

## What's here

```
arcade/
├── index.html              ← entry point
├── css/
│   └── arcade-theme.css    ← the entire new theme (no dependency on style.css)
├── js/
│   ├── arcade-data.js      ← mock leaderboard + upgrade list + helpers
│   ├── arcade-ui.js        ← overlay rendering (leaderboard, dashboard, etc.)
│   └── arcade-preview.js   ← button wiring + fake "in-run" demo loop
└── README.md
```

No images, no fonts, no external deps. Pure HTML/CSS/JS.

## What works

- **Main menu** — start, how-to, upgrades, leaderboard, dashboard
- **How to Play** overlay
- **Upgrades reference** with REGULAR / EPIC tabs (full list from your real config)
- **Leaderboard** — sortable by score / time / frogs, paginated, your row highlighted
- **Dashboard** — stat cards, recent runs, snake skin selector
- **In-game HUD** — top-center main stats, top-left controls, top-right mini leaderboard,
  bottom-left active stats panel + temp buffs
- **Upgrade selection** — appears 12 seconds into the mock run
- **End-of-run summary** — survived/score/frogs lost/orbs + PB callout

Click "Start Run" on the main menu to see the HUD. Click "End Run" in
the top-left controls to bring up the end-of-run overlay.

## What's stubbed

- **Game canvas** — there's a placeholder grid + scanlines where the real
  arena would render. When integrating with `frog-game.js`, the real game
  mounts into `#frog-game` and the placeholder either gets removed or
  hidden behind it.
- **Leaderboard data** — uses 20 mock entries from `arcade-data.js`. Replace
  with your real Cloudflare worker fetch.
- **Stats updates** — driven by a fake elapsed timer in `arcade-preview.js`,
  not the real game state.
- **Audio** — none. The original `frog-audio.js` continues to work as-is
  when you wire it up.

## Integration path (when you're ready)

This is a UI shell, not a fork of the game. Suggested merge order:

### Step 1 — Drop the new theme into a new branch

Copy `arcade/css/arcade-theme.css` next to `style.css`. Keep both linked
in `index.html` for now so you can A/B compare. The new classes are
all prefixed `arc-` or `hud-` so they won't collide.

### Step 2 — Switch overlay markup

The overlay element IDs in `arcade/index.html` match the originals
(`mainMenuOverlay`, `upgradeOverlay`, `leaderboardOverlay`, etc.) so
your existing JS that opens/closes them should keep working. The
**inner markup** is what changed — replace the contents of each
`.frog-overlay > .frog-panel` with the corresponding `.arc-overlay >
.arc-panel` markup from `arcade/index.html`.

### Step 3 — Wire HUD updates

In `frog-game.js`, find `updateHUD()` (around line 1160). Add a call to
`window.ArcadePreview.updateHudFromGame(...)` passing the live state:

```js
function updateHUD() {
  if (!inGameUIVisible) return;
  // ... existing code ...

  // NEW: feed the arcade HUD
  if (window.ArcadePreview) {
    window.ArcadePreview.updateHudFromGame({
      elapsed:       elapsedTime,
      frogs:         frogs.length,
      score:         Math.floor(score),
      shedRemaining: Math.max(0, nextShedTime - elapsedTime)
    });
  }
}
```

The `updateStatsPanel()` function (around line 1169) is what feeds the
bottom-left active-stats panel. That one builds an HTML string from
permanent upgrade counts — easiest path is to refactor it to build the
same DOM rows that `arcade-ui.js > renderHudStats()` produces, but
driven from real upgrade state instead of `SAMPLE_ACTIVE_STATS`.

### Step 4 — Real leaderboard

Replace `MOCK_LEADERBOARD` in `arcade-data.js` with a real fetch from
your Cloudflare worker. Same shape (`{ tag, bestScore, bestTime,
frogs, userId, isMe }`) keeps everything else unchanged.

### Step 5 — Background

The existing CSS pixel-grass background (`#frog-bg`, `.grass`,
`.flower`) needs to either be replaced by the new arena (grid +
scanlines) or hidden when the arcade theme is active. Cleanest option:
gate the grass-background creation in `frog-game.js` behind a flag,
default off when the new theme loads.

### Step 6 — Sprites (separate task)

This preview keeps the old sprite system entirely. Sprite work is
tracked separately — once you sign off on the menus, we'll do the new
flat neon frog sprite + new snake skin set.

## Notes

- The HUD's `STATS` button toggles the bottom-left panel exactly like
  the original `btnStats` does.
- The `SOUND` button currently just toggles its label — wire to
  `FrogGameAudio.setMuted()` when integrating.
- The dashboard `data-skin` chips correspond to the existing
  `SNAKE_SKINS` ids (`default` / `alt` / `alt2`). Wire to
  `saveSelectedSnakeSkinId()`.
- All overlays use the same `.arc-overlay.is-open` toggle pattern, so
  any utility you write for one works for all.
- Phone/mobile layouts are handled via the `@media (max-width: 768px)`
  and `@media (max-width: 480px)` blocks at the bottom of
  `arcade-theme.css`. The mini leaderboard hides below 480px to
  preserve the main HUD readability.

## Tweaks worth doing during preview

- Try the gameplay HUD at narrow widths (resize the browser) — the
  HUD compresses but probably wants more polish at 380px.
- The mock run shows the upgrade overlay 12 seconds in. To preview it
  immediately, run `ArcadeUI.openOverlay('upgradeOverlay')` in the
  console.
- To see the end-of-run overlay without playing, run
  `ArcadePreview.endMockRun()` mid-run, or
  `ArcadeUI.openOverlay('endRunOverlay')` directly.
