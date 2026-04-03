# ▲ INBOX — Tellonym → Instagram Dashboard

A private dashboard that pulls your Tellonym anonymous messages, categorizes them with Google Gemini AI, and auto-posts accepted ones as screenshots to your Instagram.

## How It Works

```
Tellonym Inbox → Supabase DB → Gemini AI Categorizes → You Accept/Reject → Auto-Post to Instagram
```

## Quick Start (5 minutes)

### 1. Get Your Keys

Open `secrets.js` and fill in each value:

| Key | Where to get it |
|-----|----------------|
| `SUPABASE_URL` | supabase.com → New Project → Settings → API → Project URL |
| `SUPABASE_KEY` | Same page → anon / publishable key |
| `GEMINI_API_KEY` | aistudio.google.com → Get API key → Create API key (free) |
| `IG_ACCESS_TOKEN` | developers.facebook.com → Create App → Graph API Explorer → Generate Token |
| `IG_USER_ID` | Graph API Explorer → GET /me?fields=id → copy the id |
| `TELLONYM_USER` | Your Tellonym username |

### 2. Set Up Supabase Database

Run this SQL in your Supabase SQL Editor:

```sql
create table messages (
  id bigint generated always as identity primary key,
  text text not null,
  sender text default 'anonymous',
  category text,
  status text default 'pending',
  screenshot_url text,
  created_at timestamptz default now()
);

alter table messages enable row level security;
create policy "public_access" on messages for all using (true);

insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', true);

create policy "public_upload" on storage.objects
  for all using (bucket_id = 'screenshots');
```

### 3. Deploy

**Option A — Replit:**
- Create new Replit → drag & drop this folder
- Open `secrets.js` and paste your keys
- Click Run

**Option B — Local:**
- Just open `index.html` in your browser

**Option C — Vercel/Netlify:**
- Push to GitHub → connect to Vercel → done

### 4. Feed Tellonym Messages

Since Tellonym has no API, you have two options:

**Manual:** Copy messages into your Supabase `messages` table directly.

**Automated:** Create a Node.js scraper that checks your Tellonym inbox and inserts new messages into Supabase. Run it on a cron schedule.

## File Structure

```
tellonym-inbox/
├── index.html          ← Main dashboard page
├── style.css           ← All styling + animations
├── secrets.js          ← 🔑 YOUR API KEYS GO HERE (for the dashboard)
├── scripts/
│   └── app.js          ← Dashboard logic (Supabase, Gemini, Instagram)
├── scraper.js          ← Standalone Tellonym scraper (run separately)
├── server.js           ← Combined server: dashboard + scraper in one
├── package.json        ← npm config for Replit
└── README.md           ← You're reading this
```

## Tellonym Scraper

The scraper pulls your anonymous tells and inserts them into Supabase.

### Get your Tellonym token:
1. Open Chrome → go to **tellonym.me** → log in
2. Press **F12** → click **Console** tab
3. Paste this and press Enter:
   ```js
   JSON.parse(localStorage.getItem('credentials')).accessToken
   ```
4. Copy the token string that appears

### Run options:

**Option A — Combined (recommended for Replit):**
```bash
npm install
TELLONYM_TOKEN=xxx SUPABASE_URL=xxx SUPABASE_KEY=xxx npm start
```
This runs the dashboard AND scraper together in one process.

**Option B — Scraper only:**
```bash
TELLONYM_TOKEN=xxx SUPABASE_URL=xxx SUPABASE_KEY=xxx node scraper.js
```

**On Replit:** Add `TELLONYM_TOKEN`, `SUPABASE_URL`, and `SUPABASE_KEY` as Secrets (environment variables). Then click Run.

The scraper checks every 5 minutes, skips duplicates, and logs everything to the console. If the token expires (you'll see a 401 error), just grab a new one from your browser.

## Features

- 3D tilt-reactive cards with cursor-following glow
- Floating particle background
- Gemini AI auto-categorization (compliment, question, confession, feedback, toxic, other)
- One-click accept → screenshot → upload → Instagram post (fully automatic)
- Filter messages by category
- Analytics dashboard with category breakdown + pipeline view
- Auto-refresh from Supabase every 30 seconds
- Works in demo mode without any keys configured
- Mobile responsive

## Auto-Post Flow

When you click ✓ Accept:
1. Message is categorized by Gemini (if not already)
2. A 1080×1080 screenshot is generated on a dark card
3. Screenshot uploads to Supabase Storage
4. Instagram Graph API creates a media container with the image URL
5. Waits for Instagram to process (~8-15 seconds)
6. Publishes the post — no caption, just the screenshot

Toggle auto-post on/off with the pink button in the action bar.

## Instagram Requirements

- Account must be Business or Creator (not Personal)
- App needs `instagram_content_publish` permission
- Images must be hosted on a public URL (Supabase Storage handles this)
- Access token expires after 60 days — extend it before it expires
