# 🔍 Relatório de Auditoria — FinanSpreadOS

**Data:** 11/06/2026
**Projeto:** `/opt/data/gastos.jlds.app.br`
**Stack:** React 19 · TypeScript 5.8 · Vite 6.2 · Tailwind CSS v4 · Supabase · Drizzle ORM (types only)
**Build:** ✅ 0 errors (tsc --noEmit + eslint)
**Testes:** ✅ 58/58 passando (8 suites)

---

## Índice

1. [Dependências & Versões](#1-dependências--versões)
2. [Arquitetura & Componentes](#2-arquitetura--componentes)
3. [Tipagem TypeScript](#3-tipagem-typescript)
4. [Segurança (Supabase RLS & Auth)](#4-segurança)
5. [Performance](#5-performance)
6. [Acessibilidade](#6-acessibilidade)
7. [Testes](#7-testes)
8. [Config & CI/CD](#8-config--cicd)
9. [SQL / Supabase Migrations](#9-sql--supabase-migrations)
10. [Dead Code & Imports Não Usados](#10-dead-code)
11. [Boas Práticas React 19 & Tailwind v4](#11-boas-práticas-react-19--tailwind-v4)
12. [Resumo de Prioridades](#12-resumo-de-prioridades)

---

## 1. Dependências & Versões

### ✅ Versões principais atualizadas

| Pacote | Versão Atual | Última (minor) | Status |
|---|---|---|---|
| react | ^19.0.1 | 19.2.7 | ⚠️ atrás |
| react-dom | ^19.0.1 | 19.2.7 | ⚠️ atrás |
| vite | ^6.2.3 | 6.4.3 | ⚠️ atrás |
| vitest | ^3.2.1 | 3.2.6 | ⚠️ atrás |
| @supabase/supabase-js | ^2.108.1 | ~2.110+ | ✅ |
| tailwindcss | ^4.1.14 | 4.3.0 | ⚠️ atrás |
| typescript | ~5.8.2 | 5.9.3 | ⚠️ atrás |
| motion | ^12.23.24 | 12.40.0 | ⚠️ atrás |

### ❌ Pacotes não utilizados (devDependencies)

**Status:** ❌ Problema
**Descrição:** `autoprefixer` e `esbuild` estão listados como devDependencies mas não são usados. O Tailwind CSS v4 via `@tailwindcss/vite` gerencia autoprefixação internamente. O Vite já inclui o esbuild como dependência interna.

**Recomendação:** Remover `autoprefixer` e `esbuild` do `package.json`
**Prioridade:** Baixa

### ⚠️ `vite` duplicado

**Status:** ⚠️ Pode melhorar
**Descrição:** `vite` aparece tanto em `dependencies` quanto em `devDependencies`. Também `@tailwindcss/vite`, `@vitejs/plugin-react` e `vite` estão em `dependencies` quando deveriam estar em `devDependencies` (ferramentas de build).

**Recomendação:** Mover `vite`, `@tailwindcss/vite`, `@vitejs/plugin-react` e `motion` para `devDependencies`. Remover a entrada duplicada de `vite` em `devDependencies`.
**Prioridade:** Média

### ⚠️ Dependência faltando: `pg-query-emscripten`

**Status:** ⚠️ Pode melhorar
**Descrição:** O script `scripts/validate-sql.mjs` importa `pg-query-emscripten` que não está no `package.json`. Funciona apenas se instalado globalmente.

**Recomendação:** Adicionar `pg-query-emscripten` como devDependency.
**Prioridade:** Baixa

---

## 2. Arquitetura & Componentes

### ✅ Estrutura Geral

```
src/
├── main.tsx              → Entry point (StrictMode + ErrorBoundary + AuthProvider)
├── App.tsx               → Layout principal, KPI cards, mês, tema
├── components/
│   ├── Spreadsheet.tsx   → Tabela principal (612 linhas)
│   ├── CellRenderer.tsx  → Renderiza célula individual
│   ├── KPICard.tsx       → Cartões de resumo financeiro
│   ├── AddColumnModal.tsx
│   ├── DeleteColumnModal.tsx
│   ├── ColumnSettingsMenu.tsx
│   ├── Toast.tsx
│   └── ErrorBoundary.tsx
├── contexts/
│   └── AuthContext.tsx    → Auth + session management
├── hooks/
│   ├── useSpreadsheetData.ts  → Load/save/sync data
│   └── useRealtime.ts         → Supabase realtime subscriptions
├── lib/
│   ├── supabase.ts       → Client setup + mock fallback
│   ├── dataAccess.ts     → CRUD operations
│   └── tableNames.ts     → Dynamic table name builder
├── pages/
│   └── Auth.tsx          → Login page (Magic Link OTP)
├── utils/                → Pure utility functions
│   ├── cellFormat.ts, csv.ts, dateCoercion.ts, debounce.ts,
│   ├── financeHelper.ts, format.ts, monthUtils.ts,
│   ├── storage.ts, toast.ts
└── constants.ts, types.ts, database.types.ts, index.css
```

### ✅ Fluxo de Dados

- **Unidirecional**: App → Spreadsheet (props down), callbacks (events up)
- **Estado centralizado**: `useSpreadsheetData` hook gerencia colunas/linhas/sync
- **Persistência**: Supabase via `dataAccess.ts`, debounced saves (500ms)
- **Realtime**: `useRealtime.ts` subscribe via Supabase Realtime channels
- **Histórico/Undo**: Gerenciado no próprio App via `history` state + `currentIndex`

### ✅ Boa Separação de Responsabilidades

- Componentes de apresentação (CellRenderer, KPICard) separados dos de container (Spreadsheet, App)
- Lógica de negócio em hooks customizados
- Utilidades puras e testáveis em `utils/`

### ⚠️ Spreadsheet muito grande (612 linhas)

**Status:** ⚠️ Pode melhorar
**Descrição:** O componente `Spreadsheet.tsx` tem 612 linhas e acumula toolbar, tabela, modais, CSV import/export, e toda a lógica de edição inline. Idealmente seria quebrado em subcomponentes menores.

**Recomendação:** Extrair a toolbar em `SpreadsheetToolbar.tsx`, a lógica de edição inline em `useInlineEdit.ts`, e o footer em `SpreadsheetFooter.tsx`.
**Prioridade:** Média

---

## 3. Tipagem TypeScript

### ✅ Configuração TypeScript

- `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` — ✅
- Path alias `@/*` configurado — ✅
- `skipLibCheck: true` — aceitável para performance de build

### ❌ Tipos Supabase desatualizados e parciais

**Status:** ❌ Problema
**Descrição:** `database.types.ts` contém apenas as tabelas `rows_2026_05` a `rows_2026_08` hardcoded. Como o app cria tabelas dinâmicas (`rows_YYYY_MM`) via função SQL, o TypeScript não tem visibilidade de tipos para meses arbitrários. Além disso, as relações entre tabelas estão todas como `[]` (vazias).

**Recomendação:** Usar o Supabase CLI (`supabase gen types typescript --linked`) para gerar tipos atualizados. Alternativamente, criar um tipo genérico `MonthTable` que aceita parâmetro de mês, ou usar JSONB diretamente sem tipagem por tabela (já que o schema é idêntico entre meses).
**Prioridade:** Alta

### ❌ Uso excessivo de `as` casting

**Status:** ❌ Problema
**Descrição:** Em `dataAccess.ts`, múltiplos `as` casts bypassam o TypeScript:
```typescript
r.column_id as string
r.name as string
r.type as Column['type']
r.options as string[] | undefined
r.data as Row['data']
```

**Recomendação:** Usar `zod` ou parser de validação, ou criar funções `type guard`. Pelo menos adicionar verificações runtime para não propagar dados inconsistentes.
**Prioridade:** Média

### ⚠️ Mock do Supabase com `as unknown as`

**Status:** ⚠️ Pode melhorar
**Descrição:** Em `supabase.ts` linha 46, o mock object é `as unknown as ReturnType<typeof createClient>`, o que desativa completamente a checagem de tipos para o fallback offline.

**Recomendação:** Criar uma interface ou tipo parcial que cubra apenas os métodos usados, ou usar `Partial<...>` com verificações.
**Prioridade:** Baixa

### ✅ Types definidos corretamente

- `Column`, `Row`, `RowData`, `HistoryState` em `types.ts` — ✅
- `ColumnType` é union type `'text' | 'number' | 'select' | 'date'` — ✅
- `SyncStatus` como union type — ✅
- `ToastData` bem definido — ✅
- Component props com interfaces — ✅

---

## 4. Segurança

### ✅ RLS (Row Level Security) - Correto

Todas as tabelas têm RLS ativado:
- `profiles` — SELECT/UPDATE apenas own user
- `user_columns` — ALL com CHECK auth.uid() = user_id
- `month_registry` — ALL com CHECK auth.uid() = user_id
- `rows_*` — políticas individuais SELECT/INSERT/UPDATE/DELETE (criadas dinamicamente na migration 005)

### ✅ Funções SQL seguras

- Migration 005 alterou `ensure_month_table` e `ensure_month_registry` de `SECURITY DEFINER` para `SECURITY INVOKER` (correto)
- Validação de formato de `month_key` com regex na migration 005
- Autenticação verificada via `auth.uid()` dentro das funções

### ✅ Histórico de segurança corrigido

- Migration 003 criou `POLICY "Enable insert for authenticated users" ... WITH CHECK (true)` — permissiva demais
- Migration 004 removeu esta policy — **corrigido**
- Migration 005 substituiu `SECURITY DEFINER` por `SECURITY INVOKER` — **corrigido**

### ✅ Auth via Magic Link (OTP)

- Login seguro via Supabase Auth com magic link
- Nenhuma senha armazenada no frontend
- Sessão gerenciada via `onAuthStateChange`

### ⚠️ Erro de autenticação exposto ao usuário

**Status:** ⚠️ Pode melhorar
**Descrição:** Em `AuthContext.tsx` linha 37, o erro retornado é `error?.message` da Supabase, que pode conter detalhes internos.

**Recomendação:** Mapear erros conhecidos para mensagens amigáveis em português antes de exibir ao usuário.
**Prioridade:** Baixa

---

## 5. Performance

### ✅ Pontos positivos

- `useMemo` para `filteredRowsByMonth`, `filteredRows`, `calculateSummary`, `dateColId` — ✅
- `lazy()` + `Suspense` para Spreadsheet e Auth — ✅
- Debounce de 500ms para saves no Supabase — ✅
- Virtualização não necessária (dados financeiros pessoais, poucas linhas)
- Chunks separados para `@supabase/supabase-js` e `motion` no build — ✅

### ❌ `syncIcon` recriado a cada render

**Status:** ❌ Problema
**Descrição:** Em `App.tsx` (linhas 117-123), o objeto literal `syncIcon` é recriado em toda renderização. Embora seja pequeno, é uma má prática.

**Recomendação:** Mover o objeto `syncIcon` para fora do componente (constante de módulo) ou usar `useMemo`.
**Prioridade:** Baixa

### ⚠️ `updateData` muda referência frequentemente

**Status:** ⚠️ Pode melhorar
**Descrição:** O callback `updateData` em App.tsx depende de `history` e `currentIndex` que mudam a cada alteração de dados. Isso significa que `Spreadsheet` recebe uma nova referência de `onDataChange` em toda edição, potencialmente causando re-render desnecessário do componente lazy.

**Recomendação:** Separar a lógica de histórico do callback de dados. Usar `useRef` para o histórico e apenas atualizar o state de histórico em um useEffect separado. Ou usar `useCallback` com `setHistory(prev => ...)` para evitar dependência direta.
**Prioridade:** Média

### ⚠️ Edição inline sem memoização

**Status:** ⚠️ Pode melhorar
**Descrição:** Cada célula na tabela é re-renderizada quando qualquer linha é editada. O `CellRenderer` não está envolvido em `React.memo`, e o Spreadsheet não virtualiza linhas.

**Recomendação:** Envolver `CellRenderer` em `React.memo` com comparação shallow dos props. Para tabelas com mais de 100 linhas, considerar virtualização (tanstack virtual).
**Prioridade:** Média

---

## 6. Acessibilidade

### ✅ Acertos

- `lang="pt-BR"` no HTML — ✅
- Modo escuro com `prefers-color-scheme` support — ✅
- `:focus-visible` outline customizado — ✅
- `aria-label` nos modais e botões de configuração — ✅
- Botões com `title` e `aria-label` nas ações de linha — ✅

### ❌ Tabela com `role="button"` em `<td>`

**Status:** ❌ Problema
**Descrição:** Em `Spreadsheet.tsx` (linha 499), cada `<td>` tem `role="button"` e `tabIndex={0}`. Isso é semanticamente incorreto — células de tabela não são botões. Leitores de tela podem anunciar incorretamente o conteúdo.

**Recomendação:** Remover `role="button"` e `tabIndex={0}` do `<td>`. Em vez disso, colocar um `<button>` interno (ou `<div role="button">`) para a ação de edição, e usar navegação por Tab entre células via um `onFocus` handler ou um sistema de grid navigation.
**Prioridade:** Alta

### ❌ Input de busca sem `aria-label`

**Status:** ❌ Problema
**Descrição:** O input de busca em Spreadsheet (linha 348-355) usa `placeholder` como única descrição. Não tem `aria-label` ou `aria-labelledby`.

**Recomendação:** Adicionar `aria-label="Buscar na planilha"` no input de busca.
**Prioridade:** Alta

### ⚠️ Botões sem `aria-label` suficiente

**Status:** ⚠️ Pode melhorar
**Descrição:** Botões de navegação de mês, tema e logout em App.tsx têm apenas `title` mas alguns não têm `aria-label`. Leitores de tela podem não ler `title` em todos os contextos.

**Recomendação:** Adicionar `aria-label` consistente em todos os botões de ícone — ex: `aria-label="Mês anterior"`, `aria-label="Trocar tema"`, `aria-label="Sair"`.
**Prioridade:** Média

### ✅ Toast com `role="status"`?

O Toast não tem `role="status"` ou `aria-live`. Para notificações não críticas é aceitável, mas idealmente deveria ter `role="status"` e `aria-live="polite"`.
**Prioridade:** Baixa

---

## 7. Testes

### ✅ Cobertura Geral

**Status:** ✅ Bom
**Descrição:** 58 testes em 8 suites, todos passando. Cobre:

| Suite | Tests | Status |
|---|---|---|
| `financeHelper.test.ts` | 15 | ✅ |
| `Spreadsheet.test.tsx` | 10 | ✅ |
| `cellFormat.test.ts` | 8 | ✅ |
| `monthUtils.test.ts` | 7 | ✅ |
| `useSpreadsheetData.test.ts` | 6 | ✅ |
| `csv.test.ts` | 6 | ✅ |
| `debounce.test.ts` | 3 | ✅ |
| `tableNames.test.ts` | 3 | ✅ |

### ⚠️ Sem testes de componente para:
- `Auth.tsx` (tela de login)
- `KPICard.tsx`
- `ColumnSettingsMenu.tsx`
- `AddColumnModal.tsx` / `DeleteColumnModal.tsx`
- `Toast.tsx`
- `ErrorBoundary.tsx`

**Status:** ⚠️ Pode melhorar
**Descrição:** Testes de componente ausentes para páginas e componentes de UI importantes. A cobertura de hooks é parcial (apenas `useSpreadsheetData`).

**Recomendação:** Adicionar testes para `Auth.tsx` (fluxo de login), `KPICard.tsx` (renderização condicional) e `ErrorBoundary.tsx` (captura de erro).
**Prioridade:** Média

### ⚠️ Sem teste para `useRealtime.ts`

**Status:** ⚠️ Pode melhorar
**Descrição:** O hook `useRealtime` que gerencia subscriptions do Supabase não tem testes.

**Recomendação:** Adicionar testes unitários com mocks do Supabase channel.
**Prioridade:** Baixa

---

## 8. Config & CI/CD

### ✅ Pontos positivos

- CI configurado (GitHub Actions) — ✅
- Executa `npm test` e `npm run lint` — ✅
- Node 20 com cache de npm — ✅
- ESLint + TypeScript configurados — ✅
- Pre-commit hook para vazar secrets — ✅ (scripts/pre-commit.mjs)
- Validador SQL (scripts/validate-sql.mjs) — ✅

### ❌ CI não executa `npm run build`

**Status:** ❌ Problema
**Descrição:** O pipeline CI (`.github/workflows/ci.yml`) executa apenas `npm test` e `npm run lint`. Não executa `npm run build`, o que significa que erros de build só são detectados em produção.

**Recomendação:** Adicionar `npm run build` ao pipeline CI.
**Prioridade:** Alta

### ⚠️ Sem verificação de cobertura

**Status:** ⚠️ Pode melhorar
**Descrição:** Não há threshold mínimo de cobertura configurado no vitest, nem relatório gerado no CI.

**Recomendação:** Configurar `coverage.thresholds` no `vitest.config.ts` e adicionar step de coverage no CI.
**Prioridade:** Média

### ⚠️ `vitest.config.ts` inclui `tailwindcss()` plugin

**Status:** ⚠️ Pode melhorar
**Descrição:** O `vitest.config.ts` carrega `@tailwindcss/vite` como plugin. Isso não é necessário para testes e pode aumentar o tempo de setup.

**Recomendação:** Remover `tailwindcss()` do `vitest.config.ts` (apenas `react()` é necessário para transformar JSX).
**Prioridade:** Baixa

---

## 9. SQL / Supabase Migrations

### ✅ Estrutura de Migrations

5 migrations bem organizadas, nomeadas sequencialmente:

| Migration | Descrição | Status |
|---|---|---|
| 001_initial.sql | Schema inicial + RLS + funções + trigger | ✅ |
| 002_fix_trigger.sql | Corrige trigger handle_new_user com ON CONFLICT | ✅ |
| 003_fix_profiles_rls.sql | Adiciona INSERT policy (permissiva) | ⚠️ |
| 004_security_fix.sql | Remove INSERT policy insegura | ✅ |
| 005_harden_month_functions.sql | Valida month_key, SECURITY INVOKER, policies granulares | ✅ |

### ⚠️ Abordagem de tabelas dinâmicas

**Status:** ⚠️ Pode melhorar
**Descrição:** O design de criar uma tabela `rows_YYYY_MM` para cada mês é funcional mas tem implicações:
- TypeScript não consegue tipar adequadamente
- Cada novo mês requer uma chamada a `ensure_month_table()`
- RLS policies precisam ser recriadas (embora isto seja feito dinamicamente)
- Realtime subscriptions precisam ser refeitas quando o mês muda
- Complexidade no frontend para gerenciar tabelas dinâmicas

**Alternativa:** Usar uma única tabela `rows` com uma coluna `month TEXT` particionada por mês (ou com índice em `(user_id, month)`). Isso simplifica drasticamente o modelo, melhora a tipagem e reduz a complexidade.

**Recomendação:** Avaliar migração para tabela única com índice em `(user_id, month)`. É uma mudança significativa mas traria benefícios de manutenção a longo prazo.
**Prioridade:** Média

### ✅ Publicações Realtime

- `profiles`, `user_columns`, `month_registry` adicionadas à publicação — ✅
- Tabelas dinâmicas também se adicionam — ✅

### ⚠️ `ensure_month_registry` chamado dentro de `ensure_month_table`

Na migration 005, a função `ensure_month_table` faz `insert into public.month_registry` no final. A função `ensure_month_registry` separada faz a mesma coisa. Há duplicação lógica — ambas as funções podem ser mantidas por compatibilidade, mas a versão 005 já unifica as operações.
**Prioridade:** Baixa

---

## 10. Dead Code

### ❌ Animação `value-pulse` não utilizada

**Status:** ❌ Problema
**Descrição:** `index.css` (linhas 56-60) define `@keyframes value-pulse` mas a animação nunca é referenciada por nenhum componente.

**Recomendação:** Remover o bloco `@keyframes value-pulse` ou implementá-lo nos KPICards se desejado.
**Prioridade:** Baixa

### ✅ Sem dead code em JavaScript/TypeScript

**Status:** ✅ Bom
**Descrição:** Não foram encontrados imports não utilizados nos componentes (verificação visual cruzada + depcheck confirma que todos os imports de `lucide-react` e outras libs são utilizados).

### ✅ Todos os componentes são usados

- `ErrorBoundary` → usado em `main.tsx`
- `AuthContext` → usado em `main.tsx`
- Todos os hooks são consumidos
- Todos os utils são chamados

---

## 11. Boas Práticas React 19 & Tailwind v4

### ✅ React 19 — Acertos

- Uso de `StrictMode` — ✅
- `lazy()` + `Suspense` para code splitting — ✅
- `useCallback`/`useMemo` nos lugares certos — ✅
- `useRef` para elementos DOM e valores mutáveis — ✅
- `useTransition` não é necessário (sem estados de carregamento complexos) — ✅

### ⚠️ React 19 — Pode melhorar

**Status:** ⚠️ Pode melhorar
**Descrição:** App.tsx usa `useState` para histórico com `updateData` tendo `history` como dependência. Isso causa nova referência de callback a cada alteração. Em React 19, a função de updater `setHistory(prev => ...)` poderia eliminar a dependência.

**Recomendação:** Usar `setHistory(prev => ...)` no `updateData` para remover `history` das dependências do `useCallback`.
**Prioridade:** Média

### ✅ Tailwind CSS v4 — Acertos

- Uso de `@tailwindcss/vite` plugin — ✅ (abordagem correta para v4)
- `@import "tailwindcss"` — ✅
- `@theme` directive para custom fonts — ✅
- Dark mode via classe (`dark:`) — ✅
- Design responsivo com `md:`, `lg:` breakpoints — ✅

### ⚠️ Tailwind v4 — Observações

**Status:** ✅ Bom
**Descrição:** O uso de Tailwind está consistente e seguindo as práticas da v4. Classes utilitárias bem aplicadas. Única observação: `autoprefixer` é desnecessário pois a Vite plugin já cuida disso.

### ⚠️ `console.error` no ErrorBoundary

**Status:** ⚠️ Pode melhorar
**Descrição:** `ErrorBoundary.tsx` linha 23 usa `console.error` que é permitido pela regra `no-console: warn`, mas em produção erros deveriam ser reportados a um serviço de monitoramento.

**Recomendação:** Integrar Sentry ou similar, ou ao menos logar estruturadamente.
**Prioridade:** Baixa

---

## 12. Resumo de Prioridades

### 🔴 Alta Prioridade

| Item | Categoria | Descrição |
|---|---|---|
| ❌ Tipos Supabase desatualizados | Tipagem | Hardcoded apenas 4 meses, sem relações |
| ❌ `role="button"` em `<td>` | Acessibilidade | Semântica incorreta de tabela |
| ❌ Input busca sem `aria-label` | Acessibilidade | Campo de busca invisível para leitores de tela |
| ❌ CI sem `npm run build` | CI/CD | Erros de build não detectados |
| ❌ `updateData` recria referência | Performance | Re-render desnecessários do Spreadsheet |

### 🟡 Média Prioridade

| Item | Categoria | Descrição |
|---|---|---|
| ⚠️ Spreadsheet muito grande (612 linhas) | Arquitetura | Extrair toolbar, footer, lógica de edição |
| ⚠️ `as` casting excessivo em dataAccess | Tipagem | Bypass de type safety |
| ⚠️ Células sem `React.memo` | Performance | Re-render em cascata |
| ⚠️ Faltam testes de componente | Testes | Auth, KPICard, ErrorBoundary sem testes |
| ⚠️ Sem threshold de cobertura | CI/CD | Cobertura não monitorada |
| ⚠️ Tabelas dinâmicas vs tabela única | SQL/Database | Complexidade elevada versus alternativa mais simples |
| ⚠️ `vite`/plugins em dependencies | Dependências | DevDependencies vs Dependencies |

### 🟢 Baixa Prioridade

| Item | Categoria | Descrição |
|---|---|---|
| ❌ Animação `value-pulse` não usada | Dead Code | Remover ou implementar |
| ⚠️ `autoprefixer` e `esbuild` não usados | Dependências | Remover |
| ⚠️ `vitest.config.ts` com `tailwindcss()` | Config | Plugin desnecessário para testes |
| ⚠️ `console.error` no ErrorBoundary | Boas Práticas | Sentry ou serviço de erro |
| ⚠️ Mock Supabase `as unknown as` | Tipagem | Tipo frágil no fallback |
| ⚠️ Erro de auth exposto | Segurança | Mapear mensagens de erro |
| ⚠️ Toast sem `role="status"` | Acessibilidade | Acesso para leitores de tela |

---

## Estatísticas do Projeto

| Métrica | Valor |
|---|---|
| Arquivos fonte (src/) | 30 |
| Linhas de código (src/) | ~3.900 |
| Componentes | 10 |
| Testes | 58 (8 suites) |
| Dependências produção | 8 |
| DevDependencies | 12 |
| Migrations SQL | 5 |
| GitHub Actions workflows | 1 |
| Scripts | 2 |

---

*Relatório gerado automaticamente em 11/06/2026. Build verificado: `tsc --noEmit` + `eslint` + `vitest run` — 0 erros, 0 warnings.*
