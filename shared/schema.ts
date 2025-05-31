import { pgTable, text, serial, integer, decimal, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const salespersons = pgTable("salespersons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
});

export const salesEntries = pgTable("sales_entries", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  salespersonId: integer("salesperson_id").notNull().references(() => salespersons.id),
  cashCollected: decimal("cash_collected", { precision: 10, scale: 2 }).notNull().default("0"),
  phonepeCollected: decimal("phonepe_collected", { precision: 10, scale: 2 }).notNull().default("0"),
  expenses: decimal("expenses", { precision: 10, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dailySummaries = pgTable("daily_summaries", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  openingCash: decimal("opening_cash", { precision: 10, scale: 2 }).notNull().default("0"),
  totalSales: decimal("total_sales", { precision: 10, scale: 2 }).notNull().default("0"),
  totalCollection: decimal("total_collection", { precision: 10, scale: 2 }).notNull().default("0"),
  closingBalance: decimal("closing_balance", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const individualSales = pgTable("individual_sales", {
  id: serial("id").primaryKey(),
  salesEntryId: integer("sales_entry_id").notNull().references(() => salesEntries.id),
  customerName: text("customer_name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // "cash" or "phonepe"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const salespersonsRelations = relations(salespersons, ({ many }) => ({
  salesEntries: many(salesEntries),
}));

export const salesEntriesRelations = relations(salesEntries, ({ one, many }) => ({
  salesperson: one(salespersons, {
    fields: [salesEntries.salespersonId],
    references: [salespersons.id],
  }),
  individualSales: many(individualSales),
}));

export const individualSalesRelations = relations(individualSales, ({ one }) => ({
  salesEntry: one(salesEntries, {
    fields: [individualSales.salesEntryId],
    references: [salesEntries.id],
  }),
}));

export const insertSalespersonSchema = createInsertSchema(salespersons).omit({
  id: true,
});

export const insertSalesEntrySchema = createInsertSchema(salesEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  cashCollected: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Cash collected must be a valid positive number",
  }),
  phonepeCollected: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "PhonePe collected must be a valid positive number",
  }),
  expenses: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Expenses must be a valid positive number",
  }),
});

export const insertDailySummarySchema = createInsertSchema(dailySummaries).omit({
  id: true,
  createdAt: true,
}).extend({
  openingCash: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Opening cash must be a valid positive number",
  }),
  totalSales: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Total sales must be a valid positive number",
  }),
  totalCollection: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Total collection must be a valid positive number",
  }),
  closingBalance: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Closing balance must be a valid positive number",
  }),
});

export const insertIndividualSaleSchema = createInsertSchema(individualSales).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a valid positive number",
  }),
  paymentMethod: z.enum(["cash", "phonepe"], {
    required_error: "Payment method is required",
  }),
});

export type InsertSalesperson = z.infer<typeof insertSalespersonSchema>;
export type Salesperson = typeof salespersons.$inferSelect;
export type InsertSalesEntry = z.infer<typeof insertSalesEntrySchema>;
export type SalesEntry = typeof salesEntries.$inferSelect;
export type InsertDailySummary = z.infer<typeof insertDailySummarySchema>;
export type DailySummary = typeof dailySummaries.$inferSelect;
export type InsertIndividualSale = z.infer<typeof insertIndividualSaleSchema>;
export type IndividualSale = typeof individualSales.$inferSelect;

// For the users table that already exists
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
