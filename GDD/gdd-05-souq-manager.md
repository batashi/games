# GDD 05 — Souq al-Khaleej

**Game ID:** `souq-manager`  
**Arabic Name:** سوق الخليج  
**English Name:** Souq al-Khaleej  
**Icon:** 🧺 (placeholder; final icon: a young Gulf merchant child behind a woven-basket stall)  
**Version:** 2.0  
**Date:** 2026-07-24  
**Studio:** Aldoolab  
**Platform:** GCC Kids Web Game Platform  
**Engine:** Babylon.js  
**Target Age:** 7–11  

---

## 1. Elevator Pitch

Step into a Gulf souq from the days before oil — a time of caravans, palm groves, brass dallahs, and lantern light. You are a young merchant helping your family run a traditional market stall. Plant date palms, dry the harvest, and pack old-style boxes; roast and grind Arabic coffee; sort and pack frankincense resin. Serve iconic animal visitors from across the GCC, earn coins, and grow your little corner of the souq into the busiest spot in the market.

---

## 2. Game Identity

| Field | Value |
|-------|-------|
| **Genre** | Time-management / shop simulation / production chain |
| **Play Modes** | Single-player level progression; Relaxed endless souq mode; Daily Challenge (future) |
| **Online Feasible** | No — asynchronous leaderboards only |
| **Estimated Effort** | Medium–High |
| **Session Length** | Levels are 3–5 minutes; endless/relaxed mode supports sessions of 30–60+ minutes; overall progression can span many hours |
| **Accessibility** | One-handed play, ≥ 64 px touch targets, visual role badges for workers, optional hint highlights for younger players |

### 2.1 GameConfig Contract

```ts
export const souqManagerConfig: GameConfig = {
  id: 'souq-manager',
  name: 'سوق الخليج',
  nameEn: 'Souq al-Khaleej',
  icon: '🧺', // Final art: young Gulf merchant child behind a woven-basket stall
  supportsSingle: true,
  supportsDaily: true,
  supportsOnline: false,
  gameKey: 'SouqManagerGame',
  preloadAssets: [...],
};
```

---

## 3. Theme & Narrative

The game is set in a traditional Gulf souq long before the oil era — a world of sand, palm groves, stone alleys, and caravan trade. There are no phones, no cars, no electric lights; only hanging lanterns, woven awnings, brass tools, clay ovens, and the sound of merchants calling out their goods. The player is a young child helping their family run a small stall, learning the merchant's craft from the elder shopkeepers nearby.

Everything in the stall is made by hand. Dates come from a palm sapling the child plants and tends. Coffee is roasted over charcoal and ground in a stone mortar. Frankincense resin is sorted and packed into small cloth pouches. Customers are beloved animals of the GCC, each visiting the souq with its own temperament and favorite goods.

Each level represents a busier market day. In endless mode, the child keeps the stall open for as long as the player likes, building reputation, decorating the shop, and befriending returning animal customers.

### 3.1 Setting Details

- **Era:** Pre-oil Gulf — no modern technology, no plastics, no electric lighting.
- **Location:** An open-air corner of a stone souq with palm-wood beams, sand floor, hanging brass lanterns, clay ovens, woven mats, and a distant mosque silhouette at sunset.
- **Stall:** A low wooden counter covered with woven palm baskets, clay jars, brass scales, a small charcoal brazier for roasting coffee, and a hand-woven striped awning.
- **Shelves:** Finished goods are displayed on small woven floor mats or low palm-leaf baskets rather than tall modern shelves, keeping the stall close to the sand.
- **Sources:** Each raw good comes from its own designated source — dates from a planted date palm, luban from a small frankincense tree, and qahwa beans from a burlap sack of green coffee beans.
- **Player:** A cute stylized cat merchant wearing a simple white thobe-style garment, moving busily between production stations, mats, and cashier mat.
- **Customers:** Beloved and iconic animals of the GCC region, each dressed or accessorized with a tiny cultural hint.
- **Workers:** Young apprentice helpers (other children or friendly animals) who can be hired to tend stations, carry goods, or handle payments.
- **Visual Style:** Cute, rounded low-poly characters inspired by cozy shop simulators. The cat merchant and animal customers have soft shapes, big expressive eyes, and small cultural accessories. Everything is built from procedural meshes; no external model files are required for the playable version.

