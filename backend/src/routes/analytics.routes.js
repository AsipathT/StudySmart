const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analytics.controller');
const { protect, authorize } = require('../middleware/auth');

// Student dashboard (students can access their own)
router.get('/student/:studentId', protect, AnalyticsController.getStudentDashboard);

// User analytics (authenticated user only) - uses uploaded marks
router.get('/user', protect, AnalyticsController.getUserAnalytics);

// Subject analytics (teachers/admins only)
router.get('/subject/:subject', protect, authorize('teacher', 'admin'), AnalyticsController.getSubjectAnalytics);

// Class summary (teachers/admins only)
router.get('/class/summary', protect, authorize('teacher', 'admin'), AnalyticsController.getClassSummary);

// Analytics overview (teachers/admins only)
router.get('/overview', protect, authorize('teacher', 'admin'), AnalyticsController.getAnalyticsOverview);

// Export analytics report (teachers/admins only)
router.get('/export', protect, authorize('teacher', 'admin'), AnalyticsController.exportAnalyticsReport);

module.exports = router;