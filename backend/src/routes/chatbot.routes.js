const express = require('express');
const router = express.Router();
const ChatbotController = require('../controllers/chatbot.controller');
const { protect } = require('../middleware/auth');

// Send message to chatbot
router.post('/message', protect, ChatbotController.sendMessage);

// Get conversation history
router.get('/history', protect, ChatbotController.getConversationHistory);

// Clear history
router.delete('/history', protect, ChatbotController.clearHistory);

// Get suggested questions
router.get('/suggestions', ChatbotController.getSuggestedQuestions);

module.exports = router;