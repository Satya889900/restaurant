import asyncHandler from "express-async-handler";
import Table from "../models/Table.js";
import Booking from "../models/Booking.js";

// @desc   Create new table (Admin)
// @route  POST /api/tables
// @access Private/Admin
export const createTable = asyncHandler(async (req, res) => {
  const { tableNumber, seats } = req.body;

  if (!tableNumber || !seats) {
    return res.status(400).json({ message: "Please provide table number & seats" });
  }

  const tableExists = await Table.findOne({ tableNumber });
  if (tableExists) {
    return res.status(400).json({ message: "Table number already exists" });
  }

  const table = await Table.create({ tableNumber, seats });
  res.status(201).json(table);
});

// @desc   Get all tables with availability info for a specific date/time
// @route  GET /api/tables
// @access Public
export const getTables = asyncHandler(async (req, res) => {
  const { date, time } = req.query;

  if (!date || !time) {
    return res.status(400).json({ message: "Date and time are required" });
  }

  const checkTime = new Date(`${date}T${time}`);
  console.log("Fetching tables for:", checkTime);

  // Mark expired bookings as completed
  await Booking.updateMany(
    { endTime: { $lt: new Date() }, status: "booked" },
    { $set: { status: "completed" } }
  );

  // Assume a booking is for a 2-hour duration for availability check
  const newBookingStartTime = checkTime;
  const newBookingEndTime = new Date(newBookingStartTime.getTime() + 2 * 60 * 60 * 1000);

  const tables = await Table.find().sort("tableNumber");

  // Find any existing bookings that overlap with the potential new booking time range.
  // An overlap occurs if (StartA < EndB) and (EndA > StartB).
  const activeBookings = await Booking.find({
    status: "booked",
    startTime: { $lt: newBookingEndTime },
    endTime: { $gt: newBookingStartTime },
  }).select("table");

  const bookedTableIds = activeBookings.map((b) => b.table.toString());

  // Add dynamic availability field
  const tablesWithStatus = tables.map((t) => ({
    ...t.toObject(),
    available: !bookedTableIds.includes(t._id.toString()),
  }));

  res.json(tablesWithStatus);
});

// @desc   Update a table (Admin)
// @route  PUT /api/tables/:id
// @access Private/Admin
export const updateTable = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) return res.status(404).json({ message: "Table not found" });

  const { tableNumber, seats, isAvailable } = req.body;
  if (tableNumber !== undefined) table.tableNumber = tableNumber;
  if (seats !== undefined) table.seats = seats;
  if (isAvailable !== undefined) table.isAvailable = isAvailable;

  await table.save();
  res.json(table);
});

// @desc   Delete a table (Admin)
// @route  DELETE /api/tables/:id
// @access Private/Admin
export const deleteTable = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) return res.status(404).json({ message: "Table not found" });

  await Table.deleteOne({ _id: table._id });
  res.json({ message: "Table deleted successfully" });
});
