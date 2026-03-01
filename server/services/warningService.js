const { PrismaClient } = require('@prisma/client');
const { sendWarningToStaff } = require('../utils/notificationService');

const prisma = new PrismaClient();

// Check for complaints that need warnings
const checkComplaintWarnings = async () => {
  try {
    const now = new Date();
    
    // 1. Check for complaints open for more than 24 hours (not moved to in_progress)
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const staleOpenComplaints = await prisma.complaint.findMany({
      where: {
        status: 'OPEN',
        createdAt: {
          lt: twentyFourHoursAgo
        }
      },
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

    // Send warnings for stale open complaints
    for (const complaint of staleOpenComplaints) {
      await sendWarningToStaff({
        title: 'Urgent: Complaint Requires Attention',
        message: `Complaint #${complaint.id} from ${complaint.student.fullName} has been open for more than 24 hours without action. Please review and update the status to "In Progress" immediately.`,
        targetDepartment: complaint.staffDeptId,
        type: 'complaint_stale'
      });
      
    }

    // 2. Check for complaints not resolved within 7 weeks (49 days)
    const sevenWeeksAgo = new Date(now.getTime() - 49 * 24 * 60 * 60 * 1000);
    
    const overdueComplaints = await prisma.complaint.findMany({
      where: {
        status: {
          in: ['OPEN', 'IN_PROGRESS']
        },
        issueDate: {
          lt: sevenWeeksAgo
        }
      },
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

    // Send warnings for overdue complaints
    for (const complaint of overdueComplaints) {
      await sendWarningToStaff({
        title: 'Critical: Complaint Overdue',
        message: `Complaint #${complaint.id} from ${complaint.student.fullName} has been pending for more than 7 weeks. This requires immediate resolution.`,
        targetDepartment: complaint.staffDeptId,
        type: 'complaint_overdue'
      });
      
    }

    // 3. Check for complaints marked as resolved but not confirmed by student
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    const unconfirmedResolvedComplaints = await prisma.complaint.findMany({
      where: {
        status: 'RESOLVED',
        resolvedAt: {
          lt: threeDaysAgo
        },
        studentVerified: false
      },
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
        },
        resolver: {
          select: {
            fullName: true
          }
        }
      }
    });

    // Send warnings for unconfirmed resolved complaints
    for (const complaint of unconfirmedResolvedComplaints) {
      await sendWarningToStaff({
        title: 'Action Required: Student Confirmation Pending',
        message: `Complaint #${complaint.id} was marked as resolved by ${complaint.resolver?.fullName} but the student (${complaint.student.fullName}) has not confirmed. Please follow up with the student.`,
        targetDepartment: complaint.staffDeptId,
        type: 'confirmation_pending'
      });
      
    }
    
  } catch (error) {
    
  }
};

// Manual trigger for student when staff marks as resolved but student disagrees
const triggerStudentDisputeWarning = async (complaintId) => {
  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
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
        },
        resolver: {
          select: {
            fullName: true
          }
        }
      }
    });

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    await sendWarningToStaff({
      title: 'Urgent: Student Disputes Resolution',
      message: `Student ${complaint.student.fullName} has disputed the resolution of complaint #${complaint.id} that was marked as resolved by ${complaint.resolver?.fullName}. Please review and take appropriate action.`,
      targetDepartment: complaint.staffDeptId,
      type: 'student_dispute'
    });

  } catch (error) {
    
    throw error;
  }
};

// Get warning statistics for admin dashboard
const getWarningStatistics = async () => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenWeeksAgo = new Date(now.getTime() - 49 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const [
      staleCount,
      overdueCount,
      unconfirmedCount
    ] = await Promise.all([
      prisma.complaint.count({
        where: {
          status: 'OPEN',
          createdAt: { lt: twentyFourHoursAgo }
        }
      }),
      prisma.complaint.count({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          issueDate: { lt: sevenWeeksAgo }
        }
      }),
      prisma.complaint.count({
        where: {
          status: 'RESOLVED',
          resolvedAt: { lt: threeDaysAgo },
          studentVerified: false
        }
      })
    ]);

    return {
      staleOpenComplaints: staleCount,
      overdueComplaints: overdueCount,
      unconfirmedResolutions: unconfirmedCount,
      totalWarningsNeeded: staleCount + overdueCount + unconfirmedCount
    };
    
  } catch (error) {
    
    throw error;
  }
};

module.exports = {
  checkComplaintWarnings,
  triggerStudentDisputeWarning,
  getWarningStatistics
};
