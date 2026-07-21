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

## 10. Graphics & Animation

### 10.1 Visual Identity & Art Direction

The platform must feel unmistakably Omani while remaining friendly and readable for children aged 7–12.

#### 10.1.1 Cultural Visual Pillars

- **Desert & dunes:** Warm sandy tones, rolling dunes, sun-bleached rocks.
- **Sea & coast:** Turquoise waters, dhows, fish, coral, Muttrah harbor cues.
- **Mountains & green wadis:** Jebel Akhdar terraces, roses, pomegranate trees.
- **Heritage symbols:** Forts (Nakhal, Jabreen, Bahla), frankincense trees, camels, traditional daggers (khanjar), swords, pottery.
- **Festive & social:** Omani halwa, coffee pots (dallah), dates, traditional dress.

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
- **Avatars:** Allow children to pick from a set of culturally themed characters (boy/girl in Omani attire, camel, falcon, etc.).
- **Silhouette test:** Every character should be recognizable from its silhouette alone.
- **Avoid:** Overly complex details that do not read at small sizes.

#### 10.1.5 Environment Themes

| Game Type | Environment Cues |
|-----------|------------------|
| Runner | Wahiba Sands dunes, frankincense trees, ancient valley |
| Tic-Tac-Toe | Khanjar vs. sword board, sandstone tiles |
| Fort Battle | Two Omani forts across a wadi, wind flags |
| Racing | Coastal road, mountain pass, desert track |
| Memory | Heritage tiles: pottery, jewelry, dress patterns |
| Puzzle | Falaj water channels, geometric Omani patterns |

---

### 10.2 Asset Standards

#### 10.2.1 Asset Types

| Category | Examples |
|----------|----------|
| Sprites | Player characters, enemies, collectibles, projectiles |
| Backgrounds | Parallax layers, static scenes, sky gradients |
| UI | Buttons, panels, badges, icons, modals |
| Particles | Dust, sparks, confetti, water splash, fire |
| Effects | Flash, screen shake, vignette, transitions |
| Fonts | Cairo/Tajawal web fonts, numeric score fonts |

#### 10.2.2 File Formats

| Asset Type | Preferred Format | Fallback |
|------------|------------------|----------|
| Static images | WebP | PNG |
| Sprites with transparency | WebP (lossless) | PNG-8 |
| Texture atlases | PNG + JSON | — |
| Audio | OGG | MP3 |
| Animation data | JSON (Phaser atlas/Spine/DragonBones) | — |
| Vector UI | SVG | — |

#### 10.2.3 Resolution & Sizing

- **Internal canvas resolution:** Target 1920×1080 max; scale down for performance on tablets.
- **Sprite sizes:** Design at 2× or 3× the in-game display size, then scale down.
- **Max texture size:** 2048×2048 for broad device compatibility.
- **Asset budget per game:** aim for < 5 MB total (images + audio).

#### 10.2.4 Naming Conventions

```
assets/
├── images/
│   ├── bg_desert_day.webp
│   ├── bg_sea_sunset.webp
│   ├── char_boy_run_01.webp
│   └── ui_button_primary.webp
├── spritesheets/
│   ├── runner_player.json
│   ├── runner_player.png
│   └── fort_archer.json
├── particles/
│   ├── confetti.png
│   └── dust.png
└── audio/
    ├── sfx_jump.ogg
    └── sfx_win.ogg
```

Use lowercase, underscores, and descriptive names.

#### 10.2.5 Texture Atlases

- Pack sprites for each game into atlases to reduce draw calls.
- Use tools like **TexturePacker**, **Shoebox**, or **Phaser 3 built-in atlas generation**.
- Keep UI atlas separate from game atlas for memory management.

---

### 10.3 Animation Principles

#### 10.3.1 Timing for Children

- **Actions:** 0.15–0.3s for UI feedback.
- **Transitions:** 0.3–0.5s for screen/modal changes.
- **Anticipation:** Use 2–4 frames of wind-up before big actions (jump, shoot).
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

Most player characters should support:

- **Idle:** breathing/looping subtle motion.
- **Run:** 6–10 frame cycle.
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

#### 10.4.1 Phaser 3 Animation Tools

- **Tweens:** for UI feedback, score counters, modal transitions.
- **Animations:** for sprite-based character cycles.
- **Particles:** for confetti, dust, sparks, water.
- **Camera effects:** shake, fade, flash, zoom.
- **Timers:** for delayed animations and sequence choreography.

Example tween for a score pop:

```ts
this.tweens.add({
  targets: scoreText,
  scale: { from: 1, to: 1.4 },
  y: '-=30',
  alpha: { from: 1, to: 0 },
  duration: 800,
  ease: 'Back.easeOut',
});
```

#### 10.4.2 Skeletal Animation

For complex characters (e.g., running camel, dancing avatar), consider:

- **Spine** (premium, industry standard).
- **DragonBones** (free, open-source).
- Export to JSON + atlas and load in Phaser via plugins.

Use skeletal animation only when frame-by-frame is too expensive or rigid.

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

#### 10.4.4 Parallax & Layering

