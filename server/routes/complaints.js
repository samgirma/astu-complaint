const express = require('express');
const { body, query } = require('express-validator');
const multer = require('multer');
const router = express.Router();

// Multer configuration for complaint file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(require('path').extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// Import controllers and middleware
const {
  createComplaint,
  getComplaints,
  getComplaint,
  updateComplaintStatus,
  getDepartments,
  getComplaintStats
} = require('../controllers/complaintController');

const {
  authenticateToken,
  checkRole,
  checkComplaintAccess,
  checkStatusUpdatePermission
} = require('../middleware/authMiddleware');

// Validation rules
const createComplaintValidation = [
  body('body')
    .notEmpty()
    .withMessage('Complaint body is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Complaint body must be between 10 and 1000 characters'),
  body('staffDeptId')
    .notEmpty()
    .withMessage('Department ID is required')
];

const updateStatusValidation = [
  body('status')
    .isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED'])
    .withMessage('Status must be one of: OPEN, IN_PROGRESS, RESOLVED'),
  body('comment')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Comment must not exceed 500 characters')
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
  query('status')
    .optional()
    .isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED'])
    .withMessage('Status must be one of: OPEN, IN_PROGRESS, RESOLVED'),
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters')
];

// Public routes (none - all complaints require authentication)

// Protected routes
router.post('/', authenticateToken, checkRole(['STUDENT']), upload.array('files', 5), createComplaint);
router.get('/', authenticateToken, paginationValidation, getComplaints);
router.get('/departments', authenticateToken, getDepartments);
router.get('/stats', authenticateToken, getComplaintStats);
router.get('/:id', authenticateToken, checkComplaintAccess, getComplaint);
router.put('/:id/status', authenticateToken, checkStatusUpdatePermission, updateStatusValidation, updateComplaintStatus);

module.exports = router;
