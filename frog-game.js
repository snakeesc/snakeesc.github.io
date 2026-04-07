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
  const playButtonClick          = AudioMod.playButtonClick          || function(){};

  const LMod = window.FrogGameLeaderboard || {};
  const initLeaderboard        = LMod.initLeaderboard        || function(){};
  const submitScoreToServer    = LMod.submitScoreToServer    || (async () => null);
  const fetchLeaderboard       = LMod.fetchLeaderboard       || (async () => null);
  const updateMiniLeaderboard  = LMod.updateMiniLeaderboard  || function(){};
  const openScoreboardOverlay  = LMod.openScoreboardOverlay  || function(){};
  const hideScoreboardOverlay  = LMod.hideScoreboardOverlay  || function(){};

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
    let nextLevelRequirement = 100;

    while (total >= nextLevelRequirement) {
      level += 1;
      levelStart = nextLevelRequirement;
      nextLevelRequirement += level * 100;
    }

    const orbsIntoCurrentLevel = total - levelStart;
    const orbsNeededForNextLevel = nextLevelRequirement - total;
    const levelSpan = nextLevelRequirement - levelStart;
    const progressPercent =
      levelSpan > 0 ? Math.max(0, Math.min(100, (orbsIntoCurrentLevel / levelSpan) * 100)) : 0;

    return {
      level,
      progressPercent,
      orbsNeededForNextLevel,
      nextLevel: level + 1
    };
  }

  function getSavedDashboardTag() {
    try {
      if (typeof localStorage === "undefined") return null;
      const tag = localStorage.getItem(TAG_STORAGE_KEY);
      if (tag && String(tag).trim() !== "") return String(tag).trim();
    } catch (e) {
      // ignore
    }
    return null;
  }

  function recordRunToDashboard() {
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
      at: Date.now(),
      isLatest: true
    });

    stats.recentRuns = stats.recentRuns.slice(0, 5);

    saveDashboardStats(stats);
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

    if (window.FrogGameLeaderboard && typeof window.FrogGameLeaderboard.isProfaneTag === "function") {
      if (window.FrogGameLeaderboard.isProfaneTag(tag)) {
        return { ok: false, message: "That tag is not allowed." };
      }
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
      "greedsToll"
    ];

    const survivalIds = [
      "deathrattle",
      "epicDeathrattle",
      "lastStand",
      "ouroborosPact",
      "secondWind",
      "toxicBlood"
    ];

    // buff duration / orbs / magnet style
    const buffIds = [
      "buffDuration",
      "epicBuffDuration",
      "orbMagnet",
      "orbLinger",
      "orbSpawn",
      "orbSpecialist",
      "moltFortune",
      "quantumOrbs"
    ];

    // orb creation / collector
    const orbIds = [
      "orbCollector"
    ];

    // frog role / squad / promotions
    const roleIds = [
      "extraFrogCap",
      "frogPromotion",
      "frogPromotionEpic",
      "cannibalPromotion",
      "roleDraft",
      "mysticPortal"
    ];

    if (mobilityIds.includes(upgradeId)) return "upgrade-type-mobility";
    if (buffIds.includes(upgradeId)) return "upgrade-type-buff";
    if (survivalIds.includes(upgradeId)) return "upgrade-type-survival";
    if (orbIds.includes(upgradeId)) return "upgrade-type-orb";
    if (roleIds.includes(upgradeId)) return "upgrade-type-role";

    // default: plain green
    return "upgrade-type-mobility";
  }


  // --------------------------------------------------
  // PLAYER TAG STORAGE (client-side only)
  // --------------------------------------------------

  function getSavedPlayerTag() {
    try {
      if (typeof localStorage === "undefined") return null;
      const val = localStorage.getItem(TAG_STORAGE_KEY);
      if (val && String(val).trim() !== "") {
        return String(val).trim();
      }
    } catch (e) {
      // ignore
    }
    return null;
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
  let nextOrbTime   = 0;
  let score         = 0;
  let frogsEatenCount = 0; // grow one segment every 2 frogs
  let latestCompletedRun = null;

  // UI + audio toggles
  let soundEnabled      = true;
  let statsPanelVisible = false;
  let mainMenuActive    = false;

  let lastRunScore  = 0;
  let lastRunTime   = 0;

  // every 60 seconds we pause for a global permanent upgrade
  let nextPermanentChoiceTime = 60;

  // every 180 seconds we pause for an EPIC upgrade
  let nextEpicChoiceTime = 180;

  let legendaryEventTriggered = false;
  let doubleYolkerActive = false;

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
  let frogDeathOrbChance   = 0;    // chance that a dead frog drops an orb
  let orbTtlFactor         = 1.0;  // multiplier for new orb lifetime
  let orbLingerBonusUsed   = false;
  let ouroborosPactUsed    = false;
  let fragileRealityActive = false;
  let frogScatterUsed      = false;
  let eyeForEyeUsed        = false;

  // Legendary Frenzy timer (snake + frogs go wild)
  let snakeFrenzyTime = 0;

  // global permanent buffs
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

  // --------------------------------------------------
  // MOUSE
  // --------------------------------------------------
  const mouse = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    active: false,
    follow: false
  };
  
  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });
  
  window.addEventListener("click", (ev) => {
    // If the scoreboard overlay is open and we clicked inside it,
    // don't treat this as a "restart" click.
    const overlayEl = document.getElementById("frog-scoreboard-overlay");
    if (overlayEl && overlayEl.contains(ev.target)) {
      // Let the leaderboard UI handle this click (Prev/Next/etc.)
      return;
    }

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

  const hud = document.createElement("div");
  hud.style.position = "absolute";
  hud.style.top = "10px";
  hud.style.left = "50%";
  hud.style.transform = "translateX(-50%)";
  hud.style.padding = "6px 12px";
  hud.style.borderRadius = "8px";
  hud.style.background = "rgba(0,0,0,0.55)";
  hud.style.color = "#fff";
  hud.style.fontFamily = "monospace";
  hud.style.fontSize = "14px";
  hud.style.zIndex = "100";
  hud.style.pointerEvents = "none";

  const timerLabel = document.createElement("span");
  const frogsLabel = document.createElement("span");
  const scoreLabel = document.createElement("span");
  frogsLabel.style.marginLeft = "12px";
  scoreLabel.style.marginLeft = "12px";

  hud.appendChild(timerLabel);
  hud.appendChild(frogsLabel);
  hud.appendChild(scoreLabel);
  container.appendChild(hud);

  // mini leaderboard
  const miniBoard = document.createElement("div");
  miniBoard.id = "frog-mini-leaderboard";
  miniBoard.style.position = "absolute";
  miniBoard.style.top = "10px";
  miniBoard.style.right = "10px";
  miniBoard.style.padding = "6px 10px";
  miniBoard.style.borderRadius = "8px";
  miniBoard.style.background = "rgba(0,0,0,0.55)";
  miniBoard.style.color = "#fff";
  miniBoard.style.fontFamily = "monospace";
  miniBoard.style.fontSize = "11px";
  miniBoard.style.zIndex = "100";
  miniBoard.style.maxWidth = "220px";
  miniBoard.style.pointerEvents = "none";
  miniBoard.textContent = "Loading leaderboard…";
  container.appendChild(miniBoard);

  // detailed stats panel (bottom-left)
  const statsPanel = document.createElement("div");
  statsPanel.id = "frog-stats-panel";
  statsPanel.style.position = "absolute";
  statsPanel.style.bottom = "10px";
  statsPanel.style.left = "10px";
  statsPanel.style.padding = "8px 12px";
  statsPanel.style.borderRadius = "10px";
  statsPanel.style.background = "rgba(0,0,0,0.75)";
  statsPanel.style.border = "1px solid #444";
  statsPanel.style.color = "#fff";
  statsPanel.style.fontFamily = "monospace";
  statsPanel.style.fontSize = "11px";
  statsPanel.style.zIndex = "100";
  statsPanel.style.maxWidth = "260px";
  statsPanel.style.pointerEvents = "none";
  statsPanel.style.lineHeight = "1.4";
  statsPanel.style.display = "none";
  container.appendChild(statsPanel);

  // Small control buttons (top-left)
  const controlsBar = document.createElement("div");
  controlsBar.style.position = "absolute";
  controlsBar.style.top = "10px";
  controlsBar.style.left = "10px";
  controlsBar.style.display = "flex";
  controlsBar.style.flexDirection = "column";
  controlsBar.style.gap = "4px";
  controlsBar.style.zIndex = "120";
  controlsBar.style.pointerEvents = "auto";

  function makeControlButton(label) {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.style.fontFamily = "monospace";
    btn.style.fontSize = "11px";
    btn.style.padding = "3px 6px";
    btn.style.borderRadius = "6px";
    btn.style.border = "1px solid #444";
    btn.style.background = "rgba(0,0,0,0.8)";
    btn.style.color = "#fff";
    btn.style.cursor = "pointer";
    btn.style.outline = "none";
    btn.onmouseenter = () => { btn.style.background = "#222"; };
    btn.onmouseleave = () => { btn.style.background = "rgba(0,0,0,0.8)"; };
    return btn;
  }

  //const btnHowTo = makeControlButton("How to play");
  const btnStats = makeControlButton("Toggle stats");
  const btnSound = makeControlButton("Sound: ON");
  const btnEnd   = makeControlButton("End run");

  //controlsBar.appendChild(btnHowTo);
  controlsBar.appendChild(btnStats);
  controlsBar.appendChild(btnSound);
  controlsBar.appendChild(btnEnd);
  container.appendChild(controlsBar);

  const gameOverBanner = document.createElement("div");
  gameOverBanner.style.position = "absolute";
  gameOverBanner.style.top = "50%";
  gameOverBanner.style.left = "50%";
  gameOverBanner.style.transform = "translate(-50%, -50%)";
  gameOverBanner.style.padding = "16px 24px";
  gameOverBanner.style.borderRadius = "10px";
  gameOverBanner.style.background = "rgba(0,0,0,0.8)";
  gameOverBanner.style.color = "#fff";
  gameOverBanner.style.fontFamily = "monospace";
  gameOverBanner.style.fontSize = "18px";
  gameOverBanner.style.textAlign = "center";
  gameOverBanner.style.zIndex = "101";
  gameOverBanner.style.pointerEvents = "none";
  gameOverBanner.style.display = "none";
  gameOverBanner.innerHTML = "Game Over<br/><small>Click to play again</small>";
  container.appendChild(gameOverBanner);

  function setInGameUIVisible(show) {
    inGameUIVisible = show;

    if (hud) hud.style.display = show ? "block" : "none";
    if (miniBoard) miniBoard.style.display = show ? "block" : "none";
    if (controlsBar) controlsBar.style.display = show ? "flex" : "none";

    if (statsPanel) {
      if (show && statsPanelVisible) {
        statsPanel.style.display = "block";
      } else {
        statsPanel.style.display = "none";
      }
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

    timerLabel.textContent = `Time: ${formatTime(elapsedTime)}`;
    frogsLabel.textContent = `Frogs left: ${frogs.length}`;
    scoreLabel.textContent = `Score: ${Math.floor(score)}`;
  }

  function updateStatsPanel() {
    const neon = "#4defff";
    if (!statsPanel || !statsPanelVisible || !inGameUIVisible) return;

    const frogsAlive = frogs.length;
    const snakesAlive =
      (snake ? 1 : 0) + (Array.isArray(extraSnakes) ? extraSnakes.length : 0);

    const scoreNow = Math.floor(score);
    const timeNow  = formatTime(elapsedTime);

    // Permanent buff percentages
    const hopSpeedBonus =
      frogPermanentSpeedFactor < 1
        ? Math.round((1 / frogPermanentSpeedFactor - 1) * 100)
        : 0;

    const jumpBonus         = Math.round((frogPermanentJumpFactor - 1) * 100);
    const buffDurationBonus = Math.round((buffDurationFactor - 1) * 100);

    const orbRateBonus =
      orbSpawnIntervalFactor < 1
        ? Math.round((1 - orbSpawnIntervalFactor) * 100)
        : 0;

    const deathrattlePct  = Math.round(frogDeathRattleChance * 100);
    const orbCollectorPct = Math.round(orbCollectorChance * 100);

    const snakeSpeedBonus =
      snakePermanentSpeedFactor > 1
        ? Math.round((snakePermanentSpeedFactor - 1) * 100)
        : 0;

    const totalOrbsText =
      totalOrbsSpawned > 0
        ? `${totalOrbsCollected}/${totalOrbsSpawned}`
        : `${totalOrbsCollected}`;

    statsPanel.style.display = "block";
    statsPanel.innerHTML =
      `<div style="font-weight:bold; margin-bottom:4px;">Upgrade stats</div>` +
      `<div>Hop speed: <span style="color: ${neon};">${hopSpeedBonus}%</span></div>` +
      `<div>Jump height: <span style="color: ${neon};">${jumpBonus}%</span></div>` +
      `<div>Buff duration: <span style="color: ${neon};">${buffDurationBonus}%</span></div>` +
      `<div>Orb spawn rate: <span style="color: ${neon};">${orbRateBonus}%</span></div>` +
      `<div>Deathrattle: <span style="color: ${neon};">${deathrattlePct}%</span></div>` +
      `<div>Orb Collector: <span style="color: ${neon};">${orbCollectorPct}%</span></div>` +
      `<div>Snake speed bonus: <span style="color: ${neon};">${snakeSpeedBonus}%</span></div>` +
      `<div>Last Stand: <span style="color: ${neon};">${lastStandActive ? "ON" : "off"}</span></div>` +
      `<div>Grave Wave: <span style="color: ${neon};">${graveWaveActive ? "ON" : "off"}</span></div>` +
      `<div>Orb Specialist: <span style="color: ${neon};">${orbSpecialistActive ? "ON" : "off"}</span></div>` +
      `<div>Cannibal frogs: <span style="color: ${neon};">${frogEatFrogActive ? "ON" : "off"}</span></div>`;
  }

    function toggleStatsPanel() {
    statsPanelVisible = !statsPanelVisible;
    if (!statsPanel) return;
    statsPanel.style.display = statsPanelVisible ? "block" : "none";
  }

  function syncAudioMuteState() {
    if (AudioMod && typeof AudioMod.setMuted === "function") {
      AudioMod.setMuted(!soundEnabled || mainMenuActive);
    }
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;

    syncAudioMuteState();

    if (btnSound) {
      btnSound.textContent = soundEnabled ? "Sound: ON" : "Sound: OFF";
    }
  }

  /* Wire up control buttons
  if (btnHowTo) {
    btnHowTo.onclick = () => {
      if (soundEnabled) playButtonClick();
      // This already sets gamePaused = true internally
      openHowToOverlay();
    };
  }
  */

  if (btnStats) {
    btnStats.onclick = () => {
      if (soundEnabled) playButtonClick();
      toggleStatsPanel();
    };
  }

  if (btnSound) {
    btnSound.onclick = () => {
      toggleSound();
      // If we just turned sound ON, give feedback
      if (soundEnabled) playButtonClick();
    };
  }

  if (btnEnd) {
    btnEnd.onclick = () => {
      if (soundEnabled) playButtonClick();
      if (!gameOver) {
        endGame(); // ends game and submits score to leaderboard
      }
    };
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
  function getPlayerSnakeSpriteSet() {
    const levelData = getDashboardLevelData(loadDashboardStats().totalOrbsCollected || 0);
    const useAlt = levelData.level > 5;

    return {
      head: useAlt ? "./images/head2.png" : "./images/head.png",
      body: useAlt ? "./images/body2.png" : "./images/body.png",
      tail: useAlt ? "./images/tail2.png" : "./images/tail.png"
    };
  }

  function isUsingAltSnakeSprites() {
    const levelData = getDashboardLevelData(loadDashboardStats().totalOrbsCollected || 0);
    return levelData.level > 5;
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
function snakeShed(stage) {
    if (!snake) return;

    const oldSnake = snake;
    const oldHeadEl = oldSnake.head && oldSnake.head.el ? oldSnake.head.el : null;
    const oldSegmentEls = Array.isArray(oldSnake.segments)
      ? oldSnake.segments.map(seg => seg.el).filter(Boolean)
      : [];

    // Despawn old snake visuals
    if (oldHeadEl || oldSegmentEls.length) {
      dyingSnakes.push({
        headEl: oldHeadEl,
        segmentEls: oldSegmentEls,
        nextDespawnTime: 0.08
      });
    }

    // Speed & Stage Logic
    let speedMult = SNAKE_SHED_SPEEDUP;
    if (snakeEggPending) {
      speedMult = SNAKE_EGG_BUFF_PCT;
      snakeEggPending = false;
    }

    const baseSpeedFactor = oldSnake.speedFactor || 1.0;
    const newSpeedFactor = baseSpeedFactor * speedMult;
    snakePermanentSpeedFactor = newSpeedFactor;

    snakeTurnRate = Math.min(SNAKE_TURN_RATE_CAP, snakeTurnRate * 1.2);
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
      segments.push({ el: segEl, x: startX, y: startY });
    }

    // --- 🚨 THE FIX: PATH PRE-FILLING 🚨 ---
    const path = [];
    const segmentGap = computeSegmentGap();
    // We need enough points in the path for every segment to have a unique index
    const requiredPathLength = (newSegCount + 5) * segmentGap; 
    
    for (let i = 0; i < requiredPathLength; i++) {
      path.push({ x: startX, y: startY });
    }

    snake = {
      head: { el: headEl, x: startX, y: startY, angle: oldSnake.head ? oldSnake.head.angle : 0 },
      segments,
      path,
      speedFactor: newSpeedFactor,
      canGrow: true
    };

    applySnakeAppearance();

    // Re-trigger Scissors Remnant Chase if needed
    if (scissorsRemnantSegments.length > 0) {
      snakeEatingOldBody = true;
      snakeOldBodySpeedBonusPending = true;
      snakeOldBodyChaseTime = 0;
    }

    if (graveWaveActive) spawnExtraFrogs(10);
    if (moltFortuneActive) {
      for (let i = 0; i < 5; i++) spawnOrbRandom(width, height);
    }
  }
  function handleFourthShed() {
    const width  = window.innerWidth;
    const height = window.innerHeight;

    // Create a brand-new fresh snake
    const newSnake = spawnAdditionalSnake(width, height);
    if (!newSnake) return;

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
        // Reset timer between chunks
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
  el.className = "frog-sprite";
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
    hopMin = 0.25; hopMax = 0.55;
    heightMin = 14; heightMax = 32;
  } else if (personalityRoll < 0.6) {
    idleMin = 0.8; idleMax = 3.0;
    hopMin = 0.35; hopMax = 0.7;
    heightMin = 10; heightMax = 26;
  } else {
    idleMin = 2.0; idleMax = 5.0;
    hopMin = 0.45; hopMax = 0.9;
    heightMin = 6;  heightMax = 20;
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

    // 🧠 Survival Instinct
    if (survivalInstinctActive && frogs.length < 10) {
      factor *= 0.80; // 20% faster hops
    }
    return factor;
  }

  function getSnakeSpeedFactor(snakeObj) {
    // Per-snake permanent speed factor (from sheds)
    let factor;

    if (snakeObj && typeof snakeObj.speedFactor === "number") {
      factor = snakeObj.speedFactor;
    } else {
      // Fallback to global if needed / for old snakes without speedFactor
      factor = snakePermanentSpeedFactor;
    }

    // Global debuffs / buffs still apply to all snakes
    if (snakeSlowTime > 0)   factor *= SNAKE_SLOW_FACTOR;
    if (timeSlowTime > 0)    factor *= TIME_SLOW_FACTOR;
    if (snakeFrenzyTime > 0) factor *= FRENZY_SPEED_FACTOR; // Frenzy speeds all snakes

    return factor;
  }

  const IS_MOBILE = window.matchMedia("(max-device-width: 768px)").matches;
  const BASE_SEGMENT_GAP = IS_MOBILE
    ? Math.max(12, Math.round(SNAKE_SEGMENT_GAP * 0.85))
    : SNAKE_SEGMENT_GAP;

  const SEGMENT_VISUAL_SPACING = 22; // px between segment centres — tune this to taste

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

    // stronger scaling than before
    const RESIST_PER_SEGMENT = 0.07;

    // small flat bonus per shed
    const shedBonus = snakeShedCount * 0.08;

    const maxResist = 1.35;

    return Math.max(
      0,
      Math.min(maxResist, extraSegments * RESIST_PER_SEGMENT + shedBonus)
    );
  }

function getRandomMutationUpgrade() {
  const speedCanImprove = frogPermanentSpeedFactor > MIN_FROG_SPEED_FACTOR + 1e-4;
  const jumpCanImprove = frogPermanentJumpFactor < MAX_FROG_JUMP_FACTOR - 1e-4;

  if (!speedCanImprove && !jumpCanImprove) {
    return null;
  }

  return {
    id: "mutation",
    label: `
      🧬 Mutation<br>
      +<span style="color:${TOTAL_HIGHLIGHT_COLOR};">12%</span> jump speed
      & +<span style="color:${TOTAL_HIGHLIGHT_COLOR};">12%</span> jump height
    `,
    apply: () => {
      applyMutationUpgrade();
    }
  };
}

function applyMutationUpgrade() {
  frogPermanentSpeedFactor *= 0.88; // 12% faster hops
  if (frogPermanentSpeedFactor < MIN_FROG_SPEED_FACTOR) {
    frogPermanentSpeedFactor = MIN_FROG_SPEED_FACTOR;
  }

  frogPermanentJumpFactor *= 1.12; // 12% higher jumps
  if (frogPermanentJumpFactor > MAX_FROG_JUMP_FACTOR) {
    frogPermanentJumpFactor = MAX_FROG_JUMP_FACTOR;
  }
}

function grantChampionFrog(frog) {
  if (frog.isChampion) return;
  frog.isChampion = true;
  frog.speedMult *= 0.80; // 20% faster hops
  frog.jumpMult  *= 1.20; // 20% higher jumps
  refreshFrogPermaGlow(frog);
  updateFrogRoleEmoji(frog);
  playPerFrogUpgradeSound("champion");
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

function grantRandomPermaFrogUpgrade(frog) {
  if (!frog) return;
  const roles = ["champion", "aura", "magnet", "lucky"];

  const available = roles.filter((r) => {
    switch (r) {
      case "champion": return !frog.isChampion;
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
    case "champion": grantChampionFrog(frog);   break;
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
  refreshFrogPermaGlow(frog);
  updateFrogRoleEmoji(frog);
}

function grantAlchemistFrog(frog) {
  if (frog.isAlchemist) return;
  frog.isAlchemist = true;
  frog.alchemistTimer = 12.0; // Drops an orb every 12s
  refreshFrogPermaGlow(frog);
  updateFrogRoleEmoji(frog);
}

// Add these two NEW functions:
function grantNecromancerFrog(frog) {
  if (frog.isNecromancer) return;
  frog.isNecromancer = true;
  refreshFrogPermaGlow(frog);
  updateFrogRoleEmoji(frog);
}

function grantAlchemistFrog(frog) {
  if (frog.isAlchemist) return;
  frog.isAlchemist = true;
  frog.alchemistTimer = 12.0; // Drops an orb every 12s
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
  if (frog.isNecromancer)  emojis.push("🧙‍♂️");
  if (frog.isAlchemist)    emojis.push("🧪");

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

function grantStarUpgrade(frog) {
  if (!frog) return;

  frog.starLevel = Math.min(3, (frog.starLevel || 0) + 1);

  // exact flat totals by star count
  frog.speedMult = 1 - (frog.starLevel * 0.10);
  frog.jumpMult  = 1 + (frog.starLevel * 0.10);

  refreshFrogPermaGlow(frog);
  updateFrogRoleEmoji(frog);
}

function spawnRoleFrog(role) {
  const frog = createRandomFrog();
  if (!frog) return null;

  clearAllFrogRoles(frog);

  switch (role) {
    case "champion":
      grantChampionFrog(frog);
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

  return frog;
}
function getRoleDraftPool() {
  return [
    { id: "champion", label: "Champion", emoji: "🏅", tier: "normal" },
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
    case "champion":
      grantChampionFrog(frog);
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
  const starredFrogs = frogs.filter(frog => (frog.starLevel || 0) > 0);

  const rolePool = getRoleDraftPool();
  const chosenRole = rolePool.find(role => role.id === roleId);
  const isEpicRole = chosenRole && chosenRole.tier === "epic";

  const spawnCount = isEpicRole ? randInt(1, 2) : randInt(2, 4);

  for (let i = 0; i < spawnCount; i++) {
    spawnRoleFrog(roleId);
  }

  for (const frog of starredFrogs) {
    const starCount = Math.max(0, frog.starLevel || 0);

    clearAllFrogRoles(frog);

    switch (roleId) {
      case "champion":
        grantChampionFrog(frog);
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
      case "alchemist":
        grantAlchemistFrog(frog);
        break;
      case "necromancer":
        grantNecromancerFrog(frog);
        break;
    }

    const extraRoleCount = Math.max(0, starCount - 1);
    for (let i = 0; i < extraRoleCount; i++) {
      grantRandomPermaFrogUpgrade(frog);
    }

    frog.starLevel = 0;

    refreshFrogPermaGlow(frog);
    updateFrogRoleEmoji(frog);
  }
}

function showRoleDraftOverlayChoices() {
  initUpgradeOverlay();
  if (!upgradeOverlayButtonsContainer) return;

  roleDraftChoices = getTwoRandomRoleDraftChoices();
  roleDraftPending = true;

  if (upgradeOverlaySubEl) {
    upgradeOverlaySubEl.textContent = "";
  }

  upgradeOverlayButtonsContainer.innerHTML = "";

  roleDraftChoices.forEach((role, index) => {
    const btn = document.createElement("button");
    btn.className = "frog-btn frog-upgrade-choice is-spawning upgrade-type-role";
    btn.style.animationDelay = `${index * 70}ms`;

    btn.innerHTML = `
      <div class="frog-upgrade-title">${role.emoji} ${role.label}</div>
      <div class="frog-upgrade-desc">
        ${
          role.id === "champion"
            ? "Faster, stronger frog with better hops."
            : role.id === "aura"
            ? "Boosts nearby frogs with an aura."
            : role.id === "magnet"
            ? "Pulls nearby orbs toward itself."
            : role.id === "lucky"
            ? "Increases luck-based bonuses and buff value."
            : role.id === "zombie"
            ? "On death, causes extra chaos and recovery."
            : role.id === "alchemist"
            ? "Drops an orb every 12 seconds."
            : role.id === "necromancer"
            ? "Deathrattle revivals become Zombies."
            : "Special frog role."
        }
      </div>
    `;

    btn.addEventListener("click", () => {
      playButtonClick();
      applyRoleDraft(role.id);
      roleDraftPending = false;
      playPermanentChoiceSound();
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
      id: "mutationChampion",
      label: `⭐ Mutation<br>Spawn 1 Champion frog`,
      apply: () => spawnRoleFrog("champion")
    },
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
  headEl.style.backgroundImage = "url(./images/head.png)";
  container.appendChild(headEl);

  const segments = [];
  for (let i = 0; i < segmentData.length; i++) {
    const src = segmentData[i];
    const segEl = src.el;
    if (!segEl) continue;

    segEl.className = i === segmentData.length - 1 ? "snake-tail" : "snake-body";
    segEl.style.zIndex = "29";

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
function applyPairOfScissors() {
  if (!snake || !Array.isArray(snake.segments) || snake.segments.length < 8) return;

  const original = snake;
  const originalSegments = original.segments.slice();
  const cutIndex = Math.floor(originalSegments.length / 2);

  const frontSegments = originalSegments.slice(0, cutIndex);
  const detachedSegments = originalSegments.slice(cutIndex);

  if (!frontSegments.length || !detachedSegments.length) return;

  // Keep only the front half alive
  original.segments = frontSegments;
  original.speedFactor = Math.max(0.6, (original.speedFactor || 1) * 0.80);
  original.canGrow = false;

  // Mark the cut point on the living snake
  const frontLast = frontSegments[frontSegments.length - 1];

  // Detached body stays where it was until next shed
  if (detachedSegments.length) {
    scissorsRemnantSegments = detachedSegments
      .map(seg => ({
        el: seg.el,
        x: seg.x,
        y: seg.y
      }))
      .filter(seg => seg.el);
  }

  // Resize the live snake path to match its shorter body
  const desiredPathLength =
    (original.segments.length + 2) * computeSegmentGap() + 2;

  while (original.path.length > desiredPathLength) {
    original.path.pop();
  }
  while (original.path.length < desiredPathLength) {
    const last = original.path[original.path.length - 1] || {
      x: original.head.x,
      y: original.head.y
    };
    original.path.push({ x: last.x, y: last.y });
  }

  scissorsGrowthLocked = true;
  pairOfScissorsUsed = true;
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

  // +5% "overall stats": slightly faster cycle + higher jumps
  frog.speedMult *= 0.95;          // 5% faster hops
  frog.jumpMult  *= 1.05;          // 5% higher jumps

  // +5% personal deathrattle
  frog.extraDeathRattleChance = (frog.extraDeathRattleChance || 0) + 0.05;

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

  // Cannibal aura: +5% per cannibal frog alive (while they exist)
  if (cannibalFrogCount > 0) {
    chance += cannibalFrogCount * 0.05;
  }

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

  return chance;
}


  // Attempt to kill a frog at index `index`, with a specific source ("snake", "cannibal", etc.)
  function tryKillFrogAtIndex(index, source) {
    const frog = frogs[index];
    if (!frog || !frog.el) return false;

    const wasLastFrog = (frogs.length === 1);
    const deathX = frog.x + FROG_SIZE / 2;
    const deathY = frog.baseY + FROG_SIZE / 2;

    // -----------------------------
    // Snake-specific protections
    // -----------------------------
    if (source === "snake") {
      // Global temporary shield from orb: protects vs snake hits
      if (frogShieldTime > 0) {
        return false;
      }

      // Clone Swarm: chance that the snake bites a fake decoy instead
      if (cloneSwarmTime > 0) {
        const DECOY_CHANCE = 0.65;
        if (Math.random() < DECOY_CHANCE) {
          playSnakeMunch(); // snake thinks it ate something
          return false;
        }
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

    // -----------------------------
    // On-death effects: zombie, global + per-frog deathrattle, Lifeline, Last Stand
    // -----------------------------

    // Zombie on-death effect (any zombie frog)
    if (frog.isZombie) {
      spawnExtraFrogs(5);
      if (source === "snake") {
        snakeSlowTime = Math.max(snakeSlowTime, 3 * buffDurationFactor);
      }
    }

    let drChance = computeDeathRattleChanceForFrog(frog);

    // Last Stand: if active and this was the last frog, guarantee at least X%,
    // but still never exceed the global cap.
    if (lastStandActive && wasLastFrog) {
      drChance = Math.max(drChance, LAST_STAND_MIN_CHANCE);
      if (drChance > MAX_DEATHRATTLE_CHANCE) {
        drChance = MAX_DEATHRATTLE_CHANCE;
      }
    }

    if (drChance > 0 && Math.random() < drChance) {
      // Spawn a replacement frog
      const newFrog = createRandomFrog();
      if (newFrog) {
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

    if (frogDeathOrbChance > 0 && Math.random() < frogDeathOrbChance) {
      spawnOrb(null, deathX, deathY);
    }

    return true; // a frog actually died
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
    const frogsToScatter = frogs.slice();

    for (const frog of frogsToScatter) {
      if (!frog) continue;
      if (frog.isCannibal) {
        unmarkCannibalFrog(frog);
      }
      frog.isZombie = false;
      frog.extraDeathRattleChance = 0;
      frog.specialDeathRattleChance = null;
    }

    for (const frog of frogsToScatter) {
      const idx = frogs.indexOf(frog);
      if (idx !== -1) {
        tryKillFrogAtIndex(idx, "scatter");
      }
    }

    const needed = Math.max(0, frogsToScatter.length - frogs.length);
    if (needed > 0) {
      spawnExtraFrogs(needed);
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


function applyBuff(type, frog, durationMultiplier = 1) {
  // Lucky frogs extend buff durations
  const isLuckyCollector = frog && frog.isLucky;
  const durBoost = isLuckyCollector
    ? LUCKY_BUFF_DURATION_BOOST   // from config, e.g. 1.4
    : 1.0;
  const durationScale = buffDurationFactor * durationMultiplier * durBoost;

  switch (type) {
    case "speed":
      speedBuffTime = SPEED_BUFF_DURATION * durationScale;
      break;

    case "jump":
      jumpBuffTime = JUMP_BUFF_DURATION * durationScale;
      break;

    case "spawn": {
      const base  = randInt(1, 10);
      const bonus = isLuckyCollector ? randInt(1, 4) : 0;
      spawnExtraFrogs(base + bonus);
      break;
    }

    case "snakeSlow":
      snakeSlowTime = SNAKE_SLOW_DURATION * durationScale;
      break;

    case "snakeConfuse":
      snakeConfuseTime = SNAKE_CONFUSE_DURATION * durationScale;
      break;

    case "snakeShrink":
      snakeShrinkTime = SNAKE_SHRINK_DURATION * durationScale;
      break;

    case "frogShield":
      frogShieldTime = FROG_SHIELD_DURATION * durationScale;
      break;

    case "timeSlow":
      timeSlowTime = TIME_SLOW_DURATION * durationScale;
      break;

    case "orbMagnet":
      orbMagnetTime = ORB_MAGNET_DURATION * durationScale;
      break;

    case "megaSpawn": {
      const base  = randInt(10, 20);
      const bonus = isLuckyCollector ? randInt(3, 8) : 0;
      spawnExtraFrogs(base + bonus);
      break;
    }

    case "scoreMulti":
      scoreMultiTime = SCORE_MULTI_DURATION * durationScale;
      break;

    case "panicHop":
      panicHopTime = PANIC_HOP_DURATION * durationScale;
      break;

    case "cloneSwarm":
      cloneSwarmTime = CLONE_SWARM_DURATION * durationScale;
      break;

    case "lifeSteal":
      lifeStealTime = LIFE_STEAL_DURATION * durationScale;
      break;

    default:
      break;
  }

  if (type !== "permaFrog") {
    playBuffSound(type);
  }
}


  function getShedStageFilter(stage) {
    const usingAlt = isUsingAltSnakeSprites();

    if (!usingAlt) {
      // keep the original normal-snake shedding exactly the same
      if (stage === 1) {
        return "hue-rotate(-40deg) saturate(1.6) brightness(1.1)";
      } else if (stage === 2) {
        return "hue-rotate(-20deg) saturate(1.7) brightness(1.05)";
      } else if (stage >= 3) {
        return "hue-rotate(-60deg) saturate(1.8)";
      }
      return "";
    }

    // toned-down shed look for head2/body2/tail2
    if (stage === 1) {
      return "hue-rotate(-18deg) saturate(1.15) brightness(1.02)";
    } else if (stage === 2) {
      return "hue-rotate(-8deg) saturate(1.2) brightness(0.98)";
    } else if (stage >= 3) {
      return "hue-rotate(-20deg) saturate(1.28) brightness(0.9)";
    }

    return "";
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

    let filter = getShedStageFilter(snakeShedStage);

    // Legendary Frenzy overlay (red tint)
    if (snakeFrenzyTime > 0) {
      filter += (filter ? " " : "") + "hue-rotate(-80deg) saturate(2)";
    }

    for (const el of elements) {
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

    if (snakeSlowTime    > 0) snakeSlowTime    = Math.max(0, snakeSlowTime    - dt * debuffTickMultiplier);
    if (snakeConfuseTime > 0) snakeConfuseTime = Math.max(0, snakeConfuseTime - dt * debuffTickMultiplier);
    if (snakeShrinkTime  > 0) snakeShrinkTime  = Math.max(0, snakeShrinkTime  - dt * debuffTickMultiplier);
    if (timeSlowTime     > 0) timeSlowTime     = Math.max(0, timeSlowTime     - dt * debuffTickMultiplier);
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
    const championBoost = frog.isChampion ? 1.4 : 1.0;
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

      // Clone Swarm visual
      if (cloneSwarmTime > 0) {
        if (!frog.cloneEl) {
          const cloneEl = frog.el.cloneNode(true);
          cloneEl.style.opacity = "0.35";
          cloneEl.style.filter = "brightness(1.3)";
          cloneEl.style.pointerEvents = "none";
          cloneEl.style.zIndex = "9";
          container.appendChild(cloneEl);
          frog.cloneEl = cloneEl;
        }
        const offset = 8;
        frog.cloneEl.style.transform =
          `translate3d(${frog.x + offset}px, ${frog.y - offset}px, 0)`;
      } else if (frog.cloneEl) {
        if (frog.cloneEl.parentNode === container) {
          container.removeChild(frog.cloneEl);
        }
        frog.cloneEl = null;
      }

      // 🧪 Alchemist Orb Drop
      if (frog.isAlchemist) {
        frog.alchemistTimer -= dt;
        if (frog.alchemistTimer <= 0) {
          spawnOrb(null, frog.x, frog.y); // Drops random orb
          frog.alchemistTimer = 12.0;     // Reset timer
        }
      }
    }
    // --- Cannibal Frogs --- //
    const cannibals = frogs.filter(f => f.isCannibal);
    if (cannibals.length > 0) {
      const eatRadius = FROG_SIZE * 0.6;
      const eatR2 = eatRadius * eatRadius;

      for (const cannibal of cannibals) {
        let victim = null;
        let bestD2 = Infinity;

        const cx = cannibal.x + FROG_SIZE / 2;
        const cy = cannibal.baseY + FROG_SIZE / 2;

        for (const candidate of frogs) {
          if (candidate === cannibal) continue;
          const fx = candidate.x + FROG_SIZE / 2;
          const fy = candidate.baseY + FROG_SIZE / 2;
          const dx = fx - cx;
          const dy = fy - cy;
          const d2 = dx * dx + dy * dy;
          if (d2 < eatR2 && d2 < bestD2) {
            bestD2 = d2;
            victim = candidate;
          }
        }
        if (victim) {
          // Chance to actually eat the frog (from config, default 10%)
          if (Math.random() < CANNIBAL_EAT_CHANCE) {
            const idx = frogs.indexOf(victim);
            if (idx !== -1) {
              // Cannibal kill; uses deathrattle logic but no snake growth
              tryKillFrogAtIndex(idx, "cannibal");
            }
          }
        }
      }
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
    if (!type) {
      type = ORB_TYPES[Math.floor(Math.random() * ORB_TYPES.length)];
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
    el.style.backgroundImage = "url(./images/orb.gif)";
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
      
      // 🌌 Quantum Orbs: Bypass decay if active
      if (!quantumOrbsActive) {
        orb.ttl -= dt;
      }

      if (orb.ttl <= 0 || !orb.el) {
        if (orb.el && orb.el.parentNode === container) {
          container.removeChild(orb.el);
        }
        orbs.splice(i, 1);
        continue;
      }

      // --- Magnet Logic ---
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

      // --- Visuals ---
      const denom = orb.maxTtl || ORB_TTL;
      const lifeT = orb.ttl / denom;
      const bob   = Math.sin((1 - lifeT) * Math.PI * 2) * 3;
      const scale = 1 + 0.1 * Math.sin((1 - lifeT) * Math.PI * 4);

      const renderY = orb.y + bob;
      orb.el.style.transform =
        `translate3d(${orb.x - ORB_RADIUS}px, ${renderY - ORB_RADIUS}px, 0) scale(${scale})`;
      orb.el.style.opacity = String(Math.max(0, Math.min(1, lifeT + 0.2)));

      // --- Collection Logic ---
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
          grantStarUpgrade(collectedBy);
        } else {
          applyBuff(orb.type, collectedBy);
        }

        let frogsToSpawnFromOrb = 0;

        // 🧪 Epic: Orb Specialist (Guaranteed 1)
        if (orbSpecialistActive) {
          frogsToSpawnFromOrb += 1; 
        }

        // 🥚 Common: Double Yolker (15% chance for 2 extra)
        if (doubleYolkerActive && Math.random() < 0.15) {
          frogsToSpawnFromOrb += 2;
        }

        // 🩺 Lifeline / Permanent Lifesteal
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

  // Spawn a second active snake without touching the primary one
  function spawnAdditionalSnake(width, height, opts = {}) {
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
    const maxPath = (segmentCount + 2) * segmentGap + 2;
    for (let i = 0; i < maxPath; i++) {
      path.push({ x: startX, y: startY });
    }

    // Fresh snake: base speed + base color
    const newSnake = {
      head: { el: headEl, x: startX, y: startY, angle: initialAngle },
      segments,
      path,
      isFrenzyVisual: false,
      speedFactor: 1.0
    };

    if (colorFilter) {
      headEl.style.filter = colorFilter;
      for (const seg of segments) {
        seg.el.style.filter = colorFilter;
      }
    }

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

    if (!snakes.length) return;

    let slowest = snakes[0];
    let slowestSpeed = typeof slowest.speedFactor === "number" ? slowest.speedFactor : 1;
    for (const s of snakes) {
      const speed = typeof s.speedFactor === "number" ? s.speedFactor : 1;
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

    const halfFrogs = Math.floor(frogs.length / 2);
    killRandomFrogs(halfFrogs, "eyeForEye");

    maxFrogsCap = Math.min(maxFrogsCap, 50);
    if (frogs.length > maxFrogsCap) {
      killRandomFrogs(frogs.length - maxFrogsCap, "eyeForEye");
    }
  }

  function growSnakeForSnake(snakeObj, extraSegments) {
    if (!snakeObj) return;
    if (scissorsGrowthLocked && snakeObj && snakeObj.canGrow === false) {
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
    return { x: last.x, y: last.y, nextStart: path.length - 1 };
  }
  function updateSingleSnake(snakeObj, dt, width, height, opts = {}) {
    if (!snakeObj) return;

    const frogList = Array.isArray(opts.frogsList) ? opts.frogsList : frogs;
    const isMainMenu = !!opts.mainMenu;
    const marginX = 8;
    const marginY = 24;

    const head = snakeObj.head;
    if (!head) return;

    const shrinkScale = snakeShrinkTime > 0 ? 0.75 : 1.0;

    // 1. TARGETING
    let targetFrog = null;
    let bestDist2 = Infinity;
    let targetRemnant = null;
    let bestRemnantDist2 = Infinity;

    // Scissors logic
    if (!isMainMenu && snakeObj === snake && snakeEatingOldBody && scissorsRemnantSegments.length > 0) {
      snakeOldBodyChaseTime += dt;
      for (const seg of scissorsRemnantSegments) {
        const dx = (seg.x + SNAKE_SEGMENT_SIZE/2) - head.x;
        const dy = (seg.y + SNAKE_SEGMENT_SIZE/2) - head.y;
        const d2 = dx*dx + dy*dy;
        if (d2 < bestRemnantDist2) {
          bestRemnantDist2 = d2;
          targetRemnant = seg;
        }
      }
      if (snakeOldBodyChaseTime > 12.0) {
        snakeEatingOldBody = false;
        snakeLastRemnantTarget = null;
      }
    }

    for (const frog of frogList) {
      const dx = (frog.x + FROG_SIZE/2) - head.x;
      const dy = (frog.baseY + FROG_SIZE/2) - head.y;
      const d2 = dx*dx + dy*dy;
      if (d2 < bestDist2) {
        bestDist2 = d2;
        targetFrog = frog;
      }
    }

    // 2. MOVEMENT
    let desiredAngle = head.angle;
    if (snakeConfuseTime > 0) {
      desiredAngle = head.angle + (Math.random() - 0.5) * Math.PI;
    } else if (targetRemnant) {
      desiredAngle = Math.atan2((targetRemnant.y + SNAKE_SEGMENT_SIZE/2) - head.y, (targetRemnant.x + SNAKE_SEGMENT_SIZE/2) - head.x);
    } else if (targetFrog) {
      desiredAngle = Math.atan2((targetFrog.baseY + FROG_SIZE/2) - head.y, (targetFrog.x + FROG_SIZE/2) - head.x);
    }

    let angleDiff = ((desiredAngle - head.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    const maxTurn = snakeTurnRate * dt;
    head.angle += Math.max(-maxTurn, Math.min(maxTurn, angleDiff));

    const speedFactor = getSnakeSpeedFactor(snakeObj);
    const speed = SNAKE_BASE_SPEED * speedFactor;
    head.x += Math.cos(head.angle) * speed * dt;
    head.y += Math.sin(head.angle) * speed * dt;

    // Boundary Bounce
    if (head.x < marginX) { head.x = marginX; head.angle = Math.PI - head.angle; }
    else if (head.x > width - marginX - SNAKE_SEGMENT_SIZE) { head.x = width - marginX - SNAKE_SEGMENT_SIZE; head.angle = Math.PI - head.angle; }
    if (head.y < marginY) { head.y = marginY; head.angle = -head.angle; }
    else if (head.y > height - marginY - SNAKE_SEGMENT_SIZE) { head.y = height - marginY - SNAKE_SEGMENT_SIZE; head.angle = -head.angle; }

    // 3. PATH & BODY POSITIONING (distance-based — fixes stretching at high speed)
    snakeObj.path.unshift({ x: head.x, y: head.y });

    // Keep enough path history for all segments at the visual spacing
    const minPathPoints = snakeObj.segments.length * SEGMENT_VISUAL_SPACING * 2 + 64;
    if (snakeObj.path.length > minPathPoints) {
      snakeObj.path.length = minPathPoints;
    }

    head.el.style.transform = `translate3d(${head.x}px, ${head.y}px, 0) rotate(${head.angle}rad) scale(${shrinkScale})`;

    // Place each segment exactly SEGMENT_VISUAL_SPACING px further along the path
    // than the previous one, regardless of snake speed.
    let searchIdx = 0;
    for (let i = 0; i < snakeObj.segments.length; i++) {
      const result = samplePathAtDistance(snakeObj.path, searchIdx, SEGMENT_VISUAL_SPACING);

      const seg = snakeObj.segments[i];
      seg.x = result.x;
      seg.y = result.y;
      searchIdx = result.nextStart;

      // Angle: direction along the path at this point
      let angle = 0;
      if (result.nextStart + 1 < snakeObj.path.length) {
        const px = snakeObj.path[result.nextStart].x;
        const py = snakeObj.path[result.nextStart].y;
        const nx = snakeObj.path[result.nextStart + 1].x;
        const ny = snakeObj.path[result.nextStart + 1].y;
        angle = Math.atan2(ny - py, nx - px);
      }

      seg.el.style.transform = `translate3d(${seg.x}px, ${seg.y}px, 0) rotate(${angle}rad) scale(${shrinkScale})`;
    }

    // 4. COLLISIONS
    const headCx = head.x + SNAKE_SEGMENT_SIZE / 2;
    const headCy = head.y + SNAKE_SEGMENT_SIZE / 2;
    const eatR2 = Math.pow(getSnakeEatRadius(), 2);

    // Eating Frogs
    for (let i = frogList.length - 1; i >= 0; i--) {
      const f = frogList[i];
      const dx = (f.x + FROG_SIZE/2) - headCx;
      const dy = (f.baseY + FROG_SIZE/2) - headCy;
      if (dx*dx + dy*dy <= eatR2) {
        if (isMainMenu) {
          frogList.splice(i, 1);
          if (f.el.parentNode) f.el.parentNode.removeChild(f.el);
        } else if (tryKillFrogAtIndex(i, "snake")) {
          frogsEatenCount++;
          score += (1 * permanentScoreMultiplier * (scoreMultiTime > 0 ? SCORE_MULTI_FACTOR : 1));
          if (frogsEatenCount % 2 === 0) growSnakeForSnake(snakeObj, 1);
        }
      }
    }

    // Eating Old Body (Scissors Remnants)
    if (snakeEatingOldBody && snakeObj === snake && scissorsRemnantSegments.length > 0) {
      const remR2 = Math.pow(SNAKE_SEGMENT_SIZE * 0.8, 2);
      for (let i = scissorsRemnantSegments.length - 1; i >= 0; i--) {
        const s = scissorsRemnantSegments[i];
        const dx = (s.x + SNAKE_SEGMENT_SIZE/2) - headCx;
        const dy = (s.y + SNAKE_SEGMENT_SIZE/2) - headCy;
        if (dx*dx + dy*dy <= remR2) {
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

function getUpgradeChoices() {
    const neon = "#4defff";
    const epicTitleColor = "#ffb347";

    const speedPerPickPct     = Math.round((1 - FROG_SPEED_UPGRADE_FACTOR) * 100);
    const jumpPerPickPct      = Math.round((FROG_JUMP_UPGRADE_FACTOR - 1) * 100);
    const buffPerPickPct      = Math.round((BUFF_DURATION_UPGRADE_FACTOR - 1) * 100);
    const deathPerPickPct     = Math.round(COMMON_DEATHRATTLE_CHANCE * 100);

    const upgrades = [];

    // --- 🎭 Role Draft ---
    upgrades.push({
      id: "roleDraft",
      label: `🎭 Role Draft<br>Choose between <span style="color:${neon};">2</span> random frog roles`,
      opensRoleDraft: true,
      apply: () => {
        roleDraftUsed = true;
        showRoleDraftOverlayChoices();
      }
    });

    // --- 🥚 Double Yolker ---
    if (!doubleYolkerActive) {
      upgrades.push({
        id: "doubleYolker",
        label: `🥚 Double Yolker<br>Orbs have a <span style="color:${neon};">15%</span> chance to spawn <span style="color:${neon};">2</span> frogs`,
        apply: () => { doubleYolkerActive = true; }
      });
    }

    // --- 🐸 Spawn Frogs ---
    if (frogs.length < maxFrogsCap) {
      upgrades.push({
        id: "spawn20",
        label: `🐸 Spawn frogs<br><span style="color:${neon};">${NORMAL_SPAWN_AMOUNT}</span> frogs right now`,
        apply: () => { spawnExtraFrogs(NORMAL_SPAWN_AMOUNT); }
      });
    }

    // --- 🎯 Orb Flow ---
    if (orbSpawnIntervalFactor > minOrbSpawnIntervalFactor + 1e-4) {
      upgrades.push({
        id: "epicMoreOrbs",
        label: `🎯 Orb Flow<br>Increase orb spawn rate by <span style="color:${neon};">10%</span>`,
        apply: () => {
          orbSpawnIntervalFactor *= ORB_INTERVAL_UPGRADE_FACTOR;
          if (orbSpawnIntervalFactor < minOrbSpawnIntervalFactor) orbSpawnIntervalFactor = minOrbSpawnIntervalFactor;
        }
      });
    }

    // --- 🌩️ Orb Storm ---
    upgrades.push({
      id: "epicOrbStorm",
      label: `🌩️ Orb Storm<br>Drop <span style="color:${neon};">${ORB_STORM_COUNT}</span> random orbs right now`,
      apply: () => {
        const width  = window.innerWidth;
        const height = window.innerHeight;
        for (let i = 0; i < ORB_STORM_COUNT; i++) spawnOrbRandom(width, height);
      }
    });

    // --- ✂️ Pair of Scissors ---
    if (!pairOfScissorsUsed && !epicChainPending && upgradeOverlayContext !== "start") {
      upgrades.push({
        id: "pairOfScissors",
        label: `✂️ Pair of Scissors<br>Cut the snake in <span style="color:${neon};">half</span> and slow it by <span style="color:${neon};">20%</span>`,
        apply: () => { applyPairOfScissors(); }
      });
    }

    // --- 🌀 Orb Whisperer ---
    if (!orbLingerBonusUsed) {
      upgrades.push({
        id: "orbWhisperer",
        label: `🌀 Orb Whisperer<br>Orbs linger <span style="color:${neon};">30%</span> longer`,
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

    // --- 🧬 Mutation ---
    const mutationChoice = getRandomMutationUpgrade();
    if (mutationChoice) upgrades.push(mutationChoice);

    // --- ⏳ Buff Duration ---
    if (buffDurationFactor < buffDurationCap - 1e-4) {
      upgrades.push({
        id: "buffDuration",
        label: `⏳ Buffs last longer<br>+<span style="color:${neon};">${buffPerPickPct}%</span> duration`,
        apply: () => {
          buffDurationFactor *= BUFF_DURATION_UPGRADE_FACTOR;
          if (buffDurationFactor > buffDurationCap) buffDurationFactor = buffDurationCap;
        }
      });
    }

    // --- 💀 Deathrattle ---
    if (frogDeathRattleChance < MAX_DEATHRATTLE_CHANCE - 1e-4) {
      upgrades.push({
        id: "commonDeathRattle",
        label: `💀 Deathrattle<br>+<span style="color:${neon};">${deathPerPickPct}%</span> revive chance`,
        apply: () => {
          frogDeathRattleChance = Math.min(MAX_DEATHRATTLE_CHANCE, frogDeathRattleChance + COMMON_DEATHRATTLE_CHANCE);
        }
      });
    }

    // --- 🏹 Last Stand ---
    if (!lastStandActive) {
      upgrades.push({
        id: "lastStand",
        label: `🏹 Last Stand<br>Last frog has <span style="color:${neon};">${Math.round(LAST_STAND_MIN_CHANCE * 100)}%</span> revive odds`,
        apply: () => { lastStandActive = true; }
      });
    }

    return upgrades;
  }
function getEpicUpgradeChoices() {
    const epicTitleColor = "#ffb347";
    const deathPerPickPct = Math.round(EPIC_DEATHRATTLE_CHANCE * 100);
    const epicBuffFactor  = BUFF_DURATION_UPGRADE_FACTOR + 0.15;
    const buffPerPickPct  = Math.round((epicBuffFactor - 1) * 100);

    const upgrades = [];

    // --- ⚡ Survival Instinct ---
    if (!survivalInstinctActive) {
      upgrades.push({
        id: "survivalInstinct",
        label: `⚡ Survival Instinct<br>When below 10 frogs, they hop <span style="color:${epicTitleColor};">20%</span> faster`,
        apply: () => { survivalInstinctActive = true; }
      });
    }

    // --- 🐸 Epic Spawn ---
    if (frogs.length < maxFrogsCap) {
      upgrades.push({
        id: "epicSpawn30",
        label: `🐸 Spawn Frogs<br>Spawn <span style="color:${epicTitleColor};">30</span> frogs now`,
        apply: () => { spawnExtraFrogs(30); }
      });
    }

    // --- 💀 Epic Deathrattle ---
    if (frogDeathRattleChance < MAX_DEATHRATTLE_CHANCE - 1e-4) {
      upgrades.push({
        id: "epicDeathRattle",
        label: `💀 Epic Deathrattle<br>+<span style="color:${epicTitleColor};">${deathPerPickPct}%</span> revive chance`,
        apply: () => {
          frogDeathRattleChance = Math.min(MAX_DEATHRATTLE_CHANCE, frogDeathRattleChance + EPIC_DEATHRATTLE_CHANCE);
        }
      });
    }

    // --- 🧪 Orb Specialist ---
    if (!orbSpecialistActive) {
      upgrades.push({
        id: "epicOrbSpecialist",
        label: `🧪 Orb specialist<br>Every collected orb guarantees <span style="color:${epicTitleColor};">1</span> extra frog`,
        apply: () => { orbSpecialistActive = true; }
      });
    }

    // --- 💨 Second Wind ---
    if (!secondWindUsed && !secondWindActive) {
      upgrades.push({
        id: "secondWind",
        label: `💨 Second Wind<br>Below 10 frogs: instantly spawn <span style="color:${epicTitleColor};">20</span> (once)`,
        apply: () => { secondWindActive = true; }
      });
    }

    // --- 👻 Grave Wave ---
    if (!graveWaveActive && !graveWaveUsed) {
      upgrades.push({
        id: "graveWave",
        label: `👻 Grave Wave<br>Each shed spawns <span style="color:${epicTitleColor};">10</span> frogs`,
        apply: () => { graveWaveActive = true; graveWaveUsed = true; }
      });
    }

    // --- 🧪 Poisonous Skin ---
    if (!toxicBloodActive) {
      upgrades.push({
        id: "toxicBlood",
        label: `🧪 Poisonous Skin<br>Snake is slowed briefly every time it eats a frog`,
        apply: () => { toxicBloodActive = true; }
      });
    }

    // --- 🌪️ Frog Scatter ---
    if (!frogScatterUsed && frogs.length > 0) {
      upgrades.push({
        id: "frogScatter",
        label: `🌪️ Frog Scatter<br>Kill and respawn <span style="color:${epicTitleColor};">all</span> current frogs`,
        apply: () => { frogScatterUsed = true; scatterFrogSwarm(); }
      });
    }

    // --- 🔮 Molt Fortune ---
    if (!moltFortuneActive) {
      upgrades.push({
        id: "moltFortune",
        label: `🔮 Molt Fortune<br>Snake drops <span style="color:${epicTitleColor};">5</span> orbs when shedding`,
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
    el.className = "frog-sprite";
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
      hopMin = 0.25; hopMax = 0.55;
      heightMin = 14; heightMax = 32;
    } else if (personalityRoll < 0.6) {
      idleMin = 0.8; idleMax = 3.0;
      hopMin = 0.35; hopMax = 0.7;
      heightMin = 10; heightMax = 26;
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
    const width  = window.innerWidth;
    const height = window.innerHeight;

    clearMainMenuSnakes();
    clearMainMenuFrogs();

    const stages = [1, 2, 3];
    const shuffledStages = stages.slice().sort(() => Math.random() - 0.5);

    for (let i = 0; i < 2; i++) {
      const stage = shuffledStages[i % shuffledStages.length];
      const snakeObj = spawnAdditionalSnake(width, height, {
        startX: randRange(width * 0.2, width * 0.8),
        startY: randRange(height * 0.25, height * 0.75),
        angle: randRange(-Math.PI, Math.PI),
        segmentCount: randInt(20, 30),
        colorFilter: getShedStageFilter(stage)
      });

      if (snakeObj) {
        snakeObj.isMainMenu = true;
        snakeObj.speedFactor = 0.7 + Math.random() * 0.4;
        mainMenuSnakes.push(snakeObj);
      }
    }

    ensureMainMenuFrogCount(8, width, height);

    mainMenuActive = true;
    mainMenuLastTime = 0;
    if (!mainMenuAnimId) {
      mainMenuAnimId = requestAnimationFrame(runMainMenuFrame);
    }
  }

  function stopMainMenuBackground() {
    mainMenuActive = false;
    if (mainMenuAnimId) {
      cancelAnimationFrame(mainMenuAnimId);
      mainMenuAnimId = null;
    }
    mainMenuLastTime = 0;
    clearMainMenuSnakes();
    clearMainMenuFrogs();
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

  overlayEl.classList.remove("is-animating-in");

  const panel = overlayEl.querySelector(".frog-panel");
  if (!panel) {
    overlayEl.classList.remove("is-open");
    overlayEl.style.display = "none";
    return;
  }

  overlayEl.classList.add("is-animating-out");

  panel.addEventListener(
    "animationend",
    () => {
      overlayEl.classList.remove("is-animating-out", "is-open");
      overlayEl.style.display = "none";
    },
    { once: true }
  );
}
  function initMainMenuOverlay() {
    if (mainMenuOverlay) return;

    mainMenuOverlay = document.getElementById("mainMenuOverlay");
    const btnStartRun = document.getElementById("btnStartRun");
    const btnHowTo = document.getElementById("btnHowTo");
    const btnBuffGuide = document.getElementById("btnBuffGuide");
    const btnLeaderboard = document.getElementById("btnLeaderboard");
    const btnDashboard = document.getElementById("btnDashboard");

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

    if (MAIN_MENU_BACKGROUND_ENABLED) {
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
      <div class="frog-panel-title" style="color: white !important;">
        How to Play
        <span class="emoji">🐸</span>
      </div>

      <div class="frog-panel-sub" style="color: white !important;">
        Stay alive, avoid the snake, and survive as long as you can.
      </div>

      <div class="frog-panel-section-label">Basics</div>
      <ul class="frog-panel-list">
        <li>Move your mouse or finger to lead the frogs.</li>
        <li>Do not let the snake eat all of them.</li>
        <li>When all frogs are gone, the run ends.</li>
      </ul>

      <div class="frog-panel-section-label">During a Run</div>
      <ul class="frog-panel-list">
        <li>Collect orbs for buffs and upgrades.</li>
        <li>Pick upgrades that help your swarm survive longer.</li>
        <li>The snake gets more dangerous as the run goes on.</li>
      </ul>

      <div class="frog-panel-section-label">Tips</div>
      <ul class="frog-panel-list">
        <li>Do not bunch your frogs up too tightly.</li>
        <li>More frogs help, but survival upgrades matter too.</li>
        <li>Try to plan ahead before the snake corners you.</li>
      </ul>

      <div class="frog-panel-footer">
        <button id="howToCloseBtn" class="frog-btn frog-btn-secondary" style="margin-top:6px;">
          Close
        </button>
      </div>
    `;

    const closeBtn = document.getElementById("howToCloseBtn");
    if (closeBtn) {
      closeBtn.addEventListener("click", hideHowToOverlay);
    }

    openAnimatedOverlay(howToOverlay);
  }

  function hideHowToOverlay() {
    if (howToOverlay) {
      closeAnimatedOverlay(howToOverlay);
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
      { title: "Perma Frog", desc: `Grants the collector a random permanent role (Champion, Aura, Magnet, Lucky, or Zombie).` }
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
      { title: "Ouroboros Pact", desc: `${fmtPct(10)} of dead frogs drop an orb.` },
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
      { title: "Snake Egg", desc: `Next snake shed only gains ${fmtPct(15)} speed instead of a huge spike.` },
      { title: "Frog Promotion", desc: `${statHighlight(10)} new frogs, each with a random permanent role.` },
      { title: "Grave Wave", desc: `Every shed spawns ${fmtRange(GRAVE_WAVE_MIN_GHOSTS, GRAVE_WAVE_MAX_GHOSTS)} uncontrollable ghost frogs.` },
      { title: "Orb Specialist", desc: `Every orb guarantees ${statHighlight("1")} frog; Orb Collector rolls can add more.` },
      { title: "Fragile Reality", desc: `Doubles buff duration caps but halves orb spawn speed going forward.` },
      { title: "Frog Scatter", desc: `Wipe and respawn every frog with fresh roles; deathrattles still trigger.` },
      { title: "Eye for an Eye", desc: `Kill the slowest snake and half your frogs; frog cap drops to ${statHighlight(50)}.` }
    ];

    const legendaryUpgrades = [
      { title: "Legendary Buff Surge", desc: `Multiply every buff duration by ${statHighlight(LEGENDARY_BUFF_DURATION_FACTOR.toFixed(1))}.` },
      { title: "Legendary Frog Wave", desc: `Spawn ${statHighlight(LEGENDARY_SPAWN_AMOUNT)} frogs instantly.` },
      { title: "Legendary Deathrattle", desc: `${fmtPct(LEGENDARY_DEATHRATTLE_CHANCE * 100)} revive chance in one pick.` }
    ];

    const roleDescriptions = [
      { title: "Champion", desc: `${fmtPct((1 - CHAMPION_SPEED_FACTOR) * 100)} faster hops and ${fmtPct((CHAMPION_JUMP_FACTOR - 1) * 100)} higher jumps.` },
      { title: "Aura", desc: `All frogs within ${statHighlight(`${AURA_RADIUS}px`)} get ${fmtPct((1 - AURA_SPEED_FACTOR) * 100)} faster hops and ${fmtPct((AURA_JUMP_FACTOR - 1) * 100)} higher jumps.` },
      { title: "Magnet", desc: `Pulls nearby orbs from ${statHighlight(`${ORB_MAGNET_PULL_RANGE}px`)} away.` },
      { title: "Lucky", desc: `Buffs last ${statHighlight(`${Math.round((LUCKY_BUFF_DURATION_BOOST - 1) * 100)}%`)} longer and spawn orbs can add bonus frogs.` },
      { title: "Zombie", desc: `On death, spawns ${statHighlight(5)} frogs and slows the snake for about ${fmtSec(3)}.` },
      { title: "Cannibal", desc: `${fmtPct((1 - 0.95) * 100)} faster hops, ${fmtPct((1.05 - 1) * 100)} higher jumps, and ${fmtPct(5)} personal deathrattle; ${fmtPct(CANNIBAL_EAT_CHANCE * 100)} chance to eat nearby frogs.` }
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

    // Click outside panel closes it
    buffGuideOverlay.addEventListener("click", (e) => {
      if (e.target === buffGuideOverlay) {
        hideBuffGuideOverlay();
      }
    });

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

    panel.innerHTML = `
      <div class="frog-panel-title" style="color: white !important;">
        Upgrades
        <span class="emoji">⚡</span>
      </div>

      <div class="frog-panel-sub" style="color: white !important;">
        All common and epic upgrades. Offered every one and three minute(s).
      </div>

      <ul class="upgrade-guide-list">
        <li class="upgrade-guide-item upgrade-type-mobility">
          <strong>🧬 Mutation</strong> — +12% jump speed and +12% jump height.
        </li>
        <li class="upgrade-guide-item upgrade-type-mobility">
          <strong>⚡ Survival Instinct</strong> — below 10 frogs, they hop 20% faster.
        </li>
        <li class="upgrade-guide-item upgrade-type-mobility">
          <strong>🌪️ Frog Scatter</strong> — kill and respawn all current frogs.
        </li>
        <li class="upgrade-guide-item upgrade-type-mobility">
          <strong>✂️ Pair of Scissors</strong> — cuts the snake in half, slows it by 30%.
        </li>
      </ul>

      <ul class="upgrade-guide-list">
        <li class="upgrade-guide-item upgrade-type-buff">
          <strong>🌀 Orb Whisperer</strong> — orbs linger 30% longer.
        </li>
        <li class="upgrade-guide-item upgrade-type-buff">
          <strong>⏳ Buffs Last Longer</strong> — increases all buff durations.
        </li>
        <li class="upgrade-guide-item upgrade-type-buff">
          <strong>🎯 Orb Flow</strong> — increases the frequency of orb spawns.
        </li>
        <li class="upgrade-guide-item upgrade-type-buff">
          <strong>🌩️ Orb Storm</strong> — drops a burst of random orbs immediately.
        </li>
        <li class="upgrade-guide-item upgrade-type-buff">
          <strong>🧪 Orb Specialist</strong> — every collected orb guarantees 1 frog.
        </li>
        <li class="upgrade-guide-item upgrade-type-buff">
          <strong>🥚 Double Yolker</strong> — 15% chance for orbs to spawn 2 frogs.
        </li>
        <li class="upgrade-guide-item upgrade-type-buff">
          <strong>🔮 Molt Fortune</strong> — snake drops 5 orbs when shedding.
        </li>
      </ul>

      <ul class="upgrade-guide-list">
        <li class="upgrade-guide-item upgrade-type-survival">
          <strong>💀 Deathrattle</strong> — dead frogs have a chance to respawn.
        </li>
        <li class="upgrade-guide-item upgrade-type-survival">
          <strong>🏹 Last Stand</strong> — your last frog has strong revive odds.
        </li>
        <li class="upgrade-guide-item upgrade-type-survival">
          <strong>💨 Second Wind</strong> — once per run, spawn 20 frogs when below 10.
        </li>
        <li class="upgrade-guide-item upgrade-type-survival">
          <strong>🧪 Poisonous Skin</strong> — snake is slowed every time it eats a frog.
        </li>
        <li class="upgrade-guide-item upgrade-type-survival">
          <strong>⚱️ Ouroboros Pact</strong> — 20% chance dead frogs drop an orb.
        </li>
        <li class="upgrade-guide-item upgrade-type-survival">
          <strong>👻 Grave Wave</strong> — each shed spawns 10 frogs.
        </li>
      </ul>

      <ul class="upgrade-guide-list">
        <li class="upgrade-guide-item upgrade-type-role">
          <strong>🐸 Spawn Frogs</strong> — spawn fresh frogs instantly.
        </li>
        <li class="upgrade-guide-item upgrade-type-role">
          <strong>🎭 Role Draft</strong> — choose between 2 random frog roles.
        </li>
      </ul>

      <div class="frog-panel-footer">
        <button id="buffGuideCloseBtn" class="frog-btn frog-btn-secondary" style="margin-top:6px;">
          Close
        </button>
      </div>
    `;

    const closeBtn = document.getElementById("buffGuideCloseBtn");
    if (closeBtn) {
      closeBtn.onclick = hideBuffGuideOverlay;
    }

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
          <div class="frog-panel-section-label">Leaderboard</div>
          <ul class="frog-panel-list">
            <li>No runs yet.</li>
          </ul>
        `;
        leaderboardOverlay.style.display = "flex";
        return;
      }

      const userLabel =
        (window.FrogGameLeaderboard &&
          typeof window.FrogGameLeaderboard.getCurrentUserLabel === "function" &&
          window.FrogGameLeaderboard.getCurrentUserLabel()) ||
        null;

      function normalizeTag(tag) {
        return typeof tag === "string" ? tag.trim().toLowerCase() : "";
      }

      function entryMatchesUser(entry) {
        if (!entry || !userLabel) return false;
        const tag = normalizeTag(entry.tag);
        const name = normalizeTag(entry.name);
        const target = normalizeTag(userLabel);
        return tag === target || name === target;
      }

      function getScore(entry) {
        if (!entry) return 0;
        const keys = ["bestScore", "score", "maxScore", "points", "value"];
        for (const key of keys) {
          if (!(key in entry)) continue;
          let v = entry[key];
          if (typeof v === "string") v = parseFloat(v);
          if (typeof v === "number" && isFinite(v)) return v;
        }
        return 0;
      }

      function getTime(entry) {
        if (!entry) return 0;
        const keys = ["bestTime", "time", "maxTime", "seconds", "duration"];
        for (const key of keys) {
          if (!(key in entry)) continue;
          let v = entry[key];
          if (typeof v === "string") v = parseFloat(v);
          if (typeof v === "number" && isFinite(v) && v >= 0) return v;
        }
        return 0;
      }

      function getDisplayName(entry, fallback) {
        if (entry && typeof entry.tag === "string" && entry.tag.trim() !== "") return entry.tag;
        if (entry && typeof entry.name === "string" && entry.name.trim() !== "") return entry.name;
        return fallback;
      }

      const pageSize = 10;
      let currentPage = 0;

      const myIndex = list.findIndex(entryMatchesUser);
      if (myIndex >= 0) {
        currentPage = Math.floor(myIndex / pageSize);
      }

      function renderPage(pageIndex) {
        currentPage = Math.max(0, Math.min(pageIndex, Math.ceil(list.length / pageSize) - 1));

        const start = currentPage * pageSize;
        const end = Math.min(start + pageSize, list.length);
        const pageEntries = list.slice(start, end);

        const itemsHtml = pageEntries.map((entry, idx) => {
          const rank = start + idx + 1;
          const name = getDisplayName(entry, `Player ${rank}`);
          const score = Math.floor(getScore(entry));
          const time = formatLeaderboardTime(getTime(entry));
          const isMe = entryMatchesUser(entry);

          return `
            <li${isMe ? ' style="color:#bef264;"' : ""}>
              <strong>#${rank}</strong>
              ${isMe ? "⭐ " : ""}
              ${name} · ${time} · ${score} score
            </li>
          `;
        }).join("");

        content.innerHTML = `
          <div class="frog-panel-section-label">Global Leaderboard</div>
          <div style="font-size:12px; color:#d6d3d1; margin-bottom:8px;">
            ${LEADERBOARD_RESET_NOTE}
          </div>
          <ul class="frog-panel-list">
            ${itemsHtml}
          </ul>

          <div class="frog-panel-footer">
            <div style="margin-bottom:8px;">
              Showing ${start + 1}-${end} of ${list.length}
            </div>
            <div style="display:flex; gap:8px; justify-content:center;">
              <button
                id="leaderboardPrevBtn"
                class="frog-btn frog-btn-secondary"
                style="width:auto; margin-bottom:0;"
                ${currentPage === 0 ? "disabled" : ""}
              >
                Prev
              </button>
              <button
                id="leaderboardNextBtn"
                class="frog-btn frog-btn-secondary"
                style="width:auto; margin-bottom:0;"
                ${end >= list.length ? "disabled" : ""}
              >
                Next
              </button>
            </div>
          </div>
        `;

        const prevBtn = document.getElementById("leaderboardPrevBtn");
        const nextBtn = document.getElementById("leaderboardNextBtn");

        if (prevBtn) {
          prevBtn.addEventListener("click", () => renderPage(currentPage - 1));
        }
        if (nextBtn) {
          nextBtn.addEventListener("click", () => renderPage(currentPage + 1));
        }
      }

      renderPage(currentPage);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
      content.innerHTML = `
        <div class="frog-panel-section-label">Leaderboard</div>
        <ul class="frog-panel-list">
          <li>Failed to load leaderboard.</li>
        </ul>
      `;
    }

    openAnimatedOverlay(leaderboardOverlay);
  }

  function hideLeaderboardOverlay() {
    if (leaderboardOverlay) {
      closeAnimatedOverlay(leaderboardOverlay);
    }
  }

async function showDashboardOverlay() {
  if (!dashboardOverlay) initDashboardOverlay();
  if (!dashboardOverlay) return;

  const content = document.getElementById("dashboardContent");
  if (!content) return;

  openAnimatedOverlay(dashboardOverlay);
  content.innerHTML = '<div class="leaderboard-loading">Loading dashboard…</div>';

  const localStats = loadDashboardStats();
  const dashboardPfp = getDashboardPfp();
  const currentTag =
    (typeof getSavedPlayerTag === "function" && getSavedPlayerTag()) ||
    (LMod && typeof LMod.getCurrentUserLabel === "function" && LMod.getCurrentUserLabel()) ||
    getSavedDashboardTag() ||
    "";

  const leaderboardBest = await getMyDashboardBestFromLeaderboard();
  const leaderboardEntries = await fetchLeaderboard();
  const topTenLeaderboard = Array.isArray(leaderboardEntries)
    ? leaderboardEntries.slice(0, 10)
    : [];

  const normalizedCurrentTag =
    typeof currentTag === "string" ? currentTag.trim().toLowerCase() : "";

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

  const leaderboardTopHtml = topTenLeaderboard.length
    ? `
      <div class="frog-panel-section-label">Top 10 Leaderboard</div>
      <ul class="frog-panel-list">
        ${topTenLeaderboard.map((entry, i) => {
          const name =
            (entry && typeof entry.tag === "string" && entry.tag.trim() !== "")
              ? entry.tag
              : (entry && typeof entry.name === "string" && entry.name.trim() !== "")
                ? entry.name
                : `Player ${i + 1}`;

          const score = Math.floor(Number(entry?.bestScore ?? entry?.score ?? 0));
          const time = formatDashboardDuration(Number(entry?.bestTime ?? entry?.time ?? 0));

          const entryTag =
            typeof entry?.tag === "string"
              ? entry.tag.trim().toLowerCase()
              : typeof entry?.name === "string"
                ? entry.name.trim().toLowerCase()
                : "";

          const isMe =
            !!normalizedCurrentTag &&
            !!entryTag &&
            entryTag === normalizedCurrentTag;

          return `
            <li style="${
              isMe
                ? "color:#bef264; font-weight:700; background:rgba(190,242,100,0.08); border:1px solid rgba(190,242,100,0.35); padding:6px 8px; border-radius:8px;"
                : ""
            }">
              <strong>#${i + 1}</strong>
              ${isMe ? "⭐ " : ""}
              ${name} · ${score} score · ${time}
            </li>
          `;
        }).join("")}
      </ul>
    `
    : `
      <div class="frog-panel-section-label">Top 10 Leaderboard</div>
      <ul class="frog-panel-list">
        <li>No leaderboard entries yet.</li>
      </ul>
    `;

  content.innerHTML = `
    <div class="frog-panel-section-label">Player Profile</div>
    <div
      style="
        display:flex;
        align-items:center;
        gap:10px;
        margin-bottom:10px;
        padding:8px 10px;
        border:1px solid #44403c;
        border-radius:12px;
        background:#1c1917;
      "
    >
      <div
        style="
          position:relative;
          width:96px;
          height:96px;
          min-width:96px;
          border-radius:999px;
          overflow:hidden;
          border:0px solid #57534e;
          background:${dashboardPfp.bgColor};
        "
      >
        <img
          src="${dashboardPfp.spriteSrc}"
          alt=""
          style="
            position:absolute;
            inset:0;
            width:100%;
            height:100%;
            image-rendering:pixelated;
            z-index:1;
          "
        />
        <img
          src="${dashboardPfp.skinSrc}"
          alt=""
          style="
            position:absolute;
            inset:0;
            width:100%;
            height:100%;
            image-rendering:pixelated;
            z-index:2;
          "
        />
        ${dashboardPfp.eyesSrc ? `
          <img
            src="${dashboardPfp.eyesSrc}"
            alt=""
            style="
              position:absolute;
              inset:0;
              width:100%;
              height:100%;
              image-rendering:pixelated;
              z-index:3;
            "
          />
        ` : ""}
        ${dashboardPfp.hatSrc ? `
          <img
            src="${dashboardPfp.hatSrc}"
            alt=""
            style="
              position:absolute;
              inset:0;
              width:100%;
              height:100%;
              image-rendering:pixelated;
              z-index:4;
            "
          />
        ` : ""}
      </div>

      <div style="display:flex; flex-direction:column; gap:2px;">
        <div>
          <strong>Tag:</strong>
          <span class="stat-highlight" id="dashboardCurrentTag">${currentTag || "None"}</span>
        </div>
        <div>
          <strong>Level:</strong>
          <span class="stat-highlight">${levelData.level}</span>
        </div>
      </div>
    </div>

    <div style="margin-bottom:12px;">
      <div style="font-size:12px; color:#d6d3d1; margin-bottom:4px;">
        ${levelData.orbsNeededForNextLevel} orbs until level ${levelData.nextLevel}
      </div>
      <div
        style="
          width:100%;
          height:8px;
          background:#292524;
          border:1px solid #44403c;
          border-radius:999px;
          overflow:hidden;
        "
      >
        <div
          style="
            width:${levelData.progressPercent}%;
            height:100%;
            background:#65a30d;
            border-radius:999px;
          "
        ></div>
      </div>
    </div>

    <div style="margin-bottom:12px;">
      <input
        id="dashboardTagInput"
        type="text"
        maxlength="12"
        value="${String(currentTag).replace(/"/g, "&quot;")}"
        placeholder="Enter player tag"
        style="
          width:100%;
          box-sizing:border-box;
          padding:5px 8px;
          border-radius:6px;
          border:1px solid #44403c;
          background:#292524;
          color:white;
          font-family:inherit;
          font-size:12px;
          margin-bottom:6px;
        "
      />
      <button
        id="dashboardSaveTagBtn"
        class="frog-btn frog-btn-secondary"
        style="
          width:auto;
          padding:6px 10px;
          font-size:12px;
          margin-bottom:4px;
        "
      >
        Save Tag
      </button>
      <div id="dashboardTagMessage" style="font-size:12px; min-height:16px; color:#fca5a5;"></div>
    </div>

    <div class="frog-panel-section-label">Lifetime Stats</div>
    <ul class="frog-panel-list">
      <li>Total Orbs: <span class="stat-highlight">${localStats.totalOrbsCollected ?? 0}</span></li>
      ${localStats.totalRuns != null ? `<li>Total Runs: <span class="stat-highlight">${localStats.totalRuns}</span></li>` : ""}
      ${localStats.totalPlayTime != null ? `<li>Total Play Time: <span class="stat-highlight">${formatDashboardDuration(localStats.totalPlayTime)}</span></li>` : ""}
      ${localStats.totalFrogsLost != null ? `<li>Total Frogs Lost: <span class="stat-highlight">${localStats.totalFrogsLost}</span></li>` : ""}
      ${localStats.totalSnakesShed != null ? `<li>Total Snakes Shed: <span class="stat-highlight">${localStats.totalSnakesShed}</span></li>` : ""}
    </ul>

    <div class="frog-panel-section-label">Best Record</div>
    <ul class="frog-panel-list">
      <li>
        ${leaderboardBest.found
          ? `${bestRecordPrefix}${currentTag || "You"} · ${Math.floor(leaderboardBest.bestRun)} score · ${formatDashboardDuration(leaderboardBest.bestTime)}`
          : "No best record yet."
        }
      </li>
    </ul>

    ${latestRunHtml}

  `;

  const tagInput = document.getElementById("dashboardTagInput");
  const saveBtn = document.getElementById("dashboardSaveTagBtn");
  const msgEl = document.getElementById("dashboardTagMessage");
  const currentTagEl = document.getElementById("dashboardCurrentTag");

  if (saveBtn && tagInput) {
    saveBtn.addEventListener("click", async () => {
      const validation = validateDashboardTag(tagInput.value);

      if (!validation.ok) {
        if (msgEl) {
          msgEl.textContent = validation.message;
          msgEl.style.color = "#fca5a5";
        }
        return;
      }

      const newTag = validation.tag;
      await saveDashboardTag(newTag);

      if (currentTagEl) {
        currentTagEl.textContent = newTag;
      }

      if (msgEl) {
        msgEl.textContent = "Tag saved.";
        msgEl.style.color = "#bef264";
      }

      try {
        const bestScore =
          leaderboardBest && leaderboardBest.found ? leaderboardBest.bestRun : 0;
        const bestTime =
          leaderboardBest && leaderboardBest.found ? leaderboardBest.bestTime : 0;

        if (bestScore > 0 || bestTime > 0) {
          await submitScoreToServer(bestScore, bestTime, null, newTag);
        }

        const refreshed = await fetchLeaderboard();
        updateMiniLeaderboard(refreshed);
      } catch (e) {
        // ignore
      }
    });
  }
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
      playButtonClick();
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
      playButtonClick();
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
      playButtonClick();
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
          const tagBase = entry.tag || entry.name || `Player ${rank}`;

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
  ⭐ <b>PermaFrog</b> – upgrades one frog with a permanent role (Champion, Aura, Magnet, Lucky, Zombie, etc.).
  `;
    } else if (infoPage === 3) {
      // PAGE 3 – Permanent frog roles
      html = `
  <b>🐸 Permanent Frog Roles</b><br><br>
  🏅 <b>Champion</b> – that frog's hop cycle is faster and jumps are higher.<br>
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
  }

  function selectUpgrade(choice) {
    if (!choice) return;
    playButtonClick();

    try {
      if (choice && choice.opensRoleDraft) {
        choice.apply();
        return;
      }

      if (typeof choice.apply === "function") {
        choice.apply();
      }
    } catch (e) {
      console.error("Error applying upgrade:", e);
    }

    playPermanentChoiceSound();
    closeUpgradeOverlay();
  }

  function populateUpgradeOverlayChoices(mode) {
    initUpgradeOverlay();
    const containerEl = upgradeOverlayButtonsContainer;
    if (!containerEl) return;

    currentUpgradeOverlayMode = mode || "normal";
    const isEpic      = currentUpgradeOverlayMode === "epic";
    const isLegendary = currentUpgradeOverlayMode === "legendary";

    containerEl.innerHTML = "";
    const neon = "#4defff";

    if (upgradeOverlayTitleEl) {
      upgradeOverlayTitleEl.textContent = "Choose an upgrade";
    }

    let choices = [];

    if (isEpic) {
      // 🔥 EPIC: pick a random 3 from the full epic pool
      let pool = getEpicUpgradeChoices().slice();
      while (choices.length < 3 && pool.length) {
        const idx = Math.floor(Math.random() * pool.length);
        choices.push(pool.splice(idx, 1)[0]);
      }
    } else if (isLegendary && typeof getLegendaryUpgradeChoices === "function") {
      choices = getLegendaryUpgradeChoices().slice();
    } else {
      // 🟢 NORMAL per-minute upgrades
      let pool = getUpgradeChoices().slice();

      // Starting pre-game upgrade: optionally filter stuff out here
      if (!initialUpgradeDone) {
        pool = pool.filter(c => c.id !== "permaLifeSteal"); // safe even if commented out
      }

      const isFirstTimedNormal = initialUpgradeDone && !firstTimedNormalChoiceDone;

      if (isFirstTimedNormal) {
        firstTimedNormalChoiceDone = true;

        // Only guarantee Spawn if we actually have room for more frogs
        if (frogs.length < maxFrogsCap) {
          // ✅ Guarantee spawn20 is in the options
          let spawnChoiceIndex = pool.findIndex(c => c.id === "spawn20");
          let spawnChoice;

          if (spawnChoiceIndex !== -1) {
            // Take the existing spawn20 entry out of the pool
            spawnChoice = pool.splice(spawnChoiceIndex, 1)[0];
          } else {
            // Fallback: recreate the spawn20 choice if it somehow went missing
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

          // Always include spawn frogs as one of the three options
          choices.push(spawnChoice);

          // Fill remaining slots randomly until we have 3 total
          while (choices.length < 3 && pool.length) {
            const idx = Math.floor(Math.random() * pool.length);
            choices.push(pool.splice(idx, 1)[0]);
          }
        } else {
          // At frog cap: just pick any 3 normal upgrades at random
          while (choices.length < 3 && pool.length) {
            const idx = Math.floor(Math.random() * pool.length);
            choices.push(pool.splice(idx, 1)[0]);
          }
        }
      } else {
        // All other common upgrades: just pick any 3 at random
        while (choices.length < 3 && pool.length) {
          const idx = Math.floor(Math.random() * pool.length);
          choices.push(pool.splice(idx, 1)[0]);
        }
      }
    }

    currentUpgradeChoices = choices.slice();

    if (!choices.length) {
      const span = document.createElement("div");
      span.textContent = "No upgrades available.";
      span.style.fontSize = "13px";
      containerEl.appendChild(span);
      return;
    }

    choices.slice(0, 3).forEach((choice, index) => {
      const btn = document.createElement("button");
      const colorClass = getUpgradeColorClass(choice.id);

      btn.className = "frog-btn frog-upgrade-choice is-spawning " + colorClass;
      btn.dataset.upgradeId = choice.id;
      btn.style.animationDelay = `${index * 70}ms`;

      const rawLabel = String(choice.label || "");
      const parts = rawLabel.split("<br>");
      const titleHtml = parts.shift() || "";
      const descHtml = parts.join("<br>");

      btn.innerHTML = `
        <div class="frog-upgrade-title">${titleHtml}</div>
        <div class="frog-upgrade-desc">${descHtml}</div>
      `;

      btn.addEventListener("click", () => selectUpgrade(choice));
      containerEl.appendChild(btn);

      setTimeout(() => {
        btn.classList.remove("is-spawning");
      }, 320);
    });
  }

  function updateUpgradeBuffSummary() {
    const listEl = document.getElementById("currentUpgradeList");
    if (!upgradeOverlay || !listEl) return;

    const speedTotalPct = Math.round((1 - frogPermanentSpeedFactor) * 100);
    const jumpTotalPct  = Math.round((frogPermanentJumpFactor - 1) * 100);
    const buffTotalPct  = Math.round((buffDurationFactor - 1) * 100);
    const orbTotalPct   = Math.round((1 - orbSpawnIntervalFactor) * 100);
    const drTotalPct    = Math.round((frogDeathRattleChance || 0) * 100);
    const orbCollectPct = Math.round((orbCollectorChance || 0) * 100);
    const orbLingerPct  = Math.round((orbTtlFactor - 1) * 100);

    const roleCounts = {
      champion: 0,
      aura: 0,
      magnet: 0,
      lucky: 0,
      zombie: 0
    };

    for (const frog of frogs) {
      if (frog.isChampion) roleCounts.champion++;
      if (frog.isAura)     roleCounts.aura++;
      if (frog.isMagnet)   roleCounts.magnet++;
      if (frog.isLucky)    roleCounts.lucky++;
      if (frog.isZombie)   roleCounts.zombie++;
    }

    const items = [];

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
        `<strong>Ouroboros Pact:</strong> ${statHighlight("10%")} of dead frogs drop an orb`
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
    initUpgradeOverlay();
    upgradeOverlayContext = opts.context || "mid";

    if (upgradeOverlaySubEl) {
      if (upgradeOverlayContext === "start") {
        upgradeOverlaySubEl.textContent = "Pick your first upgrade before the run begins.";
      } else {
        upgradeOverlaySubEl.textContent = "";
      }
    }

    populateUpgradeOverlayChoices(mode);
    updateUpgradeBuffSummary();

    gamePaused = true;
    if (upgradeOverlay) {
      openAnimatedOverlay(upgradeOverlay);
    }
  }

  function openFirstUpgradeSelection() {
    openUpgradeOverlay("normal", { context: "start" });
  }

  function startNewRun() {
    clearScissorsAndOldSnakeState();
    hideMainMenu();
    stopMainMenuBackground();
    seedMatchGrass();
    setInGameUIVisible(true);
    restartGame();
    syncAudioMuteState();
    openFirstUpgradeSelection();
  }

  function startRunFromMenu() {
    startNewRun();
  }

  function triggerLegendaryFrenzy() {
    // 13-second Frenzy: snake faster + frogs panic hop randomly
    snakeFrenzyTime = 13;
    panicHopTime = Math.max(panicHopTime, 13);
    setSnakeFrenzyVisual(true);
  }

  function closeUpgradeOverlay() {
    const shouldOpenEpicNow =
      epicChainPending && currentUpgradeOverlayMode === "normal";

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
      openUpgradeOverlay("epic");
      return;
    }

    if (upgradeOverlay) {
      closeAnimatedOverlay(upgradeOverlay);
    }
    gamePaused = false;

    // schedule next timers
    if (!initialUpgradeDone && currentUpgradeOverlayMode === "normal") {
      initialUpgradeDone = true;
      nextPermanentChoiceTime = elapsedTime + 60;
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

  function endGame() {
    clearScissorsAndOldSnakeState();
    gameOver = true;

    lastRunTime  = elapsedTime;
    lastRunScore = score;

    latestCompletedRun = {
      score: Math.floor(Number(lastRunScore) || 0),
      time: Number(lastRunTime) || 0,
      orbs: Number(totalOrbsCollected) || 0,
      frogsLost: Math.max(0, Number(totalFrogsSpawned) || 0)
    };

    recordRunToDashboard();

    const finalStats = {
      // Core run results
      score: lastRunScore,
      timeSeconds: lastRunTime,
  
      // Live buff values at the end of the run
      deathrattleChance: frogDeathRattleChance,
      frogSpeedFactor: frogPermanentSpeedFactor,
      frogJumpFactor: frogPermanentJumpFactor,
      buffDurationFactor,
      orbSpawnIntervalFactor,
      orbCollectorChance,
      orbSpecialistActive,
  
      // Totals for this run
      totalFrogsSpawned,
      //totalOrbsSpawned,
      //totalOrbsCollected,
      //totalGhostFrogsSpawned,
      //totalCannibalEvents,
    };

    // Grab whatever tag the user has already saved (if any)
    const playerTag = getSavedPlayerTag();
  
    (async () => {
      const posted  = await submitScoreToServer(
        lastRunScore,
        lastRunTime,
        finalStats,
        playerTag
      );
      const rawList = posted || (await fetchLeaderboard()) || [];
      const topList = rawList.slice(0, 100);

      updateMiniLeaderboard(topList);
      hideGameOver();
      showDashboardOverlay();
    })();
  
    showGameOver();
  }

  function restartGame() {
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


    // Reset game state
    elapsedTime     = 0;
    lastTime        = 0;
    gameOver        = false;
    gamePaused      = false;
    score           = 0;
    frogsEatenCount = 0;
    nextOrbTime     = 0;
    mouse.follow    = false;
    latestCompletedRun = null;

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
    swarmDivideActive = false;
    swarmDivideUsed = false;
    graveWaveActive = false;
    graveWaveUsed = false;

    permanentScoreMultiplier = 1.0;
    quantumOrbsActive = false;
    moltFortuneActive = false;
    toxicBloodActive = false;
    survivalInstinctActive = false;

    pairOfScissorsUsed = false;
    orbCollectorActive       = false;
    orbCollectorChance       = 0;
    lastStandActive          = false;
    frogDeathOrbChance       = 0;
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

    createInitialFrogs(width, height).then(() => {});
    initSnake(width, height);

    setNextOrbTime();
    updateStatsPanel();
    updateHUD();

    animId = requestAnimationFrame(drawFrame);
  }

  function setNextOrbTime() {
    const min = ORB_SPAWN_INTERVAL_MIN * orbSpawnIntervalFactor;
    const max = ORB_SPAWN_INTERVAL_MAX * orbSpawnIntervalFactor;
    // countdown in seconds until next orb
    nextOrbTime = randRange(min, max);
  }


  // --------------------------------------------------
  // GAME LOOP
  // --------------------------------------------------
  function drawFrame(time) {
    const width  = window.innerWidth;
    const height = window.innerHeight;

    if (!lastTime) lastTime = time;
    let dt = (time - lastTime) / 1000;
    lastTime = time;

    // Clamp crazy tab-switch jumps so nothing explodes
    if (dt > 0.1) dt = 0.1;

    if (!gameOver && !gamePaused) {
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
        // 3   = final shed for the current primary + spawn a new snake
        const cycleIndex = ((snakeShedCount - 1) % 3) + 1;

        if (cycleIndex <= 2) {
          const stage = cycleIndex; // 1 or 2
          snakeShed(stage);
        } else {
          // Third shed interval: finish the primary snake's final shed,
          // then also spawn a new snake for multi-snake gameplay.
          snakeShed(3);
          handleFourthShed();
        }

        nextShedTime += SHED_INTERVAL;
      }

      // ----- UPGRADE TIMING (don’t open new menu if one is already open) -----
      const overlayOpen =
        upgradeOverlay && upgradeOverlay.style.display !== "none";

      if (!overlayOpen) {
        // Epic chain: normal -> epic back-to-back at epic marks
        if (elapsedTime >= nextEpicChoiceTime &&
                 elapsedTime >= nextPermanentChoiceTime) {
          epicChainPending = true;
          openUpgradeOverlay("normal"); // epic half handled in closeUpgradeOverlay
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
    }

    updateHUD();
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
