-- ============================================================
-- 0007_recruitment_assessment.sql
-- E-Recruitment Portal & Online Candidate Evaluation Assessment
-- ============================================================

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  app_code text unique not null,
  full_name text not null,
  email text not null,
  phone text not null,
  id_number text,
  residence text,
  entity_id uuid references entities(id) on delete set null,
  position text not null default 'Sales Agency Representative',
  bio text,
  experience text,
  education text,
  referees text,
  status text not null default 'applied' check (
    status in ('applied', 'assessed', 'under_review', 'interview_scheduled', 'approved', 'rejected', 'hired')
  ),
  test_score numeric(5,2),
  test_answers jsonb,
  test_completed_at timestamptz,
  interview_notes text,
  agent_id uuid references agents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indices for rapid search and candidate lookup
create index if not exists idx_applications_app_code on applications(app_code);
create index if not exists idx_applications_email on applications(email);
create index if not exists idx_applications_phone on applications(phone);
create index if not exists idx_applications_status on applications(status);
create index if not exists idx_applications_entity on applications(entity_id);

-- Permissions
grant all on applications to postgres, anon, authenticated, service_role;
