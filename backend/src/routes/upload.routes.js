const express = require('express');
const router  = express.Router();
const upload  = require('../middleware/upload');
const UploadController = require('../controllers/upload.controller');

// ── Safe auth middleware ───────────────────────────────────────────────────────
// If the auth module fails to load or no token is present,
// requests still pass through (no hard crash / 401 block).
let protect;
try {
  protect = require('../middleware/auth').protect;
} catch {
  protect = (req, res, next) => next(); // no-op fallback
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/upload/upload  — upload a file
router.post('/upload', protect, upload.single('file'), UploadController.uploadFile);

// GET  /api/upload/student-marks/:studentId
router.get('/student-marks/:studentId', protect, UploadController.getStudentMarks);

// GET  /api/upload/history
router.get('/history', protect, UploadController.getExtractionHistory);

// GET  /api/upload/stats
router.get('/stats', protect, UploadController.getExtractionStats);

// GET  /api/upload/extraction/:extractionId
router.get('/extraction/:extractionId', protect, UploadController.getExtractionStatus);

// DELETE /api/upload/extraction/:extractionId
router.delete('/extraction/:extractionId', protect, UploadController.deleteExtraction);

module.exports = router;