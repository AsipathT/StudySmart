const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// Get current user's profile
router.get('/', profileController.getProfile);

// Update profile
router.put('/', profileController.updateProfile);

// Add subject
router.post('/subject', profileController.addSubject);

// Remove subject
router.delete('/subject', profileController.removeSubject);

module.exports = router;
