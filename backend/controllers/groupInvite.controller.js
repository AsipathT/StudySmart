const GroupInvite = require("../models/GroupInvite");
const StudyGroup = require("../models/StudyGroup");
const FriendRequest = require("../models/FriendRequest");
const User = require("../models/User");

// @desc    Send group invite to a friend
// @route   POST /api/group-invites/send
// @access  Private
exports.sendGroupInvite = async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const fromUserId = req.user.id;

    if (!groupId || !userId) {
      return res.status(400).json({ message: "Group ID and User ID are required" });
    }

    // Check group exists
    const group = await StudyGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Study group not found" });
    }

    // Check sender is a member of the group
    const isMember = group.members.some((m) => m.toString() === fromUserId);
    if (!isMember) {
      return res.status(403).json({ message: "You must be a member of this group to send invites" });
    }

    // Check target is not already a member
    const alreadyMember = group.members.some((m) => m.toString() === userId);
    if (alreadyMember) {
      return res.status(400).json({ message: "This user is already a member of the group" });
    }

    // Check group is not full
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ message: "Group is full" });
    }

    // Check they are friends
    const friendship = await FriendRequest.findOne({
      status: "accepted",
      $or: [
        { from: fromUserId, to: userId },
        { from: userId, to: fromUserId },
      ],
    });
    if (!friendship) {
      return res.status(400).json({ message: "You can only invite friends to your groups" });
    }

    // Check if invite already exists
    const existing = await GroupInvite.findOne({ group: groupId, to: userId });
    if (existing) {
      if (existing.status === "pending") {
        return res.status(400).json({ message: "An invite is already pending for this user" });
      }
      // If rejected/accepted before, allow re-invite
      existing.from = fromUserId;
      existing.status = "pending";
      await existing.save();
      return res.status(200).json({ message: "Group invite sent", invite: existing });
    }

    const invite = await GroupInvite.create({
      group: groupId,
      from: fromUserId,
      to: userId,
    });

    res.status(201).json({ message: "Group invite sent", invite });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept group invite
// @route   PUT /api/group-invites/accept/:inviteId
// @access  Private
exports.acceptGroupInvite = async (req, res) => {
  try {
    const invite = await GroupInvite.findById(req.params.inviteId);
    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }

    if (invite.to.toString() !== req.user.id) {
      return res.status(403).json({ message: "This invite is not for you" });
    }

    if (invite.status !== "pending") {
      return res.status(400).json({ message: `Invite already ${invite.status}` });
    }

    // Add user to group
    const group = await StudyGroup.findById(invite.group);
    if (!group) {
      return res.status(404).json({ message: "Group no longer exists" });
    }

    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ message: "Group is now full" });
    }

    group.members.push(req.user.id);
    await group.save();

    // Add group to user's studyGroups
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { studyGroups: group._id },
    });

    invite.status = "accepted";
    await invite.save();

    res.status(200).json({ message: "You have joined the group!", invite });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject group invite
// @route   PUT /api/group-invites/reject/:inviteId
// @access  Private
exports.rejectGroupInvite = async (req, res) => {
  try {
    const invite = await GroupInvite.findById(req.params.inviteId);
    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }

    if (invite.to.toString() !== req.user.id) {
      return res.status(403).json({ message: "This invite is not for you" });
    }

    if (invite.status !== "pending") {
      return res.status(400).json({ message: `Invite already ${invite.status}` });
    }

    invite.status = "rejected";
    await invite.save();

    res.status(200).json({ message: "Invite rejected", invite });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my pending group invites (received)
// @route   GET /api/group-invites/pending
// @access  Private
exports.getMyGroupInvites = async (req, res) => {
  try {
    const invites = await GroupInvite.find({
      to: req.user.id,
      status: "pending",
    })
      .populate("group", "name subject description maxMembers members meetingTime")
      .populate("from", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: invites.length, invites });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get sent group invites for a specific group
// @route   GET /api/group-invites/sent/:groupId
// @access  Private
exports.getSentGroupInvites = async (req, res) => {
  try {
    const invites = await GroupInvite.find({
      group: req.params.groupId,
      from: req.user.id,
    })
      .populate("to", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: invites.length, invites });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
