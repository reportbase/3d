# DEP-S results: the counted run (6 October 2026)

`LIBS_DIR=… node bench/depth/scene.mjs`, 88 s; output in `scene-run.txt`. Plan:
`S-PLAN.md`, committed before the code and before any reading was seen, with one
amendment made before any code (the ground march's stop). Code committed before its run.
Nothing below changes a prediction or a threshold.

All checks of the code passed:
- the holders match DEP-F's (F 1.1 × 10⁻¹⁴, B 0.01000);
- the reader on a known box: flat ground 10⁻⁷, the front face within 3.8 × 10⁻⁶ of
  1 − 9/(aH), off the island −1.

The viewer stood on the high street at (6, −25), on ground 9.24 m up.

## Verdicts

| | prediction | result |
|---|---|---|
| **S1** | F below one sweep (A) in at least 12 of 16 views | **KILLED**: 8 of 16 |
| **S2** | F below §3's nesting (B) in at least 12 views, median F/B ≤ 0.7 | **KILLED**: 8 of 16, median F/B 1.03 |
| **S3** | wherever there's a jump, F's error above 10⁻⁴ | **holds**: all 10 views with a jump, F at 4.4 × 10⁻⁴ … 0.016 |
| **S4** | in at least 12 views, half of F's squared error near a jump | **KILLED as written**: only 10 views had a jump at all. In every one of those 10 it held, at 88–99% |

S4's kill is a plan fault: it counted on at least 12 of the 16 views having a jump, and
six walking views had none. The verdict stands as killed. What it measured held without
exception.

## The views

| H | direction | A | B | F | jumps | best |
|---|---|---|---|---|---|---|
| 1.7 m | 0° | 6.8e-6 | 4.0e-5 | 2.0e-5 | 0 | A |
| | 45° | 1.5e-5 | 6.4e-5 | 2.5e-5 | 0 | A |
| | 90° | 5.8e-4 | 5.3e-4 | 5.9e-4 | 1 | B |
| | 135° | 2.2e-5 | 1.1e-4 | 7.5e-5 | 0 | A |
| | 180° | 7.4e-6 | 3.3e-5 | 1.5e-5 | 0 | A |
| | 225° | 4.8e-6 | 3.9e-5 | 1.1e-5 | 0 | A |
| | 270° | 6.2e-6 | 3.1e-5 | **8.5e-9** | 0 | F |
| | 315° | 6.9e-4 | 3.7e-4 | 4.4e-4 | 1 | B |
| 30 m | 0° | 8.7e-3 | 5.2e-3 | 4.5e-3 | 3 | F |
| | 45° | 8.9e-3 | 6.2e-3 | 6.9e-3 | 5 | B |
| | 90° | 5.6e-3 | 9.2e-3 | 0.011 | 5 | A |
| | 135° | 8.4e-3 | 6.7e-3 | 9.1e-3 | 4 | B |
| | 180° | 0.014 | 8.5e-3 | 0.010 | 6 | B |
| | 225° | 0.034 | 0.014 | 0.016 | 4 | B |
| | 270° | 0.012 | 8.4e-3 | 9.2e-3 | 4 | B |
| | 315° | 0.019 | 9.2e-3 | 8.8e-3 | 4 | F |

Medians: A 3.1 × 10⁻³, B 2.9 × 10⁻³, F 2.5 × 10⁻³. F is never far from the best, and
never clearly the best.

## What it shows

**1. On a real scene the edges decide, and no place map helps with them.** Wherever the
reading jumps (a wall in front of the street, a roof against the sea), 88–99% of F's
error sits within two leaves of the jump. All three holders end up within a factor of
about 2 of each other, at 0.5–3% of the reading: a jump rings in any of them. The
flattened map removes the kink at a sweep's ends, which was the whole of the error on
DEP-F's smooth readings. It does nothing about a jump inside the sweep, and real depth
is full of them.

**2. Equal leaves per octave are wasted where a scene is empty.** The content in these
views lies in about five to nine octaves around the corner:
- walking, octaves −1 to 7 (1.7 m to 200 m);
- flying, octaves −2 to 5.

Beyond them the reading is constant (open ground, or −1 off the island). Nesting gives
each of the 16 octaves 64 leaves whether it holds anything or not. The one sweep puts
most of its 1,024 near the corner, which is where this scene's content is. So for a
walker, A beat F in five of the six smooth views. That is DEP-B's trade again: one sweep
spends its leaves on the middle distance, and nesting spends them evenly. Here the
middle distance is the scene.

**3. Smooth views aren't at roundoff either.** The six walking views without a jump
still have errors of 10⁻⁵, except one (270°, F at 8.5 × 10⁻⁹). Their readings must have
small kinks or steps below the jump threshold of 0.05: shore lines, where the water
meets the land at an angle; the stream's banks; grazing hits on low objects. This
wasn't checked.

**4. Nesting's real advantage is range,** and this scene doesn't need it. DEP-B showed
one sweep lost about six octaves out, and this village never reaches that far from the
corner. A scene with near detail and far detail together (a hand at 0.3 m, mountains at
5 km) would.

## What it means for the framework

- **Depth as recursion holds where it was claimed:** many octaves held at even quality
  (DEP-B). And the flattened map is the better nesting on smooth content (DEP-F). But
  neither is what decides a real scene.
- **What decides a real scene is where the edges are.** The leaves should go where the
  content is, edges first, not evenly over octaves or concentrated by geometry. That's
  adaptivity by content.
  - DEP-A tried it from a top sweep, and the top got in the way.
  - Done below the octaves, so that an empty octave keeps a few leaves and an octave
    with an edge gets more, it hasn't been tried yet.
- **An honest summary for the papers:** on real depth, the octave structure is a sound
  scaffold, but the precision results don't transfer, because real depth isn't smooth.
  Of today's results, these do transfer: the structure (P3), the absence of compounding
  (P5), and the even error across octaves.

## Next, as new plans

1. **Leaves by content, inside the octave scaffold:** octaves with nothing in them keep
   a small base (say 8 leaves), and the rest of the 1,024 go, in ρ-octave grandchildren,
   where the absolute residual is largest. Same 16 views. Prediction to set: it beats A,
   B and F in most views, with the gain at the edges.
2. **A wider scene** (near detail and far mountains together), where range matters. The
   test of whether nesting's advantage shows up on real content at all.
3. **Edges handled as edges:** a presentation that places a break at a jump instead of
   ringing across it. This is outside the cosine form the framework uses now, so it
   would be a question for the theory.
