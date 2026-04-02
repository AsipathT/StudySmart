const mongoose = require('mongoose');

const extractedDataSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  studentNumber: { type: String, trim: true, index: true },
  subject: { type: String, trim: true },
  score: { type: Number, default: 0 },
  grade: { type: String, trim: true },
  status: { type: String, trim: true },
  branch: { type: String, trim: true },
  date: { type: Date, default: Date.now },
  uploadedBy: { type: String, trim: true },
  sourceFile: { type: String, trim: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true,
  collection: 'extracteddatas'
});

module.exports = mongoose.model('ExtractedData', extractedDataSchema);
