import express from "express";
import { createTable, getTables, deleteTable, updateTable } from "../controllers/tableController.js";

const router = express.Router();

// Create new table (Admin)
router.post("/", createTable);

// Get all tables (Public)
router.get("/", getTables);

// Update a table (Admin)
router.put("/:id", updateTable);

// Delete a table (Admin)
router.delete("/:id", deleteTable);

export default router; // ✅ ESM export
