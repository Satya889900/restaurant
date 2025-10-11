// controllers/tableController.js
import asyncHandler from "express-async-handler";
import Table from "../models/Table.js";
import Booking from "../models/Booking.js";

// helper: check if a menu item is available at a given JS Date (requestedTime)
function isMenuItemAvailableAt(menuItem, requestedDate) {
  if (!menuItem.isAvailable) return false;

  // check day of week if availableDays specified
  if (Array.isArray(menuItem.availableDays) && menuItem.availableDays.length) {
    const dow = requestedDate.getDay(); // 0..6
    if (!menuItem.availableDays.includes(dow)) return false;
  }

  // if no availableTimes specified -> assume available all day
  if (!Array.isArray(menuItem.availableTimes) || menuItem.availableTimes.length === 0) {
    return true;
  }

  // get time part from requestedDate as minutes since midnight
  const minutes = requestedDate.getHours() * 60 + requestedDate.getMinutes();

  // verify if any range includes the minutes
  for (const range of menuItem.availableTimes) {
    const [fromH, fromM] = range.from.split(":").map(Number);
    const [toH, toM] = range.to.split(":").map(Number);
    const fromMinutes = fromH * 60 + fromM;
    const toMinutes = toH * 60 + toM;

    // handle ranges that cross midnight: treat toMinutes <= fromMinutes as crossing midnight
    if (toMinutes > fromMinutes) {
      if (minutes >= fromMinutes && minutes < toMinutes) return true;
    } else {
      // e.g. from 22:00 to 02:00
      if (minutes >= fromMinutes || minutes < toMinutes) return true;
    }
  }
  return false;
}

// @desc Create new table (Admin)
export const createTable = asyncHandler(async (req, res) => {
  const {
    tableNumber,
    seats,
    isAvailable,
    restaurantImages,
    location,
    foodTypes,
    foodMenu,
    tableClass,
    classFeatures,
    price,
    offers,
    notes,
  } = req.body;

  if (!tableNumber || !seats) {
    return res.status(400).json({ message: "Please provide table number & seats" });
  }

  const tableExists = await Table.findOne({ tableNumber });
  if (tableExists) {
    return res.status(400).json({ message: "Table number already exists" });
  }

  const table = await Table.create({
    tableNumber,
    seats,
    isAvailable: isAvailable !== undefined ? isAvailable : true,
    restaurantImages,
    location,
    foodTypes,
    foodMenu,
    tableClass,
    classFeatures,
    price,
    offers,
    notes,
  });

  res.status(201).json(table);
});

// @desc Get all tables with availability info for a specific date/time + optional food filters
export const getTables = asyncHandler(async (req, res) => {
  const { date, time, veg, foodTime } = req.query;

  if (!date || !time) {
    return res.status(400).json({ message: "Date and time are required" });
  }

  // Parse requested slot/time
  const checkTime = new Date(`${date}T${time}`);
  if (isNaN(checkTime.getTime())) {
    return res.status(400).json({ message: "Invalid date/time" });
  }

  // Mark expired bookings as completed (same as you had)
  await Booking.updateMany(
    { endTime: { $lt: new Date() }, status: "booked" },
    { $set: { status: "completed" } }
  );

  // Define booking window (2 hours)
  const newBookingStartTime = checkTime;
  const newBookingEndTime = new Date(newBookingStartTime.getTime() + 2 * 60 * 60 * 1000);

  const tables = await Table.find().sort("tableNumber");

  // find overlapping bookings for the time window
  const activeBookings = await Booking.find({
    status: "booked",
    startTime: { $lt: newBookingEndTime },
    endTime: { $gt: newBookingStartTime },
  }).select("table");

  const bookedTableIds = activeBookings.map((b) => b.table.toString());

  const requestedFoodDate = foodTime ? new Date(`${date}T${foodTime}`) : checkTime;
  const vegFilter = veg === "true" || veg === true;

  const tablesWithStatus = tables.map((t) => {
    const isBooked = bookedTableIds.includes(t._id.toString());
    // filter food menu based on veg/time if requested
    let filteredMenu = t.foodMenu || [];

    if (vegFilter) {
      filteredMenu = filteredMenu.filter((m) => m.veg === true);
    } else if (veg === "false") {
      filteredMenu = filteredMenu.filter((m) => m.veg === false);
    }
    if (requestedFoodDate) {
      filteredMenu = filteredMenu.filter((m) => isMenuItemAvailableAt(m, requestedFoodDate));
    }

    // map to plain object and add available & filtered menu
    const obj = t.toObject();
    obj.available = !isBooked;
    obj.filteredFoodMenu = filteredMenu;
    // keep original foodMenu if needed as well
    return obj;
  });

  res.json(tablesWithStatus);
});

// @desc Get table by ID
// @route GET /api/tables/:id
// @access Public
export const getTableById = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);

  if (table) {
    res.json(table);
  } else {
    res.status(404).json({ message: "Table not found" });
  }
});

// @desc Update a table (Admin)
export const updateTable = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) return res.status(404).json({ message: "Table not found" });

  // Accept any of the fields (partial update)
  const updatable = [
    "tableNumber",
    "seats",
    "isAvailable",
    "restaurantImages",
    "location",
    "foodTypes",
    "foodMenu",
    "tableClass",
    "classFeatures",
    "price",
    "offers",
    "notes",
  ];

  updatable.forEach((field) => {
    if (req.body[field] !== undefined) {
      table[field] = req.body[field];
    }
  });

  await table.save();
  res.json(table);
});

// @desc Delete a table (Admin)
export const deleteTable = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) return res.status(404).json({ message: "Table not found" });

  await Table.deleteOne({ _id: table._id });
  res.json({ message: "Table deleted successfully" });
});
