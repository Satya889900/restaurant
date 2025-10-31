import User from "../models/userModel.js";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";
import bcrypt from "bcryptjs";
import asyncHandler from "express-async-handler";

/* ===========================================================
   REGISTER USER
   POST /api/auth/register
   Public
=========================================================== */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please add all fields");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Check if any admin user exists. If not, the first user becomes an admin.
  const adminCount = await User.countDocuments({ role: "admin" });
  const role = adminCount === 0 ? "admin" : "user";

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

/* ===========================================================
   LOGIN USER
   POST /api/auth/login
   Public
=========================================================== */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide both email and password");
  }

  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

/* ===========================================================
   GET USER PROFILE (PRIVATE)
   GET /api/auth/me
=========================================================== */
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(req.user);
});

/* ===========================================================
   FORGOT PASSWORD (Send OTP)
   POST /api/auth/forgot-password
=========================================================== */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  // Security: don’t reveal user existence
  if (!user) {
    return res.status(200).json({
      message: "If an account with that email exists, an OTP has been sent.",
    });
  }

  // Generate OTP and store hashed version
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const salt = await bcrypt.genSalt(10);
  user.passwordResetOTP = await bcrypt.hash(otp, salt);
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  // Respond to the user immediately
  res.status(200).json({ message: "OTP has been sent to your email." });

  // Send the email in the background without making the user wait
  sendEmail({
    to: user.email,
    subject: "Your Password Reset OTP",
    text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Password Reset Request</h2>
        <p>Hello ${user.name || "User"},</p>
        <p>Your one-time password (OTP) is:</p>
        <h1 style="color:#4F46E5;">${otp}</h1>
        <p>This code is valid for 10 minutes. Do not share it with anyone.</p>
      </div>
    `,
  }).catch(async (error) => {
    // If email fails, log the error and clear the OTP from the database
    console.error("Background email send error:", error);
    user.passwordResetOTP = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
  });
});

/* ===========================================================
   RESET PASSWORD WITH OTP
   POST /api/auth/reset-password
=========================================================== */
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email, OTP, and new password." });
  }

  const user = await User.findOne({
    email,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res
      .status(400)
      .json({ message: "Invalid OTP or OTP has expired." });
  }

  const isMatch = await bcrypt.compare(otp, user.passwordResetOTP);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid OTP." });
  }

  // Hash and save new password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);
  user.passwordResetOTP = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Respond to the user immediately
  res.status(200).json({ message: "Password has been reset successfully." });

  // Send confirmation email in the background
  sendEmail({
    to: user.email,
    subject: "Your Password Has Been Reset",
    text: `Hello ${user.name},\n\nThis is a confirmation that the password for your account has just been changed.\n\nIf you did not make this change, please contact our support team immediately.\n\nBest regards,\nFineDine Team`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Password Reset Confirmation</h2>
        <p>Hello ${user.name || "User"},</p>
        <p>This is a confirmation that the password for your account has just been changed.</p>
        <p>If you did not make this change, please contact our support team immediately.</p>
      </div>
    `,
  }).catch((emailError) => {
    // If the confirmation email fails, just log it. Don't interrupt the user.
    console.error("Failed to send password reset confirmation email:", emailError);
  });
});
