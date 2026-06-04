# Step 1 — Static Backgammon Board Layout (Frontend Only)

Date: 2026-06-04
Status: Approved design, pending spec review
Source design: Figma `bbbackgammon` / frame `GameTable` (node `55:930`),
file key `7or2mH8PehFfpR7d8y2c4N`.

## Goal

Render a responsive, visually faithful **empty backgammon board** in PixiJS v8,
matching the Figma design. No game logic, no networking, no backend, no checkers
or dice. This is the first deployable slice of the larger Cloudflare project.

## Scope

In scope (the `GameBoard` region, 389×328, on the blue table):

- Blue gradient table background.
- Wooden board frame and tan playing surface.
- 24 alternating-color points (4 quadrants × 6).
- The Bar (central vertical wood divider).
- The Bear-Off side board on the far right: two vertical trays (top = red,
  bottom = white) with a doubling-cube slot vertically centered between them.
- Fit-and-center responsive scaling that preserves Figma proportions, with a
  minimum size floor: never render smaller than the 393×852 design frame.
- Deployment to Cloudflare (Workers Static Assets, assets-only) plus a GitHub
  Actions workflow that deploys on push — per the prompt's "deploy each step"
  rule.

Explicitly out of scope (later steps):

- Top bar (home/help/settings), player-status pills ("Them"/"You"), bottom bar.
- Checkers, dice, doubling-cube value/interaction.
- `packages/core` extraction, Turborepo, pnpm-workspace, `apps/backend`.
- Any game state, validation, WebSockets, or Durable Objects.
- Any Worker **script** logic (the Step 1 Worker is assets-only; the Hono
  backend + Durable Objects attach to this same Worker in a later step).

## Design values extracted from Figma

All values are logical pixels measured in the 393-wide frame. Point colors are
baked into SVGs in the design and will be sampled/finalized exactly during
implementation; the approximations below are the working values.

| Element | Value |
|---|---|
| Table background | linear-gradient 180°, `#3D6DB5` → `#2D5A9F` |
| Board frame (wood border) | `#5E3014`, left corners rounded 5px |
| Playing surface | `#C8924A`, 350×308, inset 10px left/top inside frame |
| Point color A (dark) | `#3D1A00` |
| Point color B (rust) | `#8B2200` |
| Point geometry | width = (surface − bar) / 12 (~27.7px), height ≈ 37% (~114px) |
| The Bar | wood `#7B4820`, width ≈ 5.16% of surface (~18px), full height |
| Bear-Off side board | `#5E3014`, width 29px, right corners rounded 5px |
| Bear-off trays (inner) | `#351B0B`, two vertical containers (top red / bottom white) |
| Doubling-cube slot | 20×20, vertically centered between trays |
| Player color: red | `#D42200` (reference, for later) |
| Player color: white | `#E0DCD5` (reference, for later) |

Board block: `GameBoard` = 389×328 = `BoardBorder` (flex, contains 350×308
surface with 10px left/top padding) + `SideBoard` (bear-off, 29px wide).

The board is drawn at its true Figma position **inside the full 393×852 design
stage**, so adding the screen chrome in later steps requires no repositioning.

## Layout interpretation

- 24 points = 4 quadrants × 6 points each. Top-row points face downward,
  bottom-row points face upward. Each row is split 6 + Bar + 6.
- Point colors alternate and are **mirrored about the bar**. The outermost point
  (nearest the side frame) is rust on the top row and dark on the bottom row;
  colors alternate moving inward toward the bar.
- The Bar is the central vertical wood divider inside the playing surface.
- The Bear-Off Bar is the separate right-side board: top tray holds red
  borne-off checkers, bottom tray holds white, doubling-cube slot sits centered
  between them.

## Architecture

Minimal single Vite app (no monorepo tooling yet), `pnpm`-managed.

```
bbbackgammon2/
  package.json          # Vite + React + PixiJS v8 + TypeScript
  index.html
  vite.config.ts
  tsconfig.json
  wrangler.jsonc        # Cloudflare Workers Static Assets (assets-only)
  .github/workflows/deploy.yml  # build, test, deploy-on-push to Cloudflare
  src/
    main.tsx
    App.tsx             # blue gradient table (CSS) + canvas mount
    core/constants.ts   # semantic domain constants, zero magic numbers
    theme/theme.ts      # colors, dimensions, ratios from Figma
    pixi/BoardCanvas.tsx# React component embedding PixiJS via useRef
    pixi/drawBoard.ts   # pure Graphics draw functions
```

`core/` and `theme/` are isolated so they lift cleanly into `packages/core`
when the backend arrives.

### `core/constants.ts` (semantic, no magic numbers)

- `TOTAL_POINTS = 24`
- `POINTS_PER_QUADRANT = 6`
- `QUADRANTS = 4`
- `CHECKERS_PER_PLAYER = 15`
- `DIE_SIDES = 6`
- `DICE_PER_ROLL = 2`
- Player colors as a const/enum: `'white' | 'red'`.
- The Bar and the Bear-Off are modeled as **separate** named concepts, never a
  single continuous 0–25 array.

