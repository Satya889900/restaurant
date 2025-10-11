// routes/tableRoutes.js
import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  createTable,
  getTables,
  getTableById,
  updateTable,
  deleteTable,
} from "../controllers/tableController.js";

const router = express.Router();

router.post("/", protect, admin, createTable);

router.get("/", getTables);

router.get("/:id", getTableById);

router.put("/:id", protect, admin, updateTable);

router.delete("/:id", protect, admin, deleteTable);

export default router;
