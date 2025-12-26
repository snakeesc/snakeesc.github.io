// frog-leaderboard.js
// Handles leaderboard fetch/save and UI overlays for the Frog Snake game.

(function () {
  "use strict";

  const LEADERBOARD_URL = "https://lucky-king-0d37.danielssouthworth.workers.dev/leaderboard";

  let containerEl = null;
  let scoreboardOverlay = null;
  let scoreboardOverlayInner = null;
  let lastMyEntry = null;

  const TAG_STORAGE_KEY = "frogSnake_username";

  // --- UI UPDATES FOR NEW THEME ---

  function ensureScoreboardOverlay(container) {
    if (scoreboardOverlay) return;
    containerEl = container || document.body;

    // Create the background overlay
    scoreboardOverlay = document.createElement("div");
    scoreboardOverlay.className = "frog-overlay"; 
    scoreboardOverlay.style.display = "none";

    // Create the central panel
    scoreboardOverlayInner = document.createElement("div");
    scoreboardOverlayInner.className = "frog-panel"; 

    scoreboardOverlay.appendChild(scoreboardOverlayInner);
    containerEl.appendChild(scoreboardOverlay);

    // Close on background click
    scoreboardOverlay.addEventListener("click", (e) => {
      if (e.target === scoreboardOverlay) hideScoreboardOverlay();
    });
  }

  function updateMiniLeaderboard(entries) {
    const miniLb = document.getElementById("miniLeaderboard");
    if (!miniLb) return;

    miniLb.innerHTML = "";
    const top3 = entries.slice(0, 3);
    
    top3.forEach((entry, i) => {
      const isMe = lastMyEntry && entry.tag === lastMyEntry.tag;
      const row = document.createElement("div");
      row.className = "lb-row" + (isMe ? " highlight" : "");
      
      row.innerHTML = `
        <span>${i + 1}. <span class="lb-tag">${entry.tag || "Anonymous"}</span></span>
        <span>${Math.floor(entry.bestScore).toLocaleString()}</span>
      `;
      miniLb.appendChild(row);
    });
  }

  async function openScoreboardOverlay(score, time, onRetry, onReturnToMenu) {
    ensureScoreboardOverlay();
    scoreboardOverlayInner.innerHTML = "";

    const title = document.createElement("h1");
    title.textContent = "Run Finished";
    scoreboardOverlayInner.appendChild(title);

    const stats = document.createElement("div");
    stats.className = "frog-panel-sub";
    stats.innerHTML = `Final Score: <strong>${Math.floor(score).toLocaleString()}</strong><br>Time Survived: <strong>${time.toFixed(1)}s</strong>`;
    scoreboardOverlayInner.appendChild(stats);

    // --- Dynamic Leaderboard Section ---
    const lbContainer = document.createElement("div");
    lbContainer.className = "lb-list";
    lbContainer.textContent = "Loading Global Ranks...";
    scoreboardOverlayInner.appendChild(lbContainer);

    // --- Action Buttons ---
    const actions = document.createElement("div");
    actions.className = "button-stack";

    const retryBtn = document.createElement("button");
    retryBtn.className = "frog-btn frog-btn-primary";
    retryBtn.textContent = "Try Again";
    retryBtn.onclick = () => { hideScoreboardOverlay(); onRetry(); };
    actions.appendChild(retryBtn);

    const menuBtn = document.createElement("button");
    menuBtn.className = "frog-btn frog-btn-secondary";
    menuBtn.textContent = "Main Menu";
    menuBtn.onclick = () => { hideScoreboardOverlay(); onReturnToMenu(); };
    actions.appendChild(menuBtn);

    scoreboardOverlayInner.appendChild(actions);
    scoreboardOverlay.style.display = "flex";

    // Fetch and update the list
    try {
      const result = await submitScoreToServer(score, time);
      const entries = result ? result.entries : await fetchLeaderboard();
      
      lbContainer.innerHTML = "";
      entries.slice(0, 5).forEach((entry, i) => {
        const isMe = lastMyEntry && entry.tag === lastMyEntry.tag;
        const row = document.createElement("div");
        row.className = "lb-row" + (isMe ? " highlight" : "");
        row.innerHTML = `<span>${i + 1}. ${entry.tag}</span><span>${Math.floor(entry.bestScore)}</span>`;
        lbContainer.appendChild(row);
      });
    } catch (e) {
      lbContainer.textContent = "Leaderboard currently unavailable.";
    }
  }

  // --- API Functions (Internal Logic Unchanged) ---

  async function fetchLeaderboard() {
    try {
      const r = await fetch(LEADERBOARD_URL);
      const d = await r.json();
      return d.entries || [];
    } catch (e) { return []; }
  }

  async function submitScoreToServer(score, time) {
    const tag = localStorage.getItem(TAG_STORAGE_KEY) || "GuestFrog";
    try {
      const r = await fetch(LEADERBOARD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag, score, time })
      });
      const d = await r.json();
      if (d.myEntry) lastMyEntry = d.myEntry;
      return d;
    } catch (e) { return null; }
  }

  function hideScoreboardOverlay() {
    if (scoreboardOverlay) scoreboardOverlay.style.display = "none";
  }

  function initLeaderboard(container) {
    ensureScoreboardOverlay(container);
  }

  window.FrogGameLeaderboard = {
    initLeaderboard,
    fetchLeaderboard,
    submitScoreToServer,
    updateMiniLeaderboard,
    openScoreboardOverlay,
    hideScoreboardOverlay
  };

})();