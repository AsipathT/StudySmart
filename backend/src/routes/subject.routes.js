const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Route to get all subjects
router.get('/', protect, subjectController.getAllSubjects);

// Route to get a specific subject by ID
router.get('/:id', protect, subjectController.getSubjectById);

// Admin Routes
router.post('/', protect, authorize('admin'), subjectController.createSubject);
router.put('/:id', protect, authorize('admin'), subjectController.updateSubject);
router.delete('/:id', protect, authorize('admin'), subjectController.deleteSubject);
router.post('/:id/modules', protect, authorize('admin'), subjectController.createModule);
router.post('/:id/students', protect, authorize('admin'), subjectController.addStudent);
router.post('/:id/materials', protect, authorize('admin'), upload.single('file'), subjectController.uploadMaterial);
router.patch('/:id/materials/:materialId/pages', protect, authorize('admin'), subjectController.updateMaterialPages);

module.exports = router;
