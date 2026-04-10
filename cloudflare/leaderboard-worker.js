// worker.js — Escape the Snake leaderboard (deploy to Cloudflare Workers)
// Optimized: GET never writes, summary updated in-place, no redundant normalizations.
// Random tags: same algorithm as frog-game-config.js `generateArcadePlayerTag`.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const LEADERBOARD_KEY = "leaderboard";
const SUMMARY_KEY     = "summary:global";
const MAX_ENTRIES     = 50;
const RECENT_RUNS_KEY = "recent-runs:global";
const MAX_RECENT_RUNS = 100;

// --- Random tag (must match client `generateArcadePlayerTag`) ---
const TAG_MAX_LEN = 12;
const TAG_MIN_LEN = 2;

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

function makeRandomTag() {
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

// --------------------------------------------------
// ROUTING
// --------------------------------------------------
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (url.pathname === "/leaderboard") {
      if (request.method === "GET")  return cors(await getLeaderboard(request, env));
      if (request.method === "POST") return cors(await submitScore(request, env));
    }

    if (url.pathname === "/updates-summary" && request.method === "GET") {
      return cors(await getUpdatesSummary(env));
    }

    if (url.pathname === "/recent-runs") {
      if (request.method === "GET")  return cors(await getRecentRuns(env));
      if (request.method === "POST") return cors(await submitRecentRun(request, env));
    }

    return new Response("Not found", { status: 404 });
  },
};

function cors(response) {
  const h = new Headers(response.headers);
  for (const [k, v] of Object.entries(CORS)) h.set(k, v);
  return new Response(response.body, { status: response.status, headers: h });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// --------------------------------------------------
// KV HELPERS  (2 helpers, used everywhere)
// --------------------------------------------------
async function loadLeaderboard(env) {
  const raw = await env.FROG_SCORES.get(LEADERBOARD_KEY);
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}

async function saveLeaderboard(env, list) {
  await env.FROG_SCORES.put(LEADERBOARD_KEY, JSON.stringify(list));
}

async function loadSummary(env) {
  const raw = await env.FROG_SCORES.get(SUMMARY_KEY);
  if (!raw) return { totalUsers: 0, totalRuns: 0, totalPlaytime: 0, totalFrogsEaten: 0, totalScore: 0 };
  try {
    const p = JSON.parse(raw);
    return {
      totalUsers:      p.totalUsers      || 0,
      totalRuns:       p.totalRuns       || 0,
      totalPlaytime:   p.totalPlaytime   || 0,
      totalFrogsEaten: p.totalFrogsEaten || 0,
      totalScore:      p.totalScore      || 0,
    };
  } catch {
    return { totalUsers: 0, totalRuns: 0, totalPlaytime: 0, totalFrogsEaten: 0, totalScore: 0 };
  }
}

async function saveSummary(env, s) {
  await env.FROG_SCORES.put(SUMMARY_KEY, JSON.stringify(s));
}

// --------------------------------------------------
// TAG HELPERS
// --------------------------------------------------
function normalizeTag(tag) {
  return typeof tag === "string" ? tag.trim().toLowerCase() : "";
}

function sanitizeTag(tag) {
  if (typeof tag !== "string") return null;
  const c = tag.trim().replace(/\s+/g, " ");
  return c || null;
}

function isValidTagShape(tag) {
  return /^[a-zA-Z0-9 _-]{2,12}$/.test(tag);
}

// --- Profanity filter (keep in sync with frog-profanity.js) ---
const BLOCKLIST_RAW = `
fuck fuk fvck fux fck fcuk fukc fuq motherfuck mthrfck mfer mfing fuckoff fukoff fuckyou fukyou fku
shit sht shiit bullshit shithead
bitch bich biatch b1tch bitchy
cunt cnt kunt
asshole assh0le arsehole asshat assbag
dick d1ck dik dickhead dicksuck dickbag
cock c0ck cok cocksuck
pussy pusy pussi
slut slvt slt
whore wh0re whre hoe h0e thot
bastard bstrd
piss p1ss pissoff
nigger nigga n1gger n1gga nig nigg nibba niber niglet nogger
faggot fagot fag fags fagg fgt
retard retards ritard tard tarded mongoloid
kike kikes kyke heeb
spic sp1c spik spics
chink ch1nk chinks chingchong
gook g00k gooks
coon c00n
rape rapist raping raped raper rapeme r4pe rap3
molest molested molester
pedo paedo pedoph paedoph lolicon lolic0n shota shotacon
cp childporn cporn
necro necroph necrophil
incest inc3st
bestial zoophil
killyourself kys killself suicide hangself neckrope ropeyourself
terror terrorist terrorism bomber bombing bomb b0mb
schoolshoot massshoot shootup
hitler h1tler hitlr goebbels mussolini
nazi n4zi naz1 n4z1 nazis
holocaust holohoax gaschamber zyklon genocide
kkk klan lynch
isis daesh taliban osama jihad j1had infidel kafir
allahu
wetback beaner beener spic
raghead towelhead sandnig cameljockey
porchmonkey junglebunny pickaninny picaninny
zipperhead slanteye
nig nog jigaboo jiggaboo
tranny trann trannie shemale sheman ladyboy
dyke dykes lesbo lezbo
cum cumslut cumshot cumming cummin
jizz j1zz jiz splooge
blowjob blowme suckit suckmy suckme deepthroat handjob
anal an4l anus butthole buttplug ballsack nutsack
penis p3nis vagina vajay clitoris testicle scrotum
ejaculate masturbat orgasm orgasim
porn p0rn pr0n xxx nsfw nudes nude nudity naked
hentai rule34 onlyfans fansly
escort hooker prostitut milf dilf gilf
gangbang bukkake fetish bondage
orgy orgies
groomer grooming predator predatory
noncon forced strangle choked
snuff goreporn
meth heroin cocaine crackpipe
cutter cutting selfharm bleedout
lolita l0lita
gooner coomer
1488 14words bloodhonor
fisted fisting
necroph zoophile bestiality
murderu killu kilu
stfu gtfo gfy gfys
`.trim().split(/\s+/).filter(Boolean);

const PROFANITY_BLOCK = (function () {
  const s = new Set();
  for (const w of BLOCKLIST_RAW) {
    const t = w.toLowerCase();
    if (t.length >= 3) s.add(t);
  }
  for (const x of ["kkk", "cp", "kys", "fuq"]) s.add(x);
  return s;
})();

function normalizeForProfanity(str) {
  const map = {
    "0": "o", "1": "i", "2": "z", "3": "e", "4": "a", "5": "s",
    "6": "g", "7": "t", "8": "b", "9": "g", "@": "a", "$": "s",
    "!": "i", "+": "t", "|": "i",
  };
  const lower = String(str).toLowerCase();
  let out = "";
  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i];
    if (map[ch] !== undefined) out += map[ch];
    else if (/[a-z0-9]/.test(ch)) out += ch;
  }
  return out;
}

