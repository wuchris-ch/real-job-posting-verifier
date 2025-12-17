# Ghost Job Hunter - Implementation Plan

## Summary
Build a web app providing human-verified entry-level tech job listings to combat "ghost jobs."

## Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript
- **Database + Auth**: Supabase (PostgreSQL + built-in magic link auth)
- **Payments**: LemonSqueezy ($1 one-time payment)
- **Styling**: Tailwind CSS v4
- **Deploy**: Vercel

### Why Supabase over SQLite + Prisma + NextAuth?
- Single service replaces 3 integrations
- Built-in magic link auth (no Resend needed)
- Hosted PostgreSQL (no SQLite deployment issues on Vercel)
- Generous free tier: 500MB DB, 50k API requests/month
- Row-level security for admin protection

## Data Models (Supabase/PostgreSQL)

### jobs table
```sql
create table jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  location text not null,
  location_type text not null check (location_type in ('REMOTE', 'HYBRID', 'ONSITE')),
  salary_min integer,
  salary_max integer,
  apply_url text not null,
  source_url text not null,
  verification_status text not null default 'PENDING'
    check (verification_status in ('VERIFIED', 'EXPIRED', 'BROKEN_LINK', 'NOT_HIRING', 'PENDING')),
  last_verified_at timestamptz,
  verification_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### profiles table (extends Supabase auth.users)
```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  has_paid boolean default false,
  paid_at timestamptz,
  lemonsqueezy_customer_id text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## Core Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page with value prop + 10 free verified jobs |
| `/jobs` | Full job listings (shows all if paid, teaser if not) |
| `/login` | Magic link authentication (Supabase Auth UI) |
| `/auth/callback` | Supabase auth callback handler |
| `/admin` | Job verification dashboard (password protected) |
| `/admin/jobs/new` | Add new job listing |
| `/admin/jobs/[id]` | Edit/verify specific job |
| `/api/checkout` | Create LemonSqueezy checkout URL |
| `/api/webhook` | LemonSqueezy webhook (order_created event) |

## LemonSqueezy Integration Details

### Setup Required in LemonSqueezy Dashboard
1. Create a product ($1 "Verified Jobs Access")
2. Create a webhook pointing to `/api/webhook`
3. Enable `order_created` event
4. Copy API key, Store ID, and Webhook Secret

### Checkout Flow
1. User clicks "Get Full Access - $1"
2. API creates checkout URL with user's email pre-filled
3. Redirect to LemonSqueezy hosted checkout
4. On success, webhook fires and updates user record
5. User redirected back to /jobs with full access

## Business Logic

### Verification Rules
- Jobs must be re-verified every 48 hours
- Jobs older than 48h are hidden from public (still visible in admin)
- "Verified X hours ago" shown on each listing

### Access Tiers
- **Free**: See 10 most recently verified jobs
- **Paid ($1)**: See all verified jobs (50+)

### Admin Verification Workflow
1. Add job from source (LinkedIn, company site, etc.)
2. Manually check: apply link works, role matches, company is actually hiring
3. Mark as VERIFIED with timestamp
4. Or mark as BROKEN_LINK / NOT_HIRING with notes

## Implementation Order

### Phase 1: Foundation
- [ ] Create Next.js 16 project with TypeScript + Tailwind
- [ ] Set up Supabase project + install @supabase/supabase-js
- [ ] Create jobs and profiles tables in Supabase
- [ ] Seed with 15 mock entry-level tech jobs

### Phase 2: Public UI
- [ ] JobCard component (title, company, location, salary, verified badge)
- [ ] Landing page with hero + 10 free jobs
- [ ] Jobs page with free/paid gating logic

### Phase 3: Admin Dashboard
- [ ] Middleware for password protection (/admin/*)
- [ ] Admin dashboard showing all jobs by status
- [ ] Add new job form
- [ ] Edit job + verification actions

### Phase 4: Auth + Payments
- [ ] Supabase Auth with magic links (built-in, no extra config)
- [ ] Login page with Supabase Auth UI
- [ ] LemonSqueezy checkout API route
- [ ] Webhook handler with signature verification
- [ ] Payment status check in job listings

### Phase 5: Polish
- [ ] Mobile responsive styling
- [ ] Loading states
- [ ] Error handling
- [ ] Deploy to Vercel

## File Structure

```
/real-job-posting-verifier
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing
│   │   ├── layout.tsx                  # Root layout
│   │   ├── jobs/
│   │   │   └── page.tsx                # Job listings
│   │   ├── login/
│   │   │   └── page.tsx                # Supabase Auth UI
│   │   ├── auth/
│   │   │   └── callback/route.ts       # Auth callback
│   │   ├── admin/
│   │   │   ├── page.tsx                # Dashboard
│   │   │   ├── layout.tsx              # Password check
│   │   │   └── jobs/
│   │   │       ├── new/page.tsx        # Add job
│   │   │       └── [id]/page.tsx       # Edit job
│   │   └── api/
│   │       ├── checkout/route.ts       # LemonSqueezy checkout
│   │       └── webhook/route.ts        # LemonSqueezy webhook
│   ├── components/
│   │   ├── JobCard.tsx
│   │   ├── JobList.tsx
│   │   ├── PaymentButton.tsx
│   │   └── VerificationBadge.tsx
│   └── lib/
│       ├── supabase/
│       │   ├── client.ts               # Browser client
│       │   └── server.ts               # Server client
│       └── lemonsqueezy.ts
├── supabase/
│   └── migrations/                     # SQL migrations
├── .env.local
├── package.json
└── tailwind.config.ts
```

## Environment Variables

```bash
# Supabase (get from project settings)
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="xxxxx"
SUPABASE_SERVICE_ROLE_KEY="xxxxx"  # For webhook to update profiles

# LemonSqueezy
LEMONSQUEEZY_API_KEY="xxxxx"
LEMONSQUEEZY_STORE_ID="xxxxx"
LEMONSQUEEZY_PRODUCT_ID="xxxxx"
LEMONSQUEEZY_WEBHOOK_SECRET="xxxxx"

# Admin
ADMIN_PASSWORD="your-secure-password"
```

## Sources
- [Next.js 16](https://nextjs.org/blog)
- [Supabase with Next.js](https://www.infyways.com/supabase-with-next-js/)
- [LemonSqueezy Webhooks in Next.js](https://docs.lemonsqueezy.com/guides/tutorials/webhooks-nextjs)
- [LemonSqueezy Next.js Billing Template](https://github.com/lmsqueezy/nextjs-billing)
