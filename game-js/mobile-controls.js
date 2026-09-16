/* Keep only the in-run controls readable after the game's viewport scaling. */
(function () {
  const touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const phone = (matchMedia('(pointer: coarse)').matches || touch) && Math.min(screen.width, screen.height) <= 600;
  const style = document.createElement('style');
  style.id = 'mobile-controls-readable';
  document.head.appendChild(style);
  function update() {
    // Native wrapper scales body; mobile Chrome scales its layout viewport.
    const bodyScale = document.body.getBoundingClientRect().width / document.body.offsetWidth || 1;
    const viewportScale = window.visualViewport ? window.visualViewport.scale : 1;
    const unit = phone ? 1 / (bodyScale * viewportScale) : 1;
    const px = n => (n * unit).toFixed(3) + 'px';
    style.textContent = `
      #frog-game #pocket-controls {position:absolute!important;top:${px(10)}!important;left:${px(10)}!important;gap:${px(6)}!important;align-items:flex-start!important;}
      #frog-game #pocket-controls button {
        box-sizing:border-box!important;font-family:ReferencePixel,monospace!important;
        font-size:${px(phone ? 22 : 18)}!important;line-height:1.15!important;
        min-height:${px(phone ? 44 : 32)}!important;min-width:${px(phone ? 94 : 76)}!important;
        padding:${px(6)} ${px(12)}!important;border:${px(2)} solid #073720!important;
        border-radius:${px(7)}!important;background:#fff8db!important;color:#073720!important;
        box-shadow:none!important;text-shadow:none!important;clip-path:none!important;
        touch-action:manipulation;
      }
      #frog-game #pocket-controls button:focus-visible {outline:${px(2)} solid #006b83!important;outline-offset:${px(2)}!important;}
    `;
  }
  update();
  window.addEventListener('resize', update);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', update);
  if (screen.orientation) screen.orientation.addEventListener('change', () => requestAnimationFrame(update));
})();
