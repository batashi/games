# Top 15 Math Game Ideas — Grade 5 Semester 1 (Oman MOE)

> Source: `math/grade-5-toc.md` and `/root/kutoob/a.txt` (Cambridge Primary Mathematics, Grade 5, aligned by Oman MOE).  
> Cross-referenced with features from `math/math-platform-research.md`.

## Selection criteria

- Maps to at least one lesson in the Grade 5 Semester 1 book.
- Fits a 2–4 minute session.
- Uses an Omani or GCC cultural setting.
- Mechanically distinct from existing Sahara Play games.
- Can be built with procedural assets only.

---

## 1. Guardian of the Vault — حارس الخزنة

- **Status:** Shipped
- **Math focus:** Place value, comparing, rounding, sequences
- **Book mapping:** 1-1, 2-1, 3-1, 1-2
- **Core mechanic:** Ghouls carry number riddles; correct answers trigger Omani traps.
- **Cultural setting:** Vault tunnel inside an Omani fort.
- **Estimated effort:** Medium

## 2. Souq Arithmetic — حسابات السوق

- **Status:** Next implementation target
- **Math focus:** Addition, subtraction, multiplication, division, order of operations, money decimals
- **Book mapping:** 2-2, 1-13, 2-13, 3-13
- **Core mechanic:** Run a market stall: calculate customer totals, give change, restock before supplies run out.
- **Cultural setting:** Muttrah-style souq stall with Omani goods (dates, frankincense, dallahs, khanjars).
- **Estimated effort:** Medium
- **Why next:** Largest lesson coverage, familiar setting, service-time pressure creates urgency without violence.

## 3. Falcon Grid — شبكة الصقر

- **Math focus:** Coordinates, translations, reflections
- **Book mapping:** 1-6, 2-6
- **Core mechanic:** Plot coordinate moves on a desert map to guide a falcon to prey or landmarks.
- **Cultural setting:** Falconry camp with a map of Oman wilayats.
- **Estimated effort:** Medium

## 4. Fort Builder — باني القلعة

- **Math focus:** 2D/3D shapes, nets, area, perimeter
- **Book mapping:** 3-5, 1-9, 2-9
- **Core mechanic:** Construct fort walls and towers from shape nets; measure walls to fit a budget of stone.
- **Cultural setting:** Omani fort construction site.
- **Estimated effort:** High (3D nets)

## 5. Time Caravan — قافلة الزمن

- **Math focus:** Time (12/24 h), duration, timetables
- **Book mapping:** 1-8, 2-8
- **Core mechanic:** Plan a caravan journey across GCC cities; catch buses, boats, and planes on time.
- **Cultural setting:** Omani travel from Muscat to Salalah, Dubai, Doha.
- **Estimated effort:** Medium

## 6. Date Divider — قاسم التمر

- **Math focus:** Division, factors, multiples, remainders
- **Book mapping:** 2-3, 3-3, 2-4, 3-4, 1-14
- **Core mechanic:** Pack dates into baskets of equal size for a harvest shipment; deal with leftovers.
- **Cultural setting:** Date palm oasis during harvest season.
- **Estimated effort:** Low-Medium

## 7. Falcon Coins — عملات الصقر

- **Math focus:** Decimals, money, fractions of a riyal
- **Book mapping:** 1-11, 1-12, 2-12, 3-13
- **Core mechanic:** Buy and sell falconry goods; handle riyals and baisa accurately.
- **Cultural setting:** Falcon market at a desert festival.
- **Estimated effort:** Medium

## 8. Sailor Measures — قياسات البحّار

- **Math focus:** Mass, length, capacity, unit conversion
- **Book mapping:** 1-7
- **Core mechanic:** Load a dhow without capsizing; balance cargo weights and volumes.
- **Cultural setting:** Muscat harbor and dhow loading dock.
- **Estimated effort:** Medium

## 9. Tile Algebra — جبر البلاط

