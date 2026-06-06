# Draw 30 Checkers (Static Demo) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render 30 backgammon checkers (15 white + 15 red) on the existing static board — on points (with stacking, compression, and a count badge), on the Bar, and in the bear-off trays (as horizontal bars) — visually identical to the Figma design.

**Architecture:** Follow the existing pure-geometry / draw-layer split. A pure, unit-tested module (`pixi/checkers.ts`) turns a checker distribution into disc/badge/tray-bar positions. A thin draw layer (`pixi/drawCheckers.ts`) renders them with PixiJS `Graphics` + `Text`, called from `BoardCanvas` right after `drawBoard`. Figma colors/dimensions live in `theme/theme.ts`.

**Tech Stack:** React 19, Vite, TypeScript, PixiJS v8, Vitest, pnpm.

---

## Reference values (from Figma SVG / spec)

- Checker disc: radius 10 (~20px), outer stroke 1.5px, inner ring radius 6 stroke 0.9px.
- White: fill `#E0DCD5`, outer stroke `#9A9490`, inner ring `#C2BFBA`.
- Red: fill `#D42200`, outer stroke `#8A1200`, inner ring `#A81800`.
- Tray bar: `21×5px`, 1px border, same fill/stroke colors as discs.
- Badge text: bold, 10px, centered on the innermost disc; black on white, white on red.
- Derived: `POINT_HEIGHT = 308 * 0.37 = 113.96`, `DIAMETER = 20`, point capacity = `floor(113.96 / 20) = 5`. Stacks of 6+ compress and get a badge.

Point draw-order indices (from `buildPoints` in `layout.ts`): top-left `0–5`, top-right `6–11`, bottom-left `12–17`, bottom-right `18–23`.

## File Structure

- Modify: `src/theme/theme.ts` — add checker + tray-bar constants and colors.
- Create: `src/pixi/checkers.ts` — pure checker layout logic + `DEMO_DISTRIBUTION`.
- Create: `src/pixi/checkers.test.ts` — unit tests for the layout logic.
- Create: `src/pixi/drawCheckers.ts` — PixiJS draw layer (visual; not unit-tested).
- Modify: `src/pixi/BoardCanvas.tsx` — call `drawCheckers` after `drawBoard`.

---

### Task 1: Theme constants (Figma checker values)

**Files:**
- Modify: `src/theme/theme.ts`

- [ ] **Step 1: Add checker + tray-bar dimension constants**

Insert after the `CUBE_SIZE` line (after line 38), before the `// Palette` comment:

```ts
// Checkers (from Figma checker SVG).
export const CHECKER_RADIUS = 10;
export const CHECKER_OUTER_STROKE = 1.5;
export const CHECKER_INNER_RING_RADIUS = 6;
export const CHECKER_INNER_RING_STROKE = 0.9;

// Bear-off tray bars (borne-off checkers render as thin horizontal bars).
export const TRAY_BAR_WIDTH = 21;
export const TRAY_BAR_HEIGHT = 5;
export const TRAY_BAR_STROKE = 1;
```

- [ ] **Step 2: Add checker colors to the `COLORS` palette**

In the `COLORS` object, add these entries after `cubeSlotStroke: 0x7b4820,`:

```ts
  checkerWhite: 0xe0dcd5,
  checkerWhiteStroke: 0x9a9490,
  checkerWhiteRing: 0xc2bfba,
  checkerRed: 0xd42200,
  checkerRedStroke: 0x8a1200,
  checkerRedRing: 0xa81800,
```

- [ ] **Step 3: Verify it compiles**

Run: `pnpm exec tsc -b`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/theme/theme.ts
git commit -m "feat: add checker theme constants and colors"
```

---

### Task 2: Pure checker layout logic

**Files:**
- Create: `src/pixi/checkers.ts`
- Test: `src/pixi/checkers.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/pixi/checkers.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getBoardLayout } from './layout';
import { getCheckerLayout, DEMO_DISTRIBUTION } from './checkers';
import { CHECKER_RADIUS } from '../theme/theme';

