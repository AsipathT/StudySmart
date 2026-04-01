const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const ExtractedData = sequelize.define('ExtractedData', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileType: {
    type: DataTypes.ENUM('pdf', 'csv'),
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  extractedRecords: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  normalizedRecords: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  validationErrors: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  processedBy: {
    type: DataTypes.UUID,
    references: {
      model: 'Students',
      key: 'id'
    }
  },
  processedAt: DataTypes.DATE
}, {
  timestamps: true
});

module.exports = ExtractedData;