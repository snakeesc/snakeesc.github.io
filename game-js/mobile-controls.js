/* Keep only the in-run controls readable after the game's viewport scaling. */
(function () {
  const touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const phone = (matchMedia('(pointer: coarse)').matches || touch) && Math.min(screen.width, screen.height) <= 600;
  if (!phone) return; // Preserve existing desktop controls.
  const style = document.createElement('style');
  style.id = 'mobile-controls-readable';
  document.head.appendChild(style);
  function update() {
    // Native wrapper scales body; mobile Chrome scales its layout viewport.
    const bodyScale = document.body.getBoundingClientRect().width / document.body.offsetWidth || 1;
    const viewportScale = window.visualViewport ? window.visualViewport.scale : 1;
    const unit = phone ? 1 / (bodyScale * viewportScale) : 1;
    const px = n => (n * unit).toFixed(3) + 'px';
    // Safe-area insets are reported in the true (unscaled) viewport, but these
    // elements live inside the game's scaled coordinate space, so the inset
    // has to be scaled by the same `unit` to land in the right spot — same
    // idea as `px()` above, just added on top of a base offset instead of
    // being the whole value.
    const safeTop = `env(safe-area-inset-top, 0px) * ${unit}`;
    const safeLeft = `env(safe-area-inset-left, 0px) * ${unit}`;
    const safeRight = `env(safe-area-inset-right, 0px) * ${unit}`;
    const native = window.escapeSnakeInsets || {top:0,left:0,right:0};
    const topInset = `max(${safeTop}, ${px(native.top)})`;
    const leftInset = `max(${safeLeft}, ${px(native.left)})`;
    const rightInset = `max(${safeRight}, ${px(native.right)})`;
    style.textContent = `
      #frog-game #pocket-hud,
      #frog-game #pocket-controls button {
        box-sizing:border-box!important;
        font-family:ReferencePixel,monospace!important;font-size:${px(13)}!important;line-height:1.2!important;
        font-weight:400!important;letter-spacing:normal!important;
        padding:${px(4)} ${px(7)}!important;
        border:${px(1)} solid #073720!important;border-radius:${px(5)}!important;
        background:#fff8db!important;color:#073720!important;
        box-shadow:none!important;text-shadow:none!important;clip-path:none!important;
      }
      #frog-game #pocket-hud {
        position:absolute!important;top:calc(${px(6)} + ${topInset})!important;left:50%!important;right:auto!important;
        transform:translateX(-50%)!important;gap:${px(6)}!important;
        width:max-content!important;max-width:calc(100% - ${px(16)} - ${leftInset} - ${rightInset})!important;
      }
      #frog-game #pocket-hud span {font-size:inherit!important;color:#073720!important;}
      #frog-game #pocket-controls {
        position:absolute!important;bottom:auto!important;right:auto!important;flex-direction:column!important;
        top:calc(${px(38)} + ${topInset})!important;left:calc(${px(8)} + ${leftInset})!important;gap:${px(6)}!important;align-items:center!important;
      }
      #frog-game #pocket-controls button {
        min-height:0!important;min-width:0!important;width:auto!important;height:auto!important;
        touch-action:manipulation;
      }
      #frog-game #pocket-controls button:focus-visible {outline:${px(2)} solid #006b83!important;outline-offset:${px(2)}!important;}

    `;
  }
  update();
  window.addEventListener("escape-snake-insets", update);
  window.addEventListener('resize', update);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', update);
  if (screen.orientation) screen.orientation.addEventListener('change', () => requestAnimationFrame(update));
})();
