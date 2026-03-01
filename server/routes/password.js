const express = require('express');
const { body, validationResult } = require('express-validator');
const { changePassword } = require('../controllers/passwordController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Validation rules for password change
const passwordChangeValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .custom((value) => {
      const { validatePassword } = require('../services/passwordValidationService');
      const validation = validatePassword(value);
      if (!validation.isValid) {
        throw new Error('New password does not meet security requirements');
      }
      return true;
    })
];

// POST /api/password/change - Change user password
router.post('/change', passwordChangeValidation, changePassword);

module.exports = router;
