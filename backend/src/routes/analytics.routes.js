const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analytics.controller');
const { protect, authorize } = require('../middleware/auth');

// Student dashboard (students can access their own)
router.get('/student/:studentId', protect, AnalyticsController.getStudentDashboard);

// Subject analytics (teachers/admins only)
router.get('/subject/:subject', protect, authorize('teacher', 'admin'), AnalyticsController.getSubjectAnalytics);

// Class summary (teachers/admins only)
router.get('/class/summary', protect, authorize('teacher', 'admin'), AnalyticsController.getClassSummary);

module.exports = router;