---
name: vite-6
description: Use when configuring Vite, setting up plugins, handling env variables, or troubleshooting build/dev issues
---

# Vite 6 Best Practices

## Core Concepts

- **Dev server**: Native ES modules, instant HMR, no bundling in dev
- **Build**: Rolldown bundler, optimized static assets
- **`index.html`**: Entry point (not in `public/`), part of module graph
- **Config**: `vite.config.ts` — extend via plugins

## Project Structure

```
├── index.html              # Entry point (root, not public/)
├── vite.config.ts          # Vite configuration
├── public/                 # Static assets (copied as-is)
│   ├── _headers            # Cloudflare headers
│   └── _routes.json        # SPA fallback
├── src/
│   ├── main.tsx            # React entry (referenced from index.html)
│   └── ...
└── package.json
```

## Essential Config

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 3000, host: true },
  build: { outDir: 'dist' },
});
```

## Environment Variables

- Prefix with `VITE_` to expose to client code
- Access via `import.meta.env.VITE_*`
- `.env` files: `.env`, `.env.local`, `.env.[mode]`
- **Never** commit `.env` with real secrets

```ts
const url = import.meta.env.VITE_SUPABASE_URL;
```

## Plugin Conventions

- React: `@vitejs/plugin-react`
- Tailwind: `@tailwindcss/vite` (not PostCSS in v4)
- Plugins go in `plugins: []` array

## Dev vs Build

| Aspect | Dev | Build |
|--------|-----|-------|
| Bundling | None (ESM) | Full bundle |
| HMR | Instant | N/A |
| Target | `esnext` | Baseline Widely Available |
| CSS | Native | Processed |

## Common Patterns

### Lazy loading

```tsx
const Spreadsheet = lazy(() => import('./components/Spreadsheet'));
```

### Path aliases (if configured)

```ts
// vite.config.ts
resolve: { alias: { '@': '/src' } }
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Putting `index.html` in `public/` | Move to project root |
| Using `process.env` | Use `import.meta.env` |
| Forgetting `VITE_` prefix | Env vars must start with `VITE_` |
| Not clearing `.env` secrets | Check `.gitignore` |
| Using PostCSS for Tailwind v4 | Use `@tailwindcss/vite` plugin |
