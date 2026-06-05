# Responsive Board Scaling — Board-Dominant, Container-Driven

Date: 2026-06-05
Status: Draft, pending user review
Supersedes (partially): the responsive section of
`2026-06-04-backgammon-static-board-design.md` (the "fit the full 393×852 phone
frame, floor at 1×, scroll instead of shrink" strategy).

## Goal

Make the GameBoard canvas scale with the viewport so it is no longer stuck at
"mobile size" on desktop browsers, while staying centered on any screen size
(mobile or desktop). The board should grow large on wide screens and shrink to
fit on small screens, always preserving its exact Figma proportions.

## Background — why the board looks "mobile-sized" on PC today

The current scale is computed from the full **portrait phone frame** (393×852),
not from the board itself:

```
fitScale = min(viewportW / 393, viewportH / 852)
scale    = max(fitScale, 1)   // floored at 1×
```

Because 852 is tall, on a wide desktop the **height** term dominates: e.g. on a
1920×1080 screen, `scale ≈ 1080/852 ≈ 1.27`, so the board renders only ~494px
wide on a 1920px-wide screen, with large blue letterbox margins left/right. The
board occupies only ~38% of the stage height (328 of 852); the rest is empty
blue space reserved for future chrome.

This is by design in the old spec, but it conflicts with the new goal of a
larger board on desktop.

## Decision

Adopt **Option 2 — board-dominant, container-driven scaling**, chosen by the
user after reviewing a mockup of three options:

- Option 1 (scale the whole phone frame together) — board only moderately
  bigger; rejected.
- **Option 2 (board-dominant) — chosen.**
- Option 3 (max-width phone column) — board stays phone-sized; rejected.

Within Option 2, the user chose **not** to reserve empty top/bottom chrome bands
yet. The board is simply scaled to fit the viewport and centered, with light
padding. The longer-term intent (a phone frame with top/bottom chrome around the
board) is preserved conceptually and can be reintroduced as real chrome in a
later step, but no empty placeholder bands are added now.

## Scope

In scope:

- Install and configure **Tailwind CSS** (the project does not have it yet), and
  use Tailwind utility classes for the responsive HTML layout, per `prompt.md`.
- Change the scale reference from the 393×852 phone frame to the **389×328
  board** itself.
- Change the scale source from `window.innerWidth/innerHeight` to a
  **`ResizeObserver`** on the canvas host container.
- Center the board canvas on screen (both axes) using **Tailwind utilities**, at
  all sizes.
- Shrink-to-fit on small screens (no horizontal scroll); scale up on large
  screens. Board always preserves its 389:328 proportions (contain-fit).
- Remove the old "never shrink below 393×852 / page scrolls" behavior
  (`MIN_SCALE = 1` floor and the `min-width/min-height: 393/852` CSS).

Out of scope (unchanged, later steps):

- Chrome content: top bar (home/help/settings), player pills ("Them"/"You"),
  bottom bar, and their styling/layout.
- Checkers, dice, doubling-cube value/interaction.
- Any game state, validation, networking, backend.

## Design

### Tailwind CSS setup (prerequisite)

Tailwind is added with the **v4 first-party Vite plugin** (the simplest modern
setup — no `tailwind.config.js` or `postcss.config.js` needed):

- Add deps `tailwindcss` + `@tailwindcss/vite`.
- Register the `tailwindcss()` plugin in `vite.config.ts`.
- Replace `src/index.css` contents with a single `@import "tailwindcss";`.

Tailwind v4's preflight already resets `box-sizing` and body `margin`, so those
manual base rules are no longer needed.

### Layout (React + Tailwind CSS)

The page is a single full-viewport flex container that centers the board canvas
host both vertically and horizontally, expressed entirely with **Tailwind
utility classes** on the React elements (e.g. `flex h-dvh w-screen items-center
justify-center p-3` on the app wrapper, and `flex h-full w-full items-center
justify-center` on the canvas host). No reserved chrome bands.

The blue gradient table is applied to the app wrapper as a Tailwind arbitrary
background value derived from the theme colors, and fills any space around the
board. The canvas host fills the available viewport (minus a small uniform
padding) so that the `ResizeObserver` reports the space the board may grow into.

### Board canvas sizing (container-driven)

- The board has its own logical design space: `BOARD_WIDTH = 389`,
  `BOARD_HEIGHT = 328`, drawn from origin `(0, 0)`. The board (its rounded wood
  frame, surface, points, bar, and right-side bear-off) IS the canvas content;
  the old 393×852 stage offset is removed.
- On each container resize:

  ```
  scale = min(containerW / BOARD_WIDTH, containerH / BOARD_HEIGHT)
  ```

  This is a pure contain-fit: the board grows to fill the limiting axis and
  preserves its exact proportions. No `MIN_SCALE` floor.
- The Pixi **renderer** is resized to `round(BOARD_WIDTH * scale)` ×
  `round(BOARD_HEIGHT * scale)`, and `stage.scale.set(scale)` is applied once at
  the root. `devicePixelRatio` / `autoDensity` handling is unchanged, so the
  vector board stays crisp at any scale.
- The canvas element is centered in the viewport by Tailwind flex utilities (not
  by a Pixi stage offset).

### Why `ResizeObserver` instead of `window` resize

The board should size to the space its container actually has, not to the raw
window. Observing the container is correct now (the container is effectively the
viewport) and remains correct later when real chrome (top/bottom bars) wraps the
canvas and reduces the space available to the board — no rework needed at that
point.

### Coordinate system — preserved

The scale-invariant, single-uniform-scale model from the original spec is kept.
Board geometry stays in board-local design units; the one uniform `stage.scale`
still applies at the root. Only two things change:

1. the scale **reference** (393×852 phone frame → 389×328 board), and
2. the scale **source** (window → container).

Consequently, checkers/dice added in later steps still live in board-local
design units and scale automatically. Pointer interaction will still convert
screen → logical via `container.toLocal(event.global)`.

### Files touched

- `package.json` — add `tailwindcss` + `@tailwindcss/vite` dev deps.
- `vite.config.ts` — register the `tailwindcss()` plugin.
- `src/theme/theme.ts` — board design constants become the scale reference;
  board origin moves to `(0, 0)`; the 393×852 frame constants and `MIN_SCALE`
  floor are no longer used for scaling (retained only if useful for future
  chrome layout, otherwise removed during implementation).
- `src/pixi/layout.ts` — `computeScale` takes container width/height and divides
  by the board size (no floor); `getBoardLayout` positions the board at origin
  `(0, 0)`.
- `src/pixi/BoardCanvas.tsx` — replace the `window.resize` listener with a
  `ResizeObserver` on the host; size the renderer to the scaled board size;
  apply `stage.scale`. Host uses Tailwind centering classes.
- `src/App.tsx` — full-viewport Tailwind-centered wrapper hosting the canvas
  (no chrome bands).
- `src/index.css` — replace all contents with `@import "tailwindcss";` (removes
  the old flex rules and the `min-width/min-height: 393/852` floor).

## Success criteria

- On a wide desktop browser, the board is substantially larger than today
  (limited by viewport height, given the board's near-square 389:328 ratio),
  centered, with blue table around it. No fixed ~494px cap.
- On a mobile browser (portrait), the board fits the available space and is
  centered, with no horizontal scrollbar.
- Resizing the browser at any size keeps the board centered and proportional;
  the board stays crisp at all scales (vector re-rasterization, DPR-aware).
- No console errors; the Pixi `Application` is still created once and cleaned up,
  and the `ResizeObserver` is disconnected on unmount.
- Verification is visual (desktop wide, desktop narrow, mobile portrait).

## Open considerations (non-blocking)

- Pre-existing constant misspelling `DESIGH_HEIGHT` (should be `DESIGN_HEIGHT`)
  is noted but will not be renamed unless requested, to keep this change
  surgical.
- No minimum board-size floor is added now; revisit for touch-target usability
  once checkers/dice exist.
