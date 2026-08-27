# GDD 08 — Number Vault

**Game ID:** `number-vault`  
**Arabic Name:** خزنة الأرقام  
**English Name:** Number Vault  
**Icon:** 🔐 (final icon: a brass-and-wood vault door carved with Omani geometric patterns)  
**Version:** 1.0  
**Date:** 2026-08-27  
**Studio:** Aldoolab  
**Platform:** Sahara Play / صحراء بلاي  
**Engine:** Babylon.js  
**Target Age:** 9–11 (Grade 5; adaptable 8–12)  
**Subject:** Mathematics — Numbers  

---

## 1. Elevator Pitch

Deep inside an ancient Omani fort, a treasure room lies behind a series of locked vault doors. Each door opens only when its number puzzle is solved correctly. You are the young keeper of the vault. Turn brass digit dials, slide numbered stone tablets, and line up golden place-value markers to unlock dates, frankincense, silver khanjars, and secret maps — while mastering place value, comparing, rounding, and number sequences.

---

## 2. Game Identity

| Field | Value |
|-------|-------|
| **Genre** | Educational puzzle / number sense |
| **Play Modes** | Single-player lesson progression; Timed challenge; Practice mode per skill |
| **Online Feasible** | No — local progress only; optional async leaderboard for challenge scores (future) |
| **Estimated Effort** | Medium |
| **Session Length** | 2–4 minutes per level; full lesson path 20–30 minutes |
| **Accessibility** | One-handed play, ≥ 64 px touch targets, high-contrast digit tiles, optional voice-over for Arabic number names, hint button on every puzzle |

### 2.1 GameConfig Contract

```ts
export const numberVaultConfig: GameConfig = {
  id: 'number-vault',
  name: 'خزنة الأرقام',
  nameEn: 'Number Vault',
  icon: '🔐',
  supportsSingle: true,
  supportsPractice: true,
  supportsDaily: false,
  supportsOnline: false,
  gameKey: 'NumberVaultGame',
  preloadAssets: [],
};
```

---

## 3. Theme & Narrative

The game takes place in the cool stone corridors of a traditional Omani hill fort. Sunlight falls through small arched windows, lighting dust motes above brass lamps and woven palm mats. At the end of each corridor stands a heavy vault door of carved wood and brass, guarded by a geometric pattern of numbers.

The player is a young vault keeper in training, trusted by the fort elder to recover the stored treasures of the community: dried dates, frankincense resin, a small silver khanjar, a brass dallah, and old maps of desert trade routes. To prove they understand numbers, the keeper must set each door's digit lock to the exact value requested by the elder's riddle.

### 3.1 Setting Details

- **Era:** Pre-modern Oman — stone fort, brass fittings, palm-wood beams, no electricity.
- **Location:** Interior corridors and treasure rooms of an Omani fort.
- **Vault doors:** Heavy wooden doors with brass digit dials (0–9) set into carved geometric frames.
- **Treasures:** Culturally grounded reward props — date palm fronds, frankincense resin, silver khanjar, brass dallah, clay jar, rolled map, pearl shell.
- **Player character:** A young child wearing a simple dishdasha, carrying a small oil lamp.
- **Elder guide:** A friendly elder who appears as a portrait and reads each riddle aloud (optional voice-over).
- **Visual style:** Warm low-poly 3D with strong shadows, flat-shaded pastels, high contrast on interactive digit tiles. All assets procedural in Babylon.js.

---

## 4. Learning Objectives

Aligned with Grade 5 Semester 1, Unit 1: الأعداد.

| Skill | Lesson mapping | In-game action |
|-------|----------------|----------------|
| **Place value** | 1-1, 2-1, 1-10 | Set digit dials to match a spoken or written number up to 6 digits. |
| **Reading and writing numbers** | 1-1, 2-1 | Convert Arabic words to digits and vice versa. |
| **Comparing and ordering** | 2-1 | Arrange stone-number tablets from smallest to largest; pick the greater value. |
| **Rounding** | 2-1 | Round a number to the nearest 10, 100, 1 000, or 10 000 by choosing the closest milestone. |
| **Sequences and multiples** | 3-1, 1-2, 3-3 | Complete a number sequence on a brass chain by finding the rule and the missing terms. |
| **Inverse operations / estimation** | 1-3, 2-3 | Use multiplication facts to deduce missing digits in a vault code. |

Each skill is introduced in isolation, then mixed in later levels.

---

## 5. Core Loop

1. The elder presents a riddle that translates into a number task.
2. The player interacts with the vault-door puzzle:
   - Turn brass digit dials to build a number.
   - Drag numbered stone tablets into order.
   - Select the correct rounded value from hanging brass tags.
   - Fill missing links in a brass number chain.
