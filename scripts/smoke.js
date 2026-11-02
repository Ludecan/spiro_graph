// Headless smoke test for the Spiro Graph app logic.
// Run from the repo root (or anywhere):  node scripts/smoke.js
// It extracts the <script> block from ../index.html, evaluates it against
// minimal DOM/canvas stubs, injects test probes, and asserts core behavior:
// bounds/fit, strict completion, fast-forward, progress hints, free-draw
// connectors, auto-morph drift + lock respect, fade/glow loops, URL-hash
// persistence, and randomize stability. Keep it updated when adding controls:
// add the ids/labels to the stub list and mirror behavior in a test.
const fs = require('fs');

// ---- minimal DOM/canvas stubs ----
const drawn = { pts: [], clear() { this.pts = []; } };
function makeCtx() {
  const target = { globalAlpha: 1, globalCompositeOperation: '', strokeStyle: '', fillStyle: '', lineWidth: 1 };
  return new Proxy(target, {
    get(t, p) {
      if (p in t) return t[p];
      if (p === 'createRadialGradient' || p === 'createLinearGradient') return () => ({ addColorStop() {} });
      if (p === 'moveTo' || p === 'lineTo') return (x, y) => { drawn.pts.push([x, y]); };
      return () => {};
    },
    set(t, p, v) { t[p] = v; return true; },
  });
}
function makeEl(id) {
  return {
    id, value: '0', min: '0', max: '100', type: ['fade','fglow','keep','morph','twin','c2'].includes(id) ? 'checkbox' : 'range',
    checked: false, textContent: '', dataset: {}, children: [],
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
      toggle(c, f) { f === undefined ? (this._s.has(c) ? this._s.delete(c) : this._s.add(c)) : (f ? this._s.add(c) : this._s.delete(c)); },
      contains(c) { return this._s.has(c); },
    },
    style: { setProperty() {} },
    listeners: {},
    addEventListener(ev, fn) { (this.listeners[ev] ||= []).push(fn); },
    fire(ev, arg) { (this.listeners[ev] || []).forEach(f => f(arg || { target: this, closest: () => null, preventDefault() {} })); },
    dispatchEvent(ev) { this.fire(ev.type, { target: this, closest: () => null, preventDefault() {} }); },
    appendChild(c) { this.children.push(c); },
    matches: () => false, click() { this.fire('click'); },
  };
}
const els = {};
const ids = ['main','glow','dot','stage','panel','reveal','badge','mode','R','r','d','wob','wf','mirror','spin',
  'sp','w','hs','g','fade','fglow','keep','morph','ms','td','gd','msField','tdField','gdField','twin','c2','ca','cb',
  'play','clear','rand','save','rec','ff','link','bar','stat','presets','collapse',
  'vR','vr','vd','vwob','vwf','vmir','vspn','vsp','vw','vhs','vg','vms','vtd','vgd'];
ids.forEach(i => els[i] = makeEl(i));
els.stage.clientWidth = 1224; els.stage.clientHeight = 686;
const mHypo = makeEl('mHypo'); mHypo.dataset.mode = 'hypo';
const mEpi = makeEl('mEpi'); mEpi.dataset.mode = 'epi';
els.mode.children = [mHypo, mEpi];
els.main.getContext = makeCtx; els.glow.getContext = makeCtx; els.dot.getContext = makeCtx;

let rafCb = null, rafTime = 0;
let pushedUrl = null, clipUrl = null;
global.window = global;
global.innerWidth = 1224; global.innerHeight = 686; global.devicePixelRatio = 1;
global.ResizeObserver = class { constructor(cb) { this.cb = cb; } observe() {} };
Object.defineProperty(globalThis, 'navigator', { value: { clipboard: { writeText: async (u) => { clipUrl = u; } } }, configurable: true });
global.document = {
  body: {
    classList: { _s: new Set(), toggle(c, f) { f ? this._s.add(c) : this._s.delete(c); }, contains(c) { return this._s.has(c); } },
    appendChild() {}, execCommand: () => true,
  },
  getElementById: (id) => els[id] || makeEl(id), createElement: () => makeEl('tmp'),
  querySelectorAll: () => [],
};
global.requestAnimationFrame = (cb) => { rafCb = cb; };
global.history = { replaceState(a, b, url) { pushedUrl = url; location.href = 'file:///index.html' + url; } };
global.location = { hash: '', href: 'file:///index.html' };
global.alert = (m) => { throw new Error('alert: ' + m); };
const winListeners = {};
global.addEventListener = (ev, fn) => { (winListeners[ev] ||= []).push(fn); };

