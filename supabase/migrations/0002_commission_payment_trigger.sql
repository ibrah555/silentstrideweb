-- ============================================================
-- 0002: auto-ledger for commission payouts
-- (payouts were handled in the API; this keeps the DB consistent
--  even if someone inserts directly)
-- ============================================================

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

-- Guard: never pay more than earned (payable balance check)
create or replace function check_commission_payout() returns trigger as $$
declare
  earned numeric; paid numeric;
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
