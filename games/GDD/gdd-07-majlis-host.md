# GDD 07 — Majlis Host

**Game ID:** `majlis-host`  
**Arabic Name:** ضيافة المجلس  
**English Name:** Majlis Host  
**Icon:** 🫖 (final icon: a low-poly brass dallah pouring coffee into a small cup)  
**Version:** 1.0  
**Date:** 2026-07-25  
**Studio:** Aldoolab  
**Platform:** Sahara Play / صحراء بلاي  
**Engine:** Babylon.js  
**Target Age:** 7–11  

---

## 1. Elevator Pitch

Welcome to a traditional Gulf *majlis*. Guests arrive one by one, and it is your job to honor them with the full hospitality ritual: incense first, then Arabic coffee, then dates, then a glass of water. Remember the order, serve with speed and grace, and keep every guest happy. As your reputation grows, the majlis fills with more visitors, tougher orders, and special VIP guests who expect the full ceremony.

---

## 2. Game Identity

| Field | Value |
|-------|-------|
| **Genre** | Memory / time-management |
| **Play Modes** | Single-player level progression; Endless majlis mode; Daily Challenge (future) |
| **Online Feasible** | No — asynchronous leaderboards only |
| **Estimated Effort** | Medium |
| **Session Length** | Levels are 2–4 minutes; endless mode supports 15–30+ minutes |
| **Accessibility** | One-handed play, ≥ 64 px touch targets, clear color/icon cues, optional highlight hints |

### 2.1 GameConfig Contract

```ts
export const majlisHostConfig: GameConfig = {
  id: 'majlis-host',
  name: 'ضيافة المجلس',
  nameEn: 'Majlis Host',
  icon: '🫖',
  supportsSingle: true,
  supportsDaily: true,
  supportsOnline: false,
  gameKey: 'MajlisHostGame',
  preloadAssets: [...],
};
```

---

## 3. Theme & Narrative

The game is set in a quiet corner of a pre-oil Gulf home. The floor is covered in soft cushions and woven rugs. A brass *dallah* of coffee sits on a low table next to a plate of dates and a small incense burner releasing thin threads of *bukhoor* smoke. Guests — friendly animal neighbors from across the GCC — arrive at the door, each expecting the warm, respectful welcome of a proper majlis.

The player is a young host learning the art of hospitality from their family. Each successful service teaches a small piece of Gulf tradition: the generosity of coffee, the sweetness of dates, the cleansing scent of incense, and the refreshment of water offered to a tired traveler.

### 3.1 Setting Details

- **Era:** Pre-oil Gulf home — no electricity, no plastic, only brass, clay, wood, woven fabrics, and lantern light.
- **Location:** A cozy *majlis* room in Riyadh, with mud-brick walls, palm-wood beams, a small latticed window, and patterned floor cushions.
- **Serving Station:** A low carved wooden tray holding a brass dallah, tiny coffee cups, a woven date bowl, a clay incense burner, and a glass water pitcher.
- **Guest Entrance:** A curtained doorway where animal visitors enter and exit after being served.
- **Player:** A polite young cat host in a simple white thobe, moving between the serving tray and the guests.
- **Visual Style:** Cute low-poly papercraft look, fixed isometric camera, warm sandy and brass tones. All items are procedural Babylon.js meshes; no external model dependency for the core game.

### 3.2 Guests (Animal Visitors)

| Animal | GCC Icon | Preferred Pace | Quirk |
|--------|----------|----------------|-------|
| **Camel** | 🐪 | Slow | Patient; tips well if served perfectly. |
| **Falcon** | 🦅 | Fast | Impatient; expects quick service. |
| **Arabian Oryx** | 🦌 | Medium | Proud; never returns a wrong order, just leaves quietly. |
| **Desert Fox** | 🦊 | Fast | Clever; sometimes asks for a reversed or shortened sequence. |
| **Goat** | 🐐 | Medium | Cheerful; gives bonus time when happy. |
| **Sheep** | 🐑 | Slow | Gentle; very forgiving of small mistakes. |

### 3.3 VIP Guests

Occasionally a special guest arrives — for example, a traveling *sadu* weaver or a village elder — who expects a longer ceremony. VIP sequences may include:

- Incense → coffee → dates → coffee refill → water
- Incense → coffee → dates → *halwa* → water

---

## 4. Core Loop

1. A guest arrives and sits on a cushion.
2. A sequence bubble appears above the guest showing the hospitality steps in order.
3. The player taps/click items in the correct order: **bukhoor → qahwa → dates → water**.
4. Correct and fast service earns coins and happiness.
5. Wrong order or slow service reduces patience and score.
6. The guest leaves after the sequence is complete or after patience runs out.
7. Repeat. Survive the level target (happy guests served) before the timer or patience meter empties.

---

## 5. Mechanics

### 5.1 Hospitality Sequence

The standard GCC majlis welcome order is fixed and educational:

