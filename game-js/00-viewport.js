
(function () {
  // matchMedia('(pointer: coarse)') is the primary signal, but some Android
  // WebView configurations (confirmed on at least one emulator profile,
  // possibly real devices too) report pointer:fine/hover:none instead, even
  // on an actual touchscreen phone. That silently sent phones down the
  // desktop/laptop branch below (1920px design width instead of 980px),
  // squashing the whole page — including panels that then needed scrolling
  // for content that fits fine in a real mobile browser. Falling back to
  // direct touch-capability checks catches that case.
  var hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  var isPhoneScreen = (matchMedia('(pointer: coarse)').matches || hasTouch) && Math.min(screen.width, screen.height) <= 600;
  var isApp = typeof window.Capacitor !== 'undefined';

  if (isPhoneScreen && !isApp) {
    // Website, real mobile browser: the original, working approach. Setting
    // width=980 on the viewport meta makes real mobile browsers report
    // window.innerWidth as ~980 too, so gameplay math (which reads
    // window.innerWidth directly) naturally gets the right proportions.
    var viewport = document.querySelector('meta[name="viewport"]');
    function fitPhoneWeb() {
      var landscape = matchMedia('(orientation: landscape)').matches;
      var deviceWidth = landscape ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
      var scale = deviceWidth / 980;
      viewport.setAttribute('content', 'width=980, initial-scale=' + scale + ', viewport-fit=cover');
    }
    fitPhoneWeb();
    if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', fitPhoneWeb);
    else window.addEventListener('orientationchange', fitPhoneWeb);
    return;
  }

  // Everything below covers two cases that share the same underlying
  // problem: fixed-pixel sprite/UI sizes and CSS vw/vh units render at the
  // true screen size instead of the ~980-1920-wide size the layout is
  // tuned for, whenever the browser/WebView won't apply an optical page
  // zoom for us (confirmed true for the Capacitor/Android WebView app, and
  // true here for real desktop browsers too — initial-scale and CSS zoom
  // are both mobile-only/unreliable there). Fixed directly instead of
  // relying on the browser:
  //   1. Override window.innerWidth/innerHeight so gameplay math (which
  //      reads them directly) sees the intended design size.
  //   2. Every vw/vh in game-css/*.css was rewritten to
  //      calc(N * var(--app-vw/--app-vh, 1vw/1vh)) — normally that custom
  //      property is unset, so it falls back to plain vw/vh (no change);
  //      here it's set to 1% of the design size, so those rules resolve
  //      against the design width instead of the true screen.
  //   3. body gets set to the design size and visually shrunk with a real
  //      CSS transform to fit the true screen. Real DOM elements (menu
  //      buttons etc.) automatically get correct, transform-aware
  //      click/tap hit-testing — only the custom-drawn gameplay (mouse.x/y
  //      in game-js/07-game.js) needs the manual
  //      window.__escapeSnakeRenderScale correction, already in place there.
  var designWidth;
  if (isPhoneScreen && isApp) {
    designWidth = 980; // phone-sized screen, inside the native app wrapper
  } else if (!isPhoneScreen) {
    designWidth = 980; // Desktop uses the same logical pixel size as the phone game.
  } else {
    return; // normal-sized desktop monitor — nothing to fix
  }

  var styleTag = document.createElement('style');
  styleTag.id = 'escape-snake-scale-style';
  document.head.appendChild(styleTag);

  function getTrueViewportSize() {
    // window.innerWidth/innerHeight get overridden below (own properties
    // directly on window in this engine, so deleting them doesn't reveal
    // a native value underneath — just leaves undefined). documentElement
    // .clientWidth/clientHeight is a different property entirely, so it
    // stays accurate regardless of that override or body's transform.
    // Using screen.width/height instead would be simpler but is wrong
    // here: on a windowed (non-fullscreen) desktop browser, the address
    // bar/tabs eat into the vertical space, so screen.height overshoots
    // the actual visible area and cuts content off at the bottom.
    return { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
  }

  function apply() {
    var trueSize = getTrueViewportSize();
    var deviceWidth = trueSize.width;
    var deviceHeight = trueSize.height;
    // Match a 390px phone rendering the 980px game world. Keep that physical
    // scale on wider monitors: extra screen space expands the playable area
    // instead of magnifying every sprite, HUD element and upgrade card.
    if (!isPhoneScreen) {
      var desktopScale = Math.min(390 / 980, deviceWidth / 980, deviceHeight / 980);
      if (!(desktopScale > 0)) return;
      designWidth = deviceWidth / desktopScale;
    }
    var designHeight = deviceHeight * (designWidth / deviceWidth);
    var renderScale = deviceWidth / designWidth;

    try {
      Object.defineProperty(window, 'innerWidth', { configurable: true, get: function () { return designWidth; } });
      Object.defineProperty(window, 'innerHeight', { configurable: true, get: function () { return designHeight; } });
    } catch (err) { /* fall through — worst case, gameplay math uses the true size */ }

    window.__escapeSnakeRenderScale = renderScale;

    styleTag.textContent =
      ':root{--app-vw:' + (designWidth / 100) + 'px;--app-vh:' + (designHeight / 100) + 'px;}' +
      'body{width:' + designWidth + 'px !important;height:' + designHeight + 'px !important;' +
      'transform:scale(' + renderScale + ') !important;transform-origin:top left !important;overflow:hidden !important;}';
  }
  apply();
  if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', apply);
  else window.addEventListener('orientationchange', apply);
  window.addEventListener('resize', apply); // e.g. connecting/disconnecting an external monitor
})();
