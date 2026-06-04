# Spa Water Helper — project context for Claude Code

> Place this file at the repo root. Claude Code reads `CLAUDE.md` automatically as
> project memory. It describes what the app is, how it's built, the **safety-critical
> logic that must not regress**, and a backlog of improvements/features.

---

## 0. Status — v2 rebuild (June 2026)

The app was **rebuilt as a real Vite + React project** (the previous version was a single
minified `public/index.html` with no source). The frontend now lives in `src/` and builds into
a self-contained `public/index.html` (committed; served by `server.js`). Deploy is unchanged —
Railway runs `npm start`; `nixpacks.toml` tells it not to rebuild (the artifact is committed).
This completes backlog A1–A4 plus a deep "Aqua Glass" UI redesign.

- **Source:** `src/SpaWaterHelper.jsx` (orchestrator) · `src/entry.jsx` (mount) ·
  `src/storage.js` (window.storage). Pure logic in `src/lib/`: `chemistry.js`, `dosing.js`,
  `plan.js`, `verdict.js`, `childGuide.js`, `strips.js`, `constants.js`, `format.js`.
  UI in `src/components/` + `src/tabs/`. Design system: `src/styles.css` (frosted glass over a
  water gradient, light + dark, mobile-first).
- **Tests:** Vitest locks the safety-critical logic — `npm test`.
- **Commands:** `npm run dev` (HMR) · `npm run build` (→ public/index.html) · `npm test` ·
  `npm start` (server). After any UI change: rebuild and commit `public/index.html`.
- The thresholds, dosing math, ordering and copy in §4 were preserved exactly during the
  rebuild (extracted verbatim from the old bundle, re-implemented from this spec, verified by
  tests). **Everything in §4 still applies.**

---

## 1. What this is

A personal web app for managing the water chemistry of a **Bestway Lay-Z-Spa Helsinki**
inflatable hot tub (~1,123 L, AirJet bubbles). The owner mostly uses it as **warm play
water (~30–31 °C) for a 5-year-old**, not as a hot tub — this shapes the safety logic.

The user tests the water with a strip, the app tells them **what to add, in what order,
and how much** (computed from their actual product labels and tub volume), gives a clear
**"can we get in?"** verdict with a **child mode**, and tracks the water-change schedule.
Data persists in **Postgres** (deployed on Railway) so it syncs across devices.

The household's products (Swedish, Fixor/Nitor + Kayoba):
Snabbklor (dichlor granules), Kayoba chlorine tablets, Höjer pH, Sänker pH,
Höjer Alkalinitet, Klarningsmedel (clarifier), Kalkkontroll (scale/metal),
Rörcleaner (pipe flush), scum sponges.

---

## 2. Architecture

```
repo root
├── CLAUDE.md              # this file
├── server.js              # Express API + serves the SPA (single Railway service)
├── package.json           # start script + deps (express@4, pg@8)
├── .env.example
├── public/
│   └── index.html         # BUILT, self-contained app (React bundled in)  ← output, not source
└── src/                   # RECOMMENDED: add the source here (see §8)
    ├── SpaWaterHelper.jsx  # the single React component (the whole UI + logic)
    └── entry.jsx           # storage adapter (window.storage over fetch) + React mount
```

**Frontend** — one default-export React 18 component, `SpaWaterHelper`. No CSS framework:
styling is a CSS string injected via `<style>` plus inline style objects; color tokens
live in a `C` object. Icons: `lucide-react@0.383.0` (pinned — verify any new icon exists
in that version or it breaks the bundle). Fonts: Fraunces + Hanken Grotesk via Google
Fonts `@import` (degrades to system fonts offline). Built with **esbuild** (IIFE, minified)
and inlined into `public/index.html`.

**Persistence abstraction** — the component only ever calls a `window.storage` key-value
API (see §6). `entry.jsx` implements it over `fetch('/api/kv')` with a **localStorage
mirror** (so it works offline) and an **offline banner**. Optional access token is read
from a `#token=` URL fragment or localStorage and sent as `Authorization: Bearer`.

**Backend** — `server.js`: Express 4 + `pg.Pool`. A `kv(space, k, v, updated_at)` table,
single `space = 'default'` (one household). Optional `APP_TOKEN` bearer gate. Routes:
`GET/PUT/DELETE /api/kv/:key` and `GET /api/kv?prefix=`. Serves `public/` and SPA-fallbacks
to `index.html`. Creates the table on boot. Listens on `process.env.PORT`.

**Deploy** — Railway auto-detects Node, runs `npm start`, injects `DATABASE_URL` (added as a
reference variable from a Postgres plugin). See README for step-by-step.

---

## 3. UI tabs

- **Test & fix** — tap the colour band each strip pad shows (3-in-1 or 7-in-1 mode).
  Renders the **ordered action plan** + **entry verdict** + **child mode** + a reading log.