### 3.2 Customers (Animal Visitors)

| Animal | GCC Icon | Favorite Goods | Personality |
|--------|----------|----------------|-------------|
| **Camel** | 🐪 | Dates, halwa | Patient, moves slowly, often buys in larger quantities. |
| **Falcon** | 🦅 | Qahwa, oud | Fast and decisive; prefers premium goods. |
| **Arabian Oryx** | 🦌 | Saffron, luban | Proud and calm; waits gracefully in line. |
| **Desert Fox** | 🦊 | Halwa, dates | Quick and clever; may leave if the line is too long. |
| **Goat** | 🐐 | Halwa, qahwa | Cheerful and chatty in animal sounds. |
| **Sheep** | 🐑 | Dates, luban | Gentle and polite; waits patiently. |

### 3.3 Core Goods (Physically Produced)

Every good is made by hand through a short production chain and shown as a physical prop the child can carry.

#### Dates Chain

| Stage | Visual | Action |
|-------|--------|--------|
| **Sapling** | Small date palm shoot in a clay pot | Child plants it at the palm plot. |
| **Fresh dates** | Cluster of yellow-brown dates on a palm frond | Child harvests when ripe. |
| **Drying dates** | Dates spread on a woven mat in the sun | Child places them on the drying mat and waits. |
| **Packed dates** | Dried dates in a small palm-leaf box | Child packs them at the packaging table. |
| **Shelf ready** | Palm-leaf box on the shelf | Customer buys it. |

**Price:** 5 coins per packed box.

#### Arabic Coffee (Qahwa) Chain

| Stage | Visual | Action |
|-------|--------|--------|
| **Green beans** | Small burlap sack of pale green coffee beans | Stored at the raw-goods corner. |
| **Roasting** | Beans in a small brass pan over a charcoal brazier | Child tends the pan until browned. |
| **Ground coffee** | Dark powder in a stone mortar | Child grinds roasted beans. |
| **Brewed qahwa** | Steam rising from a brass dallah | Child brews the ground coffee. |
| **Shelf ready** | Small cup of qahwa on the shelf | Customer buys it. |

**Price:** 8 coins per cup.

#### Frankincense (Luban) Chain

| Stage | Visual | Action |
|-------|--------|--------|
| **Raw resin** | Golden luban resin collected from a small frankincense tree | Tapped from the tree and collected at the raw-goods corner. |
| **Sorted resin** | Resin graded by size on a woven mat | Child sorts the lumps. |
| **Packed luban** | Sorted resin in a small cloth pouch | Child packs at the packaging table. |
| **Shelf ready** | Cloth pouch on the shelf | Customer buys it. |

**Price:** 10 coins per pouch.

### 3.4 Future / Unlockable Goods

After the core three chains are polished, additional goods may be added as level unlocks or seasonal content:

| Good | Production Chain | Price |
|------|------------------|-------|
| Oud oil | Chip oud wood → distill in small copper still → bottle | 12 coins |
| Saffron | Harvest red threads → dry → pack in clay jar | 15 coins |
| Halwa | Cook sugar, starch, ghee, nuts → cut → wrap in palm leaf | 7 coins |
| Pearls | Open oyster → clean pearl → string | 18 coins |

---

## 4. Core Loop

1. The player is a **young merchant** behind a traditional souq stall.
2. Three production chains run in parallel: **dates**, **qahwa**, and **luban**.
3. The player moves the child character between stations to:
   - Plant and harvest dates.
   - Dry and pack dates.
   - Roast, grind, and brew qahwa.
   - Sort and pack luban.
4. Finished goods are placed on shelves.
5. Animal customers enter the souq, walk to a stocked shelf, pick an item, then wait at the **cashier mat**.
6. The player moves to the cashier mat to **collect coins**.
7. Coins can be spent to unlock:
   - More shelves / product types.
   - Faster walking / production speed.
   - **Apprentice workers** (other children or friendly animals) who tend stations or handle payments.
   - Worker upgrades (speed, carry capacity, extra helpers).
   - Era-appropriate decorations: hand-woven carpets, brass lanterns, patterned cushions, clay pots, extra palm plots.
