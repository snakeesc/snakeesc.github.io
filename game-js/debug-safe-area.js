/* TEMPORARY diagnostic overlay — shows the real measured values instead of guessing. Remove after use. */
(function () {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;padding-top:env(safe-area-inset-top, 0px);padding-left:env(safe-area-inset-left, 0px);visibility:hidden;';
  document.body.appendChild(probe);

  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:999999;background:#000;color:#0f0;font:11px monospace;padding:6px;white-space:pre-wrap;pointer-events:none;';
  document.body.appendChild(box);

  function update() {
    const cs = getComputedStyle(probe);
    const bodyScale = document.body.getBoundingClientRect().width / document.body.offsetWidth || 1;
    const viewportScale = window.visualViewport ? window.visualViewport.scale : 1;
    box.textContent =
      'safeTop(raw)=' + cs.paddingTop +
      ' safeLeft(raw)=' + cs.paddingLeft +
      ' bodyScale=' + bodyScale.toFixed(3) +
      ' viewportScale=' + viewportScale.toFixed(3) +
      ' bodyW(rect)=' + document.body.getBoundingClientRect().width.toFixed(1) +
      ' bodyW(offset)=' + document.body.offsetWidth +
      ' innerW=' + window.innerWidth +
      ' clientW=' + document.documentElement.clientWidth +
      ' screenW=' + screen.width;
  }
  update();
  window.addEventListener('resize', update);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', update);
})();
