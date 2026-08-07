# GDD 06 — Falcon Flight

**Game ID:** `falcon`  
**Arabic Name:** رحلة الصقر  
**English Name:** Falcon Flight  
**Icon:** 🦅  
**Version:** 1.0  
**Date:** 2026-07-25  
**Studio:** Aldoolab  
**Platform:** Sahara Play / صحراء بلاي  
**Engine:** Babylon.js  
**Target Age:** 7–12

---

## 1. Elevator Pitch

Soar over the golden dunes of the Gulf as a trained falcon. Dip through canyons, dodge cliffs and dust devils, and swoop down on prey to bring back to your falconer. Easy one-touch controls, endless desert skies, and a gentle cultural lesson in the ancient art of falconry.

---

## 2. Game Identity

| Field | Value |
|-------|-------|
| **Genre** | Endless flier / casual action |
| **Play Modes** | Single-player endless; Daily challenge with a fixed route |
| **Online Feasible** | No — asynchronous leaderboard only |
| **Estimated Effort** | Low–Medium |
| **Session Length** | 1–3 minutes per run |
| **Accessibility** | One-touch play, large touch targets, optional reduced-speed mode |

### 2.1 GameConfig Contract

```ts
export const falconFlightConfig: GameConfig = {
  id: 'falcon',
  name: 'رحلة الصقر',
  nameEn: 'Falcon Flight',
  icon: '🦅',
  supportsSingle: true,
  supportsDaily: true,
  supportsOnline: false,
  gameKey: 'FalconFlightGame',
  preloadAssets: [...],
};
```

---

## 3. Theme & Narrative

The player is a young apprentice falconer learning to fly with their bird. Each run is a training flight across an endless desert: red sand dunes, rocky wadis, scattered palm groves, and distant silhouettes of old forts and camel caravans. There are no modern buildings or vehicles — only wind, sand, and the bond between falcon and falconer.

At the end of every flight the falcon returns to the falconer’s glove, earning praise and a small reward based on distance and prey collected.

### 3.1 Setting Details

- **Era:** Pre-oil Gulf, traditional Bedouin falconry setting.
- **Location:** Open desert sky above dunes, wadis, and oasis groves.
- **Time of day:** Golden hour, with warm oranges, soft purples, and long shadows.
- **Player:** A stylized falcon with a small leather hood hint and patterned leg band.
- **Falconer:** Visible at the start and end of each run, wearing a simple white thobe-style garment.

### 3.2 Prey & Hazards

| Object | Type | Effect |
|--------|------|--------|
| **Desert hare** | Prey | +5 points, small boost to energy. |
| **Houbara bustard** | Prey | +10 points, medium energy boost. |
| **Desert quail** | Prey | +8 points, small speed boost. |
| **Cliff outcrop** | Hazard | Ends run if hit. |
| **Dust devil** | Hazard | Pushes falcon off course; ends run if driven into ground. |
| **Vulture** | Hazard | Collision ends run. |
| **Turbulent updraft** | Hazard | Sudden vertical push; must correct quickly. |

---

## 4. Core Loop

1. The falcon launches from the falconer’s glove.
2. The desert scrolls automatically from right to left.
3. The player holds to climb, releases to dive.
4. Prey appears at various heights; swooping through it collects points and energy.
5. Hazards appear more frequently as speed increases.
6. Hitting a hazard or the ground ends the run.
7. The falcon returns to the glove; coins/points are awarded.
8. Coins unlock new falcon colors, leg-band patterns, and desert backgrounds.

---

## 5. Win / Lose Conditions

- **Lose:** The falcon hits a hazard, the ground, or flies too high and leaves the playable sky.
- **Win:** There is no fixed win — the goal is to beat your own distance and score.
- **Daily Challenge:** A pre-set route with the same hazards for all players; leaderboard ranks by score.

---

## 6. Mechanics

### 6.1 Flight Physics

- Constant horizontal speed that slowly increases over time.
- Vertical velocity controlled by player input:
  - **Hold / tap:** flap upward.
  - **Release:** gravity pulls the falcon down.
- Maximum upward and downward angles are clamped for smooth, bird-like arcs.
- A gentle auto-glide at the top of a climb makes the flight feel floaty and forgiving.

### 6.2 Prey Collection

- Prey spawns in loose groups or alone at readable heights.
- Swooping close to prey collects it automatically.
- Collecting three prey in quick succession triggers a short "hunting streak" multiplier.

### 6.3 Energy

- The falcon has an energy bar that slowly drains over time.
- Collecting prey refills energy.
- If energy reaches zero, the falcon slows and gradually descends, making hazards harder to avoid.

### 6.4 Difficulty Scaling

| Phase | Speed | Hazard Density | Prey Density |
|-------|-------|----------------|--------------|
| Take-off | Slow | Very low | High |
| Cruising | Medium | Low | Medium |
| High desert | Fast | Medium | Medium |
| Storm run | Very fast | High | Low |

### 6.5 Power-ups

