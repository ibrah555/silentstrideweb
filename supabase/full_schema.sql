-- ============================================================
-- SILENT STRIDES NETWORK LTD — COMPLETE DATABASE SETUP
-- Run this entire script in Supabase SQL Editor.
-- It is completely safe to run and re-run (idempotent).
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------- ENUMS ----------
do $$ begin
  create type entity_kind as enum ('holding', 'subsidiary');
exception when duplicate_object then null; end $$;

do $$ begin
  create type owner_role as enum ('director', 'shareholder', 'investor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type agent_status as enum ('pending', 'active', 'suspended', 'terminated');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sale_status as enum ('recorded', 'verified', 'paid_out');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ledger_account as enum (
    'capital', 'cash', 'inventory', 'revenue', 'cogs',
    'commission_expense', 'commission_payable', 'opex', 'payable', 'receivable'
  );
exception when duplicate_object then null; end $$;

-- ---------- TABLES ----------
create table if not exists entities (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  kind entity_kind not null default 'subsidiary',
  status text not null default 'active' check (status in ('active','planned','dormant')),
  commission_rate numeric(5,4) default 0.10,
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

create table if not exists owners (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique not null,
  role owner_role not null default 'director',
  ownership_pct numeric(5,2) not null check (ownership_pct >= 0 and ownership_pct <= 100),
  created_at timestamptz not null default now()
);

create table if not exists capital_contributions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references owners(id) on delete cascade,
  entity_id uuid not null references entities(id),
  amount numeric(14,2) not null check (amount > 0),
  tranche_label text,
  contributed_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references entities(id),
  full_name text not null,
  phone text,
  email text,
  commission_rate numeric(5,4) not null default 0.10,
  status agent_status not null default 'pending',
  agreement_signed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references entities(id),
  sku text not null,
  name text not null,
  unit_cost numeric(14,2) not null check (unit_cost >= 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  qty_on_hand int not null default 0 check (qty_on_hand >= 0),
  unique(entity_id, sku)
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references entities(id),
  agent_id uuid references agents(id) on delete set null,
  batch_label text,
  total_amount numeric(14,2) not null check (total_amount >= 0),
  cogs_amount numeric(14,2) not null default 0 check (cogs_amount >= 0),
  commission_amount numeric(14,2) not null default 0 check (commission_amount >= 0),
  status sale_status not null default 'recorded',
  sold_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists commission_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references sales(id) on delete set null,
  agent_id uuid not null references agents(id),
  amount numeric(14,2) not null check (amount > 0),
  paid_at timestamptz not null default now()
);

-- Ensure sale_id is nullable if table already existed
alter table commission_payments alter column sale_id drop not null;

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references entities(id),
  account ledger_account not null default 'opex',
  amount numeric(14,2) not null check (amount > 0),
  memo text,
  spent_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists ledger_entries (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references entities(id),
  entry_date date not null default current_date,
  account ledger_account not null,
  debit numeric(14,2) not null default 0 check (debit >= 0),
  credit numeric(14,2) not null default 0 check (credit >= 0),
  memo text,
  ref_type text,
  ref_id uuid,
  created_by uuid references owners(id),
  created_at timestamptz not null default now(),
  check (not (debit > 0 and credit > 0))
);

-- Indexes
create index if not exists idx_ledger_entity_date on ledger_entries(entity_id, entry_date desc);
create index if not exists idx_sales_entity on sales(entity_id, sold_at desc);
create index if not exists idx_commissions_agent on commission_payments(agent_id);

-- ---------- TRIGGERS & FUNCTIONS ----------

-- 1. Auto compute commission on sale insert
create or replace function compute_commission() returns trigger as $$
declare
  rate numeric;
begin
  if new.agent_id is not null then
    select coalesce(a.commission_rate, e.commission_rate, 0.10)
      into rate
      from agents a join entities e on e.id = a.entity_id
     where a.id = new.agent_id;
    new.commission_amount := round(new.total_amount * rate, 2);
  end if;
  return new;
end $$ language plpgsql;

drop trigger if exists trg_sale_commission on sales;
create trigger trg_sale_commission before insert on sales
  for each row execute function compute_commission();

-- 2. Mirror every sale into ledger
create or replace function mirror_sale_to_ledger() returns trigger as $$
begin
  -- cash debit / revenue credit
  insert into ledger_entries(entity_id, entry_date, account, debit, memo, ref_type, ref_id)
  values (new.entity_id, new.sold_at::date, 'cash', new.total_amount, coalesce(new.batch_label,'Sale'), 'sale', new.id);
  
  insert into ledger_entries(entity_id, entry_date, account, credit, memo, ref_type, ref_id)
  values (new.entity_id, new.sold_at::date, 'revenue', new.total_amount, coalesce(new.batch_label,'Sale'), 'sale', new.id);
  
  -- cogs & inventory
  if new.cogs_amount > 0 then
    insert into ledger_entries(entity_id, entry_date, account, debit, memo, ref_type, ref_id)
    values (new.entity_id, new.sold_at::date, 'cogs', new.cogs_amount, 'COGS', 'sale', new.id);
    insert into ledger_entries(entity_id, entry_date, account, credit, memo, ref_type, ref_id)
    values (new.entity_id, new.sold_at::date, 'inventory', new.cogs_amount, 'COGS', 'sale', new.id);
  end if;
  
  -- commission accrual
  if new.commission_amount > 0 then
    insert into ledger_entries(entity_id, entry_date, account, debit, memo, ref_type, ref_id)
    values (new.entity_id, new.sold_at::date, 'commission_expense', new.commission_amount, 'Agent commission', 'sale', new.id);
    insert into ledger_entries(entity_id, entry_date, account, credit, memo, ref_type, ref_id)
    values (new.entity_id, new.sold_at::date, 'commission_payable', new.commission_amount, 'Agent commission', 'sale', new.id);
  end if;
  return new;
end $$ language plpgsql;

drop trigger if exists trg_sale_ledger on sales;
create trigger trg_sale_ledger after insert on sales
  for each row execute function mirror_sale_to_ledger();

-- 3. Guard: payout cannot exceed earned
create or replace function check_commission_payout() returns trigger as $$
declare
  earned numeric;
  paid numeric;
begin
  select coalesce(sum(commission_amount),0) into earned from sales where agent_id = new.agent_id;
  select coalesce(sum(amount),0) into paid from commission_payments where agent_id = new.agent_id;
  if paid + new.amount > earned then
    raise exception 'Payout exceeds earned commissions for agent % (earned: %, already paid: %, attempted: %)',
      new.agent_id, earned, paid, new.amount;
  end if;
  return new;
end $$ language plpgsql;

drop trigger if exists trg_comm_payout_check on commission_payments;
create trigger trg_comm_payout_check before insert on commission_payments
  for each row execute function check_commission_payout();

-- 4. Auto mirror commission payouts to ledger
create or replace function mirror_commission_payment_to_ledger() returns trigger as $$
declare
  ent_id uuid;
  agent_name text;
begin
  select a.entity_id, a.full_name into ent_id, agent_name
    from agents a where a.id = new.agent_id;

  insert into ledger_entries(entity_id, entry_date, account, debit, memo, ref_type, ref_id)
  values (ent_id, new.paid_at::date, 'commission_payable', new.amount,
          'Commission payout — ' || agent_name, 'commission', new.id);
  insert into ledger_entries(entity_id, entry_date, account, credit, memo, ref_type, ref_id)
  values (ent_id, new.paid_at::date, 'cash', new.amount,
          'Commission payout — ' || agent_name, 'commission', new.id);
  return new;
end $$ language plpgsql;

drop trigger if exists trg_comm_payment_ledger on commission_payments;
create trigger trg_comm_payment_ledger after insert on commission_payments
  for each row execute function mirror_commission_payment_to_ledger();

-- ---------- REPORTING VIEWS ----------
drop view if exists v_subsidiary_pnl;
create view v_subsidiary_pnl as
select e.id, e.code, e.name,
       coalesce(sum(s.total_amount),0)          as revenue,
       coalesce(sum(s.cogs_amount),0)           as cogs,
       coalesce(sum(s.commission_amount),0)     as commissions,
       coalesce((select sum(x.amount) from expenses x where x.entity_id=e.id),0) as opex,
       coalesce(sum(s.total_amount),0)
         - coalesce(sum(s.cogs_amount),0)
         - coalesce(sum(s.commission_amount),0)
         - coalesce((select sum(x.amount) from expenses x where x.entity_id=e.id),0) as net_profit
from entities e
left join sales s on s.entity_id = e.id
group by e.id;

drop view if exists v_agent_balances;
create view v_agent_balances as
select a.id, a.full_name, a.entity_id, a.status,
       e.name as entity_name,
       coalesce(sum(s.commission_amount),0) as earned,
       coalesce((select sum(cp.amount) from commission_payments cp where cp.agent_id=a.id),0) as paid,
       coalesce(sum(s.commission_amount),0)
         - coalesce((select sum(cp.amount) from commission_payments cp where cp.agent_id=a.id),0) as payable
from agents a
join entities e on e.id = a.entity_id
left join sales s on s.agent_id = a.id
group by a.id, e.name;

-- ---------- ROW LEVEL SECURITY ----------
alter table entities enable row level security;
alter table owners enable row level security;
alter table capital_contributions enable row level security;
alter table agents enable row level security;
alter table inventory_items enable row level security;
alter table sales enable row level security;
alter table commission_payments enable row level security;
alter table expenses enable row level security;
alter table ledger_entries enable row level security;

-- Directors see everything
create or replace function is_director() returns boolean as $$
  select exists (
    select 1 from owners o
    where o.email = auth.jwt() ->> 'email'
      and o.role in ('director','shareholder')
  );
$$ language sql stable security definer;

-- Drop existing policies if any
drop policy if exists p_directors_all on entities;
drop policy if exists p_directors_all on owners;
drop policy if exists p_directors_all on capital_contributions;
drop policy if exists p_directors_all on agents;
drop policy if exists p_directors_all on inventory_items;
drop policy if exists p_directors_all on sales;
drop policy if exists p_directors_all on commission_payments;
drop policy if exists p_directors_all on expenses;
drop policy if exists p_directors_all on ledger_entries;
drop policy if exists p_agent_own_sales on sales;
drop policy if exists p_agent_own_comm on commission_payments;

-- Create policies
create policy p_directors_all on entities for all using (is_director()) with check (is_director());
create policy p_directors_all on owners for all using (is_director()) with check (is_director());
create policy p_directors_all on capital_contributions for all using (is_director()) with check (is_director());
create policy p_directors_all on agents for all using (is_director()) with check (is_director());
create policy p_directors_all on inventory_items for all using (is_director()) with check (is_director());
create policy p_directors_all on sales for all using (is_director()) with check (is_director());
create policy p_directors_all on commission_payments for all using (is_director()) with check (is_director());
create policy p_directors_all on expenses for all using (is_director()) with check (is_director());
create policy p_directors_all on ledger_entries for all using (is_director()) with check (is_director());

create policy p_agent_own_sales on sales for select
  using (agent_id in (select id from agents where email = auth.jwt() ->> 'email'));
create policy p_agent_own_comm on commission_payments for select
  using (agent_id in (select id from agents where email = auth.jwt() ->> 'email'));

-- ---------- SEED DEFAULT ENTITIES ----------
insert into entities (code, name, kind, status, commission_rate) values
  ('SSN-HOLD', 'Silent Strides Network Ltd', 'holding', 'active', 0.10),
  ('SSN-PROD', 'SSN Product Sales', 'subsidiary', 'active', 0.10),
  ('SSN-LOG',  'SSN Logistics', 'subsidiary', 'planned', 0.10),
  ('SSN-TECH', 'SSN Digital', 'subsidiary', 'planned', 0.10)
on conflict (code) do nothing;
