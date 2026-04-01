const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Route to get all subjects
router.get('/', verifyToken, subjectController.getAllSubjects);

// Route to get a specific subject by ID
router.get('/:id', verifyToken, subjectController.getSubjectById);

// Admin Routes
router.post('/', verifyToken, isAdmin, subjectController.createSubject);
router.put('/:id', verifyToken, isAdmin, subjectController.updateSubject);
router.delete('/:id', verifyToken, isAdmin, subjectController.deleteSubject);
router.post('/:id/modules', verifyToken, isAdmin, subjectController.createModule);
router.post('/:id/students', verifyToken, isAdmin, subjectController.addStudent);
router.post('/:id/materials', verifyToken, isAdmin, upload.single('file'), subjectController.uploadMaterial);
router.patch('/:id/materials/:materialId/pages', verifyToken, isAdmin, subjectController.updateMaterialPages);

module.exports = router;
