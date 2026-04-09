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
    levelRequired: 3,
    emoji: "🐇",
    name: "Quick Reflexes",
    desc: "Frogs start 10% faster"
  },
  {
    id: "insurance",
    levelRequired: 5,
    emoji: "💀",
    name: "Insurance",
    desc: "Start with 5% deathrattle chance"
  },
  {
    id: "stormFront",
    levelRequired: 7,
    emoji: "🌩️",
    name: "Storm Front",
    desc: "Start with Orb Storm already triggered"
  },
  {
    id: "evolved",
    levelRequired: 10,
    emoji: "⚗️",
    name: "Evolved",
    desc: "Start with 1–5 frogs of one random role"
  },
  {
    id: "luckyStart",
    levelRequired: 13,
    emoji: "🍀",
    name: "Lucky Start",
    desc: "Start with +5 luck"
  },
  {
    id: "orbSpecialistStart",
    levelRequired: 16,
    emoji: "🧪",
    name: "Orb Specialist",
    desc: "First 15 collected orbs each spawn 1 extra frog"
  },
  {
    id: "lastStandStart",
    levelRequired: 20,
    emoji: "🏹",
    name: "Last Stand",
    desc: "Start with Last Stand already active"
  },
  {
    id: "doubleYolkerStart",
    levelRequired: 25,
    emoji: "🥚",
    name: "Double Yolker",
    desc: "Start the run with Double Yolker active"
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
      const roleIds = ["champion", "aura", "magnet", "lucky", "zombie"];
      const chosenRole = roleIds[Math.floor(Math.random() * roleIds.length)];
      const count = randInt(1, 5);

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
    orbsNeededForNextLevel,
    nextLevel: level + 1
  };
}

