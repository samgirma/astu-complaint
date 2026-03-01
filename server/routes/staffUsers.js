const express = require('express');
const { body } = require('express-validator');
const staffUserController = require('../controllers/staffUserController');
const { authenticateToken } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Validation rules
const createStaffUserValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number cannot exceed 20 characters'),
  body('departmentId')
    .notEmpty()
    .withMessage('Department is required')
    .isString()
    .withMessage('Department ID must be a string'),
  body('role')
    .isIn(['staff', 'department_head', 'supervisor'])
    .withMessage('Please select a valid role'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Please select a valid status')
  // Password is now auto-generated, no longer required in request
];

const updateStaffUserValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number cannot exceed 20 characters'),
  body('departmentId')
    .optional()
    .isString()
    .withMessage('Department ID must be a string'),
  body('role')
    .optional()
    .isIn(['staff', 'department_head', 'supervisor'])
    .withMessage('Please select a valid role'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Please select a valid status'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(adminAuth);

// GET /api/admin/staff-users - Get all staff users
router.get('/', staffUserController.getAllStaffUsers);

// GET /api/admin/staff-users/:id - Get single staff user
router.get('/:id', staffUserController.getStaffUserById);

// POST /api/admin/staff-users - Create new staff user
router.post('/', createStaffUserValidation, staffUserController.createStaffUser);

// PUT /api/admin/staff-users/:id - Update staff user
router.put('/:id', updateStaffUserValidation, staffUserController.updateStaffUser);

// DELETE /api/admin/staff-users/:id - Delete staff user
router.delete('/:id', staffUserController.deleteStaffUser);

// GET /api/admin/staff-users/department/:departmentId - Get staff users by department
router.get('/department/:departmentId', staffUserController.getStaffUsersByDepartment);

module.exports = router;
