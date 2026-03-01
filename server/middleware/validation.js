const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .matches(/^[^@]+@astu\.edu\.et$/)
    .withMessage('Only @astu.edu.et email addresses are allowed'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('role')
    .optional()
    .isIn(['STUDENT', 'DEPARTMENT_STAFF', 'ADMIN'])
    .withMessage('Invalid role specified'),
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .matches(/^[^@]+@astu\.edu\.et$/)
    .withMessage('Only @astu.edu.et email addresses are allowed'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Complaint creation validation
const validateComplaintCreation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .isIn(['Dorm', 'Lab', 'Wifi', 'Classroom', 'Library', 'Cafeteria', 'Other'])
    .withMessage('Invalid category specified'),
  handleValidationErrors
];

// Complaint status update validation
const validateStatusUpdate = [
  param('id')
    .isUUID()
    .withMessage('Invalid complaint ID'),
  body('status')
    .isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
    .withMessage('Invalid status specified'),
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  handleValidationErrors
];

// Comment creation validation
const validateCommentCreation = [
  param('complaintId')
    .isUUID()
    .withMessage('Invalid complaint ID'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// Chat message validation
const validateChatMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Message must be between 1 and 500 characters'),
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateComplaintCreation,
  validateStatusUpdate,
  validateCommentCreation,
  validateId,
  validatePagination,
  validateChatMessage,
  handleValidationErrors
};
