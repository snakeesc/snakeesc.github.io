
(function () {
  if (!matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) > 600) return;
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
})();
