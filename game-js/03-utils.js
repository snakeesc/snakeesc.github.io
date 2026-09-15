// frog-game-utils.js
// Shared helper utilities for the Frog Snake survival game.

(function () {
  "use strict";

  const Config = window.FrogGameConfig || {};

  function randInt(min, maxInclusive) {
    return Math.floor(Math.random() * (maxInclusive - min + 1)) + min;
  }

  function randRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  function pickRandomTokenIds(count) {
    const ids = [];
    for (let i = 0; i < count; i++) {
      ids.push(randInt(1, Config.MAX_TOKEN_ID || 0));
    }
    return ids;
  }

  function computeInitialPositions(width, height, count) {
    const positions = [];
    const MIN_DIST = 52;
    const margin = 16;
    const frogSize = Config.FROG_SIZE || 0;

    let safety = count * 80;
    while (positions.length < count && safety-- > 0) {
      const x = margin + Math.random() * (width - margin * 2 - frogSize);
      const y = margin + Math.random() * (height - margin * 2 - frogSize);
      const cx = x + frogSize / 2;
      const cy = y + frogSize / 2;

      let ok = true;
      for (const p of positions) {
        const pcx = p.x + frogSize / 2;
        const pcy = p.y + frogSize / 2;
        const dx = cx - pcx;
        const dy = cy - pcy;
        if (dx * dx + dy * dy < MIN_DIST * MIN_DIST) {
          ok = false;
          break;
        }
      }
      if (ok) positions.push({ x, y });
    }
    return positions;
  }

  window.FrogGameUtils = {
    randInt,
    randRange,
    pickRandomTokenIds,
    computeInitialPositions
  };
})();
