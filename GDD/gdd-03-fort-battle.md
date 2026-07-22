# GDD 03 — Fort Battle

**Game ID:** `archery`  
**Arabic Name:** معركة القلاع  
**English Name:** Fort Battle  
**Icon:** 🏰  
**Version:** 1.0  
**Date:** 2026-07-21  
**Studio:** Aldoolab  
**Platform:** GCC Kids Web Game Platform  
**Engine:** Babylon.js  
**Target Age:** 10–12  

---

## 1. Elevator Pitch

Two historic Gulf forts face each other across a wadi. Players take turns commanding archers, adjusting angle and power to launch arrows and destroy the enemy fort before their own falls.

---

## 2. Game Identity

| Field | Value |
|-------|-------|
| **Genre** | Turn-based physics / artillery |
| **Play Modes** | Single-player vs AI (Easy/Medium/Hard), local 2-player hotseat, online 1v1 friend invite, Co-op vs AI, 2v2 Team Battle (future) |
| **Online Feasible** | Yes — turn-based aiming, authoritative damage validation |
| **Estimated Effort** | Medium |
| **Session Length** | 2–4 minutes |
| **Accessibility** | Aim assist option for younger players, color-blind safe team indicators, ≥ 72 px touch targets |

### 2.1 GameConfig Contract

```ts
export const fortBattleConfig: GameConfig = {
  id: 'archery',
  name: 'معركة القلاع',
  nameEn: 'Fort Battle',
  icon: '🏰',
  supportsSingle: true,
  supportsLocal: true,
  supportsOnline: true,
  supportsCoop: true,
  supportsTeam: true,
  gameKey: 'FortBattleGame',
  preloadAssets: [...],
};
```

---

## 3. Theme & Narrative

The game showcases historic forts from across the GCC. Each fort can be themed by country:

- Oman: Nakhal or Bahla style.
- Saudi Arabia: Masmak or mountain fort style.
- UAE: Al Fahidi or Hajar mountain fort style.
- Bahrain: Bahrain Fort (Qal'at al-Bahrain) style.
- Qatar: Al Zubarah style.
- Kuwait: Red Fort style.

The battlefield is a rocky wadi or coastal inlet at golden hour.

---

## 4. Core Loop

1. Player aims arrow by moving the mouse / finger or using Up/Down keys.
2. Player holds the shoot button or Space to charge power, then releases to fire.
3. Arrow arcs under gravity and wind; hits the enemy fort and deals damage.
4. Players alternate turns until one fort's health reaches zero.

---

## 5. Win / Lose Conditions

- **Win:** Reduce the enemy fort health to zero.
- **Lose:** Your fort health reaches zero first.

---

## 6. Mechanics

| Mechanic | Description |
|----------|-------------|
| Aim | Adjust vertical angle with mouse/touch drag or Up/Down keys. |
| Power | Hold to charge power meter (10–100%); release to shoot. |
| Wind | Random wind value (-3 to +3) each turn affects arrow arc; shown by a sky indicator. |
| Damage | Direct health damage on fort hit; 25 HP per hit. |
| Physics | Gravity arc and wind drift. |
| Aim Guide | Dotted trajectory line preview updates while aiming/charging. |
| AI | Simulates aim and power with adjustable accuracy. Easy misses often; Hard accounts for wind. *(implemented: Easy/Medium/Hard)* |

---

## 7. 3D Art Direction

- **Style:** Stylized low-poly procedural meshes built in Babylon.js (no external model files in v1.0).
- **Forts:** Round Omani-style mud-brick towers with a conical pointed roof and a recessed arched window near the base. Country-specific skins are implemented procedurally per match: each game picks a GCC country theme (OM, SA, AE, QA, BH, KW) that changes the fort body/roof colours, ground tint, sky tint, and roof silhouette (cone, crenellated, dome, flat, stepped).
- **Characters:** Visible archer figures standing on top of each fort, holding a bow and wearing a keffiyeh/turban.
- **Environment:** Sandy ground and sky background, plus procedural distant mountains, palm trees, and scattered rocks. Rocky wadi detail is a future enhancement.
- **Camera:** Fixed side view showing both forts.
- **Effects:** Dotted aim-guide trajectory, hit particle burst, synthesized sound effects.

### 7.1 Asset List

| Category | Assets |
|----------|--------|
| Forts | Two round Omani-style towers (body, conical roof, arched window) |
| Characters | Procedural archer figure (body, head, keffiyeh, arms, bow, quiver) |
| Props | Procedural arrow (shaft, metal head, fletching) |
| Environment | Ground plane, sky color |
| UI | Angle meter, power meter, wind indicator, health bars, turn message |
| Particles | Hit particle burst |

### 7.2 Arrow Design

The player arrow is built from three parts for instant readability:

- **Shaft:** wooden cylinder.
- **Head:** metallic cone.
- **Fletching:** three colored planes at the tail.

The arrow always rotates to face its flight direction (velocity vector) so the head leads and the fletching trails.

### 7.3 Fort Design Requirements

Each fort must visually read as a Gulf/Omani round tower:

- Cylindrical mud-brick body.
- Conical pointed roof (not flat).
- Recessed arched window near the base.
- Archer standing clearly on top.

Country-specific skins and landmark silhouettes are future enhancements.

---

## 8. Controls

| Device | Input |
|--------|-------|
| Desktop | Mouse move = aim; mouse hold/release = charge/fire; Up/Down arrows = fine-tune angle; Space = charge/release shot. |
| Tablet / Mobile | Touch and drag to aim; on-screen angle up/down buttons + large Shoot button to charge/fire. |

---

## 9. UI & Feedback

- Angle, power, and wind HUD at the top center.
- Fort health bars at the top left/right.
- Turn message and last-shot result message.
- Mute button in the game header.
- Online panel: room code, turn timer, emoji reactions. *(future)*
- Aim-assist toggle in settings for younger players. *(future)*

---

## 10. Audio

- **Music:** Tense but playful battle loop. *(future)*
- **SFX (synthesized via Web Audio API in v1.0):**
  - Arrow release whoosh
  - Fort impact thud
  - Miss sound
  - Victory fanfare

---

## 11. Online Safety

- No free text chat.
- Emoji reactions only.
- Invite-only rooms with 4-digit codes.
- Report button visible during every online match.
- Server validates shots and damage; clients send only angle and power intent.

---

## 12. Future Modes

| Mode | Description |
|------|-------------|
| 2v2 Team Battle | Two players share one fort against another team. |
| Co-op vs AI | Two players team up against a computer-controlled fort. |

---

## 13. Monetization & Retention Hooks

- Unlockable fort skins and archer outfits (cosmetic only).
- Seasonal fort themes for GCC National Days.
- Weekly leaderboard for online matches.

---

## 14. Asset Formats

| Asset Type | Format | Notes |
|------------|--------|-------|
| Fort / character / arrow models | GLB (GLTF 2.0) | Draco-compressed meshes. |
| Textures | KTX2 / Basis Universal | Mud-brick, wood, metal, sand, water; WebP/PNG fallback. |
| UI sprites | WebP / PNG | Packed into atlases. |
| Audio | OGG | MP3 fallback. |
| Animation | GLB animation groups | Idle, aim, shoot, celebrate, hurt, block crumble. |

## 15. Analytics Events

| Event | Purpose |
|-------|---------|
| `game_started` | Track game popularity. |
| `game_completed` | Track win/loss rates. |
| `room_created` / `room_joined` | Multiplayer engagement. |
| `session_length` | Retention analysis. |
| `error_occurred` | Stability monitoring. |

## 16. Offline & PWA

- Single-player vs AI and local hotseat work offline after first load.
- Online modes require connection; offer AI fallback if matchmaking fails.
- Service worker caches the game bundle.

## 17. Compliance & Safety

- No free text chat; emoji reactions only.
- Invite-only rooms with 4-digit codes.
- Report button visible in every online match.
- Clients send only angle and power intent; server validates all damage.
- Collect only nickname (optional), avatar, and scores.
- Comply with GCC data protection regulations and COPPA/GDPR-K.
- Parent dashboard for time limits and data deletion.

## 18. Monetization

- **Freemium cosmetics** — unlockable fort skins and archer outfits.
- **One-time Full Game Pass** — unlock all games and themes.
- **Seasonal content** — GCC National Day fort themes.
- **Optional rewarded video** — after 50K+ MAU, COPPA-certified only.
- No interstitials, banners, or personalized ads.

## 19. Implementation Notes (v1.0)

- Built as a Babylon.js scene inside a SvelteKit lazy-loaded component.
- All meshes are procedural (cylinders, spheres, torus, planes, cones, boxes); no external GLB/texture assets required for the playable version.
- A random GCC country theme is selected per match; it drives fort colours, roof silhouette, ground/sky tints, and environment accents.
- Environment scenery includes distant low-poly mountains, palm trees, and rocks placed behind and to the sides of the battlefield.
- Physics is custom: Euler integration with gravity and constant horizontal wind acceleration.
- Arrow rotation aligns to the aim/velocity vector each frame.
- A dotted line + sphere trajectory preview is computed from the same physics formula used at fire time.
- Audio is synthesized at runtime via the Web Audio API; a mute toggle is exposed through the game header.
- Input supports mouse/touch drag aiming, on-screen buttons, and keyboard shortcuts.
- Current modes: single-player vs AI (Easy/Medium/Hard) and local 2-player hotseat, selected from an in-game mode picker.
- The AI solves the same trajectory physics as the player (angle + power binary search with wind compensation) and applies difficulty-based aim error.

## 20. Technical Notes

- Build this game last among the three — it has the most complex physics and online sync.
- Use Babylon physics for arrow arc and block collapse. *(future block-collapse mode)*
- Colyseus schema: fort health arrays, block states, wind, current turn, shot result. *(future online)*
- Target 60 FPS on Tier 1 tablets.
- Asset budget: < 8 MB once GLB skins are added.
- Dispose scene, meshes, materials, and observables on exit.

---

*Prepared by Aldoolab for the GCC Kids Web Game Platform.*