8. Each level has a **coin target** and a **timer**. Stars are awarded based on performance.
9. In **endless mode**, there is no timer — the child runs the stall for as long as the player wishes, serving an ever-growing queue of animal customers and building reputation.

---

## 5. Win / Lose Conditions

- **Level Win:** Earn at least the target coins before time runs out.
- **Level Lose:** Time runs out before reaching the target.
- **Endless Mode:** No lose condition; the goal is to maximize reputation, coins, and shop beauty over a long session.
- **Stars:**
  - ⭐ Reached target.
  - ⭐⭐ Reached target + 20%.
  - ⭐⭐⭐ Reached target + 50%.

---

## 6. Mechanics

### 6.1 Production Stations

| Station | Purpose | Goods |
|---------|---------|-------|
| **Palm plot** | Plant sapling → wait → harvest fresh dates | Dates chain |
| **Drying mat** | Fresh dates → dried dates | Dates chain |
| **Packaging table (dates)** | Dried dates → palm-leaf box | Dates |
| **Packaging table (luban)** | Sorted luban → cloth pouch | Luban |
| **Coffee brazier** | Green beans → roasted beans | Qahwa chain |
| **Stone mortar** | Roasted beans → ground coffee | Qahwa chain |
| **Dallah station** | Ground coffee → brewed qahwa | Qahwa chain |
| **Luban sorting mat** | Raw resin → sorted resin | Luban chain |
| **Raw-goods corner** | Stores green coffee beans and raw luban resin | Qahwa, Luban |
| **Shelves** | Holds finished goods for sale | All |
| **Cashier mat** | Customers pay here | All |

#### 6.1.1 Souq Layout

The stall is arranged into clearly separated zones so each production stream is easy to read and reach, while all finished goods end up in one front selling area:

- **Dates zone** — palm plot, drying mat, and dates packaging table clustered together.
- **Qahwa zone** — green beans sack, brazier, mortar, and dallah clustered together.
- **Luban zone** — frankincense tree, sorting mat, and luban packaging table clustered together.
- **Selling zone** — all shelves and the cashier mat clustered in the front of the souq, regardless of which good they hold.

This keeps every product near its source and processing steps, but lets customers find every finished good in one compact display area.

### 6.2 Production Rules

- Each station can process **one unit at a time** by default.
- The child must carry the intermediate product to the next station.
- Some stages require a short wait (e.g., drying dates, roasting beans, brewing qahwa).
- A station shows a subtle glow or animation when it is ready for the next step.
- Workers can be assigned to tend a specific station continuously.

### 6.3 Customer Behavior

- Customers spawn at the entrance based on level spawn rate and max capacity.
- Each customer has a preferred good; if unavailable, they wait briefly, then may leave.
- Customers walk to a **left or right slot** beside the target shelf, take the item, then join a spaced left/right queue at the cashier mat.
- If both left and right slots at a shelf are occupied, additional customers form a short line behind the shelf.
- All customer movement and waiting positions are clamped inside the visible play area so animals never stack on the same point or walk off-screen.
- If a customer waits too long at the cashier, they leave without paying.

### 6.4 Temporary Drop (Resting Mat)

- The play area contains a single **resting mat** near the front of the souq.
- The child can place any carried item on the mat to free their hands (useful when capacity is full or when a better task appears).
- The item remains on the mat for a limited time and can be reclaimed by walking over it.
- If the timer expires, the item spoils and must be produced again — there is no permanent "bin" for wasting goods.

### 6.5 Player Actions

| Action | How |
|--------|-----|
| Move | Tap or drag to move the child merchant. |
| Plant | Tap the palm plot while carrying a sapling. |
| Harvest | Tap a ripe palm plot. |
| Carry | Walk near a finished product to pick it up automatically. |
| Process / Pack / Stock | Carry the good to the correct station or shelf; it is placed automatically on arrival. `Space` (or the on-screen unload button) remains as a manual fallback. |
| Temporary drop | Press `T` (or tap "وضع مؤقت") to place a carried item on the resting mat. This frees the child’s hands. The item stays on the mat for a limited time and can be recovered; if ignored too long, it spoils and must be remade. |
| Collect temporary item | Walk over the resting mat to pick the item back up. |
| Collect payment | Walk to the cashier mat. |

