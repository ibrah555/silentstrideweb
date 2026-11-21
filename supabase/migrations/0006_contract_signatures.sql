-- 0006_contract_signatures.sql
-- Add electronic contract signature and national ID fields to agents

alter table agents add column if not exists id_number text;
alter table agents add column if not exists signature_data text;
alter table agents add column if not exists signed_name text;
alter table agents add column if not exists director_signature_data text;
alter table agents add column if not exists director_signed_at timestamptz;

grant all on all tables in schema public to postgres, anon, authenticated, service_role;
