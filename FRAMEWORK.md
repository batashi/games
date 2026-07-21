# Project Framework — Omani Kids Web Game Platform

**Version:** 1.0  
**Date:** 2026-07-21  
**Purpose:** Technical blueprint for evolving the prototype into a production-ready platform of 20 culturally-themed web games for Omani children.

---

## 1. Vision & Scope

Build a safe, performant, and culturally authentic browser-based game platform for children aged 7–12. The platform supports:

- Single-player and online 1v1 games.
- Arabic-first UI with full RTL support.
- Child-safe communication (preset reactions only).
- Cross-device play on desktop and tablet.
- Score persistence, simple player profiles, and leaderboards.

---

## 2. Recommended Tech Stack

### 2.1 Core Frontend

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Build Tool | **Vite** | Fast HMR, simple config, PWA plugin, excellent TypeScript support. |
| Language | **TypeScript** | Type safety for game logic, network messages, and state. Reduces bugs as the catalogue grows. |
| App Shell | **Svelte 5** or **Vue 3** | Lightweight, reactive, excellent RTL/i18n support, small bundle size. |
| Game Engine | **Phaser 3** | Mature 2D engine with physics, scenes, input abstraction, audio, camera effects, and proven mobile performance. |
| Styling | CSS custom properties + optional **Tailwind CSS** | Preserve the existing Omani palette; add utility classes for faster UI development. |

### 2.2 Backend & Multiplayer

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Game Server | **Colyseus** | Authoritative multiplayer framework with TypeScript schemas, room management, and reconnection. |
| Database / Auth | **Supabase** | PostgreSQL, auth, realtime presence, and leaderboards with a generous free tier. |
| Alternative | **Socket.io + Express + Redis** | Use if you prefer lower-level control and custom logic. |

### 2.3 Tooling

| Category | Tool |
|----------|------|
| Unit Testing | **Vitest** |
| E2E Testing | **Playwright** |
| Linting | **ESLint** + **Prettier** |
| PWA | **Vite PWA plugin** |
| Asset Pipeline | Vite built-in + Aseprite/Figma for art |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────┐
│              Browser Client                 │
│  ┌─────────────┐      ┌─────────────────┐  │
│  │  App Shell  │      │  Phaser Game    │  │
│  │ (Svelte/Vue)│◄────►│    Manager      │  │
│  └─────────────┘      └────────┬────────┘  │
│                                │           │
│                       ┌────────┴────────┐  │
│                       │   Game Scenes   │  │
│                       │ (1 per game)    │  │
│                       └────────┬────────┘  │
└────────────────────────────────┼────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │    Colyseus Server      │
                    │  (rooms, state, auth)   │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │       Supabase          │
                    │  profiles, scores, auth │
                    └─────────────────────────┘
```

### 3.1 Separation of Concerns

- **App Shell** handles routing, navigation, modals, user profile, audio settings, and online lobby.
- **Game Manager** instantiates Phaser scenes, handles pause/resume, cleanup, and communication between shell and game.
- **Game Scenes** contain only game logic, rendering, and local input.
- **Network Layer** (Colyseus client) is injected into scenes that need online play; scenes never talk to the server directly.
- **Server** validates all moves and owns authoritative state.

---

## 4. Project Structure

```
/root
├── public/                     # Static assets
│   ├── assets/
│   │   ├── images/
│   │   ├── audio/
│   │   ├── sprites/
│   │   └── fonts/
│   └── manifest.json
├── src/
│   ├── main.ts                 # Vite entry point
│   ├── App.svelte              # Root shell component
│   ├── config/
│   │   ├── games.ts            # Game catalogue
│   │   ├── theme.css           # CSS variables
│   │   └── constants.ts        # Shared constants
│   ├── shell/                  # App shell components
│   │   ├── Header.svelte
│   │   ├── GameGrid.svelte
│   │   ├── ModeModal.svelte
│   │   └── OnlinePanel.svelte
│   ├── core/                   # Shared game infrastructure
│   │   ├── GameManager.ts
│   │   ├── AudioManager.ts
│   │   ├── InputManager.ts
│   │   ├── StorageManager.ts
│   │   └── NetworkManager.ts
│   ├── games/                  # One folder per game
│   │   ├── runner/
│   │   │   ├── RunnerScene.ts
│   │   │   ├── Obstacle.ts
│   │   │   └── config.ts
│   │   ├── tictactoe/
│   │   │   ├── TicTacToeScene.ts
│   │   │   └── ai.ts
│   │   └── fortBattle/
│   │       ├── FortBattleScene.ts
│   │       ├── Arrow.ts
│   │       └── Fort.ts
│   ├── server/                 # Colyseus server (can be separate repo)
│   │   ├── index.ts
│   │   ├── rooms/
│   │   │   ├── TicTacToeRoom.ts
│   │   │   └── FortBattleRoom.ts
│   │   └── schemas/
│   │       ├── TicTacToeState.ts
│   │       └── FortBattleState.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── helpers.ts
├── tests/
│   ├── unit/
│   └── e2e/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
└── README.md
```

---

## 5. Game Development Guidelines

### 5.1 Every Game Is a Phaser Scene

```ts
// src/games/runner/RunnerScene.ts
import { Scene } from 'phaser';

