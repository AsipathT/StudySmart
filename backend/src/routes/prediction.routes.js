const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/prediction.controller');
const { protect } = require('../middleware/auth');

// Get user's subjects with marks
router.get( '/user/subjects',  protect, controller.getUserSubjects);

// Get student subjects
router.get( '/subjects',  protect, controller.getStudentSubjects);

// Generate prediction for a subject
router.post('/generate',  protect, controller.generatePrediction);

// Get prediction history
router.get( '/history',   protect, controller.getPredictionHistory);

// Get prediction by subject
router.get( '/:subject',  protect, controller.getPredictionBySubject);

module.exports = router;
