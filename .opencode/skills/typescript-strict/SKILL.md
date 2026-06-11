---
name: typescript-strict
description: Use when writing TypeScript with strict mode — covers type patterns, narrowing, utility types, and avoiding `any`
---

# TypeScript Strict Mode Patterns

## Core Rules

1. **No `any`** — use `unknown` and narrow
2. **Strict null checks** — always handle `null`/`undefined`
3. **Explicit returns** — functions should have return types when non-obvious
4. **Prefer `interface` for objects** — `type` for unions/primitives

## Type Narrowing

### Discriminated unions

```ts
type Result =
  | { status: 'ok'; data: unknown }
  | { status: 'error'; message: string };

function handle(result: Result) {
  if (result.status === 'ok') {
    // TypeScript knows: result.data
  } else {
    // TypeScript knows: result.message
  }
}
```

### Type guards

```ts
function isString(val: unknown): val is string {
  return typeof val === 'string';
}
```

### `satisfies` operator (TS 4.9+)

```ts
const config = {
  port: 3000,
  host: 'localhost',
} satisfies Record<string, string | number>;
// config.port is `number`, not `string | number`
```

## Utility Types

| Type | Purpose | Example |
|------|---------|---------|
| `Partial<T>` | All props optional | `{ name?: string }` |
| `Required<T>` | All props required | `{ name: string }` |
| `Pick<T, K>` | Subset of props | `Pick<User, 'id' \| 'name'>` |
| `Omit<T, K>` | Remove props | `Omit<User, 'password'>` |
| `Record<K, V>` | Key-value map | `Record<string, number>` |
| `Readonly<T>` | Immutable props | `Readonly<State>` |
| `ReturnType<F>` | Function return type | `ReturnType<typeof getData>` |
| `Parameters<F>` | Function params | `Parameters<typeof save>` |
| `Extract<T, U>` | Union subset | `Extract<'a' \| 'b', 'a'>` |
| `Exclude<T, U>` | Union minus | `Exclude<'a' \| 'b', 'a'>` |

## Common Patterns

### Props with children

```tsx
interface CardProps {
  title: string;
  children: React.ReactNode;
}
```

### Event handlers

```tsx
function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
  e.preventDefault();
}
```

### Refs

```tsx
const inputRef = useRef<HTMLInputElement>(null);
```

### Generic components

```tsx
function List<T extends { id: string }>({
  items,
  renderItem,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}) {
  return <>{items.map(renderItem)}</>;
}
```

### Strict state

```tsx
const [state, setState] = useState<{
  columns: Column[];
  rows: Row[];
  loading: boolean;
}>({
  columns: [],
  rows: [],
  loading: true,
});
```

## Avoiding `any`

### Replace `any` with `unknown`

```ts
// ❌
function parse(input: any) { return input.foo; }

// ✅
function parse(input: unknown) {
  if (typeof input === 'object' && input !== null && 'foo' in input) {
    return (input as { foo: string }).foo;
  }
}
```

### Use `@ts-expect-error` sparingly

```ts
// Only when integrating with untyped libraries
// @ts-expect-error — library lacks types
import legacy from 'old-lib';
```

## Strict tsconfig

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": false
  }
}
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using `any` for API responses | Define interfaces or use `unknown` |
| Non-null assertion `!` | Add proper null checks |
| `as` type assertions | Use type guards instead |
| Missing `key` prop | Use stable unique IDs |
| Untyped event handlers | Use `React.ChangeEvent<T>` etc. |
