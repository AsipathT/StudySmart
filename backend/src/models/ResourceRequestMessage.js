const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const ResourceRequestMessage = sequelize.define('ResourceRequestMessage', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  requestId: { type: DataTypes.UUID, allowNull: false },
  senderName: { type: DataTypes.STRING, allowNull: false },
  senderRole: { type: DataTypes.ENUM('student', 'admin'), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: true },
  attachmentUrl: { type: DataTypes.STRING, allowNull: true },
  attachmentName: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'resource_request_messages',
  timestamps: true,
  underscored: true
});

module.exports = ResourceRequestMessage;
