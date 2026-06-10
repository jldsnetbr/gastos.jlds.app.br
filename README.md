# FinanSpreadOS

Planilha inteligente de controle financeiro pessoal estilo Excel, com autenticação via Supabase e persistência multi-tabela por mês.

## Stack

- **Frontend:** React 19 + Vite 6 + TypeScript estrito + Tailwind CSS 4
- **Backend:** Supabase (Auth + Postgres + Realtime)
- **Testes:** Vitest (unit/integration) + Playwright (E2E)
- **Lint/format:** ESLint + `tsc --noEmit`

## Setup

```bash
# 1. Instalar dependências
npm install

# 2. Variáveis de ambiente
cp .env.example .env
# Edite o .env e preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
#  (Settings > API no painel do seu projeto Supabase)

# 3. Subir o dev server
npm run dev      # http://localhost:3000

# 4. Rodar testes
npm test         # vitest (unit/integration)
npm run test:e2e # playwright (E2E, requer dev server)

# 5. Lint
npm run lint     # tsc --noEmit + eslint
```

## Segurança

- **Nunca** commite o arquivo `.env` (já está no `.gitignore`).
- Antes do primeiro `git push`, **audite as policies RLS** do Supabase (veja `supabase/migrations/`).
- O hook `pre-commit` bloqueia commits que contenham `.env` ou chaves Supabase.

## Estrutura

```
src/
├── App.tsx                 # Orquestração: views, history, theme
├── components/             # UI: Spreadsheet, modais, KPI, Toast, ErrorBoundary
├── contexts/               # AuthContext (sessão Supabase)
├── hooks/                  # useSpreadsheetData, useRealtime, useDateCoercion, ...
├── lib/                    # dataAccess (CRUD), supabase client, tableNames
├── pages/                  # Auth (OTP magic link)
├── utils/                  # financeHelper, csv, storage, debounce, monthUtils
├── types.ts                # Tipos compartilhados
├── constants.ts            # Chaves de storage, defaults
└── main.tsx                # Bootstrap (StrictMode + ErrorBoundary + AuthProvider)
```

## Decisões Arquiteturais

Veja `CONTEXT.md` para detalhes completos. Resumo:

1. **Multi-tabela por mês**: cada mês tem sua própria tabela `rows_YYYY_MM` no Postgres, evitando degradação com volume.
2. **Coerção temporal estrita**: se o mês ativo é `2026-06`, datas fora desse mês são re-coagidas para `2026-06-XX`.
3. **Sem modais bloqueantes**: `window.alert/confirm` foram substituídos por Toasts animados e confirmação in-line.
