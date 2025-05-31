import { 
  salespersons, 
  salesEntries, 
  type Salesperson, 
  type InsertSalesperson,
  type SalesEntry,
  type InsertSalesEntry,
  users,
  type User,
  type InsertUser 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User methods (existing)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Salesperson methods
  getAllSalespersons(): Promise<Salesperson[]>;
  createSalesperson(salesperson: InsertSalesperson): Promise<Salesperson>;
  
  // Sales entry methods
  createSalesEntry(entry: InsertSalesEntry): Promise<SalesEntry>;
  getSalesEntriesByDate(date: string): Promise<(SalesEntry & { salesperson: Salesperson })[]>;
  getSalesEntriesInDateRange(fromDate: string, toDate: string, salespersonId?: number): Promise<(SalesEntry & { salesperson: Salesperson })[]>;
  getDailySummary(date: string): Promise<{
    totalCash: number;
    totalPhonepe: number;
    totalExpenses: number;
    netTotal: number;
  }>;
  getSalespersonSummaryByDate(date: string): Promise<Array<{
    salesperson: Salesperson;
    cash: number;
    phonepe: number;
    expenses: number;
    net: number;
  }>>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllSalespersons(): Promise<Salesperson[]> {
    return await db.select().from(salespersons).orderBy(asc(salespersons.name));
  }

  async createSalesperson(insertSalesperson: InsertSalesperson): Promise<Salesperson> {
    const [salesperson] = await db
      .insert(salespersons)
      .values(insertSalesperson)
      .returning();
    return salesperson;
  }

  async createSalesEntry(entry: InsertSalesEntry): Promise<SalesEntry> {
    const [salesEntry] = await db
      .insert(salesEntries)
      .values(entry)
      .returning();
    return salesEntry;
  }

  async getSalesEntriesByDate(date: string): Promise<(SalesEntry & { salesperson: Salesperson })[]> {
    const entries = await db
      .select()
      .from(salesEntries)
      .leftJoin(salespersons, eq(salesEntries.salespersonId, salespersons.id))
      .where(eq(salesEntries.date, date))
      .orderBy(desc(salesEntries.createdAt));

    return entries.map(entry => ({
      ...entry.sales_entries,
      salesperson: entry.salespersons!
    }));
  }

  async getSalesEntriesInDateRange(fromDate: string, toDate: string, salespersonId?: number): Promise<(SalesEntry & { salesperson: Salesperson })[]> {
    let whereClause = and(
      gte(salesEntries.date, fromDate),
      lte(salesEntries.date, toDate)
    );

    if (salespersonId) {
      whereClause = and(whereClause, eq(salesEntries.salespersonId, salespersonId));
    }

    const entries = await db
      .select()
      .from(salesEntries)
      .leftJoin(salespersons, eq(salesEntries.salespersonId, salespersons.id))
      .where(whereClause)
      .orderBy(desc(salesEntries.date), desc(salesEntries.createdAt));

    return entries.map(entry => ({
      ...entry.sales_entries,
      salesperson: entry.salespersons!
    }));
  }

  async getDailySummary(date: string): Promise<{
    totalCash: number;
    totalPhonepe: number;
    totalExpenses: number;
    netTotal: number;
  }> {
    const result = await db
      .select({
        totalCash: sql<number>`COALESCE(SUM(CAST(${salesEntries.cashCollected} AS NUMERIC)), 0)`,
        totalPhonepe: sql<number>`COALESCE(SUM(CAST(${salesEntries.phonepeCollected} AS NUMERIC)), 0)`,
        totalExpenses: sql<number>`COALESCE(SUM(CAST(${salesEntries.expenses} AS NUMERIC)), 0)`,
      })
      .from(salesEntries)
      .where(eq(salesEntries.date, date));

    const summary = result[0];
    const netTotal = summary.totalCash + summary.totalPhonepe - summary.totalExpenses;

    return {
      totalCash: Number(summary.totalCash),
      totalPhonepe: Number(summary.totalPhonepe),
      totalExpenses: Number(summary.totalExpenses),
      netTotal: Number(netTotal),
    };
  }

  async getSalespersonSummaryByDate(date: string): Promise<Array<{
    salesperson: Salesperson;
    cash: number;
    phonepe: number;
    expenses: number;
    net: number;
  }>> {
    const results = await db
      .select({
        salesperson: salespersons,
        cash: sql<number>`COALESCE(SUM(CAST(${salesEntries.cashCollected} AS NUMERIC)), 0)`,
        phonepe: sql<number>`COALESCE(SUM(CAST(${salesEntries.phonepeCollected} AS NUMERIC)), 0)`,
        expenses: sql<number>`COALESCE(SUM(CAST(${salesEntries.expenses} AS NUMERIC)), 0)`,
      })
      .from(salesEntries)
      .leftJoin(salespersons, eq(salesEntries.salespersonId, salespersons.id))
      .where(eq(salesEntries.date, date))
      .groupBy(salespersons.id, salespersons.name, salespersons.email);

    return results.map(result => ({
      salesperson: result.salesperson,
      cash: Number(result.cash),
      phonepe: Number(result.phonepe),
      expenses: Number(result.expenses),
      net: Number(result.cash) + Number(result.phonepe) - Number(result.expenses),
    }));
  }
}

export const storage = new DatabaseStorage();
