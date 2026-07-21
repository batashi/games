# Project Framework — GCC Kids Web Game Platform

**Version:** 1.0  
**Date:** 2026-07-21  
**Purpose:** Technical blueprint for evolving the prototype into a production-ready platform of 20 culturally-themed web games for children across the Gulf Cooperation Council (GCC).

---

## Table of Contents

1. [Vision & Scope](#1-vision--scope)
2. [Recommended Tech Stack](#2-recommended-tech-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Project Structure](#4-project-structure)
5. [Game Development Guidelines](#5-game-development-guidelines)
6. [Multiplayer Architecture](#6-multiplayer-architecture)
7. [State Management](#7-state-management)
8. [Child Safety & Security](#8-child-safety--security)
9. [Audio & Assets](#9-audio--assets)
10. [Graphics & Animation](#10-graphics--animation)
11. [Testing Strategy](#11-testing-strategy)
12. [Migration Roadmap](#12-migration-roadmap)
13. [Deployment](#13-deployment)
14. [Code Quality Standards](#14-code-quality-standards)
15. [Key Decisions Log](#15-key-decisions-log)
16. [Operations, Analytics & Compliance](#16-operations-analytics--compliance)
17. [Play Modes](#17-play-modes)
18. [Studio Production Guide](#18-studio-production-guide)
19. [Cross-Device Development & Input Guidelines](#19-cross-device-development--input-guidelines)
20. [Next Immediate Actions](#20-next-immediate-actions)

---

## 1. Vision & Scope

Build a safe, performant, and culturally authentic browser-based game platform for children aged 7–12 across the GCC (Bahrain, Kuwait, Oman, Qatar, Saudi Arabia, UAE). The platform celebrates shared Gulf heritage while honoring each country's unique identity, and supports:

- Single-player, local hotseat, and online games.
- Online 1v1 and private larger rooms: free-for-all (3–6 players) and team vs team (2v2, 3v3) where appropriate.
- Arabic-first UI with full RTL support.
- Child-safe communication (preset reactions only).
- Cross-device play on desktop, tablet, and mobile.
- Score persistence, simple player profiles, and leaderboards.

### 1.1 Target Audience

| Attribute | Definition |
|-----------|------------|
| **Primary age range** | 7–12 years old |
| **Maximum target age** | 12 years old (content, mechanics, and safety controls are designed for pre-teens) |
| **Secondary users** | Parents and teachers (dashboards, classroom mode, purchase approval) |
| **Region** | GCC: Bahrain, Kuwait, Oman, Qatar, Saudi Arabia, UAE |
| **Devices** | Tablets first, then desktop and mobile |

**Implications for design:**
- Mechanics should be simple enough for a 7-year-old but offer enough depth to keep a 12-year-old engaged.
- Reading level and UI copy must suit children who are still developing literacy in Arabic and English.
- No free text chat, no open public lobbies, and no high-stakes competitive mechanics that attract older players.
- Parental controls and consent flows are required because the core audience is under 13.

---

## 2. Recommended Tech Stack

### 2.1 Core Frontend

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Build Tool | **Vite** | Fast HMR, simple config, PWA plugin, excellent TypeScript support. |
| Language | **TypeScript** | Type safety for game logic, network messages, and state. Reduces bugs as the catalogue grows. |
| App Shell | **Svelte 5** or **Vue 3** | Lightweight, reactive, excellent RTL/i18n support, small bundle size. |
| Game Engine | **Babylon.js** | Mature web 3D engine with physics, animation, particles, GUI, audio, input abstraction, and proven browser/tablet performance. Supports both low-poly and advanced PBR workflows. |
| Styling | CSS custom properties + optional **Tailwind CSS** | Preserve the existing Gulf palette; add utility classes for faster UI development. |

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

### 2.4 Alternative Engines

Babylon.js is the studio's default 3D engine. The following alternatives are approved only if a specific game or team constraint demands them.

| Engine | Best For | Bundle Size | Mobile Performance | Learning Curve | Licensing |
|--------|----------|-------------|-------------------|----------------|-----------|
| **Babylon.js** | Full web 3D games, strong TypeScript support | Medium–Large | Good with WebGL 2.0; test on Tier 1 tablets | Moderate | Apache-2.0 |
| **PlayCanvas** | Web-first 3D, built-in publishing | Small–Medium | Excellent; optimized for mobile browsers | Low–Moderate | MIT (engine) + proprietary tools |
| **Three.js** | Custom 3D experiences, maximum control | Small core, grows with addons | Variable; requires manual optimization | Moderate–High | MIT |
| **Unity WebGL** | High-fidelity 3D, native-mobile fallback | Very large | Poor on low-end tablets; long load times | High | Proprietary / subscription |

**Aldoolab guidance:**
- Default to **Babylon.js** for all new games.
- Use **PlayCanvas** if the team needs a lighter engine and faster iteration for a specific title.
- Use **Three.js** only if the project needs custom rendering and the team can afford to build its own tooling.
- Avoid **Unity WebGL** unless the game is also shipping as a native mobile app.
- Backend (Colyseus/Supabase), state management, and deployment patterns remain the same regardless of engine.

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────┐
│              Browser Client                 │
│  ┌─────────────┐      ┌─────────────────┐  │
│  │  App Shell  │      │  Babylon.js     │  │
│  │ (Svelte/Vue)│◄────►│  Game Manager   │  │
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
- **Game Manager** owns the Babylon.js engine instance and instantiates/destroys game scenes, cameras, lights, and render loops. It handles pause/resume, cleanup, and communication between shell and game.
- **Game Scenes** contain only game logic, 3D scene graph, rendering, and local input.
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
│   │   ├── models/               # 3D models (GLB/GLTF)
│   │   ├── textures/             # 3D textures (KTX2/WebP/PNG)
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
│   │   ├── EngineManager.ts    # Babylon.js engine singleton
│   │   ├── GameManager.ts
│   │   ├── AudioManager.ts
│   │   ├── InputManager.ts
│   │   ├── StorageManager.ts
│   │   └── NetworkManager.ts
│   ├── games/                  # One folder per game
│   │   ├── runner/
│   │   │   ├── RunnerGame.ts   # Babylon scene + game logic
│   │   │   ├── Obstacle.ts
│   │   │   └── config.ts
│   │   ├── tictactoe/
│   │   │   ├── TicTacToeGame.ts
│   │   │   └── ai.ts
│   │   └── fortBattle/
│   │       ├── FortBattleGame.ts
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

### 4.1 Isolation Rules for Solo Development

To keep the platform maintainable by a small team or a single developer, every game must be self-contained. No game should depend on another game's code, and platform-wide changes should not break individual games.

**File isolation:**
- One folder per game under `src/games/[game-id]/`.
- Each game exports a single `GameConfig` object consumed by the Game Manager.
- Game logic lives inside the game's Babylon scene; shared helpers live in `src/core/`.
- Do not import between `src/games/*` folders.

**Runtime isolation:**
- The Game Manager creates and destroys the scene when entering or leaving a game.
- Scenes clean up their own meshes, materials, textures, lights, cameras, observables, and audio in `dispose()`.
- Global state (audio, user, online status) is read-only inside scenes; scenes emit events for the shell to handle.

**Asset isolation:**
- Each game has its own asset manifest or preload list.
- Shared cultural assets live in `public/assets/common/`; game-specific assets live in `public/assets/games/[game-id]/`.
- Lazy-load game assets only when the game is selected.

**Contract over coupling:**
- Games communicate with the shell only through the `GameConfig` contract and emitted events.
- Online games communicate with the server only through the typed Network Manager.
- Changing one game's scene must never require changes to another game.

---

## 5. Game Development Guidelines

### 5.1 Every Game Is a Babylon Scene

```ts
// src/games/runner/RunnerGame.ts
import { Scene, UniversalCamera, Vector3, HemisphericLight } from '@babylonjs/core';

export class RunnerGame {
  scene: Scene;

  constructor(engine, canvas) {
    this.scene = new Scene(engine);
    const camera = new UniversalCamera('camera', new Vector3(0, 5, -10), this.scene);
    camera.setTarget(Vector3.Zero());
    new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
  }

  update() {
    // Game loop; called by the render loop
  }

  dispose() {
    this.scene.dispose();
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
  gameKey: 'RunnerGame',
  preloadAssets: [...],
};
```

### 5.3 Design Principles

1. **Cultural authenticity:** Use Gulf visuals, shared colors, and country-specific motifs in 3D models, materials, environments, and sound effects.
2. **Accessible difficulty:** Target age 7–12. Avoid twitch mechanics that require adult reflexes.
3. **Short sessions:** Aim for 1–3 minute play sessions.
4. **Clear feedback:** Every action should have visual and audio feedback.
5. **Touch-first:** All games must be fully playable on a 10-inch tablet without a keyboard.

### 5.4 Babylon.js Standards & Constraints

Babylon.js is the studio's chosen 3D game engine. The following rules keep the catalogue consistent, performant, and maintainable across both simple low-poly and advanced PBR workflows.

#### 5.4.1 Version & Dependency Policy

- Pin Babylon.js to a specific version in `package.json` (e.g., `"@babylonjs/core": "7.x.x"`).
- Use tree-shakable `@babylonjs/core` imports to keep bundle size down.
- Do not upgrade Babylon.js mid-sprint. Schedule upgrades during dedicated refactoring weeks.
- Only approved packages may be used:
  - `@babylonjs/core`, `@babylonjs/gui`, `@babylonjs/loaders` for core, UI, and model loading.
  - `@babylonjs/materials` or `@babylonjs/procedural-textures` when a game explicitly needs them.
  - `@babylonjs/inspector` for development only; exclude from production builds.

#### 5.4.2 Bundle Size Targets

| Budget | Target |
|--------|--------|
| Babylon.js core (gzipped) | < 1.5 MB |
| Per-game code | < 50 KB |
| Per-game asset bundle | < 8 MB for 3D |
| Total initial app load | < 4 MB |

Lazy-load game-specific assets when a game is selected, not at app startup.

#### 5.4.3 Scene Architecture

Every Babylon game must follow this structure:

```ts
// src/games/[game-id]/[Game]Game.ts
import { Scene, Engine } from '@babylonjs/core';

export class ExampleGame {
  scene: Scene;

  constructor(private engine: Engine, private canvas: HTMLCanvasElement) {
    this.scene = new Scene(engine);
    this.setupCamera();
    this.setupLights();
    this.loadAssets();
  }

  setupCamera() {
    // Configure camera for the game type
  }

  setupLights() {
    // Configure lighting and environment
  }

  async loadAssets() {
    // Load only this game's assets
  }

  update() {
    // Game loop (keep lightweight)
  }

  dispose() {
    this.scene.dispose();
  }
}
```

Rules:
- One Babylon `Scene` per game.
- Dispose the scene, meshes, materials, textures, lights, and observables completely when returning to the home screen.
- Do not leak observables, render loops, or event listeners between scenes.

#### 5.4.4 Performance Rules

- Target 60 FPS on a mid-range tablet (e.g., iPad 8th gen, Samsung Galaxy Tab A8).
- Keep draw calls under 100 per scene on mobile; under 200 on desktop.
- Use mesh LODs (Level of Detail) for complex models.
- Share materials across meshes where possible; avoid unique materials per instance.
- Use object pooling for projectiles, collectibles, and particle systems.
- FreezeWorldMatrix on static meshes after placement.
- Avoid creating/disposing meshes inside `update()`; reuse or pool instead.
- Use KTX2/Basis texture compression and Draco mesh compression.
- Use texture atlases for UI and sprite-based elements only.

#### 5.4.5 Input Handling

- Use Babylon's input system (`ActionManager`, `PointerEvents`, `Observable`) or the shared `InputManager`; do not attach raw DOM event listeners inside scenes.
- Support both touch and keyboard/mouse for every action.
- Provide on-screen controls for tablet/mobile users.
- Debounce rapid inputs to prevent accidental double-actions.

#### 5.4.6 Audio in Babylon

- Use Babylon's sound engine or the shared `AudioManager` for game audio.
- Keep SFX short (< 2s) and compressed.
- Respect the global mute state from the app shell.
- Provide per-game volume overrides only if the design explicitly requires it.

#### 5.4.7 State & Shell Communication

- Scenes own local game state.
- Emit events to the app shell for UI updates:

```ts
this.onScoreChange.notifyObservers({ value: 120 });
this.onGameOver.notifyObservers({ winner: 'left', score: 450 });
```

- For online games, send only player intents to Colyseus; never send score or health from the client.

#### 5.4.8 Profiling Gate

No game ships without passing the Babylon profiling gate:

- [ ] Stable 60 FPS on Tier 1 tablet for 5 minutes.
- [ ] Memory usage does not grow during a 10-minute session.
- [ ] No console errors or warnings.
- [ ] Scene disposes cleanly with no leaked meshes, materials, or observables.
- [ ] Asset bundle size within budget.

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

Keep game state inside the Babylon scene. Expose only what the shell needs through events or observables:

```ts
this.onScoreChange.notifyObservers({ value: 120 });
this.onGameOver.notifyObservers({ winner: 'left' });
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
- Comply with applicable GCC data protection regulations (e.g., Saudi PDPL, UAE PDPL, Oman PDPL, Qatar Law No. 13 of 2016, Bahrain PDPL) and COPPA/GDPR-K if serving users outside the GCC.

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

- Create a shared asset library: GCC forts and landmarks, desert dunes, palm trees, camels, falcons, dhows, traditional dress, etc.
- Produce assets as modular 3D models (GLB/GLTF) so they can be reused across games.
- Use KTX2/Basis texture compression and Draco mesh compression.
- Optimize images to WebP/AVIF where supported; use PNG fallback for alpha-critical textures.

---

## 10. Graphics & Animation

### 10.1 Visual Identity & Art Direction

The platform must feel unmistakably Gulf while remaining friendly and readable for children aged 7–12.

#### 10.1.1 Cultural Visual Pillars

The visual identity must feel authentically Gulf while leaving room for country-specific variants.

- **Shared Gulf heritage:** Desert dunes, date palms, camels, falcons, dhows, coffee pots (dallah), traditional dress, hospitality scenes.
- **Sea & coast:** Turquoise waters, pearl diving, fishing, coral reefs, harbors from Kuwait to Muscat.
- **Modern Gulf cities:** Skyline silhouettes (Kuwait Towers, Burj Khalifa, Riyadh skyline, Bahrain World Trade Center) used subtly as background layers.
- **Heritage symbols:** Forts and palaces from each GCC country, souks, wind towers (barjeel), frankincense, pottery, traditional daggers and swords.
- **Nature & geography:** Omani wadis and frankincense trees, Saudi Red Sea coast, UAE mangroves, Bahrain pearl banks, Kuwaiti islands, Qatar inland sea.
- **Festive & social:** Arabic coffee, dates, halwa, majlis gatherings, Eid and National Day celebrations across the GCC.

#### 10.1.2 Unified Color Palette

Base the palette on the existing CSS variables and extend it for game art:

| Token | Hex | Usage |
|-------|-----|-------|
| `--sandy` | `#e6d5b8` | Dunes, backgrounds |
| `--sand-dark` | `#cbb593` | Shadows, rocks |
| `--sea` | `#1e6f7a` | Water, UI primary |
| `--sea-dark` | `#15565e` | Deep water, headers |
| `--sun` | `#f4b942` | Accents, sun, coins |
| `--sun-dark` | `#d99a2b` | Hover states |
| `--success` | `#27ae60` | Positive feedback |
| `--danger` | `#c0392b` | Damage, warnings |
| `--white` | `#ffffff` | Text on dark, highlights |
| `--charcoal` | `#2f2f2f` | Body text |

Use the palette consistently across all games so the platform feels cohesive.

#### 10.1.3 Typography

- **UI font:** `Cairo` / `Tajawal` (already in use).
- **In-game text:** Use the same font family; avoid decorative fonts that reduce readability in Arabic.
- **Minimum sizes:** 16px body, 22px scores, 32px headlines on mobile.
- **Line height:** 1.5 or greater for Arabic text.

#### 10.1.4 Character Design

- **Style:** Friendly, rounded proportions, large eyes, readable silhouettes.
- **Avatars:** Allow children to pick from a set of culturally themed characters (boy/girl in Gulf attire, camel, falcon, etc.).
- **Silhouette test:** Every character should be recognizable from its silhouette alone.
- **Avoid:** Overly complex details that do not read at small sizes.

#### 10.1.5 Environment Themes

| Game Type | Environment Cues |
|-----------|------------------|
| Runner | GCC desert dunes (Empty Quarter, Wahiba), oasis palms, ancient trade routes |
| Tic-Tac-Toe | Gulf heritage board: khanjar, sword, dhow, falcon, coffee pot tiles |
| Fort Battle | Historic forts from across the GCC across a wadi or coastal inlet |
| Racing | Coastal Corniche, mountain pass, desert highway, city skyline backdrop |
| Memory | Heritage tiles: pottery, jewelry, dress patterns, flags, landmarks |
| Puzzle | Falaj channels, geometric Islamic patterns, wind towers, pearl diving |

#### 10.1.6 Recommended Art Style

**Aldoolab recommendation: stylized low-poly 3D as the primary art direction.**

The platform is built on Babylon.js, a 3D engine, and targets tablets first. The art style must be readable on small screens, fast to render on mobile GPUs, and producible by a small team or solo developer.

| Style | Verdict | Why |
|-------|---------|-----|
| **Stylized low-poly 3D (flat shading, bold shapes, simple PBR)** | ✅ **Primary choice** | Native to Babylon.js; performs well on tablets; distinctive Gulf look; reusable models across games; scales from simple to advanced within the same engine. |
| **Low-poly with hand-painted textures** | ✅ Good secondary look | Add warmth and cultural detail without heavy PBR complexity. |
| **Advanced PBR 3D** | ⚠️ Use selectively | Richer lighting and materials for flagship titles; higher asset cost and performance budget. |
| **2D vector / sprites** | ⚠️ Use only for UI or specific 2D mini-games | Not the default art language for the platform. |
| **Realistic high-fidelity 3D** | ❌ Avoid | Too expensive to produce for 20 games; hurts tablet performance; competes poorly with AAA mobile games; harder to keep culturally consistent. |

**Simple vs. advanced 3D within Babylon:**
- **Simple 3D:** low-poly meshes, flat or lightly shaded materials, baked lighting, minimal particle effects. Best for fast iteration and broad device support.
- **Advanced 3D:** PBR materials, real-time shadows, dynamic lighting, skeletal animation, post-processing. Reserve for games where the visual lift justifies the cost.
- Both workflows share the same engine, asset formats, and pipeline; a game can start simple and advance later.

**Visual rules for the chosen style:**
- Use **bold, readable silhouettes** for characters and landmarks.
- Keep polygon counts low enough for 60 FPS on Tier 1 tablets.
- Use the unified palette from Section 10.1.2; apply it through materials, not noisy textures.
- Build modular assets (forts, palms, dhows, characters) so they can be reused and recombined across games.
- Use camera movement, lighting, and particles to add depth and polish.
- Export source models as GLB/GLTF with Draco compression and KTX2/Basis textures.

**Production implication:**
A single 3D artist using Blender (modeling) and Figma (UI/concepts) can maintain the core asset library. Style consistency comes from polygon density limits, material rules, and the shared Gulf palette rather than from a single complex tool chain.

---

### 10.2 Asset Standards

#### 10.2.1 Asset Types

| Category | Examples |
|----------|----------|
| 3D Models | Player characters, enemies, collectibles, props, landmarks |
| Materials | Sand, stone, water, fabric, wood, metal, Gulf patterns |
| Textures | Diffuse, normal, roughness, ambient occlusion, emission |
| Animations | Idle, run, jump, attack, celebrate, hurt, facial expressions |
| Environments | Desert dunes, wadis, coastlines, forts, city skylines |
| UI | Buttons, panels, badges, icons, modals |
| Particles | Dust, sparks, confetti, water splash, fire |
| Effects | Camera shake, flash, vignette, post-processing, transitions |
| Fonts | Cairo/Tajawal web fonts, numeric score fonts |

#### 10.2.2 File Formats

| Asset Type | Preferred Format | Fallback |
|------------|------------------|----------|
| Static images | WebP | PNG |
| Sprites with transparency | WebP (lossless) | PNG-8 |
| Texture atlases | PNG + JSON | — |
| Audio | OGG | MP3 |
| Animation data | GLB animation clips, Babylon animation groups | — |
| Vector UI | SVG | — |
| 3D models | GLB (GLTF 2.0 binary) | GLTF + bin |
| 3D textures | KTX2 / Basis Universal | WebP / PNG |
| 3D mesh compression | Draco | — |

#### 10.2.3 Resolution & Sizing

- **Internal canvas resolution:** Target 1920×1080 max; scale render quality for performance on tablets.
- **Model polygon budget:**
  - Hero characters: < 3,000 triangles on mobile.
  - Environment props: < 1,000 triangles.
  - Background clutter: < 500 triangles.
- **Texture sizes:** Design at power-of-two resolutions (512×512, 1024×1024); max 2048×2048 for broad device compatibility.
- **Asset budget per game:** aim for < 8 MB total (models + textures + audio) for 3D titles.

#### 10.2.4 Naming Conventions

```
assets/
├── models/
│   ├── char_boy.glb
│   ├── prop_dallah.glb
│   ├── env_fort_oman.glb
│   └── veh_dhow.glb
├── textures/
│   ├── char_boy_diffuse.ktx2
│   ├── prop_dallah_roughness.webp
│   └── env_sand_normal.ktx2
├── images/
│   ├── bg_desert_day.webp
│   └── ui_button_primary.webp
├── particles/
│   ├── confetti.png
│   └── dust.png
└── audio/
    ├── sfx_jump.ogg
    └── sfx_win.ogg
```

Use lowercase, underscores, and descriptive names.

#### 10.2.5 Texture Atlases & Material Atlases

- Pack UI sprites and 2D elements into atlases to reduce draw calls.
- Use tools like **TexturePacker**, **Shoebox**, or custom pipelines.
- For 3D, prefer material reuse and texture arrays over per-mesh unique textures.
- Keep UI atlas separate from game material textures for memory management.

---

### 10.3 Animation Principles

#### 10.3.1 Timing for Children

- **Actions:** 0.15–0.3s for UI feedback.
- **Transitions:** 0.3–0.5s for screen/modal changes.
- **Anticipation:** Use 0.1–0.2s of wind-up before big actions (jump, shoot).
- **Hold on win:** Celebrate for 1.5–2s so children notice victory.
- **Avoid:** Strobing, rapid flashing, or motions that may cause discomfort.

#### 10.3.2 Feedback Animations

Every interaction must provide immediate visual feedback:

| Interaction | Feedback |
|-------------|----------|
| Button press | Scale down 0.95 + brightness bump |
| Cell selection | Pop-in + subtle glow |
| Correct action | Green flash + score float-up |
| Wrong action | Red shake + short sound |
| Damage taken | Screen shake + vignette pulse |
| Collection | Item shrinks into score counter |
| Win | Confetti + character celebrate |
| Loss | Gentle fade + retry prompt |

#### 10.3.3 Character Animation States

Most player characters should support these animation states (exported as GLB animation clips or keyframe groups):

- **Idle:** breathing/looping subtle motion.
- **Run:** looping locomotion cycle.
- **Jump:** anticipation → launch → peak → land.
- **Duck/Crouch:** compressed pose, quick transition.
- **Attack/Shoot:** wind-up → action → recovery.
- **Celebrate:** arms up, bounce, smile.
- **Hurt:** brief red flash, stagger pose.

#### 10.3.4 Transitions

- Use fade or slide transitions between app shell and game scenes.
- Keep transitions under 0.4s to maintain engagement.
- Avoid overly complex page transitions on low-end tablets.

#### 10.3.5 Appeal & Exaggeration

- Use **squash and stretch** on characters and UI elements.
- Add **follow-through** (e.g., scarf/hair trailing on runner).
- Use **secondary motion** (flags waving, palm leaves swaying) to bring scenes to life.

---

### 10.4 Technical Implementation

#### 10.4.1 Babylon.js Animation Tools

- **Animation groups:** for skeletal/GLB animation clips (idle, run, celebrate).
- **Tweens / Animation class:** for UI feedback, score counters, modal transitions.
- **Particle systems:** for confetti, dust, sparks, water.
- **Camera effects:** shake, fade, flash, zoom via camera animation and post-processes.
- **Render loop:** for per-frame game logic and sequence choreography.

Example tween for a score pop:

```ts
const anim = new Animation(
  'scorePop',
  'scaling',
  30,
  Animation.ANIMATIONTYPE_VECTOR3,
  Animation.ANIMATIONLOOPMODE_CONSTANT
);
const keys = [
  { frame: 0, value: new Vector3(1, 1, 1) },
  { frame: 15, value: new Vector3(1.4, 1.4, 1.4) },
  { frame: 30, value: new Vector3(1, 1, 1) },
];
anim.setKeys(keys);
scoreText.animations.push(anim);
this.scene.beginAnimation(scoreText, 0, 30, false);
```

#### 10.4.2 Skeletal Animation

For complex characters (e.g., running camel, dancing avatar), use skeletal animation exported inside GLB/GLTF:

- **Blender** with Rigify or custom armatures (free, full control).
- **Maya/3ds Max** via GLTF exporters (studio pipelines).
- Load GLB animation groups directly in Babylon.js.

Use skeletal animation for organic characters; use simple transforms/tweens for rigid props and UI.

#### 10.4.3 Particle Effects

| Effect | Use Case |
|--------|----------|
| Confetti | Win celebration |
| Dust | Running/landing |
| Sparks | Arrow hit on stone |
| Splash | Water/fishing games |
| Fire glow | Pottery kiln |
| Leaves | Wind in mountain games |

Keep particle counts reasonable:
- Mobile: < 200 active particles.
- Desktop: < 500 active particles.

#### 10.4.4 Depth & Layering

- Use real 3D depth: place foreground, midground, and background meshes at different Z distances.
- For runner/explorer games, move the camera or world to create natural parallax.
- Use fog and atmospheric scattering to blend distant background layers.
- Cache static environment chunks and instance repeated objects (rocks, palms, buildings).

#### 10.4.5 Screen Effects Rules

| Effect | When to Use | Limit |
|--------|-------------|-------|
| Screen shake | Heavy damage, fort collapse | < 0.3s, low intensity |
| Flash | Successful hit, power-up | 50–100ms, soft color |
| Vignette | Low health, danger | Pulsing, not constant |
| Zoom | Focus on win/important moment | Brief, subtle |
| Fade | Scene transitions | 0.3–0.5s |

---

### 10.5 Performance & Accessibility

#### 10.5.1 Performance Budgets

| Metric | Target |
|--------|--------|
| Draw calls per scene | < 100 on mobile; < 200 on desktop |
| Triangles per scene | < 80,000 on mobile; < 200,000 on desktop |
| Texture memory per game | < 64 MB |
| Initial load time | < 4s on 3G |
| Frame rate | Stable 60 FPS on Tier 1 tablet; 30+ FPS on Tier 2 |
| Asset bundle per game | < 8 MB for 3D titles |

#### 10.5.2 Optimization Rules

- Reuse materials and textures across games where thematically appropriate.
- Pool meshes, particles, and projectiles instead of creating/destroying constantly.
- Freeze world matrices on static meshes after placement.
- Use LODs (Level of Detail) for complex models.
- Instance repeated geometry (palms, rocks, buildings).
- Use object pooling for bullets, obstacles, and collectibles.
- Compress audio to 128 kbps or lower.
- Compress textures with KTX2/Basis and meshes with Draco.

#### 10.5.3 Accessibility

- Respect `prefers-reduced-motion`: disable screen shake, reduce particle counts, simplify transitions.
- Maintain color contrast ratios ≥ 4.5:1 for text and important UI.
- Do not rely solely on color to convey game state; use icons/shape too.
- Provide clear visual focus indicators for keyboard navigation.

---

### 10.6 Asset Production Pipeline

#### 10.6.1 Recommended Tools

| Task | Tool |
|------|------|
| 3D modeling / sculpting | Blender, ZBrushCore |
| 3D texturing | Substance Painter, Blender, ArmorPaint |
| Vector UI / icons | Figma, Adobe Illustrator |
| Texture packing / compression | TexturePacker, Free Texture Packer, gltf-transform, toktx |
| Skeletal animation | Blender, Maya |
| Mesh compression | Draco, gltf-transform |
| Audio | Bfxr, LMMS, Audacity |
| Font subsetting | glyphhanger, fonttools |

#### 10.6.2 Export & Optimization Workflow

1. Model, rig, and animate in Blender; export source `.blend` files to version control.
2. Export final assets as GLB/GLTF.
3. Compress meshes with Draco.
4. Bake and compress textures to KTX2/Basis Universal with PNG/WebP fallback.
5. Convert UI images to WebP with PNG fallback.
6. Pack UI sprites into atlases.
7. Compress audio.
8. Run assets through optimizers (e.g., `gltf-transform`, `toktx`, `ffmpeg`).
9. Verify file sizes against the performance budget.
10. Commit to `public/assets/`.

#### 10.6.3 Asset Review Checklist

- [ ] Culturally accurate and appropriate for children.
- [ ] Consistent with the platform color palette and material rules.
- [ ] Readable silhouette and proportions at target camera distance.
- [ ] Optimized and within polygon/texture/memory budget.
- [ ] Includes RTL-safe layout where text is involved.
- [ ] Has fallback formats where required.
- [ ] GLB/GLTF exports cleanly with no missing textures or broken rigs.

---

### 10.7 Game-Specific Animation Notes

| Game | Required Animations & Effects |
|------|-------------------------------|
| Frankincense Collector | Run cycle, jump, duck, obstacle break, camera follow, dust particles, score pop, game-over fade |
| Tic-Tac-Toe | Mark pop-in, cell highlight, win-line draw, draw reaction, confetti on win |
| Fort Battle | Bow draw/release, arrow flight, block crumble, fort shake, collapse, wind flag, victory/defeat pose |
| Camel Race | Gallop cycle, dust clouds, crowd cheer, finish-line burst |
| Gulf Sweets Catcher | Falling sweets, basket catch, combo counter, missed-item reaction |
| Memory | Card flip, match glow, mismatch shake, board clear celebration |
| Beach Football | Kick, ball arc, goal net ripple, crowd reaction |
| Pottery Maker | Wheel spin, clay morph, paint stroke, kiln glow |

Use this table as a template when planning new games.

---

## 11. Testing Strategy

The goal is to catch logic regressions immediately after every code change, without waiting for a full browser build or deployment. The project therefore uses a **two-layer testing model**: fast unit tests for game logic, and targeted E2E tests for integration and deployment smoke checks.

### 11.1 Guiding Principle: Logic Must Be Testable Without a Browser

Every game should split its code into two layers:

1. **Game Logic Layer** — pure TypeScript classes/functions with no dependency on Babylon.js, DOM, Canvas, Web Audio, or network APIs. This layer owns rules, state transitions, physics, scoring, win/lose conditions, and AI decisions.
2. **Presentation Layer** — Babylon.js scenes, meshes, materials, input handling, audio playback, and render loops. This layer calls the logic layer and visualizes the result.

**Why:** Unit tests run in Node.js via Vitest in milliseconds. They can be executed on every save, in CI, and before every commit. If logic is entangled with 3D rendering, tests become slow, brittle, and often require a real browser.

### 11.2 Unit Tests (Vitest)

Unit tests must cover the game logic layer and any shared utilities. They should run with `npm test` (or `npm run test:unit`) and complete in under a few seconds.

**Required coverage for every game:**

- State transitions (e.g., `aiming` → `flying` → `gameover`).
- Win/lose conditions and turn switching.
- Physics step correctness (position, velocity, gravity, wind).
- Collision and damage calculation.
- Input intent parsing (angle/power changes, clamping, invalid values).
- Audio mute state and other user settings that affect the game loop.

**Examples by game:**

| Game | Key unit-test targets |
|------|-----------------------|
| Gulf Tic-Tac-Toe | Win detection, board indexing, AI move selection, undo/reset. |
| Frankincense Runner | Collision detection, score multiplier, obstacle spawning rules, speed curves. |
| Fort Battle | Arrow physics (gravity + wind), fort health/damage, turn rotation, wind generation bounds, mute state. |

**Shared system tests:**

- Network message validators and schema serialization.
- Score calculation and leaderboard sorting.
- Utility functions (clamp, lerp, random ranges, RTL text helpers).

### 11.3 E2E Tests (Playwright)

E2E tests verify that the deployed app loads, renders, and responds to user input. They are slower and therefore run on pull requests and before releases, not on every file save.

**Smoke tests:**

- Launch a game from the home grid.
- Verify the game canvas appears and the HUD renders.
- Fire a shot via mouse/touch and confirm the turn switches.
- Verify mute and fullscreen buttons.

**Online integration tests (once multiplayer is implemented):**

- Host a room and join with a second tab.
- Complete a full online match.
- Verify emoji reactions and room-code entry.

### 11.4 Manual QA

- Test on real tablets (iPad + Android).
- Test on slow networks (3G throttle).
- Test RTL layout and Arabic text rendering.
- Test touch gestures (tap, drag, pinch) on target devices.

### 11.5 Running Tests

The project must expose these npm scripts:

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "test:e2e:ci": "playwright test --reporter=dot"
}
```

- `npm run test:watch` is the recommended command during active development.
- `npm test` runs once and is used in CI and before deployment.
- `npm run test:e2e` runs Playwright integration tests against a local build or staging URL.

### 11.6 Refactoring Existing Games for Testability

For games already implemented with mixed logic and rendering (e.g., the first Babylon.js prototype), create a `*Logic.ts` module next to the existing `*Game.ts` file. Move state, rules, and physics into the logic module incrementally. Keep the existing scene file as the visual adapter. Do not rewrite the whole game unless the logic is small enough to safely extract in one pass.

---

## 12. Migration Roadmap

### 12.1 Phase 1: Foundation (Weeks 1–2)
1. Initialize Vite + TypeScript project.
2. Set up ESLint, Prettier, Vitest.
3. Port global styles and CSS variables.
4. Create the App Shell component.

### 12.2 Phase 2: First Babylon.js Game (Weeks 3–6)
1. Integrate Babylon.js with tree-shakable `@babylonjs/core`.
2. Create the `EngineManager` and `GameManager` lifecycle.
3. Build **Tic-Tac-Toe** as a 3D board game: 3D tokens, board, camera, and simple animations.
4. Add Svelte/Vue modals for mode selection.

### 12.3 Phase 3: Authoritative Multiplayer (Weeks 7–9)
1. Set up Colyseus server.
2. Migrate Tic-Tac-Toe online play to Colyseus.
3. Add Supabase auth and profiles.

### 12.4 Phase 4: Build Remaining Games (Weeks 10–22)
1. Build Runner and Fort Battle in Babylon.js.
2. Implement online play for Fort Battle.
3. Add one new game every 1–2 weeks.
4. Establish the shared 3D asset library (models, materials, animations).

### 12.5 Phase 5: Polish & Launch (Weeks 17–20)
1. Add PWA support.
2. Add leaderboards and achievements.
3. Comprehensive testing and performance optimization.
4. Production deployment.

---

## 13. Deployment

### 13.1 Frontend

- Static hosting: **Vercel**, **Netlify**, **Cloudflare Pages**, or **GitHub Pages**.
- Ensure HTTPS is enforced.

### 13.2 Backend

- Colyseus server on **Node.js**.
- Host on **Railway**, **Render**, **Fly.io**, or a VPS.
- Use Redis for presence/room discovery if scaling beyond one process.

### 13.3 Database

- Supabase PostgreSQL for profiles, scores, and leaderboards.
- Regular backups and row-level security policies.

---

## 14. Code Quality Standards

1. **TypeScript strict mode** enabled.
2. **No `any` types** except in narrowly justified cases.
3. **Component/scene files** are small and focused (< 300 lines when possible).
4. **Shared utilities** live in `src/core/`, not duplicated across games.
5. **All network messages** are typed and validated.
6. **Commit messages** in English or Arabic consistently; choose one and document it.
7. **Pull requests** require passing tests and code review.

---

## 15. Key Decisions Log

| Decision | Choice | Reason |
|----------|--------|--------|
| Game engine | Babylon.js | Mature web 3D engine with strong TypeScript support, built-in physics/GUI/audio, and scalability from low-poly to advanced PBR. |
| App framework | Svelte 5 / Vue 3 | Lightweight, reactive, excellent RTL support. |
| Multiplayer | Colyseus | Authoritative server prevents cheating and supports child-safe room management. |
| Backend data | Supabase | Integrated auth + PostgreSQL + realtime reduces backend work. |
| Build tool | Vite | Fast, modern, simple configuration, PWA-ready. |
| Styling | CSS vars + optional Tailwind | Preserves existing design system while improving productivity. |
| Testing strategy | Vitest unit tests + Playwright E2E | Unit tests run fast after every change; E2E verifies deployed integration. Game logic is separated from rendering to keep unit tests fast and reliable. |

---

## 16. Operations, Analytics & Compliance

This section covers what is needed to run the platform as a live product, not just to build it.

### 16.1 Analytics & Telemetry

Track only what is useful and privacy-respecting. Avoid collecting identifiable data about children.

#### 16.1.1 Events to Track

| Event | Purpose |
|-------|---------|
| `game_started` | Measure game popularity |
| `game_completed` | Track completion rates |
| `score_recorded` | Balance difficulty and leaderboards |
| `room_created` / `room_joined` | Multiplayer engagement |
| `session_length` | Retention analysis |
| `ad_or_reward_shown` | Monetization tracking (if applicable) |
| `error_occurred` | Stability monitoring |

#### 16.1.2 Recommended Tools

| Tool | Use Case |
|------|----------|
| **Plausible** | Privacy-friendly web analytics |
| **Google Analytics 4** | Deeper funnel analysis (configure for child safety) |
| **Sentry** | Error and crash reporting |
| **Custom events table** | Game-specific events stored in Supabase |

#### 16.1.3 Performance Telemetry

- Track FPS drops per scene.
- Log load times for asset bundles.
- Monitor memory usage on low-end tablets.
- Set alerts when crash rate exceeds 1%.

---

### 16.2 Monetization & Business Model

Define the model early because it changes architecture, payment flows, and the child-facing UX.

#### 16.2.1 Candidate Models

| Model | Fit | Notes |
|-------|-----|-------|
| **Free, sponsored** | Best for GCC educational context | Ministry, school, or NGO sponsorship |
| **Freemium cosmetics** | Safe for kids | Unlockable avatars, themes, badges; no pay-to-win |
| **Ads** | Low-touch but risky for under-13 | Use only COPPA-certified rewarded video; avoid interstitials and banners |
| **Subscription / unlock** | Direct consumer offer | Recurring or one-time access to all games and features |
| **Institutional license** | B2B option | Schools pay for classroom accounts |
| **Asset/template sales** | Side revenue for Aldoolab | Reusable components sold on Gumroad/CodeCanyon |

#### 16.2.2 Ads as a Low-Touch Option

Ads are attractive because they require minimal business development: enroll with an ad network, integrate an SDK, and earn per impression or view. However, for a child-safety-focused platform, ads must be heavily constrained.

**Allowed ad format (if implemented):**

| Format | Allowed | Notes |
|--------|---------|-------|
| **Rewarded video** | ✅ Yes, with opt-in | Kids choose to watch for a reward; never forced |
| **Non-personalized only** | ✅ Required | COPPA/GDPR-K compliance |
| **COPPA-certified network** | ✅ Required | Google AdMob (kids config), Unity LevelPlay under-13 mode |
| **Interstitial ads** | ❌ No | Interrupt gameplay and hurt retention |
| **Banner ads** | ❌ No | Clutter UI and erode trust |
| **Personalized ads** | ❌ No | Illegal or restricted for under-13 users |

**Implementation requirements for ads:**
- Parent dashboard toggle to disable ads for Premium subscribers.
- Clear labeling: "Watch to earn" not "Watch ad."
- Maximum one rewarded video per session.
- Audit ad content manually during soft launch.

**Revenue estimate:** $0.03–$0.10 per rewarded video view. Low CPM for kids inventory means ads alone are rarely enough to sustain the platform.

#### 16.2.3 Low-Touch Alternatives to Ads

These methods are similarly code-first and require little or no relationship management:

| Method | Integration Effort | Best Placement | Notes |
|--------|-------------------|----------------|-------|
| **Affiliate links** | Low | Parent dashboard, emails | Promote kids' books, tablets, family products |
| **In-app purchases (IAP)** | Medium | Child-facing store, parent-approved | App Store / Google Play billing or Stripe web checkout |
| **Subscription / unlock** | Medium | Upgrade prompts, locked content | Stripe, Paddle, or RevenueCat |
| **Asset/template sales** | Low-Medium | External marketplaces | Sell Babylon.js scenes, 3D asset packs, UI kits, starter templates |
| **Referral program** | Medium | Share-link in parent dashboard | Reward free premium days or cosmetics |
| **GitHub Sponsors / Ko-fi** | Low | Open-source framework repo | Optional reputation-based revenue |

#### 16.2.4 In-Game Economy (if used)

- Use a soft currency earned by playing.
- Avoid real-money purchases directly in the child-facing app.
- All purchases go through a parent dashboard or app-store PIN/biometric gate.
- For GCC markets, support regional payment methods: Apple Pay, Google Pay, STC Pay, UAE Pass-linked payments, and carrier billing where available.

#### 16.2.5 Recommended Monetization Mix

For the first 12 months, prioritize models that preserve trust and require minimal external negotiation:

1. **One-time Full Game Pass** — simplest parent-friendly offer.
2. **Freemium cosmetics** — parent-gated microtransactions.
3. **Optional rewarded video** — only after 50K+ MAU and only COPPA-certified.
4. **Affiliate links** — parent dashboard only.
5. **Subscription** — introduced once content depth justifies recurring payment.

---

### 16.3 Localization Strategy

The platform is Arabic-first, but design for future languages from the start.

#### 16.3.1 Internationalization Rules

- Use key-based strings, never hardcoded text in game code.
- Support RTL and LTR layouts.
- Use a font that supports Arabic shaping (Cairo/Tajawal already do).
- Plan for text expansion: Arabic phrases are often shorter, but not always.

#### 16.3.2 Recommended Libraries

| Framework | Library |
|-----------|---------|
| Svelte | `svelte-i18n` |
| Vue | `vue-i18n` |
| Babylon.js | Load JSON locale files and resolve keys manually |

#### 16.3.3 GCC Localization Considerations

- Use **Modern Standard Arabic (MSA)** as the default written language. It is understood across the GCC and safest for children.
- Avoid heavy dialect-specific phrasing in core UI; optional dialect packs can be added later for voice-overs or regional events.
- Support **English** as a secondary language from launch; many GCC children and parents toggle between Arabic and English.
- Plan for country-specific content flags so events, landmarks, and themed games can be enabled per market.
- Respect each country's flag, symbols, and national colors in seasonal events.

---

### 16.4 Offline Support & PWA Operations

#### 16.4.1 Offline Capability by Game

| Game Type | Offline Support |
|-----------|-----------------|
| Single-player | Full offline after first load |
| Online 1v1 | Requires connection; queue or AI fallback offline |
| Score-based | Save locally, sync when online |

#### 16.4.2 Caching Strategy

- Cache static assets (images, audio, fonts) with a service worker.
- Use stale-while-revalidate for app shell.
- Version cache keys per release.
- Provide a "reload to update" prompt when a new version is available.

---

### 16.5 Error Handling & Crash Reporting

#### 16.5.1 Global Error Boundaries

- Catch unhandled errors in the app shell.
- Catch errors inside Babylon scenes and return to the home screen gracefully.
- Never expose stack traces to children.

#### 16.5.2 Graceful Degradation

| Failure | Behavior |
|---------|----------|
| WebGL unavailable | Show a friendly "update your browser" message |
| Audio context blocked | Continue silently; do not crash |
| WebSocket disconnected | Show reconnecting spinner; allow rejoin |
| Asset fails to load | Retry once, then show fallback or skip |

#### 16.5.3 Crash Reporting

- Send errors to Sentry or a custom endpoint.
- Include game ID, scene, device type, and browser version.
- Scrub any personally identifiable information.

---

### 16.6 DevOps & CI/CD

#### 16.6.1 Continuous Integration

Run on every pull request:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run test:unit`
4. Build frontend and server

#### 16.6.2 Environments

| Environment | Purpose | Hosting Example |
|-------------|---------|-----------------|
| Local | Development | `npm run dev` |
| Staging | Pre-release testing | Vercel preview / Render staging |
| Production | Live users | Vercel production / Render production |

#### 16.6.3 Deployment Pipeline

1. Merge PR to `main`.
2. CI runs tests and build.
3. Deploy frontend to static host.
4. Deploy Colyseus server to Node.js host.
5. Run database migrations (if any).
6. Smoke test production.

#### 16.6.4 Database Migrations

- Use migration files for schema changes.
- Test migrations against a copy of production data before deploying.
- Keep backward-compatible migrations when possible.

---

### 16.7 Compliance & Legal

#### 16.7.1 Required Documents

- Privacy Policy
- Terms of Service
- Parental Consent Flow (for under-13 users)
- Cookie/Tracking Notice (if using analytics)

#### 16.7.2 Regulations to Consider

| Regulation | Key Requirement |
|------------|-----------------|
| **COPPA** (US) | Parental consent for under-13 data collection |
| **GDPR-K** (EU) | Parental consent for under-16 (or 13 with approval) |
| **GCC PDPL laws** | Local data protection compliance in each target country |

#### 16.7.3 Data Minimization

- Collect only: nickname (optional), avatar choice, scores, session metadata.
- Do not collect: real name, email of child, location, device identifiers.
- Allow parents to delete child accounts and data.

---

### 16.8 Parental Controls

Provide a lightweight parent dashboard or in-app flow:

| Feature | Purpose |
|---------|---------|
| Playtime limits | Daily/weekly caps |
| Data deletion | Remove account and history |
| Friends management | Approve or block contacts |
| Purchase approval | Gate any real-money transactions |
| Activity summary | See games played and time spent |

---

### 16.9 Matchmaking, Fallbacks & Reconnection

#### 16.9.1 Friend-Based Play

- Keep the 4–8 character room code model for private games.
- Add a "copy invite link" option for mobile sharing.

#### 16.9.2 Public Matchmaking (optional)

- If added later, use age-bucketed queues.
- Never match a 7-year-old with a 13+ user.

#### 16.9.3 AI Fallback

- If a player disconnects, offer to continue against AI.
- If no opponent is found within 30 seconds, offer AI match.

#### 16.9.4 Reconnection

- Allow rejoin within 60 seconds of disconnect.
- Server holds room state briefly after a player leaves.

---

### 16.10 Content Moderation

Even with emoji-only chat, moderate anything user-facing:

- Filter nicknames against a deny-list.
- Review custom avatars if ever allowed.
- Provide a "report" button on every online match.
- Log reports for manual review.

---

### 16.11 Asset Licensing & Open Source

- Decide on a license for the codebase (e.g., MIT, Apache-2.0, or proprietary).
- Track licenses of third-party assets (fonts, audio, 3D models, textures).
- Include an attribution file if required.

---

### 16.12 Contributor Onboarding

Add a `CONTRIBUTING.md` that explains:

1. How to set up the project locally.
2. How to run tests.
3. How to add a new game using the `GameConfig` contract (see Section 5.2).
4. How to test multiplayer locally.
5. Code review checklist.

---

## 17. Play Modes

> **⚠️ Review Needed:** This chapter is a first draft. The team should review game-mode choices against development capacity, child-safety policy, and the target age range before committing to a roadmap.

### 17.1 Core Modes (Build First)

These modes deliver the highest value with the lowest implementation and moderation risk.

| Mode | Description | Why It Fits | Complexity |
|------|-------------|-------------|------------|
| **Single-player vs AI** | One player against the computer | Safe, works offline, good for learning mechanics | Low |
| **Local 2-player (hotseat)** | Two players take turns or share a device | Natural on tablets; no server or safety concerns | Low |
| **Online 1v1 (friend invite)** | Two players connect via room code | Already implemented model; child-safe when invite-only | Medium |
| **Daily Challenge** | One shared puzzle/run/level per day | Drives retention with minimal dev cost | Low–Medium |
| **Practice / Free Play** | Play without scoring or penalties | Lets children learn controls without frustration | Low |

### 17.2 Secondary Modes (Add After Core)

| Mode | Description | Why It Fits | Complexity |
|------|-------------|-------------|------------|
| **Asynchronous turns** | Take turns over hours or days | Works for Tic-Tac-Toe and strategy games; no live connection needed | Low |
| **Score Attack / Time Attack** | Compete for high score or best time | Asynchronous competition via leaderboards | Low |
| **Campaign / Region Map** | Progress through GCC regions to unlock games | Adds cohesion across the 20-game catalogue | Medium |
| **Bot Match with difficulty** | Easy / Medium / Hard AI opponent | Keeps online-capable games fun when no human is available | Low–Medium |
| **Classroom Mode** | Teacher hosts a room, students join | Strong fit for schools and cultural education | Medium |
| **Co-op vs AI** | Two players team up against the computer | Good for Fort Battle and defense-style games | Medium |

### 17.3 Modes to Defer or Avoid

| Mode | Verdict | Reason |
|------|---------|--------|
| **Open public matchmaking** | ⚠️ Defer | Difficult to keep child-safe without dedicated moderation |
| **Free text chat** | ❌ Avoid | Violates the child-safe communication policy |
| **Voice chat** | ❌ Avoid | High moderation and safety burden |
| **Battle royale / large lobbies** | ❌ Avoid | Too complex and inappropriate for ages 7–12 |
| **Guilds / clans** | ⚠️ Defer | Social overhead and moderation risk |
| **Real-money trading** | ❌ Avoid | Not suitable for children |

### 17.4 Suggested Mode Matrix by Game

This matrix is a starting point and should be reviewed per game during design.

| Game | Single | Local 2P | Online 1v1 | Daily | Campaign |
|------|--------|----------|------------|-------|----------|
| Frankincense Runner | ✅ | — | — | ✅ Score | ✅ Level |
| Tic-Tac-Toe | ✅ AI | ✅ Hotseat | ✅ | ✅ Puzzle | — |
| Fort Battle | ✅ AI | ✅ | ✅ | — | ✅ Siege |
| Memory | ✅ | ✅ | ✅ | ✅ | — |
| Camel Race | ✅ AI | ✅ | ✅ | ✅ Time | ✅ Cup |
| Sudoku | ✅ | — | — | ✅ | ✅ Unlock |
| Falaj Maze | ✅ | ✅ Co-op | ✅ Co-op | ✅ | ✅ Map |

### 17.5 Implementation Priority

1. **Local 2-player hotseat** — low cost, high value, tablet-native.
2. **Daily Challenge** — strong retention mechanic, single implementation pattern.
3. **Bot difficulty levels** — improves replayability of online-capable games.
4. **Campaign / Region Map** — unifies the platform and gives players long-term goals.
5. **Classroom Mode** — valuable for the GCC educational context, but requires teacher-facing UX.

### 17.6 Multiplayer Modes Beyond 1v1

> **⚠️ Review Needed:** This subsection introduces FFA and team modes. It must be reviewed against child-safety policy, moderation capacity, and technical feasibility before implementation.

#### 17.6.1 Supported Larger Modes

| Mode | Description | Player Count | Best Fit |
|------|-------------|--------------|----------|
| **Free-for-All (FFA)** | Every player competes individually | 3–6 | Racing, trivia, memory |
| **Team vs Team** | Two teams compete | 2v2, 3v3 | Football, fort battle, castle defense |
| **Co-op Team vs AI** | Multiple players team up against computer | 2–4 | Defense, maze, fishing |

#### 17.6.2 Game Suitability Matrix

| Game | 1v1 | FFA 3–6 | Team 2v2 | Notes |
|------|-----|---------|----------|-------|
| Frankincense Runner | — | — | — | Single-player only |
| Tic-Tac-Toe | ✅ | — | — | Turn-based 1v1 |
| Fort Battle | ✅ | — | ✅ 2v2 | Shared fort per team |
| Memory Challenge | ✅ | ✅ 2–4 | — | Speed matching |
| Camel Race | ✅ | ✅ 3–6 | — | Natural racing FFA |
| Beach Football — Soor | — | — | ✅ 2v2/3v3 | Team sport |
| Traditional Boat Race (Mwash) | ✅ | ✅ 3–6 | — | Natural racing FFA |
| Castles & Forts Challenge | ⚠️ | — | ✅ 2v2 | Base defense teams |
| Words & Capitals Challenge | ⚠️ | ✅ 2–8 | ✅ Teams | Quiz / trivia |
| Falaj Maze | ✅ Co-op | — | ✅ Co-op 2–4 | Team vs AI |

#### 17.6.3 Safety Rules for Larger Rooms

- **Invite-only:** All FFA/team rooms must be private; no open public lobbies.
- **Capacity limits:** Hard cap at 6 players for FFA, 6 players for teams.
- **Host controls:** Host can kick idle or disruptive players.
- **No free chat:** Emoji-only reactions remain mandatory.
- **Report button:** Visible to all players in every multiplayer match.
- **Supervised mode:** Classroom Mode is the only context where larger rooms are allowed without invites.

#### 17.6.4 Technical Considerations

- Colyseus rooms support multiple clients, but schemas and game logic must be redesigned.
- Turn order becomes a queue or team-based rotation instead of simple X/O switching.
- Win/lose conditions must be team-aware or ranking-aware.
- State sync volume increases with player count; optimize early.
- Host migration: if the host leaves, the server or another player must take over.

#### 17.6.5 Implementation Priority for Larger Modes

1. **2v2 Fort Battle** — builds on existing 1v1 architecture.
2. **3–4 player Camel Race / Boat Race** — simple FFA, low sync complexity.
3. **2v2 Beach Football** — requires new game design but high cultural value.
4. **Team trivia (Words & Capitals)** — good fit for Classroom Mode.

---

## 18. Studio Production Guide

This section turns the framework from an architecture blueprint into a studio production guide.

### 18.1 Team Roles & Responsibilities

| Role | Responsibilities |
|------|------------------|
| **Tech Lead** | Architecture, code quality, performance, security, technical decisions |
| **Game Designer** | Core loops, mechanics, balancing, GDD ownership, playtesting |
| **UI/UX Designer** | App shell, game UI, accessibility, RTL flow, prototyping |
| **Backend Engineer** | Colyseus rooms, Supabase, DevOps, multiplayer stability |
| **Frontend Engineer** | App shell, Babylon.js integration, state management |
| **QA Engineer** | Test plans, manual QA, automation, device lab |
| **Product Owner** | Roadmap, stakeholder communication, compliance, prioritization |
| **Art Lead** | Visual direction, asset pipeline, style guide enforcement |
| **Sound Designer** | SFX, music, audio implementation |

### 18.2 Game Design Document (GDD) Template

Every new game must have a one-page GDD before development starts.

```
Game ID:           [unique-id]
Name (AR):         [Arabic name]
Name (EN):         [English name]
Icon:              [emoji]
Target Age:        [7-9 / 10-12 / all]
Core Loop:         [one sentence]
Win Condition:     [how to win]
Lose Condition:    [how to lose]
Controls:          [desktop + tablet]
Play Modes:        [single / local / online 1v1 / FFA / team]
Estimated Effort:  [small / medium / large]
Art Needs:         [3D models, materials, animations, particles, audio]
Online Feasible:   [yes / no / later]
Accessibility:     [color-blind safe, motion safe, etc.]
```

### 18.3 Browser & Device Support Matrix

| Tier | Browsers | Devices | Support Level |
|------|----------|---------|---------------|
| **Tier 1** | Chrome, Safari last 2 versions | iPad 7th gen+, Android tablet 10" 2020+ | Fully supported, must pass QA |
| **Tier 2** | Firefox, Edge last 2 versions | Mid-range Android phones, older iPads | Supported, best-effort QA |
| **Tier 3** | Older Safari / Chrome | Low-end tablets | Graceful degradation |

**3D support requirements:**

| 3D Tier | Requirement | Devices | Support Level |
|---------|-------------|---------|---------------|
| **3D Tier 1** | WebGL 2.0, stable 60 FPS on low-complexity scenes | iPad 8th gen+, Samsung Galaxy Tab S6+, iPhone 12+, flagship Android | Required target for every 3D game |
| **3D Tier 2** | WebGL 2.0, stable 30+ FPS | Mid-range phones/tablets 2021+ | Supported with simplified assets |
| **3D Tier 3** | WebGL 1.0 or software rendering | Low-end school tablets, old devices | Not supported; show friendly upgrade message |

All 3D games must pass QA on 3D Tier 1 devices. Provide quality presets (low/medium/high) so Tier 2 devices can still play.

### 18.4 Data Model

#### 18.4.1 Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | Player identity | `id`, `nickname`, `avatar`, `parent_email`, `created_at` |
| `scores` | Game scores | `id`, `game_id`, `user_id`, `score`, `mode`, `created_at` |
| `sessions` | Play sessions | `id`, `user_id`, `started_at`, `ended_at`, `device_type` |
| `rooms` | Multiplayer rooms | `id`, `host_id`, `game_id`, `status`, `created_at` |
| `leaderboards` | Rankings | `game_id`, `period`, `user_id`, `score`, `rank` |
| `events` | Analytics | `event_type`, `user_id`, `game_id`, `payload`, `timestamp` |

#### 18.4.2 Row-Level Security

- Players can read only their own `profiles` and `scores`.
- Leaderboards expose only nickname and score, never email or internal IDs.
- Analytics events are write-only from the app; read via internal tools.

### 18.5 Production & Release Management

#### 18.5.1 Versioning

- Use **Semantic Versioning**: `MAJOR.MINOR.PATCH`.
- `MAJOR`: breaking changes to API or game saves.
- `MINOR`: new games or features.
- `PATCH`: bug fixes and balance tweaks.

#### 18.5.2 Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `staging` | Pre-release testing |
| `release/vX.Y` | Release candidate |
| `feature/*` | Individual features |
| `hotfix/*` | Urgent production fixes |

#### 18.5.3 Release Checklist

- [ ] All tests pass.
- [ ] Performance budget met.
- [ ] QA sign-off on Tier 1 devices.
- [ ] Security review for network changes.
- [ ] Compliance review for new data collection.
- [ ] Deployment runbook followed.
- [ ] Rollback plan verified.

### 18.6 Live Operations & Retention

#### 18.6.1 Retention Mechanics

| Mechanic | Purpose |
|----------|---------|
| Daily Challenge | Bring players back daily |
| Streaks | Reward consecutive days |
| Achievements / Badges | Long-term goals |
| Weekly Leaderboards | Social competition |
| Unlockable Avatars | Progression and expression |

#### 18.6.2 Seasonal Content

Align events with the GCC and Islamic calendar:

- **GCC National Days** — rotating country spotlights with themed challenges and decorations:
  - Bahrain: 16 December
  - Kuwait: 25 February
  - Oman: 18 November
  - Qatar: 18 December
  - Saudi Arabia: 23 September
  - UAE: 2 December
- **Ramadan** — daily puzzles, calmer visuals, charity-themed rewards.
- **Eid al-Fitr & Eid al-Adha** — special rewards and festive confetti.
- **Country-specific events** — e.g., Khareef Season (Oman), Riyadh Season (Saudi Arabia), Dubai Shopping Festival (UAE), National Day parades (Kuwait, Qatar, Bahrain).

#### 18.6.3 In-Game Announcements

- Use a lightweight announcement banner in the app shell.
- Announce new games, events, and maintenance windows.
- No push notifications for children; use in-app only.

### 18.7 Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Multiplayer hosting costs / scaling | Medium | High | Monitor Colyseus room density; add Redis and horizontal scaling when needed |
| Art pipeline delays | Medium | High | Contract 3D artist in Phase 1; build shared asset library first |
| COPPA/GDPR compliance gap | Low | Very High | Legal review before public launch |
| Tablet performance issues | Medium | High | Performance budget + device lab |
| Key contributor leaves | Medium | Medium | Documentation, pair programming |
| Scope creep on 20 games | High | Medium | Strict GDD + milestone gates |

### 18.8 Incident Response

#### 18.8.1 Severity Levels

| Level | Example | Response Time |
|-------|---------|---------------|
| P0 | Platform down, no games load | 1 hour |
| P1 | Multiplayer broken | 4 hours |
| P2 | Single game unplayable | 24 hours |
| P3 | Visual bug, typo | Next sprint |

#### 18.8.2 Response Steps

1. Detect via Sentry, uptime monitor, or user report.
2. Triage and assign severity.
3. Apply hotfix or rollback.
4. Communicate status via in-app banner or status page.
5. Post-mortem within 48 hours.

---

## 19. Cross-Device Development & Input Guidelines

All games must work consistently across desktop big screens, tablets, and mobile phones. The primary target is the tablet, with graceful scaling up to desktop and down to mobile.

### 19.1 Device Categories & Breakpoints

| Class | Typical Range | Input Method | Priority |
|-------|---------------|--------------|----------|
| **Desktop / Big Screen** | ≥ 1024 px width | Mouse + keyboard | Secondary |
| **Tablet** | 768–1024 px width | Touch, sometimes keyboard | **Primary** |
| **Mobile** | < 768 px width | Touch only | Fallback |

Design tablet-first. Most GCC children in the target age group play on iPads or Android tablets at home.

### 19.2 Viewport & Canvas Scaling

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

Create the Babylon engine with a fixed-size canvas and let CSS scale it to the viewport:

```ts
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const engine = new Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true,
});
const scene = new Scene(engine);
engine.runRenderLoop(() => scene.render());
window.addEventListener('resize', () => engine.resize());
```

Use CSS to fit the canvas to its container while preserving aspect ratio:

```css
#gameCanvas {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
```

**Rule:** Never use raw `window.innerWidth` as world coordinates. Cast rays from Babylon's camera through the pointer position to interact with the 3D scene.

### 19.3 Input Abstraction Layer

Create a single input manager that normalizes all devices.

```ts
// src/core/InputManager.ts
export class InputManager {
  onTap(callback: (pickResult: PickingInfo) => void) {}
  onSwipe(direction: 'up' | 'down' | 'left' | 'right', callback: () => void) {}
  onDrag(start, move, end) {}
  onKey(code: string, callback: () => void) {}
  onPointerMove(callback: (pickResult: PickingInfo) => void) {}
}
```

**Rules:**
- Never bind raw `window` events inside game scenes.
- Use Babylon's `scene.onPointerObservable` or `scene.pick` to get 3D world intersections.
- Always expose normalized coordinates in **world space**, not screen space.
- Debounce rapid taps to prevent accidental double-fire.

### 19.4 Touch & Gesture Guidelines

#### 19.4.1 Minimum Touch Targets

| Element | Minimum Size |
|---------|--------------|
| Buttons | 48 × 48 px (72 × 72 px preferred for kids) |
| Game pieces (cards, cells) | 64 × 64 px minimum |
| Drag handles | 44 × 44 px |
| Spacing between touchable elements | 8 px minimum |

#### 19.4.2 Supported Gestures

| Gesture | Use Case | Notes |
|---------|----------|-------|
| **Tap** | Select, place mark, jump | Single pointer down + up within 300ms |
| **Double tap** | Reset, special action | Avoid in core gameplay |
| **Long press** | Context menu, preview | 500ms hold; provide visual feedback |
| **Swipe** | Runner jump/duck, page change | Detect velocity + direction; threshold 50px |
| **Drag** | Aim, move pieces, draw | Track pointer delta; support outside canvas |
| **Pinch** | Zoom map, resize | Two-finger distance delta |
| **Multi-touch** | Two-player hotseat | Track multiple pointer IDs |

#### 19.4.3 Play Strokes (Drawing Gestures)

For games that require drawing (puzzle, pottery, falaj maze):

```ts
function recordStroke(points: { x: number; y: number }[]) {
  // 1. Sample points at fixed distance
  // 2. Smooth with moving average
  // 3. Match against gesture templates ($1 recognizer)
}
```

**Guidelines:**
- Stroke width: 8–12 px on mobile, 4–6 px on desktop.
- Provide immediate ink feedback.
- Provide a clear undo button; avoid relying on shake gestures.
- Recognize gestures with tolerance; children draw imprecisely.

### 19.5 UI Scaling & Safe Zones

- Use **relative units** (`rem`, `%`, `vh/vw`) for shell UI.
- Use Babylon's **GUI** (`AdvancedDynamicTexture`) or HTML overlay for in-game UI.
- Keep critical UI inside the **safe zone** (central 90% of screen).

| Device | Safe Zone Padding |
|--------|-------------------|
| Phone | 10% on all sides |
| Tablet | 5% on all sides |
| Desktop | Full screen, HUD near edges |

### 19.6 On-Screen Controls

| Device | Controls |
|--------|----------|
| Desktop | Keyboard shortcuts visible in tooltips |
| Tablet | Optional on-screen buttons for complex games |
| Mobile | Required on-screen buttons for all actions |

Keep controls large, spaced, and visually distinct. Avoid overlapping controls with gameplay-critical areas.

### 19.7 Performance by Device Class

| Class | Target FPS | Draw Calls | Texture Memory |
|-------|------------|------------|----------------|
| Desktop | 60 | < 100 | < 64 MB |
| Tablet | 60 | < 50 | < 32 MB |
| Mobile | 30–60 | < 30 | < 16 MB |

### 19.8 Orientation & Presentation

Force landscape on phones with a rotate prompt:

```css
@media screen and (orientation: portrait) and (max-width: 768px) {
  .rotate-prompt { display: flex; }
}
```

```json
// manifest.json
{
  "display": "standalone",
  "orientation": "landscape"
}
```

### 19.9 Cross-Device Testing Matrix

| Test | Desktop | Tablet | Mobile |
|------|---------|--------|--------|
| Full gameplay loop | ✅ | ✅ | ✅ |
| All input methods | ✅ | ✅ | ✅ |
| UI readability | ✅ | ✅ | ✅ |
| 10-minute session stability | ✅ | ✅ | ✅ |
| Rotation handling | N/A | ✅ | ✅ |
| Offline loading | ✅ | ✅ | ✅ |
| Low-end device (throttled) | Optional | ✅ | ✅ |

### 19.10 Implementation Checklist

- [ ] Babylon engine resizes cleanly to container.
- [ ] Input manager normalizes mouse, touch, and keyboard with 3D raycasting.
- [ ] Touch targets ≥ 64 px for kids.
- [ ] On-screen controls for tablet/mobile.
- [ ] Landscape lock with rotate prompt on phones.
- [ ] Performance budgets per device class.
- [ ] Gesture recognition for swipe, drag, pinch.
- [ ] Play stroke recognition with child-friendly tolerance.
- [ ] Reduced-motion support.
- [ ] Cross-device QA matrix completed.

---

## 20. Next Immediate Actions

1. Decide between **Svelte 5** and **Vue 3** based on team familiarity.
2. Initialize the Vite + TypeScript + chosen framework project.
3. Migrate the existing CSS variables into the new project.
4. Set up **Babylon.js** (`@babylonjs/core`) and render a simple 3D scene (e.g., a rotating Gulf-themed object).
5. Create the `EngineManager` and `GameManager` lifecycle skeleton.
6. Write a Colyseus schema for Tic-Tac-Toe and run a local server.

---

*This document should be treated as a living framework. Update it as the project evolves and as the team makes new technical decisions.*
