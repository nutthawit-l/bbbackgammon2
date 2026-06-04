# Static Backgammon Board Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a responsive, Figma-faithful empty backgammon board (frame, surface, 24 alternating points, the Bar, and a right-side bear-off with a doubling-cube slot) in PixiJS v8, on the blue table.

**Architecture:** A single Vite + React app. All board positions are computed as pure functions in a fixed `393×852` logical coordinate space (`pixi/layout.ts`), unit-tested with Vitest. A thin draw layer (`pixi/drawBoard.ts`) renders the layout with PixiJS `Graphics`. A `BoardCanvas` React component owns one PixiJS `Application` via `useRef`, and applies fit-to-screen scaling (floored at the Figma size) by resizing the renderer and setting `stage.scale`.

**Tech Stack:** React 18, Vite, TypeScript, PixiJS v8, Vitest, pnpm.

---

## Scope Check

This spec is a single, self-contained subsystem (static frontend board) plus its Cloudflare deployment. No decomposition needed. Backend Worker logic, networking, game state, checkers, dice, and screen chrome are explicitly out of scope (later steps). The Step 1 Worker is assets-only — no `main` script — so it ships zero backend logic while still deploying to Cloudflare per the prompt's "deploy each step" rule.

## File Structure

- `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html` — project config.
- `wrangler.jsonc` — Cloudflare Workers Static Assets config (assets-only).
- `.github/workflows/deploy.yml` — build, test, deploy-on-push to Cloudflare.
- `src/main.tsx` — React entry.
- `src/index.css` — blue gradient table background + responsive scroll floor.
- `src/App.tsx` — mounts `BoardCanvas`.
- `src/core/constants.ts` — semantic domain constants (no magic numbers). **Test:** `src/core/constants.test.ts`.
- `src/theme/theme.ts` — colors, dimensions, ratios from Figma. **Test:** `src/theme/theme.test.ts`.
- `src/pixi/layout.ts` — pure geometry: `computeScale` + `getBoardLayout`. **Test:** `src/pixi/layout.test.ts`.
- `src/pixi/drawBoard.ts` — draws a `BoardLayout` into a Pixi `Container` (visual; not unit-tested).
- `src/pixi/BoardCanvas.tsx` — PixiJS `Application` lifecycle + responsive scaling (visual; not unit-tested).

`core/` and `theme/` are isolated to lift cleanly into `packages/core` later.

---

### Task 1: Project scaffolding

**Files:**

- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "bbbackgammon",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 2: Install dependencies (resolves real latest versions)**

Run:

```bash
pnpm add react react-dom pixi.js
pnpm add -D vite @vitejs/plugin-react typescript @types/react @types/react-dom vitest
```

Expected: dependencies added to `package.json`, `pnpm-lock.yaml` created, no errors.

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "esnext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 6: Create `vite-env.d.ts`**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 7: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>bbbackgammon</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 9: Create a temporary `src/App.tsx` placeholder**

```tsx
export function App() {
  return <div>bbbackgammon</div>;
}
```

- [ ] **Step 10: Create a minimal `src/index.css` placeholder**

```css
* {
  box-sizing: border-box;
}
html,
body {
  margin: 0;
  padding: 0;
}
```

- [ ] **Step 11: Create `.gitignore`**

```gitignore
node_modules/
dist/
.wrangler/
*.local
.DS_Store
```

- [ ] **Step 12: Verify the app boots**

Run: `pnpm build`
Expected: TypeScript compiles and Vite build succeeds with no errors.

- [ ] **Step 13: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Vite + React + PixiJS + Vitest project"
```

---

### Task 2: Domain constants

**Files:**

- Create: `src/core/constants.ts`
- Test: `src/core/constants.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import {
  QUADRANTS,
  POINTS_PER_QUADRANT,
  TOTAL_POINTS,
  CHECKERS_PER_PLAYER,
  DIE_SIDES,
  DICE_PER_ROLL,
} from './constants';

