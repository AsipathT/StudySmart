const FriendRequest = require("../models/FriendRequest");
const User = require("../models/User");

// @desc    Send friend request
// @route   POST /api/friends/request/:userId
// @access  Private
exports.sendFriendRequest = async (req, res) => {
  try {
    const toUserId = req.params.userId;
    const fromUserId = req.user.id;

    if (fromUserId === toUserId) {
      return res.status(400).json({ message: "You cannot send a friend request to yourself" });
    }

    // Check if target user exists
    const toUser = await User.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if request already exists (in either direction)
    const existing = await FriendRequest.findOne({
      $or: [
        { from: fromUserId, to: toUserId },
        { from: toUserId, to: fromUserId },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(400).json({ message: "You are already friends with this user" });
      }
      if (existing.status === "pending") {
        return res.status(400).json({ message: "A friend request already exists between you and this user" });
      }
      // If rejected, allow re-sending by updating
      if (existing.status === "rejected") {
        existing.from = fromUserId;
        existing.to = toUserId;
        existing.status = "pending";
        await existing.save();
        return res.status(200).json({ message: "Friend request sent", friendRequest: existing });
      }
    }

    const friendRequest = await FriendRequest.create({
      from: fromUserId,
      to: toUserId,
    });

    res.status(201).json({ message: "Friend request sent", friendRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept friend request
// @route   PUT /api/friends/accept/:requestId
// @access  Private
exports.acceptFriendRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (request.to.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only accept requests sent to you" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: `Request already ${request.status}` });
    }

    request.status = "accepted";
    await request.save();

    res.status(200).json({ message: "Friend request accepted", friendRequest: request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject friend request
// @route   PUT /api/friends/reject/:requestId
// @access  Private
exports.rejectFriendRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (request.to.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only reject requests sent to you" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: `Request already ${request.status}` });
    }

    request.status = "rejected";
    await request.save();

    res.status(200).json({ message: "Friend request rejected", friendRequest: request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my friends list (accepted requests)
// @route   GET /api/friends
// @access  Private
exports.getMyFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    const accepted = await FriendRequest.find({
      status: "accepted",
      $or: [{ from: userId }, { to: userId }],
    })
      .populate("from", "name email degree year subjects availableTime")
      .populate("to", "name email degree year subjects availableTime")
      .sort({ updatedAt: -1 });

    // Extract the friend (the other user)
    const friends = accepted.map((r) => {
      const friend = r.from._id.toString() === userId ? r.to : r.from;
      return { ...friend.toObject(), friendRequestId: r._id };
    });

    res.status(200).json({ count: friends.length, friends });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending friend requests (received)
// @route   GET /api/friends/pending
// @access  Private
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      to: req.user.id,
      status: "pending",
    })
      .populate("from", "name email degree year subjects availableTime")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get sent friend requests
// @route   GET /api/friends/sent
// @access  Private
exports.getSentRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      from: req.user.id,
      status: "pending",
    })
      .populate("to", "name email degree year subjects availableTime")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove friend (unfriend)
// @route   DELETE /api/friends/:requestId
// @access  Private
exports.removeFriend = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ message: "Friend relationship not found" });
    }

    const userId = req.user.id;
    if (request.from.toString() !== userId && request.to.toString() !== userId) {
      return res.status(403).json({ message: "You can only remove your own friends" });
    }

    await FriendRequest.findByIdAndDelete(req.params.requestId);
    res.status(200).json({ message: "Friend removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all friend request statuses for current user (for UI badges)
// @route   GET /api/friends/status
// @access  Private
exports.getFriendStatuses = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await FriendRequest.find({
      $or: [{ from: userId }, { to: userId }],
    }).select("from to status");

    // Build a map: otherUserId -> { status, requestId, direction }
    const statusMap = {};
    requests.forEach((r) => {
      const otherId = r.from.toString() === userId ? r.to.toString() : r.from.toString();
      statusMap[otherId] = {
        status: r.status,
        requestId: r._id,
        direction: r.from.toString() === userId ? "sent" : "received",
      };
    });

    res.status(200).json({ statusMap });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
