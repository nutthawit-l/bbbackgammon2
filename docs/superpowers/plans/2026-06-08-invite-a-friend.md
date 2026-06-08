# Invite a friend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete "Play Online" game room creation flow, including a Hono + Durable Objects backend and the React UI modals from Figma.

**Architecture:** A single Vite application where backend code (Hono) runs on Cloudflare Workers alongside the static frontend. State is managed by Zustand. A `GameRoom` Durable Object handles the WebSocket connections and room lifecycle.

**Tech Stack:** React, Tailwind CSS, Zustand, Hono, Cloudflare Durable Objects, Vitest.

---

### Task 1: Setup Zustand Store

**Files:**
- Create: `src/store/gameStore.ts`
- Create: `src/store/gameStore.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.setState({ status: 'disconnected', roomId: null, playerColor: null, countdown: 600 });
  });

  it('should update connection status', () => {
    useGameStore.getState().setStatus('waiting');
    expect(useGameStore.getState().status).toBe('waiting');
  });

  it('should set room details', () => {
    useGameStore.getState().setRoom('room-123', 'white');
    expect(useGameStore.getState().roomId).toBe('room-123');
    expect(useGameStore.getState().playerColor).toBe('white');
  });

  it('should decrement countdown', () => {
    useGameStore.getState().decrementCountdown();
    expect(useGameStore.getState().countdown).toBe(599);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/store/gameStore.test.ts`
Expected: FAIL with "useGameStore is not defined"

- [ ] **Step 3: Write minimal implementation**

```typescript
import { create } from 'zustand';
import type { PlayerColor } from '../core/constants';

interface GameState {
  status: 'disconnected' | 'connecting' | 'waiting' | 'playing';
  roomId: string | null;
  playerColor: PlayerColor | null;
  countdown: number; // in seconds, default 600 (10:00)
  
  setStatus: (status: GameState['status']) => void;
  setRoom: (roomId: string, color: PlayerColor) => void;
  decrementCountdown: () => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  status: 'disconnected',
  roomId: null,
  playerColor: null,
  countdown: 600,

  setStatus: (status) => set({ status }),
  setRoom: (roomId, playerColor) => set({ roomId, playerColor }),
  decrementCountdown: () => set((state) => ({ countdown: Math.max(0, state.countdown - 1) })),
  reset: () => set({ status: 'disconnected', roomId: null, playerColor: null, countdown: 600 }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/store/gameStore.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/store/gameStore.ts src/store/gameStore.test.ts
git commit -m "feat: setup gameStore for connection state"
```

---

### Task 2: Create GameRoom Durable Object

**Files:**
- Create: `src/server/GameRoom.ts`
- Modify: `wrangler.jsonc` (to configure DO binding)

- [ ] **Step 1: Configure Durable Object in wrangler.jsonc**

Add the following to `wrangler.jsonc`:
```jsonc
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
```

- [ ] **Step 2: Implement GameRoom Class**

```typescript
import { DurableObject } from 'cloudflare:workers';

export class GameRoom extends DurableObject {
  connections: Set<WebSocket> = new Set();
  players: Record<string, 'white' | 'red'> = {};

  async fetch(request: Request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    const { 0: client, 1: server } = new WebSocketPair();
    
    server.accept();
    this.connections.add(server);

    // Randomly assign color if space available
    const currentCount = Object.keys(this.players).length;
    if (currentCount >= 2) {
      server.send(JSON.stringify({ type: 'error', message: 'Room full' }));
      server.close();
      return new Response(null, { status: 101, webSocket: client });
    }

    const assignedColor = currentCount === 0 
      ? (Math.random() > 0.5 ? 'white' : 'red')
      : (Object.values(this.players)[0] === 'white' ? 'red' : 'white');
    
    const playerId = crypto.randomUUID();
    this.players[playerId] = assignedColor;

    server.send(JSON.stringify({ 
      type: 'connected', 
      color: assignedColor 
    }));

    if (Object.keys(this.players).length === 2) {
       this.broadcast(JSON.stringify({ type: 'game_start' }));
    }

    server.addEventListener('close', () => {
      this.connections.delete(server);
      delete this.players[playerId];
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  broadcast(message: string) {
    for (const conn of this.connections) {
      conn.send(message);
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/server/GameRoom.ts wrangler.jsonc
git commit -m "feat: implement GameRoom Durable Object"
```

