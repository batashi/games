# GDD 04 — Luban Sorter

**Game ID:** `luban-sorter`  
**Arabic Name:** فرز اللبان  
**English Name:** Luban Sorter  
**Icon:** 🧺  
**Version:** 1.0  
**Date:** 2026-07-21  
**Studio:** Aldoolab  
**Platform:** GCC Kids Web Game Platform  
**Engine:** Babylon.js  
**Target Age:** 7–11  

---

## 1. Elevator Pitch

A young trader apprentice sorts precious frankincense resin by grade, packs it into traditional pouches, and loads it onto a caravan before sunset. A calm, satisfying puzzle game that teaches the value of one of the Gulf’s oldest treasures.

---

## 2. Game Identity

| Field | Value |
|-------|-------|
| **Genre** | Puzzle / sorting / educational |
| **Play Modes** | Single-player, Daily Challenge, Practice / Free Play |
| **Online Feasible** | No — asynchronous leaderboards only |
| **Estimated Effort** | Small |
| **Session Length** | 2–4 minutes |
| **Accessibility** | Color-blind safe grades (shape + pattern), one-handed play, ≥ 64 px touch targets, no time pressure in Practice mode |

### 2.1 GameConfig Contract

```ts
export const lubanSorterConfig: GameConfig = {
  id: 'luban-sorter',
  name: 'فرز اللبان',
  nameEn: 'Luban Sorter',
  icon: '🧺',
  supportsSingle: true,
  supportsLocal: false,
  supportsOnline: false,
  supportsDaily: true,
  gameKey: 'LubanSorterGame',
  preloadAssets: [...],
};
```

---

## 3. Theme & Narrative

The game is set in a historic Gulf frankincense market. The player helps a kind trader prepare a shipment of *luban* (frankincense resin) for a caravan journey along ancient trade routes.

Each round introduces a new market scene:

- A shaded *souq* stall with woven mats.
- A mountain village near Dhofar’s frankincense trees.
- A coastal loading dock where dhows wait for cargo.
- A desert caravan stop under a starry sky.

Country-specific backdrops can be added later for Oman, Saudi Arabia, the UAE, Qatar, Bahrain, and Kuwait.

---

## 4. Core Loop

1. Resin pieces appear on a sorting mat.
2. Player drags or taps each piece into the correct grade basket.
3. Correct sorts score points and fill a progress meter.
4. Once enough resin is sorted, the player packs pouches and loads them onto the caravan.
5. Each cleared level introduces more grades, faster spawns, or mixed shapes.

---

## 5. Win / Lose Conditions

- **Win:** Sort the required number of pieces correctly and pack the shipment before the caravan departs.
- **Lose:** Make too many wrong sorts (lose all quality stars) or run out of time on timed levels.
- **Star Rating:** Up to three stars based on accuracy, speed, and number of perfect chains.

---

## 6. Mechanics

| Mechanic | Description |
|----------|-------------|
| Sort by grade | Drag each resin piece to one of three baskets: Premium (large, pale tears), Standard (medium, amber), Ordinary (small, dark). |
| Shape + pattern cue | Each grade has a distinct silhouette and surface pattern so color is not the only signal. |
| Combo chain | Several correct sorts in a row multiply the score. |
| Quality stars | Wrong sorts reduce stars; perfect rounds keep all three. |
| Pack & load | After sorting, tap pouches in the right order to load the caravan. |
| Power-up: Wind blower | Clears dust from a piece, revealing its true grade. |
| Power-up: Trader’s hint | Highlights the correct basket for one piece. |
| Difficulty curve | More grades, faster spawn rate, and mixed pieces appear every few levels. |

---

## 7. 3D Art Direction

- **Style:** Stylized low-poly 3D with warm market lighting.
- **Character:** A friendly trader child in traditional Gulf attire.
- **Environment:** Woven mats, clay baskets, leather pouches, wooden tables, palm-leaf roofing, caravan camels, and a dhow in the background.
- **Camera:** Static, slightly angled overhead view so the whole sorting mat is visible.
- **Effects:** Soft pop when a piece lands, sparkle on correct sort, gentle shake on mistake, dust particles in sunlight.

