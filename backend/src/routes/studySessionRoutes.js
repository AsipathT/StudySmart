const express = require('express');
const router = express.Router();
const {
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  saveSession,
  getAllHistory,
  getHistory,
  getStats,
} = require('../controllers/studySessionController');

// Routes for study session timer
router.post('/start', startTimer);
router.post('/pause', pauseTimer);
router.post('/resume', resumeTimer);
router.post('/stop', stopTimer);

// Route for saving a study session
router.post('/save', saveSession);

const { verifyToken, isAdmin } = require('../middleware/auth');

// Routes for study session history and statistics
router.get('/history/:userId', verifyToken, getHistory);
router.get('/stats/:userId', verifyToken, getStats);
router.get('/admin/history', verifyToken, isAdmin, getAllHistory);

module.exports = router;
