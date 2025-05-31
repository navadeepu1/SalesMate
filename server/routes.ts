import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSalesEntrySchema, insertSalespersonSchema, insertDailySummarySchema, insertIndividualSaleSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize some default salespersons if they don't exist
  app.get("/api/init", async (req, res) => {
    try {
      const existingSalespersons = await storage.getAllSalespersons();
      if (existingSalespersons.length === 0) {
        await storage.createSalesperson({ name: "Gowri", email: "gowri@company.com" });
        await storage.createSalesperson({ name: "Assistant Manager", email: "assistant@company.com" });
        await storage.createSalesperson({ name: "Sales Executive", email: "sales@company.com" });
      }
      res.json({ message: "Initialized successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to initialize", error: error.message });
    }
  });

  // Get all salespersons
  app.get("/api/salespersons", async (req, res) => {
    try {
      const salespersons = await storage.getAllSalespersons();
      res.json(salespersons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch salespersons", error: error.message });
    }
  });

  // Create salesperson
  app.post("/api/salespersons", async (req, res) => {
    try {
      const validatedData = insertSalespersonSchema.parse(req.body);
      const salesperson = await storage.createSalesperson(validatedData);
      res.status(201).json(salesperson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation failed", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create salesperson", error: error.message });
      }
    }
  });

  // Create sales entry
  app.post("/api/sales-entries", async (req, res) => {
    try {
      const validatedData = insertSalesEntrySchema.parse(req.body);
      const salesEntry = await storage.createSalesEntry(validatedData);
      res.status(201).json(salesEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation failed", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create sales entry", error: error.message });
      }
    }
  });

  // Get sales entries by date
  app.get("/api/sales-entries/date/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const entries = await storage.getSalesEntriesByDate(date);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales entries", error: error.message });
    }
  });

  // Get sales entries in date range
  app.get("/api/sales-entries", async (req, res) => {
    try {
      const { fromDate, toDate, salespersonId } = req.query;
      
      if (!fromDate || !toDate) {
        return res.status(400).json({ message: "fromDate and toDate are required" });
      }

      const entries = await storage.getSalesEntriesInDateRange(
        fromDate as string,
        toDate as string,
        salespersonId ? parseInt(salespersonId as string) : undefined
      );
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales entries", error: error.message });
    }
  });

  // Get daily summary
  app.get("/api/daily-summary/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const summary = await storage.getDailySummary(date);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily summary", error: error.message });
    }
  });

  // Get salesperson summary by date
  app.get("/api/salesperson-summary/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const summary = await storage.getSalespersonSummaryByDate(date);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch salesperson summary", error: error.message });
    }
  });

  // Create or update daily summary
  app.post("/api/daily-summary", async (req, res) => {
    try {
      const validatedData = insertDailySummarySchema.parse(req.body);
      const summary = await storage.createOrUpdateDailySummary(validatedData);
      res.json(summary);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation failed", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save daily summary", error: error.message });
      }
    }
  });

  // Get daily summary by date
  app.get("/api/daily-summary-detailed/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const summary = await storage.getDailySummaryByDate(date);
      res.json(summary || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily summary", error: error.message });
    }
  });

  // Create individual sale
  app.post("/api/individual-sales", async (req, res) => {
    try {
      const validatedData = insertIndividualSaleSchema.parse(req.body);
      const sale = await storage.createIndividualSale(validatedData);
      res.status(201).json(sale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation failed", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create individual sale", error: error.message });
      }
    }
  });

  // Get individual sales by entry
  app.get("/api/individual-sales/:salesEntryId", async (req, res) => {
    try {
      const { salesEntryId } = req.params;
      const sales = await storage.getIndividualSalesByEntry(parseInt(salesEntryId));
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch individual sales", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
