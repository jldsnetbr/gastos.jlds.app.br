---
name: react-19
description: Use when writing React 19 components, hooks, or patterns — covers hooks, rendering, composition, performance, and common mistakes
---

# React 19 Best Practices

## Core Principles

1. **Components are pure functions** — same inputs → same output, no side effects during render
2. **Hooks at top level only** — never inside conditions, loops, or nested functions
3. **Lift state up** — shared state lives in the closest common ancestor
4. **Effects are escape hatches** — prefer event handlers over effects for data flow

## Hooks Quick Reference

| Hook | Purpose | When to Use |
|------|---------|-------------|
| `useState` | Local state | Simple state that triggers re-render |
| `useReducer` | Complex state logic | Multiple related state transitions |
| `useContext` | Read context | Avoid prop drilling |
| `useRef` | Mutable ref (no re-render) | DOM access, timers, previous values |
| `useMemo` | Cache computation | Expensive calculations with stable deps |
| `useCallback` | Cache function | Pass to optimized children |
| `useTransition` | Non-blocking updates | Heavy UI updates that shouldn't block input |
| `useDeferredValue` | Defer rendering | Non-critical UI parts |
| `useEffect` | Sync with external systems | Network, DOM, subscriptions |
| `useLayoutEffect` | Measure layout | Read DOM before browser repaint |
| `useEffectEvent` | Non-reactive callback | Read latest props from effects without re-triggering |

## Component Patterns

### Prefer composition over props

```tsx
// ✅ Good — flexible composition
<Card>
  <CardHeader>Title</CardHeader>
  <CardContent>Body</CardContent>
</Card>

// ❌ Bad — prop drilling
<Card title="Title" body="Body" footer="Footer" />
```

### Colocate state with usage

```tsx
// ✅ Good — state lives where it's used
function SearchResults() {
  const [query, setQuery] = useState('');
  // ...
}

// ❌ Bad — unnecessary lifting
function App() {
  const [query, setQuery] = useState('');
  return <SearchResults query={query} onQueryChange={setQuery} />;
}
```

### Extract custom hooks for reusable logic

```tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

## Performance Rules

### When to use `useMemo`

```tsx
// ✅ Expensive computation
const sorted = useMemo(() => items.sort(compareFn), [items]);

// ❌ Simple derivation — useMemo overhead > benefit
const doubled = useMemo(() => count * 2, [count]);
```

### When to use `useCallback`

```tsx
// ✅ Passed to optimized child or used as effect dep
const handleSubmit = useCallback((data: FormData) => {
  submit(data);
}, []);

// ❌ Only used in this component
const handleClick = useCallback(() => setCount(c => c + 1), []);
```

### When to use `useTransition`

```tsx
function SearchPage() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value); // Urgent: update input
    startTransition(() => {
      setSearchResults(filterResults(e.target.value)); // Non-urgent
    });
  };

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending ? <Spinner /> : <Results />}
    </>
  );
}
```

## Effects — Do's and Don'ts

### Do: cleanup functions

```tsx
useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = handleMessage;
  return () => ws.close(); // Always cleanup
}, [url]);
```

### Don't: orchestrate data flow

```tsx
// ❌ Anti-pattern — event handler is better
useEffect(() => {
  setFiltered(items.filter(i => i.active));
}, [items]);

// ✅ Better — derive during render
const filtered = items.filter(i => i.active);
```

### Do: use `useEffectEvent` for non-reactive reads

```tsx
const onNavigate = useEffectEvent((path: string) => {
  analytics.track(path);
});

useEffect(() => {
  onNavigate(currentPath); // Doesn't re-trigger when onNavigate changes
}, [currentPath]);
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using `useEffect` for derived state | Derive during render, no effect needed |
| Missing cleanup in effects | Return cleanup function |
| Inline objects/functions in JSX | `useMemo`/`useCallback` or move outside render |
| `useRef` for state that should trigger render | Use `useState` instead |
| Calling hooks conditionally | Extract into separate component or early return after hook calls |
| Stale closures in effects | Use `useEffectEvent` or include deps |
| `key={Math.random()}` | Use stable IDs |

## File Structure

```
src/
├── components/      # UI components (one per file)
├── hooks/           # Custom hooks (use*.ts)
├── lib/             # External service wrappers
├── utils/           # Pure functions, no React imports
├── types/           # TypeScript type definitions
└── pages/           # Route-level components
```

## Naming Conventions

- Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- Hooks: `use*.ts` (e.g., `useSpreadsheetData.ts`)
- Utils: `camelCase.ts` (e.g., `financeHelper.ts`)
- Types: `PascalCase` interface/type names
- CSS classes: Tailwind utilities, custom classes in `index.css`
