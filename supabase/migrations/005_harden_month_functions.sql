-- Migration: 005_harden_month_functions
-- Purpose: valida o formato de month_key antes de criar tabela/registro
--          e remove SECURITY DEFINER (mantém INVOKER para que RLS se aplique
--          uniformemente com as policies do usuário).
-- Idempotente.

create or replace function public.ensure_month_table(month_key text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  table_name  text;
  uid         uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  if month_key is null or month_key !~ '^\d{4}-(0[1-9]|1[0-2])$' then
    raise exception 'Invalid month_key format: %', month_key;
  end if;

  table_name := 'rows_' || replace(month_key, '-', '_');

  execute format(
    'create table if not exists public.%I (
       user_id    uuid        not null references auth.users (id) on delete cascade,
       row_id     text        not null,
       data       jsonb       not null default ''{}''::jsonb,
       created_at timestamptz not null default now(),
       primary key (user_id, row_id)
     )', table_name);

  execute format('alter table public.%I enable row level security', table_name);

  -- Policies por operação (mais granular que ALL)
  execute format('drop policy if exists "rows_select_own" on public.%I', table_name);
  execute format('drop policy if exists "rows_insert_own" on public.%I', table_name);
  execute format('drop policy if exists "rows_update_own" on public.%I', table_name);
  execute format('drop policy if exists "rows_delete_own" on public.%I', table_name);

  execute format(
    'create policy "rows_select_own" on public.%I for select to authenticated
       using (auth.uid() = user_id)', table_name);
  execute format(
    'create policy "rows_insert_own" on public.%I for insert to authenticated
       with check (auth.uid() = user_id)', table_name);
  execute format(
    'create policy "rows_update_own" on public.%I for update to authenticated
       using (auth.uid() = user_id) with check (auth.uid() = user_id)', table_name);
  execute format(
    'create policy "rows_delete_own" on public.%I for delete to authenticated
       using (auth.uid() = user_id)', table_name);

  begin
    execute format('alter publication supabase_realtime add table public.%I', table_name);
  exception when duplicate_object then
    null;
  end;

  insert into public.month_registry (user_id, month)
  values (uid, month_key)
  on conflict (user_id, month) do nothing;
end;
$$;

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