describe('domain constants', () => {
  it('derives total points from quadrants', () => {
    expect(TOTAL_POINTS).toBe(QUADRANTS * POINTS_PER_QUADRANT);
    expect(TOTAL_POINTS).toBe(24);
  });

  it('uses standard backgammon values', () => {
    expect(POINTS_PER_QUADRANT).toBe(6);
    expect(CHECKERS_PER_PLAYER).toBe(15);
    expect(DIE_SIDES).toBe(6);
    expect(DICE_PER_ROLL).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/core/constants.test.ts`
Expected: FAIL — cannot resolve `./constants`.

- [ ] **Step 3: Write the implementation**

```ts
export const QUADRANTS = 4;
export const POINTS_PER_QUADRANT = 6;
export const TOTAL_POINTS = QUADRANTS * POINTS_PER_QUADRANT;

export const CHECKERS_PER_PLAYER = 15;
export const DIE_SIDES = 6;
export const DICE_PER_ROLL = 2;

export const PLAYER_COLORS = {
  WHITE: 'white',
  RED: 'red',
} as const;

export type PlayerColor = (typeof PLAYER_COLORS)[keyof typeof PLAYER_COLORS];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/core/constants.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/core/constants.ts src/core/constants.test.ts
git commit -m "feat: add semantic domain constants"
```

---

### Task 3: Theme (Figma values)

**Files:**

- Create: `src/theme/theme.ts`
- Test: `src/theme/theme.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import {
  DESIGN_WIDTH,
  DESIGN_HEIGHT,
  GAME_BOARD_WIDTH,
  GAME_BOARD_HEIGHT,
  GAME_BOARD_X,
  GAME_BOARD_Y,
  SURFACE_WIDTH,
  BAR_WIDTH,
  POINT_WIDTH,
  SIDEBOARD_PADDING_Y,
  SIDEBOARD_GAP,
  TRAY_HEIGHT,
  CUBE_SIZE,
} from './theme';
import { POINTS_PER_QUADRANT } from '../core/constants';

describe('theme layout values', () => {
  it('centers the board within the design stage', () => {
    expect(GAME_BOARD_X).toBe((DESIGN_WIDTH - GAME_BOARD_WIDTH) / 2);
    expect(GAME_BOARD_Y).toBe((DESIGN_HEIGHT - GAME_BOARD_HEIGHT) / 2);
  });

  it('derives point width from surface minus bar', () => {
    expect(POINT_WIDTH).toBeCloseTo(
      (SURFACE_WIDTH - BAR_WIDTH) / (POINTS_PER_QUADRANT * 2),
      5,
    );
  });

  it('fills the side board height with trays + cube + gaps', () => {
    const total =
      SIDEBOARD_PADDING_Y * 2 + TRAY_HEIGHT * 2 + SIDEBOARD_GAP * 2 + CUBE_SIZE;
    expect(total).toBe(GAME_BOARD_HEIGHT);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/theme/theme.test.ts`
Expected: FAIL — cannot resolve `./theme`.

- [ ] **Step 3: Write the implementation**

```ts
import { POINTS_PER_QUADRANT } from '../core/constants';

// Responsive design stage (the Figma frame), logical px.
export const DESIGN_WIDTH = 393;
export const DESIGN_HEIGHT = 852;
export const MIN_SCALE = 1;

// Board block (GameBoard) within the stage.
export const GAME_BOARD_WIDTH = 389;
export const GAME_BOARD_HEIGHT = 328;
export const GAME_BOARD_X = (DESIGN_WIDTH - GAME_BOARD_WIDTH) / 2;
export const GAME_BOARD_Y = (DESIGN_HEIGHT - GAME_BOARD_HEIGHT) / 2;

// Frame and playing surface.
export const FRAME_RADIUS = 5;
export const BORDER_PADDING = 10;
export const SURFACE_WIDTH = 350;
export const SURFACE_HEIGHT = 308;

// The Bar (central divider).
export const BAR_WIDTH = 18;

// Points (derived from surface and bar; no magic numbers).
export const POINT_WIDTH =
  (SURFACE_WIDTH - BAR_WIDTH) / (POINTS_PER_QUADRANT * 2);
export const POINT_HEIGHT_RATIO = 0.37;
export const POINT_HEIGHT = SURFACE_HEIGHT * POINT_HEIGHT_RATIO;

// Bear-off side board.
export const SIDEBOARD_WIDTH = 29;
export const SIDEBOARD_PADDING_X = 4;
export const SIDEBOARD_PADDING_Y = 10;
export const SIDEBOARD_GAP = 10;
export const TRAY_HEIGHT = 134;
export const CUBE_SIZE = 20;

// Palette (sampled from the Figma export).
export const COLORS = {
  tableTop: 0x3d6db5,
  tableBottom: 0x2d5a9f,
  frame: 0x5e3014,
  surface: 0xc8924a,
  bar: 0x7b4820,
  pointDark: 0x3d1a00,
  pointRust: 0x8b2200,
  trayInner: 0x351b0b,
  cubeSlotStroke: 0x7b4820,
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/theme/theme.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/theme/theme.ts src/theme/theme.test.ts
git commit -m "feat: add Figma-derived theme constants"
```

---

### Task 4: Responsive scale (`computeScale`)

**Files:**

- Create: `src/pixi/layout.ts`
- Test: `src/pixi/layout.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { computeScale } from './layout';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../theme/theme';

describe('computeScale', () => {
  it('returns 1 at exactly the design size', () => {
    expect(computeScale(DESIGN_WIDTH, DESIGN_HEIGHT)).toBe(1);
  });

  it('never goes below 1 (the minimum floor)', () => {
    expect(computeScale(200, 400)).toBe(1);
  });

  it('scales up uniformly using the limiting axis', () => {
    // width allows 3x, height allows 2x -> min is 2x
    expect(computeScale(DESIGN_WIDTH * 3, DESIGN_HEIGHT * 2)).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/pixi/layout.test.ts`
Expected: FAIL — cannot resolve `./layout`.

- [ ] **Step 3: Write the implementation**

```ts
import { DESIGN_WIDTH, DESIGN_HEIGHT, MIN_SCALE } from '../theme/theme';

export function computeScale(
  viewportWidth: number,
  viewportHeight: number,
): number {
  const fit = Math.min(
    viewportWidth / DESIGN_WIDTH,
    viewportHeight / DESIGN_HEIGHT,
  );
  return Math.max(fit, MIN_SCALE);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/pixi/layout.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pixi/layout.ts src/pixi/layout.test.ts
git commit -m "feat: add fit-with-floor scale computation"
```

---

### Task 5: Board geometry (`getBoardLayout`)

**Files:**

- Modify: `src/pixi/layout.ts`
- Test: `src/pixi/layout.test.ts`

- [ ] **Step 1: Add the failing tests**

Append to `src/pixi/layout.test.ts`:

```ts
import { getBoardLayout } from './layout';
import { COLORS, GAME_BOARD_HEIGHT } from '../theme/theme';
import { TOTAL_POINTS } from '../core/constants';

describe('getBoardLayout', () => {
  const layout = getBoardLayout();

  it('produces all 24 points', () => {
    expect(layout.points).toHaveLength(TOTAL_POINTS);
  });

  it('uses only the two point colors', () => {
    const colors = new Set(layout.points.map((p) => p.color));
    expect(colors).toEqual(new Set([COLORS.pointDark, COLORS.pointRust]));
  });

  it('centers the bar horizontally on the surface', () => {
    const barCenter = layout.bar.x + layout.bar.width / 2;
    const surfaceCenter = layout.surface.x + layout.surface.width / 2;
    expect(barCenter).toBeCloseTo(surfaceCenter, 5);
  });

  it('centers the cube slot vertically in the side board', () => {
    const cubeCenter = layout.cubeSlot.y + layout.cubeSlot.height / 2;
    expect(cubeCenter).toBeCloseTo(layout.board.y + GAME_BOARD_HEIGHT / 2, 5);
  });

  it('makes outermost top points rust and outermost bottom points dark', () => {
    // points 0..11 = top row (left->right); 12..23 = bottom row (left->right)
    expect(layout.points[0].color).toBe(COLORS.pointRust); // top-left outer
    expect(layout.points[11].color).toBe(COLORS.pointRust); // top-right outer
    expect(layout.points[12].color).toBe(COLORS.pointDark); // bottom-left outer
    expect(layout.points[23].color).toBe(COLORS.pointDark); // bottom-right outer
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/pixi/layout.test.ts`
Expected: FAIL — `getBoardLayout` is not exported.

- [ ] **Step 3: Write the implementation**

Append to `src/pixi/layout.ts`:

```ts
import {
  GAME_BOARD_X,
  GAME_BOARD_Y,
  GAME_BOARD_WIDTH,
  GAME_BOARD_HEIGHT,
  BORDER_PADDING,
  SURFACE_WIDTH,
  SURFACE_HEIGHT,
  BAR_WIDTH,
  POINT_WIDTH,
  POINT_HEIGHT,
  SIDEBOARD_WIDTH,
  SIDEBOARD_PADDING_X,
  SIDEBOARD_PADDING_Y,
  SIDEBOARD_GAP,
  TRAY_HEIGHT,
  CUBE_SIZE,
  COLORS,
} from '../theme/theme';
import { POINTS_PER_QUADRANT } from '../core/constants';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PointShape {
  // Draw-order index (0..23). NOT the backgammon point number; real
  // point numbering arrives with game state in a later step.
  index: number;
  polygon: number[]; // [x1, y1, x2, y2, x3, y3]
  color: number;
}

export interface BoardLayout {
  board: Rect; // full GameBoard background (rounded frame)
  surface: Rect;
  bar: Rect;
  topTray: Rect;
  bottomTray: Rect;
  cubeSlot: Rect;
  points: PointShape[];
}

function buildPoints(surface: Rect, bar: Rect): PointShape[] {
  const points: PointShape[] = [];
  const halves = [
    { startX: surface.x, isLeft: true },
    { startX: bar.x + bar.width, isLeft: false },
  ];
  const rows = [
    { isTop: true, baseY: surface.y, tipY: surface.y + POINT_HEIGHT },
    {
      isTop: false,
      baseY: surface.y + surface.height,
      tipY: surface.y + surface.height - POINT_HEIGHT,
    },
  ];

  let index = 0;
  for (const row of rows) {
    for (const half of halves) {
      for (let j = 0; j < POINTS_PER_QUADRANT; j++) {
        const x = half.startX + j * POINT_WIDTH;
        const distanceFromOuter = half.isLeft ? j : POINTS_PER_QUADRANT - 1 - j;
        const isRust = row.isTop
          ? distanceFromOuter % 2 === 0
          : distanceFromOuter % 2 === 1;
        points.push({
          index,
          color: isRust ? COLORS.pointRust : COLORS.pointDark,
          polygon: [
            x,
            row.baseY,
            x + POINT_WIDTH,
            row.baseY,
            x + POINT_WIDTH / 2,
            row.tipY,
          ],
        });
        index += 1;
      }
    }
  }
  return points;
}

export function getBoardLayout(): BoardLayout {
  const board: Rect = {
    x: GAME_BOARD_X,
    y: GAME_BOARD_Y,
    width: GAME_BOARD_WIDTH,
    height: GAME_BOARD_HEIGHT,
  };

  const surface: Rect = {
    x: board.x + BORDER_PADDING,
    y: board.y + BORDER_PADDING,
    width: SURFACE_WIDTH,
    height: SURFACE_HEIGHT,
  };

  const bar: Rect = {
    x: surface.x + (SURFACE_WIDTH - BAR_WIDTH) / 2,
    y: surface.y,
    width: BAR_WIDTH,
    height: SURFACE_HEIGHT,
  };

  const sideboardX = board.x + board.width - SIDEBOARD_WIDTH;
  const trayX = sideboardX + SIDEBOARD_PADDING_X;
  const trayWidth = SIDEBOARD_WIDTH - SIDEBOARD_PADDING_X * 2;

  const topTray: Rect = {
    x: trayX,
    y: board.y + SIDEBOARD_PADDING_Y,
    width: trayWidth,
    height: TRAY_HEIGHT,
  };

  const cubeSlot: Rect = {
    x: sideboardX + (SIDEBOARD_WIDTH - CUBE_SIZE) / 2,
    y: topTray.y + TRAY_HEIGHT + SIDEBOARD_GAP,
    width: CUBE_SIZE,
    height: CUBE_SIZE,
  };

  const bottomTray: Rect = {
    x: trayX,
    y: cubeSlot.y + CUBE_SIZE + SIDEBOARD_GAP,
    width: trayWidth,
    height: TRAY_HEIGHT,
  };

  return {
    board,
    surface,
    bar,
    topTray,
    bottomTray,
    cubeSlot,
    points: buildPoints(surface, bar),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/pixi/layout.test.ts`
Expected: PASS (all `computeScale` + `getBoardLayout` tests).

- [ ] **Step 5: Commit**

```bash
git add src/pixi/layout.ts src/pixi/layout.test.ts
git commit -m "feat: add board geometry layout model"
```

---

### Task 6: Draw layer (`drawBoard`)

**Files:**

- Create: `src/pixi/drawBoard.ts`

(Visual rendering; no unit test — PixiJS needs WebGL. Verified in Task 8.)

- [ ] **Step 1: Write the implementation**

```ts
import { Container, Graphics } from 'pixi.js';
import { getBoardLayout } from './layout';
import { COLORS, FRAME_RADIUS } from '../theme/theme';

export function drawBoard(stage: Container): void {
  const layout = getBoardLayout();
  const g = new Graphics();

  // Board frame: one rounded background covering frame + side board.
  g.roundRect(
    layout.board.x,
    layout.board.y,
    layout.board.width,
    layout.board.height,
    FRAME_RADIUS,
  ).fill(COLORS.frame);

  // Playing surface.
  g.rect(
    layout.surface.x,
    layout.surface.y,
    layout.surface.width,
    layout.surface.height,
  ).fill(COLORS.surface);

  // Points.
  for (const point of layout.points) {
    g.poly(point.polygon).fill(point.color);
  }

  // The Bar (central divider).
  g.rect(layout.bar.x, layout.bar.y, layout.bar.width, layout.bar.height).fill(
    COLORS.bar,
  );

  // Bear-off trays (recessed).
  for (const tray of [layout.topTray, layout.bottomTray]) {
    g.rect(tray.x, tray.y, tray.width, tray.height).fill(COLORS.trayInner);
  }

  // Doubling-cube slot placeholder.
  g.rect(
    layout.cubeSlot.x,
    layout.cubeSlot.y,
    layout.cubeSlot.width,
    layout.cubeSlot.height,
  )
    .fill(COLORS.trayInner)
    .stroke({ width: 1, color: COLORS.cubeSlotStroke });

  stage.addChild(g);
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `pnpm build`
Expected: compiles with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pixi/drawBoard.ts
git commit -m "feat: add PixiJS board draw layer"
```

---

### Task 7: Canvas component (`BoardCanvas`)

**Files:**

- Create: `src/pixi/BoardCanvas.tsx`

(Visual; no unit test.)

- [ ] **Step 1: Write the implementation**

```tsx
import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import { computeScale } from './layout';
import { drawBoard } from './drawBoard';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../theme/theme';

export function BoardCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let app: Application | null = null;
    let cancelled = false;

    const resize = () => {
      if (!app) return;
      const scale = computeScale(window.innerWidth, window.innerHeight);
      app.renderer.resize(
        Math.round(DESIGN_WIDTH * scale),
        Math.round(DESIGN_HEIGHT * scale),
      );
      app.stage.scale.set(scale);
    };

    void (async () => {
      const instance = new Application();
      await instance.init({
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
        width: DESIGN_WIDTH,
        height: DESIGN_HEIGHT,
      });

      // Guard against React StrictMode double-invoke: if the effect was
      // cleaned up while init() was awaiting, throw this instance away.
      if (cancelled) {
        instance.destroy(true);
        return;
      }

      app = instance;
      host.appendChild(app.canvas);
      drawBoard(app.stage);
      resize();
      window.addEventListener('resize', resize);
    })();

    return () => {
      cancelled = true;
      window.removeEventListener('resize', resize);
      if (app) {
        app.destroy(true, { children: true });
        app = null;
      }
    };
  }, []);

  return <div ref={hostRef} className='board-host' />;
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `pnpm build`
Expected: compiles with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pixi/BoardCanvas.tsx
git commit -m "feat: add PixiJS canvas component with responsive scaling"
```

---

### Task 8: Wire up App + table background, then visual verification

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Replace `src/App.tsx`**

```tsx
import { BoardCanvas } from './pixi/BoardCanvas';

export function App() {
  return <BoardCanvas />;
}
```

- [ ] **Step 2: Replace `src/index.css`**

```css
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  /* Mirrors DESIGN_WIDTH / DESIGN_HEIGHT in src/theme/theme.ts: the board
     never renders smaller than the Figma size; the page scrolls instead. */
  min-width: 393px;
  min-height: 852px;
  background: linear-gradient(180deg, #3d6db5 0%, #2d5a9f 100%);
}

#root {
  min-height: 100vh;
  min-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.board-host {
  line-height: 0;
}

.board-host canvas {
  display: block;
}
```

- [ ] **Step 3: Verify build + tests**

Run: `pnpm build && pnpm test`
Expected: build succeeds; all unit tests pass.

- [ ] **Step 4: Visual verification**

Run: `pnpm dev`, open the served URL.
Confirm against the Figma export (`GameTable`, node 55:930):

- Brown rounded board frame on the blue gradient table.
- Tan playing surface with 24 alternating dark/rust points; outermost top point is rust, outermost bottom point is dark; pattern mirrors about the bar.
- Central wood Bar dividing left/right halves.
- Right-side bear-off with two recessed dark trays and a doubling-cube slot centered between them.
- No console errors.

Then check responsiveness:

- Enlarge the window past 393×852: board scales up uniformly and stays centered, blue letterbox around it.
- Shrink the window below 393×852: board holds its size and the page scrolls (does not shrink). Board edges stay crisp at all sizes.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/index.css
git commit -m "feat: render board on blue table with responsive scaling"
```

---

### Task 9: Cloudflare Workers Static Assets (manual deploy)

**Files:**

- Create: `wrangler.jsonc`
- Modify: `package.json` (add `deploy` script)

**Prerequisite:** a Cloudflare account, and `wrangler login` run once locally
(interactive browser auth). The agent should pause and ask the user to complete
`wrangler login` before the deploy step if not already authenticated.

- [ ] **Step 1: Install wrangler**

Run: `pnpm add -D wrangler`
Expected: `wrangler` added to devDependencies, no errors.

- [ ] **Step 2: Create `wrangler.jsonc`**

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "bbbackgammon",
  "compatibility_date": "2026-06-04",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application",
  },
}
```

This is **assets-only** (no `main` field), so the Worker serves the static SPA
with zero backend code.

- [ ] **Step 3: Add the `deploy` script to `package.json`**

Update the `scripts` block to:

```json
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "deploy": "pnpm build && wrangler deploy"
  }
```

- [ ] **Step 4: Authenticate (one-time, interactive)**

Run: `wrangler login`
Expected: browser opens; after approving, the terminal reports a successful
login. (Skip if already logged in: `wrangler whoami` shows the account.)

- [ ] **Step 5: Deploy**

Run: `pnpm deploy`
Expected: wrangler builds `dist`, uploads the assets, and prints a deployed URL
like `https://bbbackgammon.<account>.workers.dev`.

- [ ] **Step 6: Verify the live deployment**

Open the printed `*.workers.dev` URL.
Expected: the board renders exactly as in local `pnpm dev`, with no console
errors, and deep links / refresh work (SPA fallback).

- [ ] **Step 7: Commit**

```bash
git add wrangler.jsonc package.json
git commit -m "feat: deploy static board via Cloudflare Workers Static Assets"
```

---

### Task 10: GitHub Actions deploy-on-push

**Files:**

- Create: `.github/workflows/deploy.yml`

**Prerequisite:** in the GitHub repo settings → Secrets and variables → Actions,
add `CLOUDFLARE_API_TOKEN` (a token with the "Edit Cloudflare Workers"
permission) and `CLOUDFLARE_ACCOUNT_ID`. The agent should ask the user to add
these secrets before pushing.

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm test

      - run: pnpm build

      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

`wrangler-action` with no `command` runs `wrangler deploy`, which uploads the
already-built `dist` per `wrangler.jsonc`.

- [ ] **Step 2: Commit and push**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: deploy to Cloudflare on push to main"
git push -u origin main
```

- [ ] **Step 3: Verify the workflow**

In the GitHub repo → Actions tab, confirm the "Deploy" run for the push
succeeds (install, test, build, deploy all green) and the `*.workers.dev` URL
serves the latest board.

---

## Self-Review

**Spec coverage:**

- Blue gradient table → Task 8 (`index.css`). ✓
- Board frame + tan surface → Task 6 (`drawBoard`), Task 5 geometry. ✓
- 24 alternating points, mirrored, outer-rust-top/outer-dark-bottom → Tasks 5 (geometry + tests) & 6. ✓
- The Bar → Tasks 5 & 6. ✓
- Bear-off side board: two trays + centered doubling-cube slot → Tasks 5 & 6. ✓
- Semantic constants, no magic numbers → Task 2; layout/theme derive values, not hard-coded integers. ✓
- Separate Bar / Bear-off modeling → represented as distinct layout rects (`bar`, `topTray`, `bottomTray`); full game-state model is later-step scope. ✓
- PixiJS isolated in `useRef`, created once → Task 7. ✓
- Fit-and-center with 393×852 floor + crisp scaling → Tasks 4 (`computeScale`) & 7 (renderer resize + `stage.scale`). ✓
- Scale-invariant coordinate system → all positions in design units in `layout.ts`. ✓
- Theme centralizes Figma values → Task 3. ✓
- Cloudflare deploy (Workers Static Assets, assets-only) → Task 9. ✓
- GitHub Actions deploy-on-push → Task 10. ✓
- `.gitignore` excludes `node_modules`/`dist`/`.wrangler` before first commit → Task 1 Step 10. ✓

**Placeholder scan:** No TBD/TODO; every code step contains complete code and exact commands.

**Type consistency:** `Rect`, `PointShape`, `BoardLayout`, `getBoardLayout`, `computeScale`, `drawBoard`, and `COLORS.*` keys are used identically across `layout.ts`, `drawBoard.ts`, `BoardCanvas.tsx`, and tests.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-04-static-board-layout.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
