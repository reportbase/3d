# Scenes: terrain, areas, types, placing, levels of detail, prefabs

Moved here from `CLAUDE.md` (12 Nov 2026), unchanged: the dated notes of what was built, with the names to search for in the code. `CLAUDE.md` keeps the rules; read this before working on this part.

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
  The **wander view** (`WV`, `wanderFrag`, the scene bar's "wander" button) draws two of
  wander's ideas on any scene: every scene surface banded by octaves of its distance from the
  eye in the reader's own h (the eye's height above what is under it), the corner at one h in
  gold, near bands mirroring far ones; and sway and bob read late by distance over the
  signals' speed C (2 to 400 m/s), with one gust everywhere so the delay is all that differs.
  A new scene material needs `onBeforeCompile = wanderFrag` to be banded.
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
