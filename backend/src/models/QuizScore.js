const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const QuizScore = sequelize.define('QuizScore', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Students',
      key: 'id'
    }
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 100
    }
  },
  type: {
    type: DataTypes.ENUM('quiz', 'midterm', 'final', 'assignment'),
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  sourceFile: {
    type: DataTypes.STRING
  },
  extractedData: {
    type: DataTypes.JSONB
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['student_id', 'subject']
    },
    {
      fields: ['date']
    }
  ]
});

module.exports = QuizScore;