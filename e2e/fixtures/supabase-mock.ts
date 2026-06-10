import { Page } from '@playwright/test';
import { SESSION } from './session';

const SESSION_KEY = 'sb-dezecaktayggegiihiaf-auth-token';

const TABLES: Record<string, any[]> = {
  user_columns: [],
  month_registry: [],
  rows_2026_06: [
    { user_id: SESSION.user.id, row_id: 'seed-1', data: { data: '2026-06-01', descricao: 'Salário Mensal', tipo: 'Entrada', valor: 5500, categoria: 'Trabalho' } },
    { user_id: SESSION.user.id, row_id: 'seed-2', data: { data: '2026-06-03', descricao: 'Aluguel', tipo: 'Saída', valor: 1350, categoria: 'Moradia' } },
  ],
};

export async function installSupabaseMock(page: Page) {
  await page.addInitScript(
    ({ session, key }) => {
      localStorage.setItem(key, JSON.stringify(session));
    },
    { session: SESSION, key: SESSION_KEY }
  );

  await page.route('**/supabase.co/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/auth/v1/')) {
      if (url.includes('/otp')) {
        return route.fulfill({ status: 200, body: JSON.stringify({ data: {}, error: null }) });
      }
      if (url.includes('/token') || url.includes('/session') || url.includes('/user')) {
        return route.fulfill({ status: 200, body: JSON.stringify(SESSION) });
      }
      return route.fulfill({ status: 200, body: JSON.stringify({ data: {}, error: null }) });
    }

    if (url.includes('/rest/v1/rpc/')) {
      return route.fulfill({ status: 200, body: JSON.stringify(null) });
    }

    if (url.includes('/rest/v1/')) {
      const tableMatch = url.match(/\/rest\/v1\/([^?]+)/);
      const table = tableMatch?.[1] ?? 'unknown';
      if (!TABLES[table]) TABLES[table] = [];

      if (method === 'GET') {
        return route.fulfill({ status: 200, body: JSON.stringify(TABLES[table]) });
      }

      if (method === 'DELETE') {
        const query = url.split('?')[1] || '';
        const params = new URLSearchParams(query);
        const col = params.get('column_id') || params.get('row_id');
        if (col) {
          TABLES[table] = TABLES[table].filter((r: any) => r.column_id !== col && r.row_id !== col);
        } else {
          const inClause = url.match(/in\.\(([^)]+)\)/);
          if (inClause) {
            const ids = inClause[1].split(',').map((s) => s.trim());
            TABLES[table] = TABLES[table].filter(
              (r: any) => !ids.includes(r.column_id) && !ids.includes(r.row_id)
            );
          }
        }
        return route.fulfill({ status: 200, body: JSON.stringify([]) });
      }

      try {
        const postData = route.request().postDataJSON();
        if (Array.isArray(postData)) {
          for (const row of postData) {
            const existing = TABLES[table].findIndex(
              (r: any) => r.row_id === row.row_id || r.column_id === row.column_id
            );
            if (existing >= 0) {
              TABLES[table][existing] = { ...TABLES[table][existing], ...row };
            } else {
              TABLES[table].push(row);
            }
          }
        }
      } catch { /* noop */ }
      return route.fulfill({ status: 200, body: JSON.stringify([]) });
    }
    return route.fulfill({ status: 200, body: '{}' });
  });
}
