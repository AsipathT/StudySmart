const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const ResourceProgramme = sequelize.define('ResourceProgramme', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true }
}, {
  tableName: 'resource_programmes',
  timestamps: true,
  underscored: true
});

module.exports = ResourceProgramme;
