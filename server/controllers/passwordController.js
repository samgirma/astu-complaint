const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler');
const { validatePassword } = require('../services/passwordValidationService');

const prisma = new PrismaClient();

// Change password for staff users (first login or password reset)
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  // Find user
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

  // Validate new password strength
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
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password and mark as changed
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedNewPassword,
      passwordChanged: true
    }
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

module.exports = {
  changePassword
};
