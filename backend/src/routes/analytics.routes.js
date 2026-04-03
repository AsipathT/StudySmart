const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analytics.controller');
const { protect, authorize } = require('../middleware/auth');

// ── SPECIFIC routes FIRST (before any :param routes) ──────────────────────────

// Export routes — must be before /student/:studentId and /subject/:subject
// or Express will match "export" as a :studentId / :subject param value
router.get('/export/csv', protect, AnalyticsController.exportCsv);
router.get('/export/pdf', protect, AnalyticsController.exportPdf);
router.get('/export',     protect, authorize('teacher', 'admin'), AnalyticsController.exportAnalyticsReport);

// Other specific paths
router.get('/user',          protect, AnalyticsController.getUserAnalytics);
router.get('/overview',      protect, authorize('teacher', 'admin'), AnalyticsController.getAnalyticsOverview);
router.get('/class/summary', protect, authorize('teacher', 'admin'), AnalyticsController.getClassSummary);

// ── PARAMETERIZED routes LAST ─────────────────────────────────────────────────
router.get('/subject/:subject',   protect, authorize('teacher', 'admin'), AnalyticsController.getSubjectAnalytics);
router.get('/student/:studentId', protect, AnalyticsController.getStudentDashboard);

module.exports = router;