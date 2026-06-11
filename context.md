# Contexto de Desenvolvimento (Context) - FinanSpreadOS

Este arquivo serve como manual técnico e de arquitetura para futuros desenvolvedores ou agentes que realizarem manutenções no **FinanSpreadOS**.

---

## 1. Arquitetura do Projeto e Fluxo de Dados

A aplicação é modularizada e estruturada da seguinte forma:

```
├── /index.html
├── /metadata.json
├── /package.json
├── /eslint.config.js
├── /src
│   ├── App.tsx                     # Componente principal responsável pelas views, KPIs e histórico
│   ├── types.ts                    # Declaração dos tipos estritos TypeScript
│   ├── index.css                   # Definição e importação do Tailwind e fontes
│   ├── constants.ts                # Constantes do app (STORAGE_KEYS, DEFAULT_MONTH, etc.)
│   ├── components
│   │   ├── KPICard.tsx             # Card de dados para os KPIs no topo
│   │   └── Spreadsheet.tsx         # Tabela de Planilha estilo Excel interativa
│   ├── hooks
│   │   ├── useRealtime.ts          # Subscription Supabase Realtime por mês
│   │   ├── useSpreadsheetData.ts   # Gerenciamento de dados com debounce + realtime
│   │   └── useDateCoercion.ts      # Coerção estrita de datas ao mês selecionado
│   ├── utils
│   │   ├── financeHelper.ts        # Cálculo matemático purificado dos resumos
│   │   ├── csv.ts                  # Import/export CSV com crypto.randomUUID
│   │   ├── debounce.ts             # Função debounce genérica
│   │   ├── storage.ts              # Persistência localStorage
│   │   └── monthUtils.ts           # Utilitários de mês
│   └── lib
│       ├── supabase.ts             # Cliente Supabase
│       ├── dataAccess.ts           # Camada de acesso a dados (remoto + local)
│       └── tableNames.ts           # Nomes de tabelas
├── /e2e
│   ├── spreadsheet.spec.ts        # 15 testes E2E
│   └── fixtures
│       ├── session.ts              # Sessão mockada
│       └── supabase-mock.ts        # Mock Supabase com tabelas em memória
└── /__tests__                      # Testes unitários (84 total, 10 arquivos)
```

### O Modelo de Dados Estruturado (`src/types.ts`)
* **Column**: `id: string`, `name: string`, `type: 'text' | 'number' | 'select' | 'date'`, `options?: string[]`.
* **Row**: `id: string`, `month: string`, `data: Record<string, string | number>`.
* **HistoryState**: `columns: Column[]`, `rows: Row[]`.

---

## 2. Decisões Arquiteturais e Otimizações

### 1. Separação de Dados Mensal por Tabela (Multi-table por Mês)
Cada mês possui sua própria chave `rows_table_YYYY-MM` no armazenamento do navegador.
* **Benefício**: Evita que o app fique lento após anos de dados acumulados, carregando apenas as dezenas de linhas do mês sob análise direta.
* **Migração Legada**: Script transacional no `useEffect` do `App.tsx` que detecta chaves monolíticas antigas e as distribui nas chaves individuais.

### 2. Coerção Temporal Estrita (Strict Temporal Constraint)
Se o mês selecionado for `2026-06`, o usuário só pode visualizar, editar e criar lançamentos desse mês. Datas fora do período são ajustadas automaticamente via `coerceDateInMonth`.

### 3. Substituição de Modais Bloqueantes (Anti-Window Alert)
* **Confirmação In-Line** para deleção de dados perigosos (excluir coluna).
* **Toast animado nativo não-bloqueante** (`showToast`) com auto-dismiss em 4 segundos.

### 4. ESLint com Flat Config
`eslint.config.js` usando `@eslint/js` + `typescript-eslint`. Regras:
- `no-unused-vars`: error
- `no-explicit-any`: warn
- `no-console`: warn

### 5. Debounce com useMemo (em vez de useRef)
O `debouncedSave` em `useSpreadsheetData` usa `useMemo` em vez de `useRef().current`, com cleanup no unmount.

### 6. Memoização de Cálculos
`calculateSummary` e filtro de linhas por mês são envolvidos em `useMemo` no `App.tsx` para evitar recálculos desnecessários.

### 7. Geração de IDs com crypto.randomUUID()
`csv.ts` usa `crypto.randomUUID()` em vez de `Date.now()` para IDs únicos.

### 8. Cleanup Robusto de Realtime
`useRealtime` encadeia `.catch(() => {})` em todas as chamadas de `removeChannel`.

---

## 3. Stack e Comandos

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server Vite |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint + TypeScript check |
| `npm test` | Vitest (unit) |
| `npx playwright test` | E2E tests |

- **React 19** + **Vite** + **Tailwind 4** + **TypeScript strict**
- **Vitest** para unit tests (84 testes, 10 suites)
- **Playwright** para E2E (15 testes)
- **Supabase** para auth + persistência remota, **localStorage** para fallback

---

## 4. Diretrizes de Desenvolvimento Futuro

* **Nunca exponha credenciais no Frontend**: `.env` com credenciais Supabase reais protegido por `.gitignore`.
* **Estilização de Cores**: Use Tailwind CSS direto de forma monocromática (`slate`, `rose`, `emerald`).
* **Linter**: Rode `npm run lint` antes de submeter alterações. TypeScript strict mode ativo.
* **Windows**: Scripts no `package.json` devem ser cross-platform (evitar `&&`, `rm -rf`).
* **E2E Mock**: `supabase-mock.ts` usa sessão mockada + interceptação de rede — sem backend real.
* **Testes**: Novos hooks e funções utilitárias devem ter cobertura unitária em `__tests__/`.
