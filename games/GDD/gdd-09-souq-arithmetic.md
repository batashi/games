# GDD 09 — Souq Arithmetic / حسابات السوق

**Game ID:** `souq-arithmetic`  
**Arabic Name:** حسابات السوق  
**English Name:** Souq Arithmetic  
**Icon:** 🧮 (final icon: a brass Omani merchant scale with dates and coins)  
**Version:** 1.0  
**Date:** 2026-08-27  
**Studio:** Aldoolab  
**Platform:** Sahara Play / صحراء بلاي  
**Engine:** Svelte 5 overlay + Babylon.js optional background scene  
**Target Age:** 9–11 (Grade 5; adaptable 8–12)  
**Subject:** Mathematics — Operations, Money, Decimals  

---

## 1. Elevator Pitch

You have just opened a small stall in a busy **Omani souq**. Customers from every wilayat arrive with shopping lists: dates, frankincense, brass dallahs, khanjars, and spices. Your job is to **calculate totals quickly**, **give the correct change**, and **restock your shelves** before the next rush. Fast and accurate service keeps customers happy and earns you silver coins. Mistakes cost you customers — and your reputation.

## 2. Game Identity

| Field | Value |
|-------|-------|
| **Genre** | Educational time-management / service sim / arithmetic drill |
| **Play Modes** | Single-player level progression; Endless market day (practice); Daily special order (future) |
| **Online Feasible** | No — local progress only; optional async high scores |
| **Estimated Effort** | Medium |
| **Session Length** | 2–4 minutes per level; endless mode 5–10 minutes |
| **Accessibility** | One-handed play, ≥ 64 px touch targets, large numerals, color-blind friendly customer moods |

### 2.1 GameConfig Contract

```ts
export const souqArithmeticConfig: GameConfig = {
  id: 'souq-arithmetic',
  name: 'حسابات السوق',
  nameEn: 'Souq Arithmetic',
  icon: '🧮',
  supportsSingle: true,
  supportsPractice: true,
  supportsDaily: false,
  supportsOnline: false,
  gameKey: 'SouqArithmeticGame',
  preloadAssets: [],
};
```

---

## 3. Theme & Narrative

Your uncle, a well-known merchant in **Muttrah Souq**, has given you a small wooden stall for one market day. The stall sells five traditional Omani goods. Each customer arrives with a small list and a handful of coins. If you calculate the total correctly and give change fast, the customer smiles, leaves a tip, and tells others. If you are slow or wrong, the customer huffs and walks away.

Between rushes, you restock your shelves by solving quick **restock riddles** — multiplication and division problems that tell you how many baskets to order from the storehouse.

### 3.1 Setting Details

- **Era:** Pre-modern Oman, during a weekly market day.
- **Location:** A narrow souq lane with stone arches, woven palm mats, and hanging brass lamps.
- **Stall goods:** dates, frankincense resin, dallah (coffee pot), small khanjar, spice pouch.
- **Customers:** villagers, sailors, falconers, and children — each with a simple animated portrait.
- **Currency:** Omani **riyals and baisa** (1 rial = 100 baisa); decimals appear naturally (e.g., 0.50 rial).

---

## 4. Learning Objectives

Aligned with Grade 5 Semester 1.

| Skill | Lesson mapping | In-game action |
|---|---|---|
| **Addition / subtraction fluency** | 2-2 | Add item prices to find the total bill. |
| **Multiplication / division** | 1-3, 2-3, 4-3 | Restock by multiplying baskets; split shipments by dividing. |
| **Order of operations** | 1-13 | Complex orders with parentheses (e.g., 2 dates + 3 spices, then discount). |
| **Money decimals** | 1-11, 1-12, 2-12, 3-13 | Handle riyals and baisa; give correct change. |
| **Estimation / best value** | 2-13 | Choose the better deal between two bundles. |

---

## 5. Core Loop

1. A customer walks up to the stall and shows a **speech bubble** with their order.
2. The player taps items on the shelf to add them to the counter; a **running total** appears.
3. The customer pays with a coin/note; the player must **give back the correct change** using the coin drawer.
4. Correct + fast service → happy customer, tip coins, +combo.
5. Slow or wrong service → customer mood drops; after two mistakes they leave.
6. Every 3–4 customers, a **restock phase** begins: solve a multiplication/division riddle to refill shelves.
7. Clear the level's customer quota before the market closes (timer runs out).

---

## 6. Win / Lose Conditions

- **Level Win:** Serve the required number of customers with at least 1 reputation star left before time runs out.
- **Level Lose:** Reputation drops to zero (too many angry customers) OR the market closes before the quota is met.
- **Stars:**
  - ⭐ Completed the quota.
  - ⭐⭐ Completed with ≥ 80% accuracy.
  - ⭐⭐⭐ Completed with ≥ 90% accuracy and an active combo of 5+.

---

## 7. Mechanics

### 7.1 Customers

| Customer type | Behaviour | Math focus |
|---|---|---|
| **Villager** | Patient, small order (1–2 items) | Simple addition |
| **Sailor** | Fast, medium order (2–3 items) | Addition + change |
| **Falconer** | Pays with large note; expects exact change | Subtraction / money decimals |
| **Child** | Asks for "best value" between two bundles | Estimation / comparison |
| **Merchant (Boss)** | Multi-step order with discount | Order of operations |

