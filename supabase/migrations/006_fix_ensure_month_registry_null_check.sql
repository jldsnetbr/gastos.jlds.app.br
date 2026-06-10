-- Migration: 006_fix_ensure_month_registry_null_check
-- Purpose: add auth.uid() null check to ensure_month_registry for consistency
--          with ensure_month_table (migration 005 lines 17-19).
-- Idempotent.

create or replace function public.ensure_month_registry(month_key text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  if month_key is null or month_key !~ '^\d{4}-(0[1-9]|1[0-2])$' then
    raise exception 'Invalid month_key format: %', month_key;
  end if;
  insert into public.month_registry (user_id, month)
  values (uid, month_key)
  on conflict (user_id, month) do nothing;
end;
$$;
