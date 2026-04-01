const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const StudySession = require('../models/StudySession');
const QuizScore = require('../models/QuizScore');
const Prediction = require('../models/Prediction');
const PredictionService = require('../services/prediction.service');

const PredictionController = {
  /**
   * Generate prediction for a user and subject
   * POST /api/predictions/generate
   */
  async generatePrediction(req, res) {
    try {
      const { subject } = req.body;
      const userId = req.user?.id || 'demo-user-id'; // In real app, from auth middleware

      if (!subject) {
        return res.status(400).json({
          success: false,
          message: 'Subject is required'
        });
      }

      console.log(`Generating prediction for user ${userId}, subject: ${subject}`);

      // 1️⃣ Fetch study sessions for this user and subject
      const studySessions = await StudySession.find({ userId, subject });
      const totalStudyHours = studySessions.reduce((sum, session) => sum + session.hoursStudied, 0);

      // 2️⃣ Fetch quiz scores for this user and subject
      const quizScores = await QuizScore.find({ userId, subject });
      const quizScoreValues = quizScores.map(score => score.score);

      // 3️⃣ Check if we have enough data
      if (!PredictionService.hasEnoughData(totalStudyHours, quizScoreValues)) {
        return res.status(400).json({
          success: false,
          message: 'Not enough data. Please add study sessions or quiz scores first.',
          minimumRequired: 'At least 1 study session or 1 quiz score'
        });
      }

      // 4️⃣ Generate prediction using our service
      const predictionResult = PredictionService.generatePrediction(
        totalStudyHours,
        quizScoreValues
      );

      // 5️⃣ Save prediction to database
      const savedPrediction = await Prediction.findOneAndUpdate(
        { userId, subject },
        {
          userId,
          subject,
          predictedScore: predictionResult.predictedScore,
          confidence: predictionResult.confidence,
          recommendedHours: predictionResult.recommendedHours,
          dataPointsUsed: predictionResult.dataPointsUsed
        },
        { upsert: true, new: true }
      );

      // 6️⃣ Return response
      res.status(200).json({
        success: true,
        message: 'Prediction generated successfully',
        data: {
          predictionId: savedPrediction._id,
          ...predictionResult,
          metadata: {
            studySessionsCount: studySessions.length,
            totalStudyHours,
            quizScoresCount: quizScores.length,
            generatedAt: new Date().toISOString()
          }
        }
      });

    } catch (error) {
      console.error('Prediction generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate prediction',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Get prediction history for a user
   * GET /api/predictions/history
   */
  async getPredictionHistory(req, res) {
    try {
      const userId = req.user?.id || 'demo-user-id';
      const predictions = await Prediction.find({ userId }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: predictions,
        count: predictions.length
      });
    } catch (error) {
      console.error('Get prediction history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch prediction history'
      });
    }
  },

  /**
   * Get specific prediction by subject
   * GET /api/predictions/:subject
   */
  async getPredictionBySubject(req, res) {
    try {
      const { subject } = req.params;
      const userId = req.user?.id || 'demo-user-id';

      const prediction = await Prediction.findOne({ userId, subject });

      if (!prediction) {
        return res.status(404).json({
          success: false,
          message: 'No prediction found for this subject'
        });
      }

      res.status(200).json({
        success: true,
        data: prediction
      });
    } catch (error) {
      console.error('Get prediction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch prediction'
      });
    }
  }
};

module.exports = PredictionController;