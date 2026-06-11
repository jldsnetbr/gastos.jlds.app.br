import { supabase } from '../lib/supabase';
import { getMonthTableName } from '../lib/tableNames';
import { Column, ColumnType, Row } from '../types';
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
  const tableName = getMonthTableName(month);

  const channel = supabase.channel(`${tableName}:${userId}`);

  function makeRow(payload: Record<string, unknown>): Row {
    return {
      id: typeof payload?.row_id === 'string' ? payload.row_id : typeof payload?.id === 'string' ? payload.id : '',
      month,
      data: (typeof payload?.data === 'object' && payload.data !== null ? payload.data : {}) as Row['data'],
    };
  }

  channel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: tableName, filter: `user_id=eq.${userId}` },
    (payload) => {
      callbacks.onRowEvent('INSERT', makeRow(payload.new as Record<string, unknown>));
    }
  );

  channel.on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: tableName, filter: `user_id=eq.${userId}` },
    (payload) => {
      callbacks.onRowEvent('UPDATE', makeRow(payload.new as Record<string, unknown>));
    }
  );

  channel.on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: tableName, filter: `user_id=eq.${userId}` },
    (payload) => {
      callbacks.onRowEvent('DELETE', makeRow(payload.old as Record<string, unknown>));
    }
  );

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
    }
  );

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel).catch(() => {});
  };
}
