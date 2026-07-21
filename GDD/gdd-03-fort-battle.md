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

1. Player aims arrow vertically.
2. Player charges power and releases to shoot.
3. Arrow arcs under gravity and wind; hits enemy fort blocks.
4. Players alternate until one fort is destroyed.

---

## 5. Win / Lose Conditions

- **Win:** Destroy all enemy fort blocks or reduce enemy fort health to zero.
- **Lose:** Your fort is destroyed first.

---

## 6. Mechanics

| Mechanic | Description |
|----------|-------------|
| Aim | Adjust vertical angle up/down. |
| Power | Hold to charge power meter; release to shoot. |
| Wind | Random wind value each turn affects arrow arc; shown by flag indicator. |
| Damage | Arrow removes a block on hit or deals direct fort damage when base is hit. |
| Physics | Gravity arc, wind drift, block collapse when supports are removed. |
| AI | Simulates aim and power with adjustable accuracy. Easy misses often; Hard accounts for wind. |

---

## 7. 3D Art Direction

- **Style:** Stylized low-poly forts across a wadi or coastal inlet.
- **Forts:** Mud-brick towers with country-specific flag accents and landmark hints.
- **Characters:** Small archer figures on top of each fort.
- **Environment:** Rocky ground, sparse palms, distant mountains, water inlet.
- **Camera:** Side view showing both forts; follows the arrow in flight; zooms on impact.
- **Effects:** Arrow trail, block crumble particles, dust on impact, camera shake on direct hit.

### 7.1 Asset List

| Category | Assets |
|----------|--------|
| Forts | Two modular fort sets (base, towers, blocks, flags) |
| Characters | Archer figure (idle, aim, celebrate, hurt) |
| Props | Arrow, bow, debris chunks |
| Environment | Rocky ground, palms, water, mountains, sky dome |
| UI | Angle meter, power meter, wind indicator, health bars, turn timer |
| Particles | Dust, sparks, block crumble |

---

## 8. Controls

| Device | Input |
|--------|-------|
| Desktop | Up/Down arrows = aim angle; Space = charge/release shot; P = pause. |
| Tablet / Mobile | On-screen angle up/down buttons + large Shoot button; tap and drag to aim. |

---

## 9. UI & Feedback

- Angle and power meters near the active archer.
- Wind indicator with direction and strength.
- Fort health bars above each fort.
- Last shot result message ("Direct hit!", "Missed!", "Block destroyed!").
- Online panel: room code, turn timer, emoji reactions.
- Aim-assist toggle in settings for younger players.

---

## 10. Audio

- **Music:** Tense but playful battle loop.
- **SFX:**
  - Bow draw creak
  - Arrow release whoosh
  - Impact thud
  - Block crumble
  - Victory/defeat fanfare

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

## 19. Technical Notes

- Build this game last among the three — it has the most complex physics and online sync.
- Use Babylon physics for arrow arc and block collapse.
- Colyseus schema: fort health arrays, block states, wind, current turn, shot result.
- Target 60 FPS on Tier 1 tablets.
- Asset budget: < 8 MB.
- Dispose scene, meshes, materials, and observables on exit.

---

*Prepared by Aldoolab for the GCC Kids Web Game Platform.*
