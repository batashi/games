# Deployment & Development Guide

**Version:** 1.0  
**Date:** 2026-07-21  
**Purpose:** Operational reference for developing, testing, releasing, and maintaining the GCC Kids Web Game Platform website and games.

---

## Table of Contents

1. [Repository Layout](#1-repository-layout)
2. [Development Environment](#2-development-environment)
3. [Daily Development Workflow](#3-daily-development-workflow)
4. [Testing Requirements](#4-testing-requirements)
5. [Adding a New Game](#5-adding-a-new-game)
6. [Building for Production](#6-building-for-production)
7. [Deployment](#7-deployment)
8. [Maintenance & Monitoring](#8-maintenance--monitoring)
9. [Rollback Procedure](#9-rollback-procedure)
10. [Release Checklist](#10-release-checklist)

---

## 1. Repository Layout

```
/root
├── FRAMEWORK.md              # Technical blueprint and compliance rules
├── WEBSITE.md                # Public website specification
├── DEPLOYMENT.md             # This file
├── AGENTS.md                 # AI agent guidelines
├── data/
│   └── games.json            # Single source of truth for game metadata
├── GDD/                      # Game Design Documents (one per game)
│   ├── gdd-01-frankincense-runner.md
│   ├── gdd-02-gulf-tic-tac-toe.md
│   └── gdd-03-fort-battle.md
└── website/                  # SvelteKit + Vite + Babylon.js application
    ├── src/
    │   ├── lib/
    │   │   ├── components/   # Svelte components (GameCard, FortBattle, etc.)
    │   │   ├── games/        # One folder per game
    │   │   │   └── fort-battle/
    │   │   │       ├── FortBattleGame.ts
    │   │   │       ├── FortBattleLogic.ts
    │   │   │       └── FortBattleLogic.test.ts
    │   │   └── ...
    │   └── routes/           # SvelteKit pages
    ├── e2e/                  # Playwright E2E tests
    ├── package.json
    ├── playwright.config.ts
    ├── vitest.config.ts
    └── build/                # Production build output (generated)
```

---

## 2. Development Environment

### 2.1 Prerequisites

- Node.js 22+ (LTS recommended)
- npm 10+
- Git
- Access to the web server directory `/var/www/games.aldoolab.com`

### 2.2 Initial Setup

```bash
cd /root/website
npm install
npx playwright install chromium
```

### 2.3 Verify Setup

```bash
cd /root/website
npm test
npm run e2e
```

Both must pass before any production work begins.

---

## 3. Daily Development Workflow

### 3.1 Before You Start

1. Pull latest changes:
   ```bash
   cd /root && git pull
   ```
2. Run unit tests in watch mode while developing logic:
   ```bash
   cd /root/website && npm run test:watch
   ```

### 3.2 Branching (Recommended)

- `main` is the production branch.
- Create feature branches for new work:
  ```bash
  git checkout -b feat/game-name-mechanic
  ```
- Merge back to `main` only after all gates pass.

### 3.3 Commit Style

Use conventional commits:

- `feat:` new feature
- `fix:` bug fix
- `test:` adding or updating tests
- `docs:` documentation changes
- `refactor:` code restructuring without behavior change
- `chore:` tooling, dependencies, config

Example:
```bash
git commit -m "fix(fort-battle): prevent arrow from rotating after release"
```

---

## 4. Testing Requirements

Testing is **mandatory** and non-negotiable. See `FRAMEWORK.md` section 11 for the full testing strategy.

### 4.1 Unit Tests (Vitest)

Every game's logic must live in a pure TypeScript file (`*Logic.ts`) with matching unit tests (`*Logic.test.ts`).

```bash
cd /root/website
npm test
```

**Rules:**
- Logic files must not import Babylon.js, DOM APIs, Web Audio, or network code.
- Cover state transitions, win/lose, physics, collision, input clamping, and edge cases.
- Run `npm run test:watch` during logic development for fast feedback.

### 4.2 E2E Tests (Playwright)

E2E tests run the production build in a real Chromium browser and fail on any console/page error.

```bash
cd /root/website
npm run e2e
```

**Rules:**
- Every shipped game must have an E2E smoke test that loads its `/play/[id]` route.
- The test must wait for the canvas and verify zero `pageerror` / `console.error` events.
- E2E tests must pass before deployment.

### 4.3 Type Checking

```bash
cd /root/website
npm run check
```

Run this before committing, especially after TypeScript changes.

---

## 5. Adding a New Game

### 5.1 Design Phase

1. Add the game to `data/games.json`.
2. Create a Game Design Document in `GDD/gdd-NN-game-name.md`.
3. Update `website/src/lib/data/games.ts` if the game is ready for the catalogue.

### 5.2 Implementation Phase

1. Create a folder under `website/src/lib/games/[game-id]/`.
2. Implement the logic layer in `[Game]Logic.ts` and add `[Game]Logic.test.ts`.
3. Implement the presentation layer in `[Game]Game.ts`.
4. Create a Svelte wrapper component in `website/src/lib/components/games/[Game].svelte`.
5. Lazy-load the component in `website/src/routes/play/[id]/+page.svelte`.
6. Add an E2E smoke test in `website/e2e/games.spec.ts` or a new `website/e2e/[game].spec.ts`.

### 5.3 Compliance Phase

Before merging:

- [ ] Unit tests pass (`npm test`)
- [ ] E2E smoke test passes (`npm run e2e`)
- [ ] Build succeeds (`npm run build`)
- [ ] Type check succeeds (`npm run check`)
- [ ] No console errors in the browser

---

## 6. Building for Production

```bash
cd /root/website
npm run build
```

Output is written to `website/build/`.

**Verify the build:**
```bash
ls -la /root/website/build
```

The build directory should contain:
- `index.html`
- `_app/` (JS/CSS chunks)
- `games/` (prerendered game pages)
- `play/` (prerendered play pages)
- `404.html`

---

## 7. Deployment

### 7.1 Deploy Target

The live website is served from:

```
/var/www/games.aldoolab.com
```

The public URL is:

```
https://games.aldoolab.com
```

### 7.2 Deployment Steps

1. Ensure you are on the latest `main` and all gates pass:
   ```bash
   cd /root && git pull
   cd /root/website
   npm test
   npm run e2e
   npm run build
   ```

2. Copy the build output to the web server:
   ```bash
   rm -rf /var/www/games.aldoolab.com/* /var/www/games.aldoolab.com/.[!.]*
   cp -a /root/website/build/. /var/www/games.aldoolab.com/
   ```

3. Verify the deployment:
   ```bash
   curl -s -o /dev/null -w "HTTP %{http_code}\n" https://games.aldoolab.com/
   curl -s -o /dev/null -w "HTTP %{http_code}\n" https://games.aldoolab.com/play/archery
   ```

   Expected output: `HTTP 200` for both.

### 7.3 Deployment Script

For convenience, you can save this as `scripts/deploy.sh` (optional):

```bash
#!/bin/bash
set -e
cd /root/website
npm test
npm run e2e
npm run build
rm -rf /var/www/games.aldoolab.com/* /var/www/games.aldoolab.com/.[!.]*
cp -a /root/website/build/. /var/www/games.aldoolab.com/
echo "Deployed to https://games.aldoolab.com"
```

Run with:
```bash
bash /root/scripts/deploy.sh
```

---

## 8. Maintenance & Monitoring

### 8.1 After Deployment

- Open `https://games.aldoolab.com` in a browser.
- Navigate to each active game and confirm the canvas loads.
- Open browser DevTools and confirm no console errors.

### 8.2 Routine Checks

| Frequency | Action |
|-----------|--------|
| Every commit | `npm test` |
| Before deployment | `npm run e2e` + `npm run build` |
| Weekly | Review server logs and verify HTTPS certificates |
| Monthly | Update dependencies and re-run full test suite |

### 8.3 Updating Dependencies

```bash
cd /root/website
npm update
npm test
npm run e2e
npm run build
```

If Playwright or browsers are updated, reinstall browsers:
```bash
npx playwright install chromium
```

### 8.4 Adding E2E Tests

Add a new test file under `website/e2e/`:

```ts
// e2e/new-game.spec.ts
import { test, expect } from '@playwright/test';

test('New Game loads without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('/play/new-game');
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(2500);

  expect(errors).toHaveLength(0);
});
```

---

## 9. Rollback Procedure

If a deployment causes issues:

1. Identify the last known good commit:
   ```bash
   cd /root && git log --oneline -10
   ```

2. Revert or checkout the good commit:
   ```bash
   git checkout <commit-hash>
   # or
   git revert <bad-commit-hash>
   ```

3. Rebuild and redeploy:
   ```bash
   cd /root/website
   npm run build
   rm -rf /var/www/games.aldoolab.com/* /var/www/games.aldoolab.com/.[!.]*
   cp -a /root/website/build/. /var/www/games.aldoolab.com/
   ```

4. Verify the rollback:
   ```bash
   curl -s -o /dev/null -w "HTTP %{http_code}\n" https://games.aldoolab.com/
   ```

---

## 10. Release Checklist

Use this checklist before every release:

- [ ] `git pull` to ensure latest `main`.
- [ ] All unit tests pass: `npm test`.
- [ ] All E2E tests pass: `npm run e2e`.
- [ ] Production build succeeds: `npm run build`.
- [ ] Type check passes: `npm run check`.
- [ ] Build output copied to `/var/www/games.aldoolab.com/`.
- [ ] Live site returns HTTP 200.
- [ ] Active games load without console errors.
- [ ] Changes committed and pushed to GitHub.

---

## Quick Reference Commands

```bash
# Development
cd /root/website
npm run dev              # Start dev server
npm run test:watch       # Watch unit tests

# Validation
npm test                 # Run unit tests once
npm run e2e              # Run E2E smoke tests
npm run check            # Type-check with svelte-check
npm run build            # Build for production

# Deployment
rm -rf /var/www/games.aldoolab.com/* /var/www/games.aldoolab.com/.[!.]*
cp -a /root/website/build/. /var/www/games.aldoolab.com/
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://games.aldoolab.com/
```