// ---- load app code + test probes ----
const html = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf8");
let src = html.split("<script>")[1].split("</script>")[0];
src += `
;globalThis.__probe = () => ({ tCur, tAbs, done, hue, W, H, sc, cx, cy, S: {...S}, hue0, lastPt: lastPt && [...lastPt], pendingConnect });
globalThis.__runFrames = (n, dtMs = 16.7) => { for (let i = 0; i < n; i++) { rafTime += dtMs; const cb = rafCb; rafCb = null; cb(rafTime); } };
globalThis.__restart = restart; globalThis.__randomize = randomize;
globalThis.__set = (o) => { Object.assign(S, o); };
globalThis.__setHue = (rate, base) => { S.hueSpeed = rate; hue0 = base; restart(); hue = base; };
globalThis.__changeParam = (o) => { Object.assign(S, o); onShapeChanged(); };
globalThis.__statText = statText; globalThis.__ff = fastForward; globalThis.__tMax = tMax;
globalThis.__locks = () => locks;
globalThis.__decayAlpha = decayAlpha;
globalThis.__pt = pt;
`;
eval(src);

const maxDist = (cx, cy) => { let m = 0; for (const [x, y] of drawn.pts) { if (!isFinite(x) || !isFinite(y)) throw new Error('NaN coords drawn!'); m = Math.max(m, Math.hypot(x - cx, y - cy)); } return m; };

const P = globalThis.__probe();
if (P.W !== 1224 || P.H !== 686) throw new Error('resize failed');

// 1) bounds hold for the old overflow params
globalThis.__set({ mode: 'epi', R: 109, r: 166, d: 263, wob: 0, glow: 2.5, width: 2.3, mirror: 1, spin: 0 });
globalThis.__restart();
drawn.clear();
globalThis.__runFrames(400, 40);
const limit = 343;
const m1 = maxDist(612, 343);
console.log('overflow params: max radius', m1.toFixed(1), '<=', limit);
if (m1 > limit) throw new Error('escapes viewport');

// 2) NEW: kaleidoscope + spin stay inside bounds (transforms preserve radius)
globalThis.__set({ mode: 'hypo', R: 220, r: 77, d: 130, wob: 60, mirror: 5, spin: 0.4, twin: true, speed: 5 });
globalThis.__restart();
drawn.clear();
globalThis.__runFrames(300, 30);
const m2 = maxDist(612, 343);
console.log('kaleido+spin+twin: max radius', m2.toFixed(1), '<=', limit, '|', drawn.pts.length, 'pts');
if (m2 > limit) throw new Error('kaleidoscope escapes viewport');

// 3) NEW: two-color mode draws valid rgb colors, no hue drift errors
globalThis.__set({ c2: true, colA: '#ff0000', colB: '#0000ff', twin: false, mirror: 1, spin: 0, hueSpeed: 4 });
globalThis.__restart();
drawn.clear();
globalThis.__runFrames(120, 20);
maxDist(612, 343); // no NaN
console.log('two-color mode: OK');

// 4) NEW: copy-link button bakes params into the pushed URL and copies
els.link.click();
if (!pushedUrl || !/mir=1/.test(pushedUrl) || !/c2=1/.test(pushedUrl) || !/ca=ff0000/.test(pushedUrl))
  throw new Error('link hash missing new params: ' + pushedUrl);
console.log('copy link: url pushed ✓', pushedUrl.slice(0, 60) + '…');

