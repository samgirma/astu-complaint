const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

// Import controllers and middleware
const {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
  getUsers,
  sendWarningToDepartment,
  getAnalytics,
  getSystemHealth
} = require('../controllers/adminController');

const {
  authenticateToken,
  checkRole
} = require('../middleware/authMiddleware');

// Validation rules
const createDepartmentValidation = [
  body('name')
    .notEmpty()
    .withMessage('Department name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Department name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Department name can only contain letters and spaces'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
];

const updateDepartmentValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Department name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Department name can only contain letters and spaces'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
];

const createStaffValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('staffDeptId')
    .notEmpty()
    .withMessage('Department ID is required')
];

const sendWarningValidation = [
  body('title')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters'),
  body('message')
    .optional()
    .isLength({ min: 5, max: 500 })
    .withMessage('Message must be between 5 and 500 characters')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('role')
    .optional()
    .isIn(['STUDENT', 'STAFF', 'ADMIN'])
    .withMessage('Role must be one of: STUDENT, STAFF, ADMIN'),
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters')
];

const analyticsValidation = [
  query('timeframe')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Timeframe must be between 1 and 365 days')
];

// All admin routes require authentication and admin role
router.use(authenticateToken, checkRole(['ADMIN']));

// Department management routes
router.post('/departments', createDepartmentValidation, createDepartment);
router.get('/departments', getDepartments);
router.put('/departments/:id', updateDepartmentValidation, updateDepartment);
router.delete('/departments/:id', deleteDepartment);

// User management routes
router.get('/users', paginationValidation, getUsers);

// Warning system routes
router.post('/warn/:staffDeptId', sendWarningValidation, sendWarningToDepartment);

// Analytics routes
router.get('/analytics', analyticsValidation, getAnalytics);
router.get('/health', getSystemHealth);

module.exports = router;
