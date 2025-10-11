// backend/controllers/bookingController.js
import asyncHandler from "express-async-handler";
import Booking from "../models/Booking.js";
import Table from "../models/Table.js";
import sendEmail from "../utils/sendEmail.js";

/* -------------------------------------------------------
   Helper functions: offer logic
------------------------------------------------------- */
function findApplicableOffers(tableOffers = [], bookingDate) {
  if (!Array.isArray(tableOffers)) return [];
  const now = bookingDate instanceof Date ? bookingDate : new Date(bookingDate);
  return tableOffers.filter((offer) => {
    if (!offer || !offer.active) return false;
    if (offer.validFrom && new Date(offer.validFrom) > now) return false;
    if (offer.validTo && new Date(offer.validTo) < now) return false;
    return true;
  });
}

function pickBestOffer(offers = []) {
  if (!offers.length) return null;
  return offers.reduce((best, curr) =>
    (curr.discountPercent || 0) > (best.discountPercent || 0) ? curr : best
  );
}

/* -------------------------------------------------------
   @desc   Create new booking
   @route  POST /api/bookings
   @access Private/User
------------------------------------------------------- */
export const createBooking = asyncHandler(async (req, res) => {
  const { table: tableId, startTime, endTime } = req.body;
  if (!tableId) return res.status(400).json({ message: "Table is required" });

  const table = await Table.findById(tableId);
  if (!table) return res.status(404).json({ message: "Table not found" });

  const s = startTime ? new Date(startTime) : new Date();
  const e = endTime ? new Date(endTime) : new Date(s.getTime() + 2 * 60 * 60 * 1000);
  if (s >= e) return res.status(400).json({ message: "Invalid time range" });

  // check overlapping bookings
  const overlap = await Booking.findOne({
    table: tableId,
    status: "booked",
    startTime: { $lt: e },
    endTime: { $gt: s },
  });
  if (overlap) return res.status(400).json({ message: "Table already booked for this time" });

  /* ------------------ Price & Offer Logic ------------------ */
  const basePrice = Number(table.price || 0);
  const applicableOffers = findApplicableOffers(table.offers || [], s);
  const bestOffer = pickBestOffer(applicableOffers);

  let discount = 0;
  let appliedOffers = [];

  if (bestOffer && bestOffer.discountPercent) {
    discount = Math.round((basePrice * bestOffer.discountPercent) / 100);
    appliedOffers.push({
      title: bestOffer.title,
      description: bestOffer.description,
      discountPercent: bestOffer.discountPercent,
      bank: bestOffer.bank,
      validFrom: bestOffer.validFrom,
      validTo: bestOffer.validTo,
    });
  }

  const finalPrice = Math.max(0, basePrice - discount);

  /* ------------------ Create Booking ------------------ */
  const booking = await Booking.create({
    user: req.user.id,
    table: tableId,
    startTime: s,
    endTime: e,
    status: "booked",
    price: basePrice,
    discount,
    finalPrice,
    appliedOffers,
  });

  // After booking, recalc availability
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

  /* ------------------ Response ------------------ */
  res.status(201).json({
    message: "Booking created successfully",
    booking,
    tables: tablesWithStatus,
  });

  /* ------------------ Email Confirmation ------------------ */
  const userEmail = req.user.email;
  sendEmail({
    to: userEmail,
    subject: "🍽️ Booking Confirmed",
    html: `
      <h2>🍽️ Booking Confirmed</h2>
      <p><strong>Table:</strong> ${table.tableNumber}</p>
      <p><strong>From:</strong> ${s.toLocaleString()}</p>
      <p><strong>To:</strong> ${e.toLocaleString()}</p>
      <p><strong>Price:</strong> ₹${basePrice}</p>
      <p><strong>Discount:</strong> ₹${discount}</p>
      <p><strong>Total Paid:</strong> ₹${finalPrice}</p>
      ${appliedOffers.length ? `<p><strong>Offer:</strong> ${appliedOffers[0].title}</p>` : ""}
      <p>Thank you for booking with us!</p>
    `,
  })
    .then(() => console.log("📨 Booking confirmation sent to:", userEmail))
    .catch((err) => console.warn("⚠️ Booking email not sent:", err.message));
});