function total(color: 'white' | 'red'): number {
  const d = DEMO_DISTRIBUTION;
  const sum = (arr: { color: 'white' | 'red'; count: number }[]) =>
    arr.filter((x) => x.color === color).reduce((n, x) => n + x.count, 0);
  return sum(d.points) + sum(d.bar) + sum(d.bearOff);
}

describe('DEMO_DISTRIBUTION', () => {
  it('has 15 white and 15 red checkers', () => {
    expect(total('white')).toBe(15);
    expect(total('red')).toBe(15);
  });

  it('produces 30 checkers total across discs and tray bars', () => {
    const { discs, trayBars } = getCheckerLayout(DEMO_DISTRIBUTION);
    expect(discs.length + trayBars.length).toBe(30);
  });
});

describe('getCheckerLayout', () => {
  it('shows a badge only for stacks taller than the point capacity', () => {
    const { badges } = getCheckerLayout(DEMO_DISTRIBUTION);
    expect(badges.length).toBe(1);
    expect(badges[0].count).toBe(7);
    expect(badges[0].color).toBe('red');
  });

  it('keeps a compressed 7-stack within its point bounds', () => {
    const layout = getBoardLayout();
    const point = layout.points[19]; // the red 7-stack (bottom-right)
    const centerX = point.polygon[4];
    const baseY = point.polygon[1];
    const tipY = point.polygon[5];
    const lo = Math.min(baseY, tipY);
    const hi = Math.max(baseY, tipY);
    const mid = layout.surface.y + layout.surface.height / 2;

    const { discs } = getCheckerLayout(DEMO_DISTRIBUTION);
    const stackDiscs = discs.filter(
      (d) => Math.abs(d.x - centerX) < 1e-6 && d.y > mid,
    );
    expect(stackDiscs.length).toBe(7);
    for (const d of stackDiscs) {
      expect(d.y - CHECKER_RADIUS).toBeGreaterThanOrEqual(lo - 1e-6);
      expect(d.y + CHECKER_RADIUS).toBeLessThanOrEqual(hi + 1e-6);
    }
  });

  it('centers bar checkers on the bar', () => {
    const layout = getBoardLayout();
    const barCenterX = layout.bar.x + layout.bar.width / 2;
    const { discs } = getCheckerLayout(DEMO_DISTRIBUTION);
    const barDiscs = discs.filter((d) => Math.abs(d.x - barCenterX) < 1e-6);
    expect(barDiscs.length).toBe(2);
  });

  it('emits one tray bar per borne-off checker', () => {
    const { trayBars } = getCheckerLayout(DEMO_DISTRIBUTION);
    expect(trayBars.filter((b) => b.color === 'red').length).toBe(5);
    expect(trayBars.filter((b) => b.color === 'white').length).toBe(5);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/pixi/checkers.test.ts`
Expected: FAIL — cannot resolve `./checkers` (module does not exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/pixi/checkers.ts`:

```ts
import {
  CHECKER_RADIUS,
  POINT_HEIGHT,
  TRAY_BAR_WIDTH,
  TRAY_BAR_HEIGHT,
} from '../theme/theme';
import { getBoardLayout } from './layout';

export type CheckerColor = 'white' | 'red';

export interface CheckerDistribution {
  points: { index: number; color: CheckerColor; count: number }[];
  bar: { color: CheckerColor; count: number }[];
  bearOff: { color: CheckerColor; count: number }[];
}

export interface Disc {
  x: number;
  y: number;
  color: CheckerColor;
}

export interface Badge {
  x: number;
  y: number;
  count: number;
  color: CheckerColor;
}

export interface TrayBar {
  x: number;
  y: number;
  width: number;
  height: number;
  color: CheckerColor;
}

export interface CheckerLayout {
  discs: Disc[];
  badges: Badge[];
  trayBars: TrayBar[];
}

// Static demo: 15 white + 15 red, covering every area and stack case.
export const DEMO_DISTRIBUTION: CheckerDistribution = {
  points: [
    { index: 0, color: 'white', count: 5 },
    { index: 14, color: 'white', count: 3 },
    { index: 9, color: 'white', count: 1 },
    { index: 19, color: 'red', count: 7 },
    { index: 7, color: 'red', count: 2 },
  ],
  bar: [
    { color: 'red', count: 1 },
    { color: 'white', count: 1 },
  ],
  bearOff: [
    { color: 'red', count: 5 },
    { color: 'white', count: 5 },
  ],
};

const DIAMETER = CHECKER_RADIUS * 2;
const POINT_CAPACITY = Math.floor(POINT_HEIGHT / DIAMETER);

export function getCheckerLayout(
  distribution: CheckerDistribution,
): CheckerLayout {
  const layout = getBoardLayout();
  const discs: Disc[] = [];
  const badges: Badge[] = [];
  const trayBars: TrayBar[] = [];

  // Points: stack from the base toward the tip; compress + badge when tall.
  for (const stack of distribution.points) {
    const point = layout.points[stack.index];
    const centerX = point.polygon[4];
    const baseY = point.polygon[1];
    const tipY = point.polygon[5];
    const dir = tipY > baseY ? 1 : -1; // top row stacks down, bottom row up
    const spacing =
      stack.count <= POINT_CAPACITY
        ? DIAMETER
        : (POINT_HEIGHT - DIAMETER) / (stack.count - 1);

    let lastY = baseY;
    for (let i = 0; i < stack.count; i++) {
      lastY = baseY + dir * (CHECKER_RADIUS + i * spacing);
      discs.push({ x: centerX, y: lastY, color: stack.color });
    }
    if (stack.count > POINT_CAPACITY) {
      badges.push({
        x: centerX,
        y: lastY,
        count: stack.count,
        color: stack.color,
      });
    }
  }

  // The Bar: discs centered on the bar; red stacks up, white stacks down.
  const barCenterX = layout.bar.x + layout.bar.width / 2;
  const barCenterY = layout.bar.y + layout.bar.height / 2;
  for (const stack of distribution.bar) {
    const dir = stack.color === 'red' ? -1 : 1;
    for (let i = 0; i < stack.count; i++) {
      discs.push({
        x: barCenterX,
        y: barCenterY + dir * (CHECKER_RADIUS + i * DIAMETER),
        color: stack.color,
      });
    }
  }

  // Bear-off trays: horizontal bars filling toward the center cube.
  const barX = layout.topTray.x + (layout.topTray.width - TRAY_BAR_WIDTH) / 2;
  for (const stack of distribution.bearOff) {
    const tray = stack.color === 'red' ? layout.topTray : layout.bottomTray;
    for (let i = 0; i < stack.count; i++) {
      const y =
        stack.color === 'red'
          ? tray.y + tray.height - (i + 1) * TRAY_BAR_HEIGHT
          : tray.y + i * TRAY_BAR_HEIGHT;
      trayBars.push({
        x: barX,
        y,
        width: TRAY_BAR_WIDTH,
        height: TRAY_BAR_HEIGHT,
        color: stack.color,
      });
    }
  }

  return { discs, badges, trayBars };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run src/pixi/checkers.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pixi/checkers.ts src/pixi/checkers.test.ts
git commit -m "feat: add pure checker layout logic with demo distribution"
```

---

### Task 3: Draw layer + board integration

**Files:**
- Create: `src/pixi/drawCheckers.ts`
- Modify: `src/pixi/BoardCanvas.tsx`

This task is visual (no unit test); verification is a successful build plus a visual check in the dev server.

- [ ] **Step 1: Create the draw layer**

Create `src/pixi/drawCheckers.ts`:

```ts
import { Container, Graphics, Text } from 'pixi.js';
import { getCheckerLayout, DEMO_DISTRIBUTION } from './checkers';
import type { CheckerColor } from './checkers';
import {
  COLORS,
  CHECKER_RADIUS,
  CHECKER_OUTER_STROKE,
  CHECKER_INNER_RING_RADIUS,
  CHECKER_INNER_RING_STROKE,
  TRAY_BAR_STROKE,
} from '../theme/theme';

const FILL: Record<CheckerColor, number> = {
  white: COLORS.checkerWhite,
  red: COLORS.checkerRed,
};
const OUTER: Record<CheckerColor, number> = {
  white: COLORS.checkerWhiteStroke,
  red: COLORS.checkerRedStroke,
};
const RING: Record<CheckerColor, number> = {
  white: COLORS.checkerWhiteRing,
  red: COLORS.checkerRedRing,
};
const BADGE_TEXT: Record<CheckerColor, number> = {
  white: 0x000000,
  red: 0xffffff,
};

export function drawCheckers(stage: Container): void {
  const layout = getCheckerLayout(DEMO_DISTRIBUTION);
  const g = new Graphics();

  // Bear-off bars (drawn first so discs sit above if anything overlaps).
  for (const bar of layout.trayBars) {
    g.rect(bar.x, bar.y, bar.width, bar.height)
      .fill(FILL[bar.color])
      .stroke({ width: TRAY_BAR_STROKE, color: OUTER[bar.color] });
  }

  // Discs: outer filled circle + concentric inner ring.
  for (const disc of layout.discs) {
    g.circle(disc.x, disc.y, CHECKER_RADIUS)
      .fill(FILL[disc.color])
      .stroke({ width: CHECKER_OUTER_STROKE, color: OUTER[disc.color] });
    g.circle(disc.x, disc.y, CHECKER_INNER_RING_RADIUS).stroke({
      width: CHECKER_INNER_RING_STROKE,
      color: RING[disc.color],
    });
  }

  stage.addChild(g);

  // Count badges on the innermost disc of compressed stacks.
  for (const badge of layout.badges) {
    const text = new Text({
      text: String(badge.count),
      style: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 10,
        fontWeight: '800',
        fill: BADGE_TEXT[badge.color],
      },
    });
    text.anchor.set(0.5);
    text.position.set(badge.x, badge.y);
    stage.addChild(text);
  }
}
```

- [ ] **Step 2: Call `drawCheckers` from `BoardCanvas`**

In `src/pixi/BoardCanvas.tsx`, add the import after the `drawBoard` import (line 4):

```ts
import { drawCheckers } from './drawCheckers';
```

Then, immediately after the `drawBoard(app.stage);` line (line 52), add:

```ts
      drawCheckers(app.stage);
```

- [ ] **Step 3: Verify the build and tests pass**

Run: `pnpm build`
Expected: `tsc -b` reports no errors and `vite build` completes.

Run: `pnpm test`
Expected: PASS (the 5 checker tests).

- [ ] **Step 4: Visual check**

Run: `pnpm dev`, open the local URL. Confirm against the Figma frames:
- White discs (5-stack, 3-stack, single) and red discs (2-stack) with the cream/red fill and concentric inner ring.
- The red 7-stack is compressed within its point and shows a white "7" badge on its innermost checker.
- One red + one white disc centered on the Bar.
- Five red horizontal bars in the top tray and five white bars in the bottom tray, filling toward the center cube slot.

- [ ] **Step 5: Commit**

```bash
git add src/pixi/drawCheckers.ts src/pixi/BoardCanvas.tsx
git commit -m "feat: draw checkers on the board (points, bar, bear-off)"
```

---

## Self-Review

- **Spec coverage:** disc visuals (Task 1 colors + Task 3 two-circle draw), point stacking/compression/badge (Task 2 + Task 3), bar checkers (Task 2 + Task 3), bear-off tray bars (Task 2 + Task 3), demo distribution 15/15 (Task 2), unit tests (Task 2), visual verification (Task 3). All spec sections covered.
- **Type consistency:** `CheckerColor`, `CheckerDistribution`, `Disc`, `Badge`, `TrayBar`, `CheckerLayout`, `getCheckerLayout`, `DEMO_DISTRIBUTION` are defined in Task 2 and used identically in the Task 2 test and Task 3 draw layer.
- **Placeholders:** none — every code and command step is complete.
