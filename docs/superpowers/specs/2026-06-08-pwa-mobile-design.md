# PWA and Mobile App Transformation Design

## 1. PWA Setup
- **Tool**: `vite-plugin-pwa`
- **Caching Strategy**: App Shell via Workbox (`generateSW`). Caches HTML, CSS, JS, and fonts for offline availability.
- **Web App Manifest**:
  - `name`: "BB Backgammon"
  - `short_name`: "Backgammon"
  - `theme_color`: `#3d6db5`
  - `background_color`: `#2d5a9f`
  - `display`: `standalone`
  - `orientation`: `portrait`
- **Icons**: Generate 192x192 and 512x512 PNGs (and SVG) resembling the `<DiceHero />` component.

## 2. Mobile UI/UX Tweaks
- **Viewport Meta**: `maximum-scale=1.0, user-scalable=no, viewport-fit=cover` to prevent zooming and support notches.
- **Global CSS (`index.css`)**:
  - `overscroll-behavior-y: none;` (Disable pull-to-refresh)
  - `user-select: none;`, `-webkit-user-select: none;` (Disable text selection)
  - `overflow: hidden;` on `html`, `body`, `#root` (Prevent scrolling the body itself)
  - `-webkit-touch-callout: none;` (Disable long-press context menu)

## 3. Safe Area Insets
- Apply `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` to the root layouts in `Home.tsx` and `Game.tsx` to handle device notches and home indicators.
