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
- **Fade trails** — adjustable trail length: subtle ghosting to full comet tails; with morph, an infinite lava-lamp screensaver
- **Two-color mode** — cross-fade between any two picked colors instead of the full rainbow
- **Progress & completion** — live "closes in ~N laps" hint, and an instant **⏩ Finish** fast-forward
- **Presets & randomizer** — curated starting shapes, or 🎲 one-shot chaos
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
| Fade trails | endless loop with comet tails |
| Trail length | how long the trails linger (with fade on) |
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

A curve closes after **`r / gcd(R, r)`** laps — that's why coprime radii take ages, and how the progress hint and ⏩ Finish know when they're done. Strokes are drawn incrementally with adaptive step sizes (so even extreme gear ratios stay smooth) onto a persistent canvas with `globalCompositeOperation: "lighter"` for the neon look. The view transform is recomputed at stroke time, so the figure always fits the stage.

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
