# 3D

A 3D shape studio in one page. You build an object from **parts**. Each part is
a shape turned around its own axis, like something on a lathe, which you then
shape, sculpt, bend, paint and hollow. You place the parts together, and save
or export them as one object.

**Use it:** https://reportbase.github.io/3d/ (once GitHub Pages is turned on
for this repo; see Publishing below)

## How it works

The screen has five areas:

- **Parts** (left): every part in the object. Click a part to select it, and
  double-click it to **shape it in place**. The other parts fade to ghosts so
  you can still see the whole object; Esc steps back out.
- **The 3D view** (centre): move / turn / size handles (W / E / R). With snap
  on, a part settles onto whatever is under it when you let go.
- **Side outline** (right): drag the points to change how wide the part is at
  each height. Click the line to add a point, and double-click a point to remove
  it. **from a drawing…** takes the outline from the silhouette of an `.svg`, or
  of a `.tvf` saved in draw.
- **Section** (right): the part's shape going around: round, polygon, star,
  petals, supershape, or **drawn**. A drawn section is a curve whose points you
  drag. You can start it from draw's shapes (circle, superellipse, polygon,
  star, blob, rose), smooth it, give it n-fold symmetry, or mirror it. It can
  also come in from an `.svg`, a draw `.tvf`, or paste from draw, and go back
  out to draw with **to draw**.
- **Tools** (bottom):
  - **shape:** a gallery of starting shapes and the classic presets (knight, rook,
    gem, …)
  - **sculpt:** 14 brushes and 6 stamps, with symmetry and mirror
  - **bend:** taper, bulge, twist, lean
  - **paint:** the part's colour, stripes, and a paint brush
  - **hollow:** wall thickness and floor height
  - **detail:** how finely parts are drawn, and the sculpt levels

  On the right of the tool strip, the undo history shows a picture of every step.

**describe ✦** (top bar) builds an object from words: type "a rook with a red
band" or "a little wooden boat" and Claude makes it from parts, which you can
then shape and sculpt like any others. Switch to **change it** to keep going
("give it a taller mast", "make the band gold"): Claude sees the current parts
and edits them, and a hand-sculpted part that is only moved or recoloured
keeps its sculpting. **look & fix** shows Claude pictures of the object from three
sides next to what you asked for, and it corrects what's wrong: a part floating,
a head pointing the wrong way. Type a note first to steer it. **copy reply**
copies Claude's last answer, for reporting a bad result. Undo takes any step back. It runs through the same
sign-in as draw's AI button (the tangent login gateway holds the key; each
account has a daily allowance).

**advanced** (top right) shows the engine's own controls: which rung the brush
writes to, leaf counts, the kernel, aperture and the run.

### What a part is

    r(θ,h) = core(θ,h) · outline(h) · section(θ + twist·h) · taper·bulge(h)  +  sculpt(θ,h)

- **core:** what the part started as: plain, a classic preset, a loaded
  `.tvf3d`, or a grayscale image. With an untouched outline, a classic preset
  is reproduced exactly; the outline then reshapes it.
- **sculpt:** the multi-resolution **rung cascade** from the classic editor.
  Every brush writes into one rung. The brush size picks the rung: big brushes
  move the broad form and small brushes add detail. Brush paint lives in the
  same cascade.

### From draw

The section editor and the drawing import reuse two parts of
[draw](https://github.com/reportbase/draw), copied unchanged: its curve library
**tvf-core** (closed curves whose points lie on the curve) and its **SVG
importer**. They also read draw's `.tvf` format, so a shape made in draw can
become a 3D section or silhouette.

## Files

| File | What it is |
| --- | --- |
| `3d.html` | The shape studio: one self-contained page. This is the file to edit. |
| `classic.html` | The previous editor, kept whole. It still has the engine instruments the studio doesn't show (sheets, booleans, the profile curve, the leaf registers) and its own assemble mode. |
| `index.html` | Forwards `/3d/` to `3d.html`. |
| `tests/editor.mjs`, `tests/classic.mjs`, `tests/draw-sync.mjs` | The tests (see below). |
| `CLAUDE.md` | Notes for Claude Code sessions working on this repo. |

**Saving and exporting:**

| Format | What it holds |
| --- | --- |
| `.3da` | The whole object: every part's settings, sculpting and paint. Files from the classic editor's assemble mode open too. |
| `.tvf3d` | One part, for the chess pieces in [games](https://github.com/reportbase/games). Lean and hollow aren't representable in it, and the export says so. |
| `.tvf3d` (chess piece) | The whole object as one chess piece for games: every part's field plus where it goes, stood on the board and sized to a square. Name the file after the piece it replaces (`knight.tvf3d`) and drop it on the games page to try it. |
| `.stl` | The whole object as one mesh, for 3D printing. |

three.js (r128) loads from a CDN at runtime, so the page needs an internet
connection.

## Running it locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000/3d.html
```

## Smoke tests

Every pull request runs both tests in GitHub Actions. They fail on any uncaught
error, or when an action has no effect.

`tests/editor.mjs` covers the studio:

- every example and every section kind
- dragging an outline point and a section point
- draw's shapes, an `.svg` and a draw `.tvf` coming in as a section and as an
  outline
- every brush and stamp (checking the surface moved), and painting (checking the
  colour changed)
- every tool slider
- `.tvf3d` export, checking it matches the part, then importing it back
- exporting the snowman as a chess piece, rebuilding it from its parts as games
  does, and checking it stands on the board, is centred and keeps its proportions
- `.stl` export
- `.3da` save and open, checking it reopens the same, plus an old assemble-mode
  file
- **describe it**, against a stand-in gateway: building an object, changing
  one (keeping a sculpted part's sculpting), look & fix (checking the picture
  sent really shows the object), and failed replies changing nothing
- every starting shape
- duplicate, delete, undo and redo

`tests/classic.mjs` covers the classic editor.

`tests/draw-sync.mjs` checks that the code copied from draw (between the
`>>> copied from draw.html` markers in `3d.html`) still matches draw's `main`. It
runs on every pull request and weekly, as its own "Draw sync" check. When draw
changes that code, copy the new version across.

To run them yourself:

```sh
npm install
npx playwright install chromium
npm test
```

## Publishing

Turn on GitHub Pages once: **Settings → Pages → Deploy from a branch → `main`,
`/ (root)` → Save**. After that, merging to `main` updates the live site within
a minute or two.
