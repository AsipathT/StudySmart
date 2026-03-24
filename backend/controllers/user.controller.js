const User = require("../models/User");
const StudyGroup = require("../models/StudyGroup");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");


// @desc    Get all registered students (excluding current user)
// @route   GET /api/users/all
// @access  Private
exports.getAllStudents = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user.id },
      role: { $ne: "admin" },
    })
      .select("-password")
      .sort({ name: 1 });

    res.status(200).json({ count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Search users by subject
// @route   GET /api/users/search?subject=Math
// @access  Private

exports.searchUsersBySubject = async (req, res) => {
  try {
    const { subject } = req.query;

    if (!subject) {
      return res.status(400)
        .json({
          message: "Please provide a subject to search"
        });
    }

    // 1. Find users who have this subject in their profile
    const profileUsers = await User.find({
      subjects: { $regex: subject, $options: "i" },
      _id: { $ne: req.user.id },
    })
      .select("-password")
      .sort({ name: 1 });

    // 2. Find users who are members of study groups with this subject
    const matchingGroups = await StudyGroup.find({
      subject: { $regex: subject, $options: "i" },
    }).select("members");

    // Collect all member IDs from matching groups
    const groupMemberIds = new Set();
    matchingGroups.forEach(group => {
      group.members.forEach(memberId => {
        const id = memberId.toString();
        if (id !== req.user.id) {
          groupMemberIds.add(id);
        }
      });
    });

    // 3. Get user details for group members not already in profile results
    const profileUserIds = new Set(profileUsers.map(u => u._id.toString()));
    const additionalIds = [...groupMemberIds].filter(id => !profileUserIds.has(id));

    let groupUsers = [];
    if (additionalIds.length > 0) {
      groupUsers = await User.find({
        _id: { $in: additionalIds },
      })
        .select("-password")
        .sort({ name: 1 });
    }

    // 4. Combine both results (profile matches + group members)
    const users = [...profileUsers, ...groupUsers];

    res.status(200)
      .json({
        count: users.length,
        users,
      });
  } catch (error) {
    res.status(500)
      .json({
        message: error.message
      });
  }

};


// @desc Search users by subject and available time


exports.searchUsersByAvailability = async (req, res) => {

  try {
    const { subject, availableTime } = req.body;

    if (!subject) {
      return res.status(400)
        .json({
          message: "Please provide a subject"
        });
    }

    //Query for users with subject in their profile
    const query = {
      subjects: { $regex: subject, $options: "i" },
      _id: { $ne: req.user.id },
    };

    //Add available time filter - check individual days and times
    if (availableTime) {
      const daysSelected = [];
      const dayMap = {
        'monday': 'Monday',
        'tuesday': 'Tuesday',
        'wednesday': 'Wednesday',
        'thursday': 'Thursday',
        'friday': 'Friday',
        'saturday': 'Saturday',
        'sunday': 'Sunday'
      };

      Object.entries(dayMap).forEach(([key, value]) => {
        if (availableTime[key] === true) {
          daysSelected.push(value);
        }
      });

      if (daysSelected.length > 0) {
        query['availableTime'] = {
          $elemMatch: {
            day: { $in: daysSelected }
          }
        };
      }

      // Filter by time range if provided
      if (availableTime.startTime && availableTime.endTime) {
        if (!query['availableTime']) {
          query['availableTime'] = {
            $elemMatch: {}
          };
        }
        if (!query['availableTime'].$elemMatch) {
          query['availableTime'].$elemMatch = {};
        }
        query['availableTime'].$elemMatch.startTime = { $lte: availableTime.endTime };
        query['availableTime'].$elemMatch.endTime = { $gte: availableTime.startTime };
      }
    }

    const profileUsers = await User.find(query)
      .select("-password")
      .sort({ name: 1 });

    // Also find users who are members of study groups with this subject
    const matchingGroups = await StudyGroup.find({
      subject: { $regex: subject, $options: "i" },
    }).select("members");

    const groupMemberIds = new Set();
    matchingGroups.forEach(group => {
      group.members.forEach(memberId => {
        const id = memberId.toString();
        if (id !== req.user.id) {
          groupMemberIds.add(id);
        }
      });
    });

    // Get group members not already in profile results
    const profileUserIds = new Set(profileUsers.map(u => u._id.toString()));
    const additionalIds = [...groupMemberIds].filter(id => !profileUserIds.has(id));

    let groupUsers = [];
    if (additionalIds.length > 0) {
      // Don't apply availability filters to group members -
      // they are already relevant by being in a matching study group
      groupUsers = await User.find({
        _id: { $in: additionalIds },
      })
        .select("-password")
        .sort({ name: 1 });
    }

    const users = [...profileUsers, ...groupUsers];

    res.status(200)
      .json({
        count: users.length,
        users,
      });

  } catch (error) {
    res.status(500)
      .json({
        message: error.message
      });
  }

};


// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, degree, year, subjects, availableTime, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update basic fields
    if (name !== undefined) user.name = name.trim();
    if (degree !== undefined) user.degree = degree.trim();
    if (year !== undefined) user.year = year.toString().trim();
    if (subjects !== undefined) user.subjects = subjects;
    if (availableTime !== undefined) user.availableTime = availableTime;

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to set a new password" });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        degree: user.degree,
        year: user.year,
        subjects: user.subjects,
        availableTime: user.availableTime,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Upload profile image
// @route   POST /api/users/profile/upload-image
// @access  Private
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old profile image file if it exists
    if (user.profileImage) {
      const oldImagePath = path.join(__dirname, '..', user.profileImage.replace(/^\//, ''));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Store relative URL path
    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    user.profileImage = imageUrl;
    await user.save();

    res.status(200).json({
      message: "Profile image uploaded successfully",
      profileImage: imageUrl,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        degree: user.degree,
        year: user.year,
        subjects: user.subjects,
        availableTime: user.availableTime,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
