# AGENTS.md — GCC Kids Web Game Platform

> This file is written for AI coding agents. It describes the project as it actually exists in the repository right now, not as a future plan.

## 1. Project Overview

This repository is the planning and design home for the **GCC Kids Web Game Platform** (working title), a browser-based collection of culturally-themed games for children aged 7–12 across the Gulf Cooperation Council (GCC). It is maintained by **Aldoolab**.

The project has evolved from a documentation-only repository into an active SvelteKit + Babylon.js implementation. The website and the first playable game (Fort Battle) are now built, tested, and deployed. Internal documentation remains the authoritative source for architecture and process.

Four games are specified in the repository:

| ID | English Name | Arabic Name | Status |
|---|---|---|---|
| `frankincense` | Frankincense Collector Runner | مغامرة جامع اللبان | Ready (design) |
| `tictactoe` | Gulf Tic-Tac-Toe | تحدي إكس-أو الخليجي | Ready (design) |
| `archery` | Fort Battle | معركة القلاع | Ready (design + playable prototype) |
| `luban-sorter` | Luban Sorter | فرز اللبان | Ready (design) |
| `souq-manager` | Souq al-Khaleej | سوق الخليج | In design / coming soon |

Additional games may be added to `data/games.json` as the catalogue grows.

## 2. Repository Layout

```
/root
├── FRAMEWORK.md                # Main English technical blueprint (authoritative)
├── WEBSITE.md                  # Specification for the public marketing/discovery website
├── DEPLOYMENT.md               # Development, testing, release, and deployment guide
├── AGENTS.md                   # This file
├── data/
│   └── games.json              # Single source of truth for game metadata
├── GDD/
│   ├── gdd-01-frankincense-runner.md
│   ├── gdd-02-gulf-tic-tac-toe.md
│   ├── gdd-03-fort-battle.md
│   ├── gdd-04-luban-sorter.md
│   └── gdd-05-souq-manager.md
└── website/                    # SvelteKit + Vite + Babylon.js application
    ├── src/
    │   ├── lib/
    │   │   ├── components/     # Svelte components
    │   │   ├── games/          # One folder per game
    │   │   └── ...
    │   └── routes/             # SvelteKit pages
    ├── e2e/                    # Playwright E2E tests
    ├── package.json
    ├── playwright.config.ts
    ├── vitest.config.ts
    └── build/                  # Production build output (generated)
```

## 3. Technology Stack

The active implementation lives under `website/` and uses the following stack:

| Layer | Technology |
|---|---|
| Build tool | Vite |
| Language | TypeScript (strict mode) |
| App shell | Svelte 5 (runes mode) |
| Game engine | Babylon.js (3D-first) |
| Styling | Tailwind CSS + CSS custom properties |
| Multiplayer server | Colyseus (planned; not yet integrated) |
| Backend / auth / database | Supabase (planned; not yet integrated) |
| Unit tests | Vitest |
| E2E tests | Playwright |
| Linting / formatting | ESLint + Prettier (configured via Vite/SvelteKit defaults) |

**Note on engine choice:** `FRAMEWORK.md` selects **Babylon.js** as the default engine. Treat it as the authoritative technical source unless a maintainer explicitly overrides it.

## 4. Build and Run Commands

All build and test commands are run from `website/`:

```bash
cd /root/website
npm install
npm run dev              # Start the Vite dev server
npm run build          # Production build; output goes to website/build/
npm run preview        # Preview the production build locally
npm run check          # Type-check with svelte-check
npm test               # Run Vitest unit tests
npm run e2e            # Run Playwright E2E tests against the production build
```

For the full release and deployment procedure, see `DEPLOYMENT.md`.

To read the documentation, open any `.md` file directly.

## 5. Code Organization

Documentation remains structured by document type:

- **`FRAMEWORK.md`** — Architecture, tech stack, migration roadmap, code-quality standards, child-safety rules, and asset pipeline.
- **`WEBSITE.md`** — Public website requirements, SEO, analytics, ads policy, and integration with the game app.
- **`DEPLOYMENT.md`** — Development, testing, release, and deployment workflow.
- **`GDD/*.md`** — Individual Game Design Documents, one per implemented game.
- **`data/games.json`** — Shared metadata used by both the game app and the website.

The active implementation is in `website/`:

- `website/src/lib/components/` — Svelte components (cards, layout, game wrappers).
- `website/src/lib/games/` — One folder per game, containing logic, presentation, and tests.
- `website/src/lib/types/` — Shared TypeScript types and label dictionaries.
- `website/src/routes/` — SvelteKit pages (home, games, game detail, play launcher).
- `website/e2e/` — Playwright smoke tests.
- `website/build/` — Production build output (generated, not committed).

## 6. Data Contract: `data/games.json`

This file is the single source of truth for game metadata. It is referenced by `WEBSITE.md` as the shared data source for the public site.

Key fields for each game entry:

| Field | Purpose |
|---|---|
| `id` | Unique game ID used in code and URLs |
| `slug` | URL-friendly identifier |
| `nameAr` / `nameEn` | Display names |
| `taglineAr` / `taglineEn` | Short marketing hook |
| `descriptionAr` / `descriptionEn` | Longer description |
| `icon` | Emoji or icon identifier |
| `genre` / `genreLabelAr` / `genreLabelEn` | Genre classification |
| `ageRange` | Target age range, e.g. `7-12` |
| `sessionLength` | Estimated play time, e.g. `1-3 min` |
| `modes` | Array of modes: `single`, `local`, `online`, `async`, `daily`, `practice`, `coop`, `team` |
| `countries` | GCC country codes: `OM`, `SA`, `AE`, `QA`, `BH`, `KW` |
| `status` | `ready`, `beta`, or `coming-soon` |
| `supportedPlatforms` | `desktop`, `tablet`, `mobile` — surfaced in the website as device badges, a catalogue filter, and a detail-page section |
| `heroImage` / `thumbnail` / `video` | Asset paths |
| `howToPlayAr` / `howToPlayEn` | Step-by-step instructions |
| `culturalNoteAr` / `culturalNoteEn` | Cultural context paragraph |
| `metaTitleAr` / `metaTitleEn` | SEO `<title>` |
| `metaDescriptionAr` / `metaDescriptionEn` | SEO meta description |

The JSON file declares `"$schema": "./games.schema.json"`, but that schema file is **not present** in the repository yet. If you add or edit `games.json`, keep the field set consistent with the existing three entries and the schema described in `WEBSITE.md` section 8.4.

## 7. Development Conventions

- **Primary language for docs:** English. The framework and internal documentation are maintained in English; the public-facing platform, games, and website remain **Arabic-first**.
- **Game design documents:** Use the existing `GDD/*.md` structure (Elevator Pitch, Game Identity, GameConfig Contract, Core Loop, Mechanics, Controls, UI/Feedback, Audio, Safety, Monetization, Technical Notes).
- **Commit style:** The project uses conventional commit prefixes such as `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`, etc. Continue using them.
- **Game metadata:** When a new game is designed, add it to `data/games.json` and create a matching `GDD/gdd-NN-game-name.md` file.
- **File naming:** Use lowercase, hyphens, and descriptive names (e.g., `gdd-01-frankincense-runner.md`).
- **Code changes:** Run the validation gates in `DEPLOYMENT.md` before merging or deploying.

## 8. Testing Strategy

The following test infrastructure is in place under `website/`:

- **Unit tests (Vitest):** pure game logic files (`*Logic.ts`) with matching `*Logic.test.ts`. Cover state transitions, win/lose, physics, collision, input clamping, and edge cases.
- **E2E tests (Playwright):** smoke tests under `website/e2e/` run against the production build. Each shipped game must have a test that loads `/play/[id]`, verifies the canvas, and asserts zero page/console errors.
- **Manual QA:** real tablets, throttled networks, RTL Arabic layout.

## 9. Deployment

The current deployment is manual:

- **Production server:** static files are served from `/var/www/games.aldoolab.com`.
- **Public URL:** `https://games.aldoolab.com`.
- **Release steps:** build with `npm run build`, copy `website/build/` to `/var/www/games.aldoolab.com`, and verify with `curl`.
- **Detailed procedure:** see `DEPLOYMENT.md`.

Future improvements remain as proposed in `FRAMEWORK.md`:

- **Frontend:** automated static hosting on Vercel, Netlify, Cloudflare Pages, or GitHub Pages with HTTPS enforced.
- **Backend:** Node.js/Colyseus on Railway, Render, Fly.io, or a VPS; Redis for scaling.
- **Database:** Supabase PostgreSQL with row-level security and backups.

## 10. Security and Child-Safety Requirements

These are non-negotiable project rules carried through all documents:

- **No free text chat.** Online play may only use preset emoji/phrase reactions.
- **Invite-only rooms** with random, non-sequential codes; capacity limits; instant leave/report.
- **Minimal data collection:** nickname (optional), avatar choice, scores. No personal identifiers for under-13 users without guardian consent.
- **Compliance:** GCC data-protection regulations and COPPA/GDPR-K if serving outside the GCC.
- **Client-side protections:** validate and sanitize all inputs; serve over HTTPS only; use a Content Security Policy.
- **Ads:** Allowed only on adult-facing website pages; never inside the child-facing game app except optional rewarded video after 50K+ MAU and only through COPPA-certified networks.

## 11. Notes for Future Agents

- `FRAMEWORK.md` is the authoritative technical spec; `WEBSITE.md` is the authoritative website spec; `data/games.json` is the authoritative metadata source.
- The active build system, source tree, and tests live under `website/`. Run commands from that directory.
- If you generate code, match the existing stack (Vite + TypeScript + Svelte 5 + Babylon.js + Tailwind CSS) and the child-safety rules above.
- Run `npm run check`, `npm test`, and `npm run e2e` before committing TypeScript or game-logic changes. See `DEPLOYMENT.md` for the full release checklist.
- If you modify `data/games.json`, keep Arabic and English fields in sync and preserve the existing structure.
- Keep `AGENTS.md`, `DEPLOYMENT.md`, and `WEBSITE.md` current whenever build, deployment, or data workflows change.
