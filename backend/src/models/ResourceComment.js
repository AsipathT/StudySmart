const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const ResourceComment = sequelize.define('ResourceComment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  resourceId: { type: DataTypes.UUID, allowNull: false },
  authorName: { type: DataTypes.STRING, allowNull: false },
  text: { type: DataTypes.TEXT, allowNull: false },
  parentId: { type: DataTypes.UUID, allowNull: true }
}, {
  tableName: 'resource_comments',
  timestamps: true,
  underscored: true
});

module.exports = ResourceComment;
