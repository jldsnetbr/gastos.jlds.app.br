export type ColumnType = 'text' | 'number' | 'select' | 'date';

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  options?: string[];
}

export interface RowData {
  [columnId: string]: string | number;
}

export interface Row {
  id: string;
  month: string;
  data: RowData;
}

export interface HistoryState {
  columns: Column[];
  rows: Row[];
}

export interface DynamicRow {
  row_id: string;
  user_id: string;
  data: Record<string, string | number | null>;
  created_at: string;
}
