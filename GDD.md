# Aldoolab Game Design Document — GCC Kids Web Game Platform

**Version:** 2.0  
**Date:** 2026-07-21  
**Studio:** Aldoolab  
**Platform:** GCC Kids Web Game Platform  
**Engine:** Babylon.js (3D-first)  
**Target Audience:** Children aged 7–12 across the GCC (Bahrain, Kuwait, Oman, Qatar, Saudi Arabia, UAE)  

---

## 1. Executive Summary

This document defines the design for the first three playable games on the GCC Kids Web Game Platform. Each game is designed to:

- Celebrate shared Gulf heritage while honoring individual GCC countries.
- Run smoothly in 3D on tablets, desktops, and mobile phones.
- Support single-player, local hotseat, and private online multiplayer where appropriate.
- Respect child-safety rules: no free text chat, no open public lobbies, no data collection without guardian consent.

All three games will be rebuilt in **Babylon.js** under the 3D-first framework. The current HTML5 Canvas prototypes serve as proof-of-concept only.

---

## 2. Platform-Wide Design Pillars

| Pillar | Rule |
|--------|------|
| **Cultural Authenticity** | Use Gulf visuals, motifs, and sounds. Avoid stereotypes. Allow country-specific variants (flags, landmarks, dialect voice-overs). |
| **Child-First UX** | Large touch targets, simple controls, immediate feedback, no reading barrier. |
| **3D-First Visuals** | All games run in Babylon.js with stylized low-poly 3D by default. |
| **Short Sessions** | 1–3 minutes per game. Quick retry. |
| **Safe Multiplayer** | Invite-only rooms, emoji reactions only, authoritative server. |
| **Performance First** | 60 FPS on Tier 1 tablets, < 8 MB asset bundles. |

---

## 3. Game 01 — Frankincense Collector Runner

### 3.1 Identity

| Field | Value |
|-------|-------|
| **Game ID** | `frankincense` |
| **Arabic Name** | مغامرة جامع اللبان |
| **English Name** | Frankincense Collector Runner |
| **Icon** | 🏃‍♂️ |
| **Target Age** | 7–12 |
| **Genre** | Endless runner / action |
| **Play Modes** | Single-player only |
| **Online Feasible** | No — asynchronous leaderboards only |
| **Estimated Effort** | Small |

### 3.2 Theme & Narrative

A young collector runs through ancient trade routes to gather valuable frankincense resin before sunset. The journey crosses desert dunes, oasis villages, and mountain passes that could belong to any GCC region, with optional country-specific backdrops (Omani Dhofar, Saudi Empty Quarter, UAE Hajar Mountains).

### 3.3 Core Loop

1. Character runs forward automatically.
2. Player taps to jump or swipes down to slide.
3. Collect frankincense droplets and dates; avoid obstacles.
4. Survive as long as possible while score and speed increase.

### 3.4 Win / Lose

- **Win:** Reach a target distance or score threshold.
- **Lose:** Lose all hearts by colliding with obstacles.

### 3.5 Mechanics

| Mechanic | Description |
|----------|-------------|
| Jump | Tap or press up to leap over rocks, scorpions, low creatures. |
| Slide | Swipe down or press down to duck under hanging obstacles. |
| Collectibles | Frankincense = score; dates = small health restore. |
| Obstacles | Rocks, scorpions, hot sand, camel caravans (slowdown). |
| Difficulty | Speed and obstacle density increase every 30 seconds. |

### 3.6 3D Art Direction

- **Style:** Stylized low-poly 3D, warm desert palette.
- **Character:** Boy/girl in Gulf attire; unlockable avatars (camel, falcon).
- **Environments:** Desert dunes, oasis palms, frankincense trees, rocky wadis, ancient trade markers.
- **Camera:** Third-person follow, slight angle for depth.
- **Effects:** Dust clouds, heat shimmer, golden sparkle on collectibles.

### 3.7 Controls

