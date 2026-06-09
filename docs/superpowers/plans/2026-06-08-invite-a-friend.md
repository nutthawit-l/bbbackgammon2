# Invite a Friend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the "Play Online → Invite a Friend" flow — a Hono + Durable Objects backend for room creation and WebSocket matchmaking, a Zustand store for connection state, and three UI modals that walk the user from room creation through waiting to game start.

**Architecture:** Single Vite app deployed on Cloudflare Workers. The worker entry point (`src/server/index.ts`) runs Hono and exports the `GameRoom` Durable Object. The frontend creates a room via `POST /api/rooms`, then opens a WebSocket while showing a waiting modal on the Home page. When the second player connects, both players are routed to `/game/:roomId`. The existing `Game.tsx` page (with its `BoardCanvas`, `PlayerBar`, `Header`, `BottomBar`) is reused — only the route is parameterized and a WebSocket connection is added.

**Tech Stack:** React 19, Tailwind CSS v4, Zustand, Hono, Cloudflare Workers + Durable Objects, Vitest.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/store/gameStore.ts` | Zustand store: connection status, roomId, playerColor, countdown |
| Create | `src/store/gameStore.test.ts` | Unit tests for the store |
| Create | `src/server/GameRoom.ts` | Durable Object: manages 2-player room, WebSocket connections, color assignment |
| Create | `src/server/index.ts` | Hono worker: `POST /api/rooms`, `GET /ws/room/:roomId` (WebSocket upgrade) |
| Create | `src/components/modals/PlayOnlineModal.tsx` | "Play Online" modal with "Invite a Friend" button |
| Create | `src/components/modals/InviteAFriendModal.tsx` | Shows room URL + "Copy Link" button |
| Create | `src/components/modals/WaitingFriendModal.tsx` | Countdown timer while waiting for opponent |
| Create | `src/hooks/useRoomSocket.ts` | WebSocket connection hook — shared by Home (waiting) and Game (playing) |
| Modify | `src/App.tsx` | Add `/game/:roomId` route |
| Modify | `src/pages/Home.tsx` | Wire "Play Online" button → modal flow, WebSocket while waiting |
| Modify | `src/pages/Game.tsx` | Read `roomId` from URL params, connect WebSocket on mount |
| Modify | `wrangler.jsonc` | Add `main` entry, Durable Object binding + migration |

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install zustand and hono**

Run:
```bash
pnpm add zustand hono
```

- [ ] **Step 2: Install Cloudflare worker types**

Run:
```bash
pnpm add -D @cloudflare/workers-types
```

- [ ] **Step 3: Verify both packages are in `package.json`**

Run:
```bash
grep -E '"zustand"|"hono"|"@cloudflare/workers-types"' package.json
```
Expected: three matching lines showing the packages.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add zustand, hono, and cloudflare worker types"
```

---

### Task 2: Zustand Store

**Files:**
- Create: `src/store/gameStore.ts`
- Create: `src/store/gameStore.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/store/gameStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.setState({
      status: 'disconnected',
      roomId: null,
      playerColor: null,
      countdown: 600,
    });
  });

  it('has correct initial state', () => {
    const state = useGameStore.getState();
    expect(state.status).toBe('disconnected');
    expect(state.roomId).toBeNull();
    expect(state.playerColor).toBeNull();
    expect(state.countdown).toBe(600);
  });

  it('setStatus updates status', () => {
    useGameStore.getState().setStatus('waiting');
    expect(useGameStore.getState().status).toBe('waiting');
  });

  it('setRoom updates roomId and playerColor', () => {
    useGameStore.getState().setRoom('room-abc', 'white');
    const state = useGameStore.getState();
    expect(state.roomId).toBe('room-abc');
    expect(state.playerColor).toBe('white');
  });

  it('decrementCountdown decreases by 1', () => {
    useGameStore.getState().decrementCountdown();
    expect(useGameStore.getState().countdown).toBe(599);
  });

  it('decrementCountdown floors at 0', () => {
    useGameStore.setState({ countdown: 0 });
    useGameStore.getState().decrementCountdown();
    expect(useGameStore.getState().countdown).toBe(0);
  });

  it('reset returns to initial state', () => {
    useGameStore.getState().setRoom('room-abc', 'red');
    useGameStore.getState().setStatus('playing');
    useGameStore.getState().reset();
    const state = useGameStore.getState();
    expect(state.status).toBe('disconnected');
    expect(state.roomId).toBeNull();
    expect(state.playerColor).toBeNull();
    expect(state.countdown).toBe(600);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/store/gameStore.test.ts`
