// backend/routes/authRoutes.js
import express from "express";
import { register, login, getMe, forgotPassword, resetPassword } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", register);

/**
 * @route   POST /api/auth/login
 * @desc    Login and return JWT
 * @access  Public
 */
router.post("/login", login);

/**
 * @route   GET /api/auth/me
 * @desc    Get logged-in user's profile
 * @access  Private
 */
router.get("/me", protect, getMe);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset (send OTP)
 * @access  Public
 */
router.post("/forgot-password", forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with OTP
 * @access  Public
 */
router.post("/reset-password", resetPassword);

export default router;
