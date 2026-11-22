// VELVET HOUR — the loop. Title, play, caught, win; a fixed 60 Hz step so
// the game and the screenshot scenes advance the same way every time.
import { CANVAS, STEP } from './config.js';
import { createInput } from './input.js';
import { render, SCREEN_CAUGHT, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';
import { World } from './world.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS.width;
canvas.height = CANVAS.height;
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const world = new World(1);

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const statusEl = document.getElementById('status');

let screen = SCREEN_TITLE;
let accumulator = 0;
let last = performance.now();

function announce() {
  const s = world.state;
  if (screen === SCREEN_TITLE) {
    statusEl.textContent = 'Velvet Hour: steal the Moon Opal and reach the service door.';
  } else if (screen === SCREEN_PLAY) {
    statusEl.textContent = `Alarm ${Math.floor(s.alarm)}. ${s.lootTaken ? 'Opal stolen — reach the exit.' : 'The Moon Opal is on display.'}`;
  } else if (screen === SCREEN_CAUGHT) {
    statusEl.textContent = `Caught. ${s.caughtReason}`;
  } else {
    statusEl.textContent = `Clean getaway. Score ${s.score}.`;
  }
}

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (screen === SCREEN_PLAY) {
    accumulator += dt;
    while (accumulator >= STEP) {
      world.step(STEP, input.poll());
      accumulator -= STEP;
      if (world.state.status === 'caught') screen = SCREEN_CAUGHT;
      if (world.state.status === 'win') screen = SCREEN_WIN;
    }
  }
  render(ctx, world.state, screen);
  announce();
  requestAnimationFrame(frame);
}

function start() {
  if (screen !== SCREEN_TITLE) return;
  screen = SCREEN_PLAY;
}

function restart() {
  world.reset(1);
  screen = SCREEN_TITLE;
  accumulator = 0;
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') start();
  if (e.key.toLowerCase() === 'r' && (screen === SCREEN_CAUGHT || screen === SCREEN_WIN)) restart();
});
canvas.addEventListener('click', start);

// Screenshot mode: stage one deterministic scene, draw it once, and tell
// the screenshot driver the frame is ready.
if (shotName) {
  const staged = stageShot(shotName, world);
  screen = staged.screen;
  render(ctx, world.state, screen);
  announce();
  window.__shotReady = true;
  window.__shotScreen = screen;
  window.__shotAlarm = Math.floor(world.state.alarm);
  window.__shotStatus = world.state.status;
} else {
  render(ctx, world.state, screen);
  requestAnimationFrame(frame);
}
