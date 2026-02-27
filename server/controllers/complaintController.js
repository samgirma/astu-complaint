const { prisma } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

// Create complaint (Student only)
const createComplaint = asyncHandler(async (req, res) => {
  const { body, staffDeptId } = req.body;
  const studentId = req.user.id;

  // Verify user is a student
  if (req.user.role !== 'STUDENT') {
    return res.status(403).json({
      success: false,
      message: 'Only students can create complaints'
    });
  }

  // Check if department exists
  const department = await prisma.staffDepartment.findUnique({
    where: { id: staffDeptId }
  });

  if (!department) {
    return res.status(400).json({
      success: false,
      message: 'Selected department does not exist'
    });
  }

  // Create complaint
  const complaint = await prisma.complaint.create({
    data: {
      body,
      studentId,
      staffDeptId,
      status: 'OPEN'
    },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      },
      staffDepartment: true
    }
  });

  // Create notification for staff in that department
  const staffUsers = await prisma.user.findMany({
    where: {
      role: 'STAFF',
      staffDeptId: staffDeptId
    }
  });

  // Create notifications for all staff in the department
  const notifications = staffUsers.map(staff => ({
    userId: staff.id,
    type: 'NEW_COMPLAINT',
    title: 'New Complaint Assigned',
    message: `A new complaint has been submitted to your department: ${body.substring(0, 100)}...`
  }));

  if (notifications.length > 0) {
    await prisma.notification.createMany({
      data: notifications
    });
  }

  // Create notification for student
  await prisma.notification.create({
    data: {
      userId: studentId,
      type: 'STATUS_UPDATE',
      title: 'Complaint Submitted',
      message: 'Your complaint has been submitted successfully and is being reviewed.'
    }
  });

  res.status(201).json({
    success: true,
    message: 'Complaint created successfully',
    data: { complaint }
  });
});

// Get complaints for different user roles
const getComplaints = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;
  const skip = (page - 1) * limit;
  const userId = req.user.id;
  const userRole = req.user.role;
  const userDeptId = req.user.staffDeptId;

  let whereClause = {};
  let includeClause = {
    student: {
      select: {
        id: true,
        fullName: true,
        email: true
      }
    },
    staffDepartment: true,
    resolver: {
      select: {
        id: true,
        fullName: true
      }
    }
  };

  // Build where clause based on user role
  switch (userRole) {
    case 'STUDENT':
      whereClause.studentId = userId;
      break;
    case 'STAFF':
      whereClause.staffDeptId = userDeptId;
      break;
    case 'ADMIN':
      // Admin can see all complaints
      break;
  }

  // Add status filter if provided
  if (status) {
    whereClause.status = status.toUpperCase();
  }

  // Add search filter if provided
  if (search) {
    whereClause.body = {
      contains: search,
      mode: 'insensitive'
    };
  }

  const [complaints, total] = await Promise.all([
    prisma.complaint.findMany({
      where: whereClause,
      include: includeClause,
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    }),
    prisma.complaint.count({ where: whereClause })
  ]);

  res.status(200).json({
    success: true,
    data: {
      complaints,
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

// Get single complaint
const getComplaint = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      },
      staffDepartment: true,
      resolver: {
        select: {
          id: true,
          fullName: true
        }
      }
    }
  });

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found'
    });
  }

  // Check access permissions
  const userId = req.user.id;
  const userRole = req.user.role;
  const userDeptId = req.user.staffDeptId;

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

  res.status(200).json({
    success: true,
    data: { complaint }
  });
});

