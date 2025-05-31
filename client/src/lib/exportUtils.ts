// Utility functions for enhanced data export functionality

export function createEnhancedCSV(data: any[], title: string, additionalInfo: string[] = []): string {
  const header = [
    [title],
    [`Generated on: ${new Date().toLocaleString()}`],
    ...additionalInfo.map(info => [info]),
    ['']
  ];
  
  return [...header, ...data]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}

export function downloadFile(content: string, filename: string, type: string = 'text/csv;charset=utf-8;'): void {
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export function formatCurrencyForExport(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₹${num.toLocaleString('en-IN')}`;
}

export function formatDateForExport(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function createSalesRecordExport(entries: any[], dateRange: { from: string, to: string }, salesperson?: string): string {
  const totals = entries.reduce((acc, entry) => {
    const cash = parseFloat(entry.cashCollected) || 0;
    const phonepe = parseFloat(entry.phonepeCollected) || 0;
    const expenses = parseFloat(entry.expenses) || 0;
    return {
      cash: acc.cash + cash,
      phonepe: acc.phonepe + phonepe,
      expenses: acc.expenses + expenses,
      net: acc.net + (cash + phonepe - expenses)
    };
  }, { cash: 0, phonepe: 0, expenses: 0, net: 0 });

  const summaryInfo = [
    `Period: ${formatDateForExport(dateRange.from)} to ${formatDateForExport(dateRange.to)}`,
    salesperson ? `Salesperson: ${salesperson}` : 'All Salespersons',
    `Total Records: ${entries.length}`,
    '',
    'PERIOD SUMMARY',
    `Total Cash: ${formatCurrencyForExport(totals.cash)}`,
    `Total PhonePe: ${formatCurrencyForExport(totals.phonepe)}`,
    `Total Expenses: ${formatCurrencyForExport(totals.expenses)}`,
    `Net Total: ${formatCurrencyForExport(totals.net)}`,
    '',
    'DETAILED RECORDS'
  ];

  const headers = ['Date', 'Salesperson', 'Cash Collected', 'PhonePe Collected', 'Expenses', 'Net Amount', 'Notes', 'Entry Time'];
  const rows = entries.map(entry => {
    const net = parseFloat(entry.cashCollected) + parseFloat(entry.phonepeCollected) - parseFloat(entry.expenses);
    return [
      formatDateForExport(entry.date),
      entry.salesperson.name,
      formatCurrencyForExport(entry.cashCollected),
      formatCurrencyForExport(entry.phonepeCollected),
      formatCurrencyForExport(entry.expenses),
      formatCurrencyForExport(net),
      entry.notes || 'No notes',
      new Date(entry.createdAt).toLocaleString()
    ];
  });

  return createEnhancedCSV([headers, ...rows], 'Sales Records Export', summaryInfo);
}