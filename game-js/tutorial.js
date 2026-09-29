// First-run walkthrough, followed by the starting upgrade choice.
(function () {
  'use strict';
  const ALWAYS_SHOW_FOR_TESTING = false;
  const touchControls = (typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || ''))) || window.matchMedia?.('(pointer: coarse)').matches;
  const steeringHint = touchControls ? "Tap the screen to guide your frogs. They’ll hop toward where you tap." : 'Move your mouse to guide your frogs. They’ll hop toward your cursor.';
  const KEY = 'escapeSnake.bubbleTutorialSeen.v3';
  let completed = false, replay = false, phase = 'idle', hooks = null, upgradeOpened = false;
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
    if (!upgradeOpened) { upgradeOpened = true; hooks.openUpgrades(); }
  }
  function position() {
    if (!overlay || !target) return;
    const scale = window.__escapeSnakeRenderScale || 1;
    const w = window.innerWidth, h = window.innerHeight;
    overlay.style.width = w + 'px'; overlay.style.height = h + 'px';
    const r = target.getBoundingClientRect();
    const x = Math.max(12, Math.min(w - 12, (r.left + r.width / 2) / scale));
    // The head artwork extends upward from its logical element center.
    const headOffset = target.classList?.contains('snake-head') ? (r.height / scale) * (12.3481 / 48) : 0;
    const y = Math.max(12, Math.min(h - 12, (r.top + r.height / 2) / scale - headOffset));
    const ring = overlay.querySelector('.tutorial-ring');
    const rw = Math.min(w - 24, r.width / scale + 20), rh = Math.min(h - 24, r.height / scale + 20);
    const rx = Math.max(8, Math.min(w-rw-8, x-rw/2));
    const ry = Math.max(8, Math.min(h-rh-8, y-rh/2));
    Object.assign(ring.style, {left:rx+'px',top:ry+'px',width:rw+'px',height:rh+'px'});
    const bubble = overlay.querySelector('.tutorial-bubble');
    const bw = bubble.offsetWidth, bh = bubble.offsetHeight;
    const bx = Math.max(16, Math.min(w-bw-16, x-bw/2));
    const below = y + rh/2 + 42;
    const by = Math.max(16, Math.min(h-bh-16, below+bh+16 <= h ? below : y-rh/2-bh-42));
    bubble.style.left = bx+'px'; bubble.style.top = by+'px';
    const line = overlay.querySelector('line');
    const ax = Math.max(bx+20,Math.min(bx+bw-20,x));
    const ay = by > y ? by : by+bh;
    const cx = rx+rw/2, cy = ry+rh/2;
    const dx = ax-cx, dy = ay-cy;
    // Intersect the connector with the outside of the ring, never its sprite.
    const edge = Math.min((rw/2+4)/Math.max(Math.abs(dx),.001), (rh/2+4)/Math.max(Math.abs(dy),.001));
    line.style.display = edge >= 1 ? 'none' : '';
    line.setAttribute('x1', ax); line.setAttribute('y1', ay);
    line.setAttribute('x2', cx+dx*edge); line.setAttribute('y2', cy+dy*edge);
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
      clearBubble(); hooks = options; upgradeOpened = false;
      const shouldShow = ALWAYS_SHOW_FOR_TESTING || replay || !seen(); replay = false;
      if (!shouldShow) {
        phase = 'idle'; upgradeOpened = true; hooks.openUpgrades(); return;
      }
      phase = 'frogs';
      bubble(hooks.frog(), steeringHint, 'Next', () => {
        phase = 'snake';
        bubble(hooks.snake(), 'The snake chases and eats your frogs. Guide them away from its head. Your run ends when you lose your last frog.', 'Next', () => {
          phase = 'shed';
          bubble(hooks.snake(), 'Every 3 minutes, the snake sheds its skin and gets faster. After three sheds, another snake joins the hunt.', 'Next', () => {
            phase = 'orb';
            bubble(hooks.orb(), 'Guide a frog onto a glowing orb to collect it. Orbs can give your frogs temporary powers, weaken snakes, or bring in more frogs.', 'Next', () => {
              phase = 'upgrade'; upgradeOpened = true; hooks.openUpgrades();
              bubble(hooks.upgrade(), 'Pick one card to start your run. Each upgrade gives a different benefit. You’ll get more choices as you survive.', 'Choose my upgrade', finish);
            });
          });
        });
      });
    },
    tick() {
      if (overlay) { position(); return; }

    },
    cancel() { clearBubble(); phase = 'idle'; },
  };
})();
