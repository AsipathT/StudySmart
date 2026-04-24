const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const ResourceLibraryNotification = sequelize.define(
  'ResourceLibraryNotification',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    kind: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    resourceId: { type: DataTypes.UUID, allowNull: true },
    requestId: { type: DataTypes.UUID, allowNull: true },
    resourceTitle: { type: DataTypes.STRING, allowNull: false },
    actorName: { type: DataTypes.STRING, allowNull: false },
    detail: { type: DataTypes.TEXT, allowNull: true }
  },
  {
    tableName: 'resource_library_notifications',
    timestamps: true,
    underscored: true
  }
);

module.exports = ResourceLibraryNotification;