### 7.1 Asset List

| Category | Assets |
|----------|--------|
| Characters | Trader child, elder trader (mentor), camel |
| Items | Frankincense resin pieces (3 grades), woven baskets, leather pouches, scales, stamp seal |
| Environment | Market stall, Dhofar mountain scene, coastal dock, desert caravan stop |
| UI | Progress meter, star rating, score panel, basket labels, pause/menu buttons |
| Particles | Dust motes, sparkle, puff on correct sort |

---

## 8. Controls

| Device | Input |
|--------|-------|
| Desktop | Mouse drag-and-drop; click a piece then click a basket; Space = hint; P = pause; Esc = menu. |
| Tablet / Mobile | Drag-and-drop with finger; tap piece then tap basket; on-screen hint button. |

---

## 9. UI & Feedback

- Score and level display at the top.
- Caravan progress meter on the right.
- Three quality stars at the top-left.
- Basket labels show grade names and icons.
- Correct sort: chime + sparkle + piece shrinks into basket.
- Wrong sort: gentle red flash + buzz + piece returns to mat.
- Level-complete screen shows stars, best score, and “Next Level / Retry / Home” buttons.

---

## 10. Audio

- **Music:** Soft oud and percussion loop, market atmosphere.
- **SFX:**
  - Pop when picking up a piece
  - Satisfying thud when dropping into a basket
  - Chime for correct sort
  - Soft buzz for wrong sort
  - Caravan departure fanfare on level complete

---

## 11. Monetization & Retention Hooks

- Unlockable basket and pouch designs (cosmetic only).
- Daily challenge with a fixed puzzle and leaderboard.
- Achievements: first perfect level, 50 correct sorts, complete all country backdrops.

---

## 12. Asset Formats

| Asset Type | Format | Notes |
|------------|--------|-------|
| Character / item models | GLB (GLTF 2.0) | Draco-compressed meshes. |
| Textures | KTX2 / Basis Universal | WebP/PNG fallback. |
| UI sprites | WebP / PNG | Packed into atlases. |
| Audio | OGG | MP3 fallback. |
| Animation | GLB animation groups | Idle, pick, place, celebrate, head-shake. |

## 13. Analytics Events

| Event | Purpose |
|-------|---------|
| `game_started` | Track game popularity. |
| `level_completed` | Track progression and difficulty balance. |
| `score_recorded` | Balance scoring and leaderboards. |
| `hint_used` | Understand where players struggle. |
| `error_occurred` | Stability monitoring. |

## 14. Offline & PWA

- Single-player mode works fully offline after first load.
- Progress and high scores saved locally and synced when online.
- Service worker caches static assets and game bundle.

## 15. Compliance & Safety

- Collect only nickname (optional), avatar choice, and score.
- No personal identifiers for children under 13 without guardian consent.
- Comply with GCC data protection regulations and COPPA/GDPR-K if serving outside the GCC.
- Parent dashboard allows playtime limits and data deletion.

## 16. Monetization

- **One-time Full Game Pass** — parent-friendly unlock of all games.
- **Freemium cosmetics** — unlockable basket, mat, and pouch designs; no pay-to-win.
- **Optional rewarded video** — only after 50K+ MAU and only COPPA-certified networks.
- **Ads constraints** — rewarded video only; no interstitials, banners, or personalized ads.

## 17. Technical Notes

- Use a small pool of resin piece meshes to reduce draw calls.
- Animate pieces with Babylon.js animation groups, not physics.
- Keep the scene lightweight: target 60 FPS on Tier 1 tablets.
- Asset budget: < 6 MB.
- Dispose scene, meshes, materials, and observables on exit.

---

*Prepared by Aldoolab for the GCC Kids Web Game Platform.*
