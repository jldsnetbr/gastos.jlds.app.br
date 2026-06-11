export const TABLE_PREFIX = 'rows_';

export function getMonthTableName(month: string): string {
  return `${TABLE_PREFIX}${month.replace('-', '_')}`;
}
