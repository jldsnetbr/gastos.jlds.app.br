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

  it('renders the toolbar with center button and search', () => {
    render(
      <Spreadsheet
        columns={mockColumns}
        rows={mockRows}
        selectedMonth="2026-06"
        onDataChange={onDataChange}
      />
    );

    expect(screen.getByTitle('Centralizar planilha')).toBeDefined();
    expect(screen.getByPlaceholderText('Buscar na planilha...')).toBeDefined();
  });

  it('renders column headers', () => {
    render(
      <Spreadsheet
        columns={mockColumns}
        rows={mockRows}
        selectedMonth="2026-06"
        onDataChange={onDataChange}
      />
    );

    expect(screen.getByText('Descrição')).toBeDefined();
    expect(screen.getByText('Tipo')).toBeDefined();
    expect(screen.getByText('Valor')).toBeDefined();
  });

  it('renders all rows', () => {
    render(
      <Spreadsheet
        columns={mockColumns}
        rows={mockRows}
        selectedMonth="2026-06"
        onDataChange={onDataChange}
      />
    );

    expect(screen.getByText('Salário')).toBeDefined();
    expect(screen.getByText('Aluguel')).toBeDefined();
    expect(screen.getByText('Mercado')).toBeDefined();
  });

  it('filters rows when searching', async () => {
    render(
      <Spreadsheet
        columns={mockColumns}
        rows={mockRows}
        selectedMonth="2026-06"
        onDataChange={onDataChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('Buscar na planilha...');
    fireEvent.change(searchInput, { target: { value: 'Aluguel' } });

    expect(screen.getByText('Aluguel')).toBeDefined();
    expect(screen.queryByText('Salário')).toBeNull();
    expect(screen.queryByText('Mercado')).toBeNull();
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

    const searchInput = screen.getByPlaceholderText('Buscar na planilha...');
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

  it('renders action buttons (CSV, Nova Coluna, Excluir, Adicionar Linha)', () => {
    render(
      <Spreadsheet
        columns={mockColumns}
        rows={mockRows}
        selectedMonth="2026-06"
        onDataChange={onDataChange}
      />
    );

    expect(screen.getByText('CSV')).toBeDefined();
    expect(screen.getByText('Excel')).toBeDefined();
    expect(screen.getByText('Nova Coluna')).toBeDefined();
    expect(screen.getByText('Excluir')).toBeDefined();
    expect(screen.getByText('Adicionar Linha')).toBeDefined();
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

    expect(screen.getByText('3')).toBeDefined();
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

    expect(screen.getByText('Clique em qualquer célula para editá-la')).toBeDefined();
    expect(screen.getByText('Exibindo 3 de 3 registros')).toBeDefined();
  });
});