// 5) strict completion still works, then fast-forward
globalThis.__set({ fade: false, keep: false, morph: false, c2: false, mirror: 1, spin: 0, R: 240, r: 71, d: 140, speed: 2, wob: 0 });
globalThis.__restart();
globalThis.__runFrames(60, 30);
let st = globalThis.__statText();
if (!/closes in ~\d+/.test(st)) throw new Error('hint missing: ' + st);
globalThis.__ff();
let p = globalThis.__probe();
if (!p.done || Math.abs(p.tCur - globalThis.__tMax()) > 1e-6) throw new Error('fast forward failed');
if (!/closed after 71 laps/.test(globalThis.__statText())) throw new Error('done hint wrong');
console.log('hint + finish: ✓');

// 6) free draw: connector + never resets
globalThis.__set({ keep: true, speed: 4 });
globalThis.__restart();
globalThis.__runFrames(120, 30);
p = globalThis.__probe();
const tBefore = p.tCur, lastBefore = p.lastPt;
globalThis.__changeParam({ d: 200 });
p = globalThis.__probe();
if (Math.abs(p.tCur - tBefore) > 1e-9 || !p.pendingConnect) throw new Error('free draw broken');
drawn.clear();
globalThis.__runFrames(5, 16.7);
if (Math.hypot(drawn.pts[0][0] - lastBefore[0], drawn.pts[0][1] - lastBefore[1]) > 0.01)
  throw new Error('connector not from previous endpoint');
console.log('free draw connector: ✓');

// 7) auto-morph drift + fractional gcd safety
globalThis.__set({ morph: true, morphSpeed: 3, keep: false, R: 220.7, r: 77.3, d: 130.9 });
globalThis.__restart();
const rBefore = globalThis.__probe().S.r;
globalThis.__runFrames(400, 33);
p = globalThis.__probe();
if (Math.abs(p.S.r - rBefore) < 0.5) throw new Error('morph did not drift');
console.log('auto-morph drift: ✓');

// 8) fade wraps, never done; decay math + frame-rate independence
globalThis.__set({ morph: false, fade: true, trailDur: 6, wob: 100, wf: 7, speed: 6, mirror: 3 });
globalThis.__restart();
drawn.clear();
globalThis.__runFrames(800, 40);
if (maxDist(612, 343) > limit) throw new Error('fade+wobble+kaleido escaped');
if (globalThis.__probe().done) throw new Error('fade should never be done');
// after exactly `dur` seconds of decay, brightness must be ~1/255 (invisible), any fps
const decayAfter = (fps, dur) => { let b = 1; for (let i = 0; i < fps * dur; i++) b *= 1 - globalThis.__decayAlpha(1 / fps, dur); return b; };
const d60 = decayAfter(60, 6), d15 = decayAfter(15, 6), d120 = decayAfter(120, 6);
if (Math.abs(d60 - 1 / 255) / (1 / 255) > 0.02) throw new Error('trail not gone after dur: ' + d60);
if (Math.abs(d60 - d15) / d60 > 0.005 || Math.abs(d60 - d120) / d60 > 0.005)
  throw new Error('fade not frame-rate independent: ' + [d15, d60, d120]);
console.log('fade wrap + duration decay (frame-rate indep): ✓');

// 8b) geometry changes in fade mode must NOT wipe/restart (comet self-heals)
globalThis.__set({ fade: true, keep: false, morph: false, speed: 4 });
globalThis.__restart();
globalThis.__runFrames(30, 30);
const tFadeBefore = globalThis.__probe().tCur;
if (tFadeBefore <= 0) throw new Error('fade mode not drawing');
globalThis.__changeParam({ d: 90 });
p = globalThis.__probe();
if (Math.abs(p.tCur - tFadeBefore) > 1e-9) throw new Error('fade mode restarted on param change');
if (p.pendingConnect) throw new Error('fade mode should not draw a connector');
console.log('fade mode: param change keeps flowing (no wipe) ✓');

