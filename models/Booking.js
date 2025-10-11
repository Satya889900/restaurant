import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["booked", "cancelled", "completed"],
      default: "booked",
    },

    // 🆕 Pricing and offers
    price: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    finalPrice: { type: Number, default: 0 },
    appliedOffers: [
      {
        title: String,
        description: String,
        discountPercent: Number,
        bank: String,
        validFrom: Date,
        validTo: Date,
      },
    ],
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
