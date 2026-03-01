const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

// Import middleware and utilities
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { prisma } = require('../config/database');

// All student routes require admin authentication
router.use(authenticateToken);
router.use(checkRole(['ADMIN']));

// Get all students with pagination and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
  query('sortBy').optional().isIn(['createdAt', 'fullName', 'email', 'complaintCount']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order')
], asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    // Build where clause
    const where = {
      role: 'STUDENT'
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    // Get students with complaint counts
    const students = await prisma.user.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        profilePicture: true,
        _count: {
          select: {
            createdComplaints: true
          }
        }
      }
    });

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    // Get analytics data
    const analytics = await getStudentAnalytics();

    res.status(200).json({
      success: true,
      data: {
        students,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        analytics
      }
    });

  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students'
    });
  }
}));

// Get student details with comprehensive analytics
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const student = await prisma.user.findUnique({
      where: { id, role: 'STUDENT' },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        profilePicture: true,
        createdComplaints: {
          select: {
            id: true,
            body: true,
            status: true,
            issueDate: true,
            resolvedAt: true,
            staffDepartment: {
              select: {
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Calculate student-specific analytics
    const studentAnalytics = {
      totalComplaints: student.createdComplaints.length,
      resolvedComplaints: student.createdComplaints.filter(c => c.status === 'RESOLVED').length,
      pendingComplaints: student.createdComplaints.filter(c => c.status === 'OPEN').length,
      inProgressComplaints: student.createdComplaints.filter(c => c.status === 'IN_PROGRESS').length,
      averageResolutionTime: calculateAverageResolutionTime(student.createdComplaints),
      mostActiveDepartment: getMostActiveDepartment(student.createdComplaints),
      recentActivity: student.createdComplaints.slice(0, 5)
    };

    res.status(200).json({
      success: true,
      data: {
        student: {
          ...student,
          analytics: studentAnalytics
        }
      }
    });

  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student details'
    });
  }
}));

// Update student status
router.patch('/:id/status', [
  body('status').isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const student = await prisma.user.findUnique({
      where: { id, role: 'STUDENT' }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const updatedStudent = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Student status updated successfully',
      data: { student: updatedStudent }
    });

  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Failed to update student status'
    });
  }
}));

// Get comprehensive student analytics
router.get('/analytics/overview', asyncHandler(async (req, res) => {
  try {
    const analytics = await getStudentAnalytics();
    
    res.status(200).json({
      success: true,
      data: { analytics }
    });

  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student analytics'
    });
  }
}));

// Helper functions
const getStudentAnalytics = async () => {
  const [
    totalStudents,
    activeStudents,
    inactiveStudents,
    suspendedStudents,
    recentStudents,
    studentsWithComplaints,
    totalComplaintsByStudents
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'STUDENT', status: 'active' } }),
    prisma.user.count({ where: { role: 'STUDENT', status: 'inactive' } }),
    prisma.user.count({ where: { role: 'STUDENT', status: 'suspended' } }),
    prisma.user.count({
      where: { 
        role: 'STUDENT',
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }
    }),
    prisma.user.count({
      where: {
        role: 'STUDENT',
        createdComplaints: {
          some: {}
        }
      }
    }),
    prisma.complaint.count({
      where: {
        student: {
          role: 'STUDENT'
        }
      }
    })
  ]);

  // Get monthly registration trends
  const monthlyRegistrations = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', "createdAt") as month,
      COUNT(*) as count
    FROM users 
    WHERE role = 'STUDENT' 
      AND "createdAt" >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY month DESC
  `;

  // Get top active students by complaint count
  const topActiveStudents = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      fullName: true,
      email: true,
      _count: {
        select: {
          createdComplaints: true
        }
      }
    },
    orderBy: {
      createdComplaints: {
        _count: 'desc'
      }
    },
    take: 10
  });

  return {
    overview: {
      totalStudents,
      activeStudents,
      inactiveStudents,
      suspendedStudents,
      recentStudents,
      studentsWithComplaints,
      totalComplaintsByStudents
    },
    trends: {
      monthlyRegistrations,
      topActiveStudents
    }
  };
};

const calculateAverageResolutionTime = (complaints) => {
  const resolvedComplaints = complaints.filter(c => c.status === 'RESOLVED' && c.resolvedAt);
  if (resolvedComplaints.length === 0) return 0;
  
  const totalTime = resolvedComplaints.reduce((sum, complaint) => {
    const resolutionTime = new Date(complaint.resolvedAt) - new Date(complaint.issueDate);
    return sum + resolutionTime;
  }, 0);
  
  return Math.round(totalTime / resolvedComplaints.length / (1000 * 60 * 60 * 24)); // Convert to days
};

const getMostActiveDepartment = (complaints) => {
  const departmentCounts = {};
  complaints.forEach(complaint => {
    const deptName = complaint.staffDepartment?.name || 'Unknown';
    departmentCounts[deptName] = (departmentCounts[deptName] || 0) + 1;
  });
  
  return Object.keys(departmentCounts).length > 0
    ? Object.entries(departmentCounts).sort(([,a], [,b]) => b - a)[0][0]
    : null;
};

module.exports = router;
