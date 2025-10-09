// 🛡️ jwtService.js
import jwt from "jsonwebtoken";

/**
 * Generate a JWT token for a given user ID
 * @param {string|number} userId - The user's unique identifier
 * @param {string} [expiresIn=process.env.JWT_EXPIRES_IN || '7d'] - Optional custom expiry
 * @returns {string} Signed JWT token
 */
export const generateToken = (userId, expiresIn = process.env.JWT_EXPIRES_IN || "7d") => {
  if (!process.env.JWT_SECRET) {
    throw new Error("❌ JWT_SECRET is not defined in environment variables");
  }

  if (!userId) {
    throw new Error("❌ Cannot generate JWT: missing userId");
  }

  try {
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn });
    console.log(`✅ JWT generated for userId: ${userId} | Expires in: ${expiresIn}`);
    return token;
  } catch (err) {
    console.error("❌ Error generating JWT:", err.message);
    throw err;
  }
};

/**
 * Verify and decode a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {object|null} Decoded payload or null if invalid/expired
 */
export const verifyToken = (token) => {
  if (!token) {
    console.warn("⚠️ No token provided to verifyToken");
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      console.warn("⚠️ JWT token expired");
    } else if (error.name === "JsonWebTokenError") {
      console.warn("⚠️ Invalid JWT token");
    } else {
      console.warn("⚠️ JWT verification error:", error.message);
    }
    return null;
  }
};
