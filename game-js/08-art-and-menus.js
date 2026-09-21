// Pocket Pixels sprite rendering. Does not change game rules.
(()=>{document.documentElement.style.setProperty("--atlas",`url("${new URL("./game-assets/misc/d80b42a6ab79bcef.webp",document.baseURI).href}")`);
 function decorate(el){if(el.classList.contains("frog-upgrade-choice")&&/orb|ouroboros/i.test(el.querySelector('.frog-upgrade-title')?.textContent||'')){const icon=el.querySelector(".frog-upgrade-emoji");if(icon)icon.style.backgroundPosition="0 100%";}if(el.classList.contains('frog-sprite')){const n=Number(el.dataset.pocketColor||0);el.style.setProperty('--frog-x',(n%4)*100/3+'%');el.style.setProperty('--frog-y',Math.floor(n/4)*100/3+'%')}}
 const obs=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1){decorate(n);n.querySelectorAll('.frog-sprite').forEach(decorate)}})));obs.observe(document.body,{childList:true,subtree:true});document.querySelectorAll('.frog-sprite').forEach(decorate);
 const menu=document.querySelector('#mainMenuOverlay');[[8.5,13.5,0],[18.2,25.5,1],[4.5,48.5,2],[24.5,54.5,3],[12.5,63,0],[6,81,4],[21,82,5]].forEach(([x,y,n])=>{const e=document.createElement('div');e.className='pocket-decor';e.style.cssText=`left:${x}%;top:${y}%;background-position:${n%4*100/3}% ${Math.floor(n/4)*100/3}%`;menu.append(e)});
 const snakeDecor=document.createElement('div');snakeDecor.className='pocket-menu-snake';snakeDecor.innerHTML='<i class="snake-head"></i><i class="snake-body"></i><i class="snake-body"></i><i class="snake-body"></i><i class="snake-tail"></i>';menu.append(snakeDecor);
})();

(()=>{const icons={"bolt": "./game-assets/sprites/upgrade-bolt.svg", "heart": "./game-assets/sprites/upgrade-heart.svg", "clover": "./game-assets/sprites/upgrade-clover.svg", "egg": "./game-assets/sprites/upgrade-egg.svg", "shield": "./game-assets/sprites/upgrade-shield.svg", "star": "./game-assets/sprites/upgrade-star.svg", "scissors": "./game-assets/sprites/upgrade-scissors.svg", "orb": "./game-assets/sprites/upgrade-orb.svg", "bow": "./game-assets/sprites/upgrade-bow.svg", "skull": "./game-assets/sprites/upgrade-skull.svg", "magnet": "./game-assets/sprites/upgrade-magnet.svg", "moon": "./game-assets/sprites/upgrade-moon.svg", "dice": "./game-assets/sprites/upgrade-dice.svg"};window.pocketIcons=icons;function update(){document.querySelectorAll('.frog-upgrade-choice').forEach(card=>{const t=card.querySelector('.frog-upgrade-title')?.textContent||'';const icon=card.querySelector('.frog-upgrade-emoji');if(!icon)return;const key=/champion/i.test(t)?'star':/aura/i.test(t)?'orb':/zombie/i.test(t)?'skull':/necromancer/i.test(t)?'moon':/alchemist/i.test(t)?'egg':/cannibal/i.test(t)?'scissors':/last stand/i.test(t)?'bow':/death|grave/i.test(t)?'skull':/magnet|collector/i.test(t)?'magnet':/night/i.test(t)?'moon':/roll|loaded/i.test(t)?'dice':/egg|yolk/i.test(t)?'egg':/luck|roll|fortune/i.test(t)?'clover':/scissor/i.test(t)?'scissors':/shield|survival/i.test(t)?'shield':/death|life|reviv|last stand/i.test(t)?'heart':/speed|jump|mutation|panic/i.test(t)?'bolt':/orb|ouroboros/i.test(t)?'orb':'star';if(icon.dataset.pixelIcon===key)return;icon.dataset.pixelIcon=key;icon.style.setProperty('background-image',`url("${icons[key]}")`,'important');icon.style.setProperty('background-size','contain');icon.style.setProperty('background-position','center');icon.style.setProperty('background-repeat','no-repeat','important');});}new MutationObserver(update).observe(document.body,{childList:true,subtree:true});update();})();


