# Spa Water Helper — cloud version

Your spa tool, with data stored in Postgres so it syncs across every device and
survives anywhere. The frontend is unchanged; its storage layer now talks to a
tiny Express API (`/api/kv`) backed by a `kv` table in Postgres, with a
localStorage mirror so it still works if the network drops by the tub.

```
spa_monitor/
├── server.js            # Express API + serves the app (one Railway service)
├── package.json         # scripts + runtime deps (express, pg) + dev toolchain (vite, react)
├── nixpacks.toml        # tells Railway to serve the committed build, not rebuild it
├── index.html           # Vite HTML entry (dev/build template)
├── src/                 # React source — the real app, edit here
│   ├── SpaWaterHelper.jsx · entry.jsx · storage.js · styles.css
│   ├── lib/             # pure logic: chemistry, dosing, plan, verdict, childGuide, strips
│   ├── components/      # UI primitives + StripPad
│   └── tabs/            # the five tabs
├── public/index.html    # BUILT, self-contained app (committed; served in production)
├── env.example          # the env vars Railway needs
└── .gitignore
```

## Deploy on Railway

### Option A — from GitHub (recommended, gives a stable URL)
1. Put this folder in a GitHub repo (commit and push).
2. On https://railway.app → **New Project → Deploy from GitHub repo** → pick the repo.
   Railway auto-detects Node and runs `npm start`.
3. In the project, **New → Database → Add PostgreSQL**.
4. Open your app **service → Variables → New Variable → Add Reference** →
   choose **`DATABASE_URL`** from the Postgres service. Redeploy.
5. **Service → Settings → Networking → Generate Domain** → you get
   `https://your-app.up.railway.app`. Open it. Done.

### Option B — Railway CLI
```bash
npm i -g @railway/cli
railway login
cd spa-cloud
railway init            # name the project
railway add -d postgres # provision Postgres
railway up              # build & deploy this folder
```
Then set the `DATABASE_URL` reference variable (step 4 above) and generate a domain.

## Optional: lock it down with an access code (recommended)
Without this, anyone with the URL could read/write your data (low stakes, but still).
1. In the app service **Variables**, add `APP_TOKEN` = a long random string.
2. On each of your devices, open the app **once** at:
   `https://your-app.up.railway.app/#token=YOUR_CODE`
   The app saves the code locally and strips it from the URL. After that, just use the
   plain URL. To sync a new device later, open the `#token=` link on it once.

## Add to your iPhone home screen
Open the URL in **Safari → Share → Add to Home Screen**. It opens fullscreen like an
app, with the teal status bar. (iOS uses a page snapshot as the icon; drop a 180×180
`apple-touch-icon.png` into `public/` if you want a custom one.)

## Run locally
```bash
npm install
DATABASE_URL=postgresql://localhost:5432/spadb npm start
# open http://localhost:3000
```

## Develop the frontend
The UI is a **Vite + React** app in `src/`, built into the single self-contained
`public/index.html` that the server serves.
```bash
npm install
npm run dev      # http://localhost:5173 — hot reload while you edit src/
npm test         # Vitest — the safety-critical chemistry / dosing / plan logic
npm run build    # rebuild public/index.html
```
After changing anything in `src/`, run `npm run build` and **commit the new
`public/index.html`** — Railway serves the committed file and does not rebuild.

## How your data is stored
- One row per key in the `kv` table (`spa:settings`, `spa:state`) under a single
  household namespace. Edit anything in the app → it's saved to Postgres immediately.
- A localStorage **mirror** keeps the app working offline; a small banner shows
  "Cloud not connected" if a save couldn't reach the server. Sync is last-write-wins,
  which is fine for one household.

## Notes
- **SSL:** internal Railway connections don't need it. If you ever connect over the
  public proxy and see an SSL error, set `PGSSLMODE=require`.
- **Backups:** enable Railway's native Postgres backups for peace of mind.
- The app's chemical dosing is tuned to your products; everything stays editable in
  the **Doses** tab and is what now lives in Postgres.
