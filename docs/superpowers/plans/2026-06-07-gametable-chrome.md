# GameTable Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the GameTable UI chrome (Header, PlayerBar, BottomBar) around the existing PixiJS board on `/game`, and refactor the Home page to use the shared Header.

**Architecture:** Three new presentational React components in `src/components/`. `Header` is extracted from the existing inline Home header (so Home and Game share it). `PlayerBar` is one component rendered twice (`them`/`you`). `Game.tsx` becomes a phone-style centered column — Header, then a `<main>` holding the Them bar, the board slot (existing `<BoardCanvas />`), and the You bar, then BottomBar — mirroring the Figma `flex-col justify-between` frame. All values are static placeholders from Figma; no logic or navigation.

**Tech Stack:** React 19 + TypeScript, Tailwind v4 (arbitrary classes), `lucide-react` icons, Vite, PixiJS (board, unchanged).

---

## Notes for the implementer

- **No React component test setup exists.** The project's Vitest config runs in a
  `node` environment over `src/**/*.test.ts` (pure logic only — see `src/pixi/layout.ts`
  tests). These chrome components are static, presentational markup that matches a
  Figma frame. Adding a DOM testing stack (`@testing-library/react` + `jsdom`) just to
  assert static class strings is out of scope and against the project's simplicity
  guidance. **Verification is therefore: `pnpm build` (tsc typecheck + vite build) must
  pass, the editor must show no lint errors, and a visual check in the dev server.**
  This is a deliberate deviation from strict TDD for this presentational task.