| Device | Input |
|--------|-------|
| Desktop | Space/Up = jump; Down = slide; P = pause. |
| Tablet / Mobile | Tap = jump; swipe down = slide; optional on-screen buttons. |

### 3.8 Audio

- **Music:** Light oud/rhythm loop.
- **SFX:** Jump, landing, collectible chime, collision, milestone fanfare.

### 3.9 Monetization Hooks

- Unlockable character skins (cosmetic only).
- Daily challenge with leaderboard.

---

## 4. Game 02 — Gulf Tic-Tac-Toe

### 4.1 Identity

| Field | Value |
|-------|-------|
| **Game ID** | `tictactoe` |
| **Arabic Name** | تحدي إكس-أو الخليجي |
| **English Name** | Gulf Tic-Tac-Toe |
| **Icon** | ⚔️ |
| **Target Age** | 7–12 |
| **Genre** | Turn-based strategy |
| **Play Modes** | Single-player vs AI, local 2-player hotseat, online 1v1 friend invite |
| **Online Feasible** | Yes |
| **Estimated Effort** | Small |

### 4.2 Theme & Narrative

A classic strategy game reimagined with Gulf symbols. Two players compete on a carved wooden board, placing traditional icons that represent Gulf heritage.

### 4.3 Core Loop

1. Players alternate placing symbols on a 3×3 board.
2. First player to align three symbols wins.
3. Board fills without a winner = draw.

### 4.4 Win / Lose

- **Win:** Align three symbols horizontally, vertically, or diagonally.
- **Lose:** Opponent aligns three first.
- **Draw:** Board fills with no winner.

### 4.5 Mechanics

| Mechanic | Description |
|----------|-------------|
| Symbols | Player 1 = Khanjar (dagger); Player 2 = Dhow (traditional boat). Unlockable sets: falcon/camel, coffee pot/date. |
| AI | Easy (random), Medium (blocks wins), Hard (minimax optimal). |
| Online | Colyseus validates turn order and board state. Room codes for invites. |

### 4.6 3D Art Direction

- **Style:** Stylized low-poly board game on a desert tabletop.
- **Board:** Carved wood with geometric Islamic patterns; floating gently above sand.
- **Pieces:** 3D khanjar and dhow tokens that bounce into cells.
- **Environment:** Soft desert background with palm silhouettes, warm sunset.
- **Camera:** Static angled view; slight zoom on win.
- **Effects:** Cell highlight, win-line glow, confetti on victory.

### 4.7 Controls

| Device | Input |
|--------|-------|
| Desktop | Mouse click or number keys 1–9. |
| Tablet / Mobile | Tap a cell. |

### 4.8 Audio

- **Music:** Calm oud loop.
- **SFX:** Token place, win fanfare, draw tone, invalid-move buzz.

### 4.9 Online Safety

- Emoji reactions only.
- 4-digit room codes.
- Report button visible during matches.

---

## 5. Game 03 — Fort Battle

### 5.1 Identity

| Field | Value |
|-------|-------|
| **Game ID** | `archery` |
| **Arabic Name** | معركة القلاع |
| **English Name** | Fort Battle |
| **Icon** | 🏰 |
| **Target Age** | 10–12 |
| **Genre** | Turn-based physics / artillery |
| **Play Modes** | Single-player vs AI, online 1v1 friend invite |
| **Online Feasible** | Yes |
| **Estimated Effort** | Medium |

### 5.2 Theme & Narrative

Two historic forts face each other across a wadi. Each player commands archers who must destroy the enemy fort by aiming arrows over distance and wind. Forts can be themed per GCC country (e.g., Nakhal, Bahrain, Al Zubarah, Masmak).

### 5.3 Core Loop

1. Player aims arrow vertically and charges power.
2. Player releases to shoot.
3. Arrow arcs under gravity and wind; hits enemy fort blocks.
4. Players alternate until one fort is destroyed.

### 5.4 Win / Lose

