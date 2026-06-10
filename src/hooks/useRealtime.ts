import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getMonthTableName, getRealtimeChannelName } from '../lib/tableNames';

interface UseRealtimeProps {
  userId: string | undefined;
  month: string;
  onRowsChange: () => void;
}

export function useRealtime({ userId, month, onRowsChange }: UseRealtimeProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onRowsChangeRef = useRef(onRowsChange);
  onRowsChangeRef.current = onRowsChange;

  useEffect(() => {
    if (!userId || !month) return;

    const prev = channelRef.current;
    if (prev) {
      supabase.removeChannel(prev).catch(() => {});
    }

    const tableName = getMonthTableName(month);
    const channelName = getRealtimeChannelName(month);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: `user_id=eq.${userId}`,
        },
        () => {
          onRowsChangeRef.current();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      const current = channelRef.current;
      if (current) {
        supabase.removeChannel(current).catch(() => {});
        channelRef.current = null;
      }
    };
  }, [userId, month]);
}
