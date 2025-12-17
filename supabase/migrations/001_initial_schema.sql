-- Jobs table
create table if not exists jobs (
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

-- Profiles table (extends auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  has_paid boolean default false,
  paid_at timestamptz,
  lemonsqueezy_customer_id text,
  created_at timestamptz default now()
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable RLS
alter table jobs enable row level security;
alter table profiles enable row level security;

-- Jobs policies: anyone can read verified jobs
create policy "Anyone can read verified jobs"
  on jobs for select
  using (verification_status = 'VERIFIED');

-- Profiles policies: users can read their own profile
create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

-- Index for faster queries
create index if not exists idx_jobs_verification_status on jobs(verification_status);
create index if not exists idx_jobs_last_verified_at on jobs(last_verified_at desc);
