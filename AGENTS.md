# AGENTS.md — GCC Kids Web Game Platform

> This file is written for AI coding agents. It describes the project as it actually exists in the repository right now, not as a future plan.

## 1. Project Overview

This repository is the planning and design home for the **GCC Kids Web Game Platform** (working title), a browser-based collection of culturally-themed games for children aged 7–12 across the Gulf Cooperation Council (GCC). It is maintained by **Aldoolab**.

**Important:** At the moment this is a **documentation-only repository**. The runnable HTML/CSS/JS prototype described in `README.md` was removed in a previous commit (`9f24ef2 chore: remove prototype game code, keep documentation only`). There is no build system, no source code, and no package manifest checked in. All current value is in the design documents, architecture framework, and game metadata.

Three games are fully specified and catalogued:

| ID | English Name | Arabic Name | Status |
|---|---|---|---|
| `frankincense` | Frankincense Collector Runner | مغامرة جامع اللبان | Ready (design) |
| `tictactoe` | Gulf Tic-Tac-Toe | تحدي إكس-أو الخليجي | Ready (design) |
| `archery` | Fort Battle | معركة القلاع | Ready (design) |

Seventeen additional games are listed in `README.md` as "Coming Soon" but have not been designed yet.

## 2. Repository Layout

```
/root
├── README.md                   # Quick-start and catalogue (describes removed prototype)
├── FRAMEWORK.md                # Main English technical blueprint (authoritative)
├── WEBSITE.md                  # Specification for the public marketing/discovery website
├── AGENTS.md                   # This file
├── data/
│   └── games.json              # Single source of truth for game metadata
├── GDD/
│   ├── gdd-01-frankincense-runner.md
│   ├── gdd-02-gulf-tic-tac-toe.md
│   └── gdd-03-fort-battle.md
└── .gitignore                  # Excludes tool configs, logs, and shell files
```

No `package.json`, `vite.config.ts`, `tsconfig.json`, source directories, or build configuration exist yet.

## 3. Technology Stack (Planned)

The framework documents propose the following stack for a future implementation. It is **not yet present** in the repository:

| Layer | Technology |
|---|---|
| Build tool | Vite |
| Language | TypeScript (strict mode) |
| App shell | Svelte 5 or Vue 3 |
| Game engine | Babylon.js (3D-first) |
| Styling | CSS custom properties + optional Tailwind CSS |
| Multiplayer server | Colyseus |
| Backend / auth / database | Supabase |
| Unit tests | Vitest |
| E2E tests | Playwright |
| Linting / formatting | ESLint + Prettier |

**Note on engine choice:** `FRAMEWORK.md` selects **Babylon.js** as the default engine. Treat it as the authoritative technical source unless a maintainer explicitly overrides it.

## 4. Build and Run Commands

Because there is no build system or runnable code, there are no project build or test commands right now.

- To preview the future prototype described in `README.md`, the document suggests serving static files over HTTP:
  ```bash
  cd /root
  python3 -m http.server 8080
  ```
  However, **this will currently serve only the directory listing and markdown files** because the HTML/CSS/JS assets no longer exist.

- To read the documentation, open any `.md` file directly.

## 5. Code Organization

There is no source code to organize yet. Work is structured by document type:

- **`FRAMEWORK.md`** — Architecture, tech stack, migration roadmap, code-quality standards, child-safety rules, and asset pipeline.
- **`WEBSITE.md`** — Public website requirements, SEO, analytics, ads policy, and integration with the game app.
- **`GDD/*.md`** — Individual Game Design Documents, one per implemented game.
- **`data/games.json`** — Shared metadata used by both the game app and the website.

When implementation starts, `FRAMEWORK.md` section 4 prescribes a layout under `src/` with `shell/`, `core/`, `games/`, and `server/` folders.

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
| `supportedPlatforms` | `desktop`, `tablet`, `mobile` |
| `heroImage` / `thumbnail` / `video` | Asset paths |
| `howToPlayAr` / `howToPlayEn` | Step-by-step instructions |
| `culturalNoteAr` / `culturalNoteEn` | Cultural context paragraph |
| `metaTitleAr` / `metaTitleEn` | SEO `<title>` |
| `metaDescriptionAr` / `metaDescriptionEn` | SEO meta description |

The JSON file declares `"$schema": "./games.schema.json"`, but that schema file is **not present** in the repository yet. If you add or edit `games.json`, keep the field set consistent with the existing three entries and the schema described in `WEBSITE.md` section 8.4.

## 7. Development Conventions

Until coding begins, follow these document-level conventions:

- **Primary language for docs:** English. The framework and internal documentation are maintained in English; the public-facing platform, games, and website remain **Arabic-first**.
- **Game design documents:** Use the existing `GDD/*.md` structure (Elevator Pitch, Game Identity, GameConfig Contract, Core Loop, Mechanics, Controls, UI/Feedback, Audio, Safety, Monetization, Technical Notes).
- **Commit style:** The project uses conventional commit prefixes such as `docs:`, `chore:`, `docs(framework):`, etc. Continue using them.
- **Game metadata:** When a new game is designed, add it to `data/games.json` and create a matching `GDD/gdd-NN-game-name.md` file.
- **File naming:** Use lowercase, hyphens, and descriptive names (e.g., `gdd-01-frankincense-runner.md`).

## 8. Testing Strategy

No test infrastructure exists. The framework plans for:

- **Unit tests (Vitest):** win detection, AI selection, network validators, score sorting.
- **E2E tests (Playwright):** launching a game, hosting/joining a room, completing a match, mute/fullscreen buttons.
- **Manual QA:** real tablets, throttled networks, RTL Arabic layout.

## 9. Deployment

No deployment pipeline exists. The framework proposes:

- **Frontend:** static hosting on Vercel, Netlify, Cloudflare Pages, or GitHub Pages with HTTPS enforced.
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

- Do not assume a build system, framework, or engine is installed. Check the file tree first.
- `FRAMEWORK.md` is the authoritative technical spec; `WEBSITE.md` is the authoritative website spec; `data/games.json` is the authoritative metadata source.
- Do not add a `package.json`, Vite config, or source tree unless explicitly asked or unless you are implementing the framework migration roadmap.
- If you generate code, match the planned stack (Vite + TypeScript + Svelte/Vue + Babylon.js + Colyseus + Supabase) and the child-safety rules above.
- If you modify `data/games.json`, keep Arabic and English fields in sync and preserve the existing structure.
