const Profile = require('../models/Profile');
const User = require('../models/User');

// Get current user's profile
exports.getProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id }).populate('user', 'name email');
    
    if (!profile) {
      // Create a new profile if it doesn't exist
      profile = new Profile({ user: req.user.id });
      await profile.save();
      profile = await Profile.findById(profile._id).populate('user', 'name email');
    }
    
    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { profileImage, degree, year, semester, subjects, availableTime } = req.body;
    
    let profile = await Profile.findOne({ user: req.user.id });
    
    if (!profile) {
      profile = new Profile({ user: req.user.id });
    }
    
    // Update fields
    if (profileImage !== undefined) profile.profileImage = profileImage;
    if (degree !== undefined) profile.degree = degree;
    if (year !== undefined) profile.year = year;
    if (semester !== undefined) profile.semester = semester;
    if (subjects !== undefined) profile.subjects = subjects;
    if (availableTime !== undefined) profile.availableTime = availableTime;
    
    await profile.save();
    profile = await Profile.findById(profile._id).populate('user', 'name email');
    
    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add subject to profile
exports.addSubject = async (req, res) => {
  try {
    const { subject } = req.body;
    
    let profile = await Profile.findOne({ user: req.user.id });
    
    if (!profile) {
      profile = new Profile({ user: req.user.id });
    }
    
    if (!profile.subjects.includes(subject)) {
      profile.subjects.push(subject);
      await profile.save();
    }
    
    profile = await Profile.findById(profile._id).populate('user', 'name email');
    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove subject from profile
exports.removeSubject = async (req, res) => {
  try {
    const { subject } = req.body;
    
    let profile = await Profile.findOne({ user: req.user.id });
    
    if (profile) {
      profile.subjects = profile.subjects.filter(s => s !== subject);
      await profile.save();
      profile = await Profile.findById(profile._id).populate('user', 'name email');
    }
    
    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
