# Invite a friend Design Spec

## Overview
This document specifies the design for the "Play Online" game room creation flow, connecting a React/Vite frontend to a Cloudflare Workers backend (Hono + Durable Objects).

## Architecture
- **Structure:** Single Vite application where backend code lives in the `src/server/` directory. Wrangler is used to build and deploy both.
- **Backend Framework:** Hono on Cloudflare Workers.
- **State Persistence:** Cloudflare Durable Objects (DO) for managing ephemeral game room state.
- **Matchmaking:** Direct room links; no global matchmaking.

## Backend Design (Hono & Durable Objects)
1. **Durable Object (`GameRoom`):**
   - Manages the lifecycle of a single game room (capped at 2 players).
   - Holds state: timer, player connections, and color assignments ('white' or 'red').
2. **API Endpoint (`POST /api/rooms`):**
   - Instantiates a new `GameRoom` Durable Object.
   - Returns a unique `roomId`.
3. **WebSocket Endpoint (`/ws/room/:roomId`):**
   - Upgrades incoming connections to WebSockets.
   - Upon connection, the DO checks capacity. If valid, randomly assigns the player a color ('white' or 'red') and broadcasts it.

## State Management (Zustand)
A lightweight Zustand store (`src/store/gameStore.ts`) will manage:
- Connection Status: `connecting`, `waiting`, `playing`.
- Room Information: `roomId`, generated URL.
- Player State: assigned color.
- Timer: 10:00 countdown synchronization.

## UI / UX Flow (Frontend)
The flow starts from the `Home.tsx` page and utilizes Figma components to match the design system exactly.

1. **Initiate:** User clicks **"Play Online"** on the Home page.
2. **Select Mode:** The `PlayOnlineModal` (Figma ID: `55:938`) appears over the Home screen.
3. **Create Room:** User clicks **"Invite a friend"**. The frontend calls `POST /api/rooms` to create the room.
4. **Share Link:** Upon success, the `InviteAFriendModal` (Figma ID: `55:939`) appears, displaying the generated room URL.
5. **Wait for Opponent:** User clicks **"Copy Link"**. The modal transitions to the `WaitingFriendModal` (Figma ID: `59:887`), showing a 10:00 countdown timer.
6. **Game Start:** When the friend joins via the URL and the WebSocket connection is established for both players, the backend broadcasts a ready signal. Both players are immediately routed to `/game/:roomId` to view the `<BoardCanvas />`.

## Figma Integration
During implementation, the exact styles, typography, and spacing must be pulled from the provided Figma URL (`7or2mH8PehFfpR7d8y2c4N`) using the following Node IDs:
- `PlayOnlineModal`: 55:938
- `InviteAFriendModal`: 55:939
- `WaitingFriendModal`: 59:887
- `GameTable`: 55:930 (as the base for the board layout)