- **Math focus:** Unknown values, simple equations, balance
- **Book mapping:** 2-10, 3-3, 1-4
- **Core mechanic:** Solve for missing tiles in Omani geometric wall patterns to restore a fort mural.
- **Cultural setting:** Fort decoration room with traditional geometric patterns.
- **Estimated effort:** Medium

## 10. Negative Oasis — الواحة المجمّدة

- **Math focus:** Negative numbers, temperature, ordering
- **Book mapping:** 1-10, 3-10
- **Core mechanic:** Regulate water channels and temperatures across desert oases using positive/negative numbers.
- **Cultural setting:** Network of desert oases at different altitudes (Jebel Akhdar vs desert floor).
- **Estimated effort:** Medium

## 11. Pearl Sorter — فرّاز اللؤلؤ

- **Math focus:** Ordering, comparing, rounding
- **Book mapping:** 2-1
- **Core mechanic:** Sort pearl harvest by size/weight; round values to grade each pearl.
- **Cultural setting:** Omani pearl diving heritage, coastal sorting house.
- **Estimated effort:** Low

## 12. Magic Square Caravan — قافلة المربعات السحرية

- **Math focus:** Addition and subtraction strategies, magic squares
- **Book mapping:** 2-2
- **Core mechanic:** Fill magic squares to unlock caravan checkpoints.
- **Cultural setting:** Desert caravan stopping at oases marked by stone slabs.
- **Estimated effort:** Low-Medium

## 13. Dhow Loader — محمّل السفن

- **Math focus:** Multiplication methods (grid/area), 2-digit × 2-digit
- **Book mapping:** 1-3, 4-3
- **Core mechanic:** Arrange cargo crates in grids to maximize dhold space; answers come from area-model multiplication.
- **Cultural setting:** Dhow cargo hold at Muscat harbor.
- **Estimated effort:** Medium

## 14. Triangle Scout — كشّاف المثلثات

- **Math focus:** Types of triangles, parallel/perpendicular lines, right angles
- **Book mapping:** 1-5, 2-5
- **Core mechanic:** Classify triangles and angles found in Omani architecture to repair a fort's watchtower.
- **Cultural setting:** Hill fort watchtower with geometric stone details.
- **Estimated effort:** Low-Medium

## 15. Frankincense Scale — ميزان اللبان

- **Math focus:** Mass, balance, equivalence
- **Book mapping:** 1-7, 2-10
- **Core mechanic:** Balance frankincense resin on a brass scale; solve for unknown weights.
- **Cultural setting:** Frankincense market in Salalah/Al-Baleed.
- **Estimated effort:** Low-Medium

---

## Implementation priority

1. **Souq Arithmetic** — broad curriculum fit, familiar theme, quick to prototype.
2. **Date Divider** — low effort, high lesson coverage, strong harvest theme.
3. **Falcon Grid** — distinct mechanic (coordinates), reuse map/navigation motifs.
4. **Pearl Sorter** — very low effort, good for rounding/comparing practice.
5. **Triangle Scout** — geometry coverage, architectural setting.

## Features borrowed from research

Each idea incorporates at least three proven gameplay-zone features:

- **Immediate feedback** (correct/wrong sounds + animations)
- **Timed answer rewards** (happy customer, faster caravan departure)
- **Combo chains** (streaks of correct change calculations)
- **Progressive difficulty** (more items, larger numbers, decimals)
- **Power-ups** (abacus hint, faster customer service)
- **Collectible currency** (silver coins / baisa / frankincense resin)
- **Short celebratory animations** (customer dance, dhow departure)

## Cultural thread

All 15 games share an Omani-GCC visual language:

- **Settings:** forts, souqs, oases, harbors, desert, mountains.
- **Objects:** khanjar, dallah, dates, frankincense, pearls, dhows, abacus.
- **Audio:** procedural oud/taqsim, coin clinks, market ambience, desert wind.
- **Characters:** young merchant, fort guard, sailor, falconer, date farmer.
