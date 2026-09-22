// frog-game.js
// Main Frog Snake survival game logic for FreshFrogs.

(function () {
  "use strict";

  // --------------------------------------------------
  // HOOK MODULES
  // --------------------------------------------------
  const AudioMod = window.FrogGameAudio || {};
  const initAudio                = AudioMod.initAudio                || function(){};
  const playRandomRibbit         = AudioMod.playRandomRibbit         || function(){};
  const playFrogDeath            = AudioMod.playFrogDeath            || function(){};
  const playSnakeMunch           = AudioMod.playSnakeMunch           || function(){};
  const playRandomOrbSpawnSound  = AudioMod.playRandomOrbSpawnSound  || function(){};
  const playBuffSound            = AudioMod.playBuffSound            || function(){};
  const playPermanentChoiceSound = AudioMod.playPermanentChoiceSound || function(){};
  const playPerFrogUpgradeSound  = AudioMod.playPerFrogUpgradeSound  || function(){};

  const LMod = window.FrogGameLeaderboard || {};
  const initLeaderboard        = LMod.initLeaderboard        || function(){};
  const submitScoreToServer    = LMod.submitScoreToServer    || (async () => null);
  const fetchLeaderboard       = LMod.fetchLeaderboard       || (async () => null);
  const updateMiniLeaderboard  = LMod.updateMiniLeaderboard  || function(){};
  const openScoreboardOverlay  = LMod.openScoreboardOverlay  || function(){};
  const hideScoreboardOverlay  = LMod.hideScoreboardOverlay  || function(){};
  const fetchRecentRuns        = LMod.fetchRecentRuns        || (async () => []);
  const submitRecentRun        = LMod.submitRecentRun        || (async () => null);

  const Config = window.FrogGameConfig;
  const Utils = window.FrogGameUtils || {};

  if (!Config) return;

  const {
    TAG_STORAGE_KEY,
    FROG_SIZE,
    MAX_TOKEN_ID,
    META_BASE,
    META_EXT,
    BUILD_BASE,
    STARTING_FROGS,
    MAX_FROGS,
    ORB_RADIUS,
    ORB_TTL,
    ORB_SPAWN_INTERVAL_MIN,
    ORB_SPAWN_INTERVAL_MAX,
    SNAKE_SEGMENT_SIZE,
    SNAKE_EGG_HATCH_CHANCE,
    SNAKE_BASE_SPEED,
    SNAKE_TURN_RATE,
    SNAKE_SEGMENT_GAP,
    SNAKE_INITIAL_SEGMENTS,
    SNAKE_EAT_RADIUS_BASE,
    SNAKE_EGG_BUFF_PCT,
    SNAKE_TURN_RATE_BASE,
    SNAKE_TURN_RATE_CAP,
    SPEED_BUFF_DURATION,
    JUMP_BUFF_DURATION,
    SNAKE_SLOW_DURATION,
    SNAKE_CONFUSE_DURATION,
    SNAKE_SHRINK_DURATION,
    FROG_SHIELD_DURATION,
    TIME_SLOW_DURATION,
    ORB_MAGNET_DURATION,
    SCORE_MULTI_DURATION,
    PANIC_HOP_DURATION,
    CLONE_SWARM_DURATION,
    LIFE_STEAL_DURATION,
    PERMA_LIFESTEAL_ORB_COUNT,
    SPEED_BUFF_FACTOR,
    PANIC_HOP_SPEED_FACTOR,
    JUMP_BUFF_FACTOR,
    SNAKE_SLOW_FACTOR,
    TIME_SLOW_FACTOR,
    FRENZY_SPEED_FACTOR,
    SCORE_MULTI_FACTOR,
    CHAMPION_SPEED_FACTOR,
    CHAMPION_JUMP_FACTOR,
    AURA_JUMP_FACTOR,
    LUCKY_BUFF_DURATION_BOOST,
    AURA_SPEED_FACTOR,
    LUCKY_SCORE_BONUS_PER,
    CANNIBAL_EAT_CHANCE,
    FROG_SPEED_UPGRADE_FACTOR,
    FROG_JUMP_UPGRADE_FACTOR,
    BUFF_DURATION_UPGRADE_FACTOR,
    ORB_INTERVAL_UPGRADE_FACTOR,
    ORB_COLLECTOR_CHANCE,
    TOTAL_HIGHLIGHT_COLOR,
    MIN_FROG_SPEED_FACTOR,
    MAX_FROG_JUMP_FACTOR,
    MAX_BUFF_DURATION_FACTOR,
    MIN_ORB_SPAWN_INTERVAL_FACTOR,
    MAX_DEATHRATTLE_CHANCE,
    MAX_ORB_COLLECTOR_TOTAL,
    SNAKE_SHED_SPEEDUP,
    MIN_TOTAL_FROG_SPEED_FACTOR,
    MAX_TOTAL_FROG_JUMP_FACTOR,
    MAX_SNAKE_SEGMENTS,
    CANNIBAL_ROLE_CHANCE,
    ORB_STORM_COUNT,
    NORMAL_SPAWN_AMOUNT,
    EPIC_SPAWN_AMOUNT,
    LEGENDARY_SPAWN_AMOUNT,
    COMMON_DEATHRATTLE_CHANCE,
    EPIC_DEATHRATTLE_CHANCE,
    LEGENDARY_DEATHRATTLE_CHANCE,
    GRAVE_WAVE_MIN_GHOSTS,
    GRAVE_WAVE_MAX_GHOSTS,
    LEGENDARY_BUFF_DURATION_FACTOR,
    LAST_STAND_MIN_CHANCE,
    SCATTER_ANIMATED_VALUES,
    SKIP_TRAITS,
    LEGENDARY_EVENT_TIME,
    SHED_INTERVAL,
    AURA_RADIUS,
    AURA_RADIUS2,
    MAIN_MENU_BACKGROUND_ENABLED
  } = Config;

  const {
    randInt = () => 0,
    randRange = () => 0,
    pickRandomTokenIds = () => [],
    computeInitialPositions = () => []
  } = Utils;

  const statHighlight = (text) => `<span class="stat-highlight">${text}</span>`;
  const ORB_MAGNET_PULL_RANGE = 220;
  const DASHBOARD_STORAGE_KEY = "frogSnake_dashboardStats_v1";
  const DASHBOARD_COSMETICS_STORAGE_KEY = "frogSnake_dashboardCosmetics_v1";
  const DASHBOARD_PFP_STORAGE_KEY = "frogSnake_dashboardPfp_v1";
  const DASHBOARD_PFP_EYES_CHANCE = 0.12; // 12% chance
  const LEADERBOARD_RESET_NOTE = "";

const DASHBOARD_STARTING_BUFF_KEY = "frogSnake_dashboardStartingBuff_v1";

const STARTING_BUFFS = [
  {
    id: "headStart",
    levelRequired: 1,
    emoji: "🐸",
    name: "Head Start",
    desc: "Spawn 10 extra frogs immediately"
  },
  {
    id: "quickReflexes",
    levelRequired: 2,
    emoji: "🐇",
    name: "Quick Reflexes",
    desc: "Frogs start 10% faster"
  },
  {
    id: "insurance",
    levelRequired: 3,
    emoji: "💀",
    name: "Insurance",
    desc: "Start with 5% deathrattle chance"
  },
  {
    id: "stormFront",
    levelRequired: 4,
    emoji: "🌩️",
    name: "Storm Front",
    desc: "Start with Orb Storm already triggered"
  },
  {
    id: "evolved",
    levelRequired: 5,
    emoji: "⚗️",
    name: "Evolved",
    desc: "Start with 2–4 frogs of one random role"
  },
  {
    id: "luckyStart",
    levelRequired: 6,
    emoji: "🍀",
    name: "Lucky Start",
    desc: "Start with +5 luck"
  },
  {
    id: "orbSpecialistStart",
    levelRequired: 7,
    emoji: "🧪",
    name: "Orb Specialist",
    desc: "First 15 collected orbs each spawn 1 extra frog"
  },
  {
    id: "lastStandStart",
    levelRequired: 8,
    emoji: "🏹",
    name: "Last Stand",
    desc: "Start with Last Stand already active"
  },
  {
    id: "doubleYolkerStart",
    levelRequired: 9,
    emoji: "🥚",
    name: "Double Yolker",
    desc: "Start the run with Double Yolker active"
  },
  {
    id: "loadedHandStart",
    levelRequired: 10,
    emoji: "🃏",
    name: "Loaded Hand",
    desc: "Start with 4 upgrade choices instead of 3"
  }
];

function getUnlockedStartingBuffs(level) {
  const lvl = Math.max(1, Math.floor(Number(level) || 1));
  return STARTING_BUFFS.filter(buff => lvl >= buff.levelRequired);
}

function getDefaultStartingBuffId() {
  return "headStart";
}

function getStartingBuffById(id) {
  return STARTING_BUFFS.find(buff => buff.id === id) || STARTING_BUFFS[0];
}

function getSelectedStartingBuffId() {
  try {
    if (typeof localStorage === "undefined") return getDefaultStartingBuffId();
    const saved = localStorage.getItem(DASHBOARD_STARTING_BUFF_KEY);
    return saved || getDefaultStartingBuffId();
  } catch (e) {
    return getDefaultStartingBuffId();
  }
}

function getSelectedStartingBuff(level) {
  const unlocked = getUnlockedStartingBuffs(level);
  const selectedId = getSelectedStartingBuffId();
  const selected = unlocked.find(buff => buff.id === selectedId);
  return selected || unlocked[0] || STARTING_BUFFS[0];
}

function saveSelectedStartingBuffId(id) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(DASHBOARD_STARTING_BUFF_KEY, id);
  } catch (e) {
    // ignore
  }
}

function applySelectedStartingBuff() {
  const levelData = getDashboardLevelData(loadDashboardStats().totalOrbsCollected || 0);
  const selected = getSelectedStartingBuff(levelData.level);
  if (!selected) return;

  const width = window.innerWidth;
  const height = window.innerHeight;

  switch (selected.id) {
    case "headStart":
      spawnExtraFrogs(10);
      break;

    case "quickReflexes":
      frogPermanentSpeedFactor *= 0.90;
      if (frogPermanentSpeedFactor < MIN_FROG_SPEED_FACTOR) {
        frogPermanentSpeedFactor = MIN_FROG_SPEED_FACTOR;
      }
      break;

    case "insurance":
      frogDeathRattleChance = Math.min(
        MAX_DEATHRATTLE_CHANCE,
        frogDeathRattleChance + 0.05
      );
      break;

    case "stormFront":
      for (let i = 0; i < ORB_STORM_COUNT; i++) {
        spawnOrbRandom(width, height);
      }
      break;

    case "evolved": {
      const roleIds = ["cannibal", "aura", "magnet", "lucky", "zombie"];
      const chosenRole = roleIds[Math.floor(Math.random() * roleIds.length)];
      const count = randInt(2, 4);

      for (let i = 0; i < count; i++) {
        spawnRoleFrog(chosenRole);
      }
      break;
    }

    case "luckyStart":
      addLuck(5);
      break;

    case "orbSpecialistStart":
      startingOrbSpecialistCharges = 15;
      break;

    case "lastStandStart":
      lastStandActive = true;
      break;

    case "doubleYolkerStart":
      doubleYolkerActive = true;
      break;

    case "loadedHandStart":
      extraUpgradeOptionActive = true;
      break;
  }
}
function buildStartingBuffSelectorHtml() {
  const levelData = getDashboardLevelData(loadDashboardStats().totalOrbsCollected || 0);
  const selected = getSelectedStartingBuff(levelData.level);

  return `
    <div class="frog-panel-section-label">Starting Buff</div>
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
      <button
        id="dashboardStartingBuffBtn"
        class="frog-btn frog-btn-secondary"
        style="
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:6px 10px;
          font-size:12px;
          line-height:1;
          background:#1c1917;
          border:1px solid #44403c;
          color:#f5f5f4;
          width:auto;
          min-width:0;
          flex-shrink:0;
          margin-bottom:0;
        "
      >
        <span style="font-size:16px; line-height:1;">${selected.emoji}</span>
        <span style="font-weight:700;">${selected.name}</span>
      </button>
      <span style="font-size:12px; color:#a8a29e; line-height:1.4;">${selected.desc}</span>
    </div>
  `;
}

function getDefaultDashboardCosmetics() {
  return {
    lastProcessedLevel: 1,
    unlockedEyes: false,
    unlockedHat: false
  };
}

function loadDashboardCosmetics() {
  try {
    if (typeof localStorage === "undefined") {
      return getDefaultDashboardCosmetics();
    }
    const raw = localStorage.getItem(DASHBOARD_COSMETICS_STORAGE_KEY);
    if (!raw) return getDefaultDashboardCosmetics();

    const parsed = JSON.parse(raw);
    return {
      ...getDefaultDashboardCosmetics(),
      ...parsed
    };
  } catch (e) {
    return getDefaultDashboardCosmetics();
  }
}

function saveDashboardCosmetics(data) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(DASHBOARD_COSMETICS_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // ignore
  }
}
function checkDashboardCosmeticUnlocks(currentLevel) {
  const cosmetics = loadDashboardCosmetics();
  const level = Math.max(1, Math.floor(Number(currentLevel) || 1));

  if (level <= cosmetics.lastProcessedLevel) {
    return cosmetics;
  }

  for (let lvl = cosmetics.lastProcessedLevel + 1; lvl <= level; lvl++) {
    if (!cosmetics.unlockedEyes && Math.random() < 0.12) {
      cosmetics.unlockedEyes = true;
    }

    if (!cosmetics.unlockedHat && Math.random() < 0.08) {
      cosmetics.unlockedHat = true;
    }

    if (cosmetics.unlockedEyes && cosmetics.unlockedHat) {
      break;
    }
  }

  cosmetics.lastProcessedLevel = level;
  saveDashboardCosmetics(cosmetics);
  return cosmetics;
}
function getDashboardPfp() {
  const levelData = getDashboardLevelData(loadDashboardStats().totalOrbsCollected || 0);
  const cosmetics = checkDashboardCosmeticUnlocks(levelData.level);

  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(DASHBOARD_PFP_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed === "object" &&
          typeof parsed.spriteSrc === "string" &&
          typeof parsed.skinSrc === "string"
        ) {
          const updated = {
            spriteSrc: parsed.spriteSrc,
            skinSrc: parsed.skinSrc,
            eyesSrc:
              cosmetics.unlockedEyes
                ? (typeof parsed.eyesSrc === "string" ? parsed.eyesSrc : getRandomFrogEyes())
                : null,
            hatSrc:
              cosmetics.unlockedHat
                ? (typeof parsed.hatSrc === "string" ? parsed.hatSrc : getRandomFrogHat())
                : null
          };

          localStorage.setItem(DASHBOARD_PFP_STORAGE_KEY, JSON.stringify(updated));
          return updated;
        }
      }
    }
  } catch (e) {
    // ignore
  }

  const pfp = {
    spriteSrc: getRandomFrogSprite(),
    skinSrc: getRandomFrogSkin(),
    eyesSrc: cosmetics.unlockedEyes ? getRandomFrogEyes() : null,
    hatSrc: cosmetics.unlockedHat ? getRandomFrogHat() : null
  };

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(DASHBOARD_PFP_STORAGE_KEY, JSON.stringify(pfp));
    }
  } catch (e) {
    // ignore
  }

  return pfp;
}
  function getDefaultDashboardStats() {
    return {
      totalRuns: 0,
      totalPlayTime: 0,
      totalOrbsCollected: 0,
      totalFrogsLost: 0,
      recentRuns: []
    };
  }

  function loadDashboardStats() {
    try {
      if (typeof localStorage === "undefined") {
        return getDefaultDashboardStats();
      }
      const raw = localStorage.getItem(DASHBOARD_STORAGE_KEY);
      if (!raw) return getDefaultDashboardStats();

      const parsed = JSON.parse(raw);
      return {
        ...getDefaultDashboardStats(),
        ...parsed,
        recentRuns: Array.isArray(parsed?.recentRuns) ? parsed.recentRuns : []
      };
    } catch (e) {
      return getDefaultDashboardStats();
    }
  }

  function saveDashboardStats(stats) {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
      // ignore
    }
  }

  function formatDashboardDuration(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

function getDashboardLevelData(totalOrbsCollected) {
  const total = Math.max(0, Math.floor(Number(totalOrbsCollected) || 0));

  let level = 1;
  let levelStart = 0;
  let nextLevelRequirement = 30;

  while (total >= nextLevelRequirement) {
    level += 1;
    levelStart = nextLevelRequirement;
    nextLevelRequirement += level * 30;
  }

  const orbsIntoCurrentLevel = total - levelStart;
  const orbsNeededForNextLevel = nextLevelRequirement - total;
  const levelSpan = nextLevelRequirement - levelStart;
  const progressPercent =
    levelSpan > 0 ? Math.max(0, Math.min(100, (orbsIntoCurrentLevel / levelSpan) * 100)) : 0;

  return {
    level,
    progressPercent,
    orbsIntoCurrentLevel,
    levelSpan,
    orbsNeededForNextLevel,
    nextLevel: level + 1
  };
}

  function getSavedDashboardTag() {
    // Delegate to the single canonical getter so there is one source of truth.
    return getSavedPlayerTag();
  }

  function pushRecentRunToServer() {
    const runScore = Math.floor(Number(lastRunScore) || 0);
    const runTime = Number(lastRunTime) || 0;
    const runOrbs = Number(totalOrbsCollected) || 0;
    const frogsLostThisRun = Math.max(0, Number(totalFrogsSpawned) || 0);
    const tag =
      getSavedPlayerTag && getSavedPlayerTag()
        ? getSavedPlayerTag()
        : null;
    submitRecentRun({
      tag,
      score: runScore,
      time: runTime,
      orbs: runOrbs,
      frogsLost: frogsLostThisRun,
      sheds: snakeShedCount,
    });
  }

  /**
   * @param {{ skipRecentRunServer?: boolean }} [options] If true, only update local stats (call pushRecentRunToServer after leaderboard submit so tag matches server).
   */
  function recordRunToDashboard(options) {
    const opts = options || {};

    const stats = loadDashboardStats();

    const runScore = Math.floor(Number(lastRunScore) || 0);
    const runTime = Number(lastRunTime) || 0;
    const runOrbs = Number(totalOrbsCollected) || 0;
    const frogsLostThisRun = Math.max(0, Number(totalFrogsSpawned) || 0);

    // clear previous latest marker
    stats.recentRuns = (stats.recentRuns || []).map((run) => ({
      ...run,
      isLatest: false
    }));

    stats.totalRuns += 1;
    stats.totalPlayTime += runTime;
    stats.totalOrbsCollected += runOrbs;
    stats.totalFrogsLost += frogsLostThisRun;

    stats.recentRuns.unshift({
      score: runScore,
      time: runTime,
      orbs: runOrbs,
      frogsLost: frogsLostThisRun,
      sheds: Number(snakeShedCount) || 0,
      at: Date.now(),
      isLatest: true
    });

    // Preserve the best run before recent history is trimmed.
    stats.bestRun = [stats.bestRun, ...stats.recentRuns].filter(Boolean)
      .sort((a,b) => Number(b.score)-Number(a.score) || Number(b.time)-Number(a.time))[0] || null;
    stats.recentRuns = stats.recentRuns.slice(0, 5);

    saveDashboardStats(stats);

    if (!opts.skipRecentRunServer) {
      pushRecentRunToServer();
    }
  }

  function getLeaderboardEntryScore(entry) {
    if (!entry || typeof entry !== "object") return 0;
    const keys = ["bestScore", "score", "maxScore", "points", "value"];
    for (const key of keys) {
      if (!(key in entry)) continue;
      let v = entry[key];
      if (typeof v === "string") v = parseFloat(v);
      if (typeof v === "number" && isFinite(v)) return v;
    }
    return 0;
  }

  function getLeaderboardEntryTime(entry) {
    if (!entry || typeof entry !== "object") return 0;
    const keys = ["bestTime", "time", "seconds", "duration"];
    for (const key of keys) {
      if (!(key in entry)) continue;
      let v = entry[key];
      if (typeof v === "string") v = parseFloat(v);
      if (typeof v === "number" && isFinite(v) && v >= 0) return v;
    }
    return 0;
  }

  function normalizeDashboardTag(str) {
    return typeof str === "string" ? str.trim().toLowerCase() : "";
  }
  
  async function getMyDashboardBestFromLeaderboard() {
  try {
    const entries = await fetchLeaderboard();
    const liveMyEntry =
      window.FrogGameLeaderboard &&
      window.FrogGameLeaderboard._lastMyEntry
        ? window.FrogGameLeaderboard._lastMyEntry
        : null;

    if (liveMyEntry && liveMyEntry.userId) {
      const exact = (entries || []).find(
        (entry) => entry && entry.userId === liveMyEntry.userId
      );

      if (exact) {
        return {
          bestRun: Math.floor(getLeaderboardEntryScore(exact)),
          bestTime: getLeaderboardEntryTime(exact),
          found: true
        };
      }
    }

    const savedTag =
      (typeof getSavedPlayerTag === "function" && getSavedPlayerTag()) ||
      (LMod && typeof LMod.getCurrentUserLabel === "function" && LMod.getCurrentUserLabel()) ||
      getSavedDashboardTag();

    if (!savedTag) {
      return { bestRun: 0, bestTime: 0, found: false };
    }

    const target = normalizeDashboardTag(savedTag);
    let bestEntry = null;

    for (const entry of entries || []) {
      const tag = normalizeDashboardTag(entry?.tag);
      const name = normalizeDashboardTag(entry?.name);

      if (tag === target || name === target) {
        if (!bestEntry) {
          bestEntry = entry;
        } else {
          const scoreA = getLeaderboardEntryScore(entry);
          const scoreB = getLeaderboardEntryScore(bestEntry);
          const timeA = getLeaderboardEntryTime(entry);
          const timeB = getLeaderboardEntryTime(bestEntry);

          if (scoreA > scoreB || (scoreA === scoreB && timeA < timeB)) {
            bestEntry = entry;
          }
        }
      }
    }

    if (!bestEntry) {
      return { bestRun: 0, bestTime: 0, found: false };
    }

    return {
      bestRun: Math.floor(getLeaderboardEntryScore(bestEntry)),
      bestTime: getLeaderboardEntryTime(bestEntry),
      found: true
    };
  } catch (e) {
    return { bestRun: 0, bestTime: 0, found: false };
  }
}

  function validateDashboardTag(rawTag) {
    const tag = String(rawTag || "").trim();

    if (!tag) {
      return { ok: false, message: "Enter a tag." };
    }

    if (tag.length < 2 || tag.length > 12) {
      return { ok: false, message: "Tag must be 2-12 characters." };
    }

    if (!/^[a-zA-Z0-9 _-]{2,12}$/.test(tag)) {
      return {
        ok: false,
        message: "Use letters, numbers, spaces, _ or - only."
      };
    }

    const profane =
      (window.FrogProfanity && typeof window.FrogProfanity.isProfaneTag === "function" &&
        window.FrogProfanity.isProfaneTag(tag)) ||
      (window.FrogGameLeaderboard &&
        typeof window.FrogGameLeaderboard.isProfaneTag === "function" &&
        window.FrogGameLeaderboard.isProfaneTag(tag));
    if (profane) {
      return { ok: false, message: "That tag is not allowed." };
    }

    return { ok: true, tag };
  }

  async function saveDashboardTag(tag) {
    const clean = String(tag || "").trim();
    if (!clean) return false;

    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(TAG_STORAGE_KEY, clean);
      }
    } catch (e) {
      // ignore
    }

    return true;
  }

function getRandomFrogSprite() {
  const files = window.FrogGameConfig.FROG_FILES || [];
  const folder = window.FrogGameConfig.FROG_FOLDER || "./images/build_files/Frog/";
  if (!files.length) return "";
  const file = files[Math.floor(Math.random() * files.length)];
  return folder + file;
}

const FROG_SKIN_PATHS = Array.from({ length: 18 }, (_, i) => {
  const n = String(i).padStart(2, "0");
  return `./images/build_files/Skins/skin_${n}.png`;
});

function getRandomFrogSkin() {
  return FROG_SKIN_PATHS[Math.floor(Math.random() * FROG_SKIN_PATHS.length)];
}

const FROG_EYES_PATHS = Array.from({ length: 5 }, (_, i) => {
  const n = String(i).padStart(2, "0");
  return `./images/build_files/Eyes/eyes_${n}.png`;
});

function getRandomFrogEyes() {
  return FROG_EYES_PATHS[Math.floor(Math.random() * FROG_EYES_PATHS.length)];
}

const FROG_HAT_PATHS = Array.from({ length: 8 }, (_, i) => {
  return `./images/build_files/Hat/hat_${i}.png`;
});

function getRandomFrogHat() {
  return FROG_HAT_PATHS[Math.floor(Math.random() * FROG_HAT_PATHS.length)];
}
const IN_GAME_FROG_EYES_CHANCE = 0.08;
const IN_GAME_FROG_HAT_CHANCE = 0.05;

function rollFrogCosmetics() {
  return {
    eyesSrc: Math.random() < IN_GAME_FROG_EYES_CHANCE ? getRandomFrogEyes() : null,
    hatSrc: Math.random() < IN_GAME_FROG_HAT_CHANCE ? getRandomFrogHat() : null
  };
}
  function getUpgradeColorClass(upgradeId) {
    // movement / jumping
    const mobilityIds = [
      "frogSpeed",
      "frogJump",
      "frogSpeedJump",
      "epicSpeedJump",
      "higherHops",
      "swarmDivide",
      "survivalInstinct",
      "greedsToll",
      "mutation",
      "pairOfScissors",
      "frogScatter"
    ];

    const survivalIds = [
      "deathrattle",
      "commonDeathRattle",
      "epicDeathRattle",
      "lastStand",
      "ouroborosPact",
      "secondWind",
      "toxicBlood",
      "graveWave"
    ];

    // buff duration / orbs / luck / proc style
    const buffIds = [
      "buffDuration",
      "epicBuffDuration",
      "orbMagnet",
      "orbLinger",
      "orbWhisperer",
      "orbSpawn",
      "epicMoreOrbs",
      "epicOrbStorm",
      "orbSpecialist",
      "epicOrbSpecialist",
      "moltFortune",
      "quantumOrbs",
      "doubleYolker",
      "luckyRoll",
      "chainReaction",
      "nightBloom",
      "luck"
    ];

    // orb creation / collector
    const orbIds = [
      "orbCollector"
    ];

    // frog role / squad / promotions
    const roleIds = [
      "spawn20",
      "extraFrogCap",
      "frogPromotion",
      "frogPromotionEpic",
      "promotionEpic",
      "cannibalPromotion",
      "roleDraft",
      "mysticPortal",
      "tidalWave",
      "extraUpgradeOption"
    ];

    if (mobilityIds.includes(upgradeId)) return "upgrade-type-mobility";
    if (buffIds.includes(upgradeId)) return "upgrade-type-buff";
    if (survivalIds.includes(upgradeId)) return "upgrade-type-survival";
    if (orbIds.includes(upgradeId)) return "upgrade-type-orb";
    if (roleIds.includes(upgradeId)) return "upgrade-type-role";

    return "upgrade-type-mobility";
  }

  // --------------------------------------------------
  // PLAYER TAG STORAGE (client-side only)
  // --------------------------------------------------

  /**
   * Returns the saved tag, or "" before the server assigns one (first score submit).
   * After POST /leaderboard, frog-leaderboard syncs myEntry.tag into localStorage.
   */
  function getSavedPlayerTag() {
    try {
      if (typeof localStorage === "undefined") return "";
      const val = localStorage.getItem(TAG_STORAGE_KEY);
      if (val && String(val).trim() !== "") {
        return String(val).trim();
      }
      return "";
    } catch (e) {
      return "";
    }
  }

  const container = document.getElementById("frog-game");
  if (!container) return;

  // --------------------------------------------------
  // GAME STATE
  // --------------------------------------------------
  let frogs = [];
  let snake = null;       // primary snake
  let extraSnakes = [];   // any additional snakes spawned later
  let orbs  = [];

  let animId        = null;
  let lastTime      = 0;
  let elapsedTime   = 0;
  let gameOver      = false;
  let gamePaused    = false;
  let summaryPending = false; // true while end-game async is resolving
  let nextOrbTime   = 0;
  let score         = 0;
  let frogsEatenCount = 0; // grow one segment every 2 frogs
  let latestCompletedRun = null;
let extraUpgradeOptionActive = false;
let greedyHandUsed = false;
let greedyHandQueue = null;
  // UI + audio toggles
  let soundEnabled      = true;
  let statsPanelVisible = true;
  let mainMenuActive    = false;
  let hasShownInitialMenuFrogs = false;

  let lastRunScore  = 0;
  let lastRunTime   = 0;

  // every 60 seconds we pause for a global permanent upgrade
  let nextPermanentChoiceTime = 60;

  // every 180 seconds we pause for an EPIC upgrade
  let nextEpicChoiceTime = 180;

  let legendaryEventTriggered = false;
  let doubleYolkerActive = false;
  let startingOrbSpecialistCharges = 0;

  let infoOverlay = null;
  let infoPage = 0;
  let infoContentEl = null;
  let infoPageLabel = null;
  let infoPrevBtn = null;
  let infoNextBtn = null;
  let infoLeaderboardData = [];

  // This is the value actually used in movement and scaled on each shed
  let snakeTurnRate        = SNAKE_TURN_RATE_BASE;

  // Shed state
  let snakeShedStage   = 0;          // 0 = base, 1 = yellow, 2 = orange, 3+ = red
  let snakeShedCount   = 0;          // how many times we've shed this run
  let nextShedTime     = SHED_INTERVAL;


  let scissorsRemnantSegments = [];
  let snakeEatingOldBody = false;
  let snakeOldBodySpeedBonusPending = false;
  let snakeOldBodyChaseTime = 0;
  let snakeLastRemnantTarget = null;
  let scissorsGrowthLocked = false;
  let severedSnakeRemnants = [];
  let snakeEggPending = false; // EPIC: next shed uses reduced speed bonus
  let snakeEggUsed = false;
  let roleDraftUsed = false;
  let roleDraftPending = false;
  let roleDraftChoices = [];
  let graveWaveUsed = false;
  let pairOfScissorsUsed = false;
  let epicChainPending = false;
  let secondWindActive = false;
  let secondWindUsed = false;

  let swarmDivideActive = false;
  let swarmDivideUsed = false;

  // Old snakes that are despawning chunk-by-chunk
  let dyingSnakes = [];

  // Main menu background snakes/frogs
  let mainMenuSnakes = [];
  let mainMenuFrogs = [];
  let mainMenuAnimId = null;
  let mainMenuLastTime = 0;

  let permanentScoreMultiplier = 1.0;
  let quantumOrbsActive = false;
  let moltFortuneActive = false;
  let toxicBloodActive = false;
  let survivalInstinctActive = false;
  let speedBuffTime   = 0;
  let jumpBuffTime    = 0;
  let snakeSlowTime   = 0;
  let snakeSlowCueTime = 0; // Non-poison slowdown indicator; independent of bite extensions.
  let snakeConfuseTime= 0;
  let snakeShrinkTime = 0;
  let frogShieldTime  = 0;
  let timeSlowTime    = 0;
  let orbMagnetTime   = 0;
  let scoreMultiTime  = 0;
  let panicHopTime    = 0;
  let cloneSwarmTime  = 0;
  let lifeStealTime   = 0;
  let frogDeathRattleChance = 0.0;  // 0.25 when epic is picked
  let permaLifeStealOrbsRemaining = 0;
  let cannibalFrogCount = 0;       // how many cannibal frogs are currently alive
  let lastStandActive = false;
  let orbCollectorActive   = false;
  let orbCollectorChance   = 0;    // current chance (0–1) that an orb spawns a frog
  let orbSpecialistActive  = false;
  let orbTtlFactor         = 1.0;  // multiplier for new orb lifetime
  let orbLingerBonusUsed   = false;
  let ouroborosPactUsed    = false;
let chainReactionActive = false;
let afterglowActive = false;
let nightBloomActive = false;
let royalApprenticeshipActive = false;
let royalBatchActive = false;
let luckStat = 0;
let lingeringHexActive = false;
let lastingLegacyActive = false;
let brittleScalesActive = false;
let bruisedEggActive = false;
let panicAttackActive = false;
let peaceOfMindActive = false;
let forbiddenFruitActive = false;
let higherCallingActive = false;
let higherCallingPicksRemaining = 0;
let secondHelpingPending = false;
let secondHelpingPicksRemaining = 0;
const MAX_LUCK = 30;
  let fragileRealityActive = false;
  let frogScatterUsed      = false;
  let eyeForEyeUsed        = false;

  // Legendary Frenzy timer (snake + frogs go wild)
  let snakeFrenzyTime = 0;

  // global permanent buffs
  let mutationPicks = 0;
  let frogPermanentSpeedFactor = 1.0; // <1 = faster hops
  let frogPermanentJumpFactor  = 1.0; // >1 = higher hops
  let snakePermanentSpeedFactor= 1.0;
  let buffDurationFactor       = 1.0; // >1 = longer temp buffs
  let buffDurationCap          = MAX_BUFF_DURATION_FACTOR;
  let orbSpawnIntervalFactor   = 1.0; // <1 = more orbs
  let minOrbSpawnIntervalFactor= MIN_ORB_SPAWN_INTERVAL_FACTOR;
  let maxFrogsCap              = MAX_FROGS;

  // ---- RUN STATS (for leaderboard / post-run summary) ----
  let totalFrogsSpawned = 0;
  let totalOrbsSpawned = 0;
  let totalOrbsCollected = 0;

  // Optional extras if you want them:
  let totalGhostFrogsSpawned = 0;  // for Grave Wave, etc.
  let totalCannibalEvents = 0;     // number of Frog-eat-Frog kills

  let graveWaveActive   = false;
  let frogEatFrogActive = false;
  let snakeEggActive = false;
  let snakeEggTimer = 0;         // counts up to hatch interval
  let snakeEggHatchInterval = 60; // check every 60 seconds
  let babySnakes = [];           // tracks the two baby snakes
  // --------------------------------------------------
  // MOUSE
  // --------------------------------------------------
  const mouse = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    active: false,
    follow: false
  };
  
  function updatePointerTarget(e) {
    if (e.isPrimary === false || mainMenuActive || gameOver || gamePaused || summaryPending) return;
    if (e.target && e.target.closest && e.target.closest('button,input,select,textarea,.frog-overlay,#frog-scoreboard-overlay')) return;
    const __s = window.__escapeSnakeRenderScale || 1;
    mouse.x = e.clientX / __s;
    mouse.y = e.clientY / __s;
    mouse.active = true;
    if (e.type === 'pointerdown' || e.pointerType === 'touch' || e.pointerType === 'pen') mouse.follow = true;
  }
  window.addEventListener('pointerdown', updatePointerTarget);
  window.addEventListener('pointermove', updatePointerTarget);

  
  window.addEventListener("click", (ev) => {
    // If the scoreboard overlay is open and we clicked inside it,
    // don't treat this as a "restart" click.
    const overlayEl = document.getElementById("frog-scoreboard-overlay");
    if (overlayEl && overlayEl.contains(ev.target)) {
      return;
    }

    // Don't restart if any panel overlay is currently open or summary is loading
    const anyOverlayOpen = document.querySelector(".frog-overlay[style*='flex']");
    if (anyOverlayOpen || summaryPending) return;

    if (gameOver) {
      startNewRun();
      return;
    }

    if (mainMenuActive) return;

    mouse.follow = true;
  });

// --------------------------------------------------
  // HUD
  // --------------------------------------------------
  let inGameUIVisible = true;

  // Top center — single bar
  const hud = document.createElement("div"); hud.id="pocket-hud"; hud.className="design-hud";
  hud.style.cssText = "position:absolute;top:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.55);border-radius:7px;padding:6px 14px;font-family:monospace;font-size:13px;color:white;z-index:100;pointer-events:none;white-space:nowrap;display:flex;gap:12px;align-items:center;";
  const timerLabel = document.createElement("span");
  timerLabel.style.cssText = "color:white;";
  const frogsLabel = document.createElement("span");
  const scoreLabel = document.createElement("span");
  const scoreSep = document.createElement("span");
  scoreSep.style.cssText = "color:rgba(255,255,255,0.3);";
  scoreSep.textContent = "·";
  scoreLabel.style.fontWeight = "bold";
  hud.appendChild(timerLabel);
  hud.appendChild(frogsLabel);
  hud.appendChild(scoreSep);
  hud.appendChild(scoreLabel);
  container.appendChild(hud);

  // Mini leaderboard — top right
  const miniBoard = document.createElement("div");
  miniBoard.id = "frog-mini-leaderboard";
  miniBoard.style.cssText = "position:absolute;top:10px;right:10px;padding:6px 10px;border-radius:7px;background:rgba(0,0,0,0.55);color:white;font-family:monospace;font-size:11px;z-index:100;max-width:220px;pointer-events:none;line-height:1.7;";
  miniBoard.textContent = "Loading leaderboard…";
  container.appendChild(miniBoard);

  // Upgrade icons — bottom left
  const statsPanel = document.createElement("div"); statsPanel.id="frog-stats-panel";
  statsPanel.id = "frog-stats-panel";
  statsPanel.style.cssText = "position:absolute;bottom:10px;left:10px;display:flex;flex-direction:column;gap:4px;z-index:100;pointer-events:none;max-width:160px;";
  

  // Controls — top left
  const controlsBar = document.createElement("div"); controlsBar.id="pocket-controls"; controlsBar.className="design-controls";
  controlsBar.style.cssText = "position:absolute;top:10px;left:10px;display:flex;flex-direction:column;gap:5px;z-index:120;pointer-events:auto;";

  function makeControlButton(label) {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.style.cssText = "font-family:monospace;font-size:11px;padding:4px 8px;border-radius:6px;border:none;background:rgba(0,0,0,0.55);color:white;cursor:pointer;outline:none;white-space:nowrap;";
    btn.onmouseenter = () => { btn.style.background = "rgba(0,0,0,0.8)"; };
    btn.onmouseleave = () => { btn.style.background = "rgba(0,0,0,0.55)"; };
    return btn;
  }

  
  const btnSound = makeControlButton("sound");
  const btnEnd   = makeControlButton("pause");

  
  controlsBar.appendChild(btnSound);
  controlsBar.appendChild(btnEnd);
  container.appendChild(controlsBar);

  const gameOverBanner = document.createElement("div");
  gameOverBanner.style.cssText = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);padding:16px 24px;border-radius:10px;background:rgba(0,0,0,0.8);color:#fff;font-family:monospace;font-size:18px;text-align:center;z-index:101;pointer-events:none;display:none;";
  gameOverBanner.innerHTML = "Game Over<br/><small>Click to play again</small>";
  container.appendChild(gameOverBanner);

  function setInGameUIVisible(show) {
    inGameUIVisible = show;
    hud.style.display         = show ? "flex" : "none";
    miniBoard.style.display   = show ? "block" : "none";
    controlsBar.style.display = show ? "flex" : "none";
    if (statsPanel) {
      statsPanel.style.display = show && statsPanelVisible ? "flex" : "none";
    }
  }

  setInGameUIVisible(false);

  function formatTime(t) {
    const total = Math.max(0, t);
    const m = Math.floor(total / 60);
    const s = total - m * 60;
    return `${String(m).padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
  }

  function updateHUD() {
    if (!inGameUIVisible) return;
    timerLabel.textContent = formatTime(elapsedTime);
    frogsLabel.textContent = `Frogs ${frogs.length}`;
    scoreLabel.textContent = `Score: ${Math.floor(score).toLocaleString()}`;
  }

  function updateBuffsBar() {}

  function updateStatsPanel() {}

  function syncAudioMuteState() {
    AudioMod.setButtonClicksMuted?.(!soundEnabled);
    if (AudioMod && typeof AudioMod.setMuted === "function") {
      AudioMod.setMuted(!soundEnabled || mainMenuActive);
    }
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    syncAudioMuteState();
    if (btnSound) btnSound.textContent = soundEnabled ? "sound" : "muted";
  }


  if (btnSound) btnSound.onclick = () => { toggleSound(); };
  if (btnEnd) btnEnd.onclick = ev => { ev.stopPropagation(); openPauseMenu(); };

  let pauseMenu = null;
  let fieldGuideFromHelp = false;
  let pauseGuideFilter = 'Common';
  let pauseGuidePage = 0;
  let pauseUpgradePage = 0;
  let pauseWasAlreadyPaused = false;
  let runUpgradeLog = [];
  const pauseGuide = [
    ['Common','Afterglow','Expired orbs have a 25% chance to activate at half base duration, including Panic Hop. Instant effects retain their normal result. Rolls independently of Night Bloom.'],
    ['Common','Mutation','Frogs hop 15% faster and 15% higher, up to their limits.'],
    ['Common','Panic Attack','Confused snakes flee your frogs.'],
    ['Common','Wild Company','Spawn 1–3 frogs of one random common role: Bull Frog, Magnet or Poison Toad. Luck favors larger batches.'],
    ['Common','Night Bloom','Expired orbs have a 20% base chance to spawn a frog.'],
    ['Common','Lingering Hex','Snake debuffs last 15% longer. Does not modify Lucky Roll.'],
    ['Common','Double Yolker','Collected orbs have a 15% base chance to spawn two frogs.'],
    ['Common','Spawn frogs',`${NORMAL_SPAWN_AMOUNT} frogs immediately, subject to the population cap.`],
    ['Common','Orb Flow','Adds 10% orb spawn rate.'],
    ['Common','Orb Whisperer','Orbs stay on the field 30% longer.'],
    ['Common','Soul Offering','Successful Deathrattle revivals leave an orb. Requires permanent Deathrattle chance.'],
    ['Common','Luck','Gain 10 luck, up to 30. Improves supported chances, spawn rolls and positive orb durations.'],
    ['Common','Deathrattle',`Adds ${Math.round(COMMON_DEATHRATTLE_CHANCE*100)} percentage points to revival chance. Shared cap: ${Math.round(MAX_DEATHRATTLE_CHANCE*100)}%.`],
    ['Common','Last Stand',`Gives the last frog at least ${Math.round(LAST_STAND_MIN_CHANCE*100)}% revival odds, as an exception to the ordinary revival cap.`],
    ['Common','Survival Instinct','Below 10 frogs, they hop 20% faster.'],
    ['Common','Lucky Roll','Triggers a random beneficial orb effect with 50% extra duration.'],
    ['Epic','Ouroboros Curse','Makes the snake consume half its body and slows it.'],
    ['Epic','Royal Apprenticeship','Spawning special frogs converts all ordinary crowned frogs to the spawned role. Consumes crowns and rerolls natural movement stats. Frogs already holding a special role stay unchanged.'],
    ['Epic','Forbidden Fruit','Snakes eat orbs on mouth contact, suffering a half-duration slow, confusion or shrink. Lingering Hex extends these debuffs; luck does not. Each snake can eat one orb every 3 seconds.'],
    ['Epic','Higher Calling','At each shed, replace the common and epic picks with two fresh epic picks.'],
    ['Epic','Second Helping','Your next common upgrade offers 3 picks.'],
    ['Epic','Peace of Mind','At 20+ luck: spend all your luck to remove Panic Hop for this run. Once per run.'],
    ['Epic','Role Draft','Choose between two roles and spawn 2–5 special frogs. Luck favors larger batches.'],
    ['Epic','Orb Storm','Drops 8–15 random orbs. Luck favors higher counts.'],
    ['Epic','Lasting Legacy','A dying special frog has a 20% base chance to pass a role to an ordinary frog. Luck improves the chance.'],
    ['Epic','Snake Egg','Targets the lowest-shed snake when selected. It gains 25% less added speed from its remaining sheds. Other and future snakes are unaffected.'],
    ['Epic','Brittle Scales','Halves snake debuff resistance.'],
    ['Epic','Chain Reaction','An orb pickup has a 15% chance to trigger an additional orb effect.'],
    ['Epic','Greedy Hand','Requires Loaded Hand; 20% chance to appear per epic offer. Take all other offered upgrades, then another snake enters. Once per run. Never offered alongside Eye for Eye.'],
    ['Epic','Loaded Hand','Future upgrade menus offer four choices instead of three.'],
    ['Epic','Tidal Wave','Spawns as many frogs as are alive, with a minimum of 15 added frogs. Population cap still applies.'],
    ['Epic','Eye for Eye','Once per run, with at least 2 snakes: kill the slowest snake and reduce the frog cap to 55. Excess frogs die immediately without revival or death rewards.'],
    ['Epic','Epic Deathrattle',`Adds ${Math.round(EPIC_DEATHRATTLE_CHANCE*100)} percentage points to revival chance, up to the shared ${Math.round(MAX_DEATHRATTLE_CHANCE*100)}% cap.`],
    ['Epic','Orb Specialist','Collected orbs have a 50% base chance to spawn an extra frog.'],
    ['Epic','Second Wind','Once per run: below 10 frogs, spawn 20.'],
    ['Epic','Grave Wave','Each shed spawns 7–15 frogs. Luck favors more.'],
    ['Epic','Poisonous Skin','Each eaten frog briefly slows the snake.'],
    ['Epic','Promotion','Adds a crown level to up to 10 random frogs, within crown limits.'],
    ['Epic','Frog Scatter','Respawns the swarm with roles, crowns and stats intact, triggering death effects. Bonus frogs respect the population cap. Once per run.'],
    ['Epic','Molt Fortune','Drops 5–10 orbs when the snake sheds.'],
    ['Frogs','Crowned','Permanently improved movement. Can gain up to three crown levels.'],
    ['Frogs','Aura','Nearby frogs gain 12% shorter hop timing and 12% higher jumps. Overlapping auras stack, within movement caps.'],
    ['Frogs','Shield','Temporary protection from snake bites.'],
    ['Frogs','Magnet','Attracts nearby orbs.'],
    ['Frogs','Lucky','Improves orb pickups and contributes a score bonus. Its pickups cannot trigger Panic Hop.'],
    ['Frogs','Zombie','Sacrifices itself to end Panic Hop for the swarm. Spawns one ordinary frog on any death.'],
    ['Frogs','Cannibal','Eats up to 5 ordinary frogs, gaining 5% shorter hop timing and 5% higher jumps per meal. On death, spawns 2–5 frogs, never more than it ate. Each living Cannibal adds 1 percentage point of Deathrattle; total chance cannot exceed 25%.'],
    ['Frogs','Necromancer','Turns Deathrattle revivals into Zombie Frogs.'],
    ['Frogs','Alchemist','Spawns a frog every 15–25 seconds. Luck favors shorter waits.'],
    ['Frogs','Bull Frog','Survives one bite, leaps away, and briefly avoids another bite.'],
    ['Frogs','Poison Toad','Confuses snakes when eaten. Base duration: 10 seconds, modified by duration bonuses and resistance.'],
  ];
  // Discoveries survive run resets; no unlocks from merely viewing an offer.
  function guideDiscoveryKey(category, name) {
    return (category === 'Frogs' ? 'frog:' : 'upgrade:') + name.trim().toLowerCase();
  }
  function guideDiscoveries() {
    if (!guideDiscoveries.cache) {
      let saved=[];
      try { saved=JSON.parse(localStorage.getItem('escapeSnake.discoveries.v1') || '[]'); } catch (_) {}
      guideDiscoveries.cache=new Set(Array.isArray(saved)?saved.filter(x=>typeof x==='string'):[]);
    }
    return guideDiscoveries.cache;
  }
  function discoverGuideEntry(category,name) {
    const entries=guideDiscoveries(), key=guideDiscoveryKey(category,name);
    if(entries.has(key)) return;
    entries.add(key);
    try { localStorage.setItem('escapeSnake.discoveries.v1',JSON.stringify([...entries])); } catch (_) {}
  }
  function guideHasEntry(category,name) {return guideDiscoveries().has(guideDiscoveryKey(category,name));}
  function discoverUpgradeName(name) {
    const entry=pauseGuide.find(([category,title])=>category!=='Frogs' && title.toLowerCase()===name.toLowerCase());
    if(entry) discoverGuideEntry(entry[0],entry[1]);
  }
  function restoreKnownGuideEntries() {
    // Only migrate records that actually contain selected upgrades.
    const stats=loadDashboardStats();
    for(const run of [stats.bestRun,...(stats.recentRuns||[])].filter(Boolean)) {
      for(const upgrade of (Array.isArray(run.upgrades)?run.upgrades:[])) {
        const name=typeof upgrade==='string'?upgrade:upgrade?.name;
        if(typeof name==='string') discoverUpgradeName(name);
      }
    }
    for(const upgrade of runUpgradeLog) discoverUpgradeName(upgrade.name);
  }
  function pauseEscape(value) {
    return String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function pauseIcon(name) {
    const key=name.toLowerCase();
    const url=window.approvedUpgrades?.[key] || window.approvedFrogs?.[key];
    return url ? `<img src="${pauseEscape(url)}" alt="" loading="lazy">` : '';
  }
  function rememberRunUpgrade(choice) {
    const el=document.createElement('div'); el.innerHTML=choice.label;
    const title=el.querySelector('br') ? choice.label.split(/<br\s*\/?\s*>/i)[0] : choice.label;
    el.innerHTML=title;
    const name=el.textContent.replace(/^[^\p{L}\p{N}]+/u,'').trim();
    discoverUpgradeName(name);
    const found=runUpgradeLog.find(x=>x.id===choice.id);
    if(found) found.count++; else runUpgradeLog.push({id:choice.id,name,count:1});
  }
  function menuSprite(name) {
    return `<img class="sm-sprite" src="game-assets/sprites/approved/${pauseEscape(name)}" alt="">`;
  }
  function menuPersonalBest(currentScore = 0, serverBest = 0) {
    const entry = window.FrogGameLeaderboard?._lastMyEntry;
    return Math.max(0, Number(currentScore)||0, Number(serverBest)||0,
      entry ? getLeaderboardEntryScore(entry) : 0,
      ...(loadDashboardStats().recentRuns || []).map(r=>Number(r.score)||0));
  }
  function renderRunUpgrades(host, entries) {
    if (!host) return;
    let page=0;
    const pages=Math.max(1,Math.ceil(entries.length/6));
    const row=x=>`<div class="upgrade-entry">${pauseIcon(x.name)}<span>${pauseEscape(x.name)}${x.count>1?' ×'+x.count:''}</span></div>`;
    host.innerHTML='<label>Run upgrades</label><div class="upgrade-grid"></div><nav class="upgrade-pages" aria-label="Upgrade pages"><button data-step="-1">Prev</button><span></span><button data-step="1">Next</button></nav>';
    const grid=host.querySelector('.upgrade-grid'),nav=host.querySelector('nav');
    function draw(){
      grid.innerHTML=entries.length?entries.slice(page*6,page*6+6).map(row).join(''):'<span>No upgrades yet.</span>';
      nav.hidden=pages===1;nav.querySelector('span').textContent=`${page+1} / ${pages}`;
      nav.querySelector('[data-step="-1"]').disabled=page===0;
      nav.querySelector('[data-step="1"]').disabled=page===pages-1;
    }
    function fit(){
      if(!host.isConnected)return;
      grid.style.minHeight='0px';if(pages===1)return;
      const probe=grid.cloneNode(false);probe.style.cssText='position:absolute;visibility:hidden;pointer-events:none;width:'+grid.getBoundingClientRect().width+'px;';host.appendChild(probe);
      let height=0;for(let i=0;i<pages;i++){probe.innerHTML=entries.slice(i*6,i*6+6).map(row).join('');height=Math.max(height,probe.getBoundingClientRect().height);}
      probe.remove();grid.style.minHeight=Math.ceil(height)+'px';
    }
    nav.onclick=e=>{const b=e.target.closest('button[data-step]');if(!b||b.disabled)return;page+=Number(b.dataset.step);draw();};
    draw();requestAnimationFrame(fit);document.fonts?.ready.then(fit);
    const observer=new ResizeObserver(()=>{if(!host.isConnected){observer.disconnect();return;}const width=host.clientWidth;if(width!==host._lastUpgradeWidth){host._lastUpgradeWidth=width;fit();}});observer.observe(host);
  }
  function setupPlayerHeading(content,inputId) {
    const input=content.querySelector('#'+inputId), section=input.closest('.summary-name');
    const editor=section.querySelector('.summary-editor');
    const heading=document.createElement('button');heading.type='button';heading.className='player-heading';heading.setAttribute('aria-label','Edit player name');
    const edit=document.createElement('button');edit.type='button';edit.className='player-edit-below';edit.textContent='Edit';
    const cancel=document.createElement('button');cancel.type='button';cancel.textContent='×';cancel.setAttribute('aria-label','Cancel editing');editor.appendChild(cancel);
    let saved=input.value;
    function showName(){
      heading.replaceChildren(document.createTextNode(saved || 'Your name'));

      heading.hidden=false;edit.hidden=false;editor.hidden=true;
    }
    const headingRow=document.createElement('div');headingRow.className='player-heading-row';headingRow.append(heading,edit);section.prepend(headingRow);section.classList.add('player-identity');
    heading.onclick=()=>{input.value=saved;heading.hidden=true;edit.hidden=true;editor.hidden=false;input.focus();input.select();};
    edit.onclick=()=>heading.click();
    cancel.onclick=()=>{input.value=saved;showName();};
    input.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cancel.click();}});
    section.finishNameEdit=value=>{saved=value;input.value=value;showName();};showName();
  }
  function menuHeader(title, subtitle = '') {
    return `<header class="sm-header"><div class="sm-eyebrow">ESCAPE THE SNAKE</div><h1>${pauseEscape(title)}</h1>${subtitle ? `<p>${pauseEscape(subtitle)}</p>` : ''}</header>`;
  }
  function menuStat(label, value) {
    return `<div class="sm-stat"><span>${pauseEscape(label)}</span><b>${pauseEscape(value)}</b></div>`;
  }
  function ensurePauseMenu() {
    if(pauseMenu) return;
    const style=document.createElement('style');
    style.textContent=`
    #runPauseOverlay {position:fixed;inset:0;z-index:1600;display:none;align-items:center;justify-content:center;background:rgba(8,48,29,.23);padding:16px;box-sizing:border-box;}
    #runPauseOverlay [hidden] {display:none!important;}
    #runPauseOverlay * {box-sizing:border-box;font-family:ReferencePixel,Pocket,monospace!important;color:#083b27;text-shadow:none;}
    #runPauseOverlay .pause-panel {background:#fff8dc;border:4px solid #083b27;border-radius:7px;box-shadow:3px 4px 0 #466e35;width:520px;max-width:94%;max-height:calc(94 * var(--app-vh,1vh));display:flex;flex-direction:column;padding:20px;overflow:hidden;font-size:22px;}
    #runPauseOverlay h2 {font-size:34px;text-align:center;margin:0 0 12px;line-height:1;}
    #runPauseOverlay button {font-size:22px;background:transparent;border:0;border-radius:0;padding:10px 8px;cursor:pointer;line-height:1.1;}
    #runPauseOverlay button:focus-visible {outline:2px dashed #087f86;outline-offset:2px;}
    #runPauseOverlay button[aria-selected=true] {color:#087f86;text-decoration:underline;text-underline-offset:6px;}
    #runPauseOverlay .pause-tabs,#runPauseOverlay .pause-footer,#runPauseOverlay .pause-filters {display:flex;justify-content:center;gap:16px;flex-wrap:wrap;flex-shrink:0;}
    #runPauseOverlay .pause-tabs {border-bottom:2px solid #c0cf94;margin-bottom:12px;}
    #runPauseOverlay .pause-content {overflow:auto;overscroll-behavior:contain;min-height:0;flex:1;padding:0 4px;scrollbar-color:#8da66c #fff8dc;}
    #runPauseOverlay .pause-stats {display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center;padding:8px 0 16px;border-bottom:1px solid #c0cf94;}
    #runPauseOverlay .pause-stats strong {display:block;color:#087f86;font-size:28px;}
    #runPauseOverlay h3 {font-size:24px;margin:18px 0 8px;}
    #runPauseOverlay p {font-size:20px;line-height:1.3;margin:4px 0 12px;}
    #runPauseOverlay .pause-row {display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid #d4d9ad;}
    #runPauseOverlay .pause-row img {width:42px;height:42px;object-fit:contain;image-rendering:pixelated;flex-shrink:0;}
    #runPauseOverlay .pause-row strong {font-size:23px;display:block;}
    #runPauseOverlay .pause-row p {margin:4px 0 0;}
    #runPauseOverlay .pause-footer {border-top:2px solid #c0cf94;padding-top:10px;margin-top:12px;}
    @media(hover:hover) {#runPauseOverlay button:hover {transform:translateY(-2px);}}
    @media(pointer:coarse),(max-width:600px) {
      #runPauseOverlay .pause-panel {width:880px;padding:26px;font-size:36px;}
      #runPauseOverlay h2 {font-size:52px;}
      #runPauseOverlay button {font-size:36px;padding:14px 10px;min-height:48px;}
      #runPauseOverlay h3,#runPauseOverlay .pause-row strong {font-size:38px;}
      #runPauseOverlay p {font-size:34px;}
      #runPauseOverlay .pause-stats strong {font-size:42px;}
      #runPauseOverlay .pause-row img {width:64px;height:64px;}
    }
    @media(max-width:600px) {
      #runPauseOverlay .pause-panel {padding:16px;font-size:19px;}
      #runPauseOverlay h2 {font-size:30px;}
      #runPauseOverlay button {font-size:22px;}
      #runPauseOverlay h3,#runPauseOverlay .pause-row strong {font-size:23px;}
      #runPauseOverlay p {font-size:21px;}
      #runPauseOverlay .pause-stats strong {font-size:27px;}
      #runPauseOverlay .pause-row img {width:42px;height:42px;}
    }
    #runPauseOverlay .pause-panel {width:560px;}
    #runPauseOverlay .pause-tabs {margin-bottom:6px;}
    #runPauseOverlay .pause-stats {grid-template-columns:repeat(3,minmax(0,1fr));gap:6px 12px;padding:8px 0 12px;}
    #runPauseOverlay .pause-stats > div {display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:19px;}
    #runPauseOverlay .pause-stats strong {font-size:23px;}
    #runPauseOverlay .pause-upgrade-grid {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 16px;}
    #runPauseOverlay .pause-upgrade-grid .pause-row {gap:8px;padding:10px 0;}
    #runPauseOverlay .pause-upgrade-grid strong {font-size:21px;}
    #runPauseOverlay .pause-upgrade-grid img {width:32px;height:32px;}
    #runPauseOverlay .pause-rewards {margin-top:16px;font-size:20px;}
    #runPauseOverlay summary {cursor:pointer;padding:8px 0;}
    #runPauseOverlay .pause-filters {position:sticky;top:0;background:#fff8dc;gap:8px;border-bottom:1px solid #c0cf94;z-index:1;}
    #runPauseOverlay .pause-pages {display:flex;align-items:center;justify-content:space-between;padding-top:12px;}
    #runPauseOverlay button:disabled {opacity:.35;cursor:default;transform:none;}
    #runPauseOverlay .pause-guide-entries .pause-row {align-items:flex-start;padding:16px 0;}
    @media(pointer:coarse),(max-width:600px) {
      #runPauseOverlay .pause-panel {width:880px;}
      #runPauseOverlay .pause-stats {grid-template-columns:repeat(2,minmax(0,1fr));}
      #runPauseOverlay .pause-stats > div {font-size:32px;}
      #runPauseOverlay .pause-stats strong {font-size:36px;}
      #runPauseOverlay .pause-upgrade-grid strong {font-size:32px;}
      #runPauseOverlay .pause-upgrade-grid img {width:50px;height:50px;}
      #runPauseOverlay .pause-rewards {font-size:32px;}
      #runPauseOverlay .pause-guide-entries p {font-size:36px;line-height:1.3;}
    }
    @media(max-width:600px) {
      #runPauseOverlay .pause-stats > div {font-size:20px;}
      #runPauseOverlay .pause-stats strong {font-size:23px;}
      #runPauseOverlay .pause-upgrade-grid strong {font-size:21px;}
      #runPauseOverlay .pause-upgrade-grid img {width:34px;height:34px;}
      #runPauseOverlay .pause-rewards {font-size:21px;}
      #runPauseOverlay .pause-guide-entries p {font-size:22px;line-height:1.3;}
    }`;
    style.textContent += '\n    #runPauseOverlay[data-view="run"] .pause-tabs {display:none;}\n    #runPauseOverlay[data-view="guide"] .pause-footer-guide {display:none;}\n    #runPauseOverlay[data-view="run"] .pause-panel {padding:24px 28px;width:540px;}\n    #runPauseOverlay[data-view="run"] h2 {margin-bottom:18px;}\n    #runPauseOverlay .pause-scoreline {display:flex;justify-content:center;gap:50px;text-align:center;margin-bottom:14px;}\n    #runPauseOverlay .pause-scoreline span {display:block;font-size:20px;}\n    #runPauseOverlay .pause-scoreline strong {display:block;font-size:38px;color:#087f86;line-height:1.1;}\n    #runPauseOverlay .pause-statline {display:flex;justify-content:center;flex-wrap:wrap;gap:6px 18px;font-size:19px;padding-bottom:14px;border-bottom:1px solid #c0cf94;}\n    #runPauseOverlay .pause-statline b {color:#087f86;font-weight:normal;}\n    #runPauseOverlay[data-view="run"] h3 {font-size:21px;margin:18px 0 8px;}\n    #runPauseOverlay[data-view="run"] .pause-upgrade-grid {gap:8px 14px;}\n    #runPauseOverlay[data-view="run"] .pause-row {border:0;padding:4px 0;gap:9px;}\n    #runPauseOverlay[data-view="run"] .pause-row strong {font-size:21px;font-weight:normal;}\n    #runPauseOverlay .pause-effect-list {display:flex;flex-wrap:wrap;gap:6px 18px;font-size:19px;}\n    #runPauseOverlay .pause-effect-list b {color:#087f86;font-weight:normal;}\n    #runPauseOverlay[data-view="run"] .pause-footer {display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;border:0;margin-top:18px;padding:0;}\n    #runPauseOverlay[data-view="run"] [data-action="resume"] {grid-column:1/-1;font-size:32px;padding:12px;}\n    #runPauseOverlay[data-view="run"] .pause-footer-guide,#runPauseOverlay[data-view="run"] [data-action="end"] {font-size:21px;}\n    @media(pointer:coarse),(max-width:600px) {\n      #runPauseOverlay[data-view="run"] .pause-panel {width:880px;padding:30px;}\n      #runPauseOverlay .pause-scoreline {gap:70px;}\n      #runPauseOverlay .pause-scoreline span,#runPauseOverlay .pause-statline,#runPauseOverlay .pause-effect-list {font-size:32px;}\n      #runPauseOverlay .pause-scoreline strong {font-size:56px;}\n      #runPauseOverlay[data-view="run"] h3,#runPauseOverlay[data-view="run"] .pause-row strong {font-size:34px;}\n      #runPauseOverlay[data-view="run"] [data-action="resume"] {font-size:48px;}\n      #runPauseOverlay[data-view="run"] .pause-footer-guide,#runPauseOverlay[data-view="run"] [data-action="end"] {font-size:34px;}\n    }\n    @media(max-width:600px) {\n      #runPauseOverlay[data-view="run"] .pause-panel {padding:20px;}\n      #runPauseOverlay .pause-scoreline {gap:36px;}\n      #runPauseOverlay .pause-scoreline span,#runPauseOverlay .pause-statline,#runPauseOverlay .pause-effect-list {font-size:20px;}\n      #runPauseOverlay .pause-scoreline strong {font-size:36px;}\n      #runPauseOverlay[data-view="run"] h3,#runPauseOverlay[data-view="run"] .pause-row strong {font-size:22px;}\n      #runPauseOverlay[data-view="run"] [data-action="resume"] {font-size:32px;}\n      #runPauseOverlay[data-view="run"] .pause-footer-guide,#runPauseOverlay[data-view="run"] [data-action="end"] {font-size:22px;}\n    }\n';
    style.textContent += '\n#runPauseOverlay[data-view="run"] .pause-panel {width:520px;}\n#runPauseOverlay[data-view="run"] .pause-content {font-weight:400;font-synthesis:none;}\n#runPauseOverlay .pause-runline {display:flex;justify-content:space-between;gap:16px;padding:8px 0 14px;border-bottom:1px solid #c0cf94;font-size:23px;font-weight:400;}\n#runPauseOverlay .pause-runline span {display:flex;gap:12px;align-items:baseline;}\n#runPauseOverlay .pause-runline em {font-style:normal;font-weight:400;color:#087f86;}\n#runPauseOverlay .pause-detail-stats {display:grid;grid-template-columns:1fr 1fr;gap:9px 26px;margin:14px 0 18px;font-size:21px;}\n#runPauseOverlay .pause-detail-stats div {display:flex;justify-content:space-between;gap:10px;}\n#runPauseOverlay .pause-detail-stats dt,#runPauseOverlay .pause-detail-stats dd {margin:0;font-weight:400;}\n#runPauseOverlay .pause-detail-stats dd {color:#087f86;}\n#runPauseOverlay[data-view="run"] h3 {font-weight:400;text-align:left;border-top:1px solid #c0cf94;padding-top:12px;margin-top:10px;}\n#runPauseOverlay[data-view="run"] .pause-row strong,#runPauseOverlay[data-view="run"] .pause-effect-list b {font-weight:400;font-synthesis:none;}\n@media(pointer:coarse),(max-width:600px){\n#runPauseOverlay[data-view="run"] .pause-panel {width:880px;}\n#runPauseOverlay .pause-runline {font-size:36px;}\n#runPauseOverlay .pause-detail-stats {font-size:32px;gap:12px 32px;}\n}\n@media(max-width:600px){\n#runPauseOverlay .pause-runline {font-size:23px;gap:12px;}\n#runPauseOverlay .pause-runline span {gap:8px;}\n#runPauseOverlay .pause-detail-stats {font-size:21px;gap:9px 18px;}\n}\n';
    style.textContent += "\n#runPauseOverlay[data-view=\"run\"] {--pu:1px;}\n#runPauseOverlay[data-view=\"run\"] .pause-panel {width:390px;max-width:calc(92 * var(--app-vw,1vw));padding:24px 22px 18px;border:3px solid #083b27;border-radius:7px;box-shadow:3px 3px 0 #466e35;}\n#runPauseOverlay[data-view=\"run\"] h2 {font-size:30px;margin:0 0 18px;}\n#runPauseOverlay[data-view=\"run\"] .pause-runline {display:grid;grid-template-columns:1fr 1fr;gap:12px;text-align:center;padding:0 0 14px;font-size:17px;}\n#runPauseOverlay[data-view=\"run\"] .pause-runline span {display:flex;flex-direction:column;gap:3px;align-items:center;}\n#runPauseOverlay[data-view=\"run\"] .pause-runline em {font-size:29px;}\n#runPauseOverlay[data-view=\"run\"] .pause-detail-stats {grid-template-columns:1fr 1fr;font-size:18px;gap:9px 20px;margin:13px 0 17px;}\n#runPauseOverlay[data-view=\"run\"] h3 {font-size:19px;text-align:center;margin:12px 0 9px;padding-top:12px;}\n#runPauseOverlay[data-view=\"run\"] .pause-upgrade-grid {display:grid;grid-template-columns:1fr;gap:2px;}\n#runPauseOverlay[data-view=\"run\"] .pause-row {padding:5px 0;gap:10px;}\n#runPauseOverlay[data-view=\"run\"] .pause-row img {width:29px;height:29px;}\n#runPauseOverlay[data-view=\"run\"] .pause-row strong {font-size:19px;font-weight:400;line-height:1.2;}\n#runPauseOverlay[data-view=\"run\"] .pause-effect-list {font-size:17px;gap:7px 12px;}\n#runPauseOverlay[data-view=\"run\"] .pause-empty {font-size:18px;text-align:center;}\n#runPauseOverlay[data-view=\"run\"] .pause-footer {display:flex;flex-direction:column;gap:1px;margin-top:14px;border-top:1px solid #c0cf94;padding-top:8px;}\n#runPauseOverlay[data-view=\"run\"] .pause-footer button {font-size:20px;padding:9px;min-height:40px;}\n#runPauseOverlay[data-view=\"run\"] .pause-footer [data-action=\"resume\"] {font-size:28px;padding:10px;}\n@media(pointer:coarse) {\n #runPauseOverlay[data-view=\"run\"] .pause-panel {width:calc(82 * var(--app-vw,1vw));max-width:calc(82 * var(--app-vw,1vw));padding:calc(5 * var(--app-vw,1vw)) calc(4 * var(--app-vw,1vw)) calc(3 * var(--app-vw,1vw));border-width:calc(.6 * var(--app-vw,1vw));}\n #runPauseOverlay[data-view=\"run\"] h2 {font-size:calc(6.6 * var(--app-vw,1vw));margin-bottom:calc(4 * var(--app-vw,1vw));}\n #runPauseOverlay[data-view=\"run\"] .pause-runline {font-size:calc(4.1 * var(--app-vw,1vw));padding-bottom:calc(3 * var(--app-vw,1vw));gap:calc(3 * var(--app-vw,1vw));}\n #runPauseOverlay[data-view=\"run\"] .pause-runline em {font-size:calc(6.5 * var(--app-vw,1vw));}\n #runPauseOverlay[data-view=\"run\"] .pause-detail-stats {font-size:calc(4.1 * var(--app-vw,1vw));gap:calc(2 * var(--app-vw,1vw)) calc(4 * var(--app-vw,1vw));margin:calc(3 * var(--app-vw,1vw)) 0;}\n #runPauseOverlay[data-view=\"run\"] h3 {font-size:calc(4.5 * var(--app-vw,1vw));margin:calc(3 * var(--app-vw,1vw)) 0 calc(2 * var(--app-vw,1vw));padding-top:calc(3 * var(--app-vw,1vw));}\n #runPauseOverlay[data-view=\"run\"] .pause-row {gap:calc(2 * var(--app-vw,1vw));padding:calc(1.3 * var(--app-vw,1vw)) 0;}\n #runPauseOverlay[data-view=\"run\"] .pause-row img {width:calc(6.5 * var(--app-vw,1vw));height:calc(6.5 * var(--app-vw,1vw));}\n #runPauseOverlay[data-view=\"run\"] .pause-row strong {font-size:calc(4.5 * var(--app-vw,1vw));}\n #runPauseOverlay[data-view=\"run\"] .pause-effect-list,#runPauseOverlay[data-view=\"run\"] .pause-empty {font-size:calc(4.1 * var(--app-vw,1vw));}\n #runPauseOverlay[data-view=\"run\"] .pause-footer {margin-top:calc(3 * var(--app-vw,1vw));padding-top:calc(2 * var(--app-vw,1vw));}\n #runPauseOverlay[data-view=\"run\"] .pause-footer button {font-size:calc(4.8 * var(--app-vw,1vw));padding:calc(2.4 * var(--app-vw,1vw));min-height:calc(10 * var(--app-vw,1vw));}\n #runPauseOverlay[data-view=\"run\"] .pause-footer [data-action=\"resume\"] {font-size:calc(6.5 * var(--app-vw,1vw));padding:calc(2.4 * var(--app-vw,1vw));}\n}\n";
    style.textContent += "\n#runPauseOverlay[data-view=\"run\"] {--p:1px;background:rgba(8,48,29,.20);}\n#runPauseOverlay[data-view=\"run\"] .pause-panel {width:calc(368 * var(--p));max-width:calc(90 * var(--app-vw,1vw));padding:0;border:calc(3 * var(--p)) solid #083b27;border-radius:7px;box-shadow:calc(3 * var(--p)) calc(4 * var(--p)) 0 #466e35;}\n#runPauseOverlay[data-view=\"run\"] h2 {background:#083b27;color:#fff8dc;font-size:calc(27 * var(--p));letter-spacing:calc(1 * var(--p));padding:calc(16 * var(--p));margin:0;}\n#runPauseOverlay[data-view=\"run\"] .pause-content {padding:0 calc(20 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .pause-party {display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:calc(12 * var(--p));padding:calc(20 * var(--p)) 0 calc(16 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .pause-party-frogs {display:flex;align-items:end;justify-content:center;gap:calc(2 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .pause-party-frogs img {width:calc(39 * var(--p));height:calc(39 * var(--p));object-fit:contain;image-rendering:pixelated;}\n#runPauseOverlay[data-view=\"run\"] .pause-party-frogs img:nth-child(2) {width:calc(49 * var(--p));height:calc(49 * var(--p));margin-bottom:calc(7 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .pause-party-score {text-align:center;}\n#runPauseOverlay[data-view=\"run\"] .pause-party-score span {display:block;font-size:calc(14 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .pause-party-score strong {display:block;font-weight:400;font-size:calc(38 * var(--p));line-height:1.1;color:#087f86;}\n#runPauseOverlay[data-view=\"run\"] .pause-party-score small {font-size:calc(16 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .pause-ledger {display:grid;grid-template-columns:repeat(4,1fr);margin:0;padding:calc(12 * var(--p)) 0;border-top:1px solid #b5c78c;border-bottom:1px solid #b5c78c;gap:calc(6 * var(--p));text-align:center;}\n#runPauseOverlay[data-view=\"run\"] .pause-ledger dt {font-size:calc(14 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .pause-ledger dd {margin:calc(4 * var(--p)) 0 0;font-size:calc(19 * var(--p));color:#087f86;}\n#runPauseOverlay[data-view=\"run\"] h3 {font-size:calc(18 * var(--p));font-weight:400;text-align:left;margin:calc(16 * var(--p)) 0 calc(8 * var(--p));padding:0;border:0;display:flex;justify-content:space-between;}\n#runPauseOverlay[data-view=\"run\"] h3 span {color:#087f86;}\n#runPauseOverlay[data-view=\"run\"] .pause-upgrade-grid {display:grid;grid-template-columns:1fr;gap:calc(3 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .pause-row {padding:calc(5 * var(--p)) 0;gap:calc(10 * var(--p));border:0;}\n#runPauseOverlay[data-view=\"run\"] .pause-row img {width:calc(29 * var(--p));height:calc(29 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .pause-row strong {font-size:calc(19 * var(--p));font-weight:400;line-height:1.2;}\n#runPauseOverlay[data-view=\"run\"] .pause-effect-list,#runPauseOverlay[data-view=\"run\"] .pause-empty {font-size:calc(16 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .pause-footer {display:grid;grid-template-columns:1fr 1fr;gap:0;margin:calc(16 * var(--p)) calc(20 * var(--p)) calc(10 * var(--p));padding:calc(8 * var(--p)) 0 0;border-top:1px solid #b5c78c;}\n#runPauseOverlay[data-view=\"run\"] .pause-footer button {font-size:calc(18 * var(--p));min-height:calc(42 * var(--p));padding:calc(9 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .pause-footer [data-action=\"resume\"] {grid-column:1/-1;font-size:calc(29 * var(--p));padding:calc(10 * var(--p));}\n@media(pointer:coarse) {#runPauseOverlay[data-view=\"run\"] {--p:calc(calc(100 * var(--app-vw,1vw)) / 430);}}\n";
    style.textContent += "\n#runPauseOverlay[data-view=\"guide\"] {--g:1px;}\n#runPauseOverlay[data-view=\"guide\"] .pause-panel {width:calc(410 * var(--g));max-width:calc(92 * var(--app-vw,1vw));background:#083b27;padding:calc(14 * var(--g));border:3px solid #083b27;border-radius:7px;}\n#runPauseOverlay[data-view=\"guide\"] .pause-content {padding:0;}\n#runPauseOverlay[data-view=\"guide\"] .pause-tabs {border:0;margin:0 0 calc(6 * var(--g));}\n#runPauseOverlay[data-view=\"guide\"] .pause-tabs button,#runPauseOverlay[data-view=\"guide\"] .pause-footer button,#runPauseOverlay[data-view=\"guide\"] .pause-pages button,#runPauseOverlay[data-view=\"guide\"] .pause-pages span {color:#fff8dc;font-size:calc(19 * var(--g));}\n#runPauseOverlay[data-view=\"guide\"] .pause-filters {gap:calc(8 * var(--g));margin-bottom:calc(12 * var(--g));}\n#runPauseOverlay[data-view=\"guide\"] .pause-filters button {color:#fff8dc;font-size:calc(20 * var(--g));padding:calc(8 * var(--g));}\n#runPauseOverlay[data-view=\"guide\"] .pause-filters button[aria-selected=true] {color:#c6ed78;}\n#runPauseOverlay[data-view=\"guide\"] .pause-guide-entries {display:grid;gap:calc(8 * var(--g));}\n#runPauseOverlay[data-view=\"guide\"] .pause-guide-entries .pause-row {display:grid;grid-template-columns:calc(43 * var(--g)) 1fr;align-items:center;gap:calc(12 * var(--g));background:#fff8dc;border:0;padding:calc(14 * var(--g));clip-path:polygon(8px 0,calc(100% - 8px) 0,100% 8px,100% calc(100% - 8px),calc(100% - 8px) 100%,8px 100%,0 calc(100% - 8px),0 8px);}\n#runPauseOverlay[data-view=\"guide\"] .pause-row img {width:calc(43 * var(--g));height:calc(43 * var(--g));object-fit:contain;image-rendering:pixelated;}\n#runPauseOverlay[data-view=\"guide\"] .pause-row strong {font-size:calc(22 * var(--g));line-height:1.12;font-weight:400;}\n#runPauseOverlay[data-view=\"guide\"] .pause-row p {font-size:calc(18 * var(--g));line-height:1.25;margin:calc(5 * var(--g)) 0 0;}\n#runPauseOverlay[data-view=\"guide\"] .pause-pages {margin-top:calc(12 * var(--g));}\n#runPauseOverlay[data-view=\"guide\"] .pause-pages button:disabled {opacity:.35;}\n#runPauseOverlay[data-view=\"guide\"] .pause-footer {margin-top:calc(10 * var(--g));border-color:#497b36;padding-top:calc(8 * var(--g));}\n@media(pointer:coarse) {#runPauseOverlay[data-view=\"guide\"] {--g:calc(calc(100 * var(--app-vw,1vw)) / 450);}}\n";
    style.textContent += "\n#runPauseOverlay[data-view=\"run\"] .guide-pagination-slot {display:none;}\n#runPauseOverlay[data-view=\"guide\"] .pause-filters {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:calc(5 * var(--g));margin:calc(3 * var(--g)) 0 calc(14 * var(--g));}\n#runPauseOverlay[data-view=\"guide\"] .pause-filters button {font-size:calc(23 * var(--g));line-height:1.1;min-height:calc(46 * var(--g));padding:calc(10 * var(--g)) calc(4 * var(--g));background:#28543d;color:#fff8dc;border:0;letter-spacing:0;text-decoration:none;clip-path:polygon(5px 0,calc(100% - 5px) 0,100% 5px,100% calc(100% - 5px),calc(100% - 5px) 100%,5px 100%,0 calc(100% - 5px),0 5px);}\n#runPauseOverlay[data-view=\"guide\"] .pause-filters button[aria-selected=\"true\"] {background:#fff8dc;color:#083b27;text-decoration:none;}\n#runPauseOverlay[data-view=\"guide\"] .pause-footer {display:grid;grid-template-columns:1fr 1fr;gap:calc(4 * var(--g));}\n#runPauseOverlay[data-view=\"guide\"] .guide-pagination-slot {grid-column:1/-1;}\n#runPauseOverlay[data-view=\"guide\"] .pause-pages {display:flex;align-items:center;justify-content:space-between;margin:0 0 calc(6 * var(--g));}\n#runPauseOverlay[data-view=\"guide\"] .pause-pages button,#runPauseOverlay[data-view=\"guide\"] .pause-pages span {font-size:calc(20 * var(--g));}\n#runPauseOverlay[data-view=\"guide\"] .pause-footer .guide-back {grid-column:1/-1;font-size:calc(25 * var(--g));min-height:calc(44 * var(--g));}\n#runPauseOverlay[data-view=\"guide\"] .pause-footer button {padding:calc(10 * var(--g)) calc(5 * var(--g));min-height:calc(44 * var(--g));}\n";
    style.textContent += "\n@font-face{font-family:GuidePixel;src:url(\"game-assets/fonts/jersey10.ttf\") format(\"truetype\");font-display:swap;}\n#runPauseOverlay[data-view=\"guide\"]{--g:1px;}\n#runPauseOverlay[data-view=\"guide\"] *{font-family:GuidePixel,monospace!important;}\n#runPauseOverlay[data-view=\"guide\"] .pause-panel{width:calc(440 * var(--g));max-width:calc(92 * var(--app-vw,1vw));padding:0;background:#fff8dc;border:3px solid #0b3a25;border-radius:8px;box-shadow:4px 5px 0 #538e3e;}\n#runPauseOverlay[data-view=\"guide\"] .guide-heading{padding:calc(22 * var(--g)) calc(24 * var(--g)) 0;flex-shrink:0;}\n#runPauseOverlay[data-view=\"guide\"] .guide-eyebrow{font-size:calc(17 * var(--g));letter-spacing:calc(2 * var(--g));color:#4b7139;margin:0 0 calc(3 * var(--g));}\n#runPauseOverlay[data-view=\"guide\"] .guide-heading h2{font-size:calc(36 * var(--g));font-weight:400;text-align:left;margin:0;line-height:1;color:#0b3a25;}\n#runPauseOverlay[data-view=\"guide\"] .pause-filters{display:grid;grid-template-columns:repeat(3,1fr);gap:calc(12 * var(--g));margin:calc(20 * var(--g)) 0 0;border-bottom:2px solid #bdcf93;}\n#runPauseOverlay[data-view=\"guide\"] .pause-filters button{font-size:calc(24 * var(--g));padding:calc(8 * var(--g)) 0 calc(10 * var(--g));background:transparent;border:0;border-bottom:3px solid transparent;border-radius:0;clip-path:none;margin-bottom:-2px;color:#567143;min-height:calc(44 * var(--g));text-decoration:none;}\n#runPauseOverlay[data-view=\"guide\"] .pause-filters button[aria-selected=true]{background:transparent;color:#093923;border-bottom-color:#093923;text-decoration:none;}\n#runPauseOverlay[data-view=\"guide\"] .pause-content{padding:0 calc(24 * var(--g));}\n#runPauseOverlay[data-view=\"guide\"] .pause-guide-entries{display:block;}\n#runPauseOverlay[data-view=\"guide\"] .pause-guide-entries .pause-row{display:grid;grid-template-columns:calc(46 * var(--g)) 1fr;gap:calc(15 * var(--g));padding:calc(17 * var(--g)) 0;border:0;border-bottom:1px solid #d5ddae;background:transparent;clip-path:none;align-items:start;}\n#runPauseOverlay[data-view=\"guide\"] .pause-guide-entries .pause-row:last-child{border:0;}\n#runPauseOverlay[data-view=\"guide\"] .pause-row img{width:calc(46 * var(--g));height:calc(46 * var(--g));margin-top:calc(3 * var(--g));}\n#runPauseOverlay[data-view=\"guide\"] .pause-row strong{font-size:calc(25 * var(--g));line-height:1.05;font-weight:400;color:#0b3a25;}\n#runPauseOverlay[data-view=\"guide\"] .pause-row p{font-size:calc(21 * var(--g));line-height:1.2;margin:calc(5 * var(--g)) 0 0;color:#264c32;}\n#runPauseOverlay[data-view=\"guide\"] .pause-footer{display:block;padding:calc(10 * var(--g)) calc(24 * var(--g)) calc(16 * var(--g));margin:0;border-top:2px solid #bdcf93;}\n#runPauseOverlay[data-view=\"guide\"] .pause-footer>[data-action],#runPauseOverlay[data-view=\"guide\"] .pause-footer-guide{display:none;}\n#runPauseOverlay[data-view=\"guide\"] .pause-pages{display:grid;grid-template-columns:1fr auto 1fr;gap:calc(12 * var(--g));margin:0;align-items:center;}\n#runPauseOverlay[data-view=\"guide\"] .pause-pages button{font-size:calc(22 * var(--g));padding:calc(10 * var(--g)) 0;color:#0b3a25;min-height:calc(44 * var(--g));}\n#runPauseOverlay[data-view=\"guide\"] .pause-pages button:first-child{text-align:left;}\n#runPauseOverlay[data-view=\"guide\"] .pause-pages button:last-child{text-align:right;}\n#runPauseOverlay[data-view=\"guide\"] .pause-pages span{font-size:calc(20 * var(--g));color:#45663b;}\n#runPauseOverlay[data-view=\"guide\"] .pause-footer .guide-back{width:100%;display:block;font-size:calc(25 * var(--g));padding:calc(8 * var(--g));color:#0b3a25;min-height:calc(44 * var(--g));}\n@media(pointer:coarse){#runPauseOverlay[data-view=\"guide\"]{--g:calc(calc(100 * var(--app-vw,1vw)) / 470);}}\n";
    style.textContent += "\n#runPauseOverlay[data-view=\"run\"]{--p:1px;}\n#runPauseOverlay[data-view=\"run\"] *{font-family:GuidePixel,monospace!important;font-weight:400;font-synthesis:none;}\n#runPauseOverlay[data-view=\"run\"] .pause-panel{width:calc(440 * var(--p));max-width:calc(92 * var(--app-vw,1vw));padding:calc(24 * var(--p));background:#fff8dc;border:3px solid #0b3a25;border-radius:8px;box-shadow:4px 5px 0 #538e3e;}\n#runPauseOverlay[data-view=\"run\"] #pauseTitle{text-align:left;font-size:calc(36 * var(--p));line-height:1;margin:0 0 calc(20 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] #pauseTitle:before{content:\"ESCAPE THE SNAKE\";display:block;font-size:calc(17 * var(--p));letter-spacing:calc(2 * var(--p));color:#4b7139;margin-bottom:calc(5 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .pause-content{padding:0;min-height:0;overflow-y:auto;}\n#runPauseOverlay[data-view=\"run\"] .pause-run-summary{display:grid;grid-template-columns:1fr 1fr;gap:calc(20 * var(--p));padding-bottom:calc(15 * var(--p));border-bottom:2px solid #bdcf93;}\n#runPauseOverlay[data-view=\"run\"] .pause-run-summary span{display:block;font-size:calc(21 * var(--p));color:#45663b;}\n#runPauseOverlay[data-view=\"run\"] .pause-run-summary strong{display:block;font-size:calc(34 * var(--p));color:#087985;}\n#runPauseOverlay[data-view=\"run\"] .pause-ledger{display:grid;grid-template-columns:1fr 1fr;gap:calc(9 * var(--p)) calc(24 * var(--p));margin:calc(15 * var(--p)) 0;font-size:calc(21 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .pause-ledger div{display:flex;justify-content:space-between;gap:calc(8 * var(--p));border:0;padding:0;}\n#runPauseOverlay[data-view=\"run\"] .pause-ledger dt,#runPauseOverlay[data-view=\"run\"] .pause-ledger dd{margin:0;font-size:inherit;}\n#runPauseOverlay[data-view=\"run\"] .pause-ledger dd{color:#087985;}\n#runPauseOverlay[data-view=\"run\"] h3{display:flex;justify-content:space-between;text-align:left;font-size:calc(24 * var(--p));border-top:2px solid #bdcf93;padding-top:calc(14 * var(--p));margin:calc(16 * var(--p)) 0 calc(6 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .pause-upgrade-grid{display:block;}\n#runPauseOverlay[data-view=\"run\"] .pause-row{display:flex;gap:calc(12 * var(--p));padding:calc(9 * var(--p)) 0;border-bottom:1px solid #d5ddae;background:transparent;}\n#runPauseOverlay[data-view=\"run\"] .pause-row img{width:calc(30 * var(--p));height:calc(30 * var(--p));object-fit:contain;image-rendering:pixelated;}\n#runPauseOverlay[data-view=\"run\"] .pause-row strong{font-size:calc(23 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .pause-effect-list,#runPauseOverlay[data-view=\"run\"] .pause-empty{font-size:calc(21 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .pause-footer{display:grid;grid-template-columns:1fr 1fr;border-top:2px solid #bdcf93;padding:calc(10 * var(--p)) 0 0;margin-top:calc(16 * var(--p));gap:0;}\n#runPauseOverlay[data-view=\"run\"] .pause-footer button{background:transparent;border:0;color:#0b3a25;font-size:calc(23 * var(--p));padding:calc(10 * var(--p)) 0;min-height:calc(44 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .pause-footer [data-action=\"resume\"]{grid-column:1/-1;font-size:calc(29 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .guide-pagination-slot{display:none;}\n@media(pointer:coarse){#runPauseOverlay[data-view=\"run\"]{--p:calc(calc(100 * var(--app-vw,1vw)) / 470);}}\n";
    style.textContent += "\n/* Pause-only layout. Uses existing --p scale; guide/native sizing untouched. */\n#runPauseOverlay[data-view=\"run\"] .pause-panel{padding:calc(22 * var(--p));gap:0;}\n#runPauseOverlay[data-view=\"run\"] #pauseTitle{flex-shrink:0;text-align:center;font-size:calc(32 * var(--p));padding:0 0 calc(17 * var(--p));margin:0;border-bottom:2px solid #bdcf93;}\n#runPauseOverlay[data-view=\"run\"] #pauseTitle:before{content:none;}\n#runPauseOverlay[data-view=\"run\"] .pause-content{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;padding:0;}\n#runPauseOverlay[data-view=\"run\"] .pause-overview{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:center;gap:calc(16 * var(--p));padding:calc(17 * var(--p)) 0;}\n#runPauseOverlay[data-view=\"run\"] .pause-overview span{display:block;font-size:calc(20 * var(--p));color:#45663b;line-height:1.1;}\n#runPauseOverlay[data-view=\"run\"] .pause-overview strong{display:block;font-size:calc(33 * var(--p));color:#087985;line-height:1.1;margin-top:calc(4 * var(--p));overflow-wrap:anywhere;}\n#runPauseOverlay[data-view=\"run\"] .pause-time{text-align:right;}\n#runPauseOverlay[data-view=\"run\"] .pause-facts{margin:0;padding:calc(12 * var(--p)) 0;border-top:1px solid #d5ddae;border-bottom:1px solid #d5ddae;display:grid;grid-template-columns:1fr 1fr;gap:calc(10 * var(--p)) calc(24 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .pause-facts div{display:flex;align-items:baseline;justify-content:space-between;gap:calc(6 * var(--p));min-width:0;}\n#runPauseOverlay[data-view=\"run\"] .pause-facts dt,#runPauseOverlay[data-view=\"run\"] .pause-facts dd{font-size:calc(21 * var(--p));line-height:1.1;margin:0;}\n#runPauseOverlay[data-view=\"run\"] .pause-facts dd{color:#087985;white-space:nowrap;}\n#runPauseOverlay[data-view=\"run\"] .pause-facts small{font-size:calc(18 * var(--p));color:#567143;}\n#runPauseOverlay[data-view=\"run\"] h3{display:flex;align-items:baseline;justify-content:space-between;font-size:calc(22 * var(--p));margin:calc(17 * var(--p)) 0 calc(7 * var(--p));padding:0;border:0;text-align:left;}\n#runPauseOverlay[data-view=\"run\"] h3 span{font-size:calc(19 * var(--p));color:#567143;}\n#runPauseOverlay[data-view=\"run\"] .pause-row{display:grid;grid-template-columns:calc(28 * var(--p)) minmax(0,1fr);align-items:center;gap:calc(11 * var(--p));padding:calc(7 * var(--p)) 0;border:0;}\n#runPauseOverlay[data-view=\"run\"] .pause-row img{width:calc(28 * var(--p));height:calc(28 * var(--p));margin:0;}\n#runPauseOverlay[data-view=\"run\"] .pause-row strong{font-size:calc(22 * var(--p));line-height:1.15;}\n#runPauseOverlay[data-view=\"run\"] .pause-empty{text-align:left;font-size:calc(20 * var(--p));color:#567143;margin:calc(10 * var(--p)) 0;}\n#runPauseOverlay[data-view=\"run\"] .pause-effect-list{display:flex;flex-wrap:wrap;gap:calc(7 * var(--p)) calc(16 * var(--p));font-size:calc(20 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .pause-effect-list b{color:#087985;}\n#runPauseOverlay[data-view=\"run\"] .pause-footer{flex-shrink:0;display:grid;grid-template-columns:1fr 1fr;border-top:2px solid #bdcf93;margin-top:calc(17 * var(--p));padding-top:calc(7 * var(--p));gap:0 calc(12 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .pause-footer button{box-shadow:none!important;background:transparent!important;border:0!important;border-radius:0;clip-path:none;min-width:0;line-height:1.1;}\n#runPauseOverlay[data-view=\"run\"] .pause-footer [data-action=\"resume\"]{grid-column:1/-1;font-size:calc(29 * var(--p));padding:calc(11 * var(--p)) 0;}\n#runPauseOverlay[data-view=\"run\"] .pause-footer-guide,#runPauseOverlay[data-view=\"run\"] .pause-footer [data-action=\"end\"]{font-size:calc(22 * var(--p));padding:calc(10 * var(--p)) 0;}\n@media(hover:hover){#runPauseOverlay[data-view=\"run\"] .pause-footer button:hover{transform:translateY(-2px);}}\n";
    style.textContent += "\n#runPauseOverlay[data-view=\"run\"] .pause-panel{border-radius:8px!important;background:#fff8dc!important;border:3px solid #0b3a25!important;box-shadow:4px 5px 0 #538e3e!important;clip-path:none!important;padding:calc(22 * var(--p)) calc(24 * var(--p)) calc(16 * var(--p))!important;}\n#runPauseOverlay[data-view=\"run\"] #pauseTitle{text-align:left!important;font-size:calc(36 * var(--p))!important;font-weight:400!important;line-height:1!important;padding:0!important;margin:0!important;border:0!important;}\n#runPauseOverlay[data-view=\"run\"] #pauseTitle:before{content:\"ESCAPE THE SNAKE\"!important;display:block!important;font-size:calc(17 * var(--p))!important;letter-spacing:calc(2 * var(--p))!important;margin:0 0 calc(4 * var(--p))!important;color:#4b7139!important;}\n#runPauseOverlay[data-view=\"run\"] .pause-overview{display:flex!important;justify-content:space-between!important;align-items:baseline!important;gap:calc(10 * var(--p))!important;border-bottom:2px solid #bdcf93!important;padding:calc(15 * var(--p)) 0 calc(13 * var(--p))!important;}\n#runPauseOverlay[data-view=\"run\"] .pause-overview>div{display:flex!important;align-items:baseline!important;gap:calc(7 * var(--p))!important;}\n#runPauseOverlay[data-view=\"run\"] .pause-overview span{font-size:calc(21 * var(--p))!important;color:#45663b!important;}\n#runPauseOverlay[data-view=\"run\"] .pause-overview strong{font-size:calc(25 * var(--p))!important;margin:0!important;font-weight:400!important;color:#087985!important;}\n#runPauseOverlay[data-view=\"run\"] .pause-facts{display:grid!important;grid-template-columns:1fr 1fr!important;gap:calc(8 * var(--p)) calc(24 * var(--p))!important;margin:calc(14 * var(--p)) 0 calc(18 * var(--p))!important;padding:0!important;border:0!important;}\n#runPauseOverlay[data-view=\"run\"] .pause-facts dt,#runPauseOverlay[data-view=\"run\"] .pause-facts dd{font-size:calc(21 * var(--p))!important;font-weight:400!important;}\n#runPauseOverlay[data-view=\"run\"] .pause-compact-facts{display:none!important;}\n#runPauseOverlay[data-view=\"run\"] .pause-kit h3{font-size:calc(21 * var(--p))!important;font-weight:400!important;margin:0!important;padding:calc(10 * var(--p)) 0!important;border:0!important;border-top:1px solid #bdcf93!important;color:#4b7139!important;}\n#runPauseOverlay[data-view=\"run\"] .pause-upgrade-grid{display:block!important;}\n#runPauseOverlay[data-view=\"run\"] .pause-row{display:grid!important;grid-template-columns:calc(40 * var(--p)) minmax(0,1fr)!important;gap:calc(15 * var(--p))!important;padding:calc(14 * var(--p)) 0!important;border:0!important;border-bottom:1px solid #d5ddae!important;align-items:center!important;}\n#runPauseOverlay[data-view=\"run\"] .pause-row:last-child{border:0!important;}\n#runPauseOverlay[data-view=\"run\"] .pause-row img{width:calc(40 * var(--p))!important;height:calc(40 * var(--p))!important;object-fit:contain!important;}\n#runPauseOverlay[data-view=\"run\"] .pause-row strong{font-size:calc(25 * var(--p))!important;font-weight:400!important;line-height:1.05!important;}\n#runPauseOverlay[data-view=\"run\"] .pause-row p{font-size:calc(20 * var(--p))!important;line-height:1.15!important;color:#45663b!important;margin:calc(5 * var(--p)) 0 0!important;}\n#runPauseOverlay[data-view=\"run\"] .pause-footer{display:grid!important;grid-template-columns:1fr 1fr!important;gap:0!important;margin-top:calc(8 * var(--p))!important;padding:calc(10 * var(--p)) 0 0!important;border-top:2px solid #bdcf93!important;}\n#runPauseOverlay[data-view=\"run\"] .pause-footer [data-action=\"resume\"]{grid-column:1/-1!important;font-size:calc(29 * var(--p))!important;text-align:center!important;}\n#runPauseOverlay[data-view=\"run\"] .pause-footer button{background:transparent!important;box-shadow:none!important;border:0!important;font-size:calc(23 * var(--p));padding:calc(10 * var(--p)) 0!important;}\n#runPauseOverlay[data-view=\"run\"] .pause-footer-guide{text-align:left!important;}\n#runPauseOverlay[data-view=\"run\"] .pause-footer [data-action=\"end\"]{text-align:right!important;}\n";
    style.textContent += "\n#runPauseOverlay[data-view=\"run\"] .pause-content{padding:0!important;background:transparent!important;}\n#runPauseOverlay[data-view=\"run\"] .rest-runline{display:flex;justify-content:space-between;gap:calc(10 * var(--p));align-items:baseline;border-bottom:2px solid #bdcf93;padding:calc(15 * var(--p)) 0 calc(13 * var(--p));font-size:calc(21 * var(--p));color:#45663b;}\n#runPauseOverlay[data-view=\"run\"] .rest-runline b{font-size:calc(25 * var(--p));font-weight:400;color:#087985;}\n#runPauseOverlay[data-view=\"run\"] .rest-facts{display:grid;grid-template-columns:1fr 1fr;gap:calc(8 * var(--p)) calc(24 * var(--p));margin:calc(14 * var(--p)) 0 calc(18 * var(--p));font-size:calc(21 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .rest-facts div{display:flex;justify-content:space-between;gap:calc(8 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .rest-facts dt,#runPauseOverlay[data-view=\"run\"] .rest-facts dd{margin:0;font-weight:400;}\n#runPauseOverlay[data-view=\"run\"] .rest-facts dd{color:#087985;}\n#runPauseOverlay[data-view=\"run\"] .rest-label{font-size:calc(21 * var(--p));color:#4b7139;margin:0;padding:calc(10 * var(--p)) 0;border-top:1px solid #bdcf93;}\n#runPauseOverlay[data-view=\"run\"] .rest-entry{display:grid;grid-template-columns:calc(40 * var(--p)) minmax(0,1fr);gap:calc(15 * var(--p));padding:calc(14 * var(--p)) 0;border-bottom:1px solid #d5ddae;align-items:center;}\n#runPauseOverlay[data-view=\"run\"] .rest-entry:last-child{border:0;}\n#runPauseOverlay[data-view=\"run\"] .rest-entry img{width:calc(40 * var(--p));height:calc(40 * var(--p));object-fit:contain;image-rendering:pixelated;}\n#runPauseOverlay[data-view=\"run\"] .rest-name{font-size:calc(25 * var(--p));line-height:1.05;color:#0b3a25;}\n#runPauseOverlay[data-view=\"run\"] .rest-entry p{font-size:calc(20 * var(--p));line-height:1.15;color:#45663b;margin:calc(5 * var(--p)) 0 0;}\n#runPauseOverlay[data-view=\"run\"] .rest-effects{display:flex;flex-wrap:wrap;gap:calc(8 * var(--p)) calc(16 * var(--p));font-size:calc(20 * var(--p));}\n#runPauseOverlay[data-view=\"run\"] .rest-effects b{color:#087985;font-weight:400;}\n";
    document.head.appendChild(style);
    pauseMenu=document.createElement('div'); pauseMenu.id='runPauseOverlay';
    pauseMenu.setAttribute('role','dialog');pauseMenu.setAttribute('aria-modal','true');pauseMenu.setAttribute('aria-labelledby','pauseTitle');
    pauseMenu.innerHTML=`<div class="sm-panel" data-menu-panel><h2 id="pauseTitle" hidden>Paused</h2><header class="guide-heading" hidden><div class="guide-eyebrow">ESCAPE THE SNAKE</div><h2>Field Guide</h2><div class="guide-category-slot"></div></header><div class="pause-content"></div><footer class="pause-footer"><div class="guide-pagination-slot"></div><button class="guide-back" data-action="guide-back" hidden>Back</button><button data-action="resume">Resume</button><button data-action="end">End Run</button></footer></div>`;
    document.body.appendChild(pauseMenu);
    pauseMenu.addEventListener('pointerdown',e=>e.stopPropagation());
    pauseMenu.addEventListener('click',e=>{
      e.stopPropagation();const b=e.target.closest('button');if(!b)return;
      if(b.dataset.action==='guide-menu' || b.dataset.action==='guide-start') {
        pauseMenu.style.display='none';
        fieldGuideFromHelp=false;
        startAfterHowTo=false;
        if(howToOverlay) howToOverlay.style.display='none';
        if(b.dataset.action==='guide-start') startRunFromMenu();
        else showMainMenu();
        return;
      }
      if(b.dataset.action==='guide-back') { closePauseMenu(); return; }
      if(b.dataset.view) renderPauseContent(b.dataset.view);
      if(b.dataset.filter) { pauseGuidePage=0; renderPauseContent('guide',b.dataset.filter); }
      if(b.dataset.upgradePage && !b.disabled) { pauseUpgradePage+=Number(b.dataset.upgradePage); renderPauseContent('run'); }
      if(b.dataset.page) { pauseGuidePage+=Number(b.dataset.page); renderPauseContent('guide',pauseGuideFilter); }
      if(b.dataset.action==='resume') closePauseMenu();
      if(b.dataset.action==='end') {
        pauseMenu.dataset.view='confirm';
        pauseMenu.querySelector('.pause-content').innerHTML=menuHeader('End this run?','Your score will be saved to the run summary.');
        pauseMenu.querySelector('footer').innerHTML='<button data-action="confirm-end">End run</button><button data-action="resume">Keep playing</button>';
      }
      if(b.dataset.action==='confirm-end') {pauseMenu.style.display='none';endGame();}
    });
    pauseMenu.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closePauseMenu();}
      if(e.key==='Tab') {const buttons=[...pauseMenu.querySelectorAll('button')].filter(b=>!b.disabled && b.getClientRects().length);const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    });
  }
  function renderPauseContent(view='run',filter=pauseGuideFilter) {
    pauseMenu.dataset.view = view;
    pauseMenu.querySelector('#pauseTitle').hidden = true;
    pauseMenu.querySelector('[data-menu-panel]').className = view === 'guide' ? 'pause-panel' : 'sm-panel';
    if(view !== 'guide') {
      pauseMenu.querySelector('[data-menu-panel]').removeAttribute('style');
      pauseMenu.querySelectorAll('footer,footer button').forEach(el=>el.removeAttribute('style'));
    }
    pauseMenu.querySelector('.pause-content').classList.toggle('sm-content', view !== 'guide');
    const footer = pauseMenu.querySelector('footer');
    footer.hidden=false;
    footer.className = view === 'guide' ? 'pause-footer' : 'sm-actions';
    footer.innerHTML=view === 'guide'
      ? (fieldGuideFromHelp ? '<div class="guide-pagination-slot"></div><div class="guide-menu-actions"><button data-action="guide-menu">Back to menu</button><button data-action="guide-start">Start run</button></div>' : '<div class="guide-pagination-slot"></div><div class="guide-menu-actions"><button data-view="run">Back to menu</button><button data-action="resume">Resume</button></div>')
      : '<button data-action="resume">Resume</button><button data-view="guide">Field Guide</button><button data-action="end">End run</button>';
    pauseMenu.setAttribute('aria-label', view === 'guide' ? 'Field Guide' : 'Paused');
    if (view === 'guide') pauseMenu.removeAttribute('aria-labelledby');
    else pauseMenu.setAttribute('aria-labelledby', 'pauseTitle');
    pauseMenu.querySelector('.guide-heading').hidden=view!=='guide';
    pauseMenu.querySelector('.guide-category-slot').replaceChildren();
    pauseMenu.querySelector('.guide-pagination-slot')?.replaceChildren();
    const content=pauseMenu.querySelector('.pause-content');content.scrollTop=0;
    if(view==='guide') {
      restoreKnownGuideEntries();
      pauseMenu.dataset.guideCategory=filter;
      pauseGuideFilter=filter;
      const entries=pauseGuide.filter(x=>x[0]===filter);
      const perPage=4, pages=Math.ceil(entries.length/perPage);
      pauseGuidePage=Math.max(0,Math.min(pages-1,pauseGuidePage));
      content.innerHTML=`<div class="pause-filters">${['Common','Epic','Frogs'].map(x=>`<button data-filter="${x}" aria-selected="${x===filter}">${x}<small class="guide-discovery-count">${pauseGuide.filter(e=>e[0]===x && guideHasEntry(e[0],e[1])).length}/${pauseGuide.filter(e=>e[0]===x).length}</small></button>`).join('')}</div><div class="pause-guide-entries">`+entries.slice(pauseGuidePage*perPage,(pauseGuidePage+1)*perPage).map(([category,name,desc])=>{const known=guideHasEntry(category,name);return `<article class="pause-row${known?'':' guide-undiscovered'}">${pauseIcon(name)}<div><strong>${known?pauseEscape(name):'???'}</strong><p>${known?pauseEscape(desc):'Not discovered yet.'}</p></div></article>`;}).join('')+`</div><nav class="pause-pages" aria-label="Guide pages"><button data-page="-1" ${pauseGuidePage===0?'disabled':''}>Prev</button><span>${pauseGuidePage+1} / ${pages}</span><button data-page="1" ${pauseGuidePage===pages-1?'disabled':''}>Next</button></nav>`;
      pauseMenu.querySelector('.guide-category-slot').appendChild(content.querySelector('.pause-filters'));
      pauseMenu.querySelector('.guide-pagination-slot').appendChild(content.querySelector('.pause-pages'));
      return;
    }
    const instantIds=new Set(['wildCompany','greedyHand','roleDraft','epicOrbStorm','spawn20','bullRecruits','magnetRecruits','poisonRecruits','luckyRoll','pairOfScissors','tidalWave','promotionEpic','frogScatter']);
    const current=runUpgradeLog.filter(x=>!instantIds.has(x.id) && !(x.id==='secondWind' && secondWindUsed) && !(x.id==='bruisedEgg' && ![snake,...extraSnakes].some(s=>s?.snakeEggProtected)));
    content.innerHTML= `
<div class="summary-name"><div class="summary-editor"><input id="pauseTagInput" aria-label="Your name on the board" maxlength="12" value="${pauseEscape(getSavedPlayerTag() || getSavedDashboardTag() || '')}" placeholder="Your name on the board"><button id="pauseTagSaveBtn">Save</button></div><p id="pauseTagMsg" role="status" aria-live="polite"></p></div>
      
      <p class="identity-best">Personal best <b id="pausePersonalBest">${menuPersonalBest(Math.floor(score)).toLocaleString()}</b></p><div class="summary-score"><strong>${Math.floor(score).toLocaleString()}</strong><span>Current score</span></div>
      <div class="summary-details"><span><b>${formatLeaderboardTime(elapsedTime)}</b> survived</span><span><b>${totalOrbsCollected || 0}</b> orbs</span><span><b>${snakeShedCount}</b> sheds</span></div>
      <section class="run-upgrades"></section>`;
    renderRunUpgrades(content.querySelector('.run-upgrades'),current);
    content.querySelector('.run-upgrades>label').textContent="Current upgrades";
    setupPlayerHeading(content,'pauseTagInput');
    const input=content.querySelector('#pauseTagInput'),save=content.querySelector('#pauseTagSaveBtn'),msg=content.querySelector('#pauseTagMsg');
    save.onclick=async()=>{
      const validation=validateDashboardTag(input.value);
      if(!validation.ok){AudioMod.playSaveResult?.(false);msg.textContent=validation.message;return;}
      save.disabled=true;msg.textContent='Saving…';
      try{
        // Rename using the saved best record, never submit the unfinished run.
        const best=await getMyDashboardBestFromLeaderboard();
        const result=await submitScoreToServer(best?.bestRun || 0,best?.bestTime || 0,null,validation.tag);
        if(!result || result._error){AudioMod.playSaveResult?.(false);msg.textContent=result?.error==='tag_taken'?'That name is already taken.':(result?.message || 'Could not save. Try again.');return;}
        await saveDashboardTag(validation.tag);
        if(window.FrogGameLeaderboard?._lastMyEntry)window.FrogGameLeaderboard._lastMyEntry.tag=validation.tag;
        msg.textContent='';input.closest('.summary-name').finishNameEdit(validation.tag);
        AudioMod.playSaveResult?.(true);
      }catch(e){AudioMod.playSaveResult?.(false);msg.textContent='Connection error. Try again.';}
      finally{save.disabled=false;}
    };
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();if(!save.disabled)save.click();}});


  }
  function openPauseMenu() {
    if(gameOver || mainMenuActive || summaryPending) return;
    ensurePauseMenu();if(pauseMenu.style.display==='flex')return;
    pauseWasAlreadyPaused=gamePaused;gamePaused=true;
    AudioMod.setShedAudioActive?.(false);
    pauseUpgradePage=0;renderPauseContent();pauseMenu.style.display='flex';
    pauseMenu.querySelector('[data-action="resume"]').focus();
    getMyDashboardBestFromLeaderboard().then(best=>{
      const label=pauseMenu?.querySelector('#pausePersonalBest');
      if(label) label.textContent=menuPersonalBest(Math.floor(score),best?.bestRun).toLocaleString();
    }).catch(()=>{});

  }
  function closePauseMenu() {
    if(!pauseMenu || pauseMenu.style.display!=='flex')return;
    pauseMenu.style.display='none';
    if(fieldGuideFromHelp){
      fieldGuideFromHelp=false;
      openAnimatedOverlay(howToOverlay);
      document.getElementById('howToFieldGuideBtn')?.focus();
      return;
    }
    gamePaused=pauseWasAlreadyPaused;btnEnd.focus();
  }


  function showGameOver() {
    gameOverBanner.style.display = "block";
  }

  function hideGameOver() {
    gameOverBanner.style.display = "none";
  }

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------
function initEndGameSummaryOverlay() {
  if (endGameSummaryOverlay) return;

  endGameSummaryOverlay = document.createElement("div");
  endGameSummaryOverlay.id = "endGameSummaryOverlay";
  endGameSummaryOverlay.className = "frog-overlay";
  endGameSummaryOverlay.style.zIndex = "1400";
  endGameSummaryOverlay.style.background = "rgba(0,0,0,0.18)";
  endGameSummaryOverlay.innerHTML = `<section class="sm-panel"><div id="endGameSummaryContent"></div><div class="sm-actions"><button id="endSummaryPlayAgainBtn" class="sm-primary">Play again</button><button id="endSummaryMenuBtn">Main menu</button></div></section>`;
  container.appendChild(endGameSummaryOverlay);

  document.addEventListener("keydown", (e) => {
    if (
      endGameSummaryOverlay &&
      endGameSummaryOverlay.style.display === "flex" &&
      e.key === "Escape"
    ) {
      hideEndGameSummaryOverlay();
    }
  });

  const dashboardBtn = document.getElementById("endSummaryDashboardBtn");
  const playAgainBtn = document.getElementById("endSummaryPlayAgainBtn");
  const menuBtn = document.getElementById("endSummaryMenuBtn");

  if (dashboardBtn) {
    dashboardBtn.addEventListener("click", () => {
      hideEndGameSummaryOverlay();
      showDashboardOverlay();
    });
  }

  if (playAgainBtn) {
    playAgainBtn.addEventListener("click", () => {
      hideEndGameSummaryOverlay();
      startNewRun();
    });
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      hideEndGameSummaryOverlay();
      showMainMenu();
    });
  }
}

function hideEndGameSummaryOverlay() {
  if (endGameSummaryOverlay) {
    closeAnimatedOverlay(endGameSummaryOverlay);
  }
}

function showEndGameSummaryOverlay(cachedLeaderboard, submitError) {
  if (!endGameSummaryOverlay) initEndGameSummaryOverlay();
  if (!endGameSummaryOverlay) return;

  const content = document.getElementById("endGameSummaryContent");
  if (!content) return;

  const run = latestCompletedRun || {
    score: Math.floor(Number(lastRunScore) || 0),
    time: Number(lastRunTime) || 0,
    orbs: Number(totalOrbsCollected) || 0,
    frogsLost: Math.max(0, Number(totalFrogsSpawned) || 0),
    sheds: Number(snakeShedCount) || 0
  };

  let activePlayerTag = getSavedPlayerTag ? getSavedPlayerTag() : null;
  const localStats = loadDashboardStats();
  const currentTag = getSavedDashboardTag() || "";

  let rankIdx = -1;
  let leaderboardBest = { bestRun: 0, bestTime: 0, found: false };
  const list = Array.isArray(cachedLeaderboard) ? cachedLeaderboard : [];

  const myEntry = window.FrogGameLeaderboard && window.FrogGameLeaderboard._lastMyEntry
    ? window.FrogGameLeaderboard._lastMyEntry : null;

  if (myEntry && myEntry.userId) {
    rankIdx = list.findIndex(e => e && e.userId === myEntry.userId);
  }
  if (rankIdx === -1 && activePlayerTag) {
    rankIdx = list.findIndex(e =>
      typeof e?.tag === "string" &&
      e.tag.trim().toLowerCase() === activePlayerTag.trim().toLowerCase()
    );
  }
  if (rankIdx !== -1) {
    const match = list[rankIdx];
    leaderboardBest = {
      bestRun: Math.floor(Number(match.bestScore ?? match.score ?? 0)),
      bestTime: Number(match.bestTime ?? match.time ?? 0),
      found: true
    };
  }

  // Build leaderboard preview — show up to 5 entries, always including the player's row
  const previewCount = 5;
  const previewList = list.slice(0, previewCount);
  // If player is ranked but outside top 5, swap last entry for player's row
  if (rankIdx >= previewCount) {
    previewList[previewCount - 1] = list[rankIdx];
  }

  function leaderboardRowDisplayName(entry, rank) {
    const raw =
      typeof entry?.tag === "string" && entry.tag.trim()
        ? entry.tag.trim()
        : "";
    if (raw && raw.toLowerCase() !== "frog") return raw;
    if (typeof entry?.name === "string" && entry.name.trim()) {
      return entry.name.trim();
    }
    const cfg = window.FrogGameConfig;
    if (cfg && typeof cfg.leaderboardPlaceholderName === "function") {
      return cfg.leaderboardPlaceholderName(entry, rank);
    }
    return `Player ${rank}`;
  }

  const lbRowsHtml = previewList.map((entry, i) => {
    const rank = rankIdx >= previewCount && i === previewCount - 1
      ? rankIdx + 1
      : i + 1;
    const name = leaderboardRowDisplayName(entry, rank);
    const entryScore = Math.floor(Number(entry?.bestScore ?? entry?.score ?? 0));
    const entryTime = formatLeaderboardTime(Number(entry?.bestTime ?? entry?.time ?? 0));
    const isMe = myEntry && entry && myEntry.userId && entry.userId === myEntry.userId
      ? true
      : activePlayerTag && typeof entry?.tag === "string" &&
        entry.tag.trim().toLowerCase() === activePlayerTag.trim().toLowerCase();

    return `
      <li style="
        font-size:13px;
        margin-bottom:5px;
        line-height:1.6;
        color:${isMe ? "#bef264" : "#f5f5f4"};
        display:flex;
        gap:10px;
        align-items:baseline;
        border-bottom:0px solid #292524;
        padding-bottom:5px;
      ">
        <span style="min-width:28px;font-size:12px;font-weight:bold;color:${isMe ? "#a3e635" : rank <= 3 ? "#a3e635" : "#a8a29e"};">#${rank}</span>
        <span style="flex:1;font-weight:bold;">${name}</span>
        <span style="color:#a8a29e;font-size:12px;">${entryTime}</span>
        <span style="font-size:12px;min-width:60px;text-align:right;color:${isMe ? "#bef264" : "#f5f5f4"};">${entryScore.toLocaleString()}</span>
      </li>
    `;
  }).join("");

  const rankHtml = rankIdx !== -1
    ? ` · <span style="color:#a3e635;">#${rankIdx + 1} ranked</span>`
    : "";

  const bestHtml = leaderboardBest.found
    ? `<li style="font-size:13px;line-height:1.6;color:#bef264;font-weight:bold;">
        ${leaderboardBest.bestRun.toLocaleString()} score · ${formatLeaderboardTime(leaderboardBest.bestTime)}${rankHtml}
      </li>`
    : `<li style="font-size:13px;line-height:1.6;color:#f5f5f4;">No leaderboard entry yet.</li>`;

  content.innerHTML = `
<div class="summary-name"><div class="summary-editor"><input aria-label="Your name on the board" id="endSummaryTagInput" maxlength="12" value="${pauseEscape(currentTag)}" placeholder="Your name on the board"><button id="endSummaryTagSaveBtn">Save</button></div><p id="endSummaryTagMsg" aria-live="polite"></p></div>
 
 <p class="identity-best">Personal best <b>${menuPersonalBest(run.score,leaderboardBest.bestRun).toLocaleString()}</b></p><div class="summary-score"><strong>${Math.floor(run.score || 0).toLocaleString()}</strong><span>Final score</span></div>
 <div class="summary-details"><span><b>${formatLeaderboardTime(run.time || 0)}</b> survived</span><span><b>${run.orbs || 0}</b> orbs</span><span><b>${run.sheds || 0}</b> sheds</span></div>
 <section class="run-upgrades"></section>`;
  renderRunUpgrades(content.querySelector('.run-upgrades'),runUpgradeLog.map(x=>({...x})));
  openAnimatedOverlay(endGameSummaryOverlay);

  setupPlayerHeading(content,'endSummaryTagInput');
  const tagInput = document.getElementById("endSummaryTagInput");
  const tagSaveBtn = document.getElementById("endSummaryTagSaveBtn");
  const tagMsg = document.getElementById("endSummaryTagMsg");

  if (submitError && tagMsg && !currentTag) {
    tagMsg.textContent = "Couldn't reach the leaderboard, so no tag was assigned. Check your connection and try again next run, or set one yourself above.";
    tagMsg.style.color = "#fca5a5";
  }

  if (tagSaveBtn && tagInput) {
    tagSaveBtn.addEventListener("click", async () => {
      const validation = validateDashboardTag(tagInput.value);
      if (!validation.ok) {
        AudioMod.playSaveResult?.(false);
        if (tagMsg) { tagMsg.textContent = validation.message; tagMsg.style.color = "#fca5a5"; }
        return;
      }
      const newTag = validation.tag;
      try {
        const result = await submitScoreToServer(
          Math.floor(run.score || 0),
          run.time || 0,
          null,
          newTag
        );
        if (!result || result._error) {
          AudioMod.playSaveResult?.(false);
          const msg = result?.error === "tag_taken"
            ? "That tag is already taken — try another."
            : (result?.message || "Could not save tag. Try again.");
          if (tagMsg) { tagMsg.textContent = msg; tagMsg.style.color = "#fca5a5"; }
          return;
        }
        await saveDashboardTag(newTag);
        AudioMod.playSaveResult?.(true);
        activePlayerTag = newTag;
        if (myEntry) myEntry.tag = newTag;
        if (tagMsg) tagMsg.textContent = "";
        tagInput.closest(".summary-name").finishNameEdit(newTag);
        try {
          const refreshed = await fetchLeaderboard();
          updateMiniLeaderboard(refreshed);
        } catch (_) { /* Name saved; leaderboard refresh is optional. */ }
      } catch (e) {
        AudioMod.playSaveResult?.(false);
        if (tagMsg) { tagMsg.textContent = "Connection error. Try again."; tagMsg.style.color = "#fca5a5"; }
      }
    });
  }
}
function clampLuck(value) {
  return Math.max(0, Math.min(MAX_LUCK, Math.floor(value || 0)));
}

function addLuck(amount) {
  luckStat = clampLuck(luckStat + amount);
}

function getLuckBuffDurationMultiplier() {
  // +1% buff duration per luck, capped by MAX_LUCK
  return 1 + (luckStat * 0.01);
}

function getLuckChanceBonus(baseChance, multiplier = 1) {
  // Each 10 luck adds 10% of the base chance, not 10 percentage points.
  return baseChance * clampLuck(luckStat) * 0.01 * multiplier;
}

function getLuckBoostedChance(baseChance, maxChance = 0.95, multiplier = 1) {
  return Math.max(0, Math.min(maxChance, baseChance + getLuckChanceBonus(baseChance, multiplier)));
}

function getLuckBiasedInt(min, max) {
  if (max <= min) return min;

  const span = max - min;
  const luckWeight = Math.min(0.75, luckStat / MAX_LUCK * 0.75);

  const roll = Math.random();
  // Blend toward the better of two rolls: Luck can improve a reward, never lower it.
  const betterRoll = Math.max(roll, Math.random());
  const biased = roll + (betterRoll - roll) * luckWeight;

  return min + Math.round(biased * span);
}
const SNAKE_SKIN_STORAGE_KEY = "frogSnake_selectedSnakeSkin";

  const SNAKE_SKINS = [
    {
      id: "default",
      label: "Classic",
      head: "./game-assets/images/head.png",
      body: "./game-assets/images/body.png",
      tail: "./game-assets/images/tail.png",
      requiredLevel: 1
    },
    {
      id: "alt",
      label: "Serpent",
      head: "./game-assets/images/head2.png",
      body: "./game-assets/images/body2.png",
      tail: "./game-assets/images/tail2.png",
      requiredLevel: 5
    },
    {
      id: "alt2",
      label: "Shadow",
      head: "./game-assets/images/head3.png",
      body: "./game-assets/images/body3.png",
      tail: "./game-assets/images/tail3.png",
      requiredLevel: 10
    }
  ];

  function getSelectedSnakeSkinId() {
    try {
      const saved = localStorage.getItem(SNAKE_SKIN_STORAGE_KEY);
      if (saved && SNAKE_SKINS.find(s => s.id === saved)) return saved;
    } catch (e) {}
    return "default";
  }

  function saveSelectedSnakeSkinId(id) {
    try {
      localStorage.setItem(SNAKE_SKIN_STORAGE_KEY, id);
    } catch (e) {}
  }

  function getPlayerSnakeSpriteSet() {
    const skinId = getSelectedSnakeSkinId();
    const skin = SNAKE_SKINS.find(s => s.id === skinId) || SNAKE_SKINS[0];
    return { head: skin.head, body: skin.body, tail: skin.tail };
  }

  function isUsingAltSnakeSprites() {
    return getSelectedSnakeSkinId() !== "default";
  }

function applySnakeSpriteSet(targetSnake) {
  if (!targetSnake) return;

  const sprites = getPlayerSnakeSpriteSet();

  if (targetSnake.head?.el) {
    targetSnake.head.el.style.backgroundImage = `url(${sprites.head})`;
  }

  if (Array.isArray(targetSnake.segments)) {
    for (let i = 0; i < targetSnake.segments.length; i++) {
      const seg = targetSnake.segments[i];
      if (!seg?.el) continue;

      const isTail = i === targetSnake.segments.length - 1;
      seg.el.style.backgroundImage = isTail
        ? `url(${sprites.tail})`
        : `url(${sprites.body})`;
    }
  }
}
  function ensureFrogBg() {
    let bg = document.getElementById("frog-bg");
    if (bg) return bg;

    bg = document.createElement("div");
    bg.id = "frog-bg";
    container.prepend(bg);
    return bg;
  }

  function ensureGrassField() {
    const bg = ensureFrogBg();

    let grassField = bg.querySelector(".grass-field");
    if (!grassField) {
      grassField = document.createElement("div");
      grassField.className = "grass-field";
      bg.appendChild(grassField);
    }

    return grassField;
  }

function makeBackgroundGrass(x, y, scale = 1) {
  const grassField = ensureGrassField();
  if (!grassField) return;

  const tuft = document.createElement("div");
  const variant = 1 + Math.floor(Math.random() * 4);
  tuft.className = `grass variant-${variant}`;
  tuft.style.left = `${x}px`;
  tuft.style.top = `${y}px`;
  tuft.style.transform = `scale(${scale})`;
  tuft.style.animationDuration = `${2.5 + Math.random() * 2.5}s`;

  const b1 = document.createElement("div");
  b1.className = "blade b1";

  const b2 = document.createElement("div");
  b2.className = "blade b2";

  const b3 = document.createElement("div");
  b3.className = "blade b3";

  const b4 = document.createElement("div");
  b4.className = "blade b4";

  tuft.append(b1, b2, b3, b4);

  const extra = Math.random();
  if (extra < 0.10) {
    const flower = document.createElement("div");
    flower.className = "flower";
    tuft.appendChild(flower);
  } else if (extra < 0.16) {
    const rock = document.createElement("div");
    rock.className = "rock";
    tuft.appendChild(rock);
  }

  grassField.appendChild(tuft);
}

function seedMatchGrass() {
  const grassField = ensureGrassField();
  if (!grassField) return;

  grassField.innerHTML = "";

  const count = Math.floor((window.innerWidth * window.innerHeight) / 24000);

  for (let i = 0; i < count; i++) {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    const scale = 0.8 + Math.random() * 0.55;
    makeBackgroundGrass(x, y, scale);
  }
}
// A short visual interlude: world timers and collisions wait until it finishes.
let shedSequence = null;
function clearShedSequence() {
  AudioMod.setShedAudioActive?.(false);
  if (!shedSequence) return;
  for (const part of shedSequence.parts) {
    part.el.style.transform = part.transform;
    part.el.style.filter = part.filter;
    part.skin.remove();
  }
  shedSequence = null;
}
function beginShedSequence(cycle) {
  if (!snake || !snake.head || shedSequence || cycle > 2) return;
  const nodes = [snake.head, ...snake.segments];
  const points = nodes.map(n => ({x:n.x,y:n.y}));
  let length = 0;
  const distances = points.map((point,i) => { if(i) length += Math.hypot(point.x-points[i-1].x,point.y-points[i-1].y); return length; });
  const angle = snake.head.angle || 0;
  const dx = Math.cos(angle), dy = Math.sin(angle);
  let travel = 80;
  if(dx>0) travel=Math.min(travel,(window.innerWidth-SNAKE_SEGMENT_SIZE-points[0].x)/dx);
  if(dx<0) travel=Math.min(travel,(8-points[0].x)/dx);
  if(dy>0) travel=Math.min(travel,(window.innerHeight-SNAKE_SEGMENT_SIZE-points[0].y)/dy);
  if(dy<0) travel=Math.min(travel,(8-points[0].y)/dy);
  travel=Math.max(0,travel);
  function sample(distance) {
    if(distance<=0)return {x:points[0].x-dx*distance,y:points[0].y-dy*distance};
    for(let i=1;i<points.length;i++) if(distance<=distances[i]) {
      const f=(distance-distances[i-1])/Math.max(.001,distances[i]-distances[i-1]);
      return {x:points[i-1].x+(points[i].x-points[i-1].x)*f,y:points[i-1].y+(points[i].y-points[i-1].y)*f};
    }
    return points[points.length-1];
  }
  const elements = nodes.map(n=>n.el);
  const parts = elements.map(el => {
    const skin = el.cloneNode(true);
    skin.removeAttribute("id");
    skin.style.pointerEvents = "none";
    skin.style.filter = "grayscale(1) sepia(0.5) brightness(1.2) contrast(1.3)";
    skin.style.opacity = "0";
    skin.style.zIndex = "28";
    skin.setAttribute("aria-hidden", "true");
    container.appendChild(skin);
    return {el, skin, transform: el.style.transform, filter: el.style.filter};
  });
  shedSequence = {parts, nodes, points, distances, sample, travel, dx, dy, cycle, time:0, reduced:window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches};
}
function updateShedSequence(dt) {
  const seq = shedSequence;
  if (!seq) return;
  seq.time += dt;
  // Hold discrete poses at 12 fps, like the game's low-resolution sprites.
  const frameTime = Math.floor(seq.time * 12) / 12;
  const t = Math.min(1, frameTime / 5);
  const emerge = Math.max(0, Math.min(1, (t - 0.2) / 0.55));
  seq.parts.forEach((part, i) => {
    const position = i / Math.max(1, seq.parts.length - 1);
    const wave = Math.sin(t * Math.PI * 10 - position * 7);
    const progress = Math.max(0,Math.min(1,(t-.12)/.7));
    // Short forward pulls with a tiny recovery hold, rather than a smooth glide.
    const pull = progress * 6;
    const pullPhase = pull - Math.floor(pull);
    const advance = Math.min(1,(Math.floor(pull)+Math.min(1,pullPhase/.7))/6)*seq.travel;
    const point = seq.sample(seq.distances[i]-advance);
    const wriggle = seq.reduced ? 0 : wave*5*Math.sin(Math.PI*progress);
    const x = Math.round((point.x-seq.points[i].x-seq.dy*wriggle)/2)*2;
    const y = Math.round((point.y-seq.points[i].y+seq.dx*wriggle)/2)*2;
    part.finalPoint=point;
    part.finalTransform=`translate(${Math.round(point.x-seq.points[i].x)}px, ${Math.round(point.y-seq.points[i].y)}px) ${part.transform}`;
    part.el.style.transform = `translate(${x}px, ${y}px) ${part.transform}`;
    if (emerge >= position) { setShedPalette(part.el, seq.cycle); part.el.style.filter = ""; }
    // Solid discarded skin, then irregular stair-step tears. No translucent dissolve.
    const crumble = Math.max(0, Math.min(1, (t - .74 - (i % 3)*.025) / .18));
    part.skin.style.opacity = t < .12 || crumble >= 1 ? "0" : "1";
    const cut = Math.floor(crumble * 5) * 20;
    const notch = Math.min(100,cut+20);
    part.skin.style.clipPath = crumble > 0 ? `polygon(0 ${cut}%,20% ${cut}%,20% ${notch}%,40% ${notch}%,40% ${cut}%,60% ${cut}%,60% ${notch}%,80% ${notch}%,80% ${cut}%,100% ${cut}%,100% 100%,0 100%)` : "";
    part.skin.style.transform = `translate(${(i % 2 ? -1 : 1) * Math.floor(crumble * 3) * 2}px, ${Math.floor(crumble * 4) * 2}px) ${part.transform}`;
  });
  if (t >= 1) {
    const cycle = seq.cycle;
    seq.parts.forEach((part,i)=>{seq.nodes[i].x=part.finalPoint.x;seq.nodes[i].y=part.finalPoint.y;part.transform=part.finalTransform;});
    let pathDistance=0;
    const oldPath=snake.path;
    snake.path=oldPath.map((point,i)=>{
      if(i)pathDistance+=Math.hypot(point.x-oldPath[i-1].x,point.y-oldPath[i-1].y);
      return seq.sample(pathDistance-seq.travel);
    });
    clearShedSequence();
    snakeShed(cycle);

  }
}
function snakeShed(stage) {
    if (!snake) return;

    const oldSnake = snake;
    const oldHeadEl = oldSnake.head && oldSnake.head.el ? oldSnake.head.el : null;
    const oldSegmentEls = Array.isArray(oldSnake.segments)
      ? oldSnake.segments.map(seg => seg.el).filter(Boolean)
      : [];

    // The interlude has finished displaying the empty skin.
    if (oldHeadEl) oldHeadEl.remove();
    oldSegmentEls.forEach(el => el.remove());

    // Speed & Stage Logic
    let speedMult = oldSnake.snakeEggProtected ? 1 + (SNAKE_SHED_SPEEDUP - 1) * 0.75 : SNAKE_SHED_SPEEDUP;
    if (snakeEggPending) {
      speedMult = SNAKE_EGG_BUFF_PCT;
      snakeEggPending = false;
    }

    const baseSpeedFactor = oldSnake.speedFactor || 1.0;
    const newSpeedFactor = baseSpeedFactor * speedMult;
    snakePermanentSpeedFactor = newSpeedFactor;

    snakeTurnRate = Math.min(SNAKE_TURN_RATE_CAP, snakeTurnRate * 1.35); // Increased from 1.2
    snakeShedStage = stage;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const startX = oldSnake.head ? oldSnake.head.x : width * 0.15;
    const startY = oldSnake.head ? oldSnake.head.y : height * 0.5;

    // Segment Count Logic
    let newSegCount = Math.round((oldSegmentEls.length || SNAKE_INITIAL_SEGMENTS) / 2);
    if (newSegCount < SNAKE_INITIAL_SEGMENTS) newSegCount = SNAKE_INITIAL_SEGMENTS;
    if (newSegCount > 50) newSegCount = 50;

    // Create New Head
    const headEl = document.createElement("div");
    headEl.className = "snake-head";
    headEl.style.position = "absolute";
    headEl.style.width = SNAKE_SEGMENT_SIZE + "px";
    headEl.style.height = SNAKE_SEGMENT_SIZE + "px";
    headEl.style.imageRendering = "pixelated";
    headEl.style.backgroundSize = "contain";
    headEl.style.backgroundRepeat = "no-repeat";
    headEl.style.zIndex = "30";
    const snakeSprites = getPlayerSnakeSpriteSet();
    headEl.style.backgroundImage = `url(${snakeSprites.head})`;
    container.appendChild(headEl);

    // Create New Segments
    const segments = [];
    for (let i = 0; i < newSegCount; i++) {
      const segEl = document.createElement("div");
      const isTail = (i === newSegCount - 1);
      segEl.className = isTail ? "snake-tail" : "snake-body";
      segEl.style.position = "absolute";
      segEl.style.width = SNAKE_SEGMENT_SIZE + "px";
      segEl.style.height = SNAKE_SEGMENT_SIZE + "px";
      segEl.style.imageRendering = "pixelated";
      segEl.style.backgroundSize = "contain";
      segEl.style.zIndex = "29";
      segEl.style.backgroundImage = isTail
        ? `url(${snakeSprites.tail})`
        : `url(${snakeSprites.body})`;
      container.appendChild(segEl);
      const oldPart = oldSnake.segments[i];
      if (oldPart) segEl.style.transform = oldPart.el.style.transform;
      segments.push({ el: segEl, x: oldPart ? oldPart.x : startX, y: oldPart ? oldPart.y : startY });
    }

    // --- 🚨 THE FIX: PATH PRE-FILLING 🚨 ---
    const path = (oldSnake.path || []).map(point => ({...point}));
    headEl.style.transform = oldHeadEl ? oldHeadEl.style.transform : "";
    const segmentGap = computeSegmentGap();
    // We need enough points in the path for every segment to have a unique index
    const requiredPathLength = (newSegCount + 5) * segmentGap; 
    
    for (let i = path.length; i < requiredPathLength; i++) {
      path.push(path.length ? {...path[path.length - 1]} : { x: startX, y: startY });
    }

    snake = {
      head: { el: headEl, x: startX, y: startY, angle: oldSnake.head ? oldSnake.head.angle : 0 },
      segments,
      path,
      snakeEggProtected: !!oldSnake.snakeEggProtected,
      scissorsOwner: !!oldSnake.scissorsOwner,
      shedStage: stage,
      speedFactor: newSpeedFactor,
      canGrow: true
    };

    applySnakeAppearance();

    // The cut snake reclaims its own body at the next milestone.
    startScissorsRemnantChase(snake);

    if (graveWaveActive) {
      spawnExtraFrogs(getLuckBiasedInt(7, 15));
    }

    if (moltFortuneActive) {
      const orbCount = getLuckBiasedInt(5, 10);
      for (let i = 0; i < orbCount; i++) {
        spawnOrbRandom(width, height);
      }
    }
  }
  function startScissorsRemnantChase(owner) {
    if (!owner?.scissorsOwner || scissorsRemnantSegments.length === 0 || snakeEatingOldBody) return;
    owner.canGrow = true;
    snakeEatingOldBody = true;
    snakeOldBodySpeedBonusPending = true;
    snakeOldBodyChaseTime = 0;
  }
  function handleFourthShed() {
    const width  = window.innerWidth;
    const height = window.innerHeight;

    // Create a brand-new fresh snake
    const newSnake = spawnAdditionalSnake(width, height);
    if (!newSnake) return;

    // A red snake does not molt again, but must still reclaim its Scissors tail.
    // Arm the owner before the new green snake becomes primary.
    startScissorsRemnantChase(snake);
    // Demote the current primary snake into the extras array (if it exists)
    if (snake) {
      extraSnakes.push(snake);
    }

    // New snake becomes the primary one that will shed from now on
    snake = newSnake;

    // This new primary should start like the very first snake:
    // - base shed stage (no color tint)
    // - base speed & turn rate
    snakeShedStage = 0;
    snake.speedFactor = 1.0;
    snakePermanentSpeedFactor = 1.0;
    snakeTurnRate = SNAKE_TURN_RATE_BASE;

    // Apply appearance for stage 0 (original art, no tint)
    applySnakeAppearance();
  }

  function updateDyingSnakes(dt) {
    // Walk backwards so we can safely splice as things fully disappear
    for (let i = dyingSnakes.length - 1; i >= 0; i--) {
      const ds = dyingSnakes[i];

      // Countdown to the next piece disappearing
      ds.nextDespawnTime -= dt;

      if (ds.nextDespawnTime <= 0) {
        // Independently roll the next drop. between chunks
        ds.nextDespawnTime = 0.08; // ~12–13 segments per second

        // 1) Remove one body segment at a time
        if (ds.segmentEls && ds.segmentEls.length > 0) {
          const segEl = ds.segmentEls.pop();
          if (segEl && segEl.parentNode === container) {
            container.removeChild(segEl);
          }
        }
        // 2) Once all segments are gone, remove the head
        else if (ds.headEl) {
          if (ds.headEl.parentNode === container) {
            container.removeChild(ds.headEl);
          }
          ds.headEl = null;
        }
        // 3) When nothing is left, drop this dying snake entry
        else {
          dyingSnakes.splice(i, 1);
        }
      }
    }
  }

  // --------------------------------------------------
  // METADATA + LAYERS (MATCHES SCATTER FROGS)
  // --------------------------------------------------
  async function fetchMetadata(tokenId) {
    const url = `${META_BASE}${tokenId}${META_EXT}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Metadata fetch failed for " + tokenId);
    return res.json();
  }

  async function loadTraitImage(traitType, value) {
    const v = String(value);
    const pngUrl = `${BUILD_BASE}/${traitType}/${v}.png`;
    const canAnimate = SCATTER_ANIMATED_VALUES.has(v);

    return new Promise((resolve) => {
      if (!canAnimate) {
        const png = new Image();
        png.decoding = "async";
        png.onload = () => resolve(png);
        png.onerror = () => resolve(null);
        png.src = pngUrl;
        return;
      }

      const gifUrl = `${BUILD_BASE}/${traitType}/animations/${v}_animation.gif`;
      const gif = new Image();
      gif.decoding = "async";
      gif.onload = () => resolve(gif);
      gif.onerror = () => {
        const png = new Image();
        png.decoding = "async";
        png.onload = () => resolve(png);
        png.onerror = () => resolve(null);
        png.src = pngUrl;
      };
      gif.src = gifUrl;
    });
  }

  async function buildLayersForFrog(frog, meta) {
    frog.el.innerHTML = "";

    const baseImg = document.createElement("img");
    baseImg.className = "frog-sprite-base";
    baseImg.src = frog.spriteSrc;
    baseImg.alt = "";

    const skinImg = document.createElement("img");
    skinImg.className = "frog-sprite-skin";
    skinImg.src = frog.skinSrc;
    skinImg.alt = "";

    frog.el.appendChild(baseImg);
    frog.el.appendChild(skinImg);

    frog.baseImg = baseImg;
    frog.skinImg = skinImg;

    frog.layers = [];

    const attrs = Array.isArray(meta.attributes) ? meta.attributes : [];
    for (const attr of attrs) {
      const traitType = attr.trait_type;
      const value = attr.value;
      if (!traitType || typeof value === "undefined") continue;
      if (SKIP_TRAITS.has(traitType)) continue;

      const img = await loadTraitImage(traitType, value);
      if (!img) continue;

      img.alt = "";
      img.style.position = "absolute";
      img.style.inset = "0";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.imageRendering = "pixelated";

      frog.layers.push(img);
      frog.el.appendChild(img);
    }

    // Re-apply glow + emoji badge that may have been cleared
    refreshFrogPermaGlow(frog);
    updateFrogRoleEmoji(frog);
  }

  // --------------------------------------------------
  // FROG CREATION (KEEPING ORIGINAL HOP FEEL)
  // --------------------------------------------------
function refreshFrogPermaGlow(frog) {
  if (!frog || !frog.el) return;
  frog.el.style.boxShadow = "none";
}
function assignSwarmDivideLanes() {
  if (!Array.isArray(frogs) || !frogs.length) return;

  for (let i = 0; i < frogs.length; i++) {
    const frog = frogs[i];
    if (!frog) continue;
    frog.swarmDivideLane = (i % 2 === 0) ? -1 : 1;
  }
}
function createFrogAt(x, y, tokenId) {
  const el = document.createElement("div");
  el.className = "frog-sprite"; el.dataset.pocketColor=Math.floor(Math.random()*8);
  el.style.position = "absolute";
  el.style.width = FROG_SIZE + "px";
  el.style.height = FROG_SIZE + "px";
  el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  el.style.pointerEvents = "none";
  el.style.zIndex = "10";
  container.appendChild(el);

  const personalityRoll = Math.random();
  let idleMin, idleMax, hopMin, hopMax, heightMin, heightMax;

  if (personalityRoll < 0.25) {
    idleMin = 0.3; idleMax = 1.0;
    hopMin = 0.25; hopMax = 0.50;
    heightMin = 15.4; heightMax = 32;
  } else if (personalityRoll < 0.6) {
    idleMin = 0.8; idleMax = 3.0;
    hopMin = 0.35; hopMax = 0.63;
    heightMin = 11; heightMax = 26;
  } else {
    idleMin = 1.4; idleMax = 3.2;
    hopMin = 0.35; hopMax = 0.63;
    heightMin = 11; heightMax = 24;
  }

  const cosmetics = rollFrogCosmetics();

  const frog = {
    tokenId,
    el,
    x,
    y,
    baseY: y,

    hopStartX: x,
    hopStartBaseY: y,
    hopEndX: x,
    hopEndBaseY: y,

    swarmDivideLane: 0,

    state: "idle",
    idleTime: randRange(idleMin, idleMax),
    hopTime: 0,
    hopDuration: randRange(hopMin, hopMax),
    hopHeight: randRange(heightMin, heightMax),

    idleMin,
    idleMax,
    hopDurMin: hopMin,
    hopDurMax: hopMax,
    hopHeightMin: heightMin,
    hopHeightMax: heightMax,

    starLevel: 0,
    spriteSrc: getRandomFrogSprite(),
    skinSrc: getRandomFrogSkin(),
    eyesSrc: cosmetics.eyesSrc,
    hatSrc: cosmetics.hatSrc,

    // per-frog permanent upgrades
    speedMult: 1.0,
    jumpMult: 1.0,
    isChampion: false,
    isAura: false,
    hasPermaShield: false,
    isMagnet: false,
    isLucky: false,
    isZombie: false,
    isMutationZombie: false,
    mutationZombieDirX: 0,
    mutationZombieDirY: 0,
    mutationZombieRetargetTime: 0,
    shieldGrantedAt: null,

    specialDeathRattleChance: null,

    isCannibal: false,
    extraDeathRattleChance: 0,
    cannibalIcon: null,

    cloneEl: null,
    layers: []
  };

  frogs.push(frog);
  refreshFrogPermaGlow(frog);

  totalFrogsSpawned++;

  const baseImg = document.createElement("img");
  baseImg.className = "frog-sprite-base";
  baseImg.src = frog.spriteSrc;
  baseImg.alt = "";

  const skinImg = document.createElement("img");
  skinImg.className = "frog-sprite-skin";
  skinImg.src = frog.skinSrc;
  skinImg.alt = "";

  el.appendChild(baseImg);
  el.appendChild(skinImg);

  frog.baseImg = baseImg;
  frog.skinImg = skinImg;

  if (frog.eyesSrc) {
    const eyesImg = document.createElement("img");
    eyesImg.className = "frog-sprite-eyes";
    eyesImg.src = frog.eyesSrc;
    eyesImg.alt = "";
    el.appendChild(eyesImg);
    frog.eyesImg = eyesImg;
  }

  if (frog.hatSrc) {
    const hatImg = document.createElement("img");
    hatImg.className = "frog-sprite-hat";
    hatImg.src = frog.hatSrc;
    hatImg.alt = "";
    el.appendChild(hatImg);
    frog.hatImg = hatImg;
  }

  return frog;
}

  async function createInitialFrogs(width, height) {
    frogs = [];
    const count = Math.min(STARTING_FROGS, maxFrogsCap);
    const positions = computeInitialPositions(width, height, count);

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      createFrogAt(pos.x, pos.y, null);
    }
  }

    function spawnZombieHorde(count) {
    const width  = window.innerWidth;
    const height = window.innerHeight;
    const margin = 16;

    const toSpawn = Math.min(count, maxFrogsCap - frogs.length);
    for (let i = 0; i < toSpawn; i++) {
      const x = margin + Math.random() * (width - margin * 2 - FROG_SIZE);
      const y = margin + Math.random() * (height - margin * 2 - FROG_SIZE);
      const frog = createFrogAt(x, y, null);

      // Mark these as special “Zombie Horde” zombies:
      frog.isZombie = true;
      frog.specialDeathRattleChance = 0.5; // 50% DR just for these guys
      refreshFrogPermaGlow(frog);          // keep your purple glow
    }
  }

  function spawnExtraFrogs(n) {
    if (frogs.length >= maxFrogsCap) return;
    const width  = window.innerWidth;
    const height = window.innerHeight;
    const margin = 16;

    const toSpawn = Math.min(n, maxFrogsCap - frogs.length);
    for (let i = 0; i < toSpawn; i++) {
      const x = margin + Math.random() * (width - margin * 2 - FROG_SIZE);
      const y = margin + Math.random() * (height - margin * 2 - FROG_SIZE);
      createFrogAt(x, y, null);
    }
    if (swarmDivideActive) {
      assignSwarmDivideLanes();
    }
  }

  function spawnFrogPromotion(count) {
    const width  = window.innerWidth;
    const height = window.innerHeight;
    const margin = 16;

    const toSpawn = Math.min(count, maxFrogsCap - frogs.length);
    for (let i = 0; i < toSpawn; i++) {
      const x = margin + Math.random() * (width - margin * 2 - FROG_SIZE);
      const y = margin + Math.random() * (height - margin * 2 - FROG_SIZE);
      const frog = createFrogAt(x, y, null);

      // Give each spawned frog a random permanent role
      grantRandomPermaFrogUpgrade(frog);
      refreshFrogPermaGlow(frog);
      updateFrogRoleEmoji(frog);  // 🔹 ensure the emoji badge shows up
    }
  }

  function markGhostFrog(frog) {
    if (!frog) return;
    frog.isGhost = true;
    // Visual: slightly faded, ghosty look
    frog.el.style.opacity = "0.7";
    frog.el.style.filter = "grayscale(1) brightness(1.2)";
  }

  function spawnGhostWave(count) {
    if (frogs.length >= maxFrogsCap) return;
    const width  = window.innerWidth;
    const height = window.innerHeight;
    const margin = 16;

    const toSpawn = Math.min(count, maxFrogsCap - frogs.length);
    for (let i = 0; i < toSpawn; i++) {
      const x = margin + Math.random() * (width - margin * 2 - FROG_SIZE);
      const y = margin + Math.random() * (height - margin * 2 - FROG_SIZE);
      const frog = createFrogAt(x, y, null);
      markGhostFrog(frog);
    }
  }


  function getSpeedFactor(frog) {
    let factor = frogPermanentSpeedFactor * (frog.speedMult || 1);

    // Aura speed boost (permanent, area-based)
    let auraFactor = 1.0;
    for (const other of frogs) {
      if (!other.isAura) continue;
      const dx = (other.x + FROG_SIZE / 2) - (frog.x + FROG_SIZE / 2);
      const dy = (other.baseY + FROG_SIZE / 2) - (frog.baseY + FROG_SIZE / 2);
      const d2 = dx * dx + dy * dy;
      if (d2 <= AURA_RADIUS2) {
        auraFactor *= AURA_SPEED_FACTOR;
      }
    }
    factor *= auraFactor;

    // -----------------------------
    // TEMP SPEED BUFFS (from orbs)
    // -----------------------------
    // Instead of stacking Speed + Panic Hop, only use the STRONGEST
    // (smallest) temporary speed factor.
    let tempSpeedFactor = 1.0;

    if (speedBuffTime > 0) {
      tempSpeedFactor = Math.min(tempSpeedFactor, SPEED_BUFF_FACTOR);
    }
    if (panicHopTime > 0) {
      tempSpeedFactor = Math.min(tempSpeedFactor, PANIC_HOP_SPEED_FACTOR);
    }

    factor *= tempSpeedFactor;

    // Survival Instinct affects hop duration, not jump height/reach.
    if (survivalInstinctActive && frogs.length < 10) factor *= 0.80;

    // Final hard cap so orbs can't push total speed too far.
    // Remember: smaller factor = faster hops.
    if (factor < MIN_TOTAL_FROG_SPEED_FACTOR) {
      factor = MIN_TOTAL_FROG_SPEED_FACTOR;
    }

    return factor;
  }

  function getJumpFactor(frog) {
    let factor = frogPermanentJumpFactor * (frog.jumpMult || 1);

    // Aura jump boost (perma)
    for (const other of frogs) {
      if (!other.isAura) continue;
      const dx = (other.x + FROG_SIZE / 2) - (frog.x + FROG_SIZE / 2);
      const dy = (other.baseY + FROG_SIZE / 2) - (frog.baseY + FROG_SIZE / 2);
      const d2 = dx * dx + dy * dy;
      if (d2 <= AURA_RADIUS2) {
        factor *= AURA_JUMP_FACTOR;
      }
    }

    // Orb jump buff ("super jump")
    if (jumpBuffTime > 0) {
      factor *= JUMP_BUFF_FACTOR;
    }

    // Final hard cap: permanent + orb jump can't exceed this.
    if (factor > MAX_TOTAL_FROG_JUMP_FACTOR) {
      factor = MAX_TOTAL_FROG_JUMP_FACTOR;
    }

    return factor;
  }

  function getSnakeSpeedFactor(snakeObj) {
    let factor = snakeObj?.speedFactor || snakePermanentSpeedFactor;

    // Population speed bonus: starts above 75 frogs; capped at +0.15 at 100.
    const overcrowdingPenalty = Math.min(0.15, Math.max(0, frogs.length - 75) * 0.006);
    factor += overcrowdingPenalty;

    if (snakeSlowTime > 0 || snakeObj?.fruitSlow > 0) factor *= SNAKE_SLOW_FACTOR;
    if (snakeFrenzyTime > 0) factor *= FRENZY_SPEED_FACTOR;

    return factor;
  }

  const IS_MOBILE = window.matchMedia("(max-device-width: 768px)").matches;
  const BASE_SEGMENT_GAP = IS_MOBILE
    ? Math.max(12, Math.round(SNAKE_SEGMENT_GAP * 0.85))
    : SNAKE_SEGMENT_GAP;

  const SEGMENT_VISUAL_SPACING = Math.round(SNAKE_SEGMENT_SIZE * 0.46 * 0.727985); // px between segment centres — tune this to taste

  function computeSegmentGap() {
    // Still used for path pre-fill length calculations; no longer drives visual spacing.
    return 4;
  }

  function getSnakeEatRadius() {
    return snakeShrinkTime > 0 ? 24 : SNAKE_EAT_RADIUS_BASE;
  }

  function getSnakeResistance() {
    let totalSegments = 0;

    if (snake && Array.isArray(snake.segments)) {
      totalSegments += snake.segments.length;
    }
    if (Array.isArray(extraSnakes) && extraSnakes.length) {
      for (const s of extraSnakes) {
        if (s && Array.isArray(s.segments)) {
          totalSegments += s.segments.length;
        }
      }
    }

    if (totalSegments <= 0) return 0;

    const extraSegments = Math.max(0, totalSegments - SNAKE_INITIAL_SEGMENTS);

    const RESIST_PER_SEGMENT = 0.03;
    const shedBonus = snakeShedCount * 0.04;
    const maxResist = 0.75;

    return Math.max(
      0,
      Math.min(maxResist, extraSegments * RESIST_PER_SEGMENT + shedBonus)
    ) * (brittleScalesActive ? 0.5 : 1);
  }

function getRandomMutationUpgrade() {
  const speedCanImprove = frogPermanentSpeedFactor > MIN_FROG_SPEED_FACTOR + 1e-4;

  if (mutationPicks >= 2 || !speedCanImprove) {
    return null;
  }

  return {
    id: "mutation",
    label: `
      🧬 Mutation<br>
      <span style="color:${TOTAL_HIGHLIGHT_COLOR};">+15%</span> jump speed
      & <span style="color:${TOTAL_HIGHLIGHT_COLOR};">+20%</span> jump height
    `,
    apply: () => {
      applyMutationUpgrade();
    }
  };
}
function applyMutationUpgrade() {
  if (mutationPicks >= 2) return;
  mutationPicks++;
  frogPermanentSpeedFactor *= 0.85; // 15% faster hops
  if (frogPermanentSpeedFactor < MIN_FROG_SPEED_FACTOR) {
    frogPermanentSpeedFactor = MIN_FROG_SPEED_FACTOR;
  }

  frogPermanentJumpFactor *= 1.20; // 20% higher jumps
  if (frogPermanentJumpFactor > MAX_FROG_JUMP_FACTOR) {
    frogPermanentJumpFactor = MAX_FROG_JUMP_FACTOR;
  }
}
function grantAuraFrog(frog) {
  if (frog.isAura) return;
  frog.isAura = true;
  refreshFrogPermaGlow(frog);
  updateFrogRoleEmoji(frog);
  playPerFrogUpgradeSound("aura");
}

function grantShieldFrog(frog) {
  if (!frog) return;
  frog.hasPermaShield = true;
  frog.shieldGrantedAt = elapsedTime;  // start 40s timer from now
  refreshFrogPermaGlow(frog);
  updateFrogRoleEmoji(frog);
  playPerFrogUpgradeSound("shield");
}

function grantMagnetFrog(frog) {
  if (frog.isMagnet) return;
  frog.isMagnet = true;
  refreshFrogPermaGlow(frog);
  updateFrogRoleEmoji(frog);
  playPerFrogUpgradeSound("magnet");
}

function grantLuckyFrog(frog) {
  if (frog.isLucky) return;
  frog.isLucky = true;
  refreshFrogPermaGlow(frog);
  updateFrogRoleEmoji(frog);
  playPerFrogUpgradeSound("lucky");
}

function grantZombieFrog(frog) {
  if (frog.isZombie) return;
  frog.isZombie = true;
  refreshFrogPermaGlow(frog);
  updateFrogRoleEmoji(frog);
  playPerFrogUpgradeSound("zombie");
}

function updateFrogRoleEmoji(frog) {
  if (!frog || !frog.el) return;

  if (frog.cannibalIcon && frog.cannibalIcon.parentNode === frog.el) {
    frog.el.removeChild(frog.cannibalIcon);
  }
  frog.cannibalIcon = null;

  let badgeText = "";

  // Role emoji takes priority over stars
  const emojis = [];
  if (frog.isChampion)     emojis.push("🏅");
  if (frog.isAura)         emojis.push("💫");
  if (frog.hasPermaShield) emojis.push("🛡️");
  if (frog.isMagnet)       emojis.push("🧲");
  if (frog.isLucky)        emojis.push("🍀");
  if (frog.isZombie)       emojis.push("🧟");
  if (frog.isCannibal)     emojis.push("🦴");

  if (emojis.length > 0) {
    badgeText = emojis.join("");
  } else {
    const stars = Math.max(0, Math.min(3, frog.starLevel || 0));
    if (stars > 0) {
      badgeText = "⭐".repeat(stars);
    }
  }

  if (!badgeText) return;

  const badge = document.createElement("div");
  badge.className = "frog-role-emoji";
  badge.textContent = badgeText;
  badge.style.position = "absolute";
  badge.style.bottom = "-2px";
  badge.style.right = "-2px";
  badge.style.fontSize = "11px";
  badge.style.pointerEvents = "none";
  badge.style.textShadow = "0 0 2px #000";

  frog.el.appendChild(badge);
  frog.cannibalIcon = badge;
}

// Feedback shares the upgrade menu's loaded pixel font and approved artwork.
function styleEventPanel(el) {
  const menuTitle=document.querySelector('#upgradeOverlay .frog-upgrade-title');
  const titleStyle=menuTitle ? getComputedStyle(menuTitle) : null;
  const panel=document.querySelector('#upgradeOverlay .frog-panel');
  const panelStyle=panel ? getComputedStyle(panel) : null;
  const size=titleStyle ? parseFloat(titleStyle.fontSize) : 26;
  Object.assign(el.style,{fontFamily:titleStyle?.fontFamily || 'ReferencePixel, Pocket, monospace',fontSize:(Number.isFinite(size)?size:26)+'px',fontWeight:'400',lineHeight:'1.1',color:'#073720',background:'#fff8db',border:'3px solid #073720',borderRadius:panelStyle?.borderRadius || '7px',boxShadow:'3px 3px 0 #497b36',padding:'8px 12px',gap:'10px',boxSizing:'border-box',maxWidth:'min(420px, 90%)'});
}
const eventVisuals = [];
const upgradeAnnouncementQueue = [];
function showUpgradeFeedback(choice, sourceButton) {
  if (!choice || choice.id === "luckyRoll") return;
  upgradeAnnouncementQueue.push({kind:"upgrade", choice:{id:choice.id,label:choice.label}});
}
function showLuckyShuffle(result) {
  upgradeAnnouncementQueue.push({kind:"roll",result});
}
function startNextUpgradeAnnouncement() {
  if (gamePaused || gameOver || eventVisuals.some(e=>e.kind==="upgrade" || e.kind==="roll")) return;
  const next=upgradeAnnouncementQueue.shift();
  if (!next) return;
  if(next.kind==="roll") renderLuckyShuffle(next.result);
  else renderUpgradeFeedback(next.choice);
}
function clearEventVisuals(){upgradeAnnouncementQueue.length=0;for(const effect of eventVisuals)effect.el.remove();eventVisuals.length=0;}
function renderUpgradeFeedback(choice, sourceButton) {
  if(choice.id === "luckyRoll") return;
  const title = document.createElement("div");
  title.innerHTML=String(choice.label||choice.id||"Upgrade").split(/<br\s*\/?>/i)[0];
  const name=title.textContent.replace(/^[^\p{L}\p{N}]+/u,"").trim();
  const url=window.approvedUpgrades?.[name.toLowerCase()] || window.approvedFrogs?.[name.toLowerCase()];
  const el=document.createElement("div");
  Object.assign(el.style,{position:"absolute",pointerEvents:"none",zIndex:"48",display:"flex",alignItems:"center",gap:"8px",padding:"7px 10px",background:"#fff7db",color:"#103b24",borderRadius:"7px",font:"inherit",fontWeight:"bold",maxWidth:"280px",textAlign:"center",transform:"translate(-50%,-100%)"});
  styleEventPanel(el);
  Object.assign(el.style,{background:"transparent",border:"0",borderRadius:"0",boxShadow:"none",padding:"0",color:"#fff8db",textShadow:"-2px -2px 0 #073720, 0 -2px 0 #073720, 2px -2px 0 #073720, -2px 0 0 #073720, 2px 0 0 #073720, -2px 2px 0 #073720, 0 2px 0 #073720, 2px 2px 0 #073720"});
  if(url){const image=document.createElement("span");Object.assign(image.style,{width:"1.4em",height:"1.4em",flexShrink:"0",imageRendering:"pixelated",backgroundImage:`url("${url}")`,backgroundSize:"contain",backgroundRepeat:"no-repeat",backgroundPosition:"center"});el.appendChild(image);}
  const text=document.createElement("span");text.textContent=name;el.appendChild(text);container.appendChild(el);
  const x=frogs.length?frogs.reduce((n,f)=>n+f.x,0)/frogs.length:window.innerWidth/2;
  const y=frogs.length?frogs.reduce((n,f)=>n+f.y,0)/frogs.length:window.innerHeight/2;
  eventVisuals.push({el,time:0,duration:1.5,x,y,kind:"upgrade"});
}
function showRoleSpotlight(frog){
  if(eventVisuals.some(e=>e.frog===frog))return;
  const el=document.createElement("div");
  Object.assign(el.style,{position:"absolute",width:"38px",height:"18px",background:"#fff3ad",boxShadow:"inset 0 -4px #a6cc62",clipPath:"polygon(15% 0,85% 0,85% 20%,100% 20%,100% 80%,85% 80%,85% 100%,15% 100%,15% 80%,0 80%,0 20%,15% 20%)",pointerEvents:"none",zIndex:"9"});container.appendChild(el);
  eventVisuals.push({el,frog,time:0,duration:1.1,kind:"spotlight"});
}
function renderLuckyShuffle(result){
  const outcomes=["speed","jump","snakeSlow","snakeConfuse","snakeShrink","frogShield","orbMagnet","scoreMulti","lifeSteal"];
  const labels={speed:"Speed",jump:"Jump",snakeSlow:"Snake Slow",snakeConfuse:"Snake Confusion",snakeShrink:"Snake Shrink",frogShield:"Frog Shield",orbMagnet:"Orb Magnet",scoreMulti:"Score Multiplier",lifeSteal:"Life Steal"};
  // Orb effects do not each have their own upgrade-menu artwork. Shuffle the
  // approved menu icons; settle on the actual Lucky Roll icon with an exact result label.
  const rollIcon=window.approvedUpgrades?.['lucky roll'];
  const icons=Object.values(window.approvedUpgrades || {});
  const el=document.createElement("div"),image=document.createElement("img"),label=document.createElement("span");
  Object.assign(el.style,{position:"absolute",left:"50%",top:"30%",transform:"translateX(-50%)",background:"#fff7db",color:"#103b24",borderRadius:"7px",padding:"8px 12px",display:"flex",alignItems:"center",gap:"8px",pointerEvents:"none",zIndex:"49",font:"inherit"});styleEventPanel(el);Object.assign(image.style,{width:"1.5em",height:"1.5em",objectFit:"contain",imageRendering:"pixelated",flexShrink:"0"});
  const copy=document.createElement("div"),heading=document.createElement("div");heading.textContent="LUCKY ROLL";Object.assign(heading.style,{fontFamily:el.style.fontFamily,fontSize:".7em",color:"#497b36",marginBottom:"3px"});copy.append(heading,label);el.append(image,copy);container.appendChild(el);
  eventVisuals.push({el,time:0,duration:2.1,kind:"roll",render(t){const type=t<.65?outcomes[Math.floor(t/.08)%outcomes.length]:result;const url=t<.65?icons[Math.floor(t/.08)%icons.length]:rollIcon;if(url){if(image.getAttribute("src")!==url)image.src=url;}image.style.display=url?"block":"none";label.textContent=t<.65?"Rolling…":labels[type];}});
  eventVisuals[eventVisuals.length-1].render(0);
}
function showZombieSacrifice(frog) {
  const size = FROG_SIZE * 0.60;
  const el = document.createElement('div');
  el.setAttribute('aria-hidden','true');
  el.style.cssText=`position:absolute;left:${Math.round(frog.x+(FROG_SIZE-size)/2)}px;top:${Math.round((frog.y ?? frog.baseY)+(FROG_SIZE-size)/2)}px;width:${size}px;height:${size}px;pointer-events:none;z-index:40;image-rendering:pixelated;background:url('game-assets/sprites/effects/zombie-smoke.svg') 0 0 / 400% 100% no-repeat;`;
  container.appendChild(el);
  eventVisuals.push({el,time:0,duration:.40,kind:'zombieSacrifice',render(t){
    const frame=Math.min(3,Math.floor(t/.10));
    el.style.backgroundPosition=`${frame*100/3}% 0`;
    el.style.opacity=frame===3?'0.45':frame===2?'0.75':'1';
  }});
}
function resolveZombiePanic() {
  if (panicHopTime <= 0) return;
  const index=frogs.findIndex(f=>f.isZombie);
  if(index<0)return;
  const frog=frogs[index];
  panicHopTime=0;
  showZombieSacrifice(frog);
  if (tryKillFrogAtIndex(index,"zombieSacrifice")) AudioMod.playZombieSacrifice?.();
}

function updateEventVisuals(dt){
 startNextUpgradeAnnouncement();
 for(let i=eventVisuals.length-1;i>=0;i--){const e=eventVisuals[i];e.time+=dt;if(e.time>=e.duration || (e.frog&&!e.frog.el.isConnected)){e.el.remove();eventVisuals.splice(i,1);continue;}
 const fade=Math.min(1,(e.duration-e.time)/.3);e.el.style.opacity=String(fade);
 if(e.kind==="roll" || e.kind==="zombieSacrifice"){e.render(e.time);continue;}
 if(e.frog){e.el.style.left=(e.frog.x+FROG_SIZE/2-19)+"px";e.el.style.top=(e.frog.baseY+FROG_SIZE-9)+"px";e.el.style.transform=`scale(${Math.min(1,e.time/.15)})`;}
 else {e.el.style.left=Math.max(150,Math.min(window.innerWidth-150,e.x))+"px";e.el.style.top=Math.max(80,e.y-30-Math.min(e.time/.3,1)*10)+"px";}
 }
}
function grantRandomPermaFrogUpgrade(frog) {
  if (!frog) return;
  const roles = ["cannibal", "aura", "magnet", "lucky"];

  const available = roles.filter((r) => {
    switch (r) {
      case "cannibal": return !frog.isCannibal;
      case "aura":     return !frog.isAura;
      case "magnet":   return !frog.isMagnet;
      case "lucky":    return !frog.isLucky;
      case "zombie":   return !frog.isZombie;
      default:         return true;
    }
  });

  const pool = available.length ? available : roles;
  const role = pool[Math.floor(Math.random() * pool.length)];

  switch (role) {
    case "cannibal": markCannibalFrog(frog);   break;
    case "aura":     grantAuraFrog(frog);       break;
    case "magnet":   grantMagnetFrog(frog);     break;
    case "lucky":    grantLuckyFrog(frog);      break;
    case "zombie":   grantZombieFrog(frog);     break;
  }
}
// Add these two NEW functions:
function grantNecromancerFrog(frog) {
  if (frog.isNecromancer) return;
  frog.isNecromancer = true;
  playPerFrogUpgradeSound("necromancer");
  refreshFrogPermaGlow(frog);
  updateFrogRoleEmoji(frog);
}

function grantAlchemistFrog(frog) {
  if (frog.isAlchemist) return;
  frog.isAlchemist = true;
  playPerFrogUpgradeSound("alchemist");
  frog.alchemistTimer = 40 - getLuckBiasedInt(15, 25); // Luck favors shorter independent waits.
  refreshFrogPermaGlow(frog);
  updateFrogRoleEmoji(frog);
}

// Add these two NEW functions:
function grantNecromancerFrog(frog) {
  if (frog.isNecromancer) return;
  frog.isNecromancer = true;
  playPerFrogUpgradeSound("necromancer");
  refreshFrogPermaGlow(frog);
  updateFrogRoleEmoji(frog);
}

function grantAlchemistFrog(frog) {
  if (frog.isAlchemist) return;
  frog.isAlchemist = true;
  playPerFrogUpgradeSound("alchemist");
  frog.alchemistTimer = 40 - getLuckBiasedInt(15, 25); // Luck favors shorter independent waits.
  refreshFrogPermaGlow(frog);
  updateFrogRoleEmoji(frog);
}

// Replace your EXISTING clearAllFrogRoles function with this:
function clearAllFrogRoles(frog) {
  if (!frog) return;

  if (frog.isCannibal) {
    cannibalFrogCount = Math.max(0, cannibalFrogCount - 1);
  }

  frog.isChampion = false;
  frog.isAura = false;
  frog.hasPermaShield = false;
  frog.isMagnet = false;
  frog.isLucky = false;
  frog.isZombie = false;
  frog.isBull = false;
  frog.isPoisonToad = false;
  frog.bullArmor = false;
  frog.isCannibal = false;
  
  // New Epic roles cleared
  frog.isNecromancer = false;
  frog.isAlchemist = false;
  frog.alchemistTimer = 0;

  frog.extraDeathRattleChance = 0;
  frog.specialDeathRattleChance = null;
  frog.shieldGrantedAt = null;

  frog.speedMult = 1.0;
  frog.jumpMult = 1.0;

  refreshFrogPermaGlow(frog);
  updateFrogRoleEmoji(frog);
}

// Replace your EXISTING updateFrogRoleEmoji function with this:
function updateFrogRoleEmoji(frog) {
 if (!frog || !frog.el) return;
 frog.el.querySelectorAll('.frog-role-emoji,.pp-frog-badge').forEach(e=>e.remove());frog.cannibalIcon=null;
 const roles=[['isPoisonToad','poison'],['isBull','bull'],['isNecromancer','necromancer'],['isAlchemist','alchemist'],['isZombie','zombie'],['isCannibal','cannibal'],['isAura','aura'],['hasPermaShield','shield'],['isMagnet','magnet'],['isLucky','lucky']];
 const role=roles.find(([flag])=>frog[flag]);const key=role?(role[1]==='cannibal'?'cannibal-'+Math.min(5,Math.max(0,frog.cannibalMeals||0)):role[1]):(frog.starLevel>0?'crowned':'');
 if (role) {
   const names={poison:'Poison Toad',bull:'Bull Frog',necromancer:'Necromancer',alchemist:'Alchemist',zombie:'Zombie',cannibal:'Cannibal',aura:'Aura',shield:'Shield',magnet:'Magnet',lucky:'Lucky'};
   discoverGuideEntry('Frogs',names[role[1]]);
 }
 if (frog.starLevel>0) discoverGuideEntry('Frogs','Crowned');
 if(role && frog.el.dataset.approvedRole!==key && !(frog.isCannibal && (frog.el.dataset.approvedRole||'').startsWith('cannibal-')))showRoleSpotlight(frog);
 if(key&&window.approvedFrogs?.[key]){frog.el.dataset.approvedRole=key;frog.el.style.setProperty('--approved-frog',`url("${new URL(window.approvedFrogs[key],document.baseURI).href}")`);}
 else {delete frog.el.dataset.approvedRole;frog.el.style.removeProperty('--approved-frog');}
}

function showCrownUpgrade(frog) {
  if (!frog?.el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cue = document.createElement('span');
  cue.className = 'frog-crown-upgrade-cue';
  cue.setAttribute('aria-hidden','true');
  for (let i=0;i<3;i++) { const spark=document.createElement('i'); spark.style.setProperty('--spark',i);cue.appendChild(spark); }
  frog.el.appendChild(cue);
  frog.el.classList.remove('frog-crown-pop');void frog.el.offsetWidth;
  frog.el.classList.add('frog-crown-pop');
  setTimeout(()=>{cue.remove();frog.el?.classList.remove('frog-crown-pop');},850);
}

function grantStarUpgrade(frog) {
  if (!frog) return;

  const oldLevel = Math.max(0, Math.min(3, frog.starLevel || 0));
  frog.starLevel = Math.min(3, oldLevel + 1);
  // Preserve role modifiers (e.g. Cannibal meals), adding only the crown increment.
  frog.speedMult = (frog.speedMult || 1) / (1 - oldLevel * .12) * (1 - frog.starLevel * .12);
  frog.jumpMult = (frog.jumpMult || 1) / (1 + oldLevel * .12) * (1 + frog.starLevel * .12);

  refreshFrogPermaGlow(frog);
  updateFrogRoleEmoji(frog);
  showCrownUpgrade(frog);
}

function frogHasSpecialRole(frog) {
  return ['isPoisonToad','isBull','isChampion','isAura','isMagnet','isLucky','isZombie','isCannibal','isNecromancer','isAlchemist','hasPermaShield'].some(key=>frog[key]);
}
function grantOrbCrowning(frog) {
  if (!frog) return;
  if (!frogHasSpecialRole(frog) && Math.random() < .35) {
    const roles=getRoleDraftPool();
    applySpecificRoleToFrog(frog,roles[Math.floor(Math.random()*roles.length)].id);
    showCrownUpgrade(frog);
    return;
  }
  grantStarUpgrade(frog);
}

function chooseOrbTypeWithLuck(pool) {
  if (!pool.length) return null;
  const nonPanic = pool.filter(t => t !== "panicHop");
  if (!pool.includes("panicHop") || !nonPanic.length) return pool[Math.floor(Math.random()*pool.length)];
  const panicChance = (peaceOfMindActive ? 0 : (1 - Math.max(0, Math.min(30, luckStat)) / 100)) / pool.length;
  if (Math.random() < panicChance) return "panicHop";
  return nonPanic[Math.floor(Math.random()*nonPanic.length)];
}
function triggerAfterglow(orb) {
  if (orb.type === "permaFrog") {
    const frog = frogs[Math.floor(Math.random()*frogs.length)];
    if (frog) grantOrbCrowning(frog);
  } else {
    // No collector bonuses or collection rewards. Timed effects use half base duration.
    applyBuff(orb.type, null, 0.5, true);
  }
}
function getRandomTriggeredOrbBuffType(excluded = []) {
  const pool = [
    "speed",
    "jump",
    "spawn",
    "snakeSlow",
    "snakeConfuse",
    "snakeShrink",
    "frogShield",
    "orbMagnet",
    "megaSpawn",
    "scoreMulti",
    "panicHop",
    "lifeSteal"
  ];

  const eligible = pool.filter(type => !excluded.includes(type) && !(peaceOfMindActive && type === "panicHop"));
  return chooseOrbTypeWithLuck(eligible);
}

function triggerLuckyRoll() {
  const buffType = getRandomTriggeredOrbBuffType(["spawn", "megaSpawn", "panicHop"]);
  showLuckyShuffle(buffType);
  applyBuff(buffType, null, 1.5, true); // applyBuff applies Luck once.
}

function promoteAllFrogs() {
  if (!Array.isArray(frogs) || frogs.length === 0) return;

  const pool = frogs.slice();
  const count = Math.min(10, pool.length);

  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const frog = pool.splice(idx, 1)[0];
    grantStarUpgrade(frog);
  }
}

function triggerChainReactionBonus(frog) {
  const buffType = getRandomTriggeredOrbBuffType();
  applyBuff(buffType, frog); // applyBuff applies Luck once.
}

function spawnTidalWave() {
  const alive = frogs.length;
  const room = Math.max(0, maxFrogsCap - frogs.length);
  if (room <= 0 || alive <= 0) return;
  spawnExtraFrogs(Math.min(Math.max(15, alive), room));
}

function grantPoisonToad(frog) {
  if (frog.isPoisonToad) return;
  frog.isPoisonToad = true;
  playPerFrogUpgradeSound("poison");
  updateFrogRoleEmoji(frog);
}

function grantBullFrog(frog) {
  const newlyGranted = !frog.isBull;
  frog.isBull = true;
  frog.bullArmor = true;
  if (newlyGranted) playPerFrogUpgradeSound("bull");
  updateFrogRoleEmoji(frog);
}

function spawnRoleBatch(role, min, max) {
  royalBatchActive = true;
  let spawned = 0;
  try {
    const count = getLuckBiasedInt(min, max);
    for (let i = 0; i < count; i++) if (spawnRoleFrog(role)) spawned++;
  } finally { royalBatchActive = false; }
  if (spawned > 0) tryRoyalApprenticeship(role);
}

// Reuse the normal frog personality ranges; only their selection odds change.
function rerollPromotedFrogStats(frog) {
  const luck = Math.max(0, Math.min(1, luckStat / MAX_LUCK));
  const energeticChance = 0.35 + 0.15 * luck;
  const roll = Math.random();
  const profile = roll < energeticChance
    ? [0.3, 1.0, 0.25, 0.50, 15.4, 32]
    : roll < energeticChance + 0.35
      ? [0.8, 3.0, 0.35, 0.63, 11, 26]
      : [1.4, 3.2, 0.35, 0.63, 11, 24];
  [frog.idleMin, frog.idleMax, frog.hopDurMin, frog.hopDurMax,
    frog.hopHeightMin, frog.hopHeightMax] = profile;
  frog.starLevel = 0;
  frog.speedMult = 1;
  frog.jumpMult = 1;
  // Let an in-progress hop finish normally; the next hop uses the new stats.
  if (frog.state === "idle") frog.idleTime = randRange(frog.idleMin, frog.idleMax);
}

function tryRoyalApprenticeship(role) {
  if (!royalApprenticeshipActive) return;
  const grants = {poison:grantPoisonToad, bull:grantBullFrog, aura:grantAuraFrog,
    magnet:grantMagnetFrog, lucky:grantLuckyFrog, zombie:grantZombieFrog,
    necromancer:grantNecromancerFrog, alchemist:grantAlchemistFrog, cannibal:markCannibalFrog};
  if (!grants[role]) return;
  const eligible = frogs.filter(f => f.starLevel > 0 && !f.isPoisonToad && !f.isBull &&
    !f.isChampion && !f.isAura && !f.isMagnet && !f.isLucky && !f.isZombie &&
    !f.isCannibal && !f.isNecromancer && !f.isAlchemist && !f.hasPermaShield);
  for (const frog of eligible) {
    rerollPromotedFrogStats(frog);
    grants[role](frog);
    refreshFrogPermaGlow(frog);
    updateFrogRoleEmoji(frog);
  }
}

function spawnRoleFrog(role) {
  const frog = createRandomFrog();
  if (!frog) return null;

  clearAllFrogRoles(frog);

  switch (role) {
    case "poison": grantPoisonToad(frog); break;
    case "bull": grantBullFrog(frog); break;
    case "aura":
      grantAuraFrog(frog);
      break;
    case "magnet":
      grantMagnetFrog(frog);
      break;
    case "lucky":
      grantLuckyFrog(frog);
      break;
    case "zombie":
      grantZombieFrog(frog);
      break;
    case "cannibal":
      markCannibalFrog(frog);
      refreshFrogPermaGlow(frog);
      updateFrogRoleEmoji(frog);
      break;
    case "necromancer":
      grantNecromancerFrog(frog);
      break;
    case "alchemist":
      grantAlchemistFrog(frog);
      break;
  }

  if (!royalBatchActive) tryRoyalApprenticeship(role);
  return frog;
}
function getRoleDraftPool() {
  return [
    { id: "poison", label: "Poison Toad", emoji: "", tier: "normal" },
    { id: "bull", label: "Bull Frog", emoji: "🐸", tier: "normal" },
    { id: "cannibal", label: "Cannibal", emoji: "", tier: "normal" },
    { id: "aura", label: "Aura", emoji: "💫", tier: "normal" },
    { id: "magnet", label: "Magnet", emoji: "🧲", tier: "normal" },
    { id: "lucky", label: "Lucky", emoji: "🍀", tier: "normal" },
    { id: "zombie", label: "Zombie", emoji: "🧟", tier: "normal" },
    { id: "alchemist", label: "Alchemist", emoji: "🧪", tier: "epic" },
    { id: "necromancer", label: "Necromancer", emoji: "🧙‍♂️", tier: "epic" }
  ];
}

function applySpecificRoleToFrog(frog, roleId) {
  if (!frog) return;

  clearAllFrogRoles(frog);
  frog.starLevel = 0;

  switch (roleId) {
    case "poison": grantPoisonToad(frog); break;
    case "bull": grantBullFrog(frog); break;
    case "alchemist": grantAlchemistFrog(frog); break;
    case "necromancer": grantNecromancerFrog(frog); break;
    case "cannibal":
      markCannibalFrog(frog);
      break;
    case "aura":
      grantAuraFrog(frog);
      break;
    case "magnet":
      grantMagnetFrog(frog);
      break;
    case "lucky":
      grantLuckyFrog(frog);
      break;
    case "zombie":
      grantZombieFrog(frog);
      break;
  }

  refreshFrogPermaGlow(frog);
  updateFrogRoleEmoji(frog);
}

function getTwoRandomRoleDraftChoices() {
  const pool = getRoleDraftPool().slice();
  const picks = [];

  while (picks.length < 2 && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    picks.push(pool.splice(idx, 1)[0]);
  }

  return picks;
}

function applyRoleDraft(roleId) {
  spawnRoleBatch(roleId, 2, 5);
}

function showRoleDraftOverlayChoices() {
  initUpgradeOverlay();
  armUpgradeTapGuard();
  if (!upgradeOverlayButtonsContainer) return;

  // Role Draft opens silently; role-granted audio still plays on selection.
  roleDraftChoices = getTwoRandomRoleDraftChoices();
  roleDraftPending = true;

  if (upgradeOverlaySubEl) {
    upgradeOverlaySubEl.textContent = "";
  }

  upgradeOverlayButtonsContainer.innerHTML = "";

  roleDraftChoices.forEach((role, index) => {
    const btn = document.createElement("button");
    btn.className = "frog-upgrade-choice is-spawning upgrade-type-role";
    btn.style.animationDelay = `${index * 70}ms`;

    btn.innerHTML = `
      <div class="frog-upgrade-emoji"></div><div class="frog-upgrade-title">${role.label}</div>
      <div class="frog-upgrade-desc">
        ${
          role.id === "poison"
            ? "Confuses the snake when eaten."
            : role.id === "bull"
            ? "Survives one bite and leaps away from the snake."
            : role.id === "cannibal"
            ? "Eats up to 5 ordinary frogs to grow stronger. Returns up to that many on death."
            : role.id === "aura"
            ? "Boosts nearby frogs with an aura."
            : role.id === "magnet"
            ? "Pulls nearby orbs toward itself."
            : role.id === "lucky"
            ? "Increases luck-based bonuses and buff value."
            : role.id === "zombie"
            ? "Sacrifices itself to stop Panic Hop. Spawns one frog on death."
            : role.id === "alchemist"
            ? "Spawns a frog every 15–25s. Luck helps."
            : role.id === "necromancer"
            ? "Deathrattle revivals become Zombies."
            : "Special frog role."
        }
      </div>
    `;

    btn.addEventListener("click", () => {
      
      applyRoleDraft(role.id);
      roleDraftPending = false;
      
      closeUpgradeOverlay();
    });

    upgradeOverlayButtonsContainer.appendChild(btn);

    setTimeout(() => {
      btn.classList.remove("is-spawning");
    }, 320);
  });
}
function getMutationChoices() {
  return [
    {
      id: "mutationAura",
      label: `⭐ Mutation<br>Spawn 1 Aura frog`,
      apply: () => spawnRoleFrog("aura")
    },
    {
      id: "mutationMagnet",
      label: `⭐ Mutation<br>Spawn 1 Magnet frog`,
      apply: () => spawnRoleFrog("magnet")
    },
    {
      id: "mutationLucky",
      label: `⭐ Mutation<br>Spawn 1 Lucky frog`,
      apply: () => spawnRoleFrog("lucky")
    },
    {
      id: "mutationZombie",
      label: `⭐ Mutation<br>Spawn 1 Zombie frog`,
      apply: () => spawnRoleFrog("zombie")
    },
    {
      id: "mutationCannibal",
      label: `⭐ Mutation<br>Spawn 1 Cannibal frog`,
      apply: () => spawnRoleFrog("cannibal")
    }
  ];
}
function markSegmentAsSevered(el, side) {
  if (!el) return;

  el.dataset.severed = "1";
  el.style.boxShadow =
    side === "left"
      ? "inset 3px 0 0 rgba(120,0,0,0.9)"
      : "inset -3px 0 0 rgba(120,0,0,0.9)";
}

function clearSeveredMark(el) {
  if (!el) return;
  delete el.dataset.severed;
  el.style.boxShadow = "none";
}

function createSnakeFromExistingSegments(segmentData, angle, speedFactor) {
  if (!segmentData || !segmentData.length) return null;

  const snakeSprites = getPlayerSnakeSpriteSet();
  const headPos = segmentData[0];

  const headEl = document.createElement("div");
  headEl.className = "snake-head";
  headEl.style.position = "absolute";
  headEl.style.width = SNAKE_SEGMENT_SIZE + "px";
  headEl.style.height = SNAKE_SEGMENT_SIZE + "px";
  headEl.style.imageRendering = "pixelated";
  headEl.style.backgroundSize = "contain";
  headEl.style.backgroundRepeat = "no-repeat";
  headEl.style.pointerEvents = "none";
  headEl.style.zIndex = "30";
  headEl.style.backgroundImage = `url(${snakeSprites.head})`;
  container.appendChild(headEl);

  const segments = [];
  for (let i = 0; i < segmentData.length; i++) {
    const src = segmentData[i];
    const segEl = src.el;
    if (!segEl) continue;

    const isTail = i === segmentData.length - 1;
    segEl.className = isTail ? "snake-tail" : "snake-body";
    segEl.style.zIndex = "29";
    segEl.style.backgroundImage = isTail
      ? `url(${snakeSprites.tail})`
      : `url(${snakeSprites.body})`;

    segments.push({
      el: segEl,
      x: src.x,
      y: src.y
    });
  }

  const path = [];
  const segmentGap = computeSegmentGap();
  const maxPath = (segments.length + 2) * segmentGap + 2;
  for (let i = 0; i < maxPath; i++) {
    path.push({ x: headPos.x, y: headPos.y });
  }

  return {
    head: { el: headEl, x: headPos.x, y: headPos.y, angle: angle || 0 },
    segments,
    path,
    isFrenzyVisual: false,
    speedFactor: speedFactor || 1.0,
    canGrow: false
  };
}

function queueSeveredRemnantsForNextShed() {
  for (const remnant of severedSnakeRemnants) {
    if (!remnant) continue;

    dyingSnakes.push({
      headEl: null,
      segmentEls: remnant.segmentEls || [],
      nextDespawnTime: 0.08
    });
  }

  severedSnakeRemnants = [];
}
function activateSnakeEgg() {
    snakeEggActive = true;
    snakeEggTimer = 0;
    snakeEggHatchInterval = 60; // 60–120 seconds

    // +10% to all tracked stats
    frogPermanentSpeedFactor    *= 0.909; // ~+10% speed (lower = faster)
    frogPermanentJumpFactor     *= 1.10;
    buffDurationFactor          *= 1.10;
    orbSpawnIntervalFactor      *= 0.909;
    frogDeathRattleChance        = Math.min(MAX_DEATHRATTLE_CHANCE, frogDeathRattleChance * 1.10);
    addLuck(Math.round(luckStat * 0.10));
  }

  function deactivateSnakeEgg() {
    snakeEggActive = false;

    // Remove the +10% buff
    frogPermanentSpeedFactor    /= 0.909;
    frogPermanentJumpFactor     /= 1.10;
    buffDurationFactor          /= 1.10;
    orbSpawnIntervalFactor      /= 0.909;
  }

  function hatchSnakeEgg() {
    deactivateSnakeEgg();

    const width  = window.innerWidth;
    const height = window.innerHeight;

    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const sx = width  * (0.2 + Math.random() * 0.6);
      const sy = height * (0.2 + Math.random() * 0.6);

      const baby = spawnAdditionalSnake(width, height, {
        startX: sx,
        startY: sy,
        angle,
        segmentCount: 4,               // tiny — same as shrink scale
        colorFilter: "hue-rotate(60deg) brightness(1.3)",
        speedFactor: 1.0               // locked at base
      });

      if (baby) {
        baby.isBabySnake  = true;
        baby.babySnakeAge = 0;
        baby.noShed       = true;
        baby.canGrow      = false;
        extraSnakes.push(baby);
        babySnakes.push(baby);
      }
    }
  }

  function updateBabySnakes(dt) {
    if (babySnakes.length === 0) return;

    const width  = window.innerWidth;
    const height = window.innerHeight;

    for (let i = babySnakes.length - 1; i >= 0; i--) {
      const baby = babySnakes[i];
      baby.babySnakeAge += dt;

      if (baby.babySnakeAge >= 180) { // 3 minutes
        // Drop 1–3 orbs
        const orbCount = 1 + Math.floor(Math.random() * 3);
        const bx = baby.head ? baby.head.x : width  * 0.5;
        const by = baby.head ? baby.head.y : height * 0.5;
        for (let j = 0; j < orbCount; j++) {
          spawnOrb(null, bx + randRange(-30, 30), by + randRange(-30, 30));
        }

        removeSnakeInstance(baby);
        babySnakes.splice(i, 1);
      }
    }
  }
function applyPairOfScissors() {
  if (!snake || pairOfScissorsUsed || snake.segments.length < 8) return;
  snake.speedFactor = (snake.speedFactor || 1) * 0.88;
  snake.selfConsume = {delay:0.8, t:0, biteClock:0};
  snake.canGrow = false;
  pairOfScissorsUsed = true;
}
function updateSelfConsumption(obj, dt) {
  const c=obj.selfConsume;
  if (!c) return false;
  if(c.delay>0){c.delay-=dt;return false;}
  if(!c.origin){
    c.origin=[obj.head,...obj.segments].map(p=>({x:p.x,y:p.y}));
    c.total=obj.segments.length;c.keep=Math.floor(c.total/2);c.eaten=0;
    c.radius=Math.max(18,c.total*SEGMENT_VISUAL_SPACING/(2*Math.PI));
    c.cx=obj.head.x;c.cy=obj.head.y+c.radius;
  }
  c.t+=dt;
  const curl=Math.min(1,c.t/1.2),ease=curl*curl*(3-2*curl);
  const biteInterval=Math.max(0.16,3.2/(c.total-c.keep));
  if(curl===1){
    c.biteClock+=dt;
    // At most one audible bite per frame, including after a long frame.
    if(c.biteClock>=biteInterval && obj.segments.length>c.keep){
      c.biteClock-=biteInterval;obj.segments.pop().el.remove();c.eaten++;
      obj.tailConsumed=true;playSnakeMunch();
    }
  }
  const progress=c.eaten/(c.total-c.keep);
  const travel=-progress*Math.PI*1.3;
  const radius=c.radius*(1-progress*0.48);
  const scale=(snakeShrinkTime>0 || obj.fruitShrink>0)?0.75:1;
  const points=[obj.head,...obj.segments];
  points.forEach((p,i)=>{
    const angle=travel+i/(points.length)*Math.PI*2;
    const targetX=c.cx+Math.sin(angle)*radius;
    const targetY=c.cy-Math.cos(angle)*radius;
    p.x=c.origin[i].x+(targetX-c.origin[i].x)*ease;
    p.y=c.origin[i].y+(targetY-c.origin[i].y)*ease;
    if(i){
      const tail=!obj.tailConsumed && i===points.length-1;
      p.el.className=tail?'snake-tail':'snake-body';
      p.el.style.transform=`translate3d(${Math.round(p.x)}px,${Math.round(p.y)}px,0) rotate(${angle+(tail?Math.PI:0)}rad) scale(${scale})`;
    }else{
      const bite=curl===1 && c.biteClock<0.09?0.06:0;
      p.el.style.transform=`translate3d(${Math.round(p.x)}px,${Math.round(p.y)}px,0) scale(${scale*(1+bite)},${scale*(1-bite)})`;
    }
  });
  updateSnakeDebuffCue(obj,dt,true,SNAKE_SEGMENT_SIZE);
  if(obj.segments.length<=c.keep){
    obj.path=[];
    for(let i=0;i<points.length-1;i++){
      const a=points[i],b=points[i+1],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)));
      for(let j=0;j<n;j++)obj.path.push({x:a.x+(b.x-a.x)*j/n,y:a.y+(b.y-a.y)*j/n});
    }
    obj.path.push({x:points.at(-1).x,y:points.at(-1).y});
    obj.canGrow=false;obj.tailConsumed=true;delete obj.selfConsume;
  }
  return true;
}
function clearScissorsAndOldSnakeState() {
  // remove detached scissors tail pieces still sitting in the DOM
  for (const seg of scissorsRemnantSegments) {
    if (seg && seg.el && seg.el.parentNode === container) {
      container.removeChild(seg.el);
    }
  }
  scissorsRemnantSegments = [];

  // remove any queued dying snake pieces
  for (const ds of dyingSnakes) {
    if (ds.headEl && ds.headEl.parentNode === container) {
      container.removeChild(ds.headEl);
    }
    if (Array.isArray(ds.segmentEls)) {
      for (const segEl of ds.segmentEls) {
        if (segEl && segEl.parentNode === container) {
          container.removeChild(segEl);
        }
      }
    }
  }
  dyingSnakes = [];

  // reset scissors state flags
  snakeEatingOldBody = false;
  snakeOldBodySpeedBonusPending = false;
  snakeOldBodyChaseTime = 0;
  snakeLastRemnantTarget = null;
  scissorsGrowthLocked = false;
  severedSnakeRemnants = [];
}
// --------------------------------------------------
// SPECIAL ROLES: CANNIBAL & HELPERS
// --------------------------------------------------

function markCannibalFrog(frog) {
  if (!frog || frog.isCannibal) return;
  frog.isCannibal = true;
  playPerFrogUpgradeSound("cannibal");
  frog.cannibalMeals = 0;
  frog.cannibalNextMeal = elapsedTime + 15;
  cannibalFrogCount++;
  refreshFrogPermaGlow(frog);
  updateFrogRoleEmoji(frog);
}

function unmarkCannibalFrog(frog) {
  if (!frog || !frog.isCannibal) return;

  frog.isCannibal = false;
  cannibalFrogCount = Math.max(0, cannibalFrogCount - 1);
  refreshFrogPermaGlow(frog);
  updateFrogRoleEmoji(frog);
}


  // Spawn a single "random" frog at a random position and return it
  function createRandomFrog() {
    if (frogs.length >= maxFrogsCap) return null;

    const width  = window.innerWidth;
    const height = window.innerHeight;
    const margin = 16;

    const x = margin + Math.random() * (width - margin * 2 - FROG_SIZE);
    const y = margin + Math.random() * (height - margin * 2 - FROG_SIZE);
    return createFrogAt(x, y, null);
  }

function computeDeathRattleChanceForFrog(frog) {
  let chance = frogDeathRattleChance || 0;

  // Per-frog bonus (Zombie Horde, Cannibal stats, etc.)
  if (frog && frog.extraDeathRattleChance) {
    chance += frog.extraDeathRattleChance;
  }

  // Lifeline: push the chance up to at least the configured max,
  // but don't exceed it.
  if (lifeStealTime > 0) {
    chance = Math.max(chance, MAX_DEATHRATTLE_CHANCE);
  }

  // Hard cap at configured max and floor at 0%
  if (chance > MAX_DEATHRATTLE_CHANCE) chance = MAX_DEATHRATTLE_CHANCE;
  if (chance < 0)                       chance = 0;

  return Math.min(0.25, chance + frogs.filter(f => f.isCannibal).length * 0.01);
}


  // Transfer one role to an existing ordinary frog; never duplicate the dead frog.
  function tryLastingLegacy(deadFrog, source) {
    if (!lastingLegacyActive || source === "scatter") return;
    const grants = [
      ["isPoisonToad", grantPoisonToad], ["isBull", grantBullFrog], ["isAura", grantAuraFrog],
      ["hasPermaShield", grantShieldFrog], ["isMagnet", grantMagnetFrog],
      ["isLucky", grantLuckyFrog], ["isZombie", grantZombieFrog],
      ["isNecromancer", grantNecromancerFrog], ["isAlchemist", grantAlchemistFrog],
      ["isCannibal", markCannibalFrog]
    ];
    const roles = grants.filter(([flag]) => deadFrog[flag]);
    if (!roles.length) return;
    const ordinary = frogs.filter(f => f !== deadFrog && f.el && f.el.isConnected &&
      !f.isGhost && !f.isMutationZombie && !(f.starLevel > 0) &&
      !grants.some(([flag]) => f[flag]));
    if (!ordinary.length || Math.random() >= getLuckBoostedChance(0.20)) return;
    const recipient = ordinary[Math.floor(Math.random() * ordinary.length)];
    const grant = roles[Math.floor(Math.random() * roles.length)][1];
    grant(recipient);
    refreshFrogPermaGlow(recipient);
    updateFrogRoleEmoji(recipient);
  }

  // Attempt to kill a frog at index `index`, with a specific source ("snake", "cannibal", etc.)
  function tryKillFrogAtIndex(index, source, bitingSnake = null) {
    const frog = frogs[index];
    if (!frog || !frog.el) return false;

    const wasLastFrog = (frogs.length === 1);
    const cannibalMeals = frog.isCannibal ? Math.min(5, frog.cannibalMeals || 0) : 0;
    const deathX = frog.x + FROG_SIZE / 2;
    const deathY = frog.baseY + FROG_SIZE / 2;

    // -----------------------------
    // Snake-specific protections
    // -----------------------------
    if (source === "snake") {
      if ((frog.bullEscapeUntil || 0) > elapsedTime) return false;
      if (frog.isBull && frog.bullArmor) {
        frog.bullArmor = false;
        AudioMod.playBullfrogEscape?.();
        frog.bullEscapeUntil = elapsedTime + 1.0;
        const head = (bitingSnake || snake)?.head;
        let dx = frog.x - (head?.x ?? frog.x - 1);
        let dy = frog.baseY - (head?.y ?? frog.baseY);
        const length = Math.hypot(dx, dy);
        if (length < 0.001) { dx = 1; dy = 0; }
        const norm = Math.hypot(dx, dy);
        const distance = FROG_SIZE * 9;
        frog.hopStartX = frog.x;
        frog.hopStartBaseY = frog.baseY;
        frog.hopEndX = Math.max(0, Math.min(window.innerWidth - FROG_SIZE, frog.x + dx / norm * distance));
        frog.hopEndBaseY = Math.max(0, Math.min(window.innerHeight - FROG_SIZE, frog.baseY + dy / norm * distance));
        frog.state = "hopping";
        frog.hopTime = 0;
        frog.hopDuration = 0.55;
        frog.hopHeight = FROG_SIZE * 2;
        return false;
      }
      // Global temporary shield from orb: protects vs snake hits
      if (frogShieldTime > 0) {
        return false;
      }

      // 🩸 Toxic Blood (Epic Upgrade)
      if (toxicBloodActive) {
        snakeSlowTime += 0.5; // Stumbles the snake slightly on every bite
      }
    }

    // -----------------------------
    // Remove clone visual if any
    // -----------------------------
    if (frog.cloneEl && frog.cloneEl.parentNode === container) {
      container.removeChild(frog.cloneEl);
      frog.cloneEl = null;
    }

    if (source === "snake" && frog.isPoisonToad) {
      applyBuff("snakeConfuse", null);
    }
    if (source !== "eyeForEye") tryLastingLegacy(frog, source);

    // If this frog *is* a cannibal, unmark it so global counters stay correct
    if (frog.isCannibal) {
      unmarkCannibalFrog(frog);
    }

    // -----------------------------
    // Remove frog DOM + from array
    // -----------------------------
    if (frog.el.parentNode === container) {
      container.removeChild(frog.el);
    }
    frogs.splice(index, 1);
    // Cap sacrifice cannot revive or spawn replacements above the new limit.
    if (source === "eyeForEye") return true;

    // -----------------------------
    // On-death effects: zombie, global + per-frog deathrattle, Lifeline, Last Stand
    // -----------------------------

    applyFrogDeathRewards(frog, source, wasLastFrog, cannibalMeals, deathX, deathY);

    return true; // a frog actually died
  }


  function applyFrogDeathRewards(frog, source, wasLastFrog, cannibalMeals, deathX, deathY) {
    // Role death spawns apply regardless of cause; Scatter is a relocation, not a death.
    if (frog.isZombie) spawnExtraFrogs(1);
    if (cannibalMeals > 0) spawnExtraFrogs(cannibalMeals === 1 ? 1 : 2 + Math.floor(Math.random() * (cannibalMeals - 1)));

    let drChance = computeDeathRattleChanceForFrog(frog);

    // Last Stand: if active and this was the last frog, guarantee at least X%,
    // with a dedicated final-frog exception to the ordinary cap.
    if (lastStandActive && wasLastFrog) {
      drChance = Math.max(drChance, LAST_STAND_MIN_CHANCE);
      // Last Stand is an explicit final-frog exception to the ordinary revival cap.
    }

    if (drChance > 0 && Math.random() < drChance) {
      // Spawn a replacement frog
      const newFrog = createRandomFrog();
      if (newFrog) {
        if (ouroborosPactUsed) spawnOrb(null, deathX, deathY);
        // 🧙‍♂️ Necromancer Check
        const hasNecromancer = frogs.some(f => f.isNecromancer);

        if (hasNecromancer) {
          grantZombieFrog(newFrog); // Necromancer overrides standard respawns into Zombies!
        } else {
          // Normal respawn behavior
          if (frog.isZombie) grantZombieFrog(newFrog);
          if (frog.isCannibal) markCannibalFrog(newFrog);
          if (source === "cannibal") grantRandomPermaFrogUpgrade(newFrog);
        }
      }
    }

    // -----------------------------
    // Sounds based on source
    // -----------------------------
    if (source === "snake") {
      playSnakeMunch();
      playFrogDeath();
    } else if (source === "cannibal") {
      // Cannibal eats frog: just play death sound (no snake munch)
      playFrogDeath();
    }



  }

  function killRandomFrogs(count, source) {
    let killed = 0;
    for (let i = 0; i < count && frogs.length > 0; i++) {
      const idx = Math.floor(Math.random() * frogs.length);
      if (tryKillFrogAtIndex(idx, source)) {
        killed++;
      }
    }
    return killed;
  }

  function scatterFrogSwarm() {
    // Only the original swarm participates, never newly created death rewards.
    const original = frogs.slice();
    const deaths = original.map(f => ({...f}));
    const width = window.innerWidth, height = window.innerHeight;
    for (const frog of original) {
      // Recreate the visual, while retaining role/crown/meal/defense state.
      const replacement = frog.el.cloneNode(true);
      frog.el.remove();
      frog.el = replacement;
      if (frog.cloneEl) { frog.cloneEl.remove(); frog.cloneEl = null; }
      container.appendChild(replacement);
      const x = 16 + Math.random() * Math.max(0, width - 32 - FROG_SIZE);
      const y = 16 + Math.random() * Math.max(0, height - 32 - FROG_SIZE);
      frog.x = frog.hopStartX = frog.hopEndX = x;
      frog.y = frog.baseY = frog.hopStartBaseY = frog.hopEndBaseY = y;
      frog.state = "idle";
      frog.hopTime = 0;
      frog.idleTime = randRange(frog.idleMin, frog.idleMax);
      frog.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      refreshFrogPermaGlow(frog);
      updateFrogRoleEmoji(frog);
    }
    for (const dead of deaths) {
      tryLastingLegacy(dead, "scatterDeath");
      applyFrogDeathRewards(dead, "scatter", deaths.length === 1,
        dead.isCannibal ? Math.min(5, dead.cannibalMeals || 0) : 0,
        dead.x + FROG_SIZE / 2, dead.baseY + FROG_SIZE / 2);
    }
  }

  // EPIC: spawn a Cannibal Frog
  function spawnCannibalFrog() {
    const frog = createRandomFrog();
    if (!frog) return;
    markCannibalFrog(frog);
  }

  // EPIC: give all frogs random permanent roles
  function giveAllFrogsRandomRoles() {
    for (const frog of frogs) {
      grantRandomPermaFrogUpgrade(frog);
    }
  }

  // EPIC: spawn 3 special zombie frogs with 50% personal deathrattle
  function spawnZombieHorde() {
    for (let i = 0; i < 3; i++) {
      const frog = createRandomFrog();
      if (!frog) continue;
      grantZombieFrog(frog);
      frog.extraDeathRattleChance = 0.5; // 50% personal deathrattle on this life only
    }
  }


  function applyBuff(type, frog, durationMultiplier = 1, fixedDuration = false) {
    const isLuckyCollector = frog && frog.isLucky;
    // Lucky collectors reroll negative orb results, including chain reactions.
    if ((isLuckyCollector || peaceOfMindActive) && type === "panicHop") {
      type = getRandomTriggeredOrbBuffType(["panicHop"]);
    }
    const durBoost = isLuckyCollector
      ? LUCKY_BUFF_DURATION_BOOST
      : 1.0;

    const durationScale = fixedDuration ? durationMultiplier : type === "panicHop" ? 1 :
      buffDurationFactor *
      durationMultiplier *
      durBoost *
      getLuckBuffDurationMultiplier() *
      (lingeringHexActive && ["snakeSlow", "snakeConfuse", "snakeShrink"].includes(type) ? 1.15 : 1);

    switch (type) {
      case "speed":
        speedBuffTime = Math.max(speedBuffTime, SPEED_BUFF_DURATION * durationScale);
        break;

      case "jump":
        jumpBuffTime = Math.max(jumpBuffTime, JUMP_BUFF_DURATION * durationScale);
        break;

      case "spawn": {
        const base = getLuckBiasedInt(1, 10);
        const bonus = isLuckyCollector ? getLuckBiasedInt(1, 4) : 0;
        spawnExtraFrogs(base + bonus);
        break;
      }

      case "snakeSlow":
        snakeSlowTime = Math.max(snakeSlowTime, SNAKE_SLOW_DURATION * durationScale);
        snakeSlowCueTime = Math.max(snakeSlowCueTime, SNAKE_SLOW_DURATION * durationScale);
        break;

      case "snakeConfuse":
        snakeConfuseTime = Math.max(snakeConfuseTime, SNAKE_CONFUSE_DURATION * durationScale);
        break;

      case "snakeShrink":
        snakeShrinkTime = Math.max(snakeShrinkTime, SNAKE_SHRINK_DURATION * durationScale);
        break;

      case "frogShield":
        frogShieldTime = Math.max(frogShieldTime, FROG_SHIELD_DURATION * durationScale);
        break;

      case "timeSlow":
        timeSlowTime = Math.max(timeSlowTime, TIME_SLOW_DURATION * durationScale);
        break;

      case "orbMagnet":
        orbMagnetTime = Math.max(orbMagnetTime, ORB_MAGNET_DURATION * durationScale);
        break;

      case "megaSpawn": {
        const base = getLuckBiasedInt(8, 15);
        const bonus = isLuckyCollector ? getLuckBiasedInt(3, 8) : 0;
        spawnExtraFrogs(base + bonus);
        break;
      }

      case "scoreMulti":
        scoreMultiTime = Math.max(scoreMultiTime, SCORE_MULTI_DURATION * durationScale);
        break;

      case "panicHop":
        panicHopTime = Math.max(panicHopTime, PANIC_HOP_DURATION * durationScale);
        resolveZombiePanic();
        break;

      case "cloneSwarm":
        cloneSwarmTime = Math.max(cloneSwarmTime, CLONE_SWARM_DURATION * durationScale);
        break;

      case "lifeSteal":
        lifeStealTime = Math.max(lifeStealTime, LIFE_STEAL_DURATION * durationScale);
        break;

      default:
        break;
    }

    if (type !== "permaFrog") {
      playBuffSound(type);
    }
  }

  // Use pre-colored assets: no live shed filter on transformed sprites.
  function setShedPalette(el, stage) {
    const color = stage >= 2 ? 'red' : stage === 1 ? 'yellow' : '';
    if (el.dataset.shedPalette === color) return;
    el.dataset.shedPalette = color;
    for (const [variable,part] of [['--snake-face','head'],['--snake-block','body'],['--snake-tip','tail']]) {
      const url = new URL(`game-assets/sprites/snake-${part}${color ? '-'+color : ''}.png`, document.baseURI).href;
      el.style.setProperty(variable, `url("${url}")`);
    }
    el.style.imageRendering = 'pixelated';
  }
  for (const color of ['yellow','red']) for (const part of ['head','body','tail']) {
    const img = new Image(); img.src = `game-assets/sprites/snake-${part}-${color}.png`;
  }

  function applySnakeAppearance() {
    if (!snake) return;

    const elements = [];
    if (snake.head && snake.head.el) elements.push(snake.head.el);
    if (Array.isArray(snake.segments)) {
      for (const seg of snake.segments) {
        if (seg.el) elements.push(seg.el);
      }
    }

    let filter = '';

    // Legendary Frenzy overlay (red tint)
    if (snakeFrenzyTime > 0) {
      filter += (filter ? " " : "") + "hue-rotate(-80deg) saturate(2)";
    }

    for (const el of elements) {
      setShedPalette(el, snakeShedStage);
      el.style.filter = filter;
    }
  }


  function setSnakeFrenzyVisual(active) {
    if (!snake) return;
    snake.isFrenzyVisual = active;
    applySnakeAppearance();
  }

  function updateBuffTimers(dt) {
    if (speedBuffTime   > 0) speedBuffTime   = Math.max(0, speedBuffTime   - dt);
    if (jumpBuffTime    > 0) jumpBuffTime    = Math.max(0, jumpBuffTime    - dt);
    if (frogShieldTime  > 0) frogShieldTime  = Math.max(0, frogShieldTime  - dt);
    if (orbMagnetTime   > 0) orbMagnetTime   = Math.max(0, orbMagnetTime   - dt);
    if (scoreMultiTime  > 0) scoreMultiTime  = Math.max(0, scoreMultiTime  - dt);
    if (panicHopTime    > 0) panicHopTime    = Math.max(0, panicHopTime    - dt);
    if (cloneSwarmTime  > 0) cloneSwarmTime  = Math.max(0, cloneSwarmTime  - dt);
    if (lifeStealTime   > 0) lifeStealTime   = Math.max(0, lifeStealTime   - dt);

    // Frenzy timer (not affected by snake resistance)
    if (snakeFrenzyTime > 0) {
      snakeFrenzyTime = Math.max(0, snakeFrenzyTime - dt);
      if (snakeFrenzyTime === 0) {
        setSnakeFrenzyVisual(false);
      }
    }

    const snakeResist = getSnakeResistance();
    const debuffTickMultiplier = 1 + snakeResist;

    if (snakeSlowCueTime > 0) snakeSlowCueTime = Math.max(0, snakeSlowCueTime - dt * debuffTickMultiplier);
    if (snakeSlowTime    > 0) snakeSlowTime    = Math.max(0, snakeSlowTime    - dt * debuffTickMultiplier);
    if (snakeConfuseTime > 0) snakeConfuseTime = Math.max(0, snakeConfuseTime - dt * debuffTickMultiplier);
    if (snakeShrinkTime  > 0) snakeShrinkTime  = Math.max(0, snakeShrinkTime  - dt * debuffTickMultiplier);

    // Snake egg timer
    if (snakeEggActive) {
      snakeEggTimer += dt;
      if (snakeEggTimer >= snakeEggHatchInterval) {
        snakeEggTimer = 0;
        if (Math.random() < SNAKE_EGG_HATCH_CHANCE) {
          hatchSnakeEgg();
        }
      }
    }

    // Baby snake age
    updateBabySnakes(dt);
  }

  // --------------------------------------------------
  // FROG MOVEMENT (ORIGINAL FEEL)
  // --------------------------------------------------
  function chooseHopDestination(frog, width, height) {
    let targetX = frog.x;
    let targetBaseY = frog.baseY;

    const marginY = 24;
    const marginX = 8;

    const baseMaxStep = 40;
    const speedBuffed = (speedBuffTime > 0 || panicHopTime > 0) ? 1.7 : 1.0;
    const championBoost = 1; // Champion removed.
    const jumpFactor = getJumpFactor(frog);  // <-- add this line
    const maxStep = baseMaxStep * speedBuffed * championBoost * jumpFactor;

    let goalX = null;
    let goalY = null;

    if (frog.isMutationZombie) {
      const frogCx = frog.x + FROG_SIZE / 2;
      const frogCy = frog.baseY + FROG_SIZE / 2;

      let nearestSnake = null;
      let nearestD2 = Infinity;

      const allSnakes = [];
      if (snake) allSnakes.push(snake);
      if (Array.isArray(extraSnakes)) {
        for (const s of extraSnakes) {
          if (s) allSnakes.push(s);
        }
      }

      for (const s of allSnakes) {
        if (!s || !s.head) continue;

        const sx = s.head.x + SNAKE_SEGMENT_SIZE / 2;
        const sy = s.head.y + SNAKE_SEGMENT_SIZE / 2;
        const dx = frogCx - sx;
        const dy = frogCy - sy;
        const d2 = dx * dx + dy * dy;

        if (d2 < nearestD2) {
          nearestD2 = d2;
          nearestSnake = { dx, dy };
        }
      }

      const EVADE_RADIUS = 180;
      const evadeR2 = EVADE_RADIUS * EVADE_RADIUS;

      if (nearestSnake && nearestD2 < evadeR2) {
        const dist = Math.sqrt(nearestD2) || 1;
        const nx = nearestSnake.dx / dist;
        const ny = nearestSnake.dy / dist;
        const hopDist = randRange(70, 140);

        goalX = frog.x + nx * hopDist;
        goalY = frog.baseY + ny * hopDist;
      } else {
        frog.mutationZombieRetargetTime -= frog.hopDuration || 0.4;

        if (frog.mutationZombieRetargetTime <= 0) {
          const angle = randRange(0, Math.PI * 2);
          frog.mutationZombieDirX = Math.cos(angle);
          frog.mutationZombieDirY = Math.sin(angle);
          frog.mutationZombieRetargetTime = randRange(0.8, 2.0);
        }

        const wanderDist = randRange(40, 110);
        goalX = frog.x + frog.mutationZombieDirX * wanderDist;
        goalY = frog.baseY + frog.mutationZombieDirY * wanderDist;
      }
    } else if (mouse.follow && mouse.active && !frog.isGhost) {
      goalX = mouse.x - FROG_SIZE / 2;
      goalY = mouse.y - FROG_SIZE / 2;

      if (swarmDivideActive) {
        const frogCx = frog.x + FROG_SIZE / 2;
        const frogCy = frog.baseY + FROG_SIZE / 2;
        const targetCx = mouse.x;
        const targetCy = mouse.y;

        const dx = targetCx - frogCx;
        const dy = targetCy - frogCy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        const px = -dy / dist;
        const py = dx / dist;

        const lane = frog.swarmDivideLane || 1;
        const offset = 70 * lane;

        goalX += px * offset;
        goalY += py * offset;
      }
    }

    // Ghost frogs + panic hop ignore mouse and dart randomly
    if (panicHopTime > 0 || frog.isGhost) {
      goalX = null;
      goalY = null;
    }

    if (goalX !== null && goalY !== null) {
      const dx = goalX - frog.x;
      const dy = goalY - frog.baseY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const step = Math.min(maxStep, dist);

      const stepX = (dx / dist) * step;
      const stepY = (dy / dist) * step;

      targetX = frog.x + stepX;
      targetBaseY = frog.baseY + stepY;
    } else if (panicHopTime > 0) {
      // Independent directions each hop create a scattering swarm, not idle jitter.
      const angle = randRange(0, Math.PI * 2);
      const distance = randRange(maxStep * 0.6, maxStep);
      let dx = Math.cos(angle) * distance;
      let dy = Math.sin(angle) * distance;
      if (frog.x + dx < marginX || frog.x + dx > width - marginX - FROG_SIZE) dx = -dx;
      if (frog.baseY + dy < marginY || frog.baseY + dy > height - marginY - FROG_SIZE) dy = -dy;
      targetX = frog.x + dx;
      targetBaseY = frog.baseY + dy;
    } else {
      targetX = frog.x + randRange(-12, 12);
      targetBaseY = frog.baseY + randRange(-6, 6);
    }

    targetX = Math.max(marginX, Math.min(width - marginX - FROG_SIZE, targetX));
    targetBaseY = Math.max(
      marginY,
      Math.min(height - marginY - FROG_SIZE, targetBaseY)
    );

    frog.hopStartX = frog.x;
    frog.hopStartBaseY = frog.baseY;
    frog.hopEndX = targetX;
    frog.hopEndBaseY = targetBaseY;
  }

  function updateFrogs(dt, width, height) {
    // Snapshot avoids processing newly spawned frogs as Alchemists this frame.
    for (const alchemist of frogs.filter(f => f.isAlchemist)) {
      alchemist.alchemistTimer -= dt;
      if (alchemist.alchemistTimer <= 0) {
        spawnExtraFrogs(1);
        alchemist.alchemistTimer = 40 - getLuckBiasedInt(15, 25);
      }
    }
    const marginY = 24;
    const marginX = 8;
    if (secondWindActive && !secondWindUsed && frogs.length > 0 && frogs.length <= 10) {
      secondWindUsed = true;
      spawnExtraFrogs(20);
    }
    for (const frog of frogs) {
      if (frog.state === "idle") {
        frog.idleTime -= dt;
        frog.y = frog.baseY;

        if (frog.idleTime <= 0) {
          frog.state = "hopping";
          frog.hopTime = 0;

          const baseDur = randRange(frog.hopDurMin, frog.hopDurMax);
          frog.hopDuration = baseDur * getSpeedFactor(frog);

          const spice = Math.random();
          let hopHeight;
          if (spice < 0.1) {
            hopHeight = randRange(
              frog.hopHeightMax * 1.1,
              frog.hopHeightMax * 1.8
            );
          } else if (spice < 0.25) {
            hopHeight = randRange(2, frog.hopHeightMin * 0.7);
          } else {
            hopHeight = randRange(frog.hopHeightMin, frog.hopHeightMax);
          }
          frog.hopHeight = hopHeight * getJumpFactor(frog);

          chooseHopDestination(frog, width, height);
          playRandomRibbit();
        }
      } else if (frog.state === "hopping") {
        frog.hopTime += dt;
        const t = Math.min(1, frog.hopTime / frog.hopDuration);

        const groundX = frog.hopStartX + (frog.hopEndX - frog.hopStartX) * t;
        const groundBaseY =
          frog.hopStartBaseY + (frog.hopEndBaseY - frog.hopStartBaseY) * t;

        const offset = -4 * frog.hopHeight * t * (1 - t);

        frog.x = groundX;
        frog.baseY = groundBaseY;
        frog.y = groundBaseY + offset;

        if (frog.hopTime >= frog.hopDuration) {
          frog.state = "idle";

          const baseIdle = randRange(frog.idleMin, frog.idleMax);
          frog.idleTime = baseIdle * getSpeedFactor(frog);

          frog.x = frog.hopEndX;
          frog.baseY = frog.hopEndBaseY;
          frog.y = frog.baseY;

          frog.x = Math.max(marginX, Math.min(width - marginX - FROG_SIZE, frog.x));
          frog.baseY = Math.max(
            marginY,
            Math.min(height - marginY - FROG_SIZE, frog.baseY)
          );
        }
      }

      frog.el.style.transform = `translate3d(${frog.x}px, ${frog.y}px, 0)`;

    }
    // Resolve one zombie sacrifice for a Panic Hop episode, including frenzy sources.
    resolveZombiePanic();
    for (const cannibal of frogs.filter(f => f.isCannibal)) {
      if (frogs.length <= 15 || (cannibal.cannibalMeals || 0) >= 5 || elapsedTime < (cannibal.cannibalNextMeal || 0)) continue;
      const radius2 = (FROG_SIZE * 0.6) ** 2;
      const victim = frogs.find(f => f !== cannibal && !f.starLevel && !f.isBull && !f.isPoisonToad &&
        !f.isAura && !f.isMagnet && !f.isLucky && !f.isZombie && !f.isCannibal && !f.isNecromancer &&
        !f.isAlchemist && !f.hasPermaShield && !f.isGhost && !f.isMutationZombie &&
        (f.x-cannibal.x)**2 + (f.baseY-cannibal.baseY)**2 < radius2);
      if (!victim || !tryKillFrogAtIndex(frogs.indexOf(victim), "cannibal")) continue;
      const before = cannibal.cannibalMeals || 0;
      cannibal.cannibalMeals = before + 1;
      cannibal.speedMult *= (1 - .05 * cannibal.cannibalMeals) / (1 - .05 * before);
      cannibal.jumpMult *= (1 + .05 * cannibal.cannibalMeals) / (1 + .05 * before);
      cannibal.cannibalNextMeal = elapsedTime + 15;
      updateFrogRoleEmoji(cannibal);
    }

  }

  // --------------------------------------------------
  // ORBS
  // --------------------------------------------------

  const ORB_TYPES = [
    "speed",
    "jump",
    "spawn",
    "snakeSlow",
    "snakeConfuse",
    "snakeShrink",
    "frogShield",
    "orbMagnet",
    "megaSpawn",
    "scoreMulti",
    "panicHop",
    "lifeSteal",
    "permaFrog"
  ];

  function spawnOrb(type, x, y) {
    if (!type || (peaceOfMindActive && type === "panicHop")) {
      const availableTypes = ORB_TYPES.filter(t => !(peaceOfMindActive && t === "panicHop"));
      type = chooseOrbTypeWithLuck(availableTypes);
    }

    if (typeof x !== "number" || typeof y !== "number") {
      const marginX = 24;
      const marginY = 48;
      x = marginX + Math.random() * (window.innerWidth - marginX * 2);
      y = marginY + Math.random() * (window.innerHeight - marginY * 2);
    }

    const size = ORB_RADIUS * 2;
    const el = document.createElement("div");
    el.className = "frog-orb";
    el.style.position = "absolute";
    el.style.width = size + "px";
    el.style.height = size + "px";
    el.style.borderRadius = "50%";
    el.style.pointerEvents = "none";
    el.style.zIndex = "20";

    // orb.gif in center
    el.style.backgroundImage = "url(./game-assets/images/orb.gif)";
    el.style.backgroundSize = "contain";
    el.style.backgroundRepeat = "no-repeat";
    el.style.backgroundPosition = "center";

    if (type === "speed")      el.style.boxShadow = "0 0 14px #32ff9b";
    else if (type === "jump")  el.style.boxShadow = "0 0 14px #b857ff";
    else if (type === "spawn") el.style.boxShadow = "0 0 14px #ffe66b";
    else if (type === "snakeSlow")    el.style.boxShadow = "0 0 14px #ff6b6b";
    else if (type === "snakeConfuse") el.style.boxShadow = "0 0 14px #ff9ff3";
    else if (type === "snakeShrink")  el.style.boxShadow = "0 0 14px #74b9ff";
    else if (type === "frogShield")   el.style.boxShadow = "0 0 14px #55efc4";
    else if (type === "timeSlow")     el.style.boxShadow = "0 0 14px #ffeaa7";
    else if (type === "orbMagnet")    el.style.boxShadow = "0 0 14px #a29bfe";
    else if (type === "megaSpawn")    el.style.boxShadow = "0 0 14px #fd79a8";
    else if (type === "scoreMulti")   el.style.boxShadow = "0 0 14px #fdcb6e";
    else if (type === "panicHop")     el.style.boxShadow = "0 0 14px #fab1a0";
    else if (type === "lifeSteal")    el.style.boxShadow = "0 0 14px #00ff88";
    else if (type === "permaFrog")    el.style.boxShadow = "0 0 14px #ffd700";
    else                              el.style.boxShadow = "0 0 10px rgba(0,0,0,0.4)";

    container.appendChild(el);

    const ttl = ORB_TTL * orbTtlFactor;
    orbs.push({ type, x, y, ttl, maxTtl: ttl, el });

    totalOrbsSpawned++;

    playRandomOrbSpawnSound();
  }

  function spawnOrbRandom(width, height) {
    if (frogs.length === 0) return;

    const marginX = 24;
    const marginY = 48;

    const x = marginX + Math.random() * (width - marginX * 2);
    const y = marginY + Math.random() * (height - marginY * 2);

    spawnOrb(null, x, y);
  }
  function updateOrbs(dt) {
    const MAGNET_RANGE2 = ORB_MAGNET_PULL_RANGE * ORB_MAGNET_PULL_RANGE;

    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];

      if (!quantumOrbsActive) {
        orb.ttl -= dt;
      }

      if (orb.ttl <= 0 || !orb.el) {
        if (nightBloomActive && frogs.length < maxFrogsCap && Math.random() < getLuckBoostedChance(0.20, 0.80)) {
          const spawnX = Math.max(8, Math.min(window.innerWidth - FROG_SIZE - 8, orb.x - FROG_SIZE / 2));
          const spawnY = Math.max(24, Math.min(window.innerHeight - FROG_SIZE - 24, orb.y - FROG_SIZE / 2));
          createFrogAt(spawnX, spawnY, null);
        }

        if (orb.el && orb.el.parentNode === container) {
          container.removeChild(orb.el);
        }
        orbs.splice(i, 1);
        if (orb.ttl <= 0 && afterglowActive && Math.random() < 0.25) triggerAfterglow(orb);
        continue;
      }

      const magnetFrogs = frogs.filter(f => f.isMagnet);
      if ((orbMagnetTime > 0 || magnetFrogs.length > 0) && frogs.length > 0) {
        let target = null;
        let bestD2 = Infinity;

        for (const mf of magnetFrogs) {
          const fx = mf.x + FROG_SIZE / 2;
          const fy = mf.baseY + FROG_SIZE / 2;
          const dx = fx - orb.x;
          const dy = fy - orb.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MAGNET_RANGE2 && d2 < bestD2) {
            bestD2 = d2;
            target = { fx, fy };
          }
        }

        if (!target && orbMagnetTime > 0) {
          for (const frog of frogs) {
            const fx = frog.x + FROG_SIZE / 2;
            const fy = frog.baseY + FROG_SIZE / 2;
            const dx = fx - orb.x;
            const dy = fy - orb.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestD2) {
              bestD2 = d2;
              target = { fx, fy };
            }
          }
        }

        if (target) {
          const dx = target.fx - orb.x;
          const dy = target.fy - orb.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const pull = 80 * dt;
          orb.x += (dx / dist) * pull;
          orb.y += (dy / dist) * pull;
        }
      }

      const denom = orb.maxTtl || ORB_TTL;
      const lifeT = orb.ttl / denom;
      const bob   = Math.sin((1 - lifeT) * Math.PI * 2) * 3;
      const scale = 1 + 0.1 * Math.sin((1 - lifeT) * Math.PI * 4);

      const renderY = orb.y + bob;
      orb.el.style.transform =
        `translate3d(${orb.x - ORB_RADIUS}px, ${renderY - ORB_RADIUS}px, 0) scale(${scale})`;
      orb.el.style.opacity = String(Math.max(0, Math.min(1, lifeT + 0.2)));

      const ocx = orb.x;
      const ocy = orb.y;

      let collectedBy = null;
      for (const frog of frogs) {
        const fx = frog.x + FROG_SIZE / 2;
        const fy = frog.baseY + FROG_SIZE / 2;
        const dx = fx - ocx;
        const dy = fy - ocy;
        const rad = FROG_SIZE / 2 + ORB_RADIUS;
        if (dx * dx + dy * dy <= rad * rad) {
          collectedBy = frog;
          break;
        }
      }

      if (collectedBy) {
        totalOrbsCollected++;

        if (orb.type === "permaFrog") {
          grantOrbCrowning(collectedBy);
        } else {
          applyBuff(orb.type, collectedBy);

          if (chainReactionActive && Math.random() < getLuckBoostedChance(0.15, 0.15)) {
            triggerChainReactionBonus(collectedBy);
          }
        }

        let frogsToSpawnFromOrb = 0;

        if (orbSpecialistActive && Math.random() < 0.50) {
          frogsToSpawnFromOrb += 1;
        }

        if (startingOrbSpecialistCharges > 0) {
          frogsToSpawnFromOrb += 1;
          startingOrbSpecialistCharges -= 1;
        }

        if (doubleYolkerActive && Math.random() < getLuckBoostedChance(0.15, 0.35)) {
          frogsToSpawnFromOrb += 2;
        }

        if (permaLifeStealOrbsRemaining > 0) {
          permaLifeStealOrbsRemaining -= 1;
          frogsToSpawnFromOrb += 1;
        }

        if (frogsToSpawnFromOrb > 0) {
          spawnExtraFrogs(frogsToSpawnFromOrb);
        }

        if (orb.el && orb.el.parentNode === container) {
          container.removeChild(orb.el);
        }
        orbs.splice(i, 1);
      }
    }
  }

  // --------------------------------------------------
  // SNAKE
  // --------------------------------------------------
  function initSnake(width, height) {
    if (snake) {
      if (snake.head && snake.head.el && snake.head.el.parentNode === container) {
        container.removeChild(snake.head.el);
      }
      if (Array.isArray(snake.segments)) {
        for (const seg of snake.segments) {
          if (seg.el && seg.el.parentNode === container) {
            container.removeChild(seg.el);
          }
        }
      }
    }

    const startX = width * 0.15;
    const startY = height * 0.5;
    const snakeSprites = getPlayerSnakeSpriteSet();

    const headEl = document.createElement("div");
    headEl.className = "snake-head";
    headEl.style.position = "absolute";
    headEl.style.width = SNAKE_SEGMENT_SIZE + "px";
    headEl.style.height = SNAKE_SEGMENT_SIZE + "px";
    headEl.style.imageRendering = "pixelated";
    headEl.style.backgroundSize = "contain";
    headEl.style.backgroundRepeat = "no-repeat";
    headEl.style.pointerEvents = "none";
    headEl.style.zIndex = "30";
    headEl.style.backgroundImage = `url(${snakeSprites.head})`;
    container.appendChild(headEl);

    const segments = [];
    for (let i = 0; i < SNAKE_INITIAL_SEGMENTS; i++) {
      const segEl = document.createElement("div");
      const isTail = i === SNAKE_INITIAL_SEGMENTS - 1;
      segEl.className = isTail ? "snake-tail" : "snake-body";
      segEl.style.position = "absolute";
      segEl.style.width = SNAKE_SEGMENT_SIZE + "px";
      segEl.style.height = SNAKE_SEGMENT_SIZE + "px";
      segEl.style.imageRendering = "pixelated";
      segEl.style.backgroundSize = "contain";
      segEl.style.backgroundRepeat = "no-repeat";
      segEl.style.pointerEvents = "none";
      segEl.style.zIndex = "29";
      segEl.style.backgroundImage = isTail
        ? `url(${snakeSprites.tail})`
        : `url(${snakeSprites.body})`;
      container.appendChild(segEl);

      segments.push({ el: segEl, x: startX, y: startY });
    }

    const path = [];
    const segmentGap = computeSegmentGap();
    const maxPath = (SNAKE_INITIAL_SEGMENTS + 2) * segmentGap + 2;
    for (let i = 0; i < maxPath; i++) {
      path.push({ x: startX, y: startY });
    }

    snake = {
      head: { el: headEl, x: startX, y: startY, angle: 0 },
      segments,
      path,
      isFrenzyVisual: false,
      speedFactor: 1.0
    };
    // apply current stage color on fresh snake
    applySnakeAppearance();
  }

  function randomSnakeEntry(width, height) {
    const edge = Math.floor(Math.random()*4);
    const offset = SNAKE_SEGMENT_SIZE * 2;
    const x = width * (.2 + Math.random()*.6);
    const y = height * (.2 + Math.random()*.6);
    return [
      {startX:-offset,startY:y,angle:0},
      {startX:width+offset,startY:y,angle:Math.PI},
      {startX:x,startY:-offset,angle:Math.PI/2},
      {startX:x,startY:height+offset,angle:-Math.PI/2}
    ][edge];
  }

  // Spawn a second active snake without touching the primary one
  function spawnAdditionalSnake(width, height, opts = {}) {
    const entering = typeof opts.startX !== "number" && typeof opts.startY !== "number";
    if (entering) opts = {...opts,...randomSnakeEntry(width,height)};
    const startX = typeof opts.startX === "number" ? opts.startX : width * 0.85;
    const startY = typeof opts.startY === "number" ? opts.startY : height * 0.5;
    const initialAngle = typeof opts.angle === "number" ? opts.angle : Math.PI;
    const segmentCount = typeof opts.segmentCount === "number"
      ? opts.segmentCount
      : SNAKE_INITIAL_SEGMENTS;
    const colorFilter = typeof opts.colorFilter === "string" ? opts.colorFilter : "";
    const snakeSprites = getPlayerSnakeSpriteSet();

    const headEl = document.createElement("div");
    headEl.className = "snake-head";
    headEl.style.position = "absolute";
    headEl.style.width = SNAKE_SEGMENT_SIZE + "px";
    headEl.style.height = SNAKE_SEGMENT_SIZE + "px";
    headEl.style.imageRendering = "pixelated";
    headEl.style.backgroundSize = "contain";
    headEl.style.backgroundRepeat = "no-repeat";
    headEl.style.pointerEvents = "none";
    headEl.style.zIndex = "30";
    headEl.style.backgroundImage = `url(${snakeSprites.head})`;
    container.appendChild(headEl);

    const segments = [];
    for (let i = 0; i < segmentCount; i++) {
      const segEl = document.createElement("div");
      const isTail = i === segmentCount - 1;
      segEl.className = isTail ? "snake-tail" : "snake-body";
      segEl.style.position = "absolute";
      segEl.style.width = SNAKE_SEGMENT_SIZE + "px";
      segEl.style.height = SNAKE_SEGMENT_SIZE + "px";
      segEl.style.imageRendering = "pixelated";
      segEl.style.backgroundSize = "contain";
      segEl.style.backgroundRepeat = "no-repeat";
      segEl.style.pointerEvents = "none";
      segEl.style.zIndex = "29";
      segEl.style.backgroundImage = isTail
        ? `url(${snakeSprites.tail})`
        : `url(${snakeSprites.body})`;
      container.appendChild(segEl);

      segments.push({ el: segEl, x: startX, y: startY });
    }

    const path = [];
    const segmentGap = computeSegmentGap();
    const maxPath = Math.max((segmentCount + 2) * segmentGap + 2, Math.ceil((segmentCount + 3)*SEGMENT_VISUAL_SPACING));
    for (let i = 0; i < maxPath; i++) {
      path.push({ x: startX - Math.cos(initialAngle)*i, y: startY - Math.sin(initialAngle)*i });
    }

    // Fresh snake: base speed + base color
    const newSnake = {
      head: { el: headEl, x: startX, y: startY, angle: initialAngle },
      segments,
      path,
      entering,
      entryAngle: initialAngle,
      isFrenzyVisual: false,
      speedFactor: typeof opts.speedFactor === "number" ? opts.speedFactor : 1.0,
      canGrow: typeof opts.canGrow === "boolean" ? opts.canGrow : true
    };

    if (colorFilter) {
      headEl.style.filter = colorFilter;
      for (const seg of segments) {
        seg.el.style.filter = colorFilter;
      }
    }

    // Position every part before its first paint; seed a straight trail outside.
    headEl.style.transform = `translate3d(${startX}px,${startY}px,0)`;
    segments.forEach((seg,i)=>{
      seg.x=startX-Math.cos(initialAngle)*SEGMENT_VISUAL_SPACING*(i+1);
      seg.y=startY-Math.sin(initialAngle)*SEGMENT_VISUAL_SPACING*(i+1);
      seg.el.style.transform=`translate3d(${seg.x}px,${seg.y}px,0)`;
    });
    return newSnake;
  }

  function removeSnakeInstance(targetSnake) {
    if (!targetSnake) return false;

    if (targetSnake.head && targetSnake.head.el && targetSnake.head.el.parentNode === container) {
      container.removeChild(targetSnake.head.el);
    }
    if (Array.isArray(targetSnake.segments)) {
      for (const seg of targetSnake.segments) {
        if (seg.el && seg.el.parentNode === container) {
          container.removeChild(seg.el);
        }
      }
    }

    if (targetSnake === snake) {
      snake = null;
    } else if (Array.isArray(extraSnakes)) {
      const idx = extraSnakes.indexOf(targetSnake);
      if (idx !== -1) extraSnakes.splice(idx, 1);
    }

    return true;
  }

  function applyEyeForAnEye() {
    const snakes = [];
    if (snake) snakes.push(snake);
    if (Array.isArray(extraSnakes)) {
      for (const s of extraSnakes) {
        if (s) snakes.push(s);
      }
    }

    if (eyeForEyeUsed || snakes.length < 2) return;
    eyeForEyeUsed = true;

    let slowest = snakes[0];
    let slowestSpeed = getSnakeSpeedFactor(slowest);
    for (const s of snakes) {
      const speed = getSnakeSpeedFactor(s);
      if (speed < slowestSpeed) {
        slowest = s;
        slowestSpeed = speed;
      }
    }

    removeSnakeInstance(slowest);

    if (!snake && Array.isArray(extraSnakes) && extraSnakes.length > 0) {
      snake = extraSnakes.shift();
    }

    if (!snake) {
      initSnake(window.innerWidth, window.innerHeight);
    }

    maxFrogsCap = Math.min(maxFrogsCap, 55);
    if (frogs.length > maxFrogsCap) {
      killRandomFrogs(frogs.length - maxFrogsCap, "eyeForEye");
    }
  }

  function growSnakeForSnake(snakeObj, extraSegments) {
    if (!snakeObj) return;
    if (snakeObj.canGrow === false || snakeObj.isBabySnake) {
      return;
    }
    extraSegments = extraSegments || 1;

    const currentLen = snakeObj.segments.length;
    const allowedExtra = Math.max(0, MAX_SNAKE_SEGMENTS - currentLen);
    if (allowedExtra <= 0) {
      return;
    }

    extraSegments = Math.min(extraSegments, allowedExtra);

    for (let i = 0; i < extraSegments; i++) {
      const tailIndex = snakeObj.segments.length - 1;
      const tailSeg = snakeObj.segments[tailIndex];

      const segEl = document.createElement("div");
      segEl.className = "snake-body";
      segEl.style.position = "absolute";
      segEl.style.width = SNAKE_SEGMENT_SIZE + "px";
      segEl.style.height = SNAKE_SEGMENT_SIZE + "px";
      segEl.style.imageRendering = "pixelated";
      segEl.style.backgroundSize = "contain";
      segEl.style.backgroundRepeat = "no-repeat";
      segEl.style.pointerEvents = "none";
      segEl.style.zIndex = "29";
      const snakeSprites = getPlayerSnakeSpriteSet();
      segEl.style.backgroundImage = `url(${snakeSprites.body})`;

      if (tailSeg?.el?.dataset.shedPalette) {
        setShedPalette(segEl, tailSeg.el.dataset.shedPalette === 'red' ? 2 : 1);
      }
      // 🔴 KEY FIX: inherit the tail's color/filter so new segments match
      if (tailSeg && tailSeg.el && tailSeg.el.style.filter) {
        segEl.style.filter = tailSeg.el.style.filter;
      }

      container.appendChild(segEl);

      snakeObj.segments.splice(tailIndex, 0, {
        el: segEl,
        x: tailSeg ? tailSeg.x : snakeObj.head.x,
        y: tailSeg ? tailSeg.y : snakeObj.head.y
      });

      applySnakeSpriteSet(snakeObj);
    }

    const desiredPathLength =
      (snakeObj.segments.length + 2) * computeSegmentGap() + 2;
    while (snakeObj.path.length < desiredPathLength) {
      const last = snakeObj.path[snakeObj.path.length - 1];
      snakeObj.path.push({ x: last.x, y: last.y });
    }

    // Primary snake still uses shed-color logic
    if (snakeObj === snake) {
      applySnakeAppearance();
    }
  }

  // Backwards-compatible wrapper (if anything else calls growSnake)
  function growSnake(extraSegments) {
    growSnakeForSnake(snake, extraSegments);
  }
function samplePathAtDistance(path, startIdx, dist) {
    let remaining = dist;
    let i = startIdx;

    while (i + 1 < path.length) {
      const ax = path[i].x,     ay = path[i].y;
      const bx = path[i + 1].x, by = path[i + 1].y;
      const dx = bx - ax,       dy = by - ay;
      const segLen = Math.sqrt(dx * dx + dy * dy);

      if (segLen >= remaining) {
        const t = remaining / segLen;
        return { x: ax + dx * t, y: ay + dy * t, nextStart: i };
      }

      remaining -= segLen;
      i++;
    }

    const last = path[path.length - 1];
    const secondLast = path.length >= 2 ? path[path.length - 2] : null;
    return { x: last.x, y: last.y, nextStart: path.length - 1, exhausted: true, secondLast };
  }
  // Tiny sprite cues, positioned in world space above the visible face.
  // Separate from the head element: no inherited rotation or shed-color filter.
  const debuffCues = new Map();
  const debuffReduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const debuffAsset = name => new URL('game-assets/sprites/debuffs/' + name, document.baseURI).href;
  const birdFrames = ['confusion-bird-down.svg', 'confusion-bird-up.svg'].map(debuffAsset);
  const puffFrames = ['shrink-puff-1.svg', 'shrink-puff-2.svg', 'shrink-puff-3.svg'].map(debuffAsset);
  const snailSprite = debuffAsset('slow-snail.svg');
  // Preload both wing poses and all puff frames to avoid first-use flicker.
  [...birdFrames, ...puffFrames, snailSprite].forEach(src => { const image = new Image(); image.src = src; });
  function debuffImage(src) {
    const image = document.createElement('img');
    image.src = src; image.alt = ''; image.draggable = false;
    image.style.cssText = 'display:block;width:100%;height:100%;image-rendering:pixelated;pointer-events:none;';
    return image;
  }
  function updateSnakeDebuffCue(obj, dt, active, size) {
    const head = obj.head;
    const confused = active && (snakeConfuseTime > 0 || obj.fruitConfuse > 0);
    const slowed = active && ((snakeSlowTime > 0 && snakeSlowCueTime > 0) || obj.fruitSlow > 0);
    const shrunk = active && (snakeShrinkTime > 0 || obj.fruitShrink > 0);
    let c = debuffCues.get(head.el);
    if (!c && !confused && !slowed && !shrunk) return;
    if (!c) {
      const el = document.createElement('div');
      el.setAttribute('aria-hidden','true');
      el.style.cssText='position:absolute;left:0;top:0;pointer-events:none;z-index:32;overflow:visible;';
      const birds = [0,1].map(() => {
        const b=document.createElement('span'); b.appendChild(debuffImage(birdFrames[0]));
        b.style.cssText='position:absolute;width:16px;height:10px;'; el.appendChild(b); return b;
      });
      const snail=document.createElement('span'); snail.appendChild(debuffImage(snailSprite));
      snail.style.cssText='position:absolute;width:20px;height:12px;'; el.appendChild(snail);
      const puff=document.createElement('span');
      puff.appendChild(debuffImage(puffFrames[0]));
      puff.style.cssText='position:absolute;width:28px;height:20px;display:none;';el.appendChild(puff);
      container.appendChild(el);
      c={el,birds,snail,puff,t:0,shrunk:false,puffTime:0};debuffCues.set(head.el,c);
    }
    if(shrunk!==c.shrunk && active) c.puffTime=.7;
    c.shrunk=shrunk;c.t+=dt;c.puffTime=Math.max(0,c.puffTime-dt);
    const scale=shrunk?.75:1;
    // Build 33 face is 40.73px tall, ending 8.017px below head center.
    const centerX=head.x+size/2;
    const faceTop=head.y+size/2+(8.01705-40.7303)*scale;
    const phase=debuffReduceMotion.matches?0:Math.floor(c.t*12)/12*3.8;
    c.el.style.transform=`translate(${centerX}px,${faceTop}px)`;
    c.birds.forEach((b,i)=>{
      b.style.display=confused?'block':'none';
      const a=phase+i*Math.PI;
      const x=Math.round(Math.cos(a)*10)-8;
      const y=Math.round(Math.sin(a)*2)-23;
      b.style.transform=`translate(${x}px,${y}px) scaleX(${Math.sin(a)>0?-1:1})`;
      b.style.opacity=Math.sin(a)<0?'.75':'1';
      const wingFrame = !debuffReduceMotion.matches && Math.floor(c.t*7+i)%2 ? 1 : 0;
      if (b.dataset.frame !== String(wingFrame)) { b.firstElementChild.src=birdFrames[wingFrame]; b.dataset.frame=String(wingFrame); }
    });
    c.snail.style.display=slowed?'block':'none';
    c.snail.style.transform=`translate(${confused?18:-10}px,${-23+(debuffReduceMotion.matches?0:Math.floor(c.t*3)%2)}px)`;
    c.puff.style.display=c.puffTime>0 && active?'block':'none';
    const puffFrame=Math.min(2,Math.floor((.7-c.puffTime)/.7*3));
    if(c.puff.dataset.frame!==String(puffFrame)){c.puff.firstElementChild.src=puffFrames[puffFrame];c.puff.dataset.frame=String(puffFrame);}
    c.puff.style.opacity='1';
    c.puff.style.transform=`translate(-14px,4px)`;
    c.el.style.display=active?'block':'none';
  }
  // Head removal (death, split, restart, menu) owns effect cleanup.
  new MutationObserver(() => {
    for(const [head,c] of debuffCues) if(!head.isConnected){c.el.remove();debuffCues.delete(head);}
  }).observe(container,{childList:true});



  function updateSingleSnake(snakeObj, dt, width, height, opts = {}) {
    if (!snakeObj) return;
    snakeObj.fruitCooldown=Math.max(0,(snakeObj.fruitCooldown||0)-dt);
    const fruitTick=dt*(1+getSnakeResistance());
    for(const key of ['fruitSlow','fruitConfuse','fruitShrink']) snakeObj[key]=Math.max(0,(snakeObj[key]||0)-fruitTick);
    if (snakeObj.selfConsume && updateSelfConsumption(snakeObj,dt)) return;

    const frogList = Array.isArray(opts.frogsList) ? opts.frogsList : frogs;
    const isMainMenu = !!opts.mainMenu;
    const marginX = 8;
    const marginY = 24;

    const head = snakeObj.head;
    if (!head) return;

    const shrinkScale = (snakeShrinkTime > 0 || snakeObj.fruitShrink > 0) ? 0.75 : 1.0;

    // 1. TARGETING
    let targetFrog = null;
    let bestDist2 = Infinity;
    let targetRemnant = null;
    let bestRemnantDist2 = Infinity;

    if (!isMainMenu && snakeObj.scissorsOwner && snakeEatingOldBody && scissorsRemnantSegments.length > 0) {
      snakeOldBodyChaseTime += dt;
      for (const seg of scissorsRemnantSegments) {
        const dx = (seg.x + SNAKE_SEGMENT_SIZE / 2) - head.x;
        const dy = (seg.y + SNAKE_SEGMENT_SIZE / 2) - head.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestRemnantDist2) {
          bestRemnantDist2 = d2;
          targetRemnant = seg;
        }
      }

    }

    for (const frog of frogList) {
      const dx = (frog.x + FROG_SIZE / 2) - head.x;
      const dy = (frog.baseY + FROG_SIZE / 2) - head.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDist2) {
        bestDist2 = d2;
        targetFrog = frog;
      }
    }

    // 2. MOVEMENT
    let desiredAngle = head.angle;
    if (snakeObj.entering) {
      desiredAngle = snakeObj.entryAngle;
    } else if (snakeConfuseTime > 0 || snakeObj.fruitConfuse > 0) {
      desiredAngle = panicAttackActive && !isMainMenu && targetFrog
        ? Math.atan2(head.y - (targetFrog.baseY + FROG_SIZE / 2), head.x - (targetFrog.x + FROG_SIZE / 2))
        : head.angle + (Math.random() - 0.5) * Math.PI;
    } else if (targetRemnant) {
      desiredAngle = Math.atan2(
        (targetRemnant.y + SNAKE_SEGMENT_SIZE / 2) - head.y,
        (targetRemnant.x + SNAKE_SEGMENT_SIZE / 2) - head.x
      );
    } else if (targetFrog) {
      desiredAngle = Math.atan2(
        (targetFrog.baseY + FROG_SIZE / 2) - head.y,
        (targetFrog.x + FROG_SIZE / 2) - head.x
      );
    }

    let angleDiff = ((desiredAngle - head.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    const maxTurn = snakeTurnRate * dt;
    head.angle += Math.max(-maxTurn, Math.min(maxTurn, angleDiff));

    const speedFactor = getSnakeSpeedFactor(snakeObj);
    const speed = SNAKE_BASE_SPEED * speedFactor;
    head.x += Math.cos(head.angle) * speed * dt;
    head.y += Math.sin(head.angle) * speed * dt;

    if (snakeObj.entering && head.x >= marginX+SNAKE_SEGMENT_SIZE &&
        head.x <= width-marginX-2*SNAKE_SEGMENT_SIZE &&
        head.y >= marginY+SNAKE_SEGMENT_SIZE &&
        head.y <= height-marginY-2*SNAKE_SEGMENT_SIZE) snakeObj.entering=false;
    // An entering snake must cross the boundary rather than bounce/teleport onto it.
    if (!snakeObj.entering) {
    // Boundary bounce
    if (head.x < marginX) {
      head.x = marginX;
      head.angle = Math.PI - head.angle;
    } else if (head.x > width - marginX - SNAKE_SEGMENT_SIZE) {
      head.x = width - marginX - SNAKE_SEGMENT_SIZE;
      head.angle = Math.PI - head.angle;
    }

    if (head.y < marginY) {
      head.y = marginY;
      head.angle = -head.angle;
    } else if (head.y > height - marginY - SNAKE_SEGMENT_SIZE) {
      head.y = height - marginY - SNAKE_SEGMENT_SIZE;
      head.angle = -head.angle;
    }

    }

    // 3. PATH & BODY POSITIONING
    snakeObj.path.unshift({ x: head.x, y: head.y });

    const minPathPoints = snakeObj.segments.length * SEGMENT_VISUAL_SPACING * 4 + 128;
    if (snakeObj.path.length > minPathPoints) {
      snakeObj.path.length = minPathPoints;
    }

        head.el.style.transform =
      `translate3d(${head.x}px, ${head.y}px, 0) scale(${shrinkScale})`;

    
    updateSnakeDebuffCue(snakeObj, dt, !isMainMenu, SNAKE_SEGMENT_SIZE);

    // Scale segment spacing to match visual size during shrink
    const visualSpacing = SEGMENT_VISUAL_SPACING * shrinkScale;

    // Sample this far ahead and behind each segment to compute a stable angle
    const ANGLE_LOOKAHEAD = 6;

    for (let i = 0; i < snakeObj.segments.length; i++) {
      const targetDist = visualSpacing * (i + 1);
      const result = samplePathAtDistance(snakeObj.path, 0, targetDist);

      const seg = snakeObj.segments[i];
      seg.x = result.x;
      seg.y = result.y;

      // Sample a point slightly closer to head and slightly further away
      // to get a stable direction vector that doesn't flip on slow/short paths
      const distAhead  = Math.max(0, targetDist - ANGLE_LOOKAHEAD);
      const distBehind = targetDist + ANGLE_LOOKAHEAD;

      const ptAhead  = samplePathAtDistance(snakeObj.path, 0, distAhead);
      const ptBehind = samplePathAtDistance(snakeObj.path, 0, distBehind);

      const dx = ptAhead.x - ptBehind.x;
      const dy = ptAhead.y - ptBehind.y;

      // If path was exhausted, compute angle from last two path points instead of defaulting to head
      let angle;
      if (dx !== 0 || dy !== 0) {
        angle = Math.atan2(dy, dx);
      } else if (result.exhausted && result.secondLast) {
        const ex = result.x - result.secondLast.x;
        const ey = result.y - result.secondLast.y;
        angle = (ex !== 0 || ey !== 0) ? Math.atan2(ey, ex) : head.angle;
      } else {
        angle = head.angle;
      }

      const isTail = !snakeObj.tailConsumed && i === snakeObj.segments.length - 1;
      seg.el.className = isTail ? "snake-tail" : "snake-body";
      const renderAngle = isTail ? angle + Math.PI : angle;
      seg.el.style.transform =
        `translate3d(${seg.x}px, ${seg.y}px, 0) rotate(${renderAngle}rad) scale(${shrinkScale})`;
    }

    if (!isMainMenu && forbiddenFruitActive && !snakeObj.entering && !snakeObj.fruitCooldown) {
      const radius=(snakeObj.fruitShrink > 0 ? 24 : getSnakeEatRadius())+ORB_RADIUS;
      const idx=orbs.findIndex(o=>Math.hypot(o.x+ORB_RADIUS-head.x-SNAKE_SEGMENT_SIZE/2,o.y+ORB_RADIUS-head.y-SNAKE_SEGMENT_SIZE/2)<radius);
      if(idx>=0){
        const orb=orbs.splice(idx,1)[0];orb.el.remove();snakeObj.fruitCooldown=3;
        const effects=[['fruitSlow',SNAKE_SLOW_DURATION],['fruitConfuse',SNAKE_CONFUSE_DURATION],['fruitShrink',SNAKE_SHRINK_DURATION]];
        const [key,duration]=effects[Math.floor(Math.random()*effects.length)];
        snakeObj[key]=Math.max(snakeObj[key]||0,duration*.5*(lingeringHexActive ? 1.15 : 1));playSnakeMunch();
      }
    }
    // 4. COLLISIONS
    const headCx = head.x + SNAKE_SEGMENT_SIZE / 2;
    const headCy = head.y + SNAKE_SEGMENT_SIZE / 2;
    const eatR2 = Math.pow((snakeObj.fruitShrink > 0 ? 24 : getSnakeEatRadius()), 2);

    for (let i = frogList.length - 1; i >= 0; i--) {
      const f = frogList[i];
      const dx = (f.x + FROG_SIZE / 2) - headCx;
      const dy = (f.baseY + FROG_SIZE / 2) - headCy;
      if (dx * dx + dy * dy <= eatR2) {
        if (isMainMenu) {
          frogList.splice(i, 1);
          if (f.el.parentNode) f.el.parentNode.removeChild(f.el);
        } else if (tryKillFrogAtIndex(i, "snake", snakeObj)) {
          frogsEatenCount++;
          score += (1 * permanentScoreMultiplier * (scoreMultiTime > 0 ? SCORE_MULTI_FACTOR : 1));
          if (frogsEatenCount % 2 === 0) growSnakeForSnake(snakeObj, 1);
        }
      }
    }

    if (snakeEatingOldBody && snakeObj.scissorsOwner && scissorsRemnantSegments.length > 0) {
      const remR2 = Math.pow(SNAKE_SEGMENT_SIZE * 0.8, 2);
      for (let i = scissorsRemnantSegments.length - 1; i >= 0; i--) {
        const s = scissorsRemnantSegments[i];
        const dx = (s.x + SNAKE_SEGMENT_SIZE / 2) - headCx;
        const dy = (s.y + SNAKE_SEGMENT_SIZE / 2) - headCy;
        if (dx * dx + dy * dy <= remR2) {
          if (s.el.parentNode) s.el.parentNode.removeChild(s.el);
          scissorsRemnantSegments.splice(i, 1);
          growSnakeForSnake(snakeObj, 1);
        }
      }
      if (scissorsRemnantSegments.length === 0) {
        snakeEatingOldBody = false;
        if (snakeOldBodySpeedBonusPending) {
          snakeObj.speedFactor *= 1.10;
          snakeOldBodySpeedBonusPending = false;
        }
      }
    }
  }

  function updateSnake(dt, width, height) {
    if (!snake) return;

    // Update primary snake
    updateSingleSnake(snake, dt, width, height);

    // Update any extra snakes
    if (extraSnakes && extraSnakes.length) {
      for (const s of extraSnakes) {
        updateSingleSnake(s, dt, width, height);
      }
    }
  }

  // --------------------------------------------------
  // PERMANENT, EPIC & LEGENDARY UPGRADE OVERLAY
  // --------------------------------------------------
  let upgradeOverlay = null;
  let upgradeOverlayButtonsContainer = null;
  let upgradeOverlayTitleEl = null;
  let upgradeOverlaySubEl = null;
  let currentUpgradeOverlayMode = "normal"; // "normal" | "epic" | "legendary"
  let currentUpgradeChoices = [];
  let upgradeOverlayContext = "mid";
  let initialUpgradeDone = false;          // starting upgrade before timer
  let firstTimedNormalChoiceDone = false;  // first 1-minute panel

  let mainMenuOverlay = null;

  // How-to-play overlay
  let howToOverlay = null;

  // Buff guide overlay
  let buffGuideOverlay = null;

  // Leaderboard overlay (UI shell)
  let leaderboardOverlay = null;
  let dashboardOverlay = null;
  let endGameSummaryOverlay = null;

  function getUpgradeChoices() {
    const statColors = {
      mobility: "yellow",
      buff: "yellow",
      survival: "yellow",
      orb: "yellow",
      role: "yellow"
    };

    const c = statColors;
    const deathPerPickPct = Math.round(COMMON_DEATHRATTLE_CHANCE * 100);
    const upgrades = [];
    if (!afterglowActive) upgrades.push({id:"afterglow", label:"Afterglow<br>Expired orbs have a <span>25%</span> chance to activate at <span class=menu-number-accent data-card-accent>half duration</span>", apply:()=>{afterglowActive=true;}});
    if (!panicAttackActive) upgrades.push({id:"panicAttack", label:"Panic Attack<br>Confused snakes <span class=menu-number-accent data-card-accent>flee</span> your frogs", apply:()=>{panicAttackActive=true;}});

    upgrades.push({id:"wildCompany",label:"Wild Company<br>Spawn <span>1–3</span> special frogs of a random common role",apply:()=>spawnRoleBatch(["bull","magnet","poison"][Math.floor(Math.random()*3)],1,3)});

    if (!nightBloomActive) {
      upgrades.push({
        id: "nightBloom",
        label: `🌙 Night Bloom<br>Expired orbs have a <span style="color:${c.buff};">20%</span> chance to spawn a frog`,
        apply: () => { nightBloomActive = true; }
      });
    }
    if (!lingeringHexActive) upgrades.push({
      id:"lingeringHex", label:"Lingering Hex<br>Snake debuffs last <span>15%</span> longer",
      apply:()=>{lingeringHexActive=true;}
    });





    if (!doubleYolkerActive) {
      upgrades.push({
        id: "doubleYolker",
        label: `🥚 Double Yolker<br>Orbs have a <span style="color:${c.buff};">15%</span> chance to spawn <span style="color:${c.buff};">2</span> frogs`,
        apply: () => { doubleYolkerActive = true; }
      });
    }

    if (frogs.length < maxFrogsCap) {
      upgrades.push({
        id: "spawn20",
        label: `🐸 Spawn frogs<br><span style="color:${c.role};">${NORMAL_SPAWN_AMOUNT}</span> frogs right now`,
        apply: () => { spawnExtraFrogs(NORMAL_SPAWN_AMOUNT); }
      });
    }

    if (orbSpawnIntervalFactor > minOrbSpawnIntervalFactor + 1e-4) {
      upgrades.push({
        id: "epicMoreOrbs",
        label: `🎯 Orb Flow<br>Increase orb spawn rate by <span style="color:${c.buff};">10%</span>`,
        apply: () => {
          orbSpawnIntervalFactor *= ORB_INTERVAL_UPGRADE_FACTOR;
          if (orbSpawnIntervalFactor < minOrbSpawnIntervalFactor) {
            orbSpawnIntervalFactor = minOrbSpawnIntervalFactor;
          }
        }
      });
    }

    if (!orbLingerBonusUsed) {
      upgrades.push({
        id: "orbWhisperer",
        label: `🌀 Orb Whisperer<br>Orbs linger <span style="color:${c.buff};">30%</span> longer`,
        apply: () => {
          orbLingerBonusUsed = true;
          orbTtlFactor *= 1.3;
          for (const orb of orbs) {
            const base = orb.maxTtl || ORB_TTL;
            orb.maxTtl = base * 1.3;
            orb.ttl *= 1.3;
          }
        }
      });
    }

    if (!ouroborosPactUsed && frogDeathRattleChance > 0) {
      upgrades.push({
        id: "ouroborosPact",
        label: `⚱️ Soul Offering<br>Deathrattle revivals leave <span class=menu-number-accent data-card-accent>an orb</span>`,
        apply: () => {
          ouroborosPactUsed = true;

        }
      });
    }

    const mutationChoice = getRandomMutationUpgrade();
    if (mutationChoice) {
      mutationChoice.label = String(mutationChoice.label || "").replaceAll(TOTAL_HIGHLIGHT_COLOR, c.mobility);
      upgrades.push(mutationChoice);
    }

    if (luckStat < MAX_LUCK) {
      upgrades.push({
        id: "luck",
        label: `🍀 Luck<br>Gain <span style="color:${c.buff};">+10</span> luck`,
        apply: () => { addLuck(10); }
      });
    }

    if (frogDeathRattleChance < MAX_DEATHRATTLE_CHANCE - 1e-4) {
      upgrades.push({
        id: "commonDeathRattle",
        label: `💀 Deathrattle<br><span style="color:${c.survival};">+${deathPerPickPct}%</span> revive chance`,
        apply: () => {
          frogDeathRattleChance = Math.min(
            MAX_DEATHRATTLE_CHANCE,
            frogDeathRattleChance + COMMON_DEATHRATTLE_CHANCE
          );
        }
      });
    }

    if (!lastStandActive) {
      upgrades.push({
        id: "lastStand",
        label: `🏹 Last Stand<br>Last frog has <span style="color:${c.survival};">${Math.round(LAST_STAND_MIN_CHANCE * 100)}%</span> revive odds`,
        apply: () => { lastStandActive = true; }
      });
    }

    if (!survivalInstinctActive) {
      upgrades.push({
        id: "survivalInstinct",
        label: `⚡ Survival Instinct<br>When below 10 frogs, they hop <span style="color:${c.mobility};">20%</span> faster`,
        apply: () => { survivalInstinctActive = true; }
      });
    }

    upgrades.push({
      id: "luckyRoll",
      label: `🎲 Lucky Roll<br>Trigger a random orb buff with <span style="color:${c.buff};">+50%</span> duration`,
      apply: () => { triggerLuckyRoll(); }
    });





    return upgrades;
  }
  function applySnakeEggToLowestShedSnake() {
    if (bruisedEggActive) return;
    const candidates = [snake, ...extraSnakes].filter(Boolean);
    const stageOf = s => s.shedStage ?? (s === snake ? snakeShedStage : s.isBabySnake ? 0 : 2);
    candidates.sort((a,b) => stageOf(a)-stageOf(b) || getSnakeSpeedFactor(a)-getSnakeSpeedFactor(b));
    if (!candidates.length) return;
    candidates[0].snakeEggProtected = true;
    bruisedEggActive = true;
  }

  function applyPeaceOfMind() {
    if (peaceOfMindActive || luckStat < 20) return;
    peaceOfMindActive = true;
    addLuck(-luckStat);
    panicHopTime = 0;
    // Replace already spawned negative orbs with valid non-panic pickups.
    for (let i = orbs.length - 1; i >= 0; i--) {
      if (orbs[i].type !== "panicHop") continue;
      const old = orbs.splice(i, 1)[0];
      old.el.remove();
      spawnOrb(getRandomTriggeredOrbBuffType(["panicHop"]), old.x, old.y);
      const replacement = orbs[orbs.length - 1];
      replacement.ttl = old.ttl;
      replacement.maxTtl = old.maxTtl;
      totalOrbsSpawned--; // Conversion is not an additional spawned orb.
    }
  }

  function getEpicUpgradeChoices() {
    const epicTitleColor = "yellow";
    const deathPerPickPct = Math.round(EPIC_DEATHRATTLE_CHANCE * 100);

    const upgrades = [];
    if (!pairOfScissorsUsed && snake && snake.segments.length >= 8) {
      upgrades.push({
        id: "pairOfScissors",
        label: `✂️ Ouroboros Curse<br>Snake consumes half its body. <span class=menu-number-accent data-card-accent>Slows it</span>`,
        apply: () => { applyPairOfScissors(); }
      });
    }
    if (!forbiddenFruitActive) upgrades.push({id:"forbiddenFruit",label:'Forbidden Fruit<br>Orbs briefly debuff snakes that <span class=menu-number-accent data-card-accent>eat</span> them.',apply:()=>{forbiddenFruitActive=true;}});
    if (!higherCallingActive && upgradeOverlayContext === "shed") upgrades.push({id:"higherCalling",label:'Higher Calling<br>Choose <span style="color:#006b83">2</span> epics at each shed.',apply:()=>{higherCallingActive=true;}});
    if (!secondHelpingPending && secondHelpingPicksRemaining === 0) upgrades.push({
      id:"secondHelping", label:'Second Helping<br>Your next common upgrade offers <span class="stat-highlight" style="color:#006b83;">3</span> picks.',
      apply:()=>{ secondHelpingPending = true; }
    });
    if (!peaceOfMindActive && luckStat >= 20) upgrades.push({
      id:"peaceOfMind", label:"Peace of Mind<br>Spend <span class=menu-number-accent data-card-accent>all luck</span>. No more Panic Hop.",
      apply:applyPeaceOfMind
    });
    if (!eyeForEyeUsed && (snake ? 1 : 0) + extraSnakes.filter(Boolean).length >= 2) {
      upgrades.push({id:"eyeForEye", label:"Eye for Eye<br>Kill the slowest snake. Frog cap becomes <span>55</span>.", apply:applyEyeForAnEye});
    }

    if (!royalApprenticeshipActive) upgrades.push({id:"royalApprenticeship", label:"Royal Apprenticeship<br>Spawning special frogs turns <span class=menu-number-accent data-card-accent>crowned frogs</span> into that role", apply:()=>{royalApprenticeshipActive=true;}});

    upgrades.push({
      id: "roleDraft",
      label: `🎭 Role Draft<br>Choose a role. Spawn <span style="color:${epicTitleColor};">2–5</span> special frogs`,
      opensRoleDraft: true,
      apply: () => {
        roleDraftUsed = true;
        showRoleDraftOverlayChoices();
      }
    });
    upgrades.push({
      id: "epicOrbStorm",
      label: `🌪️ Orb Storm<br>Drop <span style="color:${epicTitleColor};">8–15</span> random orbs across the arena`,
      apply: () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const count = getLuckBiasedInt(8, 15);
        for (let i = 0; i < count; i++) {
          spawnOrbRandom(w, h);
        }
      }
    });
    if (!lastingLegacyActive) upgrades.push({
      id:"lastingLegacy", label:"Lasting Legacy<br><span>20%</span> chance to pass a special frog’s role on death",
      apply:()=>{lastingLegacyActive=true;}
    });
    if (!bruisedEggActive && snake) upgrades.push({
      id: "bruisedEgg",
      label: "Snake Egg<br>Snake gains <span>25%</span> less speed per shed",
      apply: applySnakeEggToLowestShedSnake
    });
    if (!brittleScalesActive) upgrades.push({
      id:"brittleScales", label:"Brittle Scales<br><span class=menu-number-accent data-card-accent>Halve</span> snake debuff resistance",
      apply:()=>{brittleScalesActive=true;}
    });


    if (!chainReactionActive) {
      upgrades.push({
        id: "chainReaction",
        label: `⚡ Chain Reaction<br>Orb collection has a <span style="color:${epicTitleColor};">15%</span> chance to trigger a second free orb buff`,
        apply: () => { chainReactionActive = true; }
      });
    }

    /*
    if (!snakeEggActive && babySnakes.length === 0) {
      upgrades.push({
        id: "snakeEgg",
        label: `🥚 Snake Egg<br>Hatches <span style="color:${epicTitleColor};">2 baby snakes</span> at a random 1-min interval. Gain <span style="color:${epicTitleColor};">+10%</span> to all stats while active.`,
        apply: () => { activateSnakeEgg(); }
      });
    }
    */

    if (!extraUpgradeOptionActive) {
      upgrades.push({
        id: "extraUpgradeOption",
        label: `🃏 Loaded Hand<br>Future upgrade screens show <span style="color:${epicTitleColor};">4</span> choices instead of 3`,
        apply: () => { extraUpgradeOptionActive = true; }
      });
    }



    if (frogs.length < maxFrogsCap) {
      upgrades.push({
        id: "tidalWave",
        label: `🌊 Tidal Wave<br>Double your frogs. Spawn at least <span style="color:${epicTitleColor};">15</span>`,
        apply: () => { spawnTidalWave(); }
      });
    }

    if (frogDeathRattleChance < Math.min(0.15, MAX_DEATHRATTLE_CHANCE) - 1e-4) {
      upgrades.push({
        id: "epicDeathRattle",
        label: `💀 Epic Deathrattle<br><span style="color:${epicTitleColor};">+${deathPerPickPct}%</span> revive chance`,
        apply: () => {
          frogDeathRattleChance = Math.min(
            MAX_DEATHRATTLE_CHANCE,
            frogDeathRattleChance + EPIC_DEATHRATTLE_CHANCE
          );
        }
      });
    }

    if (!orbSpecialistActive) {
      upgrades.push({
        id: "epicOrbSpecialist",
        label: `🧪 Orb Specialist<br>Collected orbs have a <span style="color:${epicTitleColor};">50%</span> chance to spawn <span style="color:${epicTitleColor};">1</span> extra frog`,
        apply: () => { orbSpecialistActive = true; }
      });
    }

    if (!secondWindUsed && !secondWindActive) {
      upgrades.push({
        id: "secondWind",
        label: `💨 Second Wind<br>Below 10 frogs: instantly spawn <span style="color:${epicTitleColor};">20</span> (once)`,
        apply: () => { secondWindActive = true; }
      });
    }

    if (!graveWaveActive && !graveWaveUsed) {
      upgrades.push({
        id: "graveWave",
        label: `👻 Grave Wave<br>Each shed spawns <span style="color:${epicTitleColor};">7–15</span> frogs`,
        apply: () => { graveWaveActive = true; graveWaveUsed = true; }
      });
    }

    if (!toxicBloodActive) {
      upgrades.push({
        id: "toxicBlood",
        label: `🩸 Poisonous Skin<br>Snake is <span class=menu-number-accent data-card-accent>slowed</span> briefly every time it eats a frog`,
        apply: () => { toxicBloodActive = true; }
      });
    }

    if (frogs.length > 0) {
      upgrades.push({
        id: "promotionEpic",
        label: `🥇 Promotion<br>Up to <span style="color:${epicTitleColor};">10</span> random frogs gain <span style="color:${epicTitleColor};">+1 star</span>`,
        apply: () => { promoteAllFrogs(); }
      });
    }

    if (!frogScatterUsed && frogs.length > 0) {
      upgrades.push({
        id: "frogScatter",
        label: `🌪️ Frog Scatter<br><span class=menu-number-accent data-card-accent>Respawn all frogs</span>. Keep roles and crowns; trigger death effects`,
        apply: () => { frogScatterUsed = true; scatterFrogSwarm(); }
      });
    }

    if (!moltFortuneActive) {
      upgrades.push({
        id: "moltFortune",
        label: `🔮 Molt Fortune<br>Snake drops <span style="color:${epicTitleColor};">5-10</span> orbs when shedding`,
        apply: () => { moltFortuneActive = true; }
      });
    }

    return upgrades;
  }
  function clearMainMenuSnakes() {
    if (!Array.isArray(mainMenuSnakes)) return;
    for (const s of mainMenuSnakes) {
      removeSnakeInstance(s);
    }
    mainMenuSnakes = [];
  }

  function clearMainMenuFrogs() {
    if (!Array.isArray(mainMenuFrogs)) return;
    for (const frog of mainMenuFrogs) {
      if (frog.el && frog.el.parentNode === container) {
        container.removeChild(frog.el);
      }
    }
    mainMenuFrogs = [];
  }

  function buildMenuFrogState(x, y, tokenId) {
    const el = document.createElement("div");
    el.className = "frog-sprite"; el.dataset.pocketColor=Math.floor(Math.random()*8);
    el.style.position = "absolute";
    el.style.width = FROG_SIZE + "px";
    el.style.height = FROG_SIZE + "px";
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    el.style.pointerEvents = "none";
    el.style.zIndex = "8";
    container.appendChild(el);

    const personalityRoll = Math.random();
    let idleMin, idleMax, hopMin, hopMax, heightMin, heightMax;

    if (personalityRoll < 0.25) {
      idleMin = 0.3; idleMax = 1.0;
      hopMin = 0.25; hopMax = 0.50;
      heightMin = 15.4; heightMax = 32;
    } else if (personalityRoll < 0.6) {
      idleMin = 0.8; idleMax = 3.0;
      hopMin = 0.35; hopMax = 0.63;
      heightMin = 11; heightMax = 26;
    } else {
      idleMin = 2.0; idleMax = 5.0;
      hopMin = 0.45; hopMax = 0.9;
      heightMin = 6;  heightMax = 20;
    }

    const frog = {
      tokenId,
      el,
      x,
      y,
      baseY: y,
      hopStartX: x,
      hopStartBaseY: y,
      hopEndX: x,
      hopEndBaseY: y,
      state: "idle",
      idleTime: randRange(idleMin, idleMax),
      hopTime: 0,
      hopDuration: randRange(hopMin, hopMax),
      hopHeight: randRange(heightMin, heightMax),
      idleMin,
      idleMax,
      hopDurMin: hopMin,
      hopDurMax: hopMax,
      hopHeightMin: heightMin,
      hopHeightMax: heightMax,
      speedMult: 1.0,
      jumpMult: 1.0,
      spriteSrc: getRandomFrogSprite(),
      skinSrc: getRandomFrogSkin()
    };

    return frog;
  }

  function createMainMenuFrog(x, y) {
    const tokenId = randInt(1, MAX_TOKEN_ID);
    const frog = buildMenuFrogState(x, y, tokenId);
    mainMenuFrogs.push(frog);

    frog.el.style.backgroundImage = `url("${frog.spriteSrc}")`;
    frog.el.style.backgroundSize = "contain";
    frog.el.style.backgroundRepeat = "no-repeat";
    frog.el.style.backgroundPosition = "center";

    return frog;
  }

  function getMainMenuSpeedFactor(frog) {
    return frog.speedMult || 1.0;
  }

  function getMainMenuJumpFactor(frog) {
    return frog.jumpMult || 1.0;
  }

  function chooseMainMenuHopDestination(frog, width, height) {
    const marginX = 8;
    const marginY = 24;
    const centerX = frog.x + FROG_SIZE / 2;
    const centerY = frog.baseY + FROG_SIZE / 2;

    let targetX = frog.x + randRange(-12, 12);
    let targetBaseY = frog.baseY + randRange(-6, 6);

    let fleeAngle = null;
    let nearestD2 = Infinity;

    for (const snakeObj of mainMenuSnakes) {
      if (!snakeObj || !snakeObj.head) continue;
      const dx = centerX - snakeObj.head.x;
      const dy = centerY - snakeObj.head.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < nearestD2) {
        nearestD2 = d2;
        fleeAngle = Math.atan2(dy, dx);
      }
    }

    if (fleeAngle !== null && nearestD2 < 320 * 320) {
      const hopDist = randRange(120, 220);
      const angle = fleeAngle + randRange(-0.35, 0.35);
      targetX = frog.x + Math.cos(angle) * hopDist;
      targetBaseY = frog.baseY + Math.sin(angle) * hopDist;
    }

    targetX = Math.max(marginX, Math.min(width - marginX - FROG_SIZE, targetX));
    targetBaseY = Math.max(
      marginY,
      Math.min(height - marginY - FROG_SIZE, targetBaseY)
    );

    frog.hopStartX = frog.x;
    frog.hopStartBaseY = frog.baseY;
    frog.hopEndX = targetX;
    frog.hopEndBaseY = targetBaseY;
  }

  function updateMainMenuFrogs(dt, width, height) {
    const marginX = 8;
    const marginY = 24;

    for (const frog of mainMenuFrogs) {
      if (frog.state === "idle") {
        frog.idleTime -= dt;
        frog.y = frog.baseY;

        if (frog.idleTime <= 0) {
          frog.state = "hopping";
          frog.hopTime = 0;

          const baseDur = randRange(frog.hopDurMin, frog.hopDurMax);
          frog.hopDuration = baseDur * getMainMenuSpeedFactor(frog);

          const spice = Math.random();
          let hopHeight;
          if (spice < 0.1) {
            hopHeight = randRange(
              frog.hopHeightMax * 1.1,
              frog.hopHeightMax * 1.8
            );
          } else if (spice < 0.25) {
            hopHeight = randRange(2, frog.hopHeightMin * 0.7);
          } else {
            hopHeight = randRange(frog.hopHeightMin, frog.hopHeightMax);
          }
          frog.hopHeight = hopHeight * getMainMenuJumpFactor(frog);

          chooseMainMenuHopDestination(frog, width, height);
          playRandomRibbit();
        }
      } else if (frog.state === "hopping") {
        frog.hopTime += dt;
        const t = Math.min(1, frog.hopTime / frog.hopDuration);

        const groundX = frog.hopStartX + (frog.hopEndX - frog.hopStartX) * t;
        const groundBaseY =
          frog.hopStartBaseY + (frog.hopEndBaseY - frog.hopStartBaseY) * t;

        const offset = -4 * frog.hopHeight * t * (1 - t);

        frog.x = groundX;
        frog.baseY = groundBaseY;
        frog.y = groundBaseY + offset;

        if (frog.hopTime >= frog.hopDuration) {
          frog.state = "idle";

          const baseIdle = randRange(frog.idleMin, frog.idleMax);
          frog.idleTime = baseIdle * getMainMenuSpeedFactor(frog);

          frog.x = frog.hopEndX;
          frog.baseY = frog.hopEndBaseY;
          frog.y = frog.baseY;

          frog.x = Math.max(marginX, Math.min(width - marginX - FROG_SIZE, frog.x));
          frog.baseY = Math.max(
            marginY,
            Math.min(height - marginY - FROG_SIZE, frog.baseY)
          );
        }
      }

      frog.el.style.transform = `translate3d(${frog.x}px, ${frog.y}px, 0)`;
    }
  }

  function ensureMainMenuFrogCount(count, width, height) {
    const marginX = 16;
    const marginY = 32;

    while (mainMenuFrogs.length < count) {
      const x = randRange(marginX, width - marginX - FROG_SIZE);
      const y = randRange(marginY, height - marginY - FROG_SIZE);
      createMainMenuFrog(x, y);
    }
  }

  function updateMainMenuSnakes(dt, width, height) {
    for (const s of mainMenuSnakes) {
      updateSingleSnake(s, dt, width, height, {
        mainMenu: true,
        frogsList: mainMenuFrogs
      });
    }
  }

  function runMainMenuFrame(time) {
    if (!mainMenuActive) {
      mainMenuAnimId = null;
      mainMenuLastTime = 0;
      return;
    }

    if (!mainMenuLastTime) mainMenuLastTime = time;
    let dt = (time - mainMenuLastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    mainMenuLastTime = time;

    const width  = window.innerWidth;
    const height = window.innerHeight;

    ensureMainMenuFrogCount(8, width, height);
    updateMainMenuFrogs(dt, width, height);
    updateMainMenuSnakes(dt, width, height);

    mainMenuAnimId = requestAnimationFrame(runMainMenuFrame);
  }

function startMainMenuBackground() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  clearMainMenuSnakes();
  clearMainMenuFrogs();

  const count = Math.min(STARTING_FROGS, maxFrogsCap);
  const positions = computeInitialPositions(width, height, count);

  for (const pos of positions) {
    const frog = createFrogAt(pos.x, pos.y, null);

    // remove from live run list; keep as menu background frogs
    frogs.pop();
    mainMenuFrogs.push(frog);

    frog.state = "idle";
    frog.idleTime = 999999;
    frog.hopTime = 0;
    frog.y = frog.baseY;
    frog.el.style.transform = `translate3d(${frog.x}px, ${frog.y}px, 0)`;
  }

  mainMenuActive = true;
  mainMenuLastTime = 0;

  if (mainMenuAnimId) {
    cancelAnimationFrame(mainMenuAnimId);
    mainMenuAnimId = null;
  }
}

function stopMainMenuBackground(preserveFrogs = false) {
  mainMenuActive = false;

  if (mainMenuAnimId) {
    cancelAnimationFrame(mainMenuAnimId);
    mainMenuAnimId = null;
  }

  mainMenuLastTime = 0;
  clearMainMenuSnakes();

  if (!preserveFrogs) {
    clearMainMenuFrogs();
  }
}
function openAnimatedOverlay(overlayEl) {
  if (!overlayEl) return;

  overlayEl.classList.remove("is-animating-out");
  overlayEl.classList.add("is-open");
  overlayEl.style.display = "flex";

  const panel = overlayEl.querySelector(".frog-panel");
  if (!panel) return;

  void panel.offsetWidth;

  overlayEl.classList.add("is-animating-in");

  panel.addEventListener(
    "animationend",
    () => {
      overlayEl.classList.remove("is-animating-in");
    },
    { once: true }
  );
}

function closeAnimatedOverlay(overlayEl) {
  if (!overlayEl) return;
  overlayEl.classList.remove("is-animating-in", "is-animating-out", "is-open");
  overlayEl.style.display = "none";
}
  function initMainMenuOverlay() {
    if (mainMenuOverlay) return;

    mainMenuOverlay = document.getElementById("mainMenuOverlay");
    const btnStartRun = document.getElementById("btnStartRun");
    const btnHowTo = document.getElementById("btnHowTo");
    const btnBuffGuide = document.getElementById("btnBuffGuide");
    const btnLeaderboard = document.getElementById("btnLeaderboard");
    const btnDashboard = document.getElementById("btnDashboard");
    document.getElementById('btnFieldGuide')?.remove();

    if (btnStartRun) {
      btnStartRun.addEventListener("click", () => {
        startRunFromMenu();
      });
    }

    if (btnHowTo) {
      btnHowTo.addEventListener("click", () => {
        showHowToOverlay();
      });
    }

    if (btnBuffGuide) {
      btnBuffGuide.addEventListener("click", () => {
        showBuffGuideOverlay();
      });
    }

    if (btnLeaderboard) {
      btnLeaderboard.addEventListener("click", () => {
        showLeaderboardOverlay();
      });
    }

    if (btnDashboard) {
      btnDashboard.addEventListener("click", () => {
        showDashboardOverlay();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (mainMenuOverlay && mainMenuOverlay.style.display === "flex" && e.key === "Enter") {
        startRunFromMenu();
      }
    });
  }

  function hideUpgradeOverlayForMenu() {
    if (upgradeOverlay) {
      upgradeOverlay.style.display = "none";
    }

    if (upgradeOverlayButtonsContainer) {
      upgradeOverlayButtonsContainer.innerHTML = "";
    }
  }

  function showMainMenu() {
    if (!mainMenuOverlay) initMainMenuOverlay();
    if (!mainMenuOverlay) return;

    hideUpgradeOverlayForMenu();

    if (MAIN_MENU_BACKGROUND_ENABLED && !hasShownInitialMenuFrogs) {
      hasShownInitialMenuFrogs = true;
      startMainMenuBackground();
    } else {
      stopMainMenuBackground();
    }

    setInGameUIVisible(false);
    mainMenuActive = true;
    gamePaused = true;
    syncAudioMuteState();

    mainMenuOverlay.style.display = "flex";
    mainMenuOverlay.classList.add("is-open");
    mainMenuOverlay.classList.remove("is-animating-out");

    const panel = mainMenuOverlay.querySelector(".frog-panel");
    if (panel) {
      panel.style.display = "block";
    }
  }

  function hideMainMenu() {
    mainMenuActive = false;
    stopMainMenuBackground();
    syncAudioMuteState();
    if (mainMenuOverlay) {
      closeAnimatedOverlay(mainMenuOverlay);
    }
  }

  const FIRST_PLAY_HELP_KEY = "escapeSnake.howToSeen.v1";
  let howToSeenThisSession = false;
  let startAfterHowTo = false;
  function hasSeenHowTo() {
    if (howToSeenThisSession) return true;
    try { return localStorage.getItem(FIRST_PLAY_HELP_KEY) === "1"; }
    catch (_) { return false; }
  }
  function rememberHowTo() {
    howToSeenThisSession = true;
    try { localStorage.setItem(FIRST_PLAY_HELP_KEY, "1"); } catch (_) {}
  }
  function initHowToOverlay() {
    if (howToOverlay) return;
    howToOverlay = document.getElementById("howToOverlay");
    const closeBtn = document.getElementById("howToCloseBtn");

    closeBtn.addEventListener("click", hideHowToOverlay);

    document.addEventListener("keydown", (e) => {
      if (howToOverlay && howToOverlay.style.display === "flex" && e.key === "Escape") {
        hideHowToOverlay();
      }
    });
  }
  function showHowToOverlay() {
    if (!howToOverlay) initHowToOverlay();
    if (!howToOverlay) return;

    const panel = howToOverlay.querySelector(".frog-panel");
    if (!panel) return;

    panel.innerHTML = `
      <div class="frog-panel-title">How to Play</div>
      <p class="ui-help-intro">Keep your frogs alive. Keep moving.</p>
      <div class="ui-help-steps">
        <section><img src="game-assets/sprites/approved/frog-crowned.png" alt=""><div><h3>Lead your frogs</h3><p>Move your mouse, or touch and drag. Your frogs follow you.</p></div></section>
        <section><img src="game-assets/sprites/snake-head.png" alt=""><div><h3>Stay ahead</h3><p>The snake chases your frogs. Lose them all and the run ends.</p></div></section>
        <section><img src="game-assets/sprites/approved/upgrade-orb-whisperer.png" alt=""><div><h3>Collect & grow</h3><p>Pick up orbs for temporary powers and upgrade choices.</p></div></section>
      </div>
      <p class="ui-help-note">Every 3 minutes, the snake sheds and speeds up. After 3 sheds, another snake joins.</p>
      <div class="frog-panel-footer"><button id="howToCloseBtn" class="frog-btn frog-btn-secondary">Back to menu</button></div>
    `;

    const closeBtn = document.getElementById("howToCloseBtn");
    if (closeBtn) closeBtn.addEventListener("click", hideHowToOverlay);


    rememberHowTo();
    openAnimatedOverlay(howToOverlay);
  }

  function hideHowToOverlay() {
    if (howToOverlay) {
      closeAnimatedOverlay(howToOverlay);
    }
    if (startAfterHowTo) {
      startAfterHowTo = false;
      startNewRun();
    }
  }

  // Build dynamic Buff & Upgrade guide content from live config / state
  function buildBuffGuideHtml() {
    const fmtPct = (val) => statHighlight(`${Math.round(val)}%`);
    const fmtSec = (val) => statHighlight(`${val}s`);
    const fmtRange = (min, max) => statHighlight(`${min}–${max}`);

    const tempBuffs = [
      { title: "Speed Boost", desc: `Frogs hop ${fmtPct((1 - SPEED_BUFF_FACTOR) * 100)} faster for ${fmtSec(SPEED_BUFF_DURATION)} (extended by buff bonuses).` },
      { title: "Jump Surge", desc: `Jump height increases by ${fmtPct((JUMP_BUFF_FACTOR - 1) * 100)} for ${fmtSec(JUMP_BUFF_DURATION)}.` },
      { title: "Spawn Orb", desc: `Instantly spawns ${fmtRange(1, 10)} frogs; Lucky collectors can add up to ${statHighlight("+3")} more.` },
      { title: "Mega Spawn", desc: `Drops ${fmtRange(10, 20)} frogs at once; Lucky collectors can add up to ${statHighlight("+8")} more.` },
      { title: "Snake Slow", desc: `The snake moves ${fmtPct((1 - SNAKE_SLOW_FACTOR) * 100)} slower for ${fmtSec(SNAKE_SLOW_DURATION)}.` },
      { title: "Snake Confuse", desc: `The snake zig-zags erratically for ${fmtSec(SNAKE_CONFUSE_DURATION)}.` },
      { title: "Snake Shrink", desc: `Bite radius shrinks to about ${statHighlight(`${Math.round(SNAKE_EAT_RADIUS_BASE / 2)}px`)} for ${fmtSec(SNAKE_SHRINK_DURATION)}.` },
      { title: "Frog Shield", desc: `Team ignores hits for ${fmtSec(FROG_SHIELD_DURATION)}.` },
      { title: "Orb Magnet", desc: `Pulls orbs within ${statHighlight(`${ORB_MAGNET_PULL_RANGE}px`)} toward frogs for ${fmtSec(ORB_MAGNET_DURATION)}.` },
      { title: "Time Slow", desc: `Everything runs ${fmtPct((1 - TIME_SLOW_FACTOR) * 100)} slower for ${fmtSec(TIME_SLOW_DURATION)}.` },
      { title: "Score Multiplier", desc: `Score gains are ${fmtPct(SCORE_MULTI_FACTOR * 100)} for ${fmtSec(SCORE_MULTI_DURATION)}.` },
      { title: "Panic Hop", desc: `Chaotic hops about ${fmtPct((1 - PANIC_HOP_SPEED_FACTOR) * 100)} faster for ${fmtSec(PANIC_HOP_DURATION)}.` },
      { title: "Life Steal", desc: `For ${fmtSec(LIFE_STEAL_DURATION)}, every deathrattle roll is boosted to at least ${fmtPct(MAX_DEATHRATTLE_CHANCE * 100)}.` },
      { title: "Clone Swarm", desc: `For ${fmtSec(CLONE_SWARM_DURATION)}, about ${fmtPct(65)} of snake bites snap at decoy clones instead.` },
      { title: "Perma Frog", desc: `Grants the collector a random permanent role (Cannibal, Aura, Magnet, Lucky, or Zombie).` }
    ];

    const speedPerPickPct = Math.round((1 - FROG_SPEED_UPGRADE_FACTOR) * 100);
    const jumpPerPickPct  = Math.round((FROG_JUMP_UPGRADE_FACTOR - 1) * 100);
    const buffPerPickPct  = Math.round((BUFF_DURATION_UPGRADE_FACTOR - 1) * 100);
    const orbPerPickPct   = Math.round((1 - ORB_INTERVAL_UPGRADE_FACTOR) * 100);
    const deathPerPickPct = Math.round(COMMON_DEATHRATTLE_CHANCE * 100);
    const orbCollectPct   = Math.round(ORB_COLLECTOR_CHANCE * 100);

    const commonUpgrades = [
      { title: "Quicker Hops", desc: `${fmtPct(speedPerPickPct)} faster hops each pick (up to ${fmtPct((1 - MIN_FROG_SPEED_FACTOR) * 100)} total).` },
      { title: "Higher Hops", desc: `${fmtPct(jumpPerPickPct)} taller jumps per pick (cap ${fmtPct((MAX_FROG_JUMP_FACTOR - 1) * 100)}).` },
      { title: "Spawn Frogs", desc: `Instantly adds ${statHighlight(NORMAL_SPAWN_AMOUNT)} frogs (only offered if you're below cap).` },
      { title: "Orb Whisperer", desc: `Orbs linger ${fmtPct(20)} longer before fading.` },
      { title: "Soul Offering", desc: "Deathrattle revivals leave an orb." },
      { title: "Coin Flip", desc: `Sacrifice ${statHighlight("1")} frog to trigger a random buff at ${statHighlight("1.75×")} duration.` },
      { title: "Buffs Last Longer", desc: `${fmtPct(buffPerPickPct)} buff duration each pick.` },
      { title: "More Orbs", desc: `Orb spawns speed up by ~${fmtPct(orbPerPickPct)} per pick.` },
      { title: "Deathrattle", desc: `${fmtPct(deathPerPickPct)} revive chance per pick (caps at ${fmtPct(MAX_DEATHRATTLE_CHANCE * 100)}).` },
      { title: "Orb Collector", desc: `Each orb gains +${fmtPct(orbCollectPct)} chance to spawn a frog (caps at ${fmtPct(MAX_ORB_COLLECTOR_TOTAL * 100)}).` },
      { title: "Last Stand", desc: `Your final frog has at least ${fmtPct(LAST_STAND_MIN_CHANCE * 100)} chance to revive.` }
    ];

    const epicBuffPerPickPct = Math.round(((BUFF_DURATION_UPGRADE_FACTOR + 0.15) - 1) * 100);
    const epicDeathPct       = Math.round(EPIC_DEATHRATTLE_CHANCE * 100);

    const epicUpgrades = [
      { title: "Epic Frog Wave", desc: `Spawn ${statHighlight(EPIC_SPAWN_AMOUNT)} frogs instantly.` },
      { title: "Epic Deathrattle", desc: `${fmtPct(epicDeathPct)} revive chance in one pick.` },
      { title: "Epic Buff Duration", desc: `${fmtPct(epicBuffPerPickPct)} longer buffs with one choice.` },
      { title: "Orb Storm", desc: `Drop ${statHighlight(ORB_STORM_COUNT)} random orbs across the arena right now.` },
      { title: "Snake Egg", desc: "The lowest-shed snake gains 25% less speed per shed." },
      { title: "Frog Promotion", desc: `${statHighlight(10)} new frogs, each with a random permanent role.` },
      { title: "Grave Wave", desc: `Every shed spawns ${fmtRange(GRAVE_WAVE_MIN_GHOSTS, GRAVE_WAVE_MAX_GHOSTS)} uncontrollable ghost frogs.` },
      { title: "Orb Specialist", desc: `Every orb guarantees ${statHighlight("1")} frog; Orb Collector rolls can add more.` },
      { title: "Fragile Reality", desc: `Doubles buff duration caps but halves orb spawn speed going forward.` },
      { title: "Frog Scatter", desc: `Respawn every frog with roles and crowns intact; trigger death effects.` },
      { title: "Eye for an Eye", desc: `Kill the slowest snake and half your frogs; frog cap drops to ${statHighlight(50)}.` }
    ];

    const legendaryUpgrades = [
      { title: "Legendary Buff Surge", desc: `Multiply every buff duration by ${statHighlight(LEGENDARY_BUFF_DURATION_FACTOR.toFixed(1))}.` },
      { title: "Legendary Frog Wave", desc: `Spawn ${statHighlight(LEGENDARY_SPAWN_AMOUNT)} frogs instantly.` },
      { title: "Legendary Deathrattle", desc: `${fmtPct(LEGENDARY_DEATHRATTLE_CHANCE * 100)} revive chance in one pick.` }
    ];

    const roleDescriptions = [
      { title: "Cannibal", desc: "Eats up to 5 ordinary frogs for movement bonuses; returns up to its meal count on death." },
      { title: "Aura", desc: `All frogs within ${statHighlight(`${AURA_RADIUS}px`)} get ${fmtPct((1 - AURA_SPEED_FACTOR) * 100)} faster hops and ${fmtPct((AURA_JUMP_FACTOR - 1) * 100)} higher jumps.` },
      { title: "Magnet", desc: `Pulls nearby orbs from ${statHighlight(`${ORB_MAGNET_PULL_RANGE}px`)} away.` },
      { title: "Lucky", desc: `Buffs last ${statHighlight(`${Math.round((LUCKY_BUFF_DURATION_BOOST - 1) * 100)}%`)} longer and spawn orbs can add bonus frogs.` },
      { title: "Zombie", desc: "Sacrifices itself to end Panic Hop. Spawns one ordinary frog whenever it dies." },

    ];

    const renderCard = (title, entries) => `
      <div class="buff-card">
        <h4>${title}</h4>
        <ul>
          ${entries.map((e) => `<li><strong>${e.title}:</strong> ${e.desc}</li>`).join("")}
        </ul>
      </div>
    `;

    // 🔹 Each section gets its own "page"
    // Legendary upgrades are deliberately NOT included.
    const pages = [
      {
        id: "temp",
        label: "Temp buff orbs",
        content: renderCard("Temporary Buff Orbs", tempBuffs),
      },
      {
        id: "perma",
        label: "Permanent upgrades",
        content: renderCard("Permanent Upgrades", commonUpgrades),
      },
      {
        id: "epic",
        label: "Epic upgrades",
        content: renderCard("Epic Upgrades", epicUpgrades),
      },
      {
        id: "roles",
        label: "Frog roles",
        content: renderCard("Frog Roles", roleDescriptions),
      },
    ];

    return `
      <div class="frog-panel-title">
        Buffs & Upgrades
        <span class="emoji">⚡</span>
      </div>

      <div class="frog-panel-sub">
        Live stats from the current build: every value is pulled straight from the game variables.
      </div>

      <!-- Page tabs -->
      <div class="buff-guide-nav">
        ${pages
          .map(
            (p, idx) => `
              <button
                class="frog-btn frog-btn-secondary buff-page-btn${idx === 0 ? " is-active" : ""}"
                data-page-index="${idx}"
              >
                ${p.label}
              </button>
            `
          )
          .join("")}
      </div>

      <!-- Paged content -->
      <div class="buff-guide-pages">
        ${pages
          .map(
            (p, idx) => `
              <div
                class="buff-guide-page"
                data-page-index="${idx}"
                style="display: ${idx === 0 ? "block" : "none"};"
              >
                <div class="buff-guide-grid">
                  ${p.content}
                </div>
              </div>
            `
          )
          .join("")}
      </div>

      <div class="frog-panel-footer">
        Buffs stack with your upgrade bonuses—hover back to the game and start experimenting.
        <br />
        <button id="buffGuideCloseBtn" class="frog-btn frog-btn-secondary" style="margin-top:6px;">
          Close
        </button>
      </div>
    `;
  }

  function initBuffGuideOverlay() {
    if (buffGuideOverlay) return;
    buffGuideOverlay = document.getElementById("buffGuideOverlay");
    if (!buffGuideOverlay) return;

    // Escape closes it
    document.addEventListener("keydown", (e) => {
      if (buffGuideOverlay && buffGuideOverlay.style.display === "flex" && e.key === "Escape") {
        hideBuffGuideOverlay();
      }
    });
  }

  function showBuffGuideOverlay() {
    if (!buffGuideOverlay) initBuffGuideOverlay();
    if (!buffGuideOverlay) return;

    let panel = buffGuideOverlay.querySelector(".frog-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.className = "frog-panel";
      buffGuideOverlay.innerHTML = "";
      buffGuideOverlay.appendChild(panel);
    }

    const upgrades = [
      { type: "mobility", label: "🧬 Mutation", desc: "+15% jump speed and +15% jump height." },
      { type: "mobility", label: "⚡ Survival Instinct", desc: "Below 10 frogs, they hop 20% faster." },
      { type: "mobility", label: "✂️ Ouroboros Curse", desc: "Makes the snake consume half its body and slows it." },
      { type: "mobility", label: "🌪️ Frog Scatter", desc: "Kill and respawn all current frogs." },
      { type: "buff", label: "🍀 Luck", desc: "Increases buff duration bonus, improves frog rolls, and more." },
      { type: "buff", label: "🎲 Lucky Roll", desc: "Instantly triggers a random orb buff at 1.5× duration." },
      { type: "buff", label: "🌀 Orb Whisperer", desc: "Orbs linger 30% longer." },
      { type: "buff", label: "🎯 Orb Flow", desc: "Increases orb spawn frequency." },
      { type: "buff", label: "🌩️ Orb Storm", desc: "Drops a burst of random orbs immediately." },
      { type: "buff", label: "🥚 Double Yolker", desc: "15% chance for collected orbs to spawn 2 extra frogs." },
      { type: "buff", label: "⚡ Chain Reaction", desc: "When collecting an orb, there is a 25% chance of a second buff." },
      { type: "buff", label: "🌙 Night Bloom", desc: "Naturally expiring orbs have a 20% chance to spawn a frog." },
      { type: "buff", label: "🧪 Orb Specialist", desc: "Every collected orb has a 50% chance ot spawn a a frog." },
      { type: "buff", label: "🔮 Molt Fortune", desc: "Snake drops 5–10 orbs whenever it sheds." },
      { type: "survival", label: "💀 Deathrattle", desc: "Dead frogs have a chance to respawn." },
      { type: "survival", label: "🏹 Last Stand", desc: "Your last frog has strong revive odds." },
      { type: "survival", label: "⚱️ Soul Offering", desc: "Deathrattle revivals leave an orb." },
      { type: "survival", label: "💨 Second Wind", desc: "Once per run, when you fall below 10 frogs, instantly spawn 20." },
      { type: "survival", label: "🩸 Poisonous Skin", desc: "The snake is slowed briefly every time it eats a frog." },
      { type: "survival", label: "👻 Grave Wave", desc: "Each shed spawns 7–15 frogs. Luck favors more." },
      { type: "role", label: "🐸 Spawn Frogs", desc: "Spawn fresh frogs instantly." },
      { type: "role", label: "🎭 Role Draft", desc: "Choose a role and spawn 2–5 special frogs." },
      { type: "role", label: "🥇 Promotion", desc: "Up to 10 random frogs gain one crown level immediately." },
      { type: "role", label: "🌊 Tidal Wave", desc: "Instantly spawn frogs equal to the number currently alive." },
      { type: "role", label: "🃏 Loaded Hand", desc: "Future upgrade screens show 4 choices instead of 3." }
    ];

    const itemsPerPage = 14;
    const totalPages = Math.max(1, Math.ceil(upgrades.length / itemsPerPage));
    let currentPage = 0;

    function getTypeClass(type) {
      switch (type) {
        case "mobility": return "upgrade-type-mobility";
        case "buff":     return "upgrade-type-buff";
        case "survival": return "upgrade-type-survival";
        case "role":     return "upgrade-type-role";
        default:         return "upgrade-type-mobility";
      }
    }

    function renderBuffPage() {
      const start = currentPage * itemsPerPage;
      const pageItems = upgrades.slice(start, start + itemsPerPage);

      panel.innerHTML = `
        <div class="frog-panel-title">Upgrades <span class="emoji">⚡</span></div>
        <div class="frog-panel-sub">All upgrades in the current build.</div>

        <ul class="frog-panel-list">
          ${pageItems.map(item => `
            <li class="upgrade-guide-item ${getTypeClass(item.type)}">
              <strong>${item.label}</strong> — ${item.desc}
            </li>
          `).join("")}
        </ul>

        <div class="frog-panel-footer">
          <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;">
            <button id="buffGuidePrevBtn" class="frog-btn frog-btn-secondary" style="width:auto;min-width:88px;margin-bottom:0;" ${currentPage === 0 ? "disabled" : ""}>Prev</button>
            <div style="min-width:70px;text-align:center;font-size:12px;">${currentPage + 1} / ${totalPages}</div>
            <button id="buffGuideNextBtn" class="frog-btn frog-btn-secondary" style="width:auto;min-width:88px;margin-bottom:0;" ${currentPage === totalPages - 1 ? "disabled" : ""}>Next</button>
          </div>
          <button id="buffGuideCloseBtn" class="frog-btn frog-btn-secondary">Close</button>
        </div>
      `;

      const closeBtn = document.getElementById("buffGuideCloseBtn");
      const prevBtn  = document.getElementById("buffGuidePrevBtn");
      const nextBtn  = document.getElementById("buffGuideNextBtn");

      if (closeBtn) closeBtn.onclick = hideBuffGuideOverlay;
      if (prevBtn)  prevBtn.onclick  = () => { if (currentPage > 0) { currentPage--; renderBuffPage(); } };
      if (nextBtn)  nextBtn.onclick  = () => { if (currentPage < totalPages - 1) { currentPage++; renderBuffPage(); } };
    }

    renderBuffPage();
    openAnimatedOverlay(buffGuideOverlay);
  }

  function hideBuffGuideOverlay() {
    if (buffGuideOverlay) {
      closeAnimatedOverlay(buffGuideOverlay);
    }
  }

  function initLeaderboardOverlay() {
    if (leaderboardOverlay) return;
    leaderboardOverlay = document.getElementById("leaderboardOverlay");
    const closeBtn = document.getElementById("leaderboardCloseBtn");
    closeBtn.addEventListener("click", hideLeaderboardOverlay);

    document.addEventListener("keydown", (e) => {
      if (leaderboardOverlay && leaderboardOverlay.style.display === "flex" && e.key === "Escape") {
        hideLeaderboardOverlay();
      }
    });
  }

  // Helper to format time for the main-menu leaderboard overlay
  function formatLeaderboardTime(seconds) {
    if (seconds == null || !isFinite(seconds) || seconds <= 0) {
      return "00:00.0";
    }
    const total = Math.max(0, seconds);
    const m = Math.floor(total / 60);
    const s = total - m * 60;
    const sStr = s.toFixed(1);
    const pad2 = (n) => (n < 10 ? "0" + n : String(n));
    return pad2(m) + ":" + sStr.padStart(4, "0");
  }

  async function showLeaderboardOverlay() {
    if (!leaderboardOverlay) initLeaderboardOverlay();
    if (!leaderboardOverlay) return;

    const content = document.getElementById("leaderboardContent");
    if (!content) return;

    content.innerHTML = '<div class="leaderboard-loading">Loading leaderboard…</div>';

    try {
      const entries = await fetchLeaderboard();
      const list = Array.isArray(entries) ? entries.slice(0, 50) : [];

      if (list.length === 0) {
        content.innerHTML = `
          <div class="frog-panel-section-label">Global Leaderboard</div>
          <ul class="frog-panel-list"><li>No runs yet.</li></ul>
        `;
        openAnimatedOverlay(leaderboardOverlay);
        return;
      }

      const userLabel =
        (window.FrogGameLeaderboard &&
          typeof window.FrogGameLeaderboard.getCurrentUserLabel === "function" &&
          window.FrogGameLeaderboard.getCurrentUserLabel()) || null;

      function normalizeTag(tag) {
        return typeof tag === "string" ? tag.trim().toLowerCase() : "";
      }

      function entryMatchesUser(entry) {
        if (!entry) return false;
        const lastMyEntry = window.FrogGameLeaderboard && window.FrogGameLeaderboard._lastMyEntry;
        if (lastMyEntry && lastMyEntry.userId && entry.userId) {
          if (lastMyEntry.userId === entry.userId) return true;
        }
        if (!userLabel) return false;
        const tag = normalizeTag(entry.tag);
        const name = normalizeTag(entry.name);
        const target = normalizeTag(userLabel);
        return tag === target || name === target;
      }

      function getScore(entry) {
        if (!entry) return 0;
        for (const key of ["bestScore", "score", "maxScore", "points", "value"]) {
          if (!(key in entry)) continue;
          let v = entry[key];
          if (typeof v === "string") v = parseFloat(v);
          if (typeof v === "number" && isFinite(v)) return v;
        }
        return 0;
      }

      function getTime(entry) {
        if (!entry) return 0;
        for (const key of ["bestTime", "time", "maxTime", "seconds", "duration"]) {
          if (!(key in entry)) continue;
          let v = entry[key];
          if (typeof v === "string") v = parseFloat(v);
          if (typeof v === "number" && isFinite(v) && v >= 0) return v;
        }
        return 0;
      }

      function getDisplayName(entry, rank) {
        if (!entry) return `Player ${rank}`;
        const raw = typeof entry.tag === "string" ? entry.tag.trim() : "";
        if (raw && raw.toLowerCase() !== "frog") return raw;
        if (typeof entry.name === "string" && entry.name.trim()) {
          return entry.name.trim();
        }
        const cfg = window.FrogGameConfig;
        if (cfg && typeof cfg.leaderboardPlaceholderName === "function") {
          return cfg.leaderboardPlaceholderName(entry, rank);
        }
        return `Player ${rank}`;
      }

      const pageSize = 5;
      let currentPage = 0;
      const myIndex = list.findIndex(entryMatchesUser);
      if (myIndex >= 0) currentPage = Math.floor(myIndex / pageSize);

      function renderPage(pageIndex) {
        currentPage = Math.max(0, Math.min(pageIndex, Math.ceil(list.length / pageSize) - 1));

        const start = currentPage * pageSize;
        const end = Math.min(start + pageSize, list.length);
        const pageEntries = list.slice(start, end);

        const itemsHtml = pageEntries.map((entry, idx) => {
          const rank = start + idx + 1;
          const name = getDisplayName(entry, rank);
          const score = Math.floor(getScore(entry)).toLocaleString();
          const time = formatLeaderboardTime(getTime(entry));
          const isMe = entryMatchesUser(entry);
          return `<li class="pp-entry${isMe ? ' pp-me' : ''}"><span class="pp-rank">${rank}</span><div class="pp-player"><strong>${name}${isMe ? ' · YOU' : ''}</strong></div><span class="pp-time">${time}</span><div class="pp-points"><strong>${score}</strong></div></li>`;
        }).join("");

        const totalPages = Math.ceil(list.length / pageSize);

        content.innerHTML = `<ol class="pp-entries">${itemsHtml || '<li class="pp-empty">No runs yet. Set the first score!</li>'}</ol><nav class="pp-pager"><button id="leaderboardPrevBtn" ${currentPage === 0 ? 'disabled' : ''} aria-label="Previous page">Prev</button><span>${currentPage+1} / ${Math.max(1,totalPages)}</span><button id="leaderboardNextBtn" ${end >= list.length ? 'disabled' : ''} aria-label="Next page">Next</button></nav>`;

      const prevBtn = document.getElementById("leaderboardPrevBtn");
        const nextBtn = document.getElementById("leaderboardNextBtn");
        if (prevBtn) prevBtn.addEventListener("click", () => renderPage(currentPage - 1));
        if (nextBtn) nextBtn.addEventListener("click", () => renderPage(currentPage + 1));
      }

      renderPage(currentPage);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
      content.innerHTML = `
        <div class="frog-panel-section-label">Leaderboard</div>
        <ul class="frog-panel-list"><li>Failed to load leaderboard.</li></ul>
      `;
    }

    openAnimatedOverlay(leaderboardOverlay);
  }
  
  function hideLeaderboardOverlay() {
    if (leaderboardOverlay) {
      closeAnimatedOverlay(leaderboardOverlay);
    }
  }
function buildSnakeSkinSelectorHtml() {
  const levelData = getDashboardLevelData(loadDashboardStats().totalOrbsCollected || 0);
  const currentLevel = levelData.level;
  const selectedId = getSelectedSnakeSkinId();

  const items = SNAKE_SKINS.map(skin => {
    const unlocked = currentLevel >= skin.requiredLevel;
    const isSelected = skin.id === selectedId;

    return `
      <div
        class="snake-skin-option${isSelected ? " is-selected" : ""}${!unlocked ? " is-locked" : ""}"
        data-skin-id="${skin.id}"
        style="
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: ${unlocked ? "pointer" : "default"};
          opacity: ${unlocked ? "1" : "0.4"};
        "
      >
        <div style="
          width: 48px;
          height: 48px;
          border-radius: 999px;
          border: 2px solid ${isSelected ? "#84cc16" : "#44403c"};
          background: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: ${isSelected ? "0 0 0 2px rgba(132,204,22,0.4)" : "none"};
          transition: border-color 0.15s, box-shadow 0.15s;
          position: relative;
        ">
          <img
            src="${skin.head}"
            alt="${skin.label}"
            style="
              width: 44px;
              height: 44px;
              image-rendering: pixelated;
              ${!unlocked ? "filter: grayscale(1);" : ""}
            "
          />
          ${!unlocked ? `
            <div style="
              position: absolute;
              inset: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
            ">🔒</div>
          ` : ""}
        </div>
        <div style="font-size: 11px; color: ${isSelected ? "#bef264" : "#a8a29e"}; font-weight: ${isSelected ? "700" : "400"};">
          ${unlocked ? skin.label : `Lv ${skin.requiredLevel}`}
        </div>
      </div>
    `;
  }).join("");

  return `
    <div class="frog-panel-section-label">Snake Skin</div>
    <div
      id="snakeSkinSelector"
      style="
        display: flex;
        gap: 16px;
        align-items: flex-start;
        margin-bottom: 8px;
      "
    >
      ${items}
    </div>
  `;
}
async function showDashboardOverlay(cachedLeaderboard) {
  if (!dashboardOverlay) initDashboardOverlay();
  if (!dashboardOverlay) return;

  const content = document.getElementById("dashboardContent");
  if (!content) return;

  openAnimatedOverlay(dashboardOverlay);
  content.innerHTML = '<div class="leaderboard-loading">Loading dashboard…</div>';

  const localStats = loadDashboardStats();
  
  const currentTag = getSavedDashboardTag() || "";

  const leaderboardEntries = cachedLeaderboard || await fetchLeaderboard();
  const normalizedCurrentTag = typeof currentTag === "string" ? currentTag.trim().toLowerCase() : "";
  const leaderboardBest = (() => {
    // Prefer userId match (stable across renames), fall back to tag-string match
    const lastMe = window.FrogGameLeaderboard && window.FrogGameLeaderboard._lastMyEntry;
    let match = null;
    if (lastMe && lastMe.userId) {
      match = leaderboardEntries.find(e => e && e.userId === lastMe.userId);
    }
    if (!match && normalizedCurrentTag) {
      match = leaderboardEntries.find(e =>
        typeof e?.tag === "string" && e.tag.trim().toLowerCase() === normalizedCurrentTag
      );
    }
    if (!match) return { bestRun: 0, bestTime: 0, found: false };
    return {
      bestRun: Math.floor(Number(match.bestScore ?? match.score ?? 0)),
      bestTime: Number(match.bestTime ?? match.time ?? 0),
      found: true
    };
  })();

  const bestRecordRank = Array.isArray(leaderboardEntries)
    ? leaderboardEntries.findIndex((entry) => {
        const entryTag =
          typeof entry?.tag === "string" ? entry.tag.trim().toLowerCase() : "";
        const entryScore = Math.floor(Number(entry?.bestScore ?? entry?.score ?? 0));
        const entryTime = Number(entry?.bestTime ?? entry?.time ?? 0);

        return (
          entryTag &&
          normalizedCurrentTag &&
          entryTag === normalizedCurrentTag &&
          entryScore === Math.floor(Number(leaderboardBest.bestRun || 0)) &&
          Math.abs(entryTime - Number(leaderboardBest.bestTime || 0)) < 0.01
        );
      })
    : -1;

  const bestRecordPrefix =
    leaderboardBest.found && bestRecordRank >= 0
      ? `#${bestRecordRank + 1} `
      : "";

  const levelData = getDashboardLevelData(localStats.totalOrbsCollected);

  const savedLatestRun =
    Array.isArray(localStats.recentRuns) && localStats.recentRuns.length
      ? localStats.recentRuns[0]
      : null;

  const latestRunHtml = savedLatestRun
    ? `
      <div class="frog-panel-section-label">Last Run</div>
      <ul class="frog-panel-list">
        <li style="color:#bef264;">
          <strong>Score:</strong> <span class="stat-highlight">${Math.floor(savedLatestRun.score)}</span>
          · <strong>Time:</strong> <span class="stat-highlight">${formatDashboardDuration(savedLatestRun.time)}</span>
          · <strong>Orbs:</strong> <span class="stat-highlight">${savedLatestRun.orbs}</span>
          · <strong>Frogs Lost:</strong> <span class="stat-highlight">${savedLatestRun.frogsLost || 0}</span>
        </li>
      </ul>
    `
    : "";

  const storedRuns = [localStats.bestRun, ...(localStats.recentRuns || [])].filter(Boolean);
  const localBest = storedRuns.slice().sort((a,b)=>Number(b.score)-Number(a.score)||Number(b.time)-Number(a.time))[0];
  const bestScore = Math.max(leaderboardBest.bestRun || 0, Number(localBest?.score)||0);
  const useServerBest = leaderboardBest.found && leaderboardBest.bestRun === bestScore;
  const bestTime = useServerBest ? leaderboardBest.bestTime : localBest?.time;
  const bestRun = storedRuns.find(r=>Number(r.score)===bestScore && Math.abs(Number(r.time)-Number(bestTime))<0.01);
  const bestValue = key => bestRun && Number.isFinite(Number(bestRun[key])) ? Number(bestRun[key]).toLocaleString() : '—';
  content.innerHTML = `
    <div class="summary-name"><div class="summary-editor"><input id="dashboardTagInput" aria-label="Your name on the board" maxlength="12" value="${pauseEscape(currentTag)}" placeholder="Your name on the board"><button id="dashboardSaveTagBtn">Save</button></div><p id="dashboardTagMessage" role="status" aria-live="polite"></p></div>
    <p class="identity-best">Level <b>${levelData.level}</b>${bestRecordRank>=0 ? ` · Rank <b>#${bestRecordRank+1}</b>` : ''}</p>
    <div class="summary-score"><strong>${bestScore.toLocaleString()}</strong><span>Best run</span></div>
    <div class="summary-details"><span><b>${bestTime == null ? '—' : formatTime(bestTime)}</b> survived</span><span><b>${bestValue('orbs')}</b> orbs</span><span><b>${bestValue('sheds')}</b> sheds</span></div>
    <div class="career-stats">${[['Runs played',localStats.totalRuns||0],['Total orbs',localStats.totalOrbsCollected||0],['Time played',formatDashboardDuration(localStats.totalPlayTime)],['Frogs spawned',localStats.totalFrogsLost||0]].map(([label,value])=>`<div><b>${typeof value==='number'?value.toLocaleString():value}</b><span>${label}</span></div>`).join('')}</div>
    <div class="career-progress-label"><span>Level ${levelData.nextLevel}</span><span><b>${levelData.orbsIntoCurrentLevel} / ${levelData.levelSpan}</b> orbs</span></div>
    <div class="career-progress" role="progressbar" aria-label="Progress to next level" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${levelData.progressPercent}"><div style="width:${Math.max(0,Math.min(100,levelData.progressPercent))}%"></div></div>
    <p class="career-progress-note">${levelData.orbsNeededForNextLevel} orbs to next level</p>
  `;
  setupPlayerHeading(content,'dashboardTagInput');

  const tagInput = document.getElementById("dashboardTagInput");
  const saveBtn = document.getElementById("dashboardSaveTagBtn");
  const msgEl = document.getElementById("dashboardTagMessage");
  const currentTagEl = document.getElementById("dashboardCurrentTag");

  if (saveBtn && tagInput) {
    saveBtn.addEventListener("click", async () => {
      const validation = validateDashboardTag(tagInput.value);

      if (!validation.ok) {
        AudioMod.playSaveResult?.(false);
        if (msgEl) { msgEl.textContent = validation.message; msgEl.style.color = "#fca5a5"; }
        return;
      }

      const newTag = validation.tag;

      // Submit to server first — don't save locally until we know the tag is accepted
      try {
        const bestScore = leaderboardBest && leaderboardBest.found ? leaderboardBest.bestRun : 0;
        const bestTime  = leaderboardBest && leaderboardBest.found ? leaderboardBest.bestTime : 0;
        const result = await submitScoreToServer(bestScore, bestTime, null, newTag);

        if (!result || result._error) {
          AudioMod.playSaveResult?.(false);
          const msg = result?.error === "tag_taken"
            ? "That tag is already taken — try another."
            : (result?.message || "Could not save tag. Try again.");
          if (msgEl) { msgEl.textContent = msg; msgEl.style.color = "#fca5a5"; }
          return;
        }

        // Server accepted — now save locally
        await saveDashboardTag(newTag);
        AudioMod.playSaveResult?.(true);
        tagInput.closest('.summary-name').finishNameEdit(newTag);
        if (msgEl) msgEl.textContent = '';
        if (window.FrogGameLeaderboard?._lastMyEntry) window.FrogGameLeaderboard._lastMyEntry.tag = newTag;

        try {
          const refreshed = await fetchLeaderboard();
          updateMiniLeaderboard(refreshed);
        } catch (_) { /* Name saved; leaderboard refresh is optional. */ }
      } catch (e) {
        AudioMod.playSaveResult?.(false);
        if (msgEl) { msgEl.textContent = "Connection error. Try again."; msgEl.style.color = "#fca5a5"; }
      }
    });
  }

  const lastRunBtn = document.getElementById("dashboardLastRunBtn");
  if (lastRunBtn) {
    lastRunBtn.addEventListener("click", () => {
      // Use in-memory run if available, otherwise reconstruct from saved stats
      if (!latestCompletedRun) {
        const saved = loadDashboardStats().recentRuns;
        if (saved && saved.length) {
          const r = saved[0];
          latestCompletedRun = {
            score:     r.score     || 0,
            time:      r.time      || 0,
            orbs:      r.orbs      || 0,
            frogsLost: r.frogsLost || 0,
            sheds:     r.sheds     || 0
          };
        }
      }
      // Close dashboard without chaining to showMainMenu.
      // Force-clear all animation classes before hiding so no pending
      // animationend listener can fire and call showMainMenu afterward.
      if (dashboardOverlay) {
        dashboardOverlay.classList.remove("is-animating-out", "is-open", "is-animating-in");
        dashboardOverlay.style.display = "none";
      }
      showEndGameSummaryOverlay(Array.isArray(leaderboardEntries) ? leaderboardEntries : []);
    });
  }

  function wireSkinSelector() {
    const skinSelector = document.getElementById("snakeSkinSelector");
    if (!skinSelector) return;

    skinSelector.addEventListener("click", (e) => {
      const option = e.target.closest("[data-skin-id]");
      if (!option) return;

      const skinId = option.dataset.skinId;
      const skin = SNAKE_SKINS.find(s => s.id === skinId);
      if (!skin) return;

      const levelData = getDashboardLevelData(loadDashboardStats().totalOrbsCollected || 0);
      if (levelData.level < skin.requiredLevel) return;

      saveSelectedSnakeSkinId(skinId);

      skinSelector.querySelectorAll("[data-skin-id]").forEach(el => {
        const id = el.dataset.skinId;
        const circle = el.querySelector("div");
        const label = el.querySelector("div + div") || el.lastElementChild;
        const isNowSelected = id === skinId;

        if (circle) {
          circle.style.borderColor = isNowSelected ? "#84cc16" : "#44403c";
          circle.style.boxShadow = isNowSelected ? "0 0 0 2px rgba(132,204,22,0.4)" : "none";
        }
        if (label) {
          label.style.color = isNowSelected ? "#bef264" : "#a8a29e";
          label.style.fontWeight = isNowSelected ? "700" : "400";
        }
      });
    });
  }

function showStartingBuffSelector() {
  let overlay = document.getElementById("startingBuffOverlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "startingBuffOverlay";
    overlay.className = "frog-overlay";
    overlay.style.zIndex = "1200";
    overlay.style.background = "rgba(0,0,0,0.18)";
    overlay.innerHTML = `
      <div
        class="frog-panel"
        style="
          width:min(320px, calc(100vw - 24px));
          max-width:320px;
          padding:10px 10px 8px;
          border-radius:10px;
          background:#1c1917;
          border:1px solid #44403c;
          box-shadow:0 10px 30px rgba(0,0,0,0.45);
        "
      >
        <div
          style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:10px;
            margin-bottom:8px;
          "
        >
          <div style="font-size:13px; font-weight:700; color:#f5f5f4;">
            Starting Buff
          </div>
          <button
            id="startingBuffCloseBtn"
            class="frog-btn frog-btn-secondary"
            style="
              width:auto;
              min-width:0;
              padding:4px 8px;
              font-size:11px;
              line-height:1;
            "
          >
            Close
          </button>
        </div>

        <div id="startingBuffOptions" style="display:flex; flex-direction:column; gap:6px;"></div>
      </div>
    `;
    container.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeAnimatedOverlay(overlay);
      }
    });
  }

  const levelData = getDashboardLevelData(loadDashboardStats().totalOrbsCollected || 0);
  const selected = getSelectedStartingBuff(levelData.level);
  const optionsEl = overlay.querySelector("#startingBuffOptions");

  optionsEl.innerHTML = STARTING_BUFFS.map(buff => {
    const unlocked = levelData.level >= buff.levelRequired;
    const isSelected = selected.id === buff.id;

    return `
      <button
        class="frog-btn frog-btn-secondary starting-buff-option"
        data-buff-id="${buff.id}"
        ${unlocked ? "" : "disabled"}
        style="
          width:100%;
          text-align:left;
          padding:7px 9px;
          margin:0;
          font-size:12px;
          line-height:1.2;
          background:${isSelected ? "rgba(132,204,22,0.12)" : "#292524"};
          border:1px solid ${isSelected ? "#84cc16" : "#44403c"};
          color:${unlocked ? "#f5f5f4" : "#78716c"};
          opacity:${unlocked ? "1" : "0.55"};
          box-shadow:none;
        "
      >
        <span style="display:inline-flex; align-items:center; gap:8px;">
          <span style="font-size:15px; line-height:1;">${buff.emoji}</span>
          <span style="font-weight:${isSelected ? "700" : "400"};">
            ${buff.name}${unlocked ? "" : ` (Lv ${buff.levelRequired})`}
          </span>
        </span>
      </button>
    `;
  }).join("");

  const closeBtn = overlay.querySelector("#startingBuffCloseBtn");
  if (closeBtn) {
    closeBtn.onclick = () => closeAnimatedOverlay(overlay);
  }

  optionsEl.querySelectorAll(".starting-buff-option").forEach(btn => {
    btn.onclick = () => {
      const buffId = btn.dataset.buffId;
      const buff = STARTING_BUFFS.find(x => x.id === buffId);
      if (!buff) return;
      if (levelData.level < buff.levelRequired) return;

      saveSelectedStartingBuffId(buffId);
      closeAnimatedOverlay(overlay);
      showDashboardOverlay();
    };
  });

  openAnimatedOverlay(overlay);
}

  const startingBuffBtn = document.getElementById("dashboardStartingBuffBtn");
  if (startingBuffBtn) {
    startingBuffBtn.addEventListener("click", () => {
      showStartingBuffSelector();
    });
  }

  wireSkinSelector();
}
function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}
function hideDashboardOverlay() {
  if (dashboardOverlay) {
    closeAnimatedOverlay(dashboardOverlay);
  }
}
  function initDashboardOverlay() {
    if (dashboardOverlay) return;

    dashboardOverlay = document.getElementById("dashboardOverlay");
    const panel=dashboardOverlay.querySelector('.frog-panel');
    if(panel){panel.className='sm-panel';panel.querySelector('.frog-panel-sub')?.remove();panel.querySelector('.frog-panel-footer').className='sm-actions';}
    document.getElementById('dashboardCloseBtn').className='sm-primary';
    document.getElementById('dashboardCloseBtn').textContent='Back to menu';
    const closeBtn = document.getElementById("dashboardCloseBtn");

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        hideDashboardOverlay();
        hideGameOver();
        showMainMenu();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (dashboardOverlay && dashboardOverlay.style.display === "flex" && e.key === "Escape") {
        hideDashboardOverlay();
        hideGameOver();
        showMainMenu();
      }
    });
  }
function getRandomDashboardPfpBg() {
  const colors = [
    "#dbeafe", // light blue
    "#e0f2fe", // sky
    "#dcfce7", // light green
    "#fef3c7", // light gold
    "#fde68a", // warm yellow
    "#fce7f3", // light pink
    "#ede9fe", // lavender
    "#fae8ff", // soft purple
    "#ffe4e6", // rose
    "#ecfccb", // lime
    "#ccfbf1", // aqua
    "#fef9c3"  // pale yellow
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}
function getDashboardProfileBg(level) {
  const lvl = Math.max(1, Math.floor(Number(level) || 1));

  if (lvl >= 10) return "linear-gradient(135deg, #7c3aed, #312e81)";
  if (lvl >= 8)  return "linear-gradient(135deg, #be185d, #7c2d12)";
  if (lvl >= 6)  return "linear-gradient(135deg, #b45309, #365314)";
  if (lvl >= 4)  return "linear-gradient(135deg, #166534, #0f766e)";
  if (lvl >= 3)  return "linear-gradient(135deg, #1d4ed8, #0f766e)";
  if (lvl >= 2)  return "linear-gradient(135deg, #374151, #1f2937)";
  return "#1c1917";
}
function getDashboardPfp() {
  const levelData = getDashboardLevelData(loadDashboardStats().totalOrbsCollected || 0);
  const cosmetics = checkDashboardCosmeticUnlocks(levelData.level);

  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(DASHBOARD_PFP_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed === "object" &&
          typeof parsed.spriteSrc === "string" &&
          typeof parsed.skinSrc === "string"
        ) {
          const updated = {
            spriteSrc: parsed.spriteSrc,
            skinSrc: parsed.skinSrc,
            bgColor:
              typeof parsed.bgColor === "string"
                ? parsed.bgColor
                : getRandomDashboardPfpBg(),
            eyesSrc:
              cosmetics.unlockedEyes
                ? (typeof parsed.eyesSrc === "string" ? parsed.eyesSrc : getRandomFrogEyes())
                : null,
            hatSrc:
              cosmetics.unlockedHat
                ? (typeof parsed.hatSrc === "string" ? parsed.hatSrc : getRandomFrogHat())
                : null
          };

          localStorage.setItem(DASHBOARD_PFP_STORAGE_KEY, JSON.stringify(updated));
          return updated;
        }
      }
    }
  } catch (e) {
    // ignore
  }

  const pfp = {
    spriteSrc: getRandomFrogSprite(),
    skinSrc: getRandomFrogSkin(),
    bgColor: getRandomDashboardPfpBg(),
    eyesSrc: cosmetics.unlockedEyes ? getRandomFrogEyes() : null,
    hatSrc: cosmetics.unlockedHat ? getRandomFrogHat() : null
  };

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(DASHBOARD_PFP_STORAGE_KEY, JSON.stringify(pfp));
    }
  } catch (e) {
    // ignore
  }

  return pfp;
}

  function ensureInfoOverlay() {
    if (infoOverlay) return;

    infoOverlay = document.createElement("div");
    infoOverlay.className = "frog-info-overlay";
    infoOverlay.style.position = "absolute";
    infoOverlay.style.inset = "0";
    infoOverlay.style.background = "rgba(0,0,0,0.75)";
    infoOverlay.style.display = "none";
    infoOverlay.style.zIndex = "180";
    infoOverlay.style.alignItems = "center";
    infoOverlay.style.justifyContent = "center";
    infoOverlay.style.pointerEvents = "auto";

    const panel = document.createElement("div");
    panel.style.background = "#111";
    panel.style.padding = "16px 20px 12px 20px";
    panel.style.borderRadius = "10px";
    panel.style.border = "1px solid #444";
    panel.style.color = "#fff";
    panel.style.fontFamily = "monospace";
    panel.style.textAlign = "left";
    panel.style.minWidth = "260px";
    panel.style.maxWidth = "480px";
    panel.style.boxShadow = "0 0 18px rgba(0,0,0,0.6)";

    // Header row
    const headerRow = document.createElement("div");
    headerRow.style.display = "flex";
    headerRow.style.justifyContent = "space-between";
    headerRow.style.alignItems = "center";
    headerRow.style.marginBottom = "6px";

    const title = document.createElement("div");
    title.textContent = "escape the snake 🐍 – info";
    title.style.fontSize = "14px";
    title.style.fontWeight = "bold";

    const pageLabel = document.createElement("div");
    pageLabel.style.fontSize = "11px";
    pageLabel.style.opacity = "0.8";
    infoPageLabel = pageLabel;

    headerRow.appendChild(title);
    headerRow.appendChild(pageLabel);

    const content = document.createElement("div");
    content.style.fontSize = "13px";
    content.style.marginTop = "4px";
    content.style.lineHeight = "1.4";
    infoContentEl = content;

    // Footer nav row
    const navRow = document.createElement("div");
    navRow.style.display = "flex";
    navRow.style.justifyContent = "space-between";
    navRow.style.alignItems = "center";
    navRow.style.marginTop = "10px";

    const leftBtns = document.createElement("div");
    leftBtns.style.display = "flex";
    leftBtns.style.gap = "6px";

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "◀ Prev";
    prevBtn.style.fontFamily = "monospace";
    prevBtn.style.fontSize = "12px";
    prevBtn.style.padding = "4px 8px";
    prevBtn.style.borderRadius = "6px";
    prevBtn.style.border = "1px solid #555";
    prevBtn.style.background = "#222";
    prevBtn.style.color = "#fff";
    prevBtn.style.cursor = "pointer";
    prevBtn.onmouseenter = () => { prevBtn.style.background = "#333"; };
    prevBtn.onmouseleave = () => { prevBtn.style.background = "#222"; };
      prevBtn.onclick = () => {
      
      setInfoPage(infoPage - 1);
    };
    infoPrevBtn = prevBtn;

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next ▶";
    nextBtn.style.fontFamily = "monospace";
    nextBtn.style.fontSize = "12px";
    nextBtn.style.padding = "4px 8px";
    nextBtn.style.borderRadius = "6px";
    nextBtn.style.border = "1px solid #555";
    nextBtn.style.background = "#222";
    nextBtn.style.color = "#fff";
    nextBtn.style.cursor = "pointer";
    nextBtn.onmouseenter = () => { nextBtn.style.background = "#333"; };
    nextBtn.onmouseleave = () => { nextBtn.style.background = "#222"; };
      nextBtn.onclick = () => {
      
      setInfoPage(infoPage + 1);
    };
    infoNextBtn = nextBtn;

    leftBtns.appendChild(prevBtn);
    leftBtns.appendChild(nextBtn);

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close ×";
    closeBtn.style.fontFamily = "monospace";
    closeBtn.style.fontSize = "12px";
    closeBtn.style.padding = "4px 8px";
    closeBtn.style.borderRadius = "6px";
    closeBtn.style.border = "1px solid #555";
    closeBtn.style.background = "#222";
    closeBtn.style.color = "#fff";
    closeBtn.style.cursor = "pointer";
    closeBtn.onmouseenter = () => { closeBtn.style.background = "#333"; };
    closeBtn.onmouseleave = () => { closeBtn.style.background = "#222"; };
    closeBtn.onclick = () => {
      
      closeInfoOverlay();
    };

    navRow.appendChild(leftBtns);
    navRow.appendChild(closeBtn);

    panel.appendChild(headerRow);
    panel.appendChild(content);
    panel.appendChild(navRow);

    infoOverlay.appendChild(panel);
    container.appendChild(infoOverlay);

    // clicking dark background closes the panel
    infoOverlay.addEventListener("click", (e) => {
      if (e.target === infoOverlay) {
        closeInfoOverlay();
      }
    });

    // start on page 0 (leaderboard)
    setInfoPage(0);
  }

  function setInfoPage(pageIndex) {
    if (!infoContentEl || !infoPageLabel) return;
    const neon = "#4defff";

    const maxPage = 4; // 0..4: 5 total pages
    infoPage = Math.max(0, Math.min(maxPage, pageIndex));

    let html = "";

    if (infoPage === 0) {
      // PAGE 0 – Leaderboard
      html += "<b>🏆 Leaderboard</b><br><br>";
      const list = infoLeaderboardData || [];
      if (!list.length) {
        html += "<div>No scores yet — be the first to escape the snake.</div>";
      } else {
        html += "<table style='width:100%; border-collapse:collapse; font-size:12px;'>";
        html += "<tr><th style='text-align:left;'>#</th><th style='text-align:left;'>Tag</th><th style='text-align:right;'>Score</th><th style='text-align:right;'>Time</th></tr>";
        list.slice(0, 20).forEach((entry, i) => {
          const rank = i + 1;
          const rawTag = typeof entry.tag === "string" ? entry.tag.trim() : "";
          const tagBase =
            (rawTag && rawTag.toLowerCase() !== "frog" && rawTag) ||
            (typeof entry.name === "string" && entry.name.trim()) ||
            (window.FrogGameConfig &&
            typeof window.FrogGameConfig.leaderboardPlaceholderName === "function"
              ? window.FrogGameConfig.leaderboardPlaceholderName(entry, rank)
              : `Player ${rank}`);

          // ✅ Use bestScore / bestTime if score/time aren’t present
          const rawScore =
            typeof entry.score === "number"
              ? entry.score
              : typeof entry.bestScore === "number"
                ? entry.bestScore
                : null;

          const scoreStr = rawScore == null ? "—" : Math.floor(rawScore);

          const secs =
            typeof entry.time === "number"
              ? entry.time
              : typeof entry.bestTime === "number"
                ? entry.bestTime
                : 0;

          const m = Math.floor(secs / 60);
          const s = Math.floor(secs % 60);
          const tStr = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

          // ✅ Highlight "me" (same flag used by the game-over overlay)
          const isMe = !!entry.isMe;
          const rowStyle = isMe
            ? " style='background:rgba(255,215,0,0.18);color:#ffd700;'"
            : "";

          const tag =
            isMe
              ? `${tagBase} <span style="font-size:10px;opacity:0.9;">(you)</span>`
              : tagBase;

          html += `
            <tr${rowStyle}>
              <td>${rank}</td>
              <td>${tag}</td>
              <td style="text-align:right;">${scoreStr}</td>
              <td style="text-align:right;">${tStr}</td>
            </tr>
          `;
        });
        html += "</table>";
        html += `<div style="margin-top:6px; font-size:11px; opacity:0.8;">
          Beat your own best score to update your entry.
        </div>`;
      }
    } else if (infoPage === 1) {
      // PAGE 1 – How to Play
      html = `
  <b>🐍 How to Play</b><br><br>
  • Avoid the snake and keep the frogs alive as long as possible.<br>
  • Frogs hop around the screen. Move your mouse to guide the swarm.<br>
  • Collect orbs to trigger buffs and upgrades.<br>
  • Every minute you choose a <span style="color:${neon};">common</span> upgrade.<br>
  • Every 3 minutes you get a <span style="color:${neon};">common + epic</span> upgrade chain.<br>
  • Every 5 minutes the snake sheds, gets stronger, and changes color.<br>
  • Your run ends when <span style="color:${neon};">all frogs are gone</span>.
  `;
    } else if (infoPage === 2) {
      // PAGE 2 – Orb buffs
      html = `
  <b>🟢 Orb Buffs</b><br><br>
  ⚡ <b>Speed</b> – frogs act faster for a short time (stacks with upgrades).<br>
  🦘 <b>Jump</b> – frogs jump much higher for a short time.<br>
  🐸➕ <b>Spawn</b> – instantly spawns extra frogs (more if the collector is Lucky).<br>
  🧊 <b>Snake Slow</b> – snake moves slower for a few seconds (less effective as it grows).<br>
  🤪 <b>Confuse</b> – snake turns randomly instead of targeting frogs.<br>
  📏 <b>Shrink</b> – snake body and bite radius shrink temporarily.<br>
  🛡️ <b>Team Shield</b> – all frogs ignore snake hits for a short duration.<br>
  ⏱️ <b>Time Slow</b> – slows the whole game (and the snake) briefly.<br>
  🧲 <b>Orb Magnet</b> – orbs drift toward frogs, preferring magnet frogs.<br>
  🐸🌊 <b>Mega Spawn</b> – large wave of frogs appears at once.<br>
  💰 <b>Score ×2</b> – score gain is multiplied for a short window.<br>
  😱 <b>Panic Hop</b> – frogs hop faster but in random directions.<br>
  🩺 <b>Lifeline</b> – frogs that die during the buff have a chance to instantly respawn.<br>
  ⭐ <b>PermaFrog</b> – upgrades one frog with a permanent role (Cannibal, Aura, Magnet, Lucky, Zombie, etc.).
  `;
    } else if (infoPage === 3) {
      // PAGE 3 – Permanent frog roles
      html = `
  <b>🐸 Permanent Frog Roles</b><br><br>
  <b>Cannibal</b> – eats up to five ordinary frogs to grow stronger.<br>
  💫 <b>Aura</b> – nearby frogs get bonus speed and jump height in a radius around this frog.<br>
  🧲 <b>Magnet</b> – orbs in a radius are strongly pulled toward this frog.<br>
  🍀 <b>Lucky</b> – buffs last longer, more frogs spawn from some effects, and score gain is boosted slightly per Lucky frog.<br>
  🧟 <b>Zombie</b> – when this frog dies, it causes extra chaos (like extra frogs and snake debuffs).<br><br>
  Perma roles stack with global upgrades and orb buffs, making some frogs into mini “heroes” of the swarm.
  `;
    } else if (infoPage === 4) {
      // PAGE 4 – Global upgrades
      html = `
  <b>🏗️ Global Upgrades</b><br><br>
  💨 <b>Frogs hop faster forever</b> – reduces the hop cycle, making the whole swarm act more often.<br>
  🦘 <b>Frogs jump higher forever</b> – increases base jump height for all frogs.<br>
  🐸 <b>Spawn frogs</b> – instant injections of frogs from common / epic menus.<br>
  ⏳ <b>Buffs last longer</b> – multiplies the duration of all temporary buffs (orb effects).<br>
  🎯 <b>More orbs</b> – orbs spawn more frequently over time.<br>
  💀 <b>Deathrattle</b> – dead frogs have a chance to respawn immediately (common and epic versions stack).<br>
  🏹 <b>Last Stand</b> – your final remaining frog has a strong chance to respawn instead of dying.<br>
  🌌 <b>Orb Collector</b> – every collected orb has a flat chance to spawn an extra frog (one-time pick).<br>
  🐸⭐ <b>Frog Promotion</b> – summons multiple frogs, each with a random permanent role.<br>
  🍖 <b>Cannibal Frog</b> – spawns a cannibal frog that eats nearby frogs and buffs global deathrattle while alive.<br>
  💫 <b>Orb Storm / Snake Egg</b> – high-impact utilities that affect orb spawns or the next snake after a shed.<br><br>
  Synergize permanent upgrades, frog roles, and epic choices to keep the swarm alive deep into later sheds.
  `;
    }

    infoContentEl.innerHTML = html;
    infoPageLabel.textContent = `Page ${infoPage + 1} / 5`;

    if (infoPrevBtn) {
      infoPrevBtn.disabled = (infoPage === 0);
      infoPrevBtn.style.opacity = infoPage === 0 ? "0.5" : "1";
    }
    if (infoNextBtn) {
      infoNextBtn.disabled = (infoPage === maxPage);
      infoNextBtn.style.opacity = infoNextBtn.disabled ? "0.5" : "1";
    }
  }

  function openInfoOverlay(startPage) {
    ensureInfoOverlay();
    gamePaused = true;
    if (typeof startPage === "number") {
      setInfoPage(startPage);
    } else {
      setInfoPage(infoPage);
    }
    if (infoOverlay) {
      infoOverlay.style.display = "flex";
    }
  }

  function closeInfoOverlay() {
    if (infoOverlay) {
      infoOverlay.style.display = "none";
    }
    gamePaused = false;
  }

function initUpgradeOverlay() {
  if (upgradeOverlay) return;

  upgradeOverlay = document.getElementById("upgradeOverlay");
  upgradeOverlayButtonsContainer = document.getElementById("upgradeChoicesContainer");
  upgradeOverlayTitleEl = upgradeOverlay
    ? upgradeOverlay.querySelector(".frog-panel-title")
    : null;
  upgradeOverlaySubEl = document.getElementById("upgradeOverlaySub");

  if (!upgradeOverlay) return;

  const panel = upgradeOverlay.querySelector(".frog-panel");

  // Clicking anywhere on the upgrade overlay backdrop should do nothing.
  upgradeOverlay.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  // Also block pointer presses so they do not leak through to the game.
  upgradeOverlay.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  upgradeOverlay.addEventListener("mouseup", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  if (panel) {
    panel.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    panel.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });

    panel.addEventListener("mouseup", (e) => {
      e.stopPropagation();
    });
  }
}

  // A fresh tap must begin after the mobile choice panel settles.
  let upgradeTapReadyAt = 0;
  let upgradeTapTarget = null;
  function mobileUpgradeInput() {
    return matchMedia('(pointer:coarse)').matches ||
      (navigator.maxTouchPoints > 0 && Math.min(screen.width,screen.height) <= 600);
  }
  function armUpgradeTapGuard() {
    upgradeTapReadyAt = mobileUpgradeInput() ? performance.now()+450 : 0;
    upgradeTapTarget = null;
  }
  document.addEventListener('pointerdown', e => {
    const card=e.target.closest?.('#upgradeOverlay .frog-upgrade-choice');
    if (!mobileUpgradeInput()) return;
    upgradeTapTarget=card && performance.now() >= upgradeTapReadyAt ? card : null;
  }, true);
  document.addEventListener('pointercancel', () => { upgradeTapTarget=null; }, true);
  document.addEventListener('click', e => {
    const card=e.target.closest?.('#upgradeOverlay .frog-upgrade-choice');
    if (!card || !mobileUpgradeInput()) return;
    const ready=performance.now() >= upgradeTapReadyAt;
    const freshTap=upgradeTapTarget === card;
    upgradeTapTarget=null;
    if (!ready || (!freshTap && e.detail !== 0)) {
      e.preventDefault();e.stopImmediatePropagation();
    }
  }, true);

  function selectUpgrade(choice) {
    if (!choice) return;
    if (currentUpgradeOverlayMode === "normal" && secondHelpingPicksRemaining > 0 && soundEnabled) {
      initAudio();
      if (AudioMod.playSecondHelpingPick) AudioMod.playSecondHelpingPick();
    }
    if (choice.id === "greedyHand") {
      if (greedyHandUsed) return;
      greedyHandUsed = true;
      rememberRunUpgrade(choice);
      greedyHandQueue = currentUpgradeChoices.filter(c=>c.id!=="greedyHand" && c.id!=="eyeForEye");
      closeUpgradeOverlay();
      return;
    }
    

    try {
      if (choice && choice.opensRoleDraft) {
        rememberRunUpgrade(choice);
        choice.apply();
        return;
      }

      if (typeof choice.apply === "function") {
        choice.apply();
        rememberRunUpgrade(choice);
        showUpgradeFeedback(choice);
      }
    } catch (e) {
      console.error("Error applying upgrade:", e);
    }

    
    closeUpgradeOverlay();
  }

  function populateUpgradeOverlayChoices(mode) {
    initUpgradeOverlay();

    const containerEl = upgradeOverlayButtonsContainer;
    if (!containerEl) return;

    currentUpgradeOverlayMode = mode || "normal";
    const isEpic      = currentUpgradeOverlayMode === "epic";
    const isLegendary = currentUpgradeOverlayMode === "legendary";
    const optionCount = extraUpgradeOptionActive ? 4 : 3;

    containerEl.innerHTML = "";
    const neon = "#4defff";

    if (upgradeOverlayTitleEl) {
      upgradeOverlayTitleEl.textContent = "Choose an upgrade";
    }

    let choices = [];

    if (isEpic) {
      let pool = getEpicUpgradeChoices().slice();
      if (upgradeOverlayContext === "start") {
        pool = pool.filter(choice => choice.id !== "frogScatter");
      }
      if (extraUpgradeOptionActive && !greedyHandUsed && Math.random() < 0.20) {
        pool = pool.filter(c=>c.id!=="eyeForEye");
        choices.push({id:"greedyHand",label:"Greedy Hand<br>Take <span class=menu-number-accent data-card-accent>every offered upgrade</span>. Another snake joins.",apply:()=>{}});
      }
      while (choices.length < optionCount && pool.length) {
        const idx = Math.floor(Math.random() * pool.length);
        choices.push(pool.splice(idx, 1)[0]);
      }
    } else if (isLegendary && typeof getLegendaryUpgradeChoices === "function") {
      choices = getLegendaryUpgradeChoices().slice();
    } else {
      let pool = getUpgradeChoices().slice();

      if (!initialUpgradeDone) {
        pool = pool.filter(c => c.id !== "permaLifeSteal");
      }

      const isFirstTimedNormal = initialUpgradeDone && !firstTimedNormalChoiceDone;

      if (isFirstTimedNormal) {
        firstTimedNormalChoiceDone = true;

        if (frogs.length < maxFrogsCap) {
          let spawnChoiceIndex = pool.findIndex(c => c.id === "spawn20");
          let spawnChoice;

          if (spawnChoiceIndex !== -1) {
            spawnChoice = pool.splice(spawnChoiceIndex, 1)[0];
          } else {
            spawnChoice = {
              id: "spawn20",
              label: `
                🐸 Spawn frogs<br>
                <span style="color:${neon};">${NORMAL_SPAWN_AMOUNT}</span> frogs right now
              `,
              apply: () => {
                spawnExtraFrogs(NORMAL_SPAWN_AMOUNT);
              }
            };
          }

          choices.push(spawnChoice);

          while (choices.length < optionCount && pool.length) {
            const idx = Math.floor(Math.random() * pool.length);
            choices.push(pool.splice(idx, 1)[0]);
          }
        } else {
          while (choices.length < optionCount && pool.length) {
            const idx = Math.floor(Math.random() * pool.length);
            choices.push(pool.splice(idx, 1)[0]);
          }
        }
      } else {
        while (choices.length < optionCount && pool.length) {
          const idx = Math.floor(Math.random() * pool.length);
          choices.push(pool.splice(idx, 1)[0]);
        }
      }
    }

    currentUpgradeChoices = choices.slice();

    if (!choices.length) {
      const span = document.createElement("div");
      span.className = "frog-panel-sub";
      span.textContent = "No upgrades available.";
      containerEl.appendChild(span);
      return;
    }

    choices.forEach((choice, index) => {
      const btn = document.createElement("button");
      btn.className = `frog-upgrade-choice is-spawning ${getUpgradeColorClass(choice.id)}`;
      btn.style.animationDelay = `${index * 70}ms`;

      const rawLabel = String(choice.label || "").trim();
      const parts = rawLabel.split(/<br\s*\/?>/i);
      const titleHtml = (parts.shift() || "").trim();
      const descHtml = parts.join("<br>").trim();

      // Extract just the emoji from the title (first char cluster)
      const emojiMatch = titleHtml.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|[\u{1F300}-\u{1FFFF}][\u{1F3FB}-\u{1F3FF}]?|[\u{2600}-\u{27BF}])/u);
      const emoji = emojiMatch ? emojiMatch[0] : "";
      const nameOnly = titleHtml.replace(emoji, "").trim();

      btn.innerHTML = `
        <div class="frog-upgrade-emoji">${emoji}</div>
        <div class="frog-upgrade-title">${nameOnly}</div>
        ${descHtml ? `<div class="frog-upgrade-desc">${descHtml}</div>` : ""}
      `;

      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        containerEl.querySelectorAll('button').forEach(button=>button.disabled=true);
        selectUpgrade(choice);
        updateUpgradeBuffSummary();
      });

      containerEl.appendChild(btn);
    });
  }

  function updateUpgradeBuffSummary() {
    const listEl = document.getElementById("currentUpgradeList");
    if (!upgradeOverlay || !listEl) return;

    const speedTotalPct = Math.round((1 - frogPermanentSpeedFactor) * 100);
    const jumpTotalPct  = Math.round((frogPermanentJumpFactor - 1) * 100);
    const buffTotalPct  = Math.round((buffDurationFactor - 1) * 100);
    const orbTotalPct   = Math.round((1 / getEffectiveOrbSpawnFactor() - 1) * 100);
    const drTotalPct    = Math.round((frogDeathRattleChance || 0) * 100);
    const orbCollectPct = Math.round((orbCollectorChance || 0) * 100);
    const orbLingerPct  = Math.round((orbTtlFactor - 1) * 100);

    const roleCounts = {
      champion: 0,
      aura: 0,
      magnet: 0,
      lucky: 0,
      zombie: 0,
      poison: 0
    };

    for (const frog of frogs) {
      if (frog.isChampion) roleCounts.champion++;
      if (frog.isAura)     roleCounts.aura++;
      if (frog.isMagnet)   roleCounts.magnet++;
      if (frog.isLucky)    roleCounts.lucky++;
      if (frog.isZombie)   roleCounts.zombie++;
      if (frog.isPoisonToad) roleCounts.poison++;
    }

    const items = [];
    if (panicAttackActive) items.push("<strong>Panic Attack:</strong> Confused snakes flee frogs");
    if (roleCounts.poison) items.push(`<strong>Poison Toads:</strong> ${roleCounts.poison}`);
    if (lingeringHexActive) items.push("<strong>Lingering Hex:</strong> +15% snake debuff duration, excluding Lucky Roll");
    if (lastingLegacyActive) items.push("<strong>Lasting Legacy:</strong> 20% role inheritance chance, including Frog Scatter");
    if (brittleScalesActive) items.push("<strong>Brittle Scales:</strong> Snake resistance halved");


    // Always show how many frogs you have vs cap
    items.push(
      `<strong>Squad:</strong> ${statHighlight(`${frogs.length}`)} / ${statHighlight(`${maxFrogsCap}`)} frogs on the field`
    );

    const effectiveLingerPct = Math.max(0, orbLingerPct);

    // Only push stats that are actually doing something (non-zero)
    if (speedTotalPct !== 0) {
      items.push(
        `<strong>Frog speed bonus:</strong> ${statHighlight(`${speedTotalPct}%`)} faster hops`
      );
    }
    if (jumpTotalPct !== 0) {
      items.push(
        `<strong>Jump height bonus:</strong> ${statHighlight(`${jumpTotalPct}%`)} higher hops`
      );
    }
    if (buffTotalPct !== 0) {
      items.push(
        `<strong>Buff duration:</strong> ${statHighlight(`${buffTotalPct}%`)} longer`
      );
    }
    if (orbTotalPct !== 0) {
      items.push(
        `<strong>Orb spawn pace:</strong> ${statHighlight(`${orbTotalPct}%`)} faster spawns`
      );
    }
    if (drTotalPct !== 0) {
      items.push(
        `<strong>Deathrattle:</strong> ${statHighlight(`${drTotalPct}%`)} revive chance`
      );
    }
    if (orbCollectPct !== 0) {
      items.push(
        `<strong>Orb Collector:</strong> ${statHighlight(`${orbCollectPct}%`)} chance every orb spawns a frog`
      );
    }
    if (effectiveLingerPct !== 0) {
      items.push(
        `<strong>Lingering orbs:</strong> ${statHighlight(`${effectiveLingerPct}%`)} longer before fading`
      );
    }

    if (lastStandActive) {
      items.push(
        `<strong>Last Stand:</strong> Final frog has at least ${statHighlight(`${Math.round(LAST_STAND_MIN_CHANCE * 100)}%`)} revive odds`
      );
    }

    if (orbSpecialistActive) {
      items.push(
        `<strong>Orb Specialist:</strong> Every orb guarantees ${statHighlight("1")} extra frog`
      );
    }

    if (ouroborosPactUsed) {
      items.push(
        `<strong>Soul Offering:</strong> Deathrattle revivals leave an orb`
      );
    }

    // Only show the special frogs line if there’s at least one special frog / cannibal
    const totalSpecial =
      roleCounts.champion +
      roleCounts.aura +
      roleCounts.magnet +
      roleCounts.lucky +
      roleCounts.zombie +
      cannibalFrogCount;

    if (totalSpecial > 0) {
      const roleSummary = [
        `${statHighlight(roleCounts.champion)} champion`,
        `${statHighlight(roleCounts.aura)} aura`,
        `${statHighlight(roleCounts.magnet)} magnet`,
        `${statHighlight(roleCounts.lucky)} lucky`,
        `${statHighlight(roleCounts.zombie)} zombie`,
        `${statHighlight(cannibalFrogCount)} cannibal`
      ].join(" · ");

      items.push(`<strong>Special frogs:</strong> ${roleSummary}`);
    }

    listEl.innerHTML = "";
    for (const item of items) {
      const li = document.createElement("li");
      li.innerHTML = item;
      listEl.appendChild(li);
    }
  }

  function openUpgradeOverlay(mode, opts = {}) {
    if (gameOver) return;
    initUpgradeOverlay();
    upgradeOverlayContext = opts.context || "mid";

    if (upgradeOverlaySubEl) {
      if (upgradeOverlayContext === "start") {
        upgradeOverlaySubEl.textContent = "Pick your first upgrade before the run begins.";
      } else {
        upgradeOverlaySubEl.textContent = "";
      }
    }

    if ((mode || "normal") === "normal" && secondHelpingPending && !opts.secondHelpingChain) {
      secondHelpingPending = false;
      secondHelpingPicksRemaining = 3;
    }
    populateUpgradeOverlayChoices(mode);
    armUpgradeTapGuard();
    updateUpgradeBuffSummary();

    gamePaused = true;
    if (upgradeOverlay) {
      openAnimatedOverlay(upgradeOverlay);
      if (soundEnabled) { initAudio(); playPermanentChoiceSound(); }
    }
  }

  function openFirstUpgradeSelection() {
    epicChainPending = false;
    openUpgradeOverlay("epic", { context: "start" });
  }

function startNewRun() {
  clearScissorsAndOldSnakeState();
  hideMainMenu();

  const preservedMenuFrogs = mainMenuFrogs.slice();
  stopMainMenuBackground(true);

  seedMatchGrass();
  setInGameUIVisible(true);
  restartGame();

  if (preservedMenuFrogs.length) {
    // remove the fresh frogs that restartGame spawned
    for (const frog of frogs) {
      if (frog.cloneEl && frog.cloneEl.parentNode === container) {
        container.removeChild(frog.cloneEl);
      }
      if (frog.el && frog.el.parentNode === container) {
        container.removeChild(frog.el);
      }
    }

    frogs = preservedMenuFrogs;
    mainMenuFrogs = [];

    for (const frog of frogs) {
      frog.state = "idle";
      frog.idleTime = randRange(frog.idleMin, frog.idleMax);
      frog.hopTime = 0;
      frog.y = frog.baseY;
      frog.cloneEl = null;
      frog.el.style.transform = `translate3d(${frog.x}px, ${frog.y}px, 0)`;
    }
  }

  // Starting buffs disabled for this version.
  updateStatsPanel();
  updateHUD();

  syncAudioMuteState();
  openFirstUpgradeSelection();
}

function startRunFromMenu() {
  if (startAfterHowTo) return;
  const firstRun = (loadDashboardStats().totalRuns || 0) === 0;
  if (firstRun && !hasSeenHowTo()) {
    startAfterHowTo = true;
    showHowToOverlay();
    if (howToOverlay && howToOverlay.style.display === "flex") {
      hideMainMenu();
      const button = document.getElementById("howToCloseBtn");
      if (button) { button.textContent = "Got it — let's play"; button.focus(); }
      return;
    }
    startAfterHowTo = false;
  }
  startNewRun();
}

  function triggerLegendaryFrenzy() {
    // 13-second Frenzy: snake faster + frogs panic hop randomly
    snakeFrenzyTime = 13;
    if (!peaceOfMindActive) panicHopTime = Math.max(panicHopTime, 13);
    resolveZombiePanic();
    setSnakeFrenzyVisual(true);
  }

  function closeUpgradeOverlay() {
    if (greedyHandQueue) {
      while (greedyHandQueue.length) {
        const next = greedyHandQueue.shift();
        rememberRunUpgrade(next);
        next.apply();
        if (next.opensRoleDraft) return;
        showUpgradeFeedback(next);
      }
      greedyHandQueue = null;
      const newcomer = spawnAdditionalSnake(window.innerWidth, window.innerHeight);
      if (newcomer) { newcomer.shedStage = 0; extraSnakes.push(newcomer); }
    }
    // Finish all three fresh common picks before resuming or opening a due epic.
    if (!gameOver && currentUpgradeOverlayMode === "normal" && secondHelpingPicksRemaining > 0) {
      secondHelpingPicksRemaining--;
      if (secondHelpingPicksRemaining > 0) {
        openUpgradeOverlay("normal", {secondHelpingChain:true});
        return;
      }
    }
    if (!gameOver && currentUpgradeOverlayMode === "epic" && higherCallingPicksRemaining > 0) {
      higherCallingPicksRemaining--;
      if(higherCallingPicksRemaining>0){openUpgradeOverlay("epic",{context:"shed"});return;}
      nextPermanentChoiceTime=elapsedTime+60;
    }
    const shouldOpenEpicNow =
      !gameOver && epicChainPending && currentUpgradeOverlayMode === "normal";

    // If we're chaining straight into epic, do NOT animate-close first.
    // Just clear and reopen immediately so the delayed animationend
    // cannot hide the epic overlay.
    if (shouldOpenEpicNow) {
      epicChainPending = false;

      if (!initialUpgradeDone && currentUpgradeOverlayMode === "normal") {
        initialUpgradeDone = true;
        nextPermanentChoiceTime = elapsedTime + 60;
      } else {
        nextPermanentChoiceTime = elapsedTime + 60;
      }

      gamePaused = true;
      openUpgradeOverlay("epic", {context:"shed"});
      return;
    }

    if (upgradeOverlay) {
      closeAnimatedOverlay(upgradeOverlay);
    }
    gamePaused = false;

    // schedule next timers
    if (!initialUpgradeDone) {
      initialUpgradeDone = true;
      nextPermanentChoiceTime = elapsedTime + 60;
      nextEpicChoiceTime = elapsedTime + 180;
    } else {
      if (currentUpgradeOverlayMode === "normal") {
        nextPermanentChoiceTime = elapsedTime + 60;
      } else if (currentUpgradeOverlayMode === "epic") {
        nextEpicChoiceTime = elapsedTime + 180;
      }
    }
  }

  // --------------------------------------------------
  // SCORE / LEADERBOARD
  // --------------------------------------------------
  function getLuckyScoreBonusFactor() {
    let count = 0;
    for (const frog of frogs) {
      if (frog.isLucky) count++;
    }
    return 1 + LUCKY_SCORE_BONUS_PER * count;
  }

  async function endGame() {
    if (pauseMenu) pauseMenu.style.display = "none";
    clearEventVisuals();
    clearShedSequence();
    if (gameOver || summaryPending) return;

    gameOver = true;
    gamePaused = true;
    summaryPending = true;

    lastRunScore = Math.floor(Number(score) || 0);
    lastRunTime = Number(elapsedTime) || 0;

    latestCompletedRun = {
      score: lastRunScore,
      time: lastRunTime,
      orbs: Number(totalOrbsCollected) || 0,
      frogsLost: Math.max(0, Number(totalFrogsSpawned) || 0),
      sheds: Number(snakeShedCount) || 0
    };

    recordRunToDashboard({ skipRecentRunServer: true });
    hideGameOver();
    setInGameUIVisible(false);

    // Hard-hide any other overlays so nothing can block the summary.
    [
      typeof upgradeOverlay !== "undefined" ? upgradeOverlay : null,
      typeof dashboardOverlay !== "undefined" ? dashboardOverlay : null,
      typeof leaderboardOverlay !== "undefined" ? leaderboardOverlay : null,
      typeof howToOverlay !== "undefined" ? howToOverlay : null,
      typeof buffGuideOverlay !== "undefined" ? buffGuideOverlay : null,
      typeof mainMenuOverlay !== "undefined" ? mainMenuOverlay : null
    ].forEach((overlay) => {
      if (!overlay) return;
      overlay.classList.remove("is-animating-in", "is-animating-out", "is-open");
      overlay.style.display = "none";
    });

    let leaderboardEntries = [];
    let submitFailed = false;

    try {
      const submitted = await submitScoreToServer(
        lastRunScore,
        lastRunTime,
        {
          score: latestCompletedRun.score,
          time: latestCompletedRun.time,
          orbs: latestCompletedRun.orbs,
          frogsLost: latestCompletedRun.frogsLost,
          sheds: latestCompletedRun.sheds
        },
        getSavedPlayerTag ? getSavedPlayerTag() : null
      );

      if (Array.isArray(submitted)) {
        leaderboardEntries = submitted;
      } else {
        submitFailed = true;
        const fetched = await fetchLeaderboard();
        leaderboardEntries = Array.isArray(fetched) ? fetched : [];
      }

      updateMiniLeaderboard(leaderboardEntries);
      // Push recent run AFTER submit so the server-assigned tag is now in localStorage
      pushRecentRunToServer();
    } catch (err) {
      console.error("endGame summary flow failed", err);
      submitFailed = true;
      pushRecentRunToServer();
    } finally {
      summaryPending = false;
    }

    showEndGameSummaryOverlay(leaderboardEntries, submitFailed);
  }

  function restartGame() {
    runUpgradeLog = [];
    if (pauseMenu) pauseMenu.style.display = "none";
    // Stop old loop
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }

    // Remove all frogs
    for (const frog of frogs) {
      if (frog.cloneEl && frog.cloneEl.parentNode === container) {
        container.removeChild(frog.cloneEl);
      }
      if (frog.el && frog.el.parentNode === container) {
        container.removeChild(frog.el);
      }
    }
    frogs = [];

    // Remove all orbs
    for (const orb of orbs) {
      if (orb.el && orb.el.parentNode === container) {
        container.removeChild(orb.el);
      }
    }
    orbs = [];

    // Remove snake graphics (primary)
    if (snake) {
      if (snake.head && snake.head.el && snake.head.el.parentNode === container) {
        container.removeChild(snake.head.el);
      }
      if (Array.isArray(snake.segments)) {
        for (const seg of snake.segments) {
          if (seg.el && seg.el.parentNode === container) {
            container.removeChild(seg.el);
          }
        }
      }
    }

    // Remove any extra snakes
    if (Array.isArray(extraSnakes) && extraSnakes.length) {
      for (const s of extraSnakes) {
        if (!s) continue;
        if (s.head && s.head.el && s.head.el.parentNode === container) {
          container.removeChild(s.head.el);
        }
        if (Array.isArray(s.segments)) {
          for (const seg of s.segments) {
            if (seg.el && seg.el.parentNode === container) {
              container.removeChild(seg.el);
            }
          }
        }
      }
    }
    extraSnakes = [];
    snake = null;

    clearEventVisuals();
    clearShedSequence();
    // Remove any old shed skins still fading out
    for (const ds of dyingSnakes) {
      if (ds.headEl && ds.headEl.parentNode === container) {
        container.removeChild(ds.headEl);
      }
      if (Array.isArray(ds.segmentEls)) {
        for (const el of ds.segmentEls) {
          if (el && el.parentNode === container) {
            container.removeChild(el);
          }
        }
      }
    }
    dyingSnakes = [];

luckStat = 0;
lingeringHexActive = lastingLegacyActive = brittleScalesActive = false;
bruisedEggActive = false;
panicAttackActive = false;
peaceOfMindActive = false;
forbiddenFruitActive = false;
higherCallingActive = false;
higherCallingPicksRemaining = 0;
secondHelpingPending = false;
secondHelpingPicksRemaining = 0;
    // Reset game state
    elapsedTime     = 0;
    lastTime        = 0;
    gameOver        = false;
    gamePaused      = false;
    summaryPending  = false;
    score           = 0;
    frogsEatenCount = 0;
    nextOrbTime     = 0;
    mouse.follow    = false;
    latestCompletedRun = null;
extraUpgradeOptionActive = false;
greedyHandUsed = false;
greedyHandQueue = null;
    // Reset upgrade timing
    // Reset upgrade timing / sheds
    // Reset upgrade timing / sheds
    initialUpgradeDone       = false;
    nextPermanentChoiceTime  = 60;
    nextEpicChoiceTime       = 180;
    legendaryEventTriggered  = false;
    orbSpecialistActive      = false; 
    roleDraftUsed = false;
    roleDraftPending = false;
    roleDraftChoices = [];
    snakeShedStage           = 0;
    snakeShedCount           = 0;
    nextShedTime             = SHED_INTERVAL;
    dyingSnakes              = [];
scissorsGrowthLocked = false;
severedSnakeRemnants = [];
scissorsRemnantSegments = [];
snakeEatingOldBody = false;
snakeOldBodySpeedBonusPending = false;
    snakeEggPending          = false;
    snakeEggUsed = false;
    secondWindActive = false;
    secondWindUsed = false;
doubleYolkerActive = false;
    chainReactionActive = false;
    afterglowActive = false;
    nightBloomActive = false;
    royalApprenticeshipActive = false;
    royalBatchActive = false;
    swarmDivideActive = false;
    swarmDivideUsed = false;
    graveWaveActive = false;
    graveWaveUsed = false;
    snakeEggActive = false;
    snakeEggTimer = 0;
    snakeEggHatchInterval = 60; // check every 60 seconds
    babySnakes = [];
    permanentScoreMultiplier = 1.0;
    quantumOrbsActive = false;
    moltFortuneActive = false;
    toxicBloodActive = false;
    survivalInstinctActive = false;

    pairOfScissorsUsed = false;
    orbCollectorActive       = false;
    orbCollectorChance       = 0;
    lastStandActive          = false;
    orbTtlFactor             = 1.0;
    orbLingerBonusUsed       = false;
    ouroborosPactUsed        = false;
    fragileRealityActive     = false;
    frogScatterUsed          = false;
    eyeForEyeUsed            = false;

    snakeTurnRate            = SNAKE_TURN_RATE_BASE;
    graveWaveActive   = false;
    frogEatFrogActive = false;

    // Reset all temporary buff timers
    speedBuffTime   = 0;
    jumpBuffTime    = 0;
    snakeSlowTime   = 0;
    snakeSlowCueTime = 0;
    snakeConfuseTime= 0;
    snakeShrinkTime = 0;
    frogShieldTime  = 0;
    timeSlowTime    = 0;
    orbMagnetTime   = 0;
    scoreMultiTime  = 0;
    panicHopTime    = 0;
    cloneSwarmTime  = 0;
    lifeStealTime   = 0;
    permaLifeStealOrbsRemaining = 0;
    snakeFrenzyTime = 0;
    setSnakeFrenzyVisual(false);

    // Reset EPIC deathrattle
    frogDeathRattleChance = 0.0;
    cannibalFrogCount = 0;

    // Reset global permanent buffs
    mutationPicks = 0;
    frogPermanentSpeedFactor = 1.0;
    frogPermanentJumpFactor  = 1.0;
    buffDurationFactor       = 1.0;
    buffDurationCap          = MAX_BUFF_DURATION_FACTOR;
    orbSpawnIntervalFactor   = 1.0;
    minOrbSpawnIntervalFactor= MIN_ORB_SPAWN_INTERVAL_FACTOR;
    maxFrogsCap              = MAX_FROGS;
    snakePermanentSpeedFactor= 1.0;

    // Hide overlays
    hideGameOver();
    if (upgradeOverlay) upgradeOverlay.style.display = "none";

    // Recreate frogs + snake
    const width  = window.innerWidth;
    const height = window.innerHeight;

    createInitialFrogs(width, height).then(() => {
      updateStatsPanel();
      updateHUD();
    });

    initSnake(width, height);

    setNextOrbTime();
    updateStatsPanel();
    updateHUD();

    animId = requestAnimationFrame(drawFrame);
  }

  let lastOrbSpawnFactor = 1;
  function getEffectiveOrbSpawnFactor() {
    const upgradeBonus = Math.max(0, 1 - orbSpawnIntervalFactor);
    return 1 / (1 + upgradeBonus);
  }
  function setNextOrbTime() {
    const factor = getEffectiveOrbSpawnFactor();
    const min = ORB_SPAWN_INTERVAL_MIN * factor;
    const max = ORB_SPAWN_INTERVAL_MAX * factor;
    // countdown in seconds until next orb
    nextOrbTime = randRange(min, max);
    lastOrbSpawnFactor = factor;
  }


  // --------------------------------------------------
  // GAME LOOP
  // --------------------------------------------------
  function drawFrame(time) {
    const effectiveOrbFactor = getEffectiveOrbSpawnFactor();
    if (effectiveOrbFactor !== lastOrbSpawnFactor) {
      nextOrbTime *= effectiveOrbFactor / lastOrbSpawnFactor;
      lastOrbSpawnFactor = effectiveOrbFactor;
    }

    const width  = window.innerWidth;
    const height = window.innerHeight;

    if (!lastTime) lastTime = time;
    let dt = (time - lastTime) / 1000;
    lastTime = time;

    // Clamp crazy tab-switch jumps so nothing explodes
    if (dt > 0.1) dt = 0.1;

    AudioMod.setShedAudioActive?.(!!shedSequence && !gameOver && !gamePaused && !mainMenuActive && !document.hidden);
    if (!gameOver && !gamePaused && shedSequence) {
      updateShedSequence(dt);
    } else if (!gameOver && !gamePaused) {
      updateDyingSnakes(dt);
      // ----- core timers -----
      elapsedTime += dt;
      updateBuffTimers(dt);

      // ----- ORB TIMER (back to countdown style) -----
      // nextOrbTime is a countdown in seconds, not an absolute timestamp
      nextOrbTime -= dt;
      if (nextOrbTime <= 0) {
        spawnOrbRandom(width, height);
        setNextOrbTime();   // reset countdown to a new 4–9s (scaled)
      }

      // ----- SNAKE SHED TIMER (every SHED_INTERVAL seconds) -----
      if (elapsedTime >= nextShedTime) {
        snakeShedCount++;

        // 1,2 = shed / speed up current primary snake
        // 3 = retain the red snake and bring in a fresh green snake.
        const cycleIndex = ((snakeShedCount - 1) % 3) + 1;

        if (cycleIndex === 3) handleFourthShed();
        else beginShedSequence(cycleIndex);

        nextShedTime += SHED_INTERVAL;
      }

      if (!shedSequence) {
      // ----- UPGRADE TIMING (don’t open new menu if one is already open) -----
      const overlayOpen =
        upgradeOverlay && upgradeOverlay.style.display !== "none";

      if (!gameOver && !overlayOpen) {
        // Epic chain: normal -> epic back-to-back at epic marks
        if (elapsedTime >= nextEpicChoiceTime &&
                 elapsedTime >= nextPermanentChoiceTime) {
          if(higherCallingActive){
            epicChainPending=false;higherCallingPicksRemaining=2;
            openUpgradeOverlay("epic",{context:"shed"});
          }else{
            epicChainPending = true;
            openUpgradeOverlay("normal",{context:"shed"});
          } // epic half handled in closeUpgradeOverlay
        }
        // Regular common upgrade
        else if (elapsedTime >= nextPermanentChoiceTime) {
          openUpgradeOverlay("normal");
        }
      }

      // ----- WORLD UPDATE -----
      updateFrogs(dt, width, height);
      updateSnake(dt, width, height);
      updateOrbs(dt);

      // ----- SCORING -----
      // Score is now handled per frog eaten inside updateSingleSnake().
      // No more time-based score gain here.

      // ----- GAME OVER: no frogs left -----
      if (!gameOver && frogs.length === 0) {
        endGame();
      }
      } // no world updates or upgrade panels during shedding
    }

    if(!gameOver && !gamePaused)updateEventVisuals(dt);
    updateHUD();
    updateBuffsBar();
    updateStatsPanel();
    animId = requestAnimationFrame(drawFrame);
  }

  // --------------------------------------------------
  // INIT
  // --------------------------------------------------
  async function startGame() {
    initAudio();
    initLeaderboard(container);
    initUpgradeOverlay();
    initMainMenuOverlay();
    initHowToOverlay();
    initBuffGuideOverlay();
    initLeaderboardOverlay();
    initDashboardOverlay();
    ensureInfoOverlay();

    const topList = await fetchLeaderboard();
    if (topList) {
      updateMiniLeaderboard(topList);
      infoLeaderboardData = topList;
    } else {
      infoLeaderboardData = [];
    }

    seedMatchGrass();
    showMainMenu();
  }

  window.addEventListener("load", startGame);

})();
