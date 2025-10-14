// routes/tableRoutes.js
import express from "express";
import {
  createTable,
  getTables,
  getTableById,
  updateTable,
  deleteTable,
  uploadTableImages,
} from "../controllers/tableController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.route("/").get(getTables).post(protect, admin, createTable);

router.route("/upload-images").post(protect, admin, upload.array("images", 5), uploadTableImages);

router.route("/:id").get(getTableById).put(protect, admin, updateTable).delete(protect, admin, deleteTable);

export default router;