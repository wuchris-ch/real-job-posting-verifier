# Ghost Job Hunter

A job board that only shows real, verified remote jobs. We scrape jobs from 6 different sources, verify they're legitimate, and remove ones that go stale.

## The Problem

Job boards are full of "ghost jobs", postings that look real but lead nowhere. Companies post them to collect resumes, look like they're growing, or just forget to take them down. Job seekers waste hours applying to positions that were never real.

## How It Works

### 1. Scraping (Finding Jobs)

We pull jobs from 6 free public APIs:

| Source | API Endpoint | Jobs |
|--------|--------------|------|
| Remote OK | `remoteok.com/api` | ~200 |
| Remotive | `remotive.com/api/remote-jobs` | ~200 |
| Arbeitnow | `arbeitnow.com/api/job-board-api` | ~100 |
| Himalayas | `himalayas.app/jobs/api` | ~200 (paginated) |
| Jobicy | `jobicy.com/api/v2/remote-jobs` | ~100 |
| We Work Remotely | `weworkremotely.com/api` | varies |

No filtering, we grab everything. Users can filter on their own.

### 2. Deduplication

Before processing, we check the database for existing jobs by `apply_url` and `source_url`. If we already have a job with the same URL, we skip it. We also dedupe by company + title combo to catch cross-posted jobs.

This means running the scraper twice in a row won't add duplicates. You only get new jobs when the APIs actually have new listings (which happens over days, not hours).

### 3. Verification Pipeline

Each new job goes through these checks:

1. **URL check** - We hit the apply link with an HTTP HEAD request. If it doesn't return a 200-level status, the job is rejected.

2. **Company domain check** - We verify the company's domain is real. Known ATS platforms (Greenhouse, Lever, Workday, etc.) are auto-trusted.

3. **Red flag detection** - We scan the job title and description for scam patterns:
   - "Urgently hiring" / "Immediate start"
   - "No experience needed"
   - Unrealistic salary claims ($500/day, etc.)
   - "Guaranteed income" / "Unlimited earning"
   - Requests for money, bank info, or SSN
   - Vague/confidential company names

4. **AI analysis** (optional) - If you have an `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`, we send each job to the AI for a 0-100 legitimacy score. The AI looks for ghost job patterns like vague descriptions, buzzword-heavy text, and too-good-to-be-true benefits. Without an API key, we fall back to rule-based scoring that checks description length, salary transparency, ATS usage, and team structure mentions.

Jobs that pass all checks get marked as VERIFIED with a timestamp.

### 4. Re-verification (Freshness)

Jobs go stale. Companies fill positions, take down listings, or let links rot. We re-check jobs that were verified more than 24 hours ago by hitting their apply URL again. If the link is broken, the job gets marked as BROKEN_LINK and hidden.

**48-hour rule**: Jobs only appear on the site if `last_verified_at` is within the last 48 hours. This keeps the listing fresh automatically.

### 5. User Flow

- **Homepage** - Shows 5 free verified jobs as a preview
- **Full access** - Pay $1 (via LemonSqueezy) to see all verified jobs
- **Auth** - Three options via tabbed UI:
  - **Google OAuth** (recommended) - One-click "Continue with Google"
  - **Magic Link** - Enter email, click link sent to inbox (no password needed)
  - **Password** - Traditional email/password with sign up and sign in

All methods create the same account tied to the user's email. Payment status is linked to email, so it doesn't matter which login method they use.

## Automation: Crons vs Admin Panel

**In production (Vercel)**: One daily cron job handles everything, configured in `vercel.json`:

| Cron | Schedule | What it does |
|------|----------|--------------|
| `/api/cron/scrape` | Daily at midnight UTC | Scrape all 6 APIs, verify new jobs, re-verify existing jobs |

Note: Combined into one cron for Vercel Hobby plan (1 cron limit). The `/api/cron/verify` endpoint still exists for manual triggers.

**In development (localhost)**: Crons don't run automatically. Use the admin panel instead:

1. Go to `localhost:3000/admin`
2. Enter your `ADMIN_PASSWORD`
3. Click "Automation" in the nav
4. Hit "Run Scrape" or "Run Verification" manually

Or trigger via curl:
```bash
curl -X POST http://localhost:3000/api/cron/scrape
curl -X POST http://localhost:3000/api/cron/verify
```

## Tech Stack

| What | Why |
|------|-----|
| **Next.js 16** | React framework with server components, handles both the website and API routes |
| **Supabase** | PostgreSQL database + auth in one. Magic link login, row-level security |
| **LemonSqueezy** | Payment processing. User pays $1, webhook updates their account |
| **Tailwind CSS v4** | Styling |
| **Vercel** | Hosting + cron jobs (triggers scraping/verification on schedule) |

## API Routes

| Route | Method | What it does |
|-------|--------|--------------|
| `/api/cron/scrape` | POST | Run the full scraping pipeline |
| `/api/cron/verify` | POST | Re-check existing jobs |
| `/api/checkout` | POST | Create a LemonSqueezy payment link |
| `/api/webhook` | POST | Receive payment confirmation from LemonSqueezy |
| `/api/admin/jobs` | GET/POST | List all jobs / add a new job |
| `/api/admin/jobs/[id]` | GET/PUT/DELETE | Get, update, or delete a job |
| `/api/admin/verify` | POST | Verify admin password |

## Development

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # Type check
```

## License

MIT
