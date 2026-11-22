// VELVET HOUR — the rules. One world, one step: the thief moves, the
// guards patrol and look, the cameras sweep, the alarm climbs and falls,
// the tools spend themselves. Rendering and input live elsewhere; this file
// only decides what is true about the gallery after each tick.
import {
  ALARM, CAMERAS, EXIT, FIELD, GUARDS, OBSTACLES, OPAL, SPOTTED_GRACE,
  THIEF, THIEF_START, TOOLS, VISION,
} from './config.js';
import { makeRng } from './random.js';

export const EVENT_CAUGHT = 1;
export const EVENT_WIN = 2;
export const EVENT_PICKUP = 4;
export const EVENT_SPOTTED = 8;

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
function normAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}
function angleDiff(a, b) { return Math.abs(normAngle(a - b)); }

// Liang-Barsky: does the segment (x1,y1)-(x2,y2) cross the rectangle?
function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
  for (let i = 0; i < 4; i += 1) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

// True when nothing solid stands between the two points.
export function lineOfSight(x1, y1, x2, y2) {
  for (const o of OBSTACLES) {
    if (!o.blocksSight) continue;
    if (segmentHitsRect(x1, y1, x2, y2, o)) return false;
  }
  return true;
}

// Can `watcher` at (wx,wy) facing `angle` see the point (tx,ty)?
export function canSee(wx, wy, angle, range, halfAngle, tx, ty) {
  const d = dist(wx, wy, tx, ty);
  if (d > range) return false;
  if (d > 1 && angleDiff(Math.atan2(ty - wy, tx - wx), angle) > halfAngle) return false;
  return lineOfSight(wx, wy, tx, ty);
}

// Push a circle out of every solid rectangle and the room walls. Guards step
// over the velvet ropes; the thief does not.
function collide(x, y, radius, isGuard = false) {
  let nx = clamp(x, FIELD.x + radius, FIELD.x + FIELD.width - radius);
  let ny = clamp(y, FIELD.y + radius, FIELD.y + FIELD.height - radius);
  for (const o of OBSTACLES) {
    if (!o.blocksMove) continue;
    if (isGuard && o.thiefOnly) continue;
    const cx = clamp(nx, o.x, o.x + o.w);
    const cy = clamp(ny, o.y, o.y + o.h);
    const d = dist(nx, ny, cx, cy);
    if (d >= radius) continue;
    if (d === 0) { ny = o.y - radius; continue; }
    nx = cx + ((nx - cx) / d) * radius;
    ny = cy + ((ny - cy) / d) * radius;
  }
  return { x: nx, y: ny };
}

export function freshState(seed) {
  const rng = makeRng(seed);
  return {
    seed,
    rng,
    time: 0,
    status: 'play', // play | caught | win
    caughtReason: '',
    alarm: 0,
    lootTaken: false,
    coins: TOOLS.coins,
    smokeLeft: TOOLS.smoke,
    empLeft: TOOLS.emp,
    smokeTimer: 0,
    empTimer: 0,
    coin: null, // { x, y } where a thrown coin landed
    spotted: false,
    grace: 0,
    score: 0,
    thief: {
      x: THIEF_START.x, y: THIEF_START.y, angle: -Math.PI / 2,
      sneak: false, moving: false,
    },
    guards: GUARDS.map((g) => ({
      name: g.name,
      x: g.waypoints[0].x, y: g.waypoints[0].y,
      angle: Math.PI / 2,
      wp: 1,
      patrolSpeed: g.patrolSpeed,
      chaseSpeed: g.chaseSpeed,
      waypoints: g.waypoints,
      suspicion: 0,
      mode: 'patrol', // patrol | investigate | chase
      invX: 0, invY: 0, invT: 0, scanT: 0,
      seesThief: false,
    })),
    cameras: CAMERAS.map((c) => ({ ...c, angle: c.base, off: 0 })),
  };
}

export class World {
  constructor(seed = 1) {
    this.state = freshState(seed);
  }

  reset(seed = 1) {
    this.state = freshState(seed);
  }

