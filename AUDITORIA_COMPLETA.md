# Auditoria Completa — FinanSpreadOS

**Data:** 11/06/2026
**Branch:** `upgrade-visual`
**Commit:** `dfd8d80`
**Total:** 3.740 linhas TypeScript/TSX, 31 arquivos fonte, 58 testes

---

## 🔴 Críticos (devem ser corrigidos imediatamente)

### C-1. Arquivo `database.types.ts` duplicado — versão antiga está ativa
- **Arquivo raiz:** `src/database.types.ts` (351 linhas, old)
- **Arquivo lib:** `src/lib/database.types.ts` (85 linhas, new)
- O `import type { Database } from '../database.types'` em `supabase.ts` resolve para **src/database.types.ts** (o antigo!) porque está em `src/lib/` e `..` vai pra `src/`
- **Impacto:** As tabelas `rows_2026_*` aparecem no tipo antigo, poluindo o autocomplete. O tipo novo tem helper `Tables<>` e `TablesInsert<>` que o antigo não tem
- **Correção:** deletar `src/database.types.ts` e mudar import em `supabase.ts` para `'./database.types'`

### C-2. Nome da chave anon legado
- **Arquivo:** `src/vite-env.d.ts` — define `VITE_SUPABASE_ANON_KEY`
- **Arquivo:** `src/lib/supabase.ts` — usa `VITE_SUPABASE_ANON_KEY`
- Supabase **depreciou `anon`/`service_role`** — novas chaves são `sb_publishable_xxx`
- **Correção:** renomear env var para `VITE_SUPABASE_PUBLISHABLE_KEY` e atualizar ambos os arquivos + deploy (Cloudflare)
- **⚠️ Não quebra nada agora**, mas pode quebrar até final de 2026

### C-3. CI não tem `npm run build`
- **Arquivo:** `.github/workflows/ci.yml`
- O CI atual só roda `npm test` + `npm run lint`, **não verifica se o build de produção funciona**
- Já corrigido localmente mas não enviado (token sem `workflow` scope)
- **Correção:** adicionar manualmente `- run: npm run build` após `npm ci`

---

## 🟠 Alta Prioridade

### A-1. `removeAllChannels()` no logout — chamada após `signOut()`
- **Arquivo:** `src/contexts/AuthContext.tsx:38`
- ```ts
  const signOut = async () => {
    await supabase.auth.signOut();
    supabase.removeAllChannels(); // ✅ correto
  };
  ```
- **✅ OK** — já corrigido na iteração anterior. Apenas registrar que está correto.

### A-2. `subscribeToMonth` cleanup — retorna função unsubscribe
- **Arquivo:** `src/hooks/useRealtime.ts`
- O hook retorna `() => supabase.removeChannel(channel)` que é chamado no cleanup do useEffect
- **✅ OK**

### A-3. Canais Realtime com nomes de tabela dinâmica
- **Arquivo:** `src/hooks/useRealtime.ts`
- `supabase.channel(tableName)` usa o nome da tabela dinâmica como nome de canal
- ⚠️ **Risco de conflito** se o mesmo usuário abrir duas abas com o mesmo mês — ambos usam o mesmo nome de canal
- **Correção:** usar nome único: `supabase.channel(\`${tableName}:${userId}\`)`
- **Severidade:** Média (duas abas do mesmo mês podem se cancelar)

### A-4. Tipagem `as any` ainda presente para tabelas dinâmicas
- **Arquivo:** `src/lib/dataAccess.ts:67` — `(supabase as any).from(tableName)`
- **Arquivo:** `src/hooks/useRealtime.ts:31` — `payload.new as Record<string, unknown>`
- Necessário para tabelas criadas em runtime — **aceitável**, mas documentado como débito técnico
- **Correção futura:** Criar interface genérica `DynamicRowTable` e substituir `as any` por ela

