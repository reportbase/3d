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
keeps its sculpting. **chess set** builds all six pieces in one style from one
description ("a fantasy set in green marble and gold"), laid out in a row; then
**file → export a chess set** writes `pawn.tvf3d` … `king.tvf3d`, scaled together
so the king stays taller than the pawn. Drop all six on the games page. **look & fix** shows Claude pictures of the object from three
sides next to what you asked for, and it corrects what's wrong: a part floating,
a head pointing the wrong way. Type a note first to steer it. **copy reply**
copies Claude's last answer, for reporting a bad result. **+ picture** (or paste
or drop one on the panel) gives Claude up to three pictures to build from, with
or without words: a photo of a chair for an object; for a scene, a map, aerial
view or sketch gives the layout, and a photo or painting the look. They stay
attached, so change it and look & fix compare against them too. Undo takes any step back. It runs through the same
sign-in as draw's AI button (the tangent login gateway holds the key; each
account has a daily allowance).

**scene** (the switch next to the name) builds whole places. Describe one ("a
fishing village on a rocky coast", "a pine forest around a lake") and Claude
writes it as **terrain** (hills, ridges, valleys, land rising from a shore),
named **areas** of ground (the sea, a beach, roads, fields, a
square), a small **library of object types** (a cottage, a pine, a boat, a
rock) and a few dozen **placement rules**: one copy here, a row of houses down a
street, a ring of stones, a grid of crops, hundreds of trees scattered over a
hillside. The studio does the repeating, with small random variations, keeping
scattered copies apart. Rules use areas by name: boats are scattered "in the
harbour", and water and roads are kept clear of everything else automatically.
Everything stands on the ground where it lands (and boats float), and a rule can
keep to a height range, like pines only on high ground. Streams run downhill on the land
in a shallow bed; shores and banks slope instead of dropping as cliffs; houses
can line a named street on one or both sides, facing it. **walk** puts you in the
scene at eye height (W A S D or arrows, drag to look, Shift to run) and **fly**
lets you soar over it (Space and Q for up and down); Esc stops. Each type is built once at five levels
of detail and drawn as instances, so a scene can hold thousands of objects:
copies near the camera are drawn in full, distant ones with a few dozen
triangles. A sculpted type is drawn from its own coarse bands as it
recedes, one rung of detail per doubling of distance, each fading in as you approach.
Parts can carry **surface detail**, stones, bricks, shingles, planks, boards, bark
or rough, which Claude asks for in a few words and the studio lays onto the part's
own rungs: a far wall is its plain colour, a near one shows its stones. **edit** on a type opens it in the studio; when you're done, every copy
updates. **shuffle** re-places everything with a new seed; **change scene** and
**look & fix** work on the whole scene; scenes save in the `.3da` with the object.

A type can also be a **prefab**: a little layout of other types, like a
homestead (a cottage, a walled garden, a bed of cabbages), written once in its
own coordinates. Rules place prefabs exactly like single objects, a street of
homesteads or fifty farmsteads scattered over the valley, and every copy lays
itself out again, turned with it and with its own random details; the forest
keeps out of its yard. Walls, fences and hedges are **spans**, one copy stretched
from corner to corner along a line or a path; rows can follow a **path** too, so
lamps go round the bend of a street. Parts can be given by their **size** in
metres, **roof** is a gable roof sitting on its eaves, and doors and windows
name the wall they go **on**, its face and where on it; the studio sets them
flush into that face, turned the right way.

The scene panel also has a **prefab library** for building by hand: a
homestead, a terrace of town houses, a farmstead, a churchyard, a market, a
windmill, a well, a grove and a campsite. Pick one and click the ground; each
click places one facing you (R turns the next one, Esc stops). With no scene
yet, picking one starts an empty place. Placed prefabs are ordinary types and
rules, so describe ✦ can carry on from them ("add a road between the farms").

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
| `.3da` | The whole object: every part's settings, sculpting and paint, plus the scene if there is one (its types and rules). Files from the classic editor's assemble mode open too. |
| `.tvf3d` | One part, for the chess pieces in [games](https://github.com/reportbase/games). Lean and hollow aren't representable in it, and the export says so. |
| `.tvf3d` (chess piece) | The whole object as one chess piece for games: every part's field plus where it goes, stood on the board and sized to a square. Name the file after the piece it replaces (`knight.tvf3d`) and drop it on the games page to try it. |
| `.tvf3d` × 6 (chess set) | One file per piece, from parts named after their piece ("knight mane 2"), all sharing one scale so the set keeps its proportions in games. |
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
  sent really shows the object), building from a picture (shrunk to 1568 px,
  sent first, sent again by look & fix, three at most, a scene from a map), and
  failed replies changing nothing
- **scenes**, against a stand-in gateway: a village's rule counts, straight rows,
  round rings, scattered copies keeping apart and out of excluded areas; every
  copy at the detail its distance calls for; shuffle and undo; editing a type
  updates all its copies; saving and opening; change scene and look & fix;
  terrain heights, copies standing on the ground, boats at a raised lake's
  level, the elevation filter; walking at eye height and flying; prefabs laid
  out whole in each copy's frame (turned, nested, different in each copy, their
  yards kept clear), spans reaching end to end, rows along a path, stretch
- parts given by size come out exactly that size; a roof sits on its eaves with
  the ridge along its length
- doors, windows and a chimney set on a turned wall's front, back, sides and top
  sit flush, slightly proud, where `at` puts them
- the prefab library: a click places one where it lands, facing the camera, R
  turns it, a drag places nothing, Esc stops, undo; a scene's own type of the
  same name is kept and the library's comes in renamed; every prefab builds
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
