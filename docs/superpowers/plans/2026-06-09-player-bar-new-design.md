# PlayerBar New Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the `PlayerBar` component to a full-width design with an active state and new Undo/Confirm buttons, matching the Figma spec.

**Architecture:** The `PlayerBar` component will be updated to accept an `isActive` prop. It will use this prop to conditionally render the active player border (`#e8d4b0`) and enable/style the action buttons. The `Game` component will be updated to pass `isActive` to both player bars (true for 'them', false for 'you' statically for now).

**Tech Stack:** React, TypeScript, Tailwind CSS

---

### Task 1: Update PlayerBar Component

**Files:**
- Modify: `src/components/PlayerBar.tsx`

- [ ] **Step 1: Write the updated implementation**

```tsx
export function PlayerBar({ variant, isActive = false }: { variant: 'them' | 'you', isActive?: boolean }) {
  const isThem = variant === 'them';

  return (
    <div
      className={`flex w-full h-8 items-center justify-between bg-[#1c1c1c] px-2 ${
        isActive ? 'border border-[#e8d4b0]' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`size-3 rounded-[6px] border ${
            isThem
              ? 'border-[#a81800] bg-[#d42200]'
              : 'border-[#9a9490] bg-[#e0dcd5]'
          }`}
        />
        <div className="flex flex-col justify-center">
          <span className="font-['Inter'] text-[12px] font-bold leading-[1.2] text-white">
            {isThem ? 'Them' : 'You'}
          </span>
          <span className="font-['Inter'] text-[10px] font-normal leading-[1.2] text-[#aaa]">
            PIP: 158 5:0 / 1
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center">
          <span className="font-['Inter'] text-[10px] font-normal text-[#aaa]">
            Timer:&nbsp;
          </span>
          <span className="font-['Inter'] text-[12px] font-bold text-[#e8d4b0]">
            00:00
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`flex h-[24px] min-w-[60px] items-center justify-center px-2 rounded-[8px] font-['Inter'] text-[10px] font-bold transition-colors ${
              isActive
                ? 'bg-[#1c1c1c] border border-[#e8d4b0] text-[#e8d4b0] hover:bg-[#e8d4b0]/10'
                : 'text-[#333] cursor-not-allowed'
            }`}
            disabled={!isActive}
          >
            Undo
          </button>
          <button
            className={`flex h-[24px] min-w-[60px] items-center justify-center px-2 rounded-[8px] font-['Inter'] text-[10px] font-bold transition-colors ${
              isActive
                ? 'bg-[#1c1c1c] border border-[#e8d4b0] text-[#e8d4b0] hover:bg-[#e8d4b0]/10'
                : 'text-[#333] cursor-not-allowed'
            }`}
            disabled={!isActive}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PlayerBar.tsx
git commit -m "feat: update PlayerBar styling and add isActive prop"
```

### Task 2: Update Game Component Invocations

**Files:**
- Modify: `src/pages/Game.tsx`

- [ ] **Step 1: Write the updated implementation**

```tsx
import { BoardCanvas } from '../pixi/BoardCanvas';
import { Header } from '../components/Header';
import { PlayerBar } from '../components/PlayerBar';
import { BottomBar } from '../components/BottomBar';

export function Game() {
  return (
    <div className='flex h-dvh w-full flex-col bg-[linear-gradient(180deg,#3d6db5_0%,#2d5a9f_100%)]'>
      <Header />
      <main className='flex min-h-0 flex-1 w-full flex-col justify-between overflow-hidden'>
        <PlayerBar variant='them' isActive={true} />
        <BoardCanvas />
        <PlayerBar variant='you' isActive={false} />
      </main>
      <BottomBar />
    </div>
  );
}
```

- [ ] **Step 2: Build project to verify**

Run: `pnpm build`
Expected: Passes without errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Game.tsx
git commit -m "feat: pass isActive to PlayerBar in Game view"
```