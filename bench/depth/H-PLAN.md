# DEP-H: a flattened height axis for the studio's parts

*Plan written 6 October 2026, before any code for this one, and committed on its own.
One counted run. Kills recorded, not patched. The owner chose this as the first step
into the studio (of three offered: flattened height axis, leaves by content, walls at
pattern joints).*

## Why

A part's cascade holds its detail on rungs: grids round the part (θ, a closed sweep)
and up it (h, an open sweep). The height kernel ('dct') is a cosine series in u = πh,
with leaves at h_i = (i + ½)/N_h, evenly up the part. That is exactly the bench's
open-axis form without flattening. DEP-F found that flattening, putting the place at
f = sin²(u/2), makes any smooth reading's slope vanish at both ends, and takes the error
at a sweep's ends from dominant to roundoff.

For the studio the flattened axis puts leaf i at **h_i = sin²(π(i + ½)/(2N_h))**:
leaves cluster at the top and bottom, and are about π/2 = 1.57× further apart in the
middle than now. The bench's readings were log-scaled; the studio's detail (bricks,
shingles, bark) is uniform up a wall. So the trade may go either way here. This plan
measures it before any change to the studio.

## The bench

Height profiles of real studio content, each held on N_h leaves by:
- **dct:** the cosine series in u = πh, leaves at h_i = (i + ½)/N_h, as the studio
  now;
- **flat:** the same series in u = 2 asin √h, leaves at h_i = sin²(π(i + ½)/(2N_h)).

The interpolant is the full cosine series through the leaves (the studio's windowed
aperture is left out of both, to compare the axes alone). Leaves take the content's
value at their own height. Error: RMS over 1,024 heights even in h, and separately in
the end bands (h < 0.1 or h > 0.9) and the middle (0.1–0.9).

**Content:**
- **Patterns:** all seven of the studio's (`PATTERNS`: stones, bricks, shingles, planks,
  boards, bark, rough). Each is read with `patternAt` from the page, as a wall 20 m round
  and 3 m tall with a feature size of 0.3 m: the depth d along h, at 32 columns round.
- **Smooth profiles,** with slope at the ends, as a sculpt or bulge gives: sin(2.3h + 0.4)
  + 0.5h², h³ − h, cos(5h), exp(−3h), and tanh(4(h − 0.3)).
- **Leaves:** N_h = 24, 48 and 96. 48 is a 6-leaf base at rung 3.

## Checks of the code (not predictions)

1. Both interpolants reproduce their own leaves to 10⁻¹².
2. **dct** reproduces cos(7πh) to 10⁻¹² (in its basis); **flat** reproduces cos(7 · 2 asin √h)
   to 10⁻¹².
3. `patternAt` returns finite values for every pattern on the grid used.

If a check fails, no verdict stands.

## Predictions (written before the code)

At N_h = 48:
- **H1 (ends, smooth):** on every smooth profile, flat's RMS error in the end bands is at
  most a tenth of dct's.
- **H2 (whole, smooth):** on every smooth profile, flat's whole RMS error is below dct's.
- **H3 (patterns, the cost):** on at least 5 of the 7 patterns, flat's whole RMS error is
  *above* dct's. Uniform detail wants uniform leaves.

## Kills

- **KH1:** a smooth profile where flat's end-band error is above a tenth of dct's.
- **KH2:** a smooth profile where flat's whole error is at or above dct's.
- **KH3:** flat below or equal to dct on 3 or more patterns.

## What happens next, decided now

- **If H3 holds** (flat loses on patterns), the studio's default stays dct, and nothing
  in the studio changes. Patterns are most of what a part's cascade holds in scenes.
  A flat option for sculpted parts would be offered to the owner, not built.
- **If H3 is killed** (flat at least as good on patterns) **and H2 holds**, flat is added
  as a third h-kernel ('flat', beside 'dct' and 'rbf'). It becomes the default for new
  parts, with old files untouched (they carry `eng.hkernel`), and gets steps in
  `tests/editor.mjs`.

## Reported, not predicted

- All three N_h, per content: whole, end-band and middle errors, dct against flat.

## Files

- `bench/depth/height.mjs`, `node bench/depth/height.mjs` (headless Chromium for
  `patternAt`, with `LIBS_DIR` when the CDNs are blocked); output `height-run.txt`.
- `bench/depth/H-RESULTS.md`, after the run.
