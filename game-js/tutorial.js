// Contextual first-play hints. Independent of run history and the old help flag.
(function () {
  'use strict';
  const KEY = 'escapeSnake.bubbleTutorialSeen.v1';
  let completed = false, replay = false, phase = 'idle', hooks = null;
  let overlay = null, target = null, previousPause = false;
  function seen() {
    if (completed) return true;
    try { return localStorage.getItem(KEY) === '1'; } catch (_) { return false; }
  }
  function clearBubble() {
    if (!overlay) return;
    overlay.remove(); overlay = null; target = null;
    hooks.setPaused(previousPause);
  }
  function finish() {
    clearBubble(); phase = 'idle'; completed = true;
    try { localStorage.setItem(KEY, '1'); } catch (_) {}
  }
  function position() {
    if (!overlay || !target) return;
    const scale = window.__escapeSnakeRenderScale || 1;
    const w = window.innerWidth, h = window.innerHeight;
    overlay.style.width = w + 'px'; overlay.style.height = h + 'px';
    const r = target.getBoundingClientRect();
    const x = Math.max(12, Math.min(w - 12, (r.left + r.width / 2) / scale));
    const y = Math.max(12, Math.min(h - 12, (r.top + r.height / 2) / scale));
    const ring = overlay.querySelector('.tutorial-ring');
    const rw = Math.min(w - 24, r.width / scale + 20), rh = Math.min(h - 24, r.height / scale + 20);
    Object.assign(ring.style, {left: Math.max(8, Math.min(w-rw-8, x-rw/2))+'px', top:Math.max(8, Math.min(h-rh-8,y-rh/2))+'px',width:rw+'px',height:rh+'px'});
    const bubble = overlay.querySelector('.tutorial-bubble');
    const bw = bubble.offsetWidth, bh = bubble.offsetHeight;
    const bx = Math.max(16, Math.min(w-bw-16, x-bw/2));
    const below = y + rh/2 + 42;
    const by = Math.max(16, Math.min(h-bh-16, below+bh+16 <= h ? below : y-rh/2-bh-42));
    bubble.style.left = bx+'px'; bubble.style.top = by+'px';
    const line = overlay.querySelector('line');
    line.setAttribute('x1', Math.max(bx+20,Math.min(bx+bw-20,x)));
    line.setAttribute('y1', by > y ? by : by+bh);
    line.setAttribute('x2', x); line.setAttribute('y2', y);
  }
  function bubble(el, text, button, next) {
    clearBubble();
    if (!el) { next(); return; }
    previousPause = hooks.isPaused(); hooks.setPaused(true); target = el;
    overlay = document.createElement('div'); overlay.id = 'runTutorial';
    overlay.innerHTML = `<svg class="tutorial-pointer" aria-hidden="true"><line /></svg><div class="tutorial-ring" aria-hidden="true"></div><section class="tutorial-bubble" role="dialog" aria-modal="true" aria-labelledby="tutorialCopy"><p id="tutorialCopy">${text}</p><footer><button data-next>${button}</button><button data-skip>Skip tutorial</button></footer></section>`;
    document.body.appendChild(overlay);
    for (const event of ['pointerdown','pointermove','click']) overlay.addEventListener(event,e=>e.stopPropagation());
    overlay.querySelector('[data-next]').onclick = () => { clearBubble(); next(); };
    overlay.querySelector('[data-skip]').onclick = finish;
    overlay.addEventListener('keydown',e=>{
      e.stopPropagation();
      if(e.key==='Escape'){e.preventDefault();finish();}
      if(e.key==='Tab'){
        e.preventDefault();const a=overlay.querySelector('[data-next]'),b=overlay.querySelector('[data-skip]');
        (document.activeElement===a?b:a).focus();
      }
    });
    position(); overlay.querySelector('[data-next]').focus();
  }
  window.addEventListener('resize', position);
  window.FrogGameTutorial = {
    requestReplay() { replay = true; },
    begin(options) {
      clearBubble(); hooks = options;
      const shouldShow = replay || !seen(); replay = false;
      phase = shouldShow ? 'upgrade' : 'idle';
      if (shouldShow) bubble(hooks.upgrade(), 'Pick an upgrade. Its bonus lasts for this run.', 'Choose upgrade', () => { phase = 'awaitUpgrade'; });
    },
    afterUpgrade() {
      if (!['upgrade','awaitUpgrade'].includes(phase)) return;
      phase = 'frogs';
      bubble(hooks.frog(), 'These are your frogs. Move your mouse, or touch and drag, to lead them.', 'Next', () => {
        phase = 'snake';
        bubble(hooks.snake(), 'Stay away from the snake’s head. Lose every frog and the run ends.', 'Let’s move', () => { phase = 'awaitOrb'; });
      });
    },
    tick() {
      if (overlay) { position(); return; }
      if (phase !== 'awaitOrb' || hooks.isPaused() || hooks.isOver()) return;
      const orb = hooks.orb();
      if (orb) { phase = 'orb'; bubble(orb, 'Lead a frog onto this orb to collect its power. More upgrades arrive as you survive.', 'Got it', finish); }
    },
    cancel() { clearBubble(); phase = 'idle'; },
  };
})();