Expected: FAIL — cannot find module `./gameStore`

- [ ] **Step 3: Write minimal implementation**

Create `src/store/gameStore.ts`:

```typescript
import { create } from 'zustand';
import type { PlayerColor } from '../core/constants';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'waiting' | 'playing';

interface GameState {
  status: ConnectionStatus;
  roomId: string | null;
  playerColor: PlayerColor | null;
  countdown: number;

  setStatus: (status: ConnectionStatus) => void;
  setRoom: (roomId: string, color: PlayerColor) => void;
  decrementCountdown: () => void;
  reset: () => void;
}

const INITIAL_STATE = {
  status: 'disconnected' as const,
  roomId: null,
  playerColor: null,
  countdown: 600,
};

export const useGameStore = create<GameState>((set) => ({
  ...INITIAL_STATE,

  setStatus: (status) => set({ status }),
  setRoom: (roomId, playerColor) => set({ roomId, playerColor }),
  decrementCountdown: () =>
    set((state) => ({ countdown: Math.max(0, state.countdown - 1) })),
  reset: () => set(INITIAL_STATE),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/store/gameStore.test.ts`
Expected: PASS — 6 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/store/gameStore.ts src/store/gameStore.test.ts
git commit -m "feat: add Zustand game store for connection state"
```

---

### Task 3: GameRoom Durable Object

**Files:**
- Create: `src/server/GameRoom.ts`
- Modify: `wrangler.jsonc`

- [ ] **Step 1: Configure Durable Object in wrangler.jsonc**

Replace the entire contents of `wrangler.jsonc` with:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "bbackgammon",
  "main": "src/server/index.ts",
  "compatibility_date": "2026-06-04",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  },
  "durable_objects": {
    "bindings": [
      {
        "name": "GAME_ROOM",
        "class_name": "GameRoom"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["GameRoom"]
    }
  ]
}
```

> **Key detail:** `"main": "src/server/index.ts"` tells Wrangler which file is the worker entry point. Without this, the worker has no server-side code.

- [ ] **Step 2: Implement GameRoom Durable Object**

Create `src/server/GameRoom.ts`:

```typescript
import { DurableObject } from 'cloudflare:workers';

interface Env {
  GAME_ROOM: DurableObjectNamespace;
}

export class GameRoom extends DurableObject<Env> {
  private connections = new Set<WebSocket>();
  private players: Map<WebSocket, 'white' | 'red'> = new Map();

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    if (this.players.size >= 2) {
      return new Response('Room full', { status: 403 });
    }

    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    server.accept();
    this.connections.add(server);

    // Assign color: first player gets random, second gets the opposite.
    const takenColors = [...this.players.values()];
    const color: 'white' | 'red' =
      takenColors.length === 0
        ? Math.random() > 0.5
          ? 'white'
          : 'red'
        : takenColors[0] === 'white'
          ? 'red'
          : 'white';

    this.players.set(server, color);

    server.send(JSON.stringify({ type: 'connected', color }));

    // If room is now full, broadcast game_start to all.
    if (this.players.size === 2) {
      this.broadcast(JSON.stringify({ type: 'game_start' }));
    }

    server.addEventListener('close', () => {
      this.connections.delete(server);
      this.players.delete(server);
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  private broadcast(message: string) {
    for (const conn of this.connections) {
      conn.send(message);
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/server/GameRoom.ts wrangler.jsonc
git commit -m "feat: implement GameRoom Durable Object with WebSocket matchmaking"
```

---

### Task 4: Hono Worker Entry Point

**Files:**
- Create: `src/server/index.ts`

- [ ] **Step 1: Write Hono server**

Create `src/server/index.ts`:

