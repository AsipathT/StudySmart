const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  durationMinutes: {
    type: Number,
    required: true,
    default: 60,
  },
  materials: [{
    name: String,
    fileUrl: String,
    totalPages: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now }
  }]
});

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  units: [unitSchema],
  icon: {
    type: String,
  },
  color: {
    type: String,
  },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  materials: [{
    name: String,
    fileUrl: String,
    totalPages: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now }
  }],
}, {
  timestamps: true,
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
