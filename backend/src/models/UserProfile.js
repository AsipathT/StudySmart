// backend/models/UserProfile.js (PostgreSQL)
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const UserProfile = sequelize.define('UserProfile', {
  userId: {
    type: DataTypes.UUID,
    primaryKey: true
  },
  studentNumber: DataTypes.STRING,
  program: DataTypes.STRING,
  year: DataTypes.INTEGER,
  semester: DataTypes.INTEGER,
  studyHoursPerDay: DataTypes.FLOAT,
  preferredStudyTime: DataTypes.STRING,
  learningStyle: DataTypes.STRING,
  goals: DataTypes.TEXT,
  subjects: DataTypes.JSONB
});

// backend/models/StudySession.js
const StudySession = sequelize.define('StudySession', {
  userId: DataTypes.UUID,
  subject: DataTypes.STRING,
  date: DataTypes.DATE,
  hoursStudied: DataTypes.FLOAT,
  topics: DataTypes.JSONB,
  productivity: DataTypes.INTEGER,
  notes: DataTypes.TEXT
});

// backend/models/QuizScore.js
const QuizScore = sequelize.define('QuizScore', {
  userId: DataTypes.UUID,
  subject: DataTypes.STRING,
  type: DataTypes.STRING,
  date: DataTypes.DATE,
  score: DataTypes.FLOAT,
  maxScore: DataTypes.FLOAT,
  feedback: DataTypes.TEXT,
  fileUrl: DataTypes.STRING
});