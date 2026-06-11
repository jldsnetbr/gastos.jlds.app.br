---
name: eslint-flat-config
description: Use when configuring ESLint with flat config (eslint.config.js) — covers TypeScript integration, rule customization, and plugin setup
---

# ESLint Flat Config

## Setup

```js
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.config.*'],
  }
);
```

## Rule Levels

| Level | Effect |
|-------|--------|
| `'off'` or `0` | Disabled |
| `'warn'` or `1` | Warning (no exit code) |
| `'error'` or `2` | Error (exit code 1) |

## Common Rules

```js
rules: {
  // TypeScript
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/consistent-type-imports': 'error',

  // General
  'no-unused-vars': 'off', // Handled by TS
  'no-console': 'warn',
  'no-debugger': 'error',
  'prefer-const': 'error',
  'eqeqeq': ['error', 'always'],
}
```

## React + TypeScript

```js
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  // ... base configs
  {
    files: ['src/**/*.{tsx}'],
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
    settings: {
      react: { version: 'detect' },
    },
  }
);
```

## Ignoring Files

```js
export default tseslint.config(
  { ignores: ['dist/', 'coverage/', '*.config.*'] },
  // ... other configs
);
```

## Integrating with TypeScript

The `lint` script should run both:

```json
{
  "scripts": {
    "lint": "tsc --noEmit && eslint \"src/**/*.{ts,tsx}\""
  }
}
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using `.eslintrc.*` | Migrate to `eslint.config.js` |
| `no-unused-vars` with TS | Use `@typescript-eslint/no-unused-vars` instead |
| Forgetting `ignores` | Add `dist/`, `node_modules/` |
| Not running `tsc` separately | ESLint doesn't do full type checking |
