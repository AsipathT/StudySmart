const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const ResourceModule = sequelize.define('ResourceModule', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  programmeId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  imageUrl: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'resource_modules',
  timestamps: true,
  underscored: true
});

module.exports = ResourceModule;
