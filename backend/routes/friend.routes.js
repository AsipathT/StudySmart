const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");

const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getMyFriends,
  getPendingRequests,
  getSentRequests,
  removeFriend,
  getFriendStatuses,
} = require("../controllers/friend.controller");

// All routes require authentication
router.get("/", authMiddleware, getMyFriends);
router.get("/pending", authMiddleware, getPendingRequests);
router.get("/sent", authMiddleware, getSentRequests);
router.get("/status", authMiddleware, getFriendStatuses);
router.post("/request/:userId", authMiddleware, sendFriendRequest);
router.put("/accept/:requestId", authMiddleware, acceptFriendRequest);
router.put("/reject/:requestId", authMiddleware, rejectFriendRequest);
router.delete("/:requestId", authMiddleware, removeFriend);

module.exports = router;