- **Header padding:** The shared `Header` is padding-free (`flex w-full items-center
  justify-between`). Home's horizontal padding lives on its root column; if `Header`
  added its own `px-6`, Home would be double-padded and shift. The `/game` column
  supplies `px-6 pt-4` instead. This keeps Home pixel-identical. (Resolves the spec's
  "px-6 py-4 on Header row" — the padding moves to each page's column.)
- **Project rule:** commits require user review first. Commit steps are included for
  completeness; when executing, request review before each commit.
- Run all commands from the repo root `/home/tie/Projects/bbbackgammon2`.

## File structure

- Create: `src/components/Header.tsx` — shared TopBar (Home / ? / Settings buttons).
- Create: `src/components/PlayerBar.tsx` — Them/You status + timer badge row.
- Create: `src/components/BottomBar.tsx` — clock+time / "Online Game"+star row.
- Modify: `src/pages/Home.tsx` — render `<Header />`, drop inline header + now-unused imports.
- Modify: `src/pages/Game.tsx` — full GameTable chrome layout wrapping `<BoardCanvas />`.

---

## Task 1: Header component + Home refactor

**Files:**
- Create: `src/components/Header.tsx`
- Modify: `src/pages/Home.tsx` (imports on line 3; inline `<header>` on lines 69-93)

- [ ] **Step 1: Create the Header component**

Create `src/components/Header.tsx` with the exact button markup currently inlined in Home (minus outer padding):

```tsx
import { Home as HomeIcon, Settings } from 'lucide-react';

export function Header() {
  return (
    <header className='flex w-full items-center justify-between'>
      <button
        type='button'
        aria-label='Home'
        className='flex size-12 items-center justify-center rounded-[14px] bg-black/60 text-white shadow-[0px_10px_15px_rgba(0,0,0,0.1),0px_4px_6px_rgba(0,0,0,0.1)]'
      >
        <HomeIcon className='size-6' />
      </button>
      <div className='flex items-center gap-2'>
        <button
          type='button'
          aria-label='Help'
          className='flex size-12 items-center justify-center rounded-[14px] bg-black/60 text-[20px] font-bold text-white shadow-[0px_10px_15px_rgba(0,0,0,0.1),0px_4px_6px_rgba(0,0,0,0.1)]'
        >
          ?
        </button>
        <button
          type='button'
          aria-label='Settings'
          className='flex size-12 items-center justify-center rounded-[14px] bg-black/60 text-white shadow-[0px_10px_15px_rgba(0,0,0,0.1),0px_4px_6px_rgba(0,0,0,0.1)]'
        >
          <Settings className='size-6' />
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Swap Home's inline header for `<Header />`**

In `src/pages/Home.tsx`, change the import on line 3 from:

```tsx
import { Home as HomeIcon, Settings, Play, Globe, Users } from 'lucide-react';
```

to (drop `HomeIcon` and `Settings`, which move into `Header`; keep the rest):

```tsx
import { Play, Globe, Users } from 'lucide-react';
import { Header } from '../components/Header';
```

Then replace the entire inline `<header>...</header>` block (lines 69-93) with:

```tsx
        <Header />
```

Leave the rest of `Home.tsx` (`DiceHero`, `MenuButton`, `<main>`, `<footer>`, the root
`px-6 pt-4 pb-8` column) unchanged.

- [ ] **Step 3: Typecheck + build**

Run: `pnpm build`
Expected: PASS — `tsc -b` reports no errors (notably no "unused import" for `HomeIcon`/`Settings`) and `vite build` completes.

- [ ] **Step 4: Visual check (Home unchanged)**

Run: `pnpm dev`, open `/`.
Expected: The Home page looks identical to before — Home button top-left, `?` and Settings top-right, correctly aligned with the centered content column below.

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.tsx src/pages/Home.tsx
git commit -m "feat: extract shared Header component and use it on Home"
```

---

## Task 2: PlayerBar component

**Files:**
- Create: `src/components/PlayerBar.tsx`

- [ ] **Step 1: Create the PlayerBar component**

Create `src/components/PlayerBar.tsx`. One component, two variants. `them` is the active
turn (gold border, red swatch, bottom-aligned); `you` has no border (cream swatch,
top-aligned). The timer value is rendered white (Figma's `#1c1c1c` value color is treated
as a quirk).

```tsx
export function PlayerBar({ variant }: { variant: 'them' | 'you' }) {
  const isThem = variant === 'them';

  return (
    <div
      className={`flex w-full justify-end gap-6 ${
        isThem ? 'items-end' : 'items-start'
      }`}
    >
      <div
        className={`flex items-center gap-2 rounded-[8px] bg-[#1c1c1c] px-2 py-1 drop-shadow-[0px_2px_4px_rgba(0,0,0,0.55)] ${
          isThem ? 'border border-[#e8d4b0]' : ''
        }`}
      >
        <span
          className={`size-3 rounded-[6px] border ${
            isThem
              ? 'border-[#a81800] bg-[#d42200]'
              : 'border-[#9a9490] bg-[#e0dcd5]'
          }`}
        />
        <div className='flex flex-col gap-0.5'>
          <span className="font-['Inter'] text-[12px] font-bold leading-[12px] text-white">
            {isThem ? 'Them' : 'You'}
          </span>
          <span className="font-['Inter'] text-[10px] font-normal leading-[10px] text-[#aaa]">
            PIP: 158 5:0 / 1
          </span>
        </div>
      </div>
      <div className='flex items-center rounded-[8px] bg-[#1c1c1c] px-2 py-1 drop-shadow-[0px_2px_4px_rgba(0,0,0,0.55)]'>
        <span className="font-['Inter'] text-[10px] font-normal leading-[10px] text-[#aaa]">
          Timer:&nbsp;
        </span>
        <span className="font-['Inter'] text-[12px] font-bold leading-[12px] text-white">
          00:00
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + build**

Run: `pnpm build`
Expected: PASS — no type errors, build completes. (The component is not yet rendered
anywhere; this just confirms it compiles.)

- [ ] **Step 3: Commit**

```bash
git add src/components/PlayerBar.tsx
git commit -m "feat: add PlayerBar component (Them/You status + timer badges)"
```

---

## Task 3: BottomBar component

**Files:**
- Create: `src/components/BottomBar.tsx`

- [ ] **Step 1: Create the BottomBar component**

Create `src/components/BottomBar.tsx`:

```tsx
import { Clock, Star } from 'lucide-react';

export function BottomBar() {
  return (
    <footer className='flex w-full items-center justify-between p-4'>
      <div className='flex items-center gap-[7px]'>
        <Clock className='size-[17px] text-white' />
        <span className="font-['Inter'] text-[15px] font-semibold text-white">
          00:14
        </span>
      </div>
      <div className='flex items-center gap-2'>
        <span className="font-['Inter'] text-[15px] font-semibold text-white">
          Online Game
        </span>
        <Star className='size-[17px] text-white' />
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Typecheck + build**

Run: `pnpm build`
Expected: PASS — no type errors, build completes.

- [ ] **Step 3: Commit**

```bash
git add src/components/BottomBar.tsx
git commit -m "feat: add BottomBar component (timer / online-game row)"
```

---

## Task 4: Assemble the /game GameTable layout

**Files:**
- Modify: `src/pages/Game.tsx` (full rewrite of the 9-line file)

- [ ] **Step 1: Rewrite Game.tsx with the chrome layout**

Replace the entire contents of `src/pages/Game.tsx` with:

```tsx
import { BoardCanvas } from '../pixi/BoardCanvas';
import { Header } from '../components/Header';
import { PlayerBar } from '../components/PlayerBar';
import { BottomBar } from '../components/BottomBar';

export function Game() {
  return (
    <div className='flex min-h-dvh w-full flex-col items-center bg-[linear-gradient(180deg,#3d6db5_0%,#2d5a9f_100%)] px-6 pt-4 pb-4'>
      <div className='flex w-full max-w-[420px] flex-1 flex-col'>
        <Header />
        <main className='flex flex-1 flex-col justify-center gap-2'>
          <PlayerBar variant='them' />
          <div className='flex min-h-0 flex-1 items-center justify-center'>
            <BoardCanvas />
          </div>
          <PlayerBar variant='you' />
        </main>
        <BottomBar />
      </div>
    </div>
  );
}
```

Notes:
- `min-h-0` on the board slot lets the flex child shrink so the board contain-fits
  instead of overflowing.
- The board slot is `flex-1`; `BoardCanvas` already renders a `h-full w-full` host that
  scales the canvas via `computeScale`, so no board changes are needed.
- Drops the previous stray `;` after `<BoardCanvas />` that was in the old file.

- [ ] **Step 2: Typecheck + build**

Run: `pnpm build`
Expected: PASS — no type errors, build completes.

- [ ] **Step 3: Visual check (/game)**

Run: `pnpm dev`, open `/game`.
Expected:
- Header (Home / ? / Settings) at top.
- "Them" badge (gold border, red swatch) + "Timer: 00:00" aligned right, above the board.
- The PixiJS board centered in the middle slot, scaled to fit.
- "You" badge (no border, cream swatch) + "Timer: 00:00" below the board.
- BottomBar: clock + "00:14" on the left, "Online Game" + star on the right.
- Resize the window from ~360px wide up to desktop: the board stays centered and scales;
  chrome stays pinned top/bottom.

- [ ] **Step 4: Visual regression check (Home)**

Open `/` again.
Expected: Home still looks identical to before (shared Header renders correctly).

- [ ] **Step 5: Commit**

```bash
git add src/pages/Game.tsx
git commit -m "feat: assemble GameTable chrome around the board on /game"
```

---

## Final verification

- [ ] Run `pnpm build` once more — clean typecheck + build.
- [ ] Run `pnpm test` — existing layout tests still pass (no regressions; this plan
      doesn't touch `src/pixi` or `src/core`).
- [ ] `/game` matches the Figma `GameTable` frame; `/` is unchanged.
