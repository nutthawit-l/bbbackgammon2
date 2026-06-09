# PlayerBar New Design Spec

## Overview
Update the `PlayerBar` component to match the new full-width design from Figma. The component will span the full width of the screen, housing player information on the left and actions (Timer, Undo, Confirm) on the right.

## Architecture & Component Changes

### 1. `PlayerBar.tsx`
- **Structural Update:** Change from a group of floating pill-shaped elements to a full-width block (`w-full`, fixed height of 32px or `h-8`).
- **New Props:** Introduce an `isActive: boolean` prop.
  - When `isActive` is true, the bar receives a gold border (`border-[#e8d4b0]`). Depending on if it's top or bottom, it might need to be specifically `border-y` or similar, but Figma shows a full border, so we will use a full border or just the relevant edges depending on layout. The design seems to show it as a border box.
  - When `isActive` is true, the "Undo" and "Confirm" buttons are enabled and visible. When false, they may be hidden or visually disabled (Figma shows them present but styling implies interactivity, we'll keep them present but disabled without the gold border text).
- **Layout:**
  - `justify-between` and `items-center` on the main container.
  - **Left Side:** Player Color pip (red or grey) and Player Name + PIP info in a column.
  - **Right Side:** Timer ("Timer: 00:00") and two new buttons ("Undo", "Confirm").
- **Styling Details:**
  - Background: `#1c1c1c`
  - Active Border: `#e8d4b0`
  - Text colors: White for main text, `#aaa` for labels/subtext, `#1c1c1c` (shadowed) for buttons in the active state according to Figma (wait, Figma says text is `#1c1c1c` but with a `text-shadow`, let's just make it look like a clear button, maybe text `#e8d4b0` for border buttons, or exactly match Figma if possible. Figma says for Undo/Confirm button container: `bg-[#1c1c1c] border border-[#e8d4b0]` and text `#1c1c1c` with shadow. That text color might be hard to read on dark bg, but we will match the visual intent). Wait, looking closely at the image provided, the text on Undo/Confirm is light golden. I'll use `#e8d4b0` for text and border.

### 2. `Game.tsx`
- Update the invocations of `<PlayerBar />` to pass the `isActive` prop.
  - `<PlayerBar variant='them' isActive={true} />` (to match the mockup)
  - `<PlayerBar variant='you' isActive={false} />`

## Data Flow
- `Game.tsx` passes `variant` and `isActive` down to `PlayerBar`.
- `PlayerBar` uses these props entirely for styling and conditional rendering.

## Error Handling & Testing
- Static visual component, no complex error handling required.
- Visual check against Figma design to ensure margins, paddings, fonts, and colors align.

## Review
Please review this spec. Once approved, we will transition to implementation.