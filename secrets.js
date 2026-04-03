// ╔══════════════════════════════════════════════════════════════════╗
// ║  🔑  SECRETS — PASTE YOUR REAL KEYS BELOW                      ║
// ║                                                                  ║
// ║  This is the ONLY file you need to edit.                        ║
// ║  Replace each "PASTE_..." value with your actual key.           ║
// ║  Then open index.html or deploy to Replit / Vercel / Netlify.   ║
// ╚══════════════════════════════════════════════════════════════════╝

const SECRETS = {

  // ── SUPABASE ──────────────────────────────────────────────────
  // 1. Go to supabase.com → New Project
  // 2. Settings → API  (or click the "Connect" button)
  // 3. Copy "Project URL" and "anon / publishable" key
  SUPABASE_URL:  "PASTE_YOUR_SUPABASE_URL_HERE",
  SUPABASE_KEY:  "PASTE_YOUR_SUPABASE_ANON_KEY_HERE",

  // ── GEMINI (free) ─────────────────────────────────────────────
  // 1. Go to aistudio.google.com
  // 2. Sign in with Google → "Get API key" → "Create API key"
  // 3. Copy the key (starts with AIza...)
  GEMINI_API_KEY: "PASTE_YOUR_GEMINI_KEY_HERE",

  // ── INSTAGRAM GRAPH API ───────────────────────────────────────
  // 1. Switch IG account to Business/Creator
  // 2. developers.facebook.com → Create App → "Other" → "Business"
  // 3. Add "Instagram Graph API" product
  // 4. Tools → Graph API Explorer → select app
  // 5. Add permissions: instagram_basic, instagram_content_publish, pages_show_list
  // 6. Generate Access Token → authorize → copy token
  // 7. GET /me?fields=id  → copy the numeric ID
  // 8. Extend token: Access Token Debugger → "Extend Access Token"
  IG_ACCESS_TOKEN: "PASTE_YOUR_IG_TOKEN_HERE",
  IG_USER_ID:      "PASTE_YOUR_IG_USER_ID_HERE",

  // ── TELLONYM ──────────────────────────────────────────────────
  // Just your Tellonym username (used for display only)
  TELLONYM_USER: "your_tellonym_username",

  // ── SUPABASE STORAGE (for hosting screenshot images) ──────────
  // This is auto-derived from your Supabase URL. No need to edit.
  get STORAGE_URL() {
    return this.SUPABASE_URL + "/storage/v1/object/public/screenshots/";
  },
};