### 7.2 Stall Goods & Prices

Prices are tuned per level and use clean decimal values.

| Good | Base price | Notes |
|---|---|---|
| Dates (basket) | 0.50 rial | Common, cheap |
| Frankincense (small pouch) | 1.25 rial | Mid price |
| Dallah (small brass pot) | 2.00 rial | Mid-high |
| Spice pouch | 0.75 rial | Common |
| Mini khanjar | 3.50 rial | Rare, expensive |

### 7.3 Service Flow

1. **Order phase:** customer shows list.
2. **Total phase:** player taps items; total updates live.
3. **Payment phase:** customer hands over money (e.g., "5.00 rial").
4. **Change phase:** player drags coins from drawer to give change.
5. **Submit:** tap the bell to finish the transaction.

### 7.4 Combo & Mood System

- Each correct transaction within 4 seconds adds +1 combo.
- Combo of 3+: customers give extra tips.
- Combo of 5+: a **Souq Cheer** slows the arrival of new customers for 5 seconds.
- Wrong transaction or transaction > 6 seconds breaks combo and lowers reputation by 1.

### 7.5 Restock Phase

- Triggers every 3–4 customers or when an item stock hits zero.
- Player solves a multiplication/division problem (e.g., "Pack 48 dates into baskets of 6.").
- Correct answer refills all shelves; wrong answer costs time.

### 7.6 Difficulty Progression

| Level | Customers | New mechanics | Price range | Time |
|---|---|---|---|---|
| 1 | 5 | Addition only, exact payment | 0.50–2.00 | 90 s |
| 2 | 6 | Addition + change | 0.50–3.00 | 90 s |
| 3 | 7 | Multi-item orders | 0.50–5.00 | 100 s |
| 4 | 8 | Restock riddles, discounts | 0.50–8.00 | 110 s |
| 5 | 10 | Boss merchants, mixed ops | 0.50–10.00 | 120 s |

---

## 8. Controls

| Input | Action |
|---|---|
| **Tap item on shelf** | Add to customer's bill. |
| **Tap item on counter** | Remove from bill. |
| **Tap coin in drawer** | Add coin to change pile. |
| **Tap bell** | Submit transaction. |
| **Tap hint button** | Show a bar-model hint (small time penalty). |

All interactions work with mouse and touch.

---

## 9. UI / Feedback

### 9.1 HUD

- Top-left: Level, customers served / quota, reputation hearts.
- Top-right: Score, combo meter, timer (market closing).
- Bottom: Shelf of goods, coin drawer, current order total, submit bell.
- Center: Customer bubble with order and mood indicator.

### 9.2 Feedback Rules

- **Correct fast transaction:** customer smiles, coins fly to tip jar, combo flame grows.
- **Correct slow transaction:** neutral expression; no combo gain.
- **Wrong total/change:** customer frowns, screen shakes gently, reputation heart cracks.
- **Restock correct:** shelves fill with a bounce animation.
- **Level complete:** stall banner unfurls, victory fanfare, total earnings displayed.
- **Level fail:** market closes (sunset overlay), sad oud phrase.

### 9.3 Readability

- Large numerals on all coins and price tags.
- Good/bad mood shown by face icon and green/amber/red halo.
- High contrast between shelf items and the stone-arch background.

---

## 10. Audio

All audio synthesized or procedural.

| Event | Sound |
|---|---|
| Customer arrives | Friendly market chatter chord |
| Item tapped | Soft thud on wood |
| Correct transaction | Brass scale balance + coin clink + oud pluck |
| Combo milestone | Higher brass chime + small drum roll |
| Wrong transaction | Dissonant string + pottery crack |
| Customer leaves angry | Low sigh + door creak |
| Restock correct | Crate slide + stacking thuds |
| Level win | Short victory oud phrase |
| Background music | Light taqsim loop with market ambience |

---

## 11. Safety & Compliance

- No free text input.
- No chat.
- No ads inside gameplay.
- No personal data collection.
- Math content is curriculum-aligned; no addictive dark patterns.

---

## 12. Monetization

- Core math levels free.
- Optional future pack: additional Omani souq locations (Nizwa, Salalah, Sohar) and merchant outfits.

---

## 13. Technical Notes

### 13.1 Stack

- Svelte 5 for all UI.
- Optional Babylon.js background: a static souq lane with hanging lamps.
- Procedural audio via Web Audio API.

### 13.2 Procedural Assets

- Customers: simple geometric portraits with different head coverings.
- Goods: flat icons or low-poly primitives on the shelf.
- Coins: simple circular sprites with numerals.

### 13.3 Data Contract

```ts
export interface SouqArithmeticLevelConfig {
  level: number;
  customers: number;
  timeSeconds: number;
  priceRange: [number, number];
  operations: ('add' | 'subtract' | 'multiply' | 'divide' | 'mixed')[];
  allowDiscounts: boolean;
  restockEvery: number;
}
```

### 13.4 Testing

- Unit tests for order generation, change calculation, scoring, and combo logic.
- E2E smoke test: load `/play/souq-arithmetic`, start a level, serve one customer correctly.

---

## 14. Changelog

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-08-27 | Initial GDD for Souq Arithmetic / حسابات السوق. |
