// frog-profanity.js — Tag normalization + blocklist (keep in sync with cloudflare/leaderboard-worker.js)
(function () {
  "use strict";

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

  const BLOCK = (function () {
    const s = new Set();
    for (const w of BLOCKLIST_RAW) {
      const t = w.toLowerCase();
      if (t.length >= 3) s.add(t);
    }
    // Short roots only when unambiguous (avoid "ass" alone — hits "glass", etc.)
    const SHORT = ["kkk", "cp", "kys", "fuq"];
    for (const x of SHORT) s.add(x);
    return s;
  })();

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
      "|": "i",
    };

    const lower = String(str).toLowerCase();
    let out = "";
    for (let i = 0; i < lower.length; i++) {
      const ch = lower[i];
      if (map[ch] !== undefined) {
        out += map[ch];
      } else if (/[a-z0-9]/.test(ch)) {
        out += ch;
      }
    }
    return out;
  }

  function isProfaneTag(tag) {
    if (!tag) return false;
    const norm = normalizeForProfanity(tag);
    if (!norm || norm.length < 2) return false;

    for (const bad of BLOCK) {
      if (norm.includes(bad)) return true;
    }
    return false;
  }

  window.FrogProfanity = {
    normalizeForProfanity,
    isProfaneTag,
  };
})();
