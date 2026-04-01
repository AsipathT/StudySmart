const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const UploadController = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth');

// Upload file (PDF/CSV)
router.post('/upload', protect, upload.single('file'), UploadController.uploadFile);

// Get extraction status
router.get('/extraction/:extractionId', protect, UploadController.getExtractionStatus);

module.exports = router;