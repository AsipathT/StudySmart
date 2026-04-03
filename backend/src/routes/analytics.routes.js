const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analytics.controller');
const { protect, authorize } = require('../middleware/auth');

// ── SPECIFIC routes FIRST (before any :param routes) ──────────────────────────

// Export routes — must be before /student/:studentId and /subject/:subject
// or Express will match "export" as a :studentId / :subject param value
router.get('/export/csv', protect, (req, res) => AnalyticsController.exportCsv(req, res));
router.get('/export/pdf', protect, (req, res) => AnalyticsController.exportPdf(req, res));
router.get('/export',     protect, authorize('teacher', 'admin'), (req, res) => AnalyticsController.exportAnalyticsReport(req, res));

// Admin dashboard
router.get('/admin/dashboard', protect, authorize('admin'), (req, res) => AnalyticsController.getAdminDashboard(req, res));

// Other specific paths
router.get('/user',          protect, (req, res) => AnalyticsController.getUserAnalytics(req, res));
router.get('/overview',      protect, authorize('teacher', 'admin'), (req, res) => AnalyticsController.getAnalyticsOverview(req, res));
router.get('/class/summary', protect, authorize('teacher', 'admin'), (req, res) => AnalyticsController.getClassSummary(req, res));

// ── PARAMETERIZED routes LAST ─────────────────────────────────────────────────
router.get('/subject/:subject',   protect, authorize('teacher', 'admin'), (req, res) => AnalyticsController.getSubjectAnalytics(req, res));
router.get('/student/:studentId', protect, (req, res) => AnalyticsController.getStudentDashboard(req, res));

module.exports = router;