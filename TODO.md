# TODO - Ghost Job Hunter

## Before Launch

### 1. LemonSqueezy Setup
- [ ] Create account at https://app.lemonsqueezy.com
- [ ] Create a Store (if not already)
- [ ] Create a Product: "Verified Jobs Access" for $1 (one-time payment)
- [ ] Go to Settings > API Keys > Create new API key
- [ ] Copy Store ID from Settings > Stores
- [ ] Copy Product ID from Products > your product > URL contains the ID
- [ ] Go to Settings > Webhooks > Create webhook:
  - URL: `https://your-domain.com/api/webhook`
  - Events: `order_created`
  - Copy the signing secret
- [ ] Update `.env.local` with all LemonSqueezy values

### 2. Google OAuth Setup (Recommended)

Users can sign in with their Google account. No SMTP needed.

**Setup Steps:**
1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Google
3. Go to Google Cloud Console > APIs & Services > Credentials
4. Create OAuth 2.0 Client ID (Web application)
5. Add authorized redirect URI: `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret back to Supabase
7. Save

That's it. Users can now click "Continue with Google" to sign in.

### 3. Gmail SMTP (Optional)

Only needed for magic link and password sign-up (email confirmation).

| Auth Method | Needs SMTP? |
|-------------|-------------|
| Google OAuth | No |
| Magic Link | Yes |
| Password Sign In | No |
| Password Sign Up | Yes (for confirmation email) |

**Tip:** You can disable email confirmation in Supabase > Auth > Settings to skip SMTP entirely. Users can sign up with password and use immediately.

**Gmail SMTP Settings:**
```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: <app-password>
```

**Setup Steps:**
1. Enable 2FA on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate a 16-character app password for "Mail"
4. In Supabase Dashboard: Authentication > SMTP Settings
5. Enter the Gmail SMTP credentials above
6. Set sender name (e.g., "Ghost Job Hunter")
7. Save and test by trying to log in

**Limits:**
- 500 emails/day (free Gmail)
- 2,000 emails/day (Google Workspace)

### 4. Deploy to Vercel
- [ ] Push code to GitHub
- [ ] Connect repo to Vercel
- [ ] Add all environment variables in Vercel dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `LEMONSQUEEZY_API_KEY`
  - `LEMONSQUEEZY_STORE_ID`
  - `LEMONSQUEEZY_PRODUCT_ID`
  - `LEMONSQUEEZY_WEBHOOK_SECRET`
  - `ADMIN_PASSWORD` (use a strong password for production!)
- [ ] Deploy
- [ ] Update LemonSqueezy webhook URL to production domain

### 5. Post-Deploy Verification
- [ ] Test Google OAuth login
- [ ] Test magic link login (if SMTP configured)
- [ ] Test $1 payment flow end-to-end
- [ ] Verify webhook updates user's `has_paid` status
- [ ] Verify cron job is running (check Vercel dashboard > Crons)
  - `/api/cron/scrape` runs daily at midnight UTC (scrapes + re-verifies)
- [ ] Test admin panel at `/admin`

### 6. Optional Enhancements
- [ ] Add custom domain
- [ ] Set up error monitoring (Sentry)
- [ ] Add analytics (Plausible, PostHog, etc.)
- [ ] Upgrade to Resend + custom domain for better email deliverability

---

## Current Status

**Done:**
- [x] Supabase database set up
- [x] Job scraping working (4000+ jobs from 6 sources)
- [x] Filters working (search, location, salary, work type, source)
- [x] Admin panel working
- [x] UI complete with SVG icons
- [x] Google OAuth login added
- [x] Magic link login (with "how it works" explainer)
- [x] Password login (email/password with sign up/sign in toggle)

**Pending:**
- [ ] Google OAuth credentials (Supabase + Google Cloud Console)
- [ ] LemonSqueezy credentials
- [ ] Gmail SMTP setup (optional, for magic links)
- [ ] Vercel deployment
