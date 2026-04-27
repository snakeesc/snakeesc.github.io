// arcade-data.js
// Static reference data + mock leaderboard for the arcade preview.
// In production, leaderboard rows would come from the Cloudflare worker.

(function () {
  "use strict";

  // ------------------------------------------------------------
  // MOCK LEADERBOARD
  // ------------------------------------------------------------
  // Mirrors the shape your worker returns; replace with real fetch
  // when integrating with the production leaderboard.
  const MOCK_LEADERBOARD = [
    { tag: "VoidNewt",   bestScore: 9842, bestTime: 7864, frogs: 100, userId: "u01" },
    { tag: "SkyLeap",    bestScore: 8911, bestTime: 6502, frogs: 88,  userId: "u02" },
    { tag: "OrbWeaver",  bestScore: 8104, bestTime: 5635, frogs: 84,  userId: "u03" },
    { tag: "OrbLord",    bestScore: 7220, bestTime: 4321, frogs: 71,  userId: "me", isMe: true },
    { tag: "NeonRib",    bestScore: 6502, bestTime: 3513, frogs: 66,  userId: "u05" },
    { tag: "JadeBolt",   bestScore: 6190, bestTime: 3078, frogs: 64,  userId: "u06" },
    { tag: "MossRunner", bestScore: 5840, bestTime: 2822, frogs: 58,  userId: "u07" },
    { tag: "PixelHop",   bestScore: 5510, bestTime: 2611, frogs: 55,  userId: "u08" },
    { tag: "GhostPad",   bestScore: 5102, bestTime: 2402, frogs: 52,  userId: "u09" },
    { tag: "FluxHop",    bestScore: 4880, bestTime: 2210, frogs: 49,  userId: "u10" },
    { tag: "TideSkip",   bestScore: 4622, bestTime: 2055, frogs: 47,  userId: "u11" },
    { tag: "BogFlip",    bestScore: 4380, bestTime: 1893, frogs: 44,  userId: "u12" },
    { tag: "DewHop",     bestScore: 4101, bestTime: 1742, frogs: 42,  userId: "u13" },
    { tag: "EchoFrog",   bestScore: 3922, bestTime: 1605, frogs: 39,  userId: "u14" },
    { tag: "RuneSkip",   bestScore: 3650, bestTime: 1488, frogs: 36,  userId: "u15" },
    { tag: "Croaker",    bestScore: 3402, bestTime: 1322, frogs: 33,  userId: "u16" },
    { tag: "Skitter",    bestScore: 3150, bestTime: 1201, frogs: 31,  userId: "u17" },
    { tag: "MarshKid",   bestScore: 2902, bestTime: 1080, frogs: 28,  userId: "u18" },
    { tag: "LunarDrift", bestScore: 2640, bestTime:  955, frogs: 26,  userId: "u19" },
    { tag: "Hopper",     bestScore: 2401, bestTime:  830, frogs: 24,  userId: "u20" }
  ];

  // ------------------------------------------------------------
  // RECENT RUNS (mock)
  // ------------------------------------------------------------
  const MOCK_RECENT_RUNS = [
    { when: "2h ago",  time: 4321, score: 7220 },
    { when: "5h ago",  time: 2910, score: 5410 },
    { when: "yest.",  time: 3731, score: 6810 },
    { when: "yest.",  time: 1988, score: 3920 },
    { when: "2d ago", time: 3402, score: 5220 }
  ];

  // ------------------------------------------------------------
  // UPGRADE CHOICES (sample, for the preview pop-up)
  // ------------------------------------------------------------
  const SAMPLE_UPGRADE_CHOICES = [
    {
      id: "mutation",
      title: "MUTATION",
      desc: "+10% jump speed, +10% jump height",
      category: "mobility"
    },
    {
      id: "ouroboros",
      title: "OUROBOROS PACT",
      desc: "dead frogs may drop an orb",
      category: "survival"
    },
    {
      id: "orbCollector",
      title: "ORB COLLECTOR",
      desc: "collected orbs may spawn frogs",
      category: "orb"
    }
  ];

  // ------------------------------------------------------------
  // BUFF GUIDE (mirrors index.html structure)
  // ------------------------------------------------------------
  const BUFF_GUIDE = {
    regular: [
      { title: "Spawn Frogs",      desc: "spawn frogs instantly",                            category: "mobility" },
      { title: "Orb Whisperer",    desc: "orbs linger longer before fading",                 category: "orb" },
      { title: "Ouroboros Pact",   desc: "dead frogs have a chance to drop an orb",          category: "survival" },
      { title: "Mutation",         desc: "+10% jump speed and +10% jump height",             category: "mobility" },
      { title: "Buffs Last Longer", desc: "increases buff duration",                         category: "buff" },
      { title: "More Orbs Over Time", desc: "faster orb spawns",                             category: "orb" },
      { title: "Deathrattle",      desc: "dead frogs can respawn",                           category: "survival" },
      { title: "Orb Collector",    desc: "collected orbs can spawn extra frogs",             category: "orb" },
      { title: "Last Stand",       desc: "your last frog gets a strong revive chance",       category: "survival" }
    ],
    epic: [
      { title: "Spawn Frogs",      desc: "spawn a large frog wave instantly",                category: "mobility" },
      { title: "Deathrattle",      desc: "big boost to revive chance",                       category: "survival" },
      { title: "Buffs Extended",   desc: "larger buff duration increase",                    category: "buff" },
      { title: "Orb Storm",        desc: "drops a burst of random orbs immediately",         category: "orb" },
      { title: "Snake Egg",        desc: "weakens the speed gain on the next shed",          category: "survival" },
      { title: "Grave Wave",       desc: "each shed summons ghost frogs",                    category: "role" },
      { title: "Orb Specialist",   desc: "orbs always spawn 1 frog; collector can add more", category: "orb" },
      { title: "Frog Scatter",     desc: "kill and respawn all current frogs",               category: "role" },
      { title: "Pair of Scissors", desc: "splits the snake into two slower snakes",          category: "survival" }
    ]
  };

  // ------------------------------------------------------------
  // ACTIVE STATS (mock — what would appear during a run)
  // ------------------------------------------------------------
  const SAMPLE_ACTIVE_STATS = [
    { name: "MUTATION",     val: "×3",  detail: "+30%", category: "mobility" },
    { name: "OUROBOROS",    val: "×1",  detail: "5%",   category: "survival" },
    { name: "ORB COLLECT",  val: "×2",  detail: "40%",  category: "orb" }
  ];

  const SAMPLE_TEMP_BUFFS = [
    { name: "SHIELD", remainingPct: 60 }
  ];

  // ------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------
  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) {
      return h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    }
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function formatScore(score) {
    return Number(score || 0).toLocaleString();
  }

  // ------------------------------------------------------------
  // EXPORT
  // ------------------------------------------------------------
  window.ArcadeData = {
    MOCK_LEADERBOARD,
    MOCK_RECENT_RUNS,
    SAMPLE_UPGRADE_CHOICES,
    BUFF_GUIDE,
    SAMPLE_ACTIVE_STATS,
    SAMPLE_TEMP_BUFFS,
    formatTime,
    formatScore
  };
})();
