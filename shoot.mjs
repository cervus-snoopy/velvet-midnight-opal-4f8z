// Screenshot driver for VELVET HOUR: drives the headless Chromium already
// running with --remote-debugging-port=9222 over CDP (Node stdlib only),
// navigates to each ?shot= URL, waits for window.__shotReady, and saves a
// JPEG. Usage: node shoot.mjs <base-url> <out-dir>
import { writeFileSync } from 'node:fs';

const BASE = process.argv[2];
const OUT = process.argv[3];
const SHOTS = [
  { name: '1-heist.jpg', query: '?shot=heist&seed=1' },
  { name: '2-spotted.jpg', query: '?shot=spotted&seed=1' },
  { name: '3-tools.jpg', query: '?shot=tools&seed=1' },
  { name: '4-getaway.jpg', query: '?shot=getaway&seed=1' },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTarget() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/list');
      const list = await res.json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page;
    } catch { /* not up yet */ }
    await sleep(500);
  }
  throw new Error('no CDP target');
}

const target = await getTarget();
const ws = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
const consoleMsgs = [];
let id = 0;
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  } else if (msg.method === 'Runtime.consoleAPICalled') {
    consoleMsgs.push(`${msg.params.type}: ${msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ')}`);
  } else if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails;
    consoleMsgs.push(`EXCEPTION: ${d.exception?.description || d.text}`);
  } else if (msg.method === 'Network.loadingFailed') {
    consoleMsgs.push(`NETWORK FAILED: ${msg.params.errorText}`);
  }
};
await new Promise((r) => { ws.onopen = r; });
const send = (method, params = {}) => new Promise((res) => {
  const mid = ++id;
  pending.set(mid, res);
  ws.send(JSON.stringify({ id: mid, method, params }));
});

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });

for (const shot of SHOTS) {
  consoleMsgs.length = 0;
  await send('Page.navigate', { url: BASE + shot.query });
  // Wait for the staged scene to report ready.
  let ready = false;
  for (let i = 0; i < 40; i += 1) {
    await sleep(250);
    const r = await send('Runtime.evaluate', { expression: 'window.__shotReady === true', returnByValue: true });
    if (r.result?.result?.value) { ready = true; break; }
  }
  const info = await send('Runtime.evaluate', {
    expression: 'JSON.stringify({screen: window.__shotScreen, alarm: window.__shotAlarm, status: window.__shotStatus})',
    returnByValue: true,
  });
  const snap = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
  writeFileSync(`${OUT}/${shot.name}`, Buffer.from(snap.result.data, 'base64'));
  console.log(shot.name, 'ready:', ready, 'info:', info.result?.result?.value);
  if (consoleMsgs.length) console.log('  console:', consoleMsgs.slice(0, 5).join(' | '));
}
ws.close();
process.exit(0);