```typescript
import { Hono } from 'hono';

type Bindings = {
  GAME_ROOM: DurableObjectNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post('/api/rooms', async (c) => {
  const id = c.env.GAME_ROOM.newUniqueId();
  return c.json({ roomId: id.toString() });
});

app.get('/ws/room/:roomId', async (c) => {
  const roomId = c.req.param('roomId');
  let id: DurableObjectId;
  try {
    id = c.env.GAME_ROOM.idFromString(roomId);
  } catch {
    return c.json({ error: 'Invalid room ID' }, 400);
  }
  const room = c.env.GAME_ROOM.get(id);
  return room.fetch(c.req.raw);
});

export default app;
export { GameRoom } from './GameRoom';
```

- [ ] **Step 2: Commit**

```bash
git add src/server/index.ts
git commit -m "feat: add Hono API with room creation and WebSocket proxy"
```

---

### Task 5: WebSocket Hook

**Files:**
- Create: `src/hooks/useRoomSocket.ts`

This hook encapsulates the WebSocket lifecycle so both `Home.tsx` (waiting modal) and `Game.tsx` (game session) can share it.

- [ ] **Step 1: Write the hook**

Create `src/hooks/useRoomSocket.ts`:

```typescript
import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * Opens a WebSocket to /ws/room/:roomId.
 * Updates the Zustand store with connection events.
 * Calls `onGameStart` when both players are connected.
 *
 * Pass `roomId = null` to skip connecting.
 */
export function useRoomSocket(
  roomId: string | null,
  onGameStart?: (roomId: string) => void,
) {
  const setStatus = useGameStore((s) => s.setStatus);
  const setRoom = useGameStore((s) => s.setRoom);
  const onGameStartRef = useRef(onGameStart);
  onGameStartRef.current = onGameStart;

  useEffect(() => {
    if (!roomId) return;

    setStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/ws/room/${roomId}`,
    );

    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data as string);
      if (data.type === 'connected') {
        setRoom(roomId, data.color);
        setStatus('waiting');
      } else if (data.type === 'game_start') {
        setStatus('playing');
        onGameStartRef.current?.(roomId);
      }
    });

    ws.addEventListener('close', () => {
      setStatus('disconnected');
    });

    return () => {
      ws.close();
    };
  }, [roomId, setStatus, setRoom]);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useRoomSocket.ts
git commit -m "feat: add useRoomSocket hook for WebSocket lifecycle"
```

---

### Task 6: UI Modals

**Files:**
- Create: `src/components/modals/PlayOnlineModal.tsx`
- Create: `src/components/modals/InviteAFriendModal.tsx`
- Create: `src/components/modals/WaitingFriendModal.tsx`

- [ ] **Step 1: Create `PlayOnlineModal`**

Create `src/components/modals/PlayOnlineModal.tsx`:

```tsx
import { Users, ArrowLeft } from 'lucide-react';

interface PlayOnlineModalProps {
  onClose: () => void;
  onInvite: () => void;
}

