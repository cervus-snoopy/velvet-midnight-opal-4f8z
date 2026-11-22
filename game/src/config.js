// VELVET HOUR — Galleria Nocturne. All tuning lives here: the room, the
// patrol routes, the cameras, the loot and the tools. Nothing in this file
// knows how to draw or how to step a frame; it only declares the gallery.
export const CANVAS = { width: 1280, height: 800 };

// The playable floor inside the walls. The HUD strip sits above it.
export const FIELD = { x: 40, y: 96, width: 1200, height: 664 };

// Palette: midnight blue, warm museum gold, glowing cyan loot.
export const COLORS = {
  floorA: '#101a30',
  floorB: '#0c1424',
  wall: '#1c2947',
  wallTrim: '#c9a227',
  velvet: '#241640',
  velvetEdge: '#4b2e83',
  gold: '#d8b45a',
  goldDim: '#8a6d2f',
  marble: '#c8ccd4',
  fountain: '#16324a',
  water: '#2e6f8e',
  plant: '#1e4d2e',
  plantLeaf: '#2f7a44',
  opal: '#5ff2e4',
  opalCore: '#b8fff6',
  coneCalm: 'rgba(255, 208, 64, 0.30)',
  coneCalmEdge: 'rgba(255, 208, 64, 0.75)',
  coneHot: 'rgba(255, 64, 64, 0.38)',
  coneHotEdge: 'rgba(255, 64, 64, 0.9)',
  camCone: 'rgba(255, 70, 70, 0.26)',
  camConeEdge: 'rgba(255, 70, 70, 0.7)',
  thiefCoat: '#16181f',
  thiefScarf: '#f2f0e6',
  guardCoat: '#233a6b',
  guardCap: '#101d38',
  smoke: 'rgba(200, 205, 215, 0.55)',
  hudBack: '#0a0f1e',
  hudText: '#e8e2cf',
  alarmLow: '#3fae6a',
  alarmMid: '#e0a83c',
  alarmHigh: '#e5484d',
};

// Obstacles. blocksMove stops the thief and the guards; blocksSight cuts
// vision cones and camera lines. Ropes are low: they stop feet, not eyes.
export const OBSTACLES = [
  // Central fountain: the room's big sight-blocker.
  { x: 560, y: 380, w: 160, h: 90, blocksMove: true, blocksSight: true, kind: 'fountain' },
  // Display pedestals with glass cases.
  { x: 300, y: 210, w: 96, h: 64, blocksMove: true, blocksSight: true, kind: 'pedestal' },
  { x: 900, y: 300, w: 96, h: 64, blocksMove: true, blocksSight: true, kind: 'pedestal' },
  { x: 300, y: 430, w: 96, h: 64, blocksMove: true, blocksSight: true, kind: 'pedestal' },
  // Tall potted palms.
  { x: 140, y: 380, w: 52, h: 52, blocksMove: true, blocksSight: true, kind: 'plant' },
  { x: 1100, y: 560, w: 52, h: 52, blocksMove: true, blocksSight: true, kind: 'plant' },
  // Velvet ropes: waist-high, crossable by sight only — and the guards step
  // over them on their rounds, so they stop the thief alone.
  { x: 200, y: 300, w: 280, h: 10, blocksMove: true, blocksSight: false, kind: 'rope', thiefOnly: true },
  { x: 800, y: 520, w: 320, h: 10, blocksMove: true, blocksSight: false, kind: 'rope', thiefOnly: true },
];

// Dark velvet carpet runners: the quiet routes through the gallery.
export const CARPETS = [
  { x: 60, y: 640, w: 420, h: 56 },
  { x: 800, y: 640, w: 380, h: 56 },
];

// The Moon Opal, on its pedestal at the far end of the gallery.
export const OPAL = { x: 1158, y: 194, pedestal: { x: 1120, y: 170, w: 76, h: 48 }, pickup: 52 };

// The service door: the way out, once the Opal is yours.
export const EXIT = { x: 600, y: 738, w: 84, h: 22 };

// Where the thief slips in.
export const THIEF_START = { x: 140, y: 690 };

export const THIEF = {
  radius: 14,
  walkSpeed: 175,
  sneakSpeed: 88,
  // Suspicion grows slower while sneaking: a slow thief is a quiet thief.
  sneakSuspicion: 0.6,
};

// A guard walks a fixed loop of waypoints and looks where it walks.
export const GUARDS = [
  {
    name: 'Marlowe',
    waypoints: [
      { x: 240, y: 180 }, { x: 240, y: 620 }, { x: 430, y: 620 }, { x: 430, y: 180 },
    ],
    patrolSpeed: 62,
    chaseSpeed: 118,
  },
  {
    name: 'Ivy',
    waypoints: [
      { x: 860, y: 180 }, { x: 1080, y: 180 }, { x: 1080, y: 620 }, { x: 860, y: 620 },
    ],
    patrolSpeed: 62,
    chaseSpeed: 118,
  },
  {
    name: 'Bram',
    waypoints: [
      { x: 520, y: 300 }, { x: 760, y: 300 }, { x: 760, y: 560 }, { x: 520, y: 560 },
    ],
    patrolSpeed: 72,
    chaseSpeed: 126,
  },
];

export const VISION = {
  range: 235,
  halfAngle: 0.55, // about 31 degrees each side of the facing
  // Suspicion per second while the thief stands in the cone, in the open.
  gain: 58,
  closeBonus: 1.6, // inside 95 px the guard is surer, faster
  closeRange: 95,
  decay: 26, // suspicion per second while unseen
  chaseAt: 70, // suspicion that turns a patrol into a chase
  catchRadius: 27, // a guard that touches the thief ends the night
};

// Cameras sweep a fixed arc from the wall. Their cones are always red:
// a camera never gets curious, it only raises the alarm.
export const CAMERAS = [
  { x: 640, y: 104, base: Math.PI / 2, sweep: 1.15, speed: 0.45, range: 400, halfAngle: 0.42 },
  { x: 1228, y: 420, base: Math.PI, sweep: 1.05, speed: 0.55, range: 400, halfAngle: 0.42 },
];

// The alarm meter: 0 quiet, 100 lockdown.
export const ALARM = {
  cameraGain: 20, // per second while a camera sees the thief
  guardGain: 7, // per second while a guard is suspicious
  decay: 4, // per second while nobody sees the thief
  lockdown: 100,
  // Guards hurry as the meter climbs: +40% speed at full alarm.
  speedBonus: 0.4,
};

// Paid tools: every use costs one of a small stock.
export const TOOLS = {
  coins: 3, // thrown: the nearest guard walks over to look
  coinRange: 330, // how far a throw reaches from the thief
  coinInvestigate: 4.5, // seconds the guard spends at the coin
  smoke: 2, // a puff that breaks every line of sight
  smokeSeconds: 3,
  emp: 1, // kills both cameras for ten seconds
  empSeconds: 10,
};

export const STEP = 1 / 60;
export const SPOTTED_GRACE = 1.4; // seconds to break line of sight once seen