- Use 2–4 parallax layers for runner/explorer games.
- Layers closer to camera move faster than distant layers.
- Cache static layers as single textures when possible.

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
| Draw calls per scene | < 50 on mobile |
| Texture memory per game | < 32 MB |
| Initial load time | < 3s on 3G |
| Frame rate | Stable 60 FPS on mid-range tablet |
| Asset bundle per game | < 5 MB |

#### 10.5.2 Optimization Rules

- Reuse textures across games where thematically appropriate.
- Pool particles and sprites instead of creating/destroying constantly.
- Disable off-screen updates (`active = false` for sprites outside camera).
- Use object pooling for bullets, obstacles, and collectibles.
- Compress audio to 128 kbps or lower.

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
| Pixel art / sprites | Aseprite, GraphicsGale |
| Vector UI / icons | Figma, Adobe Illustrator |
| Texture packing | TexturePacker, Free Texture Packer |
| Skeletal animation | Spine, DragonBones |
| 3D (if needed) | Blender |
| Audio | Bfxr, LMMS, Audacity |
| Font subsetting | glyphhanger, fonttools |

#### 10.6.2 Export & Optimization Workflow

1. Create art at 2× or 3× target resolution.
2. Export to PNG/OGG source files.
3. Convert images to WebP with fallback PNG.
4. Pack sprites into atlases.
5. Compress audio.
6. Run assets through an optimizer (e.g., `imagemin`, `ffmpeg`).
7. Verify file sizes against the performance budget.
8. Commit to `public/assets/`.

#### 10.6.3 Asset Review Checklist

- [ ] Culturally accurate and appropriate for children.
- [ ] Consistent with the platform color palette.
- [ ] Readable at target resolution.
- [ ] Optimized and within budget.
- [ ] Includes RTL-safe layout where text is involved.
- [ ] Has fallback formats where required.

---

### 10.7 Game-Specific Animation Notes

| Game | Required Animations |
|------|---------------------|
| Frankincense Collector | Run cycle, jump, duck, obstacle break, background parallax, score pop, game-over fade |
| Tic-Tac-Toe | Mark pop-in, cell highlight, win-line draw, draw reaction, confetti on win |
| Fort Battle | Bow draw/release, arrow flight, block crumble, fort shake, collapse, wind flag, victory/defeat pose |
| Camel Race | Gallop cycle, dust clouds, crowd cheer, finish-line burst |
| Omani Sweets Catcher | Falling sweets, basket catch, combo counter, missed-item reaction |
| Memory | Card flip, match glow, mismatch shake, board clear celebration |
| Beach Football | Kick, ball arc, goal net ripple, crowd reaction |
| Pottery Maker | Wheel spin, clay morph, paint stroke, kiln glow |

Use this table as a template when planning new games.

---

## 11. Testing Strategy

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

## 12. Migration Roadmap

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

## 13. Deployment

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
| Game engine | Phaser 3 | Best balance of features, maturity, and mobile performance for 2D games. |
| App framework | Svelte 5 / Vue 3 | Lightweight, reactive, excellent RTL support. |
| Multiplayer | Colyseus | Authoritative server prevents cheating and supports child-safe room management. |
| Backend data | Supabase | Integrated auth + PostgreSQL + realtime reduces backend work. |
| Build tool | Vite | Fast, modern, simple configuration, PWA-ready. |
| Styling | CSS vars + optional Tailwind | Preserves existing design system while improving productivity. |

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

Define the model early because it changes architecture.

#### 16.2.1 Candidate Models

| Model | Fit | Notes |
|-------|-----|-------|
| **Free, sponsored** | Best for Oman educational context | Ministry, school, or NGO sponsorship |
| **Freemium cosmetics** | Safe for kids | Unlockable avatars, themes, badges; no pay-to-win |
| **Ads** | Risky for under-13 | Only use COPPA-certified networks; avoid interstitials mid-game |
| **Institutional license** | B2B option | Schools pay for classroom accounts |

#### 16.2.2 In-Game Economy (if used)

- Use a soft currency earned by playing.
- Avoid real-money purchases directly in the child-facing app.
- All purchases go through a parent dashboard.

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
| Phaser | Load JSON locale files and resolve keys manually |

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
- Catch errors inside Phaser scenes and return to the home screen gracefully.
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
| **Oman PDPL** | Local data protection compliance |

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
- Track licenses of third-party assets (fonts, audio, sprites).
- Include an attribution file if required.

---

### 16.12 Contributor Onboarding

Add a `CONTRIBUTING.md` that explains:

1. How to set up the project locally.
2. How to run tests.
3. How to add a new game using the `GameModule` interface.
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
| **Campaign / Region Map** | Progress through Omani regions to unlock games | Adds cohesion across the 20-game catalogue | Medium |
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
5. **Classroom Mode** — valuable for the Omani educational context, but requires teacher-facing UX.

---

## 18. Next Immediate Actions

1. Decide between **Svelte 5** and **Vue 3** based on team familiarity.
2. Initialize the Vite + TypeScript + chosen framework project.
3. Migrate the existing CSS variables into the new project.
4. Set up Phaser 3 and render a placeholder scene.
5. Write a Colyseus schema for Tic-Tac-Toe and run a local server.

---

*This document should be treated as a living framework. Update it as the project evolves and as the team makes new technical decisions.*
