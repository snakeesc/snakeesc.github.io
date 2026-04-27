// arcade-preview.js
// Wires up buttons, navigation, and a fake "in-run" state so you can preview the HUD.
//
// INTEGRATION NOTE — When merging with the real frog-game.js:
//
//   1. Remove the "#arcade-arena-placeholder" div (or leave it; it's hidden when
//      frog-game.js mounts its own DOM into #frog-game).
//   2. Replace startMockRun() / endMockRun() with the real game's run lifecycle.
//   3. Wire updateHudFromGame() to be called from the real updateHUD()
//      (around line 1160 of frog-game.js) so the new HUD reads live values.
//   4. The overlay element IDs match the original index.html so the existing
//      JS overlay-show logic continues to work; only the visual styling changes.

(function () {
  "use strict";

  const UI   = window.ArcadeUI;
  const Data = window.ArcadeData;

  if (!UI || !Data) {
    console.error("ArcadeUI / ArcadeData missing — script load order issue.");
    return;
  }

  // ------------------------------------------------------------
  // BUTTON WIRING
  // ------------------------------------------------------------
  function on(id, ev, fn) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(ev, fn);
  }

  function wireButtons() {

    // Main menu
    on("btnStartRun",   "click", () => startMockRun());
    on("btnHowTo",      "click", () => UI.openOverlay("howToOverlay"));
    on("btnBuffGuide",  "click", () => {
      UI.openOverlay("buffGuideOverlay");
      UI.setBuffTab("regular");
    });
    on("btnLeaderboard", "click", () => {
      UI.openOverlay("leaderboardOverlay");
      UI.renderLeaderboard();
    });
    on("btnDashboard",  "click", () => {
      UI.openOverlay("dashboardOverlay");
      UI.renderDashboard();
    });

    // Closes
    on("howToCloseBtn",       "click", () => UI.closeOverlay("howToOverlay"));
    on("buffGuideCloseBtn",   "click", () => UI.closeOverlay("buffGuideOverlay"));
    on("leaderboardCloseBtn", "click", () => UI.closeOverlay("leaderboardOverlay"));
    on("dashboardCloseBtn",   "click", () => UI.closeOverlay("dashboardOverlay"));

    // End-of-run actions
    on("endAgainBtn", "click", () => {
      UI.closeOverlay("endRunOverlay");
      startMockRun();
    });
    on("endMenuBtn", "click", () => {
      UI.closeOverlay("endRunOverlay");
      UI.openOverlay("mainMenuOverlay");
    });

    // HUD controls
    on("btnEnd",   "click", () => endMockRun());
    on("btnSound", "click", () => {
      const btn = document.getElementById("btnSound");
      if (btn) btn.textContent = btn.textContent === "SOUND" ? "MUTED" : "SOUND";
    });
    on("btnStats", "click", () => {
      const panel = document.getElementById("hudStats");
      if (panel) panel.style.display = panel.style.display === "none" ? "" : "none";
    });

    // Leaderboard sort tabs
    document.querySelectorAll(".arc-tab[data-lb-sort]").forEach(tab => {
      tab.addEventListener("click", () => {
        UI.setLbSort(tab.getAttribute("data-lb-sort"));
      });
    });

    // Leaderboard pager
    document.querySelectorAll(".arc-pager-btn[data-lb-page]").forEach(btn => {
      btn.addEventListener("click", () => {
        UI.lbPageChange(btn.getAttribute("data-lb-page"));
      });
    });

    // Buff guide tabs
    document.querySelectorAll(".arc-tab[data-buff-tab]").forEach(tab => {
      tab.addEventListener("click", () => {
        UI.setBuffTab(tab.getAttribute("data-buff-tab"));
      });
    });

    // Skin chips
    document.querySelectorAll(".arc-skin-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        if (chip.classList.contains("is-locked")) return;
        document.querySelectorAll(".arc-skin-chip").forEach(c => {
          c.classList.remove("is-selected");
          c.textContent = c.textContent.replace(" ✓", "");
        });
        chip.classList.add("is-selected");
        if (!chip.textContent.includes("✓")) chip.textContent = chip.textContent + " ✓";
      });
    });
  }

  // ------------------------------------------------------------
  // MOCK RUN — fake elapsed time + score so you can preview the HUD
  // ------------------------------------------------------------
  let runActive = false;
  let runStartedAt = 0;
  let runFrogs = 50;
  let mockFrame = null;
  let mockUpgradeShownAt = 0;
  let nextShedTimestamp = 0;
  const SHED_INTERVAL = 180; // matches frog-game-config.js

  function startMockRun() {
    UI.closeAllOverlays();
    runActive = true;
    runStartedAt = performance.now();
    runFrogs = 50;
    mockUpgradeShownAt = 0;
    nextShedTimestamp = SHED_INTERVAL;

    const hud = document.getElementById("arcadeHud");
    if (hud) hud.removeAttribute("hidden");

    // Hide placeholder text once a run starts (looks more like real gameplay)
    const placeholderText = document.querySelector(".arena-center-text");
    if (placeholderText) placeholderText.style.display = "none";

    UI.renderHudLeaderboard();
    UI.renderHudStats();

    runLoop();
  }

  function endMockRun() {
    runActive = false;
    if (mockFrame) {
      cancelAnimationFrame(mockFrame);
      mockFrame = null;
    }

    const hud = document.getElementById("arcadeHud");
    if (hud) hud.setAttribute("hidden", "");

    const placeholderText = document.querySelector(".arena-center-text");
    if (placeholderText) placeholderText.style.display = "";

    // Show end-run with mock numbers
    const elapsed = (performance.now() - runStartedAt) / 1000;
    const mockScore = Math.floor(elapsed * 50);
    const mockOrbs  = Math.floor(elapsed / 6);

    const endTime       = document.getElementById("endTime");
    const endScore      = document.getElementById("endScore");
    const endFrogsLost  = document.getElementById("endFrogsLost");
    const endOrbs       = document.getElementById("endOrbs");
    const pbCallout     = document.getElementById("endPbCallout");

    if (endTime)      endTime.textContent      = Data.formatTime(elapsed);
    if (endScore)     endScore.textContent     = Data.formatScore(mockScore);
    if (endFrogsLost) endFrogsLost.textContent = String(50 - runFrogs);
    if (endOrbs)      endOrbs.textContent      = String(mockOrbs);

    // Trigger PB callout if mock score beats stored mock best
    if (pbCallout) {
      pbCallout.hidden = mockScore < 7220;
    }

    UI.openOverlay("endRunOverlay");
  }

  function runLoop() {
    if (!runActive) return;

    const elapsed = (performance.now() - runStartedAt) / 1000;
    updateHudFromGame({
      elapsed,
      frogs: runFrogs,
      score: Math.floor(elapsed * 50),
      shedRemaining: Math.max(0, nextShedTimestamp - elapsed)
    });

    // Slowly drop frog count for fake "danger" feel
    if (elapsed > 5 && Math.random() < 0.005) runFrogs = Math.max(0, runFrogs - 1);

    // Show upgrade overlay after 12s, just to demo it
    if (elapsed > 12 && mockUpgradeShownAt === 0) {
      mockUpgradeShownAt = elapsed;
      UI.renderUpgradeChoices(Data.SAMPLE_UPGRADE_CHOICES);
      UI.openOverlay("upgradeOverlay");
    }

    // Advance shed time
    if (elapsed >= nextShedTimestamp) {
      nextShedTimestamp = elapsed + SHED_INTERVAL;
    }

    mockFrame = requestAnimationFrame(runLoop);
  }

  // ------------------------------------------------------------
  // HUD UPDATE — call this from real frog-game.js when integrating
  // ------------------------------------------------------------
  function updateHudFromGame(state) {
    const t = document.getElementById("hudTime");
    const f = document.getElementById("hudFrogs");
    const s = document.getElementById("hudScore");
    const shed = document.getElementById("hudShedTimer");

    if (t) {
      // Match the original formatTime: MM:SS.s
      const total = Math.max(0, state.elapsed || 0);
      const m = Math.floor(total / 60);
      const sec = total - m * 60;
      t.textContent = String(m).padStart(2, "0") + ":" + sec.toFixed(1).padStart(4, "0");
    }
    if (f) f.textContent = String(state.frogs ?? 0);
    if (s) s.textContent = Data.formatScore(state.score ?? 0);

    if (shed) {
      const r = Math.max(0, state.shedRemaining || 0);
      const m = Math.floor(r / 60);
      const sec = Math.floor(r - m * 60);
      shed.textContent = m + ":" + String(sec).padStart(2, "0");
    }
  }

  // ------------------------------------------------------------
  // BOOT
  // ------------------------------------------------------------
  function init() {
    wireButtons();
    UI.renderMenuFooter();
    // Preload upgrade list so it's ready when the overlay opens
    UI.renderUpgradeChoices(Data.SAMPLE_UPGRADE_CHOICES);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose for integration testing
  window.ArcadePreview = {
    startMockRun,
    endMockRun,
    updateHudFromGame
  };
})();
