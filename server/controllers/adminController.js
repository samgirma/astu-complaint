const { prisma } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

// Create staff department (Admin only)
const createDepartment = asyncHandler(async (req, res) => {
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

  const department = await prisma.staffDepartment.create({
    data: {
      name,
      description
    }
  });

  res.status(201).json({
    success: true,
    message: 'Department created successfully',
    data: { department }
  });
});

// Get all departments (Admin only)
const getDepartments = asyncHandler(async (req, res) => {
  const departments = await prisma.staffDepartment.findMany({
    include: {
      _count: {
        select: {
          users: true,
          complaints: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  res.status(200).json({
    success: true,
    data: { departments }
  });
});

// Update department (Admin only)
const updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  // Check if department exists
  const existingDept = await prisma.staffDepartment.findUnique({
    where: { id }
  });

  if (!existingDept) {
    return res.status(404).json({
      success: false,
      message: 'Department not found'
    });
  }

  // Check if new name conflicts with existing department
  if (name !== existingDept.name) {
    const nameConflict = await prisma.staffDepartment.findUnique({
      where: { name }
    });

    if (nameConflict) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name already exists'
      });
    }
  }

  const department = await prisma.staffDepartment.update({
    where: { id },
    data: {
      name,
      description
    },
    include: {
      _count: {
        select: {
          users: true,
          complaints: true
        }
      }
    }
  });

  res.status(200).json({
    success: true,
    message: 'Department updated successfully',
    data: { department }
  });
});

// Delete department (Admin only)
const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if department exists
  const existingDept = await prisma.staffDepartment.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          users: true,
          complaints: true
        }
      }
    }
  });

  if (!existingDept) {
    return res.status(404).json({
      success: false,
      message: 'Department not found'
    });
  }

  // Check if department has users or complaints
  if (existingDept._count.users > 0 || existingDept._count.complaints > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete department with active users or complaints'
    });
  }

  await prisma.staffDepartment.delete({
    where: { id }
  });

  res.status(200).json({
    success: true,
    message: 'Department deleted successfully'
  });
});

// Get all users (Admin only)
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, search } = req.query;
  const skip = (page - 1) * limit;

  let whereClause = {};

  if (role) {
    whereClause.role = role.toUpperCase();
  }

  if (search) {
    whereClause.OR = [
      {
        fullName: {
          contains: search,
          mode: 'insensitive'
        }
      },
      {
        email: {
          contains: search,
          mode: 'insensitive'
        }
      }
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      include: {
        staffDepartment: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            createdComplaints: true,
            resolvedComplaints: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    }),
    prisma.user.count({ where: whereClause })
  ]);

  // Remove passwords from response
  const usersWithoutPasswords = users.map(user => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });

  res.status(200).json({
    success: true,
    data: {
      users: usersWithoutPasswords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }
  });
});

// Send warning to staff department (Admin only)
const sendWarningToDepartment = asyncHandler(async (req, res) => {
  const { staffDeptId } = req.params;
  const { message, title } = req.body;

  // Check if department exists
  const department = await prisma.staffDepartment.findUnique({
    where: { id: staffDeptId }
  });

  if (!department) {
    return res.status(404).json({
      success: false,
      message: 'Department not found'
    });
  }

  // Get all staff in the department
  const staffUsers = await prisma.user.findMany({
    where: {
      role: 'STAFF',
      staffDeptId: staffDeptId
    }
  });

  if (staffUsers.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No staff users found in this department'
    });
  }

  // Create warning notifications for all staff in the department
  const notifications = staffUsers.map(staff => ({
    userId: staff.id,
    type: 'ADMIN_WARNING',
    title: title || 'Admin Warning',
    message: message || 'Please address pending complaints in your department.'
  }));

  await prisma.notification.createMany({
    data: notifications
  });

  res.status(200).json({
    success: true,
    message: `Warning sent to ${staffUsers.length} staff members in ${department.name}`,
    data: {
      departmentName: department.name,
      staffNotified: staffUsers.length
    }
  });
});

