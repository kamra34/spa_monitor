// Tiny key-value API over Postgres + serves the Spa Water Helper frontend.
// Same window.storage API the app already uses — just persisted in the cloud.
const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
app.use(express.json({ limit: "1mb" }));

// Railway injects DATABASE_URL. Internal connections don't need SSL;
// set PGSSLMODE=require if you connect over the public proxy and hit an SSL error.
const useSSL = /^(require|true|1)$/i.test(process.env.PGSSLMODE || process.env.PGSSL || "");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

const SPACE = "default";              // single household namespace
const TOKEN = process.env.APP_TOKEN || ""; // optional shared access code

async function init() {
  await pool.query(`CREATE TABLE IF NOT EXISTS kv (
    space text NOT NULL DEFAULT 'default',
    k text NOT NULL,
    v text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (space, k)
  )`);
}

function auth(req, res, next) {
  if (!TOKEN) return next();
  const h = req.get("authorization") || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : (req.get("x-app-token") || "");
  if (t === TOKEN) return next();
  return res.status(401).json({ error: "unauthorized" });
}

const api = express.Router();
api.use(auth);

api.get("/", async (req, res, next) => {
  try {
    const prefix = ((req.query.prefix || "") + "").replace(/[%_\\]/g, "\\$&");
    const { rows } = await pool.query(
      "SELECT k FROM kv WHERE space=$1 AND k LIKE $2 ESCAPE '\\' ORDER BY k",
      [SPACE, prefix + "%"]
    );
    res.json({ keys: rows.map((r) => r.k) });
  } catch (e) { next(e); }
});

api.get("/:key", async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT v FROM kv WHERE space=$1 AND k=$2", [SPACE, req.params.key]);
    if (!rows.length) return res.status(404).json({ error: "not found" });
    res.json({ key: req.params.key, value: rows[0].v });
  } catch (e) { next(e); }
});

api.put("/:key", async (req, res, next) => {
  try {
    const value = req.body && typeof req.body.value === "string"
      ? req.body.value
      : JSON.stringify(req.body && req.body.value !== undefined ? req.body.value : null);
    await pool.query(
      "INSERT INTO kv (space,k,v,updated_at) VALUES ($1,$2,$3,now()) ON CONFLICT (space,k) DO UPDATE SET v=EXCLUDED.v, updated_at=now()",
      [SPACE, req.params.key, value]
    );
    res.json({ key: req.params.key, value });
  } catch (e) { next(e); }
});

api.delete("/:key", async (req, res, next) => {
  try {
    await pool.query("DELETE FROM kv WHERE space=$1 AND k=$2", [SPACE, req.params.key]);
    res.json({ key: req.params.key, deleted: true });
  } catch (e) { next(e); }
});

app.use("/api/kv", api);

// serve the frontend
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: "server error" }); });

const port = process.env.PORT || 3000;
init()
  .then(() => app.listen(port, () => console.log("Spa Water Helper listening on " + port)))
  .catch((e) => { console.error("DB init failed:", e); process.exit(1); });
