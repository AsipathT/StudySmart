const mongoose = require('mongoose');

const sessionTrackerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
  },
  quizScore: {
    type: Number,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
  },
  duration: {
    type: Number, // duration in seconds
  },
  pomodoroMode: {
    type: Boolean,
    default: false,
  },
  intervals: {
    type: Number,
    default: 0,
  },
  unitName: {
    type: String,
  },
  materialName: {
    type: String,
  },
  workedTime: {
    type: Number, // duration in seconds
  },
  pagesCompleted: {
    type: Number,
    default: 0,
  },
  totalPages: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

const SessionTrackerSession = mongoose.model('SessionTrackerSession', sessionTrackerSchema);

module.exports = SessionTrackerSession;
