# Aldoolab — GCC Kids Game Platform Website Specification

**Version:** 1.0  
**Date:** 2026-07-21  
**Studio:** Aldoolab  
**Purpose:** Define the marketing, discovery, and monetization website for the GCC Kids Web Game Platform. The website is separate from the game app but shares the same brand, tech stack, and business model.

---

## 1. Executive Summary

The platform needs a public website that serves three roles:

1. **Explorer / Discovery:** Introduce the platform, the games, and the GCC cultural mission to parents, teachers, and children.
2. **Launch Surface:** Allow visitors to launch the web game app instantly in the browser.
3. **Ads & Monetization Media:** Host ad inventory and partner-friendly landing pages that generate revenue without disrupting the child-safe game experience.

The website must be fast, SEO-friendly, culturally authentic, and fully compliant with child-safety and data-protection regulations.

---

## 2. Target Audiences

| Audience | Why They Visit | What They Need |
|----------|---------------|----------------|
| **Parents (primary)** | Decide if the platform is safe for their children. | Trust signals, safety policy, content preview, parental controls info. |
| **Children aged 7–12** | Find and launch games. | Big buttons, colorful previews, instant play. |
| **Teachers / Schools** | Evaluate classroom use. | Classroom mode info, institutional licensing, contact form. |
| **GCC Ministries / NGOs** | Assess partnership or sponsorship fit. | Cultural authenticity, educational value, impact metrics. |
| **Advertisers / Partners** | Buy ad space or sponsor content. | Media kit, audience stats, ad specs, contact. |
| **Press / Bloggers** | Write about the platform. | Press kit, screenshots, fact sheet, contact. |

---

## 3. Website Goals & KPIs

| Goal | KPI |
|------|-----|
| Drive game launches | Click-through rate from website to game app |
| Build parent trust | Time on safety page, low bounce rate on parent pages |
| Generate ad revenue | Ad impressions, fill rate, RPM, rewarded-video clicks |
| Capture leads | Newsletter signups, school contact form submissions |
| Support SEO | Organic traffic from GCC countries, ranking for "ألعاب أطفال خليجية" |

---

## 4. Sitemap & Pages

### 4.1 Public Pages

| Page | URL | Purpose |
|------|-----|---------|
| **Home** | `/` | Hero, game grid, trust badges, CTA to play, latest news. |
| **Games** | `/games` | Catalogue of all 20 games with filters by country, genre, mode. |
| **Game Detail** | `/games/:id` | Deep dive for one game: trailer, description, how to play, play button. |
| **Play** | `/play/:id` | Lightweight launcher that embeds or redirects to the game app. |
| **Parents** | `/parents` | Safety features, parental controls, data privacy, content rating. |
| **Teachers** | `/teachers` | Classroom mode, institutional license, lesson ideas, contact. |
| **About / Mission** | `/about` | Aldoolab story, GCC cultural mission, team, partners. |
| **Blog / News** | `/blog` | Updates, new games, seasonal events, cultural articles. |
| **Press Kit** | `/press` | Logos, screenshots, fact sheet, downloadable assets. |
| **Advertise** | `/advertise` | Media kit, audience stats, ad formats, contact form. |
| **Privacy Policy** | `/privacy` | Legal privacy policy, data collection, parental rights. |
| **Terms of Service** | `/terms` | Terms for parents and users. |
| **Parental Consent** | `/consent` | Flow for under-13 account creation consent. |
| **Contact** | `/contact` | General contact form and support email. |
| **Status Page** | `/status` | Uptime and maintenance announcements. |

### 4.2 Child-Facing vs. Adult-Facing Zones

- **Child-facing:** Home hero, game grid, play launcher. No ads, no tracking, no marketing forms.
- **Adult-facing:** Parents, Teachers, Advertise, Blog, Press. Ads and analytics allowed here under privacy-compliant settings.

---

## 5. Tech Stack

The website shares the same core stack as the game platform framework for consistency and maintainability.

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Build Tool** | Vite | Fast builds, HMR, simple config, PWA-ready. |
| **Language** | TypeScript | Type safety across components and data fetching. |
| **Framework** | Svelte 5 or Vue 3 | Lightweight, reactive, excellent RTL/i18n support. |
| **Styling** | Tailwind CSS + CSS variables | Shared Gulf palette with the game platform. |
| **i18n** | `svelte-i18n` or `vue-i18n` | Arabic-first, English secondary, future GCC languages. |
| **Static Hosting** | Vercel / Cloudflare Pages / Netlify | Edge caching, HTTPS, preview branches. |
| **CMS (optional)** | Sanity, Strapi, or Notion API | Blog, game descriptions, press kit without code changes. |
| **Analytics** | Plausible or GA4 (privacy-configured) | Track adult zones only; no tracking in child-facing areas. |
| **Forms** | Supabase or Basin / Formspree | Contact and lead capture. |
| **Ads** | Google AdSense (non-personalized) or direct ad server | Adult-facing pages only; never inside the game app. |

