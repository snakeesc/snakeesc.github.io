// frog-leaderboard.js
// Handles leaderboard fetch/save and UI overlays for the Frog Snake game.

(function () {
  "use strict";

  // Cloudflare Worker URL
  const LEADERBOARD_URL =
    "https://lucky-king-0d37.danielssouthworth.workers.dev/leaderboard";

  const RECENT_RUNS_URL =
    "https://lucky-king-0d37.danielssouthworth.workers.dev/recent-runs";

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
  const TAG_MAX_LENGTH    = 20;

  /** @see frog-profanity.js (shared blocklist + normalization) */
  function isProfaneTag(tag) {
    if (
      window.FrogProfanity &&
      typeof window.FrogProfanity.isProfaneTag === "function"
    ) {
      return window.FrogProfanity.isProfaneTag(tag);
    }
    const n = String(tag || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    return ["fuck", "shit", "nigger", "rape", "nazi"].some((w) => n.includes(w));
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

  function normalizeLabel(str) {
    return typeof str === "string" ? str.trim().toLowerCase() : "";
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

  /**
   * @param {object|null} entry
   * @param {number} [rank] 1-based leaderboard rank (for deterministic placeholder names)
   * @param {string} [whenAnonymous] e.g. "You" for your row when tag is missing / legacy "Frog"
   */
  function getDisplayName(entry, rank, whenAnonymous) {
    if (!entry) return whenAnonymous || "Player";
    const raw = entry && typeof entry.tag === "string" ? entry.tag.trim() : "";
    if (raw && raw.toLowerCase() !== "frog") {
      return raw;
    }
    if (entry && typeof entry.name === "string" && entry.name.trim() !== "") {
      return entry.name.trim();
    }
    if (whenAnonymous) return whenAnonymous;
    const cfg = window.FrogGameConfig;
    const r = typeof rank === "number" && rank > 0 ? rank : 1;
    if (cfg && typeof cfg.leaderboardPlaceholderName === "function") {
      return cfg.leaderboardPlaceholderName(entry, r);
    }
    return `Player ${r}`;
  }

  function getEntryKey(entry) {
    if (!entry || typeof entry !== "object") return null;
    if (entry.userId) return `id:${entry.userId}`;

    const tagKey = normalizeLabel(entry.tag);
    if (tagKey) return `tag:${tagKey}`;

    const nameKey = normalizeLabel(entry.name);
    if (nameKey) return `name:${nameKey}`;

    return null;
  }

  function isBetterEntry(candidate, current) {
    if (!current) return true;
    const candScore = getEntryScore(candidate);
    const currScore = getEntryScore(current);
    if (candScore > currScore) return true;
    if (candScore < currScore) return false;

    const candTime = getEntryTime(candidate);
    const currTime = getEntryTime(current);
    return candTime < currTime;
  }

  function compareEntriesByScoreTime(a, b) {
    const diff = getEntryScore(b) - getEntryScore(a);
    if (diff !== 0) return diff;
    return getEntryTime(a) - getEntryTime(b);
  }

  function dedupeAndSortEntries(entries) {
    if (!Array.isArray(entries)) return [];

    const bestByKey = new Map();
    const leftovers = [];

    for (const entry of entries) {
      if (!entry) continue;

      const key = getEntryKey(entry);
      if (!key) {
        leftovers.push(entry);
        continue;
      }

      const current = bestByKey.get(key);
      if (isBetterEntry(entry, current)) {
        bestByKey.set(key, entry);
      }
    }

    const merged = [...bestByKey.values(), ...leftovers];
    merged.sort(compareEntriesByScoreTime);
    return merged;
  }

  function ensureScoreboardOverlay(container) {
    if (scoreboardOverlay) return;

    containerEl = container || document.body;

    scoreboardOverlay = document.createElement("div");
    scoreboardOverlay.id = "frog-scoreboard-overlay";
    scoreboardOverlay.className = "scoreboard-overlay";
    scoreboardOverlay.style.display = "none";

    scoreboardOverlayInner = document.createElement("div");
    scoreboardOverlayInner.className = "scoreboard-card";

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

      if (
        lastMyEntry &&
        typeof lastMyEntry.tag === "string" &&
        lastMyEntry.tag.trim() !== "" &&
        lastMyEntry.tag.trim().toLowerCase() !== "frog" &&
        typeof localStorage !== "undefined"
      ) {
        try {
          localStorage.setItem(TAG_STORAGE_KEY, lastMyEntry.tag.trim());
        } catch (e) {
          // ignore
        }
      }

      return dedupeAndSortEntries(entries);
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
        const errData = await res.json().catch(() => null);
        console.warn("Failed to submit score:", res.status, errData);
        return { _error: true, status: res.status, ...(errData || {}) };
      }
      
      const data = await res.json().catch(() => null);
      if (!data || !Array.isArray(data.entries)) {
        console.warn("Leaderboard response missing entries:", data);
        return null;
      }

      const entries = dedupeAndSortEntries(data.entries);

      if (data.myEntry) {
        const key = getEntryKey(data.myEntry);
        const match =
          key && entries.find((entry) => getEntryKey(entry) === key);
        lastMyEntry = match || data.myEntry;
        if (
          lastMyEntry &&
          typeof lastMyEntry.tag === "string" &&
          lastMyEntry.tag.trim() !== "" &&
          lastMyEntry.tag.trim().toLowerCase() !== "frog" &&
          typeof localStorage !== "undefined"
        ) {
          try {
            localStorage.setItem(TAG_STORAGE_KEY, lastMyEntry.tag.trim());
          } catch (e) {
            // ignore
          }
        }
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
    const userLabel = getCurrentUserLabelFromLeaderboard();

    function entryMatchesMe(entry) {
      if (!entry) return false;

      // Prefer a hard identifier if the service provided one
      if (myEntry && myEntry.userId && entry.userId) {
        if (myEntry.userId === entry.userId) return true;
      }

      // Fall back to matching the score/time pair returned for this user
      if (myEntry) {
        const sameScore = Math.round(getEntryScore(entry)) ===
          Math.round(getEntryScore(myEntry));
        const sameTime = Math.abs(getEntryTime(entry) - getEntryTime(myEntry)) < 0.01;
        if (sameScore && sameTime) return true;
      }

      const candidates = [];
      if (myEntry) {
        candidates.push(normalizeLabel(myEntry.tag));
        candidates.push(normalizeLabel(myEntry.name));
      }
      candidates.push(normalizeLabel(userLabel));

      const entryLabels = [normalizeLabel(entry.tag), normalizeLabel(entry.name)];

      return candidates.some((target) =>
        target && entryLabels.some((label) => label && label === target)
      );
    }

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

    mini.innerHTML = "";
    const maxRows = Math.min(5, entries.length);

    for (let i = 0; i < maxRows; i++) {
      const entry = entries[i] || {};
      const rank = i + 1;
      const name = getDisplayName(entry, rank);
      const score = getEntryScore(entry);
      const time = getEntryTime(entry);

      const row = document.createElement("div");
      row.style.fontFamily = "monospace";
      row.style.fontSize = "11px";

      row.textContent = `${rank}. ${name} — ${formatTime(
        time
      )}, ${Math.floor(score)}`;

      // Highlight your row (gold + bold) if you're on the board
      if (entryMatchesMe(entry)) {
        row.style.color = "#ffd700";
        row.style.fontWeight = "bold";
      }

      mini.appendChild(row);
    }
  }

  // --------------------------------------------------
  // FULL SCOREBOARD OVERLAY (after a run)
  // --------------------------------------------------
  function openScoreboardOverlay(entries, lastScore, lastTime, finalStats, options) {

    if (!scoreboardOverlay || !scoreboardOverlayInner) return;

    const safeOptions = options || {};
    const { onPlayAgain, onReturnToMenu } = safeOptions;

    const safeList = Array.isArray(entries) ? entries : [];

    scoreboardOverlayInner.innerHTML = "";

    const header = document.createElement("div");
    header.className = "scoreboard-header";
    header.innerHTML = `
      <div class="scoreboard-title">Run summary</div>
      <div class="scoreboard-subtitle">Leaderboard updated</div>
    `;
    scoreboardOverlayInner.appendChild(header);

    let { index: myIndex, entry: myEntry } =
      findMyIndexInList(safeList, lastScore, lastTime);
    let summary = null;

    const summaryName = getDisplayName(
      myEntry,
      myIndex >= 0 ? myIndex + 1 : 1,
      "You"
    );

    function renderSummary(name) {
      if (!summary) return;

      const safeName = escapeHtml(name || summaryName);
      const displayScore = Math.floor(
        typeof lastScore === "number" ? lastScore : getEntryScore(myEntry)
      );
      const displayTime = formatTime(
        typeof lastTime === "number" ? lastTime : getEntryTime(myEntry)
      );

      summary.innerHTML = `
        <div class="summary-heading">${safeName}</div>
        <div class="summary-metrics">
          <div class="summary-pill">
            <div class="pill-label">Score</div>
            <div class="pill-value">${displayScore}</div>
          </div>
          <div class="summary-pill">
            <div class="pill-label">Time survived</div>
            <div class="pill-value">${displayTime}</div>
          </div>
        </div>
      `;
    }

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
      tagBox.style.marginBottom = "10px";
      tagBox.style.fontSize = "12px";

      const label = document.createElement("div");
      label.textContent =
        "Choose a player tag to show on the leaderboard (optional):";
      label.style.marginBottom = "4px";
      tagBox.appendChild(label);

      const tagInput = document.createElement("input");
      tagInput.type = "text";
      tagInput.placeholder = "Example: SwampWizard";
      tagInput.maxLength = TAG_MAX_LENGTH;
      tagInput.style.width = "100%";
      tagInput.style.padding = "4px 6px";
      tagInput.style.borderRadius = "4px";
      tagInput.style.border = "1px solid #444";
      tagInput.style.background = "#000";
      tagInput.style.color = "#eee";
      tagInput.style.fontFamily = "inherit";
      tagInput.style.fontSize = "12px";

      // If we already have a saved tag, pre-fill the input with it
      if (storedTag) {
        tagInput.value = storedTag;
      }

      tagBox.appendChild(tagInput);

      const buttonsRow = document.createElement("div");
      buttonsRow.style.display = "flex";
      buttonsRow.style.gap = "6px";
      buttonsRow.style.marginTop = "6px";

      const saveBtn = document.createElement("button");
      saveBtn.textContent = "Save tag";
      saveBtn.style.padding = "2px 6px";
      saveBtn.style.background = "#222";
      saveBtn.style.border = "1px solid #444";
      saveBtn.style.color = "#eee";
      saveBtn.style.borderRadius = "3px";
      saveBtn.style.cursor = "pointer";

      const skipBtn = document.createElement("button");
      skipBtn.textContent = "Skip";
      skipBtn.style.padding = "2px 6px";
      skipBtn.style.background = "transparent";
      skipBtn.style.border = "1px solid #444";
      skipBtn.style.color = "#aaa";
      skipBtn.style.borderRadius = "3px";
      skipBtn.style.cursor = "pointer";

      const error = document.createElement("div");
      error.style.marginTop = "4px";
      error.style.fontSize = "11px";
      error.style.color = "#ff8080";
      error.style.minHeight = "14px";

      buttonsRow.appendChild(saveBtn);
      buttonsRow.appendChild(skipBtn);
      tagBox.appendChild(buttonsRow);
      tagBox.appendChild(error);

      scoreboardOverlayInner.appendChild(tagBox);

      summary = document.createElement("div");
      summary.className = "scoreboard-summary";
      renderSummary(summaryName);
      scoreboardOverlayInner.appendChild(summary);

      async function finish(tagValue) {
        const cleanTag = String(tagValue || "").trim();
        if (!cleanTag) {
          tagBox.style.display = "none";
          return;
        }

        const scoreToUse = Math.floor(
          typeof lastScore === "number" ? lastScore : getEntryScore(myEntry)
        );
        const timeToUse =
          typeof lastTime === "number" ? lastTime : getEntryTime(myEntry);

        try {
          const result = await submitScoreToServer(scoreToUse, timeToUse, finalStats || null, cleanTag);

          if (result && result._error) {
            const msg =
              result.error === "tag_taken"
                ? "That tag is already taken. Try another."
                : (result.message || "Could not save tag. Try again.");
            error.textContent = msg;
            return;
          }

          if (typeof localStorage !== "undefined") {
            localStorage.setItem(TAG_STORAGE_KEY, cleanTag);
          }

          // Update all cached references to the tag so highlighting stays correct
          if (myEntry) myEntry.tag = cleanTag;
          if (lastMyEntry) lastMyEntry.tag = cleanTag;

          renderSummary(cleanTag);

          // Get the fresh list — prefer the server response, fall back to fetch
          const freshList = Array.isArray(result) ? result : await fetchLeaderboard();

          // Re-render the full scoreboard table in place so the new tag is shown
          // and the highlight follows the correct row
          if (freshList.length > 0) {
            safeList.length = 0;
            for (const e of freshList) safeList.push(e);
            totalEntries = safeList.length;
            totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));

            // Recompute which row is "mine" using the updated lastMyEntry (userId match)
            const { index: newMyIndex } = findMyIndexInList(safeList, lastScore, lastTime);
            myIndex = newMyIndex;

            // Jump to the page that contains the player's row
            if (myIndex >= 0) {
              currentPage = Math.floor(myIndex / PAGE_SIZE);
            }
            renderPage();
          }

          // Also refresh the mini leaderboard
          updateMiniLeaderboard(freshList, lastMyEntry);

          error.textContent = "";
          tagBox.style.display = "none";
        } catch (e) {
          error.textContent = "Connection error. Try again.";
        }
      }

      saveBtn.addEventListener("click", async () => {
        const raw = (tagInput.value || "").trim();

        if (!raw) {
          error.textContent = "Enter at least 2 characters, or click Skip.";
          return;
        }

        if (raw.length < TAG_MIN_LENGTH || raw.length > TAG_MAX_LENGTH) {
          error.textContent = `Tag must be ${TAG_MIN_LENGTH}-${TAG_MAX_LENGTH} characters.`;
          return;
        }

        if (!/^[a-zA-Z0-9 _-]{2,20}$/.test(raw)) {
          error.textContent = "Use letters, numbers, spaces, _ or - only.";
          return;
        }

        if (isProfaneTag(raw)) {
          error.textContent = "That tag isn't allowed. Please choose something cleaner.";
          return;
        }

        error.textContent = "";
        saveBtn.disabled = true;
        skipBtn.disabled = true;

        try {
          await finish(raw);
        } finally {
          saveBtn.disabled = false;
          skipBtn.disabled = false;
        }
      });

      // Skip: just hide for this run; will show again next run
      skipBtn.addEventListener("click", () => {
        error.textContent = "";
        tagBox.style.display = "none";
      });
    })();

    // ----- Leaderboard table with pagination (10 per page) -----
    const PAGE_SIZE = 10;
    let currentPage = 0;
    let totalEntries = safeList.length;
    let totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));

    const tableWrapper = document.createElement("div");
    tableWrapper.className = "scoreboard-table-wrapper";

    const table = document.createElement("table");
    table.className = "scoreboard-table";

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

    for (const th of [thRank, thName, thTime, thScore]) {
      th.className = "scoreboard-th";
    }

    headRow.appendChild(thRank);
    headRow.appendChild(thName);
    headRow.appendChild(thTime);
    headRow.appendChild(thScore);
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    table.appendChild(tbody);
    tableWrapper.appendChild(table);

    // Pagination controls
    const pager = document.createElement("div");
    pager.className = "scoreboard-pager";

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "◀ Prev";
    prevBtn.className = "scoreboard-btn scoreboard-btn--ghost";

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next ▶";
    nextBtn.className = "scoreboard-btn scoreboard-btn--ghost";

    const pageInfo = document.createElement("div");
    pageInfo.className = "scoreboard-page-info";

    pager.appendChild(prevBtn);
    pager.appendChild(pageInfo);
    pager.appendChild(nextBtn);
    tableWrapper.appendChild(pager);
    scoreboardOverlayInner.appendChild(tableWrapper);

    function renderPage() {
      tbody.innerHTML = "";

      if (totalEntries === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 4;
        td.textContent = "No scores yet.";
        td.style.padding = "4px";
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
        const name = getDisplayName(e, rank);
        const score = getEntryScore(e);
        const time = getEntryTime(e);

        const tr = document.createElement("tr");
        tr.className = "scoreboard-row";

        const rankCell = document.createElement("td");
        const nameCell = document.createElement("td");
        const timeCell = document.createElement("td");
        const scoreCell = document.createElement("td");

        rankCell.textContent = rank;
        nameCell.textContent = name;
        timeCell.textContent = formatTime(time);
        scoreCell.textContent = Math.floor(score);

        rankCell.className = "scoreboard-td scoreboard-rank";
        nameCell.className = "scoreboard-td scoreboard-name";
        timeCell.className = "scoreboard-td";
        scoreCell.className = "scoreboard-td scoreboard-score";

        // Highlight "you" if this is your entry
        if (i === myIndex) {
          tr.classList.add("scoreboard-row--me");
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
  
    if (onPlayAgain || onReturnToMenu) {
      const actions = document.createElement("div");
      actions.className = "scoreboard-actions";

      if (onPlayAgain) {
        const playAgainBtn = document.createElement("button");
        playAgainBtn.className = "scoreboard-btn scoreboard-btn--primary";
        playAgainBtn.textContent = "Play again";
        playAgainBtn.addEventListener("click", () => {
          hideScoreboardOverlay();
          onPlayAgain();
        });
        actions.appendChild(playAgainBtn);
      }

      if (onReturnToMenu) {
        const menuBtn = document.createElement("button");
        menuBtn.className = "scoreboard-btn";
        menuBtn.textContent = "Return to menu";
        menuBtn.addEventListener("click", () => {
          hideScoreboardOverlay();
          onReturnToMenu();
        });
        actions.appendChild(menuBtn);
      }

      scoreboardOverlayInner.appendChild(actions);
    }

    const hint = document.createElement("div");
    hint.textContent = "Click outside this panel to close.";
    hint.className = "scoreboard-hint";
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

  // --------------------------------------------------
  // RECENT RUNS: FETCH & SUBMIT
  // --------------------------------------------------
  async function fetchRecentRuns() {
    try {
      const res = await fetch(RECENT_RUNS_URL, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        console.warn("fetchRecentRuns non-OK:", res.status);
        return [];
      }
      const data = await res.json();
      return Array.isArray(data.runs) ? data.runs : [];
    } catch (err) {
      console.error("fetchRecentRuns error", err);
      return [];
    }
  }

  async function submitRecentRun(run) {
    try {
      const res = await fetch(RECENT_RUNS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(run),
      });
      if (!res.ok) console.warn("submitRecentRun non-OK:", res.status);
    } catch (err) {
      console.error("submitRecentRun error", err);
    }
  }

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
    isProfaneTag,
    fetchRecentRuns,
    submitRecentRun,
    get _lastMyEntry() { return lastMyEntry; },
  };
})();