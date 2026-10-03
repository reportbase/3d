# 3D

A 3D shape editor ("field rung editor — r(θ,h)") in one page. Every shape is a
radius r(θ, h) around its own axis, built up in "rungs" of detail. Start from a
preset (chess pieces, primitives, gems and more), then sculpt with brushes,
combine shapes (union, intersect, carve), revolve a profile, and bend, taper or
twist the whole thing.

Shapes export as `.tvf3d`, the format the chess pieces in
[games](https://github.com/reportbase/games) use, or as `.stl` for 3D printing.

**Use it:** https://reportbase.github.io/3d/ (once GitHub Pages is turned on
for this repo; see Publishing below)

## Presets

- **Chess:** knight, pawn, rook, bishop, queen
- **Primitives:** supershape, cylinder, sphere, egg, cone, diamond, vase, rounded cube, square, rectangle, cube and thin variants
- **Gems and more:** gem, fluted, brilliant, emerald, quartz, twisted, star, spiked
- **Stress test:** corner test (sharp box)

## Files

| File | What it is |
| --- | --- |
| `3d.html` | The whole editor: one self-contained page. This is the file to edit. |
| `index.html` | Forwards `/3d/` to `3d.html`. |
| `tests/smoke.mjs` | The smoke test (see below). |

three.js (r128) loads from a CDN at runtime, so the page needs an internet
connection.

## Running it locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000/3d.html
```

## Smoke test

Every pull request runs `tests/smoke.mjs` in GitHub Actions. It opens the page
in headless Chromium and works every control except the ones that open a file
dialog or download a file:

- each preset, brush (with a sculpting drag), symmetry, operand and curve target
- every checkbox and every slider (moved to its minimum, its maximum and back)
- the union, intersect, carve, profile, rung and sheet buttons

It fails if anything throws an uncaught error. To run it yourself:

```sh
npm install
npx playwright install chromium
npm test
```

## Publishing

Turn on GitHub Pages once: **Settings → Pages → Deploy from a branch → `main`,
`/ (root)` → Save**. After that, merging to `main` updates the live site within
a minute or two.
