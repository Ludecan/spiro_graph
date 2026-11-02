# AGENTS.md — Spiro Graph

## What this is

**Spiro Graph** is an interactive, flashy spirograph playground built as a
**single `index.html` file** — vanilla JS + Canvas 2D + handcrafted CSS.
Zero dependencies, zero build step. Users play with real spirograph math
(hypotrochoids/epitrochoids) rendered as neon art, and can export PNG/WebM.

- Repo: `git@github.com:Ludecan/spiro_graph.git` (branch `main`, push directly)
- Live/demo: *GitHub Pages pending* — README has a placeholder link
- Name note: repo is `spiro_graph`, local folder may be `spirograph`

## Run & test

```bash
# run the app: just open it
xdg-open index.html        # or python3 -m http.server

# headless behavior tests (no browser needed)
node scripts/smoke.js      # extracts the <script> from index.html, stubs the DOM
```

`scripts/smoke.js` is the safety net: it evaluates the app script against
minimal DOM/canvas stubs with injected probes (`__set`, `__runFrames`,
`__randomize`, `__ff`, `__locks`, …) and asserts core behavior. **Always run
it after touching the JS**, and extend its stub/probes when adding controls.

## Architecture (index.html)

One file, three sections: `<style>`, markup, one `<script>` organized with
banner comments: `state` → `canvas setup` → `stroke drawing` → `auto-morph` →
`main loop` → `UI` → `resize` → `boot`.

### Rendering: three stacked canvas layers (inside `#stage`)
| Layer | id | Contents | Behavior |
|---|---|---|---|
| ink | `main` | opaque bg + colored core strokes | permanent; fades only in "Fade trails" |
| glow | `glow` | halo strokes, `mix-blend-mode: screen` | can dissolve via `destination-out` alpha shaving ("Fade glow") |
| dot | `dot` | live pulsing pen tip | cleared every frame |

`composite()` stacks all three (screen blend) for PNG export and for the
`MediaRecorder` (`captureStream` on a pumped canvas via `pumpRec()`).

### Core model
- Curves: `pt(t, ta)` / `ptBoth(t, ta)` — hypo/epi parametrics with pen wobble
  (`rho = d + wob·sin(wf·ta)`) and optional spin rotation (`θ = spin·ta`);
  `ptBoth` returns main + twin points and shares the trig work.
- `tCur` = angle along curve (wraps at `tMax`); `tAbs` = **unwrapped** stroke
  time driving wobble/spin phase so those stay continuous across wraps.
- Closure: `tMax() = 2π · r/gcd(R, r)` with **rounded** inputs (morph produces
  fractional values; raw gcd would recurse forever).
- `strokeSeg(t0, t1)` walks the arc with adaptive steps
  (`0.05 / max(1, |k/r|)`), chunks polylines by color delta, `strokeChunk`
  draws N kaleidoscope copies (canvas transform rotation; odd slices flipped)
  for both main and twin pens; `strokeLine` puts the glow pass on the glow
  layer and the core pass on the ink layer (both `lighter` composite).
- `computeFit()` runs at **stroke time** (in `strokeSeg`), scaling
  `|k| + d + wob` (+ stroke/glow margin) to 44.5% of the stage's min
  dimension — art can never overflow the viewport.

### Modes (frame loop branches)
- **strict** (default): stop at `tMax`, badge "complete"; ⏩ Finish = `fastForward()`.
- **fade** (`S.fade`): wrap forever; ink decays toward the bg with
  `decayAlpha(dt, S.trailDur)` — exponential, wall-time based, so a segment is
  invisible (1/255) exactly `trailDur` seconds after being drawn, at any fps.
  **Geometry changes must not `restart()` here** — the comet canvas self-heals.
- **fadeGlow** (`S.fadeGlow`): glow layer dissolves on its own clock
  (`decayAlpha(dt, S.glowDur)`), ink persists; completes normally in strict
  mode; keeps dissolving after done.
- **keep** (`S.keep`, free draw): param changes never clear the canvas; pen
  continues from `lastPt` with a connector line (`pendingConnect`);
  `paramSeq`/`lastWrapSeq` detect a re-traced closed curve and stop to avoid
  additive blow-out.
