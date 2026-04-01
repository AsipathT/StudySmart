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
    type: DataTypes.STRING
  },
  filePath: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  },
  recordCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  extractedRecords: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  normalizedRecords: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  validationErrors: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  processedAt: {
    type: DataTypes.DATE
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  uploadedBy: {
    type: DataTypes.STRING
  }
}, {
  timestamps: true,
  tableName: 'extracted_data',
  underscored: true  // ✅ maps all camelCase to snake_case columns
});

module.exports = ExtractedData;