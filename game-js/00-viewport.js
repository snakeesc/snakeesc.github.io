
(function () {
  var isPhoneScreen = matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) <= 600;
  var isApp = typeof window.Capacitor !== 'undefined';

  if (!isPhoneScreen) return;

  if (!isApp) {
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

  // Native app (Capacitor/Android WebView): neither the viewport-meta trick
  // nor CSS zoom changes what window.innerWidth or vw/vh units resolve
  // against in this WebView (both confirmed not to work), so nothing render
  // at the intended ~980-wide design size automatically. Fixed directly:
  //   1. Override window.innerWidth/innerHeight so gameplay math (which
  //      reads them directly) sees the design size.
  //   2. Every vw/vh in game-css/*.css was rewritten to
  //      calc(N * var(--app-vw/--app-vh, 1vw/1vh)) — on the website that
  //      custom property is unset so it falls back to plain vw/vh
  //      (no change there); here we set it to 1% of the design size, so
  //      those rules resolve against ~980 instead of the true screen.
  //   3. body gets set to the design size and visually shrunk with a real
  //      CSS transform (not zoom, which is what didn't work) to fit the
  //      true screen. Real DOM elements (menu buttons etc.) automatically
  //      get correct, transform-aware click/tap hit-testing — only the
  //      custom-drawn gameplay (mouse.x/y in game-js/07-game.js) needed the
  //      manual window.__escapeSnakeRenderScale correction, already in place.
  var BASELINE = 980;
  var styleTag = document.createElement('style');
  styleTag.id = 'escape-snake-app-scale-style';
  document.head.appendChild(styleTag);

  function apply() {
    var landscape = matchMedia('(orientation: landscape)').matches;
    var deviceWidth = landscape ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
    var deviceHeight = landscape ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height);
    var designWidth = BASELINE;
    var designHeight = deviceHeight * (BASELINE / deviceWidth);
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
})();