window.approvedFrogs={"poison":"./game-assets/sprites/approved/frog-poison-toad.png","poison toad":"./game-assets/sprites/approved/frog-poison-toad.png","bull":"./game-assets/sprites/approved/frog-bull.png","bull frog":"./game-assets/sprites/approved/frog-bull.png","crowned": "./game-assets/sprites/approved/frog-crowned.png", "champion": "./game-assets/sprites/approved/frog-champion.png", "aura": "./game-assets/sprites/approved/frog-aura.png", "shield": "./game-assets/sprites/approved/frog-shield.png", "magnet": "./game-assets/sprites/approved/frog-magnet.png", "lucky": "./game-assets/sprites/approved/frog-lucky.png", "zombie": "./game-assets/sprites/approved/frog-zombie.png", "cannibal": "./game-assets/sprites/approved/frog-cannibal.png", "necromancer": "./game-assets/sprites/approved/frog-necromancer.png", "alchemist": "./game-assets/sprites/approved/frog-alchemist.png"};
window.approvedUpgrades={"poison toads":"./game-assets/sprites/approved/frog-poison-toad.png","panic attack":"./game-assets/sprites/approved/upgrade-panic-attack.png","bruised egg":"./game-assets/sprites/approved/upgrade-snake-egg.png","bull frog":"./game-assets/sprites/approved/frog-bull.png","magnet frogs":"./game-assets/sprites/approved/frog-magnet.png","royal apprenticeship":"./game-assets/sprites/approved/upgrade-royal-apprenticeship.png","lingering hex":"./game-assets/sprites/approved/upgrade-lingering-hex.png","lasting legacy":"./game-assets/sprites/approved/upgrade-lasting-legacy.png","brittle scales":"./game-assets/sprites/approved/upgrade-brittle-scales.png","mutation": "./game-assets/sprites/approved/upgrade-mutation.png", "role draft": "./game-assets/sprites/approved/upgrade-role-draft.png", "double yolker": "./game-assets/sprites/approved/upgrade-double-yolker.png", "spawn frogs": "./game-assets/sprites/approved/upgrade-spawn-frogs.png", "orb flow": "./game-assets/sprites/approved/upgrade-orb-flow.png", "orb whisperer": "./game-assets/sprites/approved/upgrade-orb-whisperer.png", "ouroboros pact": "./game-assets/sprites/approved/upgrade-ouroboros-pact.png", "luck": "./game-assets/sprites/approved/upgrade-luck.png", "deathrattle": "./game-assets/sprites/approved/upgrade-deathrattle.png", "last stand": "./game-assets/sprites/approved/upgrade-last-stand.png", "survival instinct": "./game-assets/sprites/approved/upgrade-survival-instinct.png", "lucky roll": "./game-assets/sprites/approved/upgrade-lucky-roll.png", "pair of scissors": "./game-assets/sprites/approved/upgrade-pair-of-scissors.png", "orb storm": "./game-assets/sprites/approved/upgrade-orb-storm.png", "chain reaction": "./game-assets/sprites/approved/upgrade-chain-reaction.png", "snake egg": "./game-assets/sprites/approved/upgrade-snake-egg.png", "loaded hand": "./game-assets/sprites/approved/upgrade-loaded-hand.png", "night bloom": "./game-assets/sprites/approved/upgrade-night-bloom.png", "tidal wave": "./game-assets/sprites/approved/upgrade-tidal-wave.png", "epic deathrattle": "./game-assets/sprites/approved/upgrade-epic-deathrattle.png", "orb specialist": "./game-assets/sprites/approved/upgrade-orb-specialist.png", "second wind": "./game-assets/sprites/approved/upgrade-second-wind.png", "grave wave": "./game-assets/sprites/approved/upgrade-grave-wave.png", "poisonous skin": "./game-assets/sprites/approved/upgrade-poisonous-skin.png", "promotion": "./game-assets/sprites/approved/upgrade-promotion.png", "frog scatter": "./game-assets/sprites/approved/upgrade-frog-scatter.png", "molt fortune": "./game-assets/sprites/approved/upgrade-molt-fortune.png"};
(()=>{function sync(){document.querySelectorAll('.frog-upgrade-choice').forEach(card=>{const title=(card.querySelector('.frog-upgrade-title')?.textContent||'').trim().toLowerCase();let url=window.approvedUpgrades[title]||window.approvedFrogs[title];if(!url)return;const icon=card.querySelector('.frog-upgrade-emoji');if(!icon||icon.dataset.approved===title)return;icon.dataset.approved=title;icon.style.setProperty('background-image',`url("${url}")`,'important');icon.style.setProperty('background-size','contain');icon.style.setProperty('background-position','center');});}new MutationObserver(sync).observe(document.body,{childList:true,subtree:true});sync();})();

