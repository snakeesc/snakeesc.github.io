// arcade-ui.js
// Renders the various overlay contents from data.
// Pure presentation — no game logic.

(function () {
  "use strict";

  const Data = window.ArcadeData;
  if (!Data) {
    console.error("ArcadeData missing — load arcade-data.js first.");
    return;
  }

  // ------------------------------------------------------------
  // OVERLAY OPEN/CLOSE
  // ------------------------------------------------------------
  const OPEN_CLASS = "is-open";

  function openOverlay(id) {
    closeAllOverlays();
    const el = document.getElementById(id);
    if (el) el.classList.add(OPEN_CLASS);
  }

  function closeOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove(OPEN_CLASS);
  }

  function closeAllOverlays() {
    document.querySelectorAll(".arc-overlay").forEach(o => o.classList.remove(OPEN_CLASS));
  }

  // ------------------------------------------------------------
  // LEADERBOARD
  // ------------------------------------------------------------
  let lbSort = "score";
  let lbPage = 0;
  const LB_PAGE_SIZE = 10;

  function renderLeaderboard() {
    const container = document.getElementById("leaderboardContent");
    const pageInfo  = document.getElementById("lbPageInfo");
    if (!container) return;

    const sorted = [...Data.MOCK_LEADERBOARD].sort((a, b) => {
      if (lbSort === "time")  return (b.bestTime  || 0) - (a.bestTime  || 0);
      if (lbSort === "frogs") return (b.frogs     || 0) - (a.frogs     || 0);
      return (b.bestScore || 0) - (a.bestScore || 0);
    });

    const totalPages = Math.max(1, Math.ceil(sorted.length / LB_PAGE_SIZE));
    if (lbPage >= totalPages) lbPage = totalPages - 1;
    if (lbPage < 0) lbPage = 0;

    const start = lbPage * LB_PAGE_SIZE;
    const slice = sorted.slice(start, start + LB_PAGE_SIZE);

    container.innerHTML = "";
    slice.forEach((entry, i) => {
      const rank = start + i + 1;
      const row = document.createElement("div");
      row.className = "arc-row";
      if (rank <= 3) row.classList.add("arc-row-rank-" + rank);
      if (entry.isMe) row.classList.add("arc-row-me");

      const rankEl = document.createElement("span");
      rankEl.textContent = String(rank).padStart(2, "0");

      const nameEl = document.createElement("span");
      nameEl.className = "arc-row-name";
      nameEl.textContent = entry.tag + (entry.isMe ? " (you)" : "");

      const timeEl = document.createElement("span");
      timeEl.className = "arc-row-time";
      timeEl.textContent = Data.formatTime(entry.bestTime);

      const scoreEl = document.createElement("span");
      scoreEl.className = "arc-row-score";
      scoreEl.textContent = Data.formatScore(entry.bestScore);

      row.appendChild(rankEl);
      row.appendChild(nameEl);
      row.appendChild(timeEl);
      row.appendChild(scoreEl);
      container.appendChild(row);
    });

    if (pageInfo) pageInfo.textContent = (lbPage + 1) + " / " + totalPages;
  }

  function setLbSort(sort) {
    lbSort = sort;
    lbPage = 0;
    document.querySelectorAll(".arc-tab[data-lb-sort]").forEach(t => {
      t.classList.toggle("is-active", t.getAttribute("data-lb-sort") === sort);
    });
    renderLeaderboard();
  }

  function lbPageChange(dir) {
    if (dir === "prev") lbPage--;
    else if (dir === "next") lbPage++;
    renderLeaderboard();
  }

  // ------------------------------------------------------------
  // UPGRADE CHOICES (preview pop-up)
  // ------------------------------------------------------------
  function renderUpgradeChoices(choices) {
    const container = document.getElementById("upgradeChoicesContainer");
    if (!container) return;

    const list = choices || Data.SAMPLE_UPGRADE_CHOICES;

    container.innerHTML = "";
    list.forEach((choice, i) => {
      const btn = document.createElement("button");
      btn.className = "arc-upgrade-choice arc-upgrade-" + (choice.category || "mobility");
      btn.setAttribute("data-upgrade-id", choice.id || ("u" + i));

      const head = document.createElement("div");
      head.className = "arc-upgrade-head";

      const title = document.createElement("div");
      title.className = "arc-upgrade-title";
      title.textContent = "[" + (i + 1) + "] " + choice.title;

      const cat = document.createElement("div");
      cat.className = "arc-upgrade-cat";
      cat.textContent = (choice.category || "").toUpperCase();

      head.appendChild(title);
      head.appendChild(cat);

      const desc = document.createElement("div");
      desc.className = "arc-upgrade-desc";
      desc.textContent = choice.desc;

      btn.appendChild(head);
      btn.appendChild(desc);

      btn.addEventListener("click", () => {
        // In the real game this picks the upgrade.
        // For preview, just close the overlay.
        closeOverlay("upgradeOverlay");
      });

      container.appendChild(btn);
    });
  }

  // ------------------------------------------------------------
  // DASHBOARD
  // ------------------------------------------------------------
  function renderDashboard() {
    const me = Data.MOCK_LEADERBOARD.find(e => e.isMe);
    if (!me) return;

    const tag        = document.getElementById("dashTag");
    const bestTime   = document.getElementById("dashBestTime");
    const bestScore  = document.getElementById("dashBestScore");
    const runs       = document.getElementById("dashRuns");
    const rank       = document.getElementById("dashRank");
    const recentEl   = document.getElementById("dashRecent");

    if (tag)       tag.textContent = me.tag;
    if (bestTime)  bestTime.textContent = Data.formatTime(me.bestTime);
    if (bestScore) bestScore.textContent = Data.formatScore(me.bestScore);
    if (runs)      runs.textContent = "142";

    const sorted = [...Data.MOCK_LEADERBOARD].sort((a, b) => (b.bestScore || 0) - (a.bestScore || 0));
    const myRank = sorted.findIndex(e => e.isMe) + 1;
    if (rank) rank.textContent = myRank ? "#" + String(myRank).padStart(2, "0") : "—";

    if (recentEl) {
      recentEl.innerHTML = "";
      Data.MOCK_RECENT_RUNS.forEach(r => {
        const row = document.createElement("div");
        row.className = "arc-recent-row";

        const when = document.createElement("span");
        when.className = "arc-recent-when";
        when.textContent = r.when;

        const time = document.createElement("span");
        time.className = "arc-recent-time";
        time.textContent = Data.formatTime(r.time);

        const score = document.createElement("span");
        score.className = "arc-recent-score";
        score.textContent = Data.formatScore(r.score);

        row.appendChild(when);
        row.appendChild(time);
        row.appendChild(score);
        recentEl.appendChild(row);
      });
    }
  }

  // ------------------------------------------------------------
  // BUFF GUIDE
  // ------------------------------------------------------------
  let buffTab = "regular";

  function renderBuffGuide() {
    const container = document.getElementById("buffGuideContent");
    if (!container) return;

    const list = Data.BUFF_GUIDE[buffTab] || [];

    container.innerHTML = "";
    list.forEach(item => {
      const card = document.createElement("div");
      card.className = "arc-buff-item arc-buff-item-" + (item.category || "mobility");

      const head = document.createElement("div");
      head.className = "arc-buff-item-head";

      const title = document.createElement("div");
      title.className = "arc-buff-item-title";
      title.textContent = item.title;

      const cat = document.createElement("div");
      cat.className = "arc-buff-item-cat";
      cat.textContent = (item.category || "").toUpperCase();

      head.appendChild(title);
      head.appendChild(cat);

      const desc = document.createElement("div");
      desc.className = "arc-buff-item-desc";
      desc.textContent = item.desc;

      card.appendChild(head);
      card.appendChild(desc);
      container.appendChild(card);
    });
  }

  function setBuffTab(tab) {
    buffTab = tab;
    document.querySelectorAll(".arc-tab[data-buff-tab]").forEach(t => {
      t.classList.toggle("is-active", t.getAttribute("data-buff-tab") === tab);
    });
    renderBuffGuide();
  }

  // ------------------------------------------------------------
  // HUD: MINI LEADERBOARD
  // ------------------------------------------------------------
  function renderHudLeaderboard() {
    const container = document.getElementById("hudLbRows");
    if (!container) return;

    const sorted = [...Data.MOCK_LEADERBOARD].sort((a, b) => (b.bestScore || 0) - (a.bestScore || 0));
    const top = sorted.slice(0, 7);

    container.innerHTML = "";
    top.forEach((entry, i) => {
      const rank = i + 1;
      const row = document.createElement("div");
      row.className = "hud-lb-row";
      if (rank <= 3) row.classList.add("is-rank-" + rank);
      if (entry.isMe) row.classList.add("is-me");

      const rankEl = document.createElement("span");
      rankEl.className = "hud-lb-rank-num";
      rankEl.textContent = String(rank).padStart(2, "0");

      const nameEl = document.createElement("span");
      nameEl.textContent = entry.tag + (entry.isMe ? " (you)" : "");

      const scoreEl = document.createElement("span");
      scoreEl.className = "hud-lb-score";
      scoreEl.textContent = Data.formatScore(entry.bestScore);

      row.appendChild(rankEl);
      row.appendChild(nameEl);
      row.appendChild(scoreEl);
      container.appendChild(row);
    });
  }

  // ------------------------------------------------------------
  // HUD: ACTIVE STATS PANEL
  // ------------------------------------------------------------
  function renderHudStats() {
    const rows = document.getElementById("hudStatsRows");
    const temp = document.getElementById("hudStatsTemp");
    if (!rows || !temp) return;

    rows.innerHTML = "";
    Data.SAMPLE_ACTIVE_STATS.forEach(s => {
      const row = document.createElement("div");
      row.className = "hud-stats-row cat-" + (s.category || "mobility");

      const name = document.createElement("span");
      name.className = "hud-stats-name";
      name.textContent = s.name + " " + s.val;

      const val = document.createElement("span");
      val.className = "hud-stats-val";
      val.textContent = s.detail || "";

      row.appendChild(name);
      row.appendChild(val);
      rows.appendChild(row);
    });

    temp.innerHTML = "";
    Data.SAMPLE_TEMP_BUFFS.forEach(b => {
      const row = document.createElement("div");
      row.className = "hud-temp-buff";

      const name = document.createElement("span");
      name.className = "hud-temp-name";
      name.textContent = b.name;

      const bar = document.createElement("div");
      bar.className = "hud-temp-bar";

      const fill = document.createElement("div");
      fill.className = "hud-temp-bar-fill";
      fill.style.width = (b.remainingPct || 0) + "%";

      bar.appendChild(fill);
      row.appendChild(name);
      row.appendChild(bar);
      temp.appendChild(row);
    });
  }

  // ------------------------------------------------------------
  // MAIN MENU FOOTER
  // ------------------------------------------------------------
  function renderMenuFooter() {
    const me = Data.MOCK_LEADERBOARD.find(e => e.isMe);
    const tagEl  = document.getElementById("menuTag");
    const bestEl = document.getElementById("menuBest");
    if (tagEl  && me) tagEl.textContent  = me.tag;
    if (bestEl && me) bestEl.textContent = Data.formatTime(me.bestTime);
  }

  // ------------------------------------------------------------
  // EXPORT
  // ------------------------------------------------------------
  window.ArcadeUI = {
    openOverlay,
    closeOverlay,
    closeAllOverlays,
    renderLeaderboard,
    setLbSort,
    lbPageChange,
    renderUpgradeChoices,
    renderDashboard,
    renderBuffGuide,
    setBuffTab,
    renderHudLeaderboard,
    renderHudStats,
    renderMenuFooter
  };
})();