---

### Task 4: Setup Hono Backend API

**Files:**
- Create: `src/server/index.ts`

- [ ] **Step 1: Write Hono Server Implementation**

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
  try {
    const id = c.env.GAME_ROOM.idFromString(roomId);
    const room = c.env.GAME_ROOM.get(id);
    return room.fetch(c.req.raw);
  } catch (e) {
    return c.json({ error: 'Invalid room ID' }, 400);
  }
});

export default app;
// Also export DO so Cloudflare can find it
export { GameRoom } from './GameRoom';
```

- [ ] **Step 2: Commit**

```bash
git add src/server/index.ts
git commit -m "feat: setup Hono API routes for room creation and websockets"
```

---

### Task 5: Create UI Modals

**Files:**
- Create: `src/components/modals/PlayOnlineModal.tsx`
- Create: `src/components/modals/InviteAFriendModal.tsx`
- Create: `src/components/modals/WaitingFriendModal.tsx`

- [ ] **Step 1: Implement `PlayOnlineModal`**

```tsx
export function PlayOnlineModal({ onClose, onInvite }: { onClose: () => void, onInvite: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
      <div className="flex w-[345px] flex-col items-center gap-6 rounded-[24px] border-2 border-[#364153]/50 bg-[#101828]/95 p-8 shadow-2xl">
        <h2 className="font-['Inter'] text-[36px] font-bold text-white">Play Online</h2>
        <div className="flex w-full flex-col gap-4">
          <button onClick={onInvite} className="h-[58px] w-full rounded-[16px] border border-[#364153]/50 bg-[#1e2939]/90 font-['Inter'] text-[16px] font-medium text-white shadow-md">
            Invite a Friend
          </button>
          <button onClick={onClose} className="text-[#d1d5dc] underline hover:text-white">Cancel</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `InviteAFriendModal`**

```tsx
export function InviteAFriendModal({ roomUrl, onCopy, onClose }: { roomUrl: string, onCopy: () => void, onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
      <div className="flex w-[345px] flex-col items-center gap-6 rounded-[24px] border-2 border-[#364153]/50 bg-[#101828]/95 p-8 shadow-2xl">
        <h2 className="font-['Inter'] text-[36px] font-bold text-white text-center leading-tight">Invite a Friend</h2>
        <p className="text-center font-['Inter'] text-[#d1d5dc]">Share this link with your opponent:</p>
        <div className="w-full bg-black/40 p-3 rounded-lg overflow-hidden">
           <p className="text-white text-sm truncate select-all">{roomUrl}</p>
        </div>
        <button onClick={onCopy} className="h-[58px] w-full rounded-[16px] bg-blue-600 font-['Inter'] text-[16px] font-medium text-white shadow-md">
          Copy Link
        </button>
        <button onClick={onClose} className="text-[#d1d5dc] underline hover:text-white">Cancel</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement `WaitingFriendModal`**

```tsx
import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';

export function WaitingFriendModal({ onCancel }: { onCancel: () => void }) {
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
      <div className="flex w-[345px] flex-col items-center gap-6 rounded-[24px] border-2 border-[#364153]/50 bg-[#101828]/95 p-8 shadow-2xl">
        <h2 className="font-['Inter'] text-[36px] font-bold text-white text-center leading-tight">Waiting Friend</h2>
        <p className="text-center font-['Inter'] text-[#d1d5dc]">Please wait your friend joins.</p>
        <p className="text-center font-['Inter'] text-[#d1d5dc]">{minutes}:{seconds} Remaining</p>
        <button onClick={onCancel} className="h-[58px] w-full rounded-[16px] border border-[#364153]/50 bg-[#1e2939]/90 font-['Inter'] text-[16px] font-medium text-white shadow-md">
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
git commit -m "feat: implement play online UI modals"
```

---

### Task 6: Integrate Flow in Home.tsx

**Files:**
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Add Modal State and API Call**

Update `src/pages/Home.tsx` to handle the flow:

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayOnlineModal } from '../components/modals/PlayOnlineModal';
import { InviteAFriendModal } from '../components/modals/InviteAFriendModal';
import { WaitingFriendModal } from '../components/modals/WaitingFriendModal';

// (Inside Home component, before return)
type ModalState = 'none' | 'play_online' | 'invite' | 'waiting';
const [modalState, setModalState] = useState<ModalState>('none');
const [roomUrl, setRoomUrl] = useState('');
const navigate = useNavigate();

const handleInvite = async () => {
  const res = await fetch('/api/rooms', { method: 'POST' });
  const data = await res.json();
  const url = `${window.location.origin}/game/${data.roomId}`;
  setRoomUrl(url);
  setModalState('invite');
};

const handleCopy = () => {
  navigator.clipboard.writeText(roomUrl);
  setModalState('waiting');
};

// ... inside the JSX return, update the "Play Online" button:
<MenuButton
  icon={<Globe className='size-5' />}
  label='Play Online'
  onClick={() => setModalState('play_online')}
/>

// ... add at the bottom of the main container:
{modalState === 'play_online' && (
  <PlayOnlineModal onClose={() => setModalState('none')} onInvite={handleInvite} />
)}
{modalState === 'invite' && (
  <InviteAFriendModal roomUrl={roomUrl} onCopy={handleCopy} onClose={() => setModalState('none')} />
)}
{modalState === 'waiting' && (
  <WaitingFriendModal onCancel={() => setModalState('none')} />
)}
```
*(Note: Route navigation to Game board happens automatically when friend joins via WebSocket, implemented in the next task).*

- [ ] **Step 2: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: integrate room creation flow in Home"
```

---

### Task 7: WebSocket Connection in Game Page

**Files:**
- Modify: `src/pages/Game.tsx` (Assumes it exists, create if not)

- [ ] **Step 1: Connect to WebSocket and route**

```tsx
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { BoardCanvas } from '../pixi/BoardCanvas'; // Assumed component

export function Game() {
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const setRoom = useGameStore((s) => s.setRoom);
  const setStatus = useGameStore((s) => s.setStatus);
  const status = useGameStore((s) => s.status);

  useEffect(() => {
    if (!roomId) return;

    setStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/room/${roomId}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'connected') {
        setRoom(roomId, data.color);
        setStatus('waiting');
      } else if (data.type === 'game_start') {
        setStatus('playing');
        // If we are on Home page (waiting modal), redirect!
        if (window.location.pathname === '/') {
          navigate(`/game/${roomId}`);
        }
      } else if (data.type === 'error') {
        alert(data.message);
        navigate('/');
      }
    };

    return () => ws.close();
  }, [roomId, setRoom, setStatus, navigate]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#2d5a9f]">
      {status === 'waiting' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 text-white text-2xl font-bold">
           Waiting for opponent to connect...
        </div>
      )}
      <BoardCanvas /> 
    </div>
  );
}
```

*(Note: If the host is waiting on the Home page `WaitingFriendModal`, we need a global listener or we just push them to the Game page immediately upon creating the room. The spec says "Both players are immediately routed to `/game/:roomId`" when game starts. To support this cleanly, the host should probably establish the WS connection while still on the Home page, OR we route them immediately and they wait there. Based on the spec, let's route them immediately to the Game page after copying the link! Let's fix that below).*

- [ ] **Step 2: Correct routing in `Home.tsx`**

In `src/pages/Home.tsx` from Task 6, update `handleCopy`:
```tsx
const handleCopy = () => {
  navigator.clipboard.writeText(roomUrl);
  // Route immediately to Game page
  const id = roomUrl.split('/').pop();
  navigate(`/game/${id}`);
};
```
*(This way, `Game.tsx` mounts, connects to WS, and shows its own waiting overlay OR we bring the `WaitingFriendModal` over to `Game.tsx` if we want exact Figma match on the game screen).*

- [ ] **Step 3: Commit**

```bash
git add src/pages/Game.tsx src/pages/Home.tsx
git commit -m "feat: implement websocket connection and routing"
```