| Power-up | Effect |
|----------|--------|
| **Tailwind** | Brief speed boost + invincibility from wind hazards. |
| **Sharper Eyes** | Highlights prey with a soft glow for a few seconds. |
| **Second Wind** | Refills energy to full once per run if collected. |

---

## 7. 3D Art Direction

- **Style:** Stylized low-poly with flat shading, warm sunset palette, soft papercraft silhouettes.
- **Falcon:** Compact body, pointed wings, fan tail, expressive eyes, small leather hood hint, patterned leg band.
- **Environment:** Rolling sand dunes, flat-topped rock outcrops, scattered palm groves, distant fort silhouettes, drifting clouds.
- **Effects:** Wing-flap dust puffs, prey collection sparkles, wind streaks during speed boost, sand particles in storm sections.
- **Camera:** Side-scrolling view that follows the falcon smoothly, with a slight tilt into dives and climbs.

### 7.1 Asset List

| Category | Assets |
|----------|--------|
| Characters | Falcon player, falconer NPC, vulture hazard |
| Prey | Desert hare, houbara bustard, desert quail |
| Environment | Dune chunks, rock outcrops, palm grove clusters, fort silhouettes, cloud layers, sun/moon |
| Hazards | Dust devils, turbulent updraft markers, cliff rocks |
| UI | Score counter, energy bar, distance marker, mute button, power-up icons, result screen |
| Particles | Sand dust, wing puffs, prey sparkle, wind streaks |

---

## 8. Controls

| Device | Input |
|--------|-------|
| Desktop | Hold `Space` / left mouse button to climb; release to dive. |
| Tablet / Mobile | Touch and hold to climb; release to dive. |

---

## 9. UI & Feedback

- Top-left: distance travelled.
- Top-right: score and prey count.
- Top-center: energy bar.
- Bottom hint on first run: "استمر بالضغط للطيران للأعلى، اترك للانخفاض".
- Mute button in header.
- Result screen: distance, score, best score, coins earned, retry button, home button.

---

## 10. Audio

- **Music:** Gentle, looping oud and ney melody with a soft drum pulse, evoking a calm desert flight.
- **SFX (synthesized):**
  - Wing flap
  - Wind rush during dive
  - Prey catch chirp
  - Power-up chime
  - Hazard collision thud
  - Return-to-glove fanfare

---

## 11. Online Safety

- No free text chat.
- No account-required multiplayer.
- Optional nickname-only leaderboard (future).
- All progress stored locally by default.

---

## 12. Monetization & Retention Hooks

- Unlockable falcon colors and leg-band patterns.
- Unlockable desert themes (sunset, dawn, night under stars, Ramadan lanterns).
- Daily challenge leaderboard.
- Achievement badges for distance milestones and prey streaks.

---

## 13. Asset Formats

| Asset Type | Format | Notes |
|------------|--------|-------|
| Models | Procedural Babylon.js meshes | Falcon, prey, hazards, dunes |
| Textures | CSS / canvas gradients | Minimal; WebP fallback if needed |
| UI sprites | WebP / PNG | Packed into small atlases |
| Audio | Web Audio API synthesized | No external audio files in v1.0 |

---

## 14. Analytics Events

| Event | Purpose |
|-------|---------|
| `game_started` | Track game popularity. |
| `run_completed` | Track average run length. |
| `prey_collected` | Track engagement with scoring loop. |
| `power_up_used` | Track power-up economy. |
| `daily_challenge_played` | Retention analysis. |
| `unlock_purchased` | Track cosmetic engagement. |

---

## 15. Offline & PWA

- Endless mode works offline after first load.
- Daily challenge requires a connection to fetch the seed/leaderboard.
- Service worker caches the game bundle.

---

## 16. Compliance & Safety

- No free text chat.
- Minimal data collection: optional nickname, scores.
- Comply with GCC data protection regulations and COPPA/GDPR-K.
- Parent dashboard for time limits and data deletion.

---

## 17. Monetization

- **Freemium cosmetics** — unlockable falcon skins, leg-band patterns, and desert themes.
- **One-time Full Game Pass** — unlock all games and themes.
- **Seasonal content** — GCC National Day desert palette.
- **Optional rewarded video** — after 50K+ MAU, COPPA-certified only.
- No interstitials, banners, or personalized ads.

---

## 18. Implementation Notes (v1.0)

- Built as a Babylon.js scene inside a SvelteKit lazy-loaded component.
- All meshes are procedural; no external GLB/texture assets required for the playable version.
- Game logic is pure TypeScript (`FalconFlightLogic.ts`) with matching unit tests.
- World scroll is simulated by moving environment chunks left and recycling them.
- Collision is simple bounding-sphere checks between the falcon and prey/hazards.
- Audio is synthesized at runtime via the Web Audio API; a mute toggle is exposed through the game header.

---

## 19. Technical Notes

- Use the same project layout as existing games: `Logic.ts`, `Game.ts`, Svelte wrapper, `index.ts`, tests.
- Target 60 FPS on Tier 1 tablets; keep draw calls low by pooling and recycling dune/rock chunks.
- Dispose scene, meshes, materials, and observables on exit.

---

*Prepared by Aldoolab for Sahara Play / صحراء بلاي.*