function generateLocalTag() {
    const first = [
      "Amber","Arcane","Bloom","Cloud","Clover","Crimson","Echo","Ember",
      "Frost","Golden","Jade","Lucky","Lunar","Mint","Mossy","Neon",
      "Nova","Pixel","Rune","Shadow","Silver","Sleepy","Solar","Storm","Swampy"
    ];
    const second = [
      "Bog","Croak","Drift","Fern","Flip","Frog","Glow","Hop",
      "Jumper","Lily","Marsh","Pond","Prince","Ripple","Scout",
      "Skipper","Sprite","Tadpole","Toad","Traveler"
    ];
    const num = Math.floor(100 + Math.random() * 900);
    const tag = first[Math.floor(Math.random() * first.length)] +
                second[Math.floor(Math.random() * second.length)] +
                num;
    return tag;
  }

  function getSavedDashboardTag() {
    // Delegate to the single canonical getter so there is one source of truth.
    return getSavedPlayerTag();
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
      sheds: Number(snakeShedCount) || 0,
      at: Date.now(),
      isLatest: true
    });

    stats.recentRuns = stats.recentRuns.slice(0, 5);

    saveDashboardStats(stats);

    // Also push to global recent-runs feed on the server
    submitRecentRun({
      tag:       getSavedPlayerTag ? getSavedPlayerTag() : null,
      score:     runScore,
      time:      runTime,
      orbs:      runOrbs,
      frogsLost: frogsLostThisRun,
      sheds:     snakeShedCount,
    });
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

    if (tag.length < 2 || tag.length > 20) {
      return { ok: false, message: "Tag must be 2-20 characters." };
    }

    if (!/^[a-zA-Z0-9 _-]{2,20}$/.test(tag)) {
      return {
        ok: false,
        message: "Use letters, numbers, spaces, _ or - only."
      };
    }

    if (
      window.FrogGameLeaderboard &&
      typeof window.FrogGameLeaderboard.isProfaneTag === "function" &&
      window.FrogGameLeaderboard.isProfaneTag(tag)
    ) {
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
   * Always returns a tag string.
   * On first visit a random tag is generated and persisted so the player
   * always has an identity before they choose a custom one.
   * Existing saved tags are never modified.
   */
  function getSavedPlayerTag() {
    try {
      if (typeof localStorage === "undefined") return generateLocalTag();
      const val = localStorage.getItem(TAG_STORAGE_KEY);
      if (val && String(val).trim() !== "") {
        return String(val).trim();
      }
      // First visit — generate and persist a random tag
      const newTag = generateLocalTag();
      localStorage.setItem(TAG_STORAGE_KEY, newTag);
      return newTag;
    } catch (e) {
      return generateLocalTag();
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
let chainReactionActive = false;
let nightBloomActive = false;
let luckStat = 0;
const MAX_LUCK = 30;
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
    btnEnd.onclick = (ev) => {
      ev.stopPropagation();
      if (soundEnabled) playButtonClick();
      if (!gameOver) {
        endGame();
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
function initEndGameSummaryOverlay() {
  if (endGameSummaryOverlay) return;

  endGameSummaryOverlay = document.createElement("div");
  endGameSummaryOverlay.id = "endGameSummaryOverlay";
  endGameSummaryOverlay.className = "frog-overlay";
  endGameSummaryOverlay.style.zIndex = "1400";
  endGameSummaryOverlay.style.background = "rgba(0,0,0,0.18)";
  endGameSummaryOverlay.innerHTML = `
    <div class="frog-panel">
      <div class="frog-panel-title">
        Run Summary
        <span class="emoji">📋</span>
      </div>

      <div id="endGameSummaryContent"></div>

      <div class="frog-panel-footer">
        <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
          <button id="endSummaryDashboardBtn" class="frog-btn frog-btn-primary" style="width:auto; min-width:140px; margin-bottom:0;">
            Open Dashboard
          </button>
          <button id="endSummaryPlayAgainBtn" class="frog-btn frog-btn-secondary" style="width:auto; min-width:140px; margin-bottom:0;">
            Play Again
          </button>
          <button id="endSummaryMenuBtn" class="frog-btn frog-btn-secondary" style="width:auto; min-width:140px; margin-bottom:0;">
            Main Menu
          </button>
        </div>
      </div>
    </div>
  `;

  endGameSummaryOverlay.addEventListener("click", (e) => {
    if (e.target === endGameSummaryOverlay) {
      hideEndGameSummaryOverlay();
    }
  });

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

function showEndGameSummaryOverlay(cachedLeaderboard) {
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

  const lbRowsHtml = previewList.map((entry, i) => {
    const rank = rankIdx >= previewCount && i === previewCount - 1
      ? rankIdx + 1
      : i + 1;
    const name = (typeof entry?.tag === "string" && entry.tag) ||
                 (typeof entry?.name === "string" && entry.name) ||
                 `Player ${rank}`;
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
        <span style="flex:1;font-weight:bold;">${isMe ? "⭐ " : ""}${name}</span>
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
    <div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #292524;margin-bottom:14px;">
      <div style="padding:0 14px 14px 0;border-right:1px solid #292524;display:flex;flex-direction:column;justify-content:center;text-align:center;">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#a3e635;margin-bottom:6px;">Score</div>
        <div style="font-size:34px;font-weight:bold;color:white;line-height:1;">${Math.floor(run.score || 0).toLocaleString()}</div>
      </div>
      <div style="padding:0 0 14px 14px;display:flex;flex-direction:column;justify-content:center;gap:5px;">
        <div style="font-size:12px;color:#f5f5f4;">Time <strong>${formatLeaderboardTime(run.time || 0)}</strong></div>
        <div style="font-size:12px;color:#f5f5f4;">Orbs <strong>${run.orbs || 0}</strong></div>
        <div style="font-size:12px;color:#f5f5f4;">Frogs lost <strong>${run.frogsLost || 0}</strong></div>
        <div style="font-size:12px;color:#f5f5f4;">Sheds <strong>${run.sheds || 0}</strong></div>
      </div>
    </div>

    <div class="frog-panel-section-label" style="margin-top:0;">Leaderboard</div>
    <ul class="frog-panel-list" style="margin-bottom:0;">
      ${list.length
        ? previewList.map((entry, i) => {
            const rank = rankIdx >= previewCount && i === previewCount - 1 ? rankIdx + 1 : i + 1;
            const name = (typeof entry?.tag === "string" && entry.tag) || (typeof entry?.name === "string" && entry.name) || `Player ${rank}`;
            const entryScore = Math.floor(Number(entry?.bestScore ?? entry?.score ?? 0)).toLocaleString();
            const entryTime = formatLeaderboardTime(Number(entry?.bestTime ?? entry?.time ?? 0));
            const isMe = myEntry && entry && myEntry.userId && entry.userId === myEntry.userId
              ? true
              : activePlayerTag && typeof entry?.tag === "string" && entry.tag.trim().toLowerCase() === activePlayerTag.trim().toLowerCase();
            return `<li${isMe ? ' style="color:#bef264;"' : ""}><strong>#${rank}</strong> ${isMe ? "⭐ " : ""}${name} · ${entryTime} · ${entryScore} score</li>`;
          }).join("")
        : '<li style="color:#a8a29e;">No entries yet.</li>'
      }
    </ul>

    <div class="frog-panel-section-label" style="margin-top:14px;">Leaderboard Tag</div>
    <div style="display:flex;gap:6px;margin-bottom:5px;">
      <input
        id="endSummaryTagInput"
        type="text"
        maxlength="20"
        value="${String(currentTag).replace(/"/g, "&quot;")}"
        placeholder="Enter player tag"
        style="flex:1;padding:6px 9px;border-radius:8px;border:1px solid #44403c;background:#292524;color:white;font-family:inherit;font-size:12px;"
      />
      <button id="endSummaryTagSaveBtn" class="frog-btn frog-btn-secondary" style="width:auto;padding:6px 14px;margin:0;font-size:12px;white-space:nowrap;">Save</button>
    </div>
    <div id="endSummaryTagMsg" style="font-size:11px;min-height:16px;margin-bottom:2px;"></div>
  `;

  openAnimatedOverlay(endGameSummaryOverlay);

  const tagInput = document.getElementById("endSummaryTagInput");
  const tagSaveBtn = document.getElementById("endSummaryTagSaveBtn");
  const tagMsg = document.getElementById("endSummaryTagMsg");

  if (tagSaveBtn && tagInput) {
    tagSaveBtn.addEventListener("click", async () => {
      const validation = validateDashboardTag(tagInput.value);
      if (!validation.ok) {
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
        if (result && result._error) {
          const msg = result.error === "tag_taken"
            ? "That tag is already taken — try another."
            : (result.message || "Could not save tag. Try again.");
          if (tagMsg) { tagMsg.textContent = msg; tagMsg.style.color = "#fca5a5"; }
          return;
        }
        await saveDashboardTag(newTag);
        activePlayerTag = newTag;
        if (myEntry) myEntry.tag = newTag;
        if (tagMsg) { tagMsg.textContent = "Tag saved!"; tagMsg.style.color = "#a3e635"; }
        const refreshed = await fetchLeaderboard();
        updateMiniLeaderboard(refreshed);
      } catch (e) {
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

function getLuckChanceBonus(multiplier = 1) {
  // each 1 luck = +0.5% absolute chance
  return luckStat * 0.005 * multiplier;
}

function getLuckBoostedChance(baseChance, maxChance = 0.95, multiplier = 1) {
  return Math.max(0, Math.min(maxChance, baseChance + getLuckChanceBonus(multiplier)));
}

function getLuckBiasedInt(min, max) {
  if (max <= min) return min;

  const span = max - min;
  const luckWeight = Math.min(0.75, luckStat / MAX_LUCK * 0.75);

  const roll = Math.random();
  const biased = roll * (1 - luckWeight) + (1 - Math.random()) * luckWeight;

  return min + Math.round(biased * span);
}
const SNAKE_SKIN_STORAGE_KEY = "frogSnake_selectedSnakeSkin";

  const SNAKE_SKINS = [
    {
      id: "default",
      label: "Classic",
      head: "./images/head.png",
      body: "./images/body.png",
      tail: "./images/tail.png",
      requiredLevel: 1
    },
    {
      id: "alt",
      label: "Serpent",
      head: "./images/head2.png",
      body: "./images/body2.png",
      tail: "./images/tail2.png",
      requiredLevel: 5
    },
    {
      id: "alt2",
      label: "Shadow",
      head: "./images/head3.png",
      body: "./images/body3.png",
      tail: "./images/tail3.png",
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

    if (graveWaveActive) {
      spawnExtraFrogs(getLuckBiasedInt(10, 15));
    }

    if (moltFortuneActive) {
      const orbCount = getLuckBiasedInt(5, 10);
      for (let i = 0; i < orbCount; i++) {
        spawnOrbRandom(width, height);
      }
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
    idleMin = 1.4; idleMax = 3.2;
    hopMin = 0.35; hopMax = 0.7;
    heightMin = 10; heightMax = 24;
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

  if (!speedCanImprove) {
    return null;
  }

  return {
    id: "mutation",
    label: `
      🧬 Mutation<br>
      +<span style="color:${TOTAL_HIGHLIGHT_COLOR};">15%</span> jump speed
      & +<span style="color:${TOTAL_HIGHLIGHT_COLOR};">15%</span> jump height
    `,
    apply: () => {
      applyMutationUpgrade();
    }
  };
}
function applyMutationUpgrade() {
  frogPermanentSpeedFactor *= 0.85; // 15% faster hops
  if (frogPermanentSpeedFactor < MIN_FROG_SPEED_FACTOR) {
    frogPermanentSpeedFactor = MIN_FROG_SPEED_FACTOR;
  }

  frogPermanentJumpFactor *= 1.15; // 15% higher jumps
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

function getRandomTriggeredOrbBuffType() {
  const pool = [
    "speed",
    "jump",
    "spawn",
    "snakeSlow",
    "snakeConfuse",
    "snakeShrink",
    "frogShield",
    "timeSlow",
    "orbMagnet",
    "megaSpawn",
    "scoreMulti",
    "panicHop",
    "cloneSwarm",
    "lifeSteal"
  ];

  return pool[Math.floor(Math.random() * pool.length)];
}

function triggerLuckyRoll() {
  const buffType = getRandomTriggeredOrbBuffType();
  applyBuff(buffType, null, 1.5 * getLuckBuffDurationMultiplier());
}

function promoteAllFrogs() {
  for (const frog of frogs) {
    grantStarUpgrade(frog);
  }
}

function triggerChainReactionBonus(frog) {
  const buffType = getRandomTriggeredOrbBuffType();
  applyBuff(buffType, frog, getLuckBuffDurationMultiplier());
}

function spawnTidalWave() {
  const alive = frogs.length;
  const room = Math.max(0, maxFrogsCap - frogs.length);
  if (room <= 0 || alive <= 0) return;
  spawnExtraFrogs(Math.min(alive, room));
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

    if (frogDeathOrbChance > 0 && Math.random() < getLuckBoostedChance(frogDeathOrbChance, 0.60)) {
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
    const isLuckyCollector = frog && frog.isLucky;
    const durBoost = isLuckyCollector
      ? LUCKY_BUFF_DURATION_BOOST
      : 1.0;

    const durationScale =
      buffDurationFactor *
      durationMultiplier *
      durBoost *
      getLuckBuffDurationMultiplier();

    switch (type) {
      case "speed":
        speedBuffTime = SPEED_BUFF_DURATION * durationScale;
        break;

      case "jump":
        jumpBuffTime = JUMP_BUFF_DURATION * durationScale;
        break;

      case "spawn": {
        const base = getLuckBiasedInt(1, 10);
        const bonus = isLuckyCollector ? getLuckBiasedInt(1, 4) : 0;
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
        const base = getLuckBiasedInt(10, 20);
        const bonus = isLuckyCollector ? getLuckBiasedInt(3, 8) : 0;
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

      if (!quantumOrbsActive) {
        orb.ttl -= dt;
      }

      if (orb.ttl <= 0 || !orb.el) {
        if (nightBloomActive && frogs.length < maxFrogsCap && Math.random() < getLuckBoostedChance(0.50, 0.80)) {
          const spawnX = Math.max(8, Math.min(window.innerWidth - FROG_SIZE - 8, orb.x - FROG_SIZE / 2));
          const spawnY = Math.max(24, Math.min(window.innerHeight - FROG_SIZE - 24, orb.y - FROG_SIZE / 2));
          createFrogAt(spawnX, spawnY, null);
        }

        if (orb.el && orb.el.parentNode === container) {
          container.removeChild(orb.el);
        }
        orbs.splice(i, 1);
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
          grantStarUpgrade(collectedBy);
        } else {
          applyBuff(orb.type, collectedBy);

          if (chainReactionActive && Math.random() < getLuckBoostedChance(0.25, 0.50)) {
            triggerChainReactionBonus(collectedBy);
          }
        }

        let frogsToSpawnFromOrb = 0;

        if (orbSpecialistActive) {
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

    if (!isMainMenu && snakeObj === snake && snakeEatingOldBody && scissorsRemnantSegments.length > 0) {
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
      if (snakeOldBodyChaseTime > 12.0) {
        snakeEatingOldBody = false;
        snakeLastRemnantTarget = null;
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
    if (snakeConfuseTime > 0) {
      desiredAngle = head.angle + (Math.random() - 0.5) * Math.PI;
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

    // 3. PATH & BODY POSITIONING
    snakeObj.path.unshift({ x: head.x, y: head.y });

    const minPathPoints = snakeObj.segments.length * SEGMENT_VISUAL_SPACING * 2 + 64;
    if (snakeObj.path.length > minPathPoints) {
      snakeObj.path.length = minPathPoints;
    }

    head.el.style.transform =
      `translate3d(${head.x}px, ${head.y}px, 0) rotate(${head.angle}rad) scale(${shrinkScale})`;

    // IMPORTANT FIX:
    // each segment uses cumulative distance from head, not the broken nextStart reuse
    for (let i = 0; i < snakeObj.segments.length; i++) {
      const targetDist = SEGMENT_VISUAL_SPACING * (i + 1);
      const result = samplePathAtDistance(snakeObj.path, 0, targetDist);

      const seg = snakeObj.segments[i];
      seg.x = result.x;
      seg.y = result.y;

      let angle = 0;
      if (result.nextStart + 1 < snakeObj.path.length) {
        const px = snakeObj.path[result.nextStart].x;
        const py = snakeObj.path[result.nextStart].y;
        const nx = snakeObj.path[result.nextStart + 1].x;
        const ny = snakeObj.path[result.nextStart + 1].y;
        angle = Math.atan2(ny - py, nx - px);
      }

      seg.el.style.transform =
        `translate3d(${seg.x}px, ${seg.y}px, 0) rotate(${angle}rad) scale(${shrinkScale})`;
    }

    // 4. COLLISIONS
    const headCx = head.x + SNAKE_SEGMENT_SIZE / 2;
    const headCy = head.y + SNAKE_SEGMENT_SIZE / 2;
    const eatR2 = Math.pow(getSnakeEatRadius(), 2);

    for (let i = frogList.length - 1; i >= 0; i--) {
      const f = frogList[i];
      const dx = (f.x + FROG_SIZE / 2) - headCx;
      const dy = (f.baseY + FROG_SIZE / 2) - headCy;
      if (dx * dx + dy * dy <= eatR2) {
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

    if (snakeEatingOldBody && snakeObj === snake && scissorsRemnantSegments.length > 0) {
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
    const neon = "#4defff";
    const deathPerPickPct = Math.round(COMMON_DEATHRATTLE_CHANCE * 100);

    const upgrades = [];

    upgrades.push({
      id: "roleDraft",
      label: `🎭 Role Draft<br>Choose between <span style="color:${neon};">2</span> random frog roles`,
      opensRoleDraft: true,
      apply: () => {
        roleDraftUsed = true;
        showRoleDraftOverlayChoices();
      }
    });

    if (!doubleYolkerActive) {
      upgrades.push({
        id: "doubleYolker",
        label: `🥚 Double Yolker<br>Orbs have a <span style="color:${neon};">15%</span> chance to spawn <span style="color:${neon};">2</span> frogs`,
        apply: () => { doubleYolkerActive = true; }
      });
    }

    if (frogs.length < maxFrogsCap) {
      upgrades.push({
        id: "spawn20",
        label: `🐸 Spawn frogs<br><span style="color:${neon};">${NORMAL_SPAWN_AMOUNT}</span> frogs right now`,
        apply: () => { spawnExtraFrogs(NORMAL_SPAWN_AMOUNT); }
      });
    }

    if (orbSpawnIntervalFactor > minOrbSpawnIntervalFactor + 1e-4) {
      upgrades.push({
        id: "epicMoreOrbs",
        label: `🎯 Orb Flow<br>Increase orb spawn rate by <span style="color:${neon};">10%</span>`,
        apply: () => {
          orbSpawnIntervalFactor *= ORB_INTERVAL_UPGRADE_FACTOR;
          if (orbSpawnIntervalFactor < minOrbSpawnIntervalFactor) {
            orbSpawnIntervalFactor = minOrbSpawnIntervalFactor;
          }
        }
      });
    }

    upgrades.push({
      id: "luckyRoll",
      label: `🎲 Lucky Roll<br>Trigger a random orb buff at <span style="color:${neon};">1.5x</span> duration`,
      apply: () => { triggerLuckyRoll(); }
    });

    upgrades.push({
      id: "epicOrbStorm",
      label: `🌩️ Orb Storm<br>Drop <span style="color:${neon};">${ORB_STORM_COUNT}</span> random orbs right now`,
      apply: () => {
        const width  = window.innerWidth;
        const height = window.innerHeight;
        for (let i = 0; i < ORB_STORM_COUNT; i++) spawnOrbRandom(width, height);
      }
    });

    if (!pairOfScissorsUsed && !epicChainPending && upgradeOverlayContext !== "start") {
      upgrades.push({
        id: "pairOfScissors",
        label: `✂️ Pair of Scissors<br>Cut the snake in <span style="color:${neon};">half</span> and slow it by <span style="color:${neon};">20%</span>`,
        apply: () => { applyPairOfScissors(); }
      });
    }

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

    if (!ouroborosPactUsed) {
      upgrades.push({
        id: "ouroborosPact",
        label: `⚱️ Ouroboros Pact<br>Dead frogs have a <span style="color:${neon};">20%</span> chance to drop an orb`,
        apply: () => {
          ouroborosPactUsed = true;
          frogDeathOrbChance = Math.max(frogDeathOrbChance, 0.20);
        }
      });
    }

    const mutationChoice = getRandomMutationUpgrade();
    if (mutationChoice) upgrades.push(mutationChoice);

    if (luckStat < MAX_LUCK) {
      upgrades.push({
        id: "luck",
        label: `🍀 Luck<br>Gain <span style="color:${neon};">+5</span> luck`,
        apply: () => { addLuck(5); }
      });
    }

    if (frogDeathRattleChance < MAX_DEATHRATTLE_CHANCE - 1e-4) {
      upgrades.push({
        id: "commonDeathRattle",
        label: `💀 Deathrattle<br>+<span style="color:${neon};">${deathPerPickPct}%</span> revive chance`,
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
        label: `🏹 Last Stand<br>Last frog has <span style="color:${neon};">${Math.round(LAST_STAND_MIN_CHANCE * 100)}%</span> revive odds`,
        apply: () => { lastStandActive = true; }
      });
    }

    if (!survivalInstinctActive) {
      upgrades.push({
        id: "survivalInstinct",
        label: `⚡ Survival Instinct<br>When below 10 frogs, they hop <span style="color:${neon};">20%</span> faster`,
        apply: () => { survivalInstinctActive = true; }
      });
    }

    return upgrades;
  }
  function getEpicUpgradeChoices() {
    const epicTitleColor = "#ffb347";
    const deathPerPickPct = Math.round(EPIC_DEATHRATTLE_CHANCE * 100);

    const upgrades = [];

    if (!chainReactionActive) {
      upgrades.push({
        id: "chainReaction",
        label: `⚡ Chain Reaction<br>Orb collection has a <span style="color:${epicTitleColor};">25%</span> chance to trigger a second free orb buff`,
        apply: () => { chainReactionActive = true; }
      });
    }

    if (!extraUpgradeOptionActive) {
      upgrades.push({
        id: "extraUpgradeOption",
        label: `🔷 Loaded Hand<br>Future upgrade screens show <span style="color:${epicTitleColor};">4</span> choices instead of 3`,
        apply: () => { extraUpgradeOptionActive = true; }
      });
    }

    if (!nightBloomActive) {
      upgrades.push({
        id: "nightBloom",
        label: `🌙 Night Bloom<br>Orbs that expire naturally have a <span style="color:${epicTitleColor};">25%</span> chance to spawn a frog at that spot`,
        apply: () => { nightBloomActive = true; }
      });
    }

    if (frogs.length < maxFrogsCap) {
      upgrades.push({
        id: "tidalWave",
        label: `🌊 Tidal Wave<br>Spawn frogs equal to the number currently alive`,
        apply: () => { spawnTidalWave(); }
      });
    }

    if (frogDeathRattleChance < MAX_DEATHRATTLE_CHANCE - 1e-4) {
      upgrades.push({
        id: "epicDeathRattle",
        label: `💀 Epic Deathrattle<br>+<span style="color:${epicTitleColor};">${deathPerPickPct}%</span> revive chance`,
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
        label: `🧪 Orb Specialist<br>Every collected orb guarantees <span style="color:${epicTitleColor};">1</span> extra frog`,
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
        label: `👻 Grave Wave<br>Each shed spawns <span style="color:${epicTitleColor};">10-15</span> frogs`,
        apply: () => { graveWaveActive = true; graveWaveUsed = true; }
      });
    }

    if (!toxicBloodActive) {
      upgrades.push({
        id: "toxicBlood",
        label: `🧪 Poisonous Skin<br>Snake is slowed briefly every time it eats a frog`,
        apply: () => { toxicBloodActive = true; }
      });
    }

    if (frogs.length > 0) {
      upgrades.push({
        id: "promotionEpic",
        label: `🥇 Promotion<br>All frogs gain <span style="color:${epicTitleColor};">+1 star</span> immediately`,
        apply: () => { promoteAllFrogs(); }
      });
    }

    if (!frogScatterUsed && frogs.length > 0) {
      upgrades.push({
        id: "frogScatter",
        label: `🌪️ Frog Scatter<br>Kill and respawn <span style="color:${epicTitleColor};">all</span> current frogs`,
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
      <div class="frog-panel-title">How to Play 🐸</div>
      <div class="frog-panel-sub">Stay alive. Don't let the snake eat all your frogs.</div>

      <div class="frog-panel-section-label">Basics</div>
      <ul class="frog-panel-list">
        <li>Move your mouse or finger — frogs follow your cursor.</li>
        <li>When all frogs are gone, the run ends.</li>
        <li>Collect orbs for temporary buffs and upgrade choices.</li>
      </ul>

      <div class="frog-panel-section-label">The Snake</div>
      <ul class="frog-panel-list">
        <li>It chases your frogs and speeds up every shed.</li>
        <li>After 3 sheds a second snake spawns.</li>
        <li>Plan your escape route before each shed hits.</li>
      </ul>

      <div class="frog-panel-section-label">Tips</div>
      <ul class="frog-panel-list">
        <li>Don't bunch your frogs — clusters get eaten fast.</li>
        <li>Survival upgrades often matter more than spawning more frogs.</li>
        <li>Your score comes from frogs eaten — surviving longer scores more.</li>
      </ul>

      <div class="frog-panel-footer">
        <button id="howToCloseBtn" class="frog-btn frog-btn-secondary">Close</button>
      </div>
    `;

    const closeBtn = document.getElementById("howToCloseBtn");
    if (closeBtn) closeBtn.addEventListener("click", hideHowToOverlay);

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

    const upgrades = [
      { type: "mobility", label: "🧬 Mutation", desc: "+15% jump speed and +15% jump height." },
      { type: "mobility", label: "⚡ Survival Instinct", desc: "Below 10 frogs, they hop 20% faster." },
      { type: "mobility", label: "✂️ Pair of Scissors", desc: "Cuts the snake in half and slows it by 20%." },
      { type: "mobility", label: "🌪️ Frog Scatter", desc: "Kill and respawn all current frogs." },
      { type: "buff", label: "🍀 Luck", desc: "Increases buff duration bonus, improves frog rolls, and more." },
      { type: "buff", label: "🎲 Lucky Roll", desc: "Instantly triggers a random orb buff at 1.5× duration." },
      { type: "buff", label: "🌀 Orb Whisperer", desc: "Orbs linger 30% longer." },
      { type: "buff", label: "🎯 Orb Flow", desc: "Increases orb spawn frequency." },
      { type: "buff", label: "🌩️ Orb Storm", desc: "Drops a burst of random orbs immediately." },
      { type: "buff", label: "🥚 Double Yolker", desc: "15% chance for collected orbs to spawn 2 extra frogs." },
      { type: "buff", label: "⚡ Chain Reaction", desc: "When collecting an orb, there is a 25% chance of a second buff." },
      { type: "buff", label: "🌙 Night Bloom", desc: "Naturally expiring orbs have a 25% chance to spawn a frog." },
      { type: "buff", label: "🧪 Orb Specialist", desc: "Every collected orb guarantees 1 extra frog." },
      { type: "buff", label: "🔮 Molt Fortune", desc: "Snake drops 5–10 orbs whenever it sheds." },
      { type: "survival", label: "💀 Deathrattle", desc: "Dead frogs have a chance to respawn." },
      { type: "survival", label: "🏹 Last Stand", desc: "Your last frog has strong revive odds." },
      { type: "survival", label: "⚱️ Ouroboros Pact", desc: "Dead frogs have a 20% chance to drop an orb." },
      { type: "survival", label: "💨 Second Wind", desc: "Once per run, when you fall below 10 frogs, instantly spawn 20." },
      { type: "survival", label: "🧪 Poisonous Skin", desc: "The snake is slowed briefly every time it eats a frog." },
      { type: "survival", label: "👻 Grave Wave", desc: "Each shed spawns 10–15 frogs." },
      { type: "role", label: "🐸 Spawn Frogs", desc: "Spawn fresh frogs instantly." },
      { type: "role", label: "🎭 Role Draft", desc: "Choose between 2 random frog roles." },
      { type: "role", label: "🥇 Promotion", desc: "All current frogs gain +1 star immediately." },
      { type: "role", label: "🌊 Tidal Wave", desc: "Instantly spawn frogs equal to the number currently alive." },
      { type: "role", label: "🔷 Loaded Hand", desc: "Future upgrade screens show 4 choices instead of 3." }
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
        <div class="frog-panel-title">Upgrades ⚡</div>
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

      function getDisplayName(entry, fallback) {
        if (entry && typeof entry.tag === "string" && entry.tag.trim()) return entry.tag;
        if (entry && typeof entry.name === "string" && entry.name.trim()) return entry.name;
        return fallback;
      }

      const pageSize = 10;
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
          const name = getDisplayName(entry, `Player ${rank}`);
          const score = Math.floor(getScore(entry)).toLocaleString();
          const time = formatLeaderboardTime(getTime(entry));
          const isMe = entryMatchesUser(entry);
          return `
            <li${isMe ? ' style="color:#bef264;"' : ""}>
              <strong>#${rank}</strong>
              ${isMe ? "⭐ " : ""}${name} · ${time} · ${score} score
            </li>
          `;
        }).join("");

        const totalPages = Math.ceil(list.length / pageSize);
        const myRankText = myIndex >= 0 ? ` · You: #${myIndex + 1}` : "";

        content.innerHTML = `
          <div class="frog-panel-section-label" style="margin-top:0;">Global Leaderboard</div>
          <ul class="frog-panel-list" style="margin-bottom:0;min-width:320px;">
            ${itemsHtml || '<li style="color:#a8a29e;">No entries.</li>'}
          </ul>
          <div class="frog-panel-footer">
            <div style="margin-bottom:8px;">Page ${currentPage + 1} of ${totalPages}${myRankText}</div>
            <div style="display:flex;gap:8px;">
              <button id="leaderboardPrevBtn" class="frog-btn frog-btn-secondary" style="flex:1;margin-bottom:0;" ${currentPage === 0 ? "disabled" : ""}>Prev</button>
              <button id="leaderboardNextBtn" class="frog-btn frog-btn-secondary" style="flex:1;margin-bottom:0;" ${end >= list.length ? "disabled" : ""}>Next</button>
            </div>
          </div>
        `;

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
  const dashboardPfp = getDashboardPfp();
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

  content.innerHTML = `
    <div style="text-align:center;padding-bottom:14px;border-bottom:1px solid #292524;margin-bottom:2px;">
      <div style="
        position:relative;
        width:72px;
        height:72px;
        border-radius:999px;
        overflow:hidden;
        background:${dashboardPfp.bgColor || "#292524"};
        border:2px solid #44403c;
        margin:0 auto 8px;
      ">
        <img src="${dashboardPfp.spriteSrc}" alt="" style="position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;z-index:1;" />
        <img src="${dashboardPfp.skinSrc}" alt="" style="position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;z-index:2;" />
        ${dashboardPfp.eyesSrc ? `<img src="${dashboardPfp.eyesSrc}" alt="" style="position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;z-index:3;" />` : ""}
        ${dashboardPfp.hatSrc ? `<img src="${dashboardPfp.hatSrc}" alt="" style="position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;z-index:4;" />` : ""}
      </div>
      <div style="font-size:15px;font-weight:bold;color:#bef264;margin-bottom:2px;" id="dashboardCurrentTag">${currentTag || "No tag set"}</div>
      <div style="font-size:11px;color:#a3e635;margin-bottom:6px;">Level ${levelData.level}${leaderboardBest.found && bestRecordRank >= 0 ? ` · <span style="color:#a8a29e;">#${bestRecordRank + 1} ranked</span>` : ""}</div>
      <div style="width:120px;height:5px;background:#292524;border-radius:999px;overflow:hidden;margin:0 auto 3px;">
        <div style="width:${levelData.progressPercent}%;height:100%;background:#65a30d;border-radius:999px;"></div>
      </div>
      <div style="font-size:10px;color:#a8a29e;margin-bottom:6px;">${levelData.orbsNeededForNextLevel} orbs to level ${levelData.nextLevel}</div>
      <div style="font-size:12px;color:#f5f5f4;">
        <strong style="color:#bef264;">${leaderboardBest.found ? leaderboardBest.bestRun.toLocaleString() : "—"}</strong> best
        · <strong style="color:#bef264;">${localStats.totalRuns || 0}</strong> runs
        · <strong style="color:#bef264;">${localStats.totalOrbsCollected || 0}</strong> orbs
        · <strong style="color:#bef264;">${formatDashboardDuration(localStats.totalPlayTime || 0)}</strong>
      </div>
    </div>

    <div class="frog-panel-section-label" style="margin-top:14px;">Leaderboard Tag</div>
    <div style="display:flex;gap:6px;margin-bottom:4px;">
      <input
        id="dashboardTagInput"
        type="text"
        maxlength="20"
        value="${String(currentTag).replace(/"/g, "&quot;")}"
        placeholder="Enter player tag"
        style="flex:1;padding:6px 9px;border-radius:8px;border:1px solid #44403c;background:#292524;color:white;font-family:inherit;font-size:12px;"
      />
      <button id="dashboardSaveTagBtn" class="frog-btn frog-btn-secondary" style="width:auto;padding:6px 10px;font-size:12px;margin-bottom:0;">Save</button>
    </div>
    <div id="dashboardTagMessage" style="font-size:11px;min-height:16px;margin-bottom:10px;color:#a8a29e;"></div>

    ${buildStartingBuffSelectorHtml()}
    ${buildSnakeSkinSelectorHtml()}
  `;
  
  const tagInput = document.getElementById("dashboardTagInput");
  const saveBtn = document.getElementById("dashboardSaveTagBtn");
  const msgEl = document.getElementById("dashboardTagMessage");
  const currentTagEl = document.getElementById("dashboardCurrentTag");

  if (saveBtn && tagInput) {
    saveBtn.addEventListener("click", async () => {
      const validation = validateDashboardTag(tagInput.value);

      if (!validation.ok) {
        if (msgEl) { msgEl.textContent = validation.message; msgEl.style.color = "#fca5a5"; }
        return;
      }

      const newTag = validation.tag;

      // Submit to server first — don't save locally until we know the tag is accepted
      try {
        const bestScore = leaderboardBest && leaderboardBest.found ? leaderboardBest.bestRun : 0;
        const bestTime  = leaderboardBest && leaderboardBest.found ? leaderboardBest.bestTime : 0;
        const result = await submitScoreToServer(bestScore, bestTime, null, newTag);

        if (result && result._error) {
          const msg = result.error === "tag_taken"
            ? "That tag is already taken — try another."
            : (result.message || "Could not save tag. Try again.");
          if (msgEl) { msgEl.textContent = msg; msgEl.style.color = "#fca5a5"; }
          return;
        }

        // Server accepted — now save locally
        await saveDashboardTag(newTag);
        if (currentTagEl) currentTagEl.textContent = newTag;
        if (msgEl) { msgEl.textContent = "Tag saved."; msgEl.style.color = "#bef264"; }

        const refreshed = await fetchLeaderboard();
        updateMiniLeaderboard(refreshed);
      } catch (e) {
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
    const optionCount = extraUpgradeOptionActive ? 4 : 3;

    containerEl.innerHTML = "";
    const neon = "#4defff";

    if (upgradeOverlayTitleEl) {
      upgradeOverlayTitleEl.textContent = "Choose an upgrade";
    }

    let choices = [];

    if (isEpic) {
      let pool = getEpicUpgradeChoices().slice();
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
      btn.className = `frog-btn frog-upgrade-choice ${getUpgradeColorClass(choice.id)}`;
      btn.style.animationDelay = `${index * 70}ms`;

      const rawLabel = String(choice.label || "").trim();
      const parts = rawLabel.split(/<br\s*\/?>/i);
      const titleHtml = (parts.shift() || "").trim();
      const descHtml = parts.join("<br>").trim();

      btn.innerHTML = `
        <div class="frog-upgrade-title">${titleHtml}</div>
        ${descHtml ? `<div class="frog-upgrade-desc">${descHtml}</div>` : ""}
      `;

      btn.addEventListener("click", () => {
        playButtonClick();

        if (choice.opensRoleDraft) {
          choice.apply();
          playPermanentChoiceSound();
          return;
        }

        choice.apply();

        if (soundEnabled) {
          playPermanentChoiceSound();
        }

        if (!initialUpgradeDone && currentUpgradeOverlayMode === "normal") {
          initialUpgradeDone = true;
        }

        closeUpgradeOverlay();
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

  applySelectedStartingBuff();
  updateStatsPanel();
  updateHUD();

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

  async function endGame() {
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

    recordRunToDashboard();
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
        const fetched = await fetchLeaderboard();
        leaderboardEntries = Array.isArray(fetched) ? fetched : [];
      }

      updateMiniLeaderboard(leaderboardEntries);
    } catch (err) {
      console.error("endGame summary flow failed", err);
    } finally {
      summaryPending = false;
    }

    showEndGameSummaryOverlay(leaderboardEntries);
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

luckStat = 0;
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
    nightBloomActive = false;
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

      if (!gameOver && !overlayOpen) {
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