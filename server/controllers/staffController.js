const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// Get all staff members
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: {
          in: ['STAFF', 'ADMIN']
        }
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
      message: 'Staff retrieved successfully',
      data: {
        staff: staff.map(member => ({
          id: member.id,
          name: member.fullName,
          email: member.email,
          phone: member.phone,
          department: member.staffDepartment?.name || 'Unassigned',
          role: member.role.toLowerCase(),
          status: member.status || 'active',
          createdAt: member.createdAt,
          updatedAt: member.updatedAt
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff',
      error: error.message
    });
  }
};

// Get single staff member
exports.getStaffById = async (req, res) => {
  try {
    const staff = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        staffDepartment: true
      }
    });
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Staff member retrieved successfully',
      data: {
        staff: {
          id: staff.id,
          name: staff.fullName,
          email: staff.email,
          phone: staff.phone,
          department: staff.staffDepartment?.name || 'Unassigned',
          role: staff.role.toLowerCase(),
          status: staff.status || 'active',
          createdAt: staff.createdAt,
          updatedAt: staff.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff member',
      error: error.message
    });
  }
};

// Create new staff member
exports.createStaff = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, email, phone, department, role, status } = req.body;

    // Check if staff member already exists with this email
    const existingStaff = await prisma.user.findUnique({
      where: { email }
    });
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: 'Staff member with this email already exists'
      });
    }

    // Create or get staff department
    let staffDept = null;
    if (department) {
      staffDept = await prisma.staffDepartment.upsert({
        where: { name: department },
        update: { updatedAt: new Date() },
        create: { name: department }
      });
    }

    const newStaff = await prisma.user.create({
      data: {
        fullName: name,
        email,
        phone,
        role: role.toUpperCase(),
        status: status || 'active',
        staffDeptId: staffDept?.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: {
        staff: {
          id: newStaff.id,
          name: newStaff.fullName,
          email: newStaff.email,
          phone: newStaff.phone,
          department: staffDept?.name || 'Unassigned',
          role: newStaff.role.toLowerCase(),
          status: newStaff.status || 'active',
          createdAt: newStaff.createdAt,
          updatedAt: newStaff.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Error creating staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create staff member',
      error: error.message
    });
  }
};

// Update staff member
exports.updateStaff = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, email, phone, department, role, status } = req.body;
    const staffId = req.params.id;

    // Check if staff member exists
    const staff = await prisma.user.findUnique({
      where: { id: staffId },
      include: { staffDepartment: true }
    });
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Check if email is being changed and if new email already exists
    if (email !== staff.email) {
      const existingStaff = await prisma.user.findUnique({
        where: { email }
      });
      if (existingStaff) {
        return res.status(400).json({
          success: false,
          message: 'Staff member with this email already exists'
        });
      }
    }

    // Create or get staff department
    let staffDept = null;
    if (department) {
      staffDept = await prisma.staffDepartment.upsert({
        where: { name: department },
        update: { updatedAt: new Date() },
        create: { name: department }
      });
    }

    // Update staff member
    const updatedStaff = await prisma.user.update({
      where: { id: staffId },
      data: {
        fullName: name,
        email,
        phone,
        role: role.toUpperCase(),
        status: status || 'active',
        staffDeptId: staffDept?.id
      }
    });

    res.status(200).json({
      success: true,
      message: 'Staff member updated successfully',
      data: {
        staff: {
          id: updatedStaff.id,
          name: updatedStaff.fullName,
          email: updatedStaff.email,
          phone: updatedStaff.phone,
          department: staffDept?.name || 'Unassigned',
          role: updatedStaff.role.toLowerCase(),
          status: updatedStaff.status || 'active',
          createdAt: updatedStaff.createdAt,
          updatedAt: updatedStaff.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update staff member',
      error: error.message
    });
  }
};

// Delete staff member
exports.deleteStaff = async (req, res) => {
  try {
    const staffId = req.params.id;

    // Check if staff member exists
    const staff = await prisma.user.findUnique({
      where: { id: staffId }
    });
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    await prisma.user.delete({
      where: { id: staffId }
    });

    res.status(200).json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete staff member',
      error: error.message
    });
  }
};

// Get staff by department
exports.getStaffByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    
    const staff = await prisma.user.findMany({
      where: {
        staffDepartment: {
          name: department
        }
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
      message: 'Staff retrieved successfully',
      data: {
        staff: staff.map(member => ({
          id: member.id,
          name: member.fullName,
          email: member.email,
          phone: member.phone,
          department: member.staffDepartment?.name || 'Unassigned',
          role: member.role.toLowerCase(),
          status: member.status || 'active',
          createdAt: member.createdAt,
          updatedAt: member.updatedAt
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching staff by department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff by department',
      error: error.message
    });
  }
};
