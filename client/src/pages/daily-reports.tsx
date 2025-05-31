import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, Smartphone, Receipt, TrendingUp, Download } from "lucide-react";

export default function DailyReports() {
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: dailySummary = { totalCash: 0, totalPhonepe: 0, totalExpenses: 0, netTotal: 0 } } = useQuery({
    queryKey: ["/api/daily-summary", reportDate],
  });

  const { data: salespersonData = [] } = useQuery({
    queryKey: ["/api/salesperson-summary", reportDate],
  });

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleExport = () => {
    // Enhanced CSV export with better formatting and summary data
    const reportSummary = [
      ['Daily Sales Report'],
      [`Date: ${new Date(reportDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`],
      ['Generated on:', new Date().toLocaleString()],
      [''],
      ['SUMMARY TOTALS'],
      ['Total Cash Collected:', `₹${dailySummary.totalCash.toLocaleString('en-IN')}`],
      ['Total PhonePe Collected:', `₹${dailySummary.totalPhonepe.toLocaleString('en-IN')}`],
      ['Total Expenses:', `₹${dailySummary.totalExpenses.toLocaleString('en-IN')}`],
      ['Net Total:', `₹${dailySummary.netTotal.toLocaleString('en-IN')}`],
      [''],
      ['SALESPERSON BREAKDOWN']
    ];
    
    const headers = ['Salesperson', 'Cash Collected', 'PhonePe Collected', 'Expenses', 'Net Total'];
    const rows = salespersonData.map((person: any) => [
      person.salesperson.name,
      `₹${person.cash.toLocaleString('en-IN')}`,
      `₹${person.phonepe.toLocaleString('en-IN')}`,
      `₹${person.expenses.toLocaleString('en-IN')}`,
      `₹${person.net.toLocaleString('en-IN')}`
    ]);
    
    const csvContent = [...reportSummary, headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Daily-Sales-Report-${reportDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Report Header */}
        <Card className="business-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Daily Reports</h2>
              <p className="text-sm text-muted-foreground mt-1">Overview of daily collections and expenses</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <Input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="business-input"
              />
              <Button onClick={handleExport} className="business-button-primary">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="business-card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Wallet className="text-secondary h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Cash</p>
                <p className="text-2xl font-bold text-secondary">{formatCurrency(dailySummary.totalCash)}</p>
              </div>
            </div>
          </Card>

          <Card className="business-card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Smartphone className="text-secondary h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">PhonePe</p>
                <p className="text-2xl font-bold text-secondary">{formatCurrency(dailySummary.totalPhonepe)}</p>
              </div>
            </div>
          </Card>

          <Card className="business-card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Receipt className="text-accent h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Expenses</p>
                <p className="text-2xl font-bold text-accent">{formatCurrency(dailySummary.totalExpenses)}</p>
              </div>
            </div>
          </Card>

          <Card className="business-card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="text-primary h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Net Total</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(dailySummary.netTotal)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Salesperson Breakdown */}
        <Card className="business-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Salesperson Breakdown</h3>
          {salespersonData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No sales data available for {reportDate}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Salesperson</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Cash</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">PhonePe</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Expenses</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Net Total</th>
                  </tr>
                </thead>
                <tbody>
                  {salespersonData.map((person: any) => (
                    <tr key={person.salesperson.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-primary">
                              {getInitials(person.salesperson.name)}
                            </span>
                          </div>
                          <span className="font-medium">{person.salesperson.name}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 money-positive">{formatCurrency(person.cash)}</td>
                      <td className="text-right py-3 px-4 money-positive">{formatCurrency(person.phonepe)}</td>
                      <td className="text-right py-3 px-4 money-negative">{formatCurrency(person.expenses)}</td>
                      <td className="text-right py-3 px-4 money-neutral">{formatCurrency(person.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
