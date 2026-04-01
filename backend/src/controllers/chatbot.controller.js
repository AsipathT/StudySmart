const ChatbotService = require('../services/chatbot.service');
const AnalyticsService = require('../services/analytics.service');
const { Student } = require('../models/postgres');
const PredictionService = require('../services/prediction.service');

class ChatbotController {
  /**
   * Send message to chatbot
   */
  async sendMessage(req, res) {
    try {
      const { message } = req.body;
      const studentId = req.user?.studentId || req.body.studentId;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_MESSAGE', message: 'Message is required' }
        });
      }

      // Get student context for personalized responses
      let context = {};
      if (studentId) {
        const analytics = await AnalyticsService.calculatePerformanceAnalytics(studentId);
        const student = await Student.findByPk(studentId);
        
        context = {
          studentId,
          name: student?.name,
          averageScore: analytics?.statistics?.average,
          subjects: analytics?.byType ? Object.keys(analytics.byType) : [],
          totalStudyHours: 0 // You would fetch this from StudySessions
        };
      }

      // Get response from chatbot
      const response = await ChatbotService.processQuery(studentId || 'anonymous', message, context);

      return res.json({
        success: true,
        data: {
          message: response,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Chatbot error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'CHATBOT_ERROR', message: error.message }
      });
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(req, res) {
    try {
      const studentId = req.user?.studentId;
      
      if (!studentId) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_STUDENT', message: 'Student ID required' }
        });
      }

      // Note: In production, you'd store conversations in database
      // For now, we'll return empty array
      return res.json({
        success: true,
        data: {
          conversations: []
        }
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'HISTORY_ERROR', message: error.message }
      });
    }
  }

  /**
   * Clear conversation history
   */
  async clearHistory(req, res) {
    try {
      const studentId = req.user?.studentId;
      
      if (studentId) {
        // Clear conversation from service (in production, from DB)
        ChatbotService.conversations.delete(studentId);
      }

      return res.json({
        success: true,
        message: 'Conversation history cleared'
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'CLEAR_ERROR', message: error.message }
      });
    }
  }

  /**
   * Get suggested questions
   */
  async getSuggestedQuestions(req, res) {
    const suggestions = [
      "How can I improve my study habits?",
      "What's my predicted score in Database Systems?",
      "How many hours should I study per day?",
      "Tips for exam preparation",
      "How to manage study stress?",
      "What subjects should I focus on?",
      "How does the prediction algorithm work?",
      "Study techniques for memorization"
    ];

    return res.json({
      success: true,
      data: {
        suggestions
      }
    });
  }
}

module.exports = new ChatbotController();