- **morph** (`S.morph`): `morphStep()` drifts R/r/d via sine LFOs + noise
  (respects locks); behaves like keep (endless); sliders sync ~15×/s.
- Stat line (`statText`/`updateStat`) + progress bar: "lap x / N · closes in ~N".

### Controls & state
`S` holds everything; UI ids are short (`R r d wob wf mirror spin sp w hs g ms
td gd` sliders; `fade fglow keep morph twin c2` toggles; `ca cb` color pickers;
`mode` segment). Every control carries a `title` tooltip explaining what it
does (fields/switch labels carry it; lock buttons override with theirs). Panel
layout: docked 320px left on desktop (`body.panel-hidden` slides it;
`ResizeObserver` on `#stage` re-centers), floating overlay below 720px.
Keyboard: `Space R M C L H`.

**Locks (🔒):** `locks` Set keyed by control id; hover-revealed padlock buttons
(`.lock[data-lock]`); `isLocked()` gates **Random** and **Auto-morph drift**.
Every control is lockable — sliders, mode, color pair, and the engine toggles
(fade/fglow/keep/morph, which Random rolls with low odds ~10–35% when
unlocked). Locks persist as `lk=a,b,c` in the URL hash. Locks protect from the
*machine* only: users can always toggle/move a locked control by hand.

### URL hash = full shareable state
`#m=&R=&r=&d=&wob=&wf=&mir=&sn=&sp=&w=&hs=&g=&ms=&td=&gd=&h=&f=&fg=&k=&mo=&tw=&c2=&ca=&cb=&lk=`
(`pushHash` debounced 400ms; 🔗 Link button / `L` copies). `loadHash()` parses
with hex validation for colors and converts legacy `fd=` (per-frame fade %)
into an equivalent `trailDur` seconds.

## Gotchas we already hit — do not regress
1. **Canvas is a replaced element**: `inset: 0` alone sizes it to its
   *intrinsic* (dpr-multiplied) size → overflow on scaled displays. Canvases
   must have explicit CSS `width/height: 100%`.
2. The view transform must be recomputed at stroke time, not only on param change.
3. `gcd()` must receive integers (morph floats) — see rounding in `tMax()`.
4. Wobble/spin phases live on `tAbs`, never on wrapped `tCur` (wrap seams).
5. The mode segment click handler must match `button[data-mode]` (lock buttons
   live inside it).
6. Clicking a `.lock` inside a `<label class="switch">` needs
   `preventDefault()` or it toggles the checkbox.
7. The panel is compact by design (grid2 rows, hidden-until-live fields
   `#msField`/`#tdField`/`#gdField`, thin scrollbar) — keep it fitting ~660px height.
8. Fade trails must never set `done`; the keep-mode stop only applies when
   neither fade nor morph is on.
9. Exports must composite all three layers (screenshots without glow surprised
   us once).
10. Fade mode must NOT `restart()` on geometry changes (`onShapeChanged` early
    return) — wiping every slider step kills the comet look; the self-erasing
    canvas heals any mismatch within `trailDur` seconds.
11. Trail/glow fading is time-based (`decayAlpha`), never per-frame-percent —
    it must look identical at 30, 60 or 144 fps.

## Conventions
- Keep it **one file**; no frameworks, no build, no dependencies.
- Commit style: short imperative subject + explanatory bullets; stay coherent
  with the existing banner-comment sections.
- `gh` CLI auth is broken on the dev machine (WSL2); repo metadata changes use
  `curl` + a classic PAT (`repo` scope) against `api.github.com`.
- Git push over SSH works via `asus_tuf_ed25519` (ssh-agent must hold it;
  `~/.ssh/config` pins it for `github.com` with `IdentitiesOnly`).

## Roadmap / open items
- [x] Locks for the engine toggles (fade, fade glow, free draw, auto-morph)
- [ ] Zoom & pan; custom presets (localStorage); dashed/pulse pens
- [ ] SVG export; "harmonic" second-epicycle pen
- [ ] GitHub Pages + repo description/topics (curl commands known)
