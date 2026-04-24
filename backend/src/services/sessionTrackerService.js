const mongoose = require('mongoose');
const SessionTrackerSession = require('../models/SessionTrackerSession');

// Service to get study session history for a user with optional filters
const getHistory = async (userId, filters = {}) => {
  const query = { userId };
  if (filters.subject) query.subject = filters.subject;
  if (filters.unitName) query.unitName = filters.unitName;
  if (filters.startDate && filters.endDate) {
    query.startTime = { $gte: new Date(filters.startDate), $lte: new Date(filters.endDate) };
  }
  return await SessionTrackerSession.find(query).sort({ startTime: -1 });
};

// Service to get all study session history (Admin)
const getAllHistory = async (filters = {}) => {
  const query = {};
  if (filters.subject) query.subject = filters.subject;
  if (filters.unitName) query.unitName = filters.unitName;
  if (filters.userId) query.userId = filters.userId;
  return await SessionTrackerSession.find(query).populate('userId', 'name email').sort({ startTime: -1 });
};

// Service to get study statistics for a user
const getStats = async (userId) => {
  const stats = await SessionTrackerSession.aggregate([
    {
      $match: { userId: new mongoose.Types.ObjectId(userId) },
    },
    {
      $group: {
        _id: null,
        totalStudyTime: { $sum: '$duration' },
        totalSessions: { $sum: 1 },
        averageSessionDuration: { $avg: '$duration' },
      },
    },
  ]);

  return stats[0] || { totalStudyTime: 0, totalSessions: 0, averageSessionDuration: 0 };
};

module.exports = {
  getHistory,
  getAllHistory,
  getStats,
};
