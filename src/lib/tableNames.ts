export const TABLE_PREFIX = 'rows_';

export function getMonthTableName(month: string): string {
  return `${TABLE_PREFIX}${month.replace('-', '_')}`;
}

export function getRealtimeChannelName(month: string): string {
  return `realtime:${getMonthTableName(month)}`;
}