function isProfane(tag) {
  const norm = normalizeForProfanity(tag);
  if (!norm || norm.length < 2) return false;
  for (const bad of PROFANITY_BLOCK) {
    if (norm.includes(bad)) return true;
  }
  return false;
}

function collectUsedTags(rawList) {
  const used = new Set();
  for (const raw of Array.isArray(rawList) ? rawList : []) {
    if (!raw || typeof raw !== "object") continue;
    const st = sanitizeTag(raw.tag);
    const key = normalizeTag(st || "");
    if (key) used.add(key);
  }
  return used;
}

function hashToAlnum(seed, len) {
  let h = 2166136261;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  let x = h >>> 0;
  for (let j = 0; j < len; j++) {
    x = Math.imul(x, 1103515245) + 12345 >>> 0;
    out += chars[x % 36];
  }
  return out;
}

/** Unique tag vs current KV rows; rejects profanity; falls back to Hop + hash suffix. */
function assignUniqueTag(usedTags, userId) {
  for (let attempt = 0; attempt < 400; attempt++) {
    const candidate = makeRandomTag();
    if (isProfane(candidate)) continue;
    const key = normalizeTag(candidate);
    if (!key) continue;
    if (!usedTags.has(key)) {
      usedTags.add(key);
      return candidate;
    }
  }
  for (let i = 0; i < 200; i++) {
    const suf = hashToAlnum(`${userId}:${i}`, 6);
    const candidate = (`Hop${suf}`).slice(0, TAG_MAX_LEN);
    if (!isValidTagShape(candidate)) continue;
    if (isProfane(candidate)) continue;
    const key = normalizeTag(candidate);
    if (!key) continue;
    if (!usedTags.has(key)) {
      usedTags.add(key);
      return candidate;
    }
  }
  const last = (`Hop${hashToAlnum(userId, 5)}`).slice(0, TAG_MAX_LEN);
  return last;
}

