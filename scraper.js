// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  TELLONYM INBOX SCRAPER
//  Pulls your anonymous tells and inserts them into Supabase
//  Run this alongside your dashboard (on Replit or any server)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
//  HOW TO GET YOUR TELLONYM TOKEN:
//
//  1. Open Chrome → go to tellonym.me → log in
//  2. Press F12 (DevTools) → click Console tab
//  3. Paste this and press Enter:
//
//     JSON.parse(localStorage.getItem('credentials')).accessToken
//
//  4. Copy the token string that appears
//  5. Paste it below as TELLONYM_TOKEN
//
//  The token expires after a while. When scraper stops working,
//  just repeat steps 1-4 and paste the new token.
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── YOUR SECRETS (or read from environment variables) ───────────
const TELLONYM_TOKEN = process.env.TELLONYM_TOKEN || "PASTE_YOUR_TELLONYM_TOKEN_HERE";
const SUPABASE_URL   = process.env.SUPABASE_URL   || "PASTE_YOUR_SUPABASE_URL_HERE";
const SUPABASE_KEY   = process.env.SUPABASE_KEY   || "PASTE_YOUR_SUPABASE_ANON_KEY_HERE";

// ── HOW OFTEN TO CHECK (in milliseconds) ────────────────────────
const POLL_INTERVAL = 5 * 60 * 1000; // every 5 minutes

// ── TELLONYM API ────────────────────────────────────────────────
const TELLONYM_API = "https://api.tellonym.me";

// Keep track of tells we've already saved (by their Tellonym ID)
const seenIds = new Set();

// ── FETCH INBOX FROM TELLONYM ───────────────────────────────────
async function fetchTells() {
  console.log(`[${timestamp()}] Checking Tellonym inbox...`);

  try {
    // The /tells endpoint returns your private inbox
    const res = await fetch(`${TELLONYM_API}/tells`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${TELLONYM_TOKEN}`,
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        console.error(`[${timestamp()}] ❌ Token expired or invalid! Get a new one from your browser.`);
        console.error(`   → Open tellonym.me → F12 → Console → JSON.parse(localStorage.getItem('credentials')).accessToken`);
        return [];
      }
      console.error(`[${timestamp()}] ❌ Tellonym API error: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();

    // The response contains a "tells" array
    // Each tell has: id, tell (the message text), createdAt, senderId, etc.
    const tells = data.tells || data || [];

    if (!Array.isArray(tells)) {
      console.log(`[${timestamp()}] Unexpected response shape. Keys:`, Object.keys(data));
      return [];
    }

    console.log(`[${timestamp()}] Found ${tells.length} tells in inbox`);
    return tells;

  } catch (err) {
    console.error(`[${timestamp()}] ❌ Network error:`, err.message);
    return [];
  }
}

// ── INSERT INTO SUPABASE ────────────────────────────────────────
async function insertToSupabase(tells) {
  if (tells.length === 0) return;

  // Filter out tells we've already processed
  const newTells = tells.filter(t => !seenIds.has(t.id));

  if (newTells.length === 0) {
    console.log(`[${timestamp()}] No new tells to insert`);
    return;
  }

  console.log(`[${timestamp()}] Inserting ${newTells.length} new tells into Supabase...`);

  // Convert Tellonym format → our Supabase messages table format
  const rows = newTells.map(tell => ({
    text:       tell.tell || tell.message || tell.text || "(empty)",
    sender:     "anonymous",
    category:   null,
    status:     "pending",
    created_at: tell.createdAt || new Date().toISOString(),
  }));

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
      method: "POST",
      headers: {
        "apikey":        SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type":  "application/json",
        "Prefer":        "return=representation",
      },
      body: JSON.stringify(rows),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[${timestamp()}] ❌ Supabase insert error: ${res.status}`, errText);
      return;
    }

    const inserted = await res.json();
    console.log(`[${timestamp()}] ✓ Inserted ${inserted.length} messages into Supabase`);

    // Mark these as seen so we don't duplicate them
    newTells.forEach(t => seenIds.add(t.id));

  } catch (err) {
    console.error(`[${timestamp()}] ❌ Supabase error:`, err.message);
  }
}

// ── ALSO CHECK ANSWERED TELLS (public profile) ──────────────────
// If you want to also scrape your public answered tells:
async function fetchAnsweredTells(username) {
  try {
    const res = await fetch(`${TELLONYM_API}/profiles/name/${username}`, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.answers || [];
  } catch {
    return [];
  }
}

// ── MAIN LOOP ───────────────────────────────────────────────────
async function poll() {
  const tells = await fetchTells();
  await insertToSupabase(tells);
}

async function start() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  TELLONYM INBOX SCRAPER");
  console.log(`  Polling every ${POLL_INTERVAL / 1000}s`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Validate config
  if (TELLONYM_TOKEN.includes("PASTE")) {
    console.error("\n❌ You need to set your TELLONYM_TOKEN!");
    console.error("   Open tellonym.me → F12 → Console tab → paste:");
    console.error('   JSON.parse(localStorage.getItem(\'credentials\')).accessToken');
    console.error("   Then paste the result in this file or as an env variable.\n");
    return;
  }
  if (SUPABASE_URL.includes("PASTE")) {
    console.error("\n❌ You need to set your SUPABASE_URL and SUPABASE_KEY!");
    console.error("   Get them from supabase.com → Settings → API\n");
    return;
  }

  // First run immediately
  await poll();

  // Then repeat on interval
  setInterval(poll, POLL_INTERVAL);

  console.log(`\n[${timestamp()}] Scraper running. Next check in ${POLL_INTERVAL / 1000}s...`);
}

function timestamp() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

// ── GO ──────────────────────────────────────────────────────────
start();
