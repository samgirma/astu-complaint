const { prisma } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

// Get user notifications
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  const skip = (page - 1) * limit;
  const userId = req.user.id;

  let whereClause = { userId };

  if (unreadOnly === 'true') {
    whereClause.isRead = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } })
  ]);

  res.status(200).json({
    success: true,
    data: {
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      unreadCount
    }
  });
});

// Mark notification as read
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const notification = await prisma.notification.findFirst({
    where: {
      id,
      userId
    }
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  await prisma.notification.update({
    where: { id },
    data: { isRead: true }
  });

  res.status(200).json({
    success: true,
    message: 'Notification marked as read'
  });
});

// Mark all notifications as read
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: { isRead: true }
  });

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// Delete notification
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const notification = await prisma.notification.findFirst({
    where: {
      id,
      userId
    }
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  await prisma.notification.delete({
    where: { id }
  });

  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

// Get unread notification count
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const unreadCount = await prisma.notification.count({
    where: {
      userId,
      isRead: false
    }
  });

  res.status(200).json({
    success: true,
    data: { unreadCount }
  });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};
