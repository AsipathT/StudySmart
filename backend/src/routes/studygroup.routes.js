const express = require("express");
const router = express.Router();
const StudyGroup = require("../models/StudyGroup");

// Create group
router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      subject,
      creator,
      maxMembers,
      selectedDays,
      startTime,
      endTime,
      building,
      hall,
      image,
    } = req.body;

    if (
      !name ||
      !subject ||
      !selectedDays?.length ||
      !startTime ||
      !endTime ||
      !building ||
      !hall
    ) {
      return res.status(400).json({
        message:
          "Name, subject, selected days, start time, end time, building and hall are required",
      });
    }

    const newGroup = new StudyGroup({
      name,
      description: description || "",
      subject,
      creator: creator || null,
      members: creator ? [creator] : [],
      maxMembers: maxMembers || 5,
      selectedDays: selectedDays || [],
      startTime,
      endTime,
      building,
      hall,
      isActive: true,
      image: image || "",
    });

    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Failed to create group" });
  }
});

// Get all groups
router.get("/", async (req, res) => {
  try {
    const groups = await StudyGroup.find().sort({ createdAt: -1 });
    res.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ message: "Failed to fetch groups" });
  }
});

// Update group
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      description,
      subject,
      maxMembers,
      selectedDays,
      startTime,
      endTime,
      building,
      hall,
      image,
    } = req.body;

    const updatedGroup = await StudyGroup.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        subject,
        maxMembers,
        selectedDays,
        startTime,
        endTime,
        building,
        hall,
        image,
      },
      { new: true }
    );

    if (!updatedGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.json(updatedGroup);
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({ message: "Failed to update group" });
  }
});

// Delete group
router.delete("/:id", async (req, res) => {
  try {
    const deletedGroup = await StudyGroup.findByIdAndDelete(req.params.id);

    if (!deletedGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ message: "Failed to delete group" });
  }
});

// Join group
router.put("/:id/join", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const group = await StudyGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const alreadyJoined = group.members.some(
      (memberId) => String(memberId) === String(userId)
    );

    if (alreadyJoined) {
      return res.status(400).json({ message: "You already joined this group" });
    }

    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ message: "Group is full" });
    }

    group.members.push(userId);
    await group.save();

    res.json({ message: "Joined group successfully", group });
  } catch (error) {
    console.error("Error joining group:", error);
    res.status(500).json({ message: "Failed to join group" });
  }
});

// Leave group
router.put("/:id/leave", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const group = await StudyGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const originalLength = group.members.length;

    group.members = group.members.filter(
      (memberId) => String(memberId) !== String(userId)
    );

    if (group.members.length === originalLength) {
      return res.status(400).json({ message: "You are not in this group" });
    }

    await group.save();

    res.json({ message: "Left group successfully", group });
  } catch (error) {
    console.error("Error leaving group:", error);
    res.status(500).json({ message: "Failed to leave group" });
  }
});
module.exports = router;