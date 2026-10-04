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
  - `.3da` is JSON `{format:'3d-studio', version:2, parts:[…]}`, and old
    `{format:'3d-assembly', version:1}` files still open (`fromAssemblyV1`).
    Change formats compatibly.
  - `.tvf3d` is what games reads for chess pieces: `TVF3D NH MT color`, then
    `Aa`, `Ab` and colour rows.
  - A whole object as one chess piece is a `TVF3D-PARTS n` file: per part a
    `PART name` line with a row-major 3×4 matrix, then that part's ordinary
    `.tvf3d` block (`buildPieceTVF3D`). The matrix already stands the piece on
    y=0, centres it and fits it to games' square; games reads it in
    `parseTVF3D` / `buildPartsGeometry`. Change the two together.
- **describe it** (the `DESCRIBE IT` block) asks Claude, through the
  `login.tangent.workers.dev` gateway with draw's sign-in, for the object as JSON
  in the panels' own terms (shape, outline, section, bend, hollow, pos/rot/scale,
  colour). Every field is clamped before `partFrom` sees it; "change it" sends
  the current parts with their ids and updates kept parts in place. If you add a
  part property, add it to the prompt (`SYS`), `opts` and `describeScene`.
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
