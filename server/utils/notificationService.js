const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Send warning to staff members in a department
const sendWarningToStaff = async ({ title, message, targetDepartment, type }) => {
  try {
    // Get all staff users in the target department
    const staffUsers = await prisma.user.findMany({
      where: {
        staffDeptId: targetDepartment,
        role: {
          in: ['STAFF', 'ADMIN']
        },
        status: 'active'
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true
      }
    });

    if (staffUsers.length === 0) {
      console.log(`No active staff users found in department ${targetDepartment}`);
      return;
    }

    // Create notifications for all staff users
    const notifications = staffUsers.map(user => ({
      userId: user.id,
      type: 'ADMIN_WARNING',
      title,
      message,
      isRead: false
    }));

    await prisma.notification.createMany({
      data: notifications
    });

    console.log(`Created ${notifications.length} warnings for department ${targetDepartment}`);
    
    // Here you could also integrate with email service, SMS, etc.
    // For now, we're creating in-app notifications
    
    return {
      success: true,
      recipientsCount: staffUsers.length,
      department: targetDepartment
    };
    
  } catch (error) {
    console.error('Error sending warning to staff:', error);
    throw error;
  }
};

// Get notifications for a user
const getUserNotifications = async (userId, page = 1, limit = 20) => {
  try {
    const skip = (page - 1) * limit;
    
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({
        where: { userId }
      })
    ]);

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
    
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

// Mark notification as read
const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId
      },
      data: {
        isRead: true
      }
    });

    return notification;
    
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read for a user
const markAllNotificationsAsRead = async (userId) => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    return result;
    
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Get unread notification count for a user
const getUnreadNotificationCount = async (userId) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });

    return count;
    
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    throw error;
  }
};

module.exports = {
  sendWarningToStaff,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount
};
