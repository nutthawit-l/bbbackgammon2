# Responsive Board Scaling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Project rule:** Per `CLAUDE.md`, do NOT run `git commit` without explicit user review/approval. Each task ends with a commit step — before running it, show the user the diff (`git status` + `git diff --staged`) and wait for approval.

**Goal:** Make the PixiJS GameBoard scale to fill the viewport (large on desktop, shrink-to-fit on mobile) and stay centered, using a Tailwind-CSS responsive layout, by switching the scale reference from the 393×852 phone frame to the 389×328 board and the scale source from `window` to a `ResizeObserver` on the canvas container.

**Architecture:** The board becomes its own logical design space (389×328, origin 0,0) drawn on a transparent Pixi canvas. A Tailwind-styled wrapper fills the viewport and centers the canvas host; a `ResizeObserver` measures the host and applies a single contain-fit `stage.scale`. Board geometry stays in design units, so future checkers/dice auto-scale.

**Tech Stack:** React 19, TypeScript, Vite, PixiJS v8, **Tailwind CSS v4 (`@tailwindcss/vite`)**, Vitest (node env). Deploys to Cloudflare Workers Static Assets (already configured in Step 1).

**Commit cadence:** One commit per task, each gated on user review (chosen by the user).

---

## File Structure

- Modify `package.json` — add `tailwindcss` + `@tailwindcss/vite` dev deps.
- Modify `vite.config.ts` — register the `tailwindcss()` plugin.
- Modify `src/index.css` — replace contents with `@import "tailwindcss";`.
- Modify `src/theme/theme.ts` — set board origin to (0,0); drop the `MIN_SCALE` floor.
- Modify `src/pixi/layout.ts` — `computeScale` becomes container/board-driven (no floor).
- Create `src/pixi/layout.test.ts` — unit tests for `computeScale` and board origin.
- Modify `src/pixi/BoardCanvas.tsx` — `ResizeObserver` + board-sized renderer; Tailwind host classes.
- Modify `src/App.tsx` — Tailwind full-viewport centered wrapper (gradient + centering).

---

## Task 1: Commit the design docs

**Files:**
- `docs/superpowers/specs/2026-06-05-responsive-board-scaling-design.md` (already written)
- `docs/superpowers/plans/2026-06-05-responsive-board-scaling.md` (already written)

- [ ] **Step 1: Commit (after your review)**

Show the user `git status` for these two files, then after approval:

```bash
git add docs/superpowers/specs/2026-06-05-responsive-board-scaling-design.md docs/superpowers/plans/2026-06-05-responsive-board-scaling.md
git commit -m "docs: add responsive board scaling spec and plan"
```

---

## Task 2: Tailwind CSS setup (Vite plugin)

**Files:**
- Modify: `package.json` (deps)
- Modify: `vite.config.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Install Tailwind v4 + Vite plugin**

Run: `pnpm add -D tailwindcss @tailwindcss/vite`
Expected: both packages added to `devDependencies`.

- [ ] **Step 2: Register the Tailwind Vite plugin**

Replace `vite.config.ts` with:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Replace `src/index.css` with the Tailwind import**

Replace the entire contents of `src/index.css` with:

```css
@import "tailwindcss";
```

This removes the old `* { box-sizing }`, the `html, body` gradient/min-size
rules (including the `min-width: 393px; min-height: 852px` floor), and the
`#root` / `.board-host` flex rules. Tailwind v4 preflight resets `box-sizing`
and body `margin`, and sets `canvas { display: block }`, so those no longer need
hand-written CSS. The gradient + centering move to Tailwind classes (Tasks 4-5).

- [ ] **Step 4: Verify the build still works**

Run: `pnpm build`
Expected: `tsc -b` and Vite build succeed (Tailwind plugin loads with no error).

- [ ] **Step 5: Commit (after your review)**

After approval:

```bash
git add package.json pnpm-lock.yaml vite.config.ts src/index.css
git commit -m "chore: add Tailwind CSS v4 via the Vite plugin"
```

---

## Task 3: Container/board-driven `computeScale` + board origin

**Files:**
- Test: `src/pixi/layout.test.ts` (create)
- Modify: `src/pixi/layout.ts` (imports + `computeScale`, lines ~1-22 and ~151-160)
- Modify: `src/theme/theme.ts` (board origin, lines ~3-12)

- [ ] **Step 1: Write the failing test**

