const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const QuizScore = sequelize.define('QuizScore', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: true,  // Temporarily allow null for migration
    field: 'user_id'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: { min: 0, max: 100 }
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'quiz'
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  sourceFile: {
    type: DataTypes.STRING,
    field: 'source_file'
  },
  grade: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.STRING
  },
  extractedData: {
    type: DataTypes.JSONB,
    field: 'extracted_data',
    defaultValue: {}
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  tableName: 'quiz_scores',
  underscored: true,
  indexes: [
    { fields: ['user_id', 'subject'] },
    { fields: ['date'] }
  ]
});

module.exports = QuizScore;