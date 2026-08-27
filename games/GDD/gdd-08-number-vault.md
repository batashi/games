# GDD 08 — Number Vault: Guardian of the Vault

**Game ID:** `number-vault`  
**Arabic Name:** حارس الخزنة  
**English Name:** Guardian of the Vault  
**Icon:** 🛡️ (final icon: a young Omani fort guard raising a brass shield before a carved vault door)  
**Version:** 2.0  
**Date:** 2026-08-27  
**Studio:** Aldoolab  
**Platform:** Sahara Play / صحراء بلاي  
**Engine:** Babylon.js for scene; Svelte overlay for HUD and trap panel  
**Target Age:** 9–11 (Grade 5; adaptable 8–12)  
**Subject:** Mathematics — Numbers  

---

## 1. Elevator Pitch

A band of mischievous number ghouls is sneaking through the secret tunnels of an ancient Omani fort, trying to loot its treasures. You are the young **Guardian of the Vault**. Solve each ghoul's number riddle to spring Omani traps — falling palm-wood gates, sand bursts, and frankincense-smoke jets — and drive the ghouls back into the desert. Fast answers build combos; slow answers let them creep closer. Protect the khanjar, the dallah, and the frankincense chests at all costs.

---

## 2. Game Identity

| Field | Value |
|-------|-------|
| **Genre** | Educational action / tower-defense lite / quick-time math |
| **Play Modes** | Single-player level progression; Endless guard duty (practice); Daily challenge (future) |
| **Online Feasible** | No — local progress only; optional async high scores |
| **Estimated Effort** | Medium |
| **Session Length** | 2–4 minutes per level; endless mode 5–10 minutes |
| **Accessibility** | One-handed play, ≥ 64 px touch targets, optional spoken riddles, color-blind friendly ghoul silhouettes |

### 2.1 GameConfig Contract

