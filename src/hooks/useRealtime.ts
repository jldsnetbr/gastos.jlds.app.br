import { supabase } from '../lib/supabase';
import { getMonthTableName } from '../lib/tableNames';
import { Column, Row } from '../types';

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeCallbacks {
  onRowEvent: (type: RealtimeEventType, row: Row) => void;
  onColumnsChange: (columns: Column[]) => void;
}

export function subscribeToMonth(
  userId: string,
  month: string,
  callbacks: RealtimeCallbacks
): () => void {
  const tableName = getMonthTableName(month);

  const channel = supabase.channel(tableName);

  channel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: tableName, filter: `user_id=eq.${userId}` },
    (payload) => {
      const newRow: Row = {
        id: payload.new.row_id as string,
        month,
        data: payload.new.data as Row['data'],
      };
      callbacks.onRowEvent('INSERT', newRow);
    }
  );

  channel.on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: tableName, filter: `user_id=eq.${userId}` },
    (payload) => {
      const updatedRow: Row = {
        id: payload.new.row_id as string,
        month,
        data: payload.new.data as Row['data'],
      };
      callbacks.onRowEvent('UPDATE', updatedRow);
    }
  );

  channel.on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: tableName, filter: `user_id=eq.${userId}` },
    (payload) => {
      const deletedRow: Row = {
        id: payload.old.row_id as string,
        month,
        data: {},
      };
      callbacks.onRowEvent('DELETE', deletedRow);
    }
  );

  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'user_columns', filter: `user_id=eq.${userId}` },
    async () => {
      const { data } = await supabase
        .from('user_columns')
        .select('column_id, name, type, options, sort_order')
        .eq('user_id', userId)
        .order('sort_order');
      if (data) {
        const columns: Column[] = data.map((r) => ({
          id: r.column_id as string,
          name: r.name as string,
          type: r.type as Column['type'],
          options: r.options as string[] | undefined,
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