const { Quiz, QuizAttempt } = require('../models/Quiz');
const QuizService = require('../services/quizService');
const Subject = require('../models/Subject');

class QuizController {
  /**
   * Select a PDF and generate a Quiz
   */
  async generateFromPDF(req, res) {
    const { subjectId, materialName, fileUrl } = req.body;
    try {
      const text = await QuizService.extractTextFromPDF(fileUrl);
      const generated = await QuizService.generateQuiz(text, materialName);
      
      const newQuiz = new Quiz({
        title: generated.title || `Quiz for ${materialName}`,
        subjectId,
        materialName,
        questions: generated.questions,
        generatedBy: req.user?._id
      });
      
      await newQuiz.save();
      res.status(201).json({ success: true, data: newQuiz });
    } catch (error) {
      console.error('Quiz generation failed:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get Quizzes for a subject
   */
  async getQuizzes(req, res) {
    try {
      const { subjectId } = req.params;
      const quizzes = await Quiz.find({ subjectId }).sort({ createdAt: -1 });
      res.json({ success: true, data: quizzes });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Submit Audit attempt
   */
  async submitAttempt(req, res) {
    const { quizId, answers, score, totalQuestions } = req.body;
    try {
      const attempt = new QuizAttempt({
        quizId,
        userId: req.user?._id,
        score,
        totalQuestions,
        answers
      });
      await attempt.save();
      res.status(201).json({ success: true, data: attempt });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get student's previous attempts
   */
  async getUserAttempts(req, res) {
    try {
      const attempts = await QuizAttempt.find({ userId: req.user?._id })
        .populate('quizId', 'title materialName')
        .sort({ completedAt: -1 });
      res.json({ success: true, data: attempts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new QuizController();