function validateTag(tag) {
  const clean = sanitizeTag(tag);
  if (!clean)                  return { ok: false, error: "invalid_tag", message: "Enter a player tag." };
  if (!isValidTagShape(clean)) return { ok: false, error: "invalid_tag", message: "Tag must be 2-12 chars: letters, numbers, spaces, _ or -." };
  if (isProfane(clean))        return { ok: false, error: "invalid_tag", message: "That tag is not allowed." };
  return { ok: true, cleanedTag: clean };
}

// --------------------------------------------------
// LEADERBOARD HELPERS
// --------------------------------------------------
function sortLeaderboard(list) {
  list.sort((a, b) =>
    b.bestScore !== a.bestScore ? b.bestScore - a.bestScore :
    b.bestTime  !== a.bestTime  ? b.bestTime  - a.bestTime  :
    b.lastUpdated - a.lastUpdated
  );
  return list;
}

// Dedupe by userId, keeping best score per user. Returns sorted, capped list.
function normalizeLeaderboard(list) {
  const byUser = new Map();

  for (const raw of Array.isArray(list) ? list : []) {
    if (!raw || typeof raw.userId !== "string" || !raw.userId.trim()) continue;

    const userId = raw.userId.trim();
    const entry = {
      userId,
      tag:          sanitizeTag(raw.tag) || "Frog",
      bestScore:    Math.max(0, Math.floor(Number(raw.bestScore  || 0))),
      bestTime:     Math.max(0, Number(raw.bestTime   || 0)),
      lastUpdated:  Math.max(0, Number(raw.lastUpdated || 0)),
    };

    const existing = byUser.get(userId);
    if (!existing ||
        entry.bestScore > existing.bestScore ||
        (entry.bestScore === existing.bestScore && entry.bestTime > existing.bestTime)) {
      byUser.set(userId, entry);
    }
  }

  const deduped = Array.from(byUser.values());
  sortLeaderboard(deduped);
  return deduped.slice(0, MAX_ENTRIES);
}

async function hashUserId(request) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const ua = request.headers.get("User-Agent")       || "unknown";
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(ip + "|" + ua));
  return Array.from(new Uint8Array(buf))
    .slice(0, 10)
    .map(b => b.toString(36))
    .join("");
}

// --------------------------------------------------
// GET /leaderboard
// KEY CHANGE: no write-back on read. Pure read = 1 KV op instead of 2.
// --------------------------------------------------
async function getLeaderboard(request, env) {
  const list = normalizeLeaderboard(await loadLeaderboard(env));

  let myEntry = null;
  try {
    const userId = await hashUserId(request);
    const found = list.find(e => e.userId === userId);
    if (found) myEntry = { ...found, isMe: true };
  } catch {}

  return json({ entries: list, myEntry });
}

