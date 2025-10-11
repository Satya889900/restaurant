// models/Table.js
import mongoose from "mongoose";

const timeRangeSchema = new mongoose.Schema(
  {
    from: { type: String, required: true }, // "HH:mm"
    to: { type: String, required: true },   // "HH:mm"
  },
  { _id: false }
);

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String }, // e.g. "Starter", "Main", "Dessert"
    veg: { type: Boolean, default: true },
    price: { type: Number, default: 0 },
    description: { type: String },
    // availability windows during a day (can have multiple ranges)
    availableTimes: { type: [timeRangeSchema], default: [] },
    // optional days of week availability, 0=Sunday .. 6=Saturday; empty => everyday
    availableDays: { type: [Number], default: [] },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    bank: { type: String }, // e.g. "HDFC 10% cashback"
    discountPercent: { type: Number, min: 0, max: 100 },
    validFrom: { type: Date },
    validTo: { type: Date },
    active: { type: Boolean, default: true },
  },
  { _id: false }
);

const locationSchema = new mongoose.Schema(
  {
    address: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String },
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
);

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: Number,
      required: [true, "Table number is required"],
      unique: true,
    },
    seats: {
      type: Number,
      required: [true, "Seats count is required"],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },

    // NEW FIELDS
    location: { type: locationSchema },
    restaurantImages: { type: [String], default: [] }, // Array of image URLs

    // types of food available (a simple array of strings) - optional summary
    foodTypes: { type: [String], default: [] }, // e.g. ["Italian", "Chinese"]

    // full food menu (detailed)
    foodMenu: { type: [menuItemSchema], default: [] },

    // table class: 1st-class, 2nd-class, 3rd-class, general
    tableClass: {
      type: String,
      enum: ["1st-class", "2nd-class", "3rd-class", "general"],
      default: "general",
    },
    classFeatures: { type: [String], default: [] }, // features provided per table/class

    // price for the table (per default booking slot / per hour — your choice)
    price: { type: Number, default: 0 },

    // offers
    offers: { type: [offerSchema], default: [] },

    // optional notes
    notes: { type: String },
  },
  { timestamps: true }
);

const Table = mongoose.model("Table", tableSchema);
export default Table;
