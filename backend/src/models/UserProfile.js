const mongoose = require('mongoose');
const userProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  studentNumber: String,
  program: String,
  year: Number,
  semester: Number,
  studyHoursPerDay: Number,
  preferredStudyTime: String,
  learningStyle: String,
  goals: String,
  subjects: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });
module.exports = mongoose.model('UserProfile', userProfileSchema);
