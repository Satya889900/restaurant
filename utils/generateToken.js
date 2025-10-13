import jwt from "jsonwebtoken";

/**
 * Generates a JWT for a user
 * @param {string} id The user's ID
 * @returns {string} The generated JWT
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

export default generateToken;