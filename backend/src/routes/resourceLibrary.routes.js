const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const controller = require('../controllers/resourceLibrary.controller');

const router = express.Router();

// Multer's diskStorage only auto-creates a string destination. We use a function, so ensure the
// target directory exists before returning it, otherwise writes fail with ENOENT (surfaces as HTTP 500).
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const url = String(req.originalUrl || '').split('?')[0];
    let dest;
    if (url.includes('/modules')) {
      dest = path.join(__dirname, '../uploads/resource-library/modules');
    } else if (/\/requests\/[^/]+\/messages$/.test(url)) {
      dest = path.join(__dirname, '../uploads/resource-library/request-chat');
    } else if (/\/resource-library\/requests$/.test(url)) {
      dest = path.join(__dirname, '../uploads/resource-library/requests');
    } else {
      dest = path.join(__dirname, '../uploads/resource-library/resources');
    }
    try {
      fs.mkdirSync(dest, { recursive: true });
    } catch (e) {
      return cb(e);
    }
    return cb(null, dest);
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
