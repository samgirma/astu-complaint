const express = require('express');
const router = express.Router();

const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, checkRole } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Admin analytics - Admin only
router.get(
  '/admin',
  checkRole('ADMIN'),
  analyticsController.getAdminAnalytics
);

// Department analytics - Department Staff and Admin
router.get(
  '/department',
  checkRole('DEPARTMENT_STAFF', 'ADMIN'),
  analyticsController.getDepartmentAnalytics
);

// Student analytics - All authenticated users
router.get(
  '/student',
  analyticsController.getStudentAnalytics
);

// Export analytics data - Admin only
router.get(
  '/export',
  checkRole('ADMIN'),
  validatePagination,
  analyticsController.exportAnalytics
);

module.exports = router;
