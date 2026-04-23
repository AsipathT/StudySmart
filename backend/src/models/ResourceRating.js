const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const ResourceRating = sequelize.define('ResourceRating', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  resourceId: { type: DataTypes.UUID, allowNull: false },
  userName: { type: DataTypes.STRING, allowNull: false },
  stars: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  difficulty: { type: DataTypes.ENUM('Easy', 'Medium', 'Hard'), allowNull: false }
}, {
  tableName: 'resource_ratings',
  timestamps: true,
  underscored: true
});

module.exports = ResourceRating;