// 8c) duration sliders are live, style-only (no restart)
els.td.value = '12.5'; els.td.fire('input');
els.gd.value = '4.5'; els.gd.fire('input');
p = globalThis.__probe();
if (Math.abs(p.S.trailDur - 12.5) > 1e-9 || Math.abs(p.S.glowDur - 4.5) > 1e-9)
  throw new Error('duration sliders not read: ' + p.S.trailDur + '/' + p.S.glowDur);
if (Math.abs(p.tCur - tFadeBefore) > 1e-9) throw new Error('duration slider restarted the drawing');
if (!/^12\.5s$/.test(els.vtd.textContent) || !/^4\.5s$/.test(els.vgd.textContent))
  throw new Error('duration labels wrong: ' + els.vtd.textContent + ' / ' + els.vgd.textContent);
console.log('trail/glow duration sliders: live + style-only ✓');

// 9) 200x randomize + toggle churn stability
globalThis.__set({ fade: false });
for (let i = 0; i < 200; i++) {
  globalThis.__randomize();
  globalThis.__runFrames(2);
  if (i % 20 === 0) { els.fade.checked = !els.fade.checked; els.fade.fire('input'); els.fade.checked = !els.fade.checked; els.fade.fire('input'); }
}
console.log('200x randomize + churn: ✓');

// 10) hue=0 static color; resize redraw path
globalThis.__setHue(0, 123);
globalThis.__runFrames(60);
if (Math.abs(globalThis.__probe().hue - 123) > 1e-9) throw new Error('hue drifted with hueSpeed=0');
winListeners['resize'].forEach(f => f());

// 10b) fade-glow only: ink still strict-completes, glow dissolves after done, hash keeps fg
globalThis.__set({ fade: false, fadeGlow: true, morph: false, keep: false, R: 220, r: 77, d: 130, speed: 8 });
globalThis.__restart();
globalThis.__runFrames(700, 50);
p = globalThis.__probe();
if (!p.done) throw new Error('fadeGlow should not prevent completion');
globalThis.__runFrames(60, 50); // glow keeps dissolving post-done without incident
pushedUrl = null;
els.link.click();
if (!/fg=1/.test(pushedUrl)) throw new Error('hash missing fg=1');
if (!/td=/.test(pushedUrl) || !/gd=/.test(pushedUrl) || /fd=/.test(pushedUrl))
  throw new Error('hash should carry td/gd, not legacy fd: ' + pushedUrl);
console.log('fade glow: completes, dissolves, persists ✓');
globalThis.__set({ fadeGlow: false });

// 11) mode buttons: clicking swaps curve, highlights, restarts; curves genuinely differ
globalThis.__set({ mode: 'hypo', fade: false, keep: false, morph: false, c2: false, R: 220, r: 77, d: 130 });
globalThis.__restart();
globalThis.__runFrames(30, 30);
if (globalThis.__probe().tCur <= 1e-9) throw new Error('mode test: not drawing before click');
els.mode.fire('click', { target: { closest: () => els.mode.children[1] } }); // click "Epitrochoid"
p = globalThis.__probe();
if (p.S.mode !== 'epi' || p.tCur > 1e-9) throw new Error('mode click did not switch + restart');
if (!els.mode.children[1].classList.contains('on') || els.mode.children[0].classList.contains('on'))
  throw new Error('mode button highlight did not follow');
const curve = (mode) => {
  globalThis.__set({ mode, wob: 0, spin: 0, mirror: 1 });
  globalThis.__restart();
  const T = globalThis.__tMax(), pts = [];
  for (let i = 0; i <= 400; i++) pts.push(globalThis.__pt(T * i / 400, T * i / 400));
  return pts;
};
const ch = curve('hypo'), ce = curve('epi');
let mMode = 0;
for (let i = 0; i < ch.length; i++) mMode = Math.max(mMode, Math.hypot(ch[i][0] - ce[i][0], ch[i][1] - ce[i][1]));
if (mMode < 20) throw new Error('hypo and epi render the same shape (delta ' + mMode.toFixed(1) + 'px)');
pushedUrl = null; els.link.click();
if (!/m=epi/.test(pushedUrl)) throw new Error('hash missing m=epi');
console.log('mode buttons: switch, restart, distinct curves ✓');