### 5.1 Integration with Game App

- The website links to `/play/:id` which loads the game app in an iframe or redirects to the game subdomain.
- Shared CSS variables and components keep brand consistency.
- The game app and website can share a PWA manifest for "install to home screen" on mobile/tablet.

---

## 6. Design & Brand

### 6.1 Visual Identity

- Same Gulf palette as the game platform (`--sandy`, `--sea`, `--sun`, etc.).
- Same typography: Cairo / Tajawal.
- Friendly, rounded UI; large buttons; whitespace for readability.
- Use 3D renders from the games as hero imagery and thumbnails.

### 6.2 RTL & LTR

- Default RTL for Arabic.
- Full LTR support for English.
- All layouts must mirror cleanly.

### 6.3 Responsive Breakpoints

| Breakpoint | Target |
|------------|--------|
| Mobile | < 768 px — stacked layouts, hamburger menu, large CTAs. |
| Tablet | 768–1024 px — 2-column grids, side-by-side previews. |
| Desktop | ≥ 1024 px — full hero, game grid, media kit layouts. |

---

## 7. Ads & Monetization Strategy

### 7.1 Ad Placement Rules

**Ads are allowed only on adult-facing pages.** No ads on child-facing pages or inside the game app itself.

| Page Zone | Ad Format | Notes |
|-----------|-----------|-------|
| Blog sidebar | Display banner | Non-personalized only. |
| Blog between posts | Native ad | Labeled "Sponsored". |
| Advertise page | Self-promo | Aldoolab media kit and direct sales. |
| Parents page footer | Text ad | Family-safe products only. |
| Teachers page | Sponsored resource | Ministry or ed-tech partners. |

### 7.2 Website-Only Ad Stack

| Provider | Use Case |
|----------|----------|
| **Google AdSense** | Standard display ads on blog and info pages. |
| **Carbon Ads / EthicalAds** | Developer/designer audience if press/blog traffic grows. |
| **Direct sales** | Sponsored game levels, branded cultural events, ministry campaigns. |
| **Affiliate links** | Parent dashboard resources (books, tablets, educational products). |

### 7.3 Game App Ads (Recap from Framework)

- Allowed only as **rewarded video** inside the game app.
- COPPA-certified networks only (Google AdMob kids config, Unity LevelPlay under-13 mode).
- No interstitials, banners, or personalized ads in the child-facing app.
- Parent dashboard toggle to disable ads for premium subscribers.

### 7.4 Revenue Mix

| Source | Effort | Priority |
|--------|--------|----------|
| **One-time Full Game Pass** | Low | 1 — primary direct revenue. |
| **Freemium cosmetics** | Medium | 2 — parent-gated microtransactions. |
| **Direct sponsorships** | Medium | 3 — GCC ministries, schools, brands. |
| **Website display ads** | Low | 4 — adult-facing pages only. |
| **Rewarded video (game app)** | Low | 5 — only after 50K+ MAU. |
| **Affiliate links** | Low | 6 — parent dashboard and blog. |
| **Subscription** | Medium | 7 — introduced once content depth justifies it. |

---

## 8. Content Strategy

### 8.1 Game Pages

Each game detail page needs:
- Hero image / short looping video from the 3D game.
- Name in Arabic and English.
- One-sentence description.
- Age rating, play modes, estimated session length.
- "Play Now" button.
- How-to-play section.
- Cultural note (why this theme matters).

### 8.2 Blog / News

- New game launches.
- Seasonal events (Ramadan, Eid, GCC National Days).
- Cultural education posts (frankincense trade, forts, dhows).
- Behind-the-scenes development updates.
- Parent guides to safe gaming.

### 8.3 Press Kit

- Studio fact sheet.
- Platform fact sheet.
- HD screenshots and gameplay GIFs.
- Logos in Arabic and English.
- Team photos and bios.

### 8.4 Adding a New Game to the Website

The website reads game metadata from a single source of truth: `data/games.json`. This file is shared with the game app so game IDs, names, modes, and statuses stay synchronized.

#### 8.4.1 Game Entry Schema

Each game object contains:

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Unique game ID used by the app and URLs (`/games/:id`, `/play/:id`). |
| `slug` | string | URL-friendly identifier. |
| `nameAr` / `nameEn` | string | Display names in Arabic and English. |
| `taglineAr` / `taglineEn` | string | Short one-line hook for cards and hero. |
| `descriptionAr` / `descriptionEn` | string | Longer description on the detail page. |
| `icon` | string | Emoji or icon identifier. |
| `genre` / `genreLabelAr` / `genreLabelEn` | string | Genre for filtering. |
| `ageRange` | string | E.g., `7-12` or `10-12`. |
| `sessionLength` | string | E.g., `1-3 min`. |
| `modes` | string[] | `single`, `local`, `online`, `async`, `daily`, `practice`, `coop`, `team`. |
| `countries` | string[] | GCC country codes for country-specific variants. |
| `status` | string | `ready`, `beta`, `coming-soon`. |
| `supportedPlatforms` | string[] | `desktop`, `tablet`, `mobile`. |
| `heroImage` / `thumbnail` / `video` | string | Paths to media assets. |
| `howToPlayAr` / `howToPlayEn` | string[] | Step-by-step instructions. |
| `culturalNoteAr` / `culturalNoteEn` | string | Cultural education paragraph. |
| `metaTitleAr` / `metaTitleEn` | string | SEO `<title>`. |
| `metaDescriptionAr` / `metaDescriptionEn` | string | SEO meta description. |

