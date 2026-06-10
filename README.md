# FinanSpreadOS

> Planilha inteligente de controle financeiro pessoal estilo Excel — 100% Supabase.

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![Tests](https://img.shields.io/badge/tests-41%20passing-brightgreen)](#testes)

## Features

- 📊 Planilha com colunas customizáveis (texto, número, select, data)
- 💰 Cálculo automático de Entradas / Saídas / Saldo
- 🔐 Auth via Magic Link (Supabase Auth)
- ☁️ Dados isolados por usuário via RLS
- 🔄 Auto-refresh a cada 30s + no foco da janela
- 🌓 Dark mode
- 📥 Import/Export CSV
- ↩️ Undo/Redo (até 50 estados)

## Stack

- React 19 + Vite 6 + TypeScript strict
- Supabase (Auth + Postgres)
- Tailwind CSS 4
- Motion (animações)
- Vitest (unit tests)

## Quick Start

```bash
# 1. Instalar deps
npm install

# 2. Configurar Supabase
cp .env.example .env
# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

# 3. Aplicar migrations
npx supabase db push

# 4. Rodar
npm run dev
# http://localhost:3000
```

## Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | Vite dev server (porta 3000) |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve `dist/` para preview |
| `npm run lint` | TypeScript check + ESLint |
| `npm test` | Roda testes unitários (Vitest) |
| `npm run test:watch` | Vitest em watch mode |

## Estrutura

```
src/
├── App.tsx                    # Componente principal
├── main.tsx                   # Entry point
├── contexts/AuthContext.tsx   # Auth + session
├── hooks/useSpreadsheetData.ts # CRUD de colunas/linhas
├── lib/
│   ├── supabase.ts            # Cliente + mock fallback
│   └── dataAccess.ts          # load/save columns + rows
├── components/
│   ├── Spreadsheet.tsx        # Tabela editável
│   ├── KPICard.tsx            # Cards de resumo
│   ├── Toast.tsx              # Notificações
│   ├── ErrorBoundary.tsx      # Error handling
│   ├── CellRenderer.tsx       # Formatação de células
│   ├── AddColumnModal.tsx
│   ├── DeleteColumnModal.tsx
│   └── ColumnSettingsMenu.tsx
├── utils/
│   ├── financeHelper.ts       # Cálculo de resumo
│   ├── csv.ts                 # Import/export
│   ├── monthUtils.ts          # Navegação de mês
│   ├── dateCoercion.ts        # Coerção para mês selecionado
│   ├── cellFormat.ts          # Formatação de células
│   ├── format.ts              # Moeda (BRL)
│   ├── debounce.ts            # Debounce genérico
│   └── storage.ts             # localStorage (só tema)
└── types.ts

supabase/migrations/           # Schema + RLS
.github/workflows/ci.yml       # CI (lint + test)
```

## Deploy (Cloudflare Pages)

1. Conecte o repositório em [Cloudflare Pages](https://dash.cloudflare.com/?to=/:account/pages)
2. **Build command**: `npm run build`
3. **Build output**: `dist`
4. **Environment variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
5. Ative **SPA Mode** em Settings → General

O projeto já inclui:
- `public/_headers` — CSP, HSTS, security headers
- `public/_routes.json` — SPA fallback

## Segurança

- **CSP** restritivo em `public/_headers`
- **HSTS** com 2 anos + includeSubDomains + preload
- **RLS** em todas as tabelas Supabase (isolamento por `user_id`)
- **SECURITY INVOKER** nas funções RPC
- **Frame-ancestors 'none'** (anti-clickjacking)
- **`.env` protegido** por `.gitignore`
- **Sem localStorage para dados** (apenas tema)

## Testes

- **41 testes** em 7 suites (Vitest)
- Cobertura: hooks, utils, lib

```bash
npm test
```

## CI

GitHub Actions roda `npm test` + `npm run lint` em todo PR (ver `.github/workflows/ci.yml`).
