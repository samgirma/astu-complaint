const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { quickEmailValidation } = require('../services/emailVerificationService');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Student registration
const registerStudent = asyncHandler(async (req, res) => {
  const { email, password, fullName } = req.body;

  // Additional email validation for security
  const emailValidation = await quickEmailValidation(email);
  if (!emailValidation.valid) {
    return res.status(400).json({
      success: false,
      message: emailValidation.reason
    });
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create student user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName,
      role: 'STUDENT'
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true
    }
  });

  // Generate token
  const token = generateToken(user.id);

  // Create welcome notification
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'NEW_COMPLAINT',
      title: 'Welcome to ASTU Complaint System',
      message: 'Your account has been created successfully. You can now submit complaints.'
    }
  });

  res.status(201).json({
    success: true,
    message: 'Student registered successfully',
    data: {
      user,
      token
    }
  });
});

// User login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      staffDepartment: true
    }
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check user status
  if (user.status === 'suspended') {
    return res.status(403).json({
      success: false,
      message: 'Your account has been suspended. Please contact the administrator for assistance.'
    });
  }

  if (user.status === 'inactive') {
    return res.status(403).json({
      success: false,
      message: 'Your account is currently inactive. Please contact the administrator to activate your account.'
    });
  }

  // Generate token
  const token = generateToken(user.id);

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: userWithoutPassword,
      token
    }
  });
});

// Get user profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      staffDepartment: true,
      _count: {
        select: {
          createdComplaints: true,
          notifications: {
            where: { isRead: false }
          }
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.status(200).json({
    success: true,
    data: {
      user: {
        ...userWithoutPassword,
        unreadNotifications: user._count.notifications
      }
    }
  });
});

// Create staff user (Admin only)
const createStaff = asyncHandler(async (req, res) => {
  const { email, fullName, staffDeptId } = req.body;

  // Check if department exists
  const department = await prisma.staffDepartment.findUnique({
    where: { id: staffDeptId }
  });

  if (!department) {
    return res.status(400).json({
      success: false,
      message: 'Staff department not found'
    });
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Generate temporary password
  const tempPassword = Math.random().toString(36).slice(-8);
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

  // Create staff user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName,
      role: 'STAFF',
      staffDeptId
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      staffDeptId: true,
      createdAt: true
    }
  });

  // Create notification for new staff
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'NEW_COMPLAINT',
      title: 'Account Created',
      message: `Your staff account has been created. Temporary password: ${tempPassword}. Please change it after first login.`
    }
  });

  res.status(201).json({
    success: true,
    message: 'Staff user created successfully',
    data: {
      user,
      tempPassword
    }
  });
});

// Create admin user (seed/one-time)
const createAdmin = asyncHandler(async (req, res) => {
  const { email, password, fullName } = req.body;

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (existingAdmin) {
    return res.status(400).json({
      success: false,
      message: 'Admin user already exists'
    });
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create admin user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName,
      role: 'ADMIN'
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true
    }
  });

  res.status(201).json({
    success: true,
    message: 'Admin user created successfully',
    data: {
      user
    }
  });
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  // Get current user
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Hash new password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword }
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: userId,
      type: 'STATUS_UPDATE',
      title: 'Password Changed',
      message: 'Your password has been changed successfully.'
    }
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

module.exports = {
  registerStudent,
  login,
  getProfile,
  createStaff,
  createAdmin,
  changePassword
};
