# GDD 02 — Gulf Tic-Tac-Toe

**Game ID:** `tictactoe`  
**Arabic Name:** تحدي إكس-أو الخليجي  
**English Name:** Gulf Tic-Tac-Toe  
**Icon:** ⚔️  
**Version:** 1.0  
**Date:** 2026-07-21  
**Studio:** Aldoolab  
**Platform:** GCC Kids Web Game Platform  
**Engine:** Babylon.js  
**Target Age:** 7–12  

---

## 1. Elevator Pitch

A classic strategy game reimagined with Gulf heritage. Two players place khanjar and dhow tokens on a carved wooden board in a race to align three in a row.

---

## 2. Game Identity

| Field | Value |
|-------|-------|
| **Genre** | Turn-based strategy |
| **Play Modes** | Single-player vs AI (Easy/Medium/Hard), local 2-player hotseat, online 1v1 friend invite, asynchronous turns, Daily Challenge |
| **Online Feasible** | Yes — turn-based, low bandwidth, authoritative validation |
| **Estimated Effort** | Small |
| **Session Length** | 1–2 minutes |
| **Accessibility** | High-contrast symbols, large touch cells (≥ 72 px), clear win-line highlight |

### 2.1 GameConfig Contract

```ts
export const tictactoeConfig: GameConfig = {
  id: 'tictactoe',
  name: 'تحدي إكس-أو الخليجي',
  nameEn: 'Gulf Tic-Tac-Toe',
  icon: '⚔️',
  supportsSingle: true,
  supportsLocal: true,
  supportsOnline: true,
  supportsAsync: true,
  supportsDaily: true,
  gameKey: 'TicTacToeGame',
  preloadAssets: [...],
};
```

---

## 3. Theme & Narrative

The game takes place on a desert tabletop at sunset. The board is carved from wood with geometric Islamic patterns. Each player commands a Gulf symbol:

- Player 1: **Khanjar** (traditional dagger).
- Player 2: **Dhow** (traditional boat).

Unlockable symbol sets can include falcon/camel, coffee pot/date, and country-specific landmarks.

---

## 4. Core Loop

1. Players alternate placing one symbol per turn on a 3×3 grid.
2. First player to align three symbols horizontally, vertically, or diagonally wins.
3. If the board fills with no winner, the game is a draw.

---

## 5. Win / Lose Conditions

- **Win:** Align three of your symbols in a row.
- **Lose:** Opponent aligns three first.
- **Draw:** Board fills with no winner.

---

## 6. Mechanics

| Mechanic | Description |
|----------|-------------|
| Board | 3×3 grid. |
| Symbols | Khanjar vs. Dhow by default. |
| Turns | Players alternate; cannot place on occupied cells. |
| AI Difficulty | Easy (random), Medium (blocks wins), Hard (minimax optimal). |
| Undo | One-move undo for local play only. |
| Online | Colyseus validates turn order and board state. |

---

## 7. 3D Art Direction

- **Style:** Stylized low-poly board game on a desert tabletop.
- **Board:** Carved wooden board with geometric Islamic patterns, floating slightly above sand.
- **Pieces:** 3D khanjar and dhow tokens that pop into cells with a small bounce.
- **Environment:** Soft desert background, palm silhouettes, warm sunset lighting.
- **Camera:** Static angled view looking down at the board; slight zoom on win.
- **Effects:** Cell highlight on hover, win-line glow, confetti on victory.

### 7.1 Asset List

| Category | Assets |
|----------|--------|
| Board | Wooden 3×3 board with carved patterns |
| Pieces | Khanjar token, dhow token, unlockable token sets |
| Environment | Desert tabletop, palm silhouettes, sky dome |
| UI | Turn indicator, room code, result modal, undo button |
| Particles | Confetti, glow |

---

## 8. Controls

| Device | Input |
|--------|-------|
| Desktop | Mouse click or number keys 1–9 to place a token. |
| Tablet / Mobile | Tap a cell to place a token. |

---

## 9. UI & Feedback

- Current player indicator with symbol.
- Undo button for local play.
- Win/lose/draw modal with rematch and home buttons.
- Online panel: room code, connection status, emoji reactions.
- Invalid-move buzz if player taps an occupied cell or plays out of turn.

---

## 10. Audio

- **Music:** Calm oud loop between turns.
- **SFX:**
  - Token place click
  - Win fanfare
  - Draw tone
  - Invalid-move buzz

---

## 11. Online Safety

- No free text chat.
- Emoji reactions only (👍, 😃, 👏, 🏆).
- 4-digit room codes for invites.
- Report button visible during every online match.

---

## 12. Monetization & Retention Hooks

- Unlockable token sets and board themes (cosmetic only).
- Win streak achievements.
- Weekly leaderboard for online matches.

---

## 13. Asset Formats

| Asset Type | Format | Notes |
|------------|--------|-------|
| Board / piece models | GLB (GLTF 2.0) | Draco-compressed meshes. |
| Textures | KTX2 / Basis Universal | Wood, sand, metal; WebP/PNG fallback. |
| UI sprites | WebP / PNG | Packed into atlases. |
| Audio | OGG | MP3 fallback. |
| Animation | GLB animation groups | Token pop-in, win-line glow. |

## 14. Analytics Events

| Event | Purpose |
|-------|---------|
| `game_started` | Track game popularity. |
| `game_completed` | Track win/draw/loss rates. |
| `room_created` / `room_joined` | Multiplayer engagement. |
| `session_length` | Retention analysis. |
| `error_occurred` | Stability monitoring. |

## 15. Offline & PWA

- Single-player and local hotseat work fully offline after first load.
- Online mode requires connection; offer AI fallback if matchmaking fails.
- Service worker caches the game bundle.

## 16. Compliance & Safety

- No free text chat; emoji reactions only.
- Invite-only rooms with 4-digit codes.
- Report button visible in every online match.
- Collect only nickname (optional), avatar, and scores.
- Comply with GCC data protection regulations and COPPA/GDPR-K.
- Parent dashboard for time limits and data deletion.

## 17. Monetization

- **Freemium cosmetics** — unlockable token sets and board themes.
- **One-time Full Game Pass** — unlock all games and themes.
- **Optional rewarded video** — after 50K+ MAU, COPPA-certified only.
- No interstitials, banners, or personalized ads.

## 18. Technical Notes

- Start with this game to validate the 3D pipeline — lowest risk.
- Colyseus schema: board array, currentTurn, winner, winLine.
- Target 60 FPS on Tier 1 tablets.
- Asset budget: < 5 MB.
- Dispose scene, meshes, materials, and observables on exit.

---

*Prepared by Aldoolab for the GCC Kids Web Game Platform.*
