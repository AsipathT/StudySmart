const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const QuizController = require('../controllers/quizController');

// Generate Quiz from PDF
router.post('/generate', protect, QuizController.generateFromPDF);

// Get Quizzes for a Subject
router.get('/subject/:subjectId', protect, QuizController.getQuizzes);

// Submit Quiz Attempt
router.post('/submit', protect, QuizController.submitAttempt);

// Get User's Result History
router.get('/history', protect, QuizController.getUserAttempts);

module.exports = router;