// 12) locks: Random keeps locked controls
globalThis.__locks().add('g'); globalThis.__locks().add('R'); globalThis.__locks().add('mirror');
p = globalThis.__probe();
const g0 = p.S.glow, R0 = p.S.R, mir0 = p.S.mirror;
globalThis.__randomize();
p = globalThis.__probe();
if (p.S.glow !== g0 || p.S.R !== R0 || p.S.mirror !== mir0) throw new Error('randomize changed locked controls');
console.log('locks: randomize keeps locked ✓');

// 12b) morph respects locks too
globalThis.__set({ morph: true, morphSpeed: 3, keep: false, fade: false });
globalThis.__restart();
const Rb = globalThis.__probe().S.R, rb0 = globalThis.__probe().S.r;
globalThis.__runFrames(250, 33);
p = globalThis.__probe();
if (p.S.R !== Rb) throw new Error('morph drifted locked R');
if (Math.abs(p.S.r - rb0) < 0.5) throw new Error('morph should still drift unlocked r');
console.log('locks: morph respects ✓');

// 12c) locks persist into the share URL
globalThis.__set({ c2: true, colA: '#ff0000', colB: '#00ff00' });
pushedUrl = null; clipUrl = null;
els.link.click();
if (!/lk=g%2CR%2Cmirror/.test(pushedUrl)) throw new Error('hash missing locks: ' + pushedUrl);
console.log('locks: persisted in hash ✓');

// 12d) engine toggles are lockable: Random keeps them locked, rolls them when free
globalThis.__set({ fade: true, fadeGlow: false, keep: true, morph: false });
for (const id of ['fade','fglow','keep','morph']) globalThis.__locks().add(id);
const engOf = () => { const q = globalThis.__probe().S; return [q.fade, q.fadeGlow, q.keep, q.morph].join(); };
const eng0 = engOf();
for (let i = 0; i < 40; i++) globalThis.__randomize();
if (engOf() !== eng0) throw new Error('randomize changed locked engine toggles: ' + eng0 + ' -> ' + engOf());
console.log('locks: engine toggles kept ✓');
for (const id of ['fade','fglow','keep','morph']) globalThis.__locks().delete(id);
let sawFade = false, sawMorph = false;
for (let i = 0; i < 300 && !(sawFade && sawMorph); i++) {
  globalThis.__randomize();
  const q = globalThis.__probe().S;
  if (q.fade) sawFade = true;
  if (q.morph) sawMorph = true;
}
if (!sawFade || !sawMorph) throw new Error('unlocked engines should be rollable by Random');
console.log('engine toggles: randomizable when unlocked ✓');

// 12e) legacy share links: old per-frame `fd` % converts to an equivalent trail duration,
// and new td/gd keys win over it. Boot loadHash by re-evaluating the app with that hash.
location.hash = '#m=epi&R=200&r=50&d=100&f&fd=5.5';
eval(src);
p = globalThis.__probe();
if (!p.S.fade) throw new Error('legacy hash: fade flag lost');
if (!(p.S.trailDur > 1.4 && p.S.trailDur < 1.9))
  throw new Error('legacy fd=5.5 should become ~1.6s trail, got ' + p.S.trailDur);
location.hash = '#td=10&gd=3&fd=5.5';
eval(src);
p = globalThis.__probe();
if (p.S.trailDur !== 10 || p.S.glowDur !== 3)
  throw new Error('td/gd should win over legacy fd: ' + p.S.trailDur + '/' + p.S.glowDur);
location.hash = '';
console.log('legacy fd= hashes convert to durations ✓');

setTimeout(() => {
  if (!clipUrl || !/ca=ff0000/.test(clipUrl)) throw new Error('clipboard never received the URL');
  console.log('clipboard received URL ✓');
  console.log('\nALL SMOKE TESTS PASSED ✅');
}, 50);
