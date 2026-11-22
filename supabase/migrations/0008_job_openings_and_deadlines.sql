-- ============================================================
-- 0008_job_openings_and_deadlines.sql
-- Job Openings Management, Application Windows & Live Countdown Timers
-- ============================================================

create table if not exists job_openings (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references entities(id) on delete cascade,
  title text not null,
  role_type text not null default 'Commission Agency Partner',
  target_earning text,
  commission_rate numeric(5,4) default 0.10,
  slots int default 5,
  description text,
  requirements text,
  opens_at timestamptz not null default now(),
  closes_at timestamptz not null default (now() + interval '14 days'),
  status text not null default 'open' check (status in ('open', 'closed', 'draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Link applications to specific job opening
alter table applications add column if not exists job_id uuid references job_openings(id) on delete set null;

-- Indices
create index if not exists idx_job_openings_entity on job_openings(entity_id);
create index if not exists idx_job_openings_status on job_openings(status);
create index if not exists idx_job_openings_closes on job_openings(closes_at);

-- Grants
grant all on job_openings to postgres, anon, authenticated, service_role;