### A-5. Navegação por Tab sem suporte a Shift+Tab
- **Arquivo:** `src/components/Spreadsheet.tsx:108-121`
- `Tab` navega para próxima coluna, mas **Shift+Tab** (voltar) não é implementado
- Usuário que usa Tab para navegar pode ficar preso se passar da coluna desejada
- **Correção:** adicionar `e.shiftKey` check e navegar para coluna anterior

---

## 🟡 Média Prioridade

### M-1. Spreadsheet com 614 linhas — componente muito grande
- `src/components/Spreadsheet.tsx`: **614 linhas**, 20+ estados, 15+ callbacks
- Ideal: <300 linhas por componente
- **Sugestão:** Extrair Toolbar, Table (tbody), Footer em subcomponentes
- **Risco:** baixo, mas afeta manutenibilidade

### M-2. To-do items na interface `useSpreadsheetData` com stale closures
- `setColumns: (cols) => { setColumns(cols); updateRemote(cols, rows); }` (linha 137)
- `setRows: (r) => { setRows(r); updateRemote(columns, r); }` (linha 138)
- ⚠️ `updateRemote` captura `columns`/`rows` do closure — se chamado rapidamente, pode usar estado **desatualizado**
- O debounce de 500ms mitiga parcialmente, mas ainda é um race condition teórico

### M-3. Dependência `@types/node` não utilizada
- `@types/node` está em devDependencies mas não é usada (app é frontend-only)
- Remove ~2MB desnecessários do `node_modules`

### M-4. Duplicação de `format.ts` e `cellFormat.ts`
- Ambos lidam com formatação de valores financeiros
- `cellFormat.ts` tem `formatNumberCell` que usa `Intl.NumberFormat` inline (re-cria o formatter a cada chamada)
- `format.ts` tem `formatCurrency` que usa `Intl.NumberFormat` singleton (correto)
- **Correção:** `formatNumberCell` deveria usar `formatCurrency` de `format.ts`

### M-5. CSS: scrollbar customizado não funciona em Firefox
- `#excel-spreadsheet-table tbody::-webkit-scrollbar` é prefixo WebKit
- Firefox usa `scrollbar-width: thin` e `scrollbar-color`
- **Correção:** adicionar regras equivalentes para Firefox

### M-6. `context/Provider` — React 19 permite `<Context>` direto
- **Arquivo:** `src/main.tsx`
- `<AuthProvider>` usa `createContext` + Provider wrapper — que é o padrão correto
- Mas o App.tsx não usa `lazy` + `Suspense` de forma ideal (Auth é lazy mas carrega sempre)

---

## 🟢 Baixa Prioridade / Boas Práticas

### B-1. Cobertura de testes
| Domínio | Testes | Cobertura estimada |
|:--------|:------:|:------------------:|
| `financeHelper` | 17 | ✅ Excelente |
| `useSpreadsheetData` | 17 | 🟠 Funções principais cobertas |
| `Spreadsheet` (component) | 13 | 🟠 Renderização, faltam interações |
| `cellFormat` | 9 | ✅ Bom |
| `csv` | 8 | ✅ Bom |
| `monthUtils` | 8 | ✅ Bom |
| `debounce` | 6 | ✅ Bom |
| `tableNames` | 4 | ✅ Suficiente |

**Faltam testes para:** AuthContext, CellRenderer, KPiCard, AddColumnModal, DeleteColumnModal, toast, dateCoercion, format, storage

### B-2. Componentes sem memo desnecessário
- Vários componentes pequenos (Toast, CellRenderer, KPICard) renderizam em toda mudança de estado no Spreadsheet
- `CellRenderer` é chamado **por célula** a cada render — potencial gargalo com 100+ linhas
- **Sugestão:** `React.memo(CellRenderer)` com comparação shallow

### B-3. `catch` silenciosos
- `src/lib/dataAccess.ts`: vários `catch {}` sem log
- `src/hooks/useSpreadsheetData.ts`: catch silencioso em `fetchAndSet`
- Em produção, erros silenciosos dificultam debugging
- **Sugestão:** `console.warn()` ou integração com Sentry

