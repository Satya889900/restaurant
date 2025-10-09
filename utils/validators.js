// 🧩 validators.js

/**
 * ✅ Validate if a string is a properly formatted email address
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (typeof email !== "string") return false;
  // More robust regex covering subdomains and modern TLDs
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return regex.test(email.trim());
};

/**
 * 🔐 Validate if a password meets strength requirements
 * Default rule: minimum 6 chars, includes at least one letter and one number
 * @param {string} password
 * @returns {boolean}
 */
export const isValidPassword = (password) => {
  if (typeof password !== "string") return false;
  const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=]{6,}$/;
  return strongPasswordRegex.test(password);
};

/**
 * 🔢 Validate if a number is a positive integer
 * @param {number} num
 * @returns {boolean}
 */
export const isPositiveNumber = (num) => {
  return typeof num === 'number' && Number.isFinite(num) && Number.isInteger(num) && num > 0;
};
