# Spiro Graph

## Project overview

Spiro Graph is an interactive spirograph playground in a single `index.html` file. Users play with real spirograph math (hypotrochoids and epitrochoids), rendered as neon art, and can export PNG and WebM.

**Stack:** vanilla JavaScript, Canvas 2D, handcrafted CSS. No dependencies, no build step. Node only for the headless smoke test.

- Repo: `Ludecan/spiro_graph` on GitHub, default branch `main`. The local folder can be named `spirograph`.
- Live on GitHub Pages: https://ludecan.github.io/spiro_graph/

This AGENTS.md file is kept intentionally lean. Avoid cluttering with instructions and use progressive disclosure when context starts to grow.

## Repo map

```
index.html        the whole app: <style>, markup, one <script> in banner-comment sections
scripts/smoke.js  headless behavior test: runs the <script> against DOM/canvas stubs with probes
README.md         user-facing description
LICENSE           MIT
```

### Architecture of `index.html`

**Rendering: three stacked canvas layers inside `#stage`**

| Layer | id | Contents | Behavior |
|---|---|---|---|
| ink | `main` | opaque background and colored core strokes | permanent; fades only in "Fade trails" |
| glow | `glow` | halo strokes, `mix-blend-mode: screen` | can dissolve through `destination-out` alpha shaving ("Fade glow") |
| dot | `dot` | live pulsing pen tip | cleared every frame |

`composite()` stacks all three (screen blend) for the PNG export and for the `MediaRecorder` (`captureStream` on a pumped canvas through `pumpRec()`).

**Core model**

- Curves: `pt(t, ta)` and `ptBoth(t, ta)` give the hypo/epi parametrics with pen wobble (`rho = d + wob·sin(wf·ta)`) and optional spin (`θ = spin·ta`). `ptBoth` returns the main and the twin points and shares the trig work.
- `tCur` is the angle along the curve (wraps at `tMax`). `tAbs` is the unwrapped stroke time that drives the wobble and spin phase, so they stay continuous across wraps.
- Closure: `tMax() = 2π · r/gcd(R, r)` with rounded inputs.
- `strokeSeg(t0, t1)` walks the arc with adaptive steps (`0.05 / max(1, |k/r|)`) and chunks polylines by color delta. `strokeChunk` draws N kaleidoscope copies (canvas rotation; odd slices flipped) for the main and twin pens. `strokeLine` puts the glow pass on the glow layer and the core pass on the ink layer (both `lighter` composite).
- `computeFit()` runs at stroke time (in `strokeSeg`). It scales `|k| + d + wob` (plus stroke and glow margin) to 44.5% of the smaller stage dimension, so the art never overflows the viewport.

**Modes (branches of the frame loop)**

- **strict** (default): stops at `tMax`, badge "complete". ⏩ Finish calls `fastForward()`.
- **fade** (`S.fade`): wraps forever. Ink decays toward the background with `decayAlpha(dt, S.trailDur)`: exponential and wall-time based, so a segment is invisible (1/255) exactly `trailDur` seconds after it was drawn.
- **fadeGlow** (`S.fadeGlow`): the glow layer dissolves on its own clock (`decayAlpha(dt, S.glowDur)`) and the ink stays. Completes normally in strict mode, and keeps dissolving after it is done.
- **keep** (`S.keep`, free draw): parameter changes never clear the canvas. The pen continues from `lastPt` with a connector line (`pendingConnect`). `paramSeq` and `lastWrapSeq` detect a re-traced closed curve and stop, to prevent additive blow-out.
- **morph** (`S.morph`): `morphStep()` drifts R, r and d with sine LFOs and noise (respects locks). Behaves like keep (endless). Sliders sync about 15 times per second.
- The stat line (`statText`, `updateStat`) and the progress bar show "lap x / N · closes in ~N".

**Controls and state**

`S` holds all state. Slider ids: `R r d wob wf mirror spin sp w hs g ms td gd`. Toggles: `fade fglow keep morph twin c2`. Color pickers: `ca cb`. Segment: `mode`. The panel is docked 320px left on desktop (`body.panel-hidden` slides it; a `ResizeObserver` on `#stage` re-centers) and floats as an overlay below 720px. Keyboard: `Space R M C L H`.

**Locks (🔒):** the `locks` Set is keyed by control id. Padlock buttons (`.lock[data-lock]`) show on hover. `isLocked()` gates **Random** and **Auto-morph drift**. Random rolls the engine toggles (fade, fglow, keep, morph) with low odds (about 10-35%) when they are not locked. Locks persist as `lk=a,b,c` in the URL hash.

**URL hash = full shareable state**

`#m=&R=&r=&d=&wob=&wf=&mir=&sn=&sp=&w=&hs=&g=&ms=&td=&gd=&h=&f=&fg=&k=&mo=&tw=&c2=&ca=&cb=&lk=`

`pushHash` is debounced 400ms. The 🔗 Link button (or `L`) copies the URL. `loadHash()` validates hex colors and converts the legacy `fd=` (per-frame fade %) into an equivalent `trailDur` in seconds.

## Repo map updates

Whenever a substantial code modification has been implemented, or an outdated repo map is detected while exploring the codebase, edit the repo map for review. Put the repo map edit in its own final commit, so it does not hide the real change.

## Commands

```
xdg-open index.html        # run: open the file, or serve it with python3 -m http.server
node scripts/smoke.js      # headless behavior tests; run after every change to the script
```

There is no install, build or lint step.

## Search scope

None. `.opencode/` holds local OpenCode state and is gitignored.

## Gotchas

1. The three canvases need explicit CSS `width/height: 100%`. `inset: 0` alone sizes a canvas to its dpr-multiplied intrinsic size and overflows on scaled displays.
2. The view transform must be recomputed at stroke time (`computeFit()` in `strokeSeg`), not only on a parameter change.
3. `gcd()` must get integers: morph makes fractional values, and a raw gcd of floats recurses forever. See the rounding in `tMax()`.
4. Wobble and spin phases use `tAbs`, never the wrapped `tCur`, or the wraps show seams.
5. The click handler of the mode segment must match `button[data-mode]`, because lock buttons live inside the segment.
6. A click on a `.lock` inside a `<label class="switch">` needs `preventDefault()`, or it toggles the checkbox.
7. The panel is compact by design (grid2 rows, fields hidden until live: `#msField`, `#tdField`, `#gdField`, thin scrollbar). Keep it inside about 660px of height.
8. Fade trails must never set `done`. The keep-mode stop applies only when neither fade nor morph is on.
9. Exports must composite all three layers. A PNG without the glow layer looks wrong.
10. Fade mode must not `restart()` on geometry changes (early return in `onShapeChanged`). A restart on every slider step kills the comet look, and the self-erasing canvas heals any mismatch within `trailDur` seconds.
11. Trail and glow fading use `decayAlpha` (wall time), never a per-frame percent.

## Open items

- [ ] Zoom and pan; custom presets (localStorage); dashed and pulse pens
- [ ] SVG export; "harmonic" second-epicycle pen
- [ ] Repo description and topics on GitHub