- **Win:** Destroy all enemy fort blocks or reduce enemy fort health to zero.
- **Lose:** Your fort is destroyed first.

### 5.5 Mechanics

| Mechanic | Description |
|----------|-------------|
| Aim | Adjust vertical angle up/down. |
| Power | Hold to charge; release to shoot. |
| Wind | Random wind each turn affects arrow arc. |
| Damage | Arrows remove blocks or deal direct fort damage. |
| Physics | Gravity arc, wind drift, block collapse. |
| AI | Adjustable accuracy; easy misses often, hard accounts for wind. |

### 5.6 3D Art Direction

- **Style:** Stylized low-poly forts across a wadi or coastal inlet.
- **Forts:** Mud-brick towers with country-specific flag accents and landmark hints.
- **Characters:** Small archer figures on each fort.
- **Environment:** Rocky ground, sparse palms, distant mountains, water inlet.
- **Camera:** Side view follows arrow in flight; zooms on impact.
- **Effects:** Arrow trail, block crumble, dust, camera shake.

### 5.7 Controls

| Device | Input |
|--------|-------|
| Desktop | Up/Down = aim angle; Space = charge/release. |
| Tablet / Mobile | On-screen angle buttons + large Shoot button; tap-drag to aim. |

### 5.8 Audio

- **Music:** Tense but playful battle loop.
- **SFX:** Bow draw, arrow whoosh, impact, block crumble, victory/defeat fanfare.

### 5.9 Future Modes

- **2v2 Team Battle:** Two players share one fort.
- **Co-op vs AI:** Two players team up against a computer fort.

---

## 6. Shared Systems

### 6.1 Controls Conventions

- All games support touch, mouse, and keyboard.
- On-screen controls required for mobile.
- Touch targets minimum 64×64 px for children.
- Pause button always accessible.

### 6.2 Feedback Conventions

- Every action has visual + audio feedback.
- Correct action = green flash + positive sound.
- Wrong action = red shake + short buzz.
- Win = confetti + character celebration.
- Loss = gentle fade + clear retry prompt.

### 6.3 Progression & Retention

| Feature | Use |
|---------|-----|
| Daily Challenge | One shared challenge per game per day. |
| Leaderboards | Top scores per game, per week, per country. |
| Achievements | First win, streaks, collection milestones. |
| Unlockables | Skins, avatars, board themes (cosmetic only). |

### 6.4 Localization

- Arabic-first UI with full RTL support.
- English as secondary language.
- Modern Standard Arabic for written text.
- Country-specific voice-overs or event content can be added later.

### 6.5 Child Safety

- No free text chat.
- Emoji reactions only.
- Invite-only multiplayer rooms.
- Parent dashboard for time limits and data deletion.

---

## 7. 3D Migration Priority

Rebuild order for the prototype games:

1. **Gulf Tic-Tac-Toe** — lowest risk, validates the 3D pipeline, UI, and online flow.
2. **Frankincense Collector Runner** — introduces animation, camera follow, and obstacle systems.
3. **Fort Battle** — most complex physics and online synchronization.

---

## 8. Asset Checklist per Game

| Game | Models | Materials/Textures | Animations | Audio | UI |
|------|--------|-------------------|------------|-------|-----|
| Frankincense Runner | Character, obstacles, environment chunks | Sand, rock, palm, character clothes | Run, jump, slide, celebrate, hurt | Music, SFX pack | Score, hearts, pause, game over |
| Gulf Tic-Tac-Toe | Board, khanjar token, dhow token, environment | Wood, metal, sand, sunset | Token pop-in, win-line glow, confetti | Music, SFX pack | Turn indicator, room code, result modal |
| Fort Battle | Two forts, archers, arrow, blocks, environment | Mud-brick, wood, metal, sand, water | Archer aim, arrow flight, block crumble, celebrate | Music, SFX pack | Angle/power meters, wind indicator, health bars |

---

*Document prepared by Aldoolab. Update as prototypes evolve.*