- **Routine** — before-use / daily / weekly / 1–2 month checklists (with computed amounts).
- **Fresh fill** — the 7-step rebalance order for fresh water.
- **Doses** — every dosing rate, editable & auto-saved (so the user can switch products).
- **Setup** — volume, usual temperature, product list.

---

## 4. Domain logic — **safety-critical, do not casually change**

These encode real water-chemistry and child-safety guidance. Changing thresholds, the
ordering, the cautions, or the dosing provenance can produce unsafe advice. Preserve them.

### Target ranges (units: mg/L, which equals ppm)
- **Free chlorine** 3–5 (the Snabbklor label says 1–3; the app intentionally defaults the
  target to **3** — top of the label range / CDC warm-tub floor — for a safety margin in
  water a child plays in. This is deliberate, not a bug. It's an editable field.)
- **pH** 7.2–7.6 ideal · **Total alkalinity** 80–120 · **Total hardness** ~150–250
- **Cyanuric acid (stabiliser)** keep low; >100 ⇒ chlorine ineffective ⇒ **drain & refill**.

### Order of operations (the plan enforces this)
**Alkalinity → pH → chlorine.** Alkalinity buffers pH; chlorine works best at pH 7.2–7.6.
If CYA > 100 the plan **short-circuits to "drain & refill first"** (dosing old water is
pointless). Chloramine shock (when total − free chlorine > 0.5) and hardness come after.

### Dosing rates (defaults, all editable in the Doses tab, scaled by volume/1000)
| What | Product | Default rate | Source |
|---|---|---|---|
| Raise free chlorine | Snabbklor (dichlor) | 1.7 g per 1 mg/L per 1000 L | **derived** (label gives doses, not a ppm rate — keep flagged as an estimate) |
| Shock | Snabbklor | 15 g per 1000 L | label (1 tbsp / 1000 L) |
| Daily upkeep | Snabbklor | 7.5 g per 1000 L | label (½ tbsp / 1000 L) |
| Raise alkalinity | Höjer Alkalinitet | 17 g per 10 mg/L per 1000 L (≈15 g/1000 L per addition) | label + baking-soda chemistry |
| Raise pH | Höjer pH | 10 g per 0.1 pH per 1000 L | label (~100 g / 10 m³ ≈ 0.1) |
| Lower pH | Sänker pH | 10 g per 0.1 pH per 1000 L | label |
| Scale control | Kalkkontroll (liquid) | 40 ml per 1000 L weekly | label (20 ml / 500 L) |
| Clarifier | Klarningsmedel | start 80, then 40 ml per 1000 L | label (40 / 20 ml per 500 L) |
| Pipe flush | Rörcleaner | 400 ml per 1000 L, circulate ≥30 min | label (200 ml / 500 L) |

pH dosing is computed to the 7.4 midpoint but is approximate (manufacturer's "ca" figure)
— always presented with "re-test". Chlorine-to-target uses the derived `fcRate`.

### Hard safety cautions baked into the copy (keep them)
- **Höjer Alkalinitet and Kalkkontroll must go straight into the circulating water, never
  via the ChemConnect dispenser/skimmer** (label warning — reaction risk). Only the slow
  chlorine tablets go in the dispenser.
- **Rörcleaner is corrosive (H314)** — pre-drain only, handle with care.
- **Child mode** branches on temperature: ≤34 °C "warm play, overheating isn't the worry,
  supervise / may get cold"; 34–38 °C "don't let it climb"; ≥38 °C the hot-tub overheating
  rules (lower temp, 5–10 min, under-5 caution). **Supervision (drowning) is the message at
  every temperature.** Leave the lid off 20–30 min after chlorinating.
- Footer disclaimer: guidance only, follow labels, not medical advice, store chemicals
  locked away from children, pregnancy/heart conditions → see a doctor. **Keep this.**

### Still generic (good first data task)
The **Kayoba chlorine tablet** dosing is not yet from its label. If the user provides it,
wire it in like the others.

---

## 5. Data model

Postgres table:
```sql
kv (space text default 'default', k text, v text, updated_at timestamptz, primary key(space,k))
```
`v` is a **JSON string** (the app calls `JSON.stringify` before `set` and `JSON.parse` after
`get`). Two keys are used:

| key | contents |
|---|---|
| `spa:settings` | `{ strip, volume, childMode, temp, targetFC, fcRate, fcShock, fcDaily, taRate, phUpRate, phDownRate, scaleRate, clarStart, clarWeekly, flushRate }` |
| `spa:state` | `{ lastChange, lastTest, log[] }` (log = last 8 readings) |

Env vars (`.env.example`): `DATABASE_URL` (Railway Postgres ref), `APP_TOKEN` (optional
gate), `PGSSLMODE` (set `require` only if SSL error), `PORT` (Railway-provided).

---

## 6. The storage contract (keep any new backend compatible)

```js
window.storage = {
  async get(key)            // -> { key, value } | null      (value is a JSON string)
  async set(key, value)     // -> { key, value }
  async delete(key)         // -> { key, deleted: true }
  async list(prefix)        // -> { keys: string[] }
}
```
The React component is backend-agnostic — it only uses this. Swap implementations
(localStorage, fetch+Postgres, IndexedDB, Supabase…) without touching the UI.

---

## 7. Build / run / deploy

```bash
# build the frontend bundle into public/index.html
npx esbuild src/entry.jsx --bundle --minify --format=iife \
  --define:process.env.NODE_ENV='"production"' --loader:.jsx=jsx --outfile=/tmp/bundle.js
# (then inline /tmp/bundle.js into public/index.html between <script> tags;
#  escape '</script' -> '<\/script' first. See §8 for a better long-term setup.)

# run locally
npm install
DATABASE_URL=postgresql://localhost:5432/spadb npm start   # http://localhost:3000
```
Tests so far: the SQL layer is validated with `pg-mem` (upsert, JSON round-trip, prefix
list, delete). Keep/extend that pattern.

---

## 8. Known gotchas / conventions

- **Source of truth vs build:** `public/index.html` is a *built* artifact with the React
  bundle inlined. Don't hand-edit the minified blob. Edit `src/SpaWaterHelper.jsx` /
  `src/entry.jsx` and rebuild. (First recommended task: replace the manual esbuild+inline
  step with a proper **Vite** build — see backlog.)
- `lucide-react` is pinned to 0.383.0; confirm icon names exist there.
- No Tailwind/JIT — styling is the `C` token object + inline styles + one CSS string.
- The component gates persistence writes behind a `ready` ref so it doesn't overwrite
  cloud data with defaults before the initial load completes. Keep that.
- Sync is **last-write-wins** at the key level (fine for one household, not for true
  multi-user concurrent edits).
- Standalone/cloud app ⇒ normal HTML `<form>`, `localStorage`, etc. are fine here (the
  earlier "no localStorage / no form" rules only applied to the Claude.ai artifact sandbox).

---

## 9. Improvement & feature backlog

Grouped by effort. Anything touching §4 must preserve the safety logic and dosing provenance.

### A. Robustness / foundation (do first)
1. **Vite + React project structure** — replace the esbuild-inline step; enable HMR.
2. **Split the monolith** — extract pure modules: `chemistry.js` (status fns, targets),
   `dosing.js` (rate→grams), `plan.js` (ordered steps), `childGuide.js`. Easier to test.
3. **Unit tests** for the chemistry/dosing/plan pure functions (Vitest). These are the
   highest-risk-if-wrong parts; lock them with tests before refactoring.
4. **TypeScript** for the chemistry/dosing layer (typed ranges, units, rates).
5. **DB migrations** (node-pg-migrate or Drizzle) instead of `CREATE TABLE` on boot.
6. **Server hardening:** `helmet`, validate key names/length, `/healthz`, env validation at
   boot (clear error if `DATABASE_URL` missing), basic rate limiting.

### B. High-value features
7. **Full history + charts.** Persist every reading with timestamp (not just last 8); plot
   chlorine/pH/alkalinity/stabiliser trends; surface "chlorine demand rising → change water".
8. **Dosing journal + auto-calibration.** Log each chemical addition (product, amount, time);
   compare before/after readings to *learn the real g-per-mg/L for this water* and suggest
   updated rates — turns the "derived" chlorine estimate into a measured value.
9. **Reminders/notifications** (PWA push or email): water-change due, weekly test, filter
   rinse, stabiliser-high alert.
10. **Filter cartridge tracker** (type VI): age, replacements, swap reminder.
11. **Soak timer** for child mode (5–10 min) with an alert — directly supports the safety goal.
12. **Proper PWA**: `manifest.json` + service worker for offline + Android installability +
    a real app icon (currently iOS uses a page snapshot).

### C. Breadth / nice-to-have
13. **Swedish UI translation** (user is in Sweden; product names already Swedish).
14. **Bromine sanitiser mode** (the 7-in-1 has a bromine pad; generalise beyond chlorine).
15. **Multiple tubs/pools** profiles.
16. **CSV export** of readings; printable routine checklist.
17. **First-run setup wizard** (volume, products, rates).
18. **Shareable read-only "is it safe to get in?" link** for the family.
19. **Weather-aware** chlorine-demand hint for the outdoor tub (sun/heat raises demand).
20. **Accessibility pass** (ARIA, keyboard, contrast, large-text mode).

### D. Ambitious / stretch
21. **Camera strip reader** — photograph the test strip, auto-match pad colours to the
    bottle chart to fill readings automatically. Biggest usability win; needs careful
    colour calibration and a manual-override fallback.
22. **Per-token private spaces** + lightweight accounts, if it ever needs to serve more
    than one household (the `space` column already exists for this).

### Sync/concurrency note
If multi-device concurrent editing becomes real, move from last-write-wins to per-field
merge or optimistic concurrency using `updated_at`, and consider live updates via SSE.