(()=>{
 const options=[...document.querySelectorAll('#mainMenuOverlay .frog-btn')].filter(b=>b.id!=='btnBuffGuide');
 function select(b){options.forEach(x=>x.classList.toggle('pp-selected',x===b));}
 select(document.getElementById('btnStartRun'));options.forEach(b=>{b.addEventListener('pointerenter',()=>select(b));b.addEventListener('focus',()=>select(b));});

})();

// Center Role Draft in the mobile card's actual icon gutter, not a fixed left offset.
(() => {
  const mobile = matchMedia('(pointer: coarse), (max-width: 600px)');
  const observed = new WeakSet();
  function align() {
    document.querySelectorAll('#upgradeOverlay .frog-upgrade-choice').forEach(card => {
      const icon = card.querySelector('.frog-upgrade-emoji');
      const title = card.querySelector('.frog-upgrade-title')?.textContent.trim().toLowerCase();
      if (!icon || title !== 'role draft') return;
      if (!observed.has(card)) { observer.observe(card); observed.add(card); }
      if (!mobile.matches) {
        if (icon.dataset.mobileCentered) {
          icon.style.removeProperty('left');
          delete icon.dataset.mobileCentered;
        }
        return;
      }
      const gutter = parseFloat(getComputedStyle(card).paddingLeft);
      const width = parseFloat(getComputedStyle(icon).width);
      if (!Number.isFinite(gutter) || !Number.isFinite(width) || gutter < width) return;
      const left = `${(gutter - width) / 2}px`;
      if (icon.style.left !== left) icon.style.setProperty('left', left, 'important');
      icon.dataset.mobileCentered = 'true';
    });
  }
  const observer = new ResizeObserver(align);
  new MutationObserver(align).observe(document.body, {childList:true, subtree:true});
  mobile.addEventListener('change', align);
  window.addEventListener('resize', align);
  align();
})();

// Cannibal fullness stages share one size and baseline.
window.approvedFrogs["cannibal-0"]="./game-assets/sprites/approved/frog-cannibal-meal-0.png";
window.approvedFrogs["cannibal-1"]="./game-assets/sprites/approved/frog-cannibal-meal-1.png";
window.approvedFrogs["cannibal-2"]="./game-assets/sprites/approved/frog-cannibal-meal-2.png";
window.approvedFrogs["cannibal-3"]="./game-assets/sprites/approved/frog-cannibal-meal-3.png";
window.approvedFrogs["cannibal-4"]="./game-assets/sprites/approved/frog-cannibal-meal-4.png";
window.approvedFrogs["cannibal-5"]="./game-assets/sprites/approved/frog-cannibal-meal-5.png";
window.approvedFrogs.cannibal=window.approvedFrogs["cannibal-0"];

window.approvedUpgrades["eye for eye"]="./game-assets/sprites/approved/upgrade-eye-for-eye.png";

window.approvedUpgrades["wild company"]="./game-assets/sprites/approved/upgrade-wild-company.png";
window.approvedUpgrades["greedy hand"]="./game-assets/sprites/approved/upgrade-greedy-hand.png";

// Small visual adjustment only; retain the icon's layout space and centering.
(()=>{const style=document.createElement('style');style.textContent='.frog-upgrade-choice .frog-upgrade-emoji[data-approved="loaded hand"] { scale:1.08; transform-origin:center; }';document.head.appendChild(style);})();

