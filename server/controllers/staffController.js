const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// Get all staff departments
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await prisma.staffDepartment.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Departments retrieved successfully',
      data: {
        departments: departments.map(dept => ({
          id: dept.id,
          name: dept.name,
          description: dept.description,
          memberCount: dept._count.users,
          createdAt: dept.createdAt,
          updatedAt: dept.updatedAt
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error.message
    });
  }
};

// Get single department
exports.getDepartmentById = async (req, res) => {
  try {
    const department = await prisma.staffDepartment.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Department retrieved successfully',
      data: {
        department: {
          id: department.id,
          name: department.name,
          description: department.description,
          memberCount: department._count.users,
          createdAt: department.createdAt,
          updatedAt: department.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department',
      error: error.message
    });
  }
};

// Create new department
exports.createDepartment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, description } = req.body;

    // Check if department already exists
    const existingDept = await prisma.staffDepartment.findUnique({
      where: { name }
    });
    if (existingDept) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name already exists'
      });
    }

    const newDepartment = await prisma.staffDepartment.create({
      data: {
        name,
        description
      }
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: {
        department: {
          id: newDepartment.id,
          name: newDepartment.name,
          description: newDepartment.description,
          memberCount: 0,
          createdAt: newDepartment.createdAt,
          updatedAt: newDepartment.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create department',
      error: error.message
    });
  }
};

// Update department
exports.updateDepartment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, description } = req.body;
    const deptId = req.params.id;

    // Check if department exists
    const department = await prisma.staffDepartment.findUnique({
      where: { id: deptId }
    });
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if name is being changed and if new name already exists
    if (name !== department.name) {
      const existingDept = await prisma.staffDepartment.findUnique({
        where: { name }
      });
      if (existingDept) {
        return res.status(400).json({
          success: false,
          message: 'Department with this name already exists'
        });
      }
    }

    // Update department
    const updatedDepartment = await prisma.staffDepartment.update({
      where: { id: deptId },
      data: { name, description }
    });

    // Get updated member count
    const memberCount = await prisma.user.count({
      where: { staffDeptId: deptId }
    });

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: {
        department: {
          id: updatedDepartment.id,
          name: updatedDepartment.name,
          description: updatedDepartment.description,
          memberCount,
          createdAt: updatedDepartment.createdAt,
          updatedAt: updatedDepartment.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department',
      error: error.message
    });
  }
};

// Delete department
exports.deleteDepartment = async (req, res) => {
  try {
    const deptId = req.params.id;

    // Check if department exists
    const department = await prisma.staffDepartment.findUnique({
      where: { id: deptId },
      include: {
        _count: {
          select: {
            users: true,
            complaints: true
          }
        }
      }
    });
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if department has users or complaints
    if (department._count.users > 0 || department._count.complaints > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with active staff members or complaints'
      });
    }

    await prisma.staffDepartment.delete({
      where: { id: deptId }
    });

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete department',
      error: error.message
    });
  }
};

// Get department members (staff users)
exports.getDepartmentMembers = async (req, res) => {
  try {
    const { departmentId } = req.params;
    
    const members = await prisma.user.findMany({
      where: {
        staffDeptId: departmentId,
        role: {
          in: ['STAFF', 'ADMIN']
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
      message: 'Department members retrieved successfully',
      data: {
        members: members.map(member => ({
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
    console.error('Error fetching department members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department members',
      error: error.message
    });
  }
};

// Legacy methods for backward compatibility
exports.getAllStaff = exports.getAllDepartments;
exports.getStaffById = exports.getDepartmentById;
exports.createStaff = exports.createDepartment;
exports.updateStaff = exports.updateDepartment;
exports.deleteStaff = exports.deleteDepartment;
exports.getStaffByDepartment = exports.getDepartmentMembers;
