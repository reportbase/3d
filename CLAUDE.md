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
  "look & fix" sends `viewsPng()` (front, side and three-quarter renders in one
  PNG) with the request and the current parts. Tune `SYS` from real results the
  owner sends (the first knight came out as a candlestick).
  Pictures the owner attaches (`pics`, up to three, shrunk to 1568 px JPEGs) go
  first in the user turn (`withPics`), with `picNote` saying how to read them: for
  a scene a map or sketch gives the layout (top of the picture is -z) and a photo
  the character. look & fix sends them again as the reference.
- **Scenes** (the `SCENES` block, `SCN`) are `{name, seed, ground, terrain, areas, types, place}`:
  `terrain` is a list of height features (`hill`, `ridge`, `slope`, `noise`) summed
  by `terrainOf`; under water areas the land is pushed below the water's `level`.
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
  `tint`, `y`). `place()` applies them in order with a seeded generator, so a
  scene always comes out the same. Each type is built at the `LODS` resolutions
  (around-counts multiples of 8, so boxes stay square) and drawn as one
  InstancedMesh per level; `update()` gives each copy the level for its distance
  in its own size (`NEAR`). Scene data is replaced, never changed in place, so
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