export class RunnerScene extends Scene {
  constructor() {
    super({ key: 'RunnerScene' });
  }

  create() {
    // Initialize world, player, obstacles
  }

  update(time: number, delta: number) {
    // Game loop
  }
}
```

### 5.2 Game Configuration Contract

Every game exports a config object consumed by the Game Manager:

```ts
export const runnerConfig: GameConfig = {
  id: 'frankincense',
  name: 'مغامرة جامع اللبان',
  icon: '🏃‍♂️',
  supportsSingle: true,
  supportsOnline: false,
  sceneKey: 'RunnerScene',
  preloadAssets: [...],
};
```

### 5.3 Design Principles

1. **Cultural authenticity:** Use Omani visuals, colors, and motifs in sprites, backgrounds, and sound effects.
2. **Accessible difficulty:** Target age 7–12. Avoid twitch mechanics that require adult reflexes.
3. **Short sessions:** Aim for 1–3 minute play sessions.
4. **Clear feedback:** Every action should have visual and audio feedback.
5. **Touch-first:** All games must be fully playable on a 10-inch tablet without a keyboard.

---

## 6. Multiplayer Architecture

### 6.1 Authoritative Server Model

The server is the single source of truth. Clients send inputs/intents, the server validates them, updates state, and broadcasts changes.

```
Client A          Colyseus Room          Client B
   │                     │                    │
   │── move(index) ─────►│                    │
   │                     │── validate move ──►│
   │                     │◄── valid ──────────│
   │                     │                    │
   │◄── state update ────│── state update ───►│
```

### 6.2 Colyseus Schema Example: Tic-Tac-Toe

```ts
// server/schemas/TicTacToeState.ts
import { Schema, type, ArraySchema } from '@colyseus/schema';

export class TicTacToeState extends Schema {
  @type(['string'])
  board: ArraySchema<string> = new ArraySchema<string>(null, null, ...);

  @type('string')
  currentTurn: string = 'X';

  @type('string')
  winner: string = '';