// --------------------------------------------------
// POST /leaderboard
// KV ops: 1 read (leaderboard) + 1 write (leaderboard) + 1 read (summary) + 1 write (summary) = 4
// Down from 5 — we eliminated the redundant second normalize pass.
// --------------------------------------------------
async function submitScore(request, env) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: "invalid_body", message: "Invalid JSON." }, 400); }

  const { score, time, tag } = body;

  if (typeof score !== "number" || typeof time !== "number") {
    return json({ error: "invalid_body", message: "score and time are required numbers." }, 400);
  }

  const safeScore = Math.max(0, Math.floor(score));
  const safeTime  = Math.max(0, Number(time));

  // Only validate tag if one was actually sent
  let cleanedTag = null;
  if (typeof tag === "string" && tag.trim() !== "") {
    const v = validateTag(tag);
    if (!v.ok) return json({ error: v.error, message: v.message }, 400);
    cleanedTag = v.cleanedTag;
  }

  const userId = await hashUserId(request);

  // --- 1 KV read (full list for tag-uniqueness; then normalize for top 50) ---
  const rawBoard = await loadLeaderboard(env);
  const usedTags = collectUsedTags(rawBoard);
  const leaderboard = normalizeLeaderboard(rawBoard);

  let entry    = leaderboard.find(e => e.userId === userId) || null;
  let isNewUser = !entry;

  // Block tag theft
  if (cleanedTag) {
    const tagKey = normalizeTag(cleanedTag);
    const owner  = leaderboard.find(e => normalizeTag(e.tag) === tagKey);
    if (owner && owner.userId !== userId) {
      return json({ error: "tag_taken", message: "That tag is already in use." }, 409);
    }
  }

  if (!entry) {
    const autoTag = cleanedTag || assignUniqueTag(usedTags, userId);
    entry = { userId, tag: autoTag, bestScore: 0, bestTime: 0, lastUpdated: 0 };
    leaderboard.push(entry);
  }

  if (cleanedTag) entry.tag = cleanedTag;

  const isBetter =
    safeScore > entry.bestScore ||
    (safeScore === entry.bestScore && safeTime > entry.bestTime);

  if (isBetter) {
    entry.bestScore   = safeScore;
    entry.bestTime    = safeTime;
    entry.lastUpdated = Date.now();
  } else if (!entry.lastUpdated) {
    entry.lastUpdated = Date.now();
  }

  sortLeaderboard(leaderboard);
  const trimmed = leaderboard.slice(0, MAX_ENTRIES);

  // --- 1 KV write ---
  await saveLeaderboard(env, trimmed);

  // --- 1 KV read + 1 KV write (summary) ---
  const summary = await loadSummary(env);
  if (isNewUser)  summary.totalUsers    += 1;
  summary.totalRuns       += 1;
  summary.totalPlaytime   += safeTime;
  summary.totalScore      += safeScore;
  // frogsEaten: only add if sent, avoids inflating with 0s
  const frogsEaten = typeof body.stats?.frogsEaten === "number"
    ? Math.max(0, Math.floor(body.stats.frogsEaten)) : 0;
  if (frogsEaten > 0) summary.totalFrogsEaten += frogsEaten;
  await saveSummary(env, summary);

  const myEntry = trimmed.find(e => e.userId === userId);
  return json({
    entries: trimmed,
    myEntry: myEntry ? { ...myEntry, isMe: true } : null,
  });
}

// --------------------------------------------------
// GET /updates-summary
// 1 KV read (leaderboard) + 1 KV read (summary) = 2 ops. No writes.
// --------------------------------------------------
async function getUpdatesSummary(env) {
  const [leaderboard, summary] = await Promise.all([
    loadLeaderboard(env),
    loadSummary(env),
  ]);

  const list = normalizeLeaderboard(leaderboard);

  return json({
    totalUsers:      summary.totalUsers,
    totalRuns:       summary.totalRuns,
    totalPlaytime:   summary.totalPlaytime,
    totalFrogsEaten: summary.totalFrogsEaten,
    totalScore:      summary.totalScore,
    top3:            list.slice(0, 3),
  });
}

// --------------------------------------------------
// GET /recent-runs
// --------------------------------------------------
async function getRecentRuns(env) {
  const raw = await env.FROG_SCORES.get(RECENT_RUNS_KEY);
  let runs = [];
  try { runs = raw ? JSON.parse(raw) : []; } catch {}
  return json({ runs: Array.isArray(runs) ? runs : [] });
}

// --------------------------------------------------
// POST /recent-runs
// --------------------------------------------------
async function submitRecentRun(request, env) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: "invalid_body" }, 400); }

  const { score, time, orbs, frogsLost, sheds, tag } = body;
  if (typeof score !== "number" || typeof time !== "number") {
    return json({ error: "invalid_body" }, 400);
  }

  const raw = await env.FROG_SCORES.get(RECENT_RUNS_KEY);
  let runs = [];
  try { runs = raw ? JSON.parse(raw) : []; } catch {}
  if (!Array.isArray(runs)) runs = [];

  runs.unshift({
    tag:       sanitizeTag(tag) || "Frog",
    score:     Math.max(0, Math.floor(Number(score) || 0)),
    time:      Math.max(0, Number(time) || 0),
    orbs:      Math.max(0, Math.floor(Number(orbs) || 0)),
    frogsLost: Math.max(0, Math.floor(Number(frogsLost) || 0)),
    sheds:     Math.max(0, Math.floor(Number(sheds) || 0)),
    at:        Date.now(),
  });

  await env.FROG_SCORES.put(RECENT_RUNS_KEY, JSON.stringify(runs.slice(0, MAX_RECENT_RUNS)));
  return json({ ok: true });
}
