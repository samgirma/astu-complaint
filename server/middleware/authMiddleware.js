const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Email validation regex for ASTU emails
const ASTU_EMAIL_REGEX = /^[a-zA-Z]+\.[a-zA-Z]+@astu\.edu\.et$/;

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        staffDepartment: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token - user not found' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

// Role-based access control middleware
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied - insufficient permissions' 
      });
    }

    next();
  };
};

// Middleware to validate ASTU email format
const validateASTUEmail = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required' 
    });
  }

  if (!ASTU_EMAIL_REGEX.test(email)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email must be in format: firstname.lastname@astu.edu.et' 
    });
  }

  next();
};

// Middleware to check if user can access specific complaint
const checkComplaintAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const userDeptId = req.user.staffDeptId;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        student: true,
        staffDepartment: true
      }
    });

    if (!complaint) {
      return res.status(404).json({ 
        success: false, 
        message: 'Complaint not found' 
      });
    }

    // Students can only access their own complaints
    if (userRole === 'STUDENT' && complaint.studentId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied - can only access your own complaints' 
      });
    }

    // Staff can only access complaints from their department
    if (userRole === 'STAFF' && complaint.staffDeptId !== userDeptId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied - complaint not in your department' 
      });
    }

    // Admins can access all complaints
    if (userRole === 'ADMIN') {
      // Allow access
    }

    req.complaint = complaint;
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error checking complaint access' 
    });
  }
};

// Middleware to check if user can modify complaint status
const checkStatusUpdatePermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    const userDeptId = req.user.staffDeptId;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        student: true,
        staffDepartment: true
      }
    });

    if (!complaint) {
      return res.status(404).json({ 
        success: false, 
        message: 'Complaint not found' 
      });
    }

    // Students can only approve/decline resolved complaints
    if (userRole === 'STUDENT') {
      if (complaint.status !== 'RESOLVED') {
        return res.status(403).json({ 
          success: false, 
          message: 'Only resolved complaints can be approved or declined' 
        });
      }

      if (complaint.studentId !== userId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Can only approve/decline your own complaints' 
        });
      }

      // Students can only set status back to IN_PROGRESS or OPEN
      if (status !== 'IN_PROGRESS' && status !== 'OPEN') {
        return res.status(400).json({ 
          success: false, 
          message: 'Students can only revert to IN_PROGRESS or OPEN' 
        });
      }
    }

    // Staff can only update complaints in their department
    if (userRole === 'STAFF') {
      if (complaint.staffDeptId !== userDeptId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Can only update complaints in your department' 
        });
      }

      // Staff can only set to IN_PROGRESS or RESOLVED
      if (status !== 'IN_PROGRESS' && status !== 'RESOLVED') {
        return res.status(400).json({ 
          success: false, 
          message: 'Staff can only set status to IN_PROGRESS or RESOLVED' 
        });
      }
    }

    // Admins can update any complaint
    if (userRole === 'ADMIN') {
      // Allow any status change
    }

    req.complaint = complaint;
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error checking status update permission' 
    });
  }
};

module.exports = {
  authenticateToken,
  checkRole,
  validateASTUEmail,
  checkComplaintAccess,
  checkStatusUpdatePermission
};
