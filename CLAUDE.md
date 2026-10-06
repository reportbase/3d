# 3d: notes for Claude

A 3D shape studio in one page, served by GitHub Pages at
https://reportbase.github.io/3d/. The owner works through Claude Code: changes go
on a branch, as a PR, and the owner merges. Merging to `main` publishes.

## Files
- `3d.html`: **the studio, the file to edit.** One self-contained page with no
  build step; keep it that way. Its scripts, in order:
  1. **tvf-core**, copied unchanged from draw.html
  2. **the SVG importer and the `.tvf` reader**, copied unchanged from draw.html
  3. **the rung engine** (cascade, kernels, presets, brushes, `.tvf3d` forward
     transform), from classic.html, nearly unchanged
  4. **the studio app**: parts, editors, tools, files, examples
- `classic.html`: the previous editor, kept whole and still linked from the
  studio's advanced panel. Change it only to fix it.
- `index.html`: forwards `/3d/` to `3d.html`.

## Rules
- **The draw blocks are copies.** Each sits between
  `// >>> copied from draw.html, unchanged: NAME` and `// <<< end of NAME`.
  Don't edit inside them: fix the code in draw first, then copy it across.
  `tests/draw-sync.mjs` (the "Draw sync" check, also run weekly) fails when the
  copies no longer match draw's `main`.
- **The engine reads the global `state`.** `usePart(p)` points `state` at one
  part's cascade before any engine call (`evalFull`, `sculptOnce`,
  `drawStrokeTo` and so on). Engine code needing per-part data goes through that,
  not new globals.
- **The height kernel** (`eng.hkernel`, per part): `'flat'` (the default for new parts) lays
  the leaves up a part at h = sin²(π(i + ½)/(2N)) and reads the cosine series in
  x = (2/π) asin √h, so smooth sculpts are held exactly at the top and bottom; `'dct'` (even
  leaves) is set by `detailEng` for patterned parts, which it holds better; `'rbf'` is the old
  smooth kernel. Old files keep whatever they saved. Code that places or reads leaves in h
  goes through `leafH` and `hX`, never `(i + 0.5)/Nh`. See `bench/depth/H-RESULTS.md`.
- **A part's radius** is
  `core · outline · section(θ + twist·h) · taper·bulge + sculpt`. See
  `baseRadius` and `radiusAt`. For a core (preset, `.tvf3d`, image), the outline
  scales the core by `outline(h) / _origOutline(h)`, so an untouched outline
  reproduces the core exactly. Keep that property.
- **File formats:**
  - `.3da` is JSON `{format:'3d-studio', version:2, parts:[…], scene?, view?}`, and old
    `{format:'3d-assembly', version:1}` files still open (`fromAssemblyV1`).
    Change formats compatibly.
  - `.tvf3d` is what games reads for chess pieces: `TVF3D NH MT color`, then
    `Aa`, `Ab` and colour rows.
  - A whole object as one chess piece is a `TVF3D-PARTS n` file: per part a
    `PART name` line with a row-major 3×4 matrix, then that part's ordinary
    `.tvf3d` block (`buildPieceTVF3D`). The matrix already stands the piece on
    y=0, centres it and fits it to games' square; games reads it in
    `parseTVF3D` / `buildPartsGeometry`. Change the two together.
  - A chess set is six of those (`buildChessSet`): parts belong to a piece by the
    piece's name in their own (`pieceOf`), and all six share one scale, so the
    king is one unit tall and the rest keep their heights relative to it.
- **describe it** (the `DESCRIBE IT` block) asks Claude, through the
  `login.tangent.workers.dev` gateway with draw's sign-in, for the object as JSON
  in the panels' own terms (shape, outline, section, bend, hollow, pos/rot/scale,
  colour). Every field is clamped before `partFrom` sees it; "change it" sends
  the current parts with their ids and updates kept parts in place. If you add a
  part property, add it to the prompt (`SYS`), `opts` and `describeScene`.
  Requests are streamed (`apiCall` reassembles the reply), because a whole scene
  takes longer than the ~100 s Cloudflare allows a silent request (HTTP 524).
  Requests ask for `MAX_OUT` (64000) tokens: Claude Opus 5.5's thinking can't be
  turned off and counts against the same limit, and a big scene ran out at 16000.
  The login gateway clamps to its `MAX_TOKENS_CAP`, so the two must move together.
  "look & fix" sends `viewsPng()` (front, side and three-quarter renders in one
  PNG) with the request and the current parts. Tune `SYS` from real results the
  owner sends (the first knight came out as a candlestick).
  Pictures the owner attaches (`pics`, up to three, shrunk to 1568 px JPEGs) go
  first in the user turn (`withPics`), with `picNote` saying how to read them: for
  a scene a map or sketch gives the layout (top of the picture is -z) and a photo
  the character. look & fix sends them again as the reference.
  A place asked for as a new object (a village from pictures, built in the object
  view) comes back as `{"place": true}`; `build()` then switches to the scene view and
  sends the same words and pictures as a new scene.
