import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { insertSalesEntrySchema, insertDailySummarySchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Save, Undo, Wallet, Smartphone, Receipt, Plus, Trash2, Calculator, TrendingUp } from "lucide-react";
import { z } from "zod";

const formSchema = insertSalesEntrySchema.extend({
  salespersonId: z.string().min(1, "Please select a salesperson"),
  individualPayments: z.array(z.object({
    customerName: z.string().min(1, "Customer name is required"),
    amount: z.string().min(1, "Amount is required"),
    paymentMethod: z.enum(["cash", "phonepe"]),
  })).optional(),
});

const dailySummarySchema = insertDailySummarySchema.extend({
  individualSales: z.array(z.object({
    customerName: z.string().min(1, "Customer name is required"),
    amount: z.string().min(1, "Amount is required"),
    paymentMethod: z.enum(["cash", "phonepe"]),
  })).optional(),
});

type FormData = z.infer<typeof formSchema>;
type DailySummaryFormData = z.infer<typeof dailySummarySchema>;

export default function DailyEntry() {
  const { toast } = useToast();
  const [todayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showDailySummary, setShowDailySummary] = useState(false);

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

  const { data: dailySummaryDetails } = useQuery({
    queryKey: ["/api/daily-summary-detailed", todayDate],
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
      individualPayments: [],
    },
  });

  const summaryForm = useForm<DailySummaryFormData>({
    resolver: zodResolver(dailySummarySchema),
    defaultValues: {
      date: todayDate,
      openingCash: "0",
      totalSales: "0",
      totalCollection: "0",
      closingBalance: "0",
      individualSales: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: summaryForm.control,
    name: "individualSales",
  });

  const { fields: paymentFields, append: appendPayment, remove: removePayment } = useFieldArray({
    control: form.control,
    name: "individualPayments",
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
        description: "Payment entry saved and all reports updated automatically!",
      });
      form.reset({
        date: todayDate,
        salespersonId: "",
        cashCollected: "0",
        phonepeCollected: "0",
        expenses: "0",
        notes: "",
        individualPayments: [],
      });
      // Real-time updates - invalidate all related queries for automatic refresh
      queryClient.invalidateQueries({ queryKey: ["/api/sales-entries/date"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/salesperson-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-entries"] }); // Historical data
      queryClient.invalidateQueries({ queryKey: ["/api/daily-summary-detailed"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save entry",
        variant: "destructive",
      });
    },
  });

  const saveDailySummaryMutation = useMutation({
    mutationFn: async (data: DailySummaryFormData) => {
      const payload = {
        date: data.date,
        openingCash: data.openingCash,
        totalSales: data.totalSales,
        totalCollection: data.totalCollection,
        closingBalance: data.closingBalance,
      };
      return apiRequest("POST", "/api/daily-summary", payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Daily summary saved and all reports updated automatically!",
      });
      // Real-time updates - invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["/api/daily-summary-detailed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/salesperson-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-entries"] }); // Historical data
      setShowDailySummary(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save daily summary",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createEntryMutation.mutate(data);
  };

  const onSubmitDailySummary = (data: DailySummaryFormData) => {
    saveDailySummaryMutation.mutate(data);
  };

  const handleReset = () => {
    form.reset({
      date: todayDate,
      salespersonId: "",
      cashCollected: "0",
      phonepeCollected: "0",
      expenses: "0",
      notes: "",
      individualPayments: [],
    });
  };

  const addIndividualPayment = () => {
    appendPayment({
      customerName: "",
      amount: "",
      paymentMethod: "cash",
    });
  };

  const calculateClosingBalance = useCallback(() => {
    const formValues = summaryForm.getValues();
    const openingCash = parseFloat(formValues.openingCash) || 0;
    const totalCollection = parseFloat(formValues.totalCollection) || 0;
    const totalSales = parseFloat(formValues.totalSales) || 0;
    
    const closingBalance = openingCash + totalCollection - totalSales;
    summaryForm.setValue("closingBalance", closingBalance.toString(), { shouldValidate: false });
  }, [summaryForm]);

  // Watch for changes to auto-calculate closing balance
  useEffect(() => {
    const subscription = summaryForm.watch((value, { name }) => {
      if (name === "openingCash" || name === "totalCollection" || name === "totalSales") {
        calculateClosingBalance();
      }
    });
    return () => subscription.unsubscribe();
  }, [summaryForm, calculateClosingBalance]);

  const addIndividualSale = () => {
    append({
      customerName: "",
      amount: "",
      paymentMethod: "cash",
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Entry Form */}
        <div>
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

                {/* Individual Customer Payments Section */}
                <div className="border-t border-border pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-medium text-foreground">Individual Customer Payments</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addIndividualPayment}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add Customer Payment
                    </Button>
                  </div>

                  {paymentFields.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No individual payments added yet. Click "Add Customer Payment" to start tracking.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {paymentFields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-border rounded-lg">
                          <FormField
                            control={form.control}
                            name={`individualPayments.${index}.customerName`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Customer Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter customer name"
                                    {...field}
                                    className="business-input"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`individualPayments.${index}.amount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount</FormLabel>
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
                            name={`individualPayments.${index}.paymentMethod`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Payment Method</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="business-input">
                                      <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="phonepe">PhonePe</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removePayment(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

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

          {/* Daily Summary Section */}
          <Card className="business-card p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Daily Summary & Individual Sales</h2>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDailySummary(!showDailySummary)}
              >
                <Calculator className="mr-2 h-4 w-4" />
                {showDailySummary ? "Hide Summary" : "Manage Summary"}
              </Button>
            </div>

            {showDailySummary && (
              <Form {...summaryForm}>
                <form onSubmit={summaryForm.handleSubmit(onSubmitDailySummary)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={summaryForm.control}
                      name="openingCash"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Wallet className="text-primary mr-1 h-4 w-4" />
                            Opening Cash Balance
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
                      control={summaryForm.control}
                      name="totalSales"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <TrendingUp className="text-secondary mr-1 h-4 w-4" />
                            Total Sales Amount
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
                      control={summaryForm.control}
                      name="totalCollection"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Receipt className="text-secondary mr-1 h-4 w-4" />
                            Total Collection
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
                      control={summaryForm.control}
                      name="closingBalance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Calculator className="text-primary mr-1 h-4 w-4" />
                            Closing Balance (Auto-calculated)
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-muted-foreground">₹</span>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                className="business-input pl-8 bg-muted"
                                readOnly
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Individual Sales Section */}
                  <div className="border-t border-border pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-md font-medium text-foreground">Individual Sales</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addIndividualSale}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Add Sale
                      </Button>
                    </div>

                    {fields.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No individual sales added yet. Click "Add Sale" to start tracking.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {fields.map((field, index) => (
                          <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-border rounded-lg">
                            <FormField
                              control={summaryForm.control}
                              name={`individualSales.${index}.customerName`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Customer Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter customer name"
                                      {...field}
                                      className="business-input"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={summaryForm.control}
                              name={`individualSales.${index}.amount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Amount</FormLabel>
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
                              control={summaryForm.control}
                              name={`individualSales.${index}.paymentMethod`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Payment Method</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="business-input">
                                        <SelectValue placeholder="Select method" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="cash">Cash</SelectItem>
                                      <SelectItem value="phonepe">PhonePe</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end pt-6 border-t border-border">
                    <Button
                      type="submit"
                      className="business-button-primary"
                      disabled={saveDailySummaryMutation.isPending}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saveDailySummaryMutation.isPending ? "Saving..." : "Save Daily Summary"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
