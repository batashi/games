# GDD 05 — Souq al-Khaleej

**Game ID:** `souq-manager`  
**Arabic Name:** سوق الخليج  
**English Name:** Souq al-Khaleej  
**Icon:** 🏪  
**Version:** 1.0  
**Date:** 2026-07-24  
**Studio:** Aldoolab  
**Platform:** GCC Kids Web Game Platform  
**Engine:** Babylon.js  
**Target Age:** 7–11  

---

## 1. Elevator Pitch

Run your own traditional Gulf market stall! Stock shelves with dates, frankincense, oud, and other cultural treasures, serve happy customers, earn coins, and hire apprentice workers to keep the souq booming before the timer runs out.

---

## 2. Game Identity

| Field | Value |
|-------|-------|
| **Genre** | Time-management / shop simulation |
| **Play Modes** | Single-player level progression; Daily Challenge (future) |
| **Online Feasible** | No — asynchronous leaderboards only |
| **Estimated Effort** | Medium |
| **Session Length** | 2–4 minutes per level |
| **Accessibility** | One-handed play, ≥ 64 px touch targets, visual role badges for workers, optional hint highlights for younger players |

### 2.1 GameConfig Contract

```ts
export const souqManagerConfig: GameConfig = {
  id: 'souq-manager',
  name: 'سوق الخليج',
  nameEn: 'Souq al-Khaleej',
  icon: '🏪',
  supportsSingle: true,
  supportsDaily: true,
  supportsOnline: false,
  gameKey: 'SouqManagerGame',
  preloadAssets: [...],
};
```

---

## 3. Theme & Narrative

The game is set in a bustling heritage souq at golden hour. The player is a young stall owner learning the trade from a wise elder. Each level represents a busier market day, with more customers, more goods, and bigger targets.

### 3.1 Setting Details

- **Location:** A covered stone alley with palm-wood beams, sand floor, hanging lanterns, and a mosque silhouette at sunset.
- **Stall:** A wooden counter with woven baskets, brass scales, and a traditional coffee corner.
- **Customers:** Cartoon Gulf families, elders, sailors, and tourists.
- **Workers:** Young apprentices wearing simple traditional clothing.

### 3.2 Goods

| Good | Visual | Price |
|------|--------|-------|
| Dates | Brown oval pile | 5 coins |
| Arabic coffee (qahwa) | Small dallah pot | 8 coins |
| Frankincense (luban) | Small resin bag | 10 coins |
| Oud oil | Tiny glass bottle | 12 coins |
| Saffron | Red-thread jar | 15 coins |
| Halwa | Square sweet block | 7 coins |
| Pearls | String of small spheres | 18 coins |

---

## 4. Core Loop

1. The player owns a **souq stall**.
2. A stock crate in the back produces GCC goods over time.
3. The player taps or drags the player character to **pick up goods** and **place them on empty shelves**.
4. Customers enter the souq, walk to a stocked shelf, pick an item, then wait at the **cashier mat**.
5. The player moves to the cashier mat to **collect coins**.
6. Coins can be spent between levels to unlock:
   - More shelves / product types.
   - Faster walking / restocking speed.
   - **Workers/apprentices** who automate restocking or cashier collection.
   - Worker upgrades (speed, carry capacity, extra helpers).
   - Decorations (lanterns, carpets, Gulf patterns).
7. Each level has a **coin target** and a **timer**. Stars are awarded based on performance.

---

## 5. Win / Lose Conditions

- **Win:** Earn at least the target coins before time runs out.
- **Lose:** Time runs out before reaching the target.
- **Stars:**
  - ⭐ Reached target.
  - ⭐⭐ Reached target + 20%.
  - ⭐⭐⭐ Reached target + 50%.

---

## 6. Mechanics

| Mechanic | Description |
|----------|-------------|
| Stock crate | Generates one unit of a random unlocked good every few seconds. |
| Shelves | Hold up to N units. Empty shelves cannot serve customers. |
| Customers | Spawn at the entrance, walk to a shelf, pick an item, then wait at the cashier mat. |
| Player movement | Tap or drag to move the character to a target point. |
| Carrying | Player can hold one item at a time by default; upgrades can increase capacity. |
| Payment | Customer waits at cashier mat until the player collects coins. |
| Timer | Counts down during the level. |
| Workers | Hired apprentices with roles: **Restocker** (crate → shelf) or **Cashier** (cashier mat → coins). |
| Worker upgrades | Speed and carry capacity; up to 2 workers in MVP. |
| Level target | Coin goal that scales with level number. |
| Hints | Gentle shelf glow when stock is low; cashier glow when customers are waiting. |

### 6.1 Worker System

- Workers are hired on the level-complete shop screen using coins.
- Each worker has a single role assigned by the player:
  - **Restocker:** Automatically walks to the stock crate, picks up goods, and fills the nearest empty shelf.
  - **Cashier:** Automatically walks to the cashier mat and collects payment from waiting customers.
