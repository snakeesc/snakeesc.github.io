// Pocket Pixels sprite rendering. Does not change game rules.
(()=>{document.documentElement.style.setProperty("--atlas",`url("${new URL("./game-assets/misc/d80b42a6ab79bcef.webp",document.baseURI).href}")`);
 function decorate(el){if(el.classList.contains("frog-upgrade-choice")&&/orb|ouroboros/i.test(el.querySelector('.frog-upgrade-title')?.textContent||'')){const icon=el.querySelector(".frog-upgrade-emoji");if(icon)icon.style.backgroundPosition="0 100%";}if(el.classList.contains('frog-sprite')){const n=Number(el.dataset.pocketColor||0);el.style.setProperty('--frog-x',(n%4)*100/3+'%');el.style.setProperty('--frog-y',Math.floor(n/4)*100/3+'%')}}
 const obs=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1){decorate(n);n.querySelectorAll('.frog-sprite').forEach(decorate)}})));obs.observe(document.body,{childList:true,subtree:true});document.querySelectorAll('.frog-sprite').forEach(decorate);
 const menu=document.querySelector('#mainMenuOverlay');[[8.5,13.5,0],[18.2,25.5,1],[4.5,48.5,2],[24.5,54.5,3],[12.5,63,0],[6,81,4],[21,82,5]].forEach(([x,y,n])=>{const e=document.createElement('div');e.className='pocket-decor';e.style.cssText=`left:${x}%;top:${y}%;background-position:${n%4*100/3}% ${Math.floor(n/4)*100/3}%`;menu.append(e)});
 const snakeDecor=document.createElement('div');snakeDecor.className='pocket-menu-snake';snakeDecor.innerHTML='<i class="snake-head"></i><i class="snake-body"></i><i class="snake-body"></i><i class="snake-body"></i><i class="snake-tail"></i>';menu.append(snakeDecor);
})();

(()=>{const icons={"bolt": "./game-assets/sprites/upgrade-bolt.svg", "heart": "./game-assets/sprites/upgrade-heart.svg", "clover": "./game-assets/sprites/upgrade-clover.svg", "egg": "./game-assets/sprites/upgrade-egg.svg", "shield": "./game-assets/sprites/upgrade-shield.svg", "star": "./game-assets/sprites/upgrade-star.svg", "scissors": "./game-assets/sprites/upgrade-scissors.svg", "orb": "./game-assets/sprites/upgrade-orb.svg", "bow": "./game-assets/sprites/upgrade-bow.svg", "skull": "./game-assets/sprites/upgrade-skull.svg", "magnet": "./game-assets/sprites/upgrade-magnet.svg", "moon": "./game-assets/sprites/upgrade-moon.svg", "dice": "./game-assets/sprites/upgrade-dice.svg"};window.pocketIcons=icons;function update(){document.querySelectorAll('.frog-upgrade-choice').forEach(card=>{const t=card.querySelector('.frog-upgrade-title')?.textContent||'';const icon=card.querySelector('.frog-upgrade-emoji');if(!icon)return;const key=/champion/i.test(t)?'star':/aura/i.test(t)?'orb':/zombie/i.test(t)?'skull':/necromancer/i.test(t)?'moon':/alchemist/i.test(t)?'egg':/cannibal/i.test(t)?'scissors':/last stand/i.test(t)?'bow':/death|grave/i.test(t)?'skull':/magnet|collector/i.test(t)?'magnet':/night/i.test(t)?'moon':/roll|loaded/i.test(t)?'dice':/egg|yolk/i.test(t)?'egg':/luck|roll|fortune/i.test(t)?'clover':/scissor/i.test(t)?'scissors':/shield|survival/i.test(t)?'shield':/death|life|reviv|last stand/i.test(t)?'heart':/speed|jump|mutation|panic/i.test(t)?'bolt':/orb|ouroboros/i.test(t)?'orb':'star';if(icon.dataset.pixelIcon===key)return;icon.dataset.pixelIcon=key;icon.style.setProperty('background-image',`url("${icons[key]}")`,'important');icon.style.setProperty('background-size','contain','important');icon.style.setProperty('background-position','center','important');icon.style.setProperty('background-repeat','no-repeat','important');});}new MutationObserver(update).observe(document.body,{childList:true,subtree:true});update();})();


