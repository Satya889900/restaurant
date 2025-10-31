import express from "express";
// import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import uploadRoutes from "./routes/upload.js";
import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

import tableRoutes from "./routes/tableRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

// dotenv.config();

// Connect MongoDB
connectDB();

// Ensure the uploads directory exists
const uploadsDir = "./uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const app = express();

// Enable CORS for frontend
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Body Parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Root Route
app.get("/", (req, res) => {
  res.send("✅ API is running...");
});

// Routes
app.use("/api/tables", tableRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", uploadRoutes);
app.use("/api/contact", contactRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start Server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
export default app;

