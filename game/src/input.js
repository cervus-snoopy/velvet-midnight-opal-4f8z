// Keyboard + mouse for VELVET HOUR. WASD or arrows to move, Shift to sneak,
// click (or 1) to throw a coin at the cursor, 2 for a smoke puff, 3 for EMP.
// Input only reports what the player asked for; the world decides what it
// costs and whether it works.
import { FIELD } from './config.js';

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    mx: 0, my: 0, sneak: false,
    coinX: null, coinY: null,
    smoke: false, emp: false,
    mouseX: 0, mouseY: 0,
    clicked: false,
  };

  function canvasPoint(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / r.width) * canvas.width,
      y: ((clientY - r.top) / r.height) * canvas.height,
    };
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    keys.add(e.key.toLowerCase());
    if (e.key === '2') state.smoke = true;
    if (e.key === '3') state.emp = true;
    if (e.key === '1') state.clicked = true;
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());
  canvas.addEventListener('mousemove', (e) => {
    const p = canvasPoint(e.clientX, e.clientY);
    state.mouseX = p.x;
    state.mouseY = p.y;
  });
  canvas.addEventListener('mousedown', (e) => {
    const p = canvasPoint(e.clientX, e.clientY);
    state.mouseX = p.x;
    state.mouseY = p.y;
    state.clicked = true;
  });

  return {
    state,
    // Read the frame's input and clear the one-shot requests.
    poll() {
      const left = keys.has('a') || keys.has('arrowleft');
      const right = keys.has('d') || keys.has('arrowright');
      const up = keys.has('w') || keys.has('arrowup');
      const down = keys.has('s') || keys.has('arrowdown');
      state.mx = (right ? 1 : 0) - (left ? 1 : 0);
      state.my = (down ? 1 : 0) - (up ? 1 : 0);
      state.sneak = keys.has('shift');
      const out = {
        mx: state.mx, my: state.my, sneak: state.sneak,
        coinX: null, coinY: null,
        smoke: state.smoke, emp: state.emp,
      };
      if (state.clicked) {
        out.coinX = state.mouseX;
        out.coinY = state.mouseY;
        state.clicked = false;
      }
      state.smoke = false;
      state.emp = false;
      return out;
    },
  };
}

// Where the mouse is, in canvas pixels — the render loop uses it to show
// the coin-throw range.
export function mouseInField(input) {
  return {
    x: input.state.mouseX,
    y: input.state.mouseY,
    inside:
      input.state.mouseX >= FIELD.x && input.state.mouseX <= FIELD.x + FIELD.width
      && input.state.mouseY >= FIELD.y && input.state.mouseY <= FIELD.y + FIELD.height,
  };
}
