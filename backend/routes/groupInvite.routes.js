const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");

const {
  sendGroupInvite,
  acceptGroupInvite,
  rejectGroupInvite,
  getMyGroupInvites,
  getSentGroupInvites,
} = require("../controllers/groupInvite.controller");

// All routes require authentication
router.get("/pending", authMiddleware, getMyGroupInvites);
router.get("/sent/:groupId", authMiddleware, getSentGroupInvites);
router.post("/send", authMiddleware, sendGroupInvite);
router.put("/accept/:inviteId", authMiddleware, acceptGroupInvite);
router.put("/reject/:inviteId", authMiddleware, rejectGroupInvite);

module.exports = router;
