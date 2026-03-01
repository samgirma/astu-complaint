const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { generateTemporaryPassword } = require('../services/passwordGeneratorService');

const prisma = new PrismaClient();

// Get all staff users
exports.getAllStaffUsers = async (req, res) => {
  try {
    const staffUsers = await prisma.user.findMany({
      where: {
        role: 'STAFF'
      },
      include: {
        staffDepartment: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Staff users retrieved successfully',
      data: {
        staffUsers: staffUsers.map(user => ({
          id: user.id,
          name: user.fullName,
          email: user.email,
          phone: user.phone,
          department: user.staffDepartment?.name || 'Unassigned',
          departmentId: user.staffDeptId,
          role: user.role.toLowerCase(),
          status: user.status || 'active',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }))
      }
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff users',
      error: error.message
    });
  }
};

// Get single staff user
exports.getStaffUserById = async (req, res) => {
  try {
    const staffUser = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        staffDepartment: true
      }
    });
    
    if (!staffUser) {
      return res.status(404).json({
        success: false,
        message: 'Staff user not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Staff user retrieved successfully',
      data: {
        staffUser: {
          id: staffUser.id,
          name: staffUser.fullName,
          email: staffUser.email,
          phone: staffUser.phone,
          department: staffUser.staffDepartment?.name || 'Unassigned',
          departmentId: staffUser.staffDeptId,
          role: staffUser.role.toLowerCase(),
          status: staffUser.status || 'active',
          createdAt: staffUser.createdAt,
          updatedAt: staffUser.updatedAt
        }
      }
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff user',
      error: error.message
    });
  }
};

// Create new staff user
exports.createStaffUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, email, phone, departmentId, role, status } = req.body;

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    

    // Check if user already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check if department exists
    if (departmentId) {
      const department = await prisma.staffDepartment.findUnique({
        where: { id: departmentId }
      });
      if (!department) {
        return res.status(400).json({
          success: false,
          message: 'Department not found'
        });
      }
    }

    // Hash temporary password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(temporaryPassword, saltRounds);

    const newStaffUser = await prisma.user.create({
      data: {
        fullName: name,
        email,
        phone,
        staffDeptId: departmentId,
        role: role.toUpperCase(),
        status: status || 'active',
        password: hashedPassword,
        passwordChanged: false // Flag to indicate password needs to be changed
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newStaffUser;

    // Create notification for the admin who created the staff user
    await prisma.notification.create({
      data: {
        userId: req.user.id, // The admin who created the staff user
        type: 'ADMIN_WARNING', // Using existing type for admin notifications
        title: 'Staff User Created Successfully',
        message: `New staff user ${name} has been created. Email: ${email}, Temporary Password: ${temporaryPassword}. Please share these credentials with the staff member.`,
        isRead: false
      }
    });

    res.status(201).json({
      success: true,
      message: 'Staff user created successfully',
      data: {
        staffUser: {
          id: userWithoutPassword.id,
          name: userWithoutPassword.fullName,
          email: userWithoutPassword.email,
          phone: userWithoutPassword.phone,
          departmentId: userWithoutPassword.staffDeptId,
          role: userWithoutPassword.role.toLowerCase(),
          status: userWithoutPassword.status || 'active',
          createdAt: userWithoutPassword.createdAt,
          updatedAt: userWithoutPassword.updatedAt
        },
        temporaryPassword: temporaryPassword // Include temporary password in response
      }
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Failed to create staff user',
      error: error.message
    });
  }
};

// Update staff user
exports.updateStaffUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, email, phone, departmentId, role, status, password } = req.body;
    const userId = req.params.id;

    // Check if staff user exists
    const staffUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!staffUser) {
      return res.status(404).json({
        success: false,
        message: 'Staff user not found'
      });
    }

    // Check if email is being changed and if new email already exists
    if (email !== staffUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }

    // Check if department exists
    if (departmentId) {
      const department = await prisma.staffDepartment.findUnique({
        where: { id: departmentId }
      });
      if (!department) {
        return res.status(400).json({
          success: false,
          message: 'Department not found'
        });
      }
    }

    // Prepare update data
    const updateData = {
      fullName: name,
      email,
      phone,
      staffDeptId: departmentId,
      role: role.toUpperCase(),
      status: status || 'active'
    };

    // Add password if provided
    if (password && password.trim()) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    // Update staff user
    const updatedStaffUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        staffDepartment: true
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedStaffUser;

    res.status(200).json({
      success: true,
      message: 'Staff user updated successfully',
      data: {
        staffUser: {
          id: userWithoutPassword.id,
          name: userWithoutPassword.fullName,
          email: userWithoutPassword.email,
          phone: userWithoutPassword.phone,
          department: userWithoutPassword.staffDepartment?.name || 'Unassigned',
          departmentId: userWithoutPassword.staffDeptId,
          role: userWithoutPassword.role.toLowerCase(),
          status: userWithoutPassword.status || 'active',
          createdAt: userWithoutPassword.createdAt,
          updatedAt: userWithoutPassword.updatedAt
        }
      }
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Failed to update staff user',
      error: error.message
    });
  }
};

// Delete staff user
exports.deleteStaffUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if staff user exists
    const staffUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            createdComplaints: true,
            resolvedComplaints: true,
            notifications: true
          }
        }
      }
    });
    if (!staffUser) {
      return res.status(404).json({
        success: false,
        message: 'Staff user not found'
      });
    }

    // Check if user has associated data
    if (staffUser._count.createdComplaints > 0 || 
        staffUser._count.resolvedComplaints > 0 || 
        staffUser._count.notifications > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete staff user with associated complaints or notifications'
      });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    res.status(200).json({
      success: true,
      message: 'Staff user deleted successfully'
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete staff user',
      error: error.message
    });
  }
};

// Get staff users by department
exports.getStaffUsersByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    
    const staffUsers = await prisma.user.findMany({
      where: {
        staffDeptId: departmentId,
        role: 'STAFF'
      },
      include: {
        staffDepartment: true
      },
      orderBy: {
        fullName: 'asc'
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Staff users retrieved successfully',
      data: {
        staffUsers: staffUsers.map(user => ({
          id: user.id,
          name: user.fullName,
          email: user.email,
          phone: user.phone,
          department: user.staffDepartment?.name || 'Unassigned',
          departmentId: user.staffDeptId,
          role: user.role.toLowerCase(),
          status: user.status || 'active',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }))
      }
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff users by department',
      error: error.message
    });
  }
};
