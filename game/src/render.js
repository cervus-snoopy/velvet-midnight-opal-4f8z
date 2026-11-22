// VELVET HOUR — every pixel the player sees. Midnight blue, warm museum
// gold, glowing cyan loot: safe cover reads purple, danger reads yellow and
// red, the Opal reads cyan, at a glance and at thumbnail size.
import {
  ALARM, CAMERAS, CANVAS, CARPETS, COLORS, EXIT, FIELD, OBSTACLES, OPAL,
  TOOLS, VISION,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_WIN = 'win';

function conePath(ctx, x, y, angle, range, halfAngle) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, range, halfAngle, fill, edge) {
  conePath(ctx, x, y, angle, range, halfAngle);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  // Marble checker.
  const tile = 40;
  for (let y = FIELD.y; y < FIELD.y + FIELD.height; y += tile) {
    for (let x = FIELD.x; x < FIELD.x + FIELD.width; x += tile) {
      const even = ((x - FIELD.x) / tile + (y - FIELD.y) / tile) % 2 === 0;
      ctx.fillStyle = even ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  // Velvet carpet runners: the quiet routes. A dashed gold inner line keeps
  // them reading as runners, not walls.
  for (const c of CARPETS) {
    ctx.fillStyle = COLORS.velvet;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = COLORS.velvetEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
    ctx.save();
    ctx.strokeStyle = 'rgba(216, 180, 90, 0.55)';
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(c.x + 8, c.y + 8, c.w - 16, c.h - 16);
    ctx.restore();
  }
  // Gold wall trim.
  ctx.strokeStyle = COLORS.wallTrim;
  ctx.lineWidth = 3;
  ctx.strokeRect(FIELD.x - 3, FIELD.y - 3, FIELD.width + 6, FIELD.height + 6);
}

function drawObstacle(ctx, o, time) {
  if (o.kind === 'fountain') {
    ctx.fillStyle = COLORS.fountain;
    ctx.beginPath();
    ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, o.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.goldDim;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = COLORS.water;
    ctx.beginPath();
    ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2, o.w / 2 - 14, o.h / 2 - 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // A slow ripple so the water reads as water.
    ctx.strokeStyle = 'rgba(180, 230, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const r = 12 + ((time * 14) % 34);
    ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2, r, r * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }
  if (o.kind === 'pedestal') {
    ctx.fillStyle = '#2a2f3d';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.strokeStyle = COLORS.goldDim;
    ctx.lineWidth = 2;
    ctx.strokeRect(o.x + 1, o.y + 1, o.w - 2, o.h - 2);
    ctx.fillStyle = 'rgba(200, 220, 255, 0.18)';
    ctx.fillRect(o.x + 8, o.y + 8, o.w - 16, o.h - 16);
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.arc(o.x + o.w / 2, o.y + o.h / 2, 7, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (o.kind === 'plant') {
    ctx.fillStyle = '#3a2c1c';
    ctx.fillRect(o.x + 8, o.y + o.h - 16, o.w - 16, 16);
    ctx.fillStyle = COLORS.plant;
    ctx.beginPath();
    ctx.arc(o.x + o.w / 2, o.y + o.h / 2 - 6, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.plantLeaf;
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2 + 0.4;
      ctx.beginPath();
      ctx.ellipse(
        o.x + o.w / 2 + Math.cos(a) * 14, o.y + o.h / 2 - 6 + Math.sin(a) * 14,
        12, 6, a, 0, Math.PI * 2,
      );
      ctx.fill();
    }
    return;
  }
  if (o.kind === 'rope') {
    ctx.strokeStyle = '#7a2e4d';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(o.x, o.y + o.h / 2);
    ctx.quadraticCurveTo(o.x + o.w / 2, o.y + o.h / 2 + 7, o.x + o.w, o.y + o.h / 2);
    ctx.stroke();
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.arc(o.x, o.y + o.h / 2, 4, 0, Math.PI * 2);
    ctx.arc(o.x + o.w, o.y + o.h / 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawOpal(ctx, state) {
  const p = OPAL.pedestal;
  ctx.fillStyle = '#2a2f3d';
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(p.x + 1, p.y + 1, p.w - 2, p.h - 2);
  if (state.lootTaken) return;
  const pulse = 1 + Math.sin(state.time * 3) * 0.12;
  const glow = ctx.createRadialGradient(OPAL.x, OPAL.y, 4, OPAL.x, OPAL.y, 74 * pulse);
  glow.addColorStop(0, 'rgba(95, 242, 228, 0.85)');
  glow.addColorStop(0.45, 'rgba(95, 242, 228, 0.28)');
  glow.addColorStop(1, 'rgba(95, 242, 228, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(OPAL.x, OPAL.y, 74 * pulse, 0, Math.PI * 2);
  ctx.fill();
  // The gem itself: a cut diamond.
  ctx.fillStyle = COLORS.opalCore;
  ctx.beginPath();
  ctx.moveTo(OPAL.x, OPAL.y - 16);
  ctx.lineTo(OPAL.x + 12, OPAL.y);
  ctx.lineTo(OPAL.x, OPAL.y + 16);
  ctx.lineTo(OPAL.x - 12, OPAL.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = COLORS.opal;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MOON OPAL', OPAL.x, OPAL.y - 30);
}

function drawExit(ctx, state) {
  ctx.fillStyle = state.lootTaken ? '#1d5c33' : '#233148';
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.strokeStyle = state.lootTaken ? '#4fd68a' : COLORS.goldDim;
  ctx.lineWidth = 2;
  ctx.strokeRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.fillStyle = state.lootTaken ? '#b8ffce' : COLORS.hudText;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(state.lootTaken ? 'EXIT — GO!' : 'SERVICE DOOR', EXIT.x + EXIT.w / 2, EXIT.y - 8);
}

function drawGuard(ctx, g) {
  const hot = g.suspicion >= VISION.chaseAt;
  const warm = g.suspicion >= 35;
  const fill = hot ? COLORS.coneHot : warm ? 'rgba(255, 150, 50, 0.33)' : COLORS.coneCalm;
  const edge = hot ? COLORS.coneHotEdge : warm ? 'rgba(255, 150, 50, 0.8)' : COLORS.coneCalmEdge;
  drawCone(ctx, g.x, g.y, g.angle, VISION.range, VISION.halfAngle, fill, edge);
}

function drawCamera(ctx, c) {
  if (c.off > 0) {
    ctx.fillStyle = '#3a3f4d';
    ctx.fillRect(c.x - 12, c.y - 8, 24, 16);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OFF', c.x, c.y - 14);
    return;
  }
  drawCone(ctx, c.x, c.y, c.angle, c.range, c.halfAngle, COLORS.camCone, COLORS.camConeEdge);
  ctx.fillStyle = '#20242e';
  ctx.fillRect(c.x - 12, c.y - 8, 24, 16);
  ctx.fillStyle = '#ff4d4d';
  ctx.beginPath();
  ctx.arc(c.x + Math.cos(c.angle) * 8, c.y + Math.sin(c.angle) * 8, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawThief(ctx, t, state) {
  const x = t.x;
  const y = t.y;
  if (state.smokeTimer > 0) {
    ctx.fillStyle = COLORS.smoke;
    ctx.beginPath();
    ctx.arc(x, y, 34, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = state.smokeTimer > 0 ? 0.45 : 1;
  // Dark coat.
  ctx.fillStyle = COLORS.thiefCoat;
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.thiefScarf;
  ctx.lineWidth = 2;
  ctx.stroke();
  // White scarf, trailing behind the facing.
  ctx.strokeStyle = COLORS.thiefScarf;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x - Math.cos(t.angle) * 6, y - Math.sin(t.angle) * 6);
  ctx.lineTo(x - Math.cos(t.angle) * 20, y - Math.sin(t.angle) * 20);
  ctx.stroke();
  // Facing tick.
  ctx.fillStyle = COLORS.thiefScarf;
  ctx.beginPath();
  ctx.arc(x + Math.cos(t.angle) * 11, y + Math.sin(t.angle) * 11, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawGuardBody(ctx, g) {
  ctx.fillStyle = COLORS.guardCoat;
  ctx.beginPath();
  ctx.arc(g.x, g.y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Cap brim in the facing direction.
  ctx.fillStyle = COLORS.guardCap;
  ctx.beginPath();
  ctx.arc(g.x + Math.cos(g.angle) * 8, g.y + Math.sin(g.angle) * 8, 7, 0, Math.PI * 2);
  ctx.fill();
  // Gold badge.
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(g.x - Math.cos(g.angle) * 6, g.y - Math.sin(g.angle) * 6, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(g.name.toUpperCase(), g.x, g.y - 22);
}

function alarmColor(v) {
  if (v >= 70) return COLORS.alarmHigh;
  if (v >= 40) return COLORS.alarmMid;
  return COLORS.alarmLow;
}

function drawHud(ctx, state) {
  ctx.fillStyle = COLORS.hudBack;
  ctx.fillRect(0, 0, CANVAS.width, FIELD.y - 8);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('VELVET HOUR', 40, 34);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '13px sans-serif';
  ctx.fillText('Galleria Nocturne — steal the Moon Opal, reach the service door', 40, 58);

  // Alarm meter, centre.
  const barX = 480;
  const barW = 320;
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', barX, 30);
  ctx.fillStyle = '#1c2947';
  ctx.fillRect(barX, 38, barW, 16);
  ctx.fillStyle = alarmColor(state.alarm);
  ctx.fillRect(barX, 38, barW * (state.alarm / 100), 16);
  ctx.strokeStyle = COLORS.goldDim;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, 38, barW, 16);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${Math.floor(state.alarm)}`, barX + barW + 10, 52);

  // Tools and timer, right.
  const right = 1240;
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '13px sans-serif';
  ctx.fillText(`COIN ×${state.coins}   SMOKE ×${state.smokeLeft}   EMP ×${state.empLeft}`, right, 30);
  const mins = Math.floor(state.time / 60);
  const secs = Math.floor(state.time % 60);
  ctx.fillText(
    `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}   ${state.lootTaken ? 'OPAL — STOLEN' : 'OPAL — ON DISPLAY'}`,
    right, 58,
  );

  // The fair warning: big, red, with the grace window draining.
  if (state.spotted && state.status === 'play') {
    ctx.fillStyle = 'rgba(229, 72, 77, 0.92)';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPOTTED!', CANVAS.width / 2, 170);
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Break line of sight — NOW', CANVAS.width / 2, 196);
    ctx.fillStyle = '#1c2947';
    ctx.fillRect(CANVAS.width / 2 - 110, 206, 220, 10);
    ctx.fillStyle = COLORS.alarmHigh;
    ctx.fillRect(CANVAS.width / 2 - 110, 206, 220 * Math.max(0, state.grace / 1.4), 10);
  }
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(6, 10, 20, 0.82)';
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  ctx.fillStyle = accent;
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, CANVAS.width / 2, 300);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '17px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, CANVAS.width / 2, 350 + i * 30);
  });
}

export function render(ctx, state, screen) {
  ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
  drawFloor(ctx);
  drawExit(ctx, state);
  for (const o of OBSTACLES) drawObstacle(ctx, o, state.time);
  drawOpal(ctx, state);
  // Cones first (under the bodies), cameras on the walls.
  for (const g of state.guards) drawGuard(ctx, g);
  for (const c of state.cameras) drawCamera(ctx, c);
  if (state.coin) {
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.arc(state.coin.x, state.coin.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.hudText;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  for (const g of state.guards) drawGuardBody(ctx, g);
  drawThief(ctx, state.thief, state);
  drawHud(ctx, state);

  if (screen === SCREEN_TITLE) {
    overlay(ctx, 'VELVET HOUR', [
      'The Galleria Nocturne opens its vault only at night.',
      'Cross the gallery, lift the Moon Opal, slip out the service door.',
      'Guards sweep yellow cones — red means they are sure. Cameras raise the alarm.',
      'WASD / arrows move · Shift sneaks · click throws a coin · 2 smoke · 3 EMP',
      'Click or press Enter to begin',
    ], COLORS.gold);
  } else if (screen === SCREEN_CAUGHT) {
    overlay(ctx, 'CAUGHT', [
      state.caughtReason,
      state.lootTaken ? 'The Opal was in your hand.' : 'The Opal never left its pedestal.',
      `Alarm reached ${Math.floor(state.alarm)} · ${Math.floor(state.time)}s in the gallery`,
      'Press R to try the night again',
    ], COLORS.alarmHigh);
  } else if (screen === SCREEN_WIN) {
    overlay(ctx, 'CLEAN GETAWAY', [
      'The Moon Opal is yours. The Galleria never knew you were there.',
      `Score ${state.score} · ${Math.floor(state.time)}s · alarm peaked at ${Math.floor(state.alarm)}`,
      'Press R to run the night again',
    ], COLORS.opal);
  }
}
