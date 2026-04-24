const mongoose = require('mongoose');
const studentSchema = new mongoose.Schema({
  studentNumber: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  email: String,
  program: String,
  year: Number,
  semester: Number,
  branch: String,
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
module.exports = mongoose.model('Student', studentSchema);