window.approvedFrogs={"poison":"./game-assets/sprites/approved/frog-poison-toad.png","poison toad":"./game-assets/sprites/approved/frog-poison-toad.png","bull":"./game-assets/sprites/approved/frog-bull.png","bull frog":"./game-assets/sprites/approved/frog-bull.png","crowned": "./game-assets/sprites/approved/frog-crowned.png", "champion": "./game-assets/sprites/approved/frog-champion.png", "aura": "./game-assets/sprites/approved/frog-aura.png", "shield": "./game-assets/sprites/approved/frog-shield.png", "magnet": "./game-assets/sprites/approved/frog-magnet.png", "lucky": "./game-assets/sprites/approved/frog-lucky.png", "zombie": "./game-assets/sprites/approved/frog-zombie.png", "cannibal": "./game-assets/sprites/approved/frog-cannibal.png", "necromancer": "./game-assets/sprites/approved/frog-necromancer.png", "alchemist": "./game-assets/sprites/approved/frog-alchemist.png"};
window.approvedUpgrades={"poison toads":"./game-assets/sprites/approved/frog-poison-toad.png","panic attack":"./game-assets/sprites/approved/upgrade-panic-attack.png","bruised egg":"./game-assets/sprites/approved/upgrade-bruised-egg.png","bull frog":"./game-assets/sprites/approved/frog-bull.png","magnet frogs":"./game-assets/sprites/approved/frog-magnet.png","royal apprenticeship":"./game-assets/sprites/approved/upgrade-royal-apprenticeship.png","lingering hex":"./game-assets/sprites/approved/upgrade-lingering-hex.png","lasting legacy":"./game-assets/sprites/approved/upgrade-lasting-legacy.png","brittle scales":"./game-assets/sprites/approved/upgrade-brittle-scales.png","mutation": "./game-assets/sprites/approved/upgrade-mutation.png", "role draft": "./game-assets/sprites/approved/upgrade-role-draft.png", "double yolker": "./game-assets/sprites/approved/upgrade-double-yolker.png", "spawn frogs": "./game-assets/sprites/approved/upgrade-spawn-frogs.png", "orb flow": "./game-assets/sprites/approved/upgrade-orb-flow.png", "orb whisperer": "./game-assets/sprites/approved/upgrade-orb-whisperer.png", "ouroboros pact": "./game-assets/sprites/approved/upgrade-ouroboros-pact.png", "luck": "./game-assets/sprites/approved/upgrade-luck.png", "deathrattle": "./game-assets/sprites/approved/upgrade-deathrattle.png", "last stand": "./game-assets/sprites/approved/upgrade-last-stand.png", "survival instinct": "./game-assets/sprites/approved/upgrade-survival-instinct.png", "lucky roll": "./game-assets/sprites/approved/upgrade-lucky-roll.png", "pair of scissors": "./game-assets/sprites/approved/upgrade-pair-of-scissors.png", "orb storm": "./game-assets/sprites/approved/upgrade-orb-storm.png", "chain reaction": "./game-assets/sprites/approved/upgrade-chain-reaction.png", "snake egg": "./game-assets/sprites/approved/upgrade-snake-egg.png", "loaded hand": "./game-assets/sprites/approved/upgrade-loaded-hand.png", "night bloom": "./game-assets/sprites/approved/upgrade-night-bloom.png", "tidal wave": "./game-assets/sprites/approved/upgrade-tidal-wave.png", "epic deathrattle": "./game-assets/sprites/approved/upgrade-epic-deathrattle.png", "orb specialist": "./game-assets/sprites/approved/upgrade-orb-specialist.png", "second wind": "./game-assets/sprites/approved/upgrade-second-wind.png", "grave wave": "./game-assets/sprites/approved/upgrade-grave-wave.png", "poisonous skin": "./game-assets/sprites/approved/upgrade-poisonous-skin.png", "promotion": "./game-assets/sprites/approved/upgrade-promotion.png", "frog scatter": "./game-assets/sprites/approved/upgrade-frog-scatter.png", "molt fortune": "./game-assets/sprites/approved/upgrade-molt-fortune.png"};
(()=>{function sync(){document.querySelectorAll('.frog-upgrade-choice').forEach(card=>{const title=(card.querySelector('.frog-upgrade-title')?.textContent||'').trim().toLowerCase();let url=window.approvedUpgrades[title]||window.approvedFrogs[title];if(!url)return;const icon=card.querySelector('.frog-upgrade-emoji');if(!icon||icon.dataset.approved===title)return;icon.dataset.approved=title;icon.style.setProperty('background-image',`url("${url}")`,'important');icon.style.setProperty('background-size','contain','important');icon.style.setProperty('background-position','center','important');});}new MutationObserver(sync).observe(document.body,{childList:true,subtree:true});sync();})();

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
