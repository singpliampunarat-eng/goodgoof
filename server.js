// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  COMBINED SERVER: Dashboard + Tellonym Scraper
//  Run this on Replit with `npm start` or `node server.js`
//  It serves your website AND scrapes Tellonym in the background
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// ── SERVE THE DASHBOARD ─────────────────────────────────────────
app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ── HEALTH CHECK (keeps Replit alive) ───────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "running",
    scraper: scraperRunning ? "active" : "inactive",
    lastCheck: lastCheckTime,
    tellsInserted: totalInserted,
  });
});

// ── START SERVER ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n▲ Dashboard live at http://localhost:${PORT}`);
  console.log(`  Health check at http://localhost:${PORT}/health\n`);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BUILT-IN TELLONYM SCRAPER (runs in background)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TELLONYM_TOKEN = process.env.TELLONYM_TOKEN || "";
const SUPABASE_URL   = process.env.SUPABASE_URL   || "";
const SUPABASE_KEY   = process.env.SUPABASE_KEY   || "";
const POLL_INTERVAL  = 5 * 60 * 1000; // 5 minutes
const TELLONYM_API   = "https://api.tellonym.me";

let scraperRunning = false;
let lastCheckTime = null;
let totalInserted = 0;
const seenIds = new Set();

async function fetchTells() {
  try {
    const res = await fetch(`${TELLONYM_API}/tells`, {
      headers: {
        "Authorization": `Bearer ${TELLONYM_TOKEN}`,
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
      },
    });
    if (!res.ok) {
      if (res.status === 401) console.error("[scraper] Token expired — get a new one");
      return [];
    }
    const data = await res.json();
    return data.tells || data || [];
  } catch (err) {
    console.error("[scraper] Fetch error:", err.message);
    return [];
  }
}

async function insertToSupabase(tells) {
  const newTells = tells.filter(t => !seenIds.has(t.id));
  if (newTells.length === 0) return;

  const rows = newTells.map(t => ({
    text: t.tell || t.message || t.text || "(empty)",
    sender: "anonymous",
    category: null,
    status: "pending",
    created_at: t.createdAt || new Date().toISOString(),
  }));

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(rows),
    });
    if (res.ok) {
      const inserted = await res.json();
      totalInserted += inserted.length;
      newTells.forEach(t => seenIds.add(t.id));
      console.log(`[scraper] ✓ Inserted ${inserted.length} new tells`);
    }
  } catch (err) {
    console.error("[scraper] DB error:", err.message);
  }
}

async function poll() {
  lastCheckTime = new Date().toISOString();
  const tells = await fetchTells();
  if (Array.isArray(tells) && tells.length > 0) {
    await insertToSupabase(tells);
  }
}

// Only start scraper if credentials are set
if (TELLONYM_TOKEN && SUPABASE_URL && SUPABASE_KEY) {
  scraperRunning = true;
  console.log("[scraper] Starting Tellonym scraper (every 5 min)...");
  poll(); // first run immediately
  setInterval(poll, POLL_INTERVAL);
} else {
  console.log("[scraper] Skipped — set TELLONYM_TOKEN, SUPABASE_URL, SUPABASE_KEY as env vars to enable");
}
