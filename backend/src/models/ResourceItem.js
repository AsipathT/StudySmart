const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const ResourceItem = sequelize.define('ResourceItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  programmeId: { type: DataTypes.UUID, allowNull: true },
  moduleId: { type: DataTypes.UUID, allowNull: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.ENUM('PPT', 'NOTES', 'PDF', 'FLASHCARDS', 'VIDEO'), allowNull: false },
  authorName: { type: DataTypes.STRING, allowNull: false },
  downloads: { type: DataTypes.INTEGER, defaultValue: 0 },
  fileUrl: { type: DataTypes.STRING, allowNull: true },
  fileName: { type: DataTypes.STRING, allowNull: true },
  fileMime: { type: DataTypes.STRING, allowNull: true },
  fileSize: { type: DataTypes.INTEGER, allowNull: true },
  tags: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
  rating: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 3 },
  difficulty: { type: DataTypes.ENUM('Easy', 'Medium', 'Hard'), allowNull: true, defaultValue: 'Medium' },
  views: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 }
}, {
  tableName: 'resource_items',
  timestamps: true,
  underscored: true
});

module.exports = ResourceItem;