### 6.6 Workers

- Workers are hired on the level-complete shop screen or during endless mode using coins.
- Each worker has a single role assigned by the player:
  - **Restocker / Station tender:** Stays at one assigned station and processes goods continuously.
  - **Carrier:** Picks up finished/intermediate goods and moves them to the next station or shelf.
  - **Cashier:** Walks to the cashier mat and collects payment from waiting animals.
- Workers move slower than the upgraded child but scale with upgrades.
- Later levels require workers to manage multiple chains and hit the coin target.

### 6.7 Hints & Feedback

- **Station glow:** A station glows when it is ready for the next step.
- **Shelf glow:** Shelves glow when stock is low.
- **Cashier glow:** The cashier mat glows when customers are waiting.
- **Patience indicator:** A small timer above a waiting customer shows how much patience remains.

---

## 7. 3D Art Direction

- **Era:** Pre-oil Gulf — everything is handmade, woven, clay, brass, or wood. No plastic, no glass-and-steel, no electric objects.
- **Style:** Stylized low-poly procedural meshes built in Babylon.js (no external model files in v1.0).
- **Stall:** Wooden counter, woven palm baskets, brass scales, hanging lanterns, clay brazier, stone mortar, brass dallah, hand-woven awning.
- **Production zones:** Clearly separated by props and ground mats:
  - Palm plot with a small date palm.
  - Sun drying mat.
  - Packaging table with palm-leaf strips and cloth.
  - Coffee brazier with charcoal glow.
  - Stone mortar and dallah station.
  - Luban sorting mat with small resin piles.
- **Characters:**
  - **Player:** A cute stylized cat merchant in a simple white thobe-style garment.
  - **Customers:** Full low-poly sculpts of iconic GCC animals (camel, falcon, oryx, fox, goat, sheep) with big expressive eyes, small cultural accessories, and idle animations: tail wags, wing flaps, head bobs, and ear twitches.
  - **Workers:** Young apprentice children or helper animals in simple traditional clothing.
- **Environment:** Sand floor, stone walls, palm-wood beams, distant mosque silhouette, warm sunset lantern lighting.
- **Camera:** Fixed isometric view, slightly angled, touch-friendly.
- **Effects:** Smoke from the brazier, steam from the dallah, coin pop-ups, item restock bounce, happy animal reactions (tail wag, wing flap), lantern glow.

### 7.1 Asset List

| Category | Assets |
|----------|--------|
| Environment | Sand ground plane, stone walls, palm-wood beams, stall structure, hanging lanterns, woven awning |
| Production | Palm plot, drying mat, packaging table, coffee brazier, stone mortar, dallah station, luban sorting mat, raw-goods sacks |
| Storage | Woven shelves, cashier mat |
| Characters | Child merchant player, camel customer, falcon customer, oryx customer, fox customer, goat customer, sheep customer, apprentice workers |
| Goods (Dates) | Palm sapling, fresh date cluster, drying dates, palm-leaf box |
| Goods (Qahwa) | Green bean sack, roasting pan, ground coffee in mortar, brass dallah, small cup |
| Goods (Luban) | Raw resin lumps, sorted resin, cloth pouch |
| UI | Level picker cards, coin counter, timer bar, reputation meter, star icons, upgrade buttons, station role badges |
| Particles | Smoke, steam, coin sparkle, restock puff, happy animal emoji puff, lantern glow |

---

## 8. Controls

| Device | Input |
|--------|-------|
| Desktop | Mouse click / drag to move the child merchant; click stations, shelves, or cashier to move to them. Press `Space` to unload at the nearest station or shelf; press `T` for a temporary drop on the resting mat. |
| Tablet / Mobile | Touch and drag to move; tap targets to move to them. Tap the on-screen "ضع السلعة" button to unload, or "وضع مؤقت" to place the item on the resting mat. |

---

## 9. UI & Feedback

