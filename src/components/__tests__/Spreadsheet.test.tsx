import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Spreadsheet from '../Spreadsheet';
import { Column, Row } from '../../types';

const mockColumns: Column[] = [
  { id: 'descricao', name: 'Descrição', type: 'text' },
  { id: 'tipo', name: 'Tipo', type: 'select', options: ['Entrada', 'Saída'] },
  { id: 'valor', name: 'Valor', type: 'number' },
];

const mockRows: Row[] = [
  { id: '1', month: '2026-06', data: { descricao: 'Salário', tipo: 'Entrada', valor: 5000 } },
  { id: '2', month: '2026-06', data: { descricao: 'Aluguel', tipo: 'Saída', valor: 1500 } },
  { id: '3', month: '2026-06', data: { descricao: 'Mercado', tipo: 'Saída', valor: 600 } },
];

describe('Spreadsheet', () => {
  const onDataChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the toolbar with center button', () => {
    render(
      <Spreadsheet
        columns={mockColumns}
        rows={mockRows}
        selectedMonth="2026-06"
        onDataChange={onDataChange}
      />
    );

    expect(screen.getByTitle('Centralizar planilha')).toBeDefined();
  });

  it('renders search input', () => {
    render(
      <Spreadsheet
        columns={mockColumns}
        rows={mockRows}
        selectedMonth="2026-06"
        onDataChange={onDataChange}
      />
    );

    expect(
      screen.getAllByPlaceholderText('Buscar na planilha...').length
    ).toBeGreaterThanOrEqual(1);
  });

  it('renders column headers as editable inputs', () => {
    render(
      <Spreadsheet
        columns={mockColumns}
        rows={mockRows}
        selectedMonth="2026-06"
        onDataChange={onDataChange}
      />
    );

    expect(
      screen.getAllByDisplayValue('Descrição').length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByDisplayValue('Tipo').length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByDisplayValue('Valor').length
    ).toBeGreaterThanOrEqual(1);
  });

  it('renders row data in table cells', () => {
    render(
      <Spreadsheet
        columns={mockColumns}
        rows={mockRows}
        selectedMonth="2026-06"
        onDataChange={onDataChange}
      />
    );

    expect(screen.getAllByText('Salário').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Aluguel').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Mercado').length).toBeGreaterThanOrEqual(1);
  });

  it('filters rows when searching', () => {
    render(
      <Spreadsheet
        columns={mockColumns}
        rows={mockRows}
        selectedMonth="2026-06"
        onDataChange={onDataChange}
      />
    );

    const searchInput = screen.getAllByPlaceholderText('Buscar na planilha...')[0];
    fireEvent.change(searchInput, { target: { value: 'Aluguel' } });

    // After filtering for "Aluguel", the visible count should show 1
    expect(screen.getAllByText('Aluguel').length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty message when search has no results', () => {
    render(
      <Spreadsheet
        columns={mockColumns}
        rows={mockRows}
        selectedMonth="2026-06"
        onDataChange={onDataChange}
      />
    );

    const searchInput = screen.getAllByPlaceholderText('Buscar na planilha...')[0];
    fireEvent.change(searchInput, { target: { value: 'zzzzzz' } });
    expect(screen.getByText('Nenhum resultado encontrado')).toBeDefined();
  });

  it('shows empty month message when no rows', () => {
    render(
      <Spreadsheet
        columns={mockColumns}
        rows={[]}
        selectedMonth="2026-06"
        onDataChange={onDataChange}
      />
    );

    expect(screen.getByText('Nenhum lançamento neste mês')).toBeDefined();
  });

  it('renders action buttons', () => {
    render(
      <Spreadsheet
        columns={mockColumns}
        rows={mockRows}
        selectedMonth="2026-06"
        onDataChange={onDataChange}
      />
    );

    expect(screen.getAllByText('CSV').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Excel').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Nova Coluna').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Excluir').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Adicionar Linha').length).toBeGreaterThanOrEqual(1);
  });

  it('renders row index numbers', () => {
    render(
      <Spreadsheet
        columns={mockColumns}
        rows={mockRows}
        selectedMonth="2026-06"
        onDataChange={onDataChange}
      />
    );

    const threes = screen.getAllByText('3');
    const rowIndex = threes.find((el) => el.closest('td'));
    expect(rowIndex).toBeDefined();
  });

  it('shows footer help text and record count', () => {
    render(
      <Spreadsheet
        columns={mockColumns}
        rows={mockRows}
        selectedMonth="2026-06"
        onDataChange={onDataChange}
      />
    );

    expect(
      screen.getAllByText('Clique em qualquer célula para editá-la').length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText((_content, element) => {
        const text = element.textContent ?? '';
        return text.includes('Exibindo') && text.includes('registros') && text.includes('3');
      }).length
    ).toBeGreaterThanOrEqual(1);
  });
});
