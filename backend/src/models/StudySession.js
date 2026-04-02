const mongoose = require('mongoose');
const studySessionSchema = new mongoose.Schema({
  userId: { type: String },
  subject: { type: String, required: true },
  hoursStudied: { type: Number, required: true },
  date: { type: Date, required: true },
  notes: String,
  sessionType: String,
}, { timestamps: true });
module.exports = mongoose.model('StudySession', studySessionSchema);
