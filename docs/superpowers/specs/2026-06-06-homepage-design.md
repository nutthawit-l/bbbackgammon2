# Home Page + Routing

Date: 2026-06-06
Status: Approved design, pending spec review
Source design: Figma `bbbackgammon` / file key `7or2mH8PehFfpR7d8y2c4N`.
Reference frame: `Starter` (node `55:2`).

## Goal

Add a `Home` homepage component built from the Figma `Starter` design, served at
`/`, and move the existing PixiJS board ("GameTable") to `/game`. The home page
must be a fluid, responsive web layout that shares the GameTable's visual style
(the blue gradient background).

## Scope

In scope:

- Path-based routing via `react-router-dom`: `/` → Home, `/game` → board.
- A `Home` React + Tailwind component matching the Figma `Starter` frame.
- Restructure the entry point so the board is no longer the root.
- Wire only the **Play** button to navigate to `/game`.
- Load Cinzel + Inter fonts; use `lucide-react` for standard icons.

Explicitly out of scope:

- Any game logic, online play, pass & play, settings, or help screens.
- Behavior for Play Online, Pass & Play, Home, Help, Settings (render only).
- Changes to the board rendering itself.

## Architecture & file structure

- `src/main.tsx` — wrap the app in `<BrowserRouter>`.
- `src/App.tsx` — route table only:
  - `/` → `<Home />`
  - `/game` → `<Game />`
- `src/pages/Home.tsx` — exports the `Home` component (the homepage).
- `src/pages/Game.tsx` — exports `Game`: the gradient wrapper currently in
  `App.tsx` (`flex h-dvh w-screen items-center justify-center p-3` + the
  `linear-gradient(180deg,#3d6db5_0%,#2d5a9f_100%)` background) wrapping
  `<BoardCanvas />`. Behavior of the board is unchanged.

SPA fallback (`not_found_handling: single-page-application`) is already set in
`wrangler.jsonc`, so deep-linking `/game` works in production.

## Home layout (fluid, same style as GameTable)

Root: a full-viewport flex column (`min-h-dvh w-full`) on the **same** blue
gradient the board uses. A centered content column holds three regions
(top / main / footer). The content column grows wider on desktop:

- `w-full max-w-[420px]` on mobile, `md:max-w-[520px]` on larger screens.
- Horizontal + vertical padding so it reads well from ~360px wide up to desktop;
  content stays centered and never stretches past the max-width.

Regions:

- **Topbar** (`flex items-center justify-between`):
  - Left: Home button — dark translucent rounded square
    (`bg-black/60 rounded-[14px]`, ~48px) with a `Home` icon. Visual only.
  - Right: Help button (`?` text, bold) and Settings button (`Settings` icon),
    same dark square style, `gap-2`. Visual only.
- **Main** (`flex-1 flex flex-col items-center justify-center`):
  - "BB" — Cinzel Black, `text-[64px] md:text-[80px]`, white, wide letter
    tracking, with the soft white glow blur behind it (the Figma blurred
    container).
  - "BACKGAMMON" — Cinzel Bold, gold `#e8d4b0`, uppercase, tracked,
    `text-[28px] md:text-[34px]`.
  - **Dice hero** — see below; `size-[128px] md:size-[150px]`.
  - **Buttons** — vertical stack, full width of the column, `gap-4`:
    - Each: `bg-[rgba(30,41,59,0.9)] border border-white/10 rounded-[16px]`,
      shadow, ~62px tall, centered icon + label (Inter Medium, `text-[18px]`).
    - `Play` (lucide `Play`) → `navigate('/game')`.
    - `Play Online` (lucide `Globe`) → renders, no action.
    - `Pass & Play` (lucide `Users`) → renders, no action.
- **Footer**: "EXPERIENCE THE CLASSIC" — Inter Medium, `text-[12px]`, tracked,
  uppercase, `opacity-40`.

### Dice hero

Hand-built (no image asset): an orange gradient rounded square
(`linear-gradient(135deg,#e17100,#973c00)`, `rounded-[16px]`, drop shadow, inner
top highlight, faint 10%-opacity cross grid lines) containing two white dice
(`rounded-[10px]`, dark `#101828` pips):

- Left die: rotated ~-10deg, 3 pips on a diagonal.
- Right die: rotated ~+13deg, 5 pips.

Scales with the hero container at the `md` breakpoint.

## Fonts & icons

- Add `@fontsource/cinzel` (700, 900) and `@fontsource/inter` (500, 700);
  import in `src/index.css` (or `main.tsx`). Apply via Tailwind arbitrary
  `font-['Cinzel']` / `font-['Inter']`.
- Add `lucide-react`; use `Home`, `Settings`, `Play`, `Globe`, `Users`.
  The "?" stays as a text glyph.

## New dependencies

`react-router-dom`, `lucide-react`, `@fontsource/cinzel`, `@fontsource/inter`.

## Verification

- `pnpm build` (tsc + vite) passes with no type errors.
- Dev server:
  - `/` renders the Home page, visually matching the Figma `Starter` frame.
  - `/game` renders the board, unchanged from before.
  - Clicking **Play** navigates to `/game`.
  - Layout holds and stays centered from ~360px wide up to desktop; content
    widens at `md` without stretching past `max-w-[520px]`.

## Assumptions

- Component is named `Home`, exported from `src/pages/Home.tsx`.
- Only `Play` is interactive; all other controls are visual placeholders.
- The board page reuses the exact gradient/layout previously in `App.tsx`.
- Desktop "wider" target is `max-w-[520px]` with `md`-breakpoint type/dice
  scaling; chosen as a reasonable value, adjustable during implementation.
