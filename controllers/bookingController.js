// backend/controllers/bookingController.js
import asyncHandler from "express-async-handler";
import Booking from "../models/Booking.js";
import Table from "../models/Table.js";
import sendEmail from "../utils/sendEmail.js"; // default export works

// @desc   Create new booking
// @route  POST /api/bookings
// @access Private/User
export const createBooking = asyncHandler(async (req, res) => {
  const { table: tableId, startTime, endTime } = req.body;

  if (!tableId) return res.status(400).json({ message: "Table is required" });

  const table = await Table.findById(tableId);
  if (!table) return res.status(404).json({ message: "Table not found" });

  const s = startTime ? new Date(startTime) : new Date();
  const e = endTime ? new Date(endTime) : new Date(s.getTime() + 2 * 60 * 60 * 1000); // default 2 hours
  if (s >= e) return res.status(400).json({ message: "Invalid time range" });

  // Check overlapping bookings
  const overlap = await Booking.findOne({
    table: tableId,
    status: "booked",
    startTime: { $lt: e },
    endTime: { $gt: s },
  });
  if (overlap) return res.status(400).json({ message: "Table already booked for this time" });

  // Create booking
  const booking = await Booking.create({
    user: req.user.id,
    table: tableId,
    startTime: s,
    endTime: e,
    status: "booked",
  });

  // After booking, re-fetch all tables with updated availability for the same time slot
  const checkTime = s;
  const newBookingEndTime = new Date(checkTime.getTime() + 2 * 60 * 60 * 1000);

  const allTables = await Table.find().sort("tableNumber");
  const activeBookings = await Booking.find({
    status: "booked",
    startTime: { $lt: newBookingEndTime },
    endTime: { $gt: checkTime },
  }).select("table");

  const bookedTableIds = activeBookings.map((b) => b.table.toString());
  const tablesWithStatus = allTables.map((t) => ({
    ...t.toObject(),
    available: !bookedTableIds.includes(t._id.toString()),
  }));

  res.status(201).json({ message: "Booking created successfully", tables: tablesWithStatus });

  // Send email confirmation in the background
  const userEmail = req.user.email; // logged-in user's email
  sendEmail({
    to: userEmail,
    subject: "🍽️ Booking Confirmed",
    text: `Your booking for table ${table.tableNumber} is confirmed from ${s.toLocaleString()} to ${e.toLocaleString()}.`,
    html: `
        <h2>🍽️ Booking Confirmed</h2>
        <p><strong>Table:</strong> ${table.tableNumber}</p>
        <p><strong>From:</strong> ${s.toLocaleString()}</p>
        <p><strong>To:</strong> ${e.toLocaleString()}</p>
        <p>Thank you for booking with us!</p>
      `,
  })
    .then(() => {
      console.log("📨 Booking confirmation sent to:", userEmail);
    })
    .catch((err) => {
    console.warn("⚠️ Booking email not sent:", err.message);
    });
});

// @desc   Get logged-in user's bookings
// @route  GET /api/bookings/me
// @access Private/User
export const getUserBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id })
    .populate("table")
    .sort({ startTime: -1 });

  res.json(bookings);
});

// @desc   Cancel a booking
// @route  POST /api/bookings/:id/cancel
// @access Private/User
export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate("table");
  if (!booking) return res.status(404).json({ message: "Booking not found" });

  if (booking.user.toString() !== req.user.id)
    return res.status(403).json({ message: "Not allowed" });

  booking.status = "cancelled";
  await booking.save();

  // After cancelling, re-fetch all tables with updated availability for the original time slot
  const checkTime = booking.startTime;
  const bookingEndTime = new Date(checkTime.getTime() + 2 * 60 * 60 * 1000);

  const allTables = await Table.find().sort("tableNumber");
  const activeBookings = await Booking.find({
    status: "booked",
    startTime: { $lt: bookingEndTime },
    endTime: { $gt: checkTime },
  }).select("table");

  const bookedTableIds = activeBookings.map((b) => b.table.toString());
  const tablesWithStatus = allTables.map((t) => ({
    ...t.toObject(),
    available: !bookedTableIds.includes(t._id.toString()),
  }));

  res.json({ message: "Booking cancelled", tables: tablesWithStatus });

  // Send cancellation email in the background
  const userEmail = req.user.email;
  sendEmail({
    to: userEmail,
    subject: "❌ Booking Cancelled",
    text: `Your booking for table ${booking.table.tableNumber} from ${booking.startTime.toLocaleString()} to ${booking.endTime.toLocaleString()} has been cancelled.`,
    html: `
        <h2>❌ Booking Cancelled</h2>
        <p><strong>Table:</strong> ${booking.table.tableNumber}</p>
        <p><strong>From:</strong> ${booking.startTime.toLocaleString()}</p>
        <p><strong>To:</strong> ${booking.endTime.toLocaleString()}</p>
        <p>We hope to see you again soon.</p>
      `,
  })
    .then(() => {
      console.log("📨 Booking cancellation sent to:", userEmail);
    })
    .catch((err) => {
      console.warn("⚠️ Cancellation email not sent:", err.message);
    });
});
