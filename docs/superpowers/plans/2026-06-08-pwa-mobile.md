# PWA and Mobile App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the web app into a PWA with a native mobile app feel, including offline caching, home screen installability, and UI/UX constraints like safe areas and disabled zooming.

**Architecture:** Use `vite-plugin-pwa` for manifest and App Shell caching. Add global CSS constraints and viewport meta tags to prevent web-like behaviors. Apply `env(safe-area-inset-*)` via Tailwind arbitrary values for notch support. Use a small node script with `sharp` to generate the required PWA icons from an SVG template.

**Tech Stack:** React, Tailwind CSS, Vite, `vite-plugin-pwa`, `sharp`.

---

### Task 1: Install Dependencies & Setup Public Dir

**Files:**

- Modify: `package.json`
- Create: `public/` (directory)

- [ ] **Step 1: Install PWA and icon generation dependencies**

Run:

```bash
pnpm add -D vite-plugin-pwa sharp
pnpm add workbox-window
mkdir -p public scripts
```

- [ ] **Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: install PWA and icon generation dependencies"
```

### Task 2: Generate PWA Icons

**Files:**

- Create: `scripts/generate-icons.js`
- Create: `public/icon.svg`
- Create: `public/pwa-192x192.png`
- Create: `public/pwa-512x512.png`
- Create: `public/apple-touch-icon.png`

- [ ] **Step 1: Write the icon generation script**

Create `scripts/generate-icons.js`:

```javascript
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const svgContent = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e17100" />
      <stop offset="100%" stop-color="#973c00" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#bg)" />
  <line x1="0" y1="256" x2="512" y2="256" stroke="black" stroke-opacity="0.1" stroke-width="2" />
  <line x1="256" y1="0" x2="256" y2="512" stroke="black" stroke-opacity="0.1" stroke-width="2" />
  <g transform="translate(140, 160) rotate(-12)">
    <rect width="160" height="160" rx="32" fill="white" />
    <circle cx="40" cy="40" r="16" fill="#101828" />
    <circle cx="80" cy="80" r="16" fill="#101828" />
    <circle cx="120" cy="120" r="16" fill="#101828" />
  </g>
  <g transform="translate(230, 220) rotate(12)">
    <rect width="160" height="160" rx="32" fill="white" />
    <circle cx="40" cy="40" r="16" fill="#101828" />
    <circle cx="120" cy="40" r="16" fill="#101828" />
    <circle cx="80" cy="80" r="16" fill="#101828" />
    <circle cx="40" cy="120" r="16" fill="#101828" />
    <circle cx="120" cy="120" r="16" fill="#101828" />
  </g>
</svg>`;

async function generate() {
  const publicDir = path.resolve('public');
  await fs.mkdir(publicDir, { recursive: true });

  const svgPath = path.join(publicDir, 'icon.svg');
  await fs.writeFile(svgPath, svgContent);

  const buffer = Buffer.from(svgContent);

  await sharp(buffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  await sharp(buffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  await sharp(buffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Icons generated successfully.');
}

generate().catch(console.error);
```

- [ ] **Step 2: Run the generator script**

Run: `node scripts/generate-icons.js`
Verify that `public/icon.svg`, `public/pwa-192x192.png`, `public/pwa-512x512.png`, and `public/apple-touch-icon.png` exist.

- [ ] **Step 3: Commit**

```bash
git add scripts/ public/
git commit -m "build: generate PWA icons"
```

### Task 3: Configure Vite PWA

**Files:**

- Modify: `vite.config.ts`

- [ ] **Step 1: Update Vite config**

Modify `vite.config.ts` to include `VitePWA`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'BB Backgammon',
        short_name: 'Backgammon',
        description: 'Experience the Classic',
        theme_color: '#3d6db5',
        background_color: '#2d5a9f',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add vite.config.ts
git commit -m "build: configure vite-plugin-pwa"
```

### Task 4: Mobile Meta Tags & CSS Constraints

**Files:**

- Modify: `index.html`
- Modify: `src/index.css`

- [ ] **Step 1: Update `index.html` viewport and add theme-color**

Modify the `<head>` in `index.html` to update the viewport and add icon links:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
    />
    <meta name="theme-color" content="#3d6db5" />
    <link rel="icon" type="image/svg+xml" href="/icon.svg" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <title>bbbackgammon</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Update `src/index.css` for mobile constraints**

Append these global styles to `src/index.css`:

```css
@import 'tailwindcss';

html,
body,
#root {
  width: 100%;
  height: 100%;
  overflow: hidden;
  overscroll-behavior-y: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
```

- [ ] **Step 3: Commit**

```bash
git add index.html src/index.css
git commit -m "style: apply mobile UI constraints and viewport meta"
```

### Task 5: Safe Area Insets Support

**Files:**

- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/Game.tsx`

- [ ] **Step 1: Update `Home.tsx`**

Replace the root `div`'s padding classes `px-6 pt-4 pb-8` with arbitrary values using `env(safe-area-inset-*)`:
Modify `src/pages/Home.tsx:54`:

```tsx
    <div className='flex min-h-dvh w-full flex-col items-center bg-[linear-gradient(180deg,#3d6db5_0%,#2d5a9f_100%)] pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]'>
```

- [ ] **Step 2: Update `Game.tsx`**

Replace the root `div`'s padding class `p-4` with arbitrary values:
Modify `src/pages/Game.tsx:8`:

```tsx
    <div className='flex h-dvh w-full flex-col bg-[linear-gradient(180deg,#3d6db5_0%,#2d5a9f_100%)] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]'>
```

- [ ] **Step 3: Run dev server to verify**

Run `pnpm dev` and ensure the app loads without errors and the new styles are applied.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Home.tsx src/pages/Game.tsx
git commit -m "feat: add safe area insets support for notches"
```
