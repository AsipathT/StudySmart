const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const ResourceRequest = sequelize.define('ResourceRequest', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  requestedBy: { type: DataTypes.STRING, allowNull: false },
  programmeId: { type: DataTypes.UUID, allowNull: true },
  moduleId: { type: DataTypes.UUID, allowNull: true },
  programmeName: { type: DataTypes.STRING, allowNull: true },
  moduleName: { type: DataTypes.STRING, allowNull: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  details: { type: DataTypes.TEXT, allowNull: true },
  attachmentUrl: { type: DataTypes.STRING, allowNull: true },
  attachmentName: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.ENUM('in_progress', 'resolved'), defaultValue: 'in_progress' }
}, {
  tableName: 'resource_requests',
  timestamps: true,
  underscored: true
});

module.exports = ResourceRequest;