3. The player taps the **Open** button.
4. Immediate feedback:
   - Correct: the door swings open, light spills out, a treasure prop appears, and a short celebratory fanfare plays.
   - Incorrect: the dials shake, a gentle hint highlights the first wrong digit, and the player can retry without penalty in lesson mode.
5. The player moves to the next door. Every 5 doors unlock a new treasure-room visual and a harder skill combination.
6. Challenge mode adds a timer and a score multiplier for streaks.

---

## 6. Win / Lose Conditions

- **Lesson mode:**
  - Win: solve the target number of doors in the level (typically 5 doors).
  - Lose: none — players retry incorrect doors until correct.
- **Challenge mode:**
  - Win: solve as many doors as possible within 120 seconds.
  - Lose: time runs out; final score is saved locally.
- **Practice mode:**
  - No win/lose; player selects a skill and difficulty and plays endless doors.
- **Stars per level:**
  - ⭐ Completed all doors.
  - ⭐⭐ Completed with no more than 1 retry per door.
  - ⭐⭐⭐ Completed with no retries.

---

## 7. Mechanics

### 7.1 Puzzle Types

#### 7.1.1 Digit-Dial Lock

A 3-to-6-digit vault door shows empty place-value columns:

| مئات الألوف | عشرات الألوف | آلاف | مئات | عشرات | آحاد |
|---|---|---|---|---|---|
| [0] | [0] | [0] | [0] | [0] | [0] |

The elder asks, "أدخل الرقم ثلاثمائة وخمسة وثلاثون ألفًا ومائتان وواحد وسبعون" or displays the digit in text. The player turns each dial to the correct digit.

- **Difficulty 1:** 3-digit numbers.
- **Difficulty 2:** 4- and 5-digit numbers.
- **Difficulty 3:** 6-digit numbers; includes numbers with internal zeros.

#### 7.1.2 Stone Tablet Order

Three to five stone tablets appear, each carved with a number. The player drags them into ascending or descending order on a stone shelf. A visual number line on the floor helps anchor magnitude.

#### 7.1.3 Rounding Brass Tag

A target number glows above the door. Several brass tags hang nearby, each showing a rounded value. The player taps the tag that matches the rounding instruction:
- "قَرِّبْ لأقرب عشرة"
- "قَرِّبْ لأقرب مائة"
- "قَرِّبْ لأقرب ألف"
- "قَرِّبْ لأقرب عشرة آلاف"

A number-line arc highlights the two nearest milestones and the midpoint.

#### 7.1.4 Brass Chain Sequence

A brass chain shows a sequence with one or two missing links. The player selects the missing number(s) from a tray of brass links.

Rules include:
- Add/subtract a fixed step (e.g., +100, −1 000).
- Multiples of a given number.
- Square numbers (optional, later levels).
- Alternating or two-step rules (advanced).

#### 7.1.5 Inverse Lock (advanced)

A single missing digit hides inside a calculation:

```
  4 ? 6
+ 2 5 1
= 7 0 7
```

The player turns the missing digit dial. This bridges to addition/subtraction mechanics while keeping focus on number structure.

### 7.2 Place-Value Scaffolding

- Every digit dial is colour-coded by place value (ones = sand, tens = palm green, hundreds = brass gold, thousands = sky blue, ten-thousands = terracotta, hundred-thousands = indigo).
- When the player hovers or taps a dial, a quiet label appears: "آحاد", "عشرات", etc.
- Spoken Arabic number names are available via a speaker icon.

### 7.3 Hint System

- First wrong attempt: the incorrect digit turns red and shakes gently.
- Second wrong attempt: a ghosted correct digit briefly appears inside the dial.
- Third wrong attempt: the elder offers a text hint, e.g. "تذكر: الرقم في خانة الآحاد هو 7".
- Hints do not penalize star progress in lesson mode.

### 7.4 Difficulty Progression

| Door set | Focus | Digit range | New mechanics |
|---|---|---|---|
| 1–5 | Place value, reading/writing | 3–4 digits | Digit-dial lock |
| 6–10 | Comparing and ordering | 4–5 digits | Stone tablets, number line |
| 11–15 | Rounding | 4–6 digits | Rounding brass tags |
| 16–20 | Sequences and multiples | 3–5 digits | Brass chain sequences |
| 21–30 | Mixed review | 5–6 digits | Inverse lock, combined puzzles |

---

## 8. Controls

| Input | Action |
|-------|--------|
| **Tap dial** | Increment digit by 1 (wraps 9→0). |
| **Tap and hold dial** | Show digit picker wheel (0–9). |
| **Drag stone tablet / brass tag / chain link** | Move to target slot. |
| **Tap Open button** | Submit answer. |
| **Tap speaker icon** | Hear the number riddle spoken aloud. |
| **Tap hint lamp** | Receive a scaffolded hint. |
| **Swipe left/right** | Move to next/previous corridor (between levels). |

