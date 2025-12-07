// frog-ui-shell.js
// Simple UI state machine for Escape the Snake

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const screens = {
    menu: $("screen-main-menu"),
    game: $("screen-game"),
    learn: $("screen-learn"),
    updates: $("screen-updates"),
  };

  const overlays = {
    upgrades: $("overlay-upgrades"),
    pause: $("overlay-pause"),
  };

  function showScreen(name) {
    Object.values(screens).forEach((el) => {
      if (!el) return;
      el.style.display = "none";
      el.classList.remove("is-visible");
    });

    const target = screens[name];
    if (target) {
      target.style.display = "flex";
      target.classList.add("is-visible");
    }
  }

  function showOverlay(name) {
    Object.values(overlays).forEach((el) => {
      if (!el) return;
      el.style.display = "none";
    });

    const target = overlays[name];
    if (target) {
      target.style.display = "flex";
    }
  }

  function hideOverlay(name) {
    const target = overlays[name];
    if (target) target.style.display = "none";
  }

  // Placeholder hooks – later we wire these to your real game code
  function startGameFromMenu() {
    showScreen("game");
    // TODO: call into your actual game start / reset function.
    // Example if you expose it:
    // window.FrogGame?.startNewRun?.();
  }

  function returnToMainMenu() {
    // TODO: stop / reset game if needed
    showScreen("menu");
    hideOverlay("pause");
    hideOverlay("upgrades");
  }

  // Button wiring
  function wireButtons() {
    // Main menu
    $("btn-main-play")?.addEventListener("click", startGameFromMenu);
    $("btn-main-learn")?.addEventListener("click", () => showScreen("learn"));
    $("btn-main-updates")?.addEventListener("click", () => showScreen("updates"));

    // Learn more
    $("btn-learn-play")?.addEventListener("click", startGameFromMenu);
    $("btn-learn-back")?.addEventListener("click", () => showScreen("menu"));

    // Updates
    $("btn-updates-back")?.addEventListener("click", () => showScreen("menu"));

    // HUD
    $("btn-hud-upgrades")?.addEventListener("click", () => {
      // Later: only show when an upgrade is actually available
      showOverlay("upgrades");
    });

    $("btn-hud-pause")?.addEventListener("click", () => {
      showOverlay("pause");
      // TODO: pause game loop
    });

    // Upgrade overlay actions
    $("btn-upgrade-reroll")?.addEventListener("click", () => {
      // TODO: trigger reroll in your upgrade logic
    });

    $("btn-upgrade-skip")?.addEventListener("click", () => {
      hideOverlay("upgrades");
      // TODO: unpause / resume game
    });

    // Pause overlay
    $("btn-pause-resume")?.addEventListener("click", () => {
      hideOverlay("pause");
      // TODO: resume game
    });

    $("btn-pause-menu")?.addEventListener("click", returnToMainMenu);

    // Example: close overlays with Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        // If pause is open, close it; otherwise open pause during game
        if (overlays.pause && overlays.pause.style.display === "flex") {
          hideOverlay("pause");
          // TODO: resume
        } else {
          // If we're on game screen, open pause
          if (screens.game && screens.game.style.display !== "none") {
            showOverlay("pause");
            // TODO: pause
          }
        }
      }
    });
  }

  // Expose tiny UI API for your game code if needed
  window.FrogUI = {
    showUpgradeOverlay() {
      showOverlay("upgrades");
    },
    hideUpgradeOverlay() {
      hideOverlay("upgrades");
    },
    showPause() {
      showOverlay("pause");
    },
    hidePause() {
      hideOverlay("pause");
    },
    showMainMenu: returnToMainMenu,
    showGameScreen() {
      showScreen("game");
    },
  };

  wireButtons();
  showScreen("menu");
})();
