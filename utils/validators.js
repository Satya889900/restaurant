/**
 * Check if a string is a valid email
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  return regex.test(email);
};

/**
 * Check if a password meets minimum requirements
 * @param {string} password
 * @returns {boolean}
 */
const isValidPassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};

/**
 * Check if a number is a positive integer
 * @param {number} num
 * @returns {boolean}
 */
const isPositiveNumber = (num) => {
  return Number.isInteger(num) && num > 0;
};

module.exports = { isValidEmail, isValidPassword, isPositiveNumber };