- Workers move slower than the upgraded player but scale with upgrades.
- Later levels require workers to hit the coin target, teaching resource management.

---

## 7. 3D Art Direction

- **Style:** Stylized low-poly procedural meshes built in Babylon.js (no external model files in v1.0).
- **Stall:** Wooden counter, woven baskets, brass scales, hanging lanterns.
- **Characters:** Simple low-poly player, customers, and workers with traditional Gulf clothing hints.
- **Environment:** Sand floor, stone walls, palm-wood beams, distant mosque silhouette, warm sunset lighting.
- **Camera:** Fixed isometric view, slightly angled, touch-friendly.
- **Effects:** Coin pop-ups, item restock bounce, happy/sad customer reactions, lantern glow.

### 7.1 Asset List

| Category | Assets |
|----------|--------|
| Environment | Ground plane, stall structure, shelves, stock crate, cashier mat, lanterns |
| Characters | Player character, customer variants, worker/apprentice |
| Goods | Dates pile, dallah pot, luban bag, oud bottle, saffron jar, halwa block, pearl string |
| UI | Level picker cards, coin counter, timer bar, star icons, upgrade buttons |
| Particles | Coin sparkle, restock puff, customer happy emoji |

---

## 8. Controls

| Device | Input |
|--------|-------|
| Desktop | Mouse click / drag to move character; click crate/shelf/cashier to interact. |
| Tablet / Mobile | Touch and drag to move; tap targets to interact. |

---

## 9. UI & Feedback

- Top HUD: coin count, timer, current target.
- Bottom hint: current objective or tip.
- Level picker: level cards with star ratings and locked/unlocked state.
- Shop screen (between levels): upgrades, worker hiring, decorations.
- Result screen: coins earned, stars, next-level button.
- Mute button in the game header.

---

## 10. Audio

- **Music:** Light, upbeat souq-themed loop with oud and riq rhythms, synthesized via Web Audio.
- **SFX (synthesized):**
  - Restock pop
  - Coin collect chime
  - Customer spawn / happy reaction
  - Level complete fanfare
  - Timer warning tick

---

## 11. Online Safety

- No free text chat.
- No account-required multiplayer.
- Optional nickname-only leaderboard (future).
- All data stored locally by default.

---

## 12. Monetization & Retention Hooks

- Unlockable stall decorations and worker outfits (cosmetic only).
- Seasonal souq themes (Ramadan, Eid, National Day).
- Daily challenge with a fixed layout and leaderboard (future).

---

## 13. Asset Formats

| Asset Type | Format | Notes |
|------------|--------|-------|
| Models | Procedural Babylon.js meshes | Boxes, cylinders, spheres, planes |
| Textures | CSS / canvas gradients | Minimal; WebP fallback if needed |
| UI sprites | WebP / PNG | Packed into small atlases |
| Audio | Web Audio API synthesized | No external audio files in v1.0 |

---

## 14. Analytics Events

| Event | Purpose |
|-------|---------|
| `game_started` | Track game popularity. |
| `level_completed` | Track progression and difficulty curve. |
| `level_failed` | Identify hard levels. |
| `worker_hired` | Track economy engagement. |
| `session_length` | Retention analysis. |

---

## 15. Offline & PWA

- Single-player level progression works offline after first load.
- Service worker caches the game bundle.

---

## 16. Compliance & Safety

- No free text chat.
- Minimal data collection: optional nickname, scores.
- Comply with GCC data protection regulations and COPPA/GDPR-K.
- Parent dashboard for time limits and data deletion.

---

## 17. Monetization

- **Freemium cosmetics** — unlockable stall themes and worker outfits.
- **One-time Full Game Pass** — unlock all games and themes.
- **Seasonal content** — GCC National Day souq decorations.
- **Optional rewarded video** — after 50K+ MAU, COPPA-certified only.
- No interstitials, banners, or personalized ads.

---

## 18. Implementation Notes (v1.0)

- Built as a Babylon.js scene inside a SvelteKit lazy-loaded component.
- All meshes are procedural; no external GLB/texture assets required for the playable version.
- Game logic is pure TypeScript (`SouqManagerLogic.ts`) with matching unit tests.
- Player, customers, and workers are simple entities with positions, targets, and movement speed.
- Collision/pathfinding is grid-free: characters move in straight lines toward targets and stop when close enough.
- Audio is synthesized at runtime via the Web Audio API; a mute toggle is exposed through the game header.
- Level data is defined in a JSON/TS config so designers can tweak targets, spawn rates, and unlocks without touching code.

---

## 19. Technical Notes

- Use the same project layout as Fort Battle: `Logic.ts`, `Game.ts`, Svelte wrapper, `index.ts`, tests.
- Target 60 FPS on Tier 1 tablets; keep draw calls low by reusing materials and instancing shelves.
- Dispose scene, meshes, materials, and observables on exit.

---

*Prepared by Aldoolab for the GCC Kids Web Game Platform.*
