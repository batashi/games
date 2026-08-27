# Math Section Game Proposal — Sahara Play / Aldoolab

## Section identity

- **English:** Math
- **Arabic:** رياضيات
- **Target age:** 9–11 (Grade 5 primary, adaptable 7–12)
- **Subject:** Mathematics — aligned with Grade 5 Semester 1 (Cambridge / Oman MOE)
- **Cultural anchor:** Omani forts, souqs, falconry, maritime trade, date farming, and desert geography.

## Design direction

See `math/math-platform-research.md` for the full competitive analysis. The math section adopts these proven gameplay-zone features:

- Timed answer rewards, combo chains, and immediate audio feedback
- Visual problem presentation on culturally-themed objects (stone tablets, clay tags, banners)
- Progressive difficulty, boss encounters, and power-ups
- Character progression, companion helpers, and collectible Omani currency
- Daily challenges, local co-op, and endless practice modes

All games use **procedural audio and visuals** (no external model/texture/audio assets), support **Arabic-first UI**, and keep sessions to **2–4 minutes**.

## Proposed games

| # | ID | English name | Arabic name | Math focus | Core mechanic | Cultural theme | Status |
|---|---|---|---|---|---|---|---|
| 1 | `number-vault` | Guardian of the Vault | حارس الخزنة | Place value, comparing, rounding, sequences | Solve riddles to spring traps and stop ghouls | Omani fort treasure vault | **Shipped** |
| 2 | `souq-arithmetic` | Souq Arithmetic | حسابات السوق | Addition, subtraction, multiplication, division, order of operations, money decimals | Run a market stall: calculate totals, give change, restock | Traditional GCC/Omani souq | **Next** |
| 3 | `falcon-grid` | Falcon Grid | شبكة الصقر | Coordinates, geometry, translations, reflections | Move a falcon across a map by reading and plotting coordinates | Desert falconry / Oman map | Ready (design) |
| 4 | `fort-builder` | Fort Builder | باني القلعة | 2D/3D shapes, nets, area, perimeter | Construct traditional forts and houses from shape nets; measure walls | Omani forts and architecture | Ready (design) |
| 5 | `time-caravan` | Time Caravan | قافلة الزمن | Time (12/24 h), duration, timetables | Plan a caravan journey across GCC cities; catch buses and boats on time | GCC travel / Oman transport | Ready (design) |
| 6 | `falcon-coins` | Falcon Coins | عملات الصقر | Decimals, money, fractions of a riyal | Buy and sell falconry goods; handle riyals and baisa accurately | Falcon market / traditional trade | Ready (design) |
| 7 | `date-divider` | Date Divider | قاسم التمر | Division, factors, multiples, remainders | Pack dates into baskets of equal size for a harvest shipment | Omani date harvest | Proposal |
| 8 | `sailor-measures` | Sailor Measures | قياسات البحّار | Mass, length, capacity, unit conversion | Load a dhow without capsizing; balance cargo weights | Omani maritime trade | Proposal |
| 9 | `tile-algebra` | Tile Algebra | جبر البلاط | Unknown values, simple equations, balance | Solve for missing tiles in Omani geometric patterns | Omani geometric patterns / fort decoration | Proposal |
| 10 | `negative-oasis` | Negative Oasis | الواحة المجمّدة | Negative numbers, temperature, ordering | Regulate water channels and temperatures across desert oases | Desert oasis irrigation | Proposal |

## Notes

- Each game maps directly to one or more lessons in the Grade 5 book.
- Games are designed as **short-session educational mini-games** (2–4 minutes), single-player first, with local/practice modes.
- Art style: bright, flat-shaded, low-poly 3D consistent with the existing Sahara Play visual direction.
- All visuals procedural; no external model/texture/audio assets required.
- Implementation order prioritizes **mechanical variety** and **curriculum coverage**: Number Vault (defense) → Souq Arithmetic (market/service) → Falcon Grid (coordinates) → Fort Builder (geometry).
