import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ✅ Generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// ✅ @desc   Register new user
// ✅ @route  POST /api/auth/register
// ✅ @access Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // 1️⃣ Validate fields
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide all fields");
  }

  // 2️⃣ Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // 3️⃣ Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 4️⃣ Create user (allow role only if explicitly passed)
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role && ["admin", "user"].includes(role) ? role : "user",
  });

  if (user) {
    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// ✅ @desc   Login user
// ✅ @route  POST /api/auth/login
// ✅ @access Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1️⃣ Basic validation
  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email & password");
  }

  // 2️⃣ Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  // 3️⃣ Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  // 4️⃣ Success response
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token: generateToken(user._id),
  });
});

// ✅ @desc   Get logged-in user info
// ✅ @route  GET /api/auth/me
// ✅ @access Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json(user);
});
