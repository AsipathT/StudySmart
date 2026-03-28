const express          = require('express');
const router           = express.Router();
const { protect }      = require('../middleware/auth');
const upload           = require('../middleware/upload');
const ProfileController= require('../controllers/profile.controller');

// ── Every route below requires a valid JWT ────────────────────────────────────
router.use(protect);

// ── Core profile ──────────────────────────────────────────────────────────────
router.get ('/',  ProfileController.getProfile);    // GET  /api/profile
router.put ('/',  ProfileController.updateProfile); // PUT  /api/profile

// ── Avatar ────────────────────────────────────────────────────────────────────
router.post('/avatar',
  upload.avatarUpload.single('avatar'),
  ProfileController.updateAvatar                   // POST /api/profile/avatar
);

// ── Security ──────────────────────────────────────────────────────────────────
router.post('/change-password', ProfileController.changePassword); // POST /api/profile/change-password

// ── Activity & Achievements ───────────────────────────────────────────────────
router.get('/activity',     ProfileController.getRecentActivity); // GET /api/profile/activity
router.get('/achievements', ProfileController.getAchievements);  // GET /api/profile/achievements

// ── Study stats ───────────────────────────────────────────────────────────────
router.get('/study-stats',  ProfileController.getStudyStats);    // GET /api/profile/study-stats

// ── Settings ──────────────────────────────────────────────────────────────────
router.put('/notifications', ProfileController.updateNotificationSettings); // PUT /api/profile/notifications
router.put('/privacy',       ProfileController.updatePrivacySettings);      // PUT /api/profile/privacy

// ── Social account linking ────────────────────────────────────────────────────
router.post  ('/link/:provider', ProfileController.linkSocialAccount);   // POST   /api/profile/link/:provider
router.delete('/link/:provider', ProfileController.unlinkSocialAccount); // DELETE /api/profile/link/:provider

// ── Export & Delete account ───────────────────────────────────────────────────
router.get   ('/export',  ProfileController.exportProfile);  // GET    /api/profile/export
router.delete('/account', ProfileController.deleteAccount);  // DELETE /api/profile/account

module.exports = router;