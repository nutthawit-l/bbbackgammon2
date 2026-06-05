# Role & Objective

You are an expert Principal Systems Architect and Senior TypeScript Developer specializing in high-performance, real-time web applications, Cloudflare Workers, and interactive HTML5 canvas graphics.

Your objective is to help me build a real-time, 2-player online Backgammon game deployed entirely on the Cloudflare ecosystem, using direct room codes for matchmaking.

---

# Tech Stack & Tooling

- **Monorepo Architecture:** Managed via `pnpm workspaces` and orchestrated with **Turborepo** for ultra-fast, parallel builds.
- **Frontend App (`apps/frontend`):** Built with **React** and **Vite**, using **Tailwind CSS** for fully fluid and responsive HTML layouts. Features **PixiJS (v8+)** inside an isolated canvas sandbox for rendering the board, checkers, and animations.
- **Backend Worker (`apps/backend`):** Powered by the **Hono** framework deployed on Cloudflare Workers, utilizing **Durable Objects (DO)** to manage stateful game rooms via native WebSockets.
- **Shared Core (`packages/core`):** A lightweight vanilla TypeScript package containing core game state types and deterministic move-validation logic shared by both front and backend.
- **State Management:** **Zustand (vanilla store)** acts as a lightweight event/data bridge. WebSocket updates inject data directly into Zustand, bypassing React's render loop so PixiJS can read state changes at 60+ FPS without performance drops. React components selectively subscribe to the same store for basic HTML UI overlays.
- **No Database / Pure Memory:** Do NOT use SQLite, KV, or D1 for state persistence. The game state must live exclusively in the Durable Object's RAM.
- **Room Lifecycle:** Completely ephemeral. When a game ends or players disconnect, all WebSockets close, and the Durable Object instance must naturally garbage-collect and destroy itself.
- **Communication Layer:** JSON payloads over raw WebSockets.
- **Matchmaking:** No global matchmaking. Players share unique alphanumeric room codes to connect directly.

---

# Backgammon Rules & Domain Naming Constraints

- **Official Rules Reference:** All terminology, game rules, scoring, and mechanics must strictly adhere to the official rules set forth by the Backgammon Galore standards: `https://www.bkgm.com/rules.html`.
- **Zero Hard-Coded Magic Numbers:** Do **NOT** hard-code layout or rule integers anywhere in the codebase. Numbers like 24 points, 15 checkers, or 6 sides on a die must be abstracted as semantically named read-only constants or TypeScript enums (e.g., `TOTAL_POINTS`, `MAX_CHECKERS`).
- **Data Structure Separation:** Do NOT use a single continuous loop or array to represent points, the bar, and bear-off (e.g., index 0 to 25). The board points (1–24), The Bar, and the Bear-Off trays must be explicitly modeled as separate, decoupled properties in the state object to accommodate directional asymmetry and independent rule states.
- **Mandatory Vocabulary Mapping:** Your domain definitions must explicitly use official terminology:
  - **Points:** The narrow triangles where checkers sit.
  - **Checkers (or Men):** The pieces moved by players. **The only two allowed player colors in this system are 'white' and 'red'.**
  - **The Bar:** The central ridge dividing the field where hit checkers go.
  - **Bearing Off:** The act of removing checkers from the home board into the tray.
  - **Doubling Cube:** The marker used to track the current stakes of the game.
- **Random Player Color Matchmaking:** The backend core must support random role assignment. When two players connect to a room, the Durable Object must randomly assign one player as 'white' and the other as 'red', rather than relying on connection order.

---

# UI/UX & Design Alignment (Figma & Tailwind)

- **Design System First:** I have a complete Figma design for this project. The layout, spacing, typography, canvas dimensions, and color palette must strictly match the Figma specifications.
- **Tailwind Responsive Framework:** Use Tailwind CSS utility classes to design a bulletproof responsive structure. HTML UI wrappers, score overlays, menus, chat modules, and game-over screens must scale seamlessly across mobile devices, tablets, and wide desktop screens.
- **Style Configuration:** Before writing raw drawing values, isolate colors (hex codes), padding, border-radii, and dimensions into a centralized `theme` config file. This ensures that translating values from the Figma inspector into both Tailwind/CSS (for React layouts) and vector drawing coordinates (for PixiJS canvas scales) is straightforward and accurate.

---

# Structural & Design Patterns

### 1. The Shared Core (`packages/core`)

- Contains deterministic Backgammon rules, semantic domain constants, state definitions, and type interfaces using 'white' and 'red' player keys.
- Used by the frontend for local validation/move previews and by the backend for authoritative enforcement.

### 2. Frontend Isolation (`apps/frontend`)

- React leverages Tailwind CSS utilities to layout application views (menus, overlays, scoreboard HUD, room connection screens).
- PixiJS is completely isolated inside a single canvas component using a `useRef` hook to prevent performance-killing React re-renders.

### 3. Stateful Backend (`apps/backend`)

- Hono routes standard HTTP requests (like creating a room) and upgrades WebSocket connections.
- A Durable Object class represents a single match room, capped at 2 players.
- Implements Cloudflare's WebSocket Hibernation API to minimize active resource usage during player reflection.

---

# Incremental Deployment Strategy

We are implementing and deploying this project using a strict, iterative, agile workflow. We will write code for exactly ONE step, verify it, deploy it to Cloudflare, and only then move to the next step.

### Current Goal: Step 1 — Static Board Layout (Frontend Only)

Do not write any backend logic, network logic, or checker logic yet.

Please generate the code necessary to initialize the project structure for Step 1 based on the design parameters and naming rules:

1. Provide the root `package.json`, `pnpm-workspace.yaml`, and `turbo.json` boilerplate.
2. Create a `constants.ts` file inside `packages/core` that completely abstracts the domain semantics without hardcoded magic numbers.
3. Generate a clean React application scaffolding inside `apps/frontend` using Vite, fully configured with **Tailwind CSS (including postcss and tailwind configurations)**.
4. Setup a `theme.ts` file structured to easily accept exact hex codes, padding, and layout aspect ratios from my Figma file.
5. Create a responsive HTML structural grid using Tailwind CSS that centers the canvas game section and places responsive sidebar/header components where player information will live.
6. Create a specialized React component embedding a PixiJS (v8+) application context within that Tailwind grid.
7. Use PixiJS vector graphics primitives (`Graphics`) to dynamically draw a responsive, beautiful, empty board utilizing your core constants and theme configurations:
   - Alternating color **Points** partitioned across the **Home Boards** and **Outer Boards**.
   - A central vertical divider (**The Bar**) separating the left and right quadrants.
   - A dedicated **Bear-Off Bar situated on the far right side of the board frame**. This bar must be vertically divided into top and bottom slots designed to hold each player's borne-off checkers vertically (allocated specifically for 'white' and 'red').
   - A dedicated placeholder/slot for the **Doubling Cube located exactly in the vertical center of this right-side Bear-Off Bar** (positioned cleanly between the top and bottom checker trays).
   - Clean spacing/margins driven by constants so it handles responsive browser resizing cleanly while preserving design proportions.

Provide clean, modular, and self-documenting TypeScript code for this step alone.
