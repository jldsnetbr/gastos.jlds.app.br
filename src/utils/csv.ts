import { Column, Row, ColumnType } from '../types';

export interface ParseCSVResult {
  columns: Column[];
  rows: Row[];
}

export function parseCSV(text: string, selectedMonth: string): ParseCSVResult {
  const lines = text.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
  if (lines.length < 1) {
    return { columns: [], rows: [] };
  }

  const headers = lines[0].split(';').map((h) => h.replace(/^"|"$/g, '').trim());

  const columns: Column[] = headers.map((header, i) => {
    const lower = header.toLowerCase();
    let type: ColumnType = 'text';
    let options: string[] | undefined;

    if (lower.includes('valor') || lower.includes('preço') || lower.includes('quantia')) {
      type = 'number';
    } else if (lower.includes('tipo')) {
      type = 'select';
      options = ['Entrada', 'Saída'];
    } else if (lower.includes('data')) {
      type = 'date';
    }

    return {
      id: `col_csv_${i}_${crypto.randomUUID()}`,
      name: header,
      type,
      options,
    };
  });

  const rows: Row[] = [];
  for (let idx = 1; idx < lines.length; idx++) {
    const values = lines[idx].split(';').map((v) => v.replace(/^"|"$/g, '').trim());
    const dataDict: { [key: string]: string | number } = {};

    columns.forEach((col, colIdx) => {
      const rawVal = values[colIdx] || '';
      if (col.type === 'number') {
        const numVal = parseFloat(rawVal.replace(',', '.'));
        dataDict[col.id] = isNaN(numVal) ? 0 : numVal;
      } else {
        dataDict[col.id] = rawVal;
      }
    });

    const dateTypeCol = columns.find((col) => col.type === 'date');
    if (dateTypeCol) {
      let dateVal = String(dataDict[dateTypeCol.id] || '').trim();
      const parts = dateVal.split('-');
      if (parts.length === 3) {
        const day = parts[2];
        const [selYear, selMonth] = selectedMonth.split('-');
        dateVal = `${selYear}-${selMonth}-${day.padStart(2, '0')}`;
        dataDict[dateTypeCol.id] = dateVal;
      } else {
        dataDict[dateTypeCol.id] = `${selectedMonth}-01`;
      }
    }

    rows.push({
      id: `row_csv_${idx}_${crypto.randomUUID()}`,
      month: selectedMonth,
      data: dataDict,
    });
  }

  return { columns, rows };
}

export function toCSV(columns: Column[], rows: Row[]): string {
  const headers = columns.map((c) => `"${c.name}"`).join(';');

  const rowsLines = rows.map((row) => {
    return columns.map((col) => {
      const val = row.data[col.id] ?? '';
      if (col.type === 'number') {
        return String(val).replace('.', ',');
      }
      return `"${val}"`;
    }).join(';');
  });

  return [headers, ...rowsLines].join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), content], {
    type: 'text/csv;charset=utf-8;',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
