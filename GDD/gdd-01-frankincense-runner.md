# GDD 01 — Frankincense Collector Runner

**Game ID:** `frankincense`  
**Arabic Name:** مغامرة جامع اللبان  
**English Name:** Frankincense Collector Runner  
**Icon:** 🏃‍♂️  
**Version:** 1.0  
**Date:** 2026-07-21  
**Studio:** Aldoolab  
**Platform:** GCC Kids Web Game Platform  
**Engine:** Babylon.js  
**Target Age:** 7–12  

---

## 1. Elevator Pitch

A young collector runs through ancient Gulf trade routes, jumping over obstacles and sliding under hazards to gather precious frankincense resin before sunset. Fast, friendly, and endlessly replayable.

---

## 2. Game Identity

| Field | Value |
|-------|-------|
| **Genre** | Endless runner / action |
| **Play Modes** | Single-player vs AI / endless, Daily Challenge, Practice / Free Play |
| **Online Feasible** | No — asynchronous leaderboards only |
| **Estimated Effort** | Small |
| **Session Length** | 1–3 minutes |
| **Accessibility** | Color-blind safe obstacles (shape + outline), motion-safe option reduces camera shake, ≥ 64 px touch targets |

### 2.1 GameConfig Contract

```ts
export const frankincenseConfig: GameConfig = {
  id: 'frankincense',
  name: 'مغامرة جامع اللبان',
  nameEn: 'Frankincense Collector Runner',
  icon: '🏃‍♂️',
  supportsSingle: true,
  supportsLocal: false,
  supportsOnline: false,
  supportsDaily: true,
  gameKey: 'FrankincenseGame',
  preloadAssets: [...],
};
```

---

## 3. Theme & Narrative

The game celebrates the historic frankincense trade that connected the GCC to the ancient world. The runner travels through:

- Desert dunes and rocky wadis.
- Oasis villages with palm trees.
- Ancient trade markers and caravan stops.

Country-specific backdrops can be added later: Omani Dhofar, Saudi Empty Quarter, UAE Hajar Mountains, Qatari inland sea, Kuwaiti islands, Bahraini pearl banks.

---

## 4. Core Loop

1. Character runs forward automatically.
2. Player taps to jump or swipes down to slide.
3. Collect frankincense droplets and dates; avoid obstacles.
4. Survive as long as possible while speed and score increase.

---

## 5. Win / Lose Conditions

- **Win:** Reach a target distance or score threshold (level-based mode) or achieve a new high score (endless mode).
- **Lose:** Collide with too many obstacles and lose all hearts.

---

## 6. Mechanics

| Mechanic | Description |
|----------|-------------|
| Auto-run | Character moves forward automatically at increasing speed. |
| Jump | Tap, space, or up-arrow to jump over ground obstacles. |
| Slide / Duck | Swipe down or down-arrow to slide under hanging obstacles. |
| Collectibles | Frankincense droplets add score; date fruits restore one heart. |
| Obstacles | Rocks, scorpions, hot sand patches, camel caravans (slowdown). |
| Difficulty | Speed and obstacle density increase every 30 seconds. |
| Combo | Collect several frankincense pieces in a row for a score multiplier. |

---

## 7. 3D Art Direction

- **Style:** Stylized low-poly 3D with warm desert tones.
- **Character:** A young boy or girl in Gulf attire. Unlockable avatars include a camel, falcon, and traditional-dress variants.
- **Environment:** Desert dunes, oasis palms, frankincense trees, rocky wadis, ancient trade markers.
- **Camera:** Third-person follow camera, slightly angled to show depth.
- **Effects:** Dust clouds on landing, heat shimmer, golden sparkle on collectibles, screen shake on hard collision.

### 7.1 Asset List

| Category | Assets |
|----------|--------|
| Characters | Runner boy, runner girl, camel, falcon |
| Obstacles | Rocks, scorpions, awnings, bee hives, camel caravans |
| Environment | Dune chunks, palm trees, frankincense trees, rocks, sky dome |
| UI | Score panel, hearts, pause button, game-over modal |
| Particles | Dust, sparkle, heat shimmer |

---

## 8. Controls

| Device | Input |
|--------|-------|
| Desktop | Space / Up Arrow = jump; Down Arrow = slide; P = pause; Esc = menu. |
| Tablet / Mobile | Tap anywhere = jump; swipe down = slide; optional on-screen jump/duck buttons. |

---

## 9. UI & Feedback

- Score counter top-left.
- Hearts top-right.
- Distance progress bar at bottom.
- Flash + sound on hit.
- Screen shake on hard collision (disable in reduced-motion mode).
- Combo multiplier indicator.
- Game-over modal with retry, home, and score summary.

---

## 10. Audio

- **Music:** Light oud/rhythm loop, calm and adventurous.
- **SFX:**
  - Jump grunt
  - Landing thud
  - Collectible chime
  - Collision crash
  - Milestone fanfare

---

## 11. Monetization & Retention Hooks

- Unlockable character skins (cosmetic only).
- Daily challenge with leaderboard.
- Achievement: first run, 1,000 points, 10 collectibles in one run.

---

## 12. Asset Formats

| Asset Type | Format | Notes |
|------------|--------|-------|
| Character / obstacle models | GLB (GLTF 2.0) | Draco-compressed meshes. |
| Textures | KTX2 / Basis Universal | WebP/PNG fallback for unsupported devices. |
| UI sprites | WebP / PNG | Packed into atlases. |
| Audio | OGG | MP3 fallback. |
| Animation | GLB animation groups | Idle, run, jump, slide, celebrate, hurt. |

## 13. Analytics Events

| Event | Purpose |
|-------|---------|
| `game_started` | Track game popularity. |
| `game_completed` | Track completion and drop-off. |
| `score_recorded` | Balance difficulty and leaderboards. |
| `session_length` | Retention analysis. |
| `error_occurred` | Stability monitoring. |

## 14. Offline & PWA

- Single-player mode works fully offline after first load.
- Scores saved locally and synced when online.
- Service worker caches static assets and game bundle.

## 15. Compliance & Safety

- Collect only nickname (optional), avatar choice, and score.
- No personal identifiers for children under 13 without guardian consent.
- Comply with GCC data protection regulations and COPPA/GDPR-K if serving outside the GCC.
- Parent dashboard allows playtime limits and data deletion.

## 16. Monetization

- **One-time Full Game Pass** — parent-friendly unlock of all games.
- **Freemium cosmetics** — unlockable skins and avatars; no pay-to-win.
- **Optional rewarded video** — only after 50K+ MAU and only COPPA-certified networks.
- **Ads constraints** — rewarded video only; no interstitials, banners, or personalized ads.

## 17. Technical Notes

- Use object pooling for obstacles and collectibles.
- Generate world chunks procedurally to keep memory low.
- Target 60 FPS on Tier 1 tablets.
- Asset budget: < 8 MB.
- Dispose scene, meshes, materials, and observables on exit.

---

*Prepared by Aldoolab for the GCC Kids Web Game Platform.*
