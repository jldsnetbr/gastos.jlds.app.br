const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function navigateMonth(current: string, direction: 'prev' | 'next'): string {
  const [yearStr, monthStr] = current.split('-');
  let year = parseInt(yearStr);
  let month = parseInt(monthStr) + (direction === 'next' ? 1 : -1);

  if (month === 0) {
    month = 12;
    year -= 1;
  } else if (month === 13) {
    month = 1;
    year += 1;
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}

export function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const monthIndex = parseInt(month) - 1;
  return `${MONTH_NAMES[monthIndex]} / ${year}`;
}