  // One tick. `input` is { mx, my, sneak, coinX, coinY, smoke, emp }.
  // mx/my are a -1..1 move direction; coinX/coinY a throw target or null;
  // smoke/emp are one-shot tool requests. Returns an event bitmask.
  step(dt, input) {
    const s = this.state;
    if (s.status !== 'play') return 0;
    let events = 0;
    s.time += dt;
    if (s.smokeTimer > 0) s.smokeTimer -= dt;
    if (s.empTimer > 0) s.empTimer -= dt;

    // --- tools ------------------------------------------------------------
    if (input.smoke && s.smokeLeft > 0 && s.smokeTimer <= 0) {
      s.smokeLeft -= 1;
      s.smokeTimer = TOOLS.smokeSeconds;
    }
    if (input.emp && s.empLeft > 0 && s.empTimer <= 0) {
      s.empLeft -= 1;
      s.empTimer = TOOLS.empSeconds;
      for (const c of s.cameras) c.off = TOOLS.empSeconds;
    }
    if (input.coinX !== null && input.coinX !== undefined && s.coins > 0) {
      const cx = clamp(input.coinX, FIELD.x, FIELD.x + FIELD.width);
      const cy = clamp(input.coinY, FIELD.y, FIELD.y + FIELD.height);
      const d = dist(s.thief.x, s.thief.y, cx, cy);
      if (d <= TOOLS.coinRange) {
        s.coins -= 1;
        s.coin = { x: cx, y: cy };
        let best = null;
        let bestD = Infinity;
        for (const g of s.guards) {
          const gd = dist(g.x, g.y, cx, cy);
          if (gd < bestD) { bestD = gd; best = g; }
        }
        if (best && bestD < 430) {
          best.mode = 'investigate';
          best.invX = cx;
          best.invY = cy;
          best.invT = TOOLS.coinInvestigate;
          best.scanT = 0;
          best.suspicion = Math.max(0, best.suspicion - 30);
        }
      }
    }

    // --- the thief --------------------------------------------------------
    const speed = input.sneak ? THIEF.sneakSpeed : THIEF.walkSpeed;
    const mag = Math.hypot(input.mx, input.my);
    const nx = mag > 0 ? input.mx / Math.max(1, mag) : 0;
    const ny = mag > 0 ? input.my / Math.max(1, mag) : 0;
    const moved = collide(
      s.thief.x + nx * speed * dt,
      s.thief.y + ny * speed * dt,
      THIEF.radius,
    );
    s.thief.x = moved.x;
    s.thief.y = moved.y;
    s.thief.moving = mag > 0;
    s.thief.sneak = !!input.sneak;
    if (mag > 0) s.thief.angle = Math.atan2(ny, nx);
    const hidden = s.smokeTimer > 0;

    // --- cameras ----------------------------------------------------------
    let cameraSees = false;
    for (const c of s.cameras) {
      if (c.off > 0) c.off -= dt;
      c.angle = c.base + Math.sin(s.time * c.speed) * (c.sweep / 2);
      if (c.off <= 0 && !hidden && canSee(c.x, c.y, c.angle, c.range, c.halfAngle, s.thief.x, s.thief.y)) {
        cameraSees = true;
      }
    }

    // --- guards -----------------------------------------------------------
    const alarmHurry = 1 + (s.alarm / 100) * ALARM.speedBonus;
    let guardSees = false;
    for (const g of s.guards) {
      const sees = !hidden && canSee(g.x, g.y, g.angle, VISION.range, VISION.halfAngle, s.thief.x, s.thief.y);
      g.seesThief = sees;
      if (sees) guardSees = true;

      // Suspicion: faster up close, slower while sneaking, down when unseen.
      if (sees) {
        const d = dist(g.x, g.y, s.thief.x, s.thief.y);
        let gain = VISION.gain;
        if (d < VISION.closeRange) gain *= VISION.closeBonus;
        if (input.sneak) gain *= THIEF.sneakSuspicion;
        g.suspicion = Math.min(100, g.suspicion + gain * dt);
      } else {
        g.suspicion = Math.max(0, g.suspicion - VISION.decay * dt);
      }

      // The fair caught moment: full suspicion is a warning, not an instant
      // loss. Break line of sight inside the grace window and you live.
      if (g.suspicion >= 100 && !s.spotted) {
        s.spotted = true;
        s.grace = SPOTTED_GRACE;
        events |= EVENT_SPOTTED;
      }

      // Move: chase the thief, walk to a coin, or keep the patrol.
      let target = null;
      let spd = g.patrolSpeed * alarmHurry;
      if (g.mode === 'investigate') {
        target = { x: g.invX, y: g.invY };
        if (dist(g.x, g.y, g.invX, g.invY) < 18) {
          if (g.scanT <= 0) g.scanT = g.invT; // dwell at the coin, looking around
          g.scanT -= dt;
          g.angle += dt * 1.8; // look around before giving up
          if (g.scanT <= 0) {
            g.mode = 'patrol';
            s.coin = null;
          }
          target = null;
        }
      } else if (g.suspicion >= VISION.chaseAt && sees) {
        g.mode = 'chase';
        target = { x: s.thief.x, y: s.thief.y };
        spd = g.chaseSpeed * alarmHurry;
      } else {
        if (g.mode === 'chase' && !sees) g.mode = 'patrol';
        const wp = g.waypoints[g.wp];
        target = wp;
        if (dist(g.x, g.y, wp.x, wp.y) < 8) {
          g.wp = (g.wp + 1) % g.waypoints.length;
        }
      }
      if (target) {
        const dx = target.x - g.x;
        const dy = target.y - g.y;
        const dd = Math.hypot(dx, dy);
        if (dd > 0.01) {
          const want = Math.atan2(dy, dx);
          g.angle += normAngle(want - g.angle) * Math.min(1, dt * 6);
          const stepLen = Math.min(dd, spd * dt);
          const pos = collide(g.x + (dx / dd) * stepLen, g.y + (dy / dd) * stepLen, 15, true);
          g.x = pos.x;
          g.y = pos.y;
        }
      }
      if (g.mode === 'chase' && dist(g.x, g.y, s.thief.x, s.thief.y) < VISION.catchRadius) {
        s.status = 'caught';
        s.caughtReason = `${g.name} caught you in the gallery.`;
        events |= EVENT_CAUGHT;
      }
    }

    // --- the SPOTTED grace window -----------------------------------------
    if (s.spotted && s.status === 'play') {
      if (!guardSees && !cameraSees) {
        s.spotted = false;
        for (const g of s.guards) g.suspicion = Math.min(g.suspicion, 60);
      } else {
        s.grace -= dt;
        if (s.grace <= 0) {
          s.status = 'caught';
          s.caughtReason = 'Spotted — nowhere left to hide.';
          events |= EVENT_CAUGHT;
        }
      }
    }

    // --- the alarm --------------------------------------------------------
    if (cameraSees) s.alarm = Math.min(100, s.alarm + ALARM.cameraGain * dt);
    if (guardSees) s.alarm = Math.min(100, s.alarm + ALARM.guardGain * dt);
    if (!cameraSees && !guardSees) s.alarm = Math.max(0, s.alarm - ALARM.decay * dt);
    if (s.alarm >= ALARM.lockdown && s.status === 'play') {
      s.status = 'caught';
      s.caughtReason = 'Alarm hit 100 — the gallery locked down.';
      events |= EVENT_CAUGHT;
    }

    // --- the loot and the door --------------------------------------------
    if (!s.lootTaken && dist(s.thief.x, s.thief.y, OPAL.x, OPAL.y) < OPAL.pickup) {
      s.lootTaken = true;
      events |= EVENT_PICKUP;
    }
    if (s.status === 'play' && s.lootTaken
      && s.thief.x > EXIT.x && s.thief.x < EXIT.x + EXIT.w
      && s.thief.y > EXIT.y - 14) {
      s.status = 'win';
      s.score = Math.max(500, 12000 - Math.floor(s.time) * 40 - Math.floor(s.alarm) * 25);
      events |= EVENT_WIN;
    }
    return events;
  }
}
