# Spiro Graph ✦

A single-file interactive spirograph playground built with vanilla JavaScript, Canvas 2D and hand-rolled CSS. It renders real hypotrochoid and epitrochoid curves as neon art, with kaleidoscope copies, twin pens, trails, auto-morph, presets, locks and PNG/WebM export.

**Watch it online:** https://ludecan.github.io/galton_board/

## Features

- **Real spirograph math** — hypotrochoid & epitrochoid curves with classic ring / planet / pen-offset parameters
- **Neon layered renderer** — separate ink, glow and dot canvases; additive blending, rainbow hue cycling and pulsing white-hot pen tips, retina-aware
- **Pen wobble** — make the pen distance oscillate for organic, jellyfish-like shapes
- **Kaleidoscope** — Mirror ×N draws N rotationally mirrored copies of every stroke; every copy gets its own live white-hot tip
- **Spin** — the figure grows on a virtual turntable, spiraling into galaxy-like swirls
- **Twin pen** — a second pen on the opposite side of the planet; it also gets a live tip
- **Auto-morph** — ring, planet and pen drift on slow LFOs plus smoothed noise; shapes melt into each other forever
- **Free draw** — never-resets mode: tweak geometry mid-curve and the pen keeps drawing from where it is
- **Fade trails / fade glow** — independent lifetimes: comet mode where the trail dissolves a set number of seconds after being drawn, or glow-only fade where the aura evaporates while the colored trail stays permanently inked; durations are frame-rate independent
- **Two-color mode** — cross-fade between two picked colors instead of the full rainbow
- **Progress & completion** — live “closes in ~N laps” hint and an instant **⏩ Finish** fast-forward
- **Presets & randomizer** — curated starting shapes or 🎲 one-shot chaos
- **🔒 Per-control locks** — pin any control, including the fade and mode engines; Random and Auto-morph only touch unlocked controls
- **💡 Built-in hints** — hover any control for a plain-language explanation
- **Export** — save a PNG, or record a 60 fps WebM video of the animated canvas with native `MediaRecorder`
- **Shareable state** — shape and style parameters live in the URL hash; **🔗 Link** copies the current look to the clipboard
- **Responsive** — docked glass control panel on desktop, floating overlay on mobile
- **Accessible controls** — switch checkboxes stay in the tab order, completion messages are announced as status text, and decorative motion respects `prefers-reduced-motion`

## Run it

```bash
git clone git@github.com:Ludecan/spiro_graph.git
cd spiro_graph
# just open the file:
xdg-open index.html      # Linux
open index.html          # macOS
```

Or serve it: `python3 -m http.server` → http://localhost:8000

## Controls

| Control | What it does |
|---|---|
| Hypotrochoid / Epitrochoid | pen inside vs. outside the rolling circle |
| Ring radius | the fixed outer gear (R) |
| Planet radius | the rolling gear (r) — drives lap count |
| Pen offset | distance from planet center to pen tip (d) |
| Pen wobble / freq | oscillates the pen distance for curvier creatures |
| Mirror ×N | kaleidoscope — N rotationally mirrored copies (1 = off) |
| Spin | swirl: the figure grows on a spinning turntable |
| Speed | how fast the planet orbits |
| Line width | core stroke thickness |
| Color shift | rainbow hue rate (0 = fixed color) |
| Glow | neon halo strength |
| Fade trails | comet mode — everything dissolves, endless loop |
| Trail duration | seconds a trail segment stays before it is fully gone |
| Fade glow | aura dissolves, colored trail stays permanently inked |
| Glow duration | seconds a halo lingers before it is fully gone |
| Free draw | parameter changes continue on the same canvas |
| Auto-morph | parameters drift and shapes mutate live |
| Morph speed | how quickly the auto-morph drift reshapes the figure |
| Twin pen | a second pen on the planet’s opposite side |
| Two colors | mix between two picked colors instead of the rainbow |
| Lock (🔒) | hover a control to reveal its padlock; locked controls are skipped by Random and Auto-morph |

**Keyboard:** `Space` play/pause · `R` random · `M` auto-morph · `C` clear · `L` copy link · `H` hide panel

## How it works

Curves are traced parametrically:

```
hypo:  x = (R−r)·cos t + d·cos(((R−r)/r)·t)     y = (R−r)·sin t − d·sin(((R−r)/r)·t)
epi:   x = (R+r)·cos t − d·cos(((R+r)/r)·t)     y = (R+r)·sin t − d·sin(((R+r)/r)·t)
```

A curve closes after **`r / gcd(R, r)`** laps — that is why coprime radii take ages, and how the progress hint and ⏩ Finish know when they are done. Strokes are drawn incrementally with adaptive step sizes (capped so even extreme gear ratios stay smooth), using `globalCompositeOperation: "lighter"` for the neon look.

The renderer is **three stacked canvas layers**: permanent *ink* (colored core strokes), a screen-blended *glow* layer (halos, dissolvable via `destination-out` shaving), and a per-frame *dot* layer for the live pen tips. PNG and video exports composite all three layers. The view transform is recomputed at stroke time, so the figure always fits the stage.

For kaleidoscope copies, the renderer builds one reusable `Path2D` per color chunk and applies rotation/reflection through canvas transforms, so duplicate slices do not clone point arrays. The main and twin pens are computed together with shared trigonometry.

## Tech

Single HTML file: Canvas 2D, vanilla JavaScript and CSS. No build step and no JavaScript dependencies. The page loads Space Grotesk from Google Fonts, with a `system-ui` fallback. Exports use `canvas.toDataURL` and `MediaRecorder` (`captureStream`).

## Recent improvements

- Kaleidoscope rendering uses reusable `Path2D` paths and canvas transforms instead of per-slice point cloning.
- `ptBoth()` computes main and twin pen points in one trigonometry pass.
- The background radial gradient is cached and recalculated only when the viewport changes.
- Auto-morph noise is low-pass filtered for smoother drift; slider labels show the actual fractional morph values.
- URL-hash parameters are clamped to their slider ranges, so malformed links cannot break the geometry.
- Mobile panel blur is reduced to avoid re-blurring the animating canvas every frame.
- Switch checkboxes remain keyboard-focusable; completion messages use `role="status"` / `aria-live`.
- A subtle stage vignette and white-hot mirrored pen tips complete the neon look.

## License

MIT — see [`LICENSE`](LICENSE).
