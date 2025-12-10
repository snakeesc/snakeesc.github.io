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
    AURA_RADIUS2
  } = Config;

  const {
    randInt = () => 0,
    randRange = () => 0,
    pickRandomTokenIds = () => [],
    computeInitialPositions = () => []
  } = Utils;

  const statHighlight = (text) => `<span class="stat-highlight">${text}</span>`;
  const ORB_MAGNET_PULL_RANGE = 220;

  function getUpgradeColorClass(upgradeId) {
  // movement / jumping
  const mobilityIds = [
    "frogSpeed",
    "frogJump",
    "frogSpeedJump",
    "epicSpeedJump",
    "higherHops"
  ];

  // buff duration / orbs / magnet style
  const buffIds = [
    "buffDuration",
    "epicBuffDuration",
    "orbMagnet",
    "orbLinger",
    "orbSpawn",
    "orbSpecialist"
  ];

  // survival / death-related
  const survivalIds = [
    "deathrattle",
    "epicDeathrattle",
    "lastStand",
    "ouroborosPact"
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
    "cannibalPromotion"
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

  let snakeEggPending = false; // EPIC: next shed uses reduced speed bonus
  let epicChainPending = false;

  // Old snakes that are despawning chunk-by-chunk
  let dyingSnakes = [];

  // Main menu background snakes/frogs
  let mainMenuSnakes = [];
  let mainMenuFrogs = [];
  let mainMenuAnimId = null;
  let mainMenuLastTime = 0;

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
  function snakeShed(stage) {
    if (!snake) return;

    // Capture the old snake so we can despawn it over time.
    const oldSnake = snake;
    const oldHeadEl = oldSnake.head && oldSnake.head.el ? oldSnake.head.el : null;
    const oldSegmentEls = Array.isArray(oldSnake.segments)
      ? oldSnake.segments.map(seg => seg.el).filter(Boolean)
      : [];

    if (oldHeadEl || oldSegmentEls.length) {
      dyingSnakes.push({
        headEl: oldHeadEl,
        segmentEls: oldSegmentEls,
        nextDespawnTime: 0.08   // seconds between chunks disappearing
      });
    }

    // Base this shed's speed on the old snake's personal factor (defaults to 1)
    const baseSpeedFactor = (oldSnake && typeof oldSnake.speedFactor === "number")
      ? oldSnake.speedFactor
      : 1.0;

    // Permanent speed bonus each shed.
    // Normally +20%, but if Snake Egg is pending, only +11% (20% - 9%).
    let speedMult = SNAKE_SHED_SPEEDUP;
    if (snakeEggPending) {
      speedMult = SNAKE_EGG_BUFF_PCT;   // +11% instead of +20%
      snakeEggPending = false; // consume the egg buff
    }

    const newSpeedFactor = baseSpeedFactor * speedMult;

    // Keep the old global in sync for stats / HUD if you reference it anywhere
    snakePermanentSpeedFactor = newSpeedFactor;

    // Turn radius: slightly tighter turns each shed (20% per shed, capped)
    // NOTE: higher snakeTurnRate = sharper turns (tighter radius).
    snakeTurnRate = Math.min(SNAKE_TURN_RATE_CAP, snakeTurnRate * 1.2);

    // Decide new color stage (1 = yellow, 2 = orange, 3+ = red).
    snakeShedStage = stage;

    // Spawn the new snake roughly where the old head was.
    const width  = window.innerWidth;
    const height = window.innerHeight;

    const startX = (oldSnake.head && typeof oldSnake.head.x === "number")
      ? oldSnake.head.x
      : width * 0.15;
    const startY = (oldSnake.head && typeof oldSnake.head.y === "number")
      ? oldSnake.head.y
      : height * 0.5;

    // Decide how many segments the new snake should start with:
    // - 1/4 of the old snake's length
    // - minimum SNAKE_INITIAL_SEGMENTS
    // - maximum 50 segments
    const oldCountRaw = oldSegmentEls.length || SNAKE_INITIAL_SEGMENTS;
    let newSegCount = Math.round(oldCountRaw / 4);

    if (newSegCount < SNAKE_INITIAL_SEGMENTS) {
      newSegCount = SNAKE_INITIAL_SEGMENTS;
    }
    if (newSegCount > 20) {
      newSegCount = 20;
    }

    // Create new head
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

    // Create new segments
    const segments = [];
    for (let i = 0; i < newSegCount; i++) {
      const segEl = document.createElement("div");
      const isTail = i === newSegCount - 1;
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
        ? "url(./images/tail.png)"
        : "url(./images/body.png)";
      container.appendChild(segEl);

      segments.push({ el: segEl, x: startX, y: startY });
    }

    // New path for the new snake
    const path = [];
    const segmentGap = computeSegmentGap();
    const maxPath = (segments.length + 2) * segmentGap + 2;
    for (let i = 0; i < maxPath; i++) {
      path.push({ x: startX, y: startY });
    }

    // Replace global snake reference with the new snake,
    // carrying forward the new per-snake speed factor
    snake = {
      head: { el: headEl, x: startX, y: startY, angle: 0 },
      segments,
      path,
      isFrenzyVisual: false,
      speedFactor: newSpeedFactor
    };

    // Apply the appropriate color tint for this shed stage
    applySnakeAppearance();

    // Grave Wave: every shed, raise a wave of ghost frogs
    if (graveWaveActive) {
      const ghostCount = randInt(GRAVE_WAVE_MIN_GHOSTS, GRAVE_WAVE_MAX_GHOSTS);
      spawnGhostWave(ghostCount);
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
    const glows = [];
    if (frog.isChampion)      glows.push("0 0 12px rgba(255,215,0,0.9)");
    if (frog.isAura)          glows.push("0 0 12px rgba(0,255,200,0.9)");
    if (frog.hasPermaShield)  glows.push("0 0 10px rgba(135,206,250,0.9)");
    if (frog.isMagnet)        glows.push("0 0 10px rgba(173,255,47,0.9)");
    if (frog.isLucky)         glows.push("0 0 10px rgba(255,105,180,0.9)");
    if (frog.isZombie)        glows.push("0 0 10px rgba(148,0,211,0.9)");
    if (frog.isCannibal)      glows.push("0 0 12px rgba(255,69,0,0.95)"); // NEW
    frog.el.style.boxShadow = glows.join(", ");
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

      // per-frog permanent upgrades
      speedMult: 1.0,
      jumpMult: 1.0,
      isChampion: false,
      isAura: false,
      hasPermaShield: false,
      isMagnet: false,
      isLucky: false,
      isZombie: false,
      shieldGrantedAt: null,
      // per-frog deathrattle (for special cases like Zombie Horde)
      specialDeathRattleChance: null,

      // NEW – special roles
      isCannibal: false,
      extraDeathRattleChance: 0,  // per-frog extra chance (e.g. Zombie Horde)
      cannibalIcon: null,         // overlay icon for cannibal

      cloneEl: null,
      layers: []
    };

    frogs.push(frog);
    refreshFrogPermaGlow(frog);

    totalFrogsSpawned++;

    fetchMetadata(tokenId)
      .then(meta => buildLayersForFrog(frog, meta))
      .catch(() => {});

    return frog;
  }

  async function createInitialFrogs(width, height) {
    frogs = [];
    const count = Math.min(STARTING_FROGS, maxFrogsCap);
    const positions = computeInitialPositions(width, height, count);
    const tokenIds  = pickRandomTokenIds(positions.length);

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const tokenId = tokenIds[i];
      createFrogAt(pos.x, pos.y, tokenId);
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
      const tokenId = randInt(1, MAX_TOKEN_ID);
      const frog = createFrogAt(x, y, tokenId);

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
      const tokenId = randInt(1, MAX_TOKEN_ID);
      createFrogAt(x, y, tokenId);
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
      const tokenId = randInt(1, MAX_TOKEN_ID);
      const frog = createFrogAt(x, y, tokenId);

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
      const tokenId = randInt(1, MAX_TOKEN_ID);
      const frog = createFrogAt(x, y, tokenId);
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

    // Champion frogs are a bit faster (perma)
    if (frog.isChampion) {
      factor *= CHAMPION_SPEED_FACTOR;
    }

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

    // Champion jump boost (perma)
    if (frog.isChampion) {
      factor *= CHAMPION_JUMP_FACTOR;
    }

    // Final hard cap: permanent + orb jump can't exceed this.
    if (factor > MAX_TOTAL_FROG_JUMP_FACTOR) {
      factor = MAX_TOTAL_FROG_JUMP_FACTOR;
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

  function computeSegmentGap() {
    // Keep spacing stable across devices and effects so the body never stretches apart.
    return BASE_SEGMENT_GAP;
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
    const RESIST_PER_SEGMENT = 0.04;
    const maxResist = 0.8;
    return Math.max(0, Math.min(maxResist, extraSegments * RESIST_PER_SEGMENT));
  }


function grantChampionFrog(frog) {
  if (frog.isChampion) return;
  frog.isChampion = true;
  frog.speedMult *= 0.85;
  frog.jumpMult  *= 1.25;
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

  // Remove previous badge, if any
  if (frog.cannibalIcon && frog.cannibalIcon.parentNode === frog.el) {
    frog.el.removeChild(frog.cannibalIcon);
  }
  frog.cannibalIcon = null;

  const emojis = [];
  if (frog.isChampion)     emojis.push("🏅");
  if (frog.isAura)         emojis.push("🌈");
  if (frog.hasPermaShield) emojis.push("🛡️");
  if (frog.isMagnet)       emojis.push("🧲");
  if (frog.isLucky)        emojis.push("🍀");
  if (frog.isZombie)       emojis.push("🧟");
  if (frog.isCannibal)     emojis.push("🦴");

  if (!emojis.length) return;

  const badge = document.createElement("div");
  badge.className = "frog-role-emoji";
  badge.textContent = emojis.join("");
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
  const roles = ["champion", "aura", "magnet", "lucky", "zombie"];

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
    const tokenId = randInt(1, MAX_TOKEN_ID);
    return createFrogAt(x, y, tokenId);
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
      // Zombies keep being zombies, but we do NOT keep their extra 50% DR forever
      if (frog.isZombie) {
        grantZombieFrog(newFrog);
      }

      // Cannibal respawns stay cannibals
      if (frog.isCannibal) {
        markCannibalFrog(newFrog);
      }

      // If this frog was eaten by a cannibal, its respawn gets a random permanent role
      if (source === "cannibal") {
        grantRandomPermaFrogUpgrade(newFrog);
      }

      // NOTE: we do NOT copy frog.extraDeathRattleChance:
      // special 50% bonuses (Zombie Horde) only apply to that one life.
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
    if (stage === 1) {
      // yellow-ish
      return "hue-rotate(-40deg) saturate(1.6) brightness(1.1)";
    } else if (stage === 2) {
      // orange-ish
      return "hue-rotate(-20deg) saturate(1.7) brightness(1.05)";
    } else if (stage >= 3) {
      // red-ish
      return "hue-rotate(-60deg) saturate(1.8)";
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

    if (mouse.follow && mouse.active && !frog.isGhost) {
      goalX = mouse.x - FROG_SIZE / 2;
      goalY = mouse.y - FROG_SIZE / 2;
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
      orb.ttl -= dt;

      if (orb.ttl <= 0 || !orb.el) {
        if (orb.el && orb.el.parentNode === container) {
          container.removeChild(orb.el);
        }
        orbs.splice(i, 1);
        continue;
      }

      // magnet logic
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

      // collection
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
        if (orb.type === "permaFrog") {
          grantRandomPermaFrogUpgrade(collectedBy);
        } else {
          applyBuff(orb.type, collectedBy);
        }

        // 🧪 Orb Specialist + Orb Collector + permanent lifesteal synergy
        let frogsToSpawnFromOrb = 0;

        // Orb Specialist: every orb always spawns 1 frog,
        // plus a 50% chance for a second frog.
        if (orbSpecialistActive) {
          frogsToSpawnFromOrb += 1; // guaranteed
          //if (Math.random() < 0.5) {
           // frogsToSpawnFromOrb += 1; // 50% extra
          //}
        }

        // Permanent lifesteal upgrade: next N orbs also spawn frogs.
        if (permaLifeStealOrbsRemaining > 0) {
          permaLifeStealOrbsRemaining -= 1;
          frogsToSpawnFromOrb += 1;
        }

        // Orb Collector: now adds an additional frog on top of the above.
        if (orbCollectorChance > 0 && Math.random() < orbCollectorChance) {
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
        ? "url(./images/tail.png)"
        : "url(./images/body.png)";
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
        ? "url(./images/tail.png)"
        : "url(./images/body.png)";
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
      segEl.style.backgroundImage = "url(./images/body.png)";

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

  function updateSingleSnake(snakeObj, dt, width, height, opts = {}) {
    if (!snakeObj) return;

    const frogList = Array.isArray(opts.frogsList) ? opts.frogsList : frogs;
    const isMainMenu = !!opts.mainMenu;

    const marginX = 8;
    const marginY = 24;

    const head = snakeObj.head;
    if (!head) return;

    const segmentGap = computeSegmentGap();

    // -----------------------------
    // Targeting logic
    // -----------------------------
    let targetFrog = null;
    let bestDist2 = Infinity;

    for (const frog of frogList) {
      if (!frog || !frog.el) continue;
      const fx = frog.x + FROG_SIZE / 2;
      const fy = frog.baseY + FROG_SIZE / 2;
      const dx = fx - head.x;
      const dy = fy - head.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDist2) {
        bestDist2 = d2;
        targetFrog = frog;
      }
    }

    let desiredAngle = head.angle;

    if (snakeConfuseTime > 0) {
      // confused: random-ish turning
      desiredAngle = head.angle + (Math.random() - 0.5) * Math.PI;
      targetFrog = null;
    } else if (targetFrog) {
      const fx = targetFrog.x + FROG_SIZE / 2;
      const fy = targetFrog.baseY + FROG_SIZE / 2;
      desiredAngle = Math.atan2(fy - head.y, fx - head.x);
    } else {
      // no frogs? just wander
      desiredAngle += (Math.random() - 0.5) * dt;
    }

    let angleDiff =
      ((desiredAngle - head.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    const maxTurn = snakeTurnRate * dt;
    if (angleDiff > maxTurn) angleDiff = maxTurn;
    if (angleDiff < -maxTurn) angleDiff = -maxTurn;
    head.angle += angleDiff;

    const speedFactor = getSnakeSpeedFactor(snakeObj);
    const speed = SNAKE_BASE_SPEED * speedFactor * (0.8 + Math.random() * 0.4);

    head.x += Math.cos(head.angle) * speed * dt;
    head.y += Math.sin(head.angle) * speed * dt;

    // Keep inside bounds
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

    // -----------------------------
    // Path + segments follow
    // -----------------------------
    snakeObj.path.unshift({ x: head.x, y: head.y });
    const maxPathLength = (snakeObj.segments.length + 2) * segmentGap + 2;
    while (snakeObj.path.length > maxPathLength) {
      snakeObj.path.pop();
    }

    const shrinkScale = snakeShrinkTime > 0 ? 0.8 : 1.0;

    // 🔸 Head: fully rotate with movement
    head.el.style.transform =
      `translate3d(${head.x}px, ${head.y}px, 0) rotate(${head.angle}rad) scale(${shrinkScale})`;

    for (let i = 0; i < snakeObj.segments.length; i++) {
      const seg = snakeObj.segments[i];
      const idx = Math.min(
        snakeObj.path.length - 1,
        (i + 1) * segmentGap
      );
      const p = snakeObj.path[idx] || snakeObj.path[snakeObj.path.length - 1];

      const nextIdx = Math.max(0, idx - 2);
      const q = snakeObj.path[nextIdx] || p;
      const angle = Math.atan2(p.y - q.y, p.x - q.x);

      seg.x = p.x;
      seg.y = p.y;

      seg.el.style.transform =
        `translate3d(${seg.x}px, ${seg.y}px, 0) rotate(${angle}rad) scale(${shrinkScale})`;
    }

    // -----------------------------
    // Collisions with frogs
    // -----------------------------
    const eatRadius = getSnakeEatRadius();
    const eatR2 = eatRadius * eatRadius;

    // ✅ Use the *center* of the head sprite as the bite point
    const headCx = head.x + SNAKE_SEGMENT_SIZE / 2;
    const headCy = head.y + SNAKE_SEGMENT_SIZE / 2;

    for (let i = frogList.length - 1; i >= 0; i--) {
      const frog = frogList[i];
      if (!frog || !frog.el) continue;

      const fx = frog.x + FROG_SIZE / 2;
      const fy = frog.baseY + FROG_SIZE / 2;
      const dx = fx - headCx;
      const dy = fy - headCy;
      const d2 = dx * dx + dy * dy;

      if (d2 <= eatR2) {
        if (isMainMenu) {
          frogList.splice(i, 1);
          if (frog.el.parentNode === container) {
            container.removeChild(frog.el);
          }
          continue;
        }

        const killed = tryKillFrogAtIndex(i, "snake");

        // Only the CURRENT primary snake is allowed to grow.
        if (killed) {
          frogsEatenCount++;

          // 🔢 Scoring: 1 point per frog eaten
          let gain = 1;
          gain *= getLuckyScoreBonusFactor();
          if (scoreMultiTime > 0) gain *= SCORE_MULTI_FACTOR;
          score += gain;

          if (frogsEatenCount % 2 === 0) {
            // Grow whichever snake actually got the kill
            growSnakeForSnake(snakeObj, 1);
          }
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

  function getEpicUpgradeChoices() {
    const neon = "#4defff";
    const epicTitleColor = "#ffb347"; // soft orange for EPIC titles
    const totalColor = TOTAL_HIGHLIGHT_COLOR;

    const deathPerPickPct = Math.round(EPIC_DEATHRATTLE_CHANCE * 100);
    const currentDRChance = frogDeathRattleChance;
    const nextDRChance    = Math.min(1, currentDRChance + EPIC_DEATHRATTLE_CHANCE);
    const drTotalPct      = Math.round(nextDRChance * 100);

    const epicBuffFactor  = BUFF_DURATION_UPGRADE_FACTOR + 0.15;
    const buffPerPickPct  = Math.round((epicBuffFactor - 1) * 100);
    const nextBuffFactor  = buffDurationFactor * epicBuffFactor;
    const buffTotalPct    = Math.round((nextBuffFactor - 1) * 100);

    const speedPerPickPct     = Math.round((1 - (FROG_SPEED_UPGRADE_FACTOR*2)) * 100);
    const jumpPerPickPct      = Math.round(((FROG_JUMP_UPGRADE_FACTOR*2) - 1) * 100);
    const orbFasterPerPickPct = Math.round((1 - ORB_INTERVAL_UPGRADE_FACTOR) * 100);

    const orbStormCount   = 10;
    const snakeEggBuffPct = 15; // +11% instead of +20%

    const upgrades = [];

    // EPIC: Spawn frogs – only offer if not at frog cap
    if (frogs.length < maxFrogsCap) {
      upgrades.push({
        id: "epicSpawn50",
        label: `
          🐸 Spawn Frogs<br>
          Spawn <span style="color:${epicTitleColor};">${EPIC_SPAWN_AMOUNT}</span> frogs now
        `,
        apply: () => {
          spawnExtraFrogs(EPIC_SPAWN_AMOUNT);
        }
      });
    }

    // EPIC: Deathrattle – only if below cap
    if (frogDeathRattleChance < MAX_DEATHRATTLE_CHANCE - 1e-4) {
      upgrades.push({
        id: "epicDeathRattle",
        label: `
          💀 Deathrattle<br>
          +<span style="color:${epicTitleColor};">${deathPerPickPct}%</span> deathrattle chance
        `,
        apply: () => {
          frogDeathRattleChance = Math.min(
            MAX_DEATHRATTLE_CHANCE,
            frogDeathRattleChance + EPIC_DEATHRATTLE_CHANCE
          );
        }
      });
    }

    // EPIC: Buff duration – only if below cap
    if (buffDurationFactor < buffDurationCap - 1e-4) {
      upgrades.push({
        id: "epicBuffDuration",
        label: `
          ⏳ Buffs extended<br>
          +<span style="color:${epicTitleColor};">${buffPerPickPct}%</span> buff duration
        `,
        apply: () => {
          buffDurationFactor *= epicBuffFactor;
          if (buffDurationFactor > buffDurationCap) {
            buffDurationFactor = buffDurationCap;
          }
        }
      });
    }

    // ORB STORM – always okay, orbs obey MAX_FROGS via spawn logic later
    upgrades.push({
      id: "epicOrbStorm",
      label: `
        🌩️ Orb Storm<br>
        Drop <span style="color:${epicTitleColor};">${ORB_STORM_COUNT}</span> random orbs right now
      `,
      apply: () => {
        const width  = window.innerWidth;
        const height = window.innerHeight;
        for (let i = 0; i < ORB_STORM_COUNT; i++) {
          spawnOrbRandom(width, height);
        }
      }
    });

    // SNAKE EGG
    if (!snakeEggPending) {
      upgrades.push({
        id: "snakeEgg",
        label: `
          🥚 Snake Egg<br>
          The <span style="color:${epicTitleColor};">next shed</span> only gives the new snake
          <span style="color:${epicTitleColor};">+${snakeEggBuffPct}%</span> speed instead of +30%
        `,
        apply: () => {
          snakeEggPending = true;
        }
      }); 
    }

    // Frog Promotion (epic role wave)
    if (frogs.length < maxFrogsCap) {
      upgrades.push({
        id: "frogPromotion",
        label: `
          🐸⭐ Frog Promotion<br>
          Summon <span style="color:${epicTitleColor};">10</span> frogs,<br>
          each with a random permanent role
        `,
        apply: () => {
          spawnFrogPromotion(10);
        }
      });
    }

    // Grave Wave – only once
    if (!graveWaveActive) {
      upgrades.push({
        id: "graveWave",
        label: `
          👻 Grave Wave<br>
          Each shed summons <span style="color:${epicTitleColor};">10–20</span> uncontrollable ghost frogs
        `,
        apply: () => {
          graveWaveActive = true;
        }
      });
    }

    // Orb Specialist – only once
    if (!orbSpecialistActive) {
      upgrades.push({
        id: "epicOrbSpecialist",
        label: `
          🧪 Orb specialist<br>
          Orbs always spawn <span style="color:${epicTitleColor};">1</span> frog. Orb Collector chance rolls for extra frogs.
        `,
        apply: () => {
          orbSpecialistActive = true;
        },
      });
    }

    /*
    if (frogPermanentSpeedFactor > MIN_FROG_SPEED_FACTOR + 1e-4 && frogPermanentJumpFactor < MAX_FROG_JUMP_FACTOR - 1e-4) {
      upgrades.push({
        id: "frogSpeed",
        label: `
          💨🦘 Hop Quicker & Higher<br>
          Frogs hop ~<span style="color:${epicTitleColor};">10%</span> faster<br>
          +<span style="color:${epicTitleColor};">20%</span> jump height
        `,
        apply: () => {
          frogPermanentSpeedFactor *= 0.90;
          if (frogPermanentSpeedFactor < MIN_FROG_SPEED_FACTOR) {
            frogPermanentSpeedFactor = MIN_FROG_SPEED_FACTOR;
          }
          frogPermanentJumpFactor *= 1.20;
          if (frogPermanentJumpFactor > MAX_FROG_JUMP_FACTOR) {
            frogPermanentJumpFactor = MAX_FROG_JUMP_FACTOR;
          }
        }
      });
    }*/

    if (!fragileRealityActive) {
      upgrades.push({
        id: "fragileReality",
        label: `
          🪞 Fragile Reality<br>
          Double buff duration (higher cap)<br>
          Halve orb spawn rate (hard cap)
        `,
        apply: () => {
          fragileRealityActive = true;
          buffDurationCap *= 2;
          buffDurationFactor = Math.min(buffDurationFactor * 2, buffDurationCap);

          orbSpawnIntervalFactor *= 2;
          minOrbSpawnIntervalFactor = Math.max(minOrbSpawnIntervalFactor, orbSpawnIntervalFactor);
          setNextOrbTime();
        }
      });
    }

    if (!frogScatterUsed && frogs.length > 0) {
      upgrades.push({
        id: "frogScatter",
        label: `
          🌪️ Frog Scatter<br>
          Kill and respawn <span style="color:${epicTitleColor};">all</span> current frogs<br>
          Roles are not kept; deathrattle applies
        `,
        apply: () => {
          frogScatterUsed = true;
          scatterFrogSwarm();
        }
      });
    }

    if (!eyeForEyeUsed && elapsedTime >= 900) {
      upgrades.push({
        id: "eyeForEye",
        label: `
          👁️ Eye for an Eye<br>
          Kill the slowest snake and half your frogs<br>
          Max frog cap drops to <span style="color:${epicTitleColor};">50</span>
        `,
        apply: () => {
          eyeForEyeUsed = true;
          applyEyeForAnEye();
        }
      });
    }

    return upgrades;
  }

  function getUpgradeChoices() {
    const neon = "#4defff";

    // per-pick effects
    const speedPerPickPct     = Math.round((1 - FROG_SPEED_UPGRADE_FACTOR) * 100);
    const jumpPerPickPct      = Math.round((FROG_JUMP_UPGRADE_FACTOR - 1) * 100);
    const buffPerPickPct      = Math.round((BUFF_DURATION_UPGRADE_FACTOR - 1) * 100);
    const orbFasterPerPickPct = Math.round((1 - ORB_INTERVAL_UPGRADE_FACTOR) * 100);
    const deathPerPickPct     = Math.round(COMMON_DEATHRATTLE_CHANCE * 100);
    const orbPerPickPct       = Math.round(ORB_COLLECTOR_CHANCE * 100);

    const lastStandPct = Math.round(LAST_STAND_MIN_CHANCE * 100);

    const upgrades = [];

    // Frogs hop faster (capped on PERMA factor)
    if (frogPermanentSpeedFactor > MIN_FROG_SPEED_FACTOR + 1e-4) {
      upgrades.push({
        id: "frogSpeed",
        label: `
          💨 Quicker Hops<br>
          Frogs hop ~<span style="color:${neon};">${speedPerPickPct}%</span> faster (stacks)
        `,
        apply: () => {
          frogPermanentSpeedFactor *= FROG_SPEED_UPGRADE_FACTOR;
          if (frogPermanentSpeedFactor < MIN_FROG_SPEED_FACTOR) {
            frogPermanentSpeedFactor = MIN_FROG_SPEED_FACTOR;
          }
        }
      });
    }

    // Frogs jump higher (capped on PERMA factor)
    if (frogPermanentJumpFactor < MAX_FROG_JUMP_FACTOR - 1e-4) {
      upgrades.push({
        id: "frogJump",
        label: `
          🦘 Higher Hops<br>
          +<span style="color:${neon};">${jumpPerPickPct}%</span> jump height (stacks)
        `,
        apply: () => {
          frogPermanentJumpFactor *= FROG_JUMP_UPGRADE_FACTOR;
          if (frogPermanentJumpFactor > MAX_FROG_JUMP_FACTOR) {
            frogPermanentJumpFactor = MAX_FROG_JUMP_FACTOR;
          }
        }
      });
    }

    // Spawn frogs – ONLY if we’re below cap
    if (frogs.length < maxFrogsCap) {
      upgrades.push({
        id: "spawn20",
        label: `
          🐸 Spawn frogs<br>
          <span style="color:${neon};">${NORMAL_SPAWN_AMOUNT}</span> frogs right now
        `,
        apply: () => {
          spawnExtraFrogs(NORMAL_SPAWN_AMOUNT);
        }
      });
    }

    if (!orbLingerBonusUsed) {
      upgrades.push({
        id: "orbWhisperer",
        label: `
          🌀 Orb Whisperer<br>
          Orbs linger <span style="color:${neon};">20%</span> longer before vanishing
        `,
        apply: () => {
          const bonus = 1.2;
          orbLingerBonusUsed = true;
          orbTtlFactor *= bonus;
          for (const orb of orbs) {
            if (!orb) continue;
            const base = orb.maxTtl || ORB_TTL;
            const ratio = base > 0 ? (orb.ttl / base) : 0;
            const newMax = base * bonus;
            orb.maxTtl = newMax;
            orb.ttl = newMax * Math.max(0, Math.min(1, ratio));
          }
        }
      });
    }

    if (!ouroborosPactUsed) {
      upgrades.push({
        id: "ouroborosPact",
        label: `
          🔄 Ouroboros Pact<br>
          <span style="color:${neon};">10%</span> chance dead frogs drop an orb
        `,
        apply: () => {
          ouroborosPactUsed = true;
          frogDeathOrbChance = 0.1;
        }
      });
    }

    if (frogs.length > 5) {
      upgrades.push({
        id: "coinFlip",
        label: `
          🪙 Coin Flip<br>
          Sacrifice <span style="color:${neon};">1</span> frog(s) to trigger a random buff with extra duration
        `,
        apply: () => {
          const toKill = Math.min(1, frogs.length);
          killRandomFrogs(toKill, "coinFlip");

          const buffPool = ORB_TYPES.filter(t => t !== "permaFrog");
          if (!buffPool.length) return;
          const buffType = buffPool[Math.floor(Math.random() * buffPool.length)];
          applyBuff(buffType, null, 1.75);
        }
      });
    }

    // Buff duration (capped)
    if (buffDurationFactor < buffDurationCap - 1e-4) {
      upgrades.push({
        id: "buffDuration",
        label: `
          ⏳ Buffs last longer<br>
          +<span style="color:${neon};">${buffPerPickPct}%</span> buff duration (stacks)
        `,
        apply: () => {
          buffDurationFactor *= BUFF_DURATION_UPGRADE_FACTOR;
          if (buffDurationFactor > buffDurationCap) {
            buffDurationFactor = buffDurationCap;
          }
        }
      });
    }

    // Orb spawn interval (capped)
    if (orbSpawnIntervalFactor > minOrbSpawnIntervalFactor + 1e-4) {
      upgrades.push({
        id: "moreOrbs",
        label: `
          🎯 More orbs over time<br>
          ~<span style="color:${neon};">${orbFasterPerPickPct}%</span> faster orb spawns (stacks)
        `,
        apply: () => {
          orbSpawnIntervalFactor *= ORB_INTERVAL_UPGRADE_FACTOR;
          if (orbSpawnIntervalFactor < minOrbSpawnIntervalFactor) {
            orbSpawnIntervalFactor = minOrbSpawnIntervalFactor;
          }
        }
      });
    }

    // Global deathrattle (capped)
    if (frogDeathRattleChance < MAX_DEATHRATTLE_CHANCE - 1e-4) {
      upgrades.push({
        id: "commonDeathRattle",
        label: `
          💀 Deathrattle<br>
          +<span style="color:${neon};">${deathPerPickPct}%</span> chance that dead frogs respawn (stacks)
        `,
        apply: () => {
          frogDeathRattleChance = Math.min(
            MAX_DEATHRATTLE_CHANCE,
            frogDeathRattleChance + COMMON_DEATHRATTLE_CHANCE
          );
        }
      });
    }

    // Orb Collector (capped)
    if (orbCollectorChance < MAX_ORB_COLLECTOR_TOTAL - 1e-4) {
      upgrades.push({
        id: "orbCollector",
        label: `
          🌌 Orb Collector<br>
          Every orb gains +<span style="color:${neon};">${orbPerPickPct}%</span> chance to spawn a frog (stacks)
        `,
        apply: () => {
          orbCollectorActive = true;
          orbCollectorChance = Math.min(
            MAX_ORB_COLLECTOR_TOTAL,
            orbCollectorChance + ORB_COLLECTOR_CHANCE
          );
        }
      });
    }

    // Last Stand – only once
    if (!lastStandActive) {
      upgrades.push({
        id: "lastStand",
        label: `
          🏹 Last Stand<br>
          Your <span style="color:${neon};">last frog</span> has
          at least <span style="color:${neon};">${lastStandPct}%</span> chance to respawn instead of dying
        `,
        apply: () => {
          lastStandActive = true;
        }
      });
    }

    return upgrades;
  }

  // LEGENDARY choices at 10 minutes (placeholders, TODO)
  function getLegendaryUpgradeChoices() {
    const neon = "#4defff";
    const deathPct = Math.round(LEGENDARY_DEATHRATTLE_CHANCE * 100);

    return [
      {
        id: "legendaryBuffDuration",
        label: `
          ⏳⏳ LEGENDARY buff surge<br>
          All buff durations ×<span style="color:${neon};">${LEGENDARY_BUFF_DURATION_FACTOR.toFixed(1)}</span>
        `,
        apply: () => {
          buffDurationFactor *= LEGENDARY_BUFF_DURATION_FACTOR;
          if (buffDurationFactor > buffDurationCap) {
            buffDurationFactor = buffDurationCap;
          }
        }
      },
      {
        id: "legendarySpawn75",
        label: `
          🐸🌊🌊 LEGENDARY frog wave<br>
          Spawn <span style="color:${neon};">${LEGENDARY_SPAWN_AMOUNT}</span> frogs now
        `,
        apply: () => {
          spawnExtraFrogs(LEGENDARY_SPAWN_AMOUNT);
        }
      },
      {
        id: "legendaryDeathRattle",
        label: `
          💀💀 LEGENDARY deathrattle<br>
          <span style="color:${neon};">${deathPct}%</span> chance a dead frog respawns
        `,
        apply: () => {
          frogDeathRattleChance += LEGENDARY_DEATHRATTLE_CHANCE;
        }
      }
    ];
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
      jumpMult: 1.0
    };

    return frog;
  }

  function createMainMenuFrog(x, y) {
    const tokenId = randInt(1, MAX_TOKEN_ID);
    const frog = buildMenuFrogState(x, y, tokenId);
    mainMenuFrogs.push(frog);

    fetchMetadata(tokenId)
      .then(meta => buildLayersForFrog(frog, meta))
      .catch(() => {});

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

  function initMainMenuOverlay() {
    if (mainMenuOverlay) return;

    mainMenuOverlay = document.getElementById("mainMenuOverlay");
    const btnStartRun = document.getElementById("btnStartRun");
    const btnHowTo = document.getElementById("btnHowTo");
    const btnBuffGuide = document.getElementById("btnBuffGuide");
    const btnLeaderboard = document.getElementById("btnLeaderboard");

    btnStartRun.addEventListener("click", () => {
      startRunFromMenu();
    });

    btnHowTo.addEventListener("click", () => {
      showHowToOverlay();
    });

    btnBuffGuide.addEventListener("click", () => {
      showBuffGuideOverlay();
    });

    btnLeaderboard.addEventListener("click", () => {
      showLeaderboardOverlay();
    });

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

    // Ensure any lingering upgrade modal is hidden before showing the menu
    hideUpgradeOverlayForMenu();

    startMainMenuBackground();
    setInGameUIVisible(false);
    mainMenuActive = true;
    syncAudioMuteState();
    mainMenuOverlay.style.display = "flex";
    gamePaused = true;
  }

  function hideMainMenu() {
    mainMenuActive = false;
    stopMainMenuBackground();
    syncAudioMuteState();
    if (mainMenuOverlay) {
      mainMenuOverlay.style.display = "none";
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
    howToOverlay.style.display = "flex";
  }

  function hideHowToOverlay() {
    if (howToOverlay) {
      howToOverlay.style.display = "none";
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

    panel.innerHTML = buildBuffGuideHtml();

    // Close button
    const closeBtn = document.getElementById("buffGuideCloseBtn");
    if (closeBtn) {
      closeBtn.onclick = hideBuffGuideOverlay;
    }

    // 🔹 Page buttons + pages
    const pageButtons = panel.querySelectorAll(".buff-page-btn");
    const pages = panel.querySelectorAll(".buff-guide-page");

    function setBuffGuidePage(idx) {
      pages.forEach((page, i) => {
        page.style.display = i === idx ? "block" : "none";
      });

      pageButtons.forEach((btn, i) => {
        if (i === idx) {
          btn.classList.add("is-active");
        } else {
          btn.classList.remove("is-active");
        }
      });
    }

    pageButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-page-index"), 10);
        if (!Number.isNaN(idx)) {
          setBuffGuidePage(idx);
        }
      });
    });

    // Make sure page 0 is active when it opens
    setBuffGuidePage(0);

    buffGuideOverlay.style.display = "flex";
  }

  function hideBuffGuideOverlay() {
    if (buffGuideOverlay) {
      buffGuideOverlay.style.display = "none";
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
        content.innerHTML = '<div class="leaderboard-empty">No runs yet.</div>';
        leaderboardOverlay.style.display = "flex";
        return;
      }

      const userLabel =
        (window.FrogGameLeaderboard &&
          typeof window.FrogGameLeaderboard.getCurrentUserLabel === "function" &&
          window.FrogGameLeaderboard.getCurrentUserLabel()) ||
        null;

      const scoreKeys = ["bestScore", "score", "maxScore", "points", "value"];
      const timeKeys = ["bestTime", "time", "maxTime", "seconds", "duration"];

      const pageSize = 10;
      let currentPage = 0;

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

      const myIndex = list.findIndex(entryMatchesUser);
      if (myIndex >= 0) {
        currentPage = Math.floor(myIndex / pageSize);
      }

      function getScore(entry) {
        if (!entry) return 0;
        for (const key of scoreKeys) {
          if (!(key in entry)) continue;
          let v = entry[key];
          if (typeof v === "string") v = parseFloat(v);
          if (typeof v === "number" && isFinite(v)) return v;
        }
        return 0;
      }

      function getTime(entry) {
        if (!entry) return 0;
        for (const key of timeKeys) {
          if (!(key in entry)) continue;
          let v = entry[key];
          if (typeof v === "string") v = parseFloat(v);
          if (typeof v === "number" && isFinite(v) && v >= 0) return v;
        }
        return 0;
      }

      function getFrogs(entry) {
        if (entry && entry.stats) {
          const stats = entry.stats;
          if (typeof stats.totalFrogsSpawned === "number") return stats.totalFrogsSpawned;
          if (typeof stats.frogsSpawned === "number") return stats.frogsSpawned;
          if (typeof stats.frogCount === "number") return stats.frogCount;
        }
        return null;
      }

      function getBuildSnippet(entry) {
        if (!entry || !entry.stats) return "—";
        const s = entry.stats;

        const speed = typeof s.frogSpeedFactor === "number" ? `SPD×${s.frogSpeedFactor.toFixed(2)}` : null;
        const jump = typeof s.frogJumpFactor === "number" ? `JMP×${s.frogJumpFactor.toFixed(2)}` : null;
        const buff = typeof s.buffDurationFactor === "number" ? `BUFF×${s.buffDurationFactor.toFixed(2)}` : null;
        const dr = typeof s.deathrattleChance === "number" ? `DR ${(s.deathrattleChance * 100).toFixed(0)}%` : null;
        const parts = [speed, jump, buff, dr].filter(Boolean);
        return parts.length ? parts.join(" · ") : "—";
      }

      function getDisplayName(entry, fallback) {
        if (entry && typeof entry.tag === "string" && entry.tag.trim() !== "") return entry.tag;
        if (entry && typeof entry.name === "string" && entry.name.trim() !== "") return entry.name;
        return fallback;
      }

      function buildRow(entry, index) {
        const row = document.createElement("tr");
        row.className = "leaderboard-row" + (entryMatchesUser(entry) ? " is-me" : "");

        const rankCell = document.createElement("td");
        rankCell.textContent = index + 1;

        const nameCell = document.createElement("td");
        const nameLabel = document.createElement("span");
        nameLabel.className = "leaderboard-name";
        nameLabel.textContent = getDisplayName(entry, "Player " + (index + 1));
        nameCell.appendChild(nameLabel);

        const timeCell = document.createElement("td");
        timeCell.textContent = formatLeaderboardTime(getTime(entry));

        const scoreCell = document.createElement("td");
        scoreCell.textContent = Math.floor(getScore(entry));

        const frogsCell = document.createElement("td");
        const frogs = getFrogs(entry);
        frogsCell.textContent = frogs != null ? frogs : "—";

        const buildCell = document.createElement("td");
        buildCell.textContent = getBuildSnippet(entry);

        [rankCell, nameCell, timeCell, scoreCell, frogsCell, buildCell].forEach((cell) => {
          cell.classList.add("leaderboard-cell");
        });

        row.appendChild(rankCell);
        row.appendChild(nameCell);
        row.appendChild(timeCell);
        row.appendChild(scoreCell);
        row.appendChild(frogsCell);
        row.appendChild(buildCell);

        return row;
      }

      function renderPage(pageIndex) {
        currentPage = Math.max(0, Math.min(pageIndex, Math.ceil(list.length / pageSize) - 1));

        const table = document.createElement("table");
        table.className = "leaderboard-table";

        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        const headers = ["#", "Player", "Time", "Score", "Frogs", "Build Snapshot"];
        headers.forEach((label) => {
          const th = document.createElement("th");
          th.textContent = label;
          th.className = "leaderboard-head-cell";
          headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        const start = currentPage * pageSize;
        const end = Math.min(start + pageSize, list.length);
        for (let i = start; i < end; i++) {
          tbody.appendChild(buildRow(list[i], i));
        }
        table.appendChild(tbody);

        const pager = document.createElement("div");
        pager.className = "leaderboard-pager";

        const prevBtn = document.createElement("button");
        prevBtn.textContent = "◀ Prev";
        prevBtn.className = "frog-btn frog-btn-secondary leaderboard-page-btn";
        prevBtn.disabled = currentPage === 0;
        prevBtn.addEventListener("click", () => renderPage(currentPage - 1));

        const nextBtn = document.createElement("button");
        nextBtn.textContent = "Next ▶";
        nextBtn.className = "frog-btn frog-btn-secondary leaderboard-page-btn";
        nextBtn.disabled = end >= list.length;
        nextBtn.addEventListener("click", () => renderPage(currentPage + 1));

        const pageInfo = document.createElement("div");
        pageInfo.className = "leaderboard-page-info";
        pageInfo.textContent = `Showing ${start + 1}–${end} of ${list.length}`;

        pager.appendChild(prevBtn);
        pager.appendChild(pageInfo);
        pager.appendChild(nextBtn);

        const legend = document.createElement("div");
        legend.className = "leaderboard-legend";
        legend.textContent = "Top 50 runs · 10 per page · your tag highlights in green";

        const header = document.createElement("div");
        header.className = "leaderboard-header";
        header.innerHTML =
          '<div class="leaderboard-title">Global leaderboard</div>' +
          '<div class="leaderboard-subtitle">Fresh pulls may lag a few seconds after a run posts.</div>';

        content.innerHTML = "";
        content.appendChild(header);
        content.appendChild(table);
        content.appendChild(pager);
        content.appendChild(legend);
      }

      renderPage(currentPage);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
      content.innerHTML = '<div class="leaderboard-error">Failed to load leaderboard.</div>';
    }

    leaderboardOverlay.style.display = "flex";
  }

  function hideLeaderboardOverlay() {
    if (leaderboardOverlay) {
      leaderboardOverlay.style.display = "none";
    }
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
  🌈 <b>Aura</b> – nearby frogs get bonus speed and jump height in a radius around this frog.<br>
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
  🐸⭐ <b>Frog Promotion (epic)</b> – summons multiple frogs, each with a random permanent role.<br>
  🍖 <b>Cannibal Frog (epic)</b> – spawns a cannibal frog that eats nearby frogs and buffs global deathrattle while alive.<br>
  💫 <b>Orb Storm / Snake Egg (epic)</b> – high-impact utilities that affect orb spawns or the next snake after a shed.<br><br>
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

    choices.forEach((choice) => {
      const btn = document.createElement("button");
      const colorClass = getUpgradeColorClass(choice.id);
      btn.className = "frog-btn frog-upgrade-choice " + colorClass;
      btn.dataset.upgradeId = choice.id;
      btn.innerHTML = `
        <div class="frog-upgrade-desc">${choice.label}</div>
      `;
      btn.addEventListener("click", () => selectUpgrade(choice));
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
    initUpgradeOverlay();
    upgradeOverlayContext = opts.context || "mid";

    if (upgradeOverlaySubEl) {
      if (upgradeOverlayContext === "start") {
        upgradeOverlaySubEl.textContent = "Pick your first upgrade before the run begins.";
      } else {
        upgradeOverlaySubEl.textContent = "Pick one upgrade to apply to your frogs.";
      }
    }

    populateUpgradeOverlayChoices(mode);
    updateUpgradeBuffSummary();

    gamePaused = true;
    if (upgradeOverlay) {
      upgradeOverlay.style.display = "flex";
    }
  }

  function openFirstUpgradeSelection() {
    openUpgradeOverlay("normal", { context: "start" });
  }

  function startNewRun() {
    hideMainMenu();
    stopMainMenuBackground();
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
    if (upgradeOverlay) {
      upgradeOverlay.style.display = "none";
    }
    gamePaused = false;

    // --- schedule next timers based on what we just picked ---
    if (!initialUpgradeDone && currentUpgradeOverlayMode === "normal") {
      // First-ever normal upgrade at game start
      initialUpgradeDone = true;
      nextPermanentChoiceTime = elapsedTime + 60;
    } else {
      if (currentUpgradeOverlayMode === "normal") {
        // Any regular normal upgrade (including the one that happens at epic marks)
        nextPermanentChoiceTime = elapsedTime + 60;
      } else if (currentUpgradeOverlayMode === "epic") {
        // Epic picked: next epic in 3 minutes
        nextEpicChoiceTime = elapsedTime + 180;
        // NOTE: we do NOT touch nextPermanentChoiceTime here; it was already
        // set when the normal half of the chain closed.
      }
    }

    // --- epic chain: if we hit an epic mark, go normal -> epic back-to-back ---
    if (epicChainPending && currentUpgradeOverlayMode === "normal") {
      epicChainPending = false;
      // Immediately show the EPIC choices now that the player picked a normal one
      openUpgradeOverlay("epic");
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
    gameOver = true;

    lastRunTime  = elapsedTime;
    lastRunScore = score;

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
      openScoreboardOverlay(topList, lastRunScore, lastRunTime, finalStats, {
        onPlayAgain: () => {
          hideGameOver();
          startNewRun();
        },
        onReturnToMenu: () => {
          hideGameOver();
          showMainMenu();
        },
      });
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

    // Reset upgrade timing
    // Reset upgrade timing / sheds
    // Reset upgrade timing / sheds
    initialUpgradeDone       = false;
    nextPermanentChoiceTime  = 60;
    nextEpicChoiceTime       = 180;
    legendaryEventTriggered  = false;
    orbSpecialistActive      = false; 

    snakeShedStage           = 0;
    snakeShedCount           = 0;
    nextShedTime             = SHED_INTERVAL;
    dyingSnakes              = [];

    snakeEggPending          = false;
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
    hideScoreboardOverlay();

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

    // Shed skins fade out even while paused
    updateDyingSnakes(dt);

    if (!gameOver && !gamePaused) {
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
    ensureInfoOverlay();  // unified info panel

    const topList = await fetchLeaderboard();
    if (topList) {
      updateMiniLeaderboard(topList);
      infoLeaderboardData = topList;
    } else {
      infoLeaderboardData = [];
    }

    // Wait on the main menu before starting a run
    showMainMenu();
  }

  window.addEventListener("load", startGame);
})();