/* -------------------------------------------------------
   @desc   Update a booking
   @route  PUT /api/bookings/:id
   @access Private/User or Admin
------------------------------------------------------- */
export const updateBooking = asyncHandler(async (req, res) => {
  const { startTime } = req.body;
  if (!startTime) {
    return res.status(400).json({ message: "Start time is required for update" });
  }

  const booking = await Booking.findById(req.params.id).populate("table user");
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  // Authorization: only owner or admin can update
  if (booking.user._id.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ message: "Not authorized to update this booking" });
  }

  const s = new Date(startTime);
  const e = new Date(s.getTime() + 2 * 60 * 60 * 1000); // 2-hour duration

  if (s >= e) {
    return res.status(400).json({ message: "Invalid time range" });
  }

  // Check for overlapping bookings for the same table, excluding the current one
  const overlap = await Booking.findOne({
    _id: { $ne: booking._id }, // Exclude the current booking
    table: booking.table._id,
    status: "booked",
    startTime: { $lt: e },
    endTime: { $gt: s },
  });

  if (overlap) {
    return res.status(400).json({ message: "Table is already booked for this new time" });
  }

  // Store old time for email
  const oldStartTime = booking.startTime.toLocaleString();

  /* ------------------ Price & Offer Recalculation ------------------ */
  const basePrice = Number(booking.table.price || 0);
  const applicableOffers = findApplicableOffers(booking.table.offers || [], s);
  const bestOffer = pickBestOffer(applicableOffers);

  let discount = 0;
  let appliedOffers = [];

  if (bestOffer && bestOffer.discountPercent) {
    discount = Math.round((basePrice * bestOffer.discountPercent) / 100);
    appliedOffers.push({
      title: bestOffer.title,
      description: bestOffer.description,
      discountPercent: bestOffer.discountPercent,
      bank: bestOffer.bank,
      validFrom: bestOffer.validFrom,
      validTo: bestOffer.validTo,
    });
  }

  const finalPrice = Math.max(0, basePrice - discount);

  // Update pricing on the booking
  booking.price = basePrice;
  booking.discount = discount;
  booking.finalPrice = finalPrice;
  booking.appliedOffers = appliedOffers;

  // Update booking times
  booking.startTime = s;
  booking.endTime = e;
  const updatedBooking = await booking.save();

  res.json(updatedBooking);

  // Send update confirmation email
  sendEmail({
    to: booking.user.email,
    subject: "🔄 Your Booking Has Been Updated",
    html: `
      <h2>🔄 Booking Updated</h2>
      <p>Your booking for <strong>Table ${booking.table.tableNumber}</strong> has been successfully updated.</p>
      <p><strong>Old Time:</strong> ${oldStartTime}</p>
      <p><strong>New Time:</strong> ${s.toLocaleString()}</p>
      <p><strong>Price:</strong> ₹${basePrice}</p>
      <p><strong>Discount:</strong> ₹${discount}</p>
      <p><strong>New Total:</strong> ₹${finalPrice}</p>
      ${appliedOffers.length ? `<p><strong>Offer Applied:</strong> ${appliedOffers[0].title}</p>` : ""}
      <p>We look forward to seeing you!</p>
    `,
  }).then(() => console.log("📨 Booking update email sent to:", booking.user.email))
    .catch((err) => console.warn("⚠️ Booking update email not sent:", err.message));
});

/* -------------------------------------------------------
   @desc   Get logged-in user's bookings
   @route  GET /api/bookings/me
   @access Private/User
------------------------------------------------------- */
export const getUserBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id })
    .populate("table")
    .sort({ startTime: -1 });
  res.json(bookings);
});

/* -------------------------------------------------------
   @desc   Cancel a booking
   @route  POST /api/bookings/:id/cancel
   @access Private/User
------------------------------------------------------- */
export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate("table");
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  if (booking.user.toString() !== req.user.id)
    return res.status(403).json({ message: "Not allowed" });

  booking.status = "cancelled";
  await booking.save();

  // Refresh table availability
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

  // Send cancellation email
  const userEmail = req.user.email;
  sendEmail({
    to: userEmail,
    subject: "❌ Booking Cancelled",
    html: `
      <h2>❌ Booking Cancelled</h2>
      <p><strong>Table:</strong> ${booking.table.tableNumber}</p>
      <p><strong>From:</strong> ${booking.startTime.toLocaleString()}</p>
      <p><strong>To:</strong> ${booking.endTime.toLocaleString()}</p>
      <p><strong>Amount Charged:</strong> ₹${booking.finalPrice}</p>
      <p>We hope to see you again soon.</p>
    `,
  })
    .then(() => console.log("📨 Booking cancellation sent to:", userEmail))
    .catch((err) => console.warn("⚠️ Cancellation email not sent:", err.message));
});