#### 8.4.2 Step-by-Step Process

1. **Add the game entry** to `data/games.json`.
2. **Create media assets:**
   - Hero image (`heroImage`) — 16:9, WebP, < 200 KB.
   - Thumbnail (`thumbnail`) — 1:1, WebP, < 50 KB.
   - Looping video (`video`) — WebM, < 1 MB, no audio.
3. **Write Arabic and English copy** for description, how-to-play, and cultural note.
4. **Generate the detail page** automatically from the JSON entry.
   - The website builder creates `/games/:slug` and `/play/:id` routes at build time.
5. **Add the game card** to the catalogue grid automatically — no extra page needed.
6. **Publish a blog post** announcing the new game (optional but recommended).
7. **Update the sitemap** by rebuilding the static site.

#### 8.4.3 Example Entry

See `data/games.json` for complete examples of `frankincense`, `tictactoe`, and `archery`.

---

## 9. SEO & Performance

### 9.1 SEO Requirements

- Meta titles and descriptions in Arabic and English for every page.
- Open Graph and Twitter cards for social sharing.
- Structured data: `VideoGame`, `Organization`, `WebSite`.
- Sitemap generated at build time.
- Canonical URLs and hreflang tags for AR/EN.
- Image alt text in the page language.

### 9.2 Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s on 3G |
| Largest Contentful Paint | < 2.5s on 3G |
| Total page weight | < 1 MB for landing pages |
| Lighthouse score | ≥ 90 on mobile |
| Image format | WebP/AVIF with PNG fallback |

---

## 10. Analytics & Compliance

### 10.1 Analytics Strategy

- Use **Plausible** for privacy-friendly adult-zone analytics.
- If using **GA4**, configure for child safety and non-personalized mode.
- **No analytics scripts** on child-facing pages (home hero, game grid, play launcher).
- Track: page views, CTR to game app, contact form submissions, ad impressions.

### 10.2 Cookie / Consent Notice

- Show a cookie/tracking notice on adult-facing pages.
- Do not load third-party scripts until consent is given.
- Child-facing pages must not set non-essential cookies.

### 10.3 Data Protection

- Comply with GCC data protection regulations.
- COPPA/GDPR-K compliance for under-13 users.
- Privacy policy must explain what data is collected, why, and how parents can delete it.
- No child browsing data shared with ad networks.

---

## 11. Security

- HTTPS only.
- Content Security Policy (CSP) to prevent XSS.
- Subresource Integrity (SRI) for third-party scripts.
- No third-party scripts on child-facing pages.
- Form validation and rate limiting.

---

## 12. Deployment & CI/CD

| Environment | Hosting | Purpose |
|-------------|---------|---------|
| Local | `npm run dev` | Development |
| Staging | Vercel preview / Cloudflare Pages preview | QA and stakeholder review |
| Production | Vercel / Cloudflare Pages | Live public website |

### 12.1 Build Pipeline

1. Lint and type-check.
2. Build static site.
3. Run Lighthouse CI.
4. Deploy to staging.
5. Manual QA on Arabic RTL and English LTR.
6. Deploy to production.

---

## 13. Roadmap

### Phase 1: Foundation (Week 1)
- Set up Vite + Svelte/Vue + Tailwind project.
- Create design system (colors, typography, buttons, cards).
- Build Home, Games, and Game Detail pages.
- Integrate game launcher.

### Phase 2: Trust & Safety (Week 2)
- Build Parents, Privacy, Terms, and Consent pages.
- Add RTL/LTR support.
- Implement cookie consent.

### Phase 3: Growth & Monetization (Week 3–4)
- Build Blog, Press Kit, Teachers, and Advertise pages.
- Add newsletter signup and contact forms.
- Integrate non-personalized ads on adult-facing pages.
- Set up privacy-friendly analytics.

### Phase 4: Optimization (Week 5)
- SEO audit and structured data.
- Performance optimization.
- Lighthouse score ≥ 90.

---

## 14. Success Metrics (90 Days After Launch)

| Metric | Target |
|--------|--------|
| Monthly website visitors | 10,000+ |
| Game launch CTR | ≥ 15% |
| Parent page engagement | ≥ 2 minutes avg. time |
| Newsletter signups | 500+ |
| Ad RPM | ≥ $2 USD |
| Organic search traffic | 30% of total |

---

*Prepared by Aldoolab for the GCC Kids Web Game Platform.*
