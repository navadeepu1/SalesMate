import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download } from "lucide-react";

export default function HistoricalData() {
  const [filters, setFilters] = useState({
    fromDate: (() => {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      return date.toISOString().split('T')[0];
    })(),
    toDate: new Date().toISOString().split('T')[0],
    salespersonId: "",
  });

  const { data: salespersons = [] } = useQuery({
    queryKey: ["/api/salespersons"],
  });

  const { data: historicalData = [] } = useQuery({
    queryKey: ["/api/sales-entries", filters.fromDate, filters.toDate, filters.salespersonId],
    queryFn: async () => {
      const params = new URLSearchParams({
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      });
      
      if (filters.salespersonId && filters.salespersonId !== "all") {
        params.append('salespersonId', filters.salespersonId);
      }
      
      const response = await fetch(`/api/sales-entries?${params}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }
      
      return response.json();
    },
  });

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateRunningTotals = () => {
    return historicalData.reduce((acc: any, record: any) => {
      const cash = parseFloat(record.cashCollected);
      const phonepe = parseFloat(record.phonepeCollected);
      const expenses = parseFloat(record.expenses);
      
      return {
        cash: acc.cash + cash,
        phonepe: acc.phonepe + phonepe,
        expenses: acc.expenses + expenses,
        net: acc.net + (cash + phonepe - expenses),
      };
    }, { cash: 0, phonepe: 0, expenses: 0, net: 0 });
  };

  const runningTotals = calculateRunningTotals();

  const handleExportData = () => {
    const headers = ['Date', 'Salesperson', 'Cash', 'PhonePe', 'Expenses', 'Net', 'Notes'];
    const rows = historicalData.map((record: any) => {
      const net = parseFloat(record.cashCollected) + parseFloat(record.phonepeCollected) - parseFloat(record.expenses);
      return [
        formatDate(record.date),
        record.salesperson.name,
        record.cashCollected,
        record.phonepeCollected,
        record.expenses,
        net.toFixed(2),
        record.notes || ''
      ];
    });
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historical-data-${filters.fromDate}-to-${filters.toDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Filters */}
        <Card className="business-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Historical Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="fromDate" className="block text-sm font-medium text-muted-foreground mb-2">
                From Date
              </Label>
              <Input
                id="fromDate"
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                className="business-input"
              />
            </div>
            <div>
              <Label htmlFor="toDate" className="block text-sm font-medium text-muted-foreground mb-2">
                To Date
              </Label>
              <Input
                id="toDate"
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                className="business-input"
              />
            </div>
            <div>
              <Label className="block text-sm font-medium text-muted-foreground mb-2">
                Salesperson
              </Label>
              <Select 
                value={filters.salespersonId} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, salespersonId: value }))}
              >
                <SelectTrigger className="business-input">
                  <SelectValue placeholder="All Salespersons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Salespersons</SelectItem>
                  {salespersons.map((person: any) => (
                    <SelectItem key={person.id} value={person.id.toString()}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full business-button-primary">
                <Search className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </Card>

        {/* Historical Data Table */}
        <Card className="business-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex justify-between items-center">
            <h3 className="text-lg font-semibold text-foreground">Sales Records</h3>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground">
                Showing {historicalData.length} records
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                disabled={historicalData.length === 0}
              >
                <Download className="mr-1 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
          
          {historicalData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No records found for the selected criteria</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-3 px-6 font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-6 font-medium text-muted-foreground">Salesperson</th>
                      <th className="text-right py-3 px-6 font-medium text-muted-foreground">Cash</th>
                      <th className="text-right py-3 px-6 font-medium text-muted-foreground">PhonePe</th>
                      <th className="text-right py-3 px-6 font-medium text-muted-foreground">Expenses</th>
                      <th className="text-right py-3 px-6 font-medium text-muted-foreground">Net</th>
                      <th className="text-left py-3 px-6 font-medium text-muted-foreground">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicalData.map((record: any) => {
                      const net = parseFloat(record.cashCollected) + parseFloat(record.phonepeCollected) - parseFloat(record.expenses);
                      return (
                        <tr key={record.id} className="border-b border-gray-100 hover:bg-muted/30">
                          <td className="py-4 px-6 text-sm">{formatDate(record.date)}</td>
                          <td className="py-4 px-6 text-sm font-medium">{record.salesperson.name}</td>
                          <td className="text-right py-4 px-6 text-sm money-positive">
                            {formatCurrency(record.cashCollected)}
                          </td>
                          <td className="text-right py-4 px-6 text-sm money-positive">
                            {formatCurrency(record.phonepeCollected)}
                          </td>
                          <td className="text-right py-4 px-6 text-sm money-negative">
                            {formatCurrency(record.expenses)}
                          </td>
                          <td className="text-right py-4 px-6 text-sm money-neutral">
                            {formatCurrency(net)}
                          </td>
                          <td className="py-4 px-6 text-sm text-muted-foreground max-w-xs truncate">
                            {record.notes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Running Totals */}
              <div className="bg-muted/50 px-6 py-4 border-t border-border">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Cash</p>
                    <p className="text-lg font-semibold text-secondary">
                      {formatCurrency(runningTotals.cash)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total PhonePe</p>
                    <p className="text-lg font-semibold text-secondary">
                      {formatCurrency(runningTotals.phonepe)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-lg font-semibold text-accent">
                      {formatCurrency(runningTotals.expenses)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Net Total</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(runningTotals.net)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
