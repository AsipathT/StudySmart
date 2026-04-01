const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const StudySession = sequelize.define('StudySession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'user_id'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  hoursStudied: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'hours_studied'
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sessionType: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'session_type'
  }
}, {
  timestamps: true,
  tableName: 'study_sessions',
  underscored: true,
  indexes: [
    { fields: ['user_id', 'subject'] },
    { fields: ['date'] }
  ]
});

module.exports = StudySession;