All interactions work with mouse and touch. Keyboard support (arrow keys to change selected digit, Enter to submit) is optional for accessibility.

---

## 9. UI / Feedback

### 9.1 HUD

- Top-left: Level number and skill badge (Place Value / Order / Round / Sequence / Mixed).
- Top-right: Star progress for current level, optional timer in challenge mode.
- Bottom-left: Speaker and hint-lamp buttons.
- Bottom-right: Open button.

### 9.2 Feedback Rules

- Correct answer: vault door rotates open with brass clunk sound; treasure prop slides forward with a warm glow; particles of golden dust rise.
- Incorrect answer: dials/tablets shake with a soft "locked" sound; incorrect elements tint red for 0.5 s.
- Streak (challenge mode): every 3 correct doors in a row triggers a short confetti burst and a brighter fanfare.
- New treasure unlocked: full-screen treasure reveal with Arabic and English name, plus a cultural fact (e.g., "اللبان: راتنج عطري كان يُحمل عبر طرق التجارة من عُمان").

### 9.3 Readability

- Digit dials use a large, child-friendly Arabic numeral font; digits are ≥ 64 px on mobile.
- Background corridors are desaturated so the brass door and colourful dials pop.
- Interactive targets have a subtle pulsing outline when idle.

---

## 10. Audio

All audio is synthesized or procedural; no external music files required.

| Event | Sound |
|-------|-------|
| Dial turns | Short mechanical click with slight pitch rise per digit |
| Tablet placed | Stone tap |
| Correct unlock | Brass bolt sliding, door creak, warm chord |
| Incorrect | Dull lock clunk, low vibration |
| Treasure reveal | Short oud-like arpeggio (synthesized) |
| Streak | Higher-pitched fanfare with hand-drum rhythm |
| Hint lamp | Soft chime |
| Background | Quiet desert wind and distant market ambience (optional, very low) |

---

## 11. Safety & Compliance

- **No free text input.** All interaction is through fixed dials, draggable tiles, and tappable tags.
- **No chat.** Social features are limited to optional local high scores.
- **No personal data collection.** Progress is stored locally or in an anonymous player profile with optional nickname only.
- **No ads inside gameplay.** Rewarded video is not used.
- **Child-safe UI:** no external links, no microtransactions, no dark patterns.
- **Cultural accuracy:** treasures and terms are validated against Omani/GCC heritage; no stereotypes.

---

## 12. Monetization

- The educational game itself is free.
- Optional future expansion: additional themed vault corridors (desert caravan, pearl diver, frankincense trail) offered as one-time unlock packs. All core Grade 5 skills remain free.
- No consumables, no gacha, no energy systems.

---

## 13. Technical Notes

### 13.1 Engine & Stack

- Babylon.js for 3D scene: corridor, vault door, treasure props.
- Svelte 5 overlay for HUD, riddle text, and result screens.
- TypeScript strict mode; pure logic separated from presentation.

### 13.2 Procedural Assets

- Vault door: extruded wood panels + brass frame built from primitive boxes/cylinders.
- Digit dials: cylinders with textured number decals generated on canvas.
- Stone tablets: flattened boxes with rounded edges.
- Treasures: simple low-poly compositions of primitive meshes (dates = clustered spheres, khanjar = curved box + cylinder handle, dallah = sphere + thin cylinder spout).

### 13.3 Data Contract

Puzzle generation is driven by a config object:

```ts
export interface NumberVaultLevelConfig {
  level: number;
  skill: 'place-value' | 'order' | 'round' | 'sequence' | 'mixed';
  digitRange: [number, number];
  puzzleCount: number;
  roundingPlace?: 10 | 100 | 1000 | 10000;
  sequenceType?: 'add' | 'subtract' | 'multiple' | 'square' | 'mixed';
  allowHints: boolean;
}
```

### 13.4 Testing

- Unit tests for puzzle generators (Vitest):
  - Generated numbers fall within configured ranges.
  - Rounding answers match mathematical rounding rules.
  - Sequences produce unique, solvable missing terms.
- E2E smoke test (Playwright):
  - Load `/play/number-vault`, verify canvas, complete one door, assert zero errors.

### 13.5 Performance

- One static corridor scene per level; only the door animation and UI update each frame.
- Target 60 FPS on Tier 1 tablets via low-poly geometry and a single directional light with baked shadows.

---

## 14. Changelog

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-08-27 | Initial GDD for Number Vault / خزنة الأرقام. |
