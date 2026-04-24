const mongoose = require('mongoose');
const extractedDataSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileType: String,
  filePath: String,
  status: { type: String, default: 'pending' },
  recordCount: { type: Number, default: 0 },
  extractedRecords: { type: mongoose.Schema.Types.Mixed, default: {} },
  normalizedRecords: { type: mongoose.Schema.Types.Mixed, default: [] },
  validationErrors: { type: mongoose.Schema.Types.Mixed, default: [] },
  processedAt: Date,
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  uploadedBy: String,
}, { timestamps: true });
module.exports = mongoose.model('ExtractedData', extractedDataSchema);
