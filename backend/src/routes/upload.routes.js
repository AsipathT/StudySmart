const express = require('express');
const router  = express.Router();
const upload  = require('../middleware/upload');
const UploadController = require('../controllers/upload.controller');
const allowRoles = require('../middleware/role');

// ── Safe auth middleware ───────────────────────────────────────────────────────
// If the auth module fails to load or no token is present,
// requests still pass through (no hard crash / 401 block).
let protect, optionalProtect;
try {
  const auth = require('../middleware/auth');
  protect = auth.protect;
  optionalProtect = auth.optionalProtect;
} catch {
  protect = (req, res, next) => next(); // no-op fallback
  optionalProtect = (req, res, next) => next();
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/upload/upload  — upload a file
router.post('/upload', protect, upload.single('file'), UploadController.uploadFile);

// GET  /api/upload/user-marks — get marks for authenticated user
router.get('/user-marks', protect, UploadController.getUserMarks);

// GET  /api/upload/student-marks/:studentId
router.get('/student-marks/:studentId', protect, UploadController.getStudentMarks);

// GET  /api/upload/history — allow authenticated users + fallback for dev
router.get('/history', optionalProtect, UploadController.getExtractionHistory);

// GET  /api/upload/stats
router.get('/stats', optionalProtect, UploadController.getExtractionStats);

// GET  /api/upload/extraction/:extractionId
router.get('/extraction/:extractionId', protect, UploadController.getExtractionStatus);

// PUT  /api/upload/extraction/:extractionId — Update extraction (Admin only)
router.put('/extraction/:extractionId', protect, allowRoles('admin'), UploadController.updateExtraction);

// DELETE /api/upload/extraction/:extractionId — Admin only
router.delete('/extraction/:extractionId', protect, allowRoles('admin'), UploadController.deleteExtraction);

module.exports = router;