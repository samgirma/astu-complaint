const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/auth');
const { checkComplaintWarnings, triggerStudentDisputeWarning, getWarningStatistics } = require('../services/warningService');
const { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadNotificationCount } = require('../utils/notificationService');

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication middleware
router.use(authenticateToken);

// POST /api/warnings/student-dispute - Trigger warning when student disputes resolution
router.post('/student-dispute', async (req, res) => {
  try {
    const { complaintId } = req.body;
    
    if (!complaintId) {
      return res.status(400).json({
        success: false,
        message: 'Complaint ID is required'
      });
    }

    // Check if user is the student who filed the complaint
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      select: { studentId: true }
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (complaint.studentId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the student who filed the complaint can dispute the resolution'
      });
    }

    await triggerStudentDisputeWarning(complaintId);

    res.status(200).json({
      success: true,
      message: 'Dispute warning sent to staff'
    });
    
  } catch (error) {
    console.error('Error triggering student dispute:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger dispute warning',
      error: error.message
    });
  }
});

// GET /api/warnings/statistics - Get warning statistics (admin only)
router.get('/statistics', checkRole('ADMIN'), async (req, res) => {
  try {
    const statistics = await getWarningStatistics();
    
    res.status(200).json({
      success: true,
      message: 'Warning statistics retrieved successfully',
      data: statistics
    });
    
  } catch (error) {
    console.error('Error getting warning statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get warning statistics',
      error: error.message
    });
  }
});

// POST /api/warnings/check - Manually trigger warning check (admin only)
router.post('/check', checkRole('ADMIN'), async (req, res) => {
  try {
    await checkComplaintWarnings();
    
    res.status(200).json({
      success: true,
      message: 'Warning check completed successfully'
    });
    
  } catch (error) {
    console.error('Error running warning check:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run warning check',
      error: error.message
    });
  }
});

// GET /api/notifications - Get user notifications
router.get('/notifications', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await getUserNotifications(req.user.id, page, limit);
    
    res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: result
    });
    
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications',
      error: error.message
    });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    await markNotificationAsRead(id, req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
    
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/notifications/read-all', async (req, res) => {
  try {
    const result = await markAllNotificationsAsRead(req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: { count: result.count }
    });
    
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

// GET /api/notifications/unread-count - Get unread notification count
router.get('/notifications/unread-count', async (req, res) => {
  try {
    const count = await getUnreadNotificationCount(req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Unread notification count retrieved',
      data: { count }
    });
    
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread notification count',
      error: error.message
    });
  }
});

module.exports = router;
