const ChatbotService  = require('../services/chatbot.service');
const AnalyticsService = require('../services/analytics.service');
const { Student } = require('../models/postgres');
const PredictionService = require('../services/prediction.service');

class ChatbotController {

  /* ─────────────────────────────────────────────────────
     POST /api/chatbot/message
     Body: { message, studentId?, context?, history? }
  ───────────────────────────────────────────────────── */
  async sendMessage(req, res) {
    try {
      const { message, context: clientContext = {}, history = [] } = req.body;
      const studentId = req.user?.studentId || req.user?.id || req.body.studentId;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_MESSAGE', message: 'Message is required' },
        });
      }

      // ── Build rich context from analytics ───────────
      let context = { ...clientContext };

      if (studentId) {
        try {
          const [analytics, student] = await Promise.all([
            AnalyticsService.calculatePerformanceAnalytics(studentId),
            Student.findByPk(studentId),
          ]);

          const avg = analytics?.statistics?.average
            || analytics?.averageScore
            || clientContext?.averageScore
            || 0;

          const gpa = clientContext?.gpa
            || Math.max(0, ((avg - 40) / 60) * 4.0).toFixed(2);

          const riskLevel = clientContext?.riskLevel
            || (avg >= 75 ? 'LOW' : avg < 50 ? 'HIGH' : 'MEDIUM');

          // Extract per-subject breakdown if available
          const subjectBreakdown = [];
          const weakSubjects     = [];
          const strongSubjects   = [];

          if (analytics?.bySubject) {
            Object.entries(analytics.bySubject).forEach(([subj, data]) => {
              const score = typeof data === 'object' ? (data.average || data.score || 0) : data;
              subjectBreakdown.push({ name: subj, score: Number(score).toFixed(1) });
              if (score < 50)  weakSubjects.push(subj);
              if (score >= 75) strongSubjects.push(subj);
            });
          }

          // Assignment completion
          const completedAssignments = analytics?.completedAssignments
            || clientContext?.completedAssignments
            || null;
          const totalAssignments = analytics?.totalAssignments
            || clientContext?.totalAssignments
            || null;

          // Predicted grade (if your prediction service provides it)
          let predictedGrade = analytics?.predictedGrade || null;
          if (!predictedGrade && avg > 0) {
            const predicted = Math.min(100, avg + (riskLevel === 'LOW' ? 3 : riskLevel === 'MEDIUM' ? -2 : -8));
            predictedGrade = `~${predicted.toFixed(1)}%`;
          }

          context = {
            studentId,
            name:                 student?.name || clientContext?.studentName || 'Student',
            averageScore:         avg,
            gpa,
            riskLevel,
            attendance:           analytics?.attendance
                                  || analytics?.attendanceRate
                                  || clientContext?.attendance
                                  || null,
            completedAssignments,
            totalAssignments,
            predictedGrade,
            subjects:             analytics?.subjects
                                  || (analytics?.bySubject ? Object.keys(analytics.bySubject) : [])
                                  || clientContext?.subjects
                                  || [],
            subjectBreakdown,
            weakSubjects,
            strongSubjects,
            ...clientContext,   // allow client to override any field
          };
        } catch (err) {
          console.warn('Analytics fetch failed, using client context:', err.message);
          // Merge whatever the client sent
          context = {
            studentId,
            name: clientContext?.studentName || 'Student',
            ...clientContext,
          };
        }
      }

      // ── Call AI service ──────────────────────────────
      const response = await ChatbotService.processQuery(
        studentId || 'anonymous',
        message,
        context,
        history,   // ← conversation history from client
      );

      return res.json({
        success: true,
        data: {
          message:   response,
          timestamp: new Date().toISOString(),
        },
      });

    } catch (error) {
      console.error('Chatbot sendMessage error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'CHATBOT_ERROR', message: error.message },
      });
    }
  }

  /* ─────────────────────────────────────────────────────
     POST /api/chatbot/performance
     Body: { studentName, gpa, attendance, completedAssignments,
             riskLevel, question, history? }
  ───────────────────────────────────────────────────── */
  async chatPerformance(req, res) {
    try {
      const {
        studentName, gpa, attendance, completedAssignments,
        riskLevel, question, history = [],
      } = req.body;

      if (!studentName || !question) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_DATA', message: 'studentName and question are required' },
        });
      }

      const reply = await ChatbotService.getPerformanceAdvice({
        studentName, gpa, attendance, completedAssignments,
        riskLevel, question, history,
      });

      return res.json({
        success: true,
        data: { reply, timestamp: new Date().toISOString() },
      });

    } catch (error) {
      console.error('chatPerformance error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'PERFORMANCE_CHAT_ERROR', message: error.message },
      });
    }
  }

  /* ─────────────────────────────────────────────────────
     GET /api/chatbot/history
  ───────────────────────────────────────────────────── */
  async getConversationHistory(req, res) {
    try {
      const studentId = req.user?.studentId || req.user?.id;
      if (!studentId) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_STUDENT', message: 'Student ID required' },
        });
      }
      // Return in-memory history (replace with DB query in production)
      const history = ChatbotService.conversations.get(String(studentId)) || [];
      return res.json({ success: true, data: { conversations: history } });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'HISTORY_ERROR', message: error.message },
      });
    }
  }

  /* ─────────────────────────────────────────────────────
     DELETE /api/chatbot/history
  ───────────────────────────────────────────────────── */
  async clearHistory(req, res) {
    try {
      const studentId = req.user?.studentId || req.user?.id;
      if (studentId) ChatbotService.conversations.delete(String(studentId));
      return res.json({ success: true, message: 'Conversation history cleared' });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'CLEAR_ERROR', message: error.message },
      });
    }
  }

  /* ─────────────────────────────────────────────────────
     GET /api/chatbot/suggestions
  ───────────────────────────────────────────────────── */
  async getSuggestedQuestions(req, res) {
    return res.json({
      success: true,
      data: {
        suggestions: [
          'Analyse my current performance',
          'What is my predicted grade?',
          'How can I improve my GPA?',
          'Which subjects need more focus?',
          'Create a study plan for me',
          'How many hours should I study per day?',
          'Tips for exam preparation',
          'How to manage study stress?',
        ],
      },
    });
  }
}

module.exports = new ChatbotController();