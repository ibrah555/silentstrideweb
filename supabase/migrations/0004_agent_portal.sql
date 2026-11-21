-- ============================================================
-- 0004: Agent Portal Permissions
-- Allows sales agents to view their own profile and assigned subsidiary
-- ============================================================

-- 1. All authenticated users (directors & agents) can read entities/subsidiaries
drop policy if exists p_auth_read_entities on entities;
create policy p_auth_read_entities on entities for select
  to authenticated using (true);

-- 2. Sales agents can read their own agent record
drop policy if exists p_agent_own_profile on agents;
create policy p_agent_own_profile on agents for select
  using (email = auth.jwt() ->> 'email');

-- 3. Sales agents can read inventory items for their subsidiary
drop policy if exists p_agents_read_inventory on inventory_items;
create policy p_agents_read_inventory on inventory_items for select
  using (entity_id in (select entity_id from agents where email = auth.jwt() ->> 'email'));
