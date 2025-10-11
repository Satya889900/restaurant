// backend/routes/bookingRoutes.js
import express from "express";
import {
  createBooking,
  getUserBookings,
  cancelBooking,
  updateBooking,
} from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes here are protected
router.use(protect);

router.route("/")
  .post(createBooking);

router.route("/me").get(getUserBookings);

router.route("/:id").put(updateBooking);
router.route("/:id/cancel").post(cancelBooking);

export default router;