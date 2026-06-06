# Draw 30 Checkers (Static Demo)

Date: 2026-06-05
Status: Approved design, pending spec review
Source design: Figma `bbbackgammon` / file key `7or2mH8PehFfpR7d8y2c4N`.
Reference frames: `GameTable` (node `55:930`), `GameTableCheckerStackMoreThan7`
(node `101:4`), `GameTableCheckerHit` (node `68:828`).

## Goal

Render 30 backgammon checkers (15 white + 15 red) on the existing static board,
visually identical to the Figma design, as a **static demo to verify rendering**.
No game rules, no real point numbering, no interaction.

## Scope

In scope:

- Checkers on points: full discs, stacked, with compression + count badge for
  tall stacks.
- Checkers on the Bar: full discs, centered on the bar.
- Borne-off checkers in the bear-off trays: thin horizontal bars (the Figma
  representation), not discs.
- A fixed demo distribution that exercises every area and stack case.
- Pure, unit-tested layout logic plus a thin PixiJS `Graphics` draw layer,
  following the existing `layout.ts` / `drawBoard.ts` split.

Explicitly out of scope:

- Any game state, move validation, real point numbering, networking, or backend.
- Interaction (drag, select, highlight).
- Dice and doubling-cube value/interaction (the cube slot already exists).

## Checker visuals (extracted from Figma SVG)

A checker is a flat disc with a concentric inner ring (no gradient): two stroked
circles, ~20px diameter (SVG viewBox `21.5×21.5`, path radius 10, outer
stroke 1.5, inner ring radius 6 stroke 0.9).

| Player | Fill | Outer stroke (1.5px) | Inner ring (0.9px) |
|---|---|---|---|
| White | `#E0DCD5` | `#9A9490` | `#C2BFBA` |
| Red | `#D42200` | `#8A1200` | `#A81800` |

Count badge (Figma `GameTableCheckerStackMoreThan7`): the total stack count
rendered as bold text centered on the innermost checker. Text color is dark on
white checkers and light on red checkers.

Bear-off tray bars (Figma `SideBoard` vertical containers): borne-off checkers
are horizontal bars, `21×5px`, 1px border, same fill/stroke colors as the discs.
Top tray holds red, bottom tray holds white; bars fill toward the center cube.

Note: the "2" marker seen at the top of `GameTable` is the **doubling cube**, not
a checker badge — it is out of scope here.

## Theme constants (add to `src/theme/theme.ts`)

```ts
export const CHECKER_RADIUS = 10;
export const CHECKER_OUTER_STROKE = 1.5;
export const CHECKER_INNER_RING_RADIUS = 6;
export const CHECKER_INNER_RING_STROKE = 0.9;

export const TRAY_BAR_WIDTH = 21;
export const TRAY_BAR_HEIGHT = 5;
export const TRAY_BAR_STROKE = 1;

// added to COLORS:
// checkerWhite: 0xe0dcd5, checkerWhiteStroke: 0x9a9490, checkerWhiteRing: 0xc2bfba,
// checkerRed:   0xd42200, checkerRedStroke:   0x8a1200, checkerRedRing:   0xa81800,
```

## Pure layout logic (`src/pixi/checkers.ts`)

No PixiJS imports (like `layout.ts`). Consumes the board layout from
`getBoardLayout()`.

Input — a static demo distribution:

```ts
type CheckerColor = 'white' | 'red';

interface CheckerDistribution {
  points: { index: number; color: CheckerColor; count: number }[]; // draw-order index 0..23
  bar: { color: CheckerColor; count: number }[];
  bearOff: { color: CheckerColor; count: number }[];
}
```

Output:

```ts
interface CheckerLayout {
  discs: { x: number; y: number; color: CheckerColor }[];
  badges: { x: number; y: number; count: number; color: CheckerColor }[];
  trayBars: { x: number; y: number; width: number; height: number; color: CheckerColor }[];
}
```

Computation:

- **Point stacks.** Center x = point center. Capacity =
  `floor(POINT_HEIGHT / (2 * CHECKER_RADIUS))` (≈ 5). Top-row points stack from
  the base (top edge) downward toward the tip; bottom-row points stack from the
  base (bottom edge) upward toward the tip. If `count <= capacity`, spacing =
  `2 * CHECKER_RADIUS`. If `count > capacity`, spacing =
  `(POINT_HEIGHT - 2 * CHECKER_RADIUS) / (count - 1)` so all discs stay within
  the point, and a badge is emitted on the innermost disc.
- **Bar stacks.** Center x = `bar.x + bar.width / 2`. Red stacks upward from the
  vertical center, white stacks downward. (Discs may slightly overhang the
  18px bar, as in Figma.)
- **Bear-off bars.** Red → top tray, white → bottom tray. Bars are
  `TRAY_BAR_WIDTH × TRAY_BAR_HEIGHT`, centered in the tray width, stacked toward
  the center doubling-cube slot.

## Demo distribution (exactly 30: 15 white + 15 red)

| Area | White | Red |
|---|---|---|
| Point — full stack of 5 | 5 | – |
| Point — stack of 3 | 3 | – |
| Point — single | 1 | – |
| Point — overflow (compress + badge) | – | 7 |
| Point — stack of 2 | – | 2 |
| The Bar | 1 | 1 |
| Bear-off tray (bottom=white, top=red) | 5 | 5 |
| **Total** | **15** | **15** |

Specific draw-order point indices are chosen at implementation time so the stacks
are visually spread out; the counts above are fixed.

## Draw layer (`src/pixi/drawCheckers.ts`)

A `drawCheckers(stage)` function that calls `getCheckerLayout(DEMO_DISTRIBUTION)`
and renders with one `Graphics`:

- Each disc: outer `circle().fill(color).stroke(outer)`, then inner
  `circle().stroke(ring)`.
- Each badge: a `Text` (bold) centered on its disc, color per player.
- Each tray bar: `rect().fill(color).stroke()`.

Called from `BoardCanvas` immediately after `drawBoard(stage)`.

## Verification

- **Unit tests** (`src/pixi/checkers.test.ts`):
  - Distribution totals 30 (15 white, 15 red).
  - A 5-stack produces no badge; a 7-stack produces one badge and all discs
    stay within the point's vertical bounds.
  - Bar discs are centered on the bar's x-center.
  - `trayBars` count equals the borne-off counts per color.
- **Visual:** run the dev server and compare discs, inner rings, the overflow
  badge, bar checkers, and tray bars against the Figma frames.

## Assumptions

- Static demo only; uses existing draw-order point indices, not real backgammon
  point numbers.
- Checkers reproduced with PixiJS `Graphics` (consistent with the existing
  board), colors taken exactly from the Figma SVG.
