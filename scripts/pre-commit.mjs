#!/usr/bin/env node
// Bloqueia commits que contenham .env, chaves Supabase ou segredos comuns.
import { execSync } from 'node:child_process';

const BLOCKED = [
  /^\.env(\.|$)/,
  /VITE_SUPABASE_(URL|ANON_KEY)\s*=\s*\S+/i,
  /sb_publishable_[A-Za-z0-9_-]+/,
  /sb_secret_[A-Za-z0-9_-]+/,
  /eyJ[A-Za-z0-9_-]{20,}\.eyJ/, // JWT genérico
];

const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

const violations = [];
for (const file of staged) {
  for (const pattern of BLOCKED) {
    if (pattern.test(file)) {
      violations.push(`Arquivo bloqueado: ${file}`);
      continue;
    }
  }
  if (BLOCKED.some((p) => p.test(file))) continue;
  // Para arquivos .env*, checar conteúdo
  if (/^\.env/.test(file)) {
    const content = execSync(`git show ":0:${file}"`, { encoding: 'utf8' });
    for (const pattern of BLOCKED.slice(1)) {
      if (pattern.test(content)) {
        violations.push(`Conteúdo bloqueado em ${file}`);
        break;
      }
    }
  }
}

if (violations.length > 0) {
  console.error('\n[pre-commit] Commit bloqueado:');
  for (const v of violations) console.error('  -', v);
  console.error('\nRemova os segredos e tente novamente.\n');
  process.exit(1);
}
process.exit(0);