// Match visible artwork bounds without altering approved source pixels.
(()=>{const style=document.createElement("style");style.textContent=".frog-upgrade-choice .frog-upgrade-emoji[data-approved=\"panic attack\"]{background-size:114.7770% 114.7770%!important;background-position:63.3171% 62.6977%!important;image-rendering:pixelated;}\n.frog-upgrade-choice .frog-upgrade-emoji[data-approved=\"royal apprenticeship\"]{background-size:103.6728% 103.6728%!important;background-position:51.1255% 50.0000%!important;image-rendering:pixelated;}\n.frog-upgrade-choice .frog-upgrade-emoji[data-approved=\"lingering hex\"]{background-size:119.7243% 109.2798%!important;background-position:30.8784% 71.8847%!important;image-rendering:pixelated;}\n.frog-upgrade-choice .frog-upgrade-emoji[data-approved=\"lasting legacy\"]{background-size:109.7552% 99.8418%!important;background-position:32.7606% 441.6667%!important;image-rendering:pixelated;}\n.frog-upgrade-choice .frog-upgrade-emoji[data-approved=\"brittle scales\"]{background-size:111.4414% 100.6094%!important;background-position:57.2209% 682.6923%!important;image-rendering:pixelated;}\n.frog-upgrade-choice .frog-upgrade-emoji[data-approved=\"snake egg\"]{background-size:105.2627% 112.1935%!important;background-position:48.3538% 20.1587%!important;image-rendering:pixelated;}\n.frog-upgrade-choice .frog-upgrade-emoji[data-approved=\"poisonous skin\"]{background-size:148.7520% 124.3576%!important;background-position:56.7829% 69.1401%!important;image-rendering:pixelated;}\n.frog-upgrade-choice .frog-upgrade-emoji[data-approved=\"eye for eye\"]{background-size:133.3439% 133.3439%!important;background-position:61.7994% 50.7973%!important;image-rendering:pixelated;}\n.frog-upgrade-choice .frog-upgrade-emoji[data-approved=\"wild company\"]{background-size:101.6172% 101.6172%!important;background-position:50.0000% 70.0426%!important;image-rendering:pixelated;}\n.frog-upgrade-choice .frog-upgrade-emoji[data-approved=\"greedy hand\"]{background-size:155.3043% 155.3043%!important;background-position:52.6872% 52.7992%!important;image-rendering:pixelated;}";document.head.appendChild(style);})();

// Field guide only: concise copy and a modest reduction in visible icon size.
(()=>{
 const descriptions={
 'Royal Apprenticeship':'Spawned roles replace crowns on ordinary crowned frogs. Movement stats reroll; special frogs keep their role.',
 'Greedy Hand':'Take every offer; another snake joins. Requires Loaded Hand. 20% offer chance; once per run. Never paired with Eye for Eye.',
 'Eye for Eye':'With 2+ snakes, kill the slowest. Cap drops to 55; excess frogs die without death rewards. Once per run.',
 'Snake Egg':'One snake gains 25% less speed per shed. Targets the fewest sheds; future snakes are unaffected.',
 'Wild Company':'Spawn 1–3 Bull, Magnet or Poison frogs—all one random role. Luck favors more.',
 'Frog Scatter':'Respawn the swarm, keeping roles, crowns and stats. Triggers death effects; bonus frogs respect the cap. Once per run.',
 'Lasting Legacy':'20% chance a dying special frog passes its role to an ordinary frog.',
 'Cannibal':'Eats up to 5 ordinary frogs. Each meal: 5% shorter hop timing and higher jumps. Death returns 2–5 frogs, never more than eaten.',
 'Poison Toad':'Confuses snakes when eaten: 10s base, affected by bonuses and resistance.',
 'Aura':'Nearby frogs hop 12% sooner and higher. Auras stack within movement caps.',
 'Lucky':'Better orb pickups and a score bonus. Cannot trigger Panic Hop from pickups.',
 'Luck':'Gain 10 luck (max 30). Improves supported chances, spawn rolls and positive buff durations.',
 'Role Draft':'Choose a role; spawn 2–5 special frogs. Luck favors more.'
 };
 const style=document.createElement('style');
 style.textContent='#runPauseOverlay[data-view="guide"] .pause-row img{scale:.88;transform-origin:center;}';
 document.head.appendChild(style);
 function polish(){
  document.querySelectorAll('#runPauseOverlay[data-view="guide"] .pause-guide-entries .pause-row').forEach(row=>{
   const name=row.querySelector('strong')?.textContent.trim();const p=row.querySelector('p');
   if(p && descriptions[name] && p.textContent!==descriptions[name])p.textContent=descriptions[name];
  });
 }
 new MutationObserver(polish).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-view']});polish();
})();

