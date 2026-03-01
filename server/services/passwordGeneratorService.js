const crypto = require('crypto');

/**
 * Generate a random secure password
 * @param {number} length - Password length (default 12)
 * @returns {string} - Generated password
 */
const generateSecurePassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each required category
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  
  // Add one character from each category
  password += lowercase.charAt(crypto.randomInt(0, lowercase.length));
  password += uppercase.charAt(crypto.randomInt(0, uppercase.length));
  password += numbers.charAt(crypto.randomInt(0, numbers.length));
  password += special.charAt(crypto.randomInt(0, special.length));
  
  // Fill the rest with random characters from the full charset
  for (let i = 4; i < length; i++) {
    password += charset.charAt(crypto.randomInt(0, charset.length));
  }
  
  // Shuffle the password to randomize character positions
  return password.split('').sort(() => crypto.randomInt(-1, 2)).join('');
};

/**
 * Generate a temporary password for staff registration
 * @returns {string} - Generated temporary password
 */
const generateTemporaryPassword = () => {
  return generateSecurePassword(10); // Slightly shorter for temporary passwords
};

module.exports = {
  generateSecurePassword,
  generateTemporaryPassword
};
