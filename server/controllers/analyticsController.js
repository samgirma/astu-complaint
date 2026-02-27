const { prisma } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

// Get Admin Analytics Dashboard Data
const getAdminAnalytics = asyncHandler(async (req, res) => {
  const { timeframe = '30' } = req.query; // Default to 30 days
  const daysAgo = parseInt(timeframe);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  // Get overall statistics
  const [
    totalComplaints,
    totalUsers,
    activeComplaints,
    resolvedComplaints,
    avgResolutionTime
  ] = await Promise.all([
    prisma.complaint.count(),
    prisma.user.count(),
    prisma.complaint.count({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] }
      }
    }),
    prisma.complaint.count({
      where: {
        status: { in: ['RESOLVED', 'CLOSED'] }
      }
    }),
    // Calculate average resolution time
    prisma.complaint.aggregate({
      where: {
        status: { in: ['RESOLVED', 'CLOSED'] },
        updatedAt: { not: null }
      },
      _avg: {
        updatedAt: true
      }
    })
  ]);

  // Get complaints by category
  const complaintsByCategory = await prisma.complaint.groupBy({
    by: ['category'],
    _count: true,
    orderBy: {
      _count: {
        category: 'desc'
      }
    }
  });

  // Get complaints by status
  const complaintsByStatus = await prisma.complaint.groupBy({
    by: ['status'],
    _count: true
  });

  // Get daily complaint trends (last 30 days)
  const dailyTrends = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('day', created_at) as date,
      COUNT(*) as count
    FROM complaints 
    WHERE created_at >= ${startDate}
    GROUP BY DATE_TRUNC('day', created_at)
    ORDER BY date DESC
    LIMIT 30
  `;

  // Get department performance (if users have department info)
  const departmentStats = await prisma.user.groupBy({
    by: ['role'],
    _count: true
  });

  // Get recent activities
  const recentActivities = await prisma.complaint.findMany({
    take: 10,
    orderBy: {
      updatedAt: 'desc'
    },
    include: {
      user: {
        select: {
          fullName: true,
          role: true
        }
      },
      _count: {
        select: {
          comments: true
        }
      }
    }
  });

  // Calculate resolution rate
  const resolutionRate = totalComplaints > 0 
    ? ((resolvedComplaints / totalComplaints) * 100) 
    : 0;

  // Get most active users
  const topUsers = await prisma.user.findMany({
    take: 5,
    orderBy: {
      complaints: {
        _count: 'desc'
      }
    },
    include: {
      _count: {
        select: {
          complaints: true
        }
      }
    }
  });

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalComplaints,
        totalUsers,
        activeComplaints,
        resolvedComplaints,
        resolutionRate: Math.round(resolutionRate * 100) / 100,
        avgResolutionTime: avgResolutionTime._avg.updatedAt
      },
      charts: {
        complaintsByCategory,
        complaintsByStatus,
        dailyTrends,
        departmentStats
      },
      activities: {
        recentActivities,
        topUsers
      }
    }
  });
});

// Get Department Staff Analytics
const getDepartmentAnalytics = asyncHandler(async (req, res) => {
  const { timeframe = '30' } = req.query;
  const daysAgo = parseInt(timeframe);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  // Get complaints assigned to department staff
  const [
    totalAssigned,
    pendingReview,
    inProgress,
    completed,
    overdueTasks
  ] = await Promise.all([
    prisma.complaint.count({
      where: {
        createdAt: { gte: startDate }
      }
    }),
    prisma.complaint.count({
      where: {
        status: 'OPEN',
        createdAt: { gte: startDate }
      }
    }),
    prisma.complaint.count({
      where: {
        status: 'IN_PROGRESS',
        createdAt: { gte: startDate }
      }
    }),
    prisma.complaint.count({
      where: {
        status: { in: ['RESOLVED', 'CLOSED'] },
        createdAt: { gte: startDate }
      }
    }),
    // Count complaints older than 7 days that are still open
    prisma.complaint.count({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        createdAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);

  // Get recent complaints needing attention
  const recentComplaints = await prisma.complaint.findMany({
    take: 20,
    where: {
      createdAt: { gte: startDate }
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      user: {
        select: {
          fullName: true,
          email: true
        }
      },
      _count: {
        select: {
          comments: true
        }
      }
    }
  });

  // Get category distribution for department
  const categoryDistribution = await prisma.complaint.groupBy({
    by: ['category'],
    where: {
      createdAt: { gte: startDate }
    },
    _count: true,
    orderBy: {
      _count: {
        category: 'desc'
      }
    }
  });

  res.status(200).json({
    success: true,
    data: {
      performance: {
        totalAssigned,
        pendingReview,
        inProgress,
        completed,
        overdueTasks,
        completionRate: totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0
      },
      recentComplaints,
      categoryDistribution
    }
  });
});

// Get Student Analytics
const getStudentAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [
    totalComplaints,
    openComplaints,
    resolvedComplaints,
    inProgressComplaints
  ] = await Promise.all([
    prisma.complaint.count({
      where: { userId }
    }),
    prisma.complaint.count({
      where: { userId, status: 'OPEN' }
    }),
    prisma.complaint.count({
      where: { userId, status: 'RESOLVED' }
    }),
    prisma.complaint.count({
      where: { userId, status: 'IN_PROGRESS' }
    })
  ]);

  // Get user's recent complaints
  const recentComplaints = await prisma.complaint.findMany({
    take: 10,
    where: { userId },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      _count: {
        select: {
          comments: true
        }
      }
    }
  });

  // Get user's complaint categories
  const userCategories = await prisma.complaint.groupBy({
    by: ['category'],
    where: { userId },
    _count: true
  });

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalComplaints,
        openComplaints,
        resolvedComplaints,
        inProgressComplaints,
        resolutionRate: totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0
      },
      recentComplaints,
      userCategories
    }
  });
});

// Export Analytics Data
const exportAnalytics = asyncHandler(async (req, res) => {
  const { format = 'json', type = 'complaints' } = req.query;
  const { startDate, endDate } = req.query;

  const where = {};
  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  let data;
  switch (type) {
    case 'complaints':
      data = await prisma.complaint.findMany({
        where,
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              role: true
            }
          },
          _count: {
            select: {
              comments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      break;
    case 'users':
      data = await prisma.user.findMany({
        include: {
          _count: {
            select: {
              complaints: true,
              comments: true
            }
          }
        }
      });
      break;
    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid export type'
      });
  }

  if (format === 'csv') {
    // Convert to CSV format
    const csv = convertToCSV(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_export.csv`);
    return res.send(csv);
  }

  res.status(200).json({
    success: true,
    data,
    exportedAt: new Date().toISOString()
  });
});

// Helper function to convert data to CSV
const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');

  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Handle nested objects and arrays
      if (typeof value === 'object' && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      return `"${value}"`;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
};

module.exports = {
  getAdminAnalytics,
  getDepartmentAnalytics,
  getStudentAnalytics,
  exportAnalytics
};