### B-4. ESLint: regra `no-explicit-any` como `warn`
- Configurado como `warn` — não bloqueia CI
- **Sugestão:** subir para `error` após refatorar os `as any` necessários para tabelas dinâmicas

### B-5. `useCallback` e `useMemo` extensivos
- Spreadsheet tem **17 `useCallback`/`useMemo`** — muitos são desnecessários
- Ex: `handleCenterSpreadsheet` é chamado 1x por clique, não precisa de `useCallback`
- Ex: `showLocalToast` é `useCallback` mas só usado em handlers que já são memoizados
- **Over-memoization** aumenta o peso do bundle e complexidade cognitiva

### B-6. Constante `DEFAULT_MONTH = '2026-06'` hardcoded
- **Arquivo:** `src/constants.ts:5`
- Mês default fixo em Junho/2026 — idealmente dinâmico: mês corrente
- **Sugestão:** `const DEFAULT_MONTH = new Date().toISOString().slice(0, 7)`

### B-7. Chave de sessão `persistSession: true` — sem configuração explícita
- **Arquivo:** `src/lib/supabase.ts`
- `persistSession: true` é o default — mas não configuramos explicitamente para localStorage vs sessionStorage
- Em dispositivos compartilhados, a sessão fica persistida no localStorage
- **Sugestão:** adicionar opção de "lembrar por 30 dias" vs "sessão temporária"

### B-8. `apikey` como header — nova publishable key usa header diferente
- SDK do Supabase já gerencia isso automaticamente
- **Apenas monitorar** a migração para `sb_publishable_xxx`

---

## 📊 Resumo

### Checklist de Produção (da skill supabase-best-practices)

| # | Item | Status |
|:-:|:-----|:------:|
| 1 | RLS habilitado em todas as tabelas | ✅ (nas políticas) |
| 2 | `TO authenticated` + `auth.uid() IS NOT NULL` | ✅ |
| 3 | Índices em colunas de RLS | ✅ (nas migrations) |
| 4 | `removeAllChannels()` no logout | ✅ |
| 5 | Secret keys nunca no frontend | ✅ |
| 6 | Grants explícitos (mínimo necessário) | ✅ |
| 7 | Tipos gerados via `supabase gen types` | ⚠️ Duplicado (C-1) |
| 8 | `npm run build` no CI | ❌ (C-3) |
| 9 | `analyze` periódico | ❓ (não verificado) |
| 10 | Security Advisor no Dashboard | ❓ (não verificado) |
| 11 | `set search_path = ''` em functions security definer | ✅ |
| 12 | Default privileges revogados | ❓ (não verificado) |
| 13 | Chaves `sb_publishable_xxx` | ❌ (C-2) |

### Prioridades de Correção

```
🔴 C-1: database.types duplicado             → 5 min
🔴 C-2: Renomear env var publishable key     → 15 min + redeploy
🔴 C-3: npm run build no CI                  → 2 min (precisa de token com workflow scope)

🟠 A-3: Nome único de canal Realtime          → 2 min
🟠 A-5: Shift+Tab na planilha                → 10 min

🟡 M-1: Extrair componentes do Spreadsheet   → 1-2h
🟡 M-2: Stale closure em setColumns/setRows  → 30 min (usar useRef+useCallback)
🟡 M-3: Remover @types/node                  → 2 min
🟡 M-4: Unificar formatCurrency/cellFormat   → 15 min
🟡 M-5: Firefox scrollbar                    → 5 min

🟢 B-1: Expandir cobertura de testes         → 2-3h
🟢 B-2: React.memo(CellRenderer)             → 5 min
🟢 B-3: Logs em catch silenciosos            → 10 min
🟢 B-4: Subir no-explicit-any para error     → 1-2h (refatorar tabelas dinâmicas)
🟢 B-6: DEFAULT_MONTH dinâmico               → 2 min
```
