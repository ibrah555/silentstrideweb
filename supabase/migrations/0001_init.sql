-- ============================================================
-- SILENT STRIDES NETWORK LTD — core schema
-- Multi-subsidiary accounting with commission-based sales agents
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- ENUMS ----------
create type entity_kind as enum ('holding', 'subsidiary');
create type owner_role as enum ('director', 'shareholder', 'investor');
create type agent_status as enum ('pending', 'active', 'suspended', 'terminated');
create type sale_status as enum ('recorded', 'verified', 'paid_out');
create type ledger_account as enum (
  'capital', 'cash', 'inventory', 'revenue', 'cogs',
  'commission_expense', 'commission_payable', 'opex', 'payable', 'receivable'
);

-- ---------- ENTITIES (parent + subsidiaries) ----------
create table entities (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,               -- 'SSN-HOLD', 'SSN-PROD'
  name text not null,
  kind entity_kind not null default 'subsidiary',
  status text not null default 'active' check (status in ('active','planned','dormant')),
  commission_rate numeric(5,4) default 0.10, -- group-wide default, per-agent override below
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

-- ---------- OWNERS / DIRECTORS ----------
create table owners (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text unique not null,
  role owner_role not null default 'director',
  ownership_pct numeric(5,2) not null check (ownership_pct >= 0 and ownership_pct <= 100),
  created_at timestamptz not null default now()
);

-- Capital each owner has actually paid in (can differ from ownership %)
create table capital_contributions (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references owners(id) on delete cascade,
  entity_id uuid not null references entities(id),          -- usually the holding co
  amount numeric(14,2) not null check (amount > 0),
  tranche_label text,                                        -- 'Tranche 1', 'Seed', etc.
  contributed_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------- SALES AGENTS ----------
create table agents (
  id uuid primary key default uuid_generate_v4(),
  entity_id uuid not null references entities(id),           -- which subsidiary they sell for
  full_name text not null,
  phone text,
  email text,
  commission_rate numeric(5,4) not null default 0.10,        -- per-agent override
  status agent_status not null default 'pending',
  agreement_signed_at timestamptz,                           -- the sales agreement contract
  created_at timestamptz not null default now()
);

-- ---------- INVENTORY (products bought for resale) ----------
create table inventory_items (
  id uuid primary key default uuid_generate_v4(),
  entity_id uuid not null references entities(id),
  sku text not null,
  name text not null,
  unit_cost numeric(14,2) not null check (unit_cost >= 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  qty_on_hand int not null default 0 check (qty_on_hand >= 0),
  unique(entity_id, sku)
);

-- ---------- SALES & COMMISSIONS ----------
create table sales (
  id uuid primary key default uuid_generate_v4(),
  entity_id uuid not null references entities(id),
  agent_id uuid references agents(id) on delete set null,
  batch_label text,                                          -- 'Batch #114'
  total_amount numeric(14,2) not null check (total_amount >= 0),
  cogs_amount numeric(14,2) not null default 0 check (cogs_amount >= 0),
  commission_amount numeric(14,2) not null default 0 check (commission_amount >= 0),
  status sale_status not null default 'recorded',
  sold_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table commission_payments (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid not null references sales(id) on delete cascade,
  agent_id uuid not null references agents(id),
  amount numeric(14,2) not null check (amount > 0),
  paid_at timestamptz not null default now()
);

-- ---------- EXPENSES ----------
create table expenses (
  id uuid primary key default uuid_generate_v4(),
  entity_id uuid not null references entities(id),
  account ledger_account not null default 'opex',
  amount numeric(14,2) not null check (amount > 0),
  memo text,
  spent_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------- THE PENNY LEDGER (append-only double-entry) ----------
create table ledger_entries (
  id uuid primary key default uuid_generate_v4(),
  entity_id uuid not null references entities(id),
  entry_date date not null default current_date,
  account ledger_account not null,
  debit numeric(14,2) not null default 0 check (debit >= 0),
  credit numeric(14,2) not null default 0 check (credit >= 0),
  memo text,
  ref_type text,                                             -- 'sale','expense','capital','commission'
  ref_id uuid,
  created_by uuid references owners(id),
  created_at timestamptz not null default now(),
  check (not (debit > 0 and credit > 0))                     -- one side only
);

create index idx_ledger_entity_date on ledger_entries(entity_id, entry_date desc);
create index idx_sales_entity on sales(entity_id, sold_at desc);
create index idx_commissions_agent on commission_payments(agent_id);

-- ---------- HELPER: auto-commission on sale insert ----------
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

create trigger trg_sale_commission before insert on sales
  for each row execute function compute_commission();

-- ---------- HELPER: mirror every sale into the ledger ----------
create or replace function mirror_sale_to_ledger() returns trigger as $$
begin
  -- cash/receivable debit
  insert into ledger_entries(entity_id, entry_date, account, debit, memo, ref_type, ref_id)
  values (new.entity_id, new.sold_at::date, 'cash', new.total_amount,
          coalesce(new.batch_label,'Sale'), 'sale', new.id);
  -- revenue credit
  insert into ledger_entries(entity_id, entry_date, account, credit, memo, ref_type, ref_id)
  values (new.entity_id, new.sold_at::date, 'revenue', new.total_amount,
          coalesce(new.batch_label,'Sale'), 'sale', new.id);
  -- cogs
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

create trigger trg_sale_ledger after insert on sales
  for each row execute function mirror_sale_to_ledger();

-- ---------- REPORTING VIEWS ----------
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

create view v_agent_balances as
select a.id, a.full_name, a.entity_id, a.status,
       coalesce(sum(s.commission_amount),0) as earned,
       coalesce((select sum(cp.amount) from commission_payments cp where cp.agent_id=a.id),0) as paid,
       coalesce(sum(s.commission_amount),0)
         - coalesce((select sum(cp.amount) from commission_payments cp where cp.agent_id=a.id),0) as payable
from agents a
left join sales s on s.agent_id = a.id
group by a.id;

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

-- Directors see everything (map auth.users -> owners.email)
create or replace function is_director() returns boolean as $$
  select exists (
    select 1 from owners o
    where o.email = auth.jwt() ->> 'email'
      and o.role in ('director','shareholder')
  );
$$ language sql stable security definer;

create policy p_directors_all on entities for all using (is_director()) with check (is_director());
create policy p_directors_all on owners for all using (is_director()) with check (is_director());
create policy p_directors_all on capital_contributions for all using (is_director()) with check (is_director());
create policy p_directors_all on agents for all using (is_director()) with check (is_director());
create policy p_directors_all on inventory_items for all using (is_director()) with check (is_director());
create policy p_directors_all on sales for all using (is_director()) with check (is_director());
create policy p_directors_all on commission_payments for all using (is_director()) with check (is_director());
create policy p_directors_all on expenses for all using (is_director()) with check (is_director());
create policy p_directors_all on ledger_entries for all using (is_director()) with check (is_director());

-- Agents: read-only on their own sales & commissions (agent login maps email -> agents.email)
create policy p_agent_own_sales on sales for select
  using (agent_id in (select id from agents where email = auth.jwt() ->> 'email'));
create policy p_agent_own_comm on commission_payments for select
  using (agent_id in (select id from agents where email = auth.jwt() ->> 'email'));

-- ---------- SEED ----------
insert into entities (code, name, kind, status, commission_rate) values
  ('SSN-HOLD', 'Silent Strides Network Ltd', 'holding', 'active', 0.10),
  ('SSN-PROD', 'SSN Product Sales', 'subsidiary', 'active', 0.10),
  ('SSN-LOG',  'SSN Logistics', 'subsidiary', 'planned', 0.10),
  ('SSN-TECH', 'SSN Digital', 'subsidiary', 'planned', 0.10);
