const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/prediction.controller');
const { protect } = require('../middleware/auth');

router.get( '/subjects',  protect, controller.getStudentSubjects);
router.post('/generate',  protect, controller.generatePrediction);
router.get( '/history',   protect, controller.getPredictionHistory);
router.get( '/:subject',  protect, controller.getPredictionBySubject);

module.exports = router;module.exports = router;