// Shared secondary-menu presentation. The live scoreboard is the design reference.
// Keep viewport, panel dimensions, native insets and game scaling owned by existing code.
(()=>{
 const targets='#howToOverlay,#dashboardOverlay,#endGameSummaryOverlay,#runPauseOverlay,#buffGuideOverlay';
 let probe,queued=false;
 const set=(el,key,value)=>{if(el.style.getPropertyValue(key)!==value || el.style.getPropertyPriority(key)!=='important')el.style.setProperty(key,value,'important');};
 const apply=(root,selector,props)=>root.querySelectorAll(selector).forEach(el=>Object.entries(props).forEach(([k,v])=>set(el,k,v)));
 function sync(){
  queued=false;
  const board=document.getElementById('leaderboardOverlay');if(!board)return;
  if(!probe || !probe.isConnected){
   probe=document.createElement('div');probe.setAttribute('aria-hidden','true');probe.inert=true;
   probe.style.cssText='position:absolute;visibility:hidden;pointer-events:none;width:0;height:0;overflow:hidden;';
   probe.innerHTML='<div class="pp-board"><h2 class="pp-heading">Scores</h2><div class="pp-entry"><div class="pp-player"><strong>Player</strong></div><div class="pp-time">00:00</div><div class="pp-points"><strong>100</strong></div></div><div class="pp-pager"><button tabindex="-1">Next</button></div></div>';
   board.appendChild(probe);
  }
  const read=s=>getComputedStyle(probe.querySelector(s));
  const panel=read('.pp-board'),heading=read('.pp-heading'),name=read('.pp-player strong'),body=read('.pp-time'),button=read('button'),points=read('.pp-points strong');
  // Typography follows the scoreboard's responsive values, independently of panel geometry.
  for(const [key,value] of Object.entries({'--menu-text-color':panel.color,'--menu-label-color':body.color,'--menu-value-color':points.color,'--menu-unit':(parseFloat(body.fontSize)/21)+'px','--menu-panel-width':panel.width,'--menu-panel-padding':panel.padding,'--menu-frame-border':panel.border,'--menu-frame-shadow':panel.boxShadow,'--menu-frame-radius':panel.borderRadius,'--menu-frame-background':panel.backgroundColor,'--menu-body-font':body.fontSize,'--menu-name-font':name.fontSize,'--menu-title-font':heading.fontSize,'--menu-control-font':button.fontSize})) {
   if(document.documentElement.style.getPropertyValue(key)!==value)document.documentElement.style.setProperty(key,value);
  }
  const font={'font-family':name.fontFamily,'font-weight':'400','text-shadow':'none','letter-spacing':'normal'};
  document.querySelectorAll(targets).forEach(root=>{
   if(root.querySelector('.sm-panel') || root.id==='howToOverlay' || (root.id==='runPauseOverlay' && root.dataset.view==='guide')) return;
   apply(root,'.frog-panel,.pp-board,.pause-panel',{'background':panel.backgroundColor,'color':panel.color,'border':panel.border,'border-radius':panel.borderRadius,'box-shadow':panel.boxShadow,'clip-path':'none',...font});
   apply(root,'h2,.pp-heading', {...font,'font-size':heading.fontSize,'color':heading.color,'background':'transparent','line-height':'1.15','text-align':'center','border':'0','padding':'0','margin':'4px 0 20px'});
   apply(root,'p,label,dt,dd,.ui-records span,.ui-tag-label,.ui-progress-caption,.rest-runline,.rest-facts,.rest-label,.rest-effects,.pause-pages span,.pp-metrics span,.pp-tag label,.pp-result>span,.pp-result>small', {...font,'font-size':body.fontSize,'line-height':'1.3','color':body.color});
   apply(root,'h3,.rest-name,.pause-row strong,#dashboardCurrentTag,.ui-help-steps h3', {...font,'font-size':name.fontSize,'line-height':'1.2','color':panel.color});
   apply(root,'.ui-records strong,.rest-runline b,.rest-facts dd,.rest-effects b,.pp-metrics strong', {...font,'font-size':name.fontSize,'color':points.color});
   apply(root,'button', {...font,'font-size':button.fontSize,'line-height':'1.2','color':panel.color,'background':'transparent','border':'0','box-shadow':'none','clip-path':'none','border-radius':'7px','padding':button.padding,'min-height':button.minHeight});
   apply(root,'input[type="text"],#dashboardTagInput,#endSummaryTagInput', {...font,'font-size':name.fontSize,'line-height':'1.2','color':panel.color,'background':panel.backgroundColor,'border':'1px solid #bdcb9e','border-radius':'7px','padding':'8px 12px','min-width':'0','box-sizing':'border-box'});
   apply(root,'.guide-heading,.pause-filters',{'background':'transparent','color':panel.color,'box-shadow':'none','border-bottom':'1px solid #bdcb9e'});
   apply(root,'.pause-footer,.pp-pager,.rest-label',{'border-top':'1px solid #bdcb9e'});
   apply(root,'.rest-entry,.pause-guide-entries .pause-row',{'background':'transparent','box-shadow':'none','border':'0','border-bottom':'1px solid #bdcb9e','border-radius':'0','clip-path':'none'});
  });
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(sync);}}
 const style=document.createElement('style');style.textContent=`
 #runPauseOverlay#runPauseOverlay #pauseTitle::before,#runPauseOverlay#runPauseOverlay #pauseTitle::after{content:none!important;display:none!important}
 #runPauseOverlay .guide-eyebrow{display:none!important}
 #runPauseOverlay .pause-filters button[aria-selected="true"]{text-decoration:underline;text-underline-offset:5px}
 :is(${targets}) button:focus-visible,:is(${targets}) input:focus-visible{outline:2px solid #397a43!important;outline-offset:3px}
 :is(${targets}) button:disabled{opacity:.4}
 @media(hover:hover){:is(${targets}) button:not(:disabled):hover{transform:translateY(-2px)}}
 @media(prefers-reduced-motion:reduce){:is(${targets}) button{transform:none!important;transition:none!important}}
 `;document.head.appendChild(style);
 // No style observation: gameplay updates inline styles every frame.
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-view']});
 window.addEventListener('resize',schedule);document.fonts?.ready.then(schedule);schedule();
})();

