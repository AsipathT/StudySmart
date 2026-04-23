const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const ResourceLibraryNotificationRead = sequelize.define(
  'ResourceLibraryNotificationRead',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    notificationId: { type: DataTypes.UUID, allowNull: false },
    readerKey: { type: DataTypes.STRING, allowNull: false }
  },
  {
    tableName: 'resource_library_notification_reads',
    timestamps: true,
    underscored: true,
    updatedAt: false,
    indexes: [{ unique: true, fields: ['notification_id', 'reader_key'] }]
  }
);

module.exports = ResourceLibraryNotificationRead;
