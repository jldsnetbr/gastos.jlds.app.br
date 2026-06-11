import { supabase } from '../lib/supabase';
import type { Column, ColumnType, Row } from '../types';
import type React from 'react';

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeCallbacks {
  onRowEvent: (type: RealtimeEventType, row: Row) => void;
  onColumnsChange: (columns: Column[]) => void;
  skipNextColumnsRef?: React.MutableRefObject<boolean>;
}

export function subscribeToMonth(
  userId: string,
  month: string,
  callbacks: RealtimeCallbacks
): () => void {
  const channel = supabase.channel(`rows:${userId}:${month}`);

  function makeRow(payload: Record<string, unknown>): Row {
    return {
      id: typeof payload?.row_id === 'string' ? payload.row_id : '',
      month: typeof payload?.month === 'string' ? payload.month : month,
      data: (typeof payload?.data === 'object' && payload.data !== null
        ? payload.data
        : {}) as Row['data'],
    };
  }

  const rowsFilter = `user_id=eq.${userId}`;
  const events: RealtimeEventType[] = ['INSERT', 'UPDATE', 'DELETE'];

  for (const event of events) {
    channel.on(
      'postgres_changes',
      { event, schema: 'public', table: 'rows', filter: rowsFilter },
      (payload) => {
        const row = makeRow(payload.new as Record<string, unknown>);
        // Only notify if the row belongs to the current month
        if (row.month === month) {
          callbacks.onRowEvent(event, row);
        }
      },
    );
  }

  // Columns subscription (unchanged, already on a static table)
  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'user_columns', filter: `user_id=eq.${userId}` },
    async () => {
      if (callbacks.skipNextColumnsRef?.current) {
        callbacks.skipNextColumnsRef.current = false;
        return;
      }
      const { data } = await supabase
        .from('user_columns')
        .select('column_id, name, type, options, sort_order')
        .eq('user_id', userId)
        .order('sort_order');
      if (data) {
        const VALID_TYPES = new Set(['text', 'number', 'select', 'date']);
        const columns: Column[] = data.map((r) => ({
          id: typeof r.column_id === 'string' ? r.column_id : '',
          name: typeof r.name === 'string' ? r.name : '',
          type: (typeof r.type === 'string' && VALID_TYPES.has(r.type) ? r.type : 'text') as ColumnType,
          options: Array.isArray(r.options) ? (r.options as string[]) : undefined,
        }));
        callbacks.onColumnsChange(columns);
      }
    },
  );

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel).catch(() => {});
  };
}
