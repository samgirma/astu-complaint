const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

// Import controllers and middleware
const {
  registerStudent,
  login,
  getProfile,
  createStaff,
  createAdmin,
  changePassword
} = require('../controllers/authController');

const {
  authenticateToken,
  checkRole,
  validateASTUEmail
} = require('../middleware/authMiddleware');

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .matches(/^[a-zA-Z]+\.[a-zA-Z]+@astu\.edu\.et$/)
    .withMessage('Email must be in format: firstname.lastname@astu.edu.et'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
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

const createAdminValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

// Public routes
router.post('/register', registerValidation, validateASTUEmail, registerStudent);
router.post('/login', loginValidation, login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/change-password', authenticateToken, changePasswordValidation, changePassword);

// Admin only routes
router.post('/create-staff', authenticateToken, checkRole(['ADMIN']), createStaffValidation, createStaff);
router.post('/create-admin', createAdminValidation, createAdmin);

module.exports = router;
