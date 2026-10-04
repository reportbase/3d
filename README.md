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

## Studio (interface mockup)

**Try it:** https://reportbase.github.io/3d/studio.html

`studio.html` is a clickable mockup of a new interface for the editor. It's
for trying out and reacting to; `3d.html` stays the real tool. It shows:

- **one workspace:** the parts list is always there; double-click a part to
  shape it in place while the rest of the object fades to ghosts (Esc steps out)
- **three linked views of a part:** the 3D view, its **side outline** (drag
  points to reshape it) and its **section** (round, polygon, star, petals)
- **tools named by what you're doing:** shape, sculpt, bend, paint, hollow,
  detail, with the engine's own controls behind an **advanced** switch
- **move / turn / size handles** with snapping (a part settles onto whatever is
  under it), and one undo history with thumbnails
- **examples:** a table, a snowman and a lighthouse

To keep the mockup small, each part is `outline(h) × section(θ)`, bent, plus a
sculpt layer: the same kind of shape the editor makes, but without its rung
engine, `.tvf3d` files or brush painting. The "describe it" box isn't wired up
yet.

## Assembling parts into one object

A single shape is one surface around one vertical axis, like something turned
on a lathe. That makes a vase easy but a table impossible, since nothing can sit
off to the side. The **assemble** button (top left) adds a level above that:

- **Parts:** each part is one shape, either a preset or whatever you sculpted
  (**+ sculpted shape**).
- **Placing:** each part has its own position, rotation, size and stretch
  (wide / tall / deep), plus a name and a colour. Drag a part to slide it along
  the floor, alt-drag to lift it, and shift-drag or drag empty space to look
  around.
- **Editing:** **edit in sculpt** opens a part in the normal editor, and
  **↩ update part** puts your changes back.
- **Saving:** **save** / **open** use a `.3da` file. **export .stl** writes the
  whole assembly as one mesh.
- **Examples:** **example: table** (a top, four legs, a vase and an apple) and
  **example: snowman** (three balls, a carrot nose, eyes, buttons, stick arms
  and a top hat) show how parts fit together.

Assemblies don't export to `.tvf3d`, because that format holds a single
surface.

## Presets

- **Chess:** knight, pawn, rook, bishop, queen
- **Primitives:** supershape, cylinder, sphere, ball (round), egg, cone, diamond, vase, rounded cube, square, rectangle, cube and thin variants
- **Gems and more:** gem, fluted, brilliant, emerald, quartz, twisted, star, spiked
- **Stress test:** corner test (sharp box)

## Files

| File | What it is |
| --- | --- |
| `3d.html` | The whole editor: one self-contained page. This is the file to edit. |
| `index.html` | Forwards `/3d/` to `3d.html`. |
| `studio.html` | The interface mockup (see above). |
| `tests/smoke.mjs`, `tests/studio.mjs` | The smoke tests (see below). |

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
- the assembly: both examples, every part slider, dragging a part, adding,
  duplicating and deleting parts, editing a part in sculpt and bringing it back,
  and saving and reopening

`tests/studio.mjs` does the same for the studio mockup: every example, tool,
section type and starting shape, dragging an outline point, sculpting in place,
duplicate, delete, undo and redo.

They fail if anything throws an uncaught error. To run them yourself:

```sh
npm install
npx playwright install chromium
npm test
```

## Publishing

Turn on GitHub Pages once: **Settings → Pages → Deploy from a branch → `main`,
`/ (root)` → Save**. After that, merging to `main` updates the live site within
a minute or two.