  @type(['number'])
  winLine: ArraySchema<number> = new ArraySchema<number>();
}
```

### 6.3 Network Message Validation Rules

1. Reject messages from clients not in the room.
2. Reject moves when it is not the sender’s turn.
3. Reject out-of-bounds indices or invalid coordinates.
4. Reject duplicate messages with stale sequence numbers.
5. Never trust the client with score, health, or win state.

---

## 7. State Management

### 7.1 App-Level State

Use the framework’s reactive stores:

- **Svelte:** `writable` / `readable` stores
- **Vue:** `ref` / `reactive` / Pinia

Store only global UI state: current user, current game, audio settings, online status.

### 7.2 Game-Level State

Keep game state inside the Phaser scene. Expose only what the shell needs through events:

```ts
this.events.emit('score', { value: 120 });
this.events.emit('gameOver', { winner: 'left' });
```

### 7.3 Server State

Colyseus schemas are the authoritative source for online games. Clients mirror server state and interpolate/predict only for visual smoothness.

---

## 8. Child Safety & Security

### 8.1 Communication

- **No free text chat.** Only preset emoji/phrase reactions.
- If voice or text is ever added, it must be moderated and opt-in by a guardian.

### 8.2 Multiplayer Rooms

- Use random, non-sequential room IDs (e.g., 8-character alphanumeric).
- Implement room capacity limits and kick inactive players.
- Allow players to report or leave a room instantly.

### 8.3 Data Privacy

- Collect minimal data: nickname (optional), avatar, scores.
- Store no personal identifiers for children under 13 without guardian consent.
- Comply with Oman’s data protection regulations and COPPA/GDPR if serving outside Oman.

### 8.4 Client-Side Protections

- Validate all user inputs (room codes, nicknames).
- Sanitize any text rendered in the DOM.
- Serve over HTTPS only.

---

## 9. Audio & Assets

### 9.1 Audio Strategy

- Keep generated Web Audio for UI sounds (clicks, pops).
- Use compressed assets (OGG/WebM + MP3 fallback) for music and cultural SFX.
- Provide a master mute toggle and per-game volume controls.

### 9.2 Art Pipeline

- Create a shared asset library: Omani forts, desert dunes, palm trees, camels, traditional dress, etc.
- Use texture atlases for performance.
- Optimize images to WebP/AVIF where supported.

---

## 10. Testing Strategy

### 10.1 Unit Tests (Vitest)

- Win detection for Tic-Tac-Toe.
- AI move selection.
- Network message validators.
- Score calculation and leaderboard sorting.

### 10.2 E2E Tests (Playwright)

- Launch a game from the home grid.
- Host a room and join with a second tab.
- Complete a full online match.
- Verify mute and fullscreen buttons.

### 10.3 Manual QA

- Test on real tablets (iPad + Android).
- Test on slow networks (3G throttle).
- Test RTL layout and Arabic text rendering.

---

## 11. Migration Roadmap

### Phase 1: Foundation (Weeks 1–2)
1. Initialize Vite + TypeScript project.
2. Set up ESLint, Prettier, Vitest.
3. Port global styles and CSS variables.
4. Create the App Shell component.

### Phase 2: First Phaser Game (Weeks 3–4)
1. Integrate Phaser 3.
2. Migrate **Tic-Tac-Toe** to a Phaser scene.
3. Add Svelte/Vue modals for mode selection.

### Phase 3: Authoritative Multiplayer (Weeks 5–7)
1. Set up Colyseus server.
2. Migrate Tic-Tac-Toe online play to Colyseus.
3. Add Supabase auth and profiles.

### Phase 4: Migrate Remaining Games (Weeks 8–16)
1. Migrate Runner and Fort Battle to Phaser.
2. Implement online play for Fort Battle.
3. Add one new game every 1–2 weeks.

### Phase 5: Polish & Launch (Weeks 17–20)
1. Add PWA support.
2. Add leaderboards and achievements.
3. Comprehensive testing and performance optimization.
4. Production deployment.

---

## 12. Deployment

### 12.1 Frontend

- Static hosting: **Vercel**, **Netlify**, **Cloudflare Pages**, or **GitHub Pages**.
- Ensure HTTPS is enforced.

### 12.2 Backend

- Colyseus server on **Node.js**.
- Host on **Railway**, **Render**, **Fly.io**, or a VPS.
- Use Redis for presence/room discovery if scaling beyond one process.

### 12.3 Database

- Supabase PostgreSQL for profiles, scores, and leaderboards.
- Regular backups and row-level security policies.

---

## 13. Code Quality Standards

1. **TypeScript strict mode** enabled.
2. **No `any` types** except in narrowly justified cases.
3. **Component/scene files** are small and focused (< 300 lines when possible).
4. **Shared utilities** live in `src/core/`, not duplicated across games.
5. **All network messages** are typed and validated.
6. **Commit messages** in English or Arabic consistently; choose one and document it.
7. **Pull requests** require passing tests and code review.

---

## 14. Key Decisions Log

| Decision | Choice | Reason |
|----------|--------|--------|
| Game engine | Phaser 3 | Best balance of features, maturity, and mobile performance for 2D games. |
| App framework | Svelte 5 / Vue 3 | Lightweight, reactive, excellent RTL support. |
| Multiplayer | Colyseus | Authoritative server prevents cheating and supports child-safe room management. |
| Backend data | Supabase | Integrated auth + PostgreSQL + realtime reduces backend work. |
| Build tool | Vite | Fast, modern, simple configuration, PWA-ready. |
| Styling | CSS vars + optional Tailwind | Preserves existing design system while improving productivity. |

---

## 15. Next Immediate Actions

1. Decide between **Svelte 5** and **Vue 3** based on team familiarity.
2. Initialize the Vite + TypeScript + chosen framework project.
3. Migrate the existing CSS variables into the new project.
4. Set up Phaser 3 and render a placeholder scene.
5. Write a Colyseus schema for Tic-Tac-Toe and run a local server.

---

*This document should be treated as a living framework. Update it as the project evolves and as the team makes new technical decisions.*