// Update complaint status
const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, comment } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;
  const userDeptId = req.user.staffDeptId;

  // Get complaint
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

  // Check permissions based on role
  if (userRole === 'STUDENT') {
    // Students can only approve/decline resolved complaints
    if (complaint.status !== 'RESOLVED') {
      return res.status(400).json({
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
    if (!['IN_PROGRESS', 'OPEN'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Students can only revert to IN_PROGRESS or OPEN'
      });
    }

    // Update complaint
    const updatedComplaint = await prisma.complaint.update({
      where: { id },
      data: {
        status,
        studentVerified: status === 'RESOLVED' // Only mark as verified if student approves
      }
    });

    // Create notification for staff
    await prisma.notification.create({
      data: {
        userId: complaint.resolvedBy,
        type: 'APPROVAL_REQUEST',
        title: `Complaint ${status === 'RESOLVED' ? 'Approved' : 'Declined'}`,
        message: `Student has ${status === 'RESOLVED' ? 'approved' : 'declined'} the resolution for complaint: ${complaint.body.substring(0, 100)}...`
      }
    });

    return res.status(200).json({
      success: true,
      message: `Complaint ${status === 'RESOLVED' ? 'approved' : 'declined'} successfully`,
      data: { complaint: updatedComplaint }
    });
  }

  if (userRole === 'STAFF') {
    // Staff can only update complaints in their department
    if (complaint.staffDeptId !== userDeptId) {
      return res.status(403).json({
        success: false,
        message: 'Can only update complaints in your department'
      });
    }

    // Staff can only set to IN_PROGRESS or RESOLVED
    if (!['IN_PROGRESS', 'RESOLVED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Staff can only set status to IN_PROGRESS or RESOLVED'
      });
    }

    // Update complaint
    const updateData = {
      status,
      resolvedBy: status === 'RESOLVED' ? userId : null,
      resolvedAt: status === 'RESOLVED' ? new Date() : null
    };

    const updatedComplaint = await prisma.complaint.update({
      where: { id },
      data: updateData
    });

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: complaint.studentId,
        type: 'STATUS_UPDATE',
        title: `Complaint Status Updated`,
        message: `Your complaint status has been updated to: ${status}. ${status === 'RESOLVED' ? 'Please review and approve.' : ''}`
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Complaint status updated successfully',
      data: { complaint: updatedComplaint }
    });
  }

  // Admin can update any complaint
  const updateData = {
    status,
    resolvedBy: status === 'RESOLVED' ? userId : null,
    resolvedAt: status === 'RESOLVED' ? new Date() : null
  };

  const updatedComplaint = await prisma.complaint.update({
    where: { id },
    data: updateData
  });

  // Create notification for student
  await prisma.notification.create({
    data: {
      userId: complaint.studentId,
      type: 'STATUS_UPDATE',
      title: `Complaint Status Updated`,
      message: `Your complaint status has been updated to: ${status}. ${status === 'RESOLVED' ? 'Please review and approve.' : ''}`
    }
  });

  res.status(200).json({
    success: true,
    message: 'Complaint status updated successfully',
    data: { complaint: updatedComplaint }
  });
});

// Get departments for dropdown
const getDepartments = asyncHandler(async (req, res) => {
  const departments = await prisma.staffDepartment.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      description: true
    }
  });

  res.status(200).json({
    success: true,
    data: { departments }
  });
});

// Get complaint statistics
const getComplaintStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const userDeptId = req.user.staffDeptId;

  let whereClause = {};

  // Build where clause based on user role
  switch (userRole) {
    case 'STUDENT':
      whereClause.studentId = userId;
      break;
    case 'STAFF':
      whereClause.staffDeptId = userDeptId;
      break;
    case 'ADMIN':
      // Admin can see all complaints
      break;
  }

  const [
    totalComplaints,
    openComplaints,
    inProgressComplaints,
    resolvedComplaints
  ] = await Promise.all([
    prisma.complaint.count({ where: whereClause }),
    prisma.complaint.count({ where: { ...whereClause, status: 'OPEN' } }),
    prisma.complaint.count({ where: { ...whereClause, status: 'IN_PROGRESS' } }),
    prisma.complaint.count({ where: { ...whereClause, status: 'RESOLVED' } })
  ]);

  const stats = {
    totalComplaints,
    openComplaints,
    inProgressComplaints,
    resolvedComplaints,
    resolutionRate: totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0
  };

  res.status(200).json({
    success: true,
    data: { stats }
  });
});

module.exports = {
  createComplaint,
  getComplaints,
  getComplaint,
  updateComplaintStatus,
  getDepartments,
  getComplaintStats
};
