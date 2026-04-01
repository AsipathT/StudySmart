const { QuizScore, Student, StudySession } = require('../models');
const PredictionService = require('../services/prediction.service');
const { Op } = require('sequelize');

// ── Helper: find postgres student by mongo user ───────────────────────────────
async function findStudent(mongoUser) {
  if (!mongoUser) return null;
  try {
    let s = null;
    if (mongoUser.studentId) {
      s = await Student.findOne({ where: { studentNumber: mongoUser.studentId } });
    }
    if (!s && mongoUser.email) {
      s = await Student.findOne({ where: { email: mongoUser.email } });
    }
    return s;
  } catch (e) {
    console.warn('findStudent (non-fatal):', e.message);
    return null;
  }
}

// ── Find QuizScore records using all possible ID fields ─────────────────────
async function findQuizScores(mongoUser, whereExtra = {}) {
  const student = await findStudent(mongoUser);

  // Build a list of possible userId/studentId values to search by
  const possibleIds = new Set();
  if (student?.id)           possibleIds.add(student.id);
  if (mongoUser?.id)         possibleIds.add(mongoUser.id);
  if (mongoUser?._id)        possibleIds.add(String(mongoUser._id));
  if (mongoUser?.studentId)  possibleIds.add(mongoUser.studentId);
  if (mongoUser?.email)      possibleIds.add(mongoUser.email);

  // Try studentId (PG FK) first, then userId (string field)
  if (student?.id) {
    const rows = await QuizScore.findAll({
      where: { studentId: student.id, ...whereExtra },
      order: [['date', 'ASC']],
    });
    if (rows.length > 0) return rows;
  }

  // Fallback: search by userId string field
  for (const id of possibleIds) {
    try {
      const rows = await QuizScore.findAll({
        where: { userId: id, ...whereExtra },
        order: [['date', 'ASC']],
      });
      if (rows.length > 0) return rows;
    } catch (_) {}
  }
  return [];
}

const PredictionController = {

  // GET /api/predictions/subjects
  async getStudentSubjects(req, res) {
    try {
      const mongoUser = req.user;
      const allScores = await findQuizScores(mongoUser);
      const subjects  = [...new Set(allScores.map(r => r.subject).filter(Boolean))];
      return res.json({ success: true, data: subjects });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // POST /api/predictions/generate
  async generatePrediction(req, res) {
    try {
      const { subject, marksData, scores } = req.body;
      const mongoUser   = req.user;

      if (!subject) {
        return res.status(400).json({ success: false, message: 'Subject is required' });
      }

      // ── Try to get quiz scores from backend first ──────────────────────
      let quizScores = await findQuizScores(mongoUser, { subject });
      let quizScoreValues = quizScores.map(q => parseFloat(q.score));

      // ── If no backend data but frontend provides marks data, use it ──────
      if (quizScoreValues.length === 0 && scores && scores.length > 0) {
        quizScoreValues = scores.map(s => parseFloat(s)).filter(s => !isNaN(s) && s > 0);
      }

      // ── Fetch study sessions (if any) ─────────────────────────────────────
      let studySessions = [];
      try {
        studySessions = await StudySession.findAll({
          where: { userId: mongoUser.id || mongoUser._id?.toString() || '', subject },
        });
      } catch (_) {}

      const totalStudyHours  = studySessions.reduce((s, ss) => s + parseFloat(ss.hoursStudied || 0), 0);

      if (quizScoreValues.length === 0 && totalStudyHours === 0) {
        return res.status(400).json({
          success: false,
          message: `No marks data found for "${subject}". Please upload your marks file first.`,
        });
      }

      // ── Generate prediction ───────────────────────────────────────────────
      const result = PredictionService.generatePrediction(totalStudyHours, quizScoreValues);

      // Enrich with real data context
      const avgScore    = quizScoreValues.length
        ? quizScoreValues.reduce((a, b) => a + b, 0) / quizScoreValues.length : 0;
      const latestScore = quizScoreValues.length
        ? quizScoreValues[quizScoreValues.length - 1] : 0;
      const highest     = quizScoreValues.length ? Math.max(...quizScoreValues) : 0;
      const lowest      = quizScoreValues.length ? Math.min(...quizScoreValues) : 0;

      // Grade from latest/avg score
      const gradeOf = s => {
        if (s >= 85) return 'A+'; if (s >= 75) return 'A';
        if (s >= 70) return 'B+'; if (s >= 65) return 'B';
        if (s >= 60) return 'C+'; if (s >= 55) return 'C';
        if (s >= 50) return 'D';  return 'F';
      };

      // ── Optionally persist to MongoDB ─────────────────────────────────────
      let savedId = `temp-${Date.now()}`;
      try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 1) {
          const Prediction = require('../models/Prediction');
          const saved = await Prediction.findOneAndUpdate(
            { userId: mongoUser.id, subject },
            {
              userId:           mongoUser.id,
              subject,
              predictedScore:   result.predictedScore,
              confidence:       result.confidence,
              recommendedHours: result.recommendedHours,
              dataPointsUsed:   result.dataPointsUsed,
            },
            { upsert: true, new: true }
          );
          savedId = saved._id;
        }
      } catch (_) {}

      return res.json({
        success: true,
        message: 'Prediction generated successfully',
        data: {
          predictionId:     savedId,
          subject,
          ...result,
          currentStats: {
            averageScore:    parseFloat(avgScore.toFixed(1)),
            latestScore:     parseFloat(latestScore.toFixed(1)),
            highestScore:    highest,
            lowestScore:     lowest,
            totalAssessments: quizScoreValues.length,
            currentGrade:    gradeOf(avgScore),
            predictedGrade:  gradeOf(result.predictedScore),
            passStatus:      avgScore >= 50 ? 'Pass' : 'Fail',
          },
          metadata: {
            studySessionsCount: studySessions.length,
            totalStudyHours,
            quizScoresCount:    quizScoreValues.length,
            generatedAt:        new Date().toISOString(),
          },
        },
      });
    } catch (err) {
      console.error('Prediction error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/predictions/history
  async getPredictionHistory(req, res) {
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        return res.json({ success: true, data: [] });
      }
      const Prediction = require('../models/Prediction');
      const userId     = req.user?.id;
      const predictions = await Prediction.find({ userId }).sort({ updatedAt: -1 });
      return res.json({ success: true, data: predictions, count: predictions.length });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/predictions/:subject
  async getPredictionBySubject(req, res) {
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        return res.status(404).json({ success: false, message: 'No prediction found' });
      }
      const Prediction = require('../models/Prediction');
      const { subject } = req.params;
      const userId      = req.user?.id;
      const prediction  = await Prediction.findOne({ userId, subject });
      if (!prediction) {
        return res.status(404).json({ success: false, message: 'No prediction found for this subject' });
      }
      return res.json({ success: true, data: prediction });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = PredictionController;