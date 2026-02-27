const express = require('express');
const { body } = require('express-validator');
const staffController = require('../controllers/staffController');
const { authenticateToken } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Validation rules
const createDepartmentValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Department name is required')
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

const updateDepartmentValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Department name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(adminAuth);

// GET /api/admin/staff/departments - Get all departments
router.get('/departments', staffController.getAllDepartments);

// GET /api/admin/staff/departments/:id - Get single department
router.get('/departments/:id', staffController.getDepartmentById);

// POST /api/admin/staff/departments - Create new department
router.post('/departments', createDepartmentValidation, staffController.createDepartment);

// PUT /api/admin/staff/departments/:id - Update department
router.put('/departments/:id', updateDepartmentValidation, staffController.updateDepartment);

// DELETE /api/admin/staff/departments/:id - Delete department
router.delete('/departments/:id', staffController.deleteDepartment);

// GET /api/admin/staff/departments/:departmentId/members - Get department members
router.get('/departments/:departmentId/members', staffController.getDepartmentMembers);

// Legacy routes for backward compatibility
router.get('/', staffController.getAllDepartments);
router.get('/:id', staffController.getDepartmentById);
router.post('/', createDepartmentValidation, staffController.createDepartment);
router.put('/:id', updateDepartmentValidation, staffController.updateDepartment);
router.delete('/:id', staffController.deleteDepartment);
router.get('/department/:department', staffController.getDepartmentMembers);

module.exports = router;