// Suppress browser/WebView tap flashes, not the game's button surfaces.
(()=>{
 const style=document.createElement('style');
 style.id='menu-pointer-feedback';
 style.textContent=`
 html body :is(button,[role="button"],.frog-btn,a){-webkit-tap-highlight-color:transparent!important;}
 html body :is(button,[role="button"],.frog-btn){-webkit-user-select:none;user-select:none;}
 html body :is(button,[role="button"],.frog-btn,a):focus:not(:focus-visible){outline:none!important;box-shadow:none!important;}
 html body :is(button,[role="button"],.frog-btn,a):active:not(:focus-visible){outline:none!important;box-shadow:none!important;}
 `;
 document.head.appendChild(style);
})();

// Approved menus share the exact preview styling; dimensions follow the established design viewport.
(()=>{
 const css=document.createElement('link');css.rel='stylesheet';css.href='game-css/approved-menus.css?v=pause-guide-fix-3';document.head.appendChild(css);

})();

// Preserve the existing main/help/score surfaces and approved icon sizing.
(()=>{const style=document.createElement('style');style.textContent=`
#howToOverlay .frog-panel,#dashboardOverlay .frog-panel,#leaderboardOverlay .frog-panel,#endGameSummaryOverlay .frog-panel,#buffGuideOverlay .frog-panel,#mainMenuOverlay .frog-panel{border-radius:8px!important;clip-path:none!important;}
@media(pointer:coarse),(max-width:600px){.frog-upgrade-choice .frog-upgrade-emoji[data-approved="loaded hand"]{scale:1.18;}}
.frog-upgrade-choice .frog-upgrade-emoji[data-approved="poisonous skin"]{background-size:129.6521739130435% 124.78260869565219%!important;background-position:59.579667644183765% 54.093567251461984%!important;}
`;document.head.appendChild(style);})();
