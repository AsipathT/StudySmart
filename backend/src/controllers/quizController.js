const { Quiz, QuizAttempt } = require('../models/Quiz');
const quizService = require('../services/quizGeneratorService');
const Subject = require('../models/Subject');
const path = require('path');

class QuizController {
  /**
   * Select a PDF and generate a Quiz
   */
  async generateFromPDF(req, res) {
    const { subjectId, materialName, fileUrl } = req.body;
    try {
      let text = null;

      // Try MongoDB buffer first (reliable)
      if (subjectId && fileUrl) {
        try {
          const subject = await Subject.findById(subjectId);
          if (subject) {
            let mat = null;
            for (const unit of subject.units) {
              mat = unit.materials.find(m => m.fileUrl === fileUrl);
              if (mat) break;
            }
            if (!mat) mat = subject.materials.find(m => m.fileUrl === fileUrl);
            if (mat?.fileData) {
              text = await quizService.extractTextFromBuffer(mat.fileData);
            }
          }
        } catch (e) {
          console.warn('[Quiz] MongoDB buffer lookup failed:', e.message);
        }
      }

      // Fallback: try disk file
      if (!text) {
        text = await quizService.extractTextFromPDF(fileUrl);
      }
      const generated = await quizService.generateQuiz(text, materialName);

      const newQuiz = new Quiz({
        title: generated.title || `Quiz for ${materialName}`,
        subjectId,
        materialName,
        questions: generated.questions,
        generatedBy: req.user?.id
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
   * Submit quiz attempt
   */
  async submitAttempt(req, res) {
    const { quizId, answers, score, totalQuestions } = req.body;
    try {
      const attempt = new QuizAttempt({
        quizId,
        userId: req.user?.id,
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
      const attempts = await QuizAttempt.find({ userId: req.user?.id })
        .populate({
          path: 'quizId',
          select: 'title materialName subjectId',
          populate: { path: 'subjectId', select: 'name color' }
        })
        .sort({ completedAt: -1 });
      res.json({ success: true, data: attempts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new QuizController();
