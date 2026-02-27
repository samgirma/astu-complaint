const express = require('express');
const router = express.Router();

const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');
const {
  validateChatMessage,
  validatePagination
} = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Chat with AI
router.post(
  '/',
  validateChatMessage,
  chatController.chatWithAI
);

// Get chat history
router.get(
  '/history',
  validatePagination,
  chatController.getChatHistory
);

// Get AI suggestions for complaint creation
router.get(
  '/suggestions',
  chatController.getAISuggestions
);

// Get system status
router.get(
  '/status',
  chatController.getSystemStatus
);

module.exports = router;
