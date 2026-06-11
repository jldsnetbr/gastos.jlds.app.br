---
name: vitest
description: Use when writing or running Vitest tests — covers test structure, mocking, async testing, and React Testing Library patterns
---

# Vitest Best Practices

## Setup

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

## Test Structure

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('useSpreadsheetData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads columns from remote', async () => {
    // Arrange
    vi.mocked(loadColumns).mockResolvedValue(mockColumns);

    // Act
    const { result } = renderHook(() => useSpreadsheetData('user1', '2026-06'));

    // Assert
    await waitFor(() => {
      expect(result.current.columns).toEqual(mockColumns);
    });
  });
});
```

## Naming Conventions

- Files: `*.test.ts` or `*.test.tsx`
- Directories: `__tests__/` colocated with source
- Pattern: `src/hooks/__tests__/useSpreadsheetData.test.ts`

## Matchers

```ts
expect(value).toBe(exact);           // Strict equality
expect(value).toEqual(deep);         // Deep equality
expect(value).toBeTruthy();
expect(value).toBeNull();
expect(array).toContain(item);
expect(string).toMatch(/regex/);
expect(fn).toThrow(Error);
expect(mock).toHaveBeenCalledWith(args);
expect(mock).toHaveBeenCalledTimes(n);
```

## Mocking

### Mock modules

```ts
vi.mock('./dataAccess', () => ({
  loadColumns: vi.fn(),
  saveColumns: vi.fn(),
}));

import { loadColumns } from './dataAccess';
vi.mocked(loadColumns).mockResolvedValue([]);
```

### Mock timers

```ts
vi.useFakeTimers();
vi.advanceTimersByTime(500);
vi.useRealTimers();
```

### Mock fetch/API

```ts
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'test' }),
});
```

## React Testing Library

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('submits form', async () => {
  const user = userEvent.setup();
  render(<MyForm onSubmit={vi.fn()} />);

  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

## Async Testing

```ts
it('loads data async', async () => {
  const { result } = renderHook(() => useData());

  await waitFor(() => {
    expect(result.current.data).not.toBeNull();
  });
});
```

## Coverage

```bash
npx vitest run --coverage
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Testing implementation details | Test user-visible behavior |
| `setTimeout` in tests | Use `vi.useFakeTimers()` |
| Not cleaning up mocks | `vi.clearAllMocks()` in `beforeEach` |
| Using `getBy` without waiting | Use `findBy` or `waitFor` for async |
| Testing too much in one test | One assertion per concept |
