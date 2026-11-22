// The screenshot scenes behind ?shot=heist|spotted|tools|getaway. Each one
// plays the real rules forward from a fresh world, steered by a waypoint
// pilot that walks the gallery the way a careful thief would — so the frame
// is what a short game really looks like, and the same seed always gives
// the same frame.
import { OPAL, STEP } from './config.js';
import { EVENT_CAUGHT, EVENT_WIN, World } from './world.js';
import { SCREEN_CAUGHT, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const SAMPLE = STEP;

// Steer toward the current waypoint; pop it when close. A waypoint may ask
// to hold still for `hold` seconds, or until `until(state)` is true.
function pilotFor(queue) {
  let holdLeft = 0;
  return function pilot(state) {
    const out = { mx: 0, my: 0, sneak: false, coinX: null, coinY: null, smoke: false, emp: false };
    if (queue.length === 0) return out;
    const wp = queue[0];
    const dx = wp.x - state.thief.x;
    const dy = wp.y - state.thief.y;
    const d = Math.hypot(dx, dy);
    if (d < 12) {
      if (wp.hold !== undefined) {
        if (holdLeft <= 0) holdLeft = wp.hold;
        holdLeft -= SAMPLE;
        if (holdLeft <= 0) queue.shift();
        return out;
      }
      if (wp.until) {
        if (wp.until(state)) queue.shift();
        return out;
      }
      queue.shift();
      return out;
    }
    out.mx = dx / d;
    out.my = dy / d;
    out.sneak = !!wp.sneak;
    return out;
  };
}

// Step the world with a pilot for up to `seconds`, stopping early when
// `stop(state)` is true. Returns the events seen.
function run(world, seconds, pilot, stop) {
  let events = 0;
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    events |= world.step(STEP, pilot(world.state));
    if (stop && stop(world.state, events)) break;
    if (world.state.status !== 'play') break;
  }
  return events;
}

function stageHeist(world) {
  // Mid-heist: the thief slips up the middle, ahead of Marlowe's patrol,
  // and waits in Bram's cone as it closes in — tension, no catch yet.
  // Eleven seconds: Bram's suspicion is warming but the grace window has
  // not opened, so the frame stays a close call instead of a capture.
  const queue = [
    { x: 320, y: 690 }, { x: 320, y: 520 }, { x: 520, y: 500 },
    { x: 520, y: 250 }, { x: 430, y: 250 },
  ];
  run(world, 11, pilotFor(queue));
  return { screen: world.state.status === 'play' ? SCREEN_PLAY : SCREEN_CAUGHT, best: 0 };
}

function stageSpotted(world) {
  // Ivy's beat, right side: the thief waits in the open until a guard is
  // sure — the SPOTTED banner and the red cone, frozen in the grace window.
  const queue = [
    { x: 700, y: 690 }, { x: 1000, y: 690 }, { x: 1010, y: 430 },
  ];
  run(world, 26, pilotFor(queue), (s) => s.spotted);
  return { screen: world.state.status === 'play' ? SCREEN_PLAY : SCREEN_CAUGHT, best: 0 };
}

function stageTools(world) {
  // The paid tools at work: a coin thrown onto Marlowe's route pulls him
  // away, then a smoke puff hides the thief mid-gallery.
  const queue = [{ x: 320, y: 690 }, { x: 320, y: 500 }];
  const base = pilotFor(queue);
  let coinThrown = false;
  let smokeUsed = false;
  const pilot = (state) => {
    const out = base(state);
    if (!coinThrown && state.time >= 2) {
      coinThrown = true;
      out.coinX = 430;
      out.coinY = 300;
    }
    if (!smokeUsed && state.time >= 5.5) {
      smokeUsed = true;
      out.smoke = true;
    }
    return out;
  };
  run(world, 7, pilot);
  return { screen: world.state.status === 'play' ? SCREEN_PLAY : SCREEN_CAUGHT, best: 0 };
}

function stageGetaway(world) {
  // The Opal is lifted; the thief runs the right carpet for the service
  // door while the alarm is high and Ivy closes in. The pilot waits at the
  // bottom until Ivy is on her far leg, climbs the right side clear of the
  // velvet rope, pauses a beat in the east camera's stare on the way down,
  // then vanishes in smoke and runs for the door.
  const queue = [
    { x: 640, y: 700, until: (s) => s.time > 15 && s.guards[1].x < 900 && s.guards[1].y > 300 },
    { x: 1160, y: 700 },
    { x: 1160, y: 320 },
    { x: OPAL.x, y: OPAL.y + 30 },
    { x: 1120, y: 430, hold: 2.0 },
    { x: 1160, y: 700 },
    { x: 900, y: 690 },
    { x: 660, y: 730 },
  ];
  const base = pilotFor(queue);
  let smokeUsed = false;
  const pilot = (state) => {
    const out = base(state);
    if (!smokeUsed && state.lootTaken && state.thief.y > 450 && state.smokeLeft > 0) {
      smokeUsed = true;
      out.smoke = true;
    }
    return out;
  };
  run(world, 48, pilot, (s) => {
    if (!s.lootTaken) return false;
    return Math.hypot(s.thief.x - 642, s.thief.y - 740) < 150;
  });
  const s = world.state;
  return {
    screen: s.status === 'win' ? SCREEN_WIN : s.status === 'caught' ? SCREEN_CAUGHT : SCREEN_PLAY,
    best: s.score,
  };
}

/**
 * Set `world` to the named scene (heist, spotted, tools or getaway; any
 * other name is the title) and return the screen to draw over it.
 */
export function stageShot(name, world) {
  world.reset(1);
  if (name === 'heist') return stageHeist(world);
  if (name === 'spotted') return stageSpotted(world);
  if (name === 'tools') return stageTools(world);
  if (name === 'getaway') return stageGetaway(world);
  return { screen: SCREEN_TITLE, best: 0 };
}

// Re-exported for the game loop's own use.
export { EVENT_CAUGHT, EVENT_WIN };
