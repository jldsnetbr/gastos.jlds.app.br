// Valida a sintaxe dos arquivos .sql em supabase/migrations usando pg-query.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'migrations');
const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();

const pgQuery = (await import('pg-query-emscripten')).default;
const wasm = await pgQuery();
let totalErr = 0;
for (const f of files) {
  const sql = readFileSync(join(MIGRATIONS_DIR, f), 'utf8');
  try {
    const result = wasm.parse(sql);
    const stmts = result?.parse_tree?.stmts ?? [];
    if (result?.error) throw new Error(result.error.message ?? 'parse error');
    console.log(`OK  ${f}  (${stmts.length} statements)`);
  } catch (err) {
    totalErr++;
    console.error(`ERR ${f}:`, err?.message ?? err);
  }
}
process.exit(totalErr > 0 ? 1 : 0);
