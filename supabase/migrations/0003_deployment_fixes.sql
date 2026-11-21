-- ============================================================
-- 0003: deployment fixes
-- ============================================================

-- 1. Allow commission payments without linking to a specific sale
--    (agents accumulate commission across many sales, payouts are bulk)
alter table commission_payments alter column sale_id drop not null;

-- 2. Rebuild v_agent_balances to include entity_name directly
--    (PostgREST cannot follow FK relationships through views)
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