export function PlayOnlineModal({ onClose, onInvite }: PlayOnlineModalProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
      <div className="flex w-full max-w-[345px] flex-col items-center gap-6 rounded-[24px] border-2 border-[#364153]/50 bg-[#101828]/95 p-8 shadow-2xl">
        <div className="flex w-full items-center">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h2 className="flex-1 text-center font-['Inter'] text-[28px] font-bold text-white">
            Play Online
          </h2>
          <div className="size-10" />
        </div>
        <button
          type="button"
          onClick={onInvite}
          className="flex h-[58px] w-full items-center justify-center gap-3 rounded-[16px] border border-[#364153]/50 bg-[#1e2939]/90 font-['Inter'] text-[16px] font-medium text-white shadow-md"
        >
          <Users className="size-5" />
          Invite a Friend
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `InviteAFriendModal`**

Create `src/components/modals/InviteAFriendModal.tsx`:

```tsx
import { ArrowLeft, Copy } from 'lucide-react';

interface InviteAFriendModalProps {
  roomUrl: string;
  onCopy: () => void;
  onClose: () => void;
}

export function InviteAFriendModal({
  roomUrl,
  onCopy,
  onClose,
}: InviteAFriendModalProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
      <div className="flex w-full max-w-[345px] flex-col items-center gap-6 rounded-[24px] border-2 border-[#364153]/50 bg-[#101828]/95 p-8 shadow-2xl">
        <div className="flex w-full items-center">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h2 className="flex-1 text-center font-['Inter'] text-[28px] font-bold leading-tight text-white">
            Invite a Friend
          </h2>
          <div className="size-10" />
        </div>
        <p className="text-center font-['Inter'] text-[14px] text-[#d1d5dc]">
          Share this link with your opponent:
        </p>
        <div className="w-full overflow-hidden rounded-lg bg-black/40 p-3">
          <p className="select-all truncate font-['Inter'] text-sm text-white">
            {roomUrl}
          </p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="flex h-[58px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#3d6db5] font-['Inter'] text-[16px] font-medium text-white shadow-md"
        >
          <Copy className="size-5" />
          Copy Link
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `WaitingFriendModal`**

Create `src/components/modals/WaitingFriendModal.tsx`:

```tsx
import { useEffect } from 'react';
import { Loader } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

interface WaitingFriendModalProps {
  onCancel: () => void;
}

export function WaitingFriendModal({ onCancel }: WaitingFriendModalProps) {
  const countdown = useGameStore((s) => s.countdown);
  const decrement = useGameStore((s) => s.decrementCountdown);

  useEffect(() => {
    const timer = setInterval(() => decrement(), 1000);
    return () => clearInterval(timer);
  }, [decrement]);

  const minutes = String(Math.floor(countdown / 60)).padStart(2, '0');
  const seconds = String(countdown % 60).padStart(2, '0');

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
      <div className="flex w-full max-w-[345px] flex-col items-center gap-6 rounded-[24px] border-2 border-[#364153]/50 bg-[#101828]/95 p-8 shadow-2xl">
        <h2 className="text-center font-['Inter'] text-[28px] font-bold leading-tight text-white">
          Waiting for Friend
        </h2>
        <Loader className="size-8 animate-spin text-[#d1d5dc]" />
        <p className="text-center font-['Inter'] text-[14px] text-[#d1d5dc]">
          {minutes}:{seconds} remaining
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-[58px] w-full items-center justify-center rounded-[16px] border border-[#364153]/50 bg-[#1e2939]/90 font-['Inter'] text-[16px] font-medium text-white shadow-md"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/modals/
git commit -m "feat: add PlayOnline, InviteAFriend, and WaitingFriend modals"
```

---

### Task 7: Wire Home Page to Modal Flow

**Files:**
- Modify: `src/pages/Home.tsx`

The host user stays on the Home page through the entire modal flow. When `game_start` fires, the hook's callback navigates to `/game/:roomId`.

- [ ] **Step 1: Add imports to Home.tsx**

Add these imports at the top of `src/pages/Home.tsx` (after the existing imports):

```tsx
import { useState, useCallback } from 'react';
import { PlayOnlineModal } from '../components/modals/PlayOnlineModal';
import { InviteAFriendModal } from '../components/modals/InviteAFriendModal';
import { WaitingFriendModal } from '../components/modals/WaitingFriendModal';
import { useRoomSocket } from '../hooks/useRoomSocket';
```

Remove the existing `import type { ReactNode } from 'react';` line (no longer needed — `ReactNode` is used inline in the `MenuButton` prop type).

- [ ] **Step 2: Add state and handlers inside the Home component**

Replace:

```tsx
  const naviate = useNavigate();
```

with:

```tsx
  const navigate = useNavigate();

  type ModalStep = 'none' | 'play_online' | 'invite' | 'waiting';
  const [modalStep, setModalStep] = useState<ModalStep>('none');
  const [roomId, setRoomId] = useState<string | null>(null);
  const roomUrl = roomId ? `${window.location.origin}/game/${roomId}` : '';

  const handleGameStart = useCallback(
    (id: string) => {
      navigate(`/game/${id}`);
    },
    [navigate],
  );

  useRoomSocket(roomId, handleGameStart);

  const handleInvite = async () => {
    const res = await fetch('/api/rooms', { method: 'POST' });
    const data = await res.json();
    setRoomId(data.roomId);
    setModalStep('invite');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(roomUrl);
    setModalStep('waiting');
  };

  const handleCancel = () => {
    setRoomId(null);
    setModalStep('none');
  };
```

- [ ] **Step 3: Wire the Play Online button**

Replace:

```tsx
            <MenuButton
              icon={<Globe className='size-5' />}
              label='Play Online'
            />
```

with:

```tsx
            <MenuButton
              icon={<Globe className='size-5' />}
              label='Play Online'
              onClick={() => setModalStep('play_online')}
            />
```

- [ ] **Step 4: Fix the typo on the Play button**

Replace:

```tsx
              onClick={() => naviate('/game')}
```

with:

```tsx
              onClick={() => navigate('/game')}
```

- [ ] **Step 5: Add modals before the closing `</div>` of the outermost container**

Insert just before the final closing `</div>` of the `Home` component's return:

```tsx
      {modalStep === 'play_online' && (
        <PlayOnlineModal
          onClose={() => setModalStep('none')}
          onInvite={handleInvite}
        />
      )}
      {modalStep === 'invite' && (
        <InviteAFriendModal
          roomUrl={roomUrl}
          onCopy={handleCopy}
          onClose={handleCancel}
        />
      )}
      {modalStep === 'waiting' && (
        <WaitingFriendModal onCancel={handleCancel} />
      )}
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: wire Play Online modal flow in Home page"
```

---

### Task 8: Add Game Route with Room ID Parameter

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/Game.tsx`

- [ ] **Step 1: Add `/game/:roomId` route to App.tsx**

In `src/App.tsx`, replace:

```tsx
      <Route path='/game' element={<Game />} />
```

with:

```tsx
      <Route path='/game' element={<Game />} />
      <Route path='/game/:roomId' element={<Game />} />
```

This keeps the existing offline `/game` route working and adds the online variant.

- [ ] **Step 2: Connect WebSocket in Game.tsx when `roomId` is present**

In `src/pages/Game.tsx`, add these imports after the existing imports:

```tsx
import { useParams } from 'react-router-dom';
import { useRoomSocket } from '../hooks/useRoomSocket';
```

Inside the `Game` component, add after the existing `const [boardWidth, setBoardWidth] = useState<number | undefined>(undefined);` line:

```tsx
  const { roomId } = useParams<{ roomId?: string }>();
  useRoomSocket(roomId ?? null);
```

This connects to the WebSocket when the friend opens the link. No callback needed — the friend is already on the Game page.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx src/pages/Game.tsx
git commit -m "feat: add /game/:roomId route and WebSocket connection on game page"
```

---

### Task 9: Local Dev Proxy for WebSocket

**Files:**
- Modify: `vite.config.ts`
- Modify: `package.json`

During local development, Vite serves the frontend but the Hono worker runs on a separate port via `wrangler dev`. We need Vite to proxy `/api/*` and `/ws/*` requests to the Wrangler dev server.

- [ ] **Step 1: Add proxy config to vite.config.ts**

In `vite.config.ts`, add a `server` block inside the `defineConfig` object (after the `plugins` array, before `test`):

```typescript
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
      '/ws': {
        target: 'http://localhost:8787',
        ws: true,
      },
    },
  },
```

- [ ] **Step 2: Add a `dev:worker` script to package.json**

In `package.json`, add to the `"scripts"` section after the `"dev"` line:

```json
    "dev:worker": "wrangler dev",
```

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts package.json
git commit -m "chore: add Vite proxy and dev:worker script for local development"
```

---

### Task 10: Manual Smoke Test

No code changes in this task — just verification.

- [ ] **Step 1: Start the Wrangler dev server in one terminal**

Run: `pnpm dev:worker`
Expected: Wrangler starts, Durable Object binding is available.

- [ ] **Step 2: Start the Vite dev server in a second terminal**

Run: `pnpm dev`
Expected: Vite starts on `localhost:5173` (or similar).

- [ ] **Step 3: Verify the full flow**

1. Open `http://localhost:5173/` in a browser.
2. Click **"Play Online"** → `PlayOnlineModal` appears.
3. Click **"Invite a Friend"** → `InviteAFriendModal` appears with a URL.
4. Click **"Copy Link"** → `WaitingFriendModal` appears with countdown.
5. Open the copied URL in a second browser tab.
6. Both tabs should navigate to `/game/:roomId` showing the board.

- [ ] **Step 4: Run all tests**

Run: `pnpm test`
Expected: All tests pass.
