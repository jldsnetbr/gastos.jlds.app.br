---
name: supabase-react
description: Use when integrating Supabase with React — covers auth, database queries, RLS, realtime subscriptions, and error handling
---

# Supabase + React Integration

## Client Setup

```ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

## Auth Patterns

### Magic Link (passwordless)

```tsx
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
});
```

### Session management

```tsx
const { data: { session } } = await supabase.auth.getSession();
const { data: { user } } = await supabase.auth.getUser();
```

### Sign out

```tsx
await supabase.auth.signOut();
```

### Auth state listener

```tsx
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      setUser(session?.user ?? null);
    }
  );
  return () => subscription.unsubscribe();
}, []);
```

## Database Queries

### Select

```ts
const { data, error } = await supabase
  .from('table_name')
  .select('col1, col2')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### Insert

```ts
const { data, error } = await supabase
  .from('table_name')
  .insert({ col1: 'value', user_id: userId });
```

### Upsert

```ts
const { data, error } = await supabase
  .from('table_name')
  .upsert(rows, { onConflict: 'user_id,row_id' });
```

### Delete

```ts
const { error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', rowId);
```

### RPC (stored functions)

```ts
const { error } = await supabase.rpc('function_name', {
  param1: value,
});
```

## Row Level Security (RLS)

### Enable RLS on every table

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Policy: user can only access own data

```sql
CREATE POLICY "Users can CRUD own data"
  ON table_name
  FOR ALL
  USING (auth.uid() = user_id);
```

### Policy: authenticated read

```sql
CREATE POLICY "Authenticated users can read"
  ON table_name
  FOR SELECT
  TO authenticated
  USING (true);
```

## Realtime Subscriptions

### Subscribe to table changes

```ts
const channel = supabase
  .channel('table-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'table_name', filter: `user_id=eq.${userId}` },
    (payload) => {
      console.log('Change:', payload.eventType, payload.new);
    }
  )
  .subscribe();

// Cleanup
supabase.removeChannel(channel);
```

### Cleanup on unmount

```tsx
useEffect(() => {
  const channel = subscribeToChanges();
  return () => {
    supabase.removeChannel(channel).catch(() => {});
  };
}, []);
```

## Error Handling

```ts
const { data, error } = await supabase.from('table').select('*');
if (error) {
  console.warn('Query failed:', error.message);
  // Fallback or retry
}
```

## Common Patterns

### Data access layer

```ts
// lib/dataAccess.ts
export async function loadData(userId: string) {
  const { data, error } = await supabase
    .from('table')
    .select('*')
    .eq('user_id', userId);
  if (error) return null;
  return data;
}
```

### Debounced save

```ts
const debouncedSave = useMemo(
  () => debounce(async (rows: Row[]) => {
    await supabase.from('table').upsert(rows);
  }, 500),
  []
);
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| No RLS on tables | Enable RLS + create policies |
| Exposing service role key | Use anon key only in client |
| Not handling errors | Always check `error` return |
| Subscribing without cleanup | Return unsubscribe in useEffect |
| Querying without `.eq('user_id', ...)` | Filter by authenticated user |
