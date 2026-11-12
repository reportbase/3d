# 3d: notes for Claude

A 3D shape studio in one page, served by GitHub Pages at
https://reportbase.github.io/3d/. The owner works through Claude Code: changes go
on a branch, as a PR, and the owner merges. Merging to `main` publishes.

This file holds the rules: what each file is, what a change must not break, how to test.
The dated notes of what was built and why (the names to search for in `3d.html`, the numbers
measured) are in `docs/`, by part; **read the one for the part you are about to change**:

| Working on | Read |
| --- | --- |
| a part: the height kernel, sections and corners, the way up, placing, part kinds, extruded parts, the radius, the mesh, the file formats | `docs/parts.md` |
| describe it, look & fix, pictures, the prompt, the gateway | `docs/describe.md` |
| scenes: terrain, water, areas, types, placement rules, levels of detail, surface detail, prefabs and the library, walk and fly, the wander view | `docs/scenes.md` |

When a change adds something a later session would need to know, put the rule here in a
line and the account of it in the `docs/` file, dated, in the voice those have.

## Files
- `3d.html`: **the studio, the file to edit.** One self-contained page with no
  build step; keep it that way. Its scripts, in order:
  1. **tvf-core**, copied unchanged from draw (the top of draw's `tvf-core.js`, which
     `draw.html` loads; it used to be inlined in `draw.html`)
  2. **the SVG importer**, copied unchanged from draw's `svg-import.js` (which `draw.html`
     loads; it was in `draw.html` until 12 Nov 2026), and **the `.tvf` reader**, copied
     unchanged from draw's `tvf-reader.js` (moved out of `draw.html` the same day)
  3. **the rung engine** (cascade, kernels, presets, brushes, `.tvf3d` forward
     transform), from classic.html, nearly unchanged
  4. **the studio app**: parts, editors, tools, files, examples
- `classic.html`: the previous editor, kept whole and still linked from the
  studio's advanced panel. Change it only to fix it.
- `situations.html`: five ways to observe (0 to 4), from wander's papers (SPN §2.1, as the
  owner regrouped it on 6 Oct): 0 nothing; 1 and 2 the mathematical views, an equation and an
  array, not pictures; 3 the apple in the hand; 4 a molecule in an endless apple, the others
  arriving one at a time. A slideshow: each frame has one expression and nothing else; keep it
  that way. Linked from the advanced panel.
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
- **Leaves in h** are placed and read through `leafH` and `hX`, never `(i + 0.5)/Nh`: the
  height kernel (`eng.hkernel`) differs by part, and old files keep whatever they saved.
- **A part's mesh** is indexed through `meshThetas` and `meshHeights`, not `j/NT`: sharp
  corners and sharp outline points get a column or a ring twice.
- **`EXS` is draw's outline rules written again**, not a copied block: keep it agreeing with
  draw's `edgeCtrl`, `cornerArc`, `smoothTangent`.
- **One way up:** the section panel is the part seen from above. A drawing's y is turned to -z
  coming in and back going out to draw.
- **Part kinds:** `kindOf(p)` reads a part's kind (`lathe` or `extruded`) from its data, and
  everything that differs by kind goes through `PART_KINDS[kind]`. Don't test `p.extrude`
  outside the extruded kind's own code; add to the interface instead. The smoke test checks
  every kind answers the whole interface.
- **Extruded parts** have no cascade: sculpting, brush paint, hollow and patterns skip them.
  Every triangle is wound outward (the smoke test checks the mesh's volume).
- **A part's radius** is `core · outline · section(θ + twist·h) · taper·bulge + sculpt`
  (`baseRadius`, `radiusAt`). An untouched outline reproduces the core exactly. Keep that
  property.
- **File formats change compatibly.** `.3da` (old `3d-assembly` version 1 files still open)
  and `.tvf3d`, which games reads for chess pieces. `TVF3D-PARTS` (`buildPieceTVF3D`) is read
  by games in `parseTVF3D` / `buildPartsGeometry`: change the two together.
- **describe it** talks to the `login.tangent.workers.dev` gateway (the page holds no API
  key). If you add a part property, add it to the prompt (`SYS`), `opts` and `describeScene`.
  Every field of a reply is clamped before `partFrom` sees it. `MAX_OUT` and the gateway's
  `MAX_TOKENS_CAP` must move together.
- **Scenes:** scene data is replaced, never changed in place, so the undo history keeps
  references. A new rule goes in `place()`, `SCENE_SYS` (the prompt) and `ruleText`.
  `place()` is seeded, so a scene always comes out the same. A new scene material needs
  `onBeforeCompile = wanderFrag` to be banded. Anything flat and large must be an area.
  Nothing may cut a vertical cliff. `rungGrid` must agree with `radiusAt`/`colorAt`.
- Comments explain *why*, in plain sentences; match the file's existing voice.

## Testing
- `npm test` runs `tests/classic.mjs`, `tests/editor.mjs` and `tests/situations.mjs` (headless Chromium).
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