Create `src/pixi/layout.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computeScale, getBoardLayout } from './layout';
import { GAME_BOARD_WIDTH, GAME_BOARD_HEIGHT } from '../theme/theme';

describe('computeScale', () => {
  it('fits to the height axis on a wide desktop container', () => {
    // 1920x1080: the near-square board is limited by height.
    const scale = computeScale(1920, 1080);
    expect(scale).toBeCloseTo(1080 / GAME_BOARD_HEIGHT);
  });

  it('fits to the width axis on a narrow tall container', () => {
    const scale = computeScale(300, 2000);
    expect(scale).toBeCloseTo(300 / GAME_BOARD_WIDTH);
  });

  it('shrinks below 1 on small screens (no minimum floor)', () => {
    const scale = computeScale(200, 200);
    expect(scale).toBeLessThan(1);
    expect(scale).toBeCloseTo(
      Math.min(200 / GAME_BOARD_WIDTH, 200 / GAME_BOARD_HEIGHT),
    );
  });
});

describe('getBoardLayout', () => {
  it('positions the board at the canvas origin', () => {
    const layout = getBoardLayout();
    expect(layout.board.x).toBe(0);
    expect(layout.board.y).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `computeScale(200, 200)` currently returns `1` (floored) so "shrinks below 1" fails; `getBoardLayout().board.x` is currently `2` (not `0`).

- [ ] **Step 3: Update board origin in `src/theme/theme.ts`**

Replace lines 11-12:

```ts
export const GAME_BOARD_X = (DESIGN_WIDTH - GAME_BOARD_WIDTH) / 2;
export const GAME_BOARD_Y = (DESIGH_HEIGHT - GAME_BOARD_HEIGHT) / 2;
```

with:

```ts
// The board IS the canvas; it is drawn from the origin and centered on screen
// by the Tailwind layout. The 393×852 phone-frame constants above are retained
// for the future chrome layout but no longer drive scaling or position.
export const GAME_BOARD_X = 0;
export const GAME_BOARD_Y = 0;
```

(Leave `DESIGN_WIDTH`, `DESIGH_HEIGHT` exported as-is for future chrome. Remove `MIN_SCALE` in Step 5 below once `computeScale` stops using it.)

- [ ] **Step 4: Rewrite `computeScale` and fix imports in `src/pixi/layout.ts`**

In the import block (lines 1-22), remove `DESIGN_WIDTH`, `DESIGH_HEIGHT`, and `MIN_SCALE` from the `../theme/theme` import (keep `GAME_BOARD_WIDTH` and `GAME_BOARD_HEIGHT`, which are already imported).

Replace the existing `computeScale` (lines 151-160):

```ts
export function computeScale(
  viewportWidth: number,
  viewportHeight: number,
): number {
  const fit = Math.min(
    viewportWidth / DESIGN_WIDTH,
    viewportHeight / DESIGH_HEIGHT,
  );
  return Math.max(fit, MIN_SCALE);
}
```

with:

```ts
// Contain-fit the board into the available container. The board keeps its exact
// 389:328 proportions; it grows large on desktop and shrinks to fit on mobile.
export function computeScale(
  containerWidth: number,
  containerHeight: number,
): number {
  return Math.min(
    containerWidth / GAME_BOARD_WIDTH,
    containerHeight / GAME_BOARD_HEIGHT,
  );
}
```

- [ ] **Step 5: Remove the now-unused `MIN_SCALE` in `src/theme/theme.ts`**

Delete line 6:

```ts
export const MIN_SCALE = 1;
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS (4 tests).

- [ ] **Step 7: Typecheck**

Run: `pnpm build`
Expected: `tsc -b` succeeds with no unused-import / missing-symbol errors; Vite build completes.

- [ ] **Step 8: Commit (after your review)**

After approval:

```bash
git add src/theme/theme.ts src/pixi/layout.ts src/pixi/layout.test.ts
git commit -m "feat: make board scale container/board-driven with no floor"
```

---

## Task 4: Container-driven canvas sizing (`ResizeObserver`) + Tailwind host

**Files:**
- Modify: `src/pixi/BoardCanvas.tsx` (full file)

- [ ] **Step 1: Replace the file contents**

Replace `src/pixi/BoardCanvas.tsx` with:

```tsx
import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import { computeScale } from './layout';
import { drawBoard } from './drawBoard';
import { GAME_BOARD_HEIGHT, GAME_BOARD_WIDTH } from '../theme/theme';

export function BoardCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let app: Application | null = null;
    let cancelled = false;

    const resize = () => {
      if (!app) return;
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (width === 0 || height === 0) return;
      const scale = computeScale(width, height);
      app.renderer.resize(
        Math.round(GAME_BOARD_WIDTH * scale),
        Math.round(GAME_BOARD_HEIGHT * scale),
      );
      app.stage.scale.set(scale);
    };

    const observer = new ResizeObserver(resize);

    void (async () => {
      const instance = new Application();
      await instance.init({
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
        width: GAME_BOARD_WIDTH,
        height: GAME_BOARD_HEIGHT,
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
      observer.observe(host);
    })();

    return () => {
      cancelled = true;
      observer.disconnect();
      if (app) {
        app.destroy(true, { children: true });
        app = null;
      }
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className='flex h-full w-full items-center justify-center'
    />
  );
}
```