```ts
export const numberVaultConfig: GameConfig = {
  id: 'number-vault',
  name: 'حارس الخزنة',
  nameEn: 'Guardian of the Vault',
  icon: '🛡️',
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

Deep beneath a sun-baked Omani hill fort, the community keeps its most precious heirlooms: a silver **khanjar**, a brass **dallah** of coffee, pouches of **frankincense**, rolls of old trade maps, and pearl shells from the Gulf coast. The fort elders have chosen you, a young but quick-minded guard, to watch the vault tunnel for one night.

At midnight, the **Number Ghouls** arrive — shadowy desert tricksters who love numbers but hate correct answers. They creep in single file along the torch-lit stone corridor. Each ghoul carries a glowing riddle above its head. Answer the riddle correctly and the fort's ancient traps spring to life, pushing the ghoul backward. Answer too slowly and the ghoul advances; if it reaches the vault door, it steals a treasure and the elders lose trust in you.

The game is set entirely inside the fort: sand-coloured stone walls, arched doorways, hanging brass lamps, woven palm mats, and wooden trap mechanisms painted with Omani geometric patterns.

### 3.1 Setting Details

- **Era:** Pre-modern Oman.
- **Location:** A vaulted tunnel inside an Omani fort.
- **Vault door:** Heavy carved wood and brass at the right side of the screen.
- **Treasures on display:** khanjar, dallah, frankincense pouch, map, pearl shell, clay jar.
- **Number Ghouls:** Silhouetted creatures with glowing number-riddle eyes; each type has a distinct shape and movement.
- **Traps:** Palm-wood falling gate, sand burst from wall slots, frankincense smoke jet, rolling date-stone ball.
- **Player:** A young guard in a simple dishdasha, standing on a raised stone platform near the vault door, holding a brass shield.

---

## 4. Learning Objectives

Aligned with Grade 5 Semester 1, Unit 1: الأعداد.

| Skill | Lesson mapping | In-game action |
|-------|----------------|----------------|
| **Place value** | 1-1, 2-1, 1-10 | Identify the value of a highlighted digit to trigger the trap. |
| **Comparing and ordering** | 2-1 | Pick the largest/smallest number among ghoul shields to target the lead ghoul. |
| **Rounding** | 2-1 | Round the ghoul's number to the nearest 10/100/1000 to break its shield. |
| **Sequences and multiples** | 3-1, 1-2, 3-3 | Complete the missing term in a glowing number chain to activate the trap. |
| **Mental math fluency** | 1-3, 2-3 | Speed combo rewards build automatic recall and confidence. |

---

## 5. Core Loop

1. A wave of 3–5 Number Ghouls appears at the far end of the tunnel and walks toward the vault door.
2. The lead ghoul displays a math riddle above its head.
3. The player taps one of 3–4 answer stones at the bottom of the screen.
4. Correct answer: a trap activates, the ghoul is knocked back, the player earns points and extends a combo.
5. Incorrect or slow answer: the ghoul advances one step; combo breaks.
6. If a ghoul reaches the vault door, it steals one treasure and disappears.
7. Clear all ghouls in the wave to open the next corridor.
8. Every 3 waves, a **Boss Ghoul** appears with a harder multi-step riddle and more health.
9. Between waves, the player sees which treasures are safe and how many ghouls remain.

---

## 6. Win / Lose Conditions

- **Level Win:** Survive all waves without losing all treasures (typically 3 treasures; losing 1 is allowed for 2-star, none for 3-star).
- **Level Lose:** All treasures are stolen.
- **Endless Mode:** Survive as many waves as possible; global high score is waves × combo.
- **Stars:**
  - ⭐ Survived with 1+ treasures left.
  - ⭐⭐ Survived with 2+ treasures left.
  - ⭐⭐⭐ Survived with all treasures safe.

---

## 7. Mechanics

### 7.1 Number Ghouls

| Ghoul type | Behaviour | Riddle focus |
|---|---|---|
| **Sand Ghoul** | Slow, single step forward after wrong/slow answer | Place value, digit identification |
| **Wind Ghoul** | Moves faster; pauses briefly when riddle appears | Rounding, comparing |
| **Echo Ghoul** | Two ghouls arrive together; solve both quickly | Ordering, sequences |
| **Boss Ghoul** | Has 3 health; needs 3 correct answers to repel | Mixed multi-step problems |

### 7.2 Traps

Traps are chosen randomly but thematically:

- **Falling Palm Gate:** A wooden gate drops from the ceiling, knocking the ghoul back.
- **Sand Burst:** A jet of sand erupts from a wall slot, pushing the ghoul down the tunnel.
- **Frankincense Smoke:** A cloud of aromatic smoke confuses the ghoul and makes it retreat.
- **Rolling Date Stone:** A heavy stone ball rolls toward the ghoul.

Each correct answer triggers one trap. Faster answers trigger flashier trap animations and louder sound effects.

### 7.3 Answer Stones

- 3–4 circular stone tablets appear at the bottom of the screen.
- Each shows a possible answer in large numerals.
- Tapping the correct stone triggers the trap.
- Tapping the wrong stone causes a brief red flash and lets the ghoul advance.
- The stones shuffle position for every riddle so players cannot memorise placement.

### 7.4 Combo System

- Each correct answer within 3 seconds adds +1 to the combo.
- Combo of 3+: traps become golden and deal extra knockback.
- Combo of 5+: a **Guardian Roar** (visual wave) stuns all ghouls for 1 second.
- Wrong answer or answer slower than 5 seconds resets combo to 0.

### 7.5 Difficulty Progression

| Level | Wave count | Ghouls per wave | Digit range | New mechanics |
|---|---|---|---|---|
| 1 | 3 | 1–2 | 3 digits | Place value |
| 2 | 4 | 2–3 | 3–4 digits | Comparing / ordering |
| 3 | 4 | 2–3 | 4–5 digits | Rounding |
| 4 | 5 | 3–4 | 5–6 digits | Sequences |
| 5 | 5 | 3–4 | 5–6 digits | Boss ghouls, mixed review |

### 7.6 Power-ups (spawning on correct answers)

- **Extra Sand Burst:** automatically pushes the nearest ghoul back.
- **Time Lamp:** slows all ghouls for 5 seconds.
- **Treasure Lock:** protects one treasure from being stolen next time.

---

## 8. Controls

| Input | Action |
|-------|--------|
| **Tap answer stone** | Submit answer and trigger trap. |
| **Tap power-up icon** | Activate collected power-up. |
| **Tap speaker icon** | Hear the riddle spoken aloud. |
| **Hold pause button** | Pause the wave (practice mode only). |

All interactions work with mouse and touch.

---

## 9. UI / Feedback

### 9.1 HUD

- Top-left: Level, wave counter, treasure health.
- Top-right: Score, combo meter, current streak flame.
- Bottom: Answer stone row.
- Center-top: Riddle text above the lead ghoul.

### 9.2 Feedback Rules

- Correct fast answer: trap animation, ghoul knocked back, golden particles, combo flame grows.
- Correct slow answer: trap triggers but smaller effect; combo does not increase.
- Wrong answer: screen shakes gently, ghoul advances, stone flashes red.
- Treasure stolen: treasure icon cracks; sad brass chord.
- Level complete: vault door glows, surviving treasures sparkle, victory fanfare.

### 9.3 Readability

- Ghouls are dark silhouettes so the bright riddle text and answer stones pop.
- Answer stones are large and separated to prevent mis-taps.
- Riddle text uses a bold Arabic-friendly numeral font.

---

## 10. Audio

All audio synthesized or procedural.

| Event | Sound |
|-------|-------|
| Ghoul appears | Low desert wind with faint whisper |
| Answer stone tap | Stone clack |
| Correct answer | Trap mechanism + satisfying impact |
| Combo milestone | Higher-pitched brass chime + drum hit |
| Wrong answer | Dull thud + dissonant tone |
| Treasure stolen | Cracking ceramic + low groan |
| Level win | Short oud/arpeggio victory phrase |

---

## 11. Safety & Compliance

- No free text input.
- No chat.
- No ads inside gameplay.
- No personal data collection.
- Math content is curriculum-aligned and non-addictive; no dark patterns.

---

## 12. Monetization

- Core math levels free.
- Optional future pack: additional Omani fort corridors and ghoul skins.

---

## 13. Technical Notes

### 13.1 Stack

- Babylon.js for the tunnel scene, ghoul silhouettes, trap animations, and treasures.
- Svelte overlay for HUD, riddle panel, answer stones, and result screens.

### 13.2 Procedural Assets

- Ghouls: scaled capsule/box silhouettes with glowing eyes.
- Traps: primitive meshes (cylinder gate, sphere stone, particle cloud).
- Treasures: simple low-poly compositions of primitive meshes.

### 13.3 Data Contract

```ts
export interface GuardianLevelConfig {
  level: number;
  waves: number;
  ghoulsPerWave: [number, number];
  digitRange: [number, number];
  puzzleTypes: PuzzleType[];
  bossEvery: number;
  treasures: number;
}
```

### 13.4 Testing

- Unit tests for puzzle generation and combo logic.
- E2E smoke test: load `/play/number-vault`, start a level, solve one riddle, assert zero errors.

---

## 14. Changelog

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-08-27 | Initial static Number Vault / خزنة الأرقام concept. |
| 2.0 | 2026-08-27 | Revised to Guardian of the Vault / حارس الخزنة: action-oriented Omani tower-defense math game. |