### `theme/theme.ts`

Centralizes every hex code, dimension, ratio, and corner radius from the table
above, so PixiJS drawing coordinates and any future CSS read from one source.
Includes the design-stage constants: `DESIGN_WIDTH = 393`, `DESIGN_HEIGHT = 852`,
and `MIN_SCALE = 1` (the responsive floor).

### Coordinate system (scale-invariant)

There is exactly one coordinate space: the fixed `393×852` design stage, in
logical units. Every position — point anchors, the Bar, bear-off slots, and (in
later steps) checker stacks — is computed in these units from theme constants.
The responsive fit-to-screen scaling is applied **once** at the root container
(`stage.scale.set(scale)`) and is invisible to all position logic.

Consequences this locks in:

- Positions are pure functions of design constants, e.g. `pointAnchor(index)`
  and (later) `stackOffset(i)`. `scale` never appears in these formulas.
- Pointer interaction (later steps) converts screen → logical via
  `container.toLocal(event.global)`, which accounts for both the stage scale and
  browser scroll offset. No manual scale/scroll math.
- Hard rule: never bake raw screen pixels into game state or position helpers;
  everything stays in `393×852` design units.

### `pixi/BoardCanvas.tsx`

- Creates one PixiJS v8 `Application` inside a `useRef`'d container.
- The `Application` is created once (guarded against React re-creation) and
  destroyed on unmount.
- Canvas is transparent and fills the viewport; the blue gradient shows through
  from CSS, including in letterbox margins.

### `pixi/drawBoard.ts`

Pure functions using `Graphics`, driven entirely by `constants` + `theme`:

- `drawBoardFrame` — wood frame rounded rect.
- `drawSurface` — tan playing surface.
- `drawPoints` — loops `TOTAL_POINTS`, alternating colors A/B, top row down /
  bottom row up, with the Bar gap.
- `drawBar` — central vertical divider.
- `drawBearOff` — right side board: two trays + centered doubling-cube slot.

### Responsive strategy (fit-and-center with minimum floor)

The fixed logical stage is the full Figma frame, `393×852`. On each resize:

```
fitScale = min(viewportW / DESIGN_WIDTH, viewportH / DESIGN_HEIGHT)
scale    = max(fitScale, MIN_SCALE)   // floor at 1× = never below 393×852
```

- **Viewport ≥ design**: `fitScale ≥ 1` — scale up uniformly, center, and
  letterbox the extra space with the blue gradient table.
- **Viewport < design**: clamp to `1×` — the stage stays at exactly 393×852 and
  the page **scrolls** (native overflow) so all content is reachable. The board
  never shrinks below its Figma size.

Crispness: scaling is applied by resizing the Pixi **renderer** to the scaled
pixel size and calling `stage.scale.set(scale)` (honoring `devicePixelRatio`),
**not** by CSS-stretching the canvas bitmap. Because the board is vector
`Graphics`, it re-rasterizes crisply at any scale. No per-resize recomputation
of point geometry — only the renderer size and stage scale/position change.

For Step 1 the board occupies the upper portion of the 852-tall stage; the empty
blue space below is intentional and forward-consistent with the chrome added in
later steps.

## Deployment

The built SPA (`dist/`) is served by a single Cloudflare Worker using **Static
Assets**, configured assets-only (no `main` script) so Step 1 ships zero backend
logic. SPA routing uses `assets.not_found_handling = "single-page-application"`.
The Hono routes and Durable Objects from the long-term design attach to this
same Worker in a later step, so no re-platforming is needed.

- `wrangler.jsonc` defines the Worker name, `compatibility_date`, and the
  `assets` directory (`./dist`).
- A `pnpm deploy` script runs `pnpm build && wrangler deploy` for manual deploys
  (requires a one-time `wrangler login`).
- A GitHub Actions workflow (`.github/workflows/deploy.yml`) installs, tests,
  builds, and deploys on push to `main` via `cloudflare/wrangler-action`, using
  repo secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

## Success criteria

- Board renders matching the Figma screenshot's proportions, colors, and
  structure (frame, surface, 24 alternating points, Bar, Bear-Off with
  doubling-cube slot).
- Resizing the browser keeps the board centered and proportional when the
  viewport is at least 393×852; below that, the board holds at its Figma size
  and the page scrolls (never shrinks). Board stays crisp at all scales.
- No console errors; the Pixi `Application` is created once and cleaned up.
- Verification is visual (side-by-side with the Figma export). No pixel-diff
  tests for a static drawing unless requested.
- The board is reachable at the deployed Cloudflare Workers URL, and a push to
  `main` triggers the GitHub Actions deploy successfully.

## Out-of-scope confirmations

Deferred to later steps and not part of this slice: screen chrome, checkers,
dice, cube interaction, monorepo tooling, backend, and all game/network logic.
