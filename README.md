# Silent Strides Network — Command Center

Multi-subsidiary accounting system: net worth tracking, director equity, commission-based sales agents, and a full double-entry penny ledger.

**Stack:** Next.js 14 (App Router) · Supabase (Postgres + Auth + RLS) · Vercel

---

## 1. Database — Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run, in order:
   - `supabase/migrations/0001_init.sql` — all tables, triggers (auto-commission + auto-ledger mirroring), reporting views, row-level security, and seeds the four entities (holding + Product Sales active; Logistics & Digital planned).
   - `supabase/migrations/0002_commission_payment_trigger.sql` — payout guard (can't pay more than earned) + auto-ledger for commission payouts.
3. **Authentication → Users**: add the two directors' emails. Then insert them as owners:

```sql
insert into owners (full_name, email, role, ownership_pct) values
  ('Director A', 'a@silentstrides.com', 'director', 60),
  ('Director B', 'b@silentstrides.com', 'director', 40);
```

4. Record each director's paid-in capital:

```sql
insert into capital_contributions (owner_id, entity_id, amount, tranche_label)
select o.id, e.id, 60000, 'Tranche 1' from owners o, entities e
where o.email = 'a@silentstrides.com' and e.code = 'SSN-HOLD';
```

5. Add sales agents (after they sign the agreement):

```sql
insert into agents (entity_id, full_name, phone, commission_rate, status, agreement_signed_at)
select id, 'M. Otieno', '+254...', 0.10, 'active', now() from entities where code = 'SSN-PROD';
```

## 2. App — local

```bash
cp .env.example .env.local   # fill in your Supabase URL + keys
npm install
npm run dev                  # http://localhost:3000
```

## 3. Deploy — Vercel

1. Push this folder to GitHub/GitLab.
2. [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. **Settings → Environment Variables**: add the three variables from `.env.example` (get values from Supabase → Settings → API).
4. Deploy. Vercel auto-builds Next.js; no extra config needed.

## How money flows through the system

| Event | What happens automatically |
|---|---|
| Director injects capital | `capital_contributions` row → **ledger entries** (cash debit / capital credit) → equity totals update |
| Agent signs agreement | `agents` row (status `pending` → `active` once signed) |
| Stock received (Inventory page) | `inventory_items.qty_on_hand` increases → **ledger entries** (inventory debit / cash credit) |
| Stock count adjusted | quantity corrected → ledger entries at unit cost (inventory ↔ cogs) |
| Sale recorded (Sales page) | `sales` row → commission computed from agent's rate → **four ledger entries** written (cash, revenue, COGS, commission payable) |
| Commission paid (Agents page) | `commission_payments` row → **ledger entries** (payable debit / cash credit) → DB trigger blocks overpayment |
| Expense logged (Expenses page) | `expenses` row → **ledger entries** (expense debit / cash credit) → hits subsidiary P&L |

## Pages

| Route | What it does |
|---|---|
| `/dashboard` | Group net worth, cash, revenue, commissions payable, subsidiary P&L bars, recent ledger |
| `/subsidiaries` | Per-business P&L: revenue, COGS, commissions, opex, net profit |
| `/equity` | Directors' ownership %, paid-in capital, contribution history |
| `/ledger` | Full double-entry ledger, filterable by entity |
| `/sales` | Record a sale (agent commission auto-accrues), recent sales with net-to-company |
| `/agents` | Agent balances (earned/paid/payable) + one-click commission payouts |
| `/inventory` | Stock register, add items, stock in, count adjustments, low-stock alerts |
| `/expenses` | Record expenses by account, auto-posted to ledger |
| `/setup` | Add directors, agents, subsidiaries, and record capital — no SQL needed |
| `/login` | Supabase email/password sign-in (middleware protects all other routes) |

## Brand

- Navy `#082138` — structure, sidebar, primary surfaces
- Gold `#AE8E4D` — accents, active states, highlights
- Background `#F7F6F2` — soft off-white (not too dark, not too light)
- Logo: `public/logo.jpg` — the original, unmodified

## Adding a new subsidiary later

```sql
insert into entities (code, name, kind, status, commission_rate)
values ('SSN-AGRI', 'SSN Agri Trade', 'subsidiary', 'active', 0.08);
```

It instantly appears in overview, subsidiaries, ledger filters, and P&L — no code changes needed.
