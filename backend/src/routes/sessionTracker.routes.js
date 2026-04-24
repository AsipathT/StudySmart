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
} = require('../controllers/sessionTrackerController');
const { protect, authorize } = require('../middleware/auth');

// Routes for study session timer
router.post('/start', startTimer);
router.post('/pause', pauseTimer);
router.post('/resume', resumeTimer);
router.post('/stop', stopTimer);

// Route for saving a study session
router.post('/save', protect, saveSession);

// Routes for study session history and statistics
router.get('/history/:userId', protect, getHistory);
router.get('/stats/:userId', protect, getStats);
router.get('/admin/history', protect, authorize('admin'), getAllHistory);

module.exports = router;
