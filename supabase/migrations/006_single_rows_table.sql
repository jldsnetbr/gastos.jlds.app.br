-- Migration: 006_single_rows_table
-- Purpose: Substitui tabelas dinâmicas rows_YYYY_MM por tabela única `rows`
--          com coluna `month` + índice composto (user_id, month).
-- Isso elimina a necessidade de RPCs ensure_month_table/ensure_month_registry,
-- simplifica o frontend (sem `as any`) e melhora a tipagem TypeScript.
-- Idempotente.

-- 1. Criar tabela única `rows`
create table if not exists public.rows (
  id         uuid        default gen_random_uuid() not null primary key,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  row_id     text        not null,
  month      text        not null,
  data       jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, row_id)
);

-- 2. Índice para queries por user_id + mês (essential para performance RLS)
create index if not exists idx_rows_user_month
  on public.rows (user_id, month);

-- 3. RLS
alter table public.rows enable row level security;

-- Policies granulares (mesmo padrão da migration 005)
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'rows' and policyname = 'rows_select_own'
  ) then
    create policy rows_select_own on public.rows
      for select to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'rows' and policyname = 'rows_insert_own'
  ) then
    create policy rows_insert_own on public.rows
      for insert to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'rows' and policyname = 'rows_update_own'
  ) then
    create policy rows_update_own on public.rows
      for update to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'rows' and policyname = 'rows_delete_own'
  ) then
    create policy rows_delete_own on public.rows
      for delete to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

-- 4. Adicionar à publicação Realtime
begin
  alter publication supabase_realtime add table public.rows;
exception when duplicate_object then
  null;
end;

-- 5. Migrar dados das tabelas antigas rows_YYYY_MM (se existirem)
do $$
declare
  old_table text;
  month_key text;
  year_part text;
  month_part text;
begin
  for old_table in
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name ~ '^rows_\d{4}_\d{2}$'
      and table_name != 'rows'
  loop
    -- Extrair YYYY_MM → YYYY-MM
    year_part := split_part(old_table, '_', 2);
    month_part := split_part(old_table, '_', 3);
    month_key := year_part || '-' || month_part;

    -- Migrar dados
    execute format(
      'insert into public.rows (user_id, row_id, month, data, created_at)
       select user_id, row_id, %L, data, created_at
       from public.%I
       on conflict (user_id, row_id) do nothing',
      month_key, old_table
    );

    raise notice 'Migrated data from % → rows (month: %)', old_table, month_key;
  end loop;
end $$;

-- 6. Remover tabelas antigas (opcional, comentado para segurança)
-- Descomente APÓS confirmar que a migração funcionou:
-- do $$
-- declare
--   old_table text;
-- begin
--   for old_table in
--     select table_name
--     from information_schema.tables
--     where table_schema = 'public'
--       and table_name ~ '^rows_\d{4}_\d{2}$'
--       and table_name != 'rows'
--   loop
--     execute format('drop table if exists public.%I', old_table);
--   end loop;
-- end $$;
