/* Shared display normalization. Source artwork remains unchanged. */
(()=>{

 const atlasRects={"long tongue":[31,91,143,82],"deep pond":[207,79,148,94],"afterglow":[404,57,105,129],"mutation":[570,55,117,123],"panic attack":[740,68,132,101],"wild company":[911,77,158,107],"lasting legacy":[1100,47,138,137],"second wind":[1277,77,142,87],"promotion":[38,222,129,129],"second bloom":[216,215,130,140],"lingering hex":[391,217,136,134],"double yolker":[568,220,121,135],"spawn frogs":[730,248,158,85],"orb flow":[914,252,144,81],"orb whisperer":[1115,219,110,131],"luck":[1288,222,122,133],"last stand":[208,406,147,109],"survival instinct":[384,407,143,114],"double jump":[549,400,148,123],"lucky roll":[743,394,126,135],"royal apprenticeship":[911,399,145,120],"ouroboros curse":[1096,396,140,136],"ouroboros feast":[1281,397,137,134],"forbidden fruit":[38,569,129,128],"higher calling":[213,567,136,120],"second helping":[385,569,140,124],"peace of mind":[561,565,134,130],"role draft":[731,594,157,77],"orb storm":[918,559,152,140],"snake egg":[1115,565,109,134],"brittle scales":[1283,561,135,137],"chain reaction":[27,763,150,63],"greedy hand":[209,726,141,129],"loaded hand":[376,743,162,97],"tidal wave":[561,740,152,110],"eye for eye":[739,730,134,133],"epic deathrattle":[912,730,156,124],"orb specialist":[1115,726,106,137],"grave wave":[1269,744,152,98],"poisonous skin":[27,905,151,114],"frog scatter":[198,912,152,104],"molt fortune":[381,920,146,99],"hard bargain":[564,903,141,125],"withering":[737,907,140,112],"shared misfortune":[918,919,144,100],"soul offering":[1096,916,145,91]};
 const atlasUrl="./game-assets/sprites/approved/upgrade-polished-atlas.png";
 const blank='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E';
 function atlas(el,name,img){
  const rect=atlasRects[name];if(!rect)return false;
  const box=getComputedStyle(el),w=parseFloat(box.width),h=parseFloat(box.height);if(!w||!h)return true;
  const stamp=name+'|'+w+'|'+h;
  if(el.dataset.atlasStamp===stamp)return true;
  const [l,t,bw,bh]=rect,s=Math.min(w*.92/bw,h*.92/bh),px=(w-bw*s)/2,py=(h-bh*s)/2;
  if(img){el.dataset.upgradeIconName=name;el.src=blank;el.style.setProperty('transform','none','important');}
  el.style.setProperty('background-image','url("'+atlasUrl+'")','important');
  el.style.setProperty('background-size',`${1448*s}px ${1086*s}px`,'important');
  el.style.setProperty('background-position',`${px-l*s}px ${py-t*s}px`,'important');
  el.style.setProperty('background-repeat','no-repeat','important');
  el.style.setProperty('clip-path',`inset(${py}px ${px}px)`,'important');
  el.dataset.iconPolished='true';el.dataset.atlasStamp=stamp;return true;
 }

 const cache=new Map();
 const standard=new Set(["afterglow", "mutation", "panic attack", "wild company", "lasting legacy", "second wind", "long tongue", "deep pond", "second bloom", "lingering hex", "double yolker", "spawn frogs", "orb flow", "orb whisperer", "soul offering", "luck", "deathrattle", "last stand", "survival instinct", "double jump", "lucky roll", "hard bargain", "withering", "shared misfortune", "ouroboros curse", "ouroboros feast", "royal apprenticeship", "forbidden fruit", "higher calling", "second helping", "peace of mind", "role draft", "orb storm", "snake egg", "brittle scales", "chain reaction", "greedy hand", "loaded hand", "tidal wave", "eye for eye", "epic deathrattle", "orb specialist", "grave wave", "poisonous skin", "promotion", "frog scatter", "molt fortune"]);
 const key=s=>String(s||'').trim().toLowerCase();
 let queued=false;
 function bounds(src){
  if(cache.has(src))return cache.get(src);
  const promise=new Promise(resolve=>{const im=new Image();im.onload=()=>{try{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data;let l=c.width,t=c.height,r=-1,b=-1;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){if(d[(y*c.width+x)*4+3]>32){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}}resolve(r<0?null:{w:c.width,h:c.height,l,t,bw:r-l+1,bh:b-t+1});}catch{resolve(null)}};im.onerror=()=>resolve(null);im.src=src;});cache.set(src,promise);return promise;
 }
 async function fit(el,src,background){
  const info=await bounds(src);if(!info||!el.isConnected)return;
  const box=getComputedStyle(el),w=parseFloat(box.width),h=parseFloat(box.height);if(!w||!h)return;
  const scale=Math.min(w*.92/info.bw,h*.92/info.bh);
  const x=(w-info.bw*scale)/2-info.l*scale,y=(h-info.bh*scale)/2-info.t*scale;
  if(background){if(!el.style.backgroundImage.includes(src)&&el.dataset.polishSource!==src){/* CSS owns the source image. */}
   el.style.setProperty('background-size',`${info.w*scale}px ${info.h*scale}px`,'important');el.style.setProperty('background-position',`${x}px ${y}px`,'important');
  }else{const base=Math.min(w/info.w,h/info.h);const factor=scale/base;const dx=(info.w/2-info.l-info.bw/2)*scale,dy=(info.h/2-info.t-info.bh/2)*scale;el.style.setProperty('object-fit','contain','important');el.style.setProperty('transform-origin','center','important');el.style.setProperty('transform',`translate(${dx}px,${dy}px) scale(${factor})`,'important');}
  el.dataset.polishSource=src;el.dataset.iconPolished='true';
 }
 function apply(){queued=false;
  document.querySelectorAll('.frog-upgrade-emoji[data-approved]').forEach(el=>{if(!standard.has(key(el.dataset.approved)))return;if(atlas(el,key(el.dataset.approved),false))return;const src=getComputedStyle(el).backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1];if(src)fit(el,src,true);});
  document.querySelectorAll('img').forEach(el=>{const row=el.closest('.pause-row,.item,.rest-entry');let name=el.dataset.upgradeIconName||key(row?.querySelector('strong,h3,.rest-name')?.textContent).replace(/\s*[×x]\s*\d+$/,'');if(!standard.has(name)){const url=(el.currentSrc||el.src).split('?')[0];const match=Object.entries(window.approvedUpgrades||{}).find(([k,v])=>url.endsWith(String(v).split('?')[0].replace(/^\.\//,'')));if(match)name=key(match[0]);}if(atlas(el,name,true))return;const src=el.currentSrc||el.src;if(standard.has(name)||(/upgrade-/.test(src)&&!el.closest('#mainMenuOverlay')))fit(el,src,false);});
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(apply)}}
 new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true});window.addEventListener('resize',schedule);window.addEventListener('orientationchange',schedule);document.addEventListener('load',schedule,true);schedule();
})();