- **Scenes** (the `SCENES` block, `SCN`) are `{name, seed, ground, terrain, areas, types, place}`:
  `terrain` is a list of height features (`hill`, `ridge`, `slope`, `noise`) summed
  by `terrainOf`. A sea or lake keeps its `level`, with a shelving floor and the land
  sloping down to it over 8 m; a stream (water given as a `path`) follows the land,
  its surface the ground along its centre line less 0.5 m, in a trough with banks
  (`surfOf`, drawn as a ribbon). Nothing may cut a vertical cliff (Oct 5: the stream
  stood up as a wall). The ground grows to hold every area and copy (`built.size`),
  and land areas' colours are blended at their edges on terrain (five samples).
  With terrain the ground is one vertex-coloured grid (`terrainMesh`), water flat
  sheets on it; copies stand on the ground (`baseY`, lowest point under the
  footprint) or float at a water level; `elevation` filters scatters and grids.
  Walk and fly (`setNav`, `tick`) move the camera with W A S D and drag to look;
  the orbit controls stand aside while they run.
  `areas` are named flat ground (rect, circle, polygon, or path with a width),
  drawn by `groundOf`; `water` and `blocks` flags keep scatters and grids where
  they belong (`allowed`), and rules name areas for `scatter`, `grid` and
  `exclude`. Anything flat and large must be an area: types scale uniformly.
  `types` are named lists of `partData`, `place` the placement rules
  (`at`, `row`, `ring`, `grid`, `scatter`, plus `scale`, `turn`, `jitter`, `exclude`,
  `tint`, `y`). A row may name a road area (`row.path: "high street"`) with `side` and
  `offset`: copies beside the road facing it, skipped where they would overlap. `place()` applies them in order with a seeded generator, so a
  scene always comes out the same. Each type is built at the `LODS` resolutions
  (around-counts multiples of 8, so boxes stay square) and drawn as one
  InstancedMesh per level; `update()` gives each copy the level for its distance
  in its own size (`NEAR`). A type with sculpted or painted parts is drawn from **prefixes
  of its parts' rungs** (TVF §5.6, bands produced by observation): level 0 the base alone,
  level l the base and rungs 0..l-1 at one vertex per leaf of rung l-1 (`partDims`,
  `buildGeometry`'s `cap`, the global `rungCap`). A copy takes the higher of the plain
  level and its octave level (rung r at 20/2^r sizes, `NEAR_OCT`), and the shader blends
  each level with the one-rung-shorter prefix (`posPrev`, `nrmPrev`, per-copy `fade`), so
  rungs fade in. Two vertices a leaf at 3-pixel leaves cost 15× the triangles: keep the budget.
  **Surface detail** (`PATTERNS`, `patternAt`, `makeDetail`, `applyDetail`): a part's
  `detail` {pattern, size, depth, color} is laid onto its own cascade rung by rung, each
  leaf the pattern averaged over its cell, each rung the residual of the coarser ones, the
  pattern's mean taken out (relief about the face, so far and near copies agree). The
  part gets leaves to its proportions and pattern size (`detailEng`, four to a feature,
  ≤ 384 at the first rung); a roof's rows run across its slope (`across`). Only the
  numbers are saved (`partData` skips a generated cascade, `_detailGen`); `prepPart`
  makes it again, cached. Hand sculpting on top makes the cascade the part's own.
  `rungGrid` reads a rung on a whole grid in two passes (the kernel is separable);
  `buildGeometry` and `makeDetail` use it, and must agree with `radiusAt`/`colorAt`. Scene data is replaced, never changed in place, so
  the undo history keeps references. The `.3da` carries it as `scene` and `view`.
  A type may instead be a **prefab**, `{name, group:[rules]}`: rules in the type's own
  frame (centre 0,0, front +z). `place()` runs every rule in a frame (`toW`, `dirW`);
  `put()` of a group runs its rules again in the copy's frame, two levels deep at
  most, then keeps its footprint (`groupR`, worked out from the rules) clear. Named
  areas stay world coordinates, inline shapes are local. `span` lays one copy per
  segment along a line or path, stretched to the segment (`T.len`, `T.cx`); a long
  stretched copy registers a string of small circles, not one big one. Parts may be
  given by `size` (metres, measured by `unitSize`), and `shape:'roof'` (`makeRoof`)
  is a gable roof with its eaves at `pos` and its ridge along its length.
  A part with `on` (a part named earlier in the same reply, or an existing part when
  changing), `face` and `at` is placed by `attach()` before it is made: turned to
  face out of that face, 30% of its depth inside it. Claude's own arithmetic for
  windows left them floating or buried (Oct 5), so the prompt says always to use it.
  The **prefab library** (`LIB_TYPES`, `LIBRARY`, `libAdd`, in the DESCRIBE IT block) is
  written in Claude's reply terms and converted by `sceneTypes` once per type
  (`libType`), so a type placed twice compares equal and is reused; a clash with a
  different type of the same name brings the library's in as "name 2". Placing is a
  click without a drag on the ground (`SCN.pick`), adding an `at` rule facing the camera.
  A new rule goes in `place()`, `SCENE_SYS` (the prompt) and `ruleText`.
- Comments explain *why*, in plain sentences; match the file's existing voice.

## Testing
- `npm test` runs `tests/classic.mjs` and `tests/editor.mjs` (headless Chromium).
  Run it before every PR. When adding a feature, add steps to
  `tests/editor.mjs` that check it has an effect, not just that nothing throws.
- `node tests/draw-sync.mjs` checks the draw copies (add
  `DRAW_HTML=../draw/draw.html` to compare with a local draw).
- In a cloud sandbox the CDNs may be blocked. Install `three@0.128.0` somewhere
  and run `LIBS_DIR=that/node_modules npm test`; both tests then serve three.js
  and its controls from it.

## Related repos
- **draw:** the source of the copied blocks.
- **games:** reads `.tvf3d` chess pieces.
- **flare:** storage. Not used by 3d.
