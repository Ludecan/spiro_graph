# Spiro Graph ✦

A beautiful, flashy, single-file interactive spirograph playground. No build step, no dependencies — open `index.html` in a browser and play.

**🎨 Live demo:** *(add one — e.g. GitHub Pages from the `main` branch)*

https://github.com/user-attachments/assets/placeholder-video-or-screenshot

## Features

- **Real spirograph math** — hypotrochoid & epitrochoid curves with classic ring / planet / pen-offset parameters
- **Neon renderer** — additive-blended glow strokes, rainbow hue cycling, and a pulsing pen-tip light, retina-aware
- **Pen wobble** — make the pen distance oscillate for organic, jellyfish-like shapes
- **Kaleidoscope** — Mirror ×N draws N rotationally-mirrored copies of every stroke → instant mandalas
- **Spin** — the figure grows on a virtual turntable, spiraling into galaxy-like swirls
- **Twin pen** — a second pen on the opposite side of the planet, drawing an interlocking twin curve
- **Auto-morph** — parameters drift on slow LFOs + noise; watch shapes melt into each other forever
- **Free draw** — never-resets mode: tweak geometry mid-curve and the pen keeps drawing from where it is
- **Fade trails / fade glow** — independent controls: comet mode with adjustable trail length, or "glow-only" fade where the soft aura dissolves while your colored trail stays permanently inked
- **Two-color mode** — cross-fade between any two picked colors instead of the full rainbow
- **Progress & completion** — live "closes in ~N laps" hint, and an instant **⏩ Finish** fast-forward
- **Presets & randomizer** — curated starting shapes, or 🎲 one-shot chaos
- **🔒 Per-control locks** — pin *any* control, even the fade & mode engines (hover to reveal its padlock); Random and Auto-morph only ever touch what you leave unlocked — lock your favorite ring & planet, then riff on everything else, or lock the look and riff on engines
- **Export** — save a crisp PNG, or record 60fps WebM video of the canvas (native `MediaRecorder`)
- **Shareable state** — every parameter lives in the URL hash; **🔗 Link** copies the current look to your clipboard
- **Responsive** — docked glass control panel on desktop, floating overlay on mobile

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
| Mirror ×N | kaleidoscope — N rotational mirrored copies (1 = off) |
| Spin | swirl: the figure grows on a spinning turntable |
| Speed | how fast the planet orbits |
| Line width | core stroke thickness |
| Color shift | rainbow hue rate (0 = fixed color) |
| Glow | neon halo strength |
| Fade trails | comet mode — everything dissolves, endless loop |
| Fade glow | aura dissolves, colored trail stays permanently inked |
| Trail length | fade speed, drives both layers |
| Free draw | parameter changes continue on the same canvas |
| Auto-morph (+ speed) | parameters drift and shapes mutate live |
| Twin pen | a second pen on the planet's opposite side |
| Two colors | mix between two picked colors instead of rainbow |

**Keyboard:** `Space` play/pause · `R` random · `M` auto-morph · `C` clear · `L` copy link · `H` hide panel

## How it works

Curves are traced parametrically:

```
hypo:  x = (R−r)·cos t + d·cos(((R−r)/r)·t)     y = (R−r)·sin t − d·sin(((R−r)/r)·t)
epi:   x = (R+r)·cos t − d·cos(((R+r)/r)·t)     y = (R+r)·sin t − d·sin(((R+r)/r)·t)
```

A curve closes after **`r / gcd(R, r)`** laps — that's why coprime radii take ages, and how the progress hint and ⏩ Finish know when they're done. Strokes are drawn incrementally with adaptive step sizes (so even extreme gear ratios stay smooth) with `globalCompositeOperation: "lighter"` for the neon look. The renderer is **three stacked canvas layers** — permanent *ink* (colored core strokes), a screen-blended *glow* layer (halos, dissolvable via `destination-out` shaving), and a per-frame *dot* layer for the live pen tip — so the aura can fade away without ever touching the trail. PNG and video exports composite all three layers. The view transform is recomputed at stroke time, so the figure always fits the stage.

## Tech

Single HTML file: Canvas 2D + vanilla JS + hand-rolled glassmorphism CSS. Zero dependencies, zero build. GIF-adjacent exports via `canvas.toDataURL` and `MediaRecorder` (`captureStream`).

## Ideas / roadmap

- Zoom & pan of the stage
- Custom presets saved to localStorage
- Dot / dashed pen and pulse (oscillating) line width
- SVG (vector) export
- "Harmonic" mode — a second tiny gear on the pen itself

## License

MIT — see `LICENSE` *(add it if you want one!)*
