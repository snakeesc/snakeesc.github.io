// frog-leaderboard.js
// Handles leaderboard fetch/save and UI overlays for the Frog Snake game.

(function () {
  "use strict";

  // Cloudflare Worker URL
  const LEADERBOARD_URL =
    "https://lucky-king-0d37.danielssouthworth.workers.dev/leaderboard";

  let containerEl = null;
  let scoreboardOverlay = null;
  let scoreboardOverlayInner = null;

  // Last 'myEntry' returned by the worker (for correct tag highlighting)
  let lastMyEntry = null;

  // --------------------------------------------------
  // PLAYER TAG CONFIG (client-side only)
  // --------------------------------------------------
  const TAG_STORAGE_KEY   = "frogSnake_username";
  const TAG_MIN_LENGTH    = 2;
  const TAG_MAX_LENGTH    = 12;

  // Root patterns we want to block after normalization.
  // (Avoid very short generic roots like "ass" to prevent false positives.)
  const PROFANE_ROOTS = [
    "fuck",
    "shit",
    "bitch",
    "cunt",
    "asshole",
    "dick",
    "cock",
    "pussy",
    "slut",
    "whore",
    "bastard",
    "piss",
    "damn",
    "nigger",
    "faggot",
    "retard",
    "kike",
    "spic",
    "chink",
  ];

  /**
   * Normalize a tag for profanity matching:
   * - lowercase
   * - convert common leetspeak (0->o, 1->i, @->a, $->s, etc.)
   * - strip non-alphanumeric chars (spaces, underscores, punctuation)
   */
  function normalizeForProfanity(str) {
    const map = {
      "0": "o",
      "1": "i",
      "2": "z",
      "3": "e",
      "4": "a",
      "5": "s",
      "6": "g",
      "7": "t",
      "8": "b",
      "9": "g",
      "@": "a",
      "$": "s",
      "!": "i",
      "+": "t",
    };

    const lower = String(str).toLowerCase();
    let out = "";
    for (let i = 0; i < lower.length; i++) {
      const ch = lower[i];
      if (map[ch]) {
        out += map[ch];
      } else if (/[a-z0-9]/.test(ch)) {
        out += ch;
      } else {
        // drop spaces, punctuation, emojis, etc.
      }
    }
    return out;
  }

  function isProfaneTag(tag) {
    if (!tag) return false;
    const norm = normalizeForProfanity(tag);
    if (!norm) return false;

    for (const bad of PROFANE_ROOTS) {
      if (norm.includes(bad)) {
        return true;
      }
    }
    return false;
  }

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------
  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function formatTime(seconds) {
    if (seconds == null || !isFinite(seconds) || seconds <= 0) {
      return "00:00.0";
    }
    const total = Math.max(0, seconds);
    const m = Math.floor(total / 60);
    const s = total - m * 60;
    const sStr = s.toFixed(1);
    return `${pad2(m)}:${sStr.padStart(4, "0")}`;
  }

  // Always return a number, never undefined/NaN
  function getEntryScore(entry) {
    if (!entry || typeof entry !== "object") return 0;
    const keys = ["bestScore", "score", "maxScore", "points", "value"];
    for (const k of keys) {
      if (!(k in entry)) continue;
      let v = entry[k];
      if (typeof v === "string") v = parseFloat(v);
      if (typeof v === "number" && isFinite(v)) return v;
    }
    return 0;
  }

  // Always return a number, never undefined/NaN
  function getEntryTime(entry) {
    if (!entry || typeof entry !== "object") return 0;
    const keys = ["bestTime", "time", "seconds", "duration"];
    for (const k of keys) {
      if (!(k in entry)) continue;
      let v = entry[k];
      if (typeof v === "string") v = parseFloat(v);
      if (typeof v === "number" && isFinite(v) && v >= 0) return v;
    }
    return 0;
  }

  function getDisplayName(entry, fallback) {
    if (entry && typeof entry.tag === "string" && entry.tag.trim() !== "") {
      return entry.tag;
    }
    if (entry && typeof entry.name === "string" && entry.name.trim() !== "") {
      return entry.name;
    }
    return fallback || "Player";
  }

  function ensureScoreboardOverlay(container) {
    if (scoreboardOverlay) return;

    containerEl = container || document.body;

    scoreboardOverlay = document.createElement("div");
    scoreboardOverlay.id = "frog-scoreboard-overlay";
    scoreboardOverlay.className = "game-overlay";
    scoreboardOverlay.style.position = "fixed";
    scoreboardOverlay.style.display = "none";

    scoreboardOverlayInner = document.createElement("div");
    scoreboardOverlayInner.className = "game-card tight";

    scoreboardOverlay.appendChild(scoreboardOverlayInner);
    containerEl.appendChild(scoreboardOverlay);

    scoreboardOverlay.addEventListener("click", (ev) => {
      if (ev.target === scoreboardOverlay) {
        hideScoreboardOverlay();
      }
    });
  }

  // --------------------------------------------------
  // FIND "MY" ENTRY / ROW (for full overlay)
  // --------------------------------------------------
  function findMyIndexInList(list, lastRunScore, lastRunTime) {
    if (!Array.isArray(list) || list.length === 0) {
      return { index: -1, entry: null };
    }

    // 1) Prefer matching by userId (most accurate)
    if (lastMyEntry && lastMyEntry.userId) {
      for (let i = 0; i < list.length; i++) {
        const e = list[i];
        if (e && e.userId && e.userId === lastMyEntry.userId) {
          return { index: i, entry: e };
        }
      }
    }

    // 2) Fallback: match by tag + score/time
    if (lastMyEntry && lastMyEntry.tag) {
      let bestDist = Infinity;
      let bestIndex = -1;
      let bestEntry = null;
      for (let i = 0; i < list.length; i++) {
        const e = list[i];
        if (!e) continue;
        if (e.tag !== lastMyEntry.tag) continue;
        const es = getEntryScore(e);
        const et = getEntryTime(e);
        const ds = es - getEntryScore(lastMyEntry);
        const dt = et - getEntryTime(lastMyEntry);
        const dist = ds * ds + dt * dt;
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = i;
          bestEntry = e;
        }
      }
      if (bestIndex !== -1) {
        return { index: bestIndex, entry: bestEntry };
      }
    }

    // 3) Old behaviour: closest score+time
    let bestDist = Infinity;
    let bestIndex = -1;
    let bestEntry = null;
    const targetScore =
      lastRunScore || (lastMyEntry ? getEntryScore(lastMyEntry) : 0);
    const targetTime =
      lastRunTime || (lastMyEntry ? getEntryTime(lastMyEntry) : 0);

    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (!e) continue;
      const ds = getEntryScore(e) - targetScore;
      const dt = getEntryTime(e) - targetTime;
      const dist = ds * ds + dt * dt;
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
        bestEntry = e;
      }
    }

    if (bestIndex === -1) {
      return { index: -1, entry: null };
    }
    return { index: bestIndex, entry: bestEntry };
  }

  // --------------------------------------------------
  // CURRENT USER TAG HELPERS
  // --------------------------------------------------
  function getCurrentUserLabelFromLeaderboard() {
    try {
      if (lastMyEntry) {
        if (typeof lastMyEntry.tag === "string" && lastMyEntry.tag.trim() !== "") {
          return lastMyEntry.tag;
        }
        if (
          typeof lastMyEntry.name === "string" &&
          lastMyEntry.name.trim() !== ""
        ) {
          return lastMyEntry.name;
        }
      }

      if (typeof localStorage !== "undefined") {
        const stored =
          localStorage.getItem("frogSnake_username") ||
          localStorage.getItem("frogSnake_tag") ||
          localStorage.getItem("frogSnakeUserTag") ||
          null;
        if (stored && String(stored).trim() !== "") {
          return stored;
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  // --------------------------------------------------
  // NETWORK: FETCH & SUBMIT
  // --------------------------------------------------
  async function fetchLeaderboard() {
    try {
      const res = await fetch(LEADERBOARD_URL, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        console.warn("fetchLeaderboard non-OK:", res.status);
        return [];
      }

      const data = await res.json();

      let entries = [];
      lastMyEntry = null;

      if (Array.isArray(data)) {
        entries = data;
      } else if (data && Array.isArray(data.entries)) {
        entries = data.entries;
        if (data.myEntry) lastMyEntry = data.myEntry;
      }

      return entries;
    } catch (err) {
      console.error("fetchLeaderboard error", err);
      return [];
    }
  }

  async function submitScoreToServer(score, time, stats, tag) {
    try {
      let finalTag = null;

      if (typeof tag === "string") {
        finalTag = tag.trim();
      }

      // Fallback: if caller didn't pass a tag, try localStorage
      if (!finalTag && typeof localStorage !== "undefined") {
        try {
          const stored = localStorage.getItem(TAG_STORAGE_KEY);
          if (stored && stored.trim() !== "") {
            finalTag = stored.trim();
          }
        } catch (e) {
          // ignore
        }
      }

      const payload = {
        score,
        time,
        stats: stats || null,
      };

      if (finalTag && finalTag.length > 0) {
        payload.tag = finalTag;
      }

      const res = await fetch(LEADERBOARD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        console.warn("Failed to submit score:", res.status, res.statusText);
        return null;
      }
      
      const data = await res.json().catch(() => null);
      if (!data || !Array.isArray(data.entries)) {
        console.warn("Leaderboard response missing entries:", data);
        return null;
      }

      const entries = data.entries;
      if (data.myEntry) {
        lastMyEntry = data.myEntry;
      }
      
      return entries;
    } catch (err) {
      console.error("Error submitting score:", err);
      return null;
    }
  }
  
  // --------------------------------------------------
  // MINI LEADERBOARD (top-right HUD / pre-game view)
  // --------------------------------------------------
  // This is the one you care about.
  // It now highlights *your* row in gold if you're on the board.
  function updateMiniLeaderboard(topList, myEntryOverride) {
    const mini = document.getElementById("frog-mini-leaderboard");
    if (!mini) return;

    let entries = [];
    let myEntry = myEntryOverride || null;

    // Support either:
    //  - updateMiniLeaderboard(array)
    //  - updateMiniLeaderboard({ entries, myEntry })
    if (Array.isArray(topList)) {
      entries = topList;
    } else if (topList && Array.isArray(topList.entries)) {
      entries = topList.entries;
      if (!myEntry && topList.myEntry) {
        myEntry = topList.myEntry;
      }
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      mini.textContent = "No runs yet.";
      return;
    }

    // If no explicit myEntry passed, fall back to the last one from the server
    if (!myEntry && lastMyEntry) {
      myEntry = lastMyEntry;
    }

    let myIndex = -1;
    if (myEntry && myEntry.userId) {
      myIndex = entries.findIndex(
        (e) => e && e.userId && e.userId === myEntry.userId
      );
    }

    mini.innerHTML = "";
    const maxRows = Math.min(5, entries.length);

    for (let i = 0; i < maxRows; i++) {
      const entry = entries[i] || {};
      const rank = i + 1;
      const name = getDisplayName(entry, `Player ${rank}`);
      const score = getEntryScore(entry);
      const time = getEntryTime(entry);

      const row = document.createElement("div");
      row.style.fontFamily = "monospace";
      row.style.fontSize = "11px";

      row.textContent = `${rank}. ${name} — ${formatTime(
        time
      )}, ${Math.floor(score)}`;

      // Highlight your row (gold + bold) if you're on the board
      if (i === myIndex) {
        row.style.color = "#ffd700";
        row.style.fontWeight = "bold";
      }

      mini.appendChild(row);
    }
  }

  // --------------------------------------------------
  // FULL SCOREBOARD OVERLAY (after a run)
  // --------------------------------------------------
  function openScoreboardOverlay(entries, lastScore, lastTime, finalStats) {

    if (!scoreboardOverlay || !scoreboardOverlayInner) return;
  
    const safeList = Array.isArray(entries) ? entries : [];

    scoreboardOverlayInner.innerHTML = "";

    const header = document.createElement("div");
    header.className = "game-card-header";

    const heading = document.createElement("div");
    const title = document.createElement("div");
    title.className = "game-title";
    title.textContent = "End of run";

    const subtitle = document.createElement("div");
    subtitle.className = "game-subtitle";
    subtitle.textContent = `Score ${Math.floor(lastScore)} • Time ${formatTime(lastTime)}`;

    heading.appendChild(title);
    heading.appendChild(subtitle);

    const badge = document.createElement("div");
    badge.className = "pill accent";
    badge.textContent = "Leaderboard";

    header.appendChild(heading);
    header.appendChild(badge);
    scoreboardOverlayInner.appendChild(header);

    const { index: myIndex, entry: myEntry } =
      findMyIndexInList(safeList, lastScore, lastTime);
    let summary = null;

    const statRow = document.createElement("div");
    statRow.className = "stat-list";
    statRow.innerHTML = `
      <div class="stat-chip"><strong>Score</strong>${Math.floor(lastScore)}</div>
      <div class="stat-chip"><strong>Time</strong>${formatTime(lastTime)}</div>
      <div class="stat-chip"><strong>Rank preview</strong>${myIndex >= 0 ? myIndex + 1 : "—"}</div>
    `;
    scoreboardOverlayInner.appendChild(statRow);

    // ---- Player tag input (always shown in summary; pre-filled if saved) ----
    (function setupTagInput() {
      let storedTag = null;

      try {
        if (typeof localStorage !== "undefined") {
          storedTag = localStorage.getItem(TAG_STORAGE_KEY);
          if (storedTag) storedTag = storedTag.trim();
        }
      } catch (e) {
        // ignore
      }

      const tagBox = document.createElement("div");
      tagBox.className = "game-body";

      const label = document.createElement("div");
      label.className = "game-subtitle";
      label.textContent =
        "Choose a player tag to show on the leaderboard (optional):";
      tagBox.appendChild(label);

      const tagInput = document.createElement("input");
      tagInput.type = "text";
      tagInput.placeholder = "Example: SwampWizard";
      tagInput.maxLength = TAG_MAX_LENGTH;
      tagInput.className = "ui-input";

      // If we already have a saved tag, pre-fill the input with it
      if (storedTag) {
        tagInput.value = storedTag;
      }

      tagBox.appendChild(tagInput);

      const buttonsRow = document.createElement("div");
      buttonsRow.className = "game-actions";

      const saveBtn = document.createElement("button");
      saveBtn.textContent = "Save tag";
      saveBtn.className = "ui-button primary";

      const skipBtn = document.createElement("button");
      skipBtn.textContent = "Skip";
      skipBtn.className = "ui-button ghost";

      const error = document.createElement("div");
      error.className = "muted";
      error.style.color = "#ff9aa2";

      buttonsRow.appendChild(saveBtn);
      buttonsRow.appendChild(skipBtn);
      tagBox.appendChild(buttonsRow);
      tagBox.appendChild(error);

      scoreboardOverlayInner.appendChild(tagBox);

      function finish(tagValue) {
        // Save to localStorage
        try {
          if (typeof localStorage !== "undefined") {
            if (tagValue) {
              localStorage.setItem(TAG_STORAGE_KEY, tagValue);
            }
          }
        } catch (e) {
          // ignore
        }

        if (tagValue) {
          // Update current in-memory entry so the highlight + name use this tag
          if (myEntry) {
            myEntry.tag = tagValue;
          }
          lastMyEntry = lastMyEntry || {};
          lastMyEntry.tag = tagValue;

          // Compute a safe score/time for the server update
          const safeScore =
            typeof lastScore === "number" ? lastScore : getEntryScore(myEntry);
          const safeTime =
            typeof lastTime === "number" ? lastTime : getEntryTime(myEntry);

          // Immediately refresh the summary text with the new tag
          if (summary) {
            const newName = getDisplayName(myEntry, "You");
            summary.innerHTML =
              "Run summary:<br>" +
              `<strong>${escapeHtml(newName)}</strong> — Time ${formatTime(lastTime)}, Score ${Math.floor(lastScore)}`;
          }

          // Fire-and-forget: push the new tag to the server and then
          // refresh BOTH leaderboards when we get updated entries back.
          (async () => {
            try {
              const updatedEntries = await submitScoreToServer(
                typeof safeScore === "number" ? safeScore : 0,
                typeof safeTime === "number" ? safeTime : 0,
                null,
                tagValue
              );

              if (!updatedEntries || !Array.isArray(updatedEntries)) {
                return;
              }

              // Limit to the same size you use for the overlay (100 here)
              const topList = updatedEntries.slice(0, 100);

              // 1) Refresh the mini leaderboard (top-right HUD)
              updateMiniLeaderboard({
                entries: topList,
                myEntry: lastMyEntry,
              });

              // 2) Rebuild the end-game summary leaderboard so it shows the new tag
              //    (this keeps the overlay open, just re-renders its inner content)
              openScoreboardOverlay(topList, lastScore, lastTime, finalStats);
            } catch (err) {
              console.error(
                "Error refreshing leaderboards after tag change:",
                err
              );
            }
          })();
        }

        // Hide the tag box for this run (you still show it again on next summary)
        tagBox.style.display = "none";
      }

      saveBtn.addEventListener("click", () => {
        const raw = (tagInput.value || "").trim();
        if (!raw) {
          error.textContent = "Enter at least 2 characters, or click Skip.";
          return;
        }
        if (raw.length < TAG_MIN_LENGTH || raw.length > TAG_MAX_LENGTH) {
          error.textContent = `Tag must be ${TAG_MIN_LENGTH}-${TAG_MAX_LENGTH} characters.`;
          return;
        }
        if (isProfaneTag(raw)) {
          error.textContent =
            "That tag isn't allowed. Please choose something cleaner.";
          return;
        }
        error.textContent = "";
        finish(raw);
      });

      // Skip: just hide for this run; will show again next run
      skipBtn.addEventListener("click", () => {
        error.textContent = "";
        tagBox.style.display = "none";
      });
    })();

    const myName = getDisplayName(myEntry, "You");

    summary = document.createElement("div");
    summary.className = "game-body";
    summary.innerHTML =
      "Run summary:<br>" +
      `<strong>${escapeHtml(myName)}</strong> — Time ${formatTime(lastTime)}, Score ${Math.floor(lastScore)}`;
    scoreboardOverlayInner.appendChild(summary);
  
    // ----- Leaderboard table with pagination (10 per page) -----
    const PAGE_SIZE = 10;
    let currentPage = 0;
    const totalEntries = safeList.length;
    const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));

    const table = document.createElement("table");
    table.className = "game-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");

    const thRank = document.createElement("th");
    const thName = document.createElement("th");
    const thTime = document.createElement("th");
    const thScore = document.createElement("th");

    thRank.textContent = "#";
    thName.textContent = "Name";
    thTime.textContent = "Time";
    thScore.textContent = "Score";

    // styling provided by .game-table

    headRow.appendChild(thRank);
    headRow.appendChild(thName);
    headRow.appendChild(thTime);
    headRow.appendChild(thScore);
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    table.appendChild(tbody);
    scoreboardOverlayInner.appendChild(table);

    // Pagination controls
    const pager = document.createElement("div");
    pager.className = "game-actions";

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "◀ Prev";
    prevBtn.className = "ui-button ghost";

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next ▶";
    nextBtn.className = "ui-button";

    const pageInfo = document.createElement("div");
    pageInfo.className = "muted";

    pager.appendChild(prevBtn);
    pager.appendChild(pageInfo);
    pager.appendChild(nextBtn);
    scoreboardOverlayInner.appendChild(pager);

    function renderPage() {
      tbody.innerHTML = "";

      if (totalEntries === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 4;
        td.textContent = "No scores yet.";
        td.className = "muted";
        td.style.textAlign = "center";
        tr.appendChild(td);
        tbody.appendChild(tr);

        pageInfo.textContent = "No entries";
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        prevBtn.style.opacity = "0.4";
        nextBtn.style.opacity = "0.4";
        return;
      }

      const startIndex = currentPage * PAGE_SIZE;
      const endIndex = Math.min(startIndex + PAGE_SIZE, totalEntries);

      for (let i = startIndex; i < endIndex; i++) {
        const e = safeList[i];
        if (!e) continue;

        const rank = i + 1; // global rank
        const name = getDisplayName(e, `Frog #${rank}`);
        const score = getEntryScore(e);
        const time = getEntryTime(e);

        const tr = document.createElement("tr");

        const rankCell = document.createElement("td");
        const nameCell = document.createElement("td");
        const timeCell = document.createElement("td");
        const scoreCell = document.createElement("td");

        rankCell.textContent = rank;
        nameCell.textContent = name;
        timeCell.textContent = formatTime(time);
        scoreCell.textContent = Math.floor(score);

        for (const td of [rankCell, nameCell, timeCell, scoreCell]) {
        }

        if (i === myIndex) {
          tr.className = "me";
        }

        tr.appendChild(rankCell);
        tr.appendChild(nameCell);
        tr.appendChild(timeCell);
        tr.appendChild(scoreCell);
        tbody.appendChild(tr);
      }

      const fromNum = startIndex + 1;
      const toNum = endIndex;
      pageInfo.textContent = `Showing ${fromNum}–${toNum} of ${totalEntries}`;

      prevBtn.disabled = currentPage === 0;
      nextBtn.disabled = currentPage >= totalPages - 1;
      prevBtn.style.opacity = prevBtn.disabled ? "0.4" : "1.0";
      nextBtn.style.opacity = nextBtn.disabled ? "0.4" : "1.0";
    }

    prevBtn.addEventListener("click", () => {
      if (currentPage > 0) {
        currentPage--;
        renderPage();
      }
    });

    nextBtn.addEventListener("click", () => {
      if (currentPage < totalPages - 1) {
        currentPage++;
        renderPage();
      }
    });

    // Initial render
    renderPage();
  
    // ---- Run stats block (uses finalStats if provided) ----
    if (finalStats && typeof finalStats === "object") {
      const s = finalStats;
  
      const statsBox = document.createElement("div");
      statsBox.style.marginTop = "10px";
      statsBox.style.padding = "8px 10px";
      statsBox.style.borderTop = "1px solid #333";
      statsBox.style.fontSize = "11px";
      statsBox.style.textAlign = "left";
  
      function fmtPct(val) {
        return typeof val === "number" ? (val * 100).toFixed(1) + "%" : "—";
      }
  
      function fmtMult(val) {
        return typeof val === "number" ? "×" + val.toFixed(2) : "—";
      }
  
      function fmtInt(val) {
        return typeof val === "number" ? String(Math.floor(val)) : "—";
      }
  
      const deathrattleChance =
        typeof s.deathrattleChance === "number"
          ? s.deathrattleChance
          : (typeof s.frogDeathRattleChance === "number"
              ? s.frogDeathRattleChance
              : null);
  
      /*
      statsBox.innerHTML = `
        <div style="font-weight:bold; margin-bottom:4px;">Run stats</div>
        <div>Deathrattle chance: ${fmtPct(deathrattleChance)}</div>
        <div>Frog speed factor: ${fmtMult(s.frogSpeedFactor)}</div>
        <div>Frog jump factor: ${fmtMult(s.frogJumpFactor)}</div>
        <div>Buff duration: ${fmtMult(s.buffDurationFactor)}</div>
        <div>Orb spawn interval factor: ${fmtMult(s.orbSpawnIntervalFactor)}</div>
        <div>Total frogs spawned: ${fmtInt(s.totalFrogsSpawned)}</div>
      `;

  
      scoreboardOverlayInner.appendChild(statsBox);
      */
    }
  
    const hint = document.createElement("div");
    hint.textContent = "Click outside this panel to close.";
    hint.className = "muted";
    hint.style.textAlign = "center";
    scoreboardOverlayInner.appendChild(hint);
  
    scoreboardOverlay.style.display = "flex";
  }  

  function hideScoreboardOverlay() {
    if (!scoreboardOverlay) return;
    scoreboardOverlay.style.display = "none";
  }

  // --------------------------------------------------
  // INIT
  // --------------------------------------------------
  function initLeaderboard(container) {
    ensureScoreboardOverlay(container || document.body);
  }

  // Also auto-load the mini leaderboard once on page load
  document.addEventListener("DOMContentLoaded", function () {
    fetchLeaderboard().then(function (entries) {
      updateMiniLeaderboard(entries);
    }).catch(function () {});
  });

  // --------------------------------------------------
  // EXPORT
  // --------------------------------------------------
  window.FrogGameLeaderboard = {
    initLeaderboard,
    fetchLeaderboard,
    submitScoreToServer,
    updateMiniLeaderboard,
    openScoreboardOverlay,
    hideScoreboardOverlay,
    getCurrentUserLabel: getCurrentUserLabelFromLeaderboard,
  };
})();
