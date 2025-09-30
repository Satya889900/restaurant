import express from "express";
import { register, login, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register new user
router.post("/register", register);

// Login
router.post("/login", login);

// Get logged-in user info
router.get("/me", protect, getMe);

export default router; // ✅ ESM export
