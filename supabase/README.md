# FinanSpreadOS — Supabase

## Estrutura

```
supabase/
└── migrations/
    ├── 001_initial.sql                  # schema base + RLS (já aplicado)
    ├── 002_fix_trigger.sql              # fix no trigger handle_new_user
    ├── 003_fix_profiles_rls.sql         # ajustes em RLS do profiles
    ├── 004_security_fix.sql             # remove policy permissiva
    └── 005_harden_month_functions.sql   # valida regex + SECURITY INVOKER
```

## Como aplicar

### Validação local (sem DB)

```bash
node scripts/validate-sql.mjs
```

### Opção 1 — Supabase CLI (recomendado)

```bash
# 1. Login
npx supabase login

# 2. Link ao projeto (precisa do project-ref e DB password)
npx supabase link --project-ref <seu-project-ref>
# Ele vai pedir SUPABASE_DB_PASSWORD na primeira execução

# 3. Aplicar migrations (somente as novas)
npx supabase db push

# 4. Auditar
npx supabase db lint
```

### Opção 2 — Manual via SQL Editor

1. Abra **Supabase Dashboard > SQL Editor**.
2. Cole e execute `005_harden_month_functions.sql` (as outras 4 já estão aplicadas).

## O que está protegido

- `user_columns` — RLS `auth.uid() = user_id` em SELECT/INSERT/UPDATE/DELETE
- `month_registry` — RLS `auth.uid() = user_id` em ALL
- `rows_YYYY_MM` (criadas dinamicamente) — RLS idêntica, aplicada em `ensure_month_table`
- Realtime — apenas `authenticated` recebe eventos; policies se aplicam automaticamente
- `ensure_month_table` valida regex `^\d{4}-(0[1-9]|1[0-2])$` antes de criar

## Teste manual de RLS

```sql
-- Como user A (autenticado), insere uma linha
insert into user_columns values (auth.uid(), 'col_teste', 'Teste', 'text', null, 0);

-- Como user B (em outra sessão), tenta ler
select * from user_columns; -- deve retornar apenas as do user B
```
