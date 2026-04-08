const express = require('express');
const multer = require('multer');
const path = require('path');
const controller = require('../controllers/resourceLibrary.controller');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const url = String(req.originalUrl || '').split('?')[0];
    if (url.includes('/modules')) {
      return cb(null, path.join(__dirname, '../uploads/resource-library/modules'));
    }
    if (/\/requests\/[^/]+\/messages$/.test(url)) {
      return cb(null, path.join(__dirname, '../uploads/resource-library/request-chat'));
    }
    if (/\/resource-library\/requests$/.test(url)) {
      return cb(null, path.join(__dirname, '../uploads/resource-library/requests'));
    }
    return cb(null, path.join(__dirname, '../uploads/resource-library/resources'));
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname.replace(/\s+/g, '_')}`);
  }
});
const upload = multer({ storage });

router.get('/notifications', controller.getNotifications);
router.post('/notifications/read-all', controller.markAllNotificationsRead);
router.post('/notifications/:id/read', controller.markNotificationRead);

router.get('/overview', controller.getOverview);
router.get('/top-quality', controller.getTopQualityResources);
router.get('/top-contributors', controller.getTopContributors);
router.get('/programmes', controller.getProgrammes);
router.post('/programmes', controller.createProgramme);
router.put('/programmes/:id', controller.updateProgramme);
router.delete('/programmes/:id', controller.deleteProgramme);
router.get('/modules', controller.getModules);
router.post('/modules', upload.single('moduleImage'), controller.createModule);
router.put('/modules/:id', upload.single('moduleImage'), controller.updateModule);
router.delete('/modules/:id', controller.deleteModule);
router.get('/resources', controller.getResources);
router.get('/resources/:id', controller.getResourceById);
router.get('/resources/:id/content', controller.getResourceContent);
router.put('/resources/:id/content', controller.updateResourceContent);
router.post('/flashcards/generate', controller.generateFlashcards);
router.put('/resources/:id/attachment', upload.single('resourceFile'), controller.replaceResourceAttachment);
router.put('/resources/:id', controller.updateResource);
router.delete('/resources/:id', controller.deleteResource);
router.post('/resources/upload', upload.single('resourceFile'), controller.uploadResource);
router.post('/resources/:id/view', controller.recordView);
router.post('/resources/:id/download', controller.recordDownload);
router.post('/resources/:id/rating', controller.submitRating);
router.post('/resources/:id/comments', controller.addComment);
router.get('/requests', controller.getRequests);
router.get('/requests/:id', controller.getRequestById);
router.post('/requests', upload.single('evidenceFile'), controller.createRequest);
router.put('/requests/:id/status', controller.updateRequestStatus);
router.get('/requests/:id/messages', controller.getRequestMessages);
router.post('/requests/:id/messages', upload.single('attachment'), controller.addRequestMessage);
router.put('/requests/:id/messages/:messageId', controller.updateRequestMessage);
router.delete('/requests/:id/messages/:messageId', controller.deleteRequestMessage);

module.exports = router;
