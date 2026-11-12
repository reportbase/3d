# Parts: leaves, sections, kinds, the mesh and the file formats

Moved here from `CLAUDE.md` (12 Nov 2026), unchanged: the dated notes of what was built, with the names to search for in the code. `CLAUDE.md` keeps the rules; read this before working on this part.

## The height kernel, corners, the way up, placing

- **The height kernel** (`eng.hkernel`, per part): `'flat'` (the default for new parts) lays
  the leaves up a part at h = sin²(π(i + ½)/(2N)) and reads the cosine series in
  x = (2/π) asin √h, so smooth sculpts are held exactly at the top and bottom; `'dct'` (even
  leaves) is set by `detailEng` for patterned parts, which it holds better; `'rbf'` is the old
  smooth kernel. Old files keep whatever they saved. Code that places or reads leaves in h
  goes through `leafH` and `hX`, never `(i + 0.5)/Nh`. See `bench/depth/H-RESULTS.md`.
- **Corners and sharp points** (24 Oct 2026): a section of type `'corners'` holds the shape as
  drawn (`section.corners = {x, y, round, smooth, ctrl}`, draw's exact-shape record, centred and
  reaching 1), read by `EXS` (draw's outline rules written again: they are not a copied block, so
  keep them agreeing with draw's `edgeCtrl`, `cornerArc`, `smoothTangent`). It comes from a draw
  `.tvf` carrying TVF §2.9's structure (`tvfStructure`, with the `leafsum` check) or an SVG's
  lines and cubics (`svgRings`), when the shape has a sharp corner. An outline point `[h, r, 1]` is
  sharp (`outlineAt` leaves it straight toward each neighbour). The mesh puts a column on each sharp
  section corner (and a flat-sided polygon's) and a ring on each sharp outline point, twice
  (`meshThetas`, `meshHeights`), so its faces shade apart: code that indexes a part's mesh must use
  those, not `j/NT`.
- **One way up** (24 Oct 2026): the section panel is the part seen from above (+z, the front, down the
  panel). A drawing's y runs up, so coming in it is turned to -z (`flipY`, and the primitives), and going
  out to draw -z back to y (`saveSectionTvf`, `saveCornersTvf`): an arrow drawn pointing up points to the
  back. Saved sections keep the way they look. Extruded drawings already lie y to -z.
- **Placing** (24 Oct 2026): with snap on, a part moved by the gizmo snaps along x and z to other parts'
  sides and middles within `SNAP_NEAR` × its camera distance, gold guides while dragging (`snapAlign`),
  else the 5 cm grid; turns snap to 15°, sizes to 5%. Placement values are typed by clicking them (`TYPED`).

## Part kinds and extruded parts

- **Part kinds** (24 Oct 2026): a part is turned (`lathe`, whatever its core) or `extruded`, read from
  its data by `kindOf(p)` (`p.extrude` makes it extruded; files carry no kind field). Everything that
  differs by kind goes through `PART_KINDS[kind]`: `geometry`, `polar` (its reach, `p._sec`), `has`
  (leaves, hollow, patterns, outline, sectionTypes), `outlineNote`, `sectionPanel`, `drawSection`,
  `toolNote`, `save`/`adopt`, `describe`/`keep`, `exportNotes`, `describable`. Don't test `p.extrude`
  outside the extruded kind's own code; add to the interface instead. A new kind is an entry there, a
  line in `kindOf` and its panels; the smoke test checks every kind answers the whole interface.
- **Extruded parts** (24 Oct 2026): `p.extrude = {regions: [{outer, holes}]}`, rings in draw's
  exact-shape record, normalised (`normalizeRegions`: centred, the larger side of the box 1). The drawing
  lies in the ground plane (x along x, y along -z) pushed up h 0..1; `buildGeometry` hands it to
  `extrudeGeometry` (sides as runs between sharp corners, ends by `THREE.ShapeUtils.triangulateShape`,
  every triangle wound outward: the smoke test checks the mesh's volume). `p._sec` is its outer reach
  (`polarRegions`, not scaled to 1) and its outline `[[0,1],[1,1]]`, so `baseRadius` still answers for
  a .tvf3d or a girth. No cascade: sculpting, brush paint, hollow and patterns skip it. Drawings come in
  by `regionsFromText` (a draw .tvf's TVF §2.9 holes, or rings nested by containment).

## A part's radius

- **A part's radius** is
  `core · outline · section(θ + twist·h) · taper·bulge + sculpt`. See
  `baseRadius` and `radiusAt`. For a core (preset, `.tvf3d`, image), the outline
  scales the core by `outline(h) / _origOutline(h)`, so an untouched outline
  reproduces the core exactly. Keep that property.

## File formats

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
    The studio opens one again (file → open, or add parts; `importTvf3d`): the parts come
    back at the piece's size, placed as they were, each painted the mean of its colour
    series. The file pickers take any file (a phone greys out unknown extensions).
  - A chess set is six of those (`buildChessSet`): parts belong to a piece by the
    piece's name in their own (`pieceOf`), and all six share one scale, so the
    king is one unit tall and the rest keep their heights relative to it.
