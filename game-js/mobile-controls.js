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
    const hud = document.getElementById('pocket-hud');
    const game = document.getElementById('frog-game');
    const hudRect = hud && hud.getBoundingClientRect();
    const gameRect = game && game.getBoundingClientRect();
    const top = hudRect && hudRect.height && gameRect
      ? Math.max(28 * unit, (hudRect.bottom - gameRect.top) / bodyScale + 6 * unit)
      : 28 * unit;
    style.textContent = `
      #frog-game #pocket-hud {
        position:absolute!important;top:${px(6)}!important;left:50%!important;right:auto!important;
        transform:translateX(-50%)!important;box-sizing:border-box!important;
        font-family:ReferencePixel,monospace!important;font-size:${px(13)}!important;line-height:1.2!important;
        padding:${px(4)} ${px(7)}!important;gap:${px(6)}!important;
        width:max-content!important;max-width:calc(100% - ${px(16)})!important;
        border:${px(1)} solid #073720!important;border-radius:${px(5)}!important;
        background:#fff8db!important;color:#073720!important;box-shadow:none!important;
      }
      #frog-game #pocket-hud span {font-size:inherit!important;color:#073720!important;}

      #frog-game #pocket-controls {position:absolute!important;bottom:auto!important;right:auto!important;flex-direction:column!important;top:${top.toFixed(3)}px!important;left:${px(8)}!important;gap:${px(4)}!important;align-items:flex-start!important;}
      #frog-game #pocket-controls button {
        box-sizing:border-box!important;font-family:ReferencePixel,monospace!important;
        font-size:${px(phone ? 15 : 18)}!important;line-height:1.15!important;
        min-height:${px(phone ? 28 : 32)}!important;min-width:${px(phone ? 60 : 76)}!important;
        padding:${px(phone ? 3 : 6)} ${px(phone ? 7 : 12)}!important;border:${px(2)} solid #073720!important;
        border-radius:${px(5)}!important;background:#fff8db!important;color:#073720!important;
        box-shadow:none!important;text-shadow:none!important;clip-path:none!important;
        touch-action:manipulation;
      }
      #frog-game #pocket-controls button:focus-visible {outline:${px(2)} solid #006b83!important;outline-offset:${px(2)}!important;}
    `;
  }
  update();
  const hud = document.getElementById('pocket-hud');
  if (hud && window.ResizeObserver) new ResizeObserver(update).observe(hud);
  window.addEventListener('resize', update);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', update);
  if (screen.orientation) screen.orientation.addEventListener('change', () => requestAnimationFrame(update));
})();
