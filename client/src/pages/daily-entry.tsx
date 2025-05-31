import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { insertSalesEntrySchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Save, Undo, Wallet, Smartphone, Receipt } from "lucide-react";
import { z } from "zod";

const formSchema = insertSalesEntrySchema.extend({
  salespersonId: z.string().min(1, "Please select a salesperson"),
});

type FormData = z.infer<typeof formSchema>;

export default function DailyEntry() {
  const { toast } = useToast();
  const [todayDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Initialize data
  useQuery({
    queryKey: ["/api/init"],
    staleTime: Infinity,
  });

  const { data: salespersons = [] } = useQuery({
    queryKey: ["/api/salespersons"],
  });

  const { data: todayEntries = [] } = useQuery({
    queryKey: ["/api/sales-entries/date", todayDate],
  });

  const { data: todaySummary = { totalCash: 0, totalPhonepe: 0, totalExpenses: 0, netTotal: 0 } } = useQuery({
    queryKey: ["/api/daily-summary", todayDate],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: todayDate,
      salespersonId: "",
      cashCollected: "0",
      phonepeCollected: "0",
      expenses: "0",
      notes: "",
    },
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        salespersonId: parseInt(data.salespersonId),
      };
      return apiRequest("POST", "/api/sales-entries", payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Daily entry saved successfully!",
      });
      form.reset({
        date: todayDate,
        salespersonId: "",
        cashCollected: "0",
        phonepeCollected: "0",
        expenses: "0",
        notes: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-entries/date"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-summary"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save entry",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createEntryMutation.mutate(data);
  };

  const handleReset = () => {
    form.reset({
      date: todayDate,
      salespersonId: "",
      cashCollected: "0",
      phonepeCollected: "0",
      expenses: "0",
      notes: "",
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Entry Form */}
        <div className="lg:col-span-2">
          <Card className="business-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Daily Sales Entry</h2>
              <span className="text-sm text-muted-foreground">
                Today: {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="business-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="salespersonId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salesperson</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="business-input">
                              <SelectValue placeholder="Select Salesperson" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {salespersons.map((person: any) => (
                              <SelectItem key={person.id} value={person.id.toString()}>
                                {person.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="cashCollected"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Wallet className="text-secondary mr-1 h-4 w-4" />
                          Cash Collected
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-muted-foreground">₹</span>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              className="business-input pl-8"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phonepeCollected"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Smartphone className="text-secondary mr-1 h-4 w-4" />
                          PhonePe Collected
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-muted-foreground">₹</span>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              className="business-input pl-8"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="expenses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Receipt className="text-accent mr-1 h-4 w-4" />
                        Expenses
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            className="business-input pl-8"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Additional notes about today's sales..."
                          {...field}
                          className="business-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between pt-6 border-t border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleReset}
                  >
                    <Undo className="mr-2 h-4 w-4" />
                    Reset Form
                  </Button>
                  <Button
                    type="submit"
                    className="business-button-primary"
                    disabled={createEntryMutation.isPending}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {createEntryMutation.isPending ? "Saving..." : "Save Entry"}
                  </Button>
                </div>
              </form>
            </Form>
          </Card>
        </div>

        {/* Quick Summary & Recent Entries */}
        <div className="space-y-6">
          <Card className="business-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Today's Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Cash</span>
                <span className="money-positive">{formatCurrency(todaySummary.totalCash)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total PhonePe</span>
                <span className="money-positive">{formatCurrency(todaySummary.totalPhonepe)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Expenses</span>
                <span className="money-negative">{formatCurrency(todaySummary.totalExpenses)}</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">Net Collection</span>
                <span className="money-neutral text-lg">{formatCurrency(todaySummary.netTotal)}</span>
              </div>
            </div>
          </Card>

          <Card className="business-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Entries</h3>
            <div className="space-y-3">
              {todayEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No entries recorded today
                </p>
              ) : (
                todayEntries.slice(0, 5).map((entry: any) => {
                  const total = parseFloat(entry.cashCollected) + parseFloat(entry.phonepeCollected) - parseFloat(entry.expenses);
                  return (
                    <div key={entry.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="text-sm font-medium">{entry.salesperson.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit', 
                            hour12: true 
                          })}
                        </p>
                      </div>
                      <span className="money-positive">{formatCurrency(total)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
