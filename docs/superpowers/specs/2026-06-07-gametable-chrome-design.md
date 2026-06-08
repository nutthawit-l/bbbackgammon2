# GameTable Chrome (Header, PlayerBar, BottomBar)

Date: 2026-06-07
Status: Approved design, pending spec review
Source design: Figma `bbbackgammon` / file key `7or2mH8PehFfpR7d8y2c4N`.
Reference component: `GameTable` (node `55:930`).

## Goal

Build the UI chrome that surrounds the game board on `/game`, matching the Figma
`GameTable` component: a **Header** (TopBar), a **Them** player bar above the
board, a **You** player bar below it, and a **BottomBar**. The existing PixiJS
`BoardCanvas` fills the central GameBoard slot. Also extract the Header as a
shared component and switch the Home page over to it.

(PWA support is specified separately in `2026-06-07-pwa-design.md`.)

## Scope

In scope:

- New components: `Header`, `PlayerBar` (rendered as Them and You), `BottomBar`.
- Rework `/game` (`src/pages/Game.tsx`) into the full GameTable chrome layout
  wrapping the existing `<BoardCanvas />`.
- Refactor `src/pages/Home.tsx` to use the shared `<Header />` (drop its inline
  header markup).

Explicitly out of scope:

- Any game logic, turn handling, live timers, or online play.
- Wiring any control to navigation or actions (all are visual placeholders).
- Changes to the board rendering (`BoardCanvas`, `drawBoard`, `drawCheckers`).

## Components

All text/values are static placeholders taken from the Figma frame. One shared
`PlayerBar` is rendered twice (Them/You) — they are the same component with
different data, consistent with the existing reuse style (`MenuButton`, `Die`).

### `src/components/Header.tsx` (TopBar, node `55:720`)

Presentational only (no handlers), matching the current Home header behavior.

- Row: `flex items-center justify-between px-6 py-4 w-full`.
- Left: Home button — `bg-black/60 rounded-[14px] size-12`, shadow, lucide
  `Home` icon (`size-6`, white).
- Right (`flex gap-2`): Help button (`?`, Inter Bold 20px, white) + Settings
  button (lucide `Settings`), same dark square style.

This is visually identical to the header currently inlined in `Home.tsx`.
`Home.tsx` is updated to render `<Header />` and remove its inline header.

### `src/components/PlayerBar.tsx` (Them node `55:737`, You node `55:905`)

Props: `{ variant: 'them' | 'you' }`.

- Row: `flex gap-6 justify-end h-8 w-full`; `items-end` for `them`,
  `items-start` for `you`.
- **Status badge** (`55:738` / `55:906`): `bg-[#1c1c1c] rounded-[8px] px-2 py-1
  flex gap-2 items-center` + `drop-shadow-[0px_2px_4px_rgba(0,0,0,0.55)]`.
  - `them`: add `border border-[#e8d4b0]` (gold = active turn). `you`: no border.
  - Color swatch: `size-3 rounded-[6px] border` —
    `them` red `#d42200` / border `#a81800`;
    `you` cream `#e0dcd5` / border `#9a9490`.
  - Text column (`flex flex-col gap-0.5`): name (`Them` / `You`, Inter Bold
    12px, white) and `PIP: 158 5:0 / 1` (Inter Regular 10px, `#aaa`).
- **Time badge** (`55:745` / `55:913`): `bg-[#1c1c1c] rounded-[8px] px-2 py-1`,
  `Timer:` (Inter Regular 10px `#aaa`) + `00:00` (Inter Bold 12px).
  - Figma sets the value text to `#1c1c1c` (invisible on its own background);
    render it **white** to match the visible screenshot.

### `src/components/BottomBar.tsx` (node `55:917`)

- Row: `flex items-center justify-between p-4 h-12 w-full`.
- Left: lucide `Clock` (~17px, white) + `00:14` (Inter Semibold 15px, white).
- Right: `Online Game` (Inter Semibold 15px, white) + lucide `Star` (~17px).

## `/game` layout (`src/pages/Game.tsx`)

A phone-style centered column on the same blue gradient the board/Home use,
mirroring Figma's `flex-col justify-between`:

```
<div min-h-dvh w-full [linear-gradient(180deg,#3d6db5,#2d5a9f)] flex flex-col items-center>
  <div w-full max-w-[420px] flex-1 flex flex-col>
    <Header />
    <main flex-1 flex flex-col justify-center gap-2>
      <PlayerBar variant="them" />
      <div flex-1 grid place-items-center>
        <BoardCanvas />
      </div>
      <PlayerBar variant="you" />
    </main>
    <BottomBar />
  </div>
</div>
```

- Header and bars are `shrink-0`; the board slot is `flex-1`.
- `BoardCanvas` keeps its existing `computeScale` contain-fit behavior (389:328),
  scaling to fill the central slot and centering. Board aspect ≈ 1.19, so on a
  ~420px column it renders ~420×354.

## Fonts & icons

- Reuse the already-loaded Cinzel + Inter fonts; apply Inter via
  `font-['Inter']` arbitrary classes (matching `Home.tsx`).
- `lucide-react` icons: `Home`, `Settings`, `Clock`, `Star` (the `?` stays a
  text glyph). All already available via the installed `lucide-react`.

## Verification

- `pnpm build` (tsc + vite) passes with no type errors.
- Dev server:
  - `/game` renders Header, Them bar, board, You bar, and BottomBar, visually
    matching the Figma `GameTable` frame.
  - The board still scales and stays centered from ~360px wide up to desktop.
  - `/` (Home) is unchanged visually but now renders the shared `<Header />`.

## Assumptions

- All controls/values are visual placeholders — no navigation, no logic
  (including the Header Home button).
- `PlayerBar` is one component rendered as Them and You (approach A1).
- Timer value rendered white (the Figma `#1c1c1c` value color is treated as a
  quirk).
- Content column width `max-w-[420px]`, chosen to match the Home page; the board
  scales within it. Adjustable during implementation.