- Top HUD: coin count, timer (level mode), current target, reputation meter (endless mode).
- Bottom hint: current objective or tip (e.g., "اجلب التمر من النخلة", "اجفف التمر على السجادة").
- Level picker: level cards with star ratings and locked/unlocked state.
- Endless mode button: "افتح الدكان للزبائن طوال اليوم" (Open the stall all day).
- Shop screen (between levels / during endless mode): upgrades, worker hiring, era-appropriate decorations.
- Result screen: coins earned, stars, next-level button, endless-mode button.
- Mute button in the game header.

---

## 10. Audio

- **Music:** Gentle, looping souq ambience with oud, riq, and soft flute melodies, synthesized via Web Audio.
- **SFX (synthesized):**
  - Planting rustle
  - Harvest snap
  - Drying rustle
  - Coffee roasting crackle
  - Mortar grinding
  - Dallah pour
  - Luban sorting clink
  - Cloth pouch tie
  - Coin collect chime (brass coin sound)
  - Animal spawn / happy reaction
  - Level complete fanfare
  - Timer warning tick (level mode only)

---

## 11. Online Safety

- No free text chat.
- No account-required multiplayer.
- Optional nickname-only leaderboard (future).
- All data stored locally by default.

---

## 12. Monetization & Retention Hooks

- Unlockable stall decorations (rugs, lanterns, cushions, awning patterns, extra palm plots) — cosmetic only.
- Seasonal souq themes (Ramadan, Eid, National Day) with era-appropriate props.
- Daily challenge with a fixed layout and leaderboard (future).
- Long-session endless mode encourages repeated play over hours.
- Additional goods (oud, saffron, halwa, pearls) unlock as progression rewards.

---

## 13. Asset Formats

| Asset Type | Format | Notes |
|------------|--------|-------|
| Models | Procedural Babylon.js meshes | Boxes, cylinders, spheres, planes, simple animal silhouettes |
| Textures | CSS / canvas gradients | Minimal; WebP fallback if needed |
| UI sprites | WebP / PNG | Packed into small atlases |
| Audio | Web Audio API synthesized | No external audio files in v1.0 |

---

## 14. Analytics Events

| Event | Purpose |
|-------|---------|
| `game_started` | Track game popularity. |
| `level_completed` | Track progression and difficulty curve. |
| `level_failed` | Identify hard levels. |
| `worker_hired` | Track economy engagement. |
| `endless_session_length` | Retention and long-session analysis. |
| `decoration_purchased` | Track cosmetic engagement. |
| `production_chain_completed` | Track which chains players engage with most. |

---

## 15. Offline & PWA

- Single-player level progression works offline after first load.
- Endless mode works offline.
- Service worker caches the game bundle.

---

## 16. Compliance & Safety

- No free text chat.
- Minimal data collection: optional nickname, scores.
- Comply with GCC data protection regulations and COPPA/GDPR-K.
- Parent dashboard for time limits and data deletion.

---

## 17. Monetization

- **Freemium cosmetics** — unlockable stall themes and worker outfits (all era-appropriate).
- **One-time Full Game Pass** — unlock all games and themes.
- **Seasonal content** — GCC National Day souq decorations.
- **Optional rewarded video** — after 50K+ MAU, COPPA-certified only.
- No interstitials, banners, or personalized ads.

---

## 18. Implementation Notes (v2.0)

- Built as a Babylon.js scene inside a SvelteKit lazy-loaded component.
- All meshes are procedural; no external GLB/texture assets required for the playable version.
- Game logic is pure TypeScript (`SouqManagerLogic.ts`) with matching unit tests.
- Player, customers, and workers are simple entities with positions, targets, and movement speed.
- Production stations are state machines with timers and input/output good types.
- Collision/pathfinding is grid-free: characters move in straight lines toward targets and stop when close enough.
- Audio is synthesized at runtime via the Web Audio API; a mute toggle is exposed through the game header.
- Level data is defined in a JSON/TS config so designers can tweak targets, spawn rates, production times, and unlocks without touching code.

---

## 19. Technical Notes

- Use the same project layout as Fort Battle: `Logic.ts`, `Game.ts`, Svelte wrapper, `index.ts`, tests.
- Target 60 FPS on Tier 1 tablets; keep draw calls low by reusing materials and instancing shelves.
- Dispose scene, meshes, materials, and observables on exit.

---

*Prepared by Aldoolab for the GCC Kids Web Game Platform.*
