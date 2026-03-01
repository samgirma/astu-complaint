const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendPasswordResetEmail } = require('../services/mailerService');
const { generatePasswordResetToken } = require('../utils/tokenUtils');
const { quickEmailValidation } = require('../services/emailVerificationService');
const { sendNotificationToAdmins } = require('../utils/notificationService');
const { validatePassword } = require('../services/passwordValidationService');

// Shared Prisma client instance
const prisma = new PrismaClient();

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

  // Strong password validation
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Password does not meet security requirements',
      requirements: passwordValidation.requirements
    });
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'There is already a registered user with that email'
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

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  // Create welcome notification for user
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'NEW_COMPLAINT',
      title: 'Welcome to ASTU Complaint System',
      message: 'Your account has been created successfully. You can now submit complaints.'
    }
  });

  // Send notification to all admin users about new registration
  await sendNotificationToAdmins({
    title: 'New Student Registration',
    message: `New student ${fullName} (${email}) has registered successfully.`,
    type: 'NEW_COMPLAINT'
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

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: userWithoutPassword,
      token,
      requiresPasswordChange: user.role === 'STAFF' && !user.passwordChanged
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
      message: 'There is already a registered user with that email'
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

  // Check if user with this email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'There is already a registered user with that email'
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

// Check if user exists and return profile info for confirmation
const checkUserForPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {
    // Validate email structure
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        fullName: true,
        email: true,
        profilePicture: true,
        role: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Generate user initials for profile display
    const initials = user.fullName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');

    // Return user profile info for confirmation
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        profilePicture: user.profilePicture,
        initials: initials,
        role: user.role
      },
      message: 'User found. Please confirm to send password reset email.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Forgot password - send reset link to email (after user confirmation)
const forgotPassword = asyncHandler(async (req, res) => {
  const { email, userId } = req.body;

  try {
    // Validate email structure
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Find user and verify it matches the confirmed user ID
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        staffDepartment: true
      }
    });

    if (!user || user.id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    // Generate password reset token
    const { token, expiresAt } = generatePasswordResetToken(user.id);

    // Save token to database
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt
      }
    });

    // Send reset email
    await sendPasswordResetEmail(email, user.fullName, token);

    res.status(200).json({
      success: true,
      message: 'Password reset instructions have been sent to your email'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify reset token
const verifyResetToken = asyncHandler(async (req, res) => {
  const { token } = req.query;

  try {
    // Find valid token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: resetToken.userId }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        email: user.email,
        message: 'Token is valid'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reset password with valid token
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Find and validate token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'New password does not meet security requirements',
        requirements: passwordValidation.requirements
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        password: hashedPassword,
        passwordChanged: true // Mark that user has changed password
      }
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true }
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = {
  registerStudent,
  login,
  getProfile,
  createStaff,
  createAdmin,
  changePassword,
  checkUserForPasswordReset,
  forgotPassword,
  verifyResetToken,
  resetPassword
};