// Get comprehensive analytics (Admin only)
const getAnalytics = asyncHandler(async (req, res) => {
  const { timeframe = '30' } = req.query; // Default to 30 days
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(timeframe));

  // Overall statistics
  const [
    totalUsers,
    totalDepartments,
    totalComplaints,
    recentComplaints
  ] = await Promise.all([
    prisma.user.count(),
    prisma.staffDepartment.count(),
    prisma.complaint.count(),
    prisma.complaint.count({
      where: {
        createdAt: {
          gte: daysAgo
        }
      }
    })
  ]);

  // Complaints by status
  const complaintsByStatus = await prisma.complaint.groupBy({
    by: ['status'],
    _count: {
      status: true
    }
  });

  // Complaints by department
  const complaintsByDepartment = await prisma.complaint.groupBy({
    by: ['staffDeptId'],
    _count: {
      staffDeptId: true
    },
    orderBy: {
      _count: {
        staffDeptId: 'desc'
      }
    }
  });

  // Get department names for the above data
  const departmentIds = complaintsByDepartment.map(item => item.staffDeptId);
  const departments = await prisma.staffDepartment.findMany({
    where: {
      id: {
        in: departmentIds
      }
    },
    select: {
      id: true,
      name: true
    }
  });

  const departmentMap = departments.reduce((acc, dept) => {
    acc[dept.id] = dept.name;
    return acc;
  }, {});

  const complaintsByDepartmentWithNames = complaintsByDepartment.map(item => ({
    departmentId: item.staffDeptId,
    departmentName: departmentMap[item.staffDeptId] || 'Unknown',
    count: item._count.staffDeptId
  }));

  // Users by role
  const usersByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: {
      role: true
    }
  });

  // Resolution rate over time (last 7 days)
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const dailyResolutionData = await prisma.complaint.findMany({
    where: {
      resolvedAt: {
        gte: last7Days
      }
    },
    select: {
      resolvedAt: true,
      status: true
    }
  });

  // Group by day
  const resolutionByDay = dailyResolutionData.reduce((acc, complaint) => {
    const day = complaint.resolvedAt.toISOString().split('T')[0];
    if (!acc[day]) {
      acc[day] = 0;
    }
    acc[day]++;
    return acc;
  }, {});

  // Stagnant complaints (open for more than 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const stagnantComplaints = await prisma.complaint.count({
    where: {
      status: 'OPEN',
      createdAt: {
        lt: sevenDaysAgo
      }
    }
  });

  // Department performance
  const departmentPerformance = await prisma.staffDepartment.findMany({
    include: {
      _count: {
        select: {
          complaints: true,
          users: true
        }
      }
    }
  });

  // Get individual complaints for the dashboard
  const individualComplaints = await prisma.complaint.findMany({
    take: 50, // Limit to recent 50 complaints
    orderBy: { createdAt: 'desc' },
    include: {
      student: {
        select: {
          fullName: true,
          email: true
        }
      },
      staffDepartment: {
        select: {
          name: true
        }
      }
    }
  });

  const analytics = {
    overview: {
      totalUsers,
      totalDepartments,
      totalComplaints,
      recentComplaints,
      stagnantComplaints
    },
    complaintsByStatus: complaintsByStatus.map(item => ({
      status: item.status,
      count: item._count.status
    })),
    complaintsByDepartment: complaintsByDepartmentWithNames,
    usersByRole: usersByRole.map(item => ({
      role: item.role,
      count: item._count.role
    })),
    resolutionByDay: Object.entries(resolutionByDay).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => new Date(a.date) - new Date(b.date)),
    departmentPerformance: departmentPerformance.map(dept => ({
      id: dept.id,
      name: dept.name,
      totalComplaints: dept._count.complaints,
      staffCount: dept._count.users
    })),
    individualComplaints: individualComplaints.map(complaint => ({
      id: complaint.id,
      studentName: complaint.student.fullName,
      department: complaint.staffDepartment.name,
      status: complaint.status.toLowerCase(),
      submittedDate: complaint.createdAt.toISOString().split('T')[0],
      description: complaint.body,
      priority: 'medium', // Default priority since it's not in schema
      category: complaint.staffDepartment.name
    }))
  };

  res.status(200).json({
    success: true,
    data: { analytics }
  });
});

// Get system health metrics (Admin only)
const getSystemHealth = asyncHandler(async (req, res) => {
  const [
    totalComplaints,
    resolvedComplaints,
    openComplaints,
    inProgressComplaints,
    totalUsers,
    activeStaff,
    totalDepartments
  ] = await Promise.all([
    prisma.complaint.count(),
    prisma.complaint.count({ where: { status: 'RESOLVED' } }),
    prisma.complaint.count({ where: { status: 'OPEN' } }),
    prisma.complaint.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.user.count(),
    prisma.user.count({ where: { role: 'STAFF' } }),
    prisma.staffDepartment.count()
  ]);

  const health = {
    complaints: {
      total: totalComplaints,
      resolved: resolvedComplaints,
      open: openComplaints,
      inProgress: inProgressComplaints,
      resolutionRate: totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0
    },
    users: {
      total: totalUsers,
      activeStaff
    },
    departments: {
      total: totalDepartments
    }
  };

  res.status(200).json({
    success: true,
    data: { health }
  });
});

module.exports = {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
  getUsers,
  sendWarningToDepartment,
  getAnalytics,
  getSystemHealth
};
