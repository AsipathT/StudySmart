const mongoose = require('mongoose');
const quizScoreSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studentId: { type: String }, // legacy string ID fallback
  subject: { type: String, required: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  type: { type: String, required: true, default: 'quiz' },
  date: { type: Date, default: Date.now },
  sourceFile: String,
  grade: String,
  status: String,
  extractedData: { type: mongoose.Schema.Types.Mixed, default: {} },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
module.exports = mongoose.model('QuizScore', quizScoreSchema);
