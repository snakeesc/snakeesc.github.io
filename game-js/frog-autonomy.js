// Experimental, local-sensing movement. Called only when a frog starts a hop.
(function (root) {
  'use strict';
  function choose(frog, world, random = Math.random) {
    const {width, height, size, snakeSize, orbRadius, maxStep} = world;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(Math.max(lo, hi), v));
    const cx = frog.x + size / 2, cy = frog.baseY + size / 2;
    const threats = world.snakes.filter(s => s && s.head).map(s => ({
      x: s.head.x + snakeSize / 2, y: s.head.y + snakeSize / 2
    })).filter(s => Math.hypot(cx-s.x, cy-s.y) < 170);
    let goal;
    if (world.guide) {
      goal = {x: world.guide.x + (world.lane || 0) * 55, y: world.guide.y};
    } else {
      // Nearby orbs only; keep a chosen orb until it vanishes or leaves sight.
      let orb = frog.autoOrb;
      if (!world.orbs.includes(orb) || Math.hypot(cx-orb.x-orbRadius, cy-orb.y-orbRadius) > 240) {
        orb = null;
        let best = 220;
        for (const candidate of world.orbs) {
          const d = Math.hypot(cx-candidate.x-orbRadius, cy-candidate.y-orbRadius);
          if (d < best) { best = d; orb = candidate; }
        }
        frog.autoOrb = orb;
      }
      if (orb) goal = {x: orb.x + orbRadius, y: orb.y + orbRadius};
      else {
        if (!Number.isFinite(frog.autoHeading) || !(frog.autoWanderHops > 0)) {
          frog.autoHeading = random() * Math.PI * 2;
          frog.autoWanderHops = 3 + Math.floor(random() * 5);
        }
        frog.autoWanderHops--;
        goal = {x: cx + Math.cos(frog.autoHeading)*100, y: cy + Math.sin(frog.autoHeading)*100};
      }
    }
    const heading = Math.atan2(goal.y-cy, goal.x-cx);
    const goalDistance = Math.hypot(goal.x-cx, goal.y-cy);
    let bestScore = -Infinity, best;
    // Evaluate real, clamped hop endpoints so walls don't trap escape attempts.
    for (let i = 0; i < 24; i++) {
      const angle = heading + i * Math.PI / 12;
      const step = threats.length ? maxStep : Math.min(maxStep, goalDistance);
      const x = clamp(frog.x + Math.cos(angle)*step, 8, width-size-8);
      const y = clamp(frog.baseY + Math.sin(angle)*step, 24, height-size-24);
      const ex = x+size/2, ey = y+size/2;
      let rating = (goalDistance - Math.hypot(goal.x-ex, goal.y-ey)) * 0.65;
      for (const t of threats) {
        const before = Math.hypot(cx-t.x, cy-t.y);
        const after = Math.hypot(ex-t.x, ey-t.y);
        rating += (after-before) * Math.max(0, (170-before)/170) * 3;
        // Penalize hops whose ground path passes directly beside a head.
        const dx=ex-cx, dy=ey-cy;
        const u=clamp(((t.x-cx)*dx+(t.y-cy)*dy)/(dx*dx+dy*dy || 1),0,1);
        const near=Math.hypot(cx+dx*u-t.x,cy+dy*u-t.y);
        rating -= Math.max(0, 60-near)*2;
      }
      if (x < 20 || x > width-size-20 || y < 36 || y > height-size-36) rating -= 12;
      if (rating > bestScore) { bestScore=rating; best={x,y}; }
    }
    if (!world.guide && !frog.autoOrb) frog.autoHeading = Math.atan2(best.y-frog.baseY,best.x-frog.x);
    return best;
  }
  root.FrogAutonomy = {choose};
})(typeof window !== 'undefined' ? window : globalThis);
