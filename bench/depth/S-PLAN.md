# DEP-S: depth read from a real scene

*Plan written 6 October 2026, after DEP-A and before any code for this one or any look
at the scene's readings, and committed on its own. One counted run. Kills recorded,
not patched.*

## Why

Every bench so far used readings written down in advance: sines in log distance, a
burst, Gaussian rocks. On those the flattened nesting (F, DEP-F) reached roundoff.
Those are the friendliest readings there are, smooth inside each octave. A real scene
has edges: a wall in front of the sea, a roof against a field. This run asks whether
what was learned holds on content we didn't choose.

## The scene and the reading

- **Scene:** the harbour village, `tests/harbour.json`, built by the studio as the
  tests build it (`__describe.applyScene`). This includes its terrain (a slope, two
  hills, noise), the sea, the stream, the roads and the 60-odd copies of houses, boats
  and trees.
- **Viewer:** standing on the high street at the middle point of its path, on the
  ground there (height g₀), with the eye at **H = 1.7 m** (walking) and **H = 30 m**
  (flying). Eight directions, every 45° from +x. That is 16 views.
- **Address:** a = v/h as in every bench, in units of H. The ray for address a in
  direction φ runs from the eye towards the point at distance aH on the flat plane
  y = g₀. The range is a ∈ [2⁻⁸, 2⁸], 16 octaves, as before.
- **The reading,** f(a): the height of the first thing that ray meets, above g₀, in eye
  heights: f = (y_hit − g₀)/H, clamped to [−1, 1].
  - The bare flat line reads 0.
  - A house in front reads between 0 and 1.
  - Land below g₀ reads negative.
  - A miss (off the island, or further below than one eye height) reads −1.
- **What a ray meets:**
  - every copy, as its finest level of detail (`lod[4]`), with the instance's own
    matrix, both faces;
  - and the ground surface, max(`TR.ground`, `waterAt`), within the island's radius.
  - The ground is found by marching the ray with a step of (height above the surface) /
    (sin δ + 2 cos δ), at most 0.5 m. The 2 is a bound on the terrain's slope; δ is the
    ray's depression. It stops within 10⁻⁴ H of the surface (amended to 10⁻⁷ H, below).
  - The flat area patches (roads, fields) are paint on the ground and are not met.

## Holders, 1,024 leaves each

- **A:** one sweep of 1,024 (DEP-B's).
- **B:** 16 octaves × 64 on §3's map (DEP-B's).
- **F:** 16 octaves × 64 on the flattened map (DEP-F's).

No top, no entry rule: DEP-A found both made things worse.

## Measures

- **Error per octave:** RMS of (presented − reading) over 256 points per octave, even in
  log a (as every bench).
- **A view's error:** the mean over the 16 octaves, divided by the reading's RMS over all
  4,096 points (DEP-A's absolute measure).
- **A jump:** two neighbouring measurement points whose readings differ by more than 0.05.

## Checks of the code (not predictions)

1. **The holders are DEP-F's:** on the self-similar reading (m = 4, φ = 0), F's mean
   relative error is below 2 × 10⁻¹⁴ and B's within 1% of 0.010 (DEP-F's 1.1 × 10⁻¹⁴ and
   0.010).
2. **The reader on known geometry:** a scene with flat ground (size 400) and one box 2 m
   wide, 4 m tall and 2 m deep, standing with its centre 10 m along +x. Viewer at the origin,
   H = 1.7, direction +x.
   - Where the ray meets flat ground (aH < 9 m), the reading must be 0 to 10⁻⁶.
   - Where it meets the front face, it must be 1 − 9/(aH) to 0.02. This is checked only
     where the hit is 0.3 m or more from the face's edges; the studio's box needn't be
     exactly planar.
   - Off the island (aH > 200 m in an empty direction, −x), it must read −1.

If a check fails, no verdict stands.

## Predictions (written before the code and before any reading was seen)

- **S1 (nesting beats one sweep on a real scene):** F's view error is below A's in at
  least 12 of the 16 views.
- **S2 (flattening still helps):** F's view error is below B's in at least 12 of the 16
  views, and the median of F/B over the views is at most 0.7.
- **S3 (no roundoff on real content):** in every view whose reading has at least one
  jump, F's view error is above 10⁻⁴. Edges ring, and nothing about the flattened ends
  removes that.
- **S4 (the edges hold the error):** in at least 12 of the 16 views (those with a jump),
  at least half of F's squared error lies within 8 measurement points (two leaves'
  spacing) of a jump.

## Kills

- **KS1:** F below A in fewer than 12 views.
- **KS2:** F below B in fewer than 12 views, or the median F/B above 0.7.
- **KS3:** a view with a jump where F's error is at or below 10⁻⁴.
- **KS4:** fewer than 12 views with half of F's squared error near a jump.

## Reported, not predicted

- Every view's error for A, B and F, and per octave.
- How many views have jumps, and where along the range the reading has content.
- A and B against each other.

## Files

- `bench/depth/scene.mjs`, `node bench/depth/scene.mjs` (headless Chromium, as `npm
  test`, with `LIBS_DIR` when the CDNs are blocked); output `scene-run.txt`.
- `bench/depth/S-RESULTS.md`, after the run.

## Amendment before any code (6 October 2026)

The ground march stops within **10⁻⁷ H** of the surface, not 10⁻⁴ H. At 10⁻⁴ the reading
itself would carry up to 10⁻⁴ of noise, which is the very size S3 tests for: the noise
would push S3 towards holding. Its smallest step is 10⁻⁹ H. Nothing else changes.
