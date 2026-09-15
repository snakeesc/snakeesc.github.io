
(function () {
  const isPhoneScreen = matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) <= 600;

  if (isPhoneScreen) {
    const viewport = document.querySelector('meta[name="viewport"]');
    function fitPhone() {
      const landscape = matchMedia('(orientation: landscape)').matches;
      const deviceWidth = landscape ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
      const scale = deviceWidth / 980;
      viewport.setAttribute('content', 'width=980, initial-scale=' + scale + ', viewport-fit=cover');
    }
    fitPhone();
    if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', fitPhone);
    else window.addEventListener('orientationchange', fitPhone);
    return;
  }

  // Mouse/trackpad screens (laptops, small monitors, undersized windows).
  // Desktop browsers ignore the viewport meta's initial-scale, so the phone
  // trick above can't apply here. CSS zoom gets the same "render a bigger
  // design, then shrink it to fit" effect and desktop browsers honor it.
  // Driven off screen.width (not window.innerWidth) so it doesn't feed back
  // into itself once zoom is applied.
  const DESKTOP_REF = 1920; // width the layout/sprite sizes are tuned to look right at
  function fitDesktop() {
    const zoom = screen.width < DESKTOP_REF ? screen.width / DESKTOP_REF : 1;
    document.documentElement.style.zoom = zoom;
  }
  fitDesktop();
  window.addEventListener('resize', fitDesktop);
})();
