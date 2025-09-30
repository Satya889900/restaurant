import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createBooking, getUserBookings, cancelBooking } from "../controllers/bookingController.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/me", protect, getUserBookings);
router.post("/:id/cancel", protect, cancelBooking);

export default router;
