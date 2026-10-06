# DEP-R: exact fits, and leaves where the seams are

*Plan written 6 October 2026, after DEP-Q's run and before any code for this one, and
committed on its own. One counted run. Kills recorded, not patched.*

## Why, and what changed from the idea DEP-Q proposed

DEP-Q ended with a working hypothesis: every seamless holder (K, N, N_s, N_ψ) fit each
node over a span reaching past its region, and so imported the neighbour's content into
its fit. C′ fits each node on its own region only, and is the accurate one (median 2.9 ×
10⁻⁴) but has seams of up to 0.16. DEP-Q proposed: fit as C′, and only *present* each
node a little past its walls by its own continuation, blended there.

**Worked out before writing this plan, that idea can't do what it was for.**
- A node is a cosine series in its sweep's angle u. Past the sweep's end its natural
  continuation has u imaginary, where cos(mu) becomes cosh(my).
- With 64 terms it stays bounded only while 63y ≲ 1: about 6 × 10⁻⁵ of the node's place,
  roughly 10⁻⁴ of an octave.
- A blend that narrow is continuous, but a 0.16 step squeezed into 10⁻⁴ of an octave is
  still a seam to the eye. And it would fall between the measurement points (1/256
  octave apart), so the error measure couldn't see it: such a run would hold by
  construction and show nothing.
- Any wider blend must use something other than the node's exact fit there, which is
  what K and N did.

**So the seam is the mismatch itself.** C′'s steps come from where a node meets a region
held more coarsely: an entered node beside the 8-leaf base alone, say. They can be made
small only by holding both sides of the wall well. This plan keeps C′'s exact fits and
attacks the mismatch, by letting the rule that places leaves see the seams.

## The holder C″

C″ is C′ (DEP-C's C with DEP-K's fixed scoring grid) with one change to the rule:
- **The score:** a candidate region's score is its squared residual over the scoring
  grid (as C′) **plus 8 × the sum of the squared steps the present holder makes at that
  region's two walls**. A step is |P(w(1 − 10⁻⁹)) − P(w(1 + 10⁻⁹))|.
- **Why 8:** a step counts as if it were an error persisting over eight scoring points,
  two leaves' spacing: DEP-S's window for an edge.
- Entering a node on that region fits the residual there exactly, up to the wall, so the
  step drops to the difference of two good fits.

Everything else is C′'s: base 8, 14 nodes of 64, exact regions, no blending, fits in
order. C″ is not continuous; it aims to make its steps small.

## The run

DEP-S's 16 views. A, B, F and C′ are recomputed (as before) and C″ is added.

## Measures

- **View error:** as every bench.
- **Seams:** for C′ and C″, the largest step at the walls of their entered nodes, and the
  reading's own step there (|f(w(1 − 10⁻⁹)) − f(w(1 + 10⁻⁹))|, read in the page).

## Checks of the code (not predictions)

1. **With the seam term set to 0,** C″'s nodes on the first view are exactly C′'s, in
   order. The code adds a term and changes nothing else.
2. **A step is measured as defined:** on a holder made of one node [3] fit to a reading of
   1 inside octave 3 and 0 elsewhere, the step at 2³ is 1 to 10⁻¹².
3. **A, B and F on the first view** are DEP-S's as printed.

If a check fails, no verdict stands.

## Predictions (written before the code)

- **R1 (smaller seams):** C″'s largest step is at most a quarter of C′'s in at least 12
  of the 16 views.
- **R2 (accuracy kept):** C″'s view error is at most 1.5× C′'s in at least 12 of the 16
  views.
- **R3 (still the best):** C″ is below the lowest of A, B and F in all 16 views.

## Kills

- **KR1:** C″'s largest step above a quarter of C′'s in five views or more.
- **KR2:** C″'s view error above 1.5× C′'s in five views or more.
- **KR3:** a view where C″ is not below the best of A, B and F.

## Reported, not predicted

- Each view's errors for A, B, F, C′ and C″, and the largest steps for C′ and C″ against
  the reading's own steps at the same walls.
- C″'s nodes in order.

## Files

- `bench/depth/seams.mjs`, `node bench/depth/seams.mjs` (as DEP-S, with `LIBS_DIR` when the
  CDNs are blocked); output `seams-run.txt`.
- `bench/depth/R-RESULTS.md`, after the run.
