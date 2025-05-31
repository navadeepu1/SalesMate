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

export const salespersonsRelations = relations(salespersons, ({ many }) => ({
  salesEntries: many(salesEntries),
}));

export const salesEntriesRelations = relations(salesEntries, ({ one }) => ({
  salesperson: one(salespersons, {
    fields: [salesEntries.salespersonId],
    references: [salespersons.id],
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

export type InsertSalesperson = z.infer<typeof insertSalespersonSchema>;
export type Salesperson = typeof salespersons.$inferSelect;
export type InsertSalesEntry = z.infer<typeof insertSalesEntrySchema>;
export type SalesEntry = typeof salesEntries.$inferSelect;

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