1. **Bukhoor** (incense) — cleanse the air and welcome the guest.
2. **Qahwa** (Arabic coffee) — serve from the dallah into a small cup.
3. **Dates** — offer sweetness.
4. **Water** — refresh after coffee and dates.

Some guests or VIPs may extend or reverse the sequence, but the standard four-step order is always the foundation.

### 5.2 Patience Meter

Each guest has a patience bar that drains over time. Speed matters. Perfect sequences restore a small amount of patience. Wrong steps drain extra patience.

### 5.3 Scoring

| Action | Score Impact |
|--------|--------------|
| Correct next step | +points, +small combo bonus |
| Perfect full sequence | +bonus, +tip coins |
| Wrong step | -patience, combo reset |
| Guest leaves happy | +reputation |
| Guest leaves angry | -life/heart |

### 5.4 Levels & Progression

- Levels introduce one new element at a time (more guests, faster timers, longer sequences, VIPs).
- Between levels, players unlock small cosmetic upgrades: new cushion patterns, a nicer dallah, a prettier incense burner.
- Endless mode generates an infinite stream of guests with gradually increasing difficulty.

### 5.5 Power-Ups

- **Fresh Bukhoor:** Slows all guest patience drain for 10 seconds.
- **Quick Pour:** Auto-completes the next step instantly.
- **Extra Hand:** A helper cat appears and serves one item while you serve another.

---

## 6. Controls

| Input | Action |
|-------|--------|
| Tap / Click item | Serve the selected item to the active guest |
| Tap guest | Select a different guest to serve |
| Hold two items (advanced) | Serve a VIP combo step |
| Keyboard `1-4` | Serve bukhoor / qahwa / dates / water (desktop) |

All interactions are designed for one-handed tablet play.

---

## 7. UI / Feedback

- **Top bar:** Score, combo streak, remaining hearts/lives, level timer.
- **Guest bubble:** Large, clear icons showing the required sequence. Completed steps gray out.
- **Serving tray:** Four big, tappable items at the bottom of the screen.
- **Happy feedback:** Guest smiles, coins float up, a small "شكراً" or "thank you" pops up.
- **Mistake feedback:** Guest looks puzzled, patience bar flashes red, a gentle reminder highlight appears on the correct item.
- **Pause screen:** Shows the standard hospitality order as a memory aid for younger players.

---

## 8. Audio

- **Music:** Soft oud-led loop with subtle ney and frame drum, calm enough for repeated play.
- **SFX:**
  - Gentle pour sound for coffee.
  - Soft clink for cups.
  - Warm incense sizzle.
  - Satisfied guest hum or animal sound.
  - Subtle buzz for mistakes.

---

## 9. Safety

- No free text chat.
- No ads during gameplay.
- All guest interactions are preset and positive.
- No personal data collection beyond optional nickname for leaderboards.
- Game teaches respectful cultural behavior rather than competition or conflict.

---

## 10. Monetization

- No in-game purchases in the child-facing game app.
- Optional cosmetic unlocks earned through play.
- Adult-facing website may display ads under privacy-compliant settings.

---

## 11. Technical Notes

- Built with **Babylon.js** in SvelteKit route `/play/majlis-host`.
- All core items (dallah, cups, dates, incense burner, cushions, guests) are procedural low-poly meshes.
- State machine: `guestArriving → awaitingService → serving → leaving`.
- Unit-testable pure logic: sequence validation, scoring, patience decay, combo calculation.
- E2E test: load `/play/majlis-host`, verify canvas, serve one full sequence, assert zero errors.

---

## 12. Pending Design Questions

### 12.1 Tray Item Layout vs. Serving Sequence

**Status:** Pending design decision.

The standard hospitality sequence is **bukhoor → qahwa → dates → water**. The current prototype lays the four tray items out left-to-right in that same order. Feedback suggests this feels reversed to some players, possibly because:

- The game is Arabic-first, so players may expect the sequence to read right-to-left.
- Keyboard shortcuts `1-4` map to the sequence, not to screen position; a right-to-left layout would put the first sequence step (bukhoor) under the `1` key on the left side of the keyboard.
- Players may interpret the tray as a spatial queue and try to serve from one end to the other.

Open questions to resolve:

1. Should the tray layout follow Arabic RTL (bukhoor on the right, water on the left) while keeping the sequence order unchanged?
2. Should the keyboard shortcuts instead map to screen position (`1` = leftmost item, `4` = rightmost item) regardless of sequence?
3. Should the guest’s request bubble explicitly mirror the tray layout so the spatial relationship is always 1:1?
4. For the Desert Fox’s reversed sequence, how do we visually signal that the spatial queue is temporarily flipped?

Next step: test both LTR and RTL layouts with native Arabic-speaking children on tablet and desktop, then lock the layout and update this section, the GDD controls table, and the implementation.

---

*Prepared by Aldoolab for Sahara Play / صحراء بلاي.*
