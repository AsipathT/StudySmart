const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    index: true
  },
  predictedScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  confidence: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low'
  },
  recommendedHours: {
    type: Number,
    default: 0
  },
  dataPointsUsed: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for userId and subject
predictionSchema.index({ userId: 1, subject: 1 }, { unique: true });

// Update updatedAt on save
predictionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Prediction', predictionSchema);