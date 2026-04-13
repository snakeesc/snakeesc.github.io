// frog-game-config.js
// Centralized configuration and constants for the Frog Snake survival game.

(function () {
  "use strict";

  /** Arcade-style tags (2–12 chars, letters only) — matches worker `makeRandomTag`. */
  const ARCADE_TAG_SINGLES = [
    "Hopper", "OrbLord", "MossRunner", "FrogStack", "Skitter", "Croaker", "LilyPad",
    "NeonRib", "VoidNewt", "SwampKid", "DewHop", "BogFlip", "FenLeap", "RuneSkip",
    "JadeBolt", "SkyLeap", "NeoGlow", "EchoFrog", "StarPad", "GloomHop", "VexRib",
    "PikeRun", "MireHop", "CobDrift", "FluxHop", "TideSkip", "WolfPad", "NovaRun",
    "Ripple", "MarshKid", "OrbWeaver", "GhostPad", "PixelHop", "SolarSkip", "LunarDrift"
  ];

  const ARCADE_TAG_LEADS = [
    "Orb", "Moss", "Frog", "Lily", "Swamp", "Pond", "Dew", "Neo", "Void", "Star",
    "Echo", "Rune", "Jade", "Bolt", "Flux", "Tide", "Reed", "Bog", "Fen", "Mire",
    "Cob", "Pike", "Wisp", "Vex", "Nova", "Lunar", "Solar", "Pixel", "Frost", "Gloom",
    "Wolf", "Sky", "Iris", "Byte", "Drift", "Marsh", "Ripple", "Ghost", "Gold", "Silver"
  ];

  const ARCADE_TAG_TRAILS = [
    "Lord", "Runner", "Stack", "Hopper", "Skipper", "Drifter", "Nomad", "Seeker",
    "Dodger", "Weaver", "Jumper", "Croaker", "Ribbit", "Flipper", "Scout", "Ranger",
    "Warden", "Sprite", "Prince", "Slayer", "Keeper", "Legend", "Whisper", "Chaser",
    "Hunter", "Walker", "Striker", "Pilot", "Rogue", "Master", "Guide", "Glimmer",
    "Stalker", "Spark", "Slinger", "Rider", "Caller", "Breaker", "Maker", "Fang"
  ];

  const TAG_MAX_LEN = 12;
  const TAG_MIN_LEN = 2;

  function fnv1a32(str) {
    let h = 2166136261;
    const s = String(str || "");
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function buildArcadeCompoundPool() {
    const out = [];
    const seen = new Set();
    for (const a of ARCADE_TAG_LEADS) {
      for (const b of ARCADE_TAG_TRAILS) {
        const t = a + b;
        if (t.length >= 4 && t.length <= TAG_MAX_LEN && !seen.has(t)) {
          seen.add(t);
          out.push(t);
        }
      }
    }
    return out;
  }

  const ARCADE_DISPLAY_POOL = (function () {
    const singles = ARCADE_TAG_SINGLES.filter(
      (s) => s.length >= TAG_MIN_LEN && s.length <= TAG_MAX_LEN
    );
    return singles.concat(buildArcadeCompoundPool());
  })();

  /**
   * Random tag for first-time players (no trailing digits unless retries fail).
   * Same algorithm as Cloudflare worker `makeRandomTag`.
   */
  function generateArcadePlayerTag() {
    const singles = ARCADE_TAG_SINGLES.filter(
      (s) => s.length >= TAG_MIN_LEN && s.length <= TAG_MAX_LEN
    );

    for (let attempt = 0; attempt < 80; attempt++) {
      const roll = Math.random();
      if (roll < 0.38 && singles.length) {
        const s = singles[Math.floor(Math.random() * singles.length)];
        if (s) return s;
      }
      const a = ARCADE_TAG_LEADS[Math.floor(Math.random() * ARCADE_TAG_LEADS.length)];
      const b = ARCADE_TAG_TRAILS[Math.floor(Math.random() * ARCADE_TAG_TRAILS.length)];
      const tag = a + b;
      if (tag.length >= 4 && tag.length <= TAG_MAX_LEN) return tag;
    }

    const shortLeads = ["Orb", "Neo", "Jade", "Moss", "Frog", "Lily", "Void", "Star"];
    const shortTrails = ["Lord", "Run", "Hop", "Pad", "Rib", "Rex", "Kid", "Fox"];
    for (let i = 0; i < 30; i++) {
      const a = shortLeads[Math.floor(Math.random() * shortLeads.length)];
      const b = shortTrails[Math.floor(Math.random() * shortTrails.length)];
      const tag = a + b;
      if (tag.length >= TAG_MIN_LEN && tag.length <= TAG_MAX_LEN) return tag;
    }

    const suffix = String(Math.floor(Math.random() * 10));
    const base = "Hopper";
    return (base + suffix).slice(0, TAG_MAX_LEN);
  }

  function scoreHint(entry) {
    if (!entry || typeof entry !== "object") return 0;
    const keys = ["bestScore", "score"];
    for (const k of keys) {
      if (!(k in entry)) continue;
      let v = entry[k];
      if (typeof v === "string") v = parseFloat(v);
      if (typeof v === "number" && isFinite(v)) return v;
    }
    return 0;
  }

  function timeHint(entry) {
    if (!entry || typeof entry !== "object") return 0;
    const keys = ["bestTime", "time", "seconds", "duration"];
    for (const k of keys) {
      if (!(k in entry)) continue;
      let v = entry[k];
      if (typeof v === "string") v = parseFloat(v);
      if (typeof v === "number" && isFinite(v)) return v;
    }
    return 0;
  }

  /**
   * Deterministic “arcade” name for rows with no real tag (or legacy "Frog" placeholder).
   */
  function leaderboardPlaceholderName(entry, rank) {
    const r = Math.max(1, Math.floor(Number(rank) || 1));
    const seed = [
      entry && entry.userId,
      r,
      scoreHint(entry),
      timeHint(entry)
    ].join(":");
    if (!ARCADE_DISPLAY_POOL.length) return "Hopper";
    const idx = fnv1a32(seed) % ARCADE_DISPLAY_POOL.length;
    return ARCADE_DISPLAY_POOL[idx];
  }

  const config = {
    TAG_STORAGE_KEY: "frogSnake_username",
    FROG_SIZE: 48,
    MAX_TOKEN_ID: 4040,
    META_BASE: "https://freshfrogs.github.io/frog/json/",
    META_EXT: ".json",
    BUILD_BASE: "./images/build_files",
    FROG_FOLDER: "./images/build_files/Frog/",
    FROG_FILES: [
      "frog_00.png",
      "frog_01.png",
      "frog_02.png",
      "frog_03.png",
      "frog_04.png",
      "frog_05.png",
      "frog_06.png",
      "frog_07.png",
      "frog_08.png",
      "frog_09.png",
      "frog_10.png",
      "frog_11.png",
      "frog_12.png",
      "frog_13.png",
      "frog_14.png",
      "frog_15.png",
      "frog_16.png"
    ],
    STARTING_FROGS: 50,
    MAX_FROGS: 100,
    ORB_RADIUS: 12,
    ORB_TTL: 22,
    ORB_SPAWN_INTERVAL_MIN: 2.50,
    ORB_SPAWN_INTERVAL_MAX: 6.50,
    SNAKE_SEGMENT_SIZE: 48,
    SNAKE_EGG_HATCH_CHANCE: 0.5, // egg hatch chance
    SNAKE_BASE_SPEED: 45,
    SNAKE_TURN_RATE: Math.PI * 0.75,
    // Default spacing for snake segments (in path samples) before clamping.
    // Lowered to keep body segments tighter across devices.
    SNAKE_SEGMENT_GAP: 32,
    SNAKE_INITIAL_SEGMENTS: 12,
    SNAKE_EAT_RADIUS_BASE: 38,
    SNAKE_EGG_BUFF_PCT: 1.15,
    SNAKE_TURN_RATE_BASE: Math.PI * 0.75,
    SNAKE_TURN_RATE_CAP: Math.PI * 1.75,
    SPEED_BUFF_DURATION: 10,
    JUMP_BUFF_DURATION: 10,
    SNAKE_SLOW_DURATION: 10,
    SNAKE_CONFUSE_DURATION: 10,
    SNAKE_SHRINK_DURATION: 10,
    FROG_SHIELD_DURATION: 10,
    TIME_SLOW_DURATION: 10,
    ORB_MAGNET_DURATION: 10,
    SCORE_MULTI_DURATION: 20,
    PANIC_HOP_DURATION: 7,
    CLONE_SWARM_DURATION: 1,
    LIFE_STEAL_DURATION: 8,
    PERMA_LIFESTEAL_ORB_COUNT: 20,
    SPEED_BUFF_FACTOR: 0.85,
    PANIC_HOP_SPEED_FACTOR: 0.80,
    JUMP_BUFF_FACTOR: 1.75,
    SNAKE_SLOW_FACTOR: 0.75,
    TIME_SLOW_FACTOR: 0.5,
    FRENZY_SPEED_FACTOR: 1.25,
    SCORE_MULTI_FACTOR: 2.0,
    CHAMPION_SPEED_FACTOR: 0.85,
    CHAMPION_JUMP_FACTOR: 1.15,
    AURA_JUMP_FACTOR: 1.10,
    AURA_SPEED_FACTOR: 0.90,
    LUCKY_BUFF_DURATION_BOOST: 1.50,
    LUCKY_SCORE_BONUS_PER: 0.15,
    CANNIBAL_EAT_CHANCE: 0.10,
    FROG_SPEED_UPGRADE_FACTOR: 0.93,
    FROG_JUMP_UPGRADE_FACTOR: 1.20,
    BUFF_DURATION_UPGRADE_FACTOR: 1.15,
    ORB_INTERVAL_UPGRADE_FACTOR: 0.95,
    ORB_COLLECTOR_CHANCE: 0.20,
    TOTAL_HIGHLIGHT_COLOR: "#ffb347",
    MIN_FROG_SPEED_FACTOR: 0.70,
    MAX_FROG_JUMP_FACTOR: 2.00,
    MAX_BUFF_DURATION_FACTOR: 1.50,
    MIN_ORB_SPAWN_INTERVAL_FACTOR: 0.90,
    MAX_DEATHRATTLE_CHANCE: 0.20,
    MAX_ORB_COLLECTOR_TOTAL: 1.0,
    SNAKE_SHED_SPEEDUP: 1.50,
    MIN_TOTAL_FROG_SPEED_FACTOR: 0.75,
    MAX_TOTAL_FROG_JUMP_FACTOR: 2.20,
    MAX_SNAKE_SEGMENTS: 100,
    CANNIBAL_ROLE_CHANCE: 0.05,
    ORB_STORM_COUNT: 10,
    NORMAL_SPAWN_AMOUNT: 15,
    EPIC_SPAWN_AMOUNT: 30,
    LEGENDARY_SPAWN_AMOUNT: 30,
    COMMON_DEATHRATTLE_CHANCE: 0.05,
    EPIC_DEATHRATTLE_CHANCE: 0.10,
    LEGENDARY_DEATHRATTLE_CHANCE: 0.2,
    GRAVE_WAVE_MIN_GHOSTS: 10,
    GRAVE_WAVE_MAX_GHOSTS: 20,
    LEGENDARY_BUFF_DURATION_FACTOR: 2.0,
    LAST_STAND_MIN_CHANCE: 0.35,
    LEGENDARY_EVENT_TIME: 600,
    SHED_INTERVAL: 180,
    MAIN_MENU_BACKGROUND_ENABLED: false,
    SCATTER_ANIMATED_VALUES: new Set([
      "goldenDartFrog",
      "blueDartFrog",
      "blueTreeFrog",
      "brownTreeFrog",
      "redEyedTreeFrog",
      "tongueSpiderRed",
      "tongueSpider",
      "tongueFly",
      "croaking",
      "peace",
      "inversedEyes",
      "closedEyes",
      "thirdEye",
      "mask",
      "smoking",
      "smokingCigar",
      "smokingPipe",
      "circleShadesRed",
      "circleShadesPurple",
      "shades",
      "shadesPurple",
      "shadesThreeD",
      "shadesWhite",
      "circleNightVision",
      "yellow",
      "blue(2)",
      "blue",
      "cyan",
      "brown",
      "silverEthChain",
      "goldDollarChain"
    ]),
    SKIP_TRAITS: new Set(["Background", "background", "BG", "Bg"]),
    AURA_RADIUS: 200
  };

  config.AURA_RADIUS2 = config.AURA_RADIUS * config.AURA_RADIUS;

  config.generateArcadePlayerTag = generateArcadePlayerTag;
  config.leaderboardPlaceholderName = leaderboardPlaceholderName;

  window.FrogGameConfig = config;
})();
