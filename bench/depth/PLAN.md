# DEP-B: depth held by nesting, against one sweep (the bench)

*Plan written 5 October 2026, before any bench code. Committed on its own, before the
run. One run per plan: kills are recorded, not patched; a fix is a new plan with its own
predictions.*

This is the planned test of *Depth as Recursion* §6 (P1–P5 and its kill conditions),
built for the 3d studio's scenes. §6 says it was superseded in detail by
`plans/depth-bridge-plan.md` (DBR), which this bench has not seen; it follows §6 as
written, with the three choices §6 left open made as stated below. Situation 3 only.

## The setting

A reader stands at height h = 1 above a line (the ground). A bar with address a = v/h
meets the line at distance a, so a thing on the ground at distance x is read at address
a = x. The reading held is the perturbation of the line at each address, f(a), from the
unit (the bare line), at g = 1 (fully expressed). This is choice **(a)**: the shape
reading is the perturbation beyond the unit, read along the sweep, as in *Recovering
Depth* §3. It is also the scene's case: things on the ground, near and far.

The range is 16 octaves, a from 2⁻⁸ to 2⁸, the corner (a = 1) in the middle, as in SIT.

## The two holders, at one budget of 1,024 leaves

- **A, one sweep.** One quarter turn, home to the mathematical horizon, with 1,024
  leaves at the odd multiples of π/4096 (the Tangent Bridge lattice on the quarter
  turn), presented continuously.
- **B, nesting** (the first level of R180, as in SIT). The address's octave k
  (2^(k−1) < a ≤ 2^k) is taken at the top, as the exponent. Inside the octave the place
  f runs from the octave's home wall to its horizon wall, proportional in the octave's
  own reading: v/h below the corner, h/v above it (*Depth as Recursion* §3; `nest.py`).
  The place is read as a whole sweep again, ρ = 2f up to the middle and 1/(2(1 − f))
  beyond, and each octave holds its content with its own 64 leaves on that sweep.
  16 octaves × 64 = 1,024.

**Leaves are generated, not looked up**: seeded at the corner (slope 1), halved by
t ↦ t/(1 + √(1 + t²)), stepped by (a + b)/(1 − ab). No angle is computed to place them.
The generated slopes are checked against the tangent once, at 10⁻¹².

**Presentation** is the same for both holders and every sweep: choice **(c)**, the
open-axis (chord) form of TB §15.1, since every sweep here is a quarter turn with two
ends. On a quarter turn the odd lattice θⱼ = (2j + 1)π/(4n) is the Chebyshev node set in
t = 2θ, so the presentation is the cosine (Chebyshev) interpolant through the leaves:
exact at the leaves, bounded between. The trigonometry is used to display, not to place.

**Entry rule**, choice **(b)**: run 1 enters every octave of the range, where one sweep's
grain runs out and everywhere else alike (the rule SIT used). Run 2, for P1 and P2, uses
the second rule, entering where the line is busiest; it is a separate run, below.

## Content

Three readings, written before the code:

1. **Self-similar** (each octave holds the same shape at its own size): f(a) =
   sin(2π·m·log₂ a), m = 4 cycles per octave. The case one sweep cannot keep: its leaves
   thin out per octave away from the corner while the content does not.
2. **Smooth**: f(a) = sin(2π·log₂ a / 16) (one slow swell over all 16 octaves).
3. **Fixed things on the ground**: bumps of one physical width w = 0.05 h at
   x = 2⁻⁶, 2⁻⁵ … 2⁶ (one per octave), height 1. The real landscape case: the same rock
   near and far.

## Measures

- **Error per octave**: RMS of (presented − true) on 256 points per octave, even in
  log a, divided by the content's RMS in that octave (relative error).
- **Wall jump**: |B(wall − ε) − B(wall + ε)|, ε = 10⁻⁹·wall, at each of the 15 inner walls.
- **Amplification** (Lebesgue constant): the largest Σ|cardinal function| over the
  octave's points, per holder, per octave.

## Predictions (written before any code)

- **P3. Doubling the content's scale shifts every address by exactly one octave at the
  top level and leaves the levels below unchanged.** Operationally: with f′(a) = f(a/2),
  B's 64 leaf values of octave k+1 under f′ equal those of octave k under f, to 10⁻¹²,
  *for every pair of octaves on the same side of the corner*. Across the corner (octave 0
  to 1) the place is read the other way (v/h against h/v), and no prediction is made
  there: the difference is recorded.
- **P4. At equal leaves, B's error on the outer octaves is no worse than near the corner;
  A's grows about twofold per octave out.** Operationally, on content 1: B's relative
  error in the 4 outermost octaves (each side) is within 2× of its error in the 2
  octaves at the corner; A's grows by a factor between 1.5 and 3 per octave, measured as
  the median ratio over the octaves where A's error lies between 1% and 50%.
- **P5. B's worst-case amplification grows additively with the number of levels, not
  multiplicatively.** With one level here, operationally: B's amplification in every
  octave is that of a single 64-leaf sweep (within 1%), and does not depend on the octave.
- **P1 and P2** are for run 2.

## Kill conditions

- **K1 (kills P4):** B's error grows with the level: B's outer-octave error more than 2×
  its corner error on content 1.
- **K2 (kills P5):** B's amplification compounds: any octave above 1.01× the single
  64-leaf sweep's.
- **K3 (the walls):** on content 2 (smooth), the presented line jumps at a wall by more
  than the largest per-octave error inside the neighbouring octaves (absolute). That
  makes the nesting unusable as it stands and sends us back to *Depth as Recursion* §5,
  open item 1.

## What is reported but not predicted

- Content 3 (fixed things on the ground) for both holders, per octave: how far out each
  holder still holds a rock of one size. No prediction: the octave nesting gives every
  octave the same leaves *relative to the octave*, and a rock of fixed size shrinks
  against its octave as it recedes, so both may lose it; the question is where.
- The P3 difference across the corner.

## Run 2: the busiest-stretch rule (P1, P2)

- **Holder.** A top sweep of 256 leaves over the whole range, presented. Then, octave by
  octave, the residual (true − top's presentation) is measured. Children of 64 leaves
  are entered where it is largest, one at a time, until the budget of 1,024 is used. A
  child holds its octave's residual on its own sweep (choice (c)), added to the top's
  presentation. A child may itself enter a grandchild, at the octave of its own sweep
  (in ρ) where its residual is largest, by the same rule.
- **Content 4**: f(a) = smooth swell (content 2) plus a burst of fine detail
  (8 cycles per octave) only in octaves 3 and −5.
- **P1.** Smooth perturbations are held almost entirely at the top level: on content 2
  alone, the top sweep's error is below 1% everywhere, and the rule enters no child
  whose residual is above 1%.
- **P2.** Fine detail lands at deeper levels: on content 4, the octaves holding the burst
  (3 and −5) are entered first and reach the deepest level; no octave without the burst
  reaches a deeper level than either burst octave.
- **P5 (run 2, additive).** Along any path, the worst-case amplification of top + child
  (+ grandchild) is the sum of the levels' own (each measured alone), within 2%, not
  their product.
- **Kill:** an octave without the burst entered deeper than a burst octave (kills P2); a
  child entered on content 2 with residual above 1% (kills P1); amplification along a
  path above 1.02× the sum (kills run 2's P5).

## Files

- `bench/depth/bench.mjs`: both runs, no dependencies, `node bench/depth/bench.mjs`.
- `bench/depth/RESULTS.md`: written after the single run, verdicts against the above.
