const crypto = require('crypto');

/**
 * Generate a secure random token
 * @param {number} length - Token length (default 32)
 * @returns {string} - Generated token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a password reset token with expiration
 * @param {string} userId - User ID
 * @returns {object} - Token and expiration
 */
const generatePasswordResetToken = (userId) => {
  const token = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  
  return {
    token,
    expiresAt,
    userId
  };
};

module.exports = {
  generateSecureToken,
  generatePasswordResetToken
};
