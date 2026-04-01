const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const QuizController = require('../controllers/quizController');

// Generate Quiz from PDF
router.post('/generate', verifyToken, QuizController.generateFromPDF);

// Get Quizzes for a Subject
router.get('/subject/:subjectId', verifyToken, QuizController.getQuizzes);

// Submit Quiz Attempt
router.post('/submit', verifyToken, QuizController.submitAttempt);

// Get User's Result History
router.get('/history', verifyToken, QuizController.getUserAttempts);

module.exports = router;
