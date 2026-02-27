const express = require('express');
const { body } = require('express-validator');
const staffController = require('../controllers/staffController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Validation rules
const createStaffValidation = [
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
  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required')
    .isIn([
      'IT Department',
      'Facilities Management',
      'Academic Affairs',
      'Student Services',
      'Finance Department',
      'Human Resources',
      'Library Services',
      'Security Department'
    ])
    .withMessage('Please select a valid department'),
  body('role')
    .optional()
    .isIn(['staff', 'department_head', 'supervisor'])
    .withMessage('Please select a valid role'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Please select a valid status')
];

const updateStaffValidation = [
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
  body('department')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Department cannot be empty')
    .isIn([
      'IT Department',
      'Facilities Management',
      'Academic Affairs',
      'Student Services',
      'Finance Department',
      'Human Resources',
      'Library Services',
      'Security Department'
    ])
    .withMessage('Please select a valid department'),
  body('role')
    .optional()
    .isIn(['staff', 'department_head', 'supervisor'])
    .withMessage('Please select a valid role'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Please select a valid status')
];

// Apply authentication middleware to all routes
router.use(auth);
router.use(adminAuth);

// GET /api/admin/staff - Get all staff members
router.get('/', staffController.getAllStaff);

// GET /api/admin/staff/:id - Get single staff member
router.get('/:id', staffController.getStaffById);

// POST /api/admin/staff - Create new staff member
router.post('/', createStaffValidation, staffController.createStaff);

// PUT /api/admin/staff/:id - Update staff member
router.put('/:id', updateStaffValidation, staffController.updateStaff);

// DELETE /api/admin/staff/:id - Delete staff member
router.delete('/:id', staffController.deleteStaff);

// GET /api/admin/staff/department/:department - Get staff by department
router.get('/department/:department', staffController.getStaffByDepartment);

module.exports = router;