Key changes vs the original: import board dimensions instead of `DESIGN_WIDTH/DESIGH_HEIGHT`; init the renderer at board size; measure `host.clientWidth/Height` (guarding zero); use a `ResizeObserver` on the host instead of a `window` `resize` listener; disconnect the observer on cleanup; host uses Tailwind classes to fill its parent and center the canvas (the `.board-host` CSS class is gone). The canvas is `display: block` via Tailwind preflight.

- [ ] **Step 2: Typecheck**

Run: `pnpm build`
Expected: succeeds, no unused-import errors.

- [ ] **Step 3: Commit (after your review)**

After approval:

```bash
git add src/pixi/BoardCanvas.tsx
git commit -m "feat: size canvas from container via ResizeObserver"
```

---

## Task 5: Tailwind full-viewport wrapper (`App.tsx`)

**Files:**
- Modify: `src/App.tsx` (full file)

- [ ] **Step 1: Replace the file contents**

Replace `src/App.tsx` with:

```tsx
import { BoardCanvas } from './pixi/BoardCanvas';

export function App() {
  return (
    <div className='flex h-dvh w-screen items-center justify-center p-3 bg-[linear-gradient(180deg,#3d6db5_0%,#2d5a9f_100%)]'>
      <BoardCanvas />
    </div>
  );
}
```

Notes:
- `h-dvh w-screen` makes the wrapper exactly the viewport (dynamic viewport
  height handles mobile browser UI bars). `p-3` gives the board breathing room.
- The blue gradient is the same `#3d6db5 → #2d5a9f` as the old CSS, expressed as
  a Tailwind arbitrary value (underscores stand in for spaces). It mirrors
  `COLORS.tableTop`/`COLORS.tableBottom` in `theme.ts`.
- The inner `BoardCanvas` host (`h-full w-full`) fills this wrapper's content box
  (viewport minus padding), so `host.clientWidth/Height` reports the area the
  board may grow into, and the `ResizeObserver` stays stable (its size is driven
  by the viewport, not by the canvas child).

- [ ] **Step 2: Smoke check (dev server)**

Run: `pnpm dev`
Open the local URL. Expected: the board renders centered with the blue gradient
table around it, no scrollbars. (Confirms Tailwind classes compile and apply.)

- [ ] **Step 3: Commit (after your review)**

After approval:

```bash
git add src/App.tsx
git commit -m "feat: center board in a full-viewport Tailwind layout"
```

---

## Task 6: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test + build**

Run: `pnpm test && pnpm build`
Expected: tests PASS, build succeeds.

- [ ] **Step 2: Manual visual verification**

Run: `pnpm dev`. In the browser, verify:
- Desktop wide window: board is large (limited by height), centered, blue table left/right, no scrollbar.
- Desktop narrow window: board shrinks to fit width, centered, no scrollbar.
- Mobile emulation (DevTools, e.g. iPhone portrait): board fits the width, centered, no horizontal scroll.
- Resizing the window keeps the board centered, proportional, and crisp.
- No console errors; navigating away/back does not leak a second canvas (StrictMode/cleanup OK).

---

## Task 7: Deploy + verify on Cloudflare

The deployment infrastructure already exists from Step 1 (`wrangler.jsonc`
assets-only Static Assets, the `pnpm deploy` script, and
`.github/workflows/deploy.yaml` which deploys on push to `main`). This task ships
the responsive change per the prompt's "deploy and verify each step" rule.

**Files:** none (deploy + verify only)

- [ ] **Step 1: Deploy**

Choose one:
- **CI (recommended):** push/merge the reviewed commits to `main`. The
  `deploy.yaml` GitHub Action installs, tests, builds, and runs `wrangler deploy`
  using the `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` repo secrets.
- **Manual:** run `pnpm deploy` locally (requires a prior one-time
  `wrangler login`). This runs `pnpm build && wrangler deploy`.

- [ ] **Step 2: Verify the deployed URL**

Open the deployed Cloudflare Workers URL and confirm:
- The board renders centered and large on desktop, and resizes responsively
  (drag the window / use mobile emulation) — same checks as Task 6 Step 2.
- No console errors.
- For a CI deploy: the GitHub Actions run for `deploy.yaml` is green.

---

## Notes / out of scope

- No chrome bands, header/sidebar, checkers, or dice in this change (deferred to later steps), per the user's "Tailwind only" scope decision.
- The `DESIGH_HEIGHT` misspelling is left as-is to keep the change surgical.
- No minimum board-size floor; revisit for touch-target usability once checkers exist.
