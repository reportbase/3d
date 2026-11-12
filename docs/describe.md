# describe it: asking Claude for an object

Moved here from `CLAUDE.md` (12 Nov 2026), unchanged: the dated notes of what was built, with the names to search for in the code. `CLAUDE.md` keeps the rules; read this before working on this part.

